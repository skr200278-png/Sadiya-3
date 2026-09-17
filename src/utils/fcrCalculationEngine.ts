/**
 * FCR CALCULATION ENGINE (PHASE 3)
 * Strict Rules Enforced:
 * 1. FCR is calculated strictly for the selected batchId.
 * 2. Actual feed consumed is ONLY sourced from Daily Actual Records (actualFeedUsedKg).
 *    Feed Stock / Purchase is NEVER counted as consumed feed.
 * 3. Weight is ONLY sourced from actual measured sample weights.
 *    No estimated or guessed weights are allowed.
 * 4. Animal-specific FCR benchmarks and formulas applied per category and breed.
 * 5. If required actual data (feed or weight) is missing, no FCR is calculated (never show 0 or estimate).
 */

import { BatchIdentifier, DailyActualRecord, FarmCategory } from '../types/fcrTypes';
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
  defaultInitialWeightGram: number; // typical Day-0 chick/fingerling/calf weight
}

export const BREED_FCR_BENCHMARKS: Record<string, BreedFcrBenchmark> = {
  // Poultry
  broiler: {
    code: 'broiler',
    category: 'poultry',
    nameBn: 'ব্রয়লার মুরগি',
    nameEn: 'Broiler Chicken',
    idealMin: 1.40,
    idealMax: 1.65,
    acceptableMax: 1.75,
    descriptionBn: 'ব্রয়লারের আদর্শ FCR ১.৪০ – ১.৬৫। ১.৭৫-এর ওপরে গেলে খাদ্য অপচয় বা স্বাস্থ্য ঝুঁকি থাকে।',
    descriptionEn: 'Standard broiler FCR is 1.40 – 1.65. Values above 1.75 indicate feed waste or health issues.',
    defaultInitialWeightGram: 40 // 40 grams Day-1 chick
  },
  sonali: {
    code: 'sonali',
    category: 'poultry',
    nameBn: 'সোনালী মুরগি',
    nameEn: 'Sonali Chicken',
    idealMin: 2.10,
    idealMax: 2.40,
    acceptableMax: 2.65,
    descriptionBn: 'সোনালীর আদর্শ FCR ২.১০ – ২.৪০। সাধারণত ৬০-৭০ দিনে ৮০০-১০০০ গ্রাম ওজনে এই FCR পাওয়া যায়।',
    descriptionEn: 'Standard Sonali FCR is 2.10 – 2.40 at 60-70 days of rearing.',
    defaultInitialWeightGram: 35
  },
  layer: {
    code: 'layer',
    category: 'poultry',
    nameBn: 'লেয়ার মুরগি (গ্রোয়িং ফেজ)',
    nameEn: 'Layer (Growing Phase)',
    idealMin: 2.50,
    idealMax: 3.10,
    acceptableMax: 3.50,
    descriptionBn: 'লেয়ার বাচ্চার গ্রোয়িং ফেজে আদর্শ FCR ২.৫০ – ৩.১০। ডিম পাড়ার সময়ে প্রতি ডজন ডিমের খাদ্য হিসাব প্রযোজ্য।',
    descriptionEn: 'Standard growing layer pullet FCR is 2.50 – 3.10.',
    defaultInitialWeightGram: 35
  },
  deshi: {
    code: 'deshi',
    category: 'poultry',
    nameBn: 'দেশি মুরগি',
    nameEn: 'Local Deshi Chicken',
    idealMin: 3.00,
    idealMax: 4.00,
    acceptableMax: 4.50,
    descriptionBn: 'দেশি মুরগির স্বাভাবিক FCR ৩.০০ – ৪.০০। দেশি মুরগির বৃদ্ধির হার প্রাকৃতিক নিয়মে তুলনামূলক ধীর।',
    descriptionEn: 'Standard native breed FCR is 3.00 – 4.00 due to slower growth rate.',
    defaultInitialWeightGram: 30
  },
  duck: {
    code: 'duck',
    category: 'poultry',
    nameBn: 'হাঁস পালন',
    nameEn: 'Duck',
    idealMin: 2.20,
    idealMax: 2.70,
    acceptableMax: 3.00,
    descriptionBn: 'হাঁসের মাংসের জন্য আদর্শ FCR ২.২০ – ২.৭০।',
    descriptionEn: 'Standard meat duck FCR is 2.20 – 2.70.',
    defaultInitialWeightGram: 45
  },
  quail: {
    code: 'quail',
    category: 'poultry',
    nameBn: 'কোয়েল পাখি',
    nameEn: 'Quail',
    idealMin: 2.30,
    idealMax: 2.80,
    acceptableMax: 3.20,
    descriptionBn: 'কোয়েলের মাংসের জন্য আদর্শ FCR ২.৩০ – ২.৮০।',
    descriptionEn: 'Standard meat quail FCR is 2.30 – 2.80.',
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
    descriptionBn: 'টার্কির আদর্শ FCR ২.৪০ – ২.৯০।',
    descriptionEn: 'Standard turkey FCR is 2.40 – 2.90.',
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
    descriptionBn: 'কবুতরের স্কোয়াব উৎপাদনের জন্য আদর্শ FCR ২.২০ – ২.৮০।',
    descriptionEn: 'Standard pigeon squab FCR is 2.20 – 2.80.',
    defaultInitialWeightGram: 18
  },

  // Cattle / Livestock
  fattening: {
    code: 'fattening',
    category: 'cattle',
    nameBn: 'ষাঁড় মোটাতাজাকরণ (মাংস)',
    nameEn: 'Beef Cattle Fattening',
    idealMin: 6.00,
    idealMax: 7.50,
    acceptableMax: 8.50,
    descriptionBn: 'ষাঁড় মোটাতাজাকরণে প্রতি ১ কেজি মাংস বৃদ্ধির জন্য ৬.০ – ৭.৫ কেজি সমন্বিত খাদ্য (ঘাস ও দানাদার) আদর্শ FCR।',
    descriptionEn: 'Standard cattle fattening FCR is 6.0 – 7.5 kg total feed per kg live weight gain.',
    defaultInitialWeightGram: 120000 // 120 kg starting stock
  },
  dairy: {
    code: 'dairy',
    category: 'cattle',
    nameBn: 'ডেইরি গাভী (দুধ উৎপাদন)',
    nameEn: 'Dairy Cattle (Milk)',
    idealMin: 0.85,
    idealMax: 1.30,
    acceptableMax: 1.60,
    descriptionBn: 'ডেইরি গাভীর ক্ষেত্রে প্রতি কেজি দুধ উৎপাদনের জন্য ০.৮৫ – ১.৩০ কেজি দানাদার খাদ্য অনুপাত আদর্শ।',
    descriptionEn: 'Standard dairy feed efficiency is 0.85 – 1.30 kg feed per liter milk produced.',
    defaultInitialWeightGram: 250000
  },
  goat: {
    code: 'goat',
    category: 'cattle',
    nameBn: 'ছাগল ও খাসি মোটাতাজাকরণ',
    nameEn: 'Goat / Sheep Fattening',
    idealMin: 5.50,
    idealMax: 7.20,
    acceptableMax: 8.50,
    descriptionBn: 'ছাগল বা খাসি মোটাতাজাকরণে আদর্শ FCR ৫.৫০ – ৭.২০।',
    descriptionEn: 'Standard goat fattening FCR is 5.50 – 7.20.',
    defaultInitialWeightGram: 10000 // 10 kg kid
  },
  sheep: {
    code: 'sheep',
    category: 'cattle',
    nameBn: 'ভেড়া ও গাড়ল পালন',
    nameEn: 'Sheep Farming',
    idealMin: 5.50,
    idealMax: 7.50,
    acceptableMax: 8.50,
    descriptionBn: 'ভেড়া ও গাড়লের আদর্শ FCR ৫.৫০ – ৭.৫০।',
    descriptionEn: 'Standard sheep FCR is 5.50 – 7.50.',
    defaultInitialWeightGram: 12000
  },
  buffalo: {
    code: 'buffalo',
    category: 'cattle',
    nameBn: 'মহিষ পালন',
    nameEn: 'Buffalo Farming',
    idealMin: 6.50,
    idealMax: 8.20,
    acceptableMax: 9.50,
    descriptionBn: 'মহিষের মাংস উৎপাদনে আদর্শ FCR ৬.৫০ – ৮.২০।',
    descriptionEn: 'Standard buffalo fattening FCR is 6.50 – 8.20.',
    defaultInitialWeightGram: 150000
  },

  // Fish
  telapia: {
    code: 'telapia',
    category: 'fish',
    nameBn: 'তেলাপিয়া / মনোসেক্স',
    nameEn: 'Tilapia Culture',
    idealMin: 1.20,
    idealMax: 1.45,
    acceptableMax: 1.65,
    descriptionBn: 'তেলাপিয়া মাছের ভাসমান খাদ্যে আদর্শ FCR ১.২০ – ১.৪৫। ১.৬৫-এর বেশি হলে অতিরিক্ত খাদ্য অপচয় নির্দেশ করে।',
    descriptionEn: 'Standard tilapia floating feed FCR is 1.20 – 1.45.',
    defaultInitialWeightGram: 5 // 5 gram fry
  },
  carp: {
    code: 'carp',
    category: 'fish',
    nameBn: 'রুই ও কার্প জাতীয় মাছ',
    nameEn: 'Carp Fish Culture',
    idealMin: 1.50,
    idealMax: 1.85,
    acceptableMax: 2.10,
    descriptionBn: 'রুই, কাতলা ও কার্প জাতীয় মাছের আদর্শ FCR ১.৫০ – ১.৮৫।',
    descriptionEn: 'Standard carp floating feed FCR is 1.50 – 1.85.',
    defaultInitialWeightGram: 20
  },
  pangash: {
    code: 'pangash',
    category: 'fish',
    nameBn: 'পাঙ্গাস ও মাগুর',
    nameEn: 'Pangash / Catfish',
    idealMin: 1.35,
    idealMax: 1.65,
    acceptableMax: 1.85,
    descriptionBn: 'পাঙ্গাস মাছের সঠিক খাদ্যে আদর্শ FCR ১.৩৫ – ১.৬৫।',
    descriptionEn: 'Standard pangash FCR is 1.35 – 1.65.',
    defaultInitialWeightGram: 15
  },
  shing_pabda: {
    code: 'shing_pabda',
    category: 'fish',
    nameBn: 'শিং, পাবদা ও কই',
    nameEn: 'Catfish & Perch',
    idealMin: 1.40,
    idealMax: 1.75,
    acceptableMax: 2.00,
    descriptionBn: 'শিং ও পাবদা চাষে আদর্শ FCR ১.৪০ – ১.৭৫।',
    descriptionEn: 'Standard catfish FCR is 1.40 – 1.75.',
    defaultInitialWeightGram: 5
  },
  mixed: {
    code: 'mixed',
    category: 'fish',
    nameBn: 'মিশ্র মাছ চাষ',
    nameEn: 'Mixed Fish Culture',
    idealMin: 1.45,
    idealMax: 1.80,
    acceptableMax: 2.10,
    descriptionBn: 'মিশ্র মাছ চাষে আদর্শ FCR ১.৪৫ – ১.৮০।',
    descriptionEn: 'Standard mixed polyculture FCR is 1.45 – 1.80.',
    defaultInitialWeightGram: 10
  }
};

