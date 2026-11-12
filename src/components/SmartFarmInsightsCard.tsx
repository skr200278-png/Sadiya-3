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
  ChevronUp,
  Droplets
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { toBnDigits } from '../utils/feedStockCalculations';
import SmartFeedWaterModal from './SmartFeedWaterModal';

export interface InsightMetricData {
  totalChicks: number;
  aliveBirds: number;
  totalMortality: number;
  mortalityRate: number;
  survivalRate?: number;
  feedBagsPurchased: number;
  feedBagsUsed: number;
  feedStockRemainingBags: number;
  feedConsumedKg?: number;
  avgDailyFeedBags: number;
  daysOfFeedLeft: number;
  feedForecastNote?: string;
  isFeedCoversEntireBatch?: boolean;
  totalFeedCost: number;
  totalMedicineCost: number;
  totalChickCost: number;
  totalOtherExpenses: number;
  totalCost: number;
  totalSalesRevenue: number;
  netProfit: number;
  avgWeightKg?: number;
  currentAvgWeightGram?: number;
  batchAgeDays: number;
  farmType: 'poultry' | 'cattle' | 'fish';
  species?: string;
  // Enhanced auto-estimation and water metrics
  isAutoCalculatedFeed?: boolean;
  dailyFeedKg?: number;
  dailyWaterLitresNormal?: number;
  dailyWaterLitresSummer?: number;
  recommendedDrinkersCount?: number;
  totalBatchTargetFeedBags?: number;
  remainingFeedNeededToHarvestBags?: number;
  targetHarvestAgeDays?: number;
}

import { Link } from 'react-router-dom';

export interface SmartFarmInsightsCardProps {
  data: InsightMetricData;
  onOpenQuickLog?: () => void;
  batchName?: string;
  batchAgeDays?: number;
  batchId?: string;
  defaultExpanded?: boolean;
  showQuickLinks?: boolean;
}

