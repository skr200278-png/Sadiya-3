import React, { useState } from 'react';
import { 
  GitCompare, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Wheat, 
  DollarSign, 
  Scale, 
  Calendar 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { DemoBatch } from '../utils/demoStore';

export interface BatchSummaryStats {
  batch?: any;
  batchId?: string;
  batchName?: string;
  farmType?: string;
  status?: string;
  startDate?: string;
  ageDays?: number;
  totalChicks: number;
  aliveCount: number;
  mortalityCount: number;
  mortalityRate: number;
  feedBags: number;
  feedCost: number;
  medicineCost: number;
  chickCost?: number;
  otherCost: number;
  totalCost: number;
  costPerBird: number;
  salesRevenue: number;
  netProfit: number;
  profitPerBird: number;
  fcr?: number;
  avgWeightKg?: number;
  [key: string]: any;
}

interface BatchComparisonCardProps {
  batches: any[];
  getBatchStats: (batchId: string) => BatchSummaryStats | Promise<BatchSummaryStats | null> | null;
}

export default function BatchComparisonCard({ batches, getBatchStats }: BatchComparisonCardProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [batchId1, setBatchId1] = useState<string>(batches[0]?.id || '');
  const [batchId2, setBatchId2] = useState<string>(batches[1]?.id || batches[0]?.id || '');
  const [stats1, setStats1] = useState<BatchSummaryStats | null>(null);
  const [stats2, setStats2] = useState<BatchSummaryStats | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    let active = true;
    const loadStats = async () => {
      setLoading(true);
      try {
        const res1 = batchId1 ? await Promise.resolve(getBatchStats(batchId1)) : null;
        const res2 = batchId2 ? await Promise.resolve(getBatchStats(batchId2)) : null;
        if (active) {
          setStats1(res1);
          setStats2(res2);
        }
      } catch (err) {
        console.warn('Error loading batch comparison stats:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStats();
    return () => { active = false; };
  }, [batchId1, batchId2, getBatchStats]);

  if (batches.length < 2) {
    return (
      <div className="bg-white rounded-2xl p-5 text-center border border-slate-200 text-slate-500">
        <GitCompare size={28} className="mx-auto text-slate-300 mb-2" />
        <p className="text-xs font-bold text-slate-700">
          {isBn ? 'ব্যাচ তুলনা করার জন্য কমপক্ষে ২টি ব্যাচ তৈরি থাকতে হবে।' : 'At least 2 batches are needed for comparison.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-200/80 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <GitCompare size={16} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-850 leading-none">
              {isBn ? 'ব্যাচ পারফরম্যান্স তুলনা' : 'Batch Performance Comparison'}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {isBn ? 'দুটি ব্যাচের FCR, খরচ, মৃত্যুহার ও লাভ পাশাপাশি দেখুন' : 'Compare FCR, cost, mortality and net profit side-by-side'}
            </p>
          </div>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
            {isBn ? '১ম ব্যাচ' : 'Batch 1'}
          </label>
          <select
            value={batchId1}
            onChange={(e) => setBatchId1(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.batchName}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
            {isBn ? '২য় ব্যাচ' : 'Batch 2'}
          </label>
          <select
            value={batchId2}
            onChange={(e) => setBatchId2(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.batchName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Grid Table */}
      {stats1 && stats2 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          
          {/* Header Row */}
          <div className="grid grid-cols-3 bg-slate-100 p-2 font-black text-slate-700 border-b border-slate-200 text-center">
            <span className="text-left">{isBn ? 'সূচক / বিষয়' : 'Metric'}</span>
            <span className="text-emerald-800 truncate px-1">{stats1.batch.batchName}</span>
            <span className="text-teal-800 truncate px-1">{stats2.batch.batchName}</span>
          </div>

          {/* Row 1: Total Chicks */}
          <div className="grid grid-cols-3 p-2 border-b border-slate-100 text-center items-center">
            <span className="text-left font-bold text-slate-600">{isBn ? 'শুরুর সংখ্যা' : 'Chicks Count'}</span>
            <span className="font-extrabold text-slate-800">{stats1.totalChicks}</span>
            <span className="font-extrabold text-slate-800">{stats2.totalChicks}</span>
          </div>

          {/* Row 2: Mortality Rate */}
          <div className="grid grid-cols-3 p-2 border-b border-slate-100 text-center items-center">
            <span className="text-left font-bold text-slate-600">{isBn ? 'মৃত্যুহার (%)' : 'Mortality (%)'}</span>
            <span className={`font-extrabold ${stats1.mortalityRate <= stats2.mortalityRate ? 'text-emerald-700' : 'text-red-600'}`}>
              {stats1.mortalityRate}% ({stats1.mortalityCount} টি)
            </span>
            <span className={`font-extrabold ${stats2.mortalityRate <= stats1.mortalityRate ? 'text-emerald-700' : 'text-red-600'}`}>
              {stats2.mortalityRate}% ({stats2.mortalityCount} টি)
            </span>
          </div>

          {/* Row 3: Feed Used */}
          <div className="grid grid-cols-3 p-2 border-b border-slate-100 text-center items-center">
            <span className="text-left font-bold text-slate-600">{isBn ? 'ব্যবহৃত খাদ্য' : 'Feed Used'}</span>
            <span className="font-bold text-slate-800">{stats1.feedBags} {isBn ? 'বস্তা' : 'bags'}</span>
            <span className="font-bold text-slate-800">{stats2.feedBags} {isBn ? 'বস্তা' : 'bags'}</span>
          </div>

          {/* Row 4: Total Production Cost */}
          <div className="grid grid-cols-3 p-2 border-b border-slate-100 text-center items-center bg-slate-50/50">
            <span className="text-left font-bold text-slate-600">{isBn ? 'মোট ব্যয়' : 'Total Cost'}</span>
            <span className="font-black text-slate-800">৳ {stats1.totalCost.toLocaleString()}</span>
            <span className="font-black text-slate-800">৳ {stats2.totalCost.toLocaleString()}</span>
          </div>

          {/* Row 5: Cost per bird */}
          <div className="grid grid-cols-3 p-2 border-b border-slate-100 text-center items-center">
            <span className="text-left font-bold text-slate-600">{isBn ? 'প্রতি পিস খরচ' : 'Cost/Bird'}</span>
            <span className={`font-extrabold ${stats1.costPerBird <= stats2.costPerBird ? 'text-emerald-700' : 'text-slate-700'}`}>
              ৳ {stats1.costPerBird.toFixed(1)}
            </span>
            <span className={`font-extrabold ${stats2.costPerBird <= stats1.costPerBird ? 'text-emerald-700' : 'text-slate-700'}`}>
              ৳ {stats2.costPerBird.toFixed(1)}
            </span>
          </div>

          {/* Row 6: Sales Revenue */}
          <div className="grid grid-cols-3 p-2 border-b border-slate-100 text-center items-center">
            <span className="text-left font-bold text-slate-600">{isBn ? 'মোট বিক্রয়' : 'Sales Revenue'}</span>
            <span className="font-black text-emerald-700">৳ {stats1.salesRevenue.toLocaleString()}</span>
            <span className="font-black text-emerald-700">৳ {stats2.salesRevenue.toLocaleString()}</span>
          </div>

          {/* Row 7: Net Profit / Loss */}
          <div className="grid grid-cols-3 p-2 bg-emerald-50/60 font-black text-center items-center border-b border-emerald-100">
            <span className="text-left font-extrabold text-emerald-950">{isBn ? 'নিট লাভ / ক্ষতি' : 'Net Profit'}</span>
            <span className={stats1.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}>
              ৳ {stats1.netProfit.toLocaleString()}
            </span>
            <span className={stats2.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}>
              ৳ {stats2.netProfit.toLocaleString()}
            </span>
          </div>

          {/* Row 8: FCR */}
          <div className="grid grid-cols-3 p-2 text-center items-center">
            <span className="text-left font-bold text-slate-600">{isBn ? 'এফসিআর (FCR)' : 'FCR'}</span>
            <span className="font-black text-indigo-700">{stats1.fcr ? stats1.fcr.toFixed(2) : '--'}</span>
            <span className="font-black text-indigo-700">{stats2.fcr ? stats2.fcr.toFixed(2) : '--'}</span>
          </div>

        </div>
      )}

      {/* Summary Winner Badge */}
      {stats1 && stats2 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2">
          <Award size={18} className="text-emerald-700 shrink-0" />
          <p className="text-xs font-bold text-emerald-950 leading-tight">
            {stats1.netProfit > stats2.netProfit ? (
              <>
                <strong>{stats1.batch.batchName}</strong> {isBn ? 'ব্যাচে তুলনামূলক বেশি নিট মুনাফা অর্জিত হয়েছে (৳ ' : 'produced higher net profit (৳ '}
                {stats1.netProfit.toLocaleString()} {isBn ? 'টাকা)।' : ').'}
              </>
            ) : stats2.netProfit > stats1.netProfit ? (
              <>
                <strong>{stats2.batch.batchName}</strong> {isBn ? 'ব্যাচে তুলনামূলক বেশি নিট মুনাফা অর্জিত হয়েছে (৳ ' : 'produced higher net profit (৳ '}
                {stats2.netProfit.toLocaleString()} {isBn ? 'টাকা)।' : ').'}
              </>
            ) : (
              isBn ? 'উভয় ব্যাচের আর্থিক ফলাফল সমপর্যায়ের।' : 'Both batches yield comparable financial results.'
            )}
          </p>
        </div>
      )}
    </div>
  );
}
