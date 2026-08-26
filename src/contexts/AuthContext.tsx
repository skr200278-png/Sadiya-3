import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const DEMO_USER: any = {
  uid: 'demo_khamari_user_1',
  email: 'demo@digitalfarm.app',
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
    if (typeof window !== 'undefined' && localStorage.getItem('is_demo_mock') === 'true') {
      return DEMO_USER;
    }
    return null;
  });
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('is_demo_mock') === 'true') {
      return true;
    }
    return false;
  });
  const [loading, setLoading] = useState(true);
  const [logoSrc, setLogoSrc] = useState('farm_app_icon_1779214389225.png');

  useEffect(() => {
    let authUser: User | null = null;
    let authDetermined = false;
    const isMock = localStorage.getItem('is_demo_mock') === 'true';
    if (isMock) {
      authUser = DEMO_USER;
      setIsDemoUser(true);
    }
    const minimumSplashTime = 2000; // 2 seconds
    const startTime = Date.now();

    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minimumSplashTime - elapsed);
      setTimeout(() => {
        if (!authUser && localStorage.getItem('is_demo_mock') === 'true') {
          setCurrentUser(DEMO_USER);
          setIsDemoUser(true);
        } else {
          setCurrentUser(authUser);
        }
        setLoading(false);
      }, remaining);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.removeItem('is_demo_mock');
        setIsDemoUser(user.isAnonymous);
        authUser = user;
      } else if (localStorage.getItem('is_demo_mock') === 'true') {
        authUser = DEMO_USER;
        setIsDemoUser(true);
      } else {
        authUser = null;
        setIsDemoUser(false);
      }

      if (!authDetermined) {
        authDetermined = true;
        finishLoading();
      } else {
        setCurrentUser(authUser);
      }
    });

    return unsubscribe;
  }, []);

  const loginAsDemo = async () => {
    localStorage.setItem('is_demo_mock', 'true');
    setCurrentUser(DEMO_USER);
    setIsDemoUser(true);
  };

  const logout = async () => {
    try {
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
      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-green-700">
          <div className="text-center animate-pulse">
            {logoSrc ? (
              <img 
                src={logoSrc} 
                onError={() => {
                  if (logoSrc === 'farm_app_icon_1779214389225.png') {
                    setLogoSrc('pwa-192x192.png');
                  } else if (logoSrc === 'pwa-192x192.png') {
                    setLogoSrc('icon-192x192.png');
                  } else {
                    setLogoSrc('');
                  }
                }}
                alt="Digital Farm Logo" 
                className="w-32 h-32 mx-auto drop-shadow-xl mb-4 rounded-3xl object-cover border-2 border-white/20" 
              />
            ) : (
              <div className="w-32 h-32 mx-auto mb-4 bg-white/10 rounded-3xl p-5 shadow-xl text-yellow-200 flex items-center justify-center border border-white/20">
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            )}
            <h1 className="text-4xl font-bold text-white tracking-wider">ডিজিটাল খামার</h1>
            <p className="mt-2 text-green-100 font-medium font-sans">Smart Livestock & Farm Manager</p>
          </div>
          <div className="absolute bottom-10 w-2/3 max-w-xs">
            <div className="h-1 w-full bg-green-800 rounded-full overflow-hidden">
              <div className="h-full bg-white animate-pulse rounded-full w-2/3 mx-auto"></div>
            </div>
            <p className="text-center text-green-200 text-sm mt-3">অপেক্ষা করুন...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
