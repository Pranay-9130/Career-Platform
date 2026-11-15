import apiClient from './client';
import { User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
    // Backend accepts JSON or OAuth2 Form Data for /auth/login
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (payload: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
  }): Promise<{ access_token: string; user: User }> => {
    const res = await apiClient.post('/auth/register', payload);
    return res.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/users/me');
    return res.data;
  },

  updateProfile: async (profileData: any): Promise<User> => {
    const res = await apiClient.put('/users/me/profile', profileData);
    return res.data;
  },
};

