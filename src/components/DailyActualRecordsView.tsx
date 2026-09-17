/**
 * DAILY ACTUAL RECORDS VIEW (PHASE 2)
 * Strictly batch-isolated view for managing daily actual records:
 * - Active batch selection
 * - Real-time batch live count, age, and cumulative feed indicators
 * - Daily logs list with live count, today mortality, feed consumed, sample weight
 * - Edit and delete actions
 * - No FCR formula or reports in this phase
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Calendar,
  Activity,
  Plus,
  Trash2,
  Edit,
  Wheat,
  Scale,
  Lock,
  AlertCircle,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from './ConfirmModal';
import { DailyActualRecordModal } from './DailyActualRecordModal';
import { BatchIdentifier, DailyActualRecord } from '../types/fcrTypes';
import { fetchBatchDailyRecords, deleteDailyActualRecord } from '../services/dailyRecordService';
import { calculateBatchAgeFromStartDate } from '../utils/fcrBatchScope';

interface DailyActualRecordsViewProps {
  selectedBatchId: string;
  onBatchChange: (id: string) => void;
  activeBatches: any[];
  allBatches: any[];
  currentUser: any;
  isDemoUser: boolean;
  allMortalityRecords?: Array<{ batchId: string; date: string; count: number }>;
  allSalesRecords?: Array<{ batchId: string; date: string; quantity: number }>;
  allFeedUsageRecords?: Array<{ batchId: string; date: string; quantityKg: number }>;
}

export const DailyActualRecordsView: React.FC<DailyActualRecordsViewProps> = ({
  selectedBatchId,
  onBatchChange,
  activeBatches,
  allBatches,
  currentUser,
  isDemoUser,
  allMortalityRecords = [],
  allSalesRecords = [],
  allFeedUsageRecords = []
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [records, setRecords] = useState<DailyActualRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<DailyActualRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; date: string } | null>(null);

  // Selected batch object
  const currentBatch = useMemo<BatchIdentifier | null>(() => {
    const candidateBatches = activeBatches.length > 0 ? activeBatches : allBatches;
    const found = candidateBatches.find(b => b.id === selectedBatchId);
    if (found) {
      return {
        id: found.id,
        userId: found.userId || (currentUser ? currentUser.uid : 'demo_khamari_user_1'),
        batchName: found.batchName,
        category: found.farmType || 'poultry',
        startDate: found.startDate,
        totalChicks: Number(found.totalChicks || 0),
        status: found.status || 'active',
        bagWeightKg: found.bagWeightKg
      };
    }
    return null;
  }, [selectedBatchId, activeBatches, allBatches, currentUser]);

  const loadBatchRecords = useCallback(async () => {
    if (!selectedBatchId) {
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const targetUserId = currentUser ? currentUser.uid : 'demo_khamari_user_1';
      const fetched = await fetchBatchDailyRecords(selectedBatchId, targetUserId, isDemoUser);
      setRecords(fetched);
    } catch (err) {
      console.error('Error loading daily actual records:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBatchId, currentUser, isDemoUser]);

  useEffect(() => {
    loadBatchRecords();
  }, [loadBatchRecords]);

  // Handle edit
  const handleOpenEdit = (rec: DailyActualRecord) => {
    setEditingRecord(rec);
    setIsModalOpen(true);
  };

  // Handle create
  const handleOpenCreate = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !selectedBatchId) return;
    try {
      await deleteDailyActualRecord(deleteTarget.id, selectedBatchId, deleteTarget.date, isDemoUser);
      toast.success(isBn ? 'দৈনিক রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।' : 'Daily record deleted successfully.');
      setDeleteTarget(null);
      loadBatchRecords();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(isBn ? 'মুছতে সমস্যা হয়েছে।' : 'Failed to delete record.');
    }
  };

  const isCompleted = currentBatch?.status === 'completed';

  // Latest stats from latest record or batch
  const latestRecord = records.length > 0 ? records[0] : null;
  const currentBatchAge = currentBatch?.startDate
    ? calculateBatchAgeFromStartDate(currentBatch.startDate)
    : 0;

  const totalRecordedFeedKg = useMemo(() => {
    return records.reduce((sum, r) => sum + (r.actualFeedUsedKg || 0), 0);
  }, [records]);

  const totalRecordedMortality = useMemo(() => {
    return records.reduce((sum, r) => sum + (r.todayMortality || 0), 0);
  }, [records]);

  return (
    <div className="space-y-4">
      {/* 1. Batch Selector & Status Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                {isBn ? 'দৈনিক প্রকৃত হিসাব (Daily Actual Record)' : 'Daily Actual Record System'}
                {isCompleted && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    {isBn ? 'সমাপ্ত ব্যাচ (Locked)' : 'Completed (Locked)'}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBn
                  ? 'শুধু নির্বাচিত ব্যাচের প্রকৃত খাবার, মৃত্যু ও গড় ওজনের নির্ভরযোগ্য তথ্য'
                  : 'Isolated actual consumption, mortality, and sample weight logs'}
              </p>
            </div>
          </div>

          {/* Action Button: Add Record */}
          <button
            onClick={handleOpenCreate}
            disabled={!currentBatch || isCompleted}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>{isBn ? 'আজকের দৈনিক রেকর্ড লিখুন' : 'Add Daily Record'}</span>
          </button>
        </div>

        {/* Batch Selection Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Lock size={12} className="text-emerald-600" />
              {isBn ? 'নির্দিষ্ট ব্যাচ নির্বাচন করুন (Batch Scope)' : 'Select Batch Scope'}
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => onBatchChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="">{isBn ? '-- ব্যাচ নির্বাচন করুন --' : '-- Select Batch --'}</option>
              {activeBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  🟢 {b.batchName} ({b.farmType || 'poultry'}) — {b.totalChicks} {isBn ? 'বাচ্চা' : 'heads'}
                </option>
              ))}
              {allBatches
                .filter((b) => b.status === 'completed')
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    🔒 [Completed] {b.batchName}
                  </option>
                ))}
            </select>
          </div>

          {/* Current Batch Summary Metrics */}
          {currentBatch && (
            <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
              <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-slate-500 block truncate">{isBn ? 'বয়স' : 'Age'}</span>
                <span className="text-xs font-bold text-emerald-800">{currentBatchAge} {isBn ? 'দিন' : 'd'}</span>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-slate-500 block truncate">{isBn ? 'জীবিত' : 'Live'}</span>
                <span className="text-xs font-bold text-slate-800">
                  {latestRecord ? latestRecord.currentLiveCount : currentBatch.totalChicks}
                </span>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-slate-500 block truncate">{isBn ? 'মোট মৃত্যু' : 'Mort.'}</span>
                <span className="text-xs font-bold text-rose-700">
                  {latestRecord ? latestRecord.totalMortalityToDate : totalRecordedMortality}
                </span>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-slate-500 block truncate">{isBn ? 'প্রকৃত খাদ্য' : 'Actual Feed'}</span>
                <span className="text-xs font-bold text-amber-800">
                  {totalRecordedFeedKg.toFixed(1)} kg
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completed Batch Warning */}
      {isCompleted && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isBn
              ? 'এই ব্যাচটি সম্পন্ন হয়েছে। নিয়ম অনুযায়ী সম্পন্ন ব্যাচে নতুন রেকর্ড যোগ করা যাবে না, তবে পূর্বের রেকর্ড পর্যালোচনা করা যাবে।'
              : 'This batch is completed. New records are restricted, but historical records can be reviewed.'}
          </span>
        </div>
      )}

      {/* 2. Records List or Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Clock size={14} className="text-slate-500" />
            {isBn ? `দৈনিক রেকর্ড তালিকা (${records.length} টি)` : `Daily Records List (${records.length})`}
          </h4>
          <button
            onClick={loadBatchRecords}
            className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-medium"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            {isBn ? 'রেকর্ড লোড হচ্ছে...' : 'Loading records...'}
          </div>
        ) : !currentBatch ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-xs space-y-1">
            <p className="font-bold text-slate-700">
              {isBn ? 'কোনো ব্যাচ নির্বাচন করা হয়নি' : 'No Batch Selected'}
            </p>
            <p>{isBn ? 'দৈনিক রেকর্ড দেখতে বা যোগ করতে উপরে একটি ব্যাচ নির্বাচন করুন।' : 'Please select a batch above.'}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-xs space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                {isBn ? 'এই ব্যাচে এখনো কোনো দৈনিক রেকর্ড নেই' : 'No Daily Records Yet'}
              </p>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                {isBn
                  ? 'প্রতিদিনের খাবার গ্রহণ, মৃত্যু এবং ওজন পরিমাপ রেকর্ড করুন।'
                  : 'Start tracking actual feed consumed, mortality, and sample weight.'}
              </p>
            </div>
            {!isCompleted && (
              <button
                onClick={handleOpenCreate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus size={15} />
                <span>{isBn ? 'প্রথম দৈনিক রেকর্ড যোগ করুন' : 'Add First Record'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow p-3.5 space-y-3"
              >
                {/* Card Header: Date, Age & Actions */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1">
                      <Calendar size={13} className="text-emerald-600" />
                      {new Date(rec.date).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {isBn ? `বয়স: ${rec.batchAgeDays} দিন` : `Age: ${rec.batchAgeDays}d`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!isCompleted && (
                      <button
                        onClick={() => handleOpenEdit(rec)}
                        title={isBn ? 'সম্পাদনা করুন' : 'Edit Record'}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget({ id: rec.id, date: rec.date })}
                      title={isBn ? 'মুছে ফেলুন' : 'Delete Record'}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Card Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* Metric 1: Live Count */}
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">{isBn ? 'জীবিত সংখ্যা' : 'Live Count'}</span>
                    <span className="font-bold text-slate-800">
                      {rec.currentLiveCount} <span className="text-[10px] font-normal text-slate-500">({rec.openingLiveCount} শুরুতে)</span>
                    </span>
                  </div>

                  {/* Metric 2: Today's Mortality */}
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">{isBn ? 'আজকের মৃত্যু' : "Today's Mortality"}</span>
                    <span className={`font-bold ${rec.todayMortality && rec.todayMortality > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {rec.todayMortality !== null ? `${rec.todayMortality} টি` : '—'}
                    </span>
                  </div>

                  {/* Metric 3: Actual Feed Consumed */}
                  <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200/80">
                    <span className="text-[10px] text-amber-800 block">{isBn ? 'প্রকৃত খাবার' : 'Actual Feed'}</span>
                    <span className="font-bold text-amber-950">
                      {rec.actualFeedUsedKg !== null
                        ? `${rec.actualFeedUsedKg} kg ${rec.actualFeedUsedBags ? `(${rec.actualFeedUsedBags} ব)` : ''}`
                        : '—'}
                    </span>
                  </div>

                  {/* Metric 4: Average Weight Sample */}
                  <div className="bg-indigo-50/70 p-2 rounded-xl border border-indigo-200/80">
                    <span className="text-[10px] text-indigo-800 block">{isBn ? 'গড় ওজন (নমুনা)' : 'Avg Weight (Sample)'}</span>
                    <span className="font-bold text-indigo-950">
                      {rec.avgWeightGram !== null
                        ? `${rec.avgWeightGram} g`
                        : <span className="text-slate-400 font-normal">{isBn ? '—' : 'None'}</span>}
                    </span>
                  </div>
                </div>

                {/* Sub details: Cumulative Feed & Sample breakdown & Notes */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Wheat size={12} className="text-amber-600" />
                      {isBn ? 'সর্বমোট প্রকৃত খাদ্য:' : 'Cumulative Feed:'}{' '}
                      <strong className="text-amber-900">{rec.cumulativeActualFeedUsedKg} kg</strong>
                    </span>

                    {rec.weightSampleCount && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Scale size={12} className="text-indigo-600" />
                        {rec.weightSampleCount} {isBn ? 'টি বাচ্চার মোট' : 'birds:'} {rec.totalSampleWeightKg} kg
                      </span>
                    )}
                  </div>

                  {rec.notes && (
                    <span className="italic text-slate-500 text-[10px]">
                      "{rec.notes}"
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Creating / Updating Daily Actual Record */}
      <DailyActualRecordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        selectedBatch={currentBatch}
        onRecordSaved={loadBatchRecords}
        allMortalityRecords={allMortalityRecords}
        allSalesRecords={allSalesRecords}
        allFeedUsageRecords={allFeedUsageRecords}
        initialRecord={editingRecord}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={isBn ? 'দৈনিক রেকর্ড মুছে ফেলবেন?' : 'Delete Daily Record?'}
        message={isBn
          ? 'আপনি কি নিশ্চিত যে এই তারিখের দৈনিক রেকর্ডটি মুছে ফেলতে চান? এটি পুনরায় ফিরিয়ে আনা সম্ভব নয়।'
          : 'Are you sure you want to delete this daily record? This cannot be undone.'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
export default DailyActualRecordsView;
