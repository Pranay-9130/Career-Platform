const TOKEN_KEY = 'career_platform_token';
const USER_KEY = 'career_platform_user';

const stores = () => [window.localStorage, window.sessionStorage];

const safely = (fallback, operation) => {
  try {
    return operation();
  } catch {
    return fallback;
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

  setSession(token, user, persistent = true) {
    safely(undefined, () => {
      const target = persistent ? window.localStorage : window.sessionStorage;
      const other = persistent ? window.sessionStorage : window.localStorage;
      other.removeItem(TOKEN_KEY);
      other.removeItem(USER_KEY);
      target.setItem(TOKEN_KEY, token);
      target.setItem(USER_KEY, JSON.stringify(user));
    });
  },

  setToken(token, persistent = null) {
    safely(undefined, () => {
      const usePersistent = persistent ?? Boolean(window.localStorage.getItem(TOKEN_KEY));
      const target = usePersistent ? window.localStorage : window.sessionStorage;
      const other = usePersistent ? window.sessionStorage : window.localStorage;
      other.removeItem(TOKEN_KEY);
      if (token) target.setItem(TOKEN_KEY, token);
      else target.removeItem(TOKEN_KEY);
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
    });
  },
};

