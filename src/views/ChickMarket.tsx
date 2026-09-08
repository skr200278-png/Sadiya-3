import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
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
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ChickMarket: React.FC = () => {
  const { currentUser, isDemoUser } = useAuth();
  const { language, t } = useLanguage();

  const isAdmin = currentUser?.email === 'skabusufian452@gmail.com' || (currentUser as any)?.role === 'admin';

  // State
  const [rates, setRates] = useState<DemoChickRate[]>([]);
  const [listings, setListings] = useState<DemoChickListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab & Filters
  const [activeCategory, setActiveCategory] = useState<'all' | 'poultry' | 'birds' | 'fish' | 'cattle'>('all');
  const [selectedGrade, setSelectedGrade] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isRateEditModalOpen, setIsRateEditModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<DemoChickRate | null>(null);

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
      if (isDemoUser) {
        setRates(demoStore.getChickRates());
        setListings(demoStore.getChickListings());
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
          if (!snapshot.empty) {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DemoChickListing));
            setListings(data);
          } else {
            setListings(demoStore.getChickListings());
          }
          setLoading(false);
        }, (err) => {
          console.warn('Listings listener fallback to demo:', err);
          setListings(demoStore.getChickListings());
          setLoading(false);
        });
      } catch (err) {
        setListings(demoStore.getChickListings());
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
      userId: currentUser?.uid || 'guest_user',
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
      isVerified: isAdmin ? true : false,
      isFeatured: false,
      status: 'available' as const,
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoUser) {
        demoStore.saveChickListing(newAdData);
        setListings(demoStore.getChickListings());
      } else {
        try {
          await addDoc(collection(db, 'chick_listings'), newAdData);
        } catch (err) {
          demoStore.saveChickListing(newAdData);
          setListings(demoStore.getChickListings());
        }
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

  // Delete Listing (Admin or Owner)
  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm(language === 'bn' ? 'আপনি কি এই বাচ্চার বিজ্ঞাপনটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this ad?')) {
      return;
    }

    try {
      if (isDemoUser) {
        demoStore.deleteChickListing(listingId);
        setListings(demoStore.getChickListings());
      } else {
        try {
          await deleteDoc(doc(db, 'chick_listings', listingId));
        } catch (err) {
          demoStore.deleteChickListing(listingId);
          setListings(demoStore.getChickListings());
        }
      }
      toast.success(language === 'bn' ? 'বিজ্ঞাপন মুছে ফেলা হয়েছে' : 'Ad deleted');
    } catch (err: any) {
      toast.error('Could not delete');
    }
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
              <span>🐣</span>
              <span>{language === 'bn' ? 'বাচ্চার বাজার ও হ্যাচারি স্টোর' : 'Chick & Fingerling Market'}</span>
            </h1>
            <p className="text-xs text-emerald-100/90 font-medium mt-0.5 max-w-xl">
              {language === 'bn' 
                ? 'মুরগি, পাখি ও মাছের বাচ্চার দৈনিক বাজার দর (Grade A, B, C) ও বিভিন্ন স্বনামধন্য কোম্পানির সরাসরি বাচ্চা বিক্রির বিজ্ঞাপন।'
                : 'Daily live chick & fingerling market prices (Grade A, B, C) and direct hatchery company advertisements.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPostModalOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} className="text-slate-950" />
            <span>{language === 'bn' ? 'বাচ্চার বিজ্ঞাপন দিন' : 'Post Chick Ad'}</span>
          </button>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent skew-x-12 pointer-events-none" />
      </div>

      {/* 2. Category Selector */}
      <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-1 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-1 min-w-[75px] py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>🌟</span>
          <span>{language === 'bn' ? 'সকল বর্গ' : 'All'}</span>
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
          <span>{language === 'bn' ? 'মুরগির বাচ্চা' : 'Poultry Chicks'}</span>
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
          <span>{language === 'bn' ? 'পাখির বাচ্চা' : 'Bird Chicks'}</span>
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
          <span>{language === 'bn' ? 'মাছের পোনা' : 'Fish Fry'}</span>
        </button>
      </div>

      {/* 3. Live Benchmark Market Rates Card (Grade A, B, C) */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-4 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Tag size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>{language === 'bn' ? 'দৈনিক বাচ্চার বাজার দর (A, B, C গ্রেড)' : 'Daily Chick Market Rates (A, B, C Grades)'}</span>
                <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                  LIVE
                </span>
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                {language === 'bn' 
                  ? 'হ্যাচারি ও ডিলার এসোসিয়েশন কর্তৃক নির্ধারিত বেঞ্চমার্ক দর' 
                  : 'Benchmark rates verified from hatchery associations'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <ShieldCheck size={12} />
              {language === 'bn' ? 'অ্যাডমিন মোড' : 'Admin Mode'}
            </span>
          )}
        </div>

        {/* Grade Explanation Note */}
        <div className="bg-slate-50 rounded-2xl p-2.5 mb-3 border border-slate-150 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {language === 'bn' ? 'Grade A: সেরা মান (১ম গ্রেড)' : 'Grade A: Premium (1st)'}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
              {language === 'bn' ? 'Grade B: মাঝারি মান (২য় গ্রেড)' : 'Grade B: Standard (2nd)'}
            </span>
            <span className="inline-flex items-center gap-1 text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
              {language === 'bn' ? 'Grade C: সাধারণ/লোকাল (৩য় গ্রেড)' : 'Grade C: Economy (3rd)'}
            </span>
          </div>
          <span className="text-slate-400 text-[9.5px]">
            {language === 'bn' ? 'সর্বশেষ আপডেট: আজ' : 'Updated: Today'}
          </span>
        </div>

        {/* Rates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredRates.map((rate) => (
            <div 
              key={rate.id}
              className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl p-3 border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-xs font-black text-slate-850 leading-tight">
                    {language === 'bn' ? rate.nameBn : rate.nameEn}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {rate.unit}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                    rate.trend === 'up' 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : rate.trend === 'down'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {rate.trend === 'up' ? <TrendingUp size={10} /> : rate.trend === 'down' ? <TrendingDown size={10} /> : <Minus size={10} />}
                    <span>{rate.trend === 'up' ? 'উর্ধ্বমুখী' : rate.trend === 'down' ? 'নিম্নমুখী' : 'স্থির'}</span>
                  </span>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRate({ ...rate });
                        setIsRateEditModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Rate"
                    >
                      <Edit3 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* 3-Grade Price Badges */}
              <div className="grid grid-cols-3 gap-1.5 mb-2 text-center">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-1.5">
                  <span className="text-[9px] font-black text-emerald-800 uppercase block">Grade A</span>
                  <span className="text-xs font-black text-emerald-900">৳{rate.gradeA}</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-1.5">
                  <span className="text-[9px] font-black text-amber-800 uppercase block">Grade B</span>
                  <span className="text-xs font-black text-amber-900">৳{rate.gradeB}</span>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-1.5">
                  <span className="text-[9px] font-black text-purple-800 uppercase block">Grade C</span>
                  <span className="text-xs font-black text-purple-900">৳{rate.gradeC}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 font-medium leading-relaxed bg-white/80 p-1.5 rounded-lg border border-slate-100">
                💡 {rate.noteBn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Filter & Search Bar for Company Advertisements */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 size={16} className="text-emerald-700" />
            <h2 className="text-xs sm:text-sm font-black text-slate-900">
              {language === 'bn' ? 'কোম্পানি ও হ্যাচারি বাচ্চার বিজ্ঞাপন' : 'Company & Hatchery Advertisements'}
            </h2>
          </div>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
            {filteredListings.length} {language === 'bn' ? 'টি বিজ্ঞাপন সক্রিয়' : 'Ads Live'}
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
            const isOwner = currentUser && (currentUser.uid === ad.userId || currentUser.email === 'skabusufian452@gmail.com');
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

                    {/* Grade Chip */}
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase shrink-0 border ${
                      ad.grade === 'A' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs' 
                        : ad.grade === 'B'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}>
                      Grade {ad.grade}
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

                {/* Action Buttons: Direct Call & WhatsApp Order */}
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

                  {(isOwner || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteListing(ad.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                      title={language === 'bn' ? 'বিজ্ঞাপন ডিলিট করুন' : 'Delete Ad'}
                    >
                      <Trash2 size={15} />
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
    </div>
  );
};

export default ChickMarket;
