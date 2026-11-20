import { create } from 'zustand';
import { User } from '../types';
import { appStorage } from '../utils/storage';
import { APP_CONFIG } from '../constants/config';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const storedToken = await appStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = await appStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        set({
          token: storedToken,
          user: parsedUser,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch (e) {
      console.warn('Auth initialization failed:', e);
    }
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  setAuth: async (user: User, token: string) => {
    await appStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
    await appStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  updateUser: async (updatedFields: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const merged = { ...currentUser, ...updatedFields };
    await appStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(merged));
    set({ user: merged });
  },

  logout: async () => {
    await appStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    await appStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

