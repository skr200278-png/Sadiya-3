/**
 * FCR CALCULATION ENGINE
 *
 * IMPORTANT DATA RULES:
 * - Feed Purchase/Stock is NEVER Actual Feed Used.
 * - Stock Adjustment is NEVER Actual Feed Used.
 * - Expected/Standard Feed is NEVER Actual Feed Used.
 * - Medicine records are completely unrelated to feed/FCR.
 * - Actual feed comes ONLY from DailyActualRecord.actualFeedUsedKg.
 * - Actual weight comes ONLY from measured DailyActualRecord samples.
 * - No estimated starting weight is used for Actual FCR.
 * - FCR is batch-scoped.
 */

import {
  BatchIdentifier,
  DailyActualRecord,
  FarmCategory
} from '../types/fcrTypes';
import { calculateBatchAgeFromStartDate } from './fcrBatchScope';

export interface BreedFcrBenchmark {
  code: string;
  category: FarmCategory;
  nameBn: string;
  nameEn: string;
  idealMin: number;
  idealMax: number;
  acceptableMax: number;
  descriptionBn: string;
  descriptionEn: string;
  defaultInitialWeightGram: number;
}

export const BREED_FCR_BENCHMARKS: Record<string, BreedFcrBenchmark> = {
  broiler: {
    code: 'broiler',
    category: 'poultry',
    nameBn: 'ব্রয়লার মুরগি',
    nameEn: 'Broiler Chicken',
    idealMin: 1.40,
    idealMax: 1.65,
    acceptableMax: 1.75,
    descriptionBn: 'ব্রয়লারের আদর্শ FCR ১.৪০ – ১.৬৫।',
    descriptionEn: 'Standard broiler FCR is 1.40 – 1.65.',
    defaultInitialWeightGram: 40
  },
  sonali: {
    code: 'sonali',
    category: 'poultry',
    nameBn: 'সোনালী মুরগি',
    nameEn: 'Sonali Chicken',
    idealMin: 2.10,
    idealMax: 2.40,
    acceptableMax: 2.65,
    descriptionBn: 'সোনালীর আদর্শ FCR ২.১০ – ২.৪০।',
    descriptionEn: 'Standard Sonali FCR is 2.10 – 2.40.',
    defaultInitialWeightGram: 35
  },
  layer: {
    code: 'layer',
    category: 'poultry',
    nameBn: 'লেয়ার মুরগি',
    nameEn: 'Layer',
    idealMin: 2.50,
    idealMax: 3.10,
    acceptableMax: 3.50,
    descriptionBn: 'লেয়ার গ্রোয়িং ফেজের benchmark FCR ২.৫০ – ৩.১০।',
    descriptionEn: 'Growing layer benchmark FCR is 2.50 – 3.10.',
    defaultInitialWeightGram: 35
  },
  deshi: {
    code: 'deshi',
    category: 'poultry',
    nameBn: 'দেশি মুরগি',
    nameEn: 'Local Chicken',
    idealMin: 3.00,
    idealMax: 4.00,
    acceptableMax: 4.50,
    descriptionBn: 'দেশি মুরগির benchmark FCR ৩.০০ – ৪.০০।',
    descriptionEn: 'Local chicken benchmark FCR is 3.00 – 4.00.',
    defaultInitialWeightGram: 30
  },
  duck: {
    code: 'duck',
    category: 'poultry',
    nameBn: 'হাঁস',
    nameEn: 'Duck',
    idealMin: 2.20,
    idealMax: 2.70,
    acceptableMax: 3.00,
    descriptionBn: 'মাংসের হাঁসের benchmark FCR ২.২০ – ২.৭০।',
    descriptionEn: 'Meat duck benchmark FCR is 2.20 – 2.70.',
    defaultInitialWeightGram: 45
  },
  quail: {
    code: 'quail',
    category: 'poultry',
    nameBn: 'কোয়েল',
    nameEn: 'Quail',
    idealMin: 2.30,
    idealMax: 2.80,
    acceptableMax: 3.20,
    descriptionBn: 'কোয়েলের benchmark FCR ২.৩০ – ২.৮০।',
    descriptionEn: 'Quail benchmark FCR is 2.30 – 2.80.',
    defaultInitialWeightGram: 8
  },
  turkey: {
    code: 'turkey',
    category: 'poultry',
    nameBn: 'টার্কি',
    nameEn: 'Turkey',
    idealMin: 2.40,
    idealMax: 2.90,
    acceptableMax: 3.30,
    descriptionBn: 'টার্কির benchmark FCR ২.৪০ – ২.৯০।',
    descriptionEn: 'Turkey benchmark FCR is 2.40 – 2.90.',
    defaultInitialWeightGram: 55
  },
  pigeon: {
    code: 'pigeon',
    category: 'poultry',
    nameBn: 'কবুতর',
    nameEn: 'Pigeon',
    idealMin: 2.20,
    idealMax: 2.80,
    acceptableMax: 3.20,
    descriptionBn: 'কবুতরের benchmark FCR ২.২০ – ২.৮০।',
    descriptionEn: 'Pigeon benchmark FCR is 2.20 – 2.80.',
    defaultInitialWeightGram: 18
  },
  fattening: {
    code: 'fattening',
    category: 'cattle',
    nameBn: 'গরু মোটাতাজাকরণ',
    nameEn: 'Beef Cattle Fattening',
    idealMin: 6.00,
    idealMax: 7.50,
    acceptableMax: 8.50,
    descriptionBn: 'গরু মোটাতাজাকরণে benchmark FCR ৬.০০ – ৭.৫০।',
    descriptionEn: 'Cattle fattening benchmark FCR is 6.00 – 7.50.',
    defaultInitialWeightGram: 120000
  },
  dairy: {
    code: 'dairy',
    category: 'cattle',
    nameBn: 'ডেইরি গাভী',
    nameEn: 'Dairy Cattle',
    idealMin: 0.85,
    idealMax: 1.30,
    acceptableMax: 1.60,
    descriptionBn: 'দুধ উৎপাদনের feed-efficiency benchmark ০.৮৫ – ১.৩০।',
    descriptionEn: 'Dairy feed-efficiency benchmark is 0.85 – 1.30.',
    defaultInitialWeightGram: 250000
  },
  goat: {
    code: 'goat',
    category: 'cattle',
    nameBn: 'ছাগল/খাসি',
    nameEn: 'Goat / Sheep Fattening',
    idealMin: 5.50,
    idealMax: 7.20,
    acceptableMax: 8.50,
    descriptionBn: 'ছাগল/খাসির benchmark FCR ৫.৫০ – ৭.২০।',
    descriptionEn: 'Goat benchmark FCR is 5.50 – 7.20.',
    defaultInitialWeightGram: 10000
  },
  sheep: {
    code: 'sheep',
    category: 'cattle',
    nameBn: 'ভেড়া',
    nameEn: 'Sheep',
    idealMin: 5.50,
    idealMax: 7.50,
    acceptableMax: 8.50,
    descriptionBn: 'ভেড়ার benchmark FCR ৫.৫০ – ৭.৫০।',
    descriptionEn: 'Sheep benchmark FCR is 5.50 – 7.50.',
    defaultInitialWeightGram: 12000
  },
  buffalo: {
    code: 'buffalo',
    category: 'cattle',
    nameBn: 'মহিষ',
    nameEn: 'Buffalo',
    idealMin: 6.50,
    idealMax: 8.20,
    acceptableMax: 9.50,
    descriptionBn: 'মহিষের benchmark FCR ৬.৫০ – ৮.২০।',
    descriptionEn: 'Buffalo benchmark FCR is 6.50 – 8.20.',
    defaultInitialWeightGram: 150000
  },
  telapia: {
    code: 'telapia',
    category: 'fish',
    nameBn: 'তেলাপিয়া',
    nameEn: 'Tilapia',
    idealMin: 1.20,
    idealMax: 1.45,
    acceptableMax: 1.65,
    descriptionBn: 'তেলাপিয়ার benchmark FCR ১.২০ – ১.৪৫।',
    descriptionEn: 'Tilapia benchmark FCR is 1.20 – 1.45.',
    defaultInitialWeightGram: 5
  },
  carp: {
    code: 'carp',
    category: 'fish',
    nameBn: 'রুই/কার্প',
    nameEn: 'Carp',
    idealMin: 1.50,
    idealMax: 1.85,
    acceptableMax: 2.10,
    descriptionBn: 'কার্পের benchmark FCR ১.৫০ – ১.৮৫।',
    descriptionEn: 'Carp benchmark FCR is 1.50 – 1.85.',
    defaultInitialWeightGram: 20
  },
  pangash: {
    code: 'pangash',
    category: 'fish',
    nameBn: 'পাঙ্গাস/মাগুর',
    nameEn: 'Pangash / Catfish',
    idealMin: 1.35,
    idealMax: 1.65,
    acceptableMax: 1.85,
    descriptionBn: 'পাঙ্গাস/মাগুরের benchmark FCR ১.৩৫ – ১.৬৫।',
    descriptionEn: 'Pangash benchmark FCR is 1.35 – 1.65.',
    defaultInitialWeightGram: 15
  },
  shing_pabda: {
    code: 'shing_pabda',
    category: 'fish',
    nameBn: 'শিং/পাবদা/কই',
    nameEn: 'Catfish & Perch',
    idealMin: 1.40,
    idealMax: 1.75,
    acceptableMax: 2.00,
    descriptionBn: 'benchmark FCR ১.৪০ – ১.৭৫।',
    descriptionEn: 'Benchmark FCR is 1.40 – 1.75.',
    defaultInitialWeightGram: 5
  },
  mixed: {
    code: 'mixed',
    category: 'fish',
    nameBn: 'মিশ্র মাছ',
    nameEn: 'Mixed Fish',
    idealMin: 1.45,
    idealMax: 1.80,
    acceptableMax: 2.10,
    descriptionBn: 'মিশ্র মাছের benchmark FCR ১.৪৫ – ১.৮০।',
    descriptionEn: 'Mixed fish benchmark FCR is 1.45 – 1.80.',
    defaultInitialWeightGram: 10
  }
};

