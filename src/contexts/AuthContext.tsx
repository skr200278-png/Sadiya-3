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

interface CachedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string | null;
}

const getInitialUser = (): any => {
  if (auth.currentUser) return auth.currentUser;
  try {
    const isLoggedOut = localStorage.getItem('user_has_logged_out') === 'true';
    if (!isLoggedOut) {
      const raw = localStorage.getItem('cached_auth_user');
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch {}
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialUser = getInitialUser();
  const [currentUser, setCurrentUser] = useState<any | null>(initialUser);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(() => !initialUser);
  const [logoSrc, setLogoSrc] = useState<string>(appLogo);

  useEffect(() => {
    let authDetermined = false;

    // Failsafe timer: only unlock loading if we don't have an initial user yet
    const fallbackTimer = setTimeout(() => {
      if (!authDetermined) {
        authDetermined = true;
        setLoading(false);
      }
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.removeItem('user_has_logged_out');
        localStorage.setItem('has_authenticated_session', 'true');
        localStorage.removeItem('is_demo_mock');
        localStorage.setItem('cached_auth_user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber,
        }));
        setIsDemoUser(false);
        setCurrentUser(user);
        setLoading(false);
      } else {
        const hasSession = localStorage.getItem('has_authenticated_session') === 'true';
        const isLoggedOut = localStorage.getItem('user_has_logged_out') === 'true';
        if (isLoggedOut || !hasSession) {
          localStorage.removeItem('has_authenticated_session');
          localStorage.removeItem('cached_auth_user');
          setCurrentUser(null);
          setIsDemoUser(false);
          setLoading(false);
        }
      }

      if (!authDetermined) {
        authDetermined = true;
        clearTimeout(fallbackTimer);
        setLoading(false);
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
      localStorage.setItem('cached_auth_user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
      }));
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
      localStorage.removeItem('cached_auth_user');
      localStorage.removeItem('is_demo_mock');
      setIsDemoUser(false);
      await signOut(auth);
    } catch (e) {
      console.error('SignOut error, clearing user manually:', e);
    } finally {
      setCurrentUser(null);
      setIsDemoUser(false);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isDemoUser: false, loading, loginAsDemo, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
