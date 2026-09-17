/**
 * ============================================================================
 * FCR BATCH-SCOPING & ISOLATION UTILITIES
 * ============================================================================
 * Enforces strict boundaries across batches, categories, and breeds:
 * - Zero cross-contamination between batches.
 * - Category -> Breed -> Batch selection hierarchy.
 * - Total separation of feed purchase (inventory) and actual feed fed.
 * - Dynamic configurable bag weight per batch.
 * - Age derived strictly from batch startDate.
 */

import {
  FarmCategory,
  BatchIdentifier,
  FcrBatchScopeSelectorState,
  FeedPurchaseRecord,
  ActualFeedUsageRecord,
  BatchMortalityRecord,
  BatchWeightRecord,
  BatchSalesRecord,
  BatchFcrRawDataset
} from '../types/fcrTypes';

/**
 * 1. Calculate age purely and strictly from batch.startDate.
 * Rule: Never calculate age from feed stock, medicine, or any secondary dates.
 */
export function calculateBatchAgeFromStartDate(
  startDate: string,
  asOfDate?: string
): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return 0;

  const target = asOfDate ? new Date(asOfDate) : new Date();
  if (isNaN(target.getTime())) return 0;

  // Normalize to UTC midnight to avoid timezone day-shift glitches
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const targetUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());

  const diffMs = targetUtc - startUtc;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Day 1 on start date (or diffDays if preferred; standard flock age is day 1 to day N)
  return Math.max(1, diffDays + 1);
}

/**
 * 2. Resolve configurable bag weight for a specific batch.
 * Rule: Bag weight must be configurable per batch; never hard-coded to 50kg.
 */
