import axios from 'axios';
import { authStorage } from './authStorage';
import { isSessionRejection } from './authErrors';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');

  // 1. Explicitly configured for relative proxy or left unset
  if (!envUrl || envUrl === '/api') return '/api';

  // 2. Production browser context (such as Vercel or custom domain):
  // When running in the browser on a remote host, always use the same-origin '/api'
  // proxy provided by vercel.json. This bypasses browser cross-origin CORS preflights
  // and guarantees First-Party cookie handling for HttpOnly refresh tokens.
  if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return '/api';
  }

  // 3. Fallback for custom or direct backend URLs during development
  let resolved = envUrl;
  if (!resolved.startsWith('http://') && !resolved.startsWith('https://') && !resolved.startsWith('/')) {
    resolved = `https://${resolved}`;
  }
  return resolved.endsWith('/api') ? resolved : `${resolved}/api`;
};

const baseURL = getBaseURL();

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({ baseURL, withCredentials: true, timeout: 30000 });
let refreshPromise = null;

const publicAuthEndpoints = [
  '/auth/config',
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/forgot-password',
  '/auth/verify-reset-token',
  '/auth/reset-password',
  '/auth/logout',
];

const isPublicAuthRequest = (url = '') =>
  publicAuthEndpoints.some((endpoint) => url.startsWith(endpoint));

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token && !isPublicAuthRequest(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestWasAuthenticated = Boolean(error.config?.headers?.Authorization);
    const canRefresh =
      error.response?.status === 401 &&
      requestWasAuthenticated &&
      !error.config?._sessionRetry;

    if (canRefresh) {
      error.config._sessionRetry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshClient.post('/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        }
        const refreshResponse = await refreshPromise;
        const { access_token: accessToken, user } = refreshResponse.data;
        authStorage.setToken(accessToken);
        authStorage.setUser(user);
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        // A cold start, timeout, or temporary 5xx must not destroy a valid
        // local session. Clear it only when the server definitively rejects
        // the refresh credential.
        if (isSessionRejection(refreshError)) {
          authStorage.clear();
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && requestWasAuthenticated) {
      authStorage.clear();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
