/**
 * ============================================================================
 * DAILY ACTUAL RECORD ENGINE & BATCH-ISOLATION UTILITIES
 * ============================================================================
 * Handles calculations, validations, and storage for batch-scoped daily logs:
 * - Age derived purely from batch.startDate.
 * - Opening live count derived from initial stocking minus prior mortality/sales.
 * - Today's mortality & cumulative mortality calculations.
 * - Configurable bag-weight feed conversion (kg <-> bag).
 * - Internal weight calculation in kg with clear display in g/kg.
 * - Duplicate prevention (same batch & date -> update, no duplicate).
 * - Zero cross-contamination between batches.
 * - Completed batch lock.
 */

import {
  BatchIdentifier,
  DailyActualRecord,
  DailyRecordFormInput
} from '../types/fcrTypes';
import { calculateBatchAgeFromStartDate, getBatchConfiguredBagWeight, validateRecordBatchScope } from './fcrBatchScope';

export interface DailyRecordCalculationContext {
  batch: BatchIdentifier;
  existingDailyRecords: DailyActualRecord[];
  allMortalityRecords?: Array<{ batchId: string; date: string; count: number }>;
  allSalesRecords?: Array<{ batchId: string; date: string; quantity: number }>;
  allFeedUsageRecords?: Array<{ batchId: string; date: string; quantityKg: number }>;
}

export interface DailyRecordValidationResult {
  isValid: boolean;
  errors: string[];
  calculatedRecord?: DailyActualRecord;
  isExistingUpdate?: boolean;
  existingRecordId?: string;
}

/**
 * 1. Calculate opening live count for a specific date
 * Initial stocking minus mortality before target date minus sales before target date.
 */
export function calculateOpeningLiveCount(
  batch: BatchIdentifier,
  targetDate: string,
  mortalityRecords: Array<{ batchId: string; date: string; count: number }> = [],
  salesRecords: Array<{ batchId: string; date: string; quantity: number }> = []
): number {
  if (!batch || !batch.id) return 0;
  const initial = Number(batch.totalChicks || 0);
  const targetTime = new Date(targetDate).getTime();

  // Sum prior mortality for THIS batch only
  let priorMortality = 0;
  mortalityRecords.forEach((m) => {
    if (validateRecordBatchScope(m, batch.id)) {
      const mTime = new Date(m.date).getTime();
      if (!isNaN(mTime) && mTime < targetTime) {
        priorMortality += Number(m.count || 0);
      }
    }
  });

  // Sum prior sales for THIS batch only
  let priorSales = 0;
  salesRecords.forEach((s) => {
    if (validateRecordBatchScope(s, batch.id)) {
      const sTime = new Date(s.date).getTime();
      if (!isNaN(sTime) && sTime < targetTime) {
        priorSales += Number(s.quantity || 0);
      }
    }
  });

  return Math.max(0, initial - priorMortality - priorSales);
}

/**
 * 2. Calculate cumulative mortality up to and including targetDate for this batch
 */
export function calculateCumulativeMortality(
  batchId: string,
  targetDate: string,
  todayMortality: number,
  allMortalityRecords: Array<{ batchId: string; date: string; count: number }> = []
): number {
  const targetTime = new Date(targetDate).getTime();
  let total = Math.max(0, todayMortality);

  allMortalityRecords.forEach((m) => {
    if (validateRecordBatchScope(m, batchId)) {
      const mTime = new Date(m.date).getTime();
      // Add records strictly prior to target date (today is already added)
      if (!isNaN(mTime) && mTime < targetTime) {
        total += Number(m.count || 0);
      }
    }
  });

  return total;
}

/**
 * 3. Calculate cumulative actual feed used up to and including targetDate for this batch
 * Rule: Only actual feed used for this batch is summed. Standard or stock is NEVER included.
 */
