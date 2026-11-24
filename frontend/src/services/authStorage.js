const TOKEN_KEY = 'career_platform_token';
const USER_KEY = 'career_platform_user';
const SESSION_INDICATOR_KEY = 'career_platform_session_active';

const stores = () => [window.localStorage, window.sessionStorage];

const safely = (fallback, operation) => {
  try {
    return operation();
  } catch {
    return fallback;
  }
};

export const isTokenExpired = (token) => {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (!parsed.exp) return false;
    return parsed.exp * 1000 <= Date.now() + 5000;
  } catch {
    return true;
  }
};

export const authStorage = {
  getToken() {
    return safely(null, () =>
      stores().map((store) => store.getItem(TOKEN_KEY)).find(Boolean) || null
    );
  },

  getUser() {
    return safely(null, () => {
      const raw = stores().map((store) => store.getItem(USER_KEY)).find(Boolean);
      return raw ? JSON.parse(raw) : null;
    });
  },

  hasActiveSessionHint() {
    return safely(false, () => Boolean(window.localStorage.getItem(SESSION_INDICATOR_KEY)));
  },

  setSession(token, user, persistent = true) {
    safely(undefined, () => {
      const target = persistent ? window.localStorage : window.sessionStorage;
      const other = persistent ? window.sessionStorage : window.localStorage;
      other.removeItem(TOKEN_KEY);
      other.removeItem(USER_KEY);
      target.setItem(TOKEN_KEY, token);
      target.setItem(USER_KEY, JSON.stringify(user));
      window.localStorage.setItem(SESSION_INDICATOR_KEY, 'true');
    });
  },

  setToken(token, persistent = null) {
    safely(undefined, () => {
      const usePersistent = persistent ?? Boolean(window.localStorage.getItem(TOKEN_KEY));
      const target = usePersistent ? window.localStorage : window.sessionStorage;
      const other = usePersistent ? window.sessionStorage : window.localStorage;
      other.removeItem(TOKEN_KEY);
      if (token) {
        target.setItem(TOKEN_KEY, token);
        window.localStorage.setItem(SESSION_INDICATOR_KEY, 'true');
      } else {
        target.removeItem(TOKEN_KEY);
      }
    });
  },

  setUser(user) {
    safely(undefined, () => {
      const target = window.localStorage.getItem(TOKEN_KEY)
        ? window.localStorage
        : window.sessionStorage;
      if (user) target.setItem(USER_KEY, JSON.stringify(user));
      else stores().forEach((store) => store.removeItem(USER_KEY));
    });
  },

  clear() {
    safely(undefined, () => {
      stores().forEach((store) => {
        store.removeItem(TOKEN_KEY);
        store.removeItem(USER_KEY);
      });
      window.localStorage.removeItem(SESSION_INDICATOR_KEY);
    });
  },
};

