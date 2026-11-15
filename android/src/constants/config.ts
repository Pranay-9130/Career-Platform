import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_URL = 'https://careerplatform-api.onrender.com/api';

const getApiBaseUrl = (): string => {
  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraUrl && typeof extraUrl === 'string' && extraUrl.trim().length > 0) {
    return extraUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_API_URL;
};

export const APP_CONFIG = {
  NAME: 'AspirePath',
  TAGLINE: 'From your first project to your first job.',
  VERSION: '1.0.0',
  API_BASE_URL: getApiBaseUrl(),
  STORAGE_KEYS: {
    AUTH_TOKEN: 'aspirepath_auth_token',
    USER_DATA: 'aspirepath_user_data',
    ONBOARDING_COMPLETED: 'aspirepath_onboarding_done',
    THEME_MODE: 'aspirepath_theme_mode',
  },
};


