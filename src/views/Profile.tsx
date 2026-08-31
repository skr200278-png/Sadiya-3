import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, deleteUser, updatePassword } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType, offlineSafeDocWrite, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { User, LogOut, CheckCircle, Settings, HelpCircle, Info, Globe, ChevronRight, X, MessageCircle, Phone, Mail, ExternalLink, ShieldCheck, FileText, KeyRound, Stethoscope, Crown, Sparkles, CreditCard, Zap, Trash2, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { demoStore } from '../utils/demoStore';
import appLogo from '../assets/images/farm_app_icon_1779214389225.png';
import AdminFeatureControlCard from '../components/AdminFeatureControlCard';

export default function Profile() {
  const { currentUser, logout, isDemoUser } = useAuth();
  const { language: currentLanguage, setLanguage: setGlobalLanguage, t } = useLanguage();
  const { isPremium, isAdmin, userSubscription, openSubscriptionModal, config } = useSystemConfig();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const submitLock = useRef(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [language, setLanguage] = useState<Language>(currentLanguage);
  const [showDeveloperSupport, setShowDeveloperSupport] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinVisibility, setShowPinVisibility] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);

  useEffect(() => {
    setLanguage(currentLanguage);
  }, [currentLanguage]);

  const isDemo = Boolean(isDemoUser || currentUser?.uid === 'demo_khamari_user_1' || !auth.currentUser);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.displayName && !name) setName(currentUser.displayName);
      fetchProfile();
    }
  }, [currentUser, isDemoUser]);

  const fetchProfile = async () => {
    if (!currentUser) return;
    try {
      if (isDemo) {
        const data = demoStore.getProfile();
        if (data.name) setName(data.name);
        if (data.phone) setPhone(data.phone);
        if (data.farmName) setFarmName(data.farmName);
        if (data.language) setLanguage(data.language as Language);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.name) setName(data.name);
        if (data.phone) setPhone(data.phone);
        if (data.farmName) setFarmName(data.farmName);
        if (data.language) setLanguage(data.language);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isSubmitting || submitLock.current) return;
    setIsSubmitting(true);
    submitLock.current = true;
    
    try {
      if (isDemo) {
        demoStore.setProfile({
          name,
          phone,
          farmName,
          language
        });
        setGlobalLanguage(language as Language);
        toast.success(currentLanguage === 'en' ? 'Profile updated!' : 'প্রোফাইল আপডেট হয়েছে!');
        setIsSubmitting(false);
        submitLock.current = false;
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userRef);
      
      const payload = {
        userId: currentUser.uid,
        name,
        phone,
        farmName,
        language,
        updatedAt: new Date().toISOString()
      };

      if (docSnap.exists()) {
        await offlineSafeDocWrite(updateDoc(userRef, {
          name,
          phone,
          farmName,
          language,
          updatedAt: new Date().toISOString()
        }));
      } else {
        await offlineSafeDocWrite(setDoc(userRef, {
          ...payload,
          createdAt: new Date().toISOString()
        }));
      }
      
      setGlobalLanguage(language as Language);
      toast.success(currentLanguage === 'en' ? 'Profile updated!' : 'প্রোফাইল আপডেট হয়েছে!');
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('common.error'));
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    if (isDemo) {
      toast.success(language === 'bn' ? 'ডেমো অ্যাকাউন্ট রিসেট সম্পন্ন হয়েছে।' : 'Demo account reset successfully.');
      demoStore.clearAllData();
      await logout();
      navigate('/login');
      return;
    }

    if (!currentUser) return;

    try {
      setIsDeletingAccount(true);
      const uid = currentUser.uid;

      // 1. Delete user record in firestore
      try {
        await offlineSafeDocWrite(deleteDoc(doc(db, 'users', uid)));
      } catch (e) {
        console.warn('Could not delete user document:', e);
      }

      // 2. Delete user's active batches and associated basic records
      try {
        const collectionsToClean = ['batches', 'expenses', 'sales', 'dues', 'feed_records', 'mortality', 'medicine_records'];
        for (const colName of collectionsToClean) {
          const q = query(collection(db, colName), where('userId', '==', uid));
          const snapshot = await fastGetDocs(q);
          const deletePromises = snapshot.docs.map(d => offlineSafeDocWrite(deleteDoc(doc(db, colName, d.id))));
          await Promise.allSettled(deletePromises);
        }
      } catch (cleanupErr) {
        console.warn('Batch data cleanup warning:', cleanupErr);
      }

      // 3. Delete Firebase Auth User
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (authDeleteErr: any) {
          console.warn('Auth delete user error (might need re-auth):', authDeleteErr);
          if (authDeleteErr.code === 'auth/requires-recent-login') {
            toast.error(
              language === 'bn' 
                ? 'নিরাপত্তার স্বার্থে অনুগ্রহ করে একবার লগআউট করে পুনরায় লগইন করে অ্যাকাউন্ট ডিলিট করুন।' 
                : 'Please log out and log in again to delete your account.'
            );
            setIsDeletingAccount(false);
            setShowDeleteConfirm(false);
            return;
          }
        }
      }

      toast.success(
        language === 'bn' 
          ? 'আপনার অ্যাকাউন্ট এবং সমস্ত তথ্য সফলভাবে মুছে ফেলা হয়েছে।' 
          : 'Your account and all data have been deleted successfully.'
      );
      await logout();
      navigate('/login');
    } catch (err: any) {
      console.error('Delete account error:', err);
      toast.error(err.message || (language === 'bn' ? 'অ্যাকাউন্ট ডিলিট করতে সমস্যা হয়েছে।' : 'Failed to delete account.'));
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleOpenPinModal = () => {
    setNewPin('');
    setConfirmPin('');
    setShowPinModal(true);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = newPin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanPin) {
      toast.error(language === 'bn' ? 'নতুন ৪-সংখ্যার পিন বা পাসওয়ার্ড লিখুন।' : 'Please enter your new PIN or password.');
      return;
    }

    if (cleanPin.length < 4) {
      toast.error(language === 'bn' ? 'পিন কমপক্ষে ৪ সংখ্যার হতে হবে।' : 'PIN must be at least 4 characters.');
      return;
    }

    if (cleanPin !== cleanConfirm) {
      toast.error(language === 'bn' ? 'উভয় ঘরে একই পিন দিন।' : 'PINs do not match.');
      return;
    }

    if (isDemo) {
      toast.success(language === 'bn' ? 'ডেমো মোডে পিন সফলভাবে পরিবর্তন হয়েছে!' : 'PIN updated in Demo Mode!');
      setShowPinModal(false);
      return;
    }

    try {
      setIsSavingPin(true);
      const effectivePassword = cleanPin.length < 6 ? `df_pin_${cleanPin}` : cleanPin;

      if (auth.currentUser) {
        await updatePassword(auth.currentUser, effectivePassword);
      }

      // Also save encrypted / hint if user profile doc exists
      if (currentUser?.uid) {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { 
          hasCustomPin: true,
          pinUpdatedAt: new Date().toISOString()
        }, { merge: true });
      }

      toast.success(language === 'bn' ? '✅ আপনার নতুন পিন/পাসওয়ার্ড সফলভাবে সংরক্ষণ করা হয়েছে!' : 'PIN/Password updated successfully!');
      setShowPinModal(false);
    } catch (err: any) {
      console.error('Update PIN error:', err);
      const code = err?.code || '';
      if (code === 'auth/requires-recent-login') {
        toast.error(
          language === 'bn'
            ? 'নিরাপত্তার স্বার্থে অ্যাপ থেকে একবার লগআউট করে পুনরায় লগইন করে পিন পরিবর্তন করুন।'
            : 'Please log out and log in again to change your PIN securely.'
        );
      } else {
        toast.error(err.message || (language === 'bn' ? 'পিন পরিবর্তন করা যায়নি।' : 'Failed to update PIN.'));
      }
    } finally {
      setIsSavingPin(false);
    }
  };

  if (loading) return <div className="text-center py-10">{t('common.loading')}</div>;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="text-blue-500" /> {t('menu.profile')}
        </h2>
        <button 
          onClick={handleLogout}
          className="text-red-500 hover:bg-red-50 p-2 rounded-lg flex items-center gap-1 text-sm font-semibold"
        >
          <LogOut size={18} /> {t('profile.logout')} 
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
        <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-3">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
             <User size={40} />
          )}
        </div>
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-1.5">
          {name || (currentLanguage === 'en' ? 'Name not set' : 'নাম সেট করা নেই')}
          {isPremium && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
              <Crown size={11} className="text-amber-600" /> VIP
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-500">
          {currentUser?.email?.includes('@digitalfarm.app') 
            ? (phone ? `মোবাইল: ${phone}` : 'মোবাইল অ্যাকাউন্ট') 
            : (currentUser?.email || (phone ? `মোবাইল: ${phone}` : ''))}
        </p>
      </div>

      {/* VIP Membership / Plan Status Card for All Users */}
      <div className={`p-4 rounded-2xl shadow-sm border transition-all ${
        isPremium
          ? 'bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-slate-900/5 border-amber-300'
          : 'bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white border-slate-700'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
              isPremium ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-white/10 text-amber-300'
            }`}>
              <Crown size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-black ${isPremium ? 'text-amber-900' : 'text-amber-300'}`}>
                  {isPremium 
                    ? (currentLanguage === 'bn' ? '💎 ভিআইপি প্রো মেম্বারশিপ সক্রিয়' : '💎 VIP PRO Membership Active')
                    : (currentLanguage === 'bn' ? '🚀 ডিজিটাল খামার প্রো প্রিমিয়াম প্যাকেজ' : '🚀 Digital Khamar Pro Premium Packages')}
                </h4>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                  isPremium ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-400 text-slate-950'
                }`}>
                  {isPremium ? (currentLanguage === 'bn' ? 'আনলকড' : 'UNLOCKED') : (currentLanguage === 'bn' ? 'প্রো সুবিধা' : 'PRO')}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isPremium ? 'text-gray-600' : 'text-slate-300'}`}>
                {isPremium 
                  ? (userSubscription?.isLifetime || userSubscription?.expiresAt === 'lifetime'
                      ? (currentLanguage === 'bn' ? 'আজীবন আনলিমিটেড লাইসেন্স সক্রিয়' : 'Lifetime unlimited license active')
                      : (currentLanguage === 'bn' 
                          ? `মেয়াদ: ${userSubscription?.expiresAt ? new Date(userSubscription.expiresAt).toLocaleDateString('bn-BD') : 'সক্রিয়'}`
                          : `Expires: ${userSubscription?.expiresAt ? new Date(userSubscription.expiresAt).toLocaleDateString() : 'Active'}`))
                  : (currentLanguage === 'bn' 
                      ? 'বিজ্ঞাপন পোস্ট, বকেয়া খাতা, এক্সেল রিপোর্ট ও ভিআইপি খামার ব্যবস্থাপনা' 
                      : 'Ad posting, dues khata, excel export & VIP farm management')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center justify-between gap-2">
          <span className={`text-[11px] font-semibold ${isPremium ? 'text-amber-900' : 'text-slate-400'}`}>
            {config.monetizationEnabled !== false 
              ? (currentLanguage === 'bn' ? 'প্যাকেজ ও স্পনসর বিজ্ঞাপন অপশন' : 'Plans & advertisement options')
              : (currentLanguage === 'bn' ? 'সকল প্রো ফিচার বর্তমানে ফ্রি' : 'All PRO features currently free')}
          </span>

          <button
            type="button"
            onClick={() => openSubscriptionModal(currentLanguage === 'bn' ? 'ডিজিটাল খামার প্রো প্রিমিয়াম প্যাকেজ' : 'Digital Khamar Pro Premium')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
              isPremium 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
            }`}
          >
            <Sparkles size={13} />
            <span>
              {isPremium 
                ? (currentLanguage === 'bn' ? 'প্যাকেজ বিবরণী' : 'Plan Details') 
                : (currentLanguage === 'bn' ? '💎 প্রিমিয়াম আপগ্রেড' : '💎 Upgrade Pro')}
            </span>
          </button>
        </div>
      </div>

      {/* Admin Feature Controls & App Lock */}
      <AdminFeatureControlCard />

      <form onSubmit={handleSave} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">{t('profile.title')}</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.name')}</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" 
            placeholder={t('profile.name')} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.phone')}</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" 
            placeholder="017xxxxxxxx" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.farmName')}</label>
          <input 
            type="text" 
            value={farmName} 
            onChange={(e) => setFarmName(e.target.value)} 
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" 
            placeholder={t('profile.farmNamePlaceholder')}
            autoComplete="off"
            id="farmName-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
             <Globe size={16} className="text-gray-500"/> {t('profile.appLanguage')}
          </label>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="bn">{t('profile.bengali')}</option>
            <option value="en">{t('profile.english')}</option>
          </select>
        </div>

        <button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-6 flex items-center justify-center gap-2 disabled:bg-gray-400">
          <CheckCircle size={20} /> {isSubmitting ? t('profile.saving') : t('profile.save')}
        </button>
      </form>

      {/* Support & About Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100 mt-4">
        <button 
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer text-left" 
          onClick={() => navigate('/doctor')}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
              <Stethoscope size={18} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-gray-800 text-sm">{language === 'bn' ? 'ডাক্তারি পরামর্শ ও টেলিমেডিসিন' : 'Veterinary Doctor Consultation'}</p>
                <span className="text-[9px] font-black bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full uppercase">
                  24/7
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {language === 'bn' ? 'বিশেষজ্ঞ ডাক্তার, হটলাইন (১৬১২৩) ও প্রেসক্রিপশন' : 'Specialist vets, hotline 16123 & prescriptions'}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>

        <button 
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer text-left" 
          onClick={handleOpenPinModal}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <KeyRound size={18} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 text-sm">{language === 'bn' ? 'পাসওয়ার্ড / ৪-ডিজিটের পিন পরিবর্তন' : 'Change Password / 4-Digit PIN'}</p>
              <p className="text-xs text-gray-500">
                {language === 'bn' ? 'আপনার অ্যাকাউন্টের পিন বা পাসওয়ার্ড পরিবর্তন করুন' : 'Update your account login PIN or password'}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>

        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors" onClick={() => setShowDeveloperSupport(true)}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 text-sm">{t('profile.support')}</p>
              <p className="text-xs text-gray-500">{t('profile.supportWait')}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>

        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors" onClick={() => setShowAbout(true)}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <Info size={18} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 text-sm">{t('profile.about')}</p>
              <p className="text-xs text-gray-500">{t('profile.aboutSub')}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>

        <button onClick={() => navigate('/privacy-policy')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 text-sm">{t('profile.privacyPolicy')}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>

        {/* Google Play Required Account Deletion Button */}
        <button 
          onClick={() => setShowDeleteConfirm(true)} 
          className="w-full flex items-center justify-between p-4 hover:bg-red-50/50 transition-colors border-t border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 size={18} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-red-600 text-sm">
                {language === 'bn' ? 'অ্যাকাউন্ট ও সকল তথ্য মুছুন' : 'Delete Account & Data'}
              </p>
              <p className="text-xs text-red-400">
                {language === 'bn' ? 'স্থায়ীভাবে অ্যাকাউন্ট ও খামারের রেকর্ড ডিলিট' : 'Permanently remove account and all records'}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-red-300" />
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 relative">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            
            <h3 className="text-lg font-black text-slate-900 mb-2">
              {language === 'bn' ? 'অ্যাকাউন্ট স্থায়ীভাবে মুছবেন?' : 'Delete Account Permanently?'}
            </h3>
            
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              {language === 'bn' 
                ? 'সতর্কতা: আপনার অ্যাকাউন্ট মুছে ফেললে খামারের সমস্ত ব্যাচ, বিক্রয়, খরচ, খাদ্য ও বকেয়া খাতার ডাটা স্থায়ীভাবে মুছে যাবে এবং তা আর পুনরুদ্ধার করা সম্ভব হবে না।'
                : 'Warning: Deleting your account will permanently wipe all batches, feed, sales, expenses, and dues data. This action cannot be undone.'}
            </p>

            <div className="space-y-2">
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <span>{language === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...'}</span>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>{language === 'bn' ? 'হ্যাঁ, সম্পূর্ণ মুছে ফেলুন' : 'Yes, Delete Everything'}</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingAccount}
                className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm"
              >
                {language === 'bn' ? 'না, বাতিল করুন' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeveloperSupport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-6 text-center relative">
              <button 
                onClick={() => setShowDeveloperSupport(false)}
                className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-2 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg p-1 border border-white/20">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=AbuSufian&backgroundColor=b6e3f4`} alt="Developer" className="w-full h-full rounded-full" />
              </div>
              <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                আবু সুফিয়ান <ShieldCheck size={20} className="text-blue-300" />
              </h3>
              <p className="text-blue-200 text-sm font-medium mt-1">লিড সফটওয়্যার ইঞ্জিনিয়ার ও ফাউন্ডার</p>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-center text-sm text-gray-600 mb-6 font-medium leading-relaxed">
                আপনার খামার পরিচালনায় যেকোনো প্রযুক্তিগত সাহায্যের জন্য অথবা নতুন ফিচার যুক্ত করতে চাইলে আমার সাথে সরাসরি যোগাযোগ করুন।
              </p>
              
              <a href="https://wa.me/8801410991934" target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-green-50 p-4 rounded-2xl border border-green-100 hover:bg-green-100 hover:border-green-200 transition-all active:scale-95 shadow-sm">
                <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-3 rounded-xl shadow-md">
                  <MessageCircle size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-900">WhatsApp</p>
                  <p className="text-sm text-green-700">সরাসরি মেসেজ দিন</p>
                </div>
                <ExternalLink size={20} className="text-green-500/50" />
              </a>

              <a href="tel:+8801410991934" className="flex items-center gap-4 bg-blue-50 p-4 rounded-2xl border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all active:scale-95 shadow-sm">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-3 rounded-xl shadow-md">
                  <Phone size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-900">কল করুন</p>
                  <p className="text-sm text-blue-700">0141 0991 934</p>
                </div>
                <ExternalLink size={20} className="text-blue-500/50" />
              </a>

              <a href="mailto:sr0632890@gmail.com" className="flex items-center gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100 hover:bg-orange-100 hover:border-orange-200 transition-all active:scale-95 shadow-sm">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white p-3 rounded-xl shadow-md">
                  <Mail size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-orange-900">ইমেইল করুন</p>
                  <p className="text-sm text-orange-700">sr0632890@gmail.com</p>
                </div>
                <ExternalLink size={20} className="text-orange-500/50" />
              </a>
            </div>
          </div>
        </div>
      )}

      {showAbout && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-md p-1 border border-emerald-100 overflow-hidden">
              <img 
                src={appLogo} 
                onError={(e) => { e.currentTarget.src = '/farm_app_icon_1779214389225.png'; }} 
                alt="Khamar Pro Logo" 
                className="w-full h-full object-contain rounded-xl" 
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ডিজিটাল খামার প্রো</h2>
            <p className="text-gray-600 mb-6 text-sm">বাংলাদেশের সবচেয়ে আধুনিক খামার ব্যবস্থাপনা সফটওয়্যার।</p>
            
            <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 mb-6 border border-gray-100">
              <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                <span className="text-gray-500">সংস্করণ</span>
                <span className="font-bold text-gray-800">১.০.০ প্রো</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                <span className="text-gray-500">লাইসেন্স</span>
                <span className="font-bold text-green-600">আজীবন (Life Time)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">তৈরি করেছেন</span>
                <span className="font-bold text-blue-600">আবু সুফিয়ান</span>
              </div>
            </div>
            
            <button onClick={() => setShowAbout(false)} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* Direct PIN / Password Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 relative border border-gray-100">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
                <Lock size={22} />
              </div>
              <h3 className="text-lg font-black text-gray-900">
                {language === 'bn' ? 'পিন বা পাসওয়ার্ড পরিবর্তন' : 'Change PIN / Password'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {language === 'bn' ? 'লগইনের জন্য নতুন ৪-সংখ্যার পিন অথবা পাসওয়ার্ড লিখুন' : 'Set your new 4-digit PIN or password'}
              </p>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'bn' ? 'নতুন ৪-সংখ্যার পিন / পাসওয়ার্ড' : 'New PIN / Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPinVisibility ? 'text' : 'password'}
                    placeholder={language === 'bn' ? 'যেমন: 1234 বা পাসওয়ার্ড' : 'e.g. 1234 or password'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinVisibility(!showPinVisibility)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPinVisibility ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'bn' ? 'নতুন পিন পুনরায় লিখুন (Confirm)' : 'Confirm New PIN'}
                </label>
                <input
                  type={showPinVisibility ? 'text' : 'password'}
                  placeholder={language === 'bn' ? 'একই পিন পুনরায় লিখুন' : 'Re-type the same PIN'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  required
                />
              </div>

              <div className="bg-purple-50 p-3 rounded-xl text-[11px] text-purple-900 space-y-1 border border-purple-100">
                <p className="font-bold flex items-center gap-1 text-purple-950">
                  <ShieldCheck size={13} className="text-purple-600" />
                  {language === 'bn' ? 'সহজ লগইন সুবিধা:' : 'PIN Benefit:'}
                </p>
                <p>
                  {language === 'bn'
                    ? 'পরের বার মোবাইল নম্বর ও এই নতুন ৪-ডিজিটের পিন দিয়েই সরাসরি অ্যাপে লগইন করতে পারবেন।'
                    : 'Next time you can easily log in with your phone and this new 4-digit PIN.'}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSavingPin}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSavingPin ? (
                    <span>{language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>{language === 'bn' ? 'পিন সংরক্ষণ করুন' : 'Save PIN'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
