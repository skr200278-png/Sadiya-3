import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  setDoc,
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Sparkles, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  Tag, 
  Zap, 
  Crown, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  ExternalLink,
  HelpCircle,
  Building2,
  MessageCircle,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { openWhatsAppSafe } from '../utils/whatsappHelper';

export interface SponsorPartner {
  id: string;
  name: string;
  nameEn: string;
  category: 'feed' | 'medicine' | 'all';
  tagline: string;
  taglineEn: string;
  badge: string;
  badgeEn: string;
  hotline: string;
  whatsapp?: string;
  benefits: string[];
  benefitsEn: string[];
  popularProducts: string[];
  popularProductsEn: string[];
  accentColor: string;
  isCustom?: boolean;
  createdAt?: string;
  createdBy?: string;
}

export const INITIAL_FEED_SPONSORS: SponsorPartner[] = [
  {
    id: 'nourish',
    name: 'নারিশ পোল্ট্রি এন্ড ফিড (Nourish)',
    nameEn: 'Nourish Poultry & Feeds',
    category: 'feed',
    tagline: 'সর্বোচ্চ এফসিআর (FCR) ও দ্রুত সুষম শারীরিক বৃদ্ধির নিশ্চয়তা',
    taglineEn: 'Guaranteed best FCR and rapid balanced flock growth',
    badge: '🏆 গোল্ড স্পনসর',
    badgeEn: '🏆 Gold Sponsor',
    hotline: '09613112233',
    whatsapp: '8801713045450',
    benefits: [
      'উন্নত ডাইজেস্টেবল প্রোটিন ও কম ফাঙ্গাস ঝুঁকি',
      'প্রতি ব্যাগে সর্বোচ্চ গড় ওজন বৃদ্ধির ফর্মুলেশন',
      'ডিলার পয়েন্টে বিশেষ ক্যাশব্যাক ও লট ছাড়'
    ],
    benefitsEn: [
      'High digestibility protein with minimal mycotoxin risk',
      'Optimal FCR formulation for faster harvest weight',
      'Dealer discount and priority delivery'
    ],
    popularProducts: ['নারিশ ব্রয়লার স্টার্টার', 'নারিশ ব্রয়লার গ্রোয়ার', 'নারিশ সোনালী স্পেশাল'],
    popularProductsEn: ['Nourish Broiler Starter', 'Nourish Broiler Grower', 'Nourish Sonali Special'],
    accentColor: 'from-amber-500 to-orange-600'
  },
  {
    id: 'cp',
    name: 'সিপি বাংলাদেশ লিমিটেড (CP Bangladesh)',
    nameEn: 'CP Bangladesh Co. Ltd.',
    category: 'feed',
    tagline: 'আন্তর্জাতিক মানের আধুনিক পুষ্টি ফর্মুলা ও বায়োসিকিউরিটি',
    taglineEn: 'International standard animal nutrition and biosecurity',
    badge: '⭐ অফিশিয়াল পার্টনার',
    badgeEn: '⭐ Official Partner',
    hotline: '01713045450',
    whatsapp: '8801713045450',
    benefits: [
      'স্বয়ংক্রিয় কারখানায় জীবাণুমুক্ত বাষ্পায়িত পিলেট ফিড',
      'মুরগির হজমশক্তি বৃদ্ধি ও ড্রপিং শক্ত রাখার বিশেষ পুষ্টি',
      'খামার পরিদর্শনে অভিজ্ঞ ভেটেরিনারি ডাক্তারের ফ্রি ভিজিট'
    ],
    benefitsEn: [
      'Automated steam-pelleted hygienic feed',
      'Enhanced gut health and firm litter management',
      'Free field vet inspection on bulk booking'
    ],
    popularProducts: ['সিপি ব্রয়লার সুপার স্টার', 'সিপি সোনালী ফিড', 'সিপি লেয়ার লে ৫০২'],
    popularProductsEn: ['CP Broiler Super Star', 'CP Sonali Pellet', 'CP Layer Lay 502'],
    accentColor: 'from-red-600 to-orange-500'
  },
  {
    id: 'aftab',
    name: 'আফতাব বহুমুখী ফার্মস (Aftab Feed)',
    nameEn: 'Aftab Bohumukhi Farms',
    category: 'feed',
    tagline: 'ঐতিহ্যবাহী বিশ্বস্ত খাদ্য — সুস্থ মুরগি ও বাড়তি লাভ',
    taglineEn: 'Trusted poultry nutrition for higher farmer profit',
    badge: '✨ প্রিমিয়াম স্পনসর',
    badgeEn: '✨ Premium Sponsor',
    hotline: '01730037100',
    whatsapp: '8801730037100',
    benefits: [
      'প্রাকৃতিক এসেনশিয়াল অয়েল সমৃদ্ধ রোগপ্রতিরোধক ফিড',
      'কম মড়ক ও সমানভাবে ঝাঁক বৃদ্ধির কার্যকর সমাধান'
    ],
    benefitsEn: [
      'Essential oil enriched immunity-boosting feed',
      'Uniform flock weight and minimized mortality'
    ],
    popularProducts: ['আফতাব স্টার্টার-১', 'আফতাব ফিনিশার-৩', 'আফতাব দেশি ফিড'],
    popularProductsEn: ['Aftab Starter-1', 'Aftab Finisher-3', 'Aftab Deshi Feed'],
    accentColor: 'from-emerald-600 to-teal-700'
  }
];

