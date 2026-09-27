import React, { useState } from 'react';
import {
  Wheat,
  X,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Search,
  Scale,
  Activity,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  HelpCircle,
  Eye,
  Check
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FeedQualityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFarmType?: string;
}

export default function FeedQualityGuideModal({
  isOpen,
  onClose,
  defaultFarmType = 'poultry'
}: FeedQualityGuideModalProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [activeTab, setActiveTab] = useState<'standards' | 'inspection' | 'checker' | 'ingredients'>('standards');
  const [selectedCategory, setSelectedCategory] = useState<'broiler' | 'sonali' | 'layer' | 'cattle'>('broiler');

  // Interactive Quick Checker state
  const [testFeedType, setTestFeedType] = useState('broiler_starter');
  const [inputProtein, setInputProtein] = useState('');
  const [inputMoisture, setInputMoisture] = useState('11.5');

  if (!isOpen) return null;

  // Nutrition standards data
  const NUTRITION_DATA = {
    broiler: [
      {
        stageBn: 'ব্রয়লার প্রি-স্টার্টার (Pre-Starter)',
        stageEn: 'Broiler Pre-Starter',
        age: isBn ? '১ থেকে ১০/১২ দিন' : 'Day 1 to 10/12',
        form: isBn ? 'ছোট ক্রাম্বল (Crumbles)' : 'Fine Crumbles',
        protein: '22.0% - 23.0%',
        energy: '3,000 - 3,050 Kcal/kg',
        calcium: '1.00%',
        phosphorus: '0.45%',
        lysine: '1.30%',
        benefitsBn: 'বাচ্চার নাভির ঘা দ্রুত শুকায়, কুসুমের পুষ্টি দ্রুত টেনে নেয়, অভ্যন্তরীণ অঙ্গপ্রত্যঙ্গ ও রোগ প্রতিরোধ ক্ষমতা গড়ে তোলে।',
        benefitsEn: 'Rapid yolk sac absorption, boosts early immunity and vital internal organ development.'
      },
      {
        stageBn: 'ব্রয়লার স্টার্টার (Starter)',
        stageEn: 'Broiler Starter',
        age: isBn ? '১১ থেকে ২০/২১ দিন' : 'Day 11 to 20/21',
        form: isBn ? 'মাঝারি ক্রাম্বল (Medium Crumbles)' : 'Crumbles',
        protein: '21.0% - 22.0%',
        energy: '3,050 - 3,100 Kcal/kg',
        calcium: '0.90% - 1.00%',
        phosphorus: '0.45%',
        lysine: '1.20%',
        benefitsBn: 'হাড়ের কাঠামো শক্তিশালী করে এবং পেশি দ্রুত বৃদ্ধি করে যেন পরবর্তী সময়ে ভারী ওজন বহন করতে পারে।',
        benefitsEn: 'Builds robust skeletal framework and muscle mass to support rapid growth.'
      },
      {
        stageBn: 'ব্রয়লার গ্রোয়ার / ফিনিশার (Finisher)',
        stageEn: 'Broiler Grower / Finisher',
        age: isBn ? '২১/২২ দিন থেকে বিক্রি পর্যন্ত' : 'Day 21/22 to Market Weight',
        form: isBn ? 'পেলেট দানা (Pellet, 3mm)' : 'Pellet (3mm)',
        protein: '19.0% - 20.0%',
        energy: '3,150 - 3,200 Kcal/kg',
        calcium: '0.85% - 0.90%',
        phosphorus: '0.42%',
        lysine: '1.05%',
        benefitsBn: 'দ্রুত মাংসের ওজন বাড়ায়, হজম ক্ষমতা ও ফিড কনভার্সন রেশিও (FCR) সবচেয়ে ভালো করে খামারির সর্বোচ্চ লাভ নিশ্চিত করে।',
        benefitsEn: 'Maximizes daily meat accretion and optimizes FCR for profitable market harvest.'
      }
    ],
    sonali: [
      {
        stageBn: 'সোনালী স্টার্টার (Sonali Starter)',
        stageEn: 'Sonali Starter',
        age: isBn ? '১ থেকে ৩০ দিন' : 'Day 1 to 30',
        form: isBn ? 'ম্যাশ বা ছোট ক্রাম্বল' : 'Mash / Fine Crumbles',
        protein: '20.0% - 21.0%',
        energy: '2,850 - 2,950 Kcal/kg',
        calcium: '1.00%',
        phosphorus: '0.45%',
        lysine: '1.15%',
        benefitsBn: 'বাচ্চার মৃত্যুহার রোধ করে, সমান বৃদ্ধি ও রোগ প্রতিরোধ ক্ষমতা নিশ্চিত করে।',
        benefitsEn: 'Prevents early chick mortality, ensures uniform flock growth and immunity.'
      },
      {
        stageBn: 'সোনালী গ্রোয়ার (Sonali Grower)',
        stageEn: 'Sonali Grower',
        age: isBn ? '৩১ থেকে ৬০ দিন' : 'Day 31 to 60',
        form: isBn ? 'ক্রাম্বল বা ছোট পেলেট' : 'Crumbles / Small Pellets',
        protein: '18.5% - 19.5%',
        energy: '2,900 - 3,000 Kcal/kg',
        calcium: '0.90%',
        phosphorus: '0.42%',
        lysine: '1.00%',
        benefitsBn: 'হাড় মজবুত রাখে, পালকের চকচকে রঙ নিশ্চিত করে এবং সুষম বৃদ্ধি বজায় রাখে।',
        benefitsEn: 'Maintains optimal bone density, plumage shine and steady weight gain.'
      },
      {
        stageBn: 'সোনালী ফিনিশার (Sonali Finisher)',
        stageEn: 'Sonali Finisher',
        age: isBn ? '৬১ দিন থেকে বিক্রি পর্যন্ত' : 'Day 61 to Market Sale',
        form: isBn ? 'পেলেট (Pellet)' : 'Pellets',
        protein: '17.5% - 18.5%',
        energy: '3,000 - 3,100 Kcal/kg',
        calcium: '0.85%',
        phosphorus: '0.40%',
        lysine: '0.90%',
        benefitsBn: 'দেশি মুরগির মতো স্বাস্থ্যকর মাংসের গঠন ও দ্রুত ৮০০-১০০০ গ্রাম গড় ওজন সম্পন্ন করে।',
        benefitsEn: 'Delivers firm local-chicken texture and reaches 800-1000g market target.'
      }
    ],
    layer: [
      {
        stageBn: 'লেয়ার স্টার্টার (Layer Starter)',
        stageEn: 'Layer Starter',
        age: isBn ? '১ থেকে ৮ সপ্তাহ' : 'Week 1 to 8',
        form: isBn ? 'ম্যাশ বা ক্রাম্বল' : 'Mash / Crumbles',
        protein: '20.0%',
        energy: '2,850 Kcal/kg',
        calcium: '1.00%',
        phosphorus: '0.45%',
        lysine: '1.10%',
        benefitsBn: 'বাচ্চার প্রাথমিক স্বাস্থ্য ও অঙ্গপ্রত্যঙ্গ সুষ্ঠুভাবে গঠন করে।',
        benefitsEn: 'Healthy skeletal framework and internal organ foundation.'
      },
      {
        stageBn: 'লেয়ার গ্রোয়ার (Layer Grower)',
        stageEn: 'Layer Grower',
        age: isBn ? '৯ থেকে ১৬ সপ্তাহ' : 'Week 9 to 16',
        form: isBn ? 'ম্যাশ বা পেলেট' : 'Mash / Pellets',
        protein: '15.5% - 16.5%',
        energy: '2,750 Kcal/kg',
        calcium: '1.00%',
        phosphorus: '0.40%',
        lysine: '0.80%',
        benefitsBn: 'মুরগি যেন মাত্রাতিরিক্ত চর্বিযুক্ত না হয় এবং প্রজনন অঙ্গ সঠিকভাবে বিকশিত হয়।',
        benefitsEn: 'Prevents excess fat accumulation and prepares oviduct maturity.'
      },
      {
        stageBn: 'লেয়ার-১ পিক প্রডাকশন (Layer Phase-1)',
        stageEn: 'Layer Phase-1 (Peak Production)',
        age: isBn ? 'ডিম পাড়া শুরু থেকে ৪৫ সপ্তাহ' : 'Onset of Lay to 45 Weeks',
        form: isBn ? 'ম্যাশ বা পেলেট' : 'Layer Mash / Pellets',
        protein: '17.5% - 18.0%',
        energy: '2,750 - 2,800 Kcal/kg',
        calcium: '3.60% - 4.00% (উচ্চ ক্যালসিয়াম)',
        phosphorus: '0.45%',
        lysine: '0.85%',
        benefitsBn: 'ডিমের শক্ত খোসা তৈরি করে, পাতলা খোসার ডিম হওয়া রোধ করে এবং একটানা ৯০%+ ডিম উৎপাদন ধরে রাখে।',
        benefitsEn: 'Reinforces thick eggshell, eliminates brittle eggs, and sustains 90%+ peak lay.'
      }
    ],
    cattle: [
      {
        stageBn: 'দুধাল গাভীর ফিড (Dairy Milking Feed)',
        stageEn: 'Dairy Milking Feed',
        age: isBn ? 'দুধ দেওয়ার পুরো সময়' : 'Active Lactation Period',
        form: isBn ? 'পেলেট বা দানাদার মিশ্রণ' : 'Pellet / Grain Mash',
        protein: '16.0% - 18.0%',
        energy: 'TDN 70% - 72%',
        calcium: '1.00%',
        phosphorus: '0.60%',
        lysine: 'পরিমিত অ্যামিনো এসিড',
        benefitsBn: 'প্রতি লিটার দুধের জন্য সুষম পুষ্টি যোগায়, দুধের ফ্যাট (Fat %) ও এসএনএফ (SNF) বজায় রাখে।',
        benefitsEn: 'Increases daily milk yield and elevates milk fat & SNF percentages.'
      },
      {
        stageBn: 'ষাঁড় মোটাতাজাকরণ ফিড (Beef Fattening Feed)',
        stageEn: 'Beef Fattening Feed',
        age: isBn ? 'কোরবানি বা মাংসের ষাঁড়' : 'Fattening Bulls (90-120 days)',
        form: isBn ? 'উচ্চ ঘনত্বের পেলেট' : 'High-density Pellet',
        protein: '14.0% - 16.0%',
        energy: 'TDN 72% - 75%',
        calcium: '0.80%',
        phosphorus: '0.45%',
        lysine: 'উচ্চ আঁশ ও শক্তি',
        benefitsBn: 'দ্রুত মাংস ও ওজন বাড়ায় (প্রতিদিন ১ থেকে ১.৫ কেজি দৈহিক ওজন বৃদ্ধি নিশ্চিত করে)।',
        benefitsEn: 'Ensures rapid daily weight gain of 1.0 to 1.5 kg without rumen acidosis.'
      }
    ]
  };

  // Physical Quality Checklist
  const QUALITY_CHECKLIST = [
    {
      titleBn: '১. আর্দ্রতা পরীক্ষা (Moisture Under 12%)',
      titleEn: '1. Moisture Content (Under 12%)',
      descBn: 'এক মুঠো ফিড হাতে নিয়ে শক্ত করে মুঠো করুন এবং ছেড়ে দিন। ভালো ফিড ছেড়ে দিলে সহজে ঝরঝরে হয়ে যাবে। যদি আঠার মতো দলা পাকিয়ে থাকে তবে বুঝবেন আর্দ্রতা বেশি (১২% এর বেশি হলে ছত্রাক ও মারাত্মক আফলাটক্সিন বিষক্রিয়া তৈরি হয়)।',
      descEn: 'Squeeze a handful tightly and release. Good feed disperses cleanly. If it clumps sticky, moisture exceeds 12%, causing toxic mold and aflatoxins.',
      status: 'critical'
    },
    {
      titleBn: '২. গন্ধ ও সতেজতা পরীক্ষা (Natural Fresh Aroma)',
      titleEn: '2. Fresh Natural Aroma',
      descBn: 'ফিড থেকে তাজা ভুট্টা ও সয়াবিনের সুবাস বের হবে। কোনো প্রকার টক গন্ধ, ছাতা পড়ার গন্ধ, বা পচা তীব্র ঝাঁঝালো গন্ধ থাকলে তা মুরগিকে খাওয়ালে রক্ত আমাশয় ও লিভার নষ্ট হয়ে মারা যাবে।',
      descEn: 'Must smell pleasantly of fresh toasted grain. Any sour, musty, moldy, or pungent chemical stench causes fatal enteritis and liver failure.',
      status: 'warning'
    },
    {
      titleBn: '৩. অতিরিক্ত গুঁড়া বা ডাস্ট পরীক্ষা (Fine Dust Under 8-10%)',
      titleEn: '3. Fine Dust Content (Under 10%)',
      descBn: 'বস্তা খুললে যদি অতিরিক্ত মিহি গুঁড়া (Fine Dust) দেখা যায়, তবে ফিডের মান দুর্বল। মুরগি গুঁড়া খায় না, পানির পাত্রে গিয়ে ঠোঁট ধুয়ে পানি নোংরা করে এবং ১০-১৫% খাবার সরাসরি অপচয় হয়। পেলেট অবশ্যই শক্ত ও পরিষ্কার দানাদার হতে হবে।',
      descEn: 'Pellets and crumbles must be solid. If the bag contains over 10% flour-like dust, birds reject it, fouling water founts and wasting money.',
      status: 'info'
    },
    {
      titleBn: '৪. পেলেট সাইজ ও শক্তপোক্ত মান (Pellet Durability Index)',
      titleEn: '4. Pellet Size & Uniformity',
      descBn: 'বয়স অনুযায়ী দানার আকার সঠিক হতে হবে। ছোট বাচ্চার জন্য ১.৫ - ২ মিমি ক্রাম্বল, গ্রোয়ার ও ফিনিশারের জন্য ৩ মিমি পেলেট আদর্শ। পেলেট সহজে গুঁড়া হবে না এমন টেকসই হতে হবে।',
      descEn: 'Crumbles (1.5-2mm) for chicks; standard 3mm pellets for growers/finishers. High durability prevents transport breakage.',
      status: 'info'
    },
    {
      titleBn: '৫. উৎপাদন তারিখ ও বস্তার সিলগালা (MFG Date & Bag Integrity)',
      titleEn: '5. Manufacturing Date & Sealing',
      descBn: 'ফিড তৈরির তারিখ থেকে ৪৫-৬০ দিনের মধ্যে খাওয়ানো সবচেয়ে ভালো। পুরনো ফিডে ভিটামিন ও অ্যামিনো এসিডের মান নষ্ট হয়ে যায় এবং ফ্যাটি এসিডে দুর্গন্ধ ধরে। ভালো কোম্পানির সিল ও সুতার সেলাই দেখে কিনুন।',
      descEn: 'Feed is best fed within 45-60 days of manufacture. Stale feed loses heat-sensitive vitamins and oxidizes fats.',
      status: 'warning'
    }
  ];

  // Feed Ingredients Breakdown
  const INGREDIENTS_BREAKDOWN = [
    {
      nameBn: 'ভুট্টা (Yellow Corn / Maize)',
      nameEn: 'Yellow Corn (Maize)',
      percentage: '৫০% - ৫৫%',
      roleBn: 'প্রধান শক্তি (Metabolizable Energy) সরবরাহকারী। মুরগির স্বাভাবিক চঞ্চলতা ও দৈহিক বৃদ্ধির প্রধান চালিকাশক্তি।',
      roleEn: 'Primary energy source (3350 kcal/kg). Powers metabolism and active bird vitality.'
    },
    {
      nameBn: 'সয়াবিন মিল (Soybean Meal - 44%/48%)',
      nameEn: 'Soybean Meal (Dehulled)',
      percentage: '২৫% - ৩০%',
      roleBn: 'সর্বোচ্চ মানের উদ্ভিজ্জ প্রোটিনের প্রধান উৎস। এতে রয়েছে প্রোটিন ও অতি আবশ্যকীয় লাইসিন অ্যামিনো এসিড যা মাংস ও পেশি গঠন করে।',
      roleEn: 'Premier digestible crude protein source. Rich in Lysine to build lean breast meat.'
    },
    {
      nameBn: 'ডিওআরবি / চালের কুঁড়া (DORB / Rice Polish)',
      nameEn: 'De-oiled Rice Bran (DORB)',
      percentage: '৮% - ১২%',
      roleBn: 'প্রাকৃতিক ফাইবার ও শক্তি জোগায়, অন্ত্রের স্বাভাবিক হজম বজায় রাখে।',
      roleEn: 'Provides dietary fiber and supplementary calories for smooth gut digestion.'
    },
    {
      nameBn: 'চুনাপাথর ও ডিসিপি (Limestone & DCP)',
      nameEn: 'Limestone & Dicalcium Phosphate',
      percentage: '১.৫% - ৪.০%',
      roleBn: 'ক্যালসিয়াম ও ফসফরাস সরবরাহ করে। হাড়ের বিকাশ ও লেয়ার মুরগির ডিমের শক্ত খোসা নিশ্চিত করে।',
      roleEn: 'Crucial calcium & available phosphorus for strong leg bones and hard eggshells.'
    },
    {
      nameBn: 'ভিটামিন ও অ্যামিনো এসিড প্রিমিক্স (Premix & Enzymes)',
      nameEn: 'Premix, Enzymes & Toxin Binder',
      percentage: '০.৫% - ১.০%',
      roleBn: 'মেথিওনিন, লাইসিন, প্রোবায়োটিক, ফাইটেইজ এনজাইম ও টক্সিন বাইন্ডার যা বদহজম ও বিষক্রিয়া ঠেকিয়ে FCR বাড়ায়।',
      roleEn: 'Essential amino acids, phytase enzyme, probiotics and toxin binders to maximize feed digestion.'
    }
  ];

  // Quick Quality Checker calculation
  const getQualityAssessment = () => {
    const proteinNum = parseFloat(inputProtein);
    const moistureNum = parseFloat(inputMoisture);

    if (isNaN(proteinNum)) {
      return null;
    }

    let minProtein = 21.0;
    let maxProtein = 23.0;
    let name = 'ব্রয়লার স্টার্টার';

    if (testFeedType === 'broiler_prestarter') {
      minProtein = 22.0;
      maxProtein = 23.5;
      name = isBn ? 'ব্রয়লার প্রি-স্টার্টার' : 'Broiler Pre-Starter';
    } else if (testFeedType === 'broiler_starter') {
      minProtein = 21.0;
      maxProtein = 22.5;
      name = isBn ? 'ব্রয়লার স্টার্টার' : 'Broiler Starter';
    } else if (testFeedType === 'broiler_finisher') {
      minProtein = 19.0;
      maxProtein = 20.5;
      name = isBn ? 'ব্রয়লার ফিনিশার' : 'Broiler Finisher';
    } else if (testFeedType === 'sonali_starter') {
      minProtein = 20.0;
      maxProtein = 21.5;
      name = isBn ? 'সোনালী স্টার্টার' : 'Sonali Starter';
    } else if (testFeedType === 'sonali_grower') {
      minProtein = 18.5;
      maxProtein = 20.0;
      name = isBn ? 'সোনালী গ্রোয়ার' : 'Sonali Grower';
    } else if (testFeedType === 'layer_phase1') {
      minProtein = 17.5;
      maxProtein = 18.5;
      name = isBn ? 'লেয়ার-১ (ডিমের পিক)' : 'Layer Phase-1';
    }

    const isProteinOk = proteinNum >= minProtein;
    const isMoistureOk = moistureNum <= 12.0;

    return {
      name,
      minProtein,
      maxProtein,
      isProteinOk,
      isMoistureOk,
      proteinNum,
      moistureNum
    };
  };

  const assessment = getQualityAssessment();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <Wheat size={22} className="text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black leading-tight">
                  {isBn ? 'ফিডের গুণাগুণ ও পুষ্টিমান গাইড' : 'Feed Quality & Nutrition Guide'}
                </h3>
                <span className="text-[10px] font-black bg-yellow-300 text-amber-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {isBn ? 'খামারি সহায়িকা' : 'Farmer Guide'}
                </span>
              </div>
              <p className="text-[11px] text-amber-100 font-medium">
                {isBn 
                  ? 'কোন বয়সে কোন ফিড উপকারী এবং ভালো ফিড চেনার সহজ উপায়' 
                  : 'Nutritional standards & physical inspection tips for optimal poultry health'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 bg-slate-100 p-1.5 border-b border-slate-200 shrink-0 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('standards')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'standards'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale size={14} />
            <span className="truncate">{isBn ? 'আদর্শ পুষ্টিমান' : 'Standards'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inspection')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'inspection'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye size={14} />
            <span className="truncate">{isBn ? 'গুণাগুণ পরীক্ষা' : 'Checklist'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checker')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'checker'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap size={14} />
            <span className="truncate">{isBn ? 'মান যাচাইকারক' : 'Quick Checker'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ingredients')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'ingredients'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} />
            <span className="truncate">{isBn ? 'উপাদান তালিকা' : 'Ingredients'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* TAB 1: NUTRITIONAL STANDARDS */}
          {activeTab === 'standards' && (
            <div className="space-y-4">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'broiler', labelBn: '🍗 ব্রয়লার মুরগি', labelEn: 'Broiler' },
                  { id: 'sonali', labelBn: '🐓 সোনালী ও দেশি', labelEn: 'Sonali' },
                  { id: 'layer', labelBn: '🥚 লেয়ার (ডিম)', labelEn: 'Layer' },
                  { id: 'cattle', labelBn: '🐄 গরু ও ডেইরি', labelEn: 'Cattle' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs whitespace-nowrap cursor-pointer transition-all border ${
                      selectedCategory === cat.id
                        ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isBn ? cat.labelBn : cat.labelEn}
                  </button>
                ))}
              </div>

              {/* Notice Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-950 font-medium leading-relaxed">
                  {isBn 
                    ? 'ফিডের বস্তার গায়ে পুষ্টিমানের চার্ট দেখে নিন। নিচে বয়স অনুযায়ী আদর্শ মান দেওয়া হলো যাতে কম প্রোটিন বা নিম্নমানের ফিড কিনে প্রতারিত না হন।'
                    : 'Check your feed bag label against these scientific standards to ensure birds receive proper nutrition at every age stage.'}
                </p>
              </div>

              {/* Feed Cards for selected Category */}
              <div className="space-y-3">
                {NUTRITION_DATA[selectedCategory].map((feed, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs hover:border-orange-300 transition-colors space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          {isBn ? feed.stageBn : feed.stageEn}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-bold">
                          <span>📅 {isBn ? `বয়স: ${feed.age}` : `Age: ${feed.age}`}</span>
                          <span>•</span>
                          <span>🥣 {isBn ? `আকার: ${feed.form}` : `Form: ${feed.form}`}</span>
                        </div>
                      </div>

                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0">
                        {isBn ? 'সুপারিশকৃত' : 'Standard'}
                      </span>
                    </div>

                    {/* Nutrition Matrix Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {isBn ? 'ক্রুড প্রোটিন (CP)' : 'Crude Protein'}
                        </span>
                        <strong className="text-xs sm:text-sm font-black text-orange-600 block mt-0.5">
                          {feed.protein}
                        </strong>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {isBn ? 'বিপাকীয় শক্তি (ME)' : 'Energy (ME)'}
                        </span>
                        <strong className="text-xs sm:text-sm font-black text-slate-800 block mt-0.5">
                          {feed.energy}
                        </strong>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {isBn ? 'ক্যালসিয়াম (Ca)' : 'Calcium'}
                        </span>
                        <strong className="text-xs sm:text-sm font-black text-slate-800 block mt-0.5">
                          {feed.calcium}
                        </strong>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {isBn ? 'ফসফরাস (P)' : 'Phosphorus'}
                        </span>
                        <strong className="text-xs sm:text-sm font-black text-slate-800 block mt-0.5">
                          {feed.phosphorus}
                        </strong>
                      </div>
                    </div>

                    {/* Benefits Box */}
                    <div className="bg-orange-50/60 rounded-xl p-2.5 border border-orange-100 text-[11px] text-orange-950 font-medium flex items-start gap-2">
                      <Award size={15} className="text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>{isBn ? 'কেন উপকারী ও কাজ:' : 'Key Purpose:'} </strong>
                        <span>{isBn ? feed.benefitsBn : feed.benefitsEn}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PHYSICAL QUALITY CHECKLIST */}
          {activeTab === 'inspection' && (
            <div className="space-y-3.5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-emerald-950 text-xs">
                    {isBn ? 'ল্যাব টেস্ট ছাড়াই খালি চোখে ভালো ফিড চেনার নিয়ম' : 'Practical 5-Step Field Inspection Guide'}
                  </h4>
                  <p className="text-[10px] text-emerald-800 mt-0.5">
                    {isBn 
                      ? 'ডিলার বা দোকান থেকে ফিডের বস্তা গ্রহণের আগে এই ৫টি বিষয় অবশ্যই মিলিয়ে নিন।'
                      : 'Always inspect these 5 physical attributes before accepting feed sacks from your dealer.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {QUALITY_CHECKLIST.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                        {isBn ? item.titleBn : item.titleEn}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium pl-8">
                      {isBn ? item.descBn : item.descEn}
                    </p>

                    <div className="pl-8 pt-1 flex items-center gap-2 text-[10px] font-bold">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <Check size={12} /> {isBn ? 'সঠিক থাকলে নিরাপদ' : 'Safe if verified'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: QUICK QUALITY CHECKER */}
          {activeTab === 'checker' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      {isBn ? 'আপনার কেনা ফিডের মান যাচাই করুন' : 'Instant Feed Label Verifier'}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isBn ? 'বস্তার গায়ের প্রোটিন ও আর্দ্রতা লিখে মিলিয়ে দেখুন' : 'Enter protein & moisture from feed tag'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-black text-slate-700 text-[11px] mb-1">
                      {isBn ? 'ফিডের প্রকার' : 'Feed Type'}
                    </label>
                    <select
                      value={testFeedType}
                      onChange={(e) => setTestFeedType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white text-xs"
                    >
                      <option value="broiler_prestarter">{isBn ? 'ব্রয়লার প্রি-স্টার্টার (১-১০ দিন)' : 'Broiler Pre-Starter'}</option>
                      <option value="broiler_starter">{isBn ? 'ব্রয়লার স্টার্টার (১১-২১ দিন)' : 'Broiler Starter'}</option>
                      <option value="broiler_finisher">{isBn ? 'ব্রয়লার ফিনিশার (২২ দিন+)' : 'Broiler Finisher'}</option>
                      <option value="sonali_starter">{isBn ? 'সোনালী স্টার্টার (১-৩০ দিন)' : 'Sonali Starter'}</option>
                      <option value="sonali_grower">{isBn ? 'সোনালী গ্রোয়ার (৩১-৬০ দিন)' : 'Sonali Grower'}</option>
                      <option value="layer_phase1">{isBn ? 'লেয়ার-১ (ডিম পাড়ার পিক)' : 'Layer Phase-1'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 text-[11px] mb-1">
                      {isBn ? 'বস্তার প্রোটিন (CP %)' : 'Protein (CP %)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="যেমন: 21.5"
                      value={inputProtein}
                      onChange={(e) => setInputProtein(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 text-[11px] mb-1">
                      {isBn ? 'বস্তার আর্দ্রতা (Moisture %)' : 'Moisture (%)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="যেমন: 11.5"
                      value={inputMoisture}
                      onChange={(e) => setInputMoisture(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Instant Assessment Result */}
                {assessment ? (
                  <div className={`p-3.5 rounded-2xl border space-y-2 ${
                    assessment.isProteinOk && assessment.isMoistureOk
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-rose-50 border-rose-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {assessment.isProteinOk && assessment.isMoistureOk ? (
                        <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                      ) : (
                        <AlertTriangle size={18} className="text-rose-700 shrink-0" />
                      )}
                      <h5 className="font-black text-xs sm:text-sm">
                        {assessment.isProteinOk && assessment.isMoistureOk ? (
                          <span className="text-emerald-950">
                            {isBn ? '✓ দারুণ! এই ফিডটি আদর্শ মানসম্পন্ন' : '✓ Excellent! This feed meets industry standards'}
                          </span>
                        ) : (
                          <span className="text-rose-950">
                            {isBn ? '⚠️ সতর্কবার্তা! ফিডের মানে ঘাটতি রয়েছে' : '⚠️ Warning! Feed quality falls below standards'}
                          </span>
                        )}
                      </h5>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="bg-white/80 p-2 rounded-xl">
                        <span className="text-slate-500 font-bold block">{isBn ? 'প্রোটিন ফলাফল:' : 'Protein Status:'}</span>
                        <strong className={`font-black ${assessment.isProteinOk ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {assessment.proteinNum}% {assessment.isProteinOk ? (isBn ? '(আদর্শ: ' + assessment.minProtein + '%+)' : '(Target: ' + assessment.minProtein + '%+)') : (isBn ? '(ঘাটতি আছে! ন্যূনতম ' + assessment.minProtein + '% দরকার)' : '(Deficient! Needs min ' + assessment.minProtein + '%)')}
                        </strong>
                      </div>

                      <div className="bg-white/80 p-2 rounded-xl">
                        <span className="text-slate-500 font-bold block">{isBn ? 'আর্দ্রতা ফলাফল:' : 'Moisture Status:'}</span>
                        <strong className={`font-black ${assessment.isMoistureOk ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {assessment.moistureNum}% {assessment.isMoistureOk ? (isBn ? '(নিরাপদ ১২% এর নিচে)' : '(Safe < 12%)') : (isBn ? '(বেশি! ছত্রাক ও বিষক্রিয়ার ঝুঁকি)' : '(High! Risk of mold & aflatoxin)')}
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center text-slate-500 text-[11px] font-bold">
                    💡 {isBn ? 'উপরে আপনার ফিডের বস্তা দেখে প্রোটিন (%) লিখুন' : 'Enter the crude protein % from your feed tag to see result'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INGREDIENTS BREAKDOWN */}
          {activeTab === 'ingredients' && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
                <Info size={16} className="text-slate-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-700 font-medium">
                  {isBn
                    ? 'উন্নতমানের পোল্ট্রি ও পশু খাদ্যে সাধারণত নিচের মূল কাঁচামালগুলো বৈজ্ঞানিক অনুপাতে মেশানো থাকে।'
                    : 'Balanced poultry feed consists of strictly formulated grains, protein meals, and essential minerals.'}
                </p>
              </div>

              <div className="space-y-2.5">
                {INGREDIENTS_BREAKDOWN.map((ing, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                        {isBn ? ing.nameBn : ing.nameEn}
                      </h4>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                        {ing.percentage}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {isBn ? ing.roleBn : ing.roleEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 font-medium">
            🌾 {isBn ? 'ফার্ম ম্যানেজার পোল্ট্রি পুষ্টি সহায়িকা' : 'Farm Manager Poultry Nutrition Guide'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black rounded-xl text-xs cursor-pointer transition-colors"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
