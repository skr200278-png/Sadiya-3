import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { auth } from '../firebase';
import appLogo from '../assets/images/farm_app_icon_1779214389225.png';

export const DEMO_USER: any = null;

interface AuthContextType {
  currentUser: User | null;
  isDemoUser: boolean;
  loading: boolean;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  isDemoUser: false, 
  loading: true,
  loginAsDemo: async () => {},
  logout: async () => {},
  refreshUser: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(() => !auth.currentUser);
  const [logoSrc, setLogoSrc] = useState<string>(appLogo);

  useEffect(() => {
    let authDetermined = false;
    const minimumSplashTime = 250;
    const startTime = Date.now();

    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minimumSplashTime - elapsed);
      setTimeout(() => {
        setLoading(false);
      }, remaining);
    };

    // If user previously logged out, fallback can be quicker.
    // If user had an active session, give ample time for Firebase IndexedDB/token refresh.
    const isExplicitlyLoggedOut = localStorage.getItem('user_has_logged_out') === 'true';
    const fallbackTimeoutMs = isExplicitlyLoggedOut ? 1200 : 5000;

    const fallbackTimer = setTimeout(() => {
      if (!authDetermined) {
        authDetermined = true;
        finishLoading();
      }
    }, fallbackTimeoutMs);

    // Modern Firebase SDK fast-path: resolves as soon as persistent token from IndexedDB is restored
    if (typeof auth.authStateReady === 'function') {
      auth.authStateReady().then(() => {
        if (!authDetermined) {
          const user = auth.currentUser;
          if (user) {
            localStorage.removeItem('user_has_logged_out');
            localStorage.setItem('has_authenticated_session', 'true');
            setCurrentUser(user);
          } else {
            localStorage.removeItem('has_authenticated_session');
            setCurrentUser(null);
          }
          authDetermined = true;
          clearTimeout(fallbackTimer);
          finishLoading();
        }
      }).catch((e) => {
        console.warn('authStateReady check completed with notice:', e);
      });
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.removeItem('user_has_logged_out');
        localStorage.setItem('has_authenticated_session', 'true');
        localStorage.removeItem('is_demo_mock');
        setIsDemoUser(false);
        setCurrentUser(user);
      } else {
        localStorage.removeItem('has_authenticated_session');
        setCurrentUser(null);
        setIsDemoUser(false);
      }

      if (!authDetermined) {
        authDetermined = true;
        clearTimeout(fallbackTimer);
        finishLoading();
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const user = auth.currentUser;
      localStorage.removeItem('user_has_logged_out');
      localStorage.setItem('has_authenticated_session', 'true');
      localStorage.removeItem('is_demo_mock');
      setIsDemoUser(false);
      setCurrentUser(user);
    }
  };

  const loginAsDemo = async () => {
    // Demo mode removed per user request
  };

  const logout = async () => {
    try {
      localStorage.setItem('user_has_logged_out', 'true');
      localStorage.removeItem('has_authenticated_session');
      localStorage.removeItem('is_demo_mock');
      setIsDemoUser(false);
      await signOut(auth);
    } catch (e) {
      console.error('SignOut error, clearing user manually:', e);
    } finally {
      setCurrentUser(null);
      setIsDemoUser(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isDemoUser: false, loading, loginAsDemo, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
