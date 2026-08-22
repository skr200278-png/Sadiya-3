import React, { useEffect, useState } from 'react';
import { query, collection, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Sparkles, Calendar, Scale, Info, AlertTriangle, Users, BookOpen } from 'lucide-react';
import { demoStore } from '../utils/demoStore';

interface PoultryFeedPlanProps {
  batchId: string;
  startDate: string;
  totalChicks: number;
}

export default function PoultryFeedPlan({ batchId, startDate, totalChicks }: PoultryFeedPlanProps) {
  const { language } = useLanguage();
  const { currentUser, isDemoUser } = useAuth();
  const [totalMortality, setTotalMortality] = useState(0);
  const [loading, setLoading] = useState(true);
  const [avgWeightGrams, setAvgWeightGrams] = useState<string>(''); // User-specified average weight

  // Compute poultry age
  const calculateAge = (dateStr: string) => {
    const start = new Date(dateStr);
    const now = new Date();
    // Normalize dates to midnight to calculate pure days
    start.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const ageDays = calculateAge(startDate);

  // Sync mortality changes in real time!
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
    return <div className="text-xs text-slate-400 italic p-2">খাদ্য তালিকা প্রস্তুত করা হচ্ছে...</div>;
  }

  // Active Bird Count
  const liveChicks = Math.max(0, totalChicks - totalMortality);

  // Calculate Feed Requirements dynamically based on standard poultry nutrition tables:
  // Week 1 (1-7 days): ~20g per bird per day. Food always available.
  // Week 2 (8-14 days): ~42g per bird per day. Food always available.
  // Week 3 (15-21 days): ~78g per bird per day. 3 discrete meals.
  // Week 4+ (22+ days): ~120g+ per bird per day. 3 discrete meals. Wet / Mixed mash option.
  let standardPortionGrams = 20;
  let stageType: 'baby' | 'grower' | 'finisher' = 'baby';

  if (ageDays >= 1 && ageDays <= 7) {
    standardPortionGrams = 20;
    stageType = 'baby';
  } else if (ageDays >= 8 && ageDays <= 14) {
    standardPortionGrams = 42;
    stageType = 'baby';
  } else if (ageDays >= 15 && ageDays <= 21) {
    standardPortionGrams = 78;
    stageType = 'grower';
  } else {
    // 22 days and onwards
    standardPortionGrams = 125;
    stageType = 'finisher';
  }

  // Use customized average weight to adjust standard portion if specified
  let actualPortionGrams = standardPortionGrams;
  if (avgWeightGrams && Number(avgWeightGrams) > 0) {
    const customWeight = Number(avgWeightGrams);
    // If they have big birds, adjust eating scale slightly
    if (customWeight > 2200) {
      actualPortionGrams = 160;
    } else if (customWeight > 1500) {
      actualPortionGrams = 135;
    } else if (customWeight > 1000) {
      actualPortionGrams = 100;
    } else if (customWeight > 500) {
      actualPortionGrams = 65;
    } else if (customWeight > 200) {
      actualPortionGrams = 40;
    } else {
      actualPortionGrams = 20;
    }
  }

  // Raw calculations
  const totalDailyFeedKg = (liveChicks * actualPortionGrams) / 1000;
  const morningMealKg = totalDailyFeedKg / 3;
  const noonMealKg = totalDailyFeedKg / 3;
  const nightMealKg = totalDailyFeedKg / 3;

  return (
    <div className="mt-4 p-4.5 bg-gradient-to-br from-indigo-50 to-blue-50/40 rounded-2xl border border-indigo-100 font-sans space-y-3.5 shadow-xs transition-all duration-300">
      
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 text-left">
          <h4 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
            <Sparkles size={16} className="text-indigo-600 animate-pulse" />
            {language === 'bn' ? '📋 মুরগির ৩ বেলার খাদ্য তালিকা (পদ্ধতি)' : '📋 Poultry 3-Meal Feeding Guide'}
          </h4>
          <p className="text-[10px] text-slate-500 font-bold leading-normal">
            {language === 'bn' ? `বয়স: ${ageDays} দিন • বর্তমান জ্যান্ত মুরগি: ${liveChicks}টি (তুলেছেন: ${totalChicks}টি, মারা গেছে: ${totalMortality}টি)` : `Age: ${ageDays} days • Active flock: ${liveChicks} birds (Initial: ${totalChicks}, Dead: ${totalMortality})`}
          </p>
        </div>
        
        {/* Safe Badge */}
        <span className="text-[9px] font-black bg-white text-indigo-700 px-2 py-0.5 rounded-md shadow-xs border border-indigo-100 uppercase tracking-wider">
          {stageType === 'baby' ? (language === 'bn' ? 'বাচ্চা স্তর' : 'Starter') : stageType === 'grower' ? (language === 'bn' ? 'মাঝারি' : 'Grower') : (language === 'bn' ? 'পূর্ণাঙ্গ' : 'Finisher')}
        </span>
      </div>

      {/* Flock Live Mortality Notification Alert */}
      {totalMortality > 0 && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-850 font-semibold flex items-center gap-1.5">
          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
          <span>
            {language === 'bn' 
              ? `* খামারে ${totalMortality}টি মুরগি মারা যাওয়ার কারণে খাবার স্বয়ংক্রিয়ভাবে ${totalChicks}টির পরিবর্তে ${liveChicks}টির মাপে কমানো হয়েছে!` 
              : `* Feed portions automatically decreased from ${totalChicks} to ${liveChicks} because of ${totalMortality} recorded deaths!`}
          </span>
        </div>
      )}

      {/* Input section to tweak by bird weight */}
      <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded-xl border border-indigo-100/60 shadow-xxs">
        <div className="text-left">
          <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">
            {language === 'bn' ? 'গড় ওজন (ঐচ্ছিক)' : 'Avg Weight (Optional)'}
          </label>
          <div className="flex items-center gap-1">
            <input 
              type="number" 
              value={avgWeightGrams} 
              onChange={(e) => setAvgWeightGrams(e.target.value)} 
              placeholder={ageDays > 20 ? "1500" : "300"} 
              className="w-full text-xs border border-slate-200 p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
            />
            <span className="text-[10px] font-bold text-slate-400">{language === 'bn' ? 'গ্রাম' : 'g'}</span>
          </div>
        </div>

        <div className="text-left flex flex-col justify-center">
          <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">
            {language === 'bn' ? 'প্রতি পাখির দৈনিক খাদ্য' : 'Daily Feed portion/bird'}
          </label>
          <p className="text-xs font-black text-indigo-900 font-mono">
            {actualPortionGrams} {language === 'bn' ? 'গ্রাম' : 'Grams'}
          </p>
        </div>
      </div>

      {/* Daily Total Summary Card */}
      <div className="bg-white p-3 rounded-xl border border-indigo-100/60 shadow-xxs flex justify-between items-center text-left">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
            {language === 'bn' ? 'ফ্লকের জন্য আজকের মোট খাবার' : 'Total Daily Feed Needed'}
          </span>
          <span className="text-lg font-black text-indigo-900 font-mono bg-gradient-to-r from-indigo-700 to-indigo-900 bg-clip-text text-transparent">
            {totalDailyFeedKg.toFixed(2)} {language === 'bn' ? 'কেজি' : 'Kg'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-slate-400 font-bold block mb-0.5">
            {language === 'bn' ? '৩ বেলার প্রতি বেলায়' : 'Per Single Meal'}
          </span>
          <span className="text-sm font-black text-slate-700 font-mono">
            {stageType === 'baby' ? '-' : `${morningMealKg.toFixed(2)} Kg`}
          </span>
        </div>
      </div>

      {/* Routine Detail Block */}
      <div className="space-y-1.5 text-left text-xs text-slate-700 bg-white/50 p-2.5 rounded-xl border border-indigo-50">
        
        {stageType === 'baby' ? (
          /* Starter baby chick phase */
          <div className="space-y-2">
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-black text-sm">💡</span>
              <p className="text-[11px] font-bold leading-relaxed text-slate-800">
                {language === 'bn' 
                  ? 'প্রথম বাচ্চা অবস্থায় (১-১৪ দিন) সব সময় পাত্রে খাবার ও পর্যাপ্ত বায়ো-নিরাপদ পানি রাখুন। ৩ বেলার কোনো বিরতি দেওয়া যাবে না।' 
                  : 'Chicks starter phase (1-14 days): Keep feed and fresh bioactive water available 24/7. Feed must be continuous.'}
              </p>
            </div>
            
            <div className="flex justify-between items-center p-2 rounded bg-indigo-50/40 text-[11px] font-mono font-bold text-indigo-950">
              <span>{language === 'bn' ? 'সাপ্তাহিক পানির টিপস:' : 'Water Supplement:'}</span>
              <span>{language === 'bn' ? 'স্যালাইন / গ্লুকোজ পানি দিন' : 'Mix trace saline / glucose'}</span>
            </div>
          </div>
        ) : stageType === 'grower' ? (
          /* Grower phase (15 to 21 days) - 3 meals a day */
          <div className="space-y-2">
            <p className="font-extrabold text-[10px] text-indigo-900 tracking-wider uppercase mb-1 flex items-center gap-1 line-clamp-1">
              <Users size={12} className="text-indigo-600" />
              {language === 'bn' ? '১৫ দিন থেকে ২১ দিন খাবার রুটিন (৩ বেলা)' : '15 to 21 Days 3-Meal Routine'}
            </p>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                <p className="font-bold text-[10px] text-amber-900">{language === 'bn' ? '🌅 সকাল' : 'Morning'}</p>
                <p className="font-mono font-black text-slate-800 mt-0.5 text-xs">{morningMealKg.toFixed(2)} Kg</p>
              </div>

              <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                <p className="font-bold text-[10px] text-orange-900">{language === 'bn' ? '☀️ দুপুর' : 'Noon'}</p>
                <p className="font-mono font-black text-slate-800 mt-0.5 text-xs">{noonMealKg.toFixed(2)} Kg</p>
              </div>

              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                <p className="font-bold text-[10px] text-blue-900">{language === 'bn' ? '🌙 রাত' : 'Night'}</p>
                <p className="font-mono font-black text-slate-800 mt-0.5 text-xs">{nightMealKg.toFixed(2)} Kg</p>
              </div>
            </div>
          </div>
        ) : (
          /* Finisher phase (22+ days) - Wet mixed mash / গুলা খাবার */
          <div className="space-y-2">
            <p className="font-extrabold text-[11px] text-indigo-900 tracking-wider uppercase mb-1 flex items-center gap-1 line-clamp-1">
              <BookOpen size={12} className="text-indigo-500" />
              {language === 'bn' ? '২২+ দিন (গুলা অথবা মাখানো খাবারের রুটিন)' : '22+ Days Mash feeding routine'}
            </p>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                <p className="font-bold text-[10px] text-amber-900">{language === 'bn' ? '🌅 সকাল' : 'Morning'}</p>
                <p className="font-mono font-black text-slate-800 mt-0.5 text-xs">{morningMealKg.toFixed(2)} Kg</p>
              </div>

              <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                <p className="font-bold text-[10px] text-orange-900">{language === 'bn' ? '☀️ দুপুর' : 'Noon'}</p>
                <p className="font-mono font-black text-slate-800 mt-0.5 text-xs">{noonMealKg.toFixed(2)} Kg</p>
              </div>

              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                <p className="font-bold text-[10px] text-blue-900">{language === 'bn' ? '🌙 রাত' : 'Night'}</p>
                <p className="font-mono font-black text-slate-800 mt-0.5 text-xs">{nightMealKg.toFixed(2)} Kg</p>
              </div>
            </div>

            <div className="bg-indigo-100/40 p-2 rounded-lg text-[10.5px] leading-relaxed text-indigo-900 font-semibold mt-1">
              {language === 'bn'
                ? '💡 পরামর্শ: এ সময় ওজনের দ্রুত প্রবৃদ্ধির জন্য শুকনো ফিডের সাথে হালকা পানি দিয়ে মাখানো বা গুলা খাবার (Wet Mash) ৩ বেলায় ব্যবহার করতে পারেন যা মুরগি আনন্দের সাথে বেশি খাবে।'
                : '💡 Tip: To unlock rapid weight gain, mix feed with clean water into a moist/wet mash. Birds consume it much faster.'}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
