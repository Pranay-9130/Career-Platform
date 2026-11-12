import axios from 'axios';
import { authStorage } from './authStorage.js';
import { isSessionRejection } from './authErrors.js';

const getBaseURL = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');

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

export const executeTokenRefresh = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshClient.post('/auth/refresh').finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// Response interceptor: handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isPublic = isPublicAuthRequest(error.config?.url);
    const requestWasAuthenticated = Boolean(error.config?.headers?.Authorization);
    const canRefresh =
      error.response?.status === 401 &&
      !isPublic &&
      !error.config?._sessionRetry;

    if (canRefresh) {
      error.config._sessionRetry = true;
      try {
        const refreshResponse = await executeTokenRefresh();
        const { access_token: accessToken, user } = refreshResponse.data;
        authStorage.setToken(accessToken);
        authStorage.setUser(user);
        error.config.headers = error.config.headers || {};
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

    if (error.response?.status === 401 && (requestWasAuthenticated || !isPublic)) {
      authStorage.clear();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// In-flight GET request deduplication to prevent redundant simultaneous API requests
const inFlightRequests = new Map();

// Short-lived in-memory response cache for safe read-only GET endpoints.
// Keys that benefit from client-side caching (TTL in ms):
const CACHEABLE_PREFIXES = {
  '/resumes/templates': 60_000,   // Resume templates rarely change
  '/jobs/facets': 60_000,         // Facets change only when jobs are added/edited
  '/admin/jobs': 15_000,          // Admin job list (search params included in key)
  '/admin/students': 15_000,      // Student list
  '/admin/stats': 30_000,         // Dashboard stats
  '/jobs': 20_000,                // Public job listing
  '/projects': 20_000,            // Public project listing
};

const responseCache = new Map(); // key -> { data, expiresAt }
const MAX_CACHE_ENTRIES = 100;

function cloneResponseData(payload) {
  if (payload === null || typeof payload !== 'object') return payload;
  try {
    return typeof structuredClone === 'function'
      ? structuredClone(payload)
      : JSON.parse(JSON.stringify(payload));
  } catch {
    return payload;
  }
}

function getCacheTTL(url = '') {
  for (const [prefix, ttl] of Object.entries(CACHEABLE_PREFIXES)) {
    if (url === prefix || url.startsWith(prefix + '?') || url.startsWith(prefix + '/')) {
      return ttl;
    }
  }
  return 0;
}

export function invalidateRelatedCache(method, url = '') {
  // On any mutating request, clear all cached entries that share the same resource root
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const root = url.split('/').slice(0, 3).join('/'); // e.g. /admin/jobs
    for (const key of responseCache.keys()) {
      if (root && key.startsWith(root)) responseCache.delete(key);
    }
    // Broadly invalidate jobs/facets when jobs or job applications change (updates has_applied)
    if (url.includes('/jobs') || url.includes('/applications')) {
      for (const key of responseCache.keys()) {
        if (
          key.includes('/jobs') ||
          key.includes('/facets') ||
          key.includes('/applications') ||
          key.includes('/users/dashboard-summary')
        ) {
          responseCache.delete(key);
        }
      }
    }
    if (url.includes('/projects')) {
      for (const key of responseCache.keys()) {
        if (key.includes('/projects')) responseCache.delete(key);
      }
    }
  }
}

export function clearApiCache() {
  responseCache.clear();
}

const originalRequest = api.request.bind(api);

api.request = function (config) {
  const normalizedConfig = typeof config === 'string' ? { url: config } : { ...config };
  const method = (normalizedConfig.method || 'get').toLowerCase();

  // For mutating requests: invalidate related cache entries upon completion
  if (method !== 'get' || normalizedConfig._skipDedupe) {
    const reqUrl = normalizedConfig.url || '';
    return originalRequest(normalizedConfig).then((res) => {
      invalidateRelatedCache(method, reqUrl);
      return res;
    });
  }

  const url = normalizedConfig.url || '';
  const params = normalizedConfig.params ? JSON.stringify(normalizedConfig.params) : '';
  const token = authStorage.getToken() || '';
  const dedupeKey = `${url}?${params}#${token}`;

  // Serve from short-lived cache if available and not expired
  if (!normalizedConfig._skipCache) {
    const cached = responseCache.get(dedupeKey);
    if (cached) {
      if (cached.expiresAt > Date.now()) {
        return Promise.resolve({
          ...cached.data,
          data: cloneResponseData(cached.data.data),
          _fromCache: true,
        });
      }
      responseCache.delete(dedupeKey);
    }
  }

  // Deduplicate in-flight requests
  if (inFlightRequests.has(dedupeKey)) {
    return inFlightRequests.get(dedupeKey);
  }

  const requestPromise = originalRequest(normalizedConfig).then((response) => {
    const ttl = getCacheTTL(url);
    if (ttl > 0 && response && response.status >= 200 && response.status < 300) {
      if (responseCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = responseCache.keys().next().value;
        if (oldestKey !== undefined) responseCache.delete(oldestKey);
      }
      responseCache.set(dedupeKey, { data: response, expiresAt: Date.now() + ttl });
    }
    return response;
  }).finally(() => {
    inFlightRequests.delete(dedupeKey);
  });

  inFlightRequests.set(dedupeKey, requestPromise);
  return requestPromise;
};

// Route Axios shorthand methods through the wrapped api.request so deduplication,
// caching, and mutation invalidation apply to api.get / api.post / etc.
['get', 'delete', 'head', 'options'].forEach((method) => {
  api[method] = (url, config = {}) => api.request({ ...config, method, url });
});
['post', 'put', 'patch'].forEach((method) => {
  api[method] = (url, data, config = {}) => api.request({ ...config, method, url, data });
});

export default api;
