import { create } from 'zustand';
import { Appearance } from 'react-native';
import { lightColors, darkColors, ThemeColors } from '../constants/theme';
import { appStorage } from '../utils/storage';
import { APP_CONFIG } from '../constants/config';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => Promise<void>;
  initializeTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  isDark: Appearance.getColorScheme() === 'dark',
  colors: Appearance.getColorScheme() === 'dark' ? darkColors : lightColors,

  initializeTheme: async () => {
    try {
      const savedMode = (await appStorage.getItem(APP_CONFIG.STORAGE_KEYS.THEME_MODE)) as ThemeMode | null;
      if (savedMode) {
        const isDark = savedMode === 'system' ? Appearance.getColorScheme() === 'dark' : savedMode === 'dark';
        set({
          mode: savedMode,
          isDark,
          colors: isDark ? darkColors : lightColors,
        });
      }
    } catch {
      // Default system
    }
  },

  setMode: async (mode: ThemeMode) => {
    const isDark = mode === 'system' ? Appearance.getColorScheme() === 'dark' : mode === 'dark';
    await appStorage.setItem(APP_CONFIG.STORAGE_KEYS.THEME_MODE, mode);
    set({
      mode,
      isDark,
      colors: isDark ? darkColors : lightColors,
    });
  },
}));
