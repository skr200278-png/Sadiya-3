import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { demoStore } from '../utils/demoStore';
import { 
  Sun, 
  Clock, 
  Thermometer, 
  ChevronRight, 
  ShieldCheck, 
  PhoneCall, 
  CheckCircle2, 
  Circle, 
  Wind, 
  Droplets, 
  Store, 
  CalendarCheck, 
  Stethoscope, 
  Wheat, 
  Pill,
  BarChart3,
  TrendingUp,
  RotateCw,
  Sparkles,
  MessageCircle,
  LayoutGrid
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FeedQualityGuideModal from '../components/FeedQualityGuideModal';
import { openWhatsAppSafe } from '../utils/whatsappHelper';

export default function Home() {
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const { config } = useSystemConfig();
  const notice = config.broadcastNotice;
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Selected Farm Type: 'poultry' (পাখি), 'cattle' (পশু), 'fish' (মাছ)
  const [selectedType, setSelectedType] = useState<'poultry' | 'cattle' | 'fish'>(
    () => (localStorage.getItem('selected_farm_type') as any) || 'poultry'
  );
  
  const [isFeedQualityOpen, setIsFeedQualityOpen] = useState(false);
  const [selectedSubBreed, setSelectedSubBreed] = useState<string>('all');
  
  // Smart Clock & Greeting
  const [timeStr, setTimeStr] = useState('');
  const [greeting, setGreeting] = useState({ bn: 'শুভ সকাল', en: 'Good Morning' });

  // Rotating farm advice index
  const [tipIndex, setTipIndex] = useState(0);

  // Daily Tasks State
  const [completedTasks, setCompletedTasks] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('daily_home_tasks');
      return saved ? JSON.parse(saved) : [1];
    } catch {
      return [1];
    }
  });

  const toggleTask = (id: number) => {
    const next = completedTasks.includes(id) 
      ? completedTasks.filter(tId => tId !== id) 
      : [...completedTasks, id];
    setCompletedTasks(next);
    localStorage.setItem('daily_home_tasks', JSON.stringify(next));
  };

  // Sub-categories list for each main category
  const subCategories = {
    poultry: [
      { id: 'broiler', nameBn: 'ব্রয়লার', nameEn: 'Broiler', icon: '🍗' },
      { id: 'sonali', nameBn: 'সোনালী', nameEn: 'Sonali', icon: '🐓' },
      { id: 'layer', nameBn: 'লেয়ার (ডিম)', nameEn: 'Layer', icon: '🥚' },
      { id: 'deshi', nameBn: 'দেশি মুরগি', nameEn: 'Deshi', icon: '🐥' },
      { id: 'duck', nameBn: 'হাঁস পালন', nameEn: 'Duck', icon: '🦆' },
      { id: 'quail', nameBn: 'কোয়েল', nameEn: 'Quail', icon: '🐦' },
      { id: 'pigeon', nameBn: 'কবুতর', nameEn: 'Pigeon', icon: '🕊️' },
    ],
    cattle: [
      { id: 'dairy', nameBn: 'ডেইরি গাভী', nameEn: 'Dairy Cow', icon: '🥛' },
      { id: 'fattening', nameBn: 'ষাঁড় মোটাতাজা', nameEn: 'Fattening', icon: '🐂' },
      { id: 'calf', nameBn: 'বাছুর পালন', nameEn: 'Calf', icon: '🐮' },
      { id: 'goat', nameBn: 'ছাগল ও খাসি', nameEn: 'Goat', icon: '🐐' },
      { id: 'sheep', nameBn: 'ভেড়া ও গাড়ল', nameEn: 'Sheep', icon: '🐑' },
      { id: 'buffalo', nameBn: 'মহিষ পালন', nameEn: 'Buffalo', icon: '🐃' },
    ],
    fish: [
      { id: 'carp', nameBn: 'রুই-কাতলা (কার্প)', nameEn: 'Carp Species', icon: '🐠' },
      { id: 'telapia', nameBn: 'তেলাপিয়া', nameEn: 'Tilapia', icon: '🐟' },
      { id: 'pangash', nameBn: 'পাঙ্গাস', nameEn: 'Pangash', icon: '🐡' },
      { id: 'shing_pabda', nameBn: 'শিং ও মাগুর', nameEn: 'Catfish', icon: '🦈' },
      { id: 'fingerlings', nameBn: 'পোনা নার্সারি', nameEn: 'Fingerlings', icon: '🌊' },
    ]
  };

  // Structured Tips categorized by main type
  const farmTips = {
    poultry: [
      {
        bn: "গরমে মুরগির খাঁচায় পর্যাপ্ত ঠান্ডা ও স্যালাইন পানির ব্যবস্থা রাখুন। পানি ঘন ঘন পরিবর্তন করুন।",
        en: "Ensure cool, fresh water with electrolytes in warm weather."
      },
      {
        bn: "স্যাঁতসেঁতে লিটার থেকে রক্ত আমাশয় হতে পারে। লিটার নিয়মিত নেড়ে শুকনা ও ঝরঝরে রাখুন।",
        en: "Turn over damp litter regularly to prevent coccidiosis."
      },
      {
        bn: "রুটিন অনুযায়ী রানিখেত ও গামবোরো ভ্যাকসিন দিন। অবহেলায় খামারে ব্যাপক মড়ক দেখা দেয়।",
        en: "Strictly administer ND and Gumboro vaccines on schedule."
      },
      {
        bn: "শেডের পর্দা নিচ থেকে ১ ফুট তুলে রাখুন যাতে ক্ষতিকর অ্যামোনিয়া গ্যাস বের হয়ে যেতে পারে।",
        en: "Keep lower curtains open for cross-ventilation to remove ammonia."
      },
      {
        bn: "ছত্রাকযুক্ত বা বাসি খাবার দেবেন না। ফ্রেশ ফিড দ্রুত ওজন বাড়ায় ও এফসিআর ভালো রাখে।",
        en: "Provide mold-free fresh feed for optimum FCR and weight gain."
      }
    ],
    cattle: [
      {
        bn: "বর্ষায় কাঁচা ঘাস খাওয়ানোর পূর্বে পশুকে নিয়মিত কৃমিনাশক ও ক্ষুরারোগের ভ্যাকসিন দিন।",
        en: "Deworm livestock and vaccinate against FMD before feeding lush grass."
      },
      {
        bn: "দুধ ও মাংস বাড়াতে দানাদার খাদ্যের সাথে খৈল, ভুষি এবং তরল ক্যালসিয়াম খাওয়ান।",
        en: "Supplement green fodder with oil-cake, bran, and liquid calcium."
      },
      {
        bn: "মেঝে শুকনো ও পরিষ্কার রাখুন। গোবর জমে থাকলে ওলান প্রদাহ (ম্যাসটাইটিস) হয়।",
        en: "Keep stable floors dry and clean to prevent mastitis and foot rot."
      },
      {
        bn: "গাভীর প্রসবের পর মিল্ক ফিভার প্রতিরোধে গুড়, স্যালাইন ও ক্যালসিয়াম খাওয়ান।",
        en: "Provide molasses, saline, and calcium drenching to fresh cows."
      }
    ],
    fish: [
      {
        bn: "ভোরে পুকুরে মাছ ভেসে উঠছে কিনা (অক্সিজেন সংকট) খেয়াল রাখুন। প্রয়োজনে পানি নাড়াচাড়া করুন।",
        en: "Monitor dawn water for oxygen deficit; splash water or use aerator."
      },
      {
        bn: "পানির পিএইচ ও ক্ষারত্ব ঠিক রাখতে প্রতি মাসে শতাংশে ১ কেজি চুন ও জিওলাইট দিন।",
        en: "Apply 1kg lime and zeolite per decimal monthly for water pH balance."
      },
      {
        bn: "অতিরিক্ত খাবার দেওয়া বন্ধ রাখুন। তলদেশে পচা খাবার থেকে ক্ষতিকর বিষাক্ত গ্যাস তৈরি হয়।",
        en: "Avoid overfeeding to prevent toxic bottom gas formation."
      },
      {
        bn: "শীতকালে ক্ষতরোগ (EUS) ঠেকাতে পুকুরে আগেই চুন ও পটাশ দিয়ে পানি জীবাণুমুক্ত রাখুন।",
        en: "Apply lime and potassium permanganate before winter against EUS."
      }
    ]
  };

  const activeTips = farmTips[selectedType] || farmTips.poultry;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours();
      let greetingBn = 'শুভ সকাল';
      let greetingEn = 'Good Morning';

      if (hrs >= 12 && hrs < 17) {
        greetingBn = 'শুভ দুপুর';
        greetingEn = 'Good Afternoon';
      } else if (hrs >= 17 && hrs < 20) {
        greetingBn = 'শুভ সন্ধ্যা';
        greetingEn = 'Good Evening';
      } else if (hrs >= 20 || hrs < 5) {
        greetingBn = 'শুভ রাত্রি';
        greetingEn = 'Good Night';
      }

      setGreeting({ bn: greetingBn, en: greetingEn });
      setTimeStr(now.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [language]);

  // Rotate tips
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % activeTips.length);
    }, 8000);
    return () => clearInterval(tipTimer);
  }, [activeTips.length]);

  // Load Profile
  useEffect(() => {
    if (!currentUser) return;
    if (isDemoUser) {
      const demoProf = demoStore.getProfile();
      setProfileData(demoProf);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      }
      setLoading(false);
    }, (err) => {
      if ((err as any)?.code !== 'permission-denied') {
        console.warn("Home user fetch notice:", err);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser, isDemoUser]);

  const handleSelectType = (type: 'poultry' | 'cattle' | 'fish') => {
    setSelectedType(type);
    setSelectedSubBreed('all');
    localStorage.setItem('selected_farm_type', type);
  };

  const currentSubCategories = subCategories[selectedType] || subCategories.poultry;

  const dailyTasks = [
    {
      id: 1,
      time: '০৭:০০ AM',
      taskBn: 'সকালের সুষম খাবার ও ফ্রেশ স্যালাইন পানি প্রদান',
      taskEn: 'Morning feed delivery & fresh water check'
    },
    {
      id: 2,
      time: '১২:৩০ PM',
      taskBn: 'শেডের তাপমাত্রা, ফ্যান ও ভেন্টিলেশন পরীক্ষা',
      taskEn: 'Midday temperature & ventilation check'
    },
    {
      id: 3,
      time: '০৫:৩০ PM',
      taskBn: 'বিকালের ফিডিং, লিটার তদারকি ও আলো নিয়ন্ত্রণ',
      taskEn: 'Evening feeding, dry litter & night lighting'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completionPct = Math.round((completedTasks.length / dailyTasks.length) * 100);

  return (
    <div className="space-y-3 pb-8 select-none max-w-xl mx-auto">
      
      {/* 📢 1. Ultra-Compact 1-Line Broadcast Ticker (If Active) */}
      {notice?.enabled !== false && notice?.message?.trim() && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0 animate-ping" />
            <span className="text-[10px] font-black text-amber-950 uppercase shrink-0">
              {notice.category === 'prayer' ? '🤲 দোয়া' : '📢 নোটিশ'}:
            </span>
            <p className="text-[11px] font-bold text-amber-900 truncate">
              {notice.message}
            </p>
          </div>
          <span className="text-[9px] font-black text-amber-700 shrink-0 uppercase tracking-wider">
            LIVE
          </span>
        </div>
      )}

      {/* 🧭 2. Mobile Native Segmented Sector Switcher (পাখি | পশু | মাছ) */}
      <div className="bg-white p-1 rounded-2xl shadow-2xs border border-slate-200">
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => handleSelectType('poultry')}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer ${
              selectedType === 'poultry'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-sm">🐔</span>
            <span>{language === 'bn' ? 'পাখি' : 'Poultry'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectType('cattle')}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer ${
              selectedType === 'cattle'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-sm">🐄</span>
            <span>{language === 'bn' ? 'পশু' : 'Cattle'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectType('fish')}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer ${
              selectedType === 'fish'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-sm">🐟</span>
            <span>{language === 'bn' ? 'মাছ' : 'Fisheries'}</span>
          </button>
        </div>

        {/* Sub-breed Micro-Scrollable Chips (Single Row) */}
        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center gap-1 overflow-x-auto px-1 pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSubBreed('all')}
            className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold shrink-0 transition-colors cursor-pointer border ${
              selectedSubBreed === 'all'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {language === 'bn' ? 'সকল জাত' : 'All'}
          </button>

          {currentSubCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedSubBreed(sub.id)}
              className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 border ${
                selectedSubBreed === sub.id
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs leading-none">{sub.icon}</span>
              <span>{language === 'bn' ? sub.nameBn : sub.nameEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 📱 3. Smart Farm Hero Spotlight Card (Weather + Advice + Profile At A Glance) */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-3.5 text-white shadow-sm border border-emerald-500/20 relative overflow-hidden">
        {/* Top Mini Strip: Farmer Greeting & Live Time */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center font-black text-sm text-yellow-300 border border-white/20 shrink-0">
              {profileData?.name ? profileData.name[0].toUpperCase() : '🌾'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-teal-200">
                  {language === 'bn' ? greeting.bn : greeting.en}
                </span>
                <span className="text-white/30">•</span>
                <span className="text-[10px] text-teal-100 font-bold flex items-center gap-0.5">
                  <Clock size={10} /> {timeStr}
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-black text-white truncate leading-tight">
                {profileData?.farmName || profileData?.name || (language === 'bn' ? 'আমার ডিজিটাল খামার' : 'My Digital Farm')}
              </h2>
            </div>
          </div>

          {/* Micro Weather Badge */}
          <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/15 flex items-center gap-1.5 shrink-0 text-white">
            <Sun size={13} className="text-yellow-400 animate-spin" style={{ animationDuration: '25s' }} />
            <span className="text-xs font-black font-sans">29°C</span>
            <span className="text-[9px] text-teal-200 font-bold hidden xs:inline">অনুকূল</span>
          </div>
        </div>

        {/* Middle: Rotating Smart Farm Advice */}
        <div className="mt-2.5 pt-2 border-t border-white/10 relative z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5 min-w-0">
              <span className="text-xs shrink-0 mt-0.5">💡</span>
              <p className="text-[11px] font-bold text-emerald-100 leading-snug line-clamp-2">
                {language === 'bn' ? activeTips[tipIndex].bn : activeTips[tipIndex].en}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTipIndex(prev => (prev + 1) % activeTips.length)}
              title={language === 'bn' ? 'পরবর্তী পরামর্শ' : 'Next tip'}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-teal-200 shrink-0 cursor-pointer transition-colors"
            >
              <RotateCw size={11} />
            </button>
          </div>
        </div>

        {/* Bottom Weather Indicators (Compact Bar) */}
        <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center relative z-10 text-[10px]">
          <div className="bg-black/20 rounded-lg py-1 px-1 border border-white/5 flex items-center justify-center gap-1">
            <Thermometer size={11} className="text-red-300" />
            <span className="text-white/70">তাপ:</span>
            <span className="font-black text-white font-sans">29°C</span>
          </div>
          <div className="bg-black/20 rounded-lg py-1 px-1 border border-white/5 flex items-center justify-center gap-1">
            <Droplets size={11} className="text-cyan-300" />
            <span className="text-white/70">আর্দ্রতা:</span>
            <span className="font-black text-white font-sans">68%</span>
          </div>
          <div className="bg-black/20 rounded-lg py-1 px-1 border border-white/5 flex items-center justify-center gap-1">
            <Wind size={11} className="text-emerald-300" />
            <span className="text-white/70">বাতাস:</span>
            <span className="font-black text-white font-sans">10 km/h</span>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent skew-x-12 pointer-events-none" />
      </div>

      {/* 🚀 4. Smartphone App Icon Grid (Phone App Hub - 8 Essential Features in 2 Clean Rows) */}
      <div className="bg-white rounded-2xl p-3 shadow-2xs border border-slate-150">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            {language === 'bn' ? 'খামার ফিচার ও সেবা কেন্দ্র' : 'Farm Services Hub'}
          </span>
          <Link to="/dashboard" className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5">
            <span>{language === 'bn' ? 'সকল হিসাব ➜' : 'All Ledger ➜'}</span>
          </Link>
        </div>

        {/* 4 Columns x 2 Rows = 8 Modern Smartphone App Tiles */}
        <div className="grid grid-cols-4 gap-2">
          {/* Tile 1: Dashboard */}
          <Link
            to="/dashboard"
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-150 hover:border-emerald-300 transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <LayoutGrid size={18} />
            </div>
            <span className="text-[10.5px] font-black text-slate-800 text-center mt-1.5 truncate w-full">
              {language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
            </span>
          </Link>

          {/* Tile 2: Smart Disease & Medicine Advisor (NEW) */}
          <Link
            to="/disease-advisor"
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-emerald-300 hover:border-emerald-400 transition-all group active:scale-95 relative"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 via-emerald-600 to-slate-900 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Pill size={18} className="text-emerald-200" />
            </div>
            <span className="text-[10.5px] font-black text-slate-800 text-center mt-1.5 truncate w-full">
              {language === 'bn' ? 'রোগ ও ঔষধ' : 'Disease Rx'}
            </span>
            <span className="absolute -top-1 -right-1 text-[7px] font-black px-1 py-0.2 bg-amber-500 text-white rounded-full uppercase border border-white tracking-wider animate-pulse">
              NEW
            </span>
          </Link>

          {/* Tile 3: Doctor & Vet Helpline */}
          <Link
            to="/doctor"
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-150 hover:border-teal-300 transition-all group active:scale-95 relative"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Stethoscope size={18} />
            </div>
            <span className="text-[10.5px] font-black text-slate-800 text-center mt-1.5 truncate w-full">
              {language === 'bn' ? 'ডাক্তার কল' : 'Vet Doctor'}
            </span>
            <span className="absolute -top-1 -right-1 text-[7px] font-black px-1 py-0.2 bg-red-600 text-white rounded-full uppercase border border-white tracking-wider">
              24/7
            </span>
          </Link>

          {/* Tile 4: Chick Market & Hatchery */}
          <Link
            to="/chicks"
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-orange-50/50 border border-slate-150 hover:border-orange-300 transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <span className="text-base leading-none">🐣</span>
            </div>
            <span className="text-[10.5px] font-black text-slate-800 text-center mt-1.5 truncate w-full">
              {language === 'bn' ? 'বাচ্চা ক্রয়' : 'Chick Market'}
            </span>
          </Link>

          {/* Tile 5: Feed & Medicine Store Directory */}
          <Link
            to="/store"
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-150 hover:border-emerald-300 transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Store size={18} />
            </div>
            <span className="text-[10.5px] font-black text-slate-800 text-center mt-1.5 truncate w-full">
              {language === 'bn' ? 'দোকান' : 'Stores'}
            </span>
          </Link>

          {/* Tile 6: Feed Quality & Nutrition Guide */}
          <button
            type="button"
            onClick={() => setIsFeedQualityOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-150 hover:border-amber-300 transition-all group active:scale-95 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Wheat size={18} />
            </div>
            <span className="text-[10.5px] font-black text-slate-800 text-center mt-1.5 truncate w-full">
              {language === 'bn' ? 'ফিড পুষ্টি' : 'Feed Guide'}
            </span>
          </button>

          {/* Tile 7: Wholesale & Live Market */}
          <Link
            to="/marketplace"
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-cyan-50/50 border border-slate-150 hover:border-cyan-300 transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10.5px] font-black text-slate-800 text-center mt-1.5 truncate w-full">
              {language === 'bn' ? 'পাইকারি দর' : 'Market'}
            </span>
          </Link>

          {/* Tile 8: Farm Reports & Analytics */}
          <Link
            to="/reports"
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-150 hover:border-indigo-300 transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <BarChart3 size={18} />
            </div>
            <span className="text-[10.5px] font-black text-slate-800 text-center mt-1.5 truncate w-full">
              {language === 'bn' ? 'রিপোর্ট বিশ্লেষণ' : 'Reports & P/L'}
            </span>
          </Link>
        </div>
      </div>

      {/* 📋 5. Daily Care Routine (Compact Phone Checklist) */}
      <div className="bg-white rounded-2xl p-3 shadow-2xs border border-slate-150">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <CalendarCheck size={14} className="text-emerald-600" />
            <h3 className="text-xs font-black text-slate-800">
              {language === 'bn' ? 'দৈনিক খামার তদারকি রুটিন' : 'Daily Care Checklist'}
            </h3>
          </div>
          <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {completedTasks.length}/{dailyTasks.length} {language === 'bn' ? 'সম্পন্ন' : 'Done'} ({completionPct}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
          <div 
            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {/* 3 Compact Checklist Rows */}
        <div className="space-y-1.5">
          {dailyTasks.map((task) => {
            const isDone = completedTasks.includes(task.id);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isDone 
                    ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-400' 
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="shrink-0">
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle size={16} className="text-slate-300" />
                    )}
                  </div>
                  <p className={`text-xs font-black truncate leading-tight ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {language === 'bn' ? task.taskBn : task.taskEn}
                  </p>
                </div>
                <span className="text-[9px] font-bold text-slate-400 font-sans shrink-0">
                  {task.time}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🚨 6. Quick Assistance & Hotline 1-Line Footer Bar */}
      <div className="grid grid-cols-2 gap-2">
        {/* Call Govt Helpline 16123 */}
        <a
          href="tel:16123"
          className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-between gap-1 shadow-xs active:scale-98 transition-all"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <PhoneCall size={13} />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[8px] font-bold text-red-200 uppercase leading-none">প্রাণিসম্পদ হটলাইন</p>
              <p className="text-xs font-black font-sans leading-tight">১৬১২৩ (টোল ফ্রি)</p>
            </div>
          </div>
          <ChevronRight size={14} className="shrink-0 text-red-200" />
        </a>

        {/* WhatsApp Doctor Quick Help */}
        <button
          type="button"
          onClick={() => {
            openWhatsAppSafe({
              phone: '8801622384379',
              message: 'আসসালামু আলাইকুম ডাক্তার সাহেব, আমার খামারে জরুরি পরামর্শ প্রয়োজন।',
              lang: language === 'bn' ? 'bn' : 'en'
            });
          }}
          className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-between gap-1 shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle size={13} />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[8px] font-bold text-emerald-200 uppercase leading-none">অভিজ্ঞ ডাক্তার</p>
              <p className="text-xs font-black leading-tight">হোয়াটসঅ্যাপ চ্যাট</p>
            </div>
          </div>
          <ChevronRight size={14} className="shrink-0 text-emerald-200" />
        </button>
      </div>

      {/* Feed Quality Modal */}
      <FeedQualityGuideModal 
        isOpen={isFeedQualityOpen}
        onClose={() => setIsFeedQualityOpen(false)}
        defaultFarmType={selectedType}
      />

    </div>
  );
}
