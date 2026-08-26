import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
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
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  benefits: string[];
  benefitsEn: string[];
  popularProducts: string[];
  popularProductsEn: string[];
  accentColor: string;
  isCustom?: boolean;
  createdAt?: string;
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
  const isAdmin = currentUser?.email === 'skabusufian452@gmail.com' || (currentUser as any)?.role === 'admin';

  const [dbSponsors, setDbSponsors] = useState<SponsorPartner[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<SponsorPartner | null>(null);

  // Form State for Admin Adding Sponsors
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'feed' | 'medicine' | 'all'>(type === 'all' ? 'feed' : type);
  const [formTagline, setFormTagline] = useState('');
  const [formBadge, setFormBadge] = useState('⭐ অফিশিয়াল স্পনসর');
  const [formHotline, setFormHotline] = useState('');
  const [formBenefits, setFormBenefits] = useState('');
  const [formProducts, setFormProducts] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load Sponsors from Firestore and LocalStorage
  useEffect(() => {
    // 1. Local storage fallback
    const savedLocal = localStorage.getItem('custom_sponsors');
    let localList: SponsorPartner[] = [];
    if (savedLocal) {
      try {
        localList = JSON.parse(savedLocal);
      } catch (e) {
        console.error("Local sponsor parse error", e);
      }
    }

    const defaultInitial = [...INITIAL_FEED_SPONSORS, ...INITIAL_MEDICINE_SPONSORS];

    // Combine defaults and local
    const mergedInitial = [...defaultInitial, ...localList.filter(l => !defaultInitial.some(d => d.id === l.id))];
    setDbSponsors(mergedInitial);

    // 2. Real-time Firestore sync
    if (db) {
      try {
        const sponsorsRef = collection(db, 'sponsors');
        const unsub = onSnapshot(sponsorsRef, (snapshot) => {
          if (!snapshot.empty) {
            const firestoreSponsors: SponsorPartner[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as SponsorPartner));

            // Combine defaults with firestore sponsors
            const combined = [
              ...defaultInitial.filter(d => !firestoreSponsors.some(fs => fs.id === d.id)),
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

  // Filter sponsors by requested category
  const filteredSponsors = dbSponsors.filter(s => {
    if (type === 'all') return true;
    return s.category === type || s.category === 'all';
  });

  const activeSponsor = filteredSponsors[activeIdx] || filteredSponsors[0] || INITIAL_FEED_SPONSORS[0];

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formHotline.trim()) {
      toast.error(language === 'bn' ? 'দয়া করে কোম্পানির নাম ও হটলাইন নম্বর দিন' : 'Please provide Company Name and Hotline');
      return;
    }

    setIsSaving(true);
    const newSponsor: SponsorPartner = {
      id: 'sp_' + Date.now(),
      name: formName.trim(),
      nameEn: formName.trim(),
      category: formCategory,
      tagline: formTagline.trim() || (language === 'bn' ? 'উন্নত গুণগত মানের খাদ্য ও পশু স্বাস্থ্য সমাধান' : 'High quality feed and animal health solution'),
      taglineEn: formTagline.trim() || 'High quality feed and animal health solution',
      badge: formBadge.trim() || '⭐ ভেরিফাইড পার্টনার',
      badgeEn: '⭐ Verified Partner',
      hotline: formHotline.trim(),
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
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Save in Firestore if available
      if (db && !isDemoUser) {
        try {
          await addDoc(collection(db, 'sponsors'), newSponsor);
        } catch (fErr) {
          console.warn("Firestore write error for sponsor, using local fallback", fErr);
        }
      }

      // 2. Save in LocalStorage
      const local = JSON.parse(localStorage.getItem('custom_sponsors') || '[]');
      local.push(newSponsor);
      localStorage.setItem('custom_sponsors', JSON.stringify(local));

      setDbSponsors(prev => [...prev, newSponsor]);
      toast.success(language === 'bn' ? '✅ নতুন স্পনসর কোম্পানি যুক্ত হয়েছে!' : 'Sponsor company added!');
      setShowAddModal(false);
      // Reset form
      setFormName('');
      setFormTagline('');
      setFormHotline('');
      setFormBenefits('');
      setFormProducts('');
    } catch (err) {
      toast.error(language === 'bn' ? 'সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to save sponsor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSponsor = async (sponsor: SponsorPartner) => {
    try {
      // 1. Delete from Firestore if exists
      if (db && !isDemoUser && sponsor.id) {
        try {
          await deleteDoc(doc(db, 'sponsors', sponsor.id));
        } catch (e) {
          console.warn("Firestore delete sponsor err", e);
        }
      }

      // 2. Remove from LocalStorage
      const local = JSON.parse(localStorage.getItem('custom_sponsors') || '[]');
      const updatedLocal = local.filter((l: any) => l.id !== sponsor.id && l.name !== sponsor.name);
      localStorage.setItem('custom_sponsors', JSON.stringify(updatedLocal));

      // 3. Update state
      setDbSponsors(prev => prev.filter(s => s.id !== sponsor.id));
      setActiveIdx(0);
      setSponsorToDelete(null);
      toast.success(language === 'bn' ? '🗑️ স্পনসর সফলভাবে মুছে ফেলা হয়েছে' : 'Sponsor removed');
    } catch (err) {
      toast.error(language === 'bn' ? 'মুছে ফেলতে ব্যর্থ হয়েছে' : 'Failed to delete');
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-amber-400/30 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Sponsor Header Badge */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-700/60 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shadow-xs shrink-0">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-amber-300">
                {type === 'feed' 
                  ? (language === 'bn' ? '🌟 স্পনসর খাদ্য প্রস্তুতকারক পার্টনার' : '🌟 Sponsored Feed Partners')
                  : type === 'medicine'
                  ? (language === 'bn' ? '🛡️ স্পনসর ভেটেরিনারি ও মেডিসিন পার্টনার' : '🛡️ Sponsored Veterinary Partners')
                  : (language === 'bn' ? '✨ স্পনসর খাদ্য ও ঔষধ পার্টনার্স' : '✨ Sponsored Feed & Health Partners')}
              </h3>
              <span className="bg-amber-400/20 text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-amber-400/40 uppercase">
                SPONSOR
              </span>

              {/* Master Admin Indicator */}
              {isAdmin && (
                <span className="bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs">
                  <Crown size={9} />
                  <span>{language === 'bn' ? 'মাস্টার এডমিন' : 'Master Admin'}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300 font-medium">
              {language === 'bn' 
                ? 'মানসম্মত খাদ্য ও ঔষধ ব্যবহারে সর্বোচ্চ ওজন ও মুনাফা নিশ্চিত করুন' 
                : 'Verified quality inputs for optimal growth and high profitability'}
            </p>
          </div>
        </div>

        {/* Tab Pills for Sponsors & Admin Add Button */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {filteredSponsors.map((s, idx) => (
            <button
              key={s.id || idx}
              onClick={() => setActiveIdx(idx)}
              className={`px-2 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeIdx === idx 
                  ? 'bg-amber-400 text-slate-950 shadow-xs' 
                  : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
            >
              {s.name.split(' ')[0]}
            </button>
          ))}

          {/* Admin Add Sponsor Button */}
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1 px-2 rounded-xl text-[10px] font-black bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-0.5 cursor-pointer shadow-xs whitespace-nowrap transition-transform active:scale-95 ml-1"
              title={language === 'bn' ? 'অ্যাডমিন: নতুন স্পনসর কোম্পানি যুক্ত করুন' : 'Admin: Add Sponsor Company'}
            >
              <Plus size={12} />
              <span>{language === 'bn' ? '+ স্পনসর যোগ' : '+ Add Sponsor'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Sponsor Feature Body */}
      {activeSponsor && (
        <div className="pt-3.5 relative z-10 space-y-3">
          {/* Brand Banner Title & Hotline */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-amber-400">
                  {language === 'bn' ? activeSponsor.badge : activeSponsor.badgeEn}
                </span>
                <h4 className="text-sm sm:text-base font-black text-white leading-tight">
                  {language === 'bn' ? activeSponsor.name : activeSponsor.nameEn}
                </h4>

                {/* Admin Delete This Active Sponsor */}
                {isAdmin && (
                  <button
                    onClick={() => setSponsorToDelete(activeSponsor)}
                    className="p-1 text-red-300 hover:text-red-100 hover:bg-red-900/50 rounded-lg text-xs cursor-pointer border border-red-500/30 transition-colors flex items-center gap-1"
                    title={language === 'bn' ? 'এই স্পনসর মুছে ফেলুন' : 'Delete this sponsor'}
                  >
                    <Trash2 size={11} />
                    <span className="text-[9px] font-bold">{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                {language === 'bn' ? activeSponsor.tagline : activeSponsor.taglineEn}
              </p>
            </div>

            <a
              href={`tel:${activeSponsor.hotline}`}
              className="self-start sm:self-auto py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 shrink-0"
            >
              <Phone size={13} />
              <span>{language === 'bn' ? 'অফিশিয়াল হেল্পলাইন' : 'Helpline'}: {activeSponsor.hotline}</span>
            </a>
          </div>

          {/* Key Benefits List */}
          {!compact && activeSponsor.benefits && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {(language === 'bn' ? activeSponsor.benefits : (activeSponsor.benefitsEn || activeSponsor.benefits)).map((benefit, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex items-start gap-1.5 backdrop-blur-xs">
                  <CheckCircle2 size={13} className="text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-slate-200 font-bold leading-tight">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Popular Recommended Products */}
          <div className="pt-2 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <Tag size={11} className="text-amber-400" />
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
                  className="bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-slate-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border border-white/15 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  title={language === 'bn' ? 'ফর্মের মধ্যে যুক্ত করতে চাপুন' : 'Click to add into record form'}
                >
                  <span>{prod}</span>
                  {onSelectProduct && <Zap size={10} className="text-amber-300" />}
                </button>
              ))}
            </div>

            <span className="text-[9px] text-emerald-400 font-extrabold flex items-center gap-1 shrink-0">
              <ShieldCheck size={12} />
              {language === 'bn' ? 'সার্টিফাইড খামারি পার্টনার' : 'Certified Farm Partner'}
            </span>
          </div>
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