/**
 * Get benchmark for a specific category and breed
 */
export function getBreedBenchmark(category: FarmCategory, breedCode: string): BreedFcrBenchmark {
  const normalizedCode = (breedCode || '').toLowerCase().trim();
  if (BREED_FCR_BENCHMARKS[normalizedCode]) {
    return BREED_FCR_BENCHMARKS[normalizedCode];
  }

  // Fallback defaults based on root category
  if (category === 'cattle') {
    return BREED_FCR_BENCHMARKS.fattening;
  }
  if (category === 'fish') {
    return BREED_FCR_BENCHMARKS.telapia;
  }
  return BREED_FCR_BENCHMARKS.broiler;
}

export type FcrPerformanceRating = 'excellent' | 'good' | 'average' | 'poor' | 'unknown';

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

/**
 * Standard expected growth curve by age (Cobb 500 / Ross 308 / Sonali / etc.)
 * Strictly labeled as EXPECTED, never substituted for actual data.
 */
export function getExpectedStandardForAge(
  category: FarmCategory,
  subBreed: string,
  ageDays: number
): ExpectedStandardForAge {
  const normBreed = (subBreed || '').toLowerCase().trim();
  const d = Math.max(1, ageDays);

  if (category === 'poultry') {
    if (normBreed.includes('broiler') || normBreed.includes('ব্রয়লার') || normBreed.includes('বয়লার') || normBreed.includes('বয়লার')) {
      // Cobb 500 / Ross 308 international broiler performance chart
      let wt = 40;
      let fcr = '১.৪০ – ১.৬৫';
      if (d <= 7) wt = Math.round(40 + (d * 21.4)); // ~190g at d7
      else if (d <= 14) wt = Math.round(190 + (d - 7) * 41.4); // ~480g at d14
      else if (d <= 21) wt = Math.round(480 + (d - 14) * 67.1); // ~950g at d21
      else if (d <= 28) wt = Math.round(950 + (d - 21) * 85.7); // ~1550g at d28
      else if (d <= 35) wt = Math.round(1550 + (d - 28) * 100); // ~2250g at d35
      else wt = Math.round(2250 + (d - 35) * 92); // ~2900g at d42

      if (d <= 14) fcr = '১.১০ – ১.২৫';
      else if (d <= 28) fcr = '১.৩৫ – ১.৫০';
      else fcr = '১.৫৫ – ১.৭০';

      return {
        expectedAvgWeightGram: wt,
        expectedAvgWeightKg: Number((wt / 1000).toFixed(3)),
        expectedFcrRange: fcr,
        sourceNoteBn: 'কব্ব ৫০০ / রস ৩০৮ আন্তর্জাতিক ব্রয়লার চার্ট অনুযায়ী',
        sourceNoteEn: 'Cobb 500 / Ross 308 International Broiler Standard'
      };
    }

    if (normBreed.includes('sonali') || normBreed.includes('সোনালী') || normBreed.includes('সোনালি') || normBreed.includes('ককরেল')) {
      // Sonali growth curve
      let wt = 35;
      if (d <= 14) wt = Math.round(35 + d * 6); // ~120g at d14
      else if (d <= 28) wt = Math.round(120 + (d - 14) * 9); // ~250g at d28
      else if (d <= 45) wt = Math.round(250 + (d - 28) * 15); // ~500g at d45
      else if (d <= 60) wt = Math.round(500 + (d - 45) * 20); // ~800g at d60
      else wt = Math.round(800 + (d - 60) * 18); // ~980g at d70

      return {
        expectedAvgWeightGram: wt,
        expectedAvgWeightKg: Number((wt / 1000).toFixed(3)),
        expectedFcrRange: '২.১০ – ২.৪০',
        sourceNoteBn: 'সোনালী স্ট্যান্ডার্ড পোল্ট্রি গাইড অনুযায়ী',
        sourceNoteEn: 'Standard Sonali Growth Standard'
      };
    }

    if (normBreed.includes('layer') || normBreed.includes('লেয়ার') || normBreed.includes('লেয়ার')) {
      let wt = Math.round(35 + d * 13);
      return {
        expectedAvgWeightGram: wt,
        expectedAvgWeightKg: Number((wt / 1000).toFixed(3)),
        expectedFcrRange: '২.৫০ – ৩.১০',
        sourceNoteBn: 'লেয়ার গ্রোয়িং চার্ট অনুযায়ী',
        sourceNoteEn: 'Standard Layer Pullet Growth Curve'
      };
    }

    // Default deshi / other poultry
    let wt = Math.round(30 + d * 10);
    return {
      expectedAvgWeightGram: wt,
      expectedAvgWeightKg: Number((wt / 1000).toFixed(3)),
      expectedFcrRange: '৩.০০ – ৩.৮০',
      sourceNoteBn: 'স্ট্যান্ডার্ড দেশি পোল্ট্রি বৃদ্ধি চার্ট অনুযায়ী',
      sourceNoteEn: 'Standard Local Poultry Growth Curve'
    };
  }

  if (category === 'cattle') {
    const gainPerDayKg = 0.8;
    const baseKg = 120;
    const currentKg = Number((baseKg + (d * gainPerDayKg)).toFixed(1));
    return {
      expectedAvgWeightGram: Math.round(currentKg * 1000),
      expectedAvgWeightKg: currentKg,
      expectedFcrRange: '৬.০ – ৭.৫',
      sourceNoteBn: 'ষাঁড় মোটাতাজাকরণ স্ট্যান্ডার্ড বৃদ্ধির হার অনুযায়ী',
      sourceNoteEn: 'Standard Beef Cattle Fattening Curve'
    };
  }

  // Fish
  const fishGram = Math.round(5 + d * 2.5);
  return {
    expectedAvgWeightGram: fishGram,
    expectedAvgWeightKg: Number((fishGram / 1000).toFixed(3)),
    expectedFcrRange: '১.২০ – ১.৫০',
    sourceNoteBn: 'মাছের স্ট্যান্ডার্ড বৃদ্ধি চার্ট অনুযায়ী',
    sourceNoteEn: 'Standard Fish Culture Growth Curve'
  };
}

