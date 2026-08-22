import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Sparkles, 
  Phone, 
  ShieldCheck, 
  Award, 
  ExternalLink, 
  CheckCircle2, 
  ChevronRight, 
  Tag, 
  Zap,
  HelpCircle
} from 'lucide-react';

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
}

export const FEED_SPONSORS: SponsorPartner[] = [
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

export const MEDICINE_SPONSORS: SponsorPartner[] = [
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

interface SponsorBannerProps {
  type: 'feed' | 'medicine' | 'all';
  onSelectProduct?: (productName: string, companyName: string) => void;
  compact?: boolean;
}

export default function SponsorCard({ type, onSelectProduct, compact = false }: SponsorBannerProps) {
  const { language } = useLanguage();
  const sponsors = type === 'feed' 
    ? FEED_SPONSORS 
    : type === 'medicine' 
    ? MEDICINE_SPONSORS 
    : [...FEED_SPONSORS, ...MEDICINE_SPONSORS];

  const [activeIdx, setActiveIdx] = useState(0);
  const activeSponsor = sponsors[activeIdx] || sponsors[0];

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
            <div className="flex items-center gap-2">
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
            </div>
            <p className="text-[10px] text-slate-300 font-medium">
              {language === 'bn' 
                ? 'মানসম্মত খাদ্য ও ঔষধ ব্যবহারে সর্বোচ্চ ওজন ও মুনাফা নিশ্চিত করুন' 
                : 'Verified quality inputs for optimal growth and high profitability'}
            </p>
          </div>
        </div>

        {/* Tab Pills for Sponsors */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {sponsors.map((s, idx) => (
            <button
              key={s.id}
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
        </div>
      </div>

      {/* Main Sponsor Feature Body */}
      <div className="pt-3.5 relative z-10 space-y-3">
        {/* Brand Banner Title & Hotline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-400">
                {language === 'bn' ? activeSponsor.badge : activeSponsor.badgeEn}
              </span>
              <h4 className="text-sm sm:text-base font-black text-white leading-tight">
                {language === 'bn' ? activeSponsor.name : activeSponsor.nameEn}
              </h4>
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
        {!compact && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {(language === 'bn' ? activeSponsor.benefits : activeSponsor.benefitsEn).map((benefit, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex items-start gap-1.5 backdrop-blur-xs">
                <CheckCircle2 size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[10px] text-slate-200 font-bold leading-tight">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Popular Recommended Products (Click to Autofill if provided) */}
        <div className="pt-2 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Tag size={11} className="text-amber-400" />
              {language === 'bn' ? 'জনপ্রিয় প্রোডাক্ট:' : 'Recommended:'}
            </span>
            {(language === 'bn' ? activeSponsor.popularProducts : activeSponsor.popularProductsEn).map((prod, pIdx) => (
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
    </div>
  );
}
