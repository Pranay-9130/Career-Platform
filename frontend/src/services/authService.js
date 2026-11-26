import api, { executeTokenRefresh, clearApiCache } from './api.js';
import { authStorage } from './authStorage.js';

let loginPromise = null;

export const authService = {
  getToken: () => authStorage.getToken(),

  setToken: (token, persistent = true) => authStorage.setToken(token, persistent),

  getUser: () => authStorage.getUser(),

  setUser: (user) => authStorage.setUser(user),

  clearAuth: () => {
    authStorage.clear();
    clearApiCache();
  },

  logout: async () => {
    // 1. Instantly wipe client-side auth credentials & cache with zero latency
    authStorage.clear();
    clearApiCache();

    // 2. Dispatch server-side session revocation with keepalive transport guarantee
    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const base = api.defaults.baseURL || '/api';
        const logoutUrl = base.endsWith('/') ? `${base}auth/logout` : `${base}/auth/logout`;
        await window
          .fetch(logoutUrl, {
            method: 'POST',
            credentials: 'include',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
          })
          .catch(() => api.post('/auth/logout'));
      } else {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Logout request completed with notice:', error);
    }
  },

  login: async (credentials, persistent = true) => {
    if (!loginPromise) {
      loginPromise = (async () => {
        // Keep authentication bounded independently from slower upload/data APIs.
        // A broken connection must not hold the login form for the global 30s timeout.
        const response = await api.post('/auth/login', credentials, { timeout: 12000 });
        const { access_token, user } = response.data;
        if (access_token && user) authStorage.setSession(access_token, user, persistent);
        return response.data;
      })().finally(() => {
        loginPromise = null;
      });
    }
    return loginPromise;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { access_token, user } = response.data;
    if (access_token && user) authStorage.setSession(access_token, user, true);
    return response.data;
  },

  refreshToken: async () => {
    const response = await executeTokenRefresh();
    const { access_token, user } = response.data;
    if (access_token && user) authStorage.setSession(access_token, user, true);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    if (response.data) {
      authService.setUser(response.data);
    }
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetOtp: async ({ email, otp }) => {
    const response = await api.post('/auth/verify-reset-otp', { email, otp });
    return response.data;
  },

  verifyResetToken: async ({ email, token }) => {
    const response = await api.post('/auth/verify-reset-token', { email, token });
    return response.data;
  },

  resetPassword: async ({ email, reset_token, token, new_password }) => {
    const effectiveToken = reset_token || token;
    const response = await api.post('/auth/reset-password', {
      email,
      reset_token: effectiveToken,
      token: effectiveToken,
      new_password,
    });
    return response.data;
  },
};

export default authService;
