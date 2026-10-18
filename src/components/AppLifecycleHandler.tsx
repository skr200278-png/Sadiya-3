import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import toast from 'react-hot-toast';

export default function AppLifecycleHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPressTimeRef = useRef<number>(0);
  const isInitialLaunchRef = useRef<boolean>(true);

  // 1. On fresh app launch, always land on Home if user has an active session
  useEffect(() => {
    if (isInitialLaunchRef.current) {
      isInitialLaunchRef.current = false;
      const hashPath = window.location.hash.replace(/^#\/?/, '/');
      const isExplicitlyLoggedOut = localStorage.getItem('user_has_logged_out') === 'true';
      if (!isExplicitlyLoggedOut && hashPath !== '/privacy-policy') {
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  // 2. Android hardware back button & app lifecycle handler
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // For web/PWA: reset to Home if returning after leaving
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          sessionStorage.setItem('last_backgrounded_time', Date.now().toString());
        } else if (document.visibilityState === 'visible') {
          const lastBackgrounded = Number(sessionStorage.getItem('last_backgrounded_time') || 0);
          if (
            lastBackgrounded > 0 && 
            Date.now() - lastBackgrounded > 5000 &&
            location.pathname !== '/login' &&
            location.pathname !== '/privacy-policy'
          ) {
            navigate('/', { replace: true });
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    // Native Capacitor App listeners
    let backButtonHandle: any = null;
    let appStateHandle: any = null;

    const setupListeners = async () => {
      // Hardware Back Button
      backButtonHandle = await CapApp.addListener('backButton', () => {
        const currentPath = location.pathname;
        if (currentPath !== '/' && currentPath !== '') {
          // If on Profile or any other section, go back to Home first
          navigate('/');
        } else {
          // If already on Home, require double back press to exit safely
          const now = Date.now();
          if (now - lastBackPressTimeRef.current < 2000) {
            CapApp.exitApp();
          } else {
            lastBackPressTimeRef.current = now;
            toast('অ্যাপ থেকে বের হতে আবার ব্যাক বাটনে চাপ দিন', {
              id: 'exit_app_toast',
              duration: 2000,
              icon: '👋',
            });
          }
        }
      });

      // App State Change (when user leaves app and returns)
      appStateHandle = await CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          sessionStorage.setItem('last_backgrounded_time', Date.now().toString());
        } else {
          const lastBackgrounded = Number(sessionStorage.getItem('last_backgrounded_time') || 0);
          if (lastBackgrounded > 0 && Date.now() - lastBackgrounded > 4000) {
            navigate('/', { replace: true });
          }
        }
      });
    };

    setupListeners();

    return () => {
      if (backButtonHandle?.remove) backButtonHandle.remove();
      if (appStateHandle?.remove) appStateHandle.remove();
    };
  }, [location.pathname, navigate]);

  return null;
}
