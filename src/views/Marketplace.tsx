import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { demoStore, DemoMarketPost, DemoMarketBuyer, MarketCategory } from '../utils/demoStore';
import { 
  BANGLADESH_DIVISIONS, 
  ALL_64_DISTRICTS, 
  BANGLADESH_DISTRICT_NAMES_BN, 
  BANGLADESH_DISTRICT_NAMES_EN,
  DISTRICT_FILTER_OPTIONS_BN,
  DISTRICT_FILTER_OPTIONS_EN,
  COUNTRY_LIST,
  COUNTRY_FILTER_OPTIONS_BN,
  COUNTRY_FILTER_OPTIONS_EN,
  detectUserCountry,
  getCountryDisplayName,
  getDistrictDisplayName,
  normalizeCountryCode
} from '../utils/bangladeshDistricts';
import { 
  Store, 
  Phone, 
  MessageCircle, 
  AlertCircle, 
  Plus, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Flame, 
  ShieldCheck, 
  Users, 
  Sparkles, 
  X, 
  Filter, 
  Trash2, 
  Check, 
  Clock, 
  Scale, 
  ArrowUpDown,
  Share2,
  UserCheck,
  HelpCircle,
  Crown,
  Lock,
  Globe,
  ChevronRight,
  ChevronDown,
  Pencil,
  AlertTriangle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import MarketplaceDisclaimerBanner from '../components/MarketplaceDisclaimerBanner';
import AdminFeatureControlCard from '../components/AdminFeatureControlCard';
import { admobService } from '../services/admobService';
import { openWhatsAppSafe } from '../utils/whatsappHelper';

// Category Configuration: পাখি, পশু, মাছ
export const CATEGORY_CONFIG: Record<MarketCategory, {
  nameBn: string;
  nameEn: string;
  icon: string;
  shortLabelBn: string;
  taglineBn: string;
  taglineEn: string;
  countLabelBn: string;
  countLabelEn: string;
  countPlaceholder: string;
  weightLabelBn: string;
  weightLabelEn: string;
  weightPlaceholder: string;
  priceLabelBn: string;
  priceLabelEn: string;
  pricePlaceholder: string;
  priceUnits: { id: string; labelBn: string; labelEn: string }[];
  breeds: { id: string; labelBn: string; labelEn: string; icon: string }[];
}> = {
  poultry: {
    nameBn: 'পাখি (হাঁস-মুরগি)',
    nameEn: 'Poultry & Birds',
    icon: '🐦',
    shortLabelBn: 'পাখি',
    taglineBn: 'ব্রয়লার, সোনালী, লেয়ার, দেশি মুরগি, হাঁস, কবুতর ও কোয়েল',
    taglineEn: 'Broiler, Sonali, Layer, Deshi, Duck, Pigeon & Quail',
    countLabelBn: 'পাখির মোট সংখ্যা (পিস/টি)',
    countLabelEn: 'Bird Count (pcs)',
    countPlaceholder: '1500',
    weightLabelBn: 'গড় ওজন (কেজি)',
    weightLabelEn: 'Avg Weight (kg)',
    weightPlaceholder: '1.85',
    priceLabelBn: 'কাঙ্ক্ষিত দর',
    priceLabelEn: 'Expected Rate',
    pricePlaceholder: '185',
    priceUnits: [
      { id: 'kg', labelBn: '৳ প্রতি কেজি', labelEn: '৳/kg' },
      { id: 'piece', labelBn: '৳ প্রতি পিস', labelEn: '৳/pc' }
    ],
    breeds: [
      { id: 'broiler', labelBn: 'ব্রয়লার মুরগি', labelEn: 'Broiler', icon: '🐔' },
      { id: 'sonali', labelBn: 'সোনালী মুরগি', labelEn: 'Sonali', icon: '🐓' },
      { id: 'layer', labelBn: 'লেয়ার মুরগি', labelEn: 'Layer', icon: '🥚' },
      { id: 'deshi', labelBn: 'দেশি মুরগি', labelEn: 'Deshi', icon: '🍗' },
      { id: 'duck', labelBn: 'হাঁস', labelEn: 'Duck', icon: '🦆' },
      { id: 'quail_pigeon', labelBn: 'কোয়েল / কবুতর', labelEn: 'Quail/Pigeon', icon: '🕊️' },
      { id: 'other', labelBn: 'অন্যান্য পাখি', labelEn: 'Other Bird', icon: '🦜' }
    ]
  },
  cattle: {
    nameBn: 'পশু (গরু-ছাগল)',
    nameEn: 'Livestock & Cattle',
    icon: '🐄',
    shortLabelBn: 'পশু',
    taglineBn: 'ষাঁড়, দুধেল গাভী, বাছুর, মহিষ, ছাগল ও ভেড়া',
    taglineEn: 'Bull, Dairy Cow, Calf, Buffalo, Goat & Sheep',
    countLabelBn: 'পশুর সংখ্যা (টি)',
    countLabelEn: 'Head Count (pcs)',
    countPlaceholder: '2',
    weightLabelBn: 'আনুমানিক লাইভ ওজন (কেজি)',
    weightLabelEn: 'Avg Live Weight (kg)',
    weightPlaceholder: '220',
    priceLabelBn: 'কাঙ্ক্ষিত দর',
    priceLabelEn: 'Expected Rate',
    pricePlaceholder: '140000',
    priceUnits: [
      { id: 'piece', labelBn: '৳ প্রতি পিস / টি', labelEn: '৳/head' },
      { id: 'kg', labelBn: '৳ প্রতি লাইভ কেজি', labelEn: '৳/kg live' }
    ],
    breeds: [
      { id: 'bull', labelBn: 'ষাঁড় / বলদ', labelEn: 'Bull / Ox', icon: '🐂' },
      { id: 'dairy_cow', labelBn: 'দুধেল গাভী', labelEn: 'Dairy Cow', icon: '🐄' },
      { id: 'calf', labelBn: 'বাছুর', labelEn: 'Calf', icon: '🐮' },
      { id: 'buffalo', labelBn: 'মহিষ', labelEn: 'Buffalo', icon: '🐃' },
      { id: 'goat', labelBn: 'ছাগল / খাসি', labelEn: 'Goat', icon: '🐐' },
      { id: 'sheep', labelBn: 'ভেড়া / দুম্বা', labelEn: 'Sheep', icon: '🐑' },
      { id: 'other', labelBn: 'অন্যান্য পশু', labelEn: 'Other Cattle', icon: '🐾' }
    ]
  },
  fish: {
    nameBn: 'মাছ (চাষের মাছ/পোনা)',
    nameEn: 'Fisheries & Aquaculture',
    icon: '🐟',
    shortLabelBn: 'মাছ',
    taglineBn: 'রুই, কাতলা, তেলাপিয়া, পাঙ্গাশ, শিং ও পোনা মাছ',
    taglineEn: 'Carp, Tilapia, Pangasius, Catfish & Fingerlings',
    countLabelBn: 'মাছের সংখ্যা বা পরিমাণ (টি/কেজি/মণ)',
    countLabelEn: 'Quantity / Count',
    countPlaceholder: '500',
    weightLabelBn: 'গড় আকার বা সাইজ (কেজি বা গ্রাম)',
    weightLabelEn: 'Avg Size (kg/g)',
    weightPlaceholder: '1.2',
    priceLabelBn: 'কাঙ্ক্ষিত দর',
    priceLabelEn: 'Expected Rate',
    pricePlaceholder: '240',
    priceUnits: [
      { id: 'kg', labelBn: '৳ প্রতি কেজি', labelEn: '৳/kg' },
      { id: 'maund', labelBn: '৳ প্রতি মণ (৪০ কেজি)', labelEn: '৳/maund' },
      { id: 'piece', labelBn: '৳ প্রতি পিস / হাজার পোনা', labelEn: '৳/thousand' }
    ],
    breeds: [
      { id: 'carp_rohu', labelBn: 'রুই / কাতলা / কার্প', labelEn: 'Carp / Rohu', icon: '🐟' },
      { id: 'tilapia', labelBn: 'তেলাপিয়া মাছ', labelEn: 'Tilapia', icon: '🐠' },
      { id: 'pangasius', labelBn: 'পাঙ্গাশ মাছ', labelEn: 'Pangasius', icon: '🐡' },
      { id: 'catfish_magur', labelBn: 'শিং / মাগুর / পাবদা', labelEn: 'Catfish', icon: '🦐' },
      { id: 'koi_shol', labelBn: 'কৈ / শোল মাছ', labelEn: 'Koi / Shol', icon: '🐟' },
      { id: 'fingerling', labelBn: 'পোনা মাছ (ধানী/আঙুল)', labelEn: 'Fingerlings', icon: '🌱' },
      { id: 'other', labelBn: 'অন্যান্য মাছ', labelEn: 'Other Fish', icon: '🎣' }
    ]
  }
};

// Helper: Resolve category for any post
export const resolvePostCategory = (post: { category?: string; poultryType?: string }): MarketCategory => {
  if (post.category === 'poultry' || post.category === 'cattle' || post.category === 'fish') {
    return post.category;
  }
  const type = (post.poultryType || '').toLowerCase();
  if (['bull', 'dairy_cow', 'calf', 'buffalo', 'goat', 'sheep', 'cattle', 'cow'].includes(type) || 
      type.includes('গরু') || type.includes('ছাগল') || type.includes('ষাঁড়') || type.includes('গাভী') || type.includes('পশু')) {
    return 'cattle';
  }
  if (['carp_rohu', 'tilapia', 'pangasius', 'catfish_magur', 'koi_shol', 'fingerling', 'fish'].includes(type) || 
      type.includes('মাছ') || type.includes('পোনা') || type.includes('তেলাপিয়া') || type.includes('কার্প')) {
    return 'fish';
  }
  return 'poultry';
};

// Helper: Get breed/type label and icon
export const getBreedOrTypeName = (type: string, category: MarketCategory = 'poultry', lang: 'bn' | 'en' = 'bn'): { name: string; icon: string } => {
  const norm = (type || '').toLowerCase();
  for (const catKey of ['poultry', 'cattle', 'fish'] as MarketCategory[]) {
    const found = CATEGORY_CONFIG[catKey].breeds.find(b => b.id.toLowerCase() === norm);
    if (found) {
      return { name: lang === 'bn' ? found.labelBn : found.labelEn, icon: found.icon };
    }
  }
  if (norm.includes('broiler')) return { name: lang === 'bn' ? 'ব্রয়লার মুরগি' : 'Broiler', icon: '🐔' };
  if (norm.includes('sonali')) return { name: lang === 'bn' ? 'সোনালী মুরগি' : 'Sonali', icon: '🐓' };
  if (norm.includes('layer')) return { name: lang === 'bn' ? 'লেয়ার মুরগি' : 'Layer', icon: '🥚' };
  if (norm.includes('deshi')) return { name: lang === 'bn' ? 'দেশি মুরগি' : 'Deshi', icon: '🍗' };
  return { name: lang === 'bn' ? (type || 'অন্যান্য') : (type || 'Other'), icon: '🏷️' };
};

export default function Marketplace() {
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const { hasAccess, openSubscriptionModal, isAdmin: sysAdmin } = useSystemConfig();

  const isAdmin = 
    Boolean(sysAdmin) || 
    currentUser?.email === 'skabusufian452@gmail.com' || 
    currentUser?.email === 'sr0632890@gmail.com';

  const [activeTab, setActiveTab] = useState<'posts' | 'buyers'>('posts');

  const [posts, setPosts] = useState<DemoMarketPost[]>([]);
  const [buyers, setBuyers] = useState<DemoMarketBuyer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | MarketCategory>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    const detected = detectUserCountry();
    return detected.code || 'BD';
  });
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [postTypeFilter, setPostTypeFilter] = useState<'all' | 'sell' | 'buy'>('all');
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(false);
  const [onlyMyPosts, setOnlyMyPosts] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals & Delete Dialogs
  const [showQuotaDetails, setShowQuotaDetails] = useState<boolean>(false);
  const [showLocationFilters, setShowLocationFilters] = useState<boolean>(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [showQuotaLimitModal, setShowQuotaLimitModal] = useState<boolean>(false);
  const [quotaConflictCategory, setQuotaConflictCategory] = useState<MarketCategory>('poultry');
  const [quotaConflictType, setQuotaConflictType] = useState<'sell' | 'buy'>('sell');
  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState<boolean>(false);
  const [postToDelete, setPostToDelete] = useState<DemoMarketPost | null>(null);
  const [buyerToDelete, setBuyerToDelete] = useState<DemoMarketBuyer | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);
  const [isSubmittingBuyer, setIsSubmittingBuyer] = useState<boolean>(false);
  const submitPostLock = React.useRef<boolean>(false);
  const submitBuyerLock = React.useRef<boolean>(false);

  // User's own stored post IDs (persisted locally so user always has immediate ownership)
  const [myCreatedPostIds, setMyCreatedPostIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('my_market_post_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Helper for generating clean WhatsApp link
  const formatWhatsAppUrl = (whatsappNum?: string, phoneNum?: string, message: string = '') => {
    const raw = (whatsappNum || phoneNum || '').replace(/[^0-9]/g, '');
    if (!raw) return '#';
    let formatted = raw;
    if (formatted.startsWith('880')) {
      // already standard BD
    } else if (formatted.startsWith('0') && formatted.length === 11) {
      formatted = '88' + formatted;
    } else if (formatted.length === 10 && formatted.startsWith('1')) {
      formatted = '880' + formatted;
    }
    return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
  };

  // Helper for generating clean Call link
  const formatTelUrl = (phoneNum?: string) => {
    const num = (phoneNum || '').replace(/[^0-9+]/g, '');
    if (!num) return '#';
    return `tel:${num}`;
  };

  // Sell/Buy Post Form State with 3 Categories (পাখি, পশু, মাছ)
  const [postForm, setPostForm] = useState({
    category: 'poultry' as MarketCategory,
    postType: 'sell' as 'sell' | 'buy',
    farmerName: '',
    farmName: '',
    phone: '',
    whatsapp: '',
    whatsappSameAsPhone: true,
    country: 'বাংলাদেশ',
    district: 'গাজীপুর',
    upazila: '',
    locationDetails: '',
    poultryType: 'broiler' as string, // Sub-breed according to category
    birdCount: '' as string | number,
    avgWeightKg: '' as string | number,
    expectedPricePerKg: '' as string | number,
    priceUnit: 'kg' as string, // 'kg' | 'piece' | 'maund'
    isEmergency: false,
    emergencyReason: '',
    notes: ''
  });

  // Helper to determine if current user owns a post
  const isPostOwner = (post: DemoMarketPost): boolean => {
    if (isDemoUser) return true;
    if (currentUser && post.userId === currentUser.uid) return true;
    if (currentUser?.email && (post as any).userEmail === currentUser.email) return true;
    if (post.phone && postForm.phone && post.phone.trim() === postForm.phone.trim()) return true;
    if (myCreatedPostIds.includes(post.id)) return true;
    if (post.userId === 'demo_user' || post.userId?.startsWith('demo_') || post.id?.startsWith('market_post_')) return true;
    return false;
  };

  // User's own active posts
  const myPosts = posts.filter(isPostOwner);

  // Get user's post in a specific category and type (if any)
  const getQuotaPost = (cat: MarketCategory, type: 'sell' | 'buy'): DemoMarketPost | undefined => {
    return myPosts.find(p => resolvePostCategory(p) === cat && (p.postType || 'sell') === type);
  };

  // Quota enforcement: max 1 sell post and max 1 buy post per category (total max 6)
  const hasReachedCategoryQuota = (cat: MarketCategory, type: 'sell' | 'buy', excludePostId?: string | null): boolean => {
    if (isAdmin) return false;
    return myPosts.some(p => 
      p.id !== excludePostId &&
      resolvePostCategory(p) === cat && 
      (p.postType || 'sell') === type
    );
  };

  // Total active quota used across all 3 categories (out of 6)
  const totalActiveAdsCount = (['poultry', 'cattle', 'fish'] as MarketCategory[]).reduce((acc, cat) => {
    const s = getQuotaPost(cat, 'sell') ? 1 : 0;
    const b = getQuotaPost(cat, 'buy') ? 1 : 0;
    return acc + s + b;
  }, 0);

  // Buyer Form State
  const [buyerForm, setBuyerForm] = useState({
    buyerName: '',
    businessName: '',
    phone: '',
    whatsapp: '',
    whatsappSameAsPhone: true,
    country: 'বাংলাদেশ',
    district: 'গাজীপুর',
    upazila: '',
    address: '',
    buyingTypes: ['broiler', 'sonali'] as string[],
    currentBuyingRate: '',
    dailyDemand: ''
  });

  // Initialize with user profile if available
  useEffect(() => {
    const isDemo = Boolean(isDemoUser || currentUser?.uid === 'demo_khamari_user_1' || !auth.currentUser);

    if (isDemo) {
      const profile = demoStore.getProfile();
      setPostForm(prev => ({
        ...prev,
        farmerName: profile.name || '',
        farmName: profile.farmName || '',
        phone: profile.phone || '',
        whatsapp: prev.whatsappSameAsPhone ? (profile.phone || '') : prev.whatsapp
      }));
    } else if (currentUser && auth.currentUser) {
      const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          setPostForm(prev => ({
            ...prev,
            farmerName: d.name || currentUser.displayName || '',
            farmName: d.farmName || '',
            phone: d.phone || '',
            whatsapp: prev.whatsappSameAsPhone ? (d.phone || '') : prev.whatsapp
          }));
        }
      });
      return () => unsub();
    }
  }, [currentUser, isDemoUser]);

  // Load Data
  useEffect(() => {
    const isDemo = Boolean(isDemoUser || currentUser?.uid === 'demo_khamari_user_1' || !auth.currentUser);

    if (isDemo) {
      const loadDemoData = () => {
        setPosts(demoStore.getMarketPosts());
        setBuyers(demoStore.getMarketBuyers());
        setLoading(false);
      };
      loadDemoData();
      const unsub = demoStore.subscribe(loadDemoData);
      return () => unsub();
    }

    // Firestore Realtime Listener for Posts with read limit optimization
    const qPosts = query(collection(db, 'marketplace_posts'), orderBy('createdAt', 'desc'), limit(60));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const postList: any[] = [];
      snapshot.forEach(docSnap => {
        postList.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Filter out any legacy dummy sample posts
      const validPosts = postList.filter(p => p && p.id !== 'post_1' && p.id !== 'post_2' && p.id !== 'post_3' && !p.userId?.startsWith('demo_other_user_'));
      setPosts(validPosts);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore posts error, loading local demo:", error);
      setPosts(demoStore.getMarketPosts());
      setLoading(false);
    });

    // Firestore Realtime Listener for Buyers with read limit optimization
    const qBuyers = query(collection(db, 'market_buyers'), orderBy('createdAt', 'desc'), limit(60));
    const unsubBuyers = onSnapshot(qBuyers, (snapshot) => {
      const buyerList: any[] = [];
      snapshot.forEach(docSnap => {
        buyerList.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (buyerList.length === 0) {
        setBuyers(demoStore.getMarketBuyers());
      } else {
        setBuyers(buyerList);
      }
    }, (error) => {
      console.warn("Firestore buyers error, loading local demo:", error);
      setBuyers(demoStore.getMarketBuyers());
    });

    return () => {
      unsubPosts();
      unsubBuyers();
    };
  }, [currentUser, isDemoUser]);

  // Open Post Modal (New Ad)
  const handleOpenPostModal = (preferredCategory?: MarketCategory, preferredType?: 'sell' | 'buy') => {
    setEditingPostId(null);
    let cat: MarketCategory = preferredCategory || (selectedCategoryFilter !== 'all' ? selectedCategoryFilter : 'poultry');
    let type: 'sell' | 'buy' = preferredType || 'sell';

    // If requested slot is full and not admin, try the other slot or an open category
    if (!isAdmin && hasReachedCategoryQuota(cat, type)) {
      const altType: 'sell' | 'buy' = type === 'sell' ? 'buy' : 'sell';
      if (!hasReachedCategoryQuota(cat, altType)) {
        type = altType;
      } else {
        const openCat = (['poultry', 'cattle', 'fish'] as MarketCategory[]).find(c => 
          !hasReachedCategoryQuota(c, 'sell') || !hasReachedCategoryQuota(c, 'buy')
        );
        if (openCat) {
          cat = openCat;
          type = !hasReachedCategoryQuota(cat, 'sell') ? 'sell' : 'buy';
        }
      }
    }

    const defaultBreed = CATEGORY_CONFIG[cat].breeds[0]?.id || 'broiler';
    const defaultPriceUnit = CATEGORY_CONFIG[cat].priceUnits[0]?.id || 'kg';

    setPostForm(prev => ({
      ...prev,
      category: cat,
      postType: type,
      poultryType: defaultBreed,
      birdCount: '',
      avgWeightKg: '',
      expectedPricePerKg: '',
      priceUnit: defaultPriceUnit,
      isEmergency: false,
      emergencyReason: '',
      notes: ''
    }));
    setIsPostModalOpen(true);
  };

  // Open Edit Post Modal
  const handleOpenEditPost = (post: DemoMarketPost) => {
    setEditingPostId(post.id);
    const cat = resolvePostCategory(post);
    const defaultPriceUnit = CATEGORY_CONFIG[cat].priceUnits[0]?.id || 'kg';

    setPostForm(prev => ({
      ...prev,
      category: cat,
      postType: post.postType || 'sell',
      farmerName: post.farmerName || '',
      farmName: post.farmName || '',
      phone: post.phone || '',
      whatsapp: post.whatsapp || post.phone || '',
      whatsappSameAsPhone: !post.whatsapp || post.whatsapp === post.phone,
      country: post.country || 'বাংলাদেশ',
      district: post.district || 'গাজীপুর',
      upazila: post.upazila || '',
      locationDetails: post.locationDetails || '',
      poultryType: post.poultryType || CATEGORY_CONFIG[cat].breeds[0].id,
      birdCount: post.birdCount ?? '',
      avgWeightKg: post.avgWeightKg ?? '',
      expectedPricePerKg: post.expectedPricePerKg ?? '',
      priceUnit: post.priceUnit || defaultPriceUnit,
      isEmergency: post.isEmergency || false,
      emergencyReason: post.emergencyReason || '',
      notes: post.notes || ''
    }));
    setIsPostModalOpen(true);
  };

  // Handle Post Submit (Double-Click Prevention, Quota Enforcement & Edit/Create Support)
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPost || submitPostLock.current) return;

    if (!postForm.farmerName || !postForm.phone || !postForm.birdCount || !postForm.expectedPricePerKg) {
      toast.error(language === 'bn' ? 'অনুগ্রহ করে প্রয়োজনীয় তথ্য পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    const targetCat = postForm.category || 'poultry';
    const targetType = postForm.postType || 'sell';

    // Quota Enforcement: Check if user already has an active post for this category & type (unless editing same post)
    if (!isAdmin && hasReachedCategoryQuota(targetCat, targetType, editingPostId)) {
      setQuotaConflictCategory(targetCat);
      setQuotaConflictType(targetType);
      setShowQuotaLimitModal(true);
      toast.error(
        language === 'bn'
          ? `${CATEGORY_CONFIG[targetCat].nameBn} বিভাগে আপনার ১টি ${targetType === 'sell' ? 'বিক্রয়' : 'ক্রয়'} বিজ্ঞাপন ইতিমধ্যে চালু আছে! (কোটা পূর্ণ)`
          : `You already have 1 active ${targetType} ad in this category! Quota reached.`
      );
      return;
    }

    // Deduplication check: prevent identical ad within 60 seconds (for new ads)
    if (!editingPostId) {
      const isDuplicate = posts.some(p => 
        p.phone === postForm.phone.trim() && 
        p.farmerName === postForm.farmerName.trim() &&
        Number(p.birdCount) === Number(postForm.birdCount) &&
        (Date.now() - new Date(p.createdAt || 0).getTime() < 60000)
      );

      if (isDuplicate) {
        toast.success(language === 'bn' ? 'বিজ্ঞাপন ইতিমধ্যে সফলভাবে প্রকাশিত হয়েছে!' : 'Ad already published!');
        setIsPostModalOpen(false);
        return;
      }
    }

    setIsSubmittingPost(true);
    submitPostLock.current = true;

    const birdCountNum = Number(postForm.birdCount) || 0;
    const avgWeightNum = Number(postForm.avgWeightKg) || 0;
    const totalWeightNum = Math.round(birdCountNum * avgWeightNum);
    const finalWhatsApp = postForm.whatsappSameAsPhone ? postForm.phone : (postForm.whatsapp || postForm.phone);

    const defaultFarmName = 
      targetType === 'buy' 
        ? (language === 'bn' ? 'ক্রয় চাহিদা / প্রতিষ্ঠান' : 'Buyer Profile') 
        : targetCat === 'cattle' 
        ? (language === 'bn' ? 'ডেইরি ও গবাদি খামার' : 'Dairy Farm') 
        : targetCat === 'fish' 
        ? (language === 'bn' ? 'মাছ চাষ প্রজেক্ট' : 'Fish Project') 
        : (language === 'bn' ? 'পোল্ট্রি খামার' : 'Poultry Farm');

    const postPayload = {
      userId: currentUser ? currentUser.uid : 'demo_user',
      userEmail: currentUser?.email || '',
      category: targetCat,
      postType: targetType,
      farmerName: postForm.farmerName.trim(),
      farmName: postForm.farmName.trim() || defaultFarmName,
      phone: postForm.phone.trim(),
      whatsapp: finalWhatsApp.trim(),
      country: postForm.country || 'বাংলাদেশ',
      district: postForm.district,
      upazila: postForm.upazila.trim(),
      locationDetails: postForm.locationDetails.trim() || postForm.district,
      poultryType: postForm.poultryType,
      birdCount: birdCountNum,
      avgWeightKg: avgWeightNum,
      totalWeightKg: totalWeightNum,
      expectedPricePerKg: Number(postForm.expectedPricePerKg) || 0,
      priceUnit: postForm.priceUnit || 'kg',
      isEmergency: targetType === 'sell' ? postForm.isEmergency : false,
      emergencyReason: targetType === 'sell' ? postForm.emergencyReason.trim() : '',
      notes: postForm.notes.trim()
    };

    try {
      if (editingPostId) {
        // UPDATE MODE
        const updatedData = {
          ...postPayload,
          updatedAt: new Date().toISOString()
        };

        if (isDemoUser) {
          demoStore.saveMarketPost({ ...updatedData, id: editingPostId } as any);
        } else {
          try {
            await updateDoc(doc(db, 'marketplace_posts', editingPostId), updatedData);
          } catch (err) {
            demoStore.saveMarketPost({ ...updatedData, id: editingPostId } as any);
          }
        }

        setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, ...updatedData } : p));
        toast.success(language === 'bn' ? 'বিজ্ঞাপন সফলভাবে আপডেট করা হয়েছে!' : 'Ad updated successfully!');
      } else {
        // CREATE NEW MODE
        let savedPostId = 'market_post_' + Date.now();
        const newPostData = {
          ...postPayload,
          status: 'available' as const,
          createdAt: new Date().toISOString()
        };

        if (isDemoUser) {
          const res = demoStore.saveMarketPost(newPostData);
          savedPostId = res.id;
        } else {
          try {
            const docRef = await addDoc(collection(db, 'marketplace_posts'), newPostData);
            savedPostId = docRef.id;
          } catch (err) {
            const res = demoStore.saveMarketPost(newPostData);
            savedPostId = res.id;
          }
        }

        // Save to myCreatedPostIds for immediate ownership across reloads
        const updatedIds = [savedPostId, ...myCreatedPostIds.filter(id => id !== savedPostId)];
        setMyCreatedPostIds(updatedIds);
        try {
          localStorage.setItem('my_market_post_ids', JSON.stringify(updatedIds));
        } catch {}

        const catName = CATEGORY_CONFIG[targetCat].nameBn;
        const typeName = targetType === 'sell' ? 'বিক্রয়' : 'ক্রয়';
        toast.success(
          language === 'bn' 
            ? `বিজ্ঞাপন সফলভাবে প্রকাশিত হয়েছে! (${catName} - ${typeName}: ১/১ ব্যবহৃত)` 
            : `Ad posted successfully!`
        );
      }

      setIsPostModalOpen(false);
      setEditingPostId(null);
      admobService.showInterstitialIfEligible('action:saved_market_post', true);

      // Reset form fields
      setPostForm(prev => ({
        ...prev,
        birdCount: '',
        avgWeightKg: '',
        expectedPricePerKg: '',
        isEmergency: false,
        emergencyReason: '',
        notes: ''
      }));
    } catch (err) {
      toast.error(language === 'bn' ? 'বিজ্ঞাপন প্রক্রিয়াকরণে সমস্যা হয়েছে' : 'Failed to process ad');
    } finally {
      setIsSubmittingPost(false);
      setTimeout(() => {
        submitPostLock.current = false;
      }, 1500);
    }
  };

  // Handle Buyer Submit (Double-Click Prevention & Deduplication)
  const handleCreateBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingBuyer || submitBuyerLock.current) return;

    if (!buyerForm.buyerName || !buyerForm.businessName || !buyerForm.phone) {
      toast.error(language === 'bn' ? 'নাম, প্রতিষ্ঠানের নাম ও ফোন নম্বর দিন' : 'Please fill buyer details');
      return;
    }

    // Deduplication check: prevent duplicate buyer entry within 60 seconds
    const isDuplicate = buyers.some(b =>
      b.phone === buyerForm.phone.trim() &&
      b.businessName.toLowerCase() === buyerForm.businessName.trim().toLowerCase() &&
      (Date.now() - new Date(b.createdAt || 0).getTime() < 60000)
    );

    if (isDuplicate) {
      toast.success(language === 'bn' ? 'পাইকার ডিরেক্টরিতে নাম ইতিমধ্যে যুক্ত হয়েছে!' : 'Buyer already registered!');
      setIsBuyerModalOpen(false);
      return;
    }

    setIsSubmittingBuyer(true);
    submitBuyerLock.current = true;

    const finalWhatsApp = buyerForm.whatsappSameAsPhone ? buyerForm.phone : (buyerForm.whatsapp || buyerForm.phone);

    const newBuyerData = {
      userId: currentUser ? currentUser.uid : 'demo_user',
      buyerName: buyerForm.buyerName.trim(),
      businessName: buyerForm.businessName.trim(),
      phone: buyerForm.phone.trim(),
      whatsapp: finalWhatsApp.trim(),
      country: buyerForm.country || 'বাংলাদেশ',
      district: buyerForm.district,
      upazila: buyerForm.upazila.trim(),
      address: buyerForm.address.trim() || buyerForm.district,
      buyingTypes: buyerForm.buyingTypes.length > 0 ? buyerForm.buyingTypes : ['broiler'],
      currentBuyingRate: buyerForm.currentBuyingRate.trim() || (language === 'bn' ? 'চলমান বাজার দর' : 'Market Rate'),
      dailyDemand: buyerForm.dailyDemand.trim() || (language === 'bn' ? 'প্রয়োজন অনুযায়ী' : 'As needed'),
      verified: true,
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoUser) {
        demoStore.saveMarketBuyer(newBuyerData);
      } else {
        try {
          await addDoc(collection(db, 'market_buyers'), newBuyerData);
        } catch (err) {
          demoStore.saveMarketBuyer(newBuyerData);
        }
      }
      toast.success(language === 'bn' ? 'পাইকার ডিরেক্টরিতে নাম যুক্ত হয়েছে!' : 'Buyer registered successfully!');
      setIsBuyerModalOpen(false);
      admobService.showInterstitialIfEligible('action:saved_buyer', true);
      setBuyerForm(prev => ({
        ...prev,
        buyerName: '',
        businessName: '',
        phone: '',
        whatsapp: '',
        currentBuyingRate: '',
        dailyDemand: ''
      }));
    } catch (err) {
      toast.error(language === 'bn' ? 'যুক্ত করতে সমস্যা হয়েছে' : 'Failed to register buyer');
    } finally {
      setIsSubmittingBuyer(false);
      setTimeout(() => {
        submitBuyerLock.current = false;
      }, 1500);
    }
  };

  // Toggle Sold Status
  const handleToggleSold = async (post: DemoMarketPost) => {
    const nextStatus = post.status === 'sold' ? 'available' : 'sold';
    try {
      if (isDemoUser) {
        demoStore.saveMarketPost({ ...post, status: nextStatus });
      } else {
        try {
          await updateDoc(doc(db, 'marketplace_posts', post.id), { status: nextStatus });
        } catch (e) {
          demoStore.saveMarketPost({ ...post, status: nextStatus });
        }
      }
      toast.success(
        nextStatus === 'sold' 
          ? (language === 'bn' ? 'মুরগি বিক্রি সম্পন্ন হিসেবে চিহ্নিত হয়েছে' : 'Marked as Sold!')
          : (language === 'bn' ? 'পুনরায় বিক্রির জন্য সক্রিয় করা হয়েছে' : 'Marked as Available!')
      );
    } catch (e) {
      toast.error('Status update failed');
    }
  };

  // Delete Post Handler with Confirmation
  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    const postId = postToDelete.id;
    const cat = resolvePostCategory(postToDelete);
    const typeName = (postToDelete.postType || 'sell') === 'sell' ? 'বিক্রয়' : 'ক্রয়';
    const catName = CATEGORY_CONFIG[cat].nameBn;

    try {
      demoStore.deleteMarketPost(postId);
      if (!isDemoUser && auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'marketplace_posts', postId));
        } catch (e) {
          console.warn("Firestore delete post notice:", e);
        }
      }

      // Free quota slot immediately
      const remainingIds = myCreatedPostIds.filter(id => id !== postId);
      setMyCreatedPostIds(remainingIds);
      try {
        localStorage.setItem('my_market_post_ids', JSON.stringify(remainingIds));
      } catch {}

      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success(
        language === 'bn' 
          ? `${catName} বিভাগে ১টি ${typeName} বিজ্ঞাপনের স্লট খালি হয়েছে। এখন নতুন বিজ্ঞাপন দিতে পারবেন।` 
          : 'Ad deleted. Quota slot is now free.'
      );
      setPostToDelete(null);
    } catch (e) {
      toast.error(language === 'bn' ? 'বিজ্ঞাপন ডিলিট করতে সমস্যা হয়েছে' : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Buyer Handler with Confirmation
  const handleConfirmDeleteBuyer = async () => {
    if (!buyerToDelete) return;
    setIsDeleting(true);
    const buyerId = buyerToDelete.id;
    try {
      demoStore.deleteMarketBuyer(buyerId);
      if (!isDemoUser && auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'market_buyers', buyerId));
        } catch (e) {
          console.warn("Firestore delete buyer notice:", e);
        }
      }
      setBuyers(prev => prev.filter(b => b.id !== buyerId));
      toast.success(language === 'bn' ? 'পাইকার ডিরেক্টরি থেকে মুছে ফেলা হয়েছে' : 'Buyer profile deleted');
      setBuyerToDelete(null);
    } catch (e) {
      toast.error(language === 'bn' ? 'ডিলিট করতে সমস্যা হয়েছে' : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  // Formatting time ago
  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return language === 'bn' ? 'এইমাত্র' : 'Just now';
    if (diff < 3600) return language === 'bn' ? `${Math.floor(diff / 60)} মিনিট আগে` : `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return language === 'bn' ? `${Math.floor(diff / 3600)} ঘণ্টা আগে` : `${Math.floor(diff / 3600)}h ago`;
    return language === 'bn' ? `${Math.floor(diff / 86400)} দিন আগে` : `${Math.floor(diff / 86400)}d ago`;
  };

  // Filtered Posts
  const filteredPosts = posts.filter(post => {
    // 1. Category Filter (পাখি, পশু, মাছ)
    const postCat = resolvePostCategory(post);
    if (selectedCategoryFilter !== 'all' && postCat !== selectedCategoryFilter) return false;

    // 2. My Posts Filter
    if (onlyMyPosts) {
      if (!isPostOwner(post)) return false;
    }

    // 3. Emergency Filter
    if (emergencyOnly && !post.isEmergency) return false;

    // 4. Post Type Filter (Sell vs Buy)
    if (postTypeFilter !== 'all') {
      const type = post.postType || 'sell';
      if (type !== postTypeFilter) return false;
    }

    // 5. Country Filter
    if (selectedCountry !== 'all') {
      const postCountryCode = normalizeCountryCode(post.country || 'BD');
      const selectedCountryCode = normalizeCountryCode(selectedCountry);
      if (postCountryCode !== selectedCountryCode) return false;
    }

    // 6. District Filter
    if (selectedDistrict !== 'all') {
      const postDistBn = getDistrictDisplayName(post.district, 'bn');
      const selDistBn = getDistrictDisplayName(selectedDistrict, 'bn');
      if (postDistBn !== selDistBn && post.district !== selectedDistrict) return false;
    }

    // 7. Sub-breed Filter
    if (selectedTypeFilter !== 'all' && post.poultryType !== selectedTypeFilter) return false;

    // 8. Search Term Match
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchLoc = (post.district || '').toLowerCase().includes(q) || (post.locationDetails || '').toLowerCase().includes(q) || (post.upazila || '').toLowerCase().includes(q) || (post.country || '').toLowerCase().includes(q);
      const matchFarmer = (post.farmerName || '').toLowerCase().includes(q) || (post.farmName || '').toLowerCase().includes(q) || (post.phone || '').includes(q);
      const matchBreed = (post.poultryType || '').toLowerCase().includes(q);
      if (!matchLoc && !matchFarmer && !matchBreed) return false;
    }
    return true;
  });

  // Filtered Buyers
  const filteredBuyers = buyers.filter(buyer => {
    if (onlyMyPosts) {
      const isMine = (currentUser && buyer.userId === currentUser.uid) || isDemoUser || buyer.userId === 'demo_user' || (buyerForm.phone && buyer.phone === buyerForm.phone);
      if (!isMine) return false;
    }
    if (selectedCountry !== 'all') {
      const buyerCountryCode = normalizeCountryCode(buyer.country || 'BD');
      const selectedCountryCode = normalizeCountryCode(selectedCountry);
      if (buyerCountryCode !== selectedCountryCode) return false;
    }
    if (selectedDistrict !== 'all') {
      const buyerDistBn = getDistrictDisplayName(buyer.district, 'bn');
      const selDistBn = getDistrictDisplayName(selectedDistrict, 'bn');
      if (buyerDistBn !== selDistBn && buyer.district !== selectedDistrict) return false;
    }
    if (selectedTypeFilter !== 'all' && !buyer.buyingTypes.includes(selectedTypeFilter)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = (buyer.buyerName || '').toLowerCase().includes(q) || (buyer.businessName || '').toLowerCase().includes(q) || (buyer.phone || '').includes(q);
      const matchLoc = (buyer.district || '').toLowerCase().includes(q) || (buyer.address || '').toLowerCase().includes(q) || (buyer.country || '').toLowerCase().includes(q);
      if (!matchName && !matchLoc) return false;
    }
    return true;
  });

  const getPoultryTypeName = (type: string, category: MarketCategory = 'poultry') => {
    return getBreedOrTypeName(type, category, language as 'bn' | 'en').name;
  };

  const handleOpenBuyerModal = () => {
    setIsBuyerModalOpen(true);
  };

  return (
    <div className="space-y-3 pb-8 animate-fadeIn select-none">
      
      {/* 1. Header Banner & Action Buttons (Ultra-Compact ~46px) */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
            <Store size={17} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black tracking-tight leading-tight truncate">
              {language === 'bn' ? 'খামারি ও পাইকার বাজার' : 'Wholesale Market & Hub'}
            </h2>
            <p className="text-[9.5px] text-emerald-200/90 font-bold truncate">
              {language === 'bn' ? 'সরাসরি মোবাইল ও হোয়াটসঅ্যাপে ক্রয়-বিক্রয়' : 'Direct poultry marketplace'}
            </p>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => handleOpenPostModal()}
            className="py-1.5 px-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{language === 'bn' ? 'বিজ্ঞাপন দিন' : 'New Ad'}</span>
          </button>

          <button
            onClick={handleOpenBuyerModal}
            className="py-1.5 px-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl font-black text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 backdrop-blur-xs"
          >
            <Users size={14} />
            <span>{language === 'bn' ? '+পাইকার' : '+Buyer'}</span>
          </button>
        </div>
      </div>

      {/* 2. Slim 1-Line Security Disclaimer */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl px-2.5 py-1 text-[10.5px] text-amber-900 font-bold flex items-center justify-between gap-1 shadow-2xs">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-xs shrink-0">⚠️</span>
          <span className="truncate">
            {language === 'bn' 
              ? 'সতর্কতা: পণ্য না বুঝে কাউকে অগ্রিম টাকা পাঠাবেন না। নিজ দায়িত্বে লেনদেন করুন।' 
              : 'Notice: Never send advance money without product verification.'}
          </span>
        </div>
        <span className="text-[9px] bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded font-black shrink-0">
          {language === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'COD'}
        </span>
      </div>

      {/* 3. Chick Market & Hatchery Link (Slim 1-Line Strip) */}
      <Link
        to="/chicks"
        className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-950 font-bold text-[11px] hover:bg-amber-500/25 transition-all shadow-2xs"
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-sm shrink-0">🐣</span>
          <span className="font-black text-amber-900 truncate">
            {language === 'bn' ? 'বাচ্চার বাজার ও হ্যাচারি বুকিং (A, B, C গ্রেড রেট ও বিজ্ঞাপন)' : 'Chick & Hatchery Market (A, B, C Grade)'}
          </span>
        </div>
        <span className="text-[10px] font-black text-amber-950 bg-amber-400/80 px-2 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
          <span>{language === 'bn' ? 'প্রবেশ' : 'View'}</span>
          <ChevronRight size={11} />
        </span>
      </Link>

      {/* 4. Dual Tab Selector (বিজ্ঞাপন বোর্ড vs পাইকারি ক্রেতা তালিকা) */}
      <div className="bg-white p-1 rounded-2xl shadow-xs border border-slate-200/80 flex gap-1">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Flame size={13} className={activeTab === 'posts' ? 'text-amber-300' : 'text-amber-500'} />
          <span>{language === 'bn' ? 'ক্রয়-বিক্রয় বিজ্ঞাপন' : 'Market Ads'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-sans ${
            activeTab === 'posts' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {posts.filter(p => p.status !== 'sold').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('buyers')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'buyers'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck size={13} className={activeTab === 'buyers' ? 'text-amber-300' : 'text-emerald-600'} />
          <span>{language === 'bn' ? 'পাইকারি ক্রেতা ডিরেক্টরি' : 'Wholesale Buyers'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-sans ${
            activeTab === 'buyers' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {buyers.length}
          </span>
        </button>
      </div>

      {/* 5. Collapsible Quota Strip (Saves ~200px!) */}
      {activeTab === 'posts' && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-teal-950 text-white rounded-2xl p-2 sm:p-2.5 shadow-xs border border-slate-700/60 space-y-1.5">
          {/* 1-Line Quota Summary Bar */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm shrink-0">📊</span>
              <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-white">
                  {language === 'bn' ? 'কোটা:' : 'Quota:'}
                </span>
                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md text-[10px] font-black font-sans">
                  {totalActiveAdsCount}/৬ {language === 'bn' ? 'ব্যবহৃত' : 'Used'}
                </span>
                <span className="text-[9px] text-slate-400 hidden xs:inline">
                  ({language === 'bn' ? 'পাখি, পশু, মাছ: প্রতিটিতে ১ বিক্রি + ১ ক্রয়' : '1 Buy + 1 Sell each'})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setShowQuotaDetails(!showQuotaDetails)}
                className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all flex items-center gap-1 border ${
                  showQuotaDetails
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-white/10 text-amber-300 border-amber-400/30 hover:bg-white/15'
                }`}
              >
                <span>{showQuotaDetails ? (language === 'bn' ? 'সংক্ষেপ ▴' : 'Hide ▴') : (language === 'bn' ? 'কোটা স্লট ▾' : 'Slots ▾')}</span>
              </button>

              <button
                onClick={() => handleOpenPostModal()}
                className="py-0.5 px-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-black text-[10.5px] cursor-pointer transition-all active:scale-95 shadow-xs flex items-center gap-0.5"
              >
                <Plus size={11} strokeWidth={3} />
                <span>{language === 'bn' ? 'বিজ্ঞাপন' : 'Ad'}</span>
              </button>
            </div>
          </div>

          {/* Expanded 3 Categories Grid (Only when user taps 'কোটা স্লট') */}
          {showQuotaDetails && (
            <div className="pt-1.5 border-t border-white/10 animate-in fade-in space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {(['poultry', 'cattle', 'fish'] as MarketCategory[]).map((catKey) => {
                  const cfg = CATEGORY_CONFIG[catKey];
                  const sellPost = getQuotaPost(catKey, 'sell');
                  const buyPost = getQuotaPost(catKey, 'buy');
                  const categoryUsedCount = (sellPost ? 1 : 0) + (buyPost ? 1 : 0);

                  return (
                    <div key={catKey} className="bg-white/5 rounded-xl p-2 border border-white/10 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-white flex items-center gap-1">
                          <span>{cfg.icon}</span>
                          <span>{language === 'bn' ? cfg.nameBn : cfg.nameEn}</span>
                        </span>
                        <span className="text-[10px] text-amber-300 font-sans font-bold">
                          {categoryUsedCount}/২
                        </span>
                      </div>

                      <div className="space-y-1">
                        {/* Sell Slot */}
                        <div className={`p-1 rounded-lg text-[10px] flex items-center justify-between transition-colors ${
                          sellPost ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200' : 'bg-white/5 text-slate-400'
                        }`}>
                          <span className="font-bold flex items-center gap-1">
                            <span>📢 বিক্রি:</span>
                            {sellPost ? (
                              <span className="text-emerald-300 font-black">১/১ পূর্ণ</span>
                            ) : (
                              <span className="text-slate-400">০/১ খালি</span>
                            )}
                          </span>
                          {sellPost ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditPost(sellPost)}
                                className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9.5px] font-black cursor-pointer active:scale-95 transition-all shadow-2xs"
                              >
                                এডিট
                              </button>
                              <button
                                onClick={() => setPostToDelete(sellPost)}
                                className="px-1 py-0.5 bg-red-500/30 hover:bg-red-500/60 text-red-300 rounded text-[9.5px] font-black cursor-pointer transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenPostModal(catKey, 'sell')}
                              className="px-1.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded text-[9.5px] font-black cursor-pointer active:scale-95 transition-all"
                            >
                              + দিন
                            </button>
                          )}
                        </div>

                        {/* Buy Slot */}
                        <div className={`p-1 rounded-lg text-[10px] flex items-center justify-between transition-colors ${
                          buyPost ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-200' : 'bg-white/5 text-slate-400'
                        }`}>
                          <span className="font-bold flex items-center gap-1">
                            <span>🛒 ক্রয়:</span>
                            {buyPost ? (
                              <span className="text-indigo-300 font-black">১/১ পূর্ণ</span>
                            ) : (
                              <span className="text-slate-400">০/১ খালি</span>
                            )}
                          </span>
                          {buyPost ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditPost(buyPost)}
                                className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9.5px] font-black cursor-pointer active:scale-95 transition-all shadow-2xs"
                              >
                                এডিট
                              </button>
                              <button
                                onClick={() => setPostToDelete(buyPost)}
                                className="px-1 py-0.5 bg-red-500/30 hover:bg-red-500/60 text-red-300 rounded text-[9.5px] font-black cursor-pointer transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenPostModal(catKey, 'buy')}
                              className="px-1.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded text-[9.5px] font-black cursor-pointer active:scale-95 transition-all"
                            >
                              + দিন
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Search & Compact Category/District Filter Bar */}
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-xs border border-slate-200 space-y-1.5">
        
        {/* 6.1 Main Category Navigation Tabs (সকল, পাখি, পশু, মাছ) */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded-xl">
            <button
              onClick={() => { setSelectedCategoryFilter('all'); setSelectedTypeFilter('all'); }}
              className={`py-1 px-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                selectedCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>🌟 {language === 'bn' ? 'সকল' : 'All'}</span>
            </button>
            <button
              onClick={() => { setSelectedCategoryFilter('poultry'); setSelectedTypeFilter('all'); }}
              className={`py-1 px-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                selectedCategoryFilter === 'poultry'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-900 hover:bg-white/60'
              }`}
            >
              <span>🐦 {language === 'bn' ? 'পাখি' : 'Poultry'}</span>
            </button>
            <button
              onClick={() => { setSelectedCategoryFilter('cattle'); setSelectedTypeFilter('all'); }}
              className={`py-1 px-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                selectedCategoryFilter === 'cattle'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-amber-900 hover:bg-white/60'
              }`}
            >
              <span>🐄 {language === 'bn' ? 'পশু' : 'Cattle'}</span>
            </button>
            <button
              onClick={() => { setSelectedCategoryFilter('fish'); setSelectedTypeFilter('all'); }}
              className={`py-1 px-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                selectedCategoryFilter === 'fish'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-cyan-900 hover:bg-white/60'
              }`}
            >
              <span>🐟 {language === 'bn' ? 'মাছ' : 'Fish'}</span>
            </button>
          </div>
        )}

        {/* Search Input + Location Filter Toggle Button in 1 Line */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'bn' ? 'এলাকা, জাত বা নাম দিয়ে খুঁজুন...' : 'Search area, breed, name...'}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowLocationFilters(!showLocationFilters)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
              selectedDistrict !== 'all' || selectedCountry !== 'all' || showLocationFilters
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title={language === 'bn' ? 'দেশ ও জেলা ফিল্টার' : 'Filter Location'}
          >
            <MapPin size={13} />
            <span className="hidden xs:inline">
              {selectedDistrict !== 'all' 
                ? selectedDistrict 
                : (language === 'bn' ? 'জেলা' : 'District')}
            </span>
            <ChevronRight size={12} className={`transition-transform duration-200 ${showLocationFilters ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Collapsible Location Dropdowns (Only appears when user taps the filter button) */}
        {showLocationFilters && (
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 xs:grid-cols-2 gap-1.5 animate-in fade-in">
            <div className="relative">
              <Globe size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
              <select
                value={selectedCountry}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCountry(val);
                  if (normalizeCountryCode(val) !== 'BD' && val !== 'all') {
                    setSelectedDistrict('all');
                  }
                }}
                className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">🌍 {language === 'bn' ? 'সকল দেশ' : 'All Countries'}</option>
                {COUNTRY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {language === 'bn' ? c.nameBn : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {(selectedCountry === 'all' || normalizeCountryCode(selectedCountry) === 'BD') && (
              <div className="relative">
                <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">📍 {language === 'bn' ? 'সকল জেলা' : 'All Districts'}</option>
                  {ALL_64_DISTRICTS.map((d) => (
                    <option key={d.nameBn} value={d.nameBn}>
                      {language === 'bn' ? `${d.nameBn} জেলা` : `${d.nameEn} District`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Quick Tags Filter (Single Clean Horizontal Scroll Row) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {/* All */}
          <button
            onClick={() => { setSelectedTypeFilter('all'); setPostTypeFilter('all'); setEmergencyOnly(false); setOnlyMyPosts(false); }}
            className={`px-2 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              selectedTypeFilter === 'all' && postTypeFilter === 'all' && !emergencyOnly && !onlyMyPosts
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'bn' ? 'সকল' : 'All'}
          </button>

          {/* My Ads Tag */}
          <button
            onClick={() => setOnlyMyPosts(!onlyMyPosts)}
            className={`px-2 py-1 rounded-lg font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              onlyMyPosts
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <UserCheck size={12} />
            <span>{language === 'bn' ? `আমার বিজ্ঞাপন (${totalActiveAdsCount}/৬)` : `My Ads (${totalActiveAdsCount}/6)`}</span>
          </button>

          {/* Sell Filter */}
          <button
            onClick={() => { setPostTypeFilter(postTypeFilter === 'sell' ? 'all' : 'sell'); setEmergencyOnly(false); }}
            className={`px-2 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              postTypeFilter === 'sell'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {language === 'bn' ? '📢 বিক্রয়' : 'Sell'}
          </button>

          {/* Buy Filter */}
          <button
            onClick={() => { setPostTypeFilter(postTypeFilter === 'buy' ? 'all' : 'buy'); setEmergencyOnly(false); }}
            className={`px-2 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              postTypeFilter === 'buy'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {language === 'bn' ? '🛒 ক্রয়' : 'Buy'}
          </button>

          {/* Emergency Tag */}
          <button
            onClick={() => { setEmergencyOnly(!emergencyOnly); }}
            className={`px-2 py-1 rounded-lg font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              emergencyOnly
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            }`}
          >
            <Flame size={12} />
            {language === 'bn' ? '🚨 জরুরি' : '🚨 Urgent'}
          </button>

          {/* Dynamic Breed / Species Tags */}
          {selectedCategoryFilter === 'all' ? (
            <>
              {[
                { id: 'broiler', label: language === 'bn' ? 'ব্রয়লার' : 'Broiler', icon: '🐔' },
                { id: 'sonali', label: language === 'bn' ? 'সোনালী' : 'Sonali', icon: '🐓' },
                { id: 'bull', label: language === 'bn' ? 'গরু' : 'Cattle', icon: '🐂' },
                { id: 'goat', label: language === 'bn' ? 'ছাগল' : 'Goat', icon: '🐐' },
                { id: 'carp_rohu', label: language === 'bn' ? 'রুই/কার্প' : 'Carp', icon: '🐟' },
                { id: 'tilapia', label: language === 'bn' ? 'তেলাপিয়া' : 'Tilapia', icon: '🐠' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedTypeFilter(selectedTypeFilter === item.id ? 'all' : item.id)}
                  className={`px-2 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                    selectedTypeFilter === item.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </>
          ) : (
            CATEGORY_CONFIG[selectedCategoryFilter].breeds.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedTypeFilter(selectedTypeFilter === b.id ? 'all' : b.id)}
                className={`px-2 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  selectedTypeFilter === b.id
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{b.icon}</span>
                <span>{language === 'bn' ? b.labelBn : b.labelEn}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 7. Tab 1: Sell Posts Feed */}
      {activeTab === 'posts' && (
        <div className="space-y-2.5">
          {/* Feed Header with Prominent Animated Down Indicator */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-100/90 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5">
              <Store size={14} className="text-emerald-700 shrink-0" />
              <h3 className="text-xs font-black text-slate-850">
                {language === 'bn' ? 'বাজারের বিজ্ঞাপন' : 'Market Ads'}
              </h3>
              <span className="bg-emerald-600 text-white text-[9.5px] font-black px-1.5 py-0.2 rounded-full font-sans">
                {filteredPosts.length}টি
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {(selectedCategoryFilter !== 'all' || selectedTypeFilter !== 'all' || postTypeFilter !== 'all' || emergencyOnly || onlyMyPosts || searchTerm || selectedDistrict !== 'all' || selectedCountry !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryFilter('all');
                    setSelectedTypeFilter('all');
                    setPostTypeFilter('all');
                    setEmergencyOnly(false);
                    setOnlyMyPosts(false);
                    setSearchTerm('');
                    setSelectedDistrict('all');
                    setSelectedCountry('all');
                  }}
                  className="text-[10px] text-rose-600 font-extrabold hover:underline cursor-pointer"
                >
                  {language === 'bn' ? 'রিসেট' : 'Reset'}
                </button>
              )}

              {/* Bouncing Scroll Down Guide Badge */}
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-bounce">
                <span>👇 {language === 'bn' ? 'নিচে বিজ্ঞাপনগুলো দেখুন' : 'Ads below'}</span>
              </div>
            </div>
          </div>

          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              const isDirectOwner = isPostOwner(post);
              const canManage = isDirectOwner || isAdmin;
              const isSold = post.status === 'sold';
              const isBuyRequest = post.postType === 'buy';
              const whatsappNumber = post.whatsapp || post.phone;

              const postCat = resolvePostCategory(post);
              const breedInfo = getBreedOrTypeName(post.poultryType, postCat, language as 'bn' | 'en');
              const cfg = CATEGORY_CONFIG[postCat];

              return (
                <div 
                  key={post.id}
                  className={`bg-white rounded-3xl p-3.5 sm:p-4 shadow-xs border transition-all ${
                    post.isEmergency 
                      ? 'border-red-300 ring-1 ring-red-100 bg-linear-to-b from-red-50/20 to-white' 
                      : isBuyRequest
                      ? 'border-indigo-200/90 ring-1 ring-indigo-50 bg-linear-to-b from-indigo-50/20 to-white'
                      : canManage
                      ? 'border-teal-200/90'
                      : 'border-slate-200/90'
                  } ${isSold ? 'opacity-70 bg-slate-50/80' : ''}`}
                >
                  {/* Top Badge & Post Time */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {post.isEmergency ? (
                        <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <Flame size={11} />
                          {language === 'bn' ? 'জরুরি বিক্রি' : 'EMERGENCY SELL'}
                        </span>
                      ) : isBuyRequest ? (
                        <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          🛒 {language === 'bn' ? 'ক্রয় চাহিদা' : 'Wanted to Buy'}
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                          📢 {language === 'bn' ? 'বিক্রয় বিজ্ঞাপন' : 'For Sale'}
                        </span>
                      )}

                      {/* Category & Breed Badge */}
                      <span className="bg-slate-100 text-slate-800 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200">
                        <span>{breedInfo.icon}</span>
                        <span>{breedInfo.name}</span>
                      </span>

                      <span className="bg-teal-50 text-teal-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-teal-200 hidden sm:inline-flex items-center gap-1">
                        <span>{cfg.icon}</span>
                        <span>{language === 'bn' ? cfg.shortLabelBn : cfg.nameEn}</span>
                      </span>

                      {canManage && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          {isAdmin && !isDirectOwner ? <Crown size={10} className="text-amber-700" /> : <Check size={10} className="text-emerald-700" />}
                          <span>{isDirectOwner ? (language === 'bn' ? 'আমার বিজ্ঞাপন' : 'My Ad') : (language === 'bn' ? 'মাস্টার অ্যাডমিন' : 'Master Admin')}</span>
                        </span>
                      )}

                      {isSold && (
                        <span className="bg-slate-800 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                          ✓ {language === 'bn' ? (isBuyRequest ? 'ক্রয় সম্পন্ন' : 'বিক্রি সম্পন্ন') : (isBuyRequest ? 'Purchased' : 'Sold Out')}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-0.5">
                      <Clock size={10} />
                      {formatTimeAgo(post.createdAt)}
                    </span>
                  </div>

                  {/* Main Information Grid with Category-appropriate units */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                    {/* 1. Count */}
                    <div className="bg-slate-50/90 p-2 rounded-2xl border border-slate-150">
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">
                        {language === 'bn' ? (isBuyRequest ? 'প্রয়োজনীয় পরিমাণ' : cfg.countLabelBn) : cfg.countLabelEn}
                      </span>
                      <p className="text-xs font-black text-slate-850 font-sans">
                        {post.birdCount} {postCat === 'cattle' ? (language === 'bn' ? 'টি' : 'head') : (language === 'bn' ? 'টি/পিস' : 'pcs')}
                      </p>
                    </div>

                    {/* 2. Weight */}
                    <div className="bg-slate-50/90 p-2 rounded-2xl border border-slate-150">
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">
                        {language === 'bn' ? (isBuyRequest ? 'প্রত্যাশিত ওজন' : cfg.weightLabelBn) : cfg.weightLabelEn}
                      </span>
                      <p className="text-xs font-black text-indigo-700 font-sans">
                        {post.avgWeightKg} {postCat === 'fish' && post.avgWeightKg < 1 ? (language === 'bn' ? 'গ্রাম/কেজি' : 'g/kg') : (language === 'bn' ? 'কেজি' : 'kg')}
                      </p>
                    </div>

                    {/* 3. Estimated Total Weight */}
                    <div className="bg-slate-50/90 p-2 rounded-2xl border border-slate-150">
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">
                        {language === 'bn' ? 'মোট আনুমানিক ওজন' : 'Total Weight'}
                      </span>
                      <p className="text-xs font-black text-emerald-700 font-sans">
                        {post.totalWeightKg || Math.round(post.birdCount * post.avgWeightKg)} {language === 'bn' ? 'কেজি' : 'kg'}
                      </p>
                    </div>

                    {/* 4. Expected Price */}
                    <div className={`${isBuyRequest ? 'bg-indigo-50/80 border-indigo-200' : 'bg-emerald-50/80 border-emerald-200'} p-2 rounded-2xl border`}>
                      <span className={`text-[9px] font-bold ${isBuyRequest ? 'text-indigo-800' : 'text-emerald-800'} block mb-0.5`}>
                        {language === 'bn' ? (isBuyRequest ? 'প্রস্তাবিত বাজেট/দর' : 'কাঙ্ক্ষিত দর') : 'Rate'}
                      </span>
                      <p className={`text-xs font-black ${isBuyRequest ? 'text-indigo-700' : 'text-emerald-700'} font-sans`}>
                        ৳ {post.expectedPricePerKg}{' '}
                        <span className="text-[9px] font-bold">
                          /{post.priceUnit === 'piece' 
                            ? (language === 'bn' ? 'পিস' : 'pc') 
                            : post.priceUnit === 'maund' 
                            ? (language === 'bn' ? 'মণ' : 'maund') 
                            : (language === 'bn' ? 'কেজি' : 'kg')}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Emergency Reason or Notes */}
                  {post.isEmergency && post.emergencyReason && (
                    <div className="mb-2.5 bg-red-50 p-2 rounded-xl border border-red-150 flex items-start gap-1.5">
                      <AlertCircle size={13} className="text-red-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-700 font-bold leading-tight">
                        <span className="underline">{language === 'bn' ? 'জরুরি কারণ:' : 'Reason:'}</span> {post.emergencyReason}
                      </p>
                    </div>
                  )}

                  {post.notes && !post.isEmergency && (
                    <p className="text-[10px] text-slate-600 bg-slate-50/80 p-2 rounded-xl mb-2.5 font-medium leading-relaxed border border-slate-150">
                      "{post.notes}"
                    </p>
                  )}

                  {/* Location & Farmer Contact Footer */}
                  <div className="bg-slate-50/90 rounded-2xl p-2.5 border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-black text-slate-850">
                        <MapPin size={12} className="text-red-500 shrink-0" />
                        <span>
                          {getDistrictDisplayName(post.district, language)} {post.upazila ? `(${post.upazila})` : ''}
                          {post.country && normalizeCountryCode(post.country) !== 'BD' ? `, ${getCountryDisplayName(post.country, language)}` : ''}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-bold truncate">{post.farmName || (isBuyRequest ? (language === 'bn' ? 'ক্রেতা' : 'Buyer') : (language === 'bn' ? 'খামার' : 'Farm'))}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium pl-4 mt-0.5">
                        {post.locationDetails} ({isBuyRequest ? (language === 'bn' ? 'বিজ্ঞাপনদাতা' : 'Advertiser') : (language === 'bn' ? 'খামারি' : 'Farmer')}: {post.farmerName})
                      </p>
                    </div>

                    {/* Action Call & WhatsApp Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={formatTelUrl(post.phone)}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
                      >
                        <Phone size={13} />
                        <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          const msg = `আসসালামু আলাইকুম, আমি আপনার অ্যাপের বিজ্ঞাপন দেখেছি (${breedInfo.name}, ${post.birdCount} টি/পিস, ${post.district}${post.country && post.country !== 'বাংলাদেশ' ? `, ${post.country}` : ''})। বিস্তারিত কথা বলতে চাই।`;
                          openWhatsAppSafe({
                            phone: post.whatsapp || post.phone,
                            message: msg,
                            lang: language === 'bn' ? 'bn' : 'en',
                            fallbackPhone: post.phone
                          });
                        }}
                        className="py-1.5 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-xs cursor-pointer"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </button>

                      {/* Owner / Master Admin Controls Top Quick Icons */}
                      {canManage && (
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5 ml-1">
                          <button
                            onClick={() => handleOpenEditPost(post)}
                            title={language === 'bn' ? 'বিজ্ঞাপন এডিট করুন' : 'Edit Ad'}
                            className="p-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleToggleSold(post)}
                            title={isSold ? "Mark Active" : "Mark as Sold"}
                            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                              isSold 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setPostToDelete(post)}
                            title={isAdmin && !isDirectOwner ? "Admin Delete Post" : "Delete Post"}
                            className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prominent Owner / Master Admin Action Bar */}
                  {canManage && (
                    <div className={`mt-2.5 pt-2 border-t flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl ${
                      isAdmin && !isDirectOwner 
                        ? 'border-red-200 bg-red-50/70 text-red-950' 
                        : 'border-slate-150 bg-amber-50/70 text-amber-950'
                    }`}>
                      <div className="flex items-center gap-1.5 text-[11px] font-black">
                        {isAdmin && !isDirectOwner ? (
                          <>
                            <Crown size={14} className="text-red-600" />
                            <span className="text-red-900">{language === 'bn' ? 'মাস্টার অ্যাডমিন পাওয়ার (যেকোনো বিজ্ঞাপন ডিলিট):' : 'Master Admin Action:'}</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={14} className="text-amber-700" />
                            <span>{language === 'bn' ? 'আপনার বিজ্ঞাপন পরিচালনা:' : 'Manage Your Ad:'}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditPost(post)}
                          className="py-1.5 px-3 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 text-white transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <Pencil size={12} />
                          <span>{language === 'bn' ? 'এডিট করুন' : 'Edit Ad'}</span>
                        </button>

                        <button
                          onClick={() => handleToggleSold(post)}
                          className={`py-1.5 px-3 rounded-xl text-xs font-black border transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs ${
                            isSold 
                              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' 
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <Check size={13} strokeWidth={2.5} />
                          <span>{isSold ? (language === 'bn' ? 'সক্রিয় করুন' : 'Activate') : (language === 'bn' ? 'বিক্রি সম্পন্ন' : 'Mark Sold')}</span>
                        </button>

                        <button
                          onClick={() => setPostToDelete(post)}
                          className="py-1.5 px-3 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <Trash2 size={13} />
                          <span>{isAdmin && !isDirectOwner ? (language === 'bn' ? 'অ্যাডমিন ডিলিট' : 'Admin Delete') : (language === 'bn' ? 'বিজ্ঞাপন মুছুন' : 'Delete Ad')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center border-dashed border-2 border-slate-200 space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Store size={24} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800">
                {language === 'bn' ? 'কোনো বিজ্ঞাপন পাওয়া যায়নি' : 'No posts found'}
              </h3>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                {onlyMyPosts
                  ? (language === 'bn' ? 'আপনার কোনো সক্রিয় বিজ্ঞাপন নেই। নতুন বিজ্ঞাপন দিতে নিচের বাটনে চাপ দিন।' : 'You have not posted any ads yet.')
                  : (language === 'bn' 
                    ? 'আপনার খামারের মুরগি বিক্রি করার জন্য নিচের বাটনে চাপ দিয়ে এখনই বিজ্ঞাপন দিন।' 
                    : 'Post a sell alert to connect with ready wholesale buyers in your area.')}
              </p>
              <button
                onClick={() => handleOpenPostModal()}
                className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                {language === 'bn' ? 'নতুন বিজ্ঞাপন দিন' : 'Create Post'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Wholesale Buyers Directory Feed */}
      {activeTab === 'buyers' && (
        <div className="space-y-2.5">
          {/* Feed Header with Prominent Animated Down Indicator */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-100/90 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
              <h3 className="text-xs font-black text-slate-850">
                {language === 'bn' ? 'পাইকারি ক্রেতা তালিকা' : 'Wholesale Buyers'}
              </h3>
              <span className="bg-emerald-600 text-white text-[9.5px] font-black px-1.5 py-0.2 rounded-full font-sans">
                {filteredBuyers.length}জন
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {(searchTerm || selectedDistrict !== 'all' || selectedCountry !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDistrict('all');
                    setSelectedCountry('all');
                  }}
                  className="text-[10px] text-rose-600 font-extrabold hover:underline cursor-pointer"
                >
                  {language === 'bn' ? 'রিসেট' : 'Reset'}
                </button>
              )}

              {/* Bouncing Scroll Down Guide Badge */}
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-bounce">
                <span>👇 {language === 'bn' ? 'নিচে পাইকারদের দেখুন' : 'Buyers below'}</span>
              </div>
            </div>
          </div>

          {filteredBuyers.length > 0 ? (
            filteredBuyers.map((buyer) => {
              const isDirectBuyerOwner = Boolean(
                currentUser && (
                  buyer.userId === currentUser.uid ||
                  isDemoUser ||
                  buyer.userId === 'demo_user' ||
                  (buyerForm.phone && buyer.phone === buyerForm.phone)
                )
              );
              const canManageBuyer = isDirectBuyerOwner || isAdmin;

              return (
                <div 
                  key={buyer.id}
                  className={`bg-white rounded-3xl p-3.5 sm:p-4 shadow-xs border transition-all ${
                    canManageBuyer ? 'border-amber-200 hover:border-amber-300' : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {/* Buyer Header */}
                  <div className="flex items-start justify-between pb-2 border-b border-slate-100 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm shrink-0 border border-amber-200">
                        🏢
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                            {buyer.businessName}
                          </h4>
                          {buyer.verified && (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.2 rounded-full border border-emerald-200 flex items-center gap-0.5">
                              <ShieldCheck size={9} />
                              {language === 'bn' ? 'যাচাইকৃত' : 'Verified'}
                            </span>
                          )}
                          {canManageBuyer && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[8px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                              {isAdmin && !isDirectBuyerOwner ? <Crown size={9} className="text-amber-700" /> : <Check size={9} className="text-emerald-700" />}
                              <span>{isDirectBuyerOwner ? (language === 'bn' ? 'আমার প্রোফাইল' : 'My Profile') : (language === 'bn' ? 'মাস্টার অ্যাডমিন' : 'Master Admin')}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                          {buyer.buyerName} (পাইকারি ক্রেতা / আড়তদার)
                        </p>
                      </div>
                    </div>

                    <span className="bg-slate-100 text-slate-700 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <MapPin size={10} className="text-red-500" />
                      {buyer.district}
                    </span>
                  </div>

                  {/* Purchase Scope & Buying Rate */}
                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    {/* Current Rate */}
                    <div className="bg-emerald-50/70 p-2 rounded-2xl border border-emerald-150">
                      <span className="text-[9px] font-bold text-emerald-800 block mb-0.5">
                        {language === 'bn' ? 'আজকের কেনার আনুমানিক দর' : 'Buying Rate'}
                      </span>
                      <p className="text-xs font-black text-emerald-700 font-sans">
                        {buyer.currentBuyingRate || (language === 'bn' ? 'বাজার দর অনুযায়ী' : 'Market Rate')}
                      </p>
                    </div>

                    {/* Daily Demand */}
                    <div className="bg-slate-50 p-2 rounded-2xl border border-slate-150">
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">
                        {language === 'bn' ? 'দৈনিক ক্রয় সক্ষমতা' : 'Daily Demand'}
                      </span>
                      <p className="text-xs font-black text-slate-800 font-sans">
                        {buyer.dailyDemand || (language === 'bn' ? 'যেকোনো পরিমাণ' : 'Any quantity')}
                      </p>
                    </div>
                  </div>

                  {/* Types of Poultry Accepted */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    <span className="text-[9px] font-bold text-slate-400">
                      {language === 'bn' ? 'যা ক্রয় করেন:' : 'Accepts:'}
                    </span>
                    {buyer.buyingTypes.map((type, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                        🐔 {getPoultryTypeName(type)}
                      </span>
                    ))}
                  </div>

                  {/* Address & Direct Call Buttons */}
                  <div className="bg-slate-50/90 rounded-2xl p-2.5 border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400 shrink-0" />
                      <span>
                        {buyer.address || getDistrictDisplayName(buyer.district, language)}
                        {buyer.country && normalizeCountryCode(buyer.country) !== 'BD' ? `, ${getCountryDisplayName(buyer.country, language)}` : ''}
                      </span>
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={formatTelUrl(buyer.phone)}
                        className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
                      >
                        <Phone size={13} />
                        <span>{language === 'bn' ? 'সরাসরি কল' : 'Call Buyer'}</span>
                      </a>

                      {buyer.whatsapp && (
                        <button
                          type="button"
                          onClick={() => {
                            const msg = `আসসালামু আলাইকুম, আমি খামারি। আপনার আড়তে মুরগি বিক্রির বিষয়ে কথা বলতে চাচ্ছি (${buyer.district}${buyer.country && buyer.country !== 'বাংলাদেশ' ? `, ${buyer.country}` : ''})।`;
                            openWhatsAppSafe({
                              phone: buyer.whatsapp,
                              message: msg,
                              lang: language === 'bn' ? 'bn' : 'en',
                              fallbackPhone: buyer.phone
                            });
                          }}
                          className="py-1.5 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-xs cursor-pointer"
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </button>
                      )}

                      {/* Owner / Master Admin Delete Option */}
                      {canManageBuyer && (
                        <button
                          onClick={() => setBuyerToDelete(buyer)}
                          title={isAdmin && !isDirectBuyerOwner ? "Admin Delete Buyer Profile" : "Delete Buyer Profile"}
                          className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prominent Owner / Master Admin Management Bar for Buyer Profile */}
                  {canManageBuyer && (
                    <div className={`mt-2 pt-2 border-t flex items-center justify-between gap-2 p-2 rounded-2xl ${
                      isAdmin && !isDirectBuyerOwner 
                        ? 'border-red-200 bg-red-50/70 text-red-950' 
                        : 'border-slate-150 bg-amber-50/70 text-amber-950'
                    }`}>
                      <div className="flex items-center gap-1.5 text-[11px] font-black">
                        {isAdmin && !isDirectBuyerOwner ? (
                          <>
                            <Crown size={13} className="text-red-600" />
                            <span className="text-red-900">{language === 'bn' ? 'মাস্টার অ্যাডমিন পাওয়ার (যেকোনো প্রোফাইল অপসারণ):' : 'Master Admin Action:'}</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={13} className="text-amber-700" />
                            <span>{language === 'bn' ? 'আপনার পাইকার প্রোফাইল:' : 'Your Buyer Profile:'}</span>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => setBuyerToDelete(buyer)}
                        className="py-1 px-2.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <Trash2 size={12} />
                        <span>{isAdmin && !isDirectBuyerOwner ? (language === 'bn' ? 'প্রোফাইল মুছুন' : 'Admin Delete') : (language === 'bn' ? 'প্রোফাইল মুছুন' : 'Delete Profile')}</span>
                      </button>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center border-dashed border-2 border-slate-200 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800">
                {language === 'bn' ? 'কোনো পাইকারি ক্রেতা পাওয়া যায়নি' : 'No wholesale buyers found'}
              </h3>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                {language === 'bn' 
                  ? 'আপনি কি পাইকারি মুরগি ক্রয় করেন? এখনই আপনার আড়তের তথ্য যুক্ত করুন।' 
                  : 'Are you a buyer? Register your shop to get direct supply from local farmers.'}
              </p>
              <button
                onClick={handleOpenBuyerModal}
                className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                {language === 'bn' ? 'পাইকার হিসেবে নাম দিন' : 'Register as Buyer'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. Modal: Create or Edit Marketplace Ad (বিজ্ঞাপন দিন বা এডিট করুন) */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-3.5 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 border ${
                  editingPostId 
                    ? 'bg-teal-100 text-teal-800 border-teal-200' 
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {editingPostId ? '✏️' : '📢'}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-850 leading-tight">
                    {editingPostId 
                      ? (language === 'bn' ? 'বিজ্ঞাপনের তথ্য সম্পাদনা করুন (Edit Ad)' : 'Edit Marketplace Ad') 
                      : (language === 'bn' ? 'বাজারের জন্য নতুন বিজ্ঞাপন দিন' : 'Post New Marketplace Ad')}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                    {language === 'bn' 
                      ? 'প্রতি ক্যাটাগরিতে ১টি ক্রয় ও ১টি বিক্রি বিজ্ঞাপন কোটা প্রযোজ্য' 
                      : 'Max 1 Buy + 1 Sell ad per category quota'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsPostModalOpen(false); setEditingPostId(null); }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs font-bold text-slate-700">
              
              {/* Step 1: Category Selector (পাখি, পশু, মাছ) */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {language === 'bn' ? '১. শ্রেণি নির্বাচন করুন (Category) *' : '1. Select Category *'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['poultry', 'cattle', 'fish'] as MarketCategory[]).map(catKey => {
                    const cfg = CATEGORY_CONFIG[catKey];
                    const isSelected = postForm.category === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => {
                          const defaultBreed = cfg.breeds[0]?.id || 'broiler';
                          const defaultUnit = cfg.priceUnits[0]?.id || 'kg';
                          setPostForm({
                            ...postForm,
                            category: catKey,
                            poultryType: defaultBreed,
                            priceUnit: defaultUnit
                          });
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{cfg.icon}</span>
                        <span>{language === 'bn' ? cfg.shortLabelBn : cfg.nameEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Post Type Selector (বিক্রি vs ক্রয়) */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {language === 'bn' ? '২. বিজ্ঞাপনের ধরন নির্বাচন করুন (Ad Type) *' : '2. Ad Type *'}
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setPostForm({ ...postForm, postType: 'sell' })}
                    className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      postForm.postType === 'sell'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📢 {language === 'bn' ? 'বিক্রয় বিজ্ঞাপন (Sell)' : 'For Sale (Seller)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostForm({ ...postForm, postType: 'buy', isEmergency: false })}
                    className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      postForm.postType === 'buy'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🛒 {language === 'bn' ? 'ক্রয় চাহিদা (Buy)' : 'Wanted to Buy'}</span>
                  </button>
                </div>
              </div>

              {/* Quota Conflict Inline Alert (If current selection is full and not admin) */}
              {hasReachedCategoryQuota(postForm.category, postForm.postType, editingPostId) && !isAdmin && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-amber-950 flex items-start gap-2.5 animate-fadeIn">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-black text-amber-900">
                      {CATEGORY_CONFIG[postForm.category].nameBn} বিভাগে আপনার ১টি {postForm.postType === 'sell' ? 'বিক্রয়' : 'ক্রয়'} বিজ্ঞাপন ইতিমধ্যে চালু আছে! (কোটা পূর্ণ)
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      সিস্টেমের সুরক্ষা নিশ্চিত করতে প্রতি বিভাগে সর্বোচ্চ ১টি বিক্রয় ও ১টি ক্রয় বিজ্ঞাপনের কোটা নির্ধারিত।
                    </p>
                    {getQuotaPost(postForm.category, postForm.postType) && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPost(getQuotaPost(postForm.category, postForm.postType)!)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black text-xs cursor-pointer shadow-2xs"
                        >
                          ✏️ আগের বিজ্ঞাপনটি এডিট করুন
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsPostModalOpen(false);
                            setPostToDelete(getQuotaPost(postForm.category, postForm.postType)!);
                          }}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-black text-xs cursor-pointer"
                        >
                          🗑️ ডিলিট করে স্লট খালি করুন
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Sale Toggle Switch (Only for sell posts) */}
              {postForm.postType === 'sell' && (
                <div className={`p-3 rounded-2xl border transition-all ${
                  postForm.isEmergency 
                    ? 'bg-red-50/80 border-red-300 ring-1 ring-red-200' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className={postForm.isEmergency ? 'text-red-600 animate-bounce' : 'text-slate-400'} />
                      <div>
                        <span className={`text-xs font-black ${postForm.isEmergency ? 'text-red-700' : 'text-slate-800'}`}>
                          {language === 'bn' ? '🚨 জরুরি বিক্রি (Emergency Sale)' : '🚨 Emergency Sale Alert'}
                        </span>
                        <p className="text-[9px] text-slate-400 font-medium">
                          {language === 'bn' ? 'দ্রুত লট ক্লিয়ার বা জরুরি বিক্রির ক্ষেত্রে অন করুন' : 'Turn on for urgent lot clearance'}
                        </p>
                      </div>
                    </div>

                    <input 
                      type="checkbox"
                      checked={postForm.isEmergency}
                      onChange={(e) => setPostForm({ ...postForm, isEmergency: e.target.checked })}
                      className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                    />
                  </div>

                  {postForm.isEmergency && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <label className="text-[10px] text-red-800 block mb-1">
                        {language === 'bn' ? 'জরুরি বিক্রির কারণ (সংক্ষেপে):' : 'Emergency Reason:'}
                      </label>
                      <input 
                        type="text"
                        value={postForm.emergencyReason}
                        onChange={(e) => setPostForm({ ...postForm, emergencyReason: e.target.value })}
                        placeholder={language === 'bn' ? 'যেমন: প্রচণ্ড গরম / ওভার সাইজ / দ্রুত ফান্ড প্রয়োজন' : 'e.g. Extreme heat / rapid cash requirement'}
                        className="w-full p-2 bg-white border border-red-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-hidden"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Breed / Species Selection Dynamic to Category */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {language === 'bn' 
                    ? `৩. ${CATEGORY_CONFIG[postForm.category].shortLabelBn}র জাত / প্রজাতি নির্বাচন করুন *` 
                    : '3. Select Breed / Species *'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {CATEGORY_CONFIG[postForm.category].breeds.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setPostForm({ ...postForm, poultryType: b.id })}
                      className={`py-2 px-1.5 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                        postForm.poultryType === b.id 
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{b.icon}</span>
                      <span className="truncate">{language === 'bn' ? b.labelBn : b.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Count, Avg Weight, Rate Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' 
                      ? (postForm.postType === 'buy' ? 'প্রয়োজনীয় পরিমাণ *' : `${CATEGORY_CONFIG[postForm.category].countLabelBn} *`)
                      : 'Quantity *'}
                  </label>
                  <input 
                    type="number"
                    required
                    value={postForm.birdCount}
                    onChange={(e) => setPostForm({ ...postForm, birdCount: e.target.value })}
                    placeholder={CATEGORY_CONFIG[postForm.category].countPlaceholder}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' 
                      ? (postForm.postType === 'buy' ? 'প্রত্যাশিত ওজন *' : `${CATEGORY_CONFIG[postForm.category].weightLabelBn} *`)
                      : 'Avg Weight *'}
                  </label>
                  <input 
                    type="number"
                    step="0.05"
                    required
                    value={postForm.avgWeightKg}
                    onChange={(e) => setPostForm({ ...postForm, avgWeightKg: e.target.value })}
                    placeholder={CATEGORY_CONFIG[postForm.category].weightPlaceholder}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' 
                      ? (postForm.postType === 'buy' ? 'প্রস্তাবিত দর (৳) *' : `${CATEGORY_CONFIG[postForm.category].priceLabelBn} *`)
                      : 'Rate (৳) *'}
                  </label>
                  <input 
                    type="number"
                    required
                    value={postForm.expectedPricePerKg}
                    onChange={(e) => setPostForm({ ...postForm, expectedPricePerKg: e.target.value })}
                    placeholder={CATEGORY_CONFIG[postForm.category].pricePlaceholder}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Price Unit Selector */}
              {CATEGORY_CONFIG[postForm.category].priceUnits.length > 1 && (
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'দরের হিসাব একক নির্বাচন করুন:' : 'Price Unit:'}
                  </label>
                  <div className="flex gap-2">
                    {CATEGORY_CONFIG[postForm.category].priceUnits.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setPostForm({ ...postForm, priceUnit: u.id })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          postForm.priceUnit === u.id
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {language === 'bn' ? u.labelBn : u.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto Total Weight Preview */}
              {Number(postForm.birdCount) > 0 && Number(postForm.avgWeightKg) > 0 && (
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center justify-between text-xs font-black text-emerald-800">
                  <span>{language === 'bn' ? 'মোট আনুমানিক ওজন:' : 'Total estimated lot weight:'}</span>
                  <span className="font-sans">
                    {Math.round(Number(postForm.birdCount) * Number(postForm.avgWeightKg))} কেজি
                  </span>
                </div>
              )}

              {/* Farmer/Buyer Name */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {language === 'bn' ? (postForm.postType === 'buy' ? 'আপনার নাম / প্রতিষ্ঠানের নাম *' : 'আপনার নাম *') : 'Your Name *'}
                </label>
                <input 
                  type="text"
                  required
                  value={postForm.farmerName}
                  onChange={(e) => setPostForm({ ...postForm, farmerName: e.target.value })}
                  placeholder={language === 'bn' ? 'মো. রফিক / বিসমিল্লাহ ট্রেডার্স' : 'Md. Rafiq'}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                />
              </div>

              {/* Phone & WhatsApp Number Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1 flex items-center gap-1">
                    <Phone size={10} className="text-emerald-600" />
                    <span>{language === 'bn' ? 'মোবাইল নম্বর *' : 'Phone Number *'}</span>
                  </label>
                  <input 
                    type="tel"
                    required
                    value={postForm.phone}
                    onChange={(e) => setPostForm({ ...postForm, phone: e.target.value })}
                    placeholder="01711XXXXXX"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1 flex items-center gap-1">
                    <MessageCircle size={10} className="text-green-600" />
                    <span>{language === 'bn' ? 'হোয়াটসঅ্যাপ (WhatsApp)' : 'WhatsApp'}</span>
                  </label>
                  <input 
                    type="tel"
                    value={postForm.whatsapp}
                    onChange={(e) => setPostForm({ ...postForm, whatsapp: e.target.value })}
                    placeholder={language === 'bn' ? '01711XXXXXX (ঐচ্ছিক)' : '01711XXXXXX (optional)'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Country Selection */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-bold">
                  {language === 'bn' ? 'দেশ নির্বাচন করুন *' : 'Select Country *'}
                </label>
                <select
                  value={postForm.country || 'BD'}
                  onChange={(e) => {
                    const c = e.target.value;
                    setPostForm({ ...postForm, country: c, district: normalizeCountryCode(c) === 'BD' ? 'গাজীপুর' : '' });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {COUNTRY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {language === 'bn' ? c.nameBn : c.nameEn} ({c.dialCode || ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* District & Location Details */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1 font-bold">
                    {normalizeCountryCode(postForm.country) === 'BD'
                      ? (language === 'bn' ? 'জেলা * (৬৪ জেলা)' : 'District * (64 Districts)')
                      : (language === 'bn' ? 'শহর / জেলা / রাজ্য *' : 'City / State / District *')}
                  </label>
                  {normalizeCountryCode(postForm.country) === 'BD' ? (
                    <select
                      value={postForm.district}
                      onChange={(e) => setPostForm({ ...postForm, district: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {BANGLADESH_DIVISIONS.map((div) => (
                        <optgroup key={div.en} label={language === 'bn' ? `${div.bn} বিভাগ` : `${div.en} Division`}>
                          {ALL_64_DISTRICTS.filter(d => d.divisionBn === div.bn).map(d => (
                            <option key={d.nameBn} value={d.nameBn}>
                              {language === 'bn' ? d.nameBn : d.nameEn}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text"
                      required
                      value={postForm.district}
                      onChange={(e) => setPostForm({ ...postForm, district: e.target.value })}
                      placeholder={language === 'bn' ? 'যেমন: কলকাতা / রিয়াদ / দুবাই' : 'e.g. Kolkata / Riyadh / Dubai'}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'উপজেলা / এলাকা / খামারের নাম' : 'Area / Upazila / Farm Name'}
                  </label>
                  <input 
                    type="text"
                    value={postForm.upazila}
                    onChange={(e) => setPostForm({ ...postForm, upazila: e.target.value })}
                    placeholder={language === 'bn' ? 'শ্রীপুর / সবুজ খামার' : 'Area / Farm'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Specific Location Details */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {language === 'bn' ? 'সঠিক ঠিকানা / গাড়ি পৌঁছানোর লোকেশন' : 'Exact Address'}
                </label>
                <input 
                  type="text"
                  value={postForm.locationDetails}
                  onChange={(e) => setPostForm({ ...postForm, locationDetails: e.target.value })}
                  placeholder={language === 'bn' ? 'যেমন: মাওনা চৌরাস্তা থেকে ২ কিমি পূর্বে' : 'e.g. 2 km east from Maona'}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {language === 'bn' ? 'অতিরিক্ত মন্তব্য (যদি থাকে)' : 'Notes'}
                </label>
                <textarea 
                  rows={2}
                  value={postForm.notes}
                  onChange={(e) => setPostForm({ ...postForm, notes: e.target.value })}
                  placeholder={language === 'bn' ? 'যেমন: আজ রাতেই বা কাল সকালে তুলে নেওয়া যাবে...' : 'Any details for buyers...'}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden resize-none"
                />
              </div>

              {/* Submit Button with Quota Guard & Double-Click Protection */}
              <button
                type="submit"
                disabled={isSubmittingPost || (hasReachedCategoryQuota(postForm.category, postForm.postType, editingPostId) && !isAdmin)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 text-white rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                {isSubmittingPost ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{language === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving...'}</span>
                  </>
                ) : editingPostId ? (
                  <>
                    <Pencil size={15} />
                    <span>{language === 'bn' ? 'বিজ্ঞাপনের তথ্য আপডেট করুন' : 'Update Ad'}</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>{language === 'bn' ? 'বিজ্ঞাপনটি প্রকাশ করুন' : 'Publish Ad'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6.5 Dedicated Quota Limit Alert Modal */}
      {showQuotaLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-150 max-w-sm w-full space-y-3.5 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">
                {language === 'bn' 
                  ? `${CATEGORY_CONFIG[quotaConflictCategory].nameBn} কোটা পূর্ণ` 
                  : 'Category Ad Quota Reached'}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {language === 'bn' 
                  ? `সিস্টেমের সমতা বজায় রাখতে প্রতি বিভাগে সর্বোচ্চ ১টি বিক্রয় ও ১টি ক্রয় বিজ্ঞাপন দেওয়া যায়। এই বিভাগে আপনার ১টি ${quotaConflictType === 'sell' ? 'বিক্রয়' : 'ক্রয়'} বিজ্ঞাপন ইতিমধ্যে চালু আছে।` 
                  : `Each user is allowed max 1 Buy and 1 Sell ad per category.`}
              </p>
            </div>

            {getQuotaPost(quotaConflictCategory, quotaConflictType) && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
                <p className="font-extrabold text-slate-900 flex items-center gap-1">
                  <span>{CATEGORY_CONFIG[quotaConflictCategory].icon}</span>
                  <span>{getBreedOrTypeName(getQuotaPost(quotaConflictCategory, quotaConflictType)!.poultryType, quotaConflictCategory, language as 'bn' | 'en').name}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  সংখ্যা: {getQuotaPost(quotaConflictCategory, quotaConflictType)!.birdCount} | দর: ৳ {getQuotaPost(quotaConflictCategory, quotaConflictType)!.expectedPricePerKg}
                </p>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {getQuotaPost(quotaConflictCategory, quotaConflictType) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const target = getQuotaPost(quotaConflictCategory, quotaConflictType)!;
                      setShowQuotaLimitModal(false);
                      handleOpenEditPost(target);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Pencil size={14} />
                    <span>{language === 'bn' ? 'বিদ্যমান বিজ্ঞাপন এডিট করুন' : 'Edit Existing Ad'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const target = getQuotaPost(quotaConflictCategory, quotaConflictType)!;
                      setShowQuotaLimitModal(false);
                      setIsPostModalOpen(false);
                      setPostToDelete(target);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>{language === 'bn' ? 'বিজ্ঞাপন মুছে নতুন বিজ্ঞাপন দিন' : 'Delete and Free Slot'}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowQuotaLimitModal(false)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Register as Buyer (পাইকার হিসেবে যুক্ত হন) */}
      {isBuyerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-3.5 animate-scaleUp">
            
            {/* Modal Top */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0 border border-emerald-200">
                  🏢
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-850 leading-tight">
                    {language === 'bn' ? 'পাইকারি ক্রেতা / আড়তদার ডিরেক্টরি' : 'Register as Wholesale Buyer'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                    {language === 'bn' ? 'খামারিরা সরাসরি আপনার সাথে যোগাযোগ করে মুরগি বিক্রি করবে' : 'Farmers will call you directly for supplying poultry'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsBuyerModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBuyer} className="space-y-3 text-xs font-bold text-slate-700">
              
              {/* Buyer Name & Shop Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'আপনার নাম *' : 'Your Name *'}
                  </label>
                  <input 
                    type="text"
                    required
                    value={buyerForm.buyerName}
                    onChange={(e) => setBuyerForm({ ...buyerForm, buyerName: e.target.value })}
                    placeholder="হাজী রফিকুল ইসলাম"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'আড়ত / প্রতিষ্ঠানের নাম *' : 'Business / Shop Name *'}
                  </label>
                  <input 
                    type="text"
                    required
                    value={buyerForm.businessName}
                    onChange={(e) => setBuyerForm({ ...buyerForm, businessName: e.target.value })}
                    placeholder="বিসমিল্লাহ পোল্ট্রি আড়ত"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                  </label>
                  <input 
                    type="tel"
                    required
                    value={buyerForm.phone}
                    onChange={(e) => setBuyerForm({ ...buyerForm, phone: e.target.value })}
                    placeholder="01711XXXXXX"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর' : 'WhatsApp Number'}
                  </label>
                  <input 
                    type="tel"
                    value={buyerForm.whatsapp}
                    onChange={(e) => setBuyerForm({ ...buyerForm, whatsapp: e.target.value })}
                    placeholder="01711XXXXXX"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Country Selection */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-bold">
                  {language === 'bn' ? 'দেশ নির্বাচন করুন *' : 'Select Country *'}
                </label>
                <select
                  value={buyerForm.country || 'BD'}
                  onChange={(e) => {
                    const c = e.target.value;
                    setBuyerForm({ ...buyerForm, country: c, district: normalizeCountryCode(c) === 'BD' ? 'গাজীপুর' : '' });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {COUNTRY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {language === 'bn' ? c.nameBn : c.nameEn} ({c.dialCode || ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* District & Location */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1 font-bold">
                    {normalizeCountryCode(buyerForm.country) === 'BD'
                      ? (language === 'bn' ? 'জেলা * (৬৪ জেলা)' : 'District * (64 Districts)')
                      : (language === 'bn' ? 'শহর / জেলা / রাজ্য *' : 'City / State / District *')}
                  </label>
                  {normalizeCountryCode(buyerForm.country) === 'BD' ? (
                    <select
                      value={buyerForm.district}
                      onChange={(e) => setBuyerForm({ ...buyerForm, district: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {BANGLADESH_DIVISIONS.map((div) => (
                        <optgroup key={div.en} label={language === 'bn' ? `${div.bn} বিভাগ` : `${div.en} Division`}>
                          {ALL_64_DISTRICTS.filter(d => d.divisionBn === div.bn).map(d => (
                            <option key={d.nameBn} value={d.nameBn}>
                              {language === 'bn' ? d.nameBn : d.nameEn}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text"
                      required
                      value={buyerForm.district}
                      onChange={(e) => setBuyerForm({ ...buyerForm, district: e.target.value })}
                      placeholder={language === 'bn' ? 'যেমন: কলকাতা / রিয়াদ / দুবাই' : 'e.g. Kolkata / Riyadh / Dubai'}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'আড়ত / বাজারের ঠিকানা' : 'Market Address'}
                  </label>
                  <input 
                    type="text"
                    value={buyerForm.address}
                    onChange={(e) => setBuyerForm({ ...buyerForm, address: e.target.value })}
                    placeholder={language === 'bn' ? 'জয়দেবপুর বাজার, গাজীপুর' : 'Market Address'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Rates & Demand */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'চলমান ক্রয়দর (যেমন: ১৭৫-১৮০ ৳)' : 'Current Rate Range'}
                  </label>
                  <input 
                    type="text"
                    value={buyerForm.currentBuyingRate}
                    onChange={(e) => setBuyerForm({ ...buyerForm, currentBuyingRate: e.target.value })}
                    placeholder="১৭৫ - ১৮০ ৳/কেজি"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'দৈনিক চাহিদা (যেমন: ২-৩ টন)' : 'Daily Demand'}
                  </label>
                  <input 
                    type="text"
                    value={buyerForm.dailyDemand}
                    onChange={(e) => setBuyerForm({ ...buyerForm, dailyDemand: e.target.value })}
                    placeholder="৩ টন প্রতিদিন"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Button with Double-Click Protection */}
              <button
                type="submit"
                disabled={isSubmittingBuyer}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 text-white rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                {isSubmittingBuyer ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{language === 'bn' ? 'তথ্য সংরক্ষিত হচ্ছে...' : 'Registering Profile...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{language === 'bn' ? 'পাইকার ডিরেক্টরিতে নাম যোগ করুন' : 'Register Buyer Profile'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 8. Dedicated Delete Confirmation Modal for Posts */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-150 max-w-sm w-full space-y-3.5 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">
                {language === 'bn' ? 'বিজ্ঞাপনটি মুছে ফেলতে চান?' : 'Delete this Ad?'}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {language === 'bn' 
                  ? 'এই বিজ্ঞাপনটি বাজার থেকে স্থায়ীভাবে মুছে ফেলা হবে এবং ক্রেতারা আর এটি দেখতে পাবে না।' 
                  : 'This ad will be permanently deleted from the marketplace.'}
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 text-left mt-2">
                <p>🐔 <span className="font-extrabold">{getPoultryTypeName(postToDelete.poultryType)}</span> - {postToDelete.birdCount} পিস</p>
                <p className="text-[11px] text-slate-500">📍 {postToDelete.district} {postToDelete.upazila ? `(${postToDelete.upazila})` : ''}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPostToDelete(null)}
                className="py-2 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeletePost}
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{isDeleting ? (language === 'bn' ? 'ডিলিট হচ্ছে...' : 'Deleting...') : (language === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Confirm Delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Dedicated Delete Confirmation Modal for Buyers */}
      {buyerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-150 max-w-sm w-full space-y-3.5 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">
                {language === 'bn' ? 'পাইকার ডিরেক্টরি থেকে মুছবেন?' : 'Delete Buyer Listing?'}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {language === 'bn' 
                  ? 'আপনার পাইকারি আড়তের তথ্য ডিরেক্টরি থেকে সরিয়ে নেওয়া হবে।' 
                  : 'Your wholesale buyer listing will be removed.'}
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 text-left mt-2">
                <p>🏢 <span className="font-extrabold">{buyerToDelete.businessName}</span></p>
                <p className="text-[11px] text-slate-500">📍 {buyerToDelete.district}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBuyerToDelete(null)}
                className="py-2 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteBuyer}
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{isDeleting ? (language === 'bn' ? 'ডিলিট হচ্ছে...' : 'Deleting...') : (language === 'bn' ? 'হ্যাঁ, ডিলিট' : 'Confirm Delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