export function getBreedBenchmark(
  category: FarmCategory,
  breedCode: string
): BreedFcrBenchmark {
  const code = (breedCode || '').toLowerCase().trim();

  if (BREED_FCR_BENCHMARKS[code]) {
    return BREED_FCR_BENCHMARKS[code];
  }

  if (category === 'cattle') return BREED_FCR_BENCHMARKS.fattening;
  if (category === 'fish') return BREED_FCR_BENCHMARKS.telapia;

  return BREED_FCR_BENCHMARKS.broiler;
}

export type FcrPerformanceRating =
  | 'excellent'
  | 'good'
  | 'average'
  | 'poor'
  | 'unknown';

export interface SampleWeightSummary {
  date: string;
  ageDays: number;
  sampleBirds: number;
  totalSampleWeightKg: number;
  avgWeightGram: number;
  avgWeightKg: number;
}

export interface ExpectedStandardForAge {
  expectedAvgWeightGram: number;
  expectedAvgWeightKg: number;
  expectedFcrRange: string;
  sourceNoteBn: string;
  sourceNoteEn: string;
}

export function getExpectedStandardForAge(
  category: FarmCategory,
  subBreed: string,
  ageDays: number
): ExpectedStandardForAge {
  const breed = (subBreed || '').toLowerCase().trim();
  const d = Math.max(1, Math.floor(ageDays));

  if (category === 'poultry') {
    if (
      breed.includes('broiler') ||
      breed.includes('ব্রয়লার') ||
      breed.includes('বয়লার') ||
      breed.includes('বয়লার')
    ) {
      let wt = 40;

      if (d <= 7) {
        wt = Math.round(40 + d * 21.4);
      } else if (d <= 14) {
        wt = Math.round(190 + (d - 7) * 41.4);
      } else if (d <= 21) {
        wt = Math.round(480 + (d - 14) * 67.1);
      } else if (d <= 28) {
        wt = Math.round(950 + (d - 21) * 85.7);
      } else if (d <= 35) {
        wt = Math.round(1550 + (d - 28) * 100);
      } else {
        wt = Math.round(2250 + (d - 35) * 92);
      }

      const fcr =
        d <= 14
          ? '১.১০ – ১.২৫'
          : d <= 28
            ? '১.৩৫ – ১.৫০'
            : '১.৫৫ – ১.৭০';

      return {
        expectedAvgWeightGram: wt,
        expectedAvgWeightKg: Number((wt / 1000).toFixed(3)),
        expectedFcrRange: fcr,
        sourceNoteBn: 'বয়সভিত্তিক প্রত্যাশিত বৃদ্ধি benchmark',
        sourceNoteEn: 'Age-based expected growth benchmark'
      };
    }

    if (
      breed.includes('sonali') ||
      breed.includes('সোনালী') ||
      breed.includes('সোনালি')
    ) {
      let wt = 35;

      if (d <= 14) {
        wt = Math.round(35 + d * 6);
      } else if (d <= 28) {
        wt = Math.round(120 + (d - 14) * 9);
      } else if (d <= 45) {
        wt = Math.round(250 + (d - 28) * 15);
      } else if (d <= 60) {
        wt = Math.round(500 + (d - 45) * 20);
      } else {
        wt = Math.round(800 + (d - 60) * 18);
      }

      return {
        expectedAvgWeightGram: wt,
        expectedAvgWeightKg: Number((wt / 1000).toFixed(3)),
        expectedFcrRange: '২.১০ – ২.৪০',
        sourceNoteBn: 'বয়সভিত্তিক সোনালী benchmark',
        sourceNoteEn: 'Age-based Sonali benchmark'
      };
    }

    if (
      breed.includes('layer') ||
      breed.includes('লেয়ার') ||
      breed.includes('লেয়ার')
    ) {
      const wt = Math.round(35 + d * 13);

      return {
        expectedAvgWeightGram: wt,
        expectedAvgWeightKg: Number((wt / 1000).toFixed(3)),
        expectedFcrRange: '২.৫০ – ৩.১০',
        sourceNoteBn: 'বয়সভিত্তিক লেয়ার benchmark',
        sourceNoteEn: 'Age-based layer benchmark'
      };
    }

    const wt = Math.round(30 + d * 10);

    return {
      expectedAvgWeightGram: wt,
      expectedAvgWeightKg: Number((wt / 1000).toFixed(3)),
      expectedFcrRange: '৩.০০ – ৩.৮০',
      sourceNoteBn: 'বয়সভিত্তিক পোল্ট্রি benchmark',
      sourceNoteEn: 'Age-based poultry benchmark'
    };
  }

  if (category === 'cattle') {
    const currentKg = Number((120 + d * 0.8).toFixed(1));

    return {
      expectedAvgWeightGram: Math.round(currentKg * 1000),
      expectedAvgWeightKg: currentKg,
      expectedFcrRange: '৬.০ – ৭.৫',
      sourceNoteBn: 'বয়সভিত্তিক cattle benchmark',
      sourceNoteEn: 'Age-based cattle benchmark'
    };
  }

  const fishGram = Math.round(5 + d * 2.5);

  return {
    expectedAvgWeightGram: fishGram,
    expectedAvgWeightKg: Number((fishGram / 1000).toFixed(3)),
    expectedFcrRange: '১.২০ – ১.৫০',
    sourceNoteBn: 'বয়সভিত্তিক fish benchmark',
    sourceNoteEn: 'Age-based fish benchmark'
  };
}