export interface BatchFcrResult {
  isCalculable: boolean;
  missingReasons: Array<'missing_feed' | 'missing_weight' | 'waiting_next_sample' | 'zero_weight_gain' | 'no_records'>;
  
  // Scoping metadata
  batchId: string;
  batchName: string;
  category: FarmCategory;
  subBreed: string;
  batchAgeDays: number;
  startDate: string;

  // Livestock & flock counts
  initialQuantity: number;
  currentLiveCount: number;
  totalMortalityToDate: number;

  // Actual Consumed Feed (strictly from Daily Actual Records; inventory feed stock excluded)
  totalActualFeedUsedKg: number;
  dailyFeedRecordCount: number;

  // Weight Samples: Baseline (First) and Latest
  totalWeightSamplesTaken: number;
  baselineSample: SampleWeightSummary | null;
  latestSample: SampleWeightSummary | null;

  // Actual Measured Weight (strictly from latest sample weighing)
  latestMeasuredAvgWeightGram: number | null;
  latestMeasuredAvgWeightKg: number | null;
  latestWeighingDate: string | null;
  initialWeightGram: number;
  initialWeightKg: number;
  
  // Weight Gain (Latest Sample Avg Weight - Baseline Sample Avg Weight)
  avgWeightGainGram: number | null;
  avgWeightGainKg: number | null;
  totalFlockBiomassGainKg: number | null; // living birds only (no mortality estimate)

