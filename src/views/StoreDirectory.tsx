import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, 
  Search, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Pill, 
  Wheat, 
  Filter, 
  Sparkles, 
  Lock, 
  Clock, 
  ExternalLink, 
  Share2, 
  Trash2, 
  Edit3, 
  X, 
  AlertCircle, 
  Package, 
  Info,
  Building2,
  ChevronRight,
  Send,
  HelpCircle,
  ShieldAlert,
  Crown,
  Star,
  Award,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, limit } from 'firebase/firestore';
import { db, offlineSafeDocWrite } from '../firebase';
import { demoStore, DemoStoreListing } from '../utils/demoStore';
import { 
  COUNTRY_LIST, 
  detectUserCountry, 
  getCountryDisplayName, 
  getDistrictDisplayName, 
  normalizeCountryCode,
  ALL_64_DISTRICTS,
  BANGLADESH_DISTRICT_NAMES_BN,
  BANGLADESH_DISTRICT_NAMES_EN
} from '../utils/bangladeshDistricts';
import MarketplaceDisclaimerBanner from '../components/MarketplaceDisclaimerBanner';
import toast from 'react-hot-toast';

export const CATEGORY_OPTIONS = [
  { id: 'poultry_feed', labelBn: 'পোল্ট্রি ফিড (ব্রয়লার/লেয়ার/সোনালী)', labelEn: 'Poultry Feed', icon: Wheat, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'cattle_feed', labelBn: 'গরু-ছাগল ও ডেইরি ফিড / ভুসি', labelEn: 'Cattle & Dairy Feed', icon: Package, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'medicine', labelBn: 'ভেটেরিনারি ঔষধ ও অ্যান্টিবায়োটিক', labelEn: 'Vet Medicine', icon: Pill, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'vaccine', labelBn: 'ভ্যাকসিন ও কোল্ড চেইন পণ্য', labelEn: 'Vaccine & Cold-Chain', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'duck_feed', labelBn: 'হাঁস, কোয়েল ও কবুতরের খাবার', labelEn: 'Duck & Bird Feed', icon: Wheat, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'fish_feed', labelBn: 'মাছ ও চিংড়ির খাবার / পুকুর চুন', labelEn: 'Fish & Aqua Feed', icon: Package, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { id: 'chicks_equip', labelBn: 'বাচ্চা ও ফার্মের আধুনিক সরঞ্জাম', labelEn: 'Chicks & Equipment', icon: Building2, color: 'text-rose-600 bg-rose-50 border-rose-200' },
];

export default function StoreDirectory() {
  const { currentUser, isDemoUser } = useAuth();
  const { language } = useLanguage();
  const { hasAccess, openSubscriptionModal, isAdmin } = useSystemConfig();

  const isMasterAdmin = 
    isAdmin || 
    currentUser?.email === 'skabusufian452@gmail.com' || 
    currentUser?.email === 'admin@digitalfarm.pro' ||
    (currentUser as any)?.role === 'admin';

  const [stores, setStores] = useState<DemoStoreListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auto-detect user's country for instant localized view
  const [detectedCountry] = useState(() => detectUserCountry());
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    const detected = detectUserCountry();
    return detected.code || 'BD';
  });
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deliveryOnlyFilter, setDeliveryOnlyFilter] = useState(false);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);

  // Form Fields
  const [country, setCountry] = useState<string>(() => detectedCountry.code || 'BD');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [district, setDistrict] = useState('গাজীপুর');
  const [upazila, setUpazila] = useState('');
  const [address, setAddress] = useState('');
  const [categories, setCategories] = useState<string[]>(['poultry_feed', 'medicine']);
  const [availableBrands, setAvailableBrands] = useState('');
  const [productsOffered, setProductsOffered] = useState('');
  const [hasHomeDelivery, setHasHomeDelivery] = useState(true);
  const [openHours, setOpenHours] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Permission check
  const canPostStore = hasAccess('storeListingFree') || isMasterAdmin;

  // Load Stores
  useEffect(() => {
    if (isDemoUser) {
      setStores(demoStore.getStoreListings());
      setLoading(false);
      const unsub = demoStore.subscribe(() => {
        setStores(demoStore.getStoreListings());
      });
      return () => unsub();
    }

    // Live Firestore sync
    try {
      const q = query(collection(db, 'store_listings'), orderBy('createdAt', 'desc'), limit(60));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: DemoStoreListing[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as DemoStoreListing);
        });
        setStores(list);
        setLoading(false);
      }, (err) => {
        console.warn('Store listings onSnapshot fallback:', err);
        setStores(demoStore.getStoreListings());
        setLoading(false);
      });
      return () => unsub();
    } catch (err) {
      console.warn('Store fetch err:', err);
      setStores(demoStore.getStoreListings());
      setLoading(false);
    }
  }, [isDemoUser]);

  // Open Form with VIP check
  const handleOpenForm = (storeToEdit?: DemoStoreListing) => {
    if (!storeToEdit && !canPostStore) {
      openSubscriptionModal(
        language === 'bn' ? 'ফিড ও ঔষধ দোকান ডিরেক্টরি' : 'Agri-Vet Store Directory',
        language === 'bn' ? 'আপনার দোকান, ডিলারশিপ বা ফিড-ঔষধ বিক্রির বিজ্ঞাপন পোস্ট করতে সরাসরি অ্যাডমিনের সাথে যোগাযোগ করে সক্রিয় করুন।' : 'To post your shop or veterinary medicine dealership, please contact the admin for subscription.'
      );
      return;
    }

    if (storeToEdit) {
      setEditingStoreId(storeToEdit.id);
      setCountry(storeToEdit.country || 'BD');
      setShopName(storeToEdit.shopName || '');
      setOwnerName(storeToEdit.ownerName || '');
      setPhone(storeToEdit.phone || '');
      setWhatsapp(storeToEdit.whatsapp || '');
      setDistrict(storeToEdit.district || 'গাজীপুর');
      setUpazila(storeToEdit.upazila || '');
      setAddress(storeToEdit.address || '');
      setCategories(storeToEdit.categories || ['poultry_feed', 'medicine']);
      setAvailableBrands(storeToEdit.availableBrands || '');
      setProductsOffered(storeToEdit.productsOffered || '');
      setHasHomeDelivery(storeToEdit.hasHomeDelivery !== false);
      setOpenHours(storeToEdit.openHours || (language === 'bn' ? 'সকাল ৮টা - রাত ৯টা' : '8:00 AM - 9:00 PM'));
      setNotes(storeToEdit.notes || '');
      setImageUrl(storeToEdit.imageUrl || '');
      setIsFeatured(Boolean(storeToEdit.isFeatured));
    } else {
      setEditingStoreId(null);
      setCountry(detectedCountry.code || 'BD');
      setShopName('');
      setOwnerName('');
      setPhone(currentUser?.phoneNumber || '');
      setWhatsapp(currentUser?.phoneNumber || '');
      setDistrict('গাজীপুর');
      setUpazila('');
      setAddress('');
      setCategories(['poultry_feed', 'medicine']);
      setAvailableBrands(language === 'bn' ? 'সিপি, নারিশ, স্কয়ার, এসিআই, রেনেটা' : 'CP, Nourish, Square, ACI, Renata');
      setProductsOffered(language === 'bn' ? 'ব্রয়লার ও সোনালী ফিড, ভিটামিন, কৃমিনাশক, ভ্যাকসিন' : 'Broiler & Sonali feed, vitamins, vaccines, antibiotics');
      setHasHomeDelivery(true);
      setOpenHours(language === 'bn' ? 'সকাল ৮টা - রাত ৯টা' : '8:00 AM - 9:00 PM');
      setNotes('');
      setImageUrl('');
      setIsFeatured(false);
    }
    setIsFormOpen(true);
  };

  const toggleCategory = (catId: string) => {
    setCategories(prev => 
      prev.includes(catId) 
        ? (prev.length > 1 ? prev.filter(c => c !== catId) : prev) 
        : [...prev, catId]
    );
  };

  // Image Upload helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error(language === 'bn' ? 'ছবি সাইজ ২ এমবি এর কম হতে হবে' : 'Image must be less than 2MB');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
      toast.success(language === 'bn' ? 'ছবি যুক্ত হয়েছে' : 'Photo attached');
    };
    reader.readAsDataURL(file);
  };

  // Handle Save
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isSubmitting || submitLock.current) return;

    if (!canPostStore && !editingStoreId) {
      openSubscriptionModal(
        language === 'bn' ? 'ফিড ও ঔষধ দোকান ডিরেক্টরি' : 'Agri-Vet Store Directory',
        language === 'bn' ? 'আপনার দোকান বা ডিলারশিপ লিস্টিং সক্রিয় করতে সরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন।' : 'Please contact admin to activate your store listing.'
      );
      return;
    }

    if (!shopName.trim()) {
      return toast.error(language === 'bn' ? 'দোকানের নাম লিখুন' : 'Please enter shop name');
    }
    if (!phone.trim()) {
      return toast.error(language === 'bn' ? 'মোবাইল নম্বর লিখুন' : 'Please enter contact number');
    }
    if (!address.trim()) {
      return toast.error(language === 'bn' ? 'বাজার বা এলাকার ঠিকানা লিখুন' : 'Please enter address');
    }

    setIsSubmitting(true);
    submitLock.current = true;

    try {
      const storePayload = {
        userId: currentUser.uid,
        country: country || 'BD',
        shopName: shopName.trim(),
        ownerName: ownerName.trim() || shopName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        district: district.trim(),
        upazila: upazila.trim(),
        address: address.trim(),
        categories: categories,
        availableBrands: availableBrands.trim(),
        productsOffered: productsOffered.trim(),
        hasHomeDelivery: hasHomeDelivery,
        openHours: openHours.trim(),
        notes: notes.trim(),
        imageUrl: imageUrl || '',
        isVerified: true,
        isFeatured: isMasterAdmin ? isFeatured : (editingStoreId ? Boolean(stores.find(s => s.id === editingStoreId)?.isFeatured) : false)
      };

      if (isDemoUser) {
        demoStore.saveStoreListing(editingStoreId ? { ...storePayload, id: editingStoreId } : storePayload);
      } else {
        if (editingStoreId) {
          await offlineSafeDocWrite(
            updateDoc(doc(db, 'store_listings', editingStoreId), {
              ...storePayload,
              updatedAt: new Date().toISOString()
            })
          );
        } else {
          await offlineSafeDocWrite(
            addDoc(collection(db, 'store_listings'), {
              ...storePayload,
              createdAt: new Date().toISOString()
            })
          );
        }
      }

      toast.success(
        language === 'bn' 
          ? (editingStoreId ? 'দোকানের তথ্য আপডেট হয়েছে!' : 'নতুন দোকান সফলভাবে তালিকাভুক্ত হয়েছে!') 
          : (editingStoreId ? 'Store details updated!' : 'New store listed successfully!')
      );
      setIsFormOpen(false);
      setEditingStoreId(null);
    } catch (err) {
      console.error('Error saving store:', err);
      toast.error(language === 'bn' ? 'সংরক্ষণ করতে সমস্যা হয়েছে' : 'Failed to save store');
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  // Toggle Featured status (Master Admin only)
  const handleToggleFeatured = async (store: DemoStoreListing) => {
    if (!isMasterAdmin) return;
    const newStatus = !store.isFeatured;
    
    try {
      if (isDemoUser) {
        demoStore.saveStoreListing({ ...store, isFeatured: newStatus });
      } else {
        await offlineSafeDocWrite(
          updateDoc(doc(db, 'store_listings', store.id), {
            isFeatured: newStatus,
            updatedAt: new Date().toISOString()
          })
        );
      }
      setStores(prev => prev.map(s => s.id === store.id ? { ...s, isFeatured: newStatus } : s));
      toast.success(
        newStatus 
          ? (language === 'bn' ? 'দোকানটি ভিআইপি ফিচার্ড করা হয়েছে (উপরে শো করবে)' : 'Store promoted to VIP Top') 
          : (language === 'bn' ? 'ভিআইপি স্ট্যাটাস বাতিল করা হয়েছে' : 'Store demoted to standard')
      );
    } catch (err) {
      console.error('Error toggling featured store:', err);
      toast.error(language === 'bn' ? 'আপডেট করা যায়নি' : 'Failed to update VIP status');
    }
  };

  // Delete Store
  const handleDeleteStore = async (storeId: string) => {
    if (!window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত এই দোকানটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this store listing?')) {
      return;
    }

    try {
      demoStore.deleteStoreListing(storeId);
      if (!isDemoUser) {
        try {
          await deleteDoc(doc(db, 'store_listings', storeId));
        } catch (fErr) {
          console.warn('Firestore doc delete note:', fErr);
        }
      }
      setStores(prev => prev.filter(s => s.id !== storeId));
      toast.success(language === 'bn' ? 'দোকান মুছে ফেলা হয়েছে' : 'Store deleted');
    } catch (err) {
      console.error('Error deleting store:', err);
      toast.error(language === 'bn' ? 'মুছতে সমস্যা হয়েছে' : 'Failed to delete');
    }
  };

  // Share Store via WhatsApp / Web Share
  const handleShareStore = (store: DemoStoreListing) => {
    const locDistrict = getDistrictDisplayName(store.district, language);
    const locCountry = store.country ? getCountryDisplayName(store.country, language) : '';
    const text = `🏪 *${store.shopName}*\n📍 ${language === 'bn' ? 'এলাকা' : 'Location'}: ${store.address}, ${store.upazila ? store.upazila + ', ' : ''}${locDistrict}${locCountry ? ` (${locCountry})` : ''}\n📞 ${language === 'bn' ? 'মোবাইল' : 'Mobile'}: ${store.phone}\n🌾 ${language === 'bn' ? 'ব্র্যান্ডসমূহ' : 'Brands'}: ${store.availableBrands || (language === 'bn' ? 'পোল্ট্রি ও ক্যাটল ফিড' : 'Feed & Medicine')}\n🚚 ${language === 'bn' ? 'হোম ডেলিভারি' : 'Delivery'}: ${store.hasHomeDelivery ? (language === 'bn' ? 'হ্যাঁ, খামারে পৌঁছানো হয়' : 'Yes, Farm delivery available') : (language === 'bn' ? 'দোকান থেকে সংগ্রহ' : 'In-store collection')}\n\n${language === 'bn' ? 'ডিজিটাল খামার প্রো থেকে সংগৃহীত।' : 'Shared from Digital Farm Pro.'}`;
    
    if (navigator.share) {
      navigator.share({
        title: store.shopName,
        text: text,
      }).catch(() => {});
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    }
  };

  // Filtered & Prioritized list: Featured VIP Stores are always at the TOP!
  const filteredStores = stores.filter(store => {
    // Match country
    if (selectedCountry !== 'all') {
      const storeCode = normalizeCountryCode(store.country || 'BD');
      const selectedCode = normalizeCountryCode(selectedCountry);
      if (storeCode !== selectedCode) return false;
    }

    // Match district
    if (selectedDistrict !== 'all') {
      const storeDistBn = getDistrictDisplayName(store.district, 'bn');
      const filterDistBn = getDistrictDisplayName(selectedDistrict, 'bn');
      if (storeDistBn !== filterDistBn && store.district !== selectedDistrict) return false;
    }

    // Match category
    if (selectedCategory !== 'all') {
      if (!store.categories || !store.categories.includes(selectedCategory)) return false;
    }

    // Match delivery
    if (deliveryOnlyFilter && !store.hasHomeDelivery) return false;
    
    // Match search
    const queryStr = searchQuery.toLowerCase().trim();
    if (queryStr) {
      const matchSearch = 
        store.shopName.toLowerCase().includes(queryStr) ||
        (store.ownerName && store.ownerName.toLowerCase().includes(queryStr)) ||
        (store.district && store.district.toLowerCase().includes(queryStr)) ||
        (store.upazila && store.upazila.toLowerCase().includes(queryStr)) ||
        (store.address && store.address.toLowerCase().includes(queryStr)) ||
        (store.availableBrands && store.availableBrands.toLowerCase().includes(queryStr)) ||
        (store.productsOffered && store.productsOffered.toLowerCase().includes(queryStr)) ||
        (store.phone && store.phone.includes(queryStr));
      if (!matchSearch) return false;
    }

    return true;
  }).sort((a, b) => {
    // Top priority to VIP/Featured stores
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  const popularDistricts = language === 'bn'
    ? ['গাজীপুর', 'ময়মনসিংহ', 'ঢাকা', 'বগুড়া', 'কুমিল্লা', 'টাঙ্গাইল', 'যশোর', 'রাজশাহী']
    : ['Gazipur', 'Mymensingh', 'Dhaka', 'Bogura', 'Cumilla', 'Tangail', 'Jashore', 'Rajshahi'];

  const isBDSelected = selectedCountry === 'all' || normalizeCountryCode(selectedCountry) === 'BD';

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-8 animate-in fade-in duration-200">
      
      {/* 1. Header Banner & VIP Notice */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 text-white p-4 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
                <Store size={22} className="text-yellow-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    {language === 'bn' ? 'ফিড ও ঔষধ দোকান ডিরেক্টরি' : 'Agri-Vet Store Directory'}
                  </h2>
                  <span className="bg-yellow-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-teal-100 font-medium">
                  {language === 'bn' ? '৬৪ জেলার পোল্ট্রি-ক্যাটল ফিড ডিলার ও ভেটেরিনারি ঔষধালয়' : 'Find Feed Dealers & Vet Medicine Pharmacies Worldwide'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenForm()}
              className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer transition-all"
            >
              <Plus size={16} />
              <span>{language === 'bn' ? 'দোকান যোগ করুন' : 'List Shop'}</span>
            </button>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/15">
            <div className="bg-white/10 p-2 rounded-xl text-center backdrop-blur-2xs border border-white/10">
              <span className="text-[9px] text-teal-200 block font-bold">{language === 'bn' ? 'মোট ডিলার/দোকান' : 'Total Stores'}</span>
              <span className="text-sm font-black font-sans text-yellow-300">{stores.length}+</span>
            </div>
            <div className="bg-white/10 p-2 rounded-xl text-center backdrop-blur-2xs border border-white/10">
              <span className="text-[9px] text-teal-200 block font-bold">{language === 'bn' ? 'কাভারেজ' : 'Coverage'}</span>
              <span className="text-sm font-black font-sans text-white">{language === 'bn' ? '৬৪ জেলা / বিশ্বব্যাপী' : '64 Districts / Global'}</span>
            </div>
            <div className="bg-white/10 p-2 rounded-xl text-center backdrop-blur-2xs border border-white/10">
              <span className="text-[9px] text-teal-200 block font-bold">{language === 'bn' ? 'হোম ডেলিভারি' : 'Delivery'}</span>
              <span className="text-sm font-black text-emerald-300 flex items-center justify-center gap-1">
                <Truck size={13} /> {language === 'bn' ? 'উপলব্ধ' : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Premium/Subscription Notice Banner if locked */}
      {!canPostStore && (
        <div className="bg-linear-to-r from-amber-500 via-rose-500 to-slate-900 text-white p-3 rounded-2xl shadow-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Lock size={16} className="text-yellow-200" />
            </div>
            <div>
              <p className="text-xs font-black leading-tight">
                {language === 'bn' ? 'দোকানদার ভাইদের জন্য বিশেষ বিজ্ঞাপন সুবিধা' : 'Special Store Listing for Dealers'}
              </p>
              <p className="text-[10px] text-amber-100 font-medium mt-0.5">
                {language === 'bn' ? 'আপনার দোকানটি ৬৪ জেলার হাজারো খামারির কাছে পৌঁছাতে অ্যাডমিনের সাথে যোগাযোগ করুন।' : 'Contact admin to list your shop for thousands of farmers.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openSubscriptionModal(
              language === 'bn' ? 'ফিড ও ঔষধ দোকান ডিরেক্টরি' : 'Store Directory',
              language === 'bn' ? 'আপনার দোকান বা ফিড-ঔষধ ডিলারশিপের বিজ্ঞাপন পোস্ট করতে সরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন।' : 'Please contact admin to activate your store listing.'
            )}
            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl text-[11px] font-black shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1"
          >
            <Sparkles size={13} />
            <span>{language === 'bn' ? 'সক্রিয় করুন' : 'Activate'}</span>
          </button>
        </div>
      )}

      {/* Prominent Fraud & Advance Money Disclaimer Notice */}
      <MarketplaceDisclaimerBanner />

      {/* 3. Search & Country/District Filter Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-xs space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'দোকানের নাম, ব্র্যান্ড (সিপি/নারিশ/স্কয়ার), ঔষধ বা এলাকা দিয়ে খুঁজুন...' : 'Search by store name, brand, medicine or area...'}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-850 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Location Dropdowns: Country & District/City */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
          {/* Country Dropdown */}
          <div className="relative">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
            <select
              value={selectedCountry}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCountry(val);
                if (normalizeCountryCode(val) !== 'BD' && val !== 'all') {
                  setSelectedDistrict('all');
                }
              }}
              className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">🌍 {language === 'bn' ? 'সকল দেশ (All Countries)' : '🌍 All Countries'}</option>
              {COUNTRY_LIST.map((c) => (
                <option key={c.code} value={c.code}>
                  {language === 'bn' ? c.nameBn : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* District Dropdown (For Bangladesh or All) */}
          {isBDSelected ? (
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">{language === 'bn' ? '📍 সকল জেলা (বাংলাদেশ)' : '📍 All Districts (Bangladesh)'}</option>
                {ALL_64_DISTRICTS.map((d) => (
                  <option key={d.nameBn} value={d.nameBn}>
                    {language === 'bn' ? `${d.nameBn} জেলা` : `${d.nameEn} District`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="relative flex items-center">
              <span className="text-xs font-bold text-slate-600 px-3 py-2 bg-slate-100 rounded-xl w-full border border-slate-200">
                🌐 {getCountryDisplayName(selectedCountry, language)}
              </span>
            </div>
          )}
        </div>

        {/* Home Delivery Filter & Quick Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDeliveryOnlyFilter(!deliveryOnlyFilter)}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deliveryOnlyFilter 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Truck size={15} className={deliveryOnlyFilter ? 'text-yellow-300' : 'text-slate-500'} />
            <span>{language === 'bn' ? '🚚 হোম ডেলিভারি দেয় এমন দোকান' : '🚚 Home Delivery Available'}</span>
          </button>
        </div>

        {/* Popular District Quick Chips (if Bangladesh) */}
        {isBDSelected && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[10px] font-black text-slate-400 shrink-0">
              {language === 'bn' ? 'জনপ্রিয় জেলা:' : 'Popular:'}
            </span>
            <button
              type="button"
              onClick={() => setSelectedDistrict('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 transition-all cursor-pointer ${
                selectedDistrict === 'all' 
                  ? 'bg-emerald-700 text-white shadow-2xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language === 'bn' ? 'সব' : 'All'}
            </button>
            {popularDistricts.map((dist) => {
              const distBn = getDistrictDisplayName(dist, 'bn');
              const isSel = selectedDistrict === dist || selectedDistrict === distBn;
              return (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setSelectedDistrict(distBn)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 transition-all cursor-pointer ${
                    isSel 
                      ? 'bg-emerald-700 text-white shadow-2xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dist}
                </button>
              );
            })}
          </div>
        )}

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs border-t border-slate-100 pt-2.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              selectedCategory === 'all' 
                ? 'bg-slate-900 text-white shadow-2xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{language === 'bn' ? 'সব পণ্য' : 'All Categories'}</span>
          </button>
          {CATEGORY_OPTIONS.map((cat) => {
            const Icon = cat.icon;
            const isSel = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                  isSel 
                    ? 'bg-emerald-700 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon size={13} />
                <span>{language === 'bn' ? cat.labelBn.split(' ')[0] : cat.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Store Listing Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Building2 size={15} className="text-emerald-700" />
            <span>{language === 'bn' ? 'তালিকাভুক্ত দোকান ও ফিড ডিলার' : 'Available Stores & Feed Dealers'}</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full font-sans">
              {filteredStores.length}
            </span>
          </h3>
          {(selectedCountry !== 'all' || selectedDistrict !== 'all' || selectedCategory !== 'all' || deliveryOnlyFilter || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCountry('all');
                setSelectedDistrict('all');
                setSelectedCategory('all');
                setDeliveryOnlyFilter(false);
                setSearchQuery('');
              }}
              className="text-[11px] text-rose-600 font-extrabold hover:underline cursor-pointer"
            >
              {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
            </button>
          )}
        </div>

        {/* Admin Clean/Purge Tool if Master Admin */}
        {isMasterAdmin && stores.length > 0 && (
          <div className="bg-rose-50 border border-rose-200/80 p-2.5 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-rose-850 font-black">
              <ShieldAlert size={15} className="text-rose-600 shrink-0" />
              <span>{language === 'bn' ? 'অ্যাডমিন কন্ট্রোল: ডেমো ও অতিরিক্ত লিস্টিং মুছুন' : 'Admin Control: Delete & Purge Listings'}</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(language === 'bn' ? 'আপনি কি সব দোকান লিস্টিং মুছে ফেলতে চান?' : 'Are you sure you want to delete all store listings?')) {
                  return;
                }
                try {
                  for (const s of stores) {
                    demoStore.deleteStoreListing(s.id);
                    if (!isDemoUser) {
                      try {
                        await deleteDoc(doc(db, 'store_listings', s.id));
                      } catch (e) {}
                    }
                  }
                  setStores([]);
                  toast.success(language === 'bn' ? 'সকল দোকান মুছে ফেলা হয়েছে' : 'All stores deleted');
                } catch (err) {
                  toast.error(language === 'bn' ? 'সমস্যা হয়েছে' : 'Failed');
                }
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black cursor-pointer shrink-0 transition-all"
            >
              {language === 'bn' ? 'সব দোকান মুছুন' : 'Delete All'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-400 font-bold border border-slate-100">
            {language === 'bn' ? 'দোকানের তালিকা লোড হচ্ছে...' : 'Loading stores...'}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-100 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <Store size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">
                {language === 'bn' ? 'বর্তমানে কোনো দোকান তালিকাভুক্ত নেই' : 'No stores listed currently'}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {language === 'bn' 
                  ? 'আপনার এলাকার ফিড ডিলার বা ভেটেরিনারি দোকান যুক্ত করতে "দোকান যোগ করুন" বাটনে চাপুন।' 
                  : 'Add the first feed dealer or veterinary pharmacy in your area!'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenForm()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>{language === 'bn' ? 'দোকান যোগ করুন' : 'Add Store'}</span>
            </button>
          </div>
        ) : (
          filteredStores.map((store) => {
            const isOwner = currentUser?.uid === store.userId || isMasterAdmin;
            const displayDist = getDistrictDisplayName(store.district, language);
            const displayCountry = store.country ? getCountryDisplayName(store.country, language) : '';

            return (
              <div 
                key={store.id}
                className={`rounded-2xl p-4 transition-all space-y-3 relative group ${
                  store.isFeatured
                    ? 'bg-gradient-to-b from-amber-50/70 via-white to-white border-2 border-amber-400 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/20'
                    : 'bg-white border border-slate-150 shadow-xs hover:border-emerald-200'
                }`}
              >
                {/* VIP Featured Badge on top edge */}
                {store.isFeatured && (
                  <div className="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs border border-amber-300">
                    <Crown size={12} className="text-slate-950 fill-slate-950" />
                    <span>{language === 'bn' ? 'টপ বিজ্ঞাপন (ভিআইপি ডিলার)' : 'Featured Dealer Ad'}</span>
                  </div>
                )}

                {/* Top Row: Shop Name & Verified Badge */}
                <div className="flex items-start justify-between gap-2 pt-1">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-2xs font-black ${
                      store.isFeatured
                        ? 'bg-gradient-to-br from-amber-500 to-teal-800'
                        : 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    }`}>
                      <Store size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900 leading-snug">
                          {store.shopName}
                        </h4>
                        {store.isVerified !== false && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            <span>{language === 'bn' ? 'ভেরিফাইড' : 'Verified'}</span>
                          </span>
                        )}
                        {store.isFeatured && (
                          <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.2 rounded-full uppercase flex items-center gap-0.5 shadow-2xs">
                            <Crown size={10} className="fill-slate-950" />
                            <span>TOP VIP</span>
                          </span>
                        )}
                        {store.country && normalizeCountryCode(store.country) !== 'BD' && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Globe size={10} />
                            <span>{displayCountry}</span>
                          </span>
                        )}
                      </div>

                      {store.ownerName && (
                        <p className="text-[11px] text-slate-500 font-bold mt-0.5 truncate">
                          👤 {store.ownerName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for owner / admin */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isMasterAdmin && (
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(store)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer border flex items-center gap-1 text-[10px] font-black ${
                          store.isFeatured 
                            ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs' 
                            : 'bg-slate-100 hover:bg-amber-100 text-slate-700 border-slate-200'
                        }`}
                        title={language === 'bn' ? (store.isFeatured ? 'ভিআইপি টপ থেকে সরান' : 'ভিআইপি টপ লিস্টে তুলুন') : (store.isFeatured ? 'Remove VIP Top' : 'Promote to VIP Top')}
                      >
                        <Crown size={13} className={store.isFeatured ? 'text-slate-950 fill-slate-950' : 'text-amber-600'} />
                        <span className="hidden sm:inline">{store.isFeatured ? 'VIP Top' : 'Set VIP'}</span>
                      </button>
                    )}

                    {isOwner && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenForm(store)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                          title={language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStore(store.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer text-[10.5px] font-black"
                          title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                        >
                          <Trash2 size={13} />
                          <span>{language === 'bn' ? 'মুছুন' : 'Delete'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Location & Delivery Badge */}
                <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 min-w-0 font-bold">
                    <MapPin size={14} className="text-rose-500 shrink-0" />
                    <span className="truncate">
                      {store.address}, {store.upazila ? `${store.upazila}, ` : ''}{displayDist}{store.country && normalizeCountryCode(store.country) !== 'BD' ? `, ${displayCountry}` : ''}
                    </span>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 ${
                    store.hasHomeDelivery 
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    <Truck size={12} />
                    <span>{store.hasHomeDelivery ? (language === 'bn' ? 'হোম ডেলিভারি দেয়' : 'Home Delivery') : (language === 'bn' ? 'দোকানে সংগ্রহ' : 'In-store')}</span>
                  </span>
                </div>

                {/* Category Badges */}
                {store.categories && store.categories.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {store.categories.map((catId) => {
                      const matched = CATEGORY_OPTIONS.find(c => c.id === catId);
                      if (!matched) return null;
                      const Icon = matched.icon;
                      return (
                        <span 
                          key={catId} 
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${matched.color}`}
                        >
                          <Icon size={11} />
                          <span>{language === 'bn' ? matched.labelBn.split(' ')[0] : matched.labelEn}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Available Brands & Products */}
                {(store.availableBrands || store.productsOffered) && (
                  <div className="text-xs space-y-1 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                    {store.availableBrands && (
                      <p className="text-slate-800 font-bold">
                        <span className="text-amber-850 font-black">🏷️ {language === 'bn' ? 'ব্র্যান্ডসমূহ:' : 'Brands:'}</span> {store.availableBrands}
                      </p>
                    )}
                    {store.productsOffered && (
                      <p className="text-slate-600 font-medium text-[11px]">
                        <span className="font-bold text-slate-800">📦 {language === 'bn' ? 'পণ্যসমূহ:' : 'Products:'}</span> {store.productsOffered}
                      </p>
                    )}
                  </div>
                )}

                {/* Extra Notes / Offers */}
                {store.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                    💡 {store.notes}
                  </p>
                )}

                {/* Open Hours */}
                {store.openHours && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Clock size={12} />
                    <span>{language === 'bn' ? `খোলা থাকার সময়: ${store.openHours}` : `Hours: ${store.openHours}`}</span>
                  </div>
                )}

                {/* Action Buttons: Direct Call & WhatsApp & Share */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  <a
                    href={`tel:${store.phone}`}
                    className="col-span-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all text-center cursor-pointer"
                  >
                    <Phone size={14} />
                    <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
                  </a>

                  <a
                    href={`https://wa.me/${(store.whatsapp || store.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(language === 'bn' ? `আসসালামু আলাইকুম, আমি ডিজিটাল খামার প্রো অ্যাপ থেকে আপনার "${store.shopName}" দোকানের বিজ্ঞাপন দেখে যোগাযোগ করছি।` : `Hello, I am contacting you regarding your store "${store.shopName}" listed on Digital Farm Pro.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="col-span-1 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all text-center cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>{language === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleShareStore(store)}
                    className="col-span-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-750 py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer border border-slate-200"
                  >
                    <Share2 size={14} />
                    <span>{language === 'bn' ? 'শেয়ার' : 'Share'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Safe Transaction & Disclaimer Card */}
      <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl space-y-1.5">
        <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
          <Info size={15} className="text-amber-700 shrink-0" />
          <span>{language === 'bn' ? 'খামারি ও দোকানদারদের সতর্কতা' : 'Farmer & Shopkeeper Notice'}</span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-amber-950/90 leading-relaxed font-medium">
          {language === 'bn' 
            ? 'ডিজিটাল খামার প্রো শুধুমাত্র সরাসরি যোগাযোগের মাধ্যম। ফিড ও ঔষধ ক্রয়ের সময় পণ্যের মেয়াদ, গুণগত মান এবং মূল্য সরাসরি দোকানদারের সাথে যাচাই করে লেনদেন করুন।'
            : 'Digital Farm Pro only facilitates direct connections. Please verify product expiry, brand authenticity, and prices directly before finalizing transactions.'}
        </p>
      </div>

      {/* 6. Post/Edit Store Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Store size={20} className="text-yellow-300" />
                <div>
                  <h3 className="text-sm sm:text-base font-black">
                    {editingStoreId 
                      ? (language === 'bn' ? 'দোকানের তথ্য সম্পাদনা করুন' : 'Edit Store Details')
                      : (language === 'bn' ? 'নতুন দোকান বা ডিলারশিপ যোগ করুন' : 'List New Agri-Vet Store')}
                  </h3>
                  <p className="text-[10px] text-emerald-100">
                    {language === 'bn' ? 'আপনার দোকানটি হাজারো খামারির কাছে প্রদর্শন করুন' : 'Showcase your store to thousands of farmers'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveStore} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
              
              {/* Country Selection */}
              <div>
                <label className="block font-black text-slate-800 mb-1">
                  {language === 'bn' ? 'দেশ নির্বাচন করুন *' : 'Select Country *'}
                </label>
                <select
                  value={country}
                  onChange={(e) => {
                    const c = e.target.value;
                    setCountry(c);
                    if (normalizeCountryCode(c) !== 'BD') {
                      setDistrict('');
                    } else {
                      setDistrict('গাজীপুর');
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {COUNTRY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {language === 'bn' ? c.nameBn : c.nameEn} ({c.dialCode || ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Shop Name & Owner Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    {language === 'bn' ? 'দোকান / ডিলারশিপের নাম *' : 'Shop / Dealership Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: বিসমিল্লাহ এগ্রো ও ফিড সেন্টার' : 'e.g. Bismillah Feed Center'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    {language === 'bn' ? 'মালিক / যোগাযোগের ব্যক্তি *' : 'Owner / Contact Person *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: মো. রফিকুল ইসলাম' : 'e.g. Md. Rafiqul Islam'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    {language === 'bn' ? 'মোবাইল নম্বর (সরাসরি কল) *' : 'Mobile Phone (Direct Call) *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={language === 'bn' ? 'মোবাইল নম্বর লিখুন' : 'e.g. 017xxxxxxxx'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    {language === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)' : 'WhatsApp Number (Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder={language === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর লিখুন' : 'e.g. +88017xxxxxxxx'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* District & Upazila */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    {normalizeCountryCode(country) === 'BD' 
                      ? (language === 'bn' ? 'জেলা *' : 'District *')
                      : (language === 'bn' ? 'রাজ্য / প্রদেশ / শহর *' : 'State / Province / City *')}
                  </label>
                  {normalizeCountryCode(country) === 'BD' ? (
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {ALL_64_DISTRICTS.map((d) => (
                        <option key={d.nameBn} value={d.nameBn}>
                          {language === 'bn' ? d.nameBn : d.nameEn}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder={language === 'bn' ? 'যেমন: কলকাতা, পশ্চিমবঙ্গ / রিয়াদ' : 'e.g. Kolkata, West Bengal / Riyadh / Texas'}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    {language === 'bn' ? 'উপজেলা / এলাকা / পোস্টাল' : 'Upazila / Area / Postal'}
                  </label>
                  <input
                    type="text"
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: জয়দেবপুর / ভালুকা' : 'e.g. Downtown / Suburb'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block font-black text-slate-800 mb-1">
                  {language === 'bn' ? 'দোকানের সুনির্দিষ্ট ঠিকানা ও বাজার *' : 'Full Market Address & Landmark *'}
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: চৌরাস্তা বাজার মেইন রোড, জামে মসজিদ সংলগ্ন' : 'e.g. Chowrasta Bazar Main Road, Near Market'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Multi-select Categories */}
              <div>
                <label className="block font-black text-slate-800 mb-1.5">
                  {language === 'bn' ? 'কী কী পণ্য পাওয়া যায়? (একাধিক নির্বাচন করুন)' : 'Product Categories (Select all that apply)'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isChecked = categories.includes(cat.id);
                    const Icon = cat.icon;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <CheckCircle2 size={12} />}
                        </div>
                        <Icon size={14} className={isChecked ? 'text-emerald-700' : 'text-slate-400'} />
                        <span className="text-[11px] truncate">{language === 'bn' ? cat.labelBn : cat.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Brands & Stock Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    {language === 'bn' ? 'ব্র্যান্ডসমূহ' : 'Available Brands'}
                  </label>
                  <input
                    type="text"
                    value={availableBrands}
                    onChange={(e) => setAvailableBrands(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: সিপি, নারিশ, আফতাব, স্কয়ার, রেনেটা' : 'e.g. CP, Nourish, Square, Renata'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">
                    {language === 'bn' ? 'খোলা থাকার সময়' : 'Business Hours'}
                  </label>
                  <input
                    type="text"
                    value={openHours}
                    onChange={(e) => setOpenHours(e.target.value)}
                    placeholder={language === 'bn' ? 'সকাল ৮টা - রাত ৯টা (প্রতিদিন)' : '8:00 AM - 9:00 PM (Daily)'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Products Offered Details */}
              <div>
                <label className="block font-black text-slate-800 mb-1">
                  {language === 'bn' ? 'বিশেষ পণ্য বা ঔষধের তালিকা' : 'Featured Products List'}
                </label>
                <input
                  type="text"
                  value={productsOffered}
                  onChange={(e) => setProductsOffered(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: ব্রয়লার স্টার্টার/গ্রোয়ার, গাভীর দানাদার ফিড, ক্যালসিয়াম, ভিটামিন' : 'e.g. Broiler starter, dairy feed, calcium, antibiotics'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Home Delivery Checkbox */}
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck size={18} className="text-emerald-700" />
                  <div>
                    <p className="font-black text-emerald-950 text-xs">
                      {language === 'bn' ? 'খামারে হোম ডেলিভারি সুবিধা আছে?' : 'Do you offer Home Delivery?'}
                    </p>
                    <p className="text-[10px] text-emerald-800">
                      {language === 'bn' ? 'অর্ডার অনুযায়ী সরাসরি খামারে ফিড বা ঔষধ পাঠানো হয়' : 'Deliver feed/medicine directly to nearby farms'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={hasHomeDelivery}
                  onChange={(e) => setHasHomeDelivery(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Extra Notes / Offers */}
              <div>
                <label className="block font-black text-slate-800 mb-1">
                  {language === 'bn' ? 'খামারিদের জন্য বিশেষ অফার বা বার্তা (ঐচ্ছিক)' : 'Special Offer / Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: নগদ ক্রয়ে আকর্ষণীয় ছাড়, পাইকারি মূল্যে বিক্রয় ও অভিজ্ঞ পরামর্শ।' : 'e.g. Special discounts on bulk feed orders.'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Master Admin VIP Featured Toggle */}
              {isMasterAdmin && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown size={18} className="text-amber-700" />
                    <div>
                      <p className="font-black text-amber-950 text-xs">
                        {language === 'bn' ? 'টপ ভিআইপি বিজ্ঞাপন হিসেবে পিন করবেন?' : 'Pin as Top VIP Featured Ad?'}
                      </p>
                      <p className="text-[10px] text-amber-800 font-medium">
                        {language === 'bn' ? 'এই দোকানটি তালিকার সবার উপরে গোল্ডেন বর্ডারে প্রদর্শিত হবে' : 'This store will be pinned at the very top with VIP badge'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'দোকান প্রকাশ করুন' : 'Publish Store')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
