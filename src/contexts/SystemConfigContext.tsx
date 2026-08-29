import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, offlineSafeDocWrite, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface FeatureControls {
  appLockRequired?: boolean; // When true, entire app requires subscription
  subscriptionPrice?: number; // Configurable general user subscription price in BDT
  storeListingPrice?: number; // Configurable store/dealer listing & promo price in BDT
  marketplacePostFree: boolean;
  marketplaceBuyerFree: boolean;
  doctorListingFree: boolean;
  doctorConsultationFree: boolean;
  duesKhataFree: boolean;
  storeListingFree: boolean;
  quickActionsFree: boolean;
  reportsExportFree: boolean;
  whitelistedUsers: string[]; // uids, emails or phone numbers
  adminWhatsApp: string;
  adminPhone: string;
  adminEmail: string;
  adminName: string;
  disclaimerTextBn: string;
  disclaimerTextEn: string;
  subscriptionNoticeBn: string;
  subscriptionNoticeEn: string;
}

const DEFAULT_CONFIG: FeatureControls = {
  appLockRequired: false,
  subscriptionPrice: 150,
  storeListingPrice: 500,
  marketplacePostFree: true,
  marketplaceBuyerFree: true,
  doctorListingFree: true,
  doctorConsultationFree: true,
  duesKhataFree: true,
  storeListingFree: true,
  quickActionsFree: true,
  reportsExportFree: true,
  whitelistedUsers: [],
  adminWhatsApp: '8801410991934',
  adminPhone: '01410991934',
  adminEmail: 'sr0632890@gmail.com',
  adminName: 'আবু সুফিয়ান',
  disclaimerTextBn: 'সতর্কতা: পণ্য বা ডেলিভারি বুঝে নেওয়ার আগে কোনো অবস্থাতেই কাউকে বিকাশ, নগদ বা ব্যাংকে অগ্রিম টাকা পাঠাবেন না। কেউ আগে টাকা পাঠিয়ে প্রতারিত হলে অথবা বাকিতে বিক্রয় করে ক্ষতিগ্রস্থ হলে অ্যাপ মালিক বা অ্যাপ কর্তৃপক্ষ কোনোভাবেই দায়ী থাকবে না। লেনদেনের পূর্বে নিজ দায়িত্বে যাচাই-বাছাই করুন।',
  disclaimerTextEn: 'Warning: Never send advance payment (bKash/Nagad/Bank) before physically receiving the goods. The app owner or authority is strictly NOT responsible for any advance money fraud, non-delivery, or unpaid credit. Please verify all parties independently before transacting.',
  subscriptionNoticeBn: 'এই প্রিমিয়াম সেবাটি আপনার অ্যাকাউন্টে সক্রিয় করতে সরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন।',
  subscriptionNoticeEn: 'To activate this premium feature on your account, please contact the app admin.'
};

