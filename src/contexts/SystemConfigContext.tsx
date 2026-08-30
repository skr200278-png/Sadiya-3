import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { db, offlineSafeDocWrite, handleFirestoreError, OperationType, fastGetDocs } from '../firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface PaymentNumbersConfig {
  bkash: string;
  bkashType: 'personal' | 'merchant' | 'agent';
  nagad: string;
  nagadType: 'personal' | 'merchant';
  rocket: string;
  rocketType: 'personal' | 'merchant';
  bankInfo: string;
  instructionsBn: string;
  instructionsEn: string;
}

export interface FeatureControls {
  monetizationEnabled: boolean; // Master toggle: when false, everything is 100% FREE for all users
  appLockRequired?: boolean; // When true, entire app requires VIP access
  subscriptionPrice?: number; // Configurable general user subscription price in BDT
  storeListingPrice?: number; // Configurable store/dealer listing & promo price in BDT
  doctorListingPrice?: number; // Configurable doctor listing price in BDT
  marketplacePostFree: boolean;
  marketplaceBuyerFree: boolean;
  doctorListingFree: boolean;
  doctorConsultationFree: boolean;
  duesKhataFree: boolean;
  storeListingFree: boolean;
  quickActionsFree: boolean;
  reportsExportFree: boolean;
  salesRecordsFree?: boolean; // Sales Record & Invoices
  farmAnalyticsFree?: boolean; // Farm Analytics & Profit Analysis
  whitelistedUsers: string[]; // uids, emails or phone numbers
  paymentNumbers: PaymentNumbersConfig;
  adminWhatsApp: string;
  adminPhone: string;
  adminEmail: string;
  adminName: string;
  disclaimerTextBn: string;
  disclaimerTextEn: string;
  subscriptionNoticeBn: string;
  subscriptionNoticeEn: string;
}

