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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [logoSrc, setLogoSrc] = useState<string>(appLogo);

  const checkUserVerified = (user: User | null): boolean => {
    if (!user) return false;
    // Strictly require email to be verified (Google accounts automatically have emailVerified = true)
    return Boolean(user.emailVerified);
  };

  useEffect(() => {
    let authDetermined = false;
    const minimumSplashTime = 300;
    const startTime = Date.now();

    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minimumSplashTime - elapsed);
      setTimeout(() => {
        setLoading(false);
      }, remaining);
    };

    // Fail-safe timer
    const fallbackTimer = setTimeout(() => {
      if (!authDetermined) {
        authDetermined = true;
        finishLoading();
      }
    }, 600);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const isVerified = checkUserVerified(user);
        if (!isVerified) {
          // Unverified email/password user: don't auto-login into dashboard
          setCurrentUser(null);
          setIsDemoUser(false);
        } else {
          localStorage.removeItem('user_has_logged_out');
          localStorage.removeItem('is_demo_mock');
          setIsDemoUser(false);
          setCurrentUser(user);
        }
      } else {
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
      if (checkUserVerified(user)) {
        localStorage.removeItem('user_has_logged_out');
        localStorage.removeItem('is_demo_mock');
        setIsDemoUser(false);
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setIsDemoUser(false);
      }
    }
  };

  const loginAsDemo = async () => {
    // Demo mode removed per user request
  };

  const logout = async () => {
    try {
      localStorage.setItem('user_has_logged_out', 'true');
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