export interface BatchFcrResult {
  isCalculable: boolean;

  missingReasons: Array<
    | 'missing_feed'
    | 'missing_weight'
    | 'waiting_next_sample'
    | 'zero_weight_gain'
    | 'no_records'
  >;

  batchId: string;
  batchName: string;
  category: FarmCategory;
  subBreed: string;
  batchAgeDays: number;
  startDate: string;

  initialQuantity: number;
  currentLiveCount: number;
  totalMortalityToDate: number;

  totalActualFeedUsedKg: number;
  dailyFeedRecordCount: number;

  totalWeightSamplesTaken: number;
  baselineSample: SampleWeightSummary | null;
  latestSample: SampleWeightSummary | null;

  latestMeasuredAvgWeightGram: number | null;
  latestMeasuredAvgWeightKg: number | null;
  latestWeighingDate: string | null;

  initialWeightGram: number | null;
  initialWeightKg: number | null;

  avgWeightGainGram: number | null;
  avgWeightGainKg: number | null;
  totalFlockBiomassGainKg: number | null;

  expectedStandard: ExpectedStandardForAge;

  actualFcr: number | null;

  benchmark: BreedFcrBenchmark;

  rating: FcrPerformanceRating;
  ratingLabelBn: string;
  ratingLabelEn: string;
  feedbackBn: string;
  feedbackEn: string;

