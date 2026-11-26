import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '@/services/authService';
import { authStorage, isTokenExpired } from '@/services/authStorage';
import { clearApiCache } from '@/services/api';
import { isSessionRejection } from '@/services/authErrors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const initialToken = authService.getToken();
  const initialUser = initialToken ? authService.getUser() : null;
  const isInitialValid = Boolean(initialToken && initialUser && !isTokenExpired(initialToken));
  const [user, setUser] = useState(isInitialValid ? initialUser : null);
  const [token, setToken] = useState(isInitialValid ? initialToken : null);
  // Stale-while-revalidate: only render optimistically if stored token is unexpired
  const [isLoading, setIsLoading] = useState(() => {
    if (isInitialValid) return false;
    return authStorage.hasActiveSessionHint();
  });

  // Revalidate or restore session in the background
  useEffect(() => {
    let active = true;
    const restoredToken = authService.getToken();

    const initializeAuth = async () => {
      if (restoredToken && !isTokenExpired(restoredToken)) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (active) {
            setToken(restoredToken);
            setUser(currentUser);
          }
        } catch (error) {
          if (isSessionRejection(error)) {
            authService.clearAuth();
            if (active) {
              setToken(null);
              setUser(null);
            }
          }
        }
      } else if (authStorage.hasActiveSessionHint()) {
        // Access token is missing or expired, but an active session hint exists (silent token restoration)
        try {
          const refreshData = await authService.refreshToken();
          if (active && refreshData?.access_token && refreshData?.user) {
            setToken(refreshData.access_token);
            setUser(refreshData.user);
          }
        } catch (error) {
          // Temporary transport/server failures do not prove the refresh
          // credential is invalid. Preserve the session hint for a later retry.
          if (isSessionRejection(error)) {
            authService.clearAuth();
            if (active) {
              setToken(null);
              setUser(null);
            }
          }
        }
      } else {
        // Guest or logged out: do not dispatch a doomed refresh request
        if (active) {
          setToken(null);
          setUser(null);
        }
      }

      if (active) {
        setIsLoading(false);
      }
    };

    initializeAuth();
    return () => { active = false; };
  }, []);

  // Listen for unauthorized 401 events dispatched by API interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback((newToken, newUser) => {
    authService.setToken(newToken);
    authService.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const loginWithCredentials = useCallback(async (email, password, persistent = true) => {
    const data = await authService.login({ email, password }, persistent);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  }, []);

  const registerUser = useCallback(async (userData) => {
    setIsLoading(true);
    try {
      const data = await authService.register(userData);
      setToken(data.access_token);
      setUser(data.user);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // 1. Immediately wipe client credentials & cache for instant zero-latency redirect
    setToken(null);
    setUser(null);
    authService.clearAuth();
    clearApiCache();

    // 2. Revoke server-side session non-blocking in background
    authService.logout().catch((error) => {
      console.warn('Logout notice:', error);
    });
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      authService.setUser(merged);
      return merged;
    });
  }, []);

  const hasRole = useCallback(
    (role) => {
      if (!user) return false;
      return user.role === role;
    },
    [user]
  );

  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT' || user?.role === 'CONTRIBUTOR';

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      isAdmin,
      isStudent,
      login,
      loginWithCredentials,
      registerUser,
      logout,
      updateUser,
      hasRole,
    }),
    [
      user,
      token,
      isAuthenticated,
      isLoading,
      isAdmin,
      isStudent,
      login,
      loginWithCredentials,
      registerUser,
      logout,
      updateUser,
      hasRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
