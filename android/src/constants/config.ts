import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getLocalHost = () => {
  // In Expo Go or development on Android emulator, 10.0.2.2 connects to host machine's localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }
  return 'http://localhost:8000/api';
};

export const APP_CONFIG = {
  NAME: 'AspirePath',
  TAGLINE: 'From your first project to your first job.',
  VERSION: '1.0.0',
  API_BASE_URL: Constants.expoConfig?.extra?.apiUrl || getLocalHost(),
  STORAGE_KEYS: {
    AUTH_TOKEN: 'aspirepath_auth_token',
    USER_DATA: 'aspirepath_user_data',
    ONBOARDING_COMPLETED: 'aspirepath_onboarding_done',
    THEME_MODE: 'aspirepath_theme_mode',
  },
};

