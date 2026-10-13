import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { auth } from '../firebase';
import appLogo from '../assets/images/farm_app_icon_1779214389225.png';

export const DEMO_USER: any = {
  uid: 'demo_khamari_user_1',
  email: 'demo@farmmanager.app',
  displayName: 'ডেমো খামারি',
  photoURL: null,
  isAnonymous: true,
};

interface AuthContextType {
  currentUser: User | null;
  isDemoUser: boolean;
  loading: boolean;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  isDemoUser: false,
  loading: true,
  loginAsDemo: async () => {},
  logout: async () => {} 
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('user_has_logged_out') === 'true') {
      return null;
    }
    return DEMO_USER;
  });
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('user_has_logged_out') === 'true') {
      return false;
    }
    return true;
  });
  const [loading, setLoading] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string>(appLogo);

  useEffect(() => {
    let authUser: User | null = null;
    let authDetermined = false;
    const hasExplicitlyLoggedOut = typeof window !== 'undefined' && localStorage.getItem('user_has_logged_out') === 'true';

    if (!hasExplicitlyLoggedOut) {
      authUser = DEMO_USER;
      setIsDemoUser(true);
    }

    const minimumSplashTime = 300; // Ultra-fast splash for instantaneous preview rendering
    const startTime = Date.now();

    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minimumSplashTime - elapsed);
      setTimeout(() => {
        if (!authUser && localStorage.getItem('user_has_logged_out') !== 'true') {
          setCurrentUser(DEMO_USER);
          setIsDemoUser(true);
        } else {
          setCurrentUser(authUser);
        }
        setLoading(false);
      }, remaining);
    };

    // Fail-safe timer: never let preview hang indefinitely in sandboxed preview iframe
    const fallbackTimer = setTimeout(() => {
      if (!authDetermined) {
        authDetermined = true;
        finishLoading();
      }
    }, 600);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.removeItem('user_has_logged_out');
        localStorage.removeItem('is_demo_mock');
        setIsDemoUser(user.isAnonymous);
        authUser = user;
      } else if (localStorage.getItem('user_has_logged_out') === 'true') {
        authUser = null;
        setIsDemoUser(false);
      } else {
        authUser = DEMO_USER;
        setIsDemoUser(true);
      }

      if (!authDetermined) {
        authDetermined = true;
        clearTimeout(fallbackTimer);
        finishLoading();
      } else {
        setCurrentUser(authUser);
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const loginAsDemo = async () => {
    localStorage.removeItem('user_has_logged_out');
    localStorage.setItem('is_demo_mock', 'true');
    setCurrentUser(DEMO_USER);
    setIsDemoUser(true);
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

  const effectiveIsDemo = Boolean(
    isDemoUser ||
    currentUser?.uid === 'demo_khamari_user_1' ||
    (currentUser as any)?.isAnonymous ||
    (!auth.currentUser && !!currentUser)
  );

  return (
    <AuthContext.Provider value={{ currentUser, isDemoUser: effectiveIsDemo, loading, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