export const INITIAL_MEDICINE_SPONSORS: SponsorPartner[] = [
  {
    id: 'renata',
    name: 'রেনেটা এনিমেল হেলথ (Renata Limited)',
    nameEn: 'Renata Animal Health',
    category: 'medicine',
    tagline: 'সেরা মানের অ্যান্টিবায়োটিক, প্রিবায়োটিক ও জীবনরক্ষাকারী ভ্যাকসিন',
    taglineEn: 'Premium grade vaccines, vitamins, and veterinary therapeutics',
    badge: '🏆 গোল্ড স্পনসর',
    badgeEn: '🏆 Gold Sponsor',
    hotline: '01711894455',
    whatsapp: '8801711894455',
    benefits: [
      'আমদানি করা ইউরোপীয় কাঁচামালে প্রস্তুত শতভাগ নির্ভরযোগ্য ওষুধ',
      'রানিক্ষেত ও গামবোরোর হাই-টাইটার ক্লোন ভ্যাকসিন সুরক্ষা',
      '২৪/৭ রেজিস্টার্ড ভেট ডাক্তারদের ফ্রি টেলিমেডিসিন সহায়তা'
    ],
    benefitsEn: [
      'European active pharmaceutical ingredients (API)',
      'High-titer cloned ND & IBD vaccines',
      '24/7 free veterinary doctor consultation hotline'
    ],
    popularProducts: ['রেনামাইসিন (Renamycin)', 'ইলেকট্রোভিট (Electrovit-C)', 'রেনাসিভ (Renasive Pro)'],
    popularProductsEn: ['Renamycin Powder', 'Electrovit-C', 'Renasive Probiotic'],
    accentColor: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'square',
    name: 'স্কয়ার এগ্রোভেট (Square Pharmaceuticals)',
    nameEn: 'Square Agrovet Division',
    category: 'medicine',
    tagline: 'খামারির আস্থার প্রতীক — নির্ভুল ড্রাগ ফর্মুলেশন',
    taglineEn: 'The symbol of farmer trust & pharmaceutical accuracy',
    badge: '⭐ অফিশিয়াল পার্টনার',
    badgeEn: '⭐ Official Partner',
    hotline: '01713038330',
    whatsapp: '8801713038330',
    benefits: [
      'সিআরডি ও কক্সিডিওসিস নিয়ন্ত্রণে দ্রুত কার্যকর অ্যান্টিমাইক্রোবিয়াল',
      'গ্রীষ্মকালীন হিটস্ট্রোক প্রতিরোধক স্ট্রেস-রিলিফ ফর্মুলা',
      'ঔষধের সঠিক প্রয়োগমাত্রা নির্দেশিকা বুকলেট'
    ],
    benefitsEn: [
      'Fast-acting CRD & Coccidiosis treatments',
      'Anti-heatstress and electrolyte recovery solutions',
      'Standardized dosage protocols provided'
    ],
    popularProducts: ['সিপ্রোফ্লক্স ভেট (Ciproflox)', 'ক্যালপ্লেক্স (Calplex)', 'ভাইরাল-কিল স্প্রে'],
    popularProductsEn: ['Ciproflox Vet', 'Calplex D3', 'Viral-Kill Disinfectant'],
    accentColor: 'from-teal-600 to-cyan-700'
  },
  {
    id: 'acme',
    name: 'একমি এগ্রোভেট (ACME Animal Health)',
    nameEn: 'ACME Agrovet Division',
    category: 'medicine',
    tagline: 'স্বল্প খরচে সর্বোচ্চ সুরক্ষা ও ভিটামিন সাপ্লিমেন্ট',
    taglineEn: 'Affordable and reliable animal health solutions',
    badge: '✨ প্রিমিয়াম পার্টনার',
    badgeEn: '✨ Premium Partner',
    hotline: '01711425890',
    whatsapp: '8801711425890',
    benefits: [
      'দ্রুত ওজন বৃদ্ধি ও লিভার টনিক ফর্মুলেশন',
      'মুরগির অন্ত্রের কৃমি ও ব্যাকটেরিয়াল সংক্রমণ নিয়ন্ত্রণ'
    ],
    benefitsEn: [
      'High efficacy liver tonics & amino acid supplements',
      'Broad spectrum deworming & gut protection'
    ],
    popularProducts: ['একমি এডি৩ই (AD3E)', 'লিভেক্স লিভার টনিক', 'টক্সিন-বাইন্ডার'],
    popularProductsEn: ['ACME AD3E Plus', 'Livex Liver Tonic', 'Tox-Nil Binder'],
    accentColor: 'from-indigo-600 to-purple-700'
  }
];