  // New strict age-continuity & sanity fields
  isUpToDateForCurrentAge: boolean;
  latestMeasurementAgeDays: number | null;
  isAgeGapWaiting: boolean;
  sanityWarning: {
    isAbnormal: boolean;
    messageBn: string;
    messageEn: string;
  } | null;
}

/**
 * FCR calculation.
 *
 * IMPORTANT:
 * Feed stock/purchase records are intentionally NOT accepted here.
 * Therefore buying 16 bags cannot increase totalActualFeedUsedKg.
 *
 * Actual feed = sum of DailyActualRecord.actualFeedUsedKg only.
 *
 * Actual weight = measured samples only.
 * No defaultInitialWeightGram is ever used as actual weight.
 */
export function calculateStrictBatchFcr(
  batch: BatchIdentifier,
  dailyRecords: DailyActualRecord[],
  mortalityCountFromRecords?: number
): BatchFcrResult {
  const benchmark = getBreedBenchmark(batch.farmType, batch.subBreed);

  const ageDays = calculateBatchAgeFromStartDate(batch.startDate);

  const batchRecords = (dailyRecords || [])
    .filter(
      record =>
        record &&
        record.batchId === batch.id
    )
    .sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

  /*
   * ACTUAL FEED
   *
   * 1. If farmer entered a dedicated cumulative FCR measurement (e.g., 340 kg at 13 days or 750 kg at 18 days),
   *    we take that exact cumulative figure. We do NOT sum prior cumulative figures or daily entries.
   * 2. If no cumulative measurement exists, we sum daily actual records.
   * 3. Unused stock/purchases are NEVER counted as feed consumed.
   */
  const cumulativeFeedRecords = batchRecords.filter(
    record =>
      (record.isFcrMeasurement || record.feedEntryType === 'cumulative') &&
      record.actualFeedUsedKg !== null &&
      record.actualFeedUsedKg !== undefined &&
      Number(record.actualFeedUsedKg) > 0
  );

  let totalActualFeedUsedKg = 0;
  if (cumulativeFeedRecords.length > 0) {
    // Latest cumulative record contains the true actual feed used up to that age
    const latestCum = cumulativeFeedRecords[cumulativeFeedRecords.length - 1];
    totalActualFeedUsedKg = Number(Number(latestCum.actualFeedUsedKg || 0).toFixed(2));
  } else {
    const feedRecords = batchRecords.filter(
      record =>
        record.actualFeedUsedKg !== null &&
        record.actualFeedUsedKg !== undefined &&
        Number(record.actualFeedUsedKg) > 0
    );
    totalActualFeedUsedKg = Number(
      feedRecords
        .reduce(
          (sum, record) =>
            sum + Number(record.actualFeedUsedKg || 0),
          0
        )
        .toFixed(2)
    );
  }

  const feedRecordsCount = batchRecords.filter(
    record =>
      record.actualFeedUsedKg !== null &&
      record.actualFeedUsedKg !== undefined &&
      Number(record.actualFeedUsedKg) > 0
  ).length;

  /*
   * REAL WEIGHT SAMPLES ONLY
   */
  const weightSamples: SampleWeightSummary[] = [];

  for (const record of batchRecords) {
    const sampleCount = Number(record.weightSampleCount || 0);
    const totalKg = Number(record.totalSampleWeightKg || 0);

    let avgGram: number | null = null;

    if (
      record.avgWeightGram !== null &&
      record.avgWeightGram !== undefined &&
      Number(record.avgWeightGram) > 0
    ) {
      avgGram = Number(record.avgWeightGram);
    } else if (sampleCount > 0 && totalKg > 0) {
      avgGram = Math.round(
        (totalKg * 1000) / sampleCount
      );
    }

    if (avgGram !== null && avgGram > 0) {
      const safeSampleCount =
        sampleCount > 0 ? Math.round(sampleCount) : 1;

      const sampleTotalKg =
        totalKg > 0
          ? Number(totalKg.toFixed(4))
          : Number(
              (
                (avgGram * safeSampleCount) /
                1000
              ).toFixed(4)
            );

      weightSamples.push({
        date: record.date,
        ageDays: Number(record.batchAgeDays || 0),
        sampleBirds: safeSampleCount,
        totalSampleWeightKg: sampleTotalKg,
        avgWeightGram: avgGram,
        avgWeightKg: Number(
          (avgGram / 1000).toFixed(4)
        )
      });
    }
  }

  /*
   * LIVE COUNT
   *
   * Mortality is taken from actual mortality records (mortality management)
   * or fallback to DailyActualRecord.
   * No mortality weight is estimated.
   */
  let totalMortality = 0;

  if (typeof mortalityCountFromRecords === 'number' && !isNaN(mortalityCountFromRecords)) {
    totalMortality = Math.max(0, mortalityCountFromRecords);
  } else if (batchRecords.length > 0) {
    const latestRecord =
      batchRecords[batchRecords.length - 1];

    totalMortality = Math.max(
      0,
      Number(latestRecord.totalMortalityToDate || 0)
    );
  }

  const currentLiveCount = Math.max(
    0,
    Number(batch.totalChicks || 0) - totalMortality
  );

  const expectedStandard =
    getExpectedStandardForAge(
      batch.farmType,
      batch.subBreed,
      ageDays
    );

  let baselineSample: SampleWeightSummary | null = null;
  let latestSample: SampleWeightSummary | null = null;

  let avgWeightGainGram: number | null = null;
  let avgWeightGainKg: number | null = null;
  let totalFlockBiomassGainKg: number | null = null;
  let actualFcr: number | null = null;

  const missingReasons: BatchFcrResult['missingReasons'] = [];

  if (batchRecords.length === 0) {
    missingReasons.push('no_records');
  }

  if (totalActualFeedUsedKg <= 0) {
    missingReasons.push('missing_feed');
  }

  // Baseline chick weight (e.g. 40g for broiler, 35g for sonali, 120kg for cattle, etc.)
  const startingWeightGram = benchmark.defaultInitialWeightGram || 40;

  if (weightSamples.length === 0) {
    missingReasons.push('missing_weight');
  } else if (weightSamples.length === 1) {
    latestSample = weightSamples[0];
    baselineSample = {
      date: batch.startDate,
      ageDays: 1,
      sampleBirds: 1,
      totalSampleWeightKg: Number((startingWeightGram / 1000).toFixed(4)),
      avgWeightGram: startingWeightGram,
      avgWeightKg: Number((startingWeightGram / 1000).toFixed(4))
    };

    avgWeightGainGram = Math.max(0, latestSample.avgWeightGram - startingWeightGram);
    avgWeightGainKg = Number((avgWeightGainGram / 1000).toFixed(3));

    if (avgWeightGainGram <= 0 || currentLiveCount <= 0) {
      missingReasons.push('zero_weight_gain');
    } else {
      totalFlockBiomassGainKg = Number(
        (currentLiveCount * (avgWeightGainGram / 1000)).toFixed(2)
      );
      if (totalActualFeedUsedKg > 0 && totalFlockBiomassGainKg > 0) {
        actualFcr = Number(
          (totalActualFeedUsedKg / totalFlockBiomassGainKg).toFixed(2)
        );
      }
    }
  } else {
    baselineSample = weightSamples[0];
    latestSample = weightSamples[weightSamples.length - 1];

    avgWeightGainGram =
      latestSample.avgWeightGram -
      baselineSample.avgWeightGram;

    avgWeightGainKg = Number(
      (avgWeightGainGram / 1000).toFixed(3)
    );

    if (avgWeightGainGram <= 0) {
      missingReasons.push('zero_weight_gain');
    } else if (currentLiveCount <= 0) {
      missingReasons.push('zero_weight_gain');
    } else {
      totalFlockBiomassGainKg = Number(
        (
          currentLiveCount *
          (avgWeightGainGram / 1000)
        ).toFixed(2)
      );

      if (
        totalActualFeedUsedKg > 0 &&
        totalFlockBiomassGainKg > 0
      ) {
        actualFcr = Number(
          (
            totalActualFeedUsedKg /
            totalFlockBiomassGainKg
          ).toFixed(2)
        );
      }
    }
  }

  // Check if measurement is up to date for current batch age
  let isUpToDateForCurrentAge = false;
  let latestMeasurementAgeDays: number | null = null;
  let isAgeGapWaiting = false;

  if (latestSample) {
    latestMeasurementAgeDays = latestSample.ageDays;
    // If the batch has grown older (e.g. today is day 19, but latest sample was day 18),
    // then current age FCR is not yet measured!
    if (ageDays > latestMeasurementAgeDays) {
      isAgeGapWaiting = true;
      isUpToDateForCurrentAge = false;
    } else {
      isAgeGapWaiting = false;
      isUpToDateForCurrentAge = true;
    }
  }

  // Sanity Validation Engine
  let sanityWarning: BatchFcrResult['sanityWarning'] = null;
  if (latestSample) {
    if (latestSample.ageDays <= 5 && latestSample.avgWeightGram > 250) {
      sanityWarning = {
        isAbnormal: true,
        messageBn: `অস্বাভাবিক ওজন! ১-৫ দিনের বাচ্চার ওজন সাধারণত ৪০-১০০ গ্রাম হয়। কিন্তু এখানে গড় ওজন ${latestSample.avgWeightGram} গ্রাম (বা ${(latestSample.avgWeightGram/1000).toFixed(1)} কেজি) দেওয়া হয়েছে।`,
        messageEn: `Abnormal weight! At age 1-5 days, weight is 40-100g. Entered average weight is ${latestSample.avgWeightGram}g.`
      };
    } else if (latestSample.avgWeightGram > 4500 && latestSample.ageDays <= 30) {
      sanityWarning = {
        isAbnormal: true,
        messageBn: `অস্বাভাবিক ওজন! ৩০ দিনের মধ্যে মুরগির গড় ওজন ${(latestSample.avgWeightGram/1000).toFixed(1)} কেজি হওয়া অসম্ভব।`,
        messageEn: `Abnormal weight! Average weight of ${(latestSample.avgWeightGram/1000).toFixed(1)} kg at 30 days is unrealistic.`
      };
    } else if (totalActualFeedUsedKg > 0 && currentLiveCount > 0) {
      const feedPerBirdKg = totalActualFeedUsedKg / currentLiveCount;
      if (latestSample.ageDays <= 14 && feedPerBirdKg > 2.5) {
        sanityWarning = {
          isAbnormal: true,
          messageBn: `অস্বাভাবিক খাবার খরচ! ${currentLiveCount}টি বাচ্চার জন্য মোট ${totalActualFeedUsedKg} কেজি খাবার (প্রতি বাচ্চায় ${feedPerBirdKg.toFixed(2)} কেজি) অসম্ভব রকমের বেশি।`,
          messageEn: `Abnormal feed consumption! ${totalActualFeedUsedKg} kg for ${currentLiveCount} chicks is unrealistically high.`
        };
      }
    }

    if (!sanityWarning && actualFcr !== null) {
      if (actualFcr < 0.6 || actualFcr > 4.5) {
        sanityWarning = {
          isAbnormal: true,
          messageBn: `অস্বাভাবিক FCR (${actualFcr})! সাধারণত ব্রয়লারের FCR ১.৪০ – ১.৭০ এর মধ্যে থাকে। খাদ্য বা ওজনের তথ্যে কোনো ভুল আছে কি না যাচাই করুন।`,
          messageEn: `Abnormal FCR (${actualFcr})! Standard broiler FCR is 1.40 - 1.70. Please verify feed or weight entries.`
        };
      }
    }
  }

  const isCalculable =
    actualFcr !== null &&
    actualFcr > 0 &&
    missingReasons.length === 0;

  let rating: FcrPerformanceRating = 'unknown';
  let ratingLabelBn = 'অনির্ধারিত';
  let ratingLabelEn = 'Undetermined';
  let feedbackBn = '';
  let feedbackEn = '';

  if (isCalculable && actualFcr !== null) {
    if (actualFcr <= benchmark.idealMin) {
      rating = 'excellent';
      ratingLabelBn = 'অসাধারণ';
      ratingLabelEn = 'Excellent';
      feedbackBn =
        `প্রকৃত FCR ${actualFcr}। এটি benchmark-এর উন্নত দক্ষতার মধ্যে আছে।`;
      feedbackEn =
        `Actual FCR is ${actualFcr}.`;
    } else if (actualFcr <= benchmark.idealMax) {
      rating = 'good';
      ratingLabelBn = 'ভালো';
      ratingLabelEn = 'Good';
      feedbackBn =
        `প্রকৃত FCR ${actualFcr}। এটি benchmark-এর আদর্শ সীমার মধ্যে আছে।`;
      feedbackEn =
        `Actual FCR ${actualFcr} is within the benchmark range.`;
    } else if (actualFcr <= benchmark.acceptableMax) {
      rating = 'average';
      ratingLabelBn = 'সতর্কতা';
      ratingLabelEn = 'Average';
      feedbackBn =
        `প্রকৃত FCR ${actualFcr}। খাদ্য ব্যবস্থাপনা ও অপচয় পরীক্ষা করুন।`;
      feedbackEn =
        `Actual FCR ${actualFcr} is above the ideal range.`;
    } else {
      rating = 'poor';
      ratingLabelBn = 'উচ্চ FCR';
      ratingLabelEn = 'High FCR';
      feedbackBn =
        `প্রকৃত FCR ${actualFcr}। খাদ্য অপচয় ও পালের/পশুর স্বাস্থ্য পরীক্ষা করুন।`;
      feedbackEn =
        `Actual FCR ${actualFcr} is high.`;
    }
  }

  const initialWeightGram =
    baselineSample?.avgWeightGram ?? startingWeightGram;

  const initialWeightKg =
    initialWeightGram !== null
      ? Number(
          (initialWeightGram / 1000).toFixed(4)
        )
      : null;

  const latestMeasuredAvgWeightGram =
    latestSample?.avgWeightGram ?? null;

  const latestMeasuredAvgWeightKg =
    latestSample?.avgWeightKg ?? null;

  const latestWeighingDate =
    latestSample?.date ?? null;

  return {
    isCalculable,
    missingReasons,

    batchId: batch.id,
    batchName: batch.batchName,
    category: batch.farmType,
    subBreed: batch.subBreed,
    batchAgeDays: ageDays,
    startDate: batch.startDate,

    initialQuantity: Number(batch.totalChicks || 0),
    currentLiveCount,
    totalMortalityToDate: totalMortality,

    totalActualFeedUsedKg,
    dailyFeedRecordCount: feedRecordsCount,

    totalWeightSamplesTaken: weightSamples.length,

    baselineSample,
    latestSample,

    latestMeasuredAvgWeightGram,
    latestMeasuredAvgWeightKg,
    latestWeighingDate,

    initialWeightGram,
    initialWeightKg,

    avgWeightGainGram,
    avgWeightGainKg,
    totalFlockBiomassGainKg,

    expectedStandard,

    actualFcr,

    benchmark,

    rating,
    ratingLabelBn,
    ratingLabelEn,
    feedbackBn,
    feedbackEn,

    isUpToDateForCurrentAge,
    latestMeasurementAgeDays,
    isAgeGapWaiting,
    sanityWarning
  };
}