interface SystemConfigContextType {
  config: FeatureControls;
  loading: boolean;
  isAdmin: boolean;
  isWhitelisted: boolean;
  hasAccess: (feature: keyof Omit<FeatureControls, 'whitelistedUsers' | 'adminWhatsApp' | 'adminPhone' | 'adminEmail' | 'adminName' | 'disclaimerTextBn' | 'disclaimerTextEn' | 'subscriptionNoticeBn' | 'subscriptionNoticeEn'>) => boolean;
  updateConfig: (newConfig: Partial<FeatureControls>) => Promise<boolean>;
  addUserToWhitelist: (identifier: string) => Promise<boolean>;
  removeUserFromWhitelist: (identifier: string) => Promise<boolean>;
  // Subscription Modal Trigger
  subscriptionModal: {
    isOpen: boolean;
    featureTitle: string;
    featureDesc?: string;
  };
  openSubscriptionModal: (featureTitle: string, featureDesc?: string) => void;
  closeSubscriptionModal: () => void;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

const MASTER_ADMIN_EMAIL = 'skabusufian452@gmail.com';

/** Helper to extract digits from phone or formatted auth email */
function extractPhoneDigits(input?: string | null): string {
  if (!input) return '';
  // Remove phone_ prefix, domain, etc.
  const clean = input.replace(/^phone_/i, '').split('@')[0];
  return clean.replace(/\D/g, '');
}

/** Check if any user identity matches a whitelisted string */
function matchIdentifier(whitelistedItem: string, userIdentities: string[]): boolean {
  if (!whitelistedItem) return false;
  const wlClean = whitelistedItem.trim().toLowerCase();
  
  // 1. Direct match
  for (const identity of userIdentities) {
    if (!identity) continue;
    const idClean = identity.trim().toLowerCase();
    if (idClean === wlClean) return true;

    // Email prefix match (e.g. user@gmail.com matching user or vice-versa)
    if (idClean.includes('@') || wlClean.includes('@')) {
      const idPrefix = idClean.split('@')[0].replace(/^phone_/i, '');
      const wlPrefix = wlClean.split('@')[0].replace(/^phone_/i, '');
      if (idPrefix === wlPrefix && idPrefix.length > 2) return true;
    }
  }

  // 2. Phone digits match
  const wlDigits = extractPhoneDigits(wlClean);
  if (wlDigits.length >= 8) {
    for (const identity of userIdentities) {
      if (!identity) continue;
      const idDigits = extractPhoneDigits(identity);
      if (idDigits.length >= 8) {
        if (idDigits === wlDigits) return true;

        // Compare last 10 digits (e.g., 1712345678)
        const idLast10 = idDigits.slice(-10);
        const wlLast10 = wlDigits.slice(-10);
        if (idLast10.length === 10 && wlLast10.length === 10 && idLast10 === wlLast10) {
          return true;
        }

        // Compare last 11 digits (e.g., 01712345678)
        const idLast11 = idDigits.slice(-11);
        const wlLast11 = wlDigits.slice(-11);
        if (idLast11.length === 11 && wlLast11.length === 11 && idLast11 === wlLast11) {
          return true;
        }
      }
    }
  }

  return false;
}

export function SystemConfigProvider({ children }: { children: ReactNode }) {
  const { currentUser, isDemoUser } = useAuth();
  const [config, setConfig] = useState<FeatureControls>(() => {
    try {
      const cached = localStorage.getItem('app_system_feature_config');
      return cached ? { ...DEFAULT_CONFIG, ...JSON.parse(cached) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [userProfileData, setUserProfileData] = useState<any>(null);

  // Modal State
  const [subscriptionModal, setSubscriptionModal] = useState<{
    isOpen: boolean;
    featureTitle: string;
    featureDesc?: string;
  }>({
    isOpen: false,
    featureTitle: '',
    featureDesc: ''
  });

  const isAdmin = currentUser?.email === MASTER_ADMIN_EMAIL || (currentUser as any)?.role === 'admin';

  // Listen to user profile document to get phone number / extra identities
  useEffect(() => {
    if (!currentUser || isDemoUser) {
      setUserProfileData(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfileData(docSnap.data());
      }
    }, (err) => {
      console.warn("SystemConfig user profile listener notice:", err);
    });
    return () => unsub();
  }, [currentUser, isDemoUser]);

  useEffect(() => {
    try {
      const configRef = doc(db, 'system_settings', 'feature_controls');
      const unsub = onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<FeatureControls>;
          const merged = { ...DEFAULT_CONFIG, ...data };
          setConfig(merged);
          try {
            localStorage.setItem('app_system_feature_config', JSON.stringify(merged));
          } catch (e) {}
        } else {
          // Document doesn't exist yet, we can use default
          setConfig(DEFAULT_CONFIG);
        }
        setLoading(false);
      }, (err) => {
        console.warn("System settings sync notice:", err);
        setLoading(false);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Config listener error:", e);
      setLoading(false);
    }
  }, []);

  // Compute if current user is whitelisted
  const isWhitelisted = Boolean(
    currentUser &&
    config.whitelistedUsers &&
    config.whitelistedUsers.length > 0 &&
    (() => {
      const authEmail = currentUser.email || '';
      const rawPhoneFromEmail = authEmail.startsWith('phone_') ? authEmail.replace(/^phone_/i, '').split('@')[0] : '';
      
      const userIdentities = [
        currentUser.uid,
        currentUser.email,
        currentUser.phoneNumber,
        rawPhoneFromEmail,
        userProfileData?.phone,
        userProfileData?.email,
        userProfileData?.userId,
        authEmail.split('@')[0]
      ].filter(Boolean) as string[];

      return config.whitelistedUsers.some(wlItem => matchIdentifier(wlItem, userIdentities));
    })()
  );

  const hasAccess = (feature: keyof Omit<FeatureControls, 'whitelistedUsers' | 'adminWhatsApp' | 'adminPhone' | 'adminEmail' | 'adminName' | 'disclaimerTextBn' | 'disclaimerTextEn' | 'subscriptionNoticeBn' | 'subscriptionNoticeEn'>): boolean => {
    // 1. Admin always has full access
    if (isAdmin) return true;

    // 2. If Master Global App Lock is ON, all non-whitelisted users are required to have subscription
    if (config.appLockRequired) {
      return isWhitelisted;
    }

    // 3. If individual feature is marked as free, all users have access
    const isFeatureFree = config[feature];
    if (isFeatureFree !== false) return true;

    // 4. If feature is locked, check if current user is whitelisted
    if (isWhitelisted) return true;

    return false;
  };

  const updateConfig = async (newConfig: Partial<FeatureControls>): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('কেবলমাত্র মাস্টার অ্যাডমিন এই সেটিং পরিবর্তন করতে পারেন');
      return false;
    }

    try {
      const updated = { ...config, ...newConfig };
      setConfig(updated);
      const configRef = doc(db, 'system_settings', 'feature_controls');
      await offlineSafeDocWrite(setDoc(configRef, updated, { merge: true }));
      try {
        localStorage.setItem('app_system_feature_config', JSON.stringify(updated));
      } catch (e) {}
      toast.success('সেটিংস সফলভাবে আপডেট হয়েছে!');
      return true;
    } catch (error) {
      console.error("Config update error:", error);
      handleFirestoreError(error, OperationType.WRITE, 'system_settings/feature_controls');
      toast.error('সেটিংস সংরক্ষণ করা যায়নি');
      return false;
    }
  };

  const addUserToWhitelist = async (identifier: string): Promise<boolean> => {
    if (!identifier.trim()) return false;
    const clean = identifier.trim();
    if (config.whitelistedUsers.includes(clean)) {
      toast('ইউজার ইতিমধ্যে অনুমোদিত তালিকায় আছেন');
      return true;
    }
    const nextList = [...config.whitelistedUsers, clean];
    return await updateConfig({ whitelistedUsers: nextList });
  };

  const removeUserFromWhitelist = async (identifier: string): Promise<boolean> => {
    const nextList = config.whitelistedUsers.filter(item => item !== identifier);
    return await updateConfig({ whitelistedUsers: nextList });
  };

  const openSubscriptionModal = (featureTitle: string, featureDesc?: string) => {
    setSubscriptionModal({
      isOpen: true,
      featureTitle,
      featureDesc
    });
  };

  const closeSubscriptionModal = () => {
    setSubscriptionModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <SystemConfigContext.Provider
      value={{
        config,
        loading,
        isAdmin,
        isWhitelisted,
        hasAccess,
        updateConfig,
        addUserToWhitelist,
        removeUserFromWhitelist,
        subscriptionModal,
        openSubscriptionModal,
        closeSubscriptionModal
      }}
    >
      {children}
    </SystemConfigContext.Provider>
  );
}

export function useSystemConfig() {
  const context = useContext(SystemConfigContext);
  if (!context) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
}
