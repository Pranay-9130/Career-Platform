import axios from 'axios';
import { authStorage } from './authStorage';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');
  if (!envUrl) return '/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
};

const baseURL = getBaseURL();

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({ baseURL, withCredentials: true });
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
      } catch {
        // Fall through to session cleanup.
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
