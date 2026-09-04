import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Wheat, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  Scale,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export interface InsightMetricData {
  totalChicks: number;
  aliveBirds: number;
  totalMortality: number;
  mortalityRate: number;
  feedBagsPurchased: number;
  feedBagsUsed: number;
  feedStockRemainingBags: number;
  avgDailyFeedBags: number;
  daysOfFeedLeft: number;
  totalFeedCost: number;
  totalMedicineCost: number;
  totalChickCost: number;
  totalOtherExpenses: number;
  totalCost: number;
  totalSalesRevenue: number;
  netProfit: number;
  fcr?: number;
  previousFcr?: number;
  avgWeightKg?: number;
  batchAgeDays: number;
  farmType: 'poultry' | 'cattle' | 'fish';
}

interface SmartFarmInsightsCardProps {
  data: InsightMetricData;
  onOpenQuickLog?: () => void;
}

export default function SmartFarmInsightsCard({ data, onOpenQuickLog }: SmartFarmInsightsCardProps) {
  const { language } = useLanguage();

  const isBn = language === 'bn';

  // 1. Feed Cost Ratio
  const feedCostRatio = data.totalCost > 0 
    ? Math.round((data.totalFeedCost / data.totalCost) * 100) 
    : 0;

  // 2. Feed Stock Status
  const isFeedLow = data.daysOfFeedLeft > 0 && data.daysOfFeedLeft <= 3;
  const isFeedCritical = data.feedStockRemainingBags <= 1 && data.batchAgeDays > 5;

  // 3. Mortality Assessment
  const isHighMortality = data.mortalityRate > 4.5;
  const isModerateMortality = data.mortalityRate > 2.5 && data.mortalityRate <= 4.5;

  // 4. FCR comparison
  const fcrDiff = data.fcr && data.previousFcr ? Number((data.fcr - data.previousFcr).toFixed(2)) : null;

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-xs border border-slate-200/80 space-y-2.5">
      {/* Header - Click to toggle expand */}
      <button 
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold group-hover:bg-indigo-100 transition-colors">
            <Sparkles size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-850 leading-none">
                {isBn ? 'খামার ইনসাইটস ও বিশ্লেষণ' : 'Smart Farm Data Insights'}
              </h3>
              {(isFeedLow || isHighMortality) && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {isBn 
                ? (isExpanded ? 'গাণিতিক মূল্যায়ন ও সতর্কতা' : 'ক্লিক করে স্বাস্থ্য ও মজুত পূর্বাভাস দেখুন') 
                : (isExpanded ? 'Data assessment and warnings' : 'Click to view health & stock forecast')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {isBn ? (isExpanded ? 'সংক্ষেপ করুন' : 'বিস্তারিত') : (isExpanded ? 'Collapse' : 'Details')}
          </span>
          {isExpanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </div>
      </button>

      {/* Grid of 4 Insight Badges (Shown when expanded) */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 animate-fadeIn">
        
        {/* 1. Feed Inventory & Days Left Insight */}
        <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
          isFeedLow || isFeedCritical 
            ? 'bg-amber-50/80 border-amber-300 text-amber-950' 
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold flex items-center gap-1">
              <Wheat size={12} className={isFeedLow ? 'text-amber-700' : 'text-emerald-700'} />
              {isBn ? 'খাদ্য মজুত পূর্বাভাস' : 'Feed Stock Forecast'}
            </span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-white/70">
              {data.feedStockRemainingBags > 0 
                ? `${data.feedStockRemainingBags} ${isBn ? 'বস্তা বাকি' : 'bags left'}`
                : (isBn ? 'মজুত শূন্য' : 'No stock')}
            </span>
          </div>
          <p className="text-xs font-bold leading-relaxed">
            {data.daysOfFeedLeft > 0 ? (
              <>
                {isBn 
                  ? `বর্তমান খরচের হারে এই খাদ্য দিয়ে আর প্রায় ` 
                  : `At current usage, this feed will last approx `}
                <strong className={isFeedLow ? 'text-amber-800 underline' : 'text-emerald-800 underline'}>
                  {data.daysOfFeedLeft} {isBn ? 'দিন' : 'days'}
                </strong> {isBn ? 'চলবে।' : '.'}
              </>
            ) : (
              isBn ? 'খাদ্য মজুতের তথ্য নিয়মিত আপডেট রাখুন।' : 'Keep your feed stock logs updated.'
            )}
          </p>
          {isFeedLow && (
            <p className="text-[10px] font-bold text-amber-800 mt-1 flex items-center gap-1">
              <AlertTriangle size={11} className="shrink-0" />
              {isBn ? 'সতর্কতা: দ্রুত নতুন ফিড সংগ্রহের অর্ডার করুন।' : 'Warning: Reorder feed soon.'}
            </p>
          )}
        </div>

        {/* 2. Mortality Assessment */}
        <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
          isHighMortality 
            ? 'bg-red-50/80 border-red-300 text-red-950' 
            : isModerateMortality 
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold flex items-center gap-1">
              {isHighMortality ? <ShieldAlert size={12} className="text-red-600" /> : <CheckCircle2 size={12} className="text-emerald-600" />}
              {isBn ? 'স্বাস্থ্য ও মৃত্যুহার স্ট্যাটাস' : 'Health & Mortality Status'}
            </span>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
              isHighMortality ? 'bg-red-200 text-red-800' : 'bg-white/70 text-slate-700'
            }`}>
              {data.mortalityRate}% {isBn ? 'মৃত্যু' : 'mortality'}
            </span>
          </div>
          <p className="text-xs font-bold leading-relaxed">
            {isHighMortality ? (
              <span className="text-red-800">
                {isBn 
                  ? 'মৃত্যুহার স্বাভাবিক সীমার চেয়ে বেশি। লিটার, তাপমাত্রা ও ভেন্টিলেশন দ্রুত পরীক্ষা করুন।' 
                  : 'Mortality rate is higher than standard threshold. Inspect farm ventilation and hygiene.'}
              </span>
            ) : isModerateMortality ? (
              <span className="text-amber-800">
                {isBn 
                  ? 'মৃত্যুহার মধ্যম পর্যায়ে রয়েছে। নিবিড়ভাবে পাখির স্বাস্থ্য পর্যবেক্ষণ করুন।' 
                  : 'Mortality is moderate. Keep close monitor on bird health.'}
              </span>
            ) : (
              <span className="text-emerald-800">
                {isBn 
                  ? 'মৃত্যুহার চমৎকার নিয়ন্ত্রণে রয়েছে। ফার্মের বায়োসিকিউরিটি বজায় রাখুন।' 
                  : 'Flock mortality is strictly under healthy limits.'}
              </span>
            )}
          </p>
        </div>

        {/* 3. Feed Cost Ratio Insight */}
        <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <TrendingUp size={12} className="text-indigo-600" />
              {isBn ? 'খাদ্য খরচের অনুপাত' : 'Feed Cost Share'}
            </span>
            <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
              {feedCostRatio}% {isBn ? 'মোট খরচের' : 'of cost'}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 leading-relaxed">
            {feedCostRatio > 75 ? (
              <span className="text-amber-800">
                {isBn 
                  ? 'খাদ্য ব্যয় মোট খরচের ৭৫% ছাড়িয়েছে। ফিডার ড্রপিং ও অপচয় রোধে নজর দিন।' 
                  : 'Feed expense exceeds 75% of total cost. Watch out for feed spillage.'}
              </span>
            ) : (
              <span>
                {isBn 
                  ? `মোট ব্যয়ের মধ্যে খাদ্য বাবদ খরচ স্বাভাবিক মাত্রায় আছে (৳ ${data.totalFeedCost.toLocaleString()})।` 
                  : `Feed budget is well proportioned within total batch expenses.`}
              </span>
            )}
          </p>
        </div>

        {/* 4. Live FCR / Production Insight */}
        <div className="p-2.5 rounded-xl border bg-blue-50/60 border-blue-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
              <Scale size={12} className="text-blue-600" />
              {isBn ? 'এফসিআর (FCR) পারফরম্যান্স' : 'FCR Efficiency'}
            </span>
            {data.fcr ? (
              <span className="text-[9px] font-black text-blue-800 bg-white px-1.5 py-0.5 rounded-md shadow-2xs">
                FCR: {data.fcr.toFixed(2)}
              </span>
            ) : (
              <span className="text-[9px] font-bold text-slate-400">
                {isBn ? 'ওজন এন্ট্রি প্রয়োজন' : 'Weight needed'}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-blue-950 leading-relaxed">
            {data.fcr ? (
              <>
                {data.fcr <= 1.55 ? (
                  <span className="text-emerald-700">
                    {isBn ? 'চমৎকার এফসিআর! খাদ্য রূপান্তর দক্ষতা সর্বোচ্চ মানের।' : 'Outstanding FCR conversion!'}
                  </span>
                ) : data.fcr <= 1.75 ? (
                  <span className="text-blue-700">
                    {isBn ? 'এফসিআর সন্তোষজনক মানদণ্ডে রয়েছে।' : 'FCR is in normal expected range.'}
                  </span>
                ) : (
                  <span className="text-amber-800">
                    {isBn ? 'এফসিআর কিছুটা বেশি; পুষ্টি ও ব্রুডিং তাপমাত্রা চেক করুন।' : 'FCR is slightly high; review feeding routines.'}
                  </span>
                )}
                {fcrDiff !== null && (
                  <span className="block text-[10px] text-slate-600 mt-0.5">
                    {fcrDiff < 0 ? (
                      <span className="text-emerald-700 font-extrabold inline-flex items-center">
                        <ArrowDownRight size={11} className="inline mr-0.5" />
                        {isBn ? `আগের রেকর্ডের চেয়ে ${Math.abs(fcrDiff)} উন্নত` : `${Math.abs(fcrDiff)} better than previous`}
                      </span>
                    ) : fcrDiff > 0 ? (
                      <span className="text-amber-700 font-extrabold inline-flex items-center">
                        <ArrowUpRight size={11} className="inline mr-0.5" />
                        {isBn ? `আগের চেয়ে ${fcrDiff} বৃদ্ধি পেয়েছে` : `${fcrDiff} higher than previous`}
                      </span>
                    ) : null}
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-600">
                {isBn 
                  ? 'কুইক ডেইলি লগে পাখির গড় ওজন এন্ট্রি করলেই লাইভ FCR দেখতে পাবেন।' 
                  : 'Enter flock weight in Quick Log to compute real-time FCR.'}
              </span>
            )}
          </p>
        </div>

      </div>
      )}
    </div>
  );
}