  // Expected Standard (Standard for Age - NOT actual, clearly flagged)
  expectedStandard: ExpectedStandardForAge;

  // FCR Output
  actualFcr: number | null;
  benchmark: BreedFcrBenchmark;
  rating: FcrPerformanceRating;
  ratingLabelBn: string;
  ratingLabelEn: string;
  feedbackBn: string;
  feedbackEn: string;
}

/**
 * Pure calculation function for Batch FCR
 * STRICT DATA INTEGRITY & WORKFLOW:
 * 1. User inputs minimized:
 *    - Start Birds (batch.totalChicks)
 *    - Daily Mortality (todayMortality in Daily Actual Record)
 *    - Daily Actual Feed Used (actualFeedUsedKg in Daily Actual Record)
 *    - On weighing days: Sample Birds + Total Sample Weight
 * 2. App calculates automatically:
 *    - Current Living Birds (Start Birds - Total Mortality To Date)
 *    - Batch Age (from batch.startDate)
 *    - Average Weight (Total Sample Weight / Sample Birds)
 *    - Weight Gain (Current Sample Avg Weight - Starting/Baseline Sample Avg Weight)
 *    - Total Weight Gain (Current Living Birds * Weight Gain per bird)
 *    - Actual FCR (Total Actual Feed Used / Total Weight Gain)
 * 3. 1st real weight sample = Starting / Baseline Weight. Subsequent samples establish Weight Gain.
 * 4. Sample average is used (no need to weigh all birds).
 * 5. If weight is not measured, Actual FCR is NOT shown. Only Age-based Expected standard is shown.
 * 6. Feed stock is NEVER added. Mortality weight is NEVER assumed/estimated.
 */
