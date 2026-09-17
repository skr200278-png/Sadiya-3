/**
 * DAILY ACTUAL RECORD SERVICE
 * Manages CRUD operations for Daily Actual Records with strict batch isolation.
 * Automatically synchronizes batch actual usage with feed stock and subsystem logs.
 */

import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, offlineSafeDocWrite, fastGetDocs } from '../firebase';
import { DailyActualRecord } from '../types/fcrTypes';
import { demoStore } from '../utils/demoStore';

export const DAILY_RECORDS_COLLECTION = 'daily_actual_records';

/**
 * Fetch all daily actual records for a specific batch.
 * Guarantees zero cross-batch leakage.
 */
export async function fetchBatchDailyRecords(
  batchId: string,
  userId: string,
  isDemoUser: boolean
): Promise<DailyActualRecord[]> {
  if (!batchId) return [];

  if (isDemoUser) {
    return demoStore.getDailyActualRecords(batchId).sort((a, b) => b.date.localeCompare(a.date));
  }

  try {
    const q = query(
      collection(db, DAILY_RECORDS_COLLECTION),
      where('userId', '==', userId),
      where('batchId', '==', batchId)
    );
    const snap = await fastGetDocs(q);
    const records = snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyActualRecord));
    return records.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error('Error fetching batch daily actual records:', error);
    // Fallback to local demo store if offline or errored
    return demoStore.getDailyActualRecords(batchId).sort((a, b) => b.date.localeCompare(a.date));
  }
}

/**
 * Save or update a DailyActualRecord.
 * Automatically updates batch actual usage without altering feed purchase inventory.
 */
export async function saveDailyActualRecord(
  record: DailyActualRecord,
  isDemoUser: boolean
): Promise<void> {
  const recordId = record.id || `daily_${record.batchId}_${record.date}`;
  const cleanRecord: DailyActualRecord = {
    ...record,
    id: recordId,
    updatedAt: new Date().toISOString()
  };

  // 1. Save in Daily Actual Records
  if (isDemoUser) {
    demoStore.saveDailyActualRecord(cleanRecord);
  } else {
    const docRef = doc(db, DAILY_RECORDS_COLLECTION, recordId);
    await offlineSafeDocWrite(setDoc(docRef, cleanRecord, { merge: true }));
  }

  // 2. Integration: Save Actual Feed Used as actual_consumed for this specific batch
  if (record.actualFeedUsedKg !== null && record.actualFeedUsedKg > 0) {
    const feedUsageId = `actual_feed_${record.batchId}_${record.date}`;
    const feedUsageData = {
      id: feedUsageId,
      userId: record.userId,
      batchId: record.batchId,
      date: record.date,
      feedType: 'প্রকৃত ব্যবহৃত খাদ্য (Actual Fed)',
      quantityKg: record.actualFeedUsedKg,
      quantityBags: record.actualFeedUsedBags || Number((record.actualFeedUsedKg / record.bagWeightKgUsed).toFixed(2)),
      bagWeightKg: record.bagWeightKgUsed,
      recordType: 'actual_consumed',
      action: 'used',
      cost: 0,
      details: `দৈনিক প্রকৃত খাদ্য প্রদান: ${record.actualFeedUsedKg} কেজি (${record.actualFeedUsedBags || 0} বস্তা)`,
      updatedAt: new Date().toISOString(),
      createdAt: record.createdAt
    };

    if (isDemoUser) {
      demoStore.saveFeedRecord(feedUsageData as any);
    } else {
      const feedDocRef = doc(db, 'feed_records', feedUsageId);
      await offlineSafeDocWrite(setDoc(feedDocRef, feedUsageData, { merge: true }));
    }
  }

  // 3. Integration: Sync Mortality if today's mortality is explicitly provided
  if (record.todayMortality !== null && record.todayMortality >= 0) {
    const mortId = `mort_${record.batchId}_${record.date}`;
    const mortData = {
      id: mortId,
      userId: record.userId,
      batchId: record.batchId,
      date: record.date,
      count: record.todayMortality,
      cause: record.notes || 'দৈনিক নিয়মিত রেকর্ড',
      createdAt: record.createdAt,
      updatedAt: new Date().toISOString()
    };

    if (isDemoUser) {
      demoStore.saveMortalityRecord(mortData as any);
    } else {
      const mortDocRef = doc(db, 'mortality', mortId);
      await offlineSafeDocWrite(setDoc(mortDocRef, mortData, { merge: true }));
    }
  }

  // 4. Integration: Sync Weight if sampled
  if (record.avgWeightGram !== null && record.avgWeightGram > 0) {
    const weightId = `weight_${record.batchId}_${record.date}`;
    const weightData = {
      id: weightId,
      userId: record.userId,
      batchId: record.batchId,
      date: record.date,
      sampleCount: record.weightSampleCount || 1,
      totalSampleWeightKg: record.totalSampleWeightKg || 0,
      avgWeightGram: record.avgWeightGram,
      notes: record.notes || 'দৈনিক গড় ওজন নমুনা',
      createdAt: record.createdAt,
      updatedAt: new Date().toISOString()
    };

    if (isDemoUser) {
      // Keep weight in local cache
      const weightKey = `batch_weights_${record.batchId}`;
      const existing = JSON.parse(localStorage.getItem(weightKey) || '[]');
      const filtered = existing.filter((w: any) => w.date !== record.date);
      filtered.push(weightData);
      localStorage.setItem(weightKey, JSON.stringify(filtered));
      localStorage.setItem(`latest_weight_${record.batchId}`, JSON.stringify(weightData));
    } else {
      const weightDocRef = doc(db, 'weight_records', weightId);
      await offlineSafeDocWrite(setDoc(weightDocRef, weightData, { merge: true }));
    }
  }
}

/**
 * Delete a daily actual record
 */
export async function deleteDailyActualRecord(
  recordId: string,
  batchId: string,
  date: string,
  isDemoUser: boolean
): Promise<void> {
  if (isDemoUser) {
    demoStore.deleteDailyActualRecord(recordId);
  } else {
    const docRef = doc(db, DAILY_RECORDS_COLLECTION, recordId);
    await offlineSafeDocWrite(deleteDoc(docRef));

    // Also clean up linked feed record if any
    try {
      const feedDocRef = doc(db, 'feed_records', `actual_feed_${batchId}_${date}`);
      await offlineSafeDocWrite(deleteDoc(feedDocRef));
    } catch (e) {
      // Non-critical
    }
  }
}