export interface SubscriptionPlan {
  id: string;
  nameBn: string;
  nameEn: string;
  type: 'farmer_premium' | 'business_ad';
  price: number;
  originalPrice?: number;
  durationDays: number; // 0 or 99999 for lifetime
  durationLabelBn: string;
  durationLabelEn: string;
  featuresBn: string[];
  featuresEn: string[];
  isPopular?: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface PaymentRequest {
  id?: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  planId: string;
  planTitle: string;
  planType: 'farmer_premium' | 'business_ad';
  amount: number;
  paymentMethod: 'bkash' | 'nagad' | 'rocket' | 'bank' | 'manual';
  senderPhone: string;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
  expiresAt?: string;
}

export interface UserSubscription {
  userId: string;
  userIdentifier?: string;
  planId: string;
  planType: 'farmer_premium' | 'business_ad';
  status: 'active' | 'expired' | 'revoked';
  isLifetime: boolean;
  startDate: string;
  expiresAt?: string | null;
  paymentMethod?: string;
  trxId?: string;
  grantedBy?: string;
  createdAt?: string;
}

export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly_plan',
    nameBn: '১ মাস মেয়াদি প্ল্যান',
    nameEn: '1 Month Standard Plan',
    type: 'farmer_premium',
    price: 50,
    originalPrice: 150,
    durationDays: 30,
    durationLabelBn: '১ মাস (৩০ দিন)',
    durationLabelEn: '1 Month (30 Days)',
    featuresBn: [
      'সকল এক্সেল ও রঙিন পিডিএফ রিপোর্ট ডাউনলোড',
      'ডিজিটাল বকেয়া খাতা ও কাস্টমার ক্যাশমেমো তৈরি',
      'ভয়েস অ্যাসিস্ট্যান্ট দিয়ে মুখে বলে হিসাব এন্ট্রি',
      'অফলাইন ব্যাকআপ ও আনলিমিটেড ব্যাচ পরিচালনা'
    ],
    featuresEn: [
      'Full Excel & Color PDF Report Export',
      'Digital Dues Ledger & Customer Cash Memo',
      'Voice Assistant for hands-free entry',
      'Offline backup & unlimited flock batches'
    ],
    isPopular: false,
    isActive: true
  },
  {
    id: 'half_yearly_plan',
    nameBn: '৬ মাস মেয়াদি প্ল্যান',
    nameEn: '6 Months Half-Yearly Plan',
    type: 'farmer_premium',
    price: 250,
    originalPrice: 500,
    durationDays: 180,
    durationLabelBn: '৬ মাস (১৮০ দিন)',
    durationLabelEn: '6 Months (180 Days)',
    featuresBn: [
      'সব প্রিমিয়াম ফিচারের নিরবচ্ছিন্ন অ্যাক্সেস',
      'পিডিএফ, এক্সেল ও ক্যাশমেমো প্রিন্ট',
      'প্রাইওরিটি হেল্পলাইন ও ডাক্তার সাপোর্ট'
    ],
    featuresEn: [
      'Uninterrupted access to all premium features',
      'PDF, Excel & Cash Memo print',
      'Priority helpline & vet doctor support'
    ],
    isPopular: true,
    isActive: true
  },
  {
    id: 'yearly_plan',
    nameBn: '১ বছর মেয়াদি ভিআইপি',
    nameEn: '1 Year VIP Plan',
    type: 'farmer_premium',
    price: 450,
    originalPrice: 999,
    durationDays: 365,
    durationLabelBn: '১ বছর (৩৬৫ দিন)',
    durationLabelEn: '1 Year (365 Days)',
    featuresBn: [
      'পুরো ১ বছর কোনো চিন্তা ছাড়াই সব ফিচার ফ্রি',
      'মার্কেটপ্লেস ও ডিরেক্টরিতে প্রিমিয়াম ভেরিফাইড ব্যাজ',
      'সার্বক্ষণিক ব্যাকআপ ও ডেডিকেটেড সাপোর্ট'
    ],
    featuresEn: [
      'Full 1-year unlimited access to all tools',
      'Verified VIP Badge in Marketplace & Directory',
      'Continuous Cloud Backup & Dedicated Support'
    ],
    isPopular: false,
    isActive: true
  },
  {
    id: 'lifetime_plan',
    nameBn: 'আজীবন ভিআইপি মেম্বারশিপ',
    nameEn: 'Lifetime VIP Membership',
    type: 'farmer_premium',
    price: 750,
    originalPrice: 2000,
    durationDays: 99999,
    durationLabelBn: 'আজীবন (Lifetime)',
    durationLabelEn: 'Lifetime Access',
    featuresBn: [
      'একবার সাবস্ক্রিপশন নিলেই আজীবন সব ফিচার ফ্রি',
      'ভবিষ্যতে আসা সব নতুন ফিচারের সম্পূর্ণ ফ্রি অ্যাক্সেস',
      'গোল্ড ভিআইপি মেম্বার মর্যাদা ও ডিরেক্ট কল সুবিধা'
    ],
    featuresEn: [
      'Pay once, enjoy all tools forever',
      'Free access to all future updates & modules',
      'Gold VIP Member status & direct founder call'
    ],
    isPopular: true,
    isActive: true
  },
  // Business Advertisement Plans
  {
    id: 'store_listing_ad',
    nameBn: 'দোকান/ডিলার ভেরিফাইড লিস্টিং',
    nameEn: 'Verified Store/Dealer Listing',
    type: 'business_ad',
    price: 300,
    originalPrice: 600,
    durationDays: 180,
    durationLabelBn: '৬ মাস লিস্টিং',
    durationLabelEn: '6 Months Listing',
    featuresBn: [
      '৬৪ জেলার ফিড ও ঔষধ দোকান ডিরেক্টরিতে শীর্ষস্থান',
      'সরাসরি খামারিদের ফোন কল ও হোয়াটসঅ্যাপ অর্ডার গ্রহণ',
      'ভেরিফাইড ডিলার ব্যাজ ও হোম ডেলিভারি ট্যাগ'
    ],
    featuresEn: [
      'Top ranking in 64-District Store Directory',
      'Direct incoming farmer phone & WhatsApp orders',
      'Verified Dealer Badge & Delivery tag'
    ],
    isPopular: false,
    isActive: true
  },
  {
    id: 'doctor_profile_ad',
    nameBn: 'ডাক্তার ও ভেটেরিনারি প্রোফাইল',
    nameEn: 'Doctor & Veterinary Listing',
    type: 'business_ad',
    price: 300,
    originalPrice: 500,
    durationDays: 365,
    durationLabelBn: '১ বছর লিস্টিং',
    durationLabelEn: '1 Year Listing',
    featuresBn: [
      'টেলিমেডিসিন ও ডাক্তার ডিরেক্টরিতে প্রোফাইল লিস্টিং',
      'খামারিদের প্রেসক্রিপশন প্রদান ও কনসালটেন্সি সার্ভিস',
      'অনুমোদিত প্র্যাকটিশনার ব্যাজ'
    ],
    featuresEn: [
      'Profile listing in Telemedicine Directory',
      'Provide digital prescriptions & consultancy',
      'Approved Practitioner Badge'
    ],
    isPopular: false,
    isActive: true
  }
];

