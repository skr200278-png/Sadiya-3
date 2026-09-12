import React from 'react';
import { X, CheckCircle2, AlertTriangle, Scale, Info, Award } from 'lucide-react';
import { ScientificFcrResult } from '../utils/fcrCalculations';

interface FcrBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  batchName: string;
  ageDays: number;
  totalHoused: number;
  mortalityCount: number;
  feedConsumedKg: number;
  currentWeightGram: number;
  stdFcr: number;
  metrics: ScientificFcrResult;
}

export default function FcrBreakdownModal({
  isOpen,
  onClose,
  language,
  batchName,
  ageDays,
  totalHoused,
  mortalityCount,
  feedConsumedKg,
  currentWeightGram,
  stdFcr,
  metrics
}: FcrBreakdownModalProps) {
  if (!isOpen) return null;

  const isBn = language === 'bn';
  const fcrDiff = Number((metrics.actualNetFcr - stdFcr).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
              <Scale size={20} />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">
                {isBn ? 'FCR ও মাংস বৃদ্ধির বিস্তারিত হিসাব' : 'Scientific FCR & Growth Breakdown'}
              </h4>
              <p className="text-[11px] text-slate-500 font-semibold">
                {batchName} • {isBn ? `বয়স: ${ageDays} দিন` : `Age: ${ageDays} days`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary FCR Scoreboard */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 text-center space-y-3 shadow-inner">
          <div className="grid grid-cols-2 gap-3">
            {/* Commercial Gross FCR */}
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                {isBn ? '১. বাণিজ্যিক গ্রস FCR' : '1. Commercial Gross FCR'}
              </span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-yellow-300 mt-0.5">
                {metrics.commercialGrossFcr > 0 ? metrics.commercialGrossFcr.toFixed(2) : '-'}
              </p>
              <span className="text-[10px] text-slate-300 font-semibold block mt-0.5">
                {isBn ? 'ডিলার ও ফিড কোম্পানি স্ট্যান্ডার্ড' : 'Feed chart / Dealer standard'}
              </span>
            </div>

            {/* Scientific Net FCR */}
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">
                {isBn ? '২. বৈজ্ঞানিক নিট FCR' : '2. Scientific Net FCR'}
              </span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-indigo-200 mt-0.5">
                {metrics.actualNetFcr > 0 ? metrics.actualNetFcr.toFixed(2) : '-'}
              </p>
              <span className="text-[10px] text-slate-300 font-semibold block mt-0.5">
                {isBn ? 'বাচ্চার ওজন বাদ দিয়ে নিট মাংস' : 'Excluding initial chick weight'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-bold pt-1 border-t border-slate-700/60">
            <span className="text-slate-300">
              {isBn ? 'স্ট্যান্ডার্ড বেঞ্চমার্ক FCR:' : 'Std Benchmark FCR:'} <strong className="text-white">{stdFcr.toFixed(2)}</strong>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">
              {isBn ? 'EPEF ইনডেক্স:' : 'EPEF Index:'} <strong className="text-emerald-400">{metrics.epefScore}</strong>
            </span>
          </div>
        </div>

        {/* Step-by-Step Mathematical Flow */}
        <div className="space-y-2.5 text-xs">
          
          {/* Step 1: Flock & Mortality */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-black">১</span>
                {isBn ? 'ফ্লক ও মৃত্যুর সঠিক সমন্বয় (Surviving Flock)' : 'Surviving Flock Accounting'}
              </span>
              <span className="text-emerald-700 font-mono font-black">
                {metrics.aliveBirds} {isBn ? 'টি জীবিত' : 'alive'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-semibold text-slate-600 border-t border-slate-200/60">
              <div>
                <span className="text-slate-400 block text-[10px]">{isBn ? 'শুরুর বাচ্চা' : 'Housed'}</span>
                <span className="font-bold text-slate-800">{totalHoused}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">{isBn ? 'মোট মৃত্যু' : 'Mortality'}</span>
                <span className="font-bold text-rose-600">{mortalityCount} ({metrics.mortalityRatePct}%)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">{isBn ? 'বেঁচে থাকার হার' : 'Livability'}</span>
                <span className="font-bold text-emerald-600">{metrics.livabilityRatePct}%</span>
              </div>
            </div>
          </div>

          {/* Step 2: Live Weight vs Net Meat Gain */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-black">২</span>
                {isBn ? 'জীবিত মোট ওজন ও নিট মাংস বৃদ্ধি' : 'Live Weight & Net Meat'}
              </span>
              <span className="text-slate-700 font-mono font-bold">
                {currentWeightGram}g / {isBn ? 'পাখি' : 'bird'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 bg-amber-50/60 border border-amber-200/60 rounded-lg text-[11px]">
                <span className="text-[10px] font-black text-amber-900 uppercase block">
                  {isBn ? 'মোট লাইভ ওজন (Live Weight)' : 'Total Live Weight'}
                </span>
                <p className="font-mono font-black text-amber-950 mt-0.5">
                  {metrics.aliveBirds} × {(currentWeightGram / 1000).toFixed(3)} kg = <span className="text-amber-800">{metrics.totalLiveWeightKg} KG</span>
                </p>
              </div>
              <div className="p-2 bg-indigo-50/60 border border-indigo-200/60 rounded-lg text-[11px]">
                <span className="text-[10px] font-black text-indigo-900 uppercase block">
                  {isBn ? 'মোট নিট মাংস বৃদ্ধি (Net Gain)' : 'Total Net Meat Gain'}
                </span>
                <p className="font-mono font-black text-indigo-950 mt-0.5">
                  {metrics.aliveBirds} × {metrics.netGainPerUnitKg} kg = <span className="text-indigo-800">{metrics.totalNetMeatKg} KG</span>
                </p>
                <span className="text-[9px] text-indigo-600 block mt-0.5">
                  {isBn ? `(বাচ্চার ${metrics.initialUnitWeightGram}g বাদ দিয়ে)` : `(excluding ${metrics.initialUnitWeightGram}g chick)`}
                </span>
              </div>
            </div>
          </div>

          {/* Step 3: Dual FCR Formula Application */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-black">৩</span>
                {isBn ? 'FCR সূত্র প্রয়োগ (Dual Standard Formulas)' : 'FCR Formula Verification'}
              </span>
              <span className="text-amber-700 font-mono font-black">
                {feedConsumedKg} KG {isBn ? 'ফিড' : 'Feed'}
              </span>
            </div>

            {/* Commercial FCR Box */}
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200/80 text-[11px] font-mono text-amber-950 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-900">
                  {isBn ? 'বাণিজ্যিক FCR = মোট খাদ্য ÷ মোট লাইভ ওজন' : 'Commercial FCR = Feed ÷ Total Live Weight'}
                </span>
                <span className="font-bold">{feedConsumedKg} ÷ {metrics.totalLiveWeightKg}</span>
              </div>
              <div className="flex justify-between text-xs font-black border-t border-amber-300/70 pt-1">
                <span className="text-amber-900">{isBn ? 'বাণিজ্যিক ফলাফল:' : 'Commercial FCR:'}</span>
                <span className="text-slate-900 font-mono text-sm">{metrics.commercialGrossFcr.toFixed(2)}</span>
              </div>
            </div>

            {/* Scientific Net FCR Box */}
            <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200/80 text-[11px] font-mono text-indigo-950 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-900">
                  {isBn ? 'নিট FCR = মোট খাদ্য ÷ নিট মাংস বৃদ্ধি' : 'Net FCR = Feed ÷ Net Meat Gain'}
                </span>
                <span className="font-bold">{feedConsumedKg} ÷ {metrics.totalNetMeatKg}</span>
              </div>
              <div className="flex justify-between text-xs font-black border-t border-indigo-300/70 pt-1">
                <span className="text-indigo-900">{isBn ? 'নিট ফলাফল:' : 'Net Gain FCR:'}</span>
                <span className="text-slate-900 font-mono text-sm">{metrics.actualNetFcr.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Step 4: EPEF Index */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-emerald-700 shrink-0" />
              <div>
                <span className="font-black text-emerald-950 block">
                  {isBn ? 'ইউরোপীয় পারফরম্যান্স ইনডেক্স (EPEF)' : 'European Production Efficiency Factor (EPEF)'}
                </span>
                <span className="text-[10px] text-emerald-800 font-medium">
                  {isBn 
                    ? `সূত্র: (${metrics.livabilityRatePct}% বাঁচা × ${(currentWeightGram / 1000).toFixed(2)} kg) ÷ (${ageDays} দিন × ${metrics.commercialGrossFcr.toFixed(2)} FCR) × ১০০`
                    : `Formula: (${metrics.livabilityRatePct}% livability × ${(currentWeightGram / 1000).toFixed(2)}kg) ÷ (${ageDays}d × ${metrics.commercialGrossFcr.toFixed(2)} FCR) × 100`}
                </span>
              </div>
            </div>
            <span className="text-xl font-black font-mono text-emerald-800 shrink-0">
              {metrics.epefScore}
            </span>
          </div>

          {/* Expert Reassurance Note */}
          <div className="p-2.5 bg-slate-100 rounded-xl text-[10px] text-slate-600 leading-relaxed">
            <p>
              {isBn 
                ? '💡 তথ্যসূত্র: ডিলার ও ফিড কোম্পানির চার্ট (Cobb 500 / Ross 308) বাণিজ্যিক FCR অনুসরণ করে। অপরদিকে প্রাণী পুষ্টিবিদ ও গবেষকরা বাচ্চার প্রাথমিক ওজন বাদ দিয়ে নিট FCR গণনা করেন। খামার পরিচালনায় দুটি মানই নির্ভুল এবং আন্তর্জাতিক মানসম্পন্ন।'
                : '💡 Note: Feed charts and dealers follow Commercial Gross FCR, while nutrition researchers use Net Biomass FCR. Both standards are fully accurate and compliant with global veterinary practices.'}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-colors cursor-pointer"
          >
            {isBn ? 'ঠিক আছে, বুঝেছি' : 'Close Breakdown'}
          </button>
        </div>

      </div>
    </div>
  );
}
