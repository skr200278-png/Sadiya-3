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
import { db, handleFirestoreError, OperationType, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { demoStore, DemoMarketPost, DemoMarketBuyer } from '../utils/demoStore';
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
  Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Marketplace() {
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'posts' | 'buyers'>('posts');
  const [posts, setPosts] = useState<DemoMarketPost[]>([]);
  const [buyers, setBuyers] = useState<DemoMarketBuyer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState<boolean>(false);

  // Sell Post Form State
  const [postForm, setPostForm] = useState({
    farmerName: '',
    farmName: '',
    phone: '',
    district: 'গাজীপুর',
    upazila: '',
    locationDetails: '',
    poultryType: 'broiler' as 'broiler' | 'sonali' | 'deshi' | 'layer' | 'other',
    birdCount: '' as string | number,
    avgWeightKg: '' as string | number,
    expectedPricePerKg: '' as string | number,
    isEmergency: false,
    emergencyReason: '',
    notes: ''
  });

  // Buyer Form State
  const [buyerForm, setBuyerForm] = useState({
    buyerName: '',
    businessName: '',
    phone: '',
    whatsapp: '',
    district: 'গাজীপুর',
    upazila: '',
    address: '',
    buyingTypes: ['broiler', 'sonali'] as string[],
    currentBuyingRate: '',
    dailyDemand: ''
  });

  // Initialize with user profile if available
  useEffect(() => {
    if (isDemoUser) {
      const profile = demoStore.getProfile();
      setPostForm(prev => ({
        ...prev,
        farmerName: profile.name || '',
        farmName: profile.farmName || '',
        phone: profile.phone || ''
      }));
    } else if (currentUser) {
      const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          setPostForm(prev => ({
            ...prev,
            farmerName: d.name || currentUser.displayName || '',
            farmName: d.farmName || '',
            phone: d.phone || ''
          }));
        }
      });
      return () => unsub();
    }
  }, [currentUser, isDemoUser]);

  // Load Data
  useEffect(() => {
    if (isDemoUser) {
      const loadDemoData = () => {
        setPosts(demoStore.getMarketPosts());
        setBuyers(demoStore.getMarketBuyers());
        setLoading(false);
      };
      loadDemoData();
      const unsub = demoStore.subscribe(loadDemoData);
      return () => unsub();
    }

    // Firestore Realtime Listener for Posts
    const qPosts = query(collection(db, 'marketplace_posts'), orderBy('createdAt', 'desc'));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const postList: any[] = [];
      snapshot.forEach(docSnap => {
        postList.push({ id: docSnap.id, ...docSnap.data() });
      });
      // If empty on firestore, fallback to default demo list for friendly first load
      if (postList.length === 0) {
        setPosts(demoStore.getMarketPosts());
      } else {
        setPosts(postList);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firestore posts error, loading local demo:", error);
      setPosts(demoStore.getMarketPosts());
      setLoading(false);
    });

    // Firestore Realtime Listener for Buyers
    const qBuyers = query(collection(db, 'market_buyers'), orderBy('createdAt', 'desc'));
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

  // Handle Post Submit
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.farmerName || !postForm.phone || !postForm.birdCount || !postForm.expectedPricePerKg) {
      toast.error(language === 'bn' ? 'অনুগ্রহ করে প্রয়োজনীয় তথ্য পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    const birdCountNum = Number(postForm.birdCount) || 0;
    const avgWeightNum = Number(postForm.avgWeightKg) || 0;
    const totalWeightNum = Math.round(birdCountNum * avgWeightNum);

    const newPostData = {
      userId: currentUser ? currentUser.uid : 'demo_user',
      farmerName: postForm.farmerName,
      farmName: postForm.farmName || (language === 'bn' ? 'পোল্ট্রি খামার' : 'Poultry Farm'),
      phone: postForm.phone,
      district: postForm.district,
      upazila: postForm.upazila,
      locationDetails: postForm.locationDetails || postForm.district,
      poultryType: postForm.poultryType,
      birdCount: birdCountNum,
      avgWeightKg: avgWeightNum,
      totalWeightKg: totalWeightNum,
      expectedPricePerKg: Number(postForm.expectedPricePerKg) || 0,
      isEmergency: postForm.isEmergency,
      emergencyReason: postForm.emergencyReason,
      status: 'available' as const,
      notes: postForm.notes,
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoUser) {
        demoStore.saveMarketPost(newPostData);
      } else {
        try {
          await addDoc(collection(db, 'marketplace_posts'), newPostData);
        } catch (err) {
          demoStore.saveMarketPost(newPostData);
        }
      }
      toast.success(language === 'bn' ? 'বিজ্ঞাপন সফলভাবে প্রকাশিত হয়েছে!' : 'Sell alert posted successfully!');
      setIsPostModalOpen(false);
      // Reset
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
      toast.error(language === 'bn' ? 'বিজ্ঞাপন প্রকাশ করতে সমস্যা হয়েছে' : 'Failed to publish post');
    }
  };

  // Handle Buyer Submit
  const handleCreateBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerForm.buyerName || !buyerForm.businessName || !buyerForm.phone) {
      toast.error(language === 'bn' ? 'নাম, প্রতিষ্ঠানের নাম ও ফোন নম্বর দিন' : 'Please fill buyer details');
      return;
    }

    const newBuyerData = {
      userId: currentUser ? currentUser.uid : 'demo_user',
      buyerName: buyerForm.buyerName,
      businessName: buyerForm.businessName,
      phone: buyerForm.phone,
      whatsapp: buyerForm.whatsapp || buyerForm.phone,
      district: buyerForm.district,
      upazila: buyerForm.upazila,
      address: buyerForm.address || buyerForm.district,
      buyingTypes: buyerForm.buyingTypes.length > 0 ? buyerForm.buyingTypes : ['broiler'],
      currentBuyingRate: buyerForm.currentBuyingRate || (language === 'bn' ? 'চলমান বাজার দর' : 'Market Rate'),
      dailyDemand: buyerForm.dailyDemand || (language === 'bn' ? 'প্রয়োজন অনুযায়ী' : 'As needed'),
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

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm(language === 'bn' ? 'আপনি কি এই বিজ্ঞাপনটি মুছে ফেলতে চান?' : 'Delete this post?')) return;
    try {
      if (isDemoUser) {
        demoStore.deleteMarketPost(postId);
      } else {
        try {
          await deleteDoc(doc(db, 'marketplace_posts', postId));
        } catch (e) {
          demoStore.deleteMarketPost(postId);
        }
      }
      toast.success(language === 'bn' ? 'বিজ্ঞাপন মুছে ফেলা হয়েছে' : 'Post deleted');
    } catch (e) {
      toast.error('Failed to delete post');
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

  // Districts List for filtering
  const districts = [
    'সকল জেলা',
    'গাজীপুর',
    'ঢাকা',
    'টাঙ্গাইল',
    'ময়মনসিংহ',
    'বগুড়া',
    'কুমিল্লা',
    'চট্টগ্রাম',
    'যশোর',
    'সিলেট',
    'রাজশাহী',
    'রংপুর',
    'কিশোরগঞ্জ',
    'নরসিংদী',
    'ব্রাহ্মণবাড়িয়া'
  ];

  // Filtered Posts
  const filteredPosts = posts.filter(post => {
    if (emergencyOnly && !post.isEmergency) return false;
    if (selectedDistrict !== 'all' && selectedDistrict !== 'সকল জেলা' && post.district !== selectedDistrict) return false;
    if (selectedTypeFilter !== 'all' && post.poultryType !== selectedTypeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchLoc = post.district.toLowerCase().includes(q) || post.locationDetails.toLowerCase().includes(q);
      const matchFarmer = post.farmerName.toLowerCase().includes(q) || post.farmName.toLowerCase().includes(q);
      if (!matchLoc && !matchFarmer) return false;
    }
    return true;
  });

  // Filtered Buyers
  const filteredBuyers = buyers.filter(buyer => {
    if (selectedDistrict !== 'all' && selectedDistrict !== 'সকল জেলা' && buyer.district !== selectedDistrict) return false;
    if (selectedTypeFilter !== 'all' && !buyer.buyingTypes.includes(selectedTypeFilter)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = buyer.buyerName.toLowerCase().includes(q) || buyer.businessName.toLowerCase().includes(q);
      const matchLoc = buyer.district.toLowerCase().includes(q) || buyer.address.toLowerCase().includes(q);
      if (!matchName && !matchLoc) return false;
    }
    return true;
  });

  const getPoultryTypeName = (type: string) => {
    switch (type) {
      case 'broiler': return language === 'bn' ? 'ব্রয়লার' : 'Broiler';
      case 'sonali': return language === 'bn' ? 'সোনালী' : 'Sonali';
      case 'deshi': return language === 'bn' ? 'দেশি' : 'Deshi';
      case 'layer': return language === 'bn' ? 'লেয়ার' : 'Layer';
      default: return language === 'bn' ? 'অন্যান্য' : 'Other';
    }
  };

  return (
    <div className="space-y-3 pb-8 animate-fadeIn select-none">
      
      {/* 1. Header Banner & Action Buttons */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shadow-xs shrink-0">
                <Store size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  {language === 'bn' ? 'খামারি ও পাইকার বাজার' : 'Poultry Market & Buyer Hub'}
                </h2>
                <p className="text-[10px] text-emerald-200/90 font-medium">
                  {language === 'bn' ? 'জরুরি মুরগি বিক্রি ও পাইকারদের সরাসরি সংযোগ কেন্দ্র' : 'Fast emergency poultry sales & wholesale buyer network'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Trigger Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-emerald-700/50">
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-2xl font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>{language === 'bn' ? '📢 বিক্রির বিজ্ঞাপন দিন' : 'Post Sell Alert'}</span>
            </button>

            <button
              onClick={() => setIsBuyerModalOpen(true)}
              className="py-2.5 px-3 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 backdrop-blur-xs"
            >
              <Users size={16} />
              <span>{language === 'bn' ? '+ পাইকার হিসেবে যুক্ত হন' : '+ Join as Buyer'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dual Tab Selector (বিজ্ঞাপন বোর্ড vs পাইকারি ক্রেতা তালিকা) */}
      <div className="bg-white p-1 rounded-2xl shadow-xs border border-slate-200/80 flex gap-1">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Flame size={14} className={activeTab === 'posts' ? 'text-amber-300' : 'text-amber-500'} />
          <span>{language === 'bn' ? 'মুরগি বিক্রির বিজ্ঞাপন' : 'Sell Alerts'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-sans ${
            activeTab === 'posts' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {posts.filter(p => p.status !== 'sold').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('buyers')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'buyers'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck size={14} className={activeTab === 'buyers' ? 'text-amber-300' : 'text-emerald-600'} />
          <span>{language === 'bn' ? 'পাইকারি ক্রেতা ডিরেক্টরি' : 'Wholesale Buyers'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-sans ${
            activeTab === 'buyers' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {buyers.length}
          </span>
        </button>
      </div>

      {/* 3. Search & District Filter Bar */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-150 space-y-2">
        <div className="flex gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'bn' ? 'এলাকা, জেলা বা নাম খুঁজুন...' : 'Search location, district or name...'}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* District Dropdown */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
          >
            {districts.map((d, i) => (
              <option key={i} value={d === 'সকল জেলা' ? 'all' : d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Tags Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          <button
            onClick={() => { setSelectedTypeFilter('all'); setEmergencyOnly(false); }}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              selectedTypeFilter === 'all' && !emergencyOnly
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'bn' ? 'সকল' : 'All'}
          </button>

          {/* Emergency Tag */}
          <button
            onClick={() => setEmergencyOnly(!emergencyOnly)}
            className={`px-2.5 py-1 rounded-lg font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              emergencyOnly
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            }`}
          >
            <Flame size={12} />
            {language === 'bn' ? '🚨 জরুরি বিক্রি' : '🚨 Emergency'}
          </button>

          <button
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'broiler' ? 'all' : 'broiler')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              selectedTypeFilter === 'broiler'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'bn' ? 'ব্রয়লার' : 'Broiler'}
          </button>

          <button
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'sonali' ? 'all' : 'sonali')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              selectedTypeFilter === 'sonali'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'bn' ? 'সোনালী' : 'Sonali'}
          </button>

          <button
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'layer' ? 'all' : 'layer')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              selectedTypeFilter === 'layer'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'bn' ? 'লেয়ার' : 'Layer'}
          </button>
        </div>
      </div>

      {/* 4. Tab 1: Sell Posts Feed */}
      {activeTab === 'posts' && (
        <div className="space-y-3">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              const isOwner = currentUser && (post.userId === currentUser.uid || isDemoUser);
              const isSold = post.status === 'sold';

              return (
                <div 
                  key={post.id}
                  className={`bg-white rounded-3xl p-3.5 sm:p-4 shadow-xs border transition-all ${
                    post.isEmergency 
                      ? 'border-red-300 ring-1 ring-red-100 bg-linear-to-b from-red-50/20 to-white' 
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
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                          {language === 'bn' ? 'বিক্রয় বিজ্ঞাপন' : 'For Sale'}
                        </span>
                      )}

                      <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                        🐔 {getPoultryTypeName(post.poultryType)}
                      </span>

                      {isSold && (
                        <span className="bg-slate-800 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                          ✓ {language === 'bn' ? 'বিক্রি সম্পন্ন' : 'Sold Out'}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-0.5">
                      <Clock size={10} />
                      {formatTimeAgo(post.createdAt)}
                    </span>
                  </div>

                  {/* Main Information Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                    {/* 1. Bird Count */}
                    <div className="bg-slate-50/90 p-2 rounded-2xl border border-slate-150">
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">
                        {language === 'bn' ? 'মোট সংখ্যা' : 'Bird Count'}
                      </span>
                      <p className="text-xs font-black text-slate-850 font-sans">
                        {post.birdCount} {language === 'bn' ? 'টি' : 'pcs'}
                      </p>
                    </div>

                    {/* 2. Average Weight */}
                    <div className="bg-slate-50/90 p-2 rounded-2xl border border-slate-150">
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">
                        {language === 'bn' ? 'গড় ওজন' : 'Avg Weight'}
                      </span>
                      <p className="text-xs font-black text-indigo-700 font-sans">
                        {post.avgWeightKg} {language === 'bn' ? 'কেজি' : 'kg'}
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
                    <div className="bg-emerald-50/80 p-2 rounded-2xl border border-emerald-200">
                      <span className="text-[9px] font-bold text-emerald-800 block mb-0.5">
                        {language === 'bn' ? 'কাঙ্ক্ষিত দর' : 'Expected Rate'}
                      </span>
                      <p className="text-xs font-black text-emerald-700 font-sans">
                        ৳ {post.expectedPricePerKg} <span className="text-[9px] font-bold">/কেজি</span>
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
                        <span>{post.district} {post.upazila ? `(${post.upazila})` : ''}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-bold truncate">{post.farmName}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium pl-4 mt-0.5">
                        {post.locationDetails} (খামারি: {post.farmerName})
                      </p>
                    </div>

                    {/* Action Call & WhatsApp Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${post.phone}`}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
                      >
                        <Phone size={13} />
                        <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
                      </a>

                      <a
                        href={`https://wa.me/88${post.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমি আপনার অ্যাপের বিক্রয় বিজ্ঞাপন দেখেছি (${post.poultryType}, ${post.birdCount} পিস, ${post.district})। কথা বলতে চাই।`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </a>

                      {/* Owner Controls */}
                      {isOwner && (
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5 ml-1">
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
                            onClick={() => handleDeletePost(post.id)}
                            title="Delete Post"
                            className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center border-dashed border-2 border-slate-200 space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Store size={24} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800">
                {language === 'bn' ? 'কোনো বিক্রয় বিজ্ঞাপন পাওয়া যায়নি' : 'No sell posts found'}
              </h3>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                {language === 'bn' 
                  ? 'আপনার খামারের মুরগি বিক্রি করার জন্য নিচের বাটনে চাপ দিয়ে এখনই বিজ্ঞাপন দিন।' 
                  : 'Post a sell alert to connect with ready wholesale buyers in your area.'}
              </p>
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} />
                {language === 'bn' ? 'প্রথম বিজ্ঞাপন দিন' : 'Create First Post'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Wholesale Buyers Directory Feed */}
      {activeTab === 'buyers' && (
        <div className="space-y-3">
          {filteredBuyers.length > 0 ? (
            filteredBuyers.map((buyer) => (
              <div 
                key={buyer.id}
                className="bg-white rounded-3xl p-3.5 sm:p-4 shadow-xs border border-slate-200 hover:border-emerald-300 transition-all"
              >
                {/* Buyer Header */}
                <div className="flex items-start justify-between pb-2 border-b border-slate-100 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm shrink-0 border border-amber-200">
                      🏢
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                          {buyer.businessName}
                        </h4>
                        {buyer.verified && (
                          <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.2 rounded-full border border-emerald-200 flex items-center gap-0.5">
                            <ShieldCheck size={9} />
                            {language === 'bn' ? 'যাচাইকৃত' : 'Verified'}
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
                    <span>{buyer.address}</span>
                  </p>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${buyer.phone}`}
                      className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
                    >
                      <Phone size={13} />
                      <span>{language === 'bn' ? 'সরাসরি কল' : 'Call Buyer'}</span>
                    </a>

                    {buyer.whatsapp && (
                      <a
                        href={`https://wa.me/88${buyer.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমি খামারি। আপনার আড়তে মুরগি বিক্রির বিষয়ে কথা বলতে চাচ্ছি।`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>

              </div>
            ))
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
                onClick={() => setIsBuyerModalOpen(true)}
                className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} />
                {language === 'bn' ? 'পাইকার হিসেবে নাম দিন' : 'Register as Buyer'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. Modal: Create Sell Post (বিজ্ঞাপন দিন) */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-3.5 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black shrink-0 border border-amber-200">
                  📢
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-850 leading-tight">
                    {language === 'bn' ? 'মুরগি বিক্রির নতুন বিজ্ঞাপন দিন' : 'Post New Poultry Sell Alert'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                    {language === 'bn' ? 'সকল পাইকার ও বেপারিদের নজরে আসবে' : 'Visible instantly to all wholesale dealers'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPostModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs font-bold text-slate-700">
              
              {/* Emergency Sale Toggle Switch */}
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
                        {language === 'bn' ? 'সমস্যার কারণে অতি দ্রুত মুরগি ছাড়তে চাইলে অন করুন' : 'Turn on for urgent lot clearance'}
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
                      placeholder={language === 'bn' ? 'যেমন: প্রচণ্ড গরম / ওভার সাইজ / দ্রুত ফান্ডের প্রয়োজন' : 'e.g. Extreme heat / rapid cash requirement'}
                      className="w-full p-2 bg-white border border-red-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Poultry Type Selection */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {language === 'bn' ? 'মুরগির জাত নির্বাচন করুন *' : 'Poultry Type *'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['broiler', 'sonali', 'layer', 'deshi'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPostForm({ ...postForm, poultryType: type })}
                      className={`py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                        postForm.poultryType === type 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {getPoultryTypeName(type)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bird Count, Avg Weight, Rate Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'মোট সংখ্যা (পিস) *' : 'Bird Count *'}
                  </label>
                  <input 
                    type="number"
                    required
                    value={postForm.birdCount}
                    onChange={(e) => setPostForm({ ...postForm, birdCount: e.target.value })}
                    placeholder="1500"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'গড় ওজন (কেজি) *' : 'Avg Wt (kg) *'}
                  </label>
                  <input 
                    type="number"
                    step="0.05"
                    required
                    value={postForm.avgWeightKg}
                    onChange={(e) => setPostForm({ ...postForm, avgWeightKg: e.target.value })}
                    placeholder="1.9"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'কাঙ্ক্ষিত দর (৳/কেজি) *' : 'Target Rate (৳) *'}
                  </label>
                  <input 
                    type="number"
                    required
                    value={postForm.expectedPricePerKg}
                    onChange={(e) => setPostForm({ ...postForm, expectedPricePerKg: e.target.value })}
                    placeholder="180"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Auto Total Weight Preview */}
              {Number(postForm.birdCount) > 0 && Number(postForm.avgWeightKg) > 0 && (
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center justify-between text-xs font-black text-emerald-800">
                  <span>{language === 'bn' ? 'মোট আনুমানিক মুরগির ওজন:' : 'Total estimated lot weight:'}</span>
                  <span className="font-sans">
                    {Math.round(Number(postForm.birdCount) * Number(postForm.avgWeightKg))} কেজি
                  </span>
                </div>
              )}

              {/* Farmer Name & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'আপনার নাম *' : 'Your Name *'}
                  </label>
                  <input 
                    type="text"
                    required
                    value={postForm.farmerName}
                    onChange={(e) => setPostForm({ ...postForm, farmerName: e.target.value })}
                    placeholder="মো. রফিক"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'মোবাইল নম্বর *' : 'Phone Number *'}
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
              </div>

              {/* District & Location Details */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'জেলা *' : 'District *'}
                  </label>
                  <select
                    value={postForm.district}
                    onChange={(e) => setPostForm({ ...postForm, district: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    {districts.filter(d => d !== 'সকল জেলা').map((d, i) => (
                      <option key={i} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'উপজেলা / খামারের নাম' : 'Upazila / Farm Name'}
                  </label>
                  <input 
                    type="text"
                    value={postForm.upazila}
                    onChange={(e) => setPostForm({ ...postForm, upazila: e.target.value })}
                    placeholder="শ্রীপুর / সবুজ খামার"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Specific Location Details */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {language === 'bn' ? 'খামারের সঠিক ঠিকানা / গাড়ি পৌঁছানোর লোকেশন' : 'Exact Farm Address'}
                </label>
                <input 
                  type="text"
                  value={postForm.locationDetails}
                  onChange={(e) => setPostForm({ ...postForm, locationDetails: e.target.value })}
                  placeholder={language === 'bn' ? 'যেমন: মাওনা চৌরাস্তা থেকে ২ কিমি পূর্বে' : 'e.g. 2 km east from Maona chowrasta'}
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

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                <Plus size={16} />
                {language === 'bn' ? 'বিজ্ঞাপনটি প্রকাশ করুন' : 'Publish Sell Alert'}
              </button>
            </form>
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

              {/* District & Location */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'জেলা *' : 'District *'}
                  </label>
                  <select
                    value={buyerForm.district}
                    onChange={(e) => setBuyerForm({ ...buyerForm, district: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    {districts.filter(d => d !== 'সকল জেলা').map((d, i) => (
                      <option key={i} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'আড়ত / বাজারের ঠিকানা' : 'Market Address'}
                  </label>
                  <input 
                    type="text"
                    value={buyerForm.address}
                    onChange={(e) => setBuyerForm({ ...buyerForm, address: e.target.value })}
                    placeholder="জয়দেবপুর বাজার, গাজীপুর"
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

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                <CheckCircle2 size={16} />
                {language === 'bn' ? 'পাইকার ডিরেক্টরিতে নাম যোগ করুন' : 'Register Buyer Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
