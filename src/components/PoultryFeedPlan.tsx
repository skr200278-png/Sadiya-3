import React, { useEffect, useState } from 'react';
import { query, collection, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Sparkles, 
  Calendar, 
  Scale, 
  AlertTriangle, 
  Users, 
  BookOpen, 
  Package, 
  Clock, 
  HelpCircle,
  Layers,
  ChevronDown
} from 'lucide-react';
import { demoStore } from '../utils/demoStore';

interface PoultryFeedPlanProps {
  batchId: string;
  startDate: string;
  totalChicks: number;
  batchName?: string;
}

// Convert numbers to Bengali digits if language is 'bn'
const formatNum = (val: number | string, lang: string, decimals = 1): string => {
  const n = typeof val === 'number' 
    ? (Number.isInteger(val) ? val.toString() : val.toFixed(decimals)) 
    : val;
  if (lang !== 'bn') return n;
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/[0-9]/g, d => bnDigits[Number(d)] || d);
};

export default function PoultryFeedPlan({ batchId, startDate, totalChicks, batchName }: PoultryFeedPlanProps) {
  const { language } = useLanguage();
  const { currentUser, isDemoUser } = useAuth();
  const [totalMortality, setTotalMortality] = useState(0);
  const [loading, setLoading] = useState(true);
  const [avgWeightGrams, setAvgWeightGrams] = useState<string>(''); // User-specified average weight
  const [bagWeightKg, setBagWeightKg] = useState<number>(50); // 50kg standard or 25kg small bag
  const [birdType, setBirdType] = useState<'broiler' | 'sonali' | 'layer' | 'deshi'>(() => {
    // Smart auto-detect from batchName
    if (batchName) {
      const lower = batchName.toLowerCase();
      if (lower.includes('sonali') || lower.includes('সোনালী') || lower.includes('ককরেল')) return 'sonali';
      if (lower.includes('layer') || lower.includes('লেয়ার') || lower.includes('ডিম')) return 'layer';
      if (lower.includes('deshi') || lower.includes('দেশি') || lower.includes('হাস') || lower.includes('কোয়েল')) return 'deshi';
    }
    return 'broiler';
  });

  // Compute poultry age
  const calculateAge = (dateStr: string) => {
    const start = new Date(dateStr);
    const now = new Date();
    start.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const ageDays = calculateAge(startDate);

  // Sync mortality changes in real time
  useEffect(() => {
    if (isDemoUser) {
      const records = demoStore.getMortalityRecords(batchId);
      const count = records.reduce((acc, r) => acc + Number(r.count || 0), 0);
      setTotalMortality(count);
      setLoading(false);
      const unsub = demoStore.subscribe(() => {
        const updated = demoStore.getMortalityRecords(batchId);
        setTotalMortality(updated.reduce((acc, r) => acc + Number(r.count || 0), 0));
      });
      return () => unsub();
    }

    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'mortality'),
        where('userId', '==', currentUser.uid),
        where('batchId', '==', batchId)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let count = 0;
        snapshot.docs.forEach(doc => {
          count += Number(doc.data().count || 0);
        });
        setTotalMortality(count);
        setLoading(false);
      }, (error) => {
        console.warn("Error syncing mortality for feed plan:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("PoultryFeedPlan listener catch:", e);
      setLoading(false);
    }
  }, [batchId, currentUser, isDemoUser]);

  if (loading) {
    return <div className="text-xs text-slate-400 italic p-2">{language === 'bn' ? 'খাদ্য ও বস্তার হিসাব প্রস্তুত করা হচ্ছে...' : 'Preparing feed calculation...'}</div>;
  }

  // Active Bird Count
  const liveChicks = Math.max(0, totalChicks - totalMortality);

  // Calculate Feed Requirements dynamically based on standard poultry nutrition tables by Breed & Age
  let standardPortionGrams = 20;
  let stageType: 'baby' | 'grower' | 'finisher' = 'baby';

  if (birdType === 'broiler') {
    if (ageDays <= 7) {
      standardPortionGrams = 20;
      stageType = 'baby';
    } else if (ageDays <= 14) {
      standardPortionGrams = 45;
      stageType = 'baby';
    } else if (ageDays <= 21) {
      standardPortionGrams = 80;
      stageType = 'grower';
    } else if (ageDays <= 28) {
      standardPortionGrams = 120;
      stageType = 'grower';
    } else if (ageDays <= 35) {
      standardPortionGrams = 155;
      stageType = 'finisher';
    } else {
      standardPortionGrams = 175;
      stageType = 'finisher';
    }
  } else if (birdType === 'sonali') {
    if (ageDays <= 7) {
      standardPortionGrams = 10;
      stageType = 'baby';
    } else if (ageDays <= 14) {
      standardPortionGrams = 18;
      stageType = 'baby';
    } else if (ageDays <= 21) {
      standardPortionGrams = 26;
      stageType = 'grower';
    } else if (ageDays <= 28) {
      standardPortionGrams = 34;
      stageType = 'grower';
    } else if (ageDays <= 45) {
      standardPortionGrams = 48;
      stageType = 'grower';
    } else if (ageDays <= 60) {
      standardPortionGrams = 62;
      stageType = 'finisher';
    } else {
      standardPortionGrams = 75;
      stageType = 'finisher';
    }
  } else if (birdType === 'layer') {
    if (ageDays <= 14) {
      standardPortionGrams = 18;
      stageType = 'baby';
    } else if (ageDays <= 28) {
      standardPortionGrams = 32;
      stageType = 'grower';
    } else if (ageDays <= 56) {
      standardPortionGrams = 50;
      stageType = 'grower';
    } else if (ageDays <= 112) {
      standardPortionGrams = 75;
      stageType = 'grower';
    } else {
      standardPortionGrams = 115;
      stageType = 'finisher';
    }
  } else {
    // Deshi / other birds
    if (ageDays <= 14) {
      standardPortionGrams = 15;
      stageType = 'baby';
    } else if (ageDays <= 30) {
      standardPortionGrams = 30;
      stageType = 'grower';
    } else if (ageDays <= 60) {
      standardPortionGrams = 55;
      stageType = 'grower';
    } else {
      standardPortionGrams = 75;
      stageType = 'finisher';
    }
  }

  // Use customized average weight to adjust standard portion if specified
  let actualPortionGrams = standardPortionGrams;
  if (avgWeightGrams && Number(avgWeightGrams) > 0) {
    const customWeight = Number(avgWeightGrams);
    if (customWeight > 2200) {
      actualPortionGrams = Math.max(actualPortionGrams, 165);
    } else if (customWeight > 1500) {
      actualPortionGrams = Math.max(actualPortionGrams, 135);
    } else if (customWeight > 1000) {
      actualPortionGrams = Math.max(actualPortionGrams, 95);
    } else if (customWeight > 500) {
      actualPortionGrams = Math.max(actualPortionGrams, 60);
    } else if (customWeight > 200) {
      actualPortionGrams = Math.max(actualPortionGrams, 38);
    }
  }

  // Exact Feed Calculations (KG & Bags)
  const totalDailyFeedKg = (liveChicks * actualPortionGrams) / 1000;
  const morningMealKg = totalDailyFeedKg / 3;
  const noonMealKg = totalDailyFeedKg / 3;
  const nightMealKg = totalDailyFeedKg / 3;

  // Bags Calculations
  const dailyBagsFloat = totalDailyFeedKg / bagWeightKg;
  const fullBags = Math.floor(dailyBagsFloat);
  const remKg = Math.round((totalDailyFeedKg % bagWeightKg) * 10) / 10;

  // 7-day Weekly Stock Plan
  const weeklyFeedKg = totalDailyFeedKg * 7;
  const weeklyBagsFloat = weeklyFeedKg / bagWeightKg;
  const weeklyFullBags = Math.floor(weeklyBagsFloat);
  const weeklyRemKg = Math.round((weeklyFeedKg % bagWeightKg) * 10) / 10;

  return (
    <div className="mt-4 p-4.5 bg-gradient-to-br from-indigo-50/90 via-blue-50/40 to-amber-50/30 rounded-2xl border border-indigo-200/80 font-sans space-y-3.5 shadow-xs transition-all duration-300">
      
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
              <Package size={17} className="text-indigo-600 shrink-0" />
              {language === 'bn' ? '📋 বাচ্চার বয়স অনুযায়ী খাদ্য ও বস্তার হিসাব' : '📋 Feed & Sack Plan by Bird Age'}
            </h4>
            <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              {stageType === 'baby' ? (language === 'bn' ? 'স্টার্টার' : 'Starter') : stageType === 'grower' ? (language === 'bn' ? 'গ্রোয়ার' : 'Grower') : (language === 'bn' ? 'ফিনিশার' : 'Finisher')}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-normal">
            {language === 'bn' 
              ? `বর্তমান বয়স: ${formatNum(ageDays, language, 0)} দিন • জ্যান্ত বাচ্চা: ${formatNum(liveChicks, language, 0)}টি (তুলেছেন: ${formatNum(totalChicks, language, 0)}টি, মৃত্যু: ${formatNum(totalMortality, language, 0)}টি)` 
              : `Flock Age: ${ageDays} days • Active birds: ${liveChicks} (Initial: ${totalChicks}, Dead: ${totalMortality})`}
          </p>
        </div>

        {/* Bag Size Selector (50kg vs 25kg) */}
        <div className="flex items-center bg-white border border-indigo-200 rounded-xl p-0.5 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setBagWeightKg(50)}
            className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
              bagWeightKg === 50 ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-indigo-900'
            }`}
          >
            {language === 'bn' ? '৫০ কেজি বস্তা' : '50kg Bag'}
          </button>
          <button
            type="button"
            onClick={() => setBagWeightKg(25)}
            className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
              bagWeightKg === 25 ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-indigo-900'
            }`}
          >
            {language === 'bn' ? '২৫ কেজি বস্তা' : '25kg Bag'}
          </button>
        </div>
      </div>

      {/* Bird Breed Selector Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        {[
          { id: 'broiler', bn: 'ব্রয়লার (Broiler)', en: 'Broiler' },
          { id: 'sonali', bn: 'সোনালী / ককরেল', en: 'Sonali' },
          { id: 'layer', bn: 'লেয়ার (ডিম)', en: 'Layer' },
          { id: 'deshi', bn: 'দেশি / অন্যান্য পাখি', en: 'Deshi / Bird' },
        ].map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setBirdType(item.id as any)}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
              birdType === item.id
                ? 'bg-indigo-900 text-white border-indigo-900 shadow-2xs'
                : 'bg-white text-slate-600 border-indigo-100 hover:bg-indigo-50'
            }`}
          >
            {language === 'bn' ? item.bn : item.en}
          </button>
        ))}
      </div>

      {/* Mortality deduction notice if any */}
      {totalMortality > 0 && (
        <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-200 text-[10px] text-amber-900 font-semibold flex items-center gap-1.5">
          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
          <span>
            {language === 'bn' 
              ? `* খামারে ${formatNum(totalMortality, language, 0)}টি বাচ্চা মারা যাওয়ায় খাদ্য তালিকা স্বয়ংক্রিয়ভাবে ${formatNum(liveChicks, language, 0)}টি বাচ্চার চাহিদামতো সমন্বয় করা হয়েছে!` 
              : `* ${totalMortality} dead birds deducted. Feed calculated for remaining ${liveChicks} live birds.`}
          </span>
        </div>
      )}

      {/* PRIMARY HIGHLIGHT: Daily Feed in KG and in BAGS (কত কেজি ও কত বস্তা) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        
        {/* Card 1: Today's Daily Feed Needed */}
        <div className="bg-white p-3.5 rounded-2xl border-2 border-indigo-500/30 shadow-xs text-left relative overflow-hidden">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
              <Package size={13} className="text-indigo-600" />
              {language === 'bn' ? 'আজকের দৈনিক খাবার' : 'Today\'s Total Feed'}
            </span>
            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {formatNum(actualPortionGrams, language, 0)} {language === 'bn' ? 'গ্রাম/পাখি' : 'g/bird'}
            </span>
          </div>

          {/* KG display */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-indigo-950 font-sans tracking-tight">
              {formatNum(totalDailyFeedKg, language, 2)}
            </span>
            <span className="text-sm font-bold text-indigo-700">
              {language === 'bn' ? 'কেজি' : 'KG'}
            </span>
          </div>

          {/* Bags (বস্তা) display */}
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                📦 {formatNum(dailyBagsFloat, language, 2)} {language === 'bn' ? 'বস্তা' : 'Bags'}
              </span>
              <span className="text-[10.5px] font-bold text-slate-500">
                ({fullBags > 0 
                  ? (language === 'bn' ? `${formatNum(fullBags, language, 0)} বস্তা ${remKg > 0 ? `${formatNum(remKg, language, 1)} কেজি` : ''}` : `${fullBags} bags ${remKg > 0 ? `${remKg} kg` : ''}`)
                  : (language === 'bn' ? `${formatNum(remKg, language, 1)} কেজি (অর্ধেক বস্তা)` : `${remKg} kg`)})
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: 7-Day Weekly Stock Plan (কত বস্তা কিনতে হবে) */}
        <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-500/30 shadow-xs text-left relative overflow-hidden">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={13} className="text-emerald-600" />
              {language === 'bn' ? '১ সপ্তাহের প্রয়োজনীয় স্টক' : '7-Day Feed Purchase Plan'}
            </span>
            <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
              {language === 'bn' ? '৭ দিনের জন্য' : 'For 7 Days'}
            </span>
          </div>

          {/* KG display */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-sans tracking-tight">
              {formatNum(weeklyFeedKg, language, 1)}
            </span>
            <span className="text-sm font-bold text-emerald-700">
              {language === 'bn' ? 'কেজি' : 'KG'}
            </span>
          </div>

          {/* Bags (বস্তা) display */}
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                🛍️ {formatNum(weeklyBagsFloat, language, 1)} {language === 'bn' ? 'বস্তা লাগবে' : 'Bags Required'}
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                ({weeklyFullBags > 0 
                  ? (language === 'bn' ? `${formatNum(weeklyFullBags, language, 0)} বস্তা ${weeklyRemKg > 0 ? `+ ${formatNum(weeklyRemKg, language, 0)} কেজি` : ''}` : `${weeklyFullBags} bags ${weeklyRemKg > 0 ? `+ ${weeklyRemKg}kg` : ''}`)
                  : (language === 'bn' ? `${formatNum(weeklyRemKg, language, 1)} কেজি` : `${weeklyRemKg} kg`)})
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Input section to tweak by bird weight */}
      <div className="grid grid-cols-2 gap-2 bg-white/90 p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
        <div className="text-left">
          <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">
            {language === 'bn' ? 'গড় ওজন (ঐচ্ছিক)' : 'Avg Weight (Optional)'}
          </label>
          <div className="flex items-center gap-1">
            <input 
              type="number" 
              value={avgWeightGrams} 
              onChange={(e) => setAvgWeightGrams(e.target.value)} 
              placeholder={ageDays > 20 ? "1500" : "300"} 
              className="w-full text-xs border border-slate-200 p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-slate-800"
            />
            <span className="text-[10px] font-bold text-slate-400 shrink-0">{language === 'bn' ? 'গ্রাম' : 'g'}</span>
          </div>
        </div>

        <div className="text-left flex flex-col justify-center pl-1 border-l border-slate-100">
          <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">
            {language === 'bn' ? 'প্রতি বাচ্চার দৈনিক গ্রহণ' : 'Daily Portion / Bird'}
          </label>
          <p className="text-xs font-black text-indigo-900 font-mono">
            {formatNum(actualPortionGrams, language, 0)} {language === 'bn' ? 'গ্রাম খাবার' : 'Grams'}
          </p>
        </div>
      </div>

      {/* Routine Detail Block - 3 Meals Breakdown */}
      <div className="space-y-1.5 text-left text-xs text-slate-700 bg-white/70 p-3 rounded-xl border border-indigo-100">
        
        {stageType === 'baby' ? (
          /* Starter baby chick phase */
          <div className="space-y-2">
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-black text-sm">💡</span>
              <p className="text-[11px] font-bold leading-relaxed text-slate-800">
                {language === 'bn' 
                  ? `বাচ্চা অবস্থায় (১-১৪ দিন) ট্রে বা পাত্রে সারাক্ষণ খাবার রাখা ভালো। সারাদিনে মোট ${formatNum(totalDailyFeedKg, language, 1)} কেজি (${formatNum(dailyBagsFloat, language, 2)} বস্তা) খাবার বারে বারে অল্প করে ছড়িয়ে দিন যাতে নষ্ট না হয়।` 
                  : `During starter phase (1-14 days), keep fresh feed in shallow trays. Distribute ${totalDailyFeedKg.toFixed(1)} kg (${dailyBagsFloat.toFixed(2)} bags) in small intervals to prevent wastage.`}
              </p>
            </div>
            
            <div className="flex justify-between items-center p-2 rounded-lg bg-indigo-50/60 text-[11px] font-mono font-bold text-indigo-950">
              <span>{language === 'bn' ? '💧 বায়ো-নিরাপদ পানির টিপস:' : '💧 Bio-safe Water Tip:'}</span>
              <span>{language === 'bn' ? 'স্যালাইন ও গ্লুকোজ পানি পর্যাপ্ত রাখুন' : 'Provide fresh glucose & electrolyte water'}</span>
            </div>
          </div>
        ) : (
          /* Grower & Finisher phase - 3 discrete meals */
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-[11px] text-indigo-900 tracking-wider uppercase flex items-center gap-1">
                <Users size={12} className="text-indigo-600" />
                {language === 'bn' ? '৩ বেলার খাবারের পরিমাণ (সকাল, দুপুর, রাত):' : '3-Meal Portion Breakdown:'}
              </p>
              <span className="text-[9.5px] font-bold text-slate-400">
                {language === 'bn' ? `বেলা প্রতি: ${formatNum(morningMealKg, language, 1)} কেজি` : `${morningMealKg.toFixed(1)} kg / meal`}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-amber-50 p-2 rounded-xl border border-amber-200/80">
                <p className="font-bold text-[10px] text-amber-900">{language === 'bn' ? '🌅 সকাল' : 'Morning'}</p>
                <p className="font-mono font-black text-slate-850 mt-0.5 text-xs">
                  {formatNum(morningMealKg, language, 1)} {language === 'bn' ? 'কেজি' : 'Kg'}
                </p>
              </div>

              <div className="bg-orange-50 p-2 rounded-xl border border-orange-200/80">
                <p className="font-bold text-[10px] text-orange-900">{language === 'bn' ? '☀️ দুপুর' : 'Noon'}</p>
                <p className="font-mono font-black text-slate-850 mt-0.5 text-xs">
                  {formatNum(noonMealKg, language, 1)} {language === 'bn' ? 'কেজি' : 'Kg'}
                </p>
              </div>

              <div className="bg-blue-50 p-2 rounded-xl border border-blue-200/80">
                <p className="font-bold text-[10px] text-blue-900">{language === 'bn' ? '🌙 রাত' : 'Night'}</p>
                <p className="font-mono font-black text-slate-850 mt-0.5 text-xs">
                  {formatNum(nightMealKg, language, 1)} {language === 'bn' ? 'কেজি' : 'Kg'}
                </p>
              </div>
            </div>

            {ageDays >= 22 && (
              <div className="bg-indigo-100/50 p-2 rounded-lg text-[10.5px] leading-relaxed text-indigo-900 font-semibold mt-1">
                {language === 'bn'
                  ? '💡 পরামর্শ: দ্রুত প্রবৃদ্ধির জন্য শুকনো দানার সাথে হালকা কুসুম পানি দিয়ে মাখানো গুলা খাবার (Wet Mash) দিলে খাবার নষ্ট কমে ও ওজন দ্রুত বাড়ে।'
                  : '💡 Tip: To promote rapid feed intake and weight gain, try feeding a moist/wet mash blend.'}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