export function calculateCumulativeActualFeedUsed(
  batchId: string,
  targetDate: string,
  todayFeedKg: number | null,
  existingDailyRecords: DailyActualRecord[] = [],
  existingFeedUsages: Array<{ batchId: string; date: string; quantityKg: number }> = []
): number {
  const targetTime = new Date(targetDate).getTime();
  let cumulativeKg = todayFeedKg !== null && todayFeedKg > 0 ? todayFeedKg : 0;

  // Use existing daily records first
  const seenDates = new Set<string>();
  existingDailyRecords.forEach((r) => {
    if (validateRecordBatchScope(r, batchId) && r.date !== targetDate) {
      const rTime = new Date(r.date).getTime();
      if (!isNaN(rTime) && rTime < targetTime && r.actualFeedUsedKg && r.actualFeedUsedKg > 0) {
        cumulativeKg += r.actualFeedUsedKg;
        seenDates.add(r.date);
      }
    }
  });

  // Include any other isolated actual feed usage records for dates not yet in daily records
  existingFeedUsages.forEach((f) => {
    if (validateRecordBatchScope(f, batchId) && f.date !== targetDate && !seenDates.has(f.date)) {
      const fTime = new Date(f.date).getTime();
      if (!isNaN(fTime) && fTime < targetTime && f.quantityKg > 0) {
        cumulativeKg += Number(f.quantityKg);
      }
    }
  });

  return Number(cumulativeKg.toFixed(2));
}

/**
 * 4. Validate and construct a DailyActualRecord from user input
 */
