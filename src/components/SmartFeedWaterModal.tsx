import React, { useState } from 'react';
import { 
  X, 
  Droplets, 
  Wheat, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Clock, 
  Calendar,
  Layers,
  ThermometerSun,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { toBnDigits } from '../utils/feedStockCalculations';
import type { InsightMetricData } from './SmartFarmInsightsCard';

interface SmartFeedWaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InsightMetricData;
  batchName?: string;
  batchAgeDays?: number;
}

export default function SmartFeedWaterModal({
  isOpen,
  onClose,
  data,
  batchName,
  batchAgeDays
}: SmartFeedWaterModalProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  if (!isOpen) return null;

  const age = batchAgeDays || data.batchAgeDays || 1;
  const count = data.aliveBirds || data.totalChicks || 100;
  const dailyFeedKg = data.dailyFeedKg || (data.avgDailyFeedBags * 50) || Math.round((count * 165) / 1000);
  const dailyFeedBags = Number((dailyFeedKg / 50).toFixed(2));
  
  const waterNormal = data.dailyWaterLitresNormal || Math.round(dailyFeedKg * 2.0);
  const waterSummer = data.dailyWaterLitresSummer || Math.round(dailyFeedKg * 2.5);
  const drinkers = data.recommendedDrinkersCount || Math.max(1, Math.ceil(count / 50));

  const totalBatchDemandBags = data.totalBatchTargetFeedBags || 26;
  const remainingNeedBags = data.remainingFeedNeededToHarvestBags || 4.5;
  const purchasedBags = data.feedBagsPurchased || 0;
  const remainingBags = data.feedStockRemainingBags || 0;
  const isStockEmpty = remainingBags <= 0.2;

  // Standard 5-week breakdown for Broiler
  const broilerSchedule = [
    {
      weekBn: 'সপ্তাহ ১ (১–৭ দিন)',
      weekEn: 'Week 1 (Days 1–7)',
      feedGrams: '২০–৩৫ গ্রাম',
      waterMl: '৫০–৭০ মিলি',
      feedType: 'প্রি-স্টার্টার (Pre-Starter)',
      notesBn: 'গ্লুকোজ বা স্যালাইন পানি দিন; তাপমাত্রা ৩২–৩৫°C রাখুন।'
    },
    {
      weekBn: 'সপ্তাহ ২ (৮–১৪ দিন)',
      weekEn: 'Week 2 (Days 8–14)',
      feedGrams: '৪৩–৬৭ গ্রাম',
      waterMl: '৯০–১৩০ মিলি',
      feedType: 'ব্রয়লার স্টার্টার (Starter)',
      notesBn: 'গামবোরো ও রানিক্ষেত ভ্যাকসিনের সময় পানির পাত্র পরিষ্কার রাখুন।'
    },
    {
      weekBn: 'সপ্তাহ ৩ (১৫–২১ দিন)',
      weekEn: 'Week 3 (Days 15–21)',
      feedGrams: '৭২–১০৬ গ্রাম',
      waterMl: '১৪০–২১০ মিলি',
      feedType: 'ব্রয়লার গ্রোয়ার (Grower)',
      notesBn: 'দ্রুত বৃদ্ধি শুরু হয়; পর্যাপ্ত ভেন্টিলেশন ও শুষ্ক লিটার নিশ্চিত করুন।'
    },
    {
      weekBn: 'সপ্তাহ ৪ (২২–২৮ দিন)',
      weekEn: 'Week 4 (Days 22–28)',
      feedGrams: '১১২–১৪৭ গ্রাম',
      waterMl: '২২৫–২৯৫ মিলি',
      feedType: 'গ্রোয়ার বা ফিনিশার (Finisher)',
      notesBn: 'রাতের বেলা খাবার বেশি খায়; আলো ও পানির সরবরাহ নিরবচ্ছিন্ন রাখুন।'
    },
    {
      weekBn: 'সপ্তাহ ৫ (২৯–৩৫ দিন)',
      weekEn: 'Week 5 (Days 29–35)',
      feedGrams: '১৫৩–১৮৩+ গ্রাম',
      waterMl: '৩০০–৩৭০+ মিলি',
      feedType: 'ব্রয়লার ফিনিশার (Finisher)',
      notesBn: 'ওজন ২ কেজির কাছে পৌঁছায়; গরমে হিট স্ট্রোক ঠেকাতে ভিটামিন-সি দিন।'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold shrink-0 border border-white/25">
              <Droplets size={20} className="text-cyan-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black truncate leading-tight">
                  {isBn ? 'খাবার ও পানির স্বয়ংক্রিয় হিসাব' : 'Smart Feed & Water Guide'}
                </h3>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 uppercase tracking-wide">
                  {isBn ? 'অটো-সিস্টেম' : 'AUTO'}
                </span>
              </div>
              <p className="text-[11px] text-amber-100 font-bold truncate mt-0.5">
                {batchName || 'ব্যাচ'} • {isBn ? `বয়স ${toBnDigits(age)} দিন` : `Age ${age}d`} • {isBn ? `${toBnDigits(count)}টি পাখি` : `${count} birds`}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 flex items-center justify-center transition-all cursor-pointer text-white shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3.5 text-xs">
          
          {/* Zero Daily Entry Assurance Notice */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-2.5 sm:p-3 flex items-start gap-2.5 shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 size={16} />
            </div>
            <div className="min-w-0 leading-relaxed">
              <h4 className="text-xs font-black text-emerald-950">
                {isBn ? 'খামারিদের কোনো চিন্তা নেই: প্রতিদিন এন্ট্রি করার প্রয়োজন নেই!' : 'Zero Daily Entry Required'}
              </h4>
              <p className="text-[11px] text-emerald-900 font-medium mt-0.5">
                {isBn 
                  ? 'আপনার ব্যাচের বয়স বাড়ার সাথে সাথে অ্যাপটি বিজ্ঞানসম্মত গ্রোথ চার্ট অনুযায়ী নিজে থেকেই প্রতিদিনের খাবার ও পানির চাহিদা আপডেট করে দেয়। খামারিদের প্রতিদিন অ্যাপে লগ করার কোনো কষ্ট করতে হবে না।' 
                  : 'The system automatically progresses feeding and water demand according to flock age without requiring daily manual logs.'}
              </p>
            </div>
          </div>

          {/* Today's Live Demand Grid (Feed + Water) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Feed Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-amber-900 font-bold text-[11px]">
                <span className="flex items-center gap-1">
                  <Wheat size={13} className="text-amber-700" />
                  {isBn ? 'আজকের খাবার চাহিদা' : 'Today Feed Need'}
                </span>
                <span className="text-[9px] bg-amber-200 text-amber-950 font-black px-1.5 py-0.2 rounded-md">
                  {isBn ? 'বয়স ' + toBnDigits(age) + ' দিন' : `Day ${age}`}
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-amber-950">
                {isBn ? toBnDigits(dailyFeedKg) : dailyFeedKg} {isBn ? 'কেজি' : 'kg'}
              </div>
              <p className="text-[10px] font-bold text-amber-800">
                ≈ {isBn ? toBnDigits(dailyFeedBags) : dailyFeedBags} {isBn ? 'বস্তা (৫০ কেজি সাইজ)' : 'bags (50kg)'}
              </p>
              <p className="text-[9.5px] text-slate-500 font-medium">
                {isBn ? `গড়ে প্রতি মুরগি প্রায় ${toBnDigits(Math.round((dailyFeedKg * 1000) / count))} গ্রাম` : `Avg ~${Math.round((dailyFeedKg * 1000) / count)}g/bird`}
              </p>
            </div>

            {/* Water Card */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-3 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-cyan-900 font-bold text-[11px]">
                <span className="flex items-center gap-1">
                  <Droplets size={13} className="text-cyan-700" />
                  {isBn ? 'আজকের সুপেয় পানি' : 'Today Water Need'}
                </span>
                <span className="text-[9px] bg-cyan-200 text-cyan-950 font-black px-1.5 py-0.2 rounded-md">
                  {isBn ? 'সুপেয় পানি' : 'Pure Water'}
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-cyan-950">
                {isBn ? toBnDigits(waterNormal) : waterNormal} {isBn ? 'লিটার' : 'liters'}
              </div>
              <p className="text-[10px] font-bold text-cyan-800">
                {isBn ? `তীব্র গরমে: ~${toBnDigits(waterSummer)} লিটার` : `Summer heat: ~${waterSummer} L`}
              </p>
              <p className="text-[9.5px] text-slate-500 font-medium">
                {isBn ? `পাত্র: কমপক্ষে ${toBnDigits(drinkers)}টি বেল ড্রিংকার` : `At least ${drinkers} bell drinkers`}
              </p>
            </div>
          </div>

          {/* Batch Lifetime & Stock Reality Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2">
            <h4 className="text-xs font-black text-slate-850 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers size={13} className="text-indigo-600" />
                {isBn ? '৩৫ দিনে পুরো ব্যাচের আসল হিসাব (১ থেকে ৩৫ দিন)' : 'Full Batch Feed Lifecycle (1-35 Days)'}
              </span>
              <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                {isBn ? 'খামারি সত্যতা' : 'Reality Check'}
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-150">
                <span className="text-[9px] font-bold text-slate-400 block">{isBn ? 'মোট ব্যাচ চাহিদা' : 'Batch Total Demand'}</span>
                <strong className="text-xs font-black text-slate-800 font-sans">
                  {isBn ? toBnDigits(totalBatchDemandBags) : totalBatchDemandBags} {isBn ? 'বস্তা' : 'bags'}
                </strong>
                <span className="text-[8.5px] text-slate-500 block">১-৩৫ দিন পর্যন্ত</span>
              </div>

              <div className="bg-slate-50 p-2 rounded-xl border border-slate-150">
                <span className="text-[9px] font-bold text-slate-400 block">{isBn ? 'গুদামে কেনা খাদ্য' : 'Purchased In Stock'}</span>
                <strong className="text-xs font-black text-amber-700 font-sans">
                  {isBn ? toBnDigits(purchasedBags) : purchasedBags} {isBn ? 'বস্তা' : 'bags'}
                </strong>
                <span className="text-[8.5px] text-slate-500 block">মোট এন্ট্রি</span>
              </div>

              <div className="bg-slate-50 p-2 rounded-xl border border-slate-150">
                <span className="text-[9px] font-bold text-slate-400 block">{isBn ? 'বর্তমান অবশিষ্ট স্টক' : 'Remaining Stock'}</span>
                <strong className={`text-xs font-black font-sans ${isStockEmpty ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {isStockEmpty ? (isBn ? '০ বস্তা (শেষ)' : '0 bags (empty)') : `${isBn ? toBnDigits(remainingBags) : remainingBags} বস্তা`}
                </strong>
                <span className="text-[8.5px] text-slate-500 block">গুদামে বাকি</span>
              </div>

              <div className="bg-slate-50 p-2 rounded-xl border border-slate-150">
                <span className="text-[9px] font-bold text-slate-400 block">{isBn ? '৩৫ দিন পর্যন্ত আরও লাগবে' : 'Needed to Harvest'}</span>
                <strong className="text-xs font-black text-rose-700 font-sans">
                  ~{isBn ? toBnDigits(remainingNeedBags) : remainingNeedBags} {isBn ? 'বস্তা' : 'bags'}
                </strong>
                <span className="text-[8.5px] text-slate-500 block">বাকি দিনগুলোর চাহিদা</span>
              </div>
            </div>

            {/* Explanation Note for Farmer */}
            <div className={`p-2.5 rounded-xl border text-[11px] font-bold leading-relaxed ${
              isStockEmpty 
                ? 'bg-rose-50 border-rose-200 text-rose-900' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-start gap-1.5">
                <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${isStockEmpty ? 'text-rose-600' : 'text-emerald-700'}`} />
                <p>
                  {isStockEmpty ? (
                    isBn 
                      ? `সতর্কতা: ${toBnDigits(count)}টি ব্রয়লার মুরগি ১ থেকে ৩২ দিন বয়সে স্বাভাবিক নিয়মে ২০–২২ বস্তা খাবার খেয়ে ফেলে। আপনার কেনা ১৫ বস্তা খাবার ইতিমধ্যেই সম্পূর্ণ শেষ হয়ে গেছে (গুদাম খালি)। ৩৫তম দিনে বিক্রির জন্য বাকি দিনগুলোতে আরও প্রায় ${toBnDigits(remainingNeedBags)} বস্তা খাবার কিনতে হবে।` 
                      : `Alert: ${count} broilers eat ~20-22 bags by age 32. The purchased 15 bags are finished. You need ~${remainingNeedBags} more bags to complete harvest at day 35.`
                  ) : (
                    isBn 
                      ? `বর্তমান মজুত (${toBnDigits(remainingBags)} বস্তা) দিয়ে আগামী দিনগুলো চলবে। ৩৫তম দিনে ব্যাচ সফলভাবে বিক্রির জন্য প্রস্তুতি বজায় রাখুন।` 
                      : `Current stock covers requirements. Maintain optimal hygiene and water balance until harvest.`
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 5-Week Feeding & Water Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-850 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-600" />
                {isBn ? 'বয়স ভিত্তিক সম্পূর্ণ চার্ট (১ থেকে ৩৫ দিন)' : 'Age Feeding & Water SOP Chart'}
              </span>
              <span className="text-[9.5px] text-slate-400 font-bold">Cobb 500 / Ross</span>
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
              {broilerSchedule.map((item, idx) => {
                const isCurrentWeek = age >= (idx * 7 + 1) && age <= ((idx + 1) * 7);
                return (
                  <div 
                    key={idx}
                    className={`p-2.5 transition-colors ${isCurrentWeek ? 'bg-amber-50/80 border-l-4 border-l-amber-500' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-slate-850">
                          {isBn ? item.weekBn : item.weekEn}
                        </span>
                        {isCurrentWeek && (
                          <span className="text-[8.5px] font-black bg-amber-500 text-white px-1.5 py-0.2 rounded-md animate-pulse">
                            {isBn ? 'বর্তমান সপ্তাহ' : 'CURRENT'}
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                        {item.feedType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10.5px] font-bold my-1 text-slate-700">
                      <div className="flex items-center gap-1">
                        <Wheat size={11} className="text-amber-600 shrink-0" />
                        <span>খাবার: {item.feedGrams} / পাখি</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets size={11} className="text-cyan-600 shrink-0" />
                        <span>পানি: {item.waterMl} / পাখি</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium">
                      💡 {isBn ? item.notesBn : 'Maintain proper ventilation and drinker hygiene.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Water Hygiene Guidelines */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
            <h5 className="text-[11px] font-black text-slate-800 flex items-center gap-1">
              <ThermometerSun size={13} className="text-orange-500" />
              <span>{isBn ? '💧 পানির স্বাস্থ্যসম্মত নিয়মাবলী:' : '💧 Water Best Practices:'}</span>
            </h5>
            <ul className="text-[10px] text-slate-600 space-y-1 font-medium list-disc list-inside">
              <li>{isBn ? 'গরমে দিনে প্রতি কেজি খাবারে ২.৫ থেকে ৩ লিটার পানি লাগে। দুপুরের আগেই ঠান্ডা পানি দিন।' : 'Broilers need 2.5-3x water in summer. Supply fresh cool water before noon.'}</li>
              <li>{isBn ? 'পানির পাত্র দিনে অন্তত ২ বার মাজুনি/ব্রাশ দিয়ে ধুয়ে পরিষ্কার রাখুন যাতে শেওলা না জমে।' : 'Scrub and clean drinkers twice daily to prevent biofilm/algae.'}</li>
              <li>{isBn ? 'তীব্র গরম ও হাঁপানোর সময় পানিতে ভিটামিন-সি অথবা গ্লুকোজ-স্যালাইন দিয়ে হিট স্ট্রোক রোধ করুন।' : 'Add Vitamin C or electrolytes during severe midday heat stress.'}</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>{isBn ? 'স্বয়ংক্রিয়ভাবে প্রতিদিন আপডেট হয়' : 'Auto-synced daily'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            {isBn ? 'ঠিক আছে' : 'Got it'}
          </button>
        </div>

      </div>
    </div>
  );
}
