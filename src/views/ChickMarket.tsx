import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  setDoc,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  demoStore, 
  DemoChickListing, 
  DemoChickRate, 
  initialChickRates, 
  initialChickListings 
} from '../utils/demoStore';
import { 
  ALL_64_DISTRICTS,
  getDistrictDisplayName
} from '../utils/bangladeshDistricts';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { 
  Bird, 
  Fish, 
  Egg, 
  Layers, 
  ShieldCheck, 
  Phone, 
  MessageCircle, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Trash2, 
  Pencil, 
  X, 
  Crown, 
  Tag, 
  AlertCircle, 
  AlertTriangle,
  Info,
  Truck, 
  Syringe, 
  ChevronRight,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import MarketplaceDisclaimerBanner from '../components/MarketplaceDisclaimerBanner';
import { admobService } from '../services/admobService';
import { openWhatsAppSafe } from '../utils/whatsappHelper';

// Helper to reliably identify default built-in demo listings vs user-posted listings
export const isDefaultDemoChickAd = (ad?: DemoChickListing | { id?: string; userId?: string } | null): boolean => {
  if (!ad || !ad.id) return false;
  const knownDemoIds = ['chick_ad_1', 'chick_ad_2', 'chick_ad_3', 'chick_ad_4', 'chick_ad_5', 'chick_ad_6'];
  if (knownDemoIds.includes(ad.id) || /^chick_ad_[1-6]$/.test(ad.id)) {
    return true;
  }
  if (ad.userId && (ad.userId.startsWith('company_') || ad.userId === 'demo_hatchery_admin')) {
    return true;
  }
  return false;
};

// 4 Main Categories
export type ChickCategory = 'poultry' | 'birds' | 'fish' | 'cattle';

export interface BreedDef {
  key: string;
  nameBn: string;
  nameEn: string;
  category: ChickCategory;
  icon: string;
  defaultUnit: string;
  defaultMinOrder: number;
}

export const CHICK_BREEDS: BreedDef[] = [
  // poultry (পোল্ট্রি মুরগি)
  { key: 'broiler', nameBn: 'ব্রয়লার একদিনের বাচ্চা (Broiler DOC)', nameEn: 'Broiler Chick', category: 'poultry', icon: '🐔', defaultUnit: 'পিস', defaultMinOrder: 100 },
  { key: 'sonali', nameBn: 'সোনালী হাইব্রিড বাচ্চা (Sonali DOC)', nameEn: 'Sonali Chick', category: 'poultry', icon: '🐥', defaultUnit: 'পিস', defaultMinOrder: 100 },
  { key: 'layer', nameBn: 'লেয়ার একদিনের বাচ্চা (Layer DOC)', nameEn: 'Layer Chick', category: 'poultry', icon: '🥚', defaultUnit: 'পিস', defaultMinOrder: 100 },
  { key: 'deshi', nameBn: 'দেশি মুরগির সুস্থ বাচ্চা (Deshi Chick)', nameEn: 'Deshi Native Chick', category: 'poultry', icon: '🐓', defaultUnit: 'পিস', defaultMinOrder: 50 },
  { key: 'cockerel', nameBn: 'কক / ফাউমি একদিনের বাচ্চা (Fayoumi/Cock)', nameEn: 'Cockerel/Fayoumi', category: 'poultry', icon: '🍗', defaultUnit: 'পিস', defaultMinOrder: 100 },

  // birds (হাঁস ও অন্যান্য পাখি)
  { key: 'duck', nameBn: 'হাঁসের বাচ্চা (ক্যাম্পবেল/বেইজিং)', nameEn: 'Duckling', category: 'birds', icon: '🦆', defaultUnit: 'পিস', defaultMinOrder: 50 },
  { key: 'quail', nameBn: 'জাপানি কোয়েল পাখির বাচ্চা', nameEn: 'Quail Chick', category: 'birds', icon: '🐦', defaultUnit: 'পিস', defaultMinOrder: 200 },
  { key: 'turkey_pigeon', nameBn: 'টার্কি ও সৌখিন কবুতরের বাচ্চা', nameEn: 'Turkey / Pigeon', category: 'birds', icon: '🕊️', defaultUnit: 'জোড়া', defaultMinOrder: 10 },

  // fish (মাছের পোনা ও নার্সারি)
  { key: 'tilapia', nameBn: 'মনোসেক্স তেলাপিয়া পোনা (Mono-sex Tilapia)', nameEn: 'Mono-sex Tilapia Fry', category: 'fish', icon: '🐟', defaultUnit: 'প্রতি হাজার', defaultMinOrder: 1000 },
  { key: 'carp', nameBn: 'রুই, কাতলা ও কার্প ধানী/আঙুল পোনা', nameEn: 'Carp Species Fingerlings', category: 'fish', icon: '🐠', defaultUnit: 'প্রতি হাজার', defaultMinOrder: 500 },
  { key: 'pangash_koi', nameBn: 'পাঙ্গাশ ও থাই কই মাছের পোনা', nameEn: 'Pangasius & Thai Koi', category: 'fish', icon: '🐡', defaultUnit: 'প্রতি হাজার', defaultMinOrder: 1000 },
  { key: 'catfish', nameBn: 'শিং, মাগুর ও পাবদা পোনা', nameEn: 'Catfish & Pabda Fry', category: 'fish', icon: '🦐', defaultUnit: 'প্রতি হাজার', defaultMinOrder: 500 },

  // cattle (বাছুর ও পশু)
  { key: 'calf', nameBn: 'উন্নত জাতের গাভী/ষাঁড়ের বাছুর', nameEn: 'Dairy / Beef Calf', category: 'cattle', icon: '🐄', defaultUnit: 'পিস', defaultMinOrder: 1 },
  { key: 'goat_kid', nameBn: 'ব্ল্যাক বেঙ্গল ছাগল ও ভেড়ার বাচ্চা', nameEn: 'Goat Kid / Lamb', category: 'cattle', icon: '🐐', defaultUnit: 'পিস', defaultMinOrder: 1 }
];

// Helper to reliably map any existing/freeform string to a breed key
export const resolveBreedKey = (subCategory?: string, category?: string): string => {
  if (!subCategory) return 'broiler';
  const text = subCategory.toLowerCase();
  if (text.includes('broiler') || text.includes('ব্রয়লার') || text.includes('ব্রয়লার')) return 'broiler';
  if (text.includes('sonali') || text.includes('সোনালী') || text.includes('সোনালি')) return 'sonali';
  if (text.includes('layer') || text.includes('লেয়ার') || text.includes('লেয়ার')) return 'layer';
  if (text.includes('deshi') || text.includes('দেশি') || text.includes('দেশী')) return 'deshi';
  if (text.includes('cockerel') || text.includes('কক') || text.includes('ফাউমি') || text.includes('fayoumi')) return 'cockerel';
  if (text.includes('duck') || text.includes('হাঁস') || text.includes('হাস')) return 'duck';
  if (text.includes('quail') || text.includes('কোয়েল') || text.includes('কোয়েল')) return 'quail';
  if (text.includes('turkey') || text.includes('টার্কি') || text.includes('কবুতর') || text.includes('pigeon')) return 'turkey_pigeon';
  if (text.includes('tilapia') || text.includes('তেলাপিয়া') || text.includes('তেলাপিয়া')) return 'tilapia';
  if (text.includes('carp') || text.includes('রুই') || text.includes('কাতলা') || text.includes('কার্প') || text.includes('মৃগেল')) return 'carp';
  if (text.includes('pangash') || text.includes('পাঙ্গাশ') || text.includes('পাঙ্গাস') || text.includes('কই') || text.includes('koi')) return 'pangash_koi';
  if (text.includes('শিং') || text.includes('মাগুর') || text.includes('পাবদা') || text.includes('catfish')) return 'catfish';
  if (text.includes('calf') || text.includes('বাছুর') || text.includes('গাভী') || text.includes('ষাঁড়')) return 'calf';
  if (text.includes('goat') || text.includes('ছাগল') || text.includes('খাসি') || text.includes('ভেড়া')) return 'goat_kid';

  // Fallback by category
  if (category === 'fish') return 'tilapia';
  if (category === 'birds') return 'duck';
  if (category === 'cattle') return 'calf';
  return 'broiler';
};

export const ChickMarket: React.FC = () => {
  const { currentUser, isDemoUser } = useAuth();
  const { language, t } = useLanguage();
  const { isAdmin: sysAdmin } = useSystemConfig();

  const isMasterAdmin = 
    Boolean(sysAdmin) || 
    currentUser?.email === 'skabusufian452@gmail.com' || 
    currentUser?.email === 'sr0632890@gmail.com';
  const isAdmin = isMasterAdmin;

  // Track IDs of ads created by this user/device for robust ownership recognition
  const [myCreatedAdIds, setMyCreatedAdIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('my_created_chick_ads') || '[]');
    } catch {
      return [];
    }
  });

  // Track deleted demo chick ads under admin control
  const [deletedDemoChickAdIds, setDeletedDemoChickAdIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('deleted_demo_chick_ads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State
  const [rates, setRates] = useState<DemoChickRate[]>([]);
  const [listings, setListings] = useState<DemoChickListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Confirmation
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const submitLock = useRef(false);

  // Quota Conflict Warning Modal
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaConflictBreed, setQuotaConflictBreed] = useState<BreedDef | null>(null);

  const [isRateEditModalOpen, setIsRateEditModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<DemoChickRate | null>(null);
  const [listingToDelete, setListingToDelete] = useState<DemoChickListing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isPostModalOpen || isRateEditModalOpen || showQuotaModal) {
      admobService.removeBanner().catch(() => {});
    }
  }, [isPostModalOpen, isRateEditModalOpen, showQuotaModal]);

  // Main Category & Breed Filtering (Default to 'poultry' to avoid jumbling all together)
  const [activeCategory, setActiveCategory] = useState<ChickCategory>('poultry');
  const [selectedBreedKey, setSelectedBreedKey] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Post Form State with 3-Grade Support
  const [postForm, setPostForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    whatsapp: '',
    whatsappSameAsPhone: true,
    category: 'poultry' as ChickCategory,
    breedKey: 'broiler',
    subCategory: 'ব্রয়লার একদিনের বাচ্চা (Broiler DOC)',
    unitLabel: 'পিস',
    minimumOrder: '100',
    // Multi-Grade Pricing
    gradeA_price: '',
    gradeA_stock: '',
    gradeB_price: '',
    gradeB_stock: '',
    gradeC_price: '',
    gradeC_stock: '',
    deliveryDate: '',
    district: 'ঢাকা',
    deliveryArea: 'সমগ্র বাংলাদেশ বা নিজস্ব জেলায়',
    vaccineDetails: 'মারেক্স ও গামবোরো স্প্রে ভ্যাকসিনেটেড',
    description: ''
  });

  // Load Benchmark Rates & Hatchery Listings
  useEffect(() => {
    let unsubListings: (() => void) | null = null;
    let unsubRates: (() => void) | null = null;

    const loadData = async () => {
      setLoading(true);

      // Sync deleted demo IDs from Firestore if connected
      try {
        if (!isDemoUser) {
          const configSnap = await getDoc(doc(db, 'system_config', 'chick_market'));
          if (configSnap.exists() && Array.isArray(configSnap.data()?.deletedDemoChickAdIds)) {
            const remoteDeleted: string[] = configSnap.data()?.deletedDemoChickAdIds || [];
            setDeletedDemoChickAdIds(prev => {
              const merged = Array.from(new Set([...prev, ...remoteDeleted]));
              try {
                localStorage.setItem('deleted_demo_chick_ads', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }
      } catch (e) {
        // Fallback
      }

      if (isDemoUser) {
        setRates(demoStore.getChickRates());
        const raw = demoStore.getChickListings();
        setListings(raw.filter(l => !isDefaultDemoChickAd(l)));
        setLoading(false);
        return;
      }

      // Try Firestore for Rates
      try {
        const ratesQuery = query(collection(db, 'chick_rates'));
        unsubRates = onSnapshot(ratesQuery, (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DemoChickRate));
            setRates(data);
          } else {
            setRates(initialChickRates);
          }
        }, (err) => {
          console.warn('Rates listener fallback to demo:', err);
          setRates(demoStore.getChickRates());
        });
      } catch (err) {
        setRates(demoStore.getChickRates());
      }

      // Try Firestore for Listings
      try {
        const listingsQuery = query(collection(db, 'chick_listings'), orderBy('createdAt', 'desc'));
        unsubListings = onSnapshot(listingsQuery, (snapshot) => {
          const map = new Map<string, DemoChickListing>();
          snapshot.docs.forEach(d => {
            const item = { id: d.id, ...d.data() } as DemoChickListing;
            if (!isDefaultDemoChickAd(item) && !map.has(item.id)) {
              map.set(item.id, item);
            }
          });
          setListings(Array.from(map.values()));
          setLoading(false);
        }, (err) => {
          console.warn('Listings listener fallback to demo:', err);
          const raw = demoStore.getChickListings();
          const map = new Map<string, DemoChickListing>();
          raw.forEach(l => {
            if (!isDefaultDemoChickAd(l) && !map.has(l.id)) {
              map.set(l.id, l);
            }
          });
          setListings(Array.from(map.values()));
          setLoading(false);
        });
      } catch (err) {
        const raw = demoStore.getChickListings();
        const map = new Map<string, DemoChickListing>();
        raw.forEach(l => {
          if (!isDefaultDemoChickAd(l) && !map.has(l.id)) {
            map.set(l.id, l);
          }
        });
        setListings(Array.from(map.values()));
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubListings) unsubListings();
      if (unsubRates) unsubRates();
    };
  }, [isDemoUser]);

  // Ownership identification helper
  const isDirectOwner = (ad: DemoChickListing): boolean => {
    if (isDefaultDemoChickAd(ad)) return false;
    if (currentUser?.uid && ad.userId === currentUser.uid) return true;
    if (currentUser?.email && ad.userEmail === currentUser.email) return true;
    if (currentUser?.phoneNumber && ad.phone && (ad.phone.includes(currentUser.phoneNumber.replace('+88', '')) || currentUser.phoneNumber.includes(ad.phone))) return true;
    if (myCreatedAdIds.includes(ad.id)) return true;
    if (isDemoUser && (ad.userId === 'demo_user' || ad.userId === 'demo_khamari_user_1' || ad.id?.startsWith('chick_my_'))) return true;
    return false;
  };

  // User's own active listings
  const myChickPosts = listings.filter(ad => isDirectOwner(ad));

  // Check if user already has an active ad in a specific breedKey
  const getMyAdInBreed = (breedKey: string, excludeId?: string | null): DemoChickListing | undefined => {
    return myChickPosts.find(ad => {
      if (excludeId && ad.id === excludeId) return false;
      const bKey = ad.breedKey || resolveBreedKey(ad.subCategory, ad.category);
      return bKey === breedKey;
    });
  };

  // Open modal for NEW ad
  const handleOpenNewPost = (preferredCategory?: ChickCategory, preferredBreedKey?: string) => {
    const cat = preferredCategory || activeCategory;
    const availableBreeds = CHICK_BREEDS.filter(b => b.category === cat);
    const chosenBreed = availableBreeds.find(b => b.key === preferredBreedKey) || availableBreeds[0];

    // Check quota for regular users: 1 ad per breed
    if (!isMasterAdmin && chosenBreed) {
      const existing = getMyAdInBreed(chosenBreed.key);
      if (existing) {
        setQuotaConflictBreed(chosenBreed);
        setShowQuotaModal(true);
        return;
      }
    }

    setEditingAdId(null);
    setPostForm({
      companyName: '',
      contactPerson: '',
      phone: currentUser?.phoneNumber ? currentUser.phoneNumber.replace('+88', '') : '',
      whatsapp: '',
      whatsappSameAsPhone: true,
      category: cat,
      breedKey: chosenBreed ? chosenBreed.key : 'broiler',
      subCategory: chosenBreed ? chosenBreed.nameBn : 'ব্রয়লার একদিনের বাচ্চা (Broiler DOC)',
      unitLabel: chosenBreed ? chosenBreed.defaultUnit : 'পিস',
      minimumOrder: chosenBreed ? String(chosenBreed.defaultMinOrder) : '100',
      gradeA_price: '',
      gradeA_stock: '',
      gradeB_price: '',
      gradeB_stock: '',
      gradeC_price: '',
      gradeC_stock: '',
      deliveryDate: '',
      district: 'ঢাকা',
      deliveryArea: 'সমগ্র বাংলাদেশ বা নিজস্ব জেলায়',
      vaccineDetails: 'মারেক্স ও গামবোরো স্প্রে ভ্যাকসিনেটেড',
      description: ''
    });
    setIsPostModalOpen(true);
  };

  // Open modal to EDIT an existing ad
  const handleOpenEditPost = (ad: DemoChickListing) => {
    const bKey = ad.breedKey || resolveBreedKey(ad.subCategory, ad.category);
    const breed = CHICK_BREEDS.find(b => b.key === bKey);

    setEditingAdId(ad.id);
    setPostForm({
      companyName: ad.companyName || '',
      contactPerson: ad.contactPerson || '',
      phone: ad.phone || '',
      whatsapp: ad.whatsapp || ad.phone || '',
      whatsappSameAsPhone: !ad.whatsapp || ad.whatsapp === ad.phone,
      category: ad.category,
      breedKey: bKey,
      subCategory: ad.subCategory,
      unitLabel: ad.unitLabel || 'পিস',
      minimumOrder: String(ad.minimumOrder || 100),
      gradeA_price: String(ad.gradeA_price || (ad.grade === 'A' ? ad.pricePerUnit : '') || ad.pricePerUnit || ''),
      gradeA_stock: String(ad.gradeA_stock || ad.availableStock || ''),
      gradeB_price: String(ad.gradeB_price || (ad.grade === 'B' ? ad.pricePerUnit : '') || ''),
      gradeB_stock: String(ad.gradeB_stock || ''),
      gradeC_price: String(ad.gradeC_price || (ad.grade === 'C' ? ad.pricePerUnit : '') || ''),
      gradeC_stock: String(ad.gradeC_stock || ''),
      deliveryDate: ad.deliveryDate || '',
      district: ad.district || 'ঢাকা',
      deliveryArea: ad.deliveryArea || 'সমগ্র বাংলাদেশ বা নিজস্ব জেলায়',
      vaccineDetails: ad.vaccineDetails || '',
      description: ad.description || ''
    });
    setIsPostModalOpen(true);
  };

  // When changing category in form, update breedKey & defaults
  const handleFormCategoryChange = (cat: ChickCategory) => {
    const breedsInCat = CHICK_BREEDS.filter(b => b.category === cat);
    const defaultBreed = breedsInCat[0];
    setPostForm(prev => ({
      ...prev,
      category: cat,
      breedKey: defaultBreed ? defaultBreed.key : '',
      subCategory: defaultBreed ? defaultBreed.nameBn : '',
      unitLabel: defaultBreed ? defaultBreed.defaultUnit : 'পিস',
      minimumOrder: defaultBreed ? String(defaultBreed.defaultMinOrder) : '100'
    }));
  };

  // When changing breed in form
  const handleFormBreedChange = (bKey: string) => {
    const breed = CHICK_BREEDS.find(b => b.key === bKey);
    if (!breed) return;

    // Check if user already has an active ad for this breed (when not editing that exact ad)
    if (!isMasterAdmin) {
      const existing = getMyAdInBreed(bKey, editingAdId);
      if (existing) {
        toast.error(
          language === 'bn'
            ? `আপনি ইতিমধ্যে "${breed.nameBn}"-এ ১টি বিজ্ঞাপন দিয়েছেন। অনুগ্রহ করে সেটি এডিট করুন।`
            : `You already have 1 active ad for "${breed.nameEn}". Please edit that ad.`
        );
      }
    }

    setPostForm(prev => ({
      ...prev,
      breedKey: bKey,
      subCategory: breed.nameBn,
      unitLabel: breed.defaultUnit,
      minimumOrder: String(breed.defaultMinOrder)
    }));
  };

  // Handle Create or Update Post
  const handleCreateOrUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPost || submitLock.current) return;

    if (!postForm.companyName.trim() || !postForm.phone.trim()) {
      toast.error(language === 'bn' ? 'অনুগ্রহ করে কোম্পানি ও মোবাইল নম্বর দিন' : 'Please provide Company Name and Phone');
      return;
    }

    // Require at least Grade A price
    if (!postForm.gradeA_price) {
      toast.error(language === 'bn' ? 'অনুগ্রহ করে Grade A (১ম গ্রেড)-এর দর উল্লেখ করুন' : 'Please provide Grade A price');
      return;
    }

    // Quota Enforcement: 1 ad per breed for regular users
    if (!isMasterAdmin) {
      const existing = getMyAdInBreed(postForm.breedKey, editingAdId);
      if (existing) {
        const breed = CHICK_BREEDS.find(b => b.key === postForm.breedKey);
        setQuotaConflictBreed(breed || null);
        setShowQuotaModal(true);
        return;
      }
    }

    setIsSubmittingPost(true);
    submitLock.current = true;

    const finalWhatsApp = postForm.whatsappSameAsPhone ? postForm.phone.trim() : (postForm.whatsapp.trim() || postForm.phone.trim());
    const primaryPrice = Number(postForm.gradeA_price) || 0;

    const adPayload: Omit<DemoChickListing, 'id' | 'createdAt'> = {
      userId: currentUser?.uid || (isDemoUser ? 'demo_user' : 'guest_user'),
      userEmail: currentUser?.email || '',
      userPhone: currentUser?.phoneNumber || postForm.phone.trim(),
      companyName: postForm.companyName.trim(),
      contactPerson: postForm.contactPerson.trim() || postForm.companyName.trim(),
      phone: postForm.phone.trim(),
      whatsapp: finalWhatsApp,
      category: postForm.category,
      breedKey: postForm.breedKey,
      subCategory: postForm.subCategory.trim(),
      grade: 'A', // primary benchmark
      pricePerUnit: primaryPrice,
      unitLabel: postForm.unitLabel,
      gradeA_price: Number(postForm.gradeA_price) || 0,
      gradeA_stock: Number(postForm.gradeA_stock) || 0,
      gradeB_price: postForm.gradeB_price ? Number(postForm.gradeB_price) : undefined,
      gradeB_stock: postForm.gradeB_stock ? Number(postForm.gradeB_stock) : undefined,
      gradeC_price: postForm.gradeC_price ? Number(postForm.gradeC_price) : undefined,
      gradeC_stock: postForm.gradeC_stock ? Number(postForm.gradeC_stock) : undefined,
      minimumOrder: Number(postForm.minimumOrder) || 100,
      availableStock: Number(postForm.gradeA_stock) || 0,
      deliveryDate: postForm.deliveryDate.trim() || 'আলোচনা সাপেক্ষে',
      district: postForm.district,
      deliveryArea: postForm.deliveryArea.trim() || 'সমগ্র বাংলাদেশ',
      vaccineDetails: postForm.vaccineDetails.trim(),
      description: postForm.description.trim(),
      isVerified: isMasterAdmin ? true : false,
      isFeatured: false,
      status: 'available',
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingAdId) {
        // UPDATE Existing Ad
        if (isDemoUser) {
          demoStore.saveChickListing({ ...adPayload, id: editingAdId });
        } else {
          try {
            await updateDoc(doc(db, 'chick_listings', editingAdId), adPayload);
          } catch (err) {
            demoStore.saveChickListing({ ...adPayload, id: editingAdId });
          }
        }

        setListings(prev => prev.map(item => item.id === editingAdId ? { ...item, ...adPayload } : item));
        toast.success(language === 'bn' ? 'বাচ্চার বিজ্ঞাপন সফলভাবে আপডেট হয়েছে!' : 'Advertisement updated successfully!');
      } else {
        // CREATE New Ad
        let createdAdId = '';
        const fullPayload = {
          ...adPayload,
          createdAt: new Date().toISOString()
        };

        if (isDemoUser) {
          const saved = demoStore.saveChickListing(fullPayload);
          createdAdId = saved.id;
        } else {
          try {
            const docRef = await addDoc(collection(db, 'chick_listings'), fullPayload);
            createdAdId = docRef.id;
            demoStore.saveChickListing({ ...fullPayload, id: createdAdId });
          } catch (err) {
            const saved = demoStore.saveChickListing(fullPayload);
            createdAdId = saved.id;
          }
        }

        if (createdAdId) {
          setMyCreatedAdIds(prev => {
            const next = prev.includes(createdAdId) ? prev : [...prev, createdAdId];
            try {
              localStorage.setItem('my_created_chick_ads', JSON.stringify(next));
            } catch {}
            return next;
          });

          setListings(prev => [{ id: createdAdId, ...fullPayload } as DemoChickListing, ...prev.filter(p => p.id !== createdAdId)]);
        }

        toast.success(language === 'bn' ? 'বাচ্চার বিজ্ঞাপন সফলভাবে প্রকাশিত হয়েছে!' : 'Advertisement posted successfully!');
      }

      setIsPostModalOpen(false);
      setEditingAdId(null);
    } catch (err: any) {
      toast.error(err.message || 'Error processing ad');
    } finally {
      setIsSubmittingPost(false);
      submitLock.current = false;
    }
  };

  // Confirm Delete Listing
  const confirmDeleteListing = async () => {
    if (!listingToDelete) return;
    setIsDeleting(true);

    const listingId = listingToDelete.id;
    const isDemo = isDefaultDemoChickAd(listingToDelete);

    try {
      if (isDemo) {
        const updated = Array.from(new Set([...deletedDemoChickAdIds, listingId]));
        setDeletedDemoChickAdIds(updated);
        try {
          localStorage.setItem('deleted_demo_chick_ads', JSON.stringify(updated));
        } catch {}

        demoStore.deleteChickListing(listingId);

        if (!isDemoUser) {
          try {
            await setDoc(doc(db, 'system_config', 'chick_market'), {
              deletedDemoChickAdIds: updated,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (err) {
            console.warn('Firestore doc sync note:', err);
          }
        }

        setListings(prev => prev.filter(ad => ad.id !== listingId));
        toast.success(language === 'bn' ? 'ডেমো বাচ্চার বিজ্ঞাপনটি মুছে ফেলা হয়েছে' : 'Demo ad deleted');
      } else {
        demoStore.deleteChickListing(listingId);

        setMyCreatedAdIds(prev => {
          const next = prev.filter(id => id !== listingId);
          try {
            localStorage.setItem('my_created_chick_ads', JSON.stringify(next));
          } catch {}
          return next;
        });

        if (!isDemoUser) {
          try {
            await deleteDoc(doc(db, 'chick_listings', listingId));
          } catch (err) {
            console.warn('Firestore doc delete note:', err);
          }
        }

        setListings(prev => prev.filter(ad => ad.id !== listingId));
        toast.success(
          language === 'bn' 
            ? 'বিজ্ঞাপন মুছে ফেলা হয়েছে। এখন এই জাতের জন্য নতুন বিজ্ঞাপন দিতে পারবেন।' 
            : 'Ad deleted. Slot is now free for a new ad.'
        );
      }
    } catch (err: any) {
      toast.error(language === 'bn' ? 'বিজ্ঞাপন মুছতে সমস্যা হয়েছে' : 'Could not delete ad');
    } finally {
      setIsDeleting(false);
      setListingToDelete(null);
    }
  };

  // Admin Rate Save
  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;

    try {
      if (isDemoUser) {
        demoStore.updateChickRate(editingRate.id, editingRate);
        setRates(demoStore.getChickRates());
      } else {
        try {
          await updateDoc(doc(db, 'chick_rates', editingRate.id), {
            ...editingRate,
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          demoStore.updateChickRate(editingRate.id, editingRate);
          setRates(demoStore.getChickRates());
        }
      }
      toast.success(language === 'bn' ? 'বাজার রেট সফলভাবে আপডেট হয়েছে' : 'Rate updated successfully');
      setIsRateEditModalOpen(false);
      setEditingRate(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update rate');
    }
  };

  // WhatsApp Order helper with multi-grade rates included
  const openWhatsAppOrder = (listing: DemoChickListing) => {
    let ratesSummary = `• Grade A : ৳${listing.gradeA_price || listing.pricePerUnit} (${listing.unitLabel})`;
    if (listing.gradeB_price) {
      ratesSummary += `\n• Grade B : ৳${listing.gradeB_price} (${listing.unitLabel})`;
    }
    if (listing.gradeC_price) {
      ratesSummary += `\n• Grade C : ৳${listing.gradeC_price} (${listing.unitLabel})`;
    }

    const text = 
      `আসসালামু আলাইকুম ${listing.companyName}। আমি ফার্ম ম্যানেজার (Farm Manager) অ্যাপে আপনার বাচ্চার বিজ্ঞাপন দেখলাম।\n\n` +
      `📦 বাচ্চার জাত: ${listing.subCategory}\n` +
      `🏷️ গ্রেডভিত্তিক দর:\n${ratesSummary}\n\n` +
      `📌 সর্বনিম্ন অর্ডার: ${listing.minimumOrder} ${listing.unitLabel}\n` +
      `📍 হ্যাচারির অবস্থান: ${getDistrictDisplayName(listing.district, 'bn')}\n\n` +
      `আমি অর্ডার বুকিং ও ডেলিভারি সম্পর্কে কথা বলতে চাই।`;

    openWhatsAppSafe({
      phone: listing.whatsapp || listing.phone,
      message: text,
      lang: language === 'bn' ? 'bn' : 'en',
      fallbackPhone: listing.phone
    });
  };

  // 1. FILTERING: STRICT SEPARATION
  // When activeCategory === 'poultry', show ONLY poultry!
  // When activeCategory === 'birds', show ONLY birds!
  // When activeCategory === 'fish', show ONLY fish!
  // When activeCategory === 'cattle', show ONLY cattle!
  const uniqueListings = Array.from(
    new Map(listings.map(item => [item.id, item])).values()
  );

  const filteredListings = uniqueListings.filter(l => {
    // 1. Category must strictly match
    if (l.category !== activeCategory) return false;

    // 2. Specific breed filter (if chosen)
    if (selectedBreedKey !== 'all') {
      const bKey = l.breedKey || resolveBreedKey(l.subCategory, l.category);
      if (bKey !== selectedBreedKey) return false;
    }

    // 3. District filter
    if (selectedDistrict !== 'all' && l.district !== selectedDistrict) return false;

    // 4. Grade filter
    if (selectedGrade !== 'all') {
      if (selectedGrade === 'A' && !(l.gradeA_price || l.grade === 'A')) return false;
      if (selectedGrade === 'B' && !l.gradeB_price) return false;
      if (selectedGrade === 'C' && !l.gradeC_price) return false;
    }

    // 5. Search box
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const match = l.companyName.toLowerCase().includes(term) ||
        l.subCategory.toLowerCase().includes(term) ||
        l.district.toLowerCase().includes(term) ||
        (l.description && l.description.toLowerCase().includes(term));
      if (!match) return false;
    }

    return true;
  });

  // Current category's breeds for sub-filter tabs
  const currentCategoryBreeds = CHICK_BREEDS.filter(b => b.category === activeCategory);

  return (
    <div className="space-y-4 pb-12 select-none animate-fadeIn">
      {/* 1. Ultra-Compact Header Banner */}
      <div className="bg-gradient-to-r from-amber-800 via-orange-850 to-slate-900 rounded-2xl p-2.5 sm:p-3 text-white shadow-xs relative overflow-hidden flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 text-base shadow-xs">
            🐣
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black text-white truncate">
                {language === 'bn' ? 'বাচ্চা ক্রয় ও বুকিং (হ্যাচারি বাজার)' : 'Chick Booking & Hatchery Market'}
              </h1>
              <span className="bg-amber-400 text-slate-950 text-[7.5px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">
                ৩ গ্রেড
              </span>
            </div>
            <p className="text-[9.5px] text-amber-100/90 font-medium truncate">
              {language === 'bn' 
                ? 'সুস্থ বাচ্চা ও মাছের পোনা বুকিং এবং সরাসরি কোম্পানির বিজ্ঞাপন' 
                : 'Direct company DOC chicks & fingerlings booking'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenNewPost()}
          className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
        >
          <Plus size={14} className="text-slate-950" />
          <span>{language === 'bn' ? 'বিজ্ঞাপন দিন' : 'Post Ad'}</span>
        </button>
      </div>

      {/* 2. Slim 1-Line Caution Ticker */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl px-2.5 py-1 text-[10.5px] text-amber-900 font-bold flex items-center justify-between gap-1 shadow-2xs">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-xs shrink-0">⚠️</span>
          <span className="truncate">
            {language === 'bn' 
              ? 'সতর্কতা: পণ্য বুঝে না পেয়ে কোনো অগ্রিম টাকা পাঠাবেন না। যাচাই করে লেনদেন করুন।' 
              : 'Notice: Never send advance money without product verification.'}
          </span>
        </div>
        <span className="text-[9px] bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded font-black shrink-0">
          নিরাপত্তা
        </span>
      </div>

      {/* 3. ACTIVE QUOTA DASHBOARD TRACKER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-3.5 sm:p-4 shadow-sm border border-emerald-700/40">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-400/20 text-amber-400">
              <Layers size={14} />
            </span>
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{language === 'bn' ? 'আপনার বিজ্ঞাপন কোটা স্ট্যাটাস' : 'Your Ad Quota Status'}</span>
                {isMasterAdmin && (
                  <span className="bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                    Admin Unlimited
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-300">
                {language === 'bn' 
                  ? 'প্রতিটি জাতের জন্য ১টি বিজ্ঞাপন (যাতে A, B, C ৩ গ্রেডের দর একসাথে থাকবে)' 
                  : '1 ad per breed (contains Grade A, B, C prices together)'}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {myChickPosts.length} {language === 'bn' ? 'টি সক্রিয় বিজ্ঞাপন' : 'Active Ads'}
          </span>
        </div>

        {/* Breeds Slots for current category */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {currentCategoryBreeds.map((breed) => {
            const userAd = getMyAdInBreed(breed.key);
            const isFull = Boolean(userAd);

            return (
              <div 
                key={breed.key}
                className={`p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                  isFull 
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100' 
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs font-black flex items-center gap-1 truncate" title={breed.nameBn}>
                    <span>{breed.icon}</span>
                    <span className="truncate">{breed.nameBn.split(' ')[0]}</span>
                  </span>
                  <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-md shrink-0 ${
                    isFull ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {isFull ? (language === 'bn' ? '১/১ পূর্ণ' : '1/1 Full') : (language === 'bn' ? '০/১ খালি' : '0/1 Free')}
                  </span>
                </div>

                {isFull && userAd ? (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-emerald-800/40">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPost(userAd)}
                      className="flex-1 py-1 px-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9.5px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Pencil size={10} />
                      <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setListingToDelete(userAd)}
                      className="p-1 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-all cursor-pointer"
                      title={language === 'bn' ? 'বিজ্ঞাপন মুছুন (স্লট খালি হবে)' : 'Delete ad'}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenNewPost(activeCategory, breed.key)}
                    className="w-full py-1 px-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[9.5px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer mt-1"
                  >
                    <Plus size={11} />
                    <span>{language === 'bn' ? '+ দিন' : '+ Post'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN CATEGORY SELECTOR (STRICT SEPARATION: Poultry, Birds, Fish, Cattle) */}
      <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-slate-200/80">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('poultry');
              setSelectedBreedKey('all');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCategory === 'poultry'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <span className="text-base">🐔</span>
            <div className="text-left leading-tight">
              <span className="block font-black">{language === 'bn' ? 'পোল্ট্রি মুরগি' : 'Poultry Chicks'}</span>
              <span className="text-[8.5px] opacity-80">{language === 'bn' ? 'ব্রয়লার, সোনালী, লেয়ার' : 'Broiler, Sonali'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('birds');
              setSelectedBreedKey('all');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCategory === 'birds'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <span className="text-base">🦆</span>
            <div className="text-left leading-tight">
              <span className="block font-black">{language === 'bn' ? 'হাঁস ও পাখি' : 'Duck & Birds'}</span>
              <span className="text-[8.5px] opacity-80">{language === 'bn' ? 'ক্যাম্পবেল, কোয়েল' : 'Duck, Quail'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('fish');
              setSelectedBreedKey('all');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCategory === 'fish'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <span className="text-base">🐟</span>
            <div className="text-left leading-tight">
              <span className="block font-black">{language === 'bn' ? 'মাছের পোনা' : 'Fish Fingerlings'}</span>
              <span className="text-[8.5px] opacity-80">{language === 'bn' ? 'তেলাপিয়া, রুই, কার্প' : 'Tilapia, Carp'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('cattle');
              setSelectedBreedKey('all');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCategory === 'cattle'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <span className="text-base">🐄</span>
            <div className="text-left leading-tight">
              <span className="block font-black">{language === 'bn' ? 'বাছুর ও পশু' : 'Calf & Livestock'}</span>
              <span className="text-[8.5px] opacity-80">{language === 'bn' ? 'গাভী/ষাঁড় বাছুর, ছাগল' : 'Calf, Goat'}</span>
            </div>
          </button>
        </div>

        {/* Breed Sub-Tabs (Specific to selected Category) */}
        <div className="mt-2 pt-2 border-t border-slate-150 flex items-center gap-1 overflow-x-auto scrollbar-thin pb-0.5">
          <button
            type="button"
            onClick={() => setSelectedBreedKey('all')}
            className={`py-1.5 px-3 rounded-xl text-[11px] font-black shrink-0 transition-all cursor-pointer ${
              selectedBreedKey === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'bn' ? `🌟 সকল ${activeCategory === 'poultry' ? 'পোল্ট্রি' : activeCategory === 'birds' ? 'পাখি' : activeCategory === 'fish' ? 'মাছ' : 'পশু'}` : 'All'}
          </button>

          {currentCategoryBreeds.map((breed) => (
            <button
              key={breed.key}
              type="button"
              onClick={() => setSelectedBreedKey(breed.key)}
              className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                selectedBreedKey === breed.key
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{breed.icon}</span>
              <span>{breed.nameBn.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 size={16} className="text-emerald-700" />
            <h2 className="text-xs sm:text-sm font-black text-slate-900">
              {language === 'bn' ? 'বাচ্চার বিজ্ঞাপন তালিকা' : 'Chick Advertisements'}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
              {filteredListings.length} {language === 'bn' ? 'টি বিজ্ঞাপন' : 'Ads'}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 animate-bounce">
              <span>👇 {language === 'bn' ? 'নিচে দেখুন' : 'Scroll down'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[140px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'bn' ? 'কোম্পানি বা হ্যাচারির নাম...' : 'Search company or breed...'}
              className="w-full pl-7 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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

          {/* Grade Filter */}
          <div className="w-auto">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value as any)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{language === 'bn' ? 'সকল গ্রেড' : 'All Grades'}</option>
              <option value="A">Grade A (১ম সেরা গ্রেড)</option>
              <option value="B">Grade B (২য় গ্রেড)</option>
              <option value="C">Grade C (৩য় গ্রেড)</option>
            </select>
          </div>

          {/* District Filter */}
          <div className="w-auto">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{language === 'bn' ? 'সকল জেলা' : 'All Districts'}</option>
              {ALL_64_DISTRICTS.map((dist) => (
                <option key={dist.nameBn} value={dist.nameBn}>
                  {language === 'bn' ? dist.nameBn : dist.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6. Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <Bird size={24} />
          </div>
          <h3 className="text-sm font-black text-slate-800">
            {language === 'bn' ? 'এই শ্রেণিতে কোনো বিজ্ঞাপন পাওয়া যায়নি' : 'No ads found in this category'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {language === 'bn' 
              ? 'আপনার ফিল্টার পরিবর্তন করুন অথবা আপনার কোম্পানির পক্ষ থেকে নতুন বিজ্ঞাপন পোস্ট করুন।' 
              : 'Try changing your filters or post a new advertisement for your company.'}
          </p>
          <button
            type="button"
            onClick={() => handleOpenNewPost()}
            className="mt-3 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>{language === 'bn' ? 'বিজ্ঞাপন দিন' : 'Post Ad'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredListings.map((ad) => {
            const isDemoAd = isDefaultDemoChickAd(ad);
            const isOwner = isDirectOwner(ad);
            const canManage = isDemoAd ? isMasterAdmin : (isOwner || isMasterAdmin);
            const bKey = ad.breedKey || resolveBreedKey(ad.subCategory, ad.category);
            const breedDef = CHICK_BREEDS.find(b => b.key === bKey);

            return (
              <div 
                key={ad.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Bar: Company Name & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Building2 size={14} className="text-emerald-700 shrink-0" />
                        <h3 className="text-sm font-black text-slate-900 truncate">
                          {ad.companyName}
                        </h3>
                        {ad.isVerified && (
                          <span className="text-emerald-600" title="Verified Hatchery">
                            <ShieldCheck size={14} />
                          </span>
                        )}
                        {ad.isFeatured && (
                          <span className="bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                            HOT
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <span>{breedDef?.icon || '🐣'}</span>
                        <span className="text-emerald-800">{ad.subCategory}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOwner && (
                        <span className="text-[9.5px] font-black px-2 py-0.8 rounded-lg flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={10} className="text-emerald-600" />
                          <span>{language === 'bn' ? 'আপনার বিজ্ঞাপন' : 'Your Ad'}</span>
                        </span>
                      )}

                      {isMasterAdmin && !isOwner && (
                        <span className="text-[9.5px] font-black px-2 py-0.8 rounded-lg flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200">
                          <Crown size={10} className="text-rose-600" />
                          <span>{language === 'bn' ? 'মাস্টার এডমিন' : 'Admin'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3-GRADE PRICING BOARD (A, B, C Rates in 1 Ad) */}
                  <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-2.5 rounded-2xl border border-emerald-150 mb-3 space-y-1.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Tag size={11} className="text-emerald-600" />
                        <span>{language === 'bn' ? 'গ্রেডভিত্তিক রেট ও স্টক' : 'Grade Rates & Stock'}</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {language === 'bn' ? 'একক:' : 'Unit:'} <strong className="text-slate-800">{ad.unitLabel}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      {/* Grade A */}
                      <div className="bg-white p-1.5 rounded-xl border border-emerald-200/80 shadow-2xs">
                        <span className="text-[9px] font-black text-emerald-800 uppercase block">
                          🏆 Grade A
                        </span>
                        <span className="text-xs font-black text-slate-900 block mt-0.5">
                          ৳{ad.gradeA_price || ad.pricePerUnit}
                        </span>
                        {ad.gradeA_stock ? (
                          <span className="text-[8.5px] font-semibold text-slate-500 block">
                            স্টক: {ad.gradeA_stock}
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-semibold text-emerald-600 block">উপলব্ধ</span>
                        )}
                      </div>

                      {/* Grade B */}
                      <div className={`p-1.5 rounded-xl border ${
                        ad.gradeB_price 
                          ? 'bg-white border-amber-200/80 shadow-2xs' 
                          : 'bg-slate-50/60 border-dashed border-slate-200 opacity-60'
                      }`}>
                        <span className="text-[9px] font-black text-amber-800 uppercase block">
                          ⭐ Grade B
                        </span>
                        {ad.gradeB_price ? (
                          <>
                            <span className="text-xs font-black text-slate-900 block mt-0.5">
                              ৳{ad.gradeB_price}
                            </span>
                            {ad.gradeB_stock ? (
                              <span className="text-[8.5px] font-semibold text-slate-500 block">
                                স্টক: {ad.gradeB_stock}
                              </span>
                            ) : (
                              <span className="text-[8.5px] font-semibold text-amber-600 block">উপলব্ধ</span>
                            )}
                          </>
                        ) : (
                          <span className="text-[9px] text-slate-400 block mt-1">—</span>
                        )}
                      </div>

                      {/* Grade C */}
                      <div className={`p-1.5 rounded-xl border ${
                        ad.gradeC_price 
                          ? 'bg-white border-purple-200/80 shadow-2xs' 
                          : 'bg-slate-50/60 border-dashed border-slate-200 opacity-60'
                      }`}>
                        <span className="text-[9px] font-black text-purple-800 uppercase block">
                          🏷️ Grade C
                        </span>
                        {ad.gradeC_price ? (
                          <>
                            <span className="text-xs font-black text-slate-900 block mt-0.5">
                              ৳{ad.gradeC_price}
                            </span>
                            {ad.gradeC_stock ? (
                              <span className="text-[8.5px] font-semibold text-slate-500 block">
                                স্টক: {ad.gradeC_stock}
                              </span>
                            ) : (
                              <span className="text-[8.5px] font-semibold text-purple-600 block">উপলব্ধ</span>
                            )}
                          </>
                        ) : (
                          <span className="text-[9px] text-slate-400 block mt-1">—</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-200/60 flex flex-col gap-1 text-[10.5px]">
                      <div className="flex items-center justify-between text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400" />
                          <span>{getDistrictDisplayName(ad.district, language)}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                          {language === 'bn' ? 'ন্যূনতম অর্ডার:' : 'Min:'} {ad.minimumOrder} {ad.unitLabel}
                        </span>
                      </div>

                      {ad.deliveryDate && (
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Truck size={11} className="text-emerald-600 shrink-0" />
                          <span>{ad.deliveryDate} • {ad.deliveryArea}</span>
                        </div>
                      )}

                      {ad.vaccineDetails && (
                        <div className="flex items-center gap-1.5 text-teal-800 font-medium bg-teal-50/80 px-2 py-0.5 rounded-lg border border-teal-100">
                          <Syringe size={11} className="text-teal-600 shrink-0" />
                          <span className="truncate">{ad.vaccineDetails}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {ad.description && (
                    <p className="text-[11px] text-slate-600 font-medium line-clamp-2 mb-3">
                      {ad.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons: Direct Call, WhatsApp Order & Edit/Delete */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={`tel:${ad.phone}`}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Phone size={13} className="text-emerald-400" />
                    <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => openWhatsAppOrder(ad)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <MessageCircle size={13} className="text-white" />
                    <span>{language === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                  </button>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPost(ad)}
                        className="p-2 text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl transition-all cursor-pointer active:scale-95"
                        title={language === 'bn' ? 'বিজ্ঞাপন এডিট করুন' : 'Edit Ad'}
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setListingToDelete(ad)}
                        className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer active:scale-95"
                        title={language === 'bn' ? 'বিজ্ঞাপন মুছে ফেলুন (স্লট খালি হবে)' : 'Delete Ad'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. POST / EDIT CHICK AD MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative my-auto animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setIsPostModalOpen(false);
                setEditingAdId(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                🐣
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {editingAdId 
                    ? (language === 'bn' ? 'বাচ্চার বিজ্ঞাপন এডিট করুন' : 'Edit Chick Advertisement')
                    : (language === 'bn' ? 'বাচ্চার নতুন বিজ্ঞাপন দিন (১টি বিজ্ঞাপনে ৩ গ্রেড)' : 'Post Chick Ad (3 Grades in 1 Ad)')}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {language === 'bn' ? 'স্বনামধন্য হ্যাচারি, কোম্পানি ও ডিলারদের জন্য' : 'For hatcheries, companies & breeders'}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateOrUpdatePost} className="space-y-3">
              {/* Step 1: Category & Breed Selection */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {language === 'bn' ? 'মূল বর্গ *' : 'Main Category *'}
                    </label>
                    <select
                      value={postForm.category}
                      onChange={(e) => handleFormCategoryChange(e.target.value as ChickCategory)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      <option value="poultry">{language === 'bn' ? '🐔 পোল্ট্রি মুরগি' : 'Poultry'}</option>
                      <option value="birds">{language === 'bn' ? '🦆 হাঁস ও পাখি' : 'Duck & Birds'}</option>
                      <option value="fish">{language === 'bn' ? '🐟 মাছের পোনা' : 'Fish Fry'}</option>
                      <option value="cattle">{language === 'bn' ? '🐄 বাছুর ও পশু' : 'Calf & Livestock'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {language === 'bn' ? 'বাচ্চার জাত নির্বাচন *' : 'Select Breed *'}
                    </label>
                    <select
                      value={postForm.breedKey}
                      onChange={(e) => handleFormBreedChange(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      {CHICK_BREEDS.filter(b => b.category === postForm.category).map((breed) => (
                        <option key={breed.key} value={breed.key}>
                          {breed.icon} {breed.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quota reminder note */}
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-200">
                  <Info size={12} className="text-emerald-600 shrink-0" />
                  <span>
                    {language === 'bn'
                      ? 'কোটা নিয়ম: এই ১টি বিজ্ঞাপনেই আপনি Grade A, B, C ৩ গ্রেডের দর একসাথে রাখতে পারবেন।'
                      : 'Quota rule: You can specify Grade A, B, and C prices inside this single ad.'}
                  </span>
                </div>
              </div>

              {/* Step 2: 3-Grade Pricing (A, B, C) */}
              <div className="bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/40 p-3 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
                  <label className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                    <Tag size={12} className="text-amber-600" />
                    <span>{language === 'bn' ? 'গ্রেডভিত্তিক রেট ও স্টক নির্ধারণ' : 'Grade Pricing & Available Stock'}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold">
                    দর (টাকা/{postForm.unitLabel})
                  </span>
                </div>

                {/* Grade A */}
                <div className="grid grid-cols-2 gap-2 bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block text-[10px] font-black text-emerald-900 mb-0.5">
                      🏆 Grade A দর (টাকা) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="যেমন: 50"
                      value={postForm.gradeA_price}
                      onChange={(e) => setPostForm({ ...postForm, gradeA_price: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-black text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-emerald-900 mb-0.5">
                      Grade A স্টক ({postForm.unitLabel})
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: 5000"
                      value={postForm.gradeA_stock}
                      onChange={(e) => setPostForm({ ...postForm, gradeA_stock: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Grade B */}
                <div className="grid grid-cols-2 gap-2 bg-amber-50/70 p-2 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-[10px] font-black text-amber-900 mb-0.5">
                      ⭐ Grade B দর (ঐচ্ছিক)
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: 42"
                      value={postForm.gradeB_price}
                      onChange={(e) => setPostForm({ ...postForm, gradeB_price: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-black text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-900 mb-0.5">
                      Grade B স্টক ({postForm.unitLabel})
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: 2000"
                      value={postForm.gradeB_stock}
                      onChange={(e) => setPostForm({ ...postForm, gradeB_stock: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Grade C */}
                <div className="grid grid-cols-2 gap-2 bg-purple-50/70 p-2 rounded-xl border border-purple-200">
                  <div>
                    <label className="block text-[10px] font-black text-purple-900 mb-0.5">
                      🏷️ Grade C দর (ঐচ্ছিক)
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: 35"
                      value={postForm.gradeC_price}
                      onChange={(e) => setPostForm({ ...postForm, gradeC_price: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-black text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-purple-900 mb-0.5">
                      Grade C স্টক ({postForm.unitLabel})
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: 500"
                      value={postForm.gradeC_stock}
                      onChange={(e) => setPostForm({ ...postForm, gradeC_stock: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      {language === 'bn' ? 'একক (Unit)' : 'Unit'}
                    </label>
                    <select
                      value={postForm.unitLabel}
                      onChange={(e) => setPostForm({ ...postForm, unitLabel: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      <option value="পিস">পিস (Piece)</option>
                      <option value="প্রতি হাজার">প্রতি হাজার (Per 1000)</option>
                      <option value="বক্স (১০০ পিস)">বক্স (১০০ পিস)</option>
                      <option value="কেজি">কেজি (Kg)</option>
                      <option value="জোড়া">জোড়া (Pair)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      {language === 'bn' ? 'সর্বনিম্ন অর্ডার' : 'Min Order'}
                    </label>
                    <input
                      type="number"
                      value={postForm.minimumOrder}
                      onChange={(e) => setPostForm({ ...postForm, minimumOrder: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Company & Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'কোম্পানি বা হ্যাচারির নাম *' : 'Company Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'bn' ? 'যেমন: রূপালী হ্যাচারি' : 'e.g. Rupali Hatchery'}
                    value={postForm.companyName}
                    onChange={(e) => setPostForm({ ...postForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'যোগাযোগকারীর নাম' : 'Contact Person'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'ম্যানেজার / প্রোপ্রাইটর' : 'Manager name'}
                    value={postForm.contactPerson}
                    onChange={(e) => setPostForm({ ...postForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'মোবাইল নম্বর (কলের জন্য) *' : 'Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx"
                    value={postForm.phone}
                    onChange={(e) => setPostForm({ ...postForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর' : 'WhatsApp Number'}
                  </label>
                  <input
                    type="tel"
                    placeholder={postForm.whatsappSameAsPhone ? postForm.phone || '017xxxxxxxx' : '01xxxxxxxxx'}
                    disabled={postForm.whatsappSameAsPhone}
                    value={postForm.whatsappSameAsPhone ? postForm.phone : postForm.whatsapp}
                    onChange={(e) => setPostForm({ ...postForm, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white disabled:opacity-60"
                  />
                  <label className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postForm.whatsappSameAsPhone}
                      onChange={(e) => setPostForm({ ...postForm, whatsappSameAsPhone: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span>{language === 'bn' ? 'কল ও হোয়াটসঅ্যাপ নম্বর একই' : 'Same as phone'}</span>
                  </label>
                </div>
              </div>

              {/* District & Delivery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'হ্যাচারির জেলা *' : 'Hatchery District *'}
                  </label>
                  <select
                    value={postForm.district}
                    onChange={(e) => setPostForm({ ...postForm, district: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    {ALL_64_DISTRICTS.map((dist) => (
                      <option key={dist.nameBn} value={dist.nameBn}>
                        {language === 'bn' ? dist.nameBn : dist.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'ডেলিভারি সুবিধা ও দিন' : 'Delivery Details'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'যেমন: প্রতি রবি ও বুধবার দেশব্যাপী' : 'e.g. Nationwide delivery'}
                    value={postForm.deliveryDate}
                    onChange={(e) => setPostForm({ ...postForm, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Vaccine & Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'ভ্যাকসিন বিবরণ ও অতিরিক্ত নোট' : 'Vaccine & Notes'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'যেমন: মারেক্স ভ্যাকসিন সম্পন্ন, সুস্থ প্যারেন্ট স্টক' : 'e.g. Mareks vaccinated'}
                  value={postForm.vaccineDetails}
                  onChange={(e) => setPostForm({ ...postForm, vaccineDetails: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white mb-2"
                />
                <textarea
                  rows={2}
                  placeholder={language === 'bn' ? 'বুকিং সংক্রান্ত কোনো বিশেষ নিয়ম বা শর্ত...' : 'Booking terms...'}
                  value={postForm.description}
                  onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPostModalOpen(false);
                    setEditingAdId(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className={`flex-1 py-2.5 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSubmittingPost ? 'bg-emerald-400 opacity-70 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmittingPost ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>{language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>
                      {editingAdId 
                        ? (language === 'bn' ? 'বিজ্ঞাপন আপডেট করুন' : 'Update Ad')
                        : (language === 'bn' ? 'বিজ্ঞাপন প্রকাশ করুন' : 'Publish Ad')}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. QUOTA CONFLICT ALERT MODAL */}
      {showQuotaModal && quotaConflictBreed && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowQuotaModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {language === 'bn' ? 'কোটা সীমা: এই জাতে বিজ্ঞাপন সক্রিয় আছে' : 'Ad Quota Limit Reached'}
                </h3>
                <p className="text-xs text-emerald-800 font-bold mt-0.5">
                  {quotaConflictBreed.icon} {quotaConflictBreed.nameBn}
                </p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 mb-4 text-xs text-amber-950 font-medium space-y-2">
              <p>
                {language === 'bn' 
                  ? `আপনি ইতিমধ্যে "${quotaConflictBreed.nameBn}"-এর জন্য ১টি সক্রিয় বিজ্ঞাপন দিয়েছেন।` 
                  : `You already have 1 active advertisement for "${quotaConflictBreed.nameEn}".`}
              </p>
              <p className="font-bold text-emerald-900 bg-white/80 p-2 rounded-xl border border-amber-200">
                💡 {language === 'bn' 
                  ? 'সুবিধা: আপনি ওই ১টি বিজ্ঞাপনেই Grade A, Grade B এবং Grade C—এই ৩ গ্রেডের দর ও স্টক একসাথে আপডেট করতে পারেন। একাধিক বিজ্ঞাপনের প্রয়োজন নেই।' 
                  : 'You can update Grade A, B, and C prices inside that single ad without creating duplicates.'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {(() => {
                const existingAd = getMyAdInBreed(quotaConflictBreed.key);
                return (
                  <>
                    {existingAd && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuotaModal(false);
                          handleOpenEditPost(existingAd);
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Pencil size={14} />
                        <span>{language === 'bn' ? 'বিদ্যমান বিজ্ঞাপনটি এডিট করুন' : 'Edit Existing Ad'}</span>
                      </button>
                    )}

                    {existingAd && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuotaModal(false);
                          setListingToDelete(existingAd);
                        }}
                        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={14} />
                        <span>{language === 'bn' ? 'বিজ্ঞাপন মুছে নতুন বিজ্ঞাপন দিন' : 'Delete and Post New'}</span>
                      </button>
                    )}
                  </>
                );
              })()}

              <button
                type="button"
                onClick={() => setShowQuotaModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. In-App Delete Confirmation Modal */}
      {listingToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setListingToDelete(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {language === 'bn' ? 'বিজ্ঞাপন মুছে ফেলুন' : 'Delete Advertisement'}
                </h3>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  {listingToDelete.companyName} • {listingToDelete.subCategory}
                </p>
              </div>
            </div>

            <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-3.5 mb-4 text-xs text-rose-900 font-medium space-y-1.5">
              <p>
                {language === 'bn' 
                  ? 'আপনি কি নিশ্চিত এই বাচ্চার বিজ্ঞাপনটি বাজার তালিকা থেকে মুছে ফেলতে চান? মুছে ফেললে ওই জাতের বিজ্ঞাপন স্লটটি সাথে সাথে খালি হয়ে যাবে।' 
                  : 'Are you sure you want to delete this ad? Deleting it will free up the slot for a new ad.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setListingToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteListing}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <Trash2 size={14} />
                <span>{isDeleting ? (language === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...') : (language === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Admin Rate Edit Modal */}
      {isRateEditModalOpen && editingRate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-150 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setIsRateEditModalOpen(false);
                setEditingRate(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                <Tag size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {language === 'bn' ? 'মার্কেট রেট পরিবর্তন (অ্যাডমিন)' : 'Update Market Rate (Admin)'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {editingRate.nameBn}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveRate} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10.5px] font-black text-emerald-800 mb-1">
                    Grade A (৳)
                  </label>
                  <input
                    type="number"
                    value={editingRate.gradeA}
                    onChange={(e) => setEditingRate({ ...editingRate, gradeA: Number(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-black text-emerald-950 text-center"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-black text-amber-800 mb-1">
                    Grade B (৳)
                  </label>
                  <input
                    type="number"
                    value={editingRate.gradeB}
                    onChange={(e) => setEditingRate({ ...editingRate, gradeB: Number(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-black text-amber-950 text-center"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-black text-purple-800 mb-1">
                    Grade C (৳)
                  </label>
                  <input
                    type="number"
                    value={editingRate.gradeC}
                    onChange={(e) => setEditingRate({ ...editingRate, gradeC: Number(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 bg-purple-50 border border-purple-300 rounded-xl text-xs font-black text-purple-950 text-center"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRateEditModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChickMarket;
