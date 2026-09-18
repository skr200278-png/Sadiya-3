import React, { useState, useEffect } from 'react';
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
import { db, fastGetDocs } from '../firebase';
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
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Building2, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Star, 
  X, 
  Crown, 
  Tag, 
  PackageCheck,
  AlertCircle,
  HelpCircle,
  Truck,
  Syringe,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

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

export const ChickMarket: React.FC = () => {
  const { currentUser, isDemoUser } = useAuth();
  const { language, t } = useLanguage();
  const { isAdmin: sysAdmin } = useSystemConfig();

  const isMasterAdmin = 
    Boolean(sysAdmin) || 
    currentUser?.email === 'skabusufian452@gmail.com' || 
    currentUser?.email === 'sr0632890@gmail.com' ||
    currentUser?.email === 'admin@digitalfarm.pro' || 
    (currentUser as any)?.role === 'admin';
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
  const [isRateEditModalOpen, setIsRateEditModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<DemoChickRate | null>(null);
  const [listingToDelete, setListingToDelete] = useState<DemoChickListing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tab & Filters
  const [activeCategory, setActiveCategory] = useState<'all' | 'poultry' | 'birds' | 'fish' | 'cattle'>('all');
  const [selectedGrade, setSelectedGrade] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Post Form State
  const [postForm, setPostForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    whatsapp: '',
    whatsappSameAsPhone: true,
    category: 'poultry' as 'poultry' | 'birds' | 'fish' | 'cattle',
    subCategory: 'ব্রয়লার একদিনের বাচ্চা (Broiler DOC)',
    grade: 'A' as 'A' | 'B' | 'C',
    pricePerUnit: '',
    unitLabel: 'পিস',
    minimumOrder: '100',
    availableStock: '',
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

      // 1. Sync deleted demo IDs from Firestore if connected
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
        // Fallback to local
      }

      if (isDemoUser) {
        setRates(demoStore.getChickRates());
        const currentDeleted = (() => {
          try {
            return JSON.parse(localStorage.getItem('deleted_demo_chick_ads') || '[]');
          } catch {
            return [];
          }
        })();
        const raw = demoStore.getChickListings();
        setListings(raw.filter(l => !currentDeleted.includes(l.id)));
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
          const currentDeleted = (() => {
            try {
              return JSON.parse(localStorage.getItem('deleted_demo_chick_ads') || '[]');
            } catch {
              return [];
            }
          })();

          const firestoreAds = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DemoChickListing));
          const availableDemoAds = initialChickListings.filter(d => !currentDeleted.includes(d.id));
          const firestoreIds = new Set(firestoreAds.map(a => a.id));

          const combined = [
            ...firestoreAds,
            ...availableDemoAds.filter(d => !firestoreIds.has(d.id))
          ];

          setListings(combined);
          setLoading(false);
        }, (err) => {
          console.warn('Listings listener fallback to demo:', err);
          const currentDeleted = (() => {
            try {
              return JSON.parse(localStorage.getItem('deleted_demo_chick_ads') || '[]');
            } catch {
              return [];
            }
          })();
          const raw = demoStore.getChickListings();
          setListings(raw.filter(l => !currentDeleted.includes(l.id)));
          setLoading(false);
        });
      } catch (err) {
        const currentDeleted = (() => {
          try {
            return JSON.parse(localStorage.getItem('deleted_demo_chick_ads') || '[]');
          } catch {
            return [];
          }
        })();
        const raw = demoStore.getChickListings();
        setListings(raw.filter(l => !currentDeleted.includes(l.id)));
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubListings) unsubListings();
      if (unsubRates) unsubRates();
    };
  }, [isDemoUser]);

  // Handle Post Submit
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.companyName.trim() || !postForm.phone.trim() || !postForm.pricePerUnit) {
      toast.error(language === 'bn' ? 'অনুগ্রহ করে কোম্পানি, মোবাইল ও বাচ্চার মূল্য পূরণ করুন' : 'Please fill Company Name, Phone, and Price');
      return;
    }

    const finalWhatsApp = postForm.whatsappSameAsPhone ? postForm.phone.trim() : (postForm.whatsapp.trim() || postForm.phone.trim());

    const newAdData = {
      userId: currentUser?.uid || (isDemoUser ? 'demo_user' : 'guest_user'),
      userEmail: currentUser?.email || '',
      userPhone: currentUser?.phoneNumber || postForm.phone.trim(),
      companyName: postForm.companyName.trim(),
      contactPerson: postForm.contactPerson.trim() || postForm.companyName.trim(),
      phone: postForm.phone.trim(),
      whatsapp: finalWhatsApp,
      category: postForm.category,
      subCategory: postForm.subCategory.trim(),
      grade: postForm.grade,
      pricePerUnit: Number(postForm.pricePerUnit) || 0,
      unitLabel: postForm.unitLabel,
      minimumOrder: Number(postForm.minimumOrder) || 100,
      availableStock: Number(postForm.availableStock) || 0,
      deliveryDate: postForm.deliveryDate.trim() || 'আলোচনা সাপেক্ষে',
      district: postForm.district,
      deliveryArea: postForm.deliveryArea.trim() || 'সমগ্র বাংলাদেশ',
      vaccineDetails: postForm.vaccineDetails.trim(),
      description: postForm.description.trim(),
      isVerified: isMasterAdmin ? true : false,
      isFeatured: false,
      status: 'available' as const,
      createdAt: new Date().toISOString()
    };

    try {
      let createdAdId = '';
      if (isDemoUser) {
        const saved = demoStore.saveChickListing(newAdData);
        createdAdId = saved.id;
        setListings(demoStore.getChickListings());
      } else {
        try {
          const docRef = await addDoc(collection(db, 'chick_listings'), newAdData);
          createdAdId = docRef.id;
          demoStore.saveChickListing({ ...newAdData, id: createdAdId });
          setListings(prev => [{ id: createdAdId, ...newAdData } as DemoChickListing, ...prev]);
        } catch (err) {
          const saved = demoStore.saveChickListing(newAdData);
          createdAdId = saved.id;
          setListings(demoStore.getChickListings());
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
      }

      toast.success(language === 'bn' ? 'বাচ্চার বিজ্ঞাপন সফলভাবে প্রকাশিত হয়েছে!' : 'Chick advertisement posted successfully!');
      setIsPostModalOpen(false);
      setPostForm({
        companyName: '',
        contactPerson: '',
        phone: '',
        whatsapp: '',
        whatsappSameAsPhone: true,
        category: 'poultry',
        subCategory: 'ব্রয়লার একদিনের বাচ্চা (Broiler DOC)',
        grade: 'A',
        pricePerUnit: '',
        unitLabel: 'পিস',
        minimumOrder: '100',
        availableStock: '',
        deliveryDate: '',
        district: 'ঢাকা',
        deliveryArea: 'সমগ্র বাংলাদেশ বা নিজস্ব জেলায়',
        vaccineDetails: 'মারেক্স ও গামবোরো স্প্রে ভ্যাকসিনেটেড',
        description: ''
      });
    } catch (err: any) {
      toast.error(err.message || 'Error creating ad');
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

  // Confirm Delete Listing (Creator can delete own ad; Master Admin can delete any ad, including default demo ads)
  const confirmDeleteListing = async () => {
    if (!listingToDelete) return;
    setIsDeleting(true);

    const listingId = listingToDelete.id;
    const isDemo = isDefaultDemoChickAd(listingToDelete);

    try {
      if (isDemo) {
        // Master Admin deleting a default demo listing
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
        toast.success(language === 'bn' ? 'অ্যাডমিন কর্তৃক ডেমো বাচ্চার বিজ্ঞাপনটি মুছে ফেলা হয়েছে' : 'Demo chick ad deleted by admin');
      } else {
        // Creator deleting own ad or Admin deleting user ad
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
        toast.success(language === 'bn' ? 'বাচ্চার বিজ্ঞাপনটি সফলভাবে মুছে ফেলা হয়েছে' : 'Chick advertisement deleted successfully');
      }
    } catch (err: any) {
      console.error('Delete listing error:', err);
      toast.error(language === 'bn' ? 'বিজ্ঞাপন মুছতে সমস্যা হয়েছে' : 'Could not delete ad');
    } finally {
      setIsDeleting(false);
      setListingToDelete(null);
    }
  };

  // Master Admin: Delete ALL default demo chick ads at once
  const handleDeleteAllDemoAds = async () => {
    if (!isMasterAdmin) return;
    const allDemoIds = initialChickListings.map(d => d.id);
    const updated = Array.from(new Set([...deletedDemoChickAdIds, ...allDemoIds]));

    setDeletedDemoChickAdIds(updated);
    try {
      localStorage.setItem('deleted_demo_chick_ads', JSON.stringify(updated));
    } catch {}

    allDemoIds.forEach(id => demoStore.deleteChickListing(id));

    if (!isDemoUser) {
      try {
        await setDoc(doc(db, 'system_config', 'chick_market'), {
          deletedDemoChickAdIds: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore sync note:', err);
      }
    }

    setListings(prev => prev.filter(ad => !allDemoIds.includes(ad.id)));
    toast.success(language === 'bn' ? 'সকল ডেমো বাচ্চার বিজ্ঞাপন সফলভাবে মুছে ফেলা হয়েছে' : 'All demo chick advertisements removed by admin');
  };

  // Master Admin: Restore default demo chick ads
  const handleRestoreDemoAds = async () => {
    if (!isMasterAdmin) return;
    setDeletedDemoChickAdIds([]);
    try {
      localStorage.removeItem('deleted_demo_chick_ads');
    } catch {}

    demoStore.restoreDefaultChickListings();

    if (!isDemoUser) {
      try {
        await setDoc(doc(db, 'system_config', 'chick_market'), {
          deletedDemoChickAdIds: [],
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore sync note:', err);
      }
    }

    setListings(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const toAdd = initialChickListings.filter(d => !existingIds.has(d.id));
      return [...prev, ...toAdd];
    });

    toast.success(language === 'bn' ? 'সকল ডেমো বাচ্চার বিজ্ঞাপন রিস্টোর করা হয়েছে' : 'All demo chick ads restored successfully');
  };

  // WhatsApp Order helper
  const openWhatsAppOrder = (listing: DemoChickListing) => {
    const cleanPhone = (listing.whatsapp || listing.phone).replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
    const text = encodeURIComponent(
      `আসসালামু আলাইকুম ${listing.companyName}। আমি ফার্ম ম্যানেজার (Farm Manager) অ্যাপে আপনার বাচ্চার বিজ্ঞাপন দেখলাম।\n\n` +
      `বাচ্চার জাত: ${listing.subCategory}\n` +
      `গ্রেড: Grade ${listing.grade}\n` +
      `মূল্য: ৳${listing.pricePerUnit} (${listing.unitLabel})\n` +
      `ন্যূনতম অর্ডার: ${listing.minimumOrder} পিস\n\n` +
      `আমি অর্ডার ও ডেলিভারি সম্পর্কে বিস্তারিত কথা বলতে চাই।`
    );
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
  };

  // Filter listings
  const filteredListings = listings.filter(l => {
    if (activeCategory !== 'all' && l.category !== activeCategory) return false;
    if (selectedGrade !== 'all' && l.grade !== selectedGrade) return false;
    if (selectedDistrict !== 'all' && l.district !== selectedDistrict) return false;
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

  // Filter rates
  const filteredRates = rates.filter(r => {
    if (activeCategory !== 'all' && r.category !== activeCategory) return false;
    return true;
  });

  return (
    <div className="space-y-4 pb-12 select-none animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Crown size={11} />
                {language === 'bn' ? 'অফিসিয়াল হ্যাচারি মার্কেট' : 'Official Hatchery Market'}
              </span>
              <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                {language === 'bn' ? 'A, B, C গ্রেড রেট' : 'Grade A, B, C Rates'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>🏬</span>
              <span>{language === 'bn' ? 'হ্যাচারি ও বাচ্চার দোকান / স্টোর ডিরেক্টরি' : 'Hatchery & Chick Stores Directory'}</span>
            </h1>
            <p className="text-xs text-emerald-100/90 font-medium mt-0.5 max-w-xl">
              {language === 'bn' 
                ? 'স্বনামধন্য হ্যাচারি ও ডিলারদের দোকান থেকে সরাসরি সুস্থ বাচ্চা সংগ্রহ, ফোন ও হোয়াটসঅ্যাপে অর্ডার।' 
                : 'Direct company stores, verified contact numbers, and chick availability directory.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPostModalOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} className="text-slate-950" />
            <span>{language === 'bn' ? 'বাচ্চার দোকান / বিজ্ঞাপন দিন' : 'Post Chick Store / Ad'}</span>
          </button>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent skew-x-12 pointer-events-none" />
      </div>

      {/* 2. Market Rates Notification Banner (Points to Dashboard Market Rates) */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/90 rounded-2xl p-3 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Tag size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-850">
                {language === 'bn' ? 'দৈনিক বাচ্চার বাজার দর (A, B, C গ্রেড)' : 'Daily Chick Market Rates (A, B, C Grades)'}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[8.5px] font-black px-1.5 py-0.2 rounded-full">
                ড্যাশবোর্ডে যুক্ত
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {language === 'bn' 
                ? 'মুরগি ও বাচ্চার দৈনিক বেঞ্চমার্ক দর ড্যাশবোর্ডের "বাজার দর" অপশনে লাইভ দেখা যাবে।' 
                : 'Daily live chick benchmark rates are now available inside the Dashboard Market Rates card.'}
            </p>
          </div>
        </div>

        <a
          href="#/dashboard"
          className="w-full sm:w-auto text-center py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1 shrink-0"
        >
          <span>{language === 'bn' ? 'ড্যাশবোর্ডের বাজার দর দেখুন ➔' : 'View Dashboard Rates ➔'}</span>
        </a>
      </div>

      {/* 2.1 Master Admin Moderation & Demo Ads Control Strip */}
      {isMasterAdmin && (
        <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
              <Crown size={16} />
            </div>
            <div>
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                {language === 'bn' ? 'মাস্টার অ্যাডমিন কন্ট্রোল: বাচ্চার বিজ্ঞাপন ও ডেমো মডারেশন' : 'Master Admin: Chick Listings & Demo Moderation'}
              </span>
              <p className="text-[10.5px] text-slate-300 font-medium mt-0.5">
                {language === 'bn' 
                  ? 'বর্তমান ডেমো বিজ্ঞাপন এবং ব্যবহারকারীদের যে কোনো বিজ্ঞাপন অ্যাডমিন হিসেবে মুছে ফেলতে পারেন।' 
                  : 'You have full admin permission to delete default demo ads or moderate any user listings.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            {listings.some(ad => isDefaultDemoChickAd(ad)) && (
              <button
                type="button"
                onClick={handleDeleteAllDemoAds}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-600 border border-rose-500/40 hover:border-rose-600 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'সকল ডেমো বিজ্ঞাপন মুছুন' : 'Delete All Demo Ads'}</span>
              </button>
            )}

            {deletedDemoChickAdIds.length > 0 && (
              <button
                type="button"
                onClick={handleRestoreDemoAds}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-600 border border-emerald-400/40 hover:border-emerald-500 text-emerald-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles size={13} />
                <span>{language === 'bn' ? `ডেমো রিস্টোর (${deletedDemoChickAdIds.length})` : `Restore Demo Ads (${deletedDemoChickAdIds.length})`}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Category Selector for Stores */}
      <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-1 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-1 min-w-[75px] py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>🏬</span>
          <span>{language === 'bn' ? 'সকল দোকান ও স্টোর' : 'All Stores'}</span>
        </button>

        <button
          onClick={() => setActiveCategory('poultry')}
          className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeCategory === 'poultry'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>🐔</span>
          <span>{language === 'bn' ? 'মুরগির বাচ্চা হ্যাচারি' : 'Poultry Chicks'}</span>
        </button>

        <button
          onClick={() => setActiveCategory('birds')}
          className={`flex-1 min-w-[85px] py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeCategory === 'birds'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>🐦</span>
          <span>{language === 'bn' ? 'পাখির বাচ্চা স্টোর' : 'Bird Chicks'}</span>
        </button>

        <button
          onClick={() => setActiveCategory('fish')}
          className={`flex-1 min-w-[85px] py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeCategory === 'fish'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>🐟</span>
          <span>{language === 'bn' ? 'মাছের পোনা নার্সারি' : 'Fish Fry'}</span>
        </button>
      </div>

      {/* 4. Filter & Search Bar for Company Advertisements */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 size={16} className="text-emerald-700" />
            <h2 className="text-xs sm:text-sm font-black text-slate-900">
              {language === 'bn' ? 'হ্যাচারি ও বাচ্চার দোকান / স্টোর তালিকা' : 'Hatchery & Chick Store Listings'}
            </h2>
          </div>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
            {filteredListings.length} {language === 'bn' ? 'টি স্টোর উপলব্ধ' : 'Stores Available'}
          </span>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[140px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'bn' ? 'কোম্পানি, হ্যাচারি বা বাচ্চার নাম...' : 'Search company or breed...'}
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
              <option value="A">Grade A (১ম গ্রেড)</option>
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

      {/* 5. Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <Bird size={24} />
          </div>
          <h3 className="text-sm font-black text-slate-800">
            {language === 'bn' ? 'কোনো বিজ্ঞাপন পাওয়া যায়নি' : 'No ads found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {language === 'bn' 
              ? 'আপনার ফিল্টার পরিবর্তন করুন অথবা আপনি নিজেই নতুন বাচ্চার বিজ্ঞাপন পোস্ট করুন।' 
              : 'Try changing your filters or post a new chick advertisement.'}
          </p>
          <button
            type="button"
            onClick={() => setIsPostModalOpen(true)}
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
            const isDirectOwner = !isDemoAd && Boolean(
              (currentUser && ad.userId && currentUser.uid === ad.userId) ||
              (currentUser?.email && (ad as any).userEmail && currentUser.email === (ad as any).userEmail) ||
              (currentUser?.phoneNumber && ad.phone && (ad.phone.includes(currentUser.phoneNumber.replace('+88', '')) || currentUser.phoneNumber.includes(ad.phone))) ||
              myCreatedAdIds.includes(ad.id) ||
              (isDemoUser && (ad.userId === 'demo_user' || ad.userId === 'demo_khamari_user_1' || ad.id?.startsWith('chick_my_')))
            );

            // Access control:
            // - System default demo ads: ONLY Master Admin can manage/delete!
            // - User-created ads: Creator OR Master Admin can manage/delete!
            const canManage = isDemoAd ? isMasterAdmin : (isDirectOwner || isMasterAdmin);

            return (
              <div 
                key={ad.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Bar: Company Name & Grade Badge */}
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
                        <span>🐣</span>
                        <span className="text-emerald-800">{ad.subCategory}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Grade Chip */}
                      <div className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase border ${
                        ad.grade === 'A' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs' 
                          : ad.grade === 'B'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-purple-50 text-purple-800 border-purple-200'
                      }`}>
                        Grade {ad.grade}
                      </div>

                      {canManage && (
                        <span className={`text-[9.5px] font-black px-2 py-0.8 rounded-lg flex items-center gap-1 border ${
                          isDemoAd
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : isMasterAdmin && !isDirectOwner
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isDemoAd ? (
                            <Crown size={10} className="text-purple-600" />
                          ) : isMasterAdmin && !isDirectOwner ? (
                            <Crown size={10} className="text-rose-600" />
                          ) : (
                            <CheckCircle2 size={10} className="text-emerald-600" />
                          )}
                          <span>
                            {isDemoAd
                              ? (language === 'bn' ? 'অ্যাডমিন নিয়ন্ত্রণ (ডেমো)' : 'Admin Demo Control')
                              : isDirectOwner
                              ? (language === 'bn' ? 'আপনার বিজ্ঞাপন' : 'Your Ad')
                              : (language === 'bn' ? 'মাস্টার এডমিন' : 'Master Admin')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Details Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-150 mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        {language === 'bn' ? 'মূল্য (প্রতি পিস/বক্স)' : 'Price per Unit'}
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        ৳{ad.pricePerUnit} <span className="text-[10px] font-normal text-slate-500">/{ad.unitLabel}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        {language === 'bn' ? 'সর্বনিম্ন অর্ডার' : 'Min Order'}
                      </span>
                      <span className="text-xs font-black text-slate-800">
                        {ad.minimumOrder} {language === 'bn' ? 'পিস' : 'pcs'}
                      </span>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-slate-200/60 flex flex-col gap-1 text-[10.5px]">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span>{getDistrictDisplayName(ad.district, language)} • {ad.deliveryArea}</span>
                      </div>

                      {ad.deliveryDate && (
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Truck size={12} className="text-emerald-600 shrink-0" />
                          <span>{ad.deliveryDate}</span>
                        </div>
                      )}

                      {ad.vaccineDetails && (
                        <div className="flex items-center gap-1.5 text-teal-800 font-medium bg-teal-50/80 px-2 py-0.5 rounded-lg border border-teal-100">
                          <Syringe size={12} className="text-teal-600 shrink-0" />
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

                {/* Action Buttons: Direct Call, WhatsApp Order & Delete for Owner/Admin */}
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
                    <span>{language === 'bn' ? 'হোয়াটসঅ্যাপ অর্ডার' : 'WhatsApp'}</span>
                  </button>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setListingToDelete(ad)}
                      className="flex items-center gap-1 px-2.5 py-2 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer shrink-0 text-xs font-black active:scale-95"
                      title={isDemoAd
                        ? (language === 'bn' ? 'মাস্টার এডমিন: ডেমো বিজ্ঞাপন মুছুন' : 'Master Admin: Delete Demo Ad')
                        : isMasterAdmin && !isDirectOwner 
                        ? (language === 'bn' ? 'মাস্টার এডমিন: বিজ্ঞাপন ডিলিট করুন' : 'Master Admin: Delete Ad') 
                        : (language === 'bn' ? 'বিজ্ঞাপন মুছে ফেলুন' : 'Delete Your Ad')}
                    >
                      <Trash2 size={14} />
                      <span className="hidden xs:inline">
                        {isDemoAd
                          ? (language === 'bn' ? 'ডেমো মুছুন' : 'Delete Demo')
                          : isMasterAdmin && !isDirectOwner 
                          ? (language === 'bn' ? 'এডমিন ডিলিট' : 'Admin Del') 
                          : (language === 'bn' ? 'মুছুন' : 'Delete')}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Post Chick Ad Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative my-auto animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                🐣
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {language === 'bn' ? 'বাচ্চার বিক্রয় বিজ্ঞাপন দিন' : 'Post Chick / Fingerling Ad'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {language === 'bn' ? 'হ্যাচারি, কোম্পানি ও ডিলারদের জন্য' : 'For hatcheries, companies & breeders'}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Company Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'কোম্পানি বা হ্যাচারির নাম *' : 'Company / Hatchery Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'bn' ? 'যেমন: কাজী ফার্মস / সোনালী হ্যাচারি' : 'e.g. Kazi Farms / Sonali Hatchery'}
                    value={postForm.companyName}
                    onChange={(e) => setPostForm({ ...postForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'যোগাযোগকারীর নাম' : 'Contact Person'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'নাম লিখুন' : 'Enter name'}
                    value={postForm.contactPerson}
                    onChange={(e) => setPostForm({ ...postForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
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

              {/* Category, Breed, and Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'মূল বর্গ *' : 'Category *'}
                  </label>
                  <select
                    value={postForm.category}
                    onChange={(e) => setPostForm({ ...postForm, category: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    <option value="poultry">{language === 'bn' ? 'মুরগির বাচ্চা' : 'Poultry'}</option>
                    <option value="birds">{language === 'bn' ? 'পাখির বাচ্চা' : 'Birds'}</option>
                    <option value="fish">{language === 'bn' ? 'মাছের পোনা' : 'Fish Fry'}</option>
                    <option value="cattle">{language === 'bn' ? 'বাছুর / পশু' : 'Calf'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'বাচ্চার জাত ও নাম *' : 'Breed / Breed Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'bn' ? 'যেমন: ব্রয়লার / সোনালী হাইব্রিড' : 'e.g. Broiler / Sonali'}
                    value={postForm.subCategory}
                    onChange={(e) => setPostForm({ ...postForm, subCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'গুণগত গ্রেড *' : 'Quality Grade *'}
                  </label>
                  <select
                    value={postForm.grade}
                    onChange={(e) => setPostForm({ ...postForm, grade: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-black text-emerald-950 focus:bg-white cursor-pointer"
                  >
                    <option value="A">Grade A (১ম সেরা গ্রেড)</option>
                    <option value="B">Grade B (২য় মানসম্মত গ্রেড)</option>
                    <option value="C">Grade C (৩য় লোকাল গ্রেড)</option>
                  </select>
                </div>
              </div>

              {/* Price, Unit & Minimum Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'মূল্য (টাকা) *' : 'Price (BDT) *'}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="যেমন: 64"
                    value={postForm.pricePerUnit}
                    onChange={(e) => setPostForm({ ...postForm, pricePerUnit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'একক (Unit)' : 'Unit'}
                  </label>
                  <select
                    value={postForm.unitLabel}
                    onChange={(e) => setPostForm({ ...postForm, unitLabel: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    <option value="পিস">পিস (Piece)</option>
                    <option value="বক্স (১০০ পিস)">বক্স (১০০ পিস)</option>
                    <option value="প্রতি হাজার">প্রতি হাজার (Per 1000)</option>
                    <option value="কেজি">কেজি (Kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'সর্বনিম্ন অর্ডার' : 'Min Order (pcs)'}
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    value={postForm.minimumOrder}
                    onChange={(e) => setPostForm({ ...postForm, minimumOrder: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* District & Delivery Details */}
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
                    {language === 'bn' ? 'ডেলিভারি সুবিধা ও দিন' : 'Delivery Details & Days'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'যেমন: প্রতি রবি ও বুধবার দেশব্যাপী' : 'e.g. Nationwide Sun & Wed'}
                    value={postForm.deliveryDate}
                    onChange={(e) => setPostForm({ ...postForm, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Vaccine & Health Details */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'ভ্যাকসিন ও স্বাস্থ্য সুরক্ষা বিবরণ' : 'Vaccine & Health Details'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'যেমন: মারেক্স ও গামবোরো স্প্রে ভ্যাকসিন সম্পন্ন' : 'e.g. Mareks vaccinated'}
                  value={postForm.vaccineDetails}
                  onChange={(e) => setPostForm({ ...postForm, vaccineDetails: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'অন্যান্য বিবরণ (ঐচ্ছিক)' : 'Description (Optional)'}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === 'bn' ? 'বাচ্চার এফসিআর, ব্রুডার ব্যবস্থাপনা বা বুকিং নিয়ম...' : 'Booking terms...'}
                  value={postForm.description}
                  onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'বিজ্ঞাপন প্রকাশ করুন' : 'Publish Ad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Admin Rate Edit Modal */}
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'বাজারের ট্রেন্ড' : 'Market Trend'}
                </label>
                <select
                  value={editingRate.trend}
                  onChange={(e) => setEditingRate({ ...editingRate, trend: e.target.value as any })}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                >
                  <option value="up">উর্ধ্বমুখী (Upward)</option>
                  <option value="stable">স্থির (Stable)</option>
                  <option value="down">নিম্নমুখী (Downward)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'পরামর্শ বা নোট' : 'Advice / Note'}
                </label>
                <input
                  type="text"
                  value={editingRate.noteBn}
                  onChange={(e) => setEditingRate({ ...editingRate, noteBn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
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

      {/* 8. In-App Delete Confirmation Modal */}
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
                  {isDefaultDemoChickAd(listingToDelete)
                    ? (language === 'bn' ? 'ডেমো বিজ্ঞাপন মুছে ফেলুন' : 'Delete Demo Advertisement')
                    : (language === 'bn' ? 'বিজ্ঞাপন মুছে ফেলুন' : 'Delete Advertisement')}
                </h3>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  {listingToDelete.companyName} • {listingToDelete.subCategory}
                </p>
              </div>
            </div>

            <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-3.5 mb-4 text-xs text-rose-900 font-medium space-y-1.5">
              <p>
                {isDefaultDemoChickAd(listingToDelete)
                  ? (language === 'bn' 
                      ? 'এটি একটি সিস্টেম ডেমো বিজ্ঞাপন। মাস্টার অ্যাডমিন হিসেবে এটি মুছে ফেললে তা তালিকা থেকে স্থায়ীভাবে মুছে যাবে।' 
                      : 'This is a system demo advertisement. Deleting it will remove it from the market listings.')
                  : (language === 'bn' 
                      ? 'আপনি কি নিশ্চিত এই বাচ্চার বিজ্ঞাপনটি বাজার তালিকা থেকে মুছে ফেলতে চান? ক্রেতারা আর এটি দেখতে পাবে না।' 
                      : 'Are you sure you want to delete this chick listing? Buyers will no longer be able to see it.')}
              </p>
              {isDefaultDemoChickAd(listingToDelete) && (
                <p className="text-[11px] text-rose-700 font-bold">
                  {language === 'bn' ? '💡 প্রয়োজনে পরে "ডেমো রিস্টোর" বাটন দিয়ে এটি ফিরিয়ে আনতে পারবেন।' : '💡 You can restore default demo ads later using the Restore button.'}
                </p>
              )}
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
    </div>
  );
};

export default ChickMarket;
