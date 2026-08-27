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
import { db, auth, handleFirestoreError, OperationType, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { demoStore, DemoMarketPost, DemoMarketBuyer } from '../utils/demoStore';
import { 
  BANGLADESH_DIVISIONS, 
  ALL_64_DISTRICTS, 
  BANGLADESH_DISTRICT_NAMES_BN, 
  DISTRICT_FILTER_OPTIONS_BN 
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
  Crown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Marketplace() {
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();

  const isAdmin = currentUser?.email === 'skabusufian452@gmail.com' || (currentUser as any)?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'posts' | 'buyers'>('posts');
  const [posts, setPosts] = useState<DemoMarketPost[]>([]);
  const [buyers, setBuyers] = useState<DemoMarketBuyer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [postTypeFilter, setPostTypeFilter] = useState<'all' | 'sell' | 'buy'>('all');
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(false);
  const [onlyMyPosts, setOnlyMyPosts] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals & Delete Dialogs
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState<boolean>(false);
  const [postToDelete, setPostToDelete] = useState<DemoMarketPost | null>(null);
  const [buyerToDelete, setBuyerToDelete] = useState<DemoMarketBuyer | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Helper for generating clean WhatsApp link
  const formatWhatsAppUrl = (whatsappNum?: string, phoneNum?: string, message: string = '') => {
    const num = (whatsappNum || phoneNum || '').replace(/[^0-9]/g, '');
    if (!num) return '#';
    let formatted = num;
    if (formatted.startsWith('880')) {
      // already starts with 880
    } else if (formatted.startsWith('0')) {
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

  // Sell/Buy Post Form State
  const [postForm, setPostForm] = useState({
    postType: 'sell' as 'sell' | 'buy',
    farmerName: '',
    farmName: '',
    phone: '',
    whatsapp: '',
    whatsappSameAsPhone: true,
    district: 'গাজীপুর',
    upazila: '',
    locationDetails: '',
    poultryType: 'broiler' as 'broiler' | 'sonali' | 'deshi' | 'layer' | 'other' | string,
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
    whatsappSameAsPhone: true,
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

    // Firestore Realtime Listener for Posts
    const qPosts = query(collection(db, 'marketplace_posts'), orderBy('createdAt', 'desc'));
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
    const finalWhatsApp = postForm.whatsappSameAsPhone ? postForm.phone : (postForm.whatsapp || postForm.phone);

    const newPostData = {
      userId: currentUser ? currentUser.uid : 'demo_user',
      postType: postForm.postType || 'sell',
      farmerName: postForm.farmerName,
      farmName: postForm.farmName || (postForm.postType === 'buy' ? (language === 'bn' ? 'ক্রেতা / প্রতিষ্ঠান' : 'Buyer Shop') : (language === 'bn' ? 'পোল্ট্রি খামার' : 'Poultry Farm')),
      phone: postForm.phone,
      whatsapp: finalWhatsApp,
      district: postForm.district,
      upazila: postForm.upazila,
      locationDetails: postForm.locationDetails || postForm.district,
      poultryType: postForm.poultryType,
      birdCount: birdCountNum,
      avgWeightKg: avgWeightNum,
      totalWeightKg: totalWeightNum,
      expectedPricePerKg: Number(postForm.expectedPricePerKg) || 0,
      isEmergency: postForm.postType === 'sell' ? postForm.isEmergency : false,
      emergencyReason: postForm.postType === 'sell' ? postForm.emergencyReason : '',
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
      toast.success(
        postForm.postType === 'buy' 
          ? (language === 'bn' ? 'ক্রয় চাহিদা বিজ্ঞাপন সফলভাবে প্রকাশিত হয়েছে!' : 'Buying demand posted successfully!')
          : (language === 'bn' ? 'বিক্রয় বিজ্ঞাপন সফলভাবে প্রকাশিত হয়েছে!' : 'Sell alert posted successfully!')
      );
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

    const finalWhatsApp = buyerForm.whatsappSameAsPhone ? buyerForm.phone : (buyerForm.whatsapp || buyerForm.phone);

    const newBuyerData = {
      userId: currentUser ? currentUser.uid : 'demo_user',
      buyerName: buyerForm.buyerName,
      businessName: buyerForm.businessName,
      phone: buyerForm.phone,
      whatsapp: finalWhatsApp,
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

  // Delete Post Handler with Confirmation
  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    const postId = postToDelete.id;
    try {
      demoStore.deleteMarketPost(postId);
      if (!isDemoUser && auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'marketplace_posts', postId));
        } catch (e) {
          console.warn("Firestore delete post notice:", e);
        }
      }
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success(language === 'bn' ? 'বিজ্ঞাপনটি সফলভাবে মুছে ফেলা হয়েছে' : 'Ad post deleted successfully');
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

  // Districts List for filtering (all 64 districts)
  const districts = DISTRICT_FILTER_OPTIONS_BN;

  // Filtered Posts
  const filteredPosts = posts.filter(post => {
    if (onlyMyPosts) {
      const isMine = (currentUser && post.userId === currentUser.uid) || isDemoUser || post.userId === 'demo_user' || (postForm.phone && post.phone === postForm.phone);
      if (!isMine) return false;
    }
    if (emergencyOnly && !post.isEmergency) return false;
    if (postTypeFilter !== 'all') {
      const type = post.postType || 'sell';
      if (type !== postTypeFilter) return false;
    }
    if (selectedDistrict !== 'all' && selectedDistrict !== 'সকল জেলা' && post.district !== selectedDistrict) return false;
    if (selectedTypeFilter !== 'all' && post.poultryType !== selectedTypeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchLoc = (post.district || '').toLowerCase().includes(q) || (post.locationDetails || '').toLowerCase().includes(q) || (post.upazila || '').toLowerCase().includes(q);
      const matchFarmer = (post.farmerName || '').toLowerCase().includes(q) || (post.farmName || '').toLowerCase().includes(q) || (post.phone || '').includes(q);
      if (!matchLoc && !matchFarmer) return false;
    }
    return true;
  });

  // Filtered Buyers
  const filteredBuyers = buyers.filter(buyer => {
    if (onlyMyPosts) {
      const isMine = (currentUser && buyer.userId === currentUser.uid) || isDemoUser || buyer.userId === 'demo_user' || (buyerForm.phone && buyer.phone === buyerForm.phone);
      if (!isMine) return false;
    }
    if (selectedDistrict !== 'all' && selectedDistrict !== 'সকল জেলা' && buyer.district !== selectedDistrict) return false;
    if (selectedTypeFilter !== 'all' && !buyer.buyingTypes.includes(selectedTypeFilter)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = (buyer.buyerName || '').toLowerCase().includes(q) || (buyer.businessName || '').toLowerCase().includes(q) || (buyer.phone || '').includes(q);
      const matchLoc = (buyer.district || '').toLowerCase().includes(q) || (buyer.address || '').toLowerCase().includes(q);
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
                  {language === 'bn' ? 'সরাসরি মোবাইল ও হোয়াটসঅ্যাপে ক্রয়-বিক্রয় যোগাযোগ' : 'Direct Phone & WhatsApp marketplace for poultry buyers and sellers'}
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
              <span>{language === 'bn' ? '📢 বিজ্ঞাপন দিন (বিক্রয়/ক্রয়)' : 'Post Sell/Buy Alert'}</span>
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

      {/* Master Admin Notice Banner if logged in as skabusufian452@gmail.com */}
      {isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-2 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Crown size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black flex items-center gap-1">
                <span>{language === 'bn' ? 'মাস্টার অ্যাডমিন কন্ট্রোল সক্রিয়' : 'Master Admin Controls Active'}</span>
                <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded font-bold">Admin</span>
              </p>
              <p className="text-[10px] text-amber-800 truncate font-medium">
                {language === 'bn' 
                  ? 'আপনি বাজারের যেকোনো ক্রেতা-বিক্রেতার বিজ্ঞাপন সরাসরি ডিলিট ও বিক্রি স্ট্যাটাস পরিবর্তন করতে পারবেন।' 
                  : 'You have master permission to delete or manage any marketplace listing.'}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-lg shrink-0 border border-amber-300">
            {posts.length} {language === 'bn' ? 'টি পোস্ট' : 'posts'}
          </span>
        </div>
      )}

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
          <span>{language === 'bn' ? 'ক্রয়-বিক্রয় বিজ্ঞাপন' : 'Market Ads'}</span>
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
          {/* All */}
          <button
            onClick={() => { setSelectedTypeFilter('all'); setPostTypeFilter('all'); setEmergencyOnly(false); setOnlyMyPosts(false); }}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
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
            className={`px-2.5 py-1 rounded-lg font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              onlyMyPosts
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <UserCheck size={13} />
            <span>{language === 'bn' ? 'আমার বিজ্ঞাপন' : 'My Ads'}</span>
          </button>

          {/* Sell Filter */}
          <button
            onClick={() => { setPostTypeFilter(postTypeFilter === 'sell' ? 'all' : 'sell'); setEmergencyOnly(false); setOnlyMyPosts(false); }}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              postTypeFilter === 'sell' && !emergencyOnly && !onlyMyPosts
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {language === 'bn' ? '📢 বিক্রয় বিজ্ঞাপন' : 'Sell Ads'}
          </button>

          {/* Buy Filter */}
          <button
            onClick={() => { setPostTypeFilter(postTypeFilter === 'buy' ? 'all' : 'buy'); setEmergencyOnly(false); setOnlyMyPosts(false); }}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              postTypeFilter === 'buy' && !emergencyOnly && !onlyMyPosts
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {language === 'bn' ? '🛒 ক্রয় চাহিদা' : 'Buy Requests'}
          </button>

          {/* Emergency Tag */}
          <button
            onClick={() => { setEmergencyOnly(!emergencyOnly); setOnlyMyPosts(false); }}
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
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'bn' ? 'ব্রয়লার' : 'Broiler'}
          </button>

          <button
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'sonali' ? 'all' : 'sonali')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              selectedTypeFilter === 'sonali'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'bn' ? 'সোনালী' : 'Sonali'}
          </button>

          <button
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'layer' ? 'all' : 'layer')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              selectedTypeFilter === 'layer'
                ? 'bg-teal-600 text-white'
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
              const isDirectOwner = Boolean(
                isDemoUser ||
                (currentUser && post.userId === currentUser.uid) ||
                (post.phone && postForm.phone && post.phone === postForm.phone) ||
                post.userId === 'demo_user' ||
                post.userId?.startsWith('demo_') ||
                post.id?.startsWith('post_') ||
                post.id?.startsWith('demo_')
              );
              const canManage = isDirectOwner || isAdmin;
              const isSold = post.status === 'sold';
              const isBuyRequest = post.postType === 'buy';
              const whatsappNumber = post.whatsapp || post.phone;

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

                      <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                        🐔 {getPoultryTypeName(post.poultryType)}
                      </span>

                      {canManage && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          {isAdmin && !isDirectOwner ? <Crown size={10} className="text-amber-700" /> : <Check size={10} className="text-emerald-700" />}
                          <span>{isDirectOwner ? (language === 'bn' ? 'আমার পোস্ট' : 'My Post') : (language === 'bn' ? 'মাস্টার অ্যাডমিন' : 'Master Admin')}</span>
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

                  {/* Main Information Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                    {/* 1. Bird Count */}
                    <div className="bg-slate-50/90 p-2 rounded-2xl border border-slate-150">
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">
                        {language === 'bn' ? (isBuyRequest ? 'প্রয়োজনীয় সংখ্যা' : 'মোট সংখ্যা') : 'Bird Count'}
                      </span>
                      <p className="text-xs font-black text-slate-850 font-sans">
                        {post.birdCount} {language === 'bn' ? 'টি' : 'pcs'}
                      </p>
                    </div>

                    {/* 2. Average Weight */}
                    <div className="bg-slate-50/90 p-2 rounded-2xl border border-slate-150">
                      <span className="text-[9px] font-bold text-slate-400 block mb-0.5">
                        {language === 'bn' ? (isBuyRequest ? 'প্রত্যাশিত ওজন' : 'গড় ওজন') : 'Avg Weight'}
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
                    <div className={`${isBuyRequest ? 'bg-indigo-50/80 border-indigo-200' : 'bg-emerald-50/80 border-emerald-200'} p-2 rounded-2xl border`}>
                      <span className={`text-[9px] font-bold ${isBuyRequest ? 'text-indigo-800' : 'text-emerald-800'} block mb-0.5`}>
                        {language === 'bn' ? (isBuyRequest ? 'প্রস্তাবিত বাজেট/দর' : 'কাঙ্ক্ষিত দর') : 'Rate'}
                      </span>
                      <p className={`text-xs font-black ${isBuyRequest ? 'text-indigo-700' : 'text-emerald-700'} font-sans`}>
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
                        <span className="text-slate-600 font-bold truncate">{post.farmName || (isBuyRequest ? 'ক্রেতা' : 'খামার')}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium pl-4 mt-0.5">
                        {post.locationDetails} ({isBuyRequest ? 'বিজ্ঞাপনদাতা' : 'খামারি'}: {post.farmerName})
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
                        href={`https://wa.me/88${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমি আপনার অ্যাপের বিজ্ঞাপন দেখেছি (${getPoultryTypeName(post.poultryType)}, ${post.birdCount} পিস, ${post.district})। বিস্তারিত কথা বলতে চাই।`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </a>

                      {/* Owner / Master Admin Controls Top Quick Icons */}
                      {canManage && (
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
                          <span>{isAdmin && !isDirectOwner ? (language === 'bn' ? 'অ্যাডমিন ডিলিট (Delete)' : 'Admin Delete') : (language === 'bn' ? 'বিজ্ঞাপন মুছুন (Delete)' : 'Delete Ad')}</span>
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
                onClick={() => setIsPostModalOpen(true)}
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
        <div className="space-y-3">
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
                onClick={() => setIsBuyerModalOpen(true)}
                className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
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
                    {language === 'bn' ? 'বাজারের জন্য নতুন বিজ্ঞাপন দিন' : 'Post New Marketplace Alert'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                    {language === 'bn' ? 'সকল খামারি, পাইকার ও আড়তদারদের নজরে আসবে' : 'Visible instantly to all farmers and wholesale buyers'}
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
              
              {/* Post Type Selector (বিক্রি vs ক্রয়) */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  {language === 'bn' ? 'বিজ্ঞাপনের ধরন নির্বাচন করুন *' : 'Ad Type *'}
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
                    <span>📢 {language === 'bn' ? 'মুরগি বিক্রির বিজ্ঞাপন (Sell)' : 'For Sale (Farmer/Seller)'}</span>
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
                    <span>🛒 {language === 'bn' ? 'মুরগি ক্রয়ের চাহিদা (Buy)' : 'Wanted to Buy (Buyer)'}</span>
                  </button>
                </div>
              </div>

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
              )}

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
                    {language === 'bn' ? (postForm.postType === 'buy' ? 'প্রয়োজনীয় সংখ্যা *' : 'মোট সংখ্যা (পিস) *') : 'Bird Count *'}
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
                    {language === 'bn' ? (postForm.postType === 'buy' ? 'প্রত্যাশিত ওজন (কেজি) *' : 'গড় ওজন (কেজি) *') : 'Avg Wt (kg) *'}
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
                    {language === 'bn' ? (postForm.postType === 'buy' ? 'প্রস্তাবিত বাজেট (৳/কেজি) *' : 'কাঙ্ক্ষিত দর (৳/কেজি) *') : 'Rate (৳) *'}
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
                    <span>{language === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর (WhatsApp)' : 'WhatsApp Number'}</span>
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

              {/* District & Location Details with 64 Districts Grouped by Division */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    {language === 'bn' ? 'জেলা * (৬৪ জেলা)' : 'District * (64 Districts)'}
                  </label>
                  <select
                    value={postForm.district}
                    onChange={(e) => setPostForm({ ...postForm, district: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    {BANGLADESH_DIVISIONS.map((div) => (
                      <optgroup key={div.en} label={`${div.bn} বিভাগ`}>
                        {ALL_64_DISTRICTS.filter(d => d.divisionBn === div.bn).map(d => (
                          <option key={d.nameBn} value={d.nameBn}>{d.nameBn}</option>
                        ))}
                      </optgroup>
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
                {language === 'bn' ? 'বিজ্ঞাপনটি প্রকাশ করুন' : 'Publish Alert'}
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
                    {language === 'bn' ? 'জেলা * (৬৪ জেলা)' : 'District * (64 Districts)'}
                  </label>
                  <select
                    value={buyerForm.district}
                    onChange={(e) => setBuyerForm({ ...buyerForm, district: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    {BANGLADESH_DIVISIONS.map((div) => (
                      <optgroup key={div.en} label={`${div.bn} বিভাগ`}>
                        {ALL_64_DISTRICTS.filter(d => d.divisionBn === div.bn).map(d => (
                          <option key={d.nameBn} value={d.nameBn}>{d.nameBn}</option>
                        ))}
                      </optgroup>
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
