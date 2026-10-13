import api from './api';
import { authStorage } from './authStorage';

export const authService = {
  getToken: () => authStorage.getToken(),

  setToken: (token, persistent = true) => authStorage.setToken(token, persistent),

  getUser: () => authStorage.getUser(),

  setUser: (user) => authStorage.setUser(user),

  clearAuth: () => authStorage.clear(),

  logout: async () => {
    authStorage.clear();
    try {
      await api.post('/auth/logout');
    } finally {
      authStorage.clear();
    }
  },

  login: async (credentials, persistent = true) => {
    const response = await api.post('/auth/login', credentials);
    const { access_token, user } = response.data;
    if (access_token && user) authStorage.setSession(access_token, user, persistent);
    return response.data;
  },

  loginWithGoogle: async (credential, persistent = true) => {
    const response = await api.post('/auth/google', { credential });
    const { access_token, user } = response.data;
    if (access_token && user) authStorage.setSession(access_token, user, persistent);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
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

  verifyOtp: async ({ email, otp, purpose = 'registration' }) => {
    const response = await api.post('/auth/verify-otp', { email, otp, purpose });
    const { access_token, user } = response.data;
    if (access_token && user) authStorage.setSession(access_token, user, true);
    return response.data;
  },

  resendOtp: async ({ email, purpose = 'registration' }) => {
    const response = await api.post('/auth/resend-otp', { email, purpose });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetToken: async ({ email, token }) => {
    const response = await api.post('/auth/verify-reset-token', { email, token });
    return response.data;
  },

  resetPassword: async ({ email, token, new_password }) => {
    const response = await api.post('/auth/reset-password', {
      email,
      token,
      new_password,
    });
    return response.data;
  },
};

export default authService;
