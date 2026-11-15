import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG } from '../constants/config';
import { appStorage } from '../utils/storage';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 20000,
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

// Response Interceptor: Handle Global 401 Logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear expired session
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
