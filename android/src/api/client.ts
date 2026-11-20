import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG } from '../constants/config';
import { appStorage } from '../utils/storage';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = useAuthStore.getState().token || (await appStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN));
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to attach auth token:', e);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Handle Global 401 Logout only on authenticated sessions
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const url = error.config?.url || '';
    const isPublicAuth =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/forgot-password');

    if (error.response?.status === 401 && !isPublicAuth) {
      // Clear expired session only for authenticated resource requests
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;

