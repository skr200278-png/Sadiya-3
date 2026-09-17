/**
 * DAILY ACTUAL RECORD MODAL (PHASE 2)
 * Strictly batch-scoped daily actual data entry:
 * - Date, Locked Batch ID, Auto Batch Age
 * - Auto Opening & Current Live Count, Today Mortality, Total Mortality
 * - Actual Feed Used (kg / bag with auto conversion via batch bag-weight)
 * - Cumulative Actual Feed Used (auto calculated)
 * - Sample Count, Total Sample Weight, and Auto Average Weight (kg & g)
 * - No FCR formula, strictly isolated data capture
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { X, Calendar, Lock, AlertCircle, Info, CheckCircle2, Scale, Wheat, Activity, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BatchIdentifier,
  DailyActualRecord,
  DailyRecordFormInput
} from '../types/fcrTypes';
import {
  getBatchConfiguredBagWeight,
  calculateBatchAgeFromStartDate
} from '../utils/fcrBatchScope';
import {
  processDailyRecordInput,
  calculateOpeningLiveCount,
  calculateCumulativeMortality,
  calculateCumulativeActualFeedUsed
} from '../utils/dailyRecordEngine';
import { saveDailyActualRecord, fetchBatchDailyRecords } from '../services/dailyRecordService';

interface DailyActualRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBatch: BatchIdentifier | null;
  onRecordSaved?: () => void;
  allMortalityRecords?: Array<{ batchId: string; date: string; count: number }>;
  allSalesRecords?: Array<{ batchId: string; date: string; quantity: number }>;
  allFeedUsageRecords?: Array<{ batchId: string; date: string; quantityKg: number }>;
  initialRecord?: DailyActualRecord | null;
}

export const DailyActualRecordModal: React.FC<DailyActualRecordModalProps> = ({
  isOpen,
  onClose,
  selectedBatch,
  onRecordSaved,
  allMortalityRecords = [],
  allSalesRecords = [],
  allFeedUsageRecords = [],
  initialRecord
}) => {
  const { language } = useLanguage();
  const { currentUser, isDemoUser } = useAuth();
  const isBn = language === 'bn';

  const [date, setDate] = useState<string>(() => initialRecord?.date || new Date().toISOString().split('T')[0]);
  const [todayMortality, setTodayMortality] = useState<string>(() =>
    initialRecord?.todayMortality !== null && initialRecord?.todayMortality !== undefined
      ? String(initialRecord.todayMortality)
      : ''
  );
  const [feedInputMode, setFeedInputMode] = useState<'kg' | 'bag'>(() => initialRecord?.feedInputMode || 'kg');
  const [feedAmount, setFeedAmount] = useState<string>(() => {
    if (initialRecord?.feedInputMode === 'bag' && initialRecord?.actualFeedUsedBags !== null && initialRecord?.actualFeedUsedBags !== undefined) {
      return String(initialRecord.actualFeedUsedBags);
    }
    if (initialRecord?.actualFeedUsedKg !== null && initialRecord?.actualFeedUsedKg !== undefined) {
      return String(initialRecord.actualFeedUsedKg);
    }
    return '';
  });
  const [weightSampleCount, setWeightSampleCount] = useState<string>(() =>
    initialRecord?.weightSampleCount ? String(initialRecord.weightSampleCount) : ''
  );
  const [totalSampleWeight, setTotalSampleWeight] = useState<string>(() => {
    if (initialRecord?.totalSampleWeightKg) {
      return initialRecord.weightInputUnit === 'g'
        ? String(Math.round(initialRecord.totalSampleWeightKg * 1000))
        : String(initialRecord.totalSampleWeightKg);
    }
    return '';
  });
  const [weightInputUnit, setWeightInputUnit] = useState<'kg' | 'g'>(() => initialRecord?.weightInputUnit || 'g');
  const [notes, setNotes] = useState<string>(() => initialRecord?.notes || '');

  const [existingRecords, setExistingRecords] = useState<DailyActualRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Configured bag weight
  const configuredBagWeight = useMemo(() => {
    if (!selectedBatch) return 50;
    return getBatchConfiguredBagWeight(selectedBatch.id, selectedBatch.bagWeightKg);
  }, [selectedBatch]);

  // Load existing records for this batch
  useEffect(() => {
    if (selectedBatch?.id && isOpen) {
      const load = async () => {
        const targetUserId = currentUser ? currentUser.uid : 'demo_khamari_user_1';
        const recs = await fetchBatchDailyRecords(selectedBatch.id, targetUserId, isDemoUser);
        setExistingRecords(recs);
      };
      load();
    }
  }, [selectedBatch?.id, isOpen, currentUser, isDemoUser]);

  // Check if current date already has a record (for update warning)
  const existingForDate = useMemo(() => {
    return existingRecords.find(r => r.batchId === selectedBatch?.id && r.date === date);
  }, [existingRecords, selectedBatch?.id, date]);

  // If user picks a date that already has a record and not in edit mode, allow prefilling or notice
  useEffect(() => {
    if (existingForDate && !initialRecord) {
      if (existingForDate.todayMortality !== null) {
        setTodayMortality(String(existingForDate.todayMortality));
      }
      if (existingForDate.feedInputMode === 'bag' && existingForDate.actualFeedUsedBags !== null) {
        setFeedInputMode('bag');
        setFeedAmount(String(existingForDate.actualFeedUsedBags));
      } else if (existingForDate.actualFeedUsedKg !== null) {
        setFeedInputMode('kg');
        setFeedAmount(String(existingForDate.actualFeedUsedKg));
      }
      if (existingForDate.weightSampleCount) {
        setWeightSampleCount(String(existingForDate.weightSampleCount));
      }
      if (existingForDate.totalSampleWeightKg) {
        const u = existingForDate.weightInputUnit || 'g';
        setWeightInputUnit(u);
        setTotalSampleWeight(u === 'g' ? String(Math.round(existingForDate.totalSampleWeightKg * 1000)) : String(existingForDate.totalSampleWeightKg));
      }
      if (existingForDate.notes) {
        setNotes(existingForDate.notes);
      }
    }
  }, [existingForDate, initialRecord]);

  // 1. Batch Age Days (strictly calculated from batch.startDate)
  const batchAgeDays = useMemo(() => {
    if (!selectedBatch?.startDate) return 0;
    return calculateBatchAgeFromStartDate(selectedBatch.startDate, date);
  }, [selectedBatch?.startDate, date]);

  // 2. Opening Live Count (Initial chicks - prior mortality - prior sales)
  const openingLiveCount = useMemo(() => {
    if (!selectedBatch) return 0;
    return calculateOpeningLiveCount(selectedBatch, date, allMortalityRecords, allSalesRecords);
  }, [selectedBatch, date, allMortalityRecords, allSalesRecords]);

  // 3. Today's Mortality & Current Live Count (Real-time calculation)
  const parsedTodayMortality = useMemo(() => {
    if (todayMortality.trim() === '') return null;
    const n = Number(todayMortality);
    return isNaN(n) ? null : Math.max(0, Math.round(n));
  }, [todayMortality]);

  const currentLiveCount = useMemo(() => {
    const mort = parsedTodayMortality || 0;
    return Math.max(0, openingLiveCount - mort);
  }, [openingLiveCount, parsedTodayMortality]);

  // 4. Total Cumulative Mortality
  const totalMortalityToDate = useMemo(() => {
    if (!selectedBatch) return 0;
    return calculateCumulativeMortality(selectedBatch.id, date, parsedTodayMortality || 0, allMortalityRecords);
  }, [selectedBatch, date, parsedTodayMortality, allMortalityRecords]);

  // 5. Feed Conversion & Cumulative Feed (Real-time calculation)
  const feedCalculation = useMemo(() => {
    if (feedAmount.trim() === '') {
      return { kg: null, bags: null };
    }
    const val = Number(feedAmount);
    if (isNaN(val) || val < 0) return { kg: null, bags: null };

    if (feedInputMode === 'bag') {
      const kg = Number((val * configuredBagWeight).toFixed(2));
      return { kg, bags: val };
    } else {
      const bags = Number((val / configuredBagWeight).toFixed(2));
      return { kg: val, bags };
    }
  }, [feedAmount, feedInputMode, configuredBagWeight]);

  const cumulativeActualFeedUsedKg = useMemo(() => {
    if (!selectedBatch) return 0;
    return calculateCumulativeActualFeedUsed(
      selectedBatch.id,
      date,
      feedCalculation.kg,
      existingRecords,
      allFeedUsageRecords
    );
  }, [selectedBatch, date, feedCalculation.kg, existingRecords, allFeedUsageRecords]);

  // 6. Weight Sample & Average Weight (Real-time calculation)
  const weightCalculation = useMemo(() => {
    const count = Number(weightSampleCount);
    const totalWt = Number(totalSampleWeight);

    if (isNaN(count) || count <= 0 || isNaN(totalWt) || totalWt <= 0) {
      return { avgWeightGram: null, avgWeightKg: null, totalSampleWeightKg: null };
    }

    const totalKg = weightInputUnit === 'g' ? totalWt / 1000 : totalWt;
    const avgKg = totalKg / count;
    const avgGram = Math.round(avgKg * 1000);

    return {
      avgWeightGram: avgGram,
      avgWeightKg: Number(avgKg.toFixed(4)),
      totalSampleWeightKg: Number(totalKg.toFixed(4))
    };
  }, [weightSampleCount, totalSampleWeight, weightInputUnit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) {
      toast.error(isBn ? 'কোনো ব্যাচ নির্বাচন করা হয়নি।' : 'No batch selected.');
      return;
    }

    if (selectedBatch.status === 'completed') {
      toast.error(isBn ? 'সমাপ্ত ব্যাচে নতুন দৈনিক রেকর্ড যোগ করা যাবে না।' : 'Cannot add records to a completed batch.');
      return;
    }

    const input: DailyRecordFormInput = {
      date,
      todayMortality,
      feedInputMode,
      feedAmount,
      weightSampleCount,
      totalSampleWeight,
      weightInputUnit,
      notes
    };

    const validationResult = processDailyRecordInput(input, {
      batch: selectedBatch,
      existingDailyRecords: existingRecords,
      allMortalityRecords,
      allSalesRecords,
      allFeedUsageRecords
    });

    if (!validationResult.isValid || !validationResult.calculatedRecord) {
      setValidationErrors(validationResult.errors);
      toast.error(validationResult.errors[0] || (isBn ? 'তথ্য সঠিক নয়।' : 'Invalid input.'));
      return;
    }

    setValidationErrors([]);
    setIsSubmitting(true);

    try {
      await saveDailyActualRecord(validationResult.calculatedRecord, isDemoUser);

      toast.success(
        validationResult.isExistingUpdate
          ? (isBn ? 'দৈনিক রেকর্ড সফলভাবে আপডেট হয়েছে!' : 'Daily record updated successfully!')
          : (isBn ? 'দৈনিক রেকর্ড সফলভাবে সংরক্ষণ করা হয়েছে!' : 'Daily record saved successfully!')
      );

      if (onRecordSaved) onRecordSaved();
      onClose();
    } catch (err) {
      console.error('Save daily record error:', err);
      toast.error(isBn ? 'সংরক্ষণে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Failed to save daily record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCompleted = selectedBatch?.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-200" />
              {isBn ? 'দৈনিক প্রকৃত রেকর্ড (Daily Actual Record)' : 'Daily Actual Record'}
            </h3>
            <p className="text-xs text-emerald-100">
              {isBn ? 'নির্বাচিত ব্যাচের প্রকৃত খাদ্য, মৃত্যু ও ওজন রেকর্ড' : 'Strictly isolated daily logs for active batch'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Batch Locked Badge */}
        <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-slate-600 font-medium">{isBn ? 'নির্বাচিত ব্যাচ:' : 'Batch:'}</span>
            <span className="font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
              {selectedBatch?.batchName || 'N/A'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              (ID: {selectedBatch?.id || '—'})
            </span>
          </div>
          <div className="text-[11px] font-semibold text-emerald-800">
            {isBn ? `বস্তা: ${configuredBagWeight} কেজি` : `Bag: ${configuredBagWeight}kg`}
          </div>
        </div>

        {/* Completed Batch Warning */}
        {isCompleted && (
          <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              {isBn
                ? 'এই ব্যাচটি সমাপ্ত (Completed)। নিয়মানুযায়ী সমাপ্ত ব্যাচে নতুন দৈনিক তথ্য যোগ করা যাবে না।'
                : 'This batch is completed. Per rules, no new daily records can be added.'}
            </span>
          </div>
        )}

        {/* Update Notice if record exists for this date */}
        {existingForDate && !isCompleted && (
          <div className="mx-4 mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {isBn
                ? `এই তারিখের (${date}) দৈনিক রেকর্ড পূর্বে সংরক্ষিত রয়েছে। নতুন তথ্য দিলে এটি আপডেট হবে।`
                : `A record exists for this date (${date}). Saving will update it.`}
            </span>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              {isBn ? 'অনুগ্রহ করে সংশোধন করুন:' : 'Please fix the following:'}
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-rose-800">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Date & Age */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-500" />
                {isBn ? 'তারিখ (Date) *' : 'Date *'}
              </label>
              <input
                type="date"
                required
                disabled={isCompleted}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'ব্যাচের বয়স (Batch Age)' : 'Batch Age'}
              </label>
              <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-800 flex items-center justify-between">
                <span>{batchAgeDays} {isBn ? 'দিন' : 'Days'}</span>
                <span className="text-[10px] text-slate-400 font-normal">Auto</span>
              </div>
            </div>
          </div>

          {/* Section 2: Live Count & Mortality */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-xs font-bold text-slate-800">
                {isBn ? 'জীবিত সংখ্যা ও মৃত্যু হিসাব' : 'Flock Count & Mortality'}
              </span>
              <span className="text-[10px] text-slate-500">
                {isBn ? 'ওপেনিং সংখ্যা স্বয়ংক্রিয়' : 'Opening auto calculated'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">{isBn ? 'দিনের শুরুতে জীবিত' : 'Opening Live'}</span>
                <span className="text-xs font-bold text-slate-800">{openingLiveCount}</span>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                  {isBn ? 'আজকের মৃত্যু (Mortality)' : "Today's Mortality"}
                </label>
                <input
                  type="number"
                  min="0"
                  max={openingLiveCount}
                  disabled={isCompleted}
                  placeholder={isBn ? 'মৃত্যু না থাকলে ফাঁকা রাখুন' : 'Leave empty if 0'}
                  value={todayMortality}
                  onChange={(e) => setTodayMortality(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block">{isBn ? 'বর্তমান জীবিত' : 'Current Live'}</span>
                <span className="text-xs font-bold text-emerald-900">{currentLiveCount}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 flex justify-between px-1">
              <span>{isBn ? 'মোট সর্বমোট মৃত্যু (আজ পর্যন্ত):' : 'Total mortality to date:'}</span>
              <span className="font-bold text-rose-700">{totalMortalityToDate} {isBn ? 'টি' : ''}</span>
            </div>
          </div>

          {/* Section 3: Actual Feed Used */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Wheat size={14} className="text-amber-600" />
                {isBn ? 'প্রকৃত ব্যবহৃত খাবার (Actual Feed Used)' : 'Actual Feed Used'}
              </span>
              {/* Unit Toggle */}
              <div className="flex items-center bg-white rounded-md p-0.5 border border-slate-300 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setFeedInputMode('kg')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    feedInputMode === 'kg' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isBn ? 'কেজি (kg)' : 'kg'}
                </button>
                <button
                  type="button"
                  onClick={() => setFeedInputMode('bag')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    feedInputMode === 'bag' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isBn ? 'বস্তা (bag)' : 'bag'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                  {isBn
                    ? `খাদ্যের পরিমাণ (${feedInputMode === 'bag' ? 'বস্তা' : 'কেজি'})`
                    : `Feed Amount (${feedInputMode})`}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isCompleted}
                  placeholder={isBn ? 'খাবার না দিলে ফাঁকা রাখুন' : 'Leave empty if none'}
                  value={feedAmount}
                  onChange={(e) => setFeedAmount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500">
                  {feedInputMode === 'bag' ? (isBn ? 'কেজিতে রূপান্তর:' : 'In kg:') : (isBn ? 'বস্তায় রূপান্তর:' : 'In bags:')}
                </span>
                <span className="text-xs font-bold text-amber-800">
                  {feedCalculation.kg !== null
                    ? feedInputMode === 'bag'
                      ? `${feedCalculation.kg} kg`
                      : `${feedCalculation.bags} bag (${configuredBagWeight}kg/bag)`
                    : '—'}
                </span>
              </div>
            </div>

            <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
              <span className="text-amber-900 font-medium">
                {isBn ? 'মোট সর্বমোট প্রকৃত খাদ্য (Cumulative Actual Feed):' : 'Cumulative Actual Feed Consumed:'}
              </span>
              <span className="font-bold text-amber-900">
                {cumulativeActualFeedUsedKg} kg
              </span>
            </div>
          </div>

          {/* Section 4: Weight Sample & Auto Average Weight */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Scale size={14} className="text-indigo-600" />
                {isBn ? 'ওজন নমুনা (Weight Sampling - ঐচ্ছিক)' : 'Weight Sampling (Optional)'}
              </span>
              {/* Weight unit toggle */}
              <div className="flex items-center bg-white rounded-md p-0.5 border border-slate-300 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setWeightInputUnit('g')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    weightInputUnit === 'g' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isBn ? 'গ্রাম (g)' : 'g'}
                </button>
                <button
                  type="button"
                  onClick={() => setWeightInputUnit('kg')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    weightInputUnit === 'kg' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isBn ? 'কেজি (kg)' : 'kg'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                  {isBn ? 'নমুনা বাচ্চার সংখ্যা' : 'Sample Count (Birds)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentLiveCount}
                  disabled={isCompleted}
                  placeholder={isBn ? 'যেমন: ১০' : 'e.g. 10'}
                  value={weightSampleCount}
                  onChange={(e) => setWeightSampleCount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                  {isBn ? `নমুনার মোট ওজন (${weightInputUnit})` : `Total Sample Weight (${weightInputUnit})`}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isCompleted}
                  placeholder={weightInputUnit === 'g' ? (isBn ? 'যেমন: ১৫০০' : 'e.g. 1500') : (isBn ? 'যেমন: ১.৫' : 'e.g. 1.5')}
                  value={totalSampleWeight}
                  onChange={(e) => setTotalSampleWeight(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Average Weight Display */}
            <div className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200 flex items-center justify-between text-xs">
              <span className="text-indigo-900 font-medium">
                {isBn ? 'গড় ওজন (Average Weight):' : 'Average Weight:'}
              </span>
              <span className="font-bold text-indigo-950 text-sm">
                {weightCalculation.avgWeightGram !== null
                  ? `${weightCalculation.avgWeightGram} g (${weightCalculation.avgWeightKg} kg)`
                  : (isBn ? '— (তথ্য দিলে হিসাব হবে)' : '— (Calculated on input)')}
              </span>
            </div>
          </div>

          {/* Section 5: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isBn ? 'মন্তব্য বা টীকা (Notes - ঐচ্ছিক)' : 'Notes (Optional)'}
            </label>
            <input
              type="text"
              disabled={isCompleted}
              placeholder={isBn ? 'বিশেষ কোনো পর্যবেক্ষণ থাকলে লিখুন' : 'Any special observation...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isCompleted || isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
              ) : existingForDate ? (
                <>
                  <CheckCircle2 size={15} />
                  <span>{isBn ? 'আপডেট করুন' : 'Update Record'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>{isBn ? 'দৈনিক রেকর্ড সংরক্ষণ' : 'Save Daily Record'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default DailyActualRecordModal;
