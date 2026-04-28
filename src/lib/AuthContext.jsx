import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api } from '@/api/client';
import { isFirebaseConfigured } from '@/lib/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({
    id: 'easy-poultry',
    public_settings: {
      app_name: 'Easy Poultry',
      tagline: 'Marketplace · Auctions · Farm Management',
    },
  });

  useEffect(() => {
    // Subscribe to Firebase auth state changes (or no-op in demo mode)
    const unsub = api.auth.onChange((u) => {
      setUser(u);
      setIsAuthenticated(Boolean(u));
      setIsLoadingAuth(false);
      setAuthError(null);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const logout = useCallback((shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      api.auth.logout('/');
    } else {
      api.auth.logout();
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    api.auth.redirectToLogin(window.location.href);
  }, []);

  const checkAppState = useCallback(async () => {
    setIsLoadingPublicSettings(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await api.auth.me();
      setUser(fresh);
      setIsAuthenticated(true);
      setAuthError(null);
      return fresh;
    } catch (e) {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        firebaseConfigured: isFirebaseConfigured,
        logout,
        navigateToLogin,
        checkAppState,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
