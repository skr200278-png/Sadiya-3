import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  Printer, 
  Scale, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  ShieldCheck, 
  Calendar, 
  Layers, 
  ArrowRight,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchBatchFullRecords, downloadBatchCSV, downloadBatchPDF } from '../utils/batchExportUtils';
import toast from 'react-hot-toast';

interface CompletedBatchReportModalProps {
  batch: any;
  isBn?: boolean;
  onClose: () => void;
}

export const CompletedBatchReportModal: React.FC<CompletedBatchReportModalProps> = ({
  batch,
  isBn = true,
  onClose
}) => {
  const navigate = useNavigate();
  const { currentUser, isDemoUser } = useAuth();
  const report = batch.closureReport || {};
  const [isExporting, setIsExporting] = useState(false);

  // 15 days lifecycle calculation
  const completedDate = batch.completedAt || batch.endDate || batch.updatedAt || batch.createdAt;
  const daysSinceCompleted = completedDate
    ? Math.max(0, Math.floor((new Date().getTime() - new Date(completedDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const daysRemaining = Math.max(0, 15 - daysSinceCompleted);

  const totalChicks = report.totalChicks || batch.totalChicks || 0;
  const soldQty = report.finalSoldQty || (totalChicks - (batch.mortalityCount || 0));
  const totalWeight = report.finalSoldWeightKg || 0;
  const avgWeight = report.avgBirdWeightKg || (soldQty > 0 && totalWeight > 0 ? (totalWeight / soldQty) : 0);
  const totalSales = report.totalSalesAmount || 0;
  const totalCost = report.totalCost || 0;
  const netProfit = report.netProfit !== undefined ? report.netProfit : (totalSales - totalCost);
  const profitPerBird = report.profitPerBird !== undefined ? report.profitPerBird : (soldQty > 0 ? (netProfit / soldQty) : 0);
  const commercialFcr = report.commercialFcr || 0;
  const epef = report.epefScore || 0;
  const mortalityCount = report.mortalityCount || (totalChicks - soldQty);
  const mortPercent = totalChicks > 0 ? ((mortalityCount / totalChicks) * 100).toFixed(1) : '0';

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const data = await fetchBatchFullRecords(batch.id, currentUser?.uid || '', isDemoUser);
      if (!data) {
        toast.error(isBn ? 'ডাটা লোড করা যায়নি' : 'Failed to fetch batch data');
        return;
      }
      downloadBatchCSV(batch, data);
    } catch (e) {
      toast.error(isBn ? 'ডাউনলোড ব্যর্থ হয়েছে' : 'Download failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const data = await fetchBatchFullRecords(batch.id, currentUser?.uid || '', isDemoUser);
      if (!data) {
        toast.error(isBn ? 'ডাটা লোড করা যায়নি' : 'Failed to fetch batch data');
        return;
      }
      downloadBatchPDF(batch, data);
    } catch (e) {
      toast.error(isBn ? 'ডাউনলোড ব্যর্থ হয়েছে' : 'Download failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-purple-200 my-auto space-y-4 print:shadow-none print:border-none print:p-2">
        {/* Certificate Top Ribbon */}
        <div className="flex items-start justify-between border-b border-slate-150 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
              <Award size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                  {isBn ? '✓ সমাপ্ত ও সংরক্ষিত ব্যাচ' : '✓ Completed & Archived'}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  ID: #{batch.id?.slice(0, 8)}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                {batch.batchName} — {isBn ? 'চূড়ান্ত সমাপনী অডিট সার্টিফিকেট' : 'Final Closure Audit Certificate'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title={isBn ? 'প্রিন্ট / সেভ' : 'Print'}
            >
              <Printer size={16} />
              <span className="hidden sm:inline">{isBn ? 'প্রিন্ট' : 'Print'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 15-Day Auto-Deletion Warning & Export Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-50 border-2 border-amber-400/80 rounded-2xl p-3.5 print:hidden shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Clock size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider">
                    {isBn ? `আর ${daysRemaining} দিন পর মুছে যাবে` : `Auto-deletes in ${daysRemaining} days`}
                  </span>
                  <span className="text-[11px] font-black text-amber-950">
                    {isBn ? '১৫ দিনের মধ্যে এই ব্যাচের ডাটা স্বয়ংক্রিয়ভাবে মুছে যাবে' : 'Data permanently auto-deletes in 15 days'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 font-medium mt-1 leading-snug">
                  {isBn
                    ? 'ব্যাচটি সমাপ্ত হওয়ায় নতুন কোনো এন্ট্রি নেওয়া হবে না। ১৫ দিন অতিক্রান্ত হওয়ার আগেই আপনার সম্পূর্ণ হিসাব এক্সেল (CSV) বা পিডিএফে ডাউনলোড করে নিরাপদে সংরক্ষণ করুন।'
                    : 'This completed batch is locked against new entries. Please download your records before the 15-day lifecycle expires.'}
                </p>
              </div>
            </div>

            {/* Direct Export Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet size={14} />
                <span>{isBn ? 'এক্সেল ডাউনলোড' : 'Excel/CSV'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isBn ? 'PDF রিপোর্ট' : 'PDF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Duration & Basic Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block font-bold">{isBn ? 'শুরুর তারিখ' : 'Start Date'}</span>
            <span className="font-black text-slate-800">
              {batch.startDate ? new Date(batch.startDate).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-bold">{isBn ? 'সমাপ্তির তারিখ' : 'End Date'}</span>
            <span className="font-black text-slate-800">
              {batch.endDate ? new Date(batch.endDate).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-bold">{isBn ? 'মোট প্রাণীর সংখ্যা' : 'Initial Flock'}</span>
            <span className="font-black text-slate-800">{totalChicks} {isBn ? 'টি' : 'birds'}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-bold">{isBn ? 'মোট বিক্রয় সংখ্যা' : 'Sold Quantity'}</span>
            <span className="font-black text-emerald-700">{soldQty} {isBn ? 'টি' : 'birds'}</span>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-800 block">
              {isBn ? 'মোট বিক্রয় মূল্য' : 'Total Revenue'}
            </span>
            <span className="text-lg font-black text-emerald-700 block">
              ৳ {totalSales.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-800/80 block font-medium">
              {totalWeight > 0 ? `${totalWeight} kg (${isBn ? 'গড়' : 'Avg'} ${(avgWeight * 1000).toFixed(0)} gm)` : ''}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
            <span className="text-[10px] font-black uppercase text-rose-800 block">
              {isBn ? 'মোট উৎপাদন ব্যয়' : 'Total Expenses'}
            </span>
            <span className="text-lg font-black text-rose-700 block">
              ৳ {totalCost.toLocaleString()}
            </span>
            <span className="text-[10px] text-rose-800/80 block font-medium">
              {isBn ? 'প্রতি পিসে খরচ:' : 'Cost/bird:'} ৳ {totalChicks > 0 ? (totalCost / totalChicks).toFixed(1) : '-'}
            </span>
          </div>

          <div className={`p-3.5 rounded-2xl border space-y-1 ${
            netProfit >= 0 ? 'bg-emerald-100/60 border-emerald-300 text-emerald-950' : 'bg-rose-100/60 border-rose-300 text-rose-950'
          }`}>
            <span className="text-[10px] font-black uppercase block">
              {isBn ? 'নিট লাভ / লোকসান' : 'Net Profit / Loss'}
            </span>
            <span className="text-lg font-black block">
              {netProfit >= 0 ? `+৳ ${netProfit.toLocaleString()}` : `-৳ ${Math.abs(netProfit).toLocaleString()}`}
            </span>
            <span className="text-[10px] font-bold block">
              {isBn ? 'প্রতি পাখিতে লাভ:' : 'Profit/bird:'} ৳ {profitPerBird.toFixed(1)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-800 block">
              {isBn ? 'FCR ও EPEF স্কোর' : 'FCR & EPEF'}
            </span>
            <span className="text-lg font-black text-amber-900 block">
              {commercialFcr > 0 ? commercialFcr.toFixed(2) : '-'} | {epef > 0 ? epef.toFixed(0) : '-'}
            </span>
            <span className="text-[10px] text-amber-800/80 block font-medium">
              {isBn ? 'মৃত্যু হার:' : 'Mortality:'} {mortPercent}% ({mortalityCount} {isBn ? 'টি' : 'birds'})
            </span>
          </div>
        </div>

        {/* Itemized Financial Breakdown */}
        {report.chickCost !== undefined && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
              {isBn ? 'খরচের পূর্ণাঙ্গ বিবরণী (Itemized Cost Audit)' : 'Cost Breakdown'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-slate-200">
              <div>
                <span className="text-slate-500 block">{isBn ? 'বাচ্চা ক্রয় ব্যয়:' : 'Chick Cost:'}</span>
                <span className="font-bold text-slate-800">৳ {Number(report.chickCost || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{isBn ? 'খাদ্য (ফিড) খরচ:' : 'Feed Cost:'}</span>
                <span className="font-bold text-slate-800">৳ {Number(report.feedCost || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{isBn ? 'ওষুধ ও ভ্যাকসিন:' : 'Medicine Cost:'}</span>
                <span className="font-bold text-slate-800">৳ {Number(report.medCost || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{isBn ? 'অন্যান্য পরিচালনা:' : 'Other Costs:'}</span>
                <span className="font-bold text-slate-800">৳ {Number(report.otherCost || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Stock Settlement Note */}
        {report.feedSettlementAction && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950">
            <Package size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-amber-900 block">
                {isBn ? 'অবশিষ্ট খাদ্য ও স্টক নিষ্পত্তি তথ্য:' : 'Feed Stock Settlement:'}
              </span>
              <p className="mt-0.5 text-amber-900/90 font-medium leading-relaxed">
                {report.feedSettlementAction === 'returned_to_stock' && (
                  isBn 
                    ? `ব্যাচ সমাপ্তির সময় ${report.returnedFeedBags || 0} বস্তা (${report.returnedFeedKg || 0} কেজি) অবশিষ্ট খাদ্য খামারের মূল গুদামে ফেরত হিসেবে যোগ করা হয়েছে।` 
                    : `Returned ${report.returnedFeedBags || 0} bags (${report.returnedFeedKg || 0} kg) unused feed back to farm main store.`
                )}
                {report.feedSettlementAction === 'written_off' && (
                  isBn ? 'অবশিষ্ট খাদ্য নষ্ট/বাতিল হিসেবে অডিট রেকর্ডে নিষ্পত্তি করা হয়েছে।' : 'Unused feed written off as damaged.'
                )}
                {report.feedSettlementAction === 'none' && (
                  isBn ? 'ব্যাচের সমুদয় খাদ্য ও ওষুধ সম্পূর্ণ ব্যবহার হয়েছে, কোনো উদ্বৃত্ত নেই।' : 'All feed fully consumed; no remaining stock.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Historical Logs Quick Navigation (Print Hidden) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-150 print:hidden flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>{isBn ? 'রেকর্ডটি নিরাপদে ডাউনলোড করে সংরক্ষণ করুন' : 'Download and save report safely'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                navigate(`/feed?tab=fcr&batchId=${batch.id}`);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{isBn ? 'FCR বিশ্লেষণ' : 'FCR View'}</span>
              <ArrowRight size={12} />
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {isBn ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
