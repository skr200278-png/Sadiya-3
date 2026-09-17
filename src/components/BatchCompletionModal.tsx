import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  X, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Archive, 
  Scale, 
  Package, 
  Pill, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

const calculateEpef = (
  livabilityPercent: number,
  avgBirdWeightGram: number,
  fcr: number,
  ageDays: number
): number => {
  if (fcr <= 0 || ageDays <= 0) return 0;
  const avgWeightKg = avgBirdWeightGram / 1000;
  return Math.round(((livabilityPercent * avgWeightKg) / (ageDays * fcr)) * 100);
};

export interface BatchClosureReport {
  completedAt: string;
  endDate: string;
  totalChicks: number;
  finalSoldQty: number;
  mortalityCount: number;
  mortalityPercent: number;
  finalSoldWeightKg: number;
  avgBirdWeightKg: number;
  totalSalesAmount: number;
  chickCost: number;
  feedCost: number;
  medCost: number;
  otherCost: number;
  totalCost: number;
  netProfit: number;
  profitPerBird: number;
  commercialFcr: number;
  epefScore: number;
  feedSettlementAction: 'returned_to_stock' | 'written_off' | 'none';
  returnedFeedBags: number;
  returnedFeedKg: number;
  settlementNotes: string;
}

interface BatchCompletionModalProps {
  batch: any;
  isBn?: boolean;
  onClose: () => void;
  onConfirmComplete: (report: BatchClosureReport) => Promise<void>;
  initialFinancials?: {
    totalSales: number;
    feedCost: number;
    medCost: number;
    otherCost: number;
    chickCost: number;
    mortalityCount?: number;
    feedConsumedKg?: number;
  };
}

