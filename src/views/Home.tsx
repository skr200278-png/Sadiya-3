import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { demoStore } from '../utils/demoStore';
import { 
  Sun, 
  CloudRain, 
  Clock, 
  Thermometer, 
  ChevronRight, 
  ShieldCheck, 
  Package, 
  Waves, 
  Beef, 
  PhoneCall, 
  CheckCircle2, 
  Circle, 
  Wind, 
  Droplets, 
  TrendingUp, 
  Store, 
  CalendarCheck, 
  AlertCircle,
  Sparkles,
  Layers,
  Stethoscope
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Selected Farm Type: 'poultry' (পাখি), 'cattle' (পশু), 'fish' (মাছ)
  const [selectedType, setSelectedType] = useState<'poultry' | 'cattle' | 'fish'>(
    () => (localStorage.getItem('selected_farm_type') as any) || 'poultry'
  );
  
  // Selected sub-category inside the category
  const [selectedSubBreed, setSelectedSubBreed] = useState<string>('all');
  
  // Smart Clock & Greeting
  const [timeStr, setTimeStr] = useState('');
  const [greeting, setGreeting] = useState({ bn: 'স্বাগতম', en: 'Welcome' });

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
      { id: 'broiler', nameBn: 'ব্রয়লার মুরগি', nameEn: 'Broiler Chicken', icon: '🍗' },
      { id: 'layer', nameBn: 'লেয়ার (ডিম)', nameEn: 'Layer Chicken', icon: '🥚' },
      { id: 'sonali', nameBn: 'সোনালী / দেশি', nameEn: 'Sonali / Local', icon: '🐓' },
      { id: 'duck', nameBn: 'হাঁস পালন', nameEn: 'Duck Farming', icon: '🦆' },
      { id: 'quail', nameBn: 'কোয়েল ও টার্কি', nameEn: 'Quail & Turkey', icon: '🐦' },
      { id: 'pigeon', nameBn: 'কবুতর', nameEn: 'Pigeon', icon: '🕊️' },
    ],
    cattle: [
      { id: 'dairy', nameBn: 'ডেইরি গাভী', nameEn: 'Dairy Cow', icon: '🥛' },
      { id: 'fattening', nameBn: 'ষাঁড় মোটাতাজা', nameEn: 'Beef Fattening', icon: '🐂' },
      { id: 'goat', nameBn: 'ছাগল ও খাসি', nameEn: 'Goat Farming', icon: '🐐' },
      { id: 'sheep', nameBn: 'ভেড়া ও গাড়ল', nameEn: 'Sheep Farming', icon: '🐑' },
      { id: 'buffalo', nameBn: 'মহিষ পালন', nameEn: 'Buffalo', icon: '🐃' },
    ],
    fish: [
      { id: 'telapia', nameBn: 'তেলাপিয়া / মনোসেক্স', nameEn: 'Tilapia', icon: '🐟' },
      { id: 'carp', nameBn: 'রুই-কাতলা (কার্প)', nameEn: 'Carp Species', icon: '🐠' },
      { id: 'pangash', nameBn: 'পাঙ্গাস ও মাগুর', nameEn: 'Pangash / Catfish', icon: '🦈' },
      { id: 'shing_pabda', nameBn: 'শিং, পাবদা ও কই', nameEn: 'Shing & Pabda', icon: '🦐' },
      { id: 'mixed', nameBn: 'মিশ্র মাছ চাষ', nameEn: 'Mixed Culture', icon: '🌊' },
    ]
  };

  // Structured Tips categorized by main type
  const farmTips = {
    poultry: [
      {
        bn: "১. ব্রয়লার ও দেশি মুরগির খামারে পর্যাপ্ত বিশুদ্ধ ঠান্ডা ও স্যালাইন পানির ব্যবস্থা রাখুন। গরমে পানি ঘন ঘন পরিবর্তন করুন।",
        en: "1. Ensure clean, cool, saline water for chickens and ducks. Change drinking water frequently in warm weather."
      },
      {
        bn: "২. স্যাঁতসেঁতে লিটার বা মেঝে থেকে মুরগির আমাশয় ও কক্সিডিওসিস হতে পারে। লিটার সুস্থ রাখতে নিয়মিত উলটে-পালটে শুকনো রাখুন।",
        en: "2. Damp bedding causes enteritis and coccidiosis. Turn over litter regularly to maintain dry conditions."
      },
      {
        bn: "৩. রুটিন অনুযায়ী রানীক্ষেত, গামবোরো ও হাঁসের ডাকপ্লেগ ভ্যাকসিন প্রদান করুন। অবহেলায় খামারে ব্যাপক মৃত্যুর ঝুঁকি বাড়ে।",
        en: "3. Strictly administer ND, Gumboro and Duck Plague vaccines on schedule to prevent epidemic outbreaks."
      },
      {
        bn: "৪. অ্যামোনিয়া গ্যাস বের হওয়ার জন্য শেডে পর্যাপ্ত বাতাস চলাচলের (ভেন্টিলেশন) সুব্যবস্থা ও পর্দা নিয়ন্ত্রণ রাখুন।",
        en: "4. Maintain optimum cross-ventilation in the bird shed to eliminate toxic ammonia gas fumes."
      },
      {
        bn: "৫. মানসম্মত ও ছত্রাকমুক্ত ফ্রেশ খাবার সরবরাহ করুন। ড্যাম্প বা ভেজা খাবার ওজন বৃদ্ধি ও ডিম উৎপাদন চরমভাবে হ্রাস করে।",
        en: "5. Provide mold-free, balanced feed. Damp feed dramatically reduces weight gain and egg yield."
      }
    ],
    cattle: [
      {
        bn: "১. বর্ষায় কাঁচা ঘাস খাওয়ানোর পূর্বে গবাদি পশুকে নিয়মিত কৃমিনাশক (Dewormer) দিন ও ক্ষুরারোগ ও তরকা ভ্যাকসিন নিশ্চিত করুন।",
        en: "1. Administer broad-spectrum dewormers and FMD / Anthrax vaccines before seasonal weather changes."
      },
      {
        bn: "২. ভালো দুধ ও মাংস উৎপাদনের জন্য দানাদার খাদ্যের সাথে খৈল, ভুষি এবং পর্যাপ্ত ক্যালসিয়াম তরল ও খনিজ মিশ্রণ খাওয়ান।",
        en: "2. Supplement green fodder with oil-cake, bran, DCP and liquid calcium for superior milk and meat yield."
      },
      {
        bn: "৩. গোয়ালঘরে বাতাস চলাচলের জন্য যথেষ্ট ফ্যান রাখুন এবং মেঝে সবসময় শুকনো ও গোবর-মূত্র মুক্ত রাখুন।",
        en: "3. Keep stable floors dry and scrape dung frequently to prevent foot rot and mastitis (ওলান প্রদাহ)."
      },
      {
        bn: "৪. গাভী বা ছাগলের প্রসবের পর মিল্ক ফিভার ও কিটোসিস প্রতিরোধে গুড়, স্যালাইন ও ক্যালসিয়াম বড়ি নিশ্চিত করুন।",
        en: "4. Supply molasses, glucose and calcium drenching to fresh cows to prevent metabolic milk fever."
      },
      {
        bn: "৫. ষাঁড় মোটাতাজাকরণে ইউরিয়া মোলাসেস স্ট্র (UMS) ও সুষম দানাদার খাদ্য সঠিক মাপে প্রয়োগ করুন।",
        en: "5. Feed UMS (Urea Molasses Straw) and formulated fattening concentrate in calculated ratios."
      }
    ],
    fish: [
      {
        bn: "১. ভোরে পুকুরে মাছ ভেসে উঠছে কিনা (অক্সিজেনের ঘাটতি) তা পর্যবেক্ষণ করুন এবং প্রয়োজনে এয়ারেটর চালান বা পানি নাড়াচাড়া করুন।",
        en: "1. Monitor dawn water for surface gulping (oxygen deficit); aerate or splash pond water immediately."
      },
      {
        bn: "২. পানির স্বাভাবিক গভীরতা ও হালকা সবুজ রঙ ঠিক রাখতে নিয়ম মেনে চুন, জিওলাইট ও জৈব সার প্রয়োগ করুন।",
        en: "2. Apply agricultural lime and zeolite periodically to stabilize pond alkalinity and pH between 7.5 - 8.5."
      },
      {
        bn: "৩. অতিরিক্ত খাবার দেওয়া থেকে বিরত থাকুন। পচে যাওয়া অবশিষ্টাংশ খাবার পুকুরের তলদেশে গ্যাস তৈরি করে মাছ মেরে ফেলে।",
        en: "3. Avoid overfeeding. Unconsumed sinking feed decomposes and produces fatal toxic hydrogen sulfide gas."
      },
      {
        bn: "৪. তেলাপিয়া ও কার্প জাতীয় মাছে লাল দাগ বা ঘা দেখা দিলে সাথে সাথে পটাশিয়াম পারম্যাঙ্গানেট বা লবণ চিকিৎসা দিন।",
        en: "4. Dip treat affected fish in potassium permanganate or brine solution at the first sign of ulcer disease."
      },
      {
        bn: "৫. পোনা ছাড়ার আগে পুকুর শুকিয়ে জীবাণুমুক্ত করুন এবং ক্ষতিকর জলজ আগাছা ও রাক্ষুসে মাছ নির্মূল করুন।",
        en: "5. Disinfect and lime empty pond bottom thoroughly before stocking fingerlings to maximize survival rate."
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
      console.warn("Home user fetch notice:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser, isDemoUser]);

  const handleSelectType = (type: 'poultry' | 'cattle' | 'fish') => {
    setSelectedType(type);
    setSelectedSubBreed('all');
    localStorage.setItem('selected_farm_type', type);
  };

  const styleConfig = {
    poultry: {
      gradient: 'from-green-700 via-emerald-600 to-green-600 border-green-500/20',
      tagColor: 'bg-green-100 text-green-800',
      tabLabelBn: 'পাখি পালন সংস্করণ (মুরগি, হাঁস, কোয়েল)',
      tabLabelEn: 'Bird & Poultry Edition',
      bannerIcon: <Package className="text-yellow-300 animate-pulse" size={18} />,
      weatherNoticeBn: 'শেডে তাপমাত্রা সহনীয় রাখা জরুরি। ভেন্টিলেশন ফ্যান চালু রাখুন ও ভিটামিন-সি/স্যালাইন পানি দিন।',
      weatherNoticeEn: 'Maintain moderate house temperature. Run fans and supply fresh electrolytes.'
    },
    cattle: {
      gradient: 'from-amber-700 via-orange-600 to-amber-600 border-orange-500/20',
      tagColor: 'bg-amber-100 text-amber-900',
      tabLabelBn: 'পশু পালন সংস্করণ (গরু, ষাঁড়, ছাগল)',
      tabLabelEn: 'Livestock & Cattle Edition',
      bannerIcon: <Beef className="text-amber-100 animate-bounce" size={18} />,
      weatherNoticeBn: 'গোয়ালঘর শুকনো রাখুন। কাঁচা ঘাসের সাথে সুষম দানাদার খাদ্য ও খৈল-ভুষি মিশ্রণ খাওয়ান।',
      weatherNoticeEn: 'Keep the shed floor dry. Provide balanced concentrate, minerals and roughage.'
    },
    fish: {
      gradient: 'from-blue-700 via-cyan-600 to-blue-600 border-blue-500/20',
      tagColor: 'bg-blue-100 text-blue-900',
      tabLabelBn: 'মাছ চাষ সংস্করণ (তেলাপিয়া, কার্প, পাঙ্গাস)',
      tabLabelEn: 'Fisheries & Aquaculture Edition',
      bannerIcon: <Waves className="text-cyan-200 animate-pulse" size={18} />,
      weatherNoticeBn: 'ভোরে অক্সিজেনের স্তর পর্যবেক্ষণ করুন। পানির pH নিয়ন্ত্রণে প্রতি মাসে চুন ও জিওলাইট প্রয়োগ করুন।',
      weatherNoticeEn: 'Check morning oxygen levels. Apply agricultural lime to keep water pH balanced.'
    }
  };

  const dailyTasks = [
    {
      id: 1,
      time: 'সকাল ০৭:০০',
      timeEn: '07:00 AM',
      taskBn: 'সকালের খাবার ও টাটকা স্যালাইন পানি সরবরাহ',
      taskEn: 'Morning feed delivery & fresh water check'
    },
    {
      id: 2,
      time: 'দুপুর ১২:৩০',
      timeEn: '12:30 PM',
      taskBn: 'তাপমাত্রা, শেডের ফ্যান ও পানি পরীক্ষা',
      taskEn: 'Midday temperature & ventilation check'
    },
    {
      id: 3,
      time: 'বিকাল ০৫:৩০',
      timeEn: '05:30 PM',
      taskBn: 'বিকালের ফিডিং, লিটার/মেঝে শুকনো রাখা ও আলো ব্যবস্থাপনা',
      taskEn: 'Evening feeding, floor cleanup & night lighting'
    }
  ];

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">{t('common.loading')}</div>;
  }

  const selectStyle = styleConfig[selectedType] || styleConfig.poultry;
  const currentSubCategories = subCategories[selectedType] || subCategories.poultry;

  return (
    <div className="space-y-3.5 pb-6 select-none animate-fadeIn">
      
      {/* 1. Main Category Hierarchy Selector: পাখি, পশু, মাছ */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex items-center justify-between mb-2 px-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Layers size={13} className="text-emerald-600" />
            {language === 'bn' ? 'খামারের মূল শ্রেণি নির্বাচন করুন' : 'Select Farm Category'}
          </label>
          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {selectedType === 'poultry' ? '🐦 পাখি বর্গ' : selectedType === 'cattle' ? '🐄 পশু বর্গ' : '🐟 মাছ বর্গ'}
          </span>
        </div>

        {/* 3 Main Category Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSelectType('poultry')}
            className={`py-2.5 px-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs font-black transition-all duration-200 cursor-pointer ${
              selectedType === 'poultry'
                ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-md ring-2 ring-emerald-100 scale-[1.02]'
                : 'bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">🐦</span>
            <div className="text-center sm:text-left leading-none">
              <span className="block font-black">{language === 'bn' ? 'পাখি' : 'Birds'}</span>
              <span className="text-[9px] opacity-80 hidden sm:block mt-0.5">{language === 'bn' ? 'মুরগি, হাঁস, কোয়েল' : 'Poultry, Duck'}</span>
            </div>
          </button>
          
          <button
            onClick={() => handleSelectType('cattle')}
            className={`py-2.5 px-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs font-black transition-all duration-200 cursor-pointer ${
              selectedType === 'cattle'
                ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-md ring-2 ring-amber-100 scale-[1.02]'
                : 'bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">🐄</span>
            <div className="text-center sm:text-left leading-none">
              <span className="block font-black">{language === 'bn' ? 'পশু' : 'Animals'}</span>
              <span className="text-[9px] opacity-80 hidden sm:block mt-0.5">{language === 'bn' ? 'গরু, ষাঁড়, ছাগল' : 'Cattle, Goat'}</span>
            </div>
          </button>

          <button
            onClick={() => handleSelectType('fish')}
            className={`py-2.5 px-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs font-black transition-all duration-200 cursor-pointer ${
              selectedType === 'fish'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md ring-2 ring-blue-100 scale-[1.02]'
                : 'bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">🐟</span>
            <div className="text-center sm:text-left leading-none">
              <span className="block font-black">{language === 'bn' ? 'মাছ' : 'Fish'}</span>
              <span className="text-[9px] opacity-80 hidden sm:block mt-0.5">{language === 'bn' ? 'তেলাপিয়া, রুই, কার্প' : 'Tilapia, Carp'}</span>
            </div>
          </button>
        </div>

        {/* Sub-categories / Breed Carousel inside selected Main Category */}
        <div className="mt-3 pt-2.5 border-t border-slate-150">
          <p className="text-[10px] font-bold text-slate-500 mb-1.5 px-1 flex items-center gap-1">
            <span>✨</span>
            <span>
              {language === 'bn' 
                ? `${selectedType === 'poultry' ? 'পাখির জাত ও প্রকারভেদ:' : selectedType === 'cattle' ? 'পশুর জাত ও প্রকারভেদ:' : 'মাছের প্রজাতি ও জাতসমূহ:'}`
                : 'Sub-species & Breeds:'}
            </span>
          </p>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedSubBreed('all')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                selectedSubBreed === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>🌟</span>
              <span>{language === 'bn' ? 'সকল জাত' : 'All Breeds'}</span>
            </button>
            {currentSubCategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubBreed(sub.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                  selectedSubBreed === sub.id
                    ? selectedType === 'poultry'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : selectedType === 'cattle'
                      ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                      : 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{sub.icon}</span>
                <span>{language === 'bn' ? sub.nameBn : sub.nameEn}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Header Greeting Bar */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-11 h-11 rounded-xl border-2 border-emerald-500 object-cover shadow-xs" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white font-black text-base shadow-xs">
                {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : '🌾'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400">
                {language === 'bn' ? greeting.bn : greeting.en}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                <Clock size={11} /> {timeStr}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-850 tracking-tight leading-tight">
              {profileData?.name || currentUser?.displayName || (language === 'bn' ? 'সফল খামারি' : 'Farmer')}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold truncate max-w-[200px]">
              {profileData?.farmName || (language === 'bn' ? 'ডিজিটাল ডায়েরি ও হিসাব' : 'Digital Farm Ledger')}
            </p>
          </div>
        </div>
        
        {/* Farm Online Tag */}
        <div className="hidden sm:flex bg-emerald-50 border border-emerald-100 p-2 rounded-xl items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xs">
            <ShieldCheck size={12} />
          </div>
          <div className="text-left">
            <p className="text-[8px] text-emerald-800 font-extrabold uppercase leading-none">{language === 'bn' ? 'অনলাইন' : 'Secure'}</p>
          </div>
        </div>
      </div>

      {/* 3. Live Weather & Farm Environment Card */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-emerald-500/10 rounded-2xl p-3.5 border border-amber-200/70 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sun size={16} className="text-amber-500 animate-spin" style={{ animationDuration: '20s' }} />
            <h4 className="text-xs font-black text-slate-850">
              {language === 'bn' ? 'আবহাওয়া ও পরিবেশ পরিস্থিতি' : 'Weather & Farm Climate'}
            </h4>
          </div>
          <span className="text-[9px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
            {language === 'bn' ? 'অনুকূল আবহাওয়া' : 'Good Climate'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-white/80 p-2 rounded-xl border border-amber-100/80 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
              <Thermometer size={12} className="text-red-500" />
              <span className="text-[9px] font-bold">{language === 'bn' ? 'তাপমাত্রা' : 'Temp'}</span>
            </div>
            <p className="text-sm font-black text-slate-850 font-sans leading-none">29°C</p>
          </div>

          <div className="bg-white/80 p-2 rounded-xl border border-amber-100/80 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
              <Droplets size={12} className="text-blue-500" />
              <span className="text-[9px] font-bold">{language === 'bn' ? 'আর্দ্রতা' : 'Humidity'}</span>
            </div>
            <p className="text-sm font-black text-slate-850 font-sans leading-none">68%</p>
          </div>

          <div className="bg-white/80 p-2 rounded-xl border border-amber-100/80 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
              <Wind size={12} className="text-teal-500" />
              <span className="text-[9px] font-bold">{language === 'bn' ? 'বাতাস' : 'Wind'}</span>
            </div>
            <p className="text-sm font-black text-slate-850 font-sans leading-none">10 km/h</p>
          </div>
        </div>

        <p className="text-[10px] font-bold text-amber-950/90 leading-tight bg-white/60 p-2 rounded-xl border border-amber-100">
          💡 {language === 'bn' ? selectStyle.weatherNoticeBn : selectStyle.weatherNoticeEn}
        </p>
      </div>

      {/* 4. Farm Dynamic Advice Banner */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${selectStyle.gradient} rounded-2xl p-3.5 text-white shadow-xs border border-slate-100/10`}>
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="p-0.5 px-1.5 rounded bg-white/20 backdrop-blur-xs text-[9px] font-black tracking-wide uppercase text-white flex items-center gap-1">
              {selectStyle.bannerIcon}
              <span>
                {language === 'bn' 
                  ? `${selectedType === 'poultry' ? 'পাখির খামার পরামর্শ' : selectedType === 'cattle' ? 'পশুর খামার পরামর্শ' : 'মাছ চাষ পরামর্শ'}`
                  : 'Expert Farm Advice'}
              </span>
            </div>
          </div>
          <p className="text-xs font-bold leading-relaxed text-emerald-50">
            {language === 'bn' ? activeTips[tipIndex].bn : activeTips[tipIndex].en}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent skew-x-12 pointer-events-none"></div>
      </div>

      {/* 5. Daily Farm Care & Routine Checklist */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <CalendarCheck size={15} className="text-emerald-600" />
            <h4 className="text-xs font-black text-slate-850">
              {language === 'bn' ? 'দৈনিক খামার রুটিন ও তদারকি' : 'Daily Farm Care Routine'}
            </h4>
          </div>
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {completedTasks.length}/{dailyTasks.length} {language === 'bn' ? 'সম্পন্ন' : 'Done'}
          </span>
        </div>

        <div className="space-y-1.5">
          {dailyTasks.map((task) => {
            const isDone = completedTasks.includes(task.id);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isDone 
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-500' 
                    : 'bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="shrink-0">
                    {isDone ? (
                      <CheckCircle2 size={17} className="text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle size={17} className="text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-black truncate leading-tight ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {language === 'bn' ? task.taskBn : task.taskEn}
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                      ⏰ {language === 'bn' ? task.time : task.timeEn}
                    </span>
                  </div>
                </div>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                  isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isDone ? (language === 'bn' ? 'সম্পন্ন' : 'Done') : (language === 'bn' ? 'বাকি' : 'Pending')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Veterinary Doctor Consultation & Helpline CTA */}
      <Link 
        to="/doctor" 
        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-900 text-white shadow-sm hover:from-teal-800 hover:to-emerald-800 transition-all group border border-teal-500/30 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/30 border border-teal-300/40 flex items-center justify-center text-teal-200 shrink-0 group-hover:scale-105 transition-transform shadow-inner">
            <Stethoscope size={20} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">
                {language === 'bn' ? 'ডাক্তারি পরামর্শ ও টেলিমেডিসিন' : 'Veterinary Doctor & Telemedicine'}
              </span>
              <span className="bg-amber-400 text-slate-950 text-[7px] font-black px-1.5 py-0.2 rounded-full uppercase">
                {language === 'bn' ? '২৪/৭ ডাক্তার' : '24/7 VET'}
              </span>
            </div>
            <p className="text-[9.5px] text-teal-100/90 font-medium">
              {language === 'bn' ? 'বিশেষজ্ঞ ডাক্তারের কল, হোয়াটসঅ্যাপ পরামর্শ ও প্রেসক্রিপশন' : 'Call expert veterinarians, chat on WhatsApp & get prescriptions'}
            </p>
          </div>
        </div>
        <div className="bg-white/15 group-hover:bg-white/25 text-white px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shrink-0 transition-colors">
          <span>{language === 'bn' ? 'পরামর্শ নিন' : 'Consult'}</span>
          <ChevronRight size={14} />
        </div>
      </Link>

      {/* 7. Prominent Dashboard Switcher CTA */}
      <Link 
        to="/dashboard" 
        className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl text-white shadow-sm border border-emerald-500/10 hover:from-emerald-700 hover:to-green-700 transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-sm">
            📊
          </div>
          <div className="text-left">
            <p className="text-xs font-black tracking-tight">{language === 'bn' ? 'কুইক অ্যাকশন ও বিস্তারিত ড্যাশবোর্ড' : 'Quick Actions & Detailed Dashboard'}</p>
            <p className="text-[9px] text-emerald-100 font-bold">{language === 'bn' ? 'খাবার, ওষুধ, খরচ, বিক্রয় ও খামার রিপোর্ট' : 'Feed, Medicine, Expense, Sales & Reports'}</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-white transform transition-transform group-hover:translate-x-0.5 duration-200" />
      </Link>

    </div>
  );
}
