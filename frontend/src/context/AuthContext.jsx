import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [isLoading, setIsLoading] = useState(() => Boolean(authService.getToken()));

  // Validate a restored session before allowing protected content to render.
  useEffect(() => {
    let active = true;
    const restoredToken = authService.getToken();

    if (!restoredToken) {
      authService.clearAuth();
      setUser(null);
      setIsLoading(false);
      return () => { active = false; };
    }

    authService.getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setToken(restoredToken);
          setUser(currentUser);
        }
      })
      .catch(() => {
        authService.clearAuth();
        if (active) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

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
    setIsLoading(true);
    try {
      const data = await authService.login({ email, password }, persistent);
      setToken(data.access_token);
      setUser(data.user);
      return data;
    } finally {
      setIsLoading(false);
    }
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

  const logout = useCallback(() => {
    authService.logout().catch(() => {});
    setToken(null);
    setUser(null);
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
  const isStudent = user?.role === 'STUDENT';

  const value = {
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
  };

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