// Backwards compatibility exports
export const FEED_SPONSORS = INITIAL_FEED_SPONSORS;
export const MEDICINE_SPONSORS = INITIAL_MEDICINE_SPONSORS;

interface SponsorBannerProps {
  type: 'feed' | 'medicine' | 'all';
  onSelectProduct?: (productName: string, companyName: string) => void;
  compact?: boolean;
}

export default function SponsorCard({ type, onSelectProduct, compact = false }: SponsorBannerProps) {
  const { language } = useLanguage();
  const { currentUser, isDemoUser } = useAuth();
  const { isAdmin: sysAdmin, config } = useSystemConfig();
  const isAdmin = Boolean(sysAdmin) || 
    currentUser?.email === 'skabusufian452@gmail.com' || 
    currentUser?.email === 'sr0632890@gmail.com' || 
    currentUser?.email === config?.adminEmail;

  const [dbSponsors, setDbSponsors] = useState<SponsorPartner[]>([]);
  const [deletedSponsorIds, setDeletedSponsorIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('deleted_sponsor_ids') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedCategory, setSelectedCategory] = useState<'feed' | 'medicine' | 'all'>(type);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<SponsorPartner | null>(null);

  // Form State for Admin Adding Sponsors
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'feed' | 'medicine' | 'all'>(type === 'all' ? 'feed' : type);
  const [formTagline, setFormTagline] = useState('');
  const [formBadge, setFormBadge] = useState('⭐ অফিশিয়াল স্পনসর');
  const [formHotline, setFormHotline] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formBenefits, setFormBenefits] = useState('');
  const [formProducts, setFormProducts] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to check if a sponsor is marked deleted
  const isSponsorDeleted = (s: SponsorPartner, deletedList: string[]) => {
    return deletedList.includes(s.id) || deletedList.includes(s.name);
  };

  // Load Sponsors from Firestore and LocalStorage
  useEffect(() => {
    // 1. Local storage deleted blacklist
    let savedDeleted: string[] = [];
    try {
      savedDeleted = JSON.parse(localStorage.getItem('deleted_sponsor_ids') || '[]');
      setDeletedSponsorIds(savedDeleted);
    } catch (e) {
      console.warn("Parse deleted sponsors error", e);
    }

    // 2. Local storage custom sponsors
    const savedLocal = localStorage.getItem('custom_sponsors');
    let localList: SponsorPartner[] = [];
    if (savedLocal) {
      try {
        localList = JSON.parse(savedLocal);
      } catch (e) {
        console.error("Local sponsor parse error", e);
      }
    }

    const defaultInitial = [...INITIAL_FEED_SPONSORS, ...INITIAL_MEDICINE_SPONSORS]
      .filter(d => !savedDeleted.includes(d.id) && !savedDeleted.includes(d.name));

    // Combine defaults and local
    const mergedInitial = [
      ...defaultInitial,
      ...localList.filter(l => !savedDeleted.includes(l.id) && !savedDeleted.includes(l.name) && !defaultInitial.some(d => d.id === l.id))
    ];
    setDbSponsors(mergedInitial);

    // 3. Real-time Firestore sync
    if (db) {
      try {
        const sponsorsRef = collection(db, 'sponsors');
        const unsub = onSnapshot(sponsorsRef, (snapshot) => {
          if (!snapshot.empty) {
            // Check for persistent blacklist metadata doc
            const metaDoc = snapshot.docs.find(d => d.id === '_meta_deleted');
            let currentDeleted = savedDeleted;
            if (metaDoc && metaDoc.data()?.deletedIds) {
              const remoteDeleted = metaDoc.data().deletedIds as string[];
              currentDeleted = Array.from(new Set([...savedDeleted, ...remoteDeleted]));
              setDeletedSponsorIds(currentDeleted);
              localStorage.setItem('deleted_sponsor_ids', JSON.stringify(currentDeleted));
            }

            const firestoreSponsors: SponsorPartner[] = snapshot.docs
              .filter(doc => doc.id !== '_meta_deleted')
              .map(doc => ({
                ...doc.data(),
                id: doc.id
              } as SponsorPartner))
              .filter(s => !currentDeleted.includes(s.id) && !currentDeleted.includes(s.name));

            const defaultFiltered = [...INITIAL_FEED_SPONSORS, ...INITIAL_MEDICINE_SPONSORS]
              .filter(d => !currentDeleted.includes(d.id) && !currentDeleted.includes(d.name) && !firestoreSponsors.some(fs => fs.id === d.id || fs.name === d.name));

            const combined = [
              ...defaultFiltered,
              ...firestoreSponsors
            ];
            setDbSponsors(combined);
          }
        }, (err) => {
          console.warn("Firestore sponsors onSnapshot notice:", err.message);
        });
        return () => unsub();
      } catch (e) {
        console.warn("Sponsors listener fallback:", e);
      }
    }
  }, []);

  // Filter sponsors by selected category and deletion state
  const filteredSponsors = dbSponsors.filter(s => {
    if (deletedSponsorIds.includes(s.id) || deletedSponsorIds.includes(s.name)) return false;
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory || s.category === 'all';
  });

  const activeSponsor = filteredSponsors.length > 0 
    ? (filteredSponsors[activeIdx] || filteredSponsors[0]) 
    : null;

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error(language === 'bn' ? 'শুধুমাত্র অ্যাডমিন স্পনসর যুক্ত করতে পারবেন' : 'Only admin can add sponsors');
      return;
    }
    if (!formName.trim() || !formHotline.trim()) {
      toast.error(language === 'bn' ? 'দয়া করে কোম্পানির নাম ও হটলাইন নম্বর দিন' : 'Please provide Company Name and Hotline');
      return;
    }

    setIsSaving(true);
    const sponsorId = 'sp_' + Date.now();
    const newSponsor: SponsorPartner = {
      id: sponsorId,
      name: formName.trim(),
      nameEn: formName.trim(),
      category: formCategory,
      tagline: formTagline.trim() || (language === 'bn' ? 'উন্নত গুণগত মানের খাদ্য ও পশু স্বাস্থ্য সমাধান' : 'High quality feed and animal health solution'),
      taglineEn: formTagline.trim() || 'High quality feed and animal health solution',
      badge: formBadge.trim() || '⭐ ভেরিফাইড পার্টনার',
      badgeEn: '⭐ Verified Partner',
      hotline: formHotline.trim(),
      whatsapp: formWhatsapp.trim() || formHotline.trim(),
      benefits: formBenefits ? formBenefits.split(',').map(b => b.trim()).filter(Boolean) : [
        language === 'bn' ? 'সর্বোচ্চ পুষ্টিগুণ ও নির্ভরযোগ্য কার্যকারিতা' : 'High performance feed formula',
        language === 'bn' ? 'দ্রুত ডেলিভারি ও ভেটেরিনারি ব্যাকআপ সাপোর্ট' : 'Fast delivery and veterinary consultation'
      ],
      benefitsEn: [
        'Certified premium standard input',
        'Direct factory supply & discount'
      ],
      popularProducts: formProducts ? formProducts.split(',').map(p => p.trim()).filter(Boolean) : [
        language === 'bn' ? 'প্রিমিয়াম ফিড/মেডিসিন' : 'Premium Standard Formulation'
      ],
      popularProductsEn: ['Premium Formulation'],
      accentColor: formCategory === 'feed' ? 'from-amber-500 to-orange-600' : 'from-blue-600 to-indigo-700',
      isCustom: true,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.email || 'admin'
    };

    try {
      // 1. Save in Firestore if available with deterministic ID
      if (db && !isDemoUser) {
        try {
          await setDoc(doc(db, 'sponsors', sponsorId), newSponsor);
        } catch (fErr) {
          console.warn("Firestore write error for sponsor, using local fallback", fErr);
        }
      }

      // 2. Save in LocalStorage
      const local = JSON.parse(localStorage.getItem('custom_sponsors') || '[]');
      local.push(newSponsor);
      localStorage.setItem('custom_sponsors', JSON.stringify(local));

      // 3. Remove from deleted IDs if previously marked deleted
      const updatedDeleted = deletedSponsorIds.filter(id => id !== sponsorId && id !== newSponsor.name);
      setDeletedSponsorIds(updatedDeleted);
      localStorage.setItem('deleted_sponsor_ids', JSON.stringify(updatedDeleted));

      setDbSponsors(prev => [...prev, newSponsor]);
      setActiveIdx(filteredSponsors.length); // focus on newly added sponsor
      toast.success(language === 'bn' ? '✅ নতুন স্পনসর কোম্পানি যুক্ত হয়েছে!' : 'Sponsor company added!');
      setShowAddModal(false);
      // Reset form
      setFormName('');
      setFormTagline('');
      setFormHotline('');
      setFormWhatsapp('');
      setFormBenefits('');
      setFormProducts('');
    } catch (err) {
      toast.error(language === 'bn' ? 'সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to save sponsor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSponsor = async (sponsor: SponsorPartner) => {
    if (!isAdmin) {
      toast.error(language === 'bn' ? 'শুধুমাত্র অ্যাডমিন স্পনসর ডিলিট করতে পারবেন' : 'Only admin can delete sponsors');
      return;
    }
    try {
      const idToDelete = sponsor.id;
      const nameToDelete = sponsor.name;

      // 1. Delete document from Firestore if it exists
      if (db && !isDemoUser && idToDelete) {
        try {
          await deleteDoc(doc(db, 'sponsors', idToDelete));
        } catch (e) {
          console.warn("Firestore delete sponsor err", e);
        }
      }

      // 2. Persistently blacklist this sponsor ID and name across reloads and syncs
      const updatedDeleted = Array.from(new Set([...deletedSponsorIds, idToDelete, nameToDelete]));
      setDeletedSponsorIds(updatedDeleted);
      localStorage.setItem('deleted_sponsor_ids', JSON.stringify(updatedDeleted));

      // 3. Persist deleted blacklist in Firestore metadata
      if (db && !isDemoUser) {
        try {
          await setDoc(doc(db, 'sponsors', '_meta_deleted'), {
            deletedIds: updatedDeleted,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn("Firestore save deleted IDs notice", e);
        }
      }

      // 4. Remove from LocalStorage custom list
      const local = JSON.parse(localStorage.getItem('custom_sponsors') || '[]');
      const updatedLocal = local.filter((l: any) => l.id !== idToDelete && l.name !== nameToDelete);
      localStorage.setItem('custom_sponsors', JSON.stringify(updatedLocal));

      // 5. Update component state immediately
      setDbSponsors(prev => prev.filter(s => s.id !== idToDelete && s.name !== nameToDelete));
      setActiveIdx(0);
      setSponsorToDelete(null);
      toast.success(language === 'bn' ? `🗑️ "${nameToDelete}" সফলভাবে মুছে ফেলা হয়েছে` : `Sponsor "${nameToDelete}" deleted`);
    } catch (err) {
      console.error("Delete sponsor error:", err);
      toast.error(language === 'bn' ? 'মুছে ফেলতে ব্যর্থ হয়েছে' : 'Failed to delete');
    }
  };

  // Admin Restore Default Sponsors
  const handleRestoreDefaults = async () => {
    if (!isAdmin) return;
    try {
      localStorage.removeItem('deleted_sponsor_ids');
      setDeletedSponsorIds([]);

      if (db && !isDemoUser) {
        try {
          await setDoc(doc(db, 'sponsors', '_meta_deleted'), {
            deletedIds: [],
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn("Restore defaults firestore err:", e);
        }
      }

      const defaultInitial = [...INITIAL_FEED_SPONSORS, ...INITIAL_MEDICINE_SPONSORS];
      setDbSponsors(defaultInitial);
      setActiveIdx(0);
      toast.success(language === 'bn' ? '✅ ডিফল্ট স্পনসরগুলো ফিরিয়ে আনা হয়েছে' : 'Default sponsors restored');
    } catch (err) {
      toast.error(language === 'bn' ? 'রিস্টোর করতে সমস্যা হয়েছে' : 'Failed to restore defaults');
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-4 sm:p-5 shadow-xl border-2 border-amber-500/30 relative overflow-hidden space-y-4">
      {/* Background Decorative Ambient Lights */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* 🌟 1. FULL-WIDTH HEADER (Clean & Un-squished) */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/25 shrink-0">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                {type === 'feed' 
                  ? (language === 'bn' ? '🌟 অফিশিয়াল ফিড ও খাদ্য পার্টনার্স' : '🌟 Official Feed Partners')
                  : type === 'medicine'
                  ? (language === 'bn' ? '🛡️ অফিশিয়াল ভেটেরিনারি ও মেডিসিন পার্টনার্স' : '🛡️ Official Veterinary Partners')
                  : (language === 'bn' ? '✨ অফিশিয়াল স্পনসর ও পার্টনার্স' : '✨ Official Sponsors & Partners')}
              </h3>
              <span className="bg-amber-400/20 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-400/40 uppercase tracking-wider shrink-0">
                VERIFIED B2B
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
              {language === 'bn' 
                ? 'মানসম্মত খাদ্য ও ঔষধ ব্যবহারে সর্বোচ্চ ওজন ও মুনাফা নিশ্চিত করুন' 
                : 'Government certified top-tier feed and veterinary brands'}
            </p>
          </div>
        </div>

        {/* Gold Trust Seal */}
        <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/30 px-3 py-1.5 rounded-xl shrink-0">
          <Crown size={15} className="text-amber-400" />
          <span className="text-[11px] font-black text-amber-300">
            {language === 'bn' ? 'গোল্ড পার্টনার্স' : 'Gold Partners'}
          </span>
        </div>
      </div>

      {/* 👑 2. MASTER ADMIN EXCLUSIVE TOOLBAR (STRICT ADMIN ONLY) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-transparent border border-amber-400/40 rounded-2xl p-2.5 px-3 flex items-center justify-between gap-2 shadow-xs relative z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Crown size={13} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-amber-300">
                  {language === 'bn' ? 'মাস্টার এডমিন প্যানেল' : 'Master Admin Panel'}
                </span>
                <span className="text-[8.5px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black uppercase">
                  {currentUser?.email === 'skabusufian452@gmail.com' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <p className="text-[9.5px] text-slate-300 truncate">
                {language === 'bn' ? 'শুধুমাত্র আপনি নতুন স্পনসর যোগ বা ডিলিট করতে পারেন' : 'Only you can add or delete corporate sponsors'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {deletedSponsorIds.length > 0 && (
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="p-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-400/40 flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-xs"
                title={language === 'bn' ? 'মুছে ফেলা ডিফল্ট স্পনসরগুলো পুনরায় ফিরিয়ে আনুন' : 'Restore deleted default sponsors'}
              >
                <RotateCcw size={12} />
                <span>{language === 'bn' ? 'ডিফল্ট রিস্টোর' : 'Restore'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="p-1.5 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/40 whitespace-nowrap transition-transform active:scale-95"
              title={language === 'bn' ? 'মাস্টার অ্যাডমিন: নতুন স্পনসর কোম্পানি যুক্ত করুন' : 'Admin: Add Sponsor Company'}
            >
              <Plus size={14} />
              <span>{language === 'bn' ? '+ স্পনসর যোগ' : '+ Add Sponsor'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 🏷️ 3. CATEGORY SWITCHER TABS (Clean Full Width) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 relative z-10">
        <button
          type="button"
          onClick={() => { setSelectedCategory('all'); setActiveIdx(0); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white/10 text-slate-300 hover:bg-white/15'
          }`}
        >
          <Sparkles size={12} />
          <span>{language === 'bn' ? 'সকল পার্টনার' : 'All Partners'}</span>
          <span className="text-[9px] opacity-80">({filteredSponsors.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedCategory('feed'); setActiveIdx(0); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'feed'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white/10 text-slate-300 hover:bg-white/15'
          }`}
        >
          <span>🌾</span>
          <span>{language === 'bn' ? 'খাদ্য কোম্পানি' : 'Feed Brands'}</span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedCategory('medicine'); setActiveIdx(0); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'medicine'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white/10 text-slate-300 hover:bg-white/15'
          }`}
        >
          <span>🛡️</span>
          <span>{language === 'bn' ? 'ভেটেরিনারি ও ঔষধ' : 'Veterinary & Medicine'}</span>
        </button>
      </div>

      {/* 🏢 4. BRAND SELECTION PILLS (Horizontal Scroll with Brand Initial Badges) */}
      {filteredSponsors.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 relative z-10">
          {filteredSponsors.map((s, idx) => {
            const isActive = activeIdx === idx;
            const initials = s.nameEn ? s.nameEn.split(' ')[0] : s.name.split(' ')[0];
            return (
              <button
                key={s.id || idx}
                onClick={() => setActiveIdx(idx)}
                className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0 border ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/25 scale-[1.02]'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <span className={`w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-slate-950 text-amber-300' : 'bg-white/10 text-slate-200'
                }`}>
                  {initials.charAt(0)}
                </span>
                <span>{s.name.split(' ')[0]}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                )}
                {isAdmin && isActive && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSponsorToDelete(s);
                    }}
                    className="p-1 -mr-1 hover:bg-red-950/40 text-red-900 hover:text-red-950 rounded-lg cursor-pointer transition-colors"
                    title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                  >
                    <Trash2 size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 💎 5. FEATURED CORPORATE SHOWCASE CARD (Ultra-Premium Presentation) */}
      {activeSponsor && (
        <div className="relative z-10 bg-gradient-to-br from-slate-900/90 via-slate-850 to-slate-900/90 border border-amber-400/30 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-3.5">
          {/* Top Brand Identity Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Branded Logo Monogram */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/40 shrink-0">
                {(activeSponsor.nameEn || activeSponsor.name).charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown size={10} />
                    <span>{language === 'bn' ? activeSponsor.badge : activeSponsor.badgeEn}</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
                    <ShieldCheck size={12} />
                    <span>{language === 'bn' ? 'অনুমোদিত পার্টনার' : 'Verified Partner'}</span>
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-black text-white leading-tight mt-1 truncate">
                  {language === 'bn' ? activeSponsor.name : activeSponsor.nameEn}
                </h4>

                {activeSponsor.nameEn && language === 'bn' && (
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {activeSponsor.nameEn}
                  </p>
                )}
              </div>
            </div>

            {/* Admin Delete Button (STRICT ADMIN ONLY) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setSponsorToDelete(activeSponsor)}
                className="p-1.5 px-2 text-red-300 hover:text-white hover:bg-red-700/60 rounded-xl text-xs cursor-pointer border border-red-500/40 transition-colors flex items-center gap-1 shrink-0"
                title={language === 'bn' ? 'মাস্টার অ্যাডমিন: এই স্পনসর ব্যানারটি মুছে ফেলুন' : 'Admin: Delete this sponsor'}
              >
                <Trash2 size={13} />
                <span className="text-[10px] font-bold">{language === 'bn' ? 'মুছুন' : 'Delete'}</span>
              </button>
            )}
          </div>

          {/* Slogan Quote Box */}
          <div className="bg-amber-400/5 border-l-4 border-amber-400 rounded-r-xl p-2.5 px-3">
            <p className="text-xs sm:text-sm text-amber-200/90 font-medium italic">
              “{language === 'bn' ? activeSponsor.tagline : activeSponsor.taglineEn}”
            </p>
          </div>

          {/* 📞 Direct Action Buttons: WhatsApp & Hotline (Two Bold Touch-Friendly Buttons) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                openWhatsAppSafe({
                  phone: activeSponsor.whatsapp || activeSponsor.hotline,
                  message: language === 'bn' 
                    ? `আসসালামু আলাইকুম ${activeSponsor.name}, আমি স্মার্ট খামার অ্যাপ থেকে যোগাযোগ করছি। আপনাদের খাদ্য ও পণ্যের ডিলার পয়েন্ট ও অফিশিয়াল রেট জানতে চাই।`
                    : `Hello ${activeSponsor.nameEn || activeSponsor.name}, contacting from Smart Farm App to inquire about products and dealer points.`,
                  lang: language === 'bn' ? 'bn' : 'en'
                });
              }}
              className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all border border-emerald-400/40"
            >
              <MessageCircle size={16} />
              <span>{language === 'bn' ? 'হোয়াটসঅ্যাপে ডিলার ও তথ্য' : 'WhatsApp Official Inquiry'}</span>
            </button>

            <a
              href={`tel:${activeSponsor.hotline}`}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-750 active:scale-98 text-amber-300 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 border border-slate-700 shadow-md transition-all"
            >
              <Phone size={15} className="text-amber-400" />
              <span>{language === 'bn' ? 'সরাসরি হেল্পলাইন কল' : 'Call Helpline'}: {activeSponsor.hotline}</span>
            </a>
          </div>

          {/* 3 Key Benefits Mini Cards */}
          {!compact && activeSponsor.benefits && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {(language === 'bn' ? activeSponsor.benefits : (activeSponsor.benefitsEn || activeSponsor.benefits)).map((benefit, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-start gap-2 backdrop-blur-xs">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-slate-200 font-semibold leading-snug">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 🏷️ Recommended Official Products */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] text-slate-400 font-bold flex items-center gap-1">
                <Tag size={12} className="text-amber-400" />
                {language === 'bn' ? 'জনপ্রিয় প্রোডাক্ট:' : 'Recommended:'}
              </span>
              {(language === 'bn' ? (activeSponsor.popularProducts || []) : (activeSponsor.popularProductsEn || activeSponsor.popularProducts || [])).map((prod, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    if (onSelectProduct) {
                      onSelectProduct(prod, activeSponsor.name);
                    }
                  }}
                  className="bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 text-[10.5px] font-extrabold px-2.5 py-1 rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  title={language === 'bn' ? 'ফর্মের মধ্যে যুক্ত করতে চাপুন' : 'Click to add into record form'}
                >
                  <span>{prod}</span>
                  {onSelectProduct && <Zap size={10} className="text-amber-300" />}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 shrink-0">
              <ShieldCheck size={13} />
              {language === 'bn' ? 'ল্যাব টেস্টেড কোয়ালিটি' : 'Lab Tested Quality'}
            </span>
          </div>
        </div>
      )}

      {/* ⚠️ Empty State when no sponsors exist in this category */}
      {!activeSponsor && (
        <div className="text-center py-8 px-4 bg-slate-900/60 border border-slate-800 rounded-2xl relative z-10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-400 mx-auto flex items-center justify-center font-black">
            <Building2 size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {language === 'bn' ? 'কোনো স্পনসর কোম্পানি নেই' : 'No Sponsors Listed'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {language === 'bn' 
                ? 'এই ক্যাটাগরিতে কোনো স্পনসর প্রদর্শিত হচ্ছে না।' 
                : 'No sponsors available in this category.'}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus size={14} />
                <span>{language === 'bn' ? '+ স্পনসর যোগ করুন' : '+ Add Sponsor'}</span>
              </button>
              {deletedSponsorIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>{language === 'bn' ? 'ডিফল্ট স্পনসর রিস্টোর' : 'Restore Defaults'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin Add Sponsor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-400/40 text-white rounded-3xl p-5 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-750">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black">
                  <Building2 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-300">
                    {language === 'bn' ? 'নতুন স্পনসর কোম্পানি অ্যাড (অ্যাডমিন অনলি)' : 'Add Sponsor Banner (Admin Only)'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {language === 'bn' ? 'ফিড বা মেডিসিন কোম্পানির সাথে চুক্তি অনুযায়ী ব্যানার পাবলিশ করুন' : 'Publish sponsored partner banner for feed or medicine'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSponsor} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'bn' ? 'কোম্পানির নাম *' : 'Company Name *'}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder={language === 'bn' ? 'উদাঃ প্যারাগন ফিড লিমিটেড' : 'e.g. Paragon Feed Ltd.'}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="feed">{language === 'bn' ? 'ফিড / খাবার কোম্পানি' : 'Feed Partner'}</option>
                    <option value="medicine">{language === 'bn' ? 'মেডিসিন / ভেটেরিনারি' : 'Medicine / Health'}</option>
                    <option value="all">{language === 'bn' ? 'উভয় সেকশনে দেখাবে' : 'All Sections'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {language === 'bn' ? 'হটলাইন / মোবাইল *' : 'Hotline Number *'}
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="017XXXXXXXX"
                    value={formHotline}
                    onChange={(e) => setFormHotline(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)' : 'WhatsApp Number (Optional)'}
                </label>
                <input 
                  type="text" 
                  placeholder="017XXXXXXXX"
                  value={formWhatsapp}
                  onChange={(e) => setFormWhatsapp(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'bn' ? 'ব্যাজ / স্পনসরশিপ লেভেল' : 'Badge / Sponsor Tier'}
                </label>
                <input 
                  type="text" 
                  placeholder={language === 'bn' ? '🏆 গোল্ড পার্টনার / ⭐ অফিসিয়াল পার্টনার' : '🏆 Gold Sponsor'}
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'bn' ? 'স্লোগান / বিবরণ' : 'Tagline / Description'}
                </label>
                <input 
                  type="text" 
                  placeholder={language === 'bn' ? 'খামারির বিশ্বস্ত সঙ্গী — দ্রুত বৃদ্ধি ও মুনাফার নিশ্চয়তা' : 'Trusted farm nutrition partner'}
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'bn' ? 'সুবিধাসমূহ (কমা দিয়ে লিখুন)' : 'Benefits (comma separated)'}
                </label>
                <textarea 
                  rows={2}
                  placeholder={language === 'bn' ? 'উচ্চ হজমশক্তি, সঠিক FCR, ফ্রি ডাক্তার পরামর্শ' : 'High FCR, Free doctor advice, Fast growth'}
                  value={formBenefits}
                  onChange={(e) => setFormBenefits(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {language === 'bn' ? 'জনপ্রিয় প্রোডাক্টসমূহ (কমা দিয়ে লিখুন)' : 'Popular Products (comma separated)'}
                </label>
                <input 
                  type="text" 
                  placeholder={language === 'bn' ? 'ব্রয়লার স্টার্টার, সোনালী স্পেশাল, লেয়ার ১' : 'Broiler Starter, Sonali Special'}
                  value={formProducts}
                  onChange={(e) => setFormProducts(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>{isSaving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'পাবলিশ করুন' : 'Publish Sponsor')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Sponsor Confirmation Modal */}
      {sponsorToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-slate-900 border border-red-500/40 text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-red-400">
              <Trash2 size={20} />
              <h3 className="text-sm font-black text-white">
                {language === 'bn' ? 'স্পনসর মুছে ফেলবেন?' : 'Delete Sponsor Banner?'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'bn' 
                ? `আপনি কি নিশ্চিত যে "${sponsorToDelete.name}" এর স্পনসর ব্যানারটি মুছে ফেলতে চান?`
                : `Are you sure you want to delete "${sponsorToDelete.name}" sponsor banner?`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSponsorToDelete(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                {language === 'bn' ? 'না, রাখুন' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDeleteSponsor(sponsorToDelete)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-xs"
              >
                {language === 'bn' ? 'হ্যাঁ, মুছুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
