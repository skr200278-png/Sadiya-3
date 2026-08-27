import React, { useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  Smartphone,
  HelpCircle,
  KeyRound,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
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

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const formatAuthIdentifier = (raw: string) => {
    const clean = raw.trim();

    if (clean.includes('@')) {
      return {
        authEmail: clean.toLowerCase(),
        isPhone: false,
        phone: '',
        email: clean.toLowerCase()
      };
    }

    const digits = clean.replace(/\D/g, '');

    return {
      authEmail: `phone_${digits}@digitalfarm.app`,
      isPhone: true,
      phone: clean,
      email: ''
    };
  };

  const bootstrapUser = async (
    uid: string,
    displayName: string | null = null,
    phone: string | null = null,
    email: string | null = null
  ) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          userId: uid,
          name: displayName || 'খামারি',
          phone: phone || '',
          email: email || '',
          farmName: '',
          createdAt: new Date().toISOString()
        });
      } else {
        const existingData = snap.data();
        const updatePayload: any = {};

        if (phone && !existingData.phone) {
          updatePayload.phone = phone;
        }

        if (email && !existingData.email) {
          updatePayload.email = email;
        }

        if (Object.keys(updatePayload).length > 0) {
          await setDoc(userRef, updatePayload, { merge: true });
        }
      }
    } catch (err) {
      console.warn(
        'Bootstrap user document write skipped or offline:',
        err
      );
    }
  };

  /*
   * GOOGLE LOGIN
   *
   * Important:
   * We intentionally use signInWithPopup only here.
   * The old redirect flow was causing the
   * "missing initial state" problem in some mobile/WebView environments.
   */
  const handleGoogleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setUnauthorizedDomain(null);
    setErrorMessage(null);

    try {
      // Try persistent Firebase auth state.
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        try {
          await setPersistence(auth, indexedDBLocalPersistence);
        } catch (persistenceError) {
          console.warn(
            'Firebase persistence unavailable:',
            persistenceError
          );
        }
      }

      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);

      if (!result || !result.user) {
        throw new Error('Google user information পাওয়া যায়নি।');
      }

      await bootstrapUser(
        result.user.uid,
        result.user.displayName,
        (result.user as any).phoneNumber || null,
        result.user.email
      );

      toast.success('সফলভাবে গুগল দিয়ে লগইন হয়েছে!');

      navigate('/', {
        replace: true
      });

    } catch (error: any) {
      console.error('Google Auth Error:', error);

      const errCode = error?.code || '';
      const errMsg = error?.message || '';

      if (errCode === 'auth/popup-closed-by-user') {
        setErrorMessage(
          'Google Login উইন্ডো বন্ধ হয়ে গেছে। আবার Google দিয়ে লগইন করুন।'
        );

        toast.error('Google Login উইন্ডো বন্ধ হয়েছে।');

      } else if (errCode === 'auth/popup-blocked') {
        setErrorMessage(
          'ব্রাউজার Google Login popup ব্লক করেছে। ব্রাউজারে popup অনুমতি দিয়ে আবার চেষ্টা করুন।'
        );

        toast.error('Google popup ব্লক করা হয়েছে।');

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
          'ইন্টারনেট সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
        );

        toast.error('নেটওয়ার্ক সমস্যা।');

      } else if (errCode === 'auth/cancelled-popup-request') {
        setErrorMessage(
          'একটি Google Login request ইতিমধ্যে চলছে। কয়েক সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।'
        );

        toast.error('Google Login request চলছে।');

      } else if (errCode === 'auth/web-storage-unsupported') {
        setErrorMessage(
          'এই ব্রাউজারে Firebase authentication storage কাজ করছে না। সাধারণ Chrome browser-এ আবার চেষ্টা করুন।'
        );

        toast.error('Browser storage সমস্যা।');

      } else {
        setErrorMessage(
          `Google Login ব্যর্থ হয়েছে (${errCode || 'Error'}): ${errMsg}`
        );

        toast.error('Google Login করা যায়নি।');
      }

    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier || !password) {
      toast.error(
        'মোবাইল নাম্বার/ইমেইল এবং পাসওয়ার্ড দিন।'
      );
      return;
    }

    const {
      authEmail,
      isPhone,
      phone,
      email: userEmail
    } = formatAuthIdentifier(cleanIdentifier);

    if (isPhone) {
      const digits = cleanIdentifier.replace(/\D/g, '');

      if (digits.length < 10) {
        toast.error(
          'সঠিক মোবাইল নাম্বার দিন (কমপক্ষে ১০-১১ ডিজিট)'
        );
        return;
      }
    }

    if (password.length < 6) {
      toast.error(
        'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
      );
      return;
    }

    if (mode === 'register' && !name.trim()) {
      toast.error('আপনার পুরো নাম লিখুন।');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setUnauthorizedDomain(null);

    try {
      if (mode === 'register') {
        const result =
          await createUserWithEmailAndPassword(
            auth,
            authEmail,
            password
          );

        await bootstrapUser(
          result.user.uid,
          name.trim(),
          isPhone ? phone : null,
          isPhone ? null : userEmail
        );

        toast.success(
          'সফলভাবে অ্যাকাউন্ট তৈরি ও লগইন হয়েছে!'
        );

        navigate('/', {
          replace: true
        });

      } else {
        const result =
          await signInWithEmailAndPassword(
            auth,
            authEmail,
            password
          );

        await bootstrapUser(
          result.user.uid,
          result.user.displayName,
          isPhone ? phone : null,
          isPhone ? null : userEmail
        );

        toast.success(
          'সফলভাবে লগইন হয়েছে!'
        );

        navigate('/', {
          replace: true
        });
      }

    } catch (error: any) {
      console.error('Auth Error:', error);

      const errCode = error?.code || '';
      const errMsg = error?.message || '';

      if (errCode === 'auth/email-already-in-use') {
        setErrorMessage(
          isPhone
            ? 'এই মোবাইল নাম্বার দিয়ে আগেই অ্যাকাউন্ট খোলা আছে। "লগইন" ট্যাবে গিয়ে পাসওয়ার্ড দিয়ে লগইন করুন।'
            : 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে। "লগইন" ট্যাবে গিয়ে পাসওয়ার্ড দিয়ে লগইন করুন।'
        );

        toast.error(
          'অ্যাকাউন্টটি আগেই তৈরি করা আছে। লগইন করুন।'
        );

      } else if (
        errCode === 'auth/wrong-password' ||
        errCode === 'auth/user-not-found' ||
        errCode === 'auth/invalid-credential'
      ) {
        setErrorMessage(
          'মোবাইল নাম্বার/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। দয়া করে সঠিক তথ্য দিন।'
        );

        toast.error(
          'ভুল মোবাইল/ইমেইল বা পাসওয়ার্ড!'
        );

      } else if (errCode === 'auth/invalid-email') {
        setErrorMessage(
          'মোবাইল নাম্বার অথবা ইমেইল ফরম্যাট সঠিক নয়।'
        );

        toast.error(
          'অকার্যকর নাম্বার বা ইমেইল!'
        );

      } else if (errCode === 'auth/weak-password') {
        setErrorMessage(
          'পাসওয়ার্ডটি খুব দুর্বল। অন্তত ৬ অক্ষরের বা সংখ্যার পাসওয়ার্ড দিন।'
        );

        toast.error(
          'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।'
        );

      } else if (errCode === 'auth/operation-not-allowed') {
        setErrorMessage(
          'Firebase Console > Authentication > Sign-in method-এ Email/Password অথেনটিকেশন Enable করা নেই।'
        );

        toast.error(
          'লগইন ফায়ারবেজে চালু নেই।'
        );

      } else if (errCode === 'auth/network-request-failed') {
        setErrorMessage(
          'ইন্টারনেট সংযোগে ত্রুটি। আবার চেষ্টা করুন।'
        );

        toast.error(
          'ইন্টারনেট সংযোগ চেক করুন।'
        );

      } else {
        setErrorMessage(
          `সমস্যা হয়েছে (${errCode || 'Error'}): ${errMsg}`
        );

        toast.error(
          'লগইন সম্পন্ন করা যায়নি।'
        );
      }

    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const clean = resetIdentifier.trim();

    if (!clean) {
      setResetErrorMessage(
        'আপনার মোবাইল নাম্বার অথবা ইমেইল দিন।'
      );
      return;
    }

    setResetLoading(true);
    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    const {
      authEmail,
      isPhone,
      phone
    } = formatAuthIdentifier(clean);

    try {
      if (!isPhone) {
        await sendPasswordResetEmail(
          auth,
          authEmail
        );

        setResetSuccessMessage(
          `আপনার ইমেইল (${clean})-এ পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে! অনুগ্রহ করে আপনার ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।`
        );

        toast.success(
          'পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে!'
        );

      } else {
        setResetSuccessMessage(
          `মোবাইল নাম্বার (${phone})-এর অ্যাকাউন্টটি সুরক্ষিত রয়েছে। আপনার পাসওয়ার্ড তাৎক্ষণিক রিসেট করতে বা নতুন পাসওয়ার্ড সেট করতে আমাদের খামারি হেল্পডেস্কে সরাসরি যোগাযোগ করুন।`
        );

        toast.success(
          'মোবাইল অ্যাকাউন্ট চিহ্নিত হয়েছে'
        );
      }

    } catch (error: any) {
      console.error(
        'Password reset error:',
        error
      );

      const code = error?.code || '';

      if (code === 'auth/user-not-found') {
        setResetErrorMessage(
          'এই ইমেইল/নাম্বারে কোনো খামার অ্যাকাউন্ট পাওয়া যায়নি। সঠিক তথ্য দিন।'
        );

      } else if (code === 'auth/invalid-email') {
        setResetErrorMessage(
          'সঠিক ইমেইল অথবা মোবাইল নাম্বার দিন।'
        );

      } else {
        setResetErrorMessage(
          'পাসওয়ার্ড রিসেট রিকোয়েস্ট পাঠানো যায়নি। ইন্টারনেট চেক করে আবার চেষ্টা করুন।'
        );
      }

    } finally {
      setResetLoading(false);
    }
  };

  const openInNewTab = () => {
    window.open(
      window.location.href,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-gray-50 to-green-50 p-4">

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

        <div className="bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 p-7 text-center relative">

          <div className="w-18 h-18 bg-white/95 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/10 transform rotate-[-2deg] p-1 overflow-hidden">

            <img
              src={appLogo}
              onError={(e) => {
                e.currentTarget.src =
                  '/farm_app_icon_1779214389225.png';
              }}
              alt="Khamar Pro Logo"
              className="w-full h-full object-contain rounded-xl"
            />

          </div>

          <h1 className="text-2xl font-black text-white tracking-wide">
            ডিজিটাল খামার প্রো
          </h1>

          <p className="text-emerald-100 text-xs mt-1 font-medium">
            পাখি, পশু ও মাছের স্মার্ট খামার ব্যবস্থাপনা
          </p>

          {isInIframe && (
            <button
              type="button"
              onClick={openInNewTab}
              className="mt-3 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold py-1.5 px-3 rounded-full backdrop-blur-sm transition-all cursor-pointer"
              title="নতুন ব্রাউজার ট্যাবে খুলুন"
            >
              <ExternalLink size={13} />
              <span>
                পপ-আপ সমস্যায় নতুন ট্যাবে খুলুন
              </span>
            </button>
          )}

        </div>

        <div className="p-6 md:p-8">

          <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 border border-gray-200">

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              লগইন (Sign In)
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              নতুন রেজিস্ট্রেশন (Sign Up)
            </button>

          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 text-xs text-red-900 font-medium">

              <div className="flex items-start gap-2.5">

                <AlertTriangle
                  className="text-red-600 shrink-0 mt-0.5"
                  size={17}
                />

                <div className="space-y-1">

                  <p className="font-bold text-red-950">
                    লগইন সমস্যা:
                  </p>

                  <p className="leading-relaxed">
                    {errorMessage}
                  </p>

                  {unauthorizedDomain && (
                    <p className="text-[10px] break-all mt-2">
                      Domain: {unauthorizedDomain}
                    </p>
                  )}

                </div>

              </div>

            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-800 font-bold py-3 px-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-all disabled:opacity-50 shadow-sm mb-5 group cursor-pointer"
          >

            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5 group-hover:scale-110 transition-transform"
            />

            <span>
              {loading
                ? 'অপেক্ষা করুন...'
                : 'গুগল (Google) দিয়ে ১-ক্লিকে প্রবেশ'}
            </span>

          </button>

          <div className="relative flex items-center py-2 mb-5">

            <div className="flex-grow border-t border-gray-200" />

            <span className="flex-shrink-0 mx-3 text-gray-400 text-xs font-semibold uppercase tracking-wider">
              অথবা নাম্বার / ইমেইল দিয়ে
            </span>

            <div className="flex-grow border-t border-gray-200" />

          </div>

          <form
            onSubmit={handleAuthSubmit}
            className="space-y-4"
          >

            {mode === 'register' && (
              <div>

                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  আপনার পুরো নাম
                </label>

                <div className="relative">

                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <UserPlus size={18} />
                  </div>

                  <input
                    type="text"
                    placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    className="w-full pl-11 pr-4 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50/50 focus:bg-white font-medium"
                    required
                  />

                </div>

              </div>
            )}

            <div>

              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                মোবাইল নাম্বার অথবা ইমেইল
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">

                  {identifier.includes('@')
                    ? <Mail size={18} />
                    : <Smartphone size={18} />}

                </div>

                <input
                  type="text"
                  placeholder="যেমন: 017XXXXXXXX অথবা your@gmail.com"
                  value={identifier}
                  onChange={(e) =>
                    setIdentifier(e.target.value)
                  }
                  className="w-full pl-11 pr-4 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50/50 focus:bg-white font-medium"
                  required
                />

              </div>

              <p className="text-[11px] text-gray-400 mt-1 pl-1">
                সহজেই ১১ ডিজিটের মোবাইল নাম্বার অথবা ইমেইল দিয়ে কাজ করুন।
              </p>

            </div>

            <div>

              <div className="flex items-center justify-between mb-1.5">

                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  পাসওয়ার্ড
                </label>

                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetIdentifier(identifier);
                      setResetErrorMessage(null);
                      setResetSuccessMessage(null);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                )}

              </div>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="কমপক্ষে ৬ অক্ষরের বা সংখ্যার পাসওয়ার্ড"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="w-full pl-11 pr-11 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50/50 focus:bg-white font-medium"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title={
                    showPassword
                      ? 'পাসওয়ার্ড লুকান'
                      : 'পাসওয়ার্ড দেখুন'
                  }
                >
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />}
                </button>

              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all disabled:opacity-50 shadow-md shadow-emerald-700/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 text-sm cursor-pointer"
            >

              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  অপেক্ষা করুন...
                </span>
              ) : mode === 'register' ? (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  নতুন অ্যাকাউন্ট তৈরি করুন
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={18} />
                  লগইন করে খামারে প্রবেশ করুন
                </span>
              )}

            </button>

          </form>

        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-4 text-center">

          <p className="text-xs text-gray-500">

            লগইন করার মাধ্যমে আপনি আমাদের{' '}

            <Link
              to="/privacy-policy"
              className="text-emerald-700 font-semibold hover:underline"
            >
              গোপনীয়তা নীতি (Privacy Policy)
            </Link>

            {' '}মেনে নিচ্ছেন।

          </p>

        </div>

      </div>

      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">

            <button
              onClick={() =>
                setIsForgotModalOpen(false)
              }
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-5">

              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <KeyRound size={24} />
              </div>

              <h3 className="text-lg font-black text-gray-800">
                পাসওয়ার্ড রিসেট ও রিকভারি
              </h3>

              <p className="text-xs text-gray-500 mt-0.5">
                আপনার খামার অ্যাকাউন্টের মোবাইল নাম্বার বা ইমেইল দিন
              </p>

            </div>

            {resetSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 text-xs text-emerald-900 leading-relaxed">

                <div className="flex items-start gap-2">

                  <CheckCircle2
                    className="text-emerald-600 shrink-0 mt-0.5"
                    size={16}
                  />

                  <p>
                    {resetSuccessMessage}
                  </p>

                </div>

              </div>
            )}

            {resetErrorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-xs text-red-900 leading-relaxed">

                <div className="flex items-start gap-2">

                  <AlertTriangle
                    className="text-red-600 shrink-0 mt-0.5"
                    size={16}
                  />

                  <p>
                    {resetErrorMessage}
                  </p>

                </div>

              </div>
            )}

            <form
              onSubmit={handleForgotPasswordSubmit}
              className="space-y-4"
            >

              <div>

                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
                  মোবাইল নাম্বার অথবা ইমেইল
                </label>

                <div className="relative">

                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">

                    {resetIdentifier.includes('@')
                      ? <Mail size={18} />
                      : <Smartphone size={18} />}

                  </div>

                  <input
                    type="text"
                    placeholder="যেমন: 017XXXXXXXX অথবা your@gmail.com"
                    value={resetIdentifier}
                    onChange={(e) =>
                      setResetIdentifier(
                        e.target.value
                      )
                    }
                    className="w-full pl-11 pr-4 border border-gray-200 rounded-2xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    required
                  />

                </div>

              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">

                <p className="font-bold text-slate-800 flex items-center gap-1">

                  <HelpCircle
                    size={14}
                    className="text-emerald-600"
                  />

                  পাসওয়ার্ড রিসেট নিয়মাবলী:

                </p>

                <p>
                  • <strong>ইমেইল দিলে:</strong> পাসওয়ার্ড বদলানোর সরাসরি লিংক আপনার ইমেইলে চলে যাবে।
                </p>

                <p>
                  • <strong>মোবাইল নাম্বার দিলে:</strong> তাৎক্ষণিক সহায়তার জন্য হেল্পলাইনে যোগাযোগ করতে পারেন।
                </p>

              </div>

              <div className="flex gap-2 pt-1">

                <button
                  type="button"
                  onClick={() =>
                    setIsForgotModalOpen(false)
                  }
                  className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all cursor-pointer"
                >
                  ফিরে যান
                </button>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading
                    ? 'অপেক্ষা করুন...'
                    : 'রিসেট অনুরোধ পাঠান'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
