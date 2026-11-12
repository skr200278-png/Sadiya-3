import { collection, query, where } from 'firebase/firestore';
import { db, fastGetDocs } from '../firebase';
import { demoStore } from './demoStore';
import { fetchBatchDailyRecords } from '../services/dailyRecordService';
import { calculateStrictBatchFcr } from './fcrCalculationEngine';
import { 
  calculateProgressiveFeedForecast, 
  calculateStandardFlockCumulativeFeedKg, 
  calculateFlockWaterRequirement 
} from './feedStockCalculations';
import type { InsightMetricData } from '../components/SmartFarmInsightsCard';

export function calculateAgeInDays(startDate: string): number {
  if (!startDate) return 1;
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Universal helper to calculate accurate batch metrics, feed stock forecast,
 * mortality assessment, and cost ratios for Home, Dashboard, and Reports.
 */
export async function fetchBatchInsightsMetrics(
  batch: any,
  userId: string | undefined,
  isDemoUser: boolean,
  language: string = 'bn'
): Promise<InsightMetricData | null> {
  if (!batch) return null;

  try {
    let tFeedCost = 0;
    let tFeedBags = 0;
    let tMedCost = 0;
    let tOtherExp = 0;
    let tSales = 0;
    let tSalesQty = 0;
    let tSalesWeightKg = 0;
    let tMort = 0;
    let avgWeight = 0;

    const chickCost = Number(batch.totalChicks || 0) * Number(batch.costPerChick || 0);

    if (isDemoUser) {
      demoStore.getFeedRecords(batch.id).forEach(f => {
        tFeedCost += Number(f.cost || 0);
        if ((f as any).recordType !== 'actual_consumed') {
          tFeedBags += Number(f.quantityBags || 0);
        }
      });
      demoStore.getMedicineRecords(batch.id).forEach(m => {
        tMedCost += Number(m.cost || 0);
      });
      demoStore.getExpenses(batch.id).forEach(e => {
        tOtherExp += Number(e.amount || 0);
      });
      demoStore.getSales(batch.id).forEach(s => {
        tSales += Number(s.totalAmount || 0);
        tSalesQty += Number(s.quantity || 0);
        tSalesWeightKg += Number(s.totalWeightKg || 0);
        if (s.totalWeightKg && s.quantity) {
          avgWeight = Number(s.totalWeightKg) / Number(s.quantity);
        }
      });
      demoStore.getMortalityRecords(batch.id).forEach(m => {
        tMort += Number(m.count || 0);
      });
    } else if (userId) {
      const feedQ = query(collection(db, 'feed_records'), where('userId', '==', userId), where('batchId', '==', batch.id));
      const medQ = query(collection(db, 'medicine'), where('userId', '==', userId), where('batchId', '==', batch.id));
      const expQ = query(collection(db, 'expenses'), where('userId', '==', userId), where('batchId', '==', batch.id));
      const salesQ = query(collection(db, 'sales'), where('userId', '==', userId), where('batchId', '==', batch.id));
      const mortQ = query(collection(db, 'mortality'), where('userId', '==', userId), where('batchId', '==', batch.id));

      const [feedSnap, medSnap, expSnap, salesSnap, mortSnap] = await Promise.all([
        fastGetDocs(feedQ).catch(() => ({ forEach: () => {} } as any)),
        fastGetDocs(medQ).catch(() => ({ forEach: () => {} } as any)),
        fastGetDocs(expQ).catch(() => ({ forEach: () => {} } as any)),
        fastGetDocs(salesQ).catch(() => ({ forEach: () => {} } as any)),
        fastGetDocs(mortQ).catch(() => ({ forEach: () => {} } as any)),
      ]);

      feedSnap.forEach((d: any) => {
        const fData = d.data();
        tFeedCost += Number(fData.cost || 0);
        if (fData.recordType !== 'actual_consumed') {
          tFeedBags += Number(fData.quantityBags || fData.quantity || 0);
        }
      });

      medSnap.forEach((d: any) => {
        tMedCost += Number(d.data().cost || 0);
      });

      expSnap.forEach((d: any) => {
        tOtherExp += Number(d.data().amount || 0);
      });

      salesSnap.forEach((d: any) => {
        const sData = d.data();
        tSales += Number(sData.totalAmount || sData.totalPrice || 0);
        tSalesQty += Number(sData.quantity || 0);
        tSalesWeightKg += Number(sData.totalWeightKg || 0);
        if (sData.totalWeightKg && sData.quantity) {
          avgWeight = Number(sData.totalWeightKg) / Number(sData.quantity);
        }
      });

      mortSnap.forEach((d: any) => {
        tMort += Number(d.data().count || 0);
      });
    }

    const totalCost = chickCost + tFeedCost + tMedCost + tOtherExp;
    const netProfit = tSales - totalCost;
    const age = calculateAgeInDays(batch.startDate);

    const bagWeightKg = Math.max(1, Number(batch.bagWeightKg) || Number(localStorage.getItem(`bag_weight_${batch.id}`)) || 50);

    // Fetch batch daily actual records
    const dailyRecords = await fetchBatchDailyRecords(batch.id, userId || 'demo', isDemoUser);

    const batchScopeItem = {
      id: batch.id,
      userId: batch.userId || userId || 'demo',
      batchName: batch.name || batch.batchName || 'Batch',
      farmType: (batch.farmType || 'poultry') as any,
      subBreed: batch.subBreed || batch.breed || 'broiler',
      startDate: batch.startDate || new Date().toISOString().split('T')[0],
      totalChicks: Number(batch.totalChicks || batch.birdCount || 1000),
      costPerChick: Number(batch.costPerChick || 55),
      status: (batch.status === 'completed' ? 'completed' : 'active') as any,
      bagWeightKg
    };

    const fcrResult = calculateStrictBatchFcr(batchScopeItem, dailyRecords, tMort);

    const standardFlockCumKg = calculateStandardFlockCumulativeFeedKg(
      batchScopeItem.farmType,
      batchScopeItem.subBreed as any,
      fcrResult.currentLiveCount,
      fcrResult.batchAgeDays
    );

    let isAutoCalculatedFeed = false;
    let actualUsedFeedKg = fcrResult.totalActualFeedUsedKg;
    if (actualUsedFeedKg === 0) {
      if (batch.feedStockUsedKg !== undefined && Number(batch.feedStockUsedKg) > 0) {
        actualUsedFeedKg = Number(batch.feedStockUsedKg);
      } else {
        const savedUsed = localStorage.getItem(`fcr_stock_used_${batch.id}`);
        if (savedUsed && Number(savedUsed) > 0) {
          actualUsedFeedKg = Number(savedUsed);
        }
      }
    }

    let totalPurchasedBags = tFeedBags;
    if (totalPurchasedBags === 0) {
      if (batch.feedStockInKg !== undefined && Number(batch.feedStockInKg) > 0) {
        totalPurchasedBags = Number((Number(batch.feedStockInKg) / bagWeightKg).toFixed(1));
      } else {
        const savedIn = localStorage.getItem(`fcr_stock_in_${batch.id}`);
        if (savedIn && Number(savedIn) > 0) {
          totalPurchasedBags = Number((Number(savedIn) / bagWeightKg).toFixed(1));
        }
      }
    }

    const totalPurchasedKg = totalPurchasedBags * bagWeightKg;

    // Automatic Feed Tracking without daily farmer logging requirement:
    // If the farmer has not entered daily feeding logs (actualUsedFeedKg === 0)
    // and flock age is older than 2 days:
    if (actualUsedFeedKg === 0 && fcrResult.batchAgeDays > 2) {
      isAutoCalculatedFeed = true;
      if (totalPurchasedKg > 0) {
        // Birds have consumed up to standard, but cannot consume more than total purchased in godown
        actualUsedFeedKg = Math.min(totalPurchasedKg, standardFlockCumKg);
      } else {
        actualUsedFeedKg = standardFlockCumKg;
      }
    }

    const remainingKg = Math.max(0, totalPurchasedKg - actualUsedFeedKg);
    const remainingBags = bagWeightKg > 0 ? Number((remainingKg / bagWeightKg).toFixed(1)) : 0;
    const feedPurchasedBags = totalPurchasedBags;
    const feedUsedBags = bagWeightKg > 0 ? Number((actualUsedFeedKg / bagWeightKg).toFixed(1)) : 0;

    // Precision runway forecast
    const forecast = calculateProgressiveFeedForecast({
      aliveCount: fcrResult.currentLiveCount,
      currentAgeDays: fcrResult.batchAgeDays,
      remainingStockKg: remainingKg,
      bagWeightKg: bagWeightKg,
      sector: batchScopeItem.farmType,
      birdType: batchScopeItem.subBreed as any,
      batchName: batchScopeItem.batchName
    });

    const daysLeft = forecast.daysStockWillLast;
    const feedForecastNote = language === 'bn' ? forecast.forecastNoteBn : forecast.forecastNoteEn;
    const isFeedCoversEntireBatch = forecast.isCoveredUntilHarvest;
    const avgDaily = bagWeightKg > 0 ? Number((forecast.currentDailyRequirementKg / bagWeightKg).toFixed(2)) : 1;

    // Water requirement calculation
    const waterReq = calculateFlockWaterRequirement(
      batchScopeItem.farmType,
      batchScopeItem.subBreed as any,
      fcrResult.currentLiveCount,
      forecast.currentDailyRequirementKg,
      fcrResult.batchAgeDays
    );

    // Total target batch feed bags (e.g. 1 to 35 days)
    const targetHarvestDays = forecast.targetHarvestAgeDays || 35;
    const totalBatchTargetFeedKg = calculateStandardFlockCumulativeFeedKg(
      batchScopeItem.farmType,
      batchScopeItem.subBreed as any,
      fcrResult.currentLiveCount,
      targetHarvestDays
    );
    const totalBatchTargetFeedBags = Number((totalBatchTargetFeedKg / bagWeightKg).toFixed(1));
    const remainingFeedNeededToHarvestBags = forecast.totalFeedNeededUntilHarvestBags;

    // Retrieve measured sample weight from storage if available
    let measuredWeightGram: number | undefined = undefined;
    const savedWeight = localStorage.getItem(`batch_weight_${batch.id}`);
    if (savedWeight && Number(savedWeight) > 0) {
      measuredWeightGram = Number(savedWeight);
      avgWeight = measuredWeightGram / 1000;
    } else if (fcrResult.latestMeasuredAvgWeightGram) {
      measuredWeightGram = fcrResult.latestMeasuredAvgWeightGram;
      avgWeight = (fcrResult.latestMeasuredAvgWeightKg || measuredWeightGram / 1000);
    } else if (avgWeight > 0) {
      measuredWeightGram = Math.round(avgWeight * 1000);
    }

    const totalBirds = Number(batch.totalChicks || 0);
    const aliveBirds = fcrResult.currentLiveCount;
    const mortRate = totalBirds > 0 ? Number(((tMort / totalBirds) * 100).toFixed(1)) : 0;
    const survivalRate = Number((100 - mortRate).toFixed(1));

    return {
      totalChicks: totalBirds,
      aliveBirds,
      totalMortality: tMort,
      mortalityRate: mortRate,
      survivalRate,
      feedBagsPurchased: feedPurchasedBags,
      feedBagsUsed: feedUsedBags,
      feedStockRemainingBags: remainingBags,
      feedConsumedKg: actualUsedFeedKg,
      avgDailyFeedBags: avgDaily,
      daysOfFeedLeft: daysLeft,
      feedForecastNote,
      isFeedCoversEntireBatch,
      totalFeedCost: tFeedCost,
      totalMedicineCost: tMedCost,
      totalChickCost: chickCost,
      totalOtherExpenses: tOtherExp,
      totalCost,
      totalSalesRevenue: tSales,
      netProfit,
      avgWeightKg: avgWeight > 0 ? avgWeight : undefined,
      currentAvgWeightGram: measuredWeightGram,
      batchAgeDays: fcrResult.batchAgeDays || age,
      farmType: batch.farmType || 'poultry',
      species: batch.subBreed || batch.breed || 'broiler',
      // Auto-tracking & Water additions
      isAutoCalculatedFeed,
      dailyFeedKg: forecast.currentDailyRequirementKg,
      dailyWaterLitresNormal: waterReq.dailyWaterLitresNormal,
      dailyWaterLitresSummer: waterReq.dailyWaterLitresSummer,
      recommendedDrinkersCount: waterReq.recommendedDrinkersCount,
      totalBatchTargetFeedBags,
      remainingFeedNeededToHarvestBags,
      targetHarvestAgeDays: targetHarvestDays
    };
  } catch (err) {
    console.warn('Error computing batch insights metrics:', err);
    return null;
  }
}