export function calculateStrictBatchFcr(
  batch: BatchIdentifier,
  dailyRecords: DailyActualRecord[]
): BatchFcrResult {
  const benchmark = getBreedBenchmark(batch.farmType, batch.subBreed);
  const ageDays = calculateBatchAgeFromStartDate(batch.startDate);

  // 1. Strict Isolation: filter daily records for this batch only, sorted chronologically
  const batchRecords = dailyRecords
    .filter(r => r.batchId === batch.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Compute Actual Feed Consumed
  // Feed Stock / Purchase is NEVER included.
  // Only Daily Actual Record's actualFeedUsedKg is summed.
  const feedRecordsWithUsage = batchRecords.filter(
    r => r.actualFeedUsedKg !== null && r.actualFeedUsedKg !== undefined && Number(r.actualFeedUsedKg) > 0
  );
  const totalActualFeedUsedKg = feedRecordsWithUsage.reduce(
    (sum, r) => sum + Number(r.actualFeedUsedKg || 0),
    0
  );

  // 3. Find Measured Weight Samples strictly from Daily Actual Records
  // All chickens do NOT need to be weighed; the app uses the sample average weight.
  // Sample Birds (weightSampleCount) + Total Sample Weight (totalSampleWeightKg) -> avgWeightGram
  const weightSamples: SampleWeightSummary[] = [];
  for (const r of batchRecords) {
    let avgGram: number | null = null;
    const sampleCount = Number(r.weightSampleCount) || 0;
    const totalKg = Number(r.totalSampleWeightKg) || 0;

    if (r.avgWeightGram !== null && Number(r.avgWeightGram) > 0) {
      avgGram = Number(r.avgWeightGram);
    } else if (totalKg > 0 && sampleCount > 0) {
      avgGram = Math.round((totalKg * 1000) / sampleCount);
    }

    if (avgGram !== null && avgGram > 0) {
      const sampleBirds = sampleCount > 0 ? sampleCount : 1;
      const totalSampleWeightKg = totalKg > 0 ? totalKg : Number(((avgGram * sampleBirds) / 1000).toFixed(3));
      weightSamples.push({
        date: r.date,
        ageDays: r.batchAgeDays || 0,
        sampleBirds,
        totalSampleWeightKg,
        avgWeightGram: avgGram,
        avgWeightKg: Number((avgGram / 1000).toFixed(3))
      });
    }
  }

  // 4. Current Living Birds & Mortality to date
  // User only gives Start Birds (batch.totalChicks) and Daily Mortality (todayMortality).
  // App automatically computes Current Living Birds = Start Birds - Total Mortality To Date.
  let totalMortality = 0;
  let currentLiveCount = batch.totalChicks;
  if (batchRecords.length > 0) {
    const lastRecord = batchRecords[batchRecords.length - 1];
    totalMortality = lastRecord.totalMortalityToDate || 0;
    currentLiveCount = lastRecord.currentLiveCount || Math.max(0, batch.totalChicks - totalMortality);
  }

  // 5. Expected Standard for this batch age
  const expectedStandard = getExpectedStandardForAge(batch.farmType, batch.subBreed, ageDays);

  // 6. Starting / Baseline Weight vs Subsequent Weight Samples
  // Rule: "প্রথম বাস্তব Weight Sample = Starting/Baseline Weight। পরের Sample থেকে Weight Gain হিসাব হবে।"
  let baselineSample: SampleWeightSummary | null = null;
  let latestSample: SampleWeightSummary | null = null;
  let avgWeightGainGram: number | null = null;
  let avgWeightGainKg: number | null = null;
  let totalFlockBiomassGainKg: number | null = null;
  let actualFcr: number | null = null;

  const missingReasons: Array<'missing_feed' | 'missing_weight' | 'waiting_next_sample' | 'zero_weight_gain' | 'no_records'> = [];

  if (batchRecords.length === 0) {
    missingReasons.push('no_records');
  }
  if (totalActualFeedUsedKg <= 0) {
    missingReasons.push('missing_feed');
  }

  if (weightSamples.length === 0) {
    // "Weight না থাকলে Actual FCR দেখাবে না। বয়সভিত্তিক Standard Weight থাকলে শুধু Expected হিসেবে দেখাবে, Actual নয়।"
    missingReasons.push('missing_weight');
  } else if (weightSamples.length === 1) {
    // Exactly 1 sample: this is the Starting / Baseline Weight!
    baselineSample = weightSamples[0];
    latestSample = weightSamples[0];
    // "পরের Sample থেকে Weight Gain হিসাব হবে।"
    missingReasons.push('waiting_next_sample');
  } else {
    // 2 or more samples: 1st chronological sample is Starting/Baseline, latest is current
    baselineSample = weightSamples[0];
    latestSample = weightSamples[weightSamples.length - 1];

    avgWeightGainGram = latestSample.avgWeightGram - baselineSample.avgWeightGram;
    avgWeightGainKg = Number((avgWeightGainGram / 1000).toFixed(3));

    if (avgWeightGainGram <= 0) {
      missingReasons.push('zero_weight_gain');
    } else {
      // "Mortality-এর ওজন অনুমান করবে না।"
      // Only living birds count is multiplied by net weight gain:
      totalFlockBiomassGainKg = Number((currentLiveCount * (avgWeightGainGram / 1000)).toFixed(2));

      // "Feed Stock FCR-এ যোগ করবে না।"
      // Total Actual Feed Consumed is strictly from Daily Actual Records
      if (totalActualFeedUsedKg > 0 && totalFlockBiomassGainKg > 0) {
        const rawFcr = totalActualFeedUsedKg / totalFlockBiomassGainKg;
        actualFcr = Number(rawFcr.toFixed(2));
      }
    }
  }

  const isCalculable = missingReasons.length === 0 && actualFcr !== null && actualFcr > 0;

  // 7. Rating & Feedback
  let rating: FcrPerformanceRating = 'unknown';
  let ratingLabelBn = 'অনির্ধারিত';
  let ratingLabelEn = 'Undetermined';
  let feedbackBn = '';
  let feedbackEn = '';

  if (isCalculable && actualFcr !== null) {
    if (actualFcr <= benchmark.idealMin) {
      rating = 'excellent';
      ratingLabelBn = 'অসাধারণ (Excellent)';
      ratingLabelEn = 'Excellent';
      feedbackBn = `অসাধারণ ফলাফল! আপনার খামারের প্রকৃত FCR ${actualFcr} আদর্শ মানের চেয়েও উন্নত। খাদ্য রূপান্তর অত্যন্ত নিখুঁত।`;
      feedbackEn = `Outstanding! Actual FCR of ${actualFcr} surpasses benchmark efficiency.`;
    } else if (actualFcr <= benchmark.idealMax) {
      rating = 'good';
      ratingLabelBn = 'আদর্শ ও লাভজনক (Good)';
      ratingLabelEn = 'Good';
      feedbackBn = `খুব ভালো! আপনার খামারের প্রকৃত FCR ${actualFcr} এই জাতের জন্য আদর্শ সীমার (${benchmark.idealMin} – ${benchmark.idealMax}) মধ্যে রয়েছে।`;
      feedbackEn = `Very good! Actual FCR of ${actualFcr} is within the ideal standard range.`;
    } else if (actualFcr <= benchmark.acceptableMax) {
      rating = 'average';
      ratingLabelBn = 'মোটামুটি / সতর্ক (Average)';
      ratingLabelEn = 'Average';
      feedbackBn = `সতর্কতা! প্রকৃত FCR ${actualFcr} কিছুটা বেশি। পাত্রে খাবার অপচয় বা পুষ্টির মান পরীক্ষা করুন।`;
      feedbackEn = `Actual FCR of ${actualFcr} is slightly elevated. Check feed wastage.`;
    } else {
      rating = 'poor';
      ratingLabelBn = 'অধিক FCR / লোকসানের ঝুঁকি (Poor)';
      ratingLabelEn = 'Poor / High Risk';
      feedbackBn = `জরুরি সতর্কতা! FCR ${actualFcr} এই জাতের জন্য অনেক বেশি। অবিলম্বে ফিড অপচয় ও পালের স্বাস্থ্য পরীক্ষা করুন।`;
      feedbackEn = `Warning! FCR of ${actualFcr} is critically high. Inspect health and feed wastage immediately.`;
    }
  }

  const initialWeightGram = baselineSample ? baselineSample.avgWeightGram : benchmark.defaultInitialWeightGram;
  const initialWeightKg = Number((initialWeightGram / 1000).toFixed(3));
  const latestMeasuredAvgWeightGram = latestSample ? latestSample.avgWeightGram : null;
  const latestMeasuredAvgWeightKg = latestSample ? latestSample.avgWeightKg : null;
  const latestWeighingDate = latestSample ? latestSample.date : null;

  return {
    isCalculable,
    missingReasons,
    batchId: batch.id,
    batchName: batch.batchName,
    category: batch.farmType,
    subBreed: batch.subBreed,
    batchAgeDays: ageDays,
    startDate: batch.startDate,
    initialQuantity: batch.totalChicks,
    currentLiveCount,
    totalMortalityToDate: totalMortality,
    totalActualFeedUsedKg: Number(totalActualFeedUsedKg.toFixed(2)),
    dailyFeedRecordCount: feedRecordsWithUsage.length,
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
    feedbackEn
  };
}