const DEFAULT_CONFIG: FeatureControls = {
  monetizationEnabled: true,
  appLockRequired: false,
  subscriptionPrice: 150,
  storeListingPrice: 300,
  doctorListingPrice: 300,
  marketplacePostFree: true,
  marketplaceBuyerFree: true,
  doctorListingFree: true,
  doctorConsultationFree: true,
  duesKhataFree: true,
  storeListingFree: true,
  quickActionsFree: true,
  reportsExportFree: true,
  salesRecordsFree: true,
  farmAnalyticsFree: true,
  whitelistedUsers: [],
  paymentNumbers: {
    bkash: '01410991934',
    bkashType: 'personal',
    nagad: '01410991934',
    nagadType: 'personal',
    rocket: '01410991934',
    rocketType: 'personal',
    bankInfo: 'সোনালী ব্যাংক / ডাচ-বাংলা ব্যাংক (প্রয়োজনে যোগাযোগ করুন)',
    instructionsBn: 'বিকাশ/নগদ/রকেটে সেন্ড মানি (Send Money) করে ট্রানজেকশন আইডি (TrxID) ও প্রেরক নম্বর নিচে সাবমিট করুন অথবা হোয়াটসঅ্যাপে জানান।',
    instructionsEn: 'Send Money via bKash/Nagad/Rocket and submit the Sender Mobile & TrxID below or message on WhatsApp.'
  },
  adminWhatsApp: '8801410991934',
  adminPhone: '01410991934',
  adminEmail: 'skabusufian452@gmail.com',
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
  isPremium: boolean;
  userSubscription: UserSubscription | null;
  plans: SubscriptionPlan[];
  pendingRequests: PaymentRequest[];
  hasAccess: (feature: keyof Omit<FeatureControls, 'whitelistedUsers' | 'paymentNumbers' | 'adminWhatsApp' | 'adminPhone' | 'adminEmail' | 'adminName' | 'disclaimerTextBn' | 'disclaimerTextEn' | 'subscriptionNoticeBn' | 'subscriptionNoticeEn'>) => boolean;
  updateConfig: (newConfig: Partial<FeatureControls>) => Promise<boolean>;
  addUserToWhitelist: (identifier: string) => Promise<boolean>;
  removeUserFromWhitelist: (identifier: string) => Promise<boolean>;
  submitPaymentRequest: (requestData: Omit<PaymentRequest, 'status' | 'createdAt'>) => Promise<boolean>;
  approvePaymentRequest: (requestId: string, targetUserId: string, durationDays: number, planId?: string) => Promise<boolean>;
  rejectPaymentRequest: (requestId: string, adminNotes?: string) => Promise<boolean>;
  grantUserSubscription: (userIdOrPhone: string, planId: string, durationDays: number, isLifetime?: boolean) => Promise<boolean>;
  revokeUserSubscription: (userIdOrPhone: string) => Promise<boolean>;
  saveSubscriptionPlan: (plan: SubscriptionPlan) => Promise<boolean>;
  deleteSubscriptionPlan: (planId: string) => Promise<boolean>;
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
  const clean = input.replace(/^phone_/i, '').split('@')[0];
  return clean.replace(/\D/g, '');
}