export function getBatchConfiguredBagWeight(
  batchId?: string,
  explicitBagWeight?: number,
  fallbackDefault = 50
): number {
  if (explicitBagWeight && explicitBagWeight > 0) {
    return explicitBagWeight;
  }
  if (batchId && typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(`bag_weight_${batchId}`);
    if (saved) {
      const parsed = Number(saved);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  return fallbackDefault;
}

/**
 * 3. Filter batches strictly by Category and Sub-Breed.
 * Rule:
 * - Active batches only (completed batches are archived).
 * - Category must match (poultry vs cattle vs fish).
 * - Breed must match (broiler vs layer vs sonali, etc.).
 */
export function filterBatchesForFcrScope(
  batches: any[],
  category: FarmCategory | null,
  subBreed?: string | null,
  includeCompleted = false
): BatchIdentifier[] {
  if (!Array.isArray(batches)) return [];

  return batches
    .filter((b) => {
      if (!b || !b.id) return false;

      // Status check: active vs completed
      if (!includeCompleted && b.status !== 'active') return false;
      if (includeCompleted && b.status !== 'completed' && b.status !== 'active') return false;

      // Category check
      if (category && b.farmType !== category) return false;

      // Sub-breed check
      if (subBreed && subBreed !== 'all') {
        const batchBreed = (b.subBreed || b.breed || '').toLowerCase();
        const targetBreed = subBreed.toLowerCase();
        if (batchBreed !== targetBreed) return false;
      }

      return true;
    })
    .map((b) => ({
      id: String(b.id),
      userId: String(b.userId || ''),
      batchName: String(b.batchName || 'Unnamed Batch'),
      farmType: (b.farmType || 'poultry') as FarmCategory,
      subBreed: String(b.subBreed || b.breed || ''),
      startDate: String(b.startDate || ''),
      completionDate: b.completionDate ? String(b.completionDate) : undefined,
      totalChicks: Number(b.totalChicks || 0),
      costPerChick: b.costPerChick ? Number(b.costPerChick) : 0,
      status: (b.status || 'active') as 'active' | 'completed' | 'archived',
      bagWeightKg: getBatchConfiguredBagWeight(b.id, b.bagWeightKg),
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    }));
}

/**
 * 4. Verify batch isolation for an arbitrary record.
 * Rule: batchId is mandatory; records from other batches or missing batchId must be rejected.
 */
export function validateRecordBatchScope(
  record: { batchId?: string },
  targetBatchId: string
): boolean {
  if (!record || !record.batchId || !targetBatchId) return false;
  return String(record.batchId).trim() === String(targetBatchId).trim();
}

/**
 * 5. Partition feed records into Purchase/Stock vs Actual Consumed Feed.
 * Rule:
 * - Feed purchase/stock is inventory, NEVER consumed feed.
 * - Only actual consumed feed goes into actual feed usage.
 * - Standard/expected feed is never injected or added to actual usage.
 * - Missing or mismatched batchId is strictly dropped.
 */
export function partitionFeedRecords(
  rawFeedRecords: any[],
  targetBatchId: string,
  configuredBagWeightKg: number
): {
  purchases: FeedPurchaseRecord[];
  actualUsages: ActualFeedUsageRecord[];
  totalPurchasedKg: number;
  totalActualConsumedKg: number;
} {
  const purchases: FeedPurchaseRecord[] = [];
  const actualUsages: ActualFeedUsageRecord[] = [];
  let totalPurchasedKg = 0;
  let totalActualConsumedKg = 0;

  if (!Array.isArray(rawFeedRecords) || !targetBatchId) {
    return { purchases, actualUsages, totalPurchasedKg, totalActualConsumedKg };
  }

  rawFeedRecords.forEach((item, index) => {
    // 1. Mandatory batchId check
    if (!item || !validateRecordBatchScope(item, targetBatchId)) {
      return; // Skip records from other batches or missing batchId
    }

    const recId = String(item.id || `feed-${index}`);
    const bagWeight = Number(item.bagWeightKg) || configuredBagWeightKg || 50;
    const bags = Number(item.quantityBags || item.bags || 0);

    // Calculate weight in KG safely
    let kg = 0;
    if (typeof item.quantityKg === 'number' && item.quantityKg > 0) {
      kg = item.quantityKg;
    } else if (bags > 0) {
      kg = bags * bagWeight;
    }

    // Determine if this is an inward purchase/stock or actual fed usage
    const isExplicitUsage =
      item.recordType === 'actual_consumed' ||
      item.type === 'usage' ||
      item.action === 'used' ||
      item.isConsumed === true;

    const isExplicitPurchase =
      item.recordType === 'purchase_stock' ||
      item.type === 'purchase' ||
      item.action === 'purchased' ||
      item.cost !== undefined;

    if (isExplicitUsage) {
      // Consumed feed by flock
      const usageRec: ActualFeedUsageRecord = {
        id: recId,
        batchId: targetBatchId,
        feedType: String(item.feedType || 'Feed'),
        quantityKg: kg,
        bagsFed: bags > 0 ? bags : Number((kg / bagWeight).toFixed(2)),
        bagWeightKg: bagWeight,
        date: String(item.date || new Date().toISOString().split('T')[0]),
        feedCost: item.cost ? Number(item.cost) : undefined,
        recordType: 'actual_consumed'
      };
      actualUsages.push(usageRec);
      totalActualConsumedKg += kg;
    } else if (isExplicitPurchase) {
      // Inward purchased inventory stock
      const purchaseRec: FeedPurchaseRecord = {
        id: recId,
        batchId: targetBatchId,
        feedType: String(item.feedType || 'Feed'),
        bagsReceived: bags,
        bagWeightKg: bagWeight,
        totalPurchasedKg: kg,
        cost: Number(item.cost || 0),
        date: String(item.date || new Date().toISOString().split('T')[0]),
        supplier: item.supplier ? String(item.supplier) : undefined,
        recordType: 'purchase_stock'
      };
      purchases.push(purchaseRec);
      totalPurchasedKg += kg;
    } else {
      // Fallback: Default legacy feed record was purchase with cost
      const purchaseRec: FeedPurchaseRecord = {
        id: recId,
        batchId: targetBatchId,
        feedType: String(item.feedType || 'Feed'),
        bagsReceived: bags,
        bagWeightKg: bagWeight,
        totalPurchasedKg: kg,
        cost: Number(item.cost || 0),
        date: String(item.date || new Date().toISOString().split('T')[0]),
        supplier: item.supplier ? String(item.supplier) : undefined,
        recordType: 'purchase_stock'
      };
      purchases.push(purchaseRec);
      totalPurchasedKg += kg;
    }
  });

  return {
    purchases,
    actualUsages,
    totalPurchasedKg: Number(totalPurchasedKg.toFixed(2)),
    totalActualConsumedKg: Number(totalActualConsumedKg.toFixed(2))
  };
}

/**
 * 6. Assemble an isolated BatchFcrRawDataset.
 * Rule:
 * - Purely scoped to target batch.
 * - No records from any other batch allowed.
 * - Age derived purely from batch.startDate.
 */
export function buildIsolatedBatchDataset(params: {
  batch: any;
  feedRecords?: any[];
  mortalityRecords?: any[];
  weightRecords?: any[];
  salesRecords?: any[];
  asOfDate?: string;
}): BatchFcrRawDataset | null {
  const { batch, feedRecords = [], mortalityRecords = [], weightRecords = [], salesRecords = [], asOfDate } = params;

  if (!batch || !batch.id) return null;

  const targetBatchId = String(batch.id);
  const configuredBagWeightKg = getBatchConfiguredBagWeight(targetBatchId, batch.bagWeightKg);

  const batchIdentifier: BatchIdentifier = {
    id: targetBatchId,
    userId: String(batch.userId || ''),
    batchName: String(batch.batchName || 'Unnamed Batch'),
    farmType: (batch.farmType || 'poultry') as FarmCategory,
    subBreed: String(batch.subBreed || batch.breed || ''),
    startDate: String(batch.startDate || ''),
    completionDate: batch.completionDate ? String(batch.completionDate) : undefined,
    totalChicks: Number(batch.totalChicks || 0),
    costPerChick: batch.costPerChick ? Number(batch.costPerChick) : 0,
    status: (batch.status || 'active') as 'active' | 'completed' | 'archived',
    bagWeightKg: configuredBagWeightKg,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt
  };

  // 1. Age derived strictly from batch.startDate
  const ageDays = calculateBatchAgeFromStartDate(batchIdentifier.startDate, asOfDate);

  // 2. Separate Feed Records with batch isolation
  const { purchases, actualUsages, totalPurchasedKg, totalActualConsumedKg } = partitionFeedRecords(
    feedRecords,
    targetBatchId,
    configuredBagWeightKg
  );

  // 3. Filter Mortality Records strictly for this batch
  const isolatedMortality: BatchMortalityRecord[] = [];
  let totalMortalityCount = 0;
  mortalityRecords.forEach((m, idx) => {
    if (validateRecordBatchScope(m, targetBatchId)) {
      const count = Number(m.count || 0);
      isolatedMortality.push({
        id: String(m.id || `mort-${idx}`),
        batchId: targetBatchId,
        count,
        date: String(m.date || ''),
        cause: m.cause ? String(m.cause) : undefined
      });
      totalMortalityCount += count;
    }
  });

  // 4. Calculate current live quantity
  const currentLiveQuantity = Math.max(0, batchIdentifier.totalChicks - totalMortalityCount);

  // 5. Filter Weight Records strictly for this batch
  const isolatedWeights: BatchWeightRecord[] = [];
  let latestMeasuredAvgWeightGram = 0;
  weightRecords.forEach((w, idx) => {
    if (validateRecordBatchScope(w, targetBatchId)) {
      const avgGram = Number(w.avgWeightGram || w.weightGram || 0);
      isolatedWeights.push({
        id: String(w.id || `wt-${idx}`),
        batchId: targetBatchId,
        sampleCount: Number(w.sampleCount || 1),
        totalSampleWeightKg: Number(w.totalSampleWeightKg || 0),
        avgWeightGram: avgGram,
        date: String(w.date || ''),
        notes: w.notes ? String(w.notes) : undefined
      });
      if (avgGram > 0) {
        latestMeasuredAvgWeightGram = avgGram;
      }
    }
  });

  // Check batch-specific sample weight from local storage if not logged in records
  if (latestMeasuredAvgWeightGram === 0 && typeof window !== 'undefined' && window.localStorage) {
    const cachedWeight = Number(localStorage.getItem(`batch_weight_${targetBatchId}`));
    if (!isNaN(cachedWeight) && cachedWeight > 0) {
      latestMeasuredAvgWeightGram = cachedWeight;
    }
  }

  // 6. Filter Sales Records strictly for this batch
  const isolatedSales: BatchSalesRecord[] = [];
  let totalSoldQuantity = 0;
  let totalSoldWeightKg = 0;
  salesRecords.forEach((s, idx) => {
    if (validateRecordBatchScope(s, targetBatchId)) {
      const qty = Number(s.quantity || 0);
      const wt = Number(s.totalWeightKg || 0);
      isolatedSales.push({
        id: String(s.id || `sale-${idx}`),
        batchId: targetBatchId,
        quantity: qty,
        totalWeightKg: wt,
        totalAmount: Number(s.totalAmount || 0),
        date: String(s.date || ''),
        buyerName: s.buyerName ? String(s.buyerName) : undefined
      });
      totalSoldQuantity += qty;
      totalSoldWeightKg += wt;
    }
  });

  return {
    batch: batchIdentifier,
    ageDays,
    feedPurchases: purchases,
    totalPurchasedKg,
    actualFeedUsage: actualUsages,
    totalActualFeedConsumedKg: totalActualConsumedKg,
    mortalityRecords: isolatedMortality,
    totalMortalityCount,
    currentLiveQuantity,
    weightRecords: isolatedWeights,
    latestMeasuredAvgWeightGram,
    salesRecords: isolatedSales,
    totalSoldQuantity,
    totalSoldWeightKg,
    configuredBagWeightKg
  };
}

/**
 * 7. State constructor for Category -> Breed -> Batch Selection flow.
 * Rule: isScopeReady is true ONLY if valid active batch is selected matching category and breed.
 */
export function buildFcrScopeSelectorState(
  category: FarmCategory | null,
  subBreed: string | null,
  batchId: string | null,
  batches: any[]
): FcrBatchScopeSelectorState {
  if (!category || !subBreed || !batchId) {
    return {
      category,
      subBreed,
      batchId,
      selectedBatch: null,
      isScopeReady: false
    };
  }

  const matchingBatches = filterBatchesForFcrScope(batches, category, subBreed, false);
  const found = matchingBatches.find((b) => b.id === batchId);

  return {
    category,
    subBreed,
    batchId,
    selectedBatch: found || null,
    isScopeReady: Boolean(found && found.status === 'active')
  };
}