export default function SmartFarmInsightsCard({ 
  data, 
  onOpenQuickLog, 
  batchName, 
  batchAgeDays, 
  batchId, 
  defaultExpanded = true, 
  showQuickLinks = true 
}: SmartFarmInsightsCardProps) {
  const { language } = useLanguage();

  const isBn = language === 'bn';

  // 1. Feed Cost Ratio
  const feedCostRatio = data.totalCost > 0 
    ? Math.round((data.totalFeedCost / data.totalCost) * 100) 
    : 0;

  // 2. Feed Stock Status
  const isFeedEmpty = data.feedStockRemainingBags <= 0;
  const isFeedLow = !isFeedEmpty && data.daysOfFeedLeft > 0 && data.daysOfFeedLeft <= 3;
  const isFeedCritical = isFeedEmpty || (data.feedStockRemainingBags <= 1 && data.batchAgeDays > 5);

  // 3. Mortality Assessment
  const isHighMortality = data.mortalityRate > 4.5;
  const isModerateMortality = data.mortalityRate > 2.5 && data.mortalityRate <= 4.5;

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isFeedWaterModalOpen, setIsFeedWaterModalOpen] = useState(false);

  const dailyFeedKg = data.dailyFeedKg || Math.round(data.avgDailyFeedBags * 50) || 66;
  const dailyWaterNormal = data.dailyWaterLitresNormal || Math.round(dailyFeedKg * 2.0);
  const dailyWaterSummer = data.dailyWaterLitresSummer || Math.round(dailyFeedKg * 2.5);
  const drinkersCount = data.recommendedDrinkersCount || Math.max(1, Math.ceil((data.aliveBirds || data.totalChicks || 100) / 50));

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-2xs border border-slate-200/90 space-y-2.5">
      {/* Header - Click to toggle expand */}
      <button 
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold group-hover:bg-indigo-100 transition-colors shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black text-slate-850 leading-none">
                {isBn ? 'খামার ইনসাইটস ও বিশ্লেষণ' : 'Smart Farm Data Insights'}
              </h3>
              {batchName && (
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 truncate max-w-[120px]">
                  {batchName} {batchAgeDays ? `(${isBn ? toBnDigits(batchAgeDays) : batchAgeDays}d)` : ''}
                </span>
              )}
              {(isFeedEmpty || isFeedLow || isHighMortality) && (
                <span className={`w-2 h-2 rounded-full ${isFeedEmpty ? 'bg-rose-600' : 'bg-amber-500'} animate-ping inline-block`} />
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
              {isBn 
                ? (isExpanded ? 'গাণিতিক মূল্যায়ন ও সতর্কতা' : `খাদ্য মজুত: ${isFeedEmpty ? 'মজুত শূন্য' : `${toBnDigits(data.feedStockRemainingBags)} বস্তা`} • ক্লিক করে বিস্তারিত দেখুন`) 
                : (isExpanded ? 'Data assessment and warnings' : `Stock: ${data.feedStockRemainingBags} bags • Click to view details`)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Quick Stock Indicator Badge on collapsed view */}
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
            isFeedEmpty 
              ? 'bg-rose-50 text-rose-700 border-rose-200' 
              : isFeedLow 
              ? 'bg-amber-50 text-amber-700 border-amber-200' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            🌾 {isBn ? `${toBnDigits(data.feedStockRemainingBags)}বাকি` : `${data.feedStockRemainingBags} left`}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
            {isBn ? (isExpanded ? 'সংক্ষেপ' : 'বিস্তারিত') : (isExpanded ? 'Hide' : 'Show')}
          </span>
          {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {/* Grid of Insight Badges (Shown when expanded) */}
      {isExpanded && (
        <div className="space-y-2.5 pt-2 border-t border-slate-100 animate-fadeIn">

          {/* 💧 Live Today's Feed & Water Demand Quick Banner */}
          <div 
            onClick={() => setIsFeedWaterModalOpen(true)}
            className="bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-emerald-500/10 border border-amber-300/80 rounded-2xl p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:border-amber-400 transition-all shadow-2xs active:scale-99"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Droplets size={16} className="text-cyan-100" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-slate-850">
                    {isBn ? 'আজকের খাবার ও সুপেয় পানির চাহিদা' : "Today's Feed & Water Demand"}
                  </span>
                  <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {isBn ? 'স্বয়ংক্রিয় হিসাব' : 'AUTO'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10.5px] font-bold text-slate-700 mt-0.5 truncate">
                  <span className="text-amber-900">
                    🌾 খাবার: {isBn ? toBnDigits(dailyFeedKg) : dailyFeedKg} কেজি (~{isBn ? toBnDigits((dailyFeedKg / 50).toFixed(1)) : (dailyFeedKg / 50).toFixed(1)} বস্তা)
                  </span>
                  <span>•</span>
                  <span className="text-cyan-800">
                    💧 পানি: {isBn ? toBnDigits(dailyWaterNormal) : dailyWaterNormal} লিটার
                  </span>
                  <span className="text-slate-400 hidden xs:inline">•</span>
                  <span className="text-slate-500 hidden xs:inline">
                    পাত্র: {isBn ? toBnDigits(drinkersCount) : drinkersCount}টি
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black text-cyan-950 bg-white border border-cyan-200 px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-0.5 shadow-2xs">
              <span>{isBn ? 'চার্ট ও গাইড' : 'View'}</span>
              <span>➜</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        
        {/* 1. Feed Inventory & Days Left Insight */}
        <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
          isFeedEmpty
            ? 'bg-rose-50/90 border-rose-300 text-rose-950'
            : isFeedLow || isFeedCritical 
            ? 'bg-amber-50/80 border-amber-300 text-amber-950' 
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold flex items-center gap-1">
              <Wheat size={12} className={isFeedEmpty ? 'text-rose-700' : isFeedLow ? 'text-amber-700' : 'text-emerald-700'} />
              {isBn ? 'খাদ্য মজুত পূর্বাভাস' : 'Feed Stock Forecast'}
            </span>
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
              isFeedEmpty
                ? 'bg-rose-600 text-white shadow-xs'
                : isFeedLow
                ? 'bg-amber-600 text-white'
                : 'bg-white/70 text-slate-800'
            }`}>
              {data.feedStockRemainingBags > 0 
                ? `${isBn ? toBnDigits(data.feedStockRemainingBags) : data.feedStockRemainingBags} ${isBn ? 'বস্তা বাকি' : 'bags left'}`
                : (isBn ? 'মজুত শূন্য (০ বস্তা)' : 'No stock (0 bags)')}
            </span>
          </div>
          <p className="text-xs font-bold leading-relaxed">
            {isFeedEmpty ? (
              <span className="text-rose-800 font-extrabold flex items-center gap-1">
                <AlertTriangle size={12} className="shrink-0 text-rose-600" />
                {isBn 
                  ? 'খাবার শেষ! স্টকে কোনো খাদ্য অবশিষ্ট নেই (০ দিন চলবে)। মুরগিকে সুস্থ রাখতে অবিলম্বে নতুন খাদ্য কিনুন।' 
                  : 'Out of feed! No stock remaining (0 days left). Reorder feed immediately.'}
              </span>
            ) : data.feedForecastNote ? (
              <span className={data.isFeedCoversEntireBatch ? 'text-emerald-900 font-bold' : (isFeedLow ? 'text-amber-900 font-bold' : 'text-slate-800 font-bold')}>
                {isBn ? toBnDigits(data.feedForecastNote) : data.feedForecastNote}{!(data.feedForecastNote.endsWith('।') || data.feedForecastNote.endsWith('.')) ? (isBn ? '।' : '.') : ''}
              </span>
            ) : data.daysOfFeedLeft > 0 ? (
              <>
                {isBn 
                  ? `বর্তমান খরচের হারে এই খাদ্য দিয়ে আর প্রায় ` 
                  : `At current usage, this feed will last approx `}
                <strong className={isFeedLow ? 'text-amber-800 underline' : 'text-emerald-800 underline'}>
                  {isBn ? toBnDigits(data.daysOfFeedLeft) : data.daysOfFeedLeft} {isBn ? 'দিন' : 'days'}
                </strong> {isBn ? 'চলবে।' : '.'}
              </>
            ) : (
              isBn ? 'খাদ্য মজুতের তথ্য নিয়মিত আপডেট রাখুন।' : 'Keep your feed stock logs updated.'
            )}
          </p>
          {!isFeedEmpty && isFeedLow && (
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
              {isBn ? toBnDigits(data.mortalityRate) : data.mortalityRate}% {isBn ? 'মৃত্যু' : 'mortality'}
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
              {isBn ? toBnDigits(feedCostRatio) : feedCostRatio}% {isBn ? 'মোট খরচের' : 'of cost'}
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
                  ? `মোট ব্যয়ের মধ্যে খাদ্য বাবদ খরচ স্বাভাবিক মাত্রায় আছে (৳ ${toBnDigits(data.totalFeedCost.toLocaleString())})।` 
                  : `Feed budget is well proportioned within total batch expenses.`}
              </span>
            )}
          </p>
        </div>
        </div>
        </div>
      )}

      {/* Quick Navigation Footer */}
      {showQuickLinks && isExpanded && (
        <div className="flex items-center justify-between pt-1 text-[10.5px] font-bold border-t border-slate-150 gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsFeedWaterModalOpen(true)}
              className="text-cyan-950 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-xl border border-cyan-200/90 flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <Droplets size={12} className="text-cyan-700" />
              <span>{isBn ? '💧 পানি ও খাদ্যের সম্পূর্ণ চার্ট' : '💧 Feed & Water Chart'}</span>
            </button>

            <Link 
              to={`/feed${batchId ? `?batchId=${batchId}` : ''}`}
              className="text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-200 flex items-center gap-1 transition-colors active:scale-98 shadow-2xs"
            >
              <span>🌾 {isBn ? 'খাবার স্টক' : 'Feed Stock'}</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <Link 
            to={`/reports${batchId ? `?batchId=${batchId}` : ''}`}
            className="text-indigo-900 hover:text-indigo-950 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl border border-indigo-200 flex items-center gap-1 transition-colors active:scale-98 shadow-2xs ml-auto"
          >
            <span>📊 {isBn ? 'রিপোর্ট' : 'Reports'}</span>
            <ArrowUpRight size={12} />
          </Link>
        </div>
      )}

      {/* Interactive Smart Feed & Water Full Modal */}
      <SmartFeedWaterModal 
        isOpen={isFeedWaterModalOpen}
        onClose={() => setIsFeedWaterModalOpen(false)}
        data={data}
        batchName={batchName}
        batchAgeDays={batchAgeDays}
      />
    </div>
  );
}