/** Check if any user identity matches a whitelisted string strictly */
function matchIdentifier(whitelistedItem: string, userIdentities: string[]): boolean {
  if (!whitelistedItem) return false;
  const wlClean = whitelistedItem.trim().toLowerCase();
  if (!wlClean) return false;

  for (const identity of userIdentities) {
    if (!identity) continue;
    const idClean = identity.trim().toLowerCase();
    
    // 1. Exact match (UID, Full Email, Full Phone)
    if (idClean === wlClean) return true;

    // 2. Exact match for email prefix phone numbers e.g. phone_01712345678@digitalfarm.app
    const cleanIdPhone = idClean.replace(/^phone_/i, '').split('@')[0].replace(/\D/g, '');
    const cleanWlPhone = wlClean.replace(/^phone_/i, '').split('@')[0].replace(/\D/g, '');

    // 3. Strict 11-digit Bangladeshi phone match (e.g. 01XXXXXXXXX)
    if (cleanWlPhone.length >= 10 && cleanIdPhone.length >= 10) {
      const id11 = cleanIdPhone.slice(-11);
      const wl11 = cleanWlPhone.slice(-11);
      if (id11.length === 11 && wl11.length === 11 && id11 === wl11) {
        return true;
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
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [pendingRequests, setPendingRequests] = useState<PaymentRequest[]>([]);

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

  // 1. Listen to user profile document
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

  // 2. Listen to active User Subscription document in Firestore
  useEffect(() => {
    if (!currentUser || isDemoUser) {
      setUserSubscription(null);
      return;
    }

    try {
      const subRef = doc(db, 'subscriptions', currentUser.uid);
      const unsub = onSnapshot(subRef, (docSnap) => {
        if (docSnap.exists()) {
          const subData = docSnap.data() as UserSubscription;
          // Check if subscription has expired
          if (subData.status === 'active') {
            if (subData.isLifetime) {
              setUserSubscription(subData);
            } else if (subData.expiresAt) {
              const expTime = new Date(subData.expiresAt).getTime();
              const now = Date.now();
              if (expTime > now) {
                setUserSubscription(subData);
              } else {
                setUserSubscription({ ...subData, status: 'expired' });
              }
            } else {
              setUserSubscription(subData);
            }
          } else {
            setUserSubscription(subData);
          }
        } else {
          setUserSubscription(null);
        }
      }, (err) => {
        console.warn("User subscription sync notice:", err);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Subscription listener error:", e);
    }
  }, [currentUser, isDemoUser]);

  // 3. Listen to system settings (feature_controls)
  useEffect(() => {
    try {
      const configRef = doc(db, 'system_settings', 'feature_controls');
      const unsub = onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<FeatureControls>;
          const merged: FeatureControls = {
            ...DEFAULT_CONFIG,
            ...data,
            paymentNumbers: {
              ...DEFAULT_CONFIG.paymentNumbers,
              ...(data.paymentNumbers || {})
            }
          };
          setConfig(merged);
          try {
            localStorage.setItem('app_system_feature_config', JSON.stringify(merged));
          } catch (e) {}
        } else {
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

  // 4. Listen to Subscription Plans from Firestore
  useEffect(() => {
    try {
      const plansRef = collection(db, 'subscription_plans');
      const unsub = onSnapshot(plansRef, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedPlans: SubscriptionPlan[] = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          } as SubscriptionPlan));

          // Merge fetched plans with default plans to ensure zero missing items
          const mergedPlans = [
            ...fetchedPlans,
            ...DEFAULT_PLANS.filter(dp => !fetchedPlans.some(fp => fp.id === dp.id))
          ];
          setPlans(mergedPlans);
        } else {
          setPlans(DEFAULT_PLANS);
        }
      }, (err) => {
        console.warn("Subscription plans fetch notice:", err);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Plans listener error:", e);
    }
  }, []);

  // 5. If Admin, listen to pending payment requests
  useEffect(() => {
    if (!isAdmin) {
      setPendingRequests([]);
      return;
    }

    try {
      const reqQuery = query(
        collection(db, 'payment_requests'), 
        where('status', '==', 'pending')
      );
      const unsub = onSnapshot(reqQuery, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PaymentRequest));
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPendingRequests(list);
      }, (err) => {
        console.warn("Pending payment requests sync notice:", err);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Payment requests listener error:", e);
    }
  }, [isAdmin]);

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

  // Compute if current user is active VIP / Premium
  const hasActiveSub = Boolean(
    userSubscription && 
    userSubscription.status === 'active' && 
    (userSubscription.isLifetime || (userSubscription.expiresAt && new Date(userSubscription.expiresAt).getTime() > Date.now()))
  );

  const isPremium = Boolean(isAdmin || isWhitelisted || hasActiveSub);

  const hasAccess = (feature: keyof Omit<FeatureControls, 'whitelistedUsers' | 'paymentNumbers' | 'adminWhatsApp' | 'adminPhone' | 'adminEmail' | 'adminName' | 'disclaimerTextBn' | 'disclaimerTextEn' | 'subscriptionNoticeBn' | 'subscriptionNoticeEn'>): boolean => {
    // 0. If Global Monetization is disabled by Admin, everything is 100% FREE for all users
    if (config.monetizationEnabled === false) {
      return true;
    }

    // 1. Admin always has full access
    if (isAdmin) return true;

    // 2. If user is VIP / Premium / Whitelisted, full access
    if (isPremium) return true;

    // 3. If Master Global App Lock is ON, non-VIP users are blocked
    if (config.appLockRequired) {
      return false;
    }

    // 4. If individual feature is marked as free, all users have access
    const isFeatureFree = config[feature];
    if (isFeatureFree !== false) return true;

    // 5. Otherwise locked
    return false;
  };

  const updateConfig = async (newConfig: Partial<FeatureControls>): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('কেবলমাত্র মাস্টার অ্যাডমিন এই সেটিং পরিবর্তন করতে পারেন');
      return false;
    }

    try {
      const updated = { 
        ...config, 
        ...newConfig,
        paymentNumbers: {
          ...config.paymentNumbers,
          ...(newConfig.paymentNumbers || {})
        }
      };
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

  // Submit manual payment request (User action)
  const submitPaymentRequest = async (requestData: Omit<PaymentRequest, 'status' | 'createdAt'>): Promise<boolean> => {
    if (!currentUser) {
      toast.error('লগইন করা আবশ্যক');
      return false;
    }

    try {
      const payload: PaymentRequest = {
        ...requestData,
        userId: currentUser.uid,
        userName: requestData.userName || userProfileData?.name || currentUser.displayName || 'খামারি',
        userPhone: requestData.userPhone || userProfileData?.phone || currentUser.phoneNumber || '',
        userEmail: currentUser.email || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'payment_requests'), payload);
      toast.success('পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে! অ্যাডমিন যাচাই করে দ্রুত চালু করবেন।');
      return true;
    } catch (err) {
      console.error("Payment request submit error:", err);
      toast.error('পেমেন্ট রিকোয়েস্ট জমা দেওয়া যায়নি');
      return false;
    }
  };

  // 1-Click Approve Payment Request (Admin action)
  const approvePaymentRequest = async (requestId: string, targetUserId: string, durationDays: number, planId: string = 'manual_approval'): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('অননুমোদিত অ্যাকশন');
      return false;
    }

    try {
      const now = new Date();
      const isLifetime = durationDays >= 9999 || durationDays === 0;
      let expiryDate: string | null = null;
      
      if (!isLifetime) {
        const exp = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        expiryDate = exp.toISOString();
      }

      // 1. Update Payment Request
      const reqRef = doc(db, 'payment_requests', requestId);
      await updateDoc(reqRef, {
        status: 'approved',
        processedAt: now.toISOString(),
        expiresAt: expiryDate
      });

      // 2. Set/Update Subscription document
      const subRef = doc(db, 'subscriptions', targetUserId);
      const subPayload: UserSubscription = {
        userId: targetUserId,
        planId,
        planType: 'farmer_premium',
        status: 'active',
        isLifetime,
        startDate: now.toISOString(),
        expiresAt: expiryDate,
        grantedBy: 'admin_approval',
        createdAt: now.toISOString()
      };
      await setDoc(subRef, subPayload, { merge: true });

      // 3. Add to whitelist as well for instant dual recognition
      await addUserToWhitelist(targetUserId);

      toast.success('✅ পেমেন্ট রিকোয়েস্ট সফলভাবে অনুমোদিত ও অ্যাক্টিভেট হয়েছে!');
      return true;
    } catch (err) {
      console.error("Approve payment error:", err);
      toast.error('অনুমোদন ব্যর্থ হয়েছে');
      return false;
    }
  };

  // Reject Payment Request (Admin action)
  const rejectPaymentRequest = async (requestId: string, adminNotes: string = ''): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('অননুমোদিত অ্যাকশন');
      return false;
    }

    try {
      const reqRef = doc(db, 'payment_requests', requestId);
      await updateDoc(reqRef, {
        status: 'rejected',
        adminNotes,
        processedAt: new Date().toISOString()
      });
      toast.success('পেমেন্ট রিকোয়েস্ট বাতিল করা হয়েছে');
      return true;
    } catch (err) {
      console.error("Reject payment error:", err);
      toast.error('বাতিল করতে ব্যর্থ হয়েছে');
      return false;
    }
  };

  // Manually Grant VIP subscription to any user by phone or UID (Admin action)
  const grantUserSubscription = async (userIdOrPhone: string, planId: string, durationDays: number, isLifetime: boolean = false): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('কেবলমাত্র অ্যাডমিন এই সুবিধা দিতে পারেন');
      return false;
    }

    const clean = userIdOrPhone.trim();
    if (!clean) return false;

    try {
      const now = new Date();
      let expiryDate: string | null = null;
      if (!isLifetime && durationDays > 0 && durationDays < 9999) {
        const exp = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        expiryDate = exp.toISOString();
      }

      // 1. Add to Whitelist
      await addUserToWhitelist(clean);

      // 2. If it's a UID, also write to subscriptions collection
      if (clean.length > 15) {
        try {
          const subRef = doc(db, 'subscriptions', clean);
          await setDoc(subRef, {
            userId: clean,
            userIdentifier: clean,
            planId,
            planType: 'farmer_premium',
            status: 'active',
            isLifetime,
            startDate: now.toISOString(),
            expiresAt: expiryDate,
            grantedBy: 'admin_manual',
            createdAt: now.toISOString()
          }, { merge: true });
        } catch (e) {}
      }

      toast.success(`🎉 ${clean} এর ভিআইপি সাবস্ক্রিপশন চালু হয়েছে!`);
      return true;
    } catch (err) {
      console.error("Grant VIP error:", err);
      toast.error('ভিআইপি অনুমোদন ব্যর্থ হয়েছে');
      return false;
    }
  };

  // Revoke VIP subscription (Admin action)
  const revokeUserSubscription = async (userIdOrPhone: string): Promise<boolean> => {
    if (!isAdmin) return false;
    const clean = userIdOrPhone.trim();
    if (!clean) return false;

    try {
      // 1. Remove from whitelist
      await removeUserFromWhitelist(clean);

      // 2. Revoke subscription document if UID
      if (clean.length > 15) {
        try {
          const subRef = doc(db, 'subscriptions', clean);
          await updateDoc(subRef, {
            status: 'revoked',
            revokedAt: new Date().toISOString()
          });
        } catch (e) {}
      }

      toast.success(`সাবস্ক্রিপশন বাতিল করা হয়েছে (${clean})`);
      return true;
    } catch (err) {
      toast.error('বাতিল করা যায়নি');
      return false;
    }
  };

  // Save/Update Plan in Firestore (Admin action)
  const saveSubscriptionPlan = async (plan: SubscriptionPlan): Promise<boolean> => {
    if (!isAdmin) return false;
    try {
      const planRef = doc(db, 'subscription_plans', plan.id);
      await setDoc(planRef, {
        ...plan,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success('প্যাকেজ প্ল্যান সংরক্ষিত হয়েছে!');
      return true;
    } catch (err) {
      toast.error('প্যাকেজ সংরক্ষণ ব্যর্থ হয়েছে');
      return false;
    }
  };

  // Delete Plan (Admin action)
  const deleteSubscriptionPlan = async (planId: string): Promise<boolean> => {
    if (!isAdmin) return false;
    try {
      await deleteDoc(doc(db, 'subscription_plans', planId));
      setPlans(prev => prev.filter(p => p.id !== planId));
      toast.success('প্যাকেজ মুছে ফেলা হয়েছে');
      return true;
    } catch (err) {
      toast.error('মুছে ফেলা যায়নি');
      return false;
    }
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
        isPremium,
        userSubscription,
        plans,
        pendingRequests,
        hasAccess,
        updateConfig,
        addUserToWhitelist,
        removeUserFromWhitelist,
        submitPaymentRequest,
        approvePaymentRequest,
        rejectPaymentRequest,
        grantUserSubscription,
        revokeUserSubscription,
        saveSubscriptionPlan,
        deleteSubscriptionPlan,
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

