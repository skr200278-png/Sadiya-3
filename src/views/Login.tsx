import React, { useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updatePassword,
  updateProfile,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  signOut
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { emailOtpService } from '../services/emailOtpService';
import appLogo from '../assets/images/farm_app_icon_1779214389225.png';
import {
  Mail,
  Lock,
  UserPlus,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  X,
  Sparkles,
  LogIn,
  Send,
  RefreshCw,
  CheckCheck,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { currentUser, refreshUser, loading: authLoading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Security honeypot & auth lock
  const [botHoneypot, setBotHoneypot] = useState('');
  const submitAuthLock = React.useRef(false);

  // Forgot / Reset Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'input' | 'sent' | 'new_password' | 'success'>('input');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOobCode, setResetOobCode] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showNewResetPassword, setShowNewResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);

  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isInIframe] = useState(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  });

  // Clean legacy OTP keys from localStorage on mount
  useEffect(() => {
    try {
      localStorage.removeItem('reg_active_step');
    } catch {}
  }, []);

  // Check URL parameters on mount for Firebase password reset links
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let modeParam = urlParams.get('mode');
      let oobCodeParam = urlParams.get('oobCode');

      if (!modeParam && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          modeParam = modeParam || hashParams.get('mode');
          oobCodeParam = oobCodeParam || hashParams.get('oobCode');
        }
      }

      // Handle Firebase Password Reset Action Link
      if (modeParam === 'resetPassword' && oobCodeParam) {
        setResetOobCode(oobCodeParam);
        setResetStep('new_password');
        setIsForgotModalOpen(true);
        verifyPasswordResetCode(auth, oobCodeParam)
          .then((verifiedEmail) => {
            if (verifiedEmail) {
              setResetEmail(verifiedEmail);
            }
          })
          .catch((err) => {
            console.warn('Invalid or expired reset code:', err);
          });
      }
    } catch (err) {
      console.warn('URL reset param parsing skipped:', err);
    }

    // Check for redirect login result (for mobile browsers / popup fallbacks)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          setLoading(true);
          await bootstrapUser(
            result.user.uid,
            result.user.displayName,
            result.user.email
          );
          toast.success(language === 'bn' ? 'সফলভাবে গুগল দিয়ে লগইন হয়েছে!' : 'Signed in with Google!');
          navigate('/', { replace: true });
        }
      })
      .catch((err) => {
        console.warn('Google redirect sign-in check:', err);
      });
  }, []);

  const isExplicitlyLoggedOut = localStorage.getItem('user_has_logged_out') === 'true';
  const hasSavedSession = (Boolean(currentUser) || localStorage.getItem('has_authenticated_session') === 'true' || Boolean(localStorage.getItem('cached_auth_user'))) && !isExplicitlyLoggedOut && mode !== 'register';

  // If user already has an active account session, never show the login screen!
  if ((currentUser || hasSavedSession) && mode !== 'register') {
    return <Navigate to="/" replace />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-md p-2 mb-4 border border-emerald-100 flex items-center justify-center">
          <img src={appLogo} alt="App Logo" className="w-full h-full object-contain" />
        </div>
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-500 text-sm font-medium">লোড হচ্ছে...</p>
      </div>
    );
  }

  const bootstrapUser = async (
    uid: string,
    displayName: string | null = null,
    userEmail: string | null = null
  ) => {
    localStorage.removeItem('user_has_logged_out');
    localStorage.setItem('has_authenticated_session', 'true');
    localStorage.setItem('cached_auth_user', JSON.stringify({
      uid,
      email: userEmail || '',
      displayName: displayName || 'খামারি',
      photoURL: null,
    }));
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          userId: uid,
          name: displayName || 'খামারি',
          email: userEmail || '',
          createdAt: new Date().toISOString()
        });
      } else {
        const existingData = snap.data();
        const updatePayload: any = {};

        if (userEmail && !existingData.email) {
          updatePayload.email = userEmail;
        }

        if (displayName && (!existingData.name || existingData.name === 'খামারি')) {
          updatePayload.name = displayName;
        }

        if (Object.keys(updatePayload).length > 0) {
          await setDoc(userRef, updatePayload, { merge: true });
        }
      }
    } catch (err) {
      console.warn('Bootstrap user document write skipped or offline:', err);
    }
  };

  /*
   * GOOGLE LOGIN
   * Native Mobile One-Tap via @codetrix-studio/capacitor-google-auth on Android/iOS.
   * Standard Firebase popup on Web browsers.
   */
  const handleGoogleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setUnauthorizedDomain(null);
    setErrorMessage(null);

    try {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        try {
          await setPersistence(auth, indexedDBLocalPersistence);
        } catch (persistenceError) {
          console.warn('Firebase persistence unavailable:', persistenceError);
        }
      }

      let authedUser: any = null;

      // 1. If running as a Native Capacitor App on Android / iOS
      if (Capacitor.isNativePlatform()) {
        try {
          try {
            await GoogleAuth.initialize({
              clientId: '430922454720-8n5dnecapap2vuc0blmlqsa8c4fd900l.apps.googleusercontent.com',
              scopes: ['profile', 'email'],
              grantOfflineAccess: true
            });
          } catch (initErr) {
            console.warn('GoogleAuth init notice:', initErr);
          }

          const googleUser = await GoogleAuth.signIn();
          const idToken = googleUser?.authentication?.idToken || (googleUser as any)?.idToken;

          if (idToken) {
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            authedUser = userCredential.user;
          } else {
            throw new Error('Google ID Token পাওয়া যায়নি।');
          }
        } catch (nativeErr: any) {
          console.warn('Native GoogleAuth error:', nativeErr);
          const errString = String(nativeErr?.message || nativeErr || '');

          if (
            errString.includes('cancelled') ||
            errString.includes('canceled') ||
            errString.includes('12501') ||
            errString.includes('user cancel')
          ) {
            toast.error('গুগল লগইন বাতিল করা হয়েছে।');
            setLoading(false);
            return;
          }

          if (errString.includes('10') || errString.includes('DEVELOPER_ERROR')) {
            setErrorMessage(
              'Google Sign-in Developer Error (10): আপনার Firebase Console-এ APK-এর SHA-1 ফিঙ্গারপ্রিন্ট যুক্ত করতে হবে।'
            );
            toast.error('Firebase SHA-1 কনফিগারেশন প্রয়োজন।');
            setLoading(false);
            return;
          }

          console.warn('Falling back to web popup...');
        }
      }

      // 2. Web browser or fallback flow
      if (!authedUser) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        let result: any = null;
        try {
          result = await signInWithPopup(auth, provider);
        } catch (popupErr: any) {
          const pCode = popupErr?.code || '';
          if (pCode === 'auth/popup-blocked' || pCode === 'auth/cancelled-popup-request') {
            toast(language === 'bn' ? 'ব্রাউজারে সরাসরি গুগল লগইনে নেওয়া হচ্ছে...' : 'Redirecting to Google login...', { icon: '🔄' });
            await signInWithRedirect(auth, provider);
            return;
          }
          throw popupErr;
        }

        if (!result || !result.user) {
          throw new Error('Google user information পাওয়া যায়নি।');
        }

        authedUser = result.user;
      }

      // Instant 1-Click Login for ALL Google Users (new and existing)
      await bootstrapUser(
        authedUser.uid,
        authedUser.displayName,
        authedUser.email
      );

      toast.success(language === 'bn' ? 'সফলভাবে গুগল দিয়ে লগইন হয়েছে!' : 'Signed in with Google!');
      navigate('/', { replace: true });

    } catch (error: any) {
      const errCode = error?.code || '';
      const errMsg = error?.message || '';

      if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
        console.info('Google sign-in popup dismissed or cancelled by user.');
        toast(language === 'bn' ? 'গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে।' : 'Google login was cancelled.', {
          icon: 'ℹ️'
        });
        setErrorMessage(null);
      } else {
        console.error('Google Auth Error:', error);

        if (errCode === 'auth/popup-blocked') {
          setErrorMessage(
            language === 'bn'
              ? 'ব্রাউজার Google Login popup ব্লক করেছে। ব্রাউজারে popup অনুমতি দিয়ে আবার চেষ্টা করুন।'
              : 'Popup was blocked by browser. Please allow popups and try again.'
          );
          toast.error(language === 'bn' ? 'Google popup ব্লক করা হয়েছে।' : 'Popup blocked');
        } else if (
          errCode === 'auth/unauthorized-domain' ||
          errMsg.includes('auth/unauthorized-domain')
        ) {
          setUnauthorizedDomain(window.location.hostname);
          setErrorMessage(
            `এই ডোমেইন Firebase Authentication-এ অনুমোদিত নয়: ${window.location.hostname}`
          );
          toast.error('Firebase domain অনুমোদিত নয়।');
        } else if (errCode === 'auth/operation-not-allowed') {
          setErrorMessage(
            'Firebase Console → Authentication → Sign-in method থেকে Google Sign-in Enable করুন।'
          );
          toast.error('Google Sign-in Enable করা নেই।');
        } else if (errCode === 'auth/network-request-failed') {
          setErrorMessage(
            language === 'bn' ? 'ইন্টারনেট সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Network error. Please check your connection.'
          );
          toast.error(language === 'bn' ? 'নেটওয়ার্ক সমস্যা।' : 'Network error');
        } else if (errCode === 'auth/web-storage-unsupported') {
          setErrorMessage(
            language === 'bn'
              ? 'এই ব্রাউজারে Firebase authentication storage কাজ করছে না। সাধারণ Chrome browser-এ আবার চেষ্টা করুন।'
              : 'Web storage unsupported in this browser.'
          );
          toast.error('Browser storage সমস্যা।');
        } else {
          setErrorMessage(
            `Google Login ব্যর্থ হয়েছে (${errCode || 'Error'}): ${errMsg}`
          );
          toast.error(language === 'bn' ? 'Google Login করা যায়নি।' : 'Google Login failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * STEP 1: VALIDATE INFO AND MOVE TO STEP 2 (SEND 6-DIGIT OTP CODE)
   * DIRECT 1-STEP REGISTRATION
   * Instant account creation with Google Firebase Auth & Anti-Bot Protection
   */
  const handleDirectRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || submitAuthLock.current) return;

    // 1. Bot Honeypot Protection
    if (botHoneypot.trim()) {
      console.warn('Bot attack dropped via honeypot field.');
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = password.trim();
    const cleanConfirmPin = confirmPassword.trim();

    // 2. Strict Input Validations
    if (!cleanName) {
      toast.error('আপনার পুরো নাম লিখুন।');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error('সঠিক জিমেইল / ইমেইল ঠিকানা দিন (যেমন: name@gmail.com)');
      return;
    }

    if (emailOtpService.isDisposableEmail(cleanEmail)) {
      toast.error('অস্থায়ী বা ফেক ইমেইল গ্রহণযোগ্য নয়। আসল জিমেইল দিন।');
      return;
    }

    if (cleanPin.length < 6) {
      toast.error(language === 'bn' ? 'পিন বা পাসওয়ার্ড কমপক্ষে ৬ ডিজিট বা অক্ষরের হতে হবে।' : 'PIN / Password must be at least 6 characters.');
      return;
    }

    if (cleanPin !== cleanConfirmPin) {
      toast.error(language === 'bn' ? 'উভয় ঘরে একই পিন বা পাসওয়ার্ড দিন।' : 'PIN / Password does not match! Please recheck.');
      return;
    }

    // 3. Anti-Abuse Rate Limiting: Max 5 registration attempts per device in 15 minutes
    const now = Date.now();
    try {
      const regAttemptsRaw = localStorage.getItem('farm_reg_attempts');
      const regAttempts: number[] = regAttemptsRaw 
        ? JSON.parse(regAttemptsRaw).filter((t: number) => now - t < 15 * 60 * 1000) 
        : [];
      if (regAttempts.length >= 5) {
        const errorMsg = 'অতিরিক্ত অ্যাকাউন্ট তৈরির চেষ্টা সনাক্ত হয়েছে। নিরাপত্তার স্বার্থে ১৫ মিনিট অপেক্ষা করুন।';
        toast.error(errorMsg);
        setErrorMessage(errorMsg);
        return;
      }
      regAttempts.push(now);
      localStorage.setItem('farm_reg_attempts', JSON.stringify(regAttempts));
    } catch {}

    setLoading(true);
    submitAuthLock.current = true;
    setErrorMessage(null);
    setUnauthorizedDomain(null);

    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch {
      try {
        await setPersistence(auth, indexedDBLocalPersistence);
      } catch {}
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPin);
      try {
        await updateProfile(result.user, { displayName: cleanName });
      } catch {}

      await bootstrapUser(result.user.uid, cleanName, cleanEmail);

      toast.success(
        language === 'bn'
          ? '🎉 অভিনন্দন! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। খামারে স্বাগতম!'
          : '🎉 Congratulations! Your account has been created. Welcome!'
      );
      navigate('/', { replace: true });
    } catch (error: any) {
      const errCode = error?.code || '';
      const errMsg = error?.message || '';
      const isEmailInUse = errCode === 'auth/email-already-in-use' || errMsg.includes('auth/email-already-in-use');

      if (isEmailInUse) {
        setMode('login');
        setErrorMessage(
          language === 'bn'
            ? 'এই জিমেইল দিয়ে আগেই অ্যাকাউন্ট তৈরি করা আছে। নিচে পিন দিয়ে সরাসরি লগইন করুন।'
            : 'An account already exists with this email. Please log in with your PIN.'
        );
        toast.error(language === 'bn' ? 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন ট্যাবে নেওয়া হয়েছে।' : 'Account exists. Switched to login.');
      } else if (errCode === 'auth/weak-password') {
        setErrorMessage(language === 'bn' ? 'পিন কমপক্ষে ৬ ডিজিটের হতে হবে।' : 'PIN must be at least 6 characters.');
        toast.error(language === 'bn' ? 'পিন অন্তত ৬ অক্ষরের হতে হবে।' : 'PIN must be at least 6 characters.');
      } else {
        setErrorMessage(
          language === 'bn'
            ? `রেজিস্ট্রেশন সম্পন্ন করা যায়নি (${errCode || 'Error'}): ${errMsg || 'আবার চেষ্টা করুন।'}`
            : `Registration failed: ${errMsg || 'Please try again.'}`
        );
        toast.error(language === 'bn' ? 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি।' : 'Registration failed.');
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        submitAuthLock.current = false;
      }, 1000);
    }
  };

  /*
   * MAIN AUTH SUBMISSION (Email + 6-Digit PIN or Direct Registration)
   */
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. REGISTRATION FLOW - Direct 1-Step Instant Signup
    if (mode === 'register') {
      await handleDirectRegistration(e);
      return;
    }

    // Bot honeypot: automated tools populate hidden form fields
    if (botHoneypot.trim()) {
      console.warn('Bot attack dropped via honeypot field.');
      return;
    }

    if (loading || submitAuthLock.current) return;
    submitAuthLock.current = true;

    // 2. LOGIN FLOW (Existing users: NO code requested, instant entry!)
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = password.trim();

    if (!cleanEmail || !cleanPin) {
      toast.error(language === 'bn' ? 'জিমেইল / ইমেইল এবং পিন বা পাসওয়ার্ড দিন।' : 'Please enter Email and PIN / Password.');
      submitAuthLock.current = false;
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error('সঠিক জিমেইল / ইমেইল ঠিকানা লিখুন (যেমন: name@gmail.com)');
      submitAuthLock.current = false;
      return;
    }

    if (cleanPin.length < 6) {
      toast.error(language === 'bn' ? 'কমপক্ষে ৬ ডিজিট বা অক্ষরের পিন/পাসওয়ার্ড লিখুন।' : 'PIN / Password must be at least 6 characters.');
      submitAuthLock.current = false;
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setUnauthorizedDomain(null);

    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch {
      try {
        await setPersistence(auth, indexedDBLocalPersistence);
      } catch (persErr) {
        console.warn('Auth persistence fallback note:', persErr);
      }
    }

    try {
      const authedResult = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        cleanPin
      );

      await bootstrapUser(
        authedResult.user.uid,
        authedResult.user.displayName,
        authedResult.user.email
      );

      toast.success('সফলভাবে লগইন হয়েছে!');
      navigate('/', { replace: true });

    } catch (error: any) {
      const errCode = error?.code || '';
      const errMsg = error?.message || '';

      if (errCode === 'auth/invalid-credential' || errCode === 'auth/user-not-found' || errCode === 'auth/wrong-password') {
        console.warn('Authentication attempt notice:', errCode);
      } else {
        console.error('Auth Error:', error);
      }

      if (errCode === 'auth/user-not-found') {
        setErrorMessage(
          'এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে উপরে "নতুন রেজিস্ট্রেশন (Sign Up)" ট্যাবে ক্লিক করে একটি নতুন অ্যাকাউন্ট তৈরি করুন অথবা গুগল দিয়ে প্রবেশ করুন।'
        );
        toast.error('অ্যাকাউন্ট পাওয়া যায়নি! নতুন রেজিস্ট্রেশন করুন।');
      } else if (errCode === 'auth/wrong-password') {
        setErrorMessage(
          'আপনার দেওয়া ৬-ডিজিটের পিনটি সঠিক নয়। অনুগ্রহ করে সঠিক পিন দিন অথবা নিচে "পিন ভুলে গেছেন?" অপশন ব্যবহার করুন।'
        );
        toast.error('পিন ভুল হয়েছে! আবার চেষ্টা করুন।');
      } else if (errCode === 'auth/invalid-credential') {
        setErrorMessage(
          'আপনার ইমেইল অথবা ৬-ডিজিটের পিনটি সঠিক নয়। অনুগ্রহ করে সঠিক তথ্য দিন অথবা নিচে "গুগল দিয়ে ১-ক্লিকে প্রবেশ" করুন।'
        );
        toast.error('ইমেইল বা পিন সঠিক নয়।');
      } else if (errCode === 'auth/too-many-requests') {
        setErrorMessage(
          'অতিরিক্ত ভুল চেষ্টার কারণে সাময়িকভাবে এই অ্যাকাউন্টে লগইন ব্লক করা হয়েছে। আপনি গুগল (Google Sign-In) দিয়ে এখনই সরাসরি প্রবেশ করতে পারেন অথবা কিছুক্ষণ পর চেষ্টা করুন।'
        );
        toast.error('অতিরিক্ত চেষ্টার কারণে সাময়িক ব্লক! গুগল দিয়ে চেষ্টা করুন।');
      } else if (errCode === 'auth/invalid-email') {
        setErrorMessage('সঠিক জিমেইল / ইমেইল অ্যাড্রেস লিখুন।');
        toast.error('ইমেইল সঠিক নয়!');
      } else if (errCode === 'auth/network-request-failed') {
        setErrorMessage('ইন্টারনেট সংযোগে সমস্যা হয়েছে। দয়া করে আপনার ডাটা/ওয়াইফাই চেক করে আবার চেষ্টা করুন।');
        toast.error('ইন্টারনেট সংযোগ চেক করুন।');
      } else {
        setErrorMessage(`লগইন করা সম্ভব হয়নি (${errCode || 'Error'}): ${errMsg || 'অনুগ্রহ করে আবার চেষ্টা করুন।'}`);
        toast.error('লগইন সম্পন্ন করা যায়নি।');
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        submitAuthLock.current = false;
      }, 1200);
    }
  };

  /*
   * PASSWORD / PIN RESET FLOW (Firebase sendPasswordResetEmail)
   */
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const clean = resetEmail.trim().toLowerCase();

    if (!clean) {
      setResetErrorMessage(
        language === 'bn' ? 'আপনার নিবন্ধিত জিমেইল / ইমেইল ঠিকানা লিখুন।' : 'Please enter your registered email address.'
      );
      return;
    }

    if (!clean.includes('@') || !clean.includes('.')) {
      setResetErrorMessage(
        language === 'bn'
          ? 'সঠিক জিমেইল / ইমেইল ফরম্যাট দিন (যেমন: name@gmail.com)'
          : 'Please provide a valid email address (e.g. name@gmail.com)'
      );
      return;
    }

    setResetLoading(true);
    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, clean);

      setResetSuccessMessage(
        language === 'bn'
          ? `আপনার জিমেইল (${clean})-এ পিন/পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে! অনুগ্রহ করে আপনার ইনবক্স এবং স্প্যাম (Spam) ফোল্ডার চেক করুন।`
          : `Password reset link has been sent to (${clean})! Please check your Inbox and Spam folder.`
      );

      setResetStep('sent');
      toast.success(
        language === 'bn' ? 'রিসেট লিংক সফলভাবে পাঠানো হয়েছে!' : 'Reset link sent successfully!'
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      const code = error?.code || '';

      if (code === 'auth/user-not-found') {
        setResetErrorMessage(
          language === 'bn'
            ? 'এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে সঠিক ইমেইল দিন বা নতুন রেজিস্ট্রেশন করুন।'
            : 'No account found with this email. Please check and try again.'
        );
      } else if (code === 'auth/invalid-email') {
        setResetErrorMessage(
          language === 'bn'
            ? 'সঠিক ইমেইল অ্যাড্রেস লিখুন।'
            : 'Please enter a valid email address.'
        );
      } else {
        setResetErrorMessage(
          language === 'bn'
            ? 'পাসওয়ার্ড রিসেট অনুরোধ সম্পন্ন করা যায়নি। ইন্টারনেট চেক করে আবার চেষ্টা করুন।'
            : 'Could not send reset request. Please check your internet connection.'
        );
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = newResetPassword.trim();
    const cleanConfirm = confirmResetPassword.trim();

    if (!cleanPass) {
      setResetErrorMessage(
        language === 'bn' ? 'নতুন পিন বা পাসওয়ার্ড লিখুন।' : 'Please enter your new PIN or Password.'
      );
      return;
    }

    if (cleanPass.length < 6) {
      setResetErrorMessage(
        language === 'bn' ? 'পিন বা পাসওয়ার্ড কমপক্ষে ৬ ডিজিট বা অক্ষরের হতে হবে।' : 'PIN / Password must be at least 6 characters.'
      );
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setResetErrorMessage(
        language === 'bn' ? 'উভয় ঘরে একই পিন বা পাসওয়ার্ড লিখুন।' : 'PIN / Password does not match.'
      );
      return;
    }

    setResetLoading(true);
    setResetErrorMessage(null);

    try {
      if (resetOobCode) {
        await confirmPasswordReset(auth, resetOobCode, cleanPass);
      } else if (auth.currentUser) {
        await updatePassword(auth.currentUser, cleanPass);
      }

      setResetStep('success');
      toast.success(
        language === 'bn' ? 'পিন সফলভাবে পরিবর্তিত হয়েছে!' : 'PIN updated successfully!'
      );
    } catch (err: any) {
      console.error('Confirm password reset error:', err);
      const code = err?.code || '';
      if (code === 'auth/expired-action-code') {
        setResetErrorMessage(
          language === 'bn'
            ? 'রিসেট লিংকের মেয়াদ শেষ হয়ে গেছে। দয়া করে আবার নতুন লিংক চেয়ে নিন।'
            : 'Reset link has expired. Please request a new link.'
        );
      } else if (code === 'auth/invalid-action-code') {
        setResetErrorMessage(
          language === 'bn'
            ? 'রিসেট কোডটি সঠিক নয় অথবা ইতিমধ্যে ব্যবহৃত হয়েছে।'
            : 'Reset code is invalid or already used.'
        );
      } else {
        setResetErrorMessage(
          err.message || (language === 'bn' ? 'পিন আপডেট করা সম্ভব হয়নি।' : 'Failed to update PIN.')
        );
      }
    } finally {
      setResetLoading(false);
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-gray-50 to-green-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 p-7 text-center relative">
          {/* Language Switcher Pill */}
          <div className="absolute top-3.5 right-3.5 flex items-center bg-black/25 backdrop-blur-md rounded-full p-0.5 border border-white/20 shadow-sm z-10">
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                language === 'bn'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          <div className="w-14 h-14 bg-white/95 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md p-1 overflow-hidden mt-0.5">
            <img
              src={appLogo}
              onError={(e) => {
                e.currentTarget.src = '/farm_app_icon_1779214389225.png';
              }}
              alt="Farm Manager Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <h1 className="text-xl font-black text-white tracking-wide">
            {language === 'bn' ? 'ফার্ম ম্যানেজার (Farm Manager)' : 'Farm Manager'}
          </h1>

          <p className="text-emerald-100 text-[11px] mt-0.5 font-medium">
            {language === 'bn'
              ? 'পাখি, পশু ও মাছের স্মার্ট খামার ব্যবস্থাপনা'
              : 'Smart Farm Management for Poultry, Cattle & Fish'}
          </p>

          {isInIframe && (
            <button
              type="button"
              onClick={openInNewTab}
              className="mt-2 inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold py-1 px-2.5 rounded-full backdrop-blur-sm transition-all cursor-pointer"
              title={language === 'bn' ? 'নতুন ব্রাউজার ট্যাবে খুলুন' : 'Open in new tab'}
            >
              <ExternalLink size={11} />
              <span>
                {language === 'bn' ? 'পপ-আপ সমস্যায় নতুন ট্যাবে খুলুন' : 'Open in new tab for popup'}
              </span>
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6">
              {/* Mode Switcher Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-4 border border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {language === 'bn' ? 'লগইন (Sign In)' : 'Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {language === 'bn' ? 'নতুন রেজিস্ট্রেশন (Sign Up)' : 'Sign Up'}
                </button>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-xs text-red-900 font-medium">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={17} />
                    <div className="space-y-1">
                      <p className="font-bold text-red-950">
                        {language === 'bn' ? 'সমস্যা:' : 'Error:'}
                      </p>
                      <p className="leading-relaxed">{errorMessage}</p>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {mode === 'login' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setMode('register');
                              setErrorMessage(null);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <UserPlus size={13} />
                            <span>{language === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন (Sign Up)' : 'Create Account'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setMode('login');
                              setErrorMessage(null);
                            }}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <LogIn size={13} />
                            <span>{language === 'bn' ? 'লগইন ট্যাবে যান (Sign In)' : 'Go to Sign In'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(email.trim());
                            setResetErrorMessage(null);
                            setResetSuccessMessage(null);
                            setResetStep('input');
                            setIsForgotModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <KeyRound size={13} />
                          <span>{language === 'bn' ? 'পিন রিসেট করুন' : 'Reset PIN'}</span>
                        </button>
                      </div>

                      {unauthorizedDomain && (
                        <p className="text-[10px] break-all mt-2">Domain: {unauthorizedDomain}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Auth Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* Bot Honeypot field (invisible to users, catches automated hacker/spam tools) */}
                <div style={{ position: 'absolute', opacity: 0, zIndex: -1, pointerEvents: 'none', height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
                  <label htmlFor="farm_app_security_code">Security Token</label>
                  <input
                    id="farm_app_security_code"
                    name="farm_app_security_token_hp"
                    type="text"
                    tabIndex={-1}
                    autoComplete="new-password"
                    value={botHoneypot}
                    onChange={(e) => setBotHoneypot(e.target.value)}
                  />
                </div>

                {mode === 'register' ? (
                  /* STEP 1: Registration Info (First Page: Name, Email, Password, Confirm Password) */
                  <>
                    <div className="flex items-center justify-between pb-1 mb-1">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        {language === 'bn' ? 'ধাপ ১ : আপনার তথ্য দিন' : 'Step 1 : Your Details'}
                      </span>
                      <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {language === 'bn' ? '১ / ২ ধাপ' : 'Step 1 of 2'}
                      </span>
                    </div>

                    {/* 1. Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        {language === 'bn' ? 'আপনার পুরো নাম' : 'Full Name'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <UserPlus size={18} />
                        </div>
                        <input
                          type="text"
                          placeholder={language === 'bn' ? 'যেমন: মোঃ রফিকুল ইসলাম' : 'e.g. John Doe'}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-11 pr-4 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50/50 focus:bg-white font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* 2. Gmail / Email */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        {language === 'bn' ? 'জিমেইল / ইমেইল ঠিকানা' : 'Gmail / Email Address'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          placeholder={language === 'bn' ? 'যেমন: yourname@gmail.com' : 'e.g. yourname@gmail.com'}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50/50 focus:bg-white font-medium"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 pl-1">
                        {language === 'bn'
                          ? 'পরের পেজে এই জিমেইলে ৬-সংখ্যার যাচাইকরণ কোড যাবে।'
                          : 'A 6-digit verification code will be sent to this email in the next step.'}
                      </p>
                    </div>

                    {/* 3. PIN / Password */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        {language === 'bn' ? 'পিন বা পাসওয়ার্ড (PIN / Password)' : 'PIN / Password'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Lock size={18} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={language === 'bn' ? 'কমপক্ষে ৬ ডিজিটের পিন বা পাসওয়ার্ড' : 'At least 6 characters PIN or Password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-11 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50/50 focus:bg-white font-medium"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          title={showPassword ? (language === 'bn' ? 'লুকান' : 'Hide') : language === 'bn' ? 'দেখুন' : 'Show'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* 4. Confirm PIN / Password */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        {language === 'bn' ? 'পিন / পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm PIN / Password'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Lock size={18} />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder={language === 'bn' ? 'একই পিন বা পাসওয়ার্ড পুনরায় লিখুন' : 'Re-enter same PIN or Password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-11 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50/50 focus:bg-white font-medium"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          title={showConfirmPassword ? (language === 'bn' ? 'লুকান' : 'Hide') : language === 'bn' ? 'দেখুন' : 'Show'}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button -> Direct 1-Step Instant Account Creation */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all disabled:opacity-50 shadow-md shadow-emerald-700/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 text-sm cursor-pointer"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {language === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <UserPlus size={18} />
                          <span>{language === 'bn' ? 'সরাসরি অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}</span>
                        </span>
                      )}
                    </button>

                    {/* Google Alternative in Step 1 */}
                    <div className="relative flex items-center py-2 my-2">
                      <div className="flex-grow border-t border-gray-200" />
                      <span className="flex-shrink-0 mx-2 text-gray-400 text-[10.5px] font-semibold uppercase">
                        {language === 'bn' ? 'অথবা ১-ক্লিকে' : 'Or 1-Click'}
                      </span>
                      <div className="flex-grow border-t border-gray-200" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-300 shadow-2xs text-xs sm:text-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="w-4 h-4 shrink-0"
                      />
                      <span>
                        {language === 'bn' ? 'গুগল (Gmail) দিয়ে ১-ক্লিকে একাউন্ট খুলুন' : 'Create Account with Google (1-Click)'}
                      </span>
                    </button>
                  </>
                ) : (
                  /* LOGIN FORM */
                  <>
                    {/* 🌟 1-CLICK GMAIL LOGIN (Standard Clean Social Button) */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-300 shadow-2xs text-xs sm:text-sm transition-all disabled:opacity-50 cursor-pointer mb-1"
                    >
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="w-4 h-4 shrink-0"
                      />
                      <span>
                        {loading
                          ? (language === 'bn' ? 'গুগল কানেক্ট হচ্ছে...' : 'Connecting Google...')
                          : (language === 'bn' ? 'গুগল (Gmail) দিয়ে ১-ক্লিকে প্রবেশ' : 'Continue with Google (1-Click)')}
                      </span>
                    </button>

                    <div className="relative flex items-center py-2 mb-2 mt-2">
                      <div className="flex-grow border-t border-gray-200" />
                      <span className="flex-shrink-0 mx-2 text-gray-400 text-[10.5px] font-semibold uppercase">
                        {language === 'bn' ? 'অথবা ইমেইল ও পাসওয়ার্ড' : 'Or Email & Password'}
                      </span>
                      <div className="flex-grow border-t border-gray-200" />
                    </div>

                    {/* 1. Gmail / Email */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        {language === 'bn' ? 'জিমেইল / ইমেইল ঠিকানা' : 'Gmail / Email Address'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          placeholder={language === 'bn' ? 'যেমন: yourname@gmail.com' : 'e.g. yourname@gmail.com'}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50/50 focus:bg-white font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* 2. PIN / Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {language === 'bn' ? 'পিন বা পাসওয়ার্ড (PIN / Password)' : 'PIN / Password'}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(email.trim());
                            setResetErrorMessage(null);
                            setResetSuccessMessage(null);
                            setResetStep('input');
                            setIsForgotModalOpen(true);
                          }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                        >
                          {language === 'bn' ? 'পিন/পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot PIN/Password?'}
                        </button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Lock size={18} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={language === 'bn' ? 'আপনার পিন বা পাসওয়ার্ড লিখুন' : 'Enter your PIN or Password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-11 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50/50 focus:bg-white font-medium"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          title={showPassword ? (language === 'bn' ? 'লুকান' : 'Hide') : language === 'bn' ? 'দেখুন' : 'Show'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Login Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all disabled:opacity-50 shadow-md shadow-emerald-700/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 text-sm cursor-pointer"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {language === 'bn' ? 'লগইন হচ্ছে...' : 'Signing In...'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <ShieldCheck size={18} />
                          <span>{language === 'bn' ? 'লগইন করে খামারে প্রবেশ করুন' : 'Sign In to Farm'}</span>
                        </span>
                      )}
                    </button>
                  </>
                )}
              </form>
        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-500">
            {language === 'bn' ? 'লগইন করার মাধ্যমে আপনি আমাদের ' : 'By signing in, you agree to our '}
            <Link
              to="/privacy-policy"
              className="text-emerald-700 font-semibold hover:underline"
            >
              {language === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}
            </Link>
            {language === 'bn' ? ' মেনে নিচ্ছেন।' : '.'}
          </p>
        </div>
      </div>

      {/* Forgot / Reset PIN Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsForgotModalOpen(false);
                setResetSuccessMessage(null);
                setResetErrorMessage(null);
                setResetStep('input');
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
                {resetStep === 'new_password' ? (
                  <Lock size={24} />
                ) : resetStep === 'success' ? (
                  <CheckCircle2 size={24} className="text-emerald-600" />
                ) : resetStep === 'sent' ? (
                  <Sparkles size={24} />
                ) : (
                  <KeyRound size={24} />
                )}
              </div>

              <h3 className="text-lg font-black text-gray-800">
                {resetStep === 'new_password'
                  ? language === 'bn'
                    ? 'নতুন পিন দিন'
                    : 'Set New PIN'
                  : resetStep === 'success'
                  ? language === 'bn'
                    ? 'পিন সফলভাবে সেট হয়েছে!'
                    : 'PIN Reset Successful!'
                  : resetStep === 'sent'
                  ? language === 'bn'
                    ? 'রিসেট লিংক পাঠানো হয়েছে'
                    : 'Reset Link Sent'
                  : language === 'bn'
                  ? 'পিন রিসেট করুন'
                  : 'Reset PIN'}
              </h3>

              <p className="text-xs text-gray-500 mt-0.5">
                {resetStep === 'new_password'
                  ? language === 'bn'
                    ? 'আপনার অ্যাকাউন্টের জন্য নতুন ৬-সংখ্যার পিন লিখুন'
                    : 'Enter a new 6-digit PIN for your account'
                  : resetStep === 'success'
                  ? language === 'bn'
                    ? 'অভিনন্দন! আপনার নতুন পিন দিয়ে এখন খামারে প্রবেশ করুন'
                    : 'Congratulations! You can now log in with your new PIN'
                  : resetStep === 'sent'
                  ? language === 'bn'
                    ? 'আপনার জিমেইল ইনবক্স চেক করে পাসওয়ার্ড রিসেট করুন'
                    : 'Check your Gmail inbox to reset your password'
                  : language === 'bn'
                  ? 'আপনার নিবন্ধিত জিমেইল ঠিকানা দিন'
                  : 'Enter your registered Gmail address'}
              </p>
            </div>

            {/* Error Message Box */}
            {resetErrorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 mb-4 text-xs text-red-900 leading-relaxed flex items-start gap-2 animate-in fade-in duration-150">
                <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={16} />
                <p>{resetErrorMessage}</p>
              </div>
            )}

            {/* STEP 1: INPUT EMAIL */}
            {resetStep === 'input' && (
              <div>
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
                      {language === 'bn' ? 'নিবন্ধিত জিমেইল / ইমেইল ঠিকানা' : 'Registered Gmail / Email Address'}
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail size={18} />
                      </div>

                      <input
                        type="email"
                        placeholder={language === 'bn' ? 'যেমন: yourname@gmail.com' : 'e.g. yourname@gmail.com'}
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-11 pr-4 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-gray-50/50 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 text-[11px] text-emerald-950 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <Sparkles size={14} className="text-emerald-600" />
                      {language === 'bn' ? 'নিরাপদ রিসেট পদ্ধতি:' : 'Secure Reset Instructions:'}
                    </p>
                    <p>
                      {language === 'bn'
                        ? '• আপনার জিমেইল ঠিকানায় সরাসরি গুগলের পাসওয়ার্ড পরিবর্তনের লিংক যাবে।'
                        : '• A direct Google password reset link will be sent to your Gmail.'}
                    </p>
                    <p>
                      {language === 'bn'
                        ? '• লিংকে ক্লিক করে নতুন ৬-ডিজিটের পিন দিলেই সাথে সাথে লগইন করতে পারবেন।'
                        : '• Click the link in your email to set a new 6-digit PIN and log in immediately.'}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(false);
                        setResetSuccessMessage(null);
                        setResetErrorMessage(null);
                      }}
                      className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all cursor-pointer"
                    >
                      {language === 'bn' ? 'ফিরে যান' : 'Cancel'}
                    </button>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Mail size={15} />
                      {resetLoading
                        ? language === 'bn'
                          ? 'যাচাই হচ্ছে...'
                          : 'Verifying...'
                        : language === 'bn'
                        ? 'রিসেট লিংক পাঠান'
                        : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: EMAIL LINK SENT */}
            {resetStep === 'sent' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold text-emerald-900 mb-1">
                        {resetSuccessMessage || (language === 'bn' ? 'অনুরোধ সফলভাবে গৃহীত হয়েছে!' : 'Request received successfully!')}
                      </p>
                      <p className="text-emerald-800 text-[11px]">
                        {language === 'bn'
                          ? 'আপনার ইনবক্স অথবা স্প্যাম (Spam) ফোল্ডারের লিংকে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।'
                          : 'Click the link in your inbox or spam folder to reset your password.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-700/20"
                  >
                    <Mail size={16} />
                    {language === 'bn' ? 'জিমেইল ইনবক্স খুলুন' : 'Open Gmail Inbox'}
                    <ExternalLink size={14} />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail(resetEmail);
                      setIsForgotModalOpen(false);
                      setResetStep('input');
                    }}
                    className="w-full py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all cursor-pointer"
                  >
                    {language === 'bn' ? 'লগইন পেজে যান' : 'Go to Login'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResetStep('input');
                      setResetSuccessMessage(null);
                      setResetErrorMessage(null);
                    }}
                    className="w-full text-center text-xs text-emerald-700 hover:underline pt-1 cursor-pointer"
                  >
                    {language === 'bn' ? '← ইমেইল পরিবর্তন করতে চান?' : '← Change email address?'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SET NEW PIN (via email reset link) */}
            {resetStep === 'new_password' && (
              <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                {resetEmail && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 text-xs text-gray-600 flex items-center justify-between">
                    <span className="font-medium">{language === 'bn' ? 'অ্যাকাউন্ট:' : 'Account:'}</span>
                    <span className="font-bold text-gray-800 truncate max-w-[200px]">{resetEmail}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
                    {language === 'bn' ? 'নতুন পিন বা পাসওয়ার্ড' : 'New PIN / Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showNewResetPassword ? 'text' : 'password'}
                      placeholder={language === 'bn' ? 'কমপক্ষে ৬ ডিজিটের পিন বা পাসওয়ার্ড' : 'At least 6 characters PIN or Password'}
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      className="w-full pl-11 pr-11 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-gray-50/50 focus:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewResetPassword(!showNewResetPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showNewResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
                    {language === 'bn' ? 'পিন / পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm PIN / Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showNewResetPassword ? 'text' : 'password'}
                      placeholder={language === 'bn' ? 'একই পিন বা পাসওয়ার্ড পুনরায় লিখুন' : 'Re-enter same PIN or Password'}
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      className="w-full pl-11 pr-11 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-gray-50/50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setResetStep('input');
                    }}
                    className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all cursor-pointer"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={16} />
                    {resetLoading
                      ? language === 'bn'
                        ? 'সংরক্ষণ হচ্ছে...'
                        : 'Saving...'
                      : language === 'bn'
                      ? 'সংরক্ষণ করুন'
                      : 'Save'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: SUCCESS */}
            {resetStep === 'success' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 text-base mb-1">
                    {language === 'bn' ? 'পিন সফলভাবে আপডেট হয়েছে!' : 'PIN Updated Successfully!'}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    {language === 'bn'
                      ? 'আপনার নতুন ৬-সংখ্যার পিন দিয়ে এখন খামারে সরাসরি লগইন করতে পারেন।'
                      : 'You can now log in to your farm account using your new 6-digit PIN.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (resetEmail) {
                      setEmail(resetEmail);
                    }
                    if (newResetPassword) {
                      setPassword(newResetPassword);
                    }
                    setMode('login');
                    setIsForgotModalOpen(false);
                    setResetStep('input');
                  }}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-emerald-700/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  {language === 'bn' ? 'এখনই লগইন করুন' : 'Log In Now'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