export const BatchCompletionModal: React.FC<BatchCompletionModalProps> = ({
  batch,
  isBn = true,
  onClose,
  onConfirmComplete,
  initialFinancials
}) => {
  const totalChicks = Number(batch.totalChicks || batch.initialQuantity || 0);
  const costPerChick = Number(batch.costPerChick || 0);
  const calcChickCost = initialFinancials?.chickCost ?? (totalChicks * costPerChick);

  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [soldQty, setSoldQty] = useState<number>(() => {
    const mort = initialFinancials?.mortalityCount ?? 0;
    return Math.max(0, totalChicks - mort);
  });
  const [totalSoldWeightKg, setTotalSoldWeightKg] = useState<number>(() => {
    const defaultQty = Math.max(0, totalChicks - (initialFinancials?.mortalityCount ?? 0));
    return defaultQty > 0 ? Math.round(defaultQty * 2.0) : 0;
  });
  const [salesAmount, setSalesAmount] = useState<number>(() => initialFinancials?.totalSales || 0);

  // Feed & Inventory Settlement
  const [feedSettlementAction, setFeedSettlementAction] = useState<'returned_to_stock' | 'written_off' | 'none'>('returned_to_stock');
  const [remainingFeedBags, setRemainingFeedBags] = useState<number>(0);
  const [remainingFeedKg, setRemainingFeedKg] = useState<number>(0);
  const [settlementNotes, setSettlementNotes] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto calculate average weight
  const avgBirdWeightKg = soldQty > 0 ? (totalSoldWeightKg / soldQty) : 0;

  // Costs
  const feedCost = initialFinancials?.feedCost || 0;
  const medCost = initialFinancials?.medCost || 0;
  const otherCost = initialFinancials?.otherCost || 0;
  const totalCost = calcChickCost + feedCost + medCost + otherCost;

  // Net Profit
  const netProfit = salesAmount - totalCost;
  const profitPerBird = soldQty > 0 ? (netProfit / soldQty) : 0;

  // Commercial FCR
  const totalFeedKg = initialFinancials?.feedConsumedKg || 0;
  const commercialFcr = totalSoldWeightKg > 0 && totalFeedKg > 0 
    ? Number((totalFeedKg / totalSoldWeightKg).toFixed(2)) 
    : 0;

  // Mortality & EPEF
  const finalMortality = Math.max(0, totalChicks - soldQty);
  const livabilityPercent = totalChicks > 0 ? ((soldQty / totalChicks) * 100) : 100;
  
  // Calculate flock age at completion
  const startMs = new Date(batch.startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const batchAgeDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));

  const epefScore = (commercialFcr > 0 && batchAgeDays > 0)
    ? calculateEpef(livabilityPercent, avgBirdWeightKg * 1000, commercialFcr, batchAgeDays)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const report: BatchClosureReport = {
        completedAt: new Date().toISOString(),
        endDate,
        totalChicks,
        finalSoldQty: Number(soldQty),
        mortalityCount: finalMortality,
        mortalityPercent: totalChicks > 0 ? Number(((finalMortality / totalChicks) * 100).toFixed(1)) : 0,
        finalSoldWeightKg: Number(totalSoldWeightKg),
        avgBirdWeightKg: Number(avgBirdWeightKg.toFixed(3)),
        totalSalesAmount: Number(salesAmount),
        chickCost: calcChickCost,
        feedCost,
        medCost,
        otherCost,
        totalCost,
        netProfit,
        profitPerBird: Number(profitPerBird.toFixed(1)),
        commercialFcr,
        epefScore,
        feedSettlementAction,
        returnedFeedBags: Number(remainingFeedBags),
        returnedFeedKg: Number(remainingFeedKg || (remainingFeedBags * 50)),
        settlementNotes: settlementNotes.trim()
      };

      await onConfirmComplete(report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-purple-200 my-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-150 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
              <Archive size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 uppercase">
                  {isBn ? 'ব্যাচ সমাপ্তি ও স্টক নিষ্পত্তি' : 'Batch Completion & Settlement'}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {batch.batchName}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                {isBn ? 'ব্যাচ আনুষ্ঠানিক সমাপ্তি ও সংরক্ষণ রিপোর্ট' : 'Official Batch Closure & Archive'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Final Harvest & Sales Input */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3">
            <h3 className="font-black text-xs text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
              <Scale size={14} className="text-purple-700" />
              <span>{isBn ? '১. চূড়ান্ত বিক্রয় ও উৎপাদন তথ্য' : '1. Final Sales & Harvest Yield'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  📅 {isBn ? 'সমাপ্তির তারিখ' : 'Completion Date'}
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  🐔 {isBn ? 'মোট বিক্রিত সংখ্যা (পিস)' : 'Sold Qty (Birds)'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={soldQty}
                  onChange={(e) => setSoldQty(Number(e.target.value))}
                  className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  ⚖️ {isBn ? 'মোট বিক্রিত ওজন (কেজি)' : 'Total Weight (KG)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={totalSoldWeightKg}
                  onChange={(e) => setTotalSoldWeightKg(Number(e.target.value))}
                  className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  💰 {isBn ? 'মোট বিক্রয় মূল্য (৳)' : 'Total Sales (BDT)'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={salesAmount}
                  onChange={(e) => setSalesAmount(Number(e.target.value))}
                  className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-emerald-700 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Quick Stats Tag */}
            <div className="flex items-center gap-3 text-xs font-bold text-purple-900 pt-1 border-t border-purple-200/60 flex-wrap">
              <span>{isBn ? 'গড় ওজন:' : 'Avg Weight:'} <strong>{avgBirdWeightKg.toFixed(2)} {isBn ? 'কেজি' : 'kg'} ({(avgBirdWeightKg * 1000).toFixed(0)} gm)</strong></span>
              <span>•</span>
              <span>{isBn ? 'মৃত্যু:' : 'Mortality:'} <strong>{finalMortality} {isBn ? 'টি' : 'birds'} ({totalChicks > 0 ? ((finalMortality/totalChicks)*100).toFixed(1) : 0}%)</strong></span>
              <span>•</span>
              <span>{isBn ? 'বয়স:' : 'Age:'} <strong>{batchAgeDays} {isBn ? 'দিন' : 'Days'}</strong></span>
            </div>
          </div>

          {/* Section 2: Remaining Feed & Medicine Settlement */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
            <h3 className="font-black text-xs text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
              <Package size={14} className="text-amber-700" />
              <span>{isBn ? '২. অবশিষ্ট খাদ্য ও ঔষধ স্টক নিষ্পত্তি (Settlement)' : '2. Remaining Feed & Medicine Settlement'}</span>
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800">
                {isBn ? 'এই ব্যাচে কি কোনো অব্যবহৃত খাদ্য বা ঔষধ অবশিষ্ট রয়ে গেছে?' : 'Is there any unused feed or medicine left from this batch?'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  feedSettlementAction === 'returned_to_stock'
                    ? 'bg-amber-100/80 border-amber-400 text-amber-950 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="settlementAction"
                    checked={feedSettlementAction === 'returned_to_stock'}
                    onChange={() => setFeedSettlementAction('returned_to_stock')}
                    className="mt-0.5 text-amber-600"
                  />
                  <div className="text-xs font-bold leading-tight">
                    <span>{isBn ? 'গুদামে ফেরত দিন' : 'Return to Main Stock'}</span>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      {isBn ? 'অবশিষ্ট খাদ্য মূল ইনভেন্টরিতে জমা হবে' : 'Adds back to farm store'}
                    </p>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  feedSettlementAction === 'written_off'
                    ? 'bg-amber-100/80 border-amber-400 text-amber-950 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="settlementAction"
                    checked={feedSettlementAction === 'written_off'}
                    onChange={() => setFeedSettlementAction('written_off')}
                    className="mt-0.5 text-amber-600"
                  />
                  <div className="text-xs font-bold leading-tight">
                    <span>{isBn ? 'নষ্ট / বাতিল' : 'Damaged / Write-off'}</span>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      {isBn ? 'নষ্ট হিসেবে হিসাব থেকে বাদ পড়বে' : 'Recorded as wasted'}
                    </p>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  feedSettlementAction === 'none'
                    ? 'bg-amber-100/80 border-amber-400 text-amber-950 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="settlementAction"
                    checked={feedSettlementAction === 'none'}
                    onChange={() => setFeedSettlementAction('none')}
                    className="mt-0.5 text-amber-600"
                  />
                  <div className="text-xs font-bold leading-tight">
                    <span>{isBn ? 'সব খাওয়া হয়েছে' : 'Nil / All Consumed'}</span>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      {isBn ? 'কোনো খাবার বা ঔষধ উদ্বৃত্ত নেই' : 'No feed left over'}
                    </p>
                  </div>
                </label>
              </div>

              {feedSettlementAction === 'returned_to_stock' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 animate-fadeIn">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      📦 {isBn ? 'ফেরত দেওয়ার বস্তা সংখ্যা:' : 'Returned Feed (Bags):'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g. 5"
                      value={remainingFeedBags || ''}
                      onChange={(e) => {
                        const bags = Number(e.target.value);
                        setRemainingFeedBags(bags);
                        setRemainingFeedKg(bags * 50);
                      }}
                      className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      ⚖️ {isBn ? 'মোট ফেরত ওজন (কেজি):' : 'Returned Feed (KG):'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 250"
                      value={remainingFeedKg || ''}
                      onChange={(e) => setRemainingFeedKg(Number(e.target.value))}
                      className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Final Scorecard Preview */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                {isBn ? '৩. চূড়ান্ত আর্থিক ও পারফরম্যান্স ফলাফল' : '3. Final Financial & Efficiency Scorecard'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {netProfit >= 0 
                  ? (isBn ? `৳ ${netProfit.toLocaleString()} লাভ` : `+৳ ${netProfit.toLocaleString()} Profit`)
                  : (isBn ? `৳ ${Math.abs(netProfit).toLocaleString()} লোকসান` : `-৳ ${Math.abs(netProfit).toLocaleString()} Loss`)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px] block">{isBn ? 'মোট বিক্রয়' : 'Total Revenue'}</span>
                <span className="font-black text-emerald-400 text-sm">৳ {salesAmount.toLocaleString()}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px] block">{isBn ? 'মোট ব্যয়' : 'Total Cost'}</span>
                <span className="font-black text-rose-400 text-sm">৳ {totalCost.toLocaleString()}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px] block">{isBn ? 'প্রতি পাখিতে লাভ' : 'Profit/Bird'}</span>
                <span className={`font-black text-sm ${profitPerBird >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ৳ {profitPerBird.toFixed(1)}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px] block">{isBn ? 'FCR ও EPEF' : 'FCR / EPEF'}</span>
                <span className="font-black text-amber-400 text-sm">
                  {commercialFcr > 0 ? commercialFcr.toFixed(2) : '-'} | {epefScore > 0 ? epefScore.toFixed(0) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: 15-Day Auto-Deletion & Backup Warning Notice */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <AlertCircle size={18} />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-black text-amber-900 flex items-center gap-1.5">
                <span>{isBn ? '⚠️ ব্যাচ সমাপ্তির গুরুত্বপূর্ণ নোটিশ ও স্বয়ংক্রিয় মুছে যাওয়ার সতর্কতা' : '⚠️ Important Notice: 15-Day Lifecycle & Auto-Deletion'}</span>
              </h4>
              <p className="text-amber-900/90 font-medium leading-relaxed">
                {isBn 
                  ? 'ব্যাচ সমাপ্ত করার সাথে সাথেই এই ব্যাচে নতুন কোনো খাবার, ওষুধ, বা খরচ এন্ট্রি সম্পূর্ণ বন্ধ (লক) হয়ে যাবে। সমাপ্তির পরবর্তী ১৫ দিনের মধ্যে এই ব্যাচ ও সংশ্লিষ্ট ডাটা স্বয়ংক্রিয়ভাবে মুছে যাবে। অতএব সমাপ্তির আগে বা ১৫ দিনের মধ্যে অবশ্যই ব্যাচের হিসাব ডাউনলোড / সেভ করে নিন।'
                  : 'Once completed, this batch will be permanently locked against new feed, medicine, or expense entries. All associated data will be automatically cleaned up after 15 days. Please ensure you download and backup your records.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>{isBn ? 'সমাপ্তির পর ১৫ দিন রিপোর্ট ডাউনলোড করা যাবে' : 'Download report available for 15 days'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                <span>
                  {isSubmitting 
                    ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') 
                    : (isBn ? 'হ্যাঁ, ব্যাচটি আনুষ্ঠানিকভাবে সমাপ্ত ও সংরক্ষণ করুন' : 'Confirm Complete & Archive')}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