export function processDailyRecordInput(
  input: DailyRecordFormInput,
  context: DailyRecordCalculationContext
): DailyRecordValidationResult {
  const errors: string[] = [];
  const { batch, existingDailyRecords, allMortalityRecords = [], allSalesRecords = [], allFeedUsageRecords = [] } = context;

  // Rule 1: Batch must be valid and ACTIVE
  if (!batch || !batch.id) {
    return { isValid: false, errors: ['কোনো সক্রিয় ব্যাচ নির্বাচন করা হয়নি।'] };
  }

  if (batch.status === 'completed') {
    return { isValid: false, errors: ['সমাপ্ত (Completed) ব্যাচে নতুন দৈনিক রেকর্ড যোগ করা যাবে না।'] };
  }

  // Rule 2: Date is mandatory
  if (!input.date || !input.date.trim()) {
    errors.push('তারিখ প্রদান করা আবশ্যক।');
  }

  const targetDate = input.date.trim();
  const configuredBagWeight = getBatchConfiguredBagWeight(batch.id, batch.bagWeightKg);

  // Rule 3: Batch age strictly from batch.startDate
  const batchAgeDays = calculateBatchAgeFromStartDate(batch.startDate, targetDate);

  // Rule 4: Opening live count calculation
  const openingLiveCount = calculateOpeningLiveCount(batch, targetDate, allMortalityRecords, allSalesRecords);

  // Rule 5: Today's mortality validation
  let parsedMortality: number | null = null;
  if (input.todayMortality.trim() !== '') {
    const m = Number(input.todayMortality);
    if (isNaN(m)) {
      errors.push('মৃত্যুর সংখ্যা সঠিক সংখ্যা হতে হবে।');
    } else if (m < 0) {
      errors.push('মৃত্যু সংখ্যা ঋণাত্মক (negative) হতে পারে না।');
    } else if (m > openingLiveCount) {
      errors.push(`আজকের মৃত্যু সংখ্যা (${m}) বর্তমান জীবিত সংখ্যার (${openingLiveCount}) চেয়ে বেশি হতে পারে না।`);
    } else {
      parsedMortality = Math.round(m);
    }
  }

  // Rule 6: Current live count
  const currentLiveCount = Math.max(0, openingLiveCount - (parsedMortality || 0));

  // Rule 7: Total cumulative mortality
  const totalMortalityToDate = calculateCumulativeMortality(
    batch.id,
    targetDate,
    parsedMortality || 0,
    allMortalityRecords
  );

  // Rule 8: Actual feed used validation (kg or configured bags)
  let actualFeedUsedKg: number | null = null;
  let actualFeedUsedBags: number | null = null;

  if (input.feedAmount.trim() !== '') {
    const f = Number(input.feedAmount);
    if (isNaN(f)) {
      errors.push('খাদ্যের পরিমাণ সঠিক সংখ্যা হতে হবে।');
    } else if (f < 0) {
      errors.push('খাদ্যের পরিমাণ ঋণাত্মক হতে পারে না।');
    } else {
      if (input.feedInputMode === 'bag') {
        actualFeedUsedBags = Number(f.toFixed(2));
        actualFeedUsedKg = Number((f * configuredBagWeight).toFixed(2));
      } else {
        actualFeedUsedKg = Number(f.toFixed(2));
        actualFeedUsedBags = Number((f / configuredBagWeight).toFixed(2));
      }
    }
  }

  // Rule 9: Cumulative actual feed calculation
  const cumulativeActualFeedUsedKg = calculateCumulativeActualFeedUsed(
    batch.id,
    targetDate,
    actualFeedUsedKg,
    existingDailyRecords,
    allFeedUsageRecords
  );

  // Rule 10 & 11 & 12: Weight Sample & Average Weight
  let weightSampleCount: number | null = null;
  let totalSampleWeightKg: number | null = null;
  let avgWeightGram: number | null = null;
  let avgWeightKg: number | null = null;

  const hasCountInput = input.weightSampleCount.trim() !== '';
  const hasWeightInput = input.totalSampleWeight.trim() !== '';

  if (hasCountInput || hasWeightInput) {
    if (!hasCountInput) {
      errors.push('নমুনা বাচ্চার সংখ্যা প্রদান করুন।');
    } else if (!hasWeightInput) {
      errors.push('নমুনার মোট ওজন প্রদান করুন।');
    } else {
      const count = Number(input.weightSampleCount);
      const wt = Number(input.totalSampleWeight);

      if (isNaN(count) || count <= 0) {
        errors.push('নমুনা বাচ্চার সংখ্যা শূন্যের চেয়ে বেশি হতে হবে।');
      } else if (count > currentLiveCount) {
        errors.push(`নমুনা সংখ্যা (${count}) বর্তমান জীবিত বাচ্চার (${currentLiveCount}) চেয়ে বেশি হতে পারে না।`);
      }

      if (isNaN(wt) || wt <= 0) {
        errors.push('নমুনার মোট ওজন শূন্যের চেয়ে বেশি হতে হবে।');
      }

      if (!isNaN(count) && count > 0 && !isNaN(wt) && wt > 0 && count <= currentLiveCount) {
        weightSampleCount = Math.round(count);
        // Normalize weight to KG internally
        if (input.weightInputUnit === 'g') {
          totalSampleWeightKg = Number((wt / 1000).toFixed(4));
        } else {
          totalSampleWeightKg = Number(wt.toFixed(4));
        }

        const avgKg = totalSampleWeightKg / weightSampleCount;
        avgWeightKg = Number(avgKg.toFixed(4));
        avgWeightGram = Math.round(avgKg * 1000);
      }
    }
  }

  // Check duplicate record for same batch and same date
  const existingRecord = existingDailyRecords.find(
    (r) => validateRecordBatchScope(r, batch.id) && r.date === targetDate
  );

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      isExistingUpdate: Boolean(existingRecord),
      existingRecordId: existingRecord?.id
    };
  }

  const record: DailyActualRecord = {
    id: existingRecord?.id || `daily_${batch.id}_${targetDate}`,
    userId: batch.userId,
    batchId: batch.id,
    date: targetDate,
    batchAgeDays,
    openingLiveCount,
    todayMortality: parsedMortality,
    totalMortalityToDate,
    currentLiveCount,
    feedInputMode: input.feedInputMode,
    actualFeedUsedKg,
    actualFeedUsedBags,
    bagWeightKgUsed: configuredBagWeight,
    cumulativeActualFeedUsedKg,
    weightSampleCount,
    totalSampleWeightKg,
    weightInputUnit: input.weightInputUnit,
    avgWeightGram,
    avgWeightKg,
    notes: input.notes.trim() || undefined,
    createdAt: existingRecord?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    isValid: true,
    errors: [],
    calculatedRecord: record,
    isExistingUpdate: Boolean(existingRecord),
    existingRecordId: existingRecord?.id
  };
}
