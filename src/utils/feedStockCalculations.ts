/**
 * Scientific feed consumption curves and stock reconciliation utilities
 * Supports Broiler (Cobb 500 / Ross 308), Sonali, Layer, Deshi, Cattle, and Fish
 */

export type PoultryBirdType = 'broiler' | 'sonali' | 'layer' | 'deshi';
export type FarmSector = 'poultry' | 'cattle' | 'fish';

/**
 * Universal Bengali numeral converter
 * Converts English digits 0-9 into Bengali digits ০-৯ to prevent visual ambiguity (e.g. 8 vs 4)
 */
export const toBnDigits = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/[0-9]/g, (d) => bn[Number(d)] || d);
};

/**
 * Commercial Bangladeshi standard daily feed curve (Cobb 500 / Ross 308)
 * Daily feed consumption per bird (in grams) for given age in days
 */
export const getDailyFeedGramsPerBird = (type: PoultryBirdType, day: number): number => {
  const d = Math.max(1, day);
  if (type === 'broiler') {
    // Commercial Broiler standard daily grams (Cobb 500 / Ross 308 Bangladesh field SOP)
    const broilerGrams: Record<number, number> = {
      1: 13, 2: 17, 3: 20, 4: 24, 5: 27, 6: 31, 7: 35,
      8: 39, 9: 43, 10: 47, 11: 52, 12: 57, 13: 61, 14: 67,
      15: 72, 16: 77, 17: 83, 18: 89, 19: 94, 20: 100, 21: 106,
      22: 112, 23: 118, 24: 124, 25: 130, 26: 136, 27: 141, 28: 147,
      29: 153, 30: 158, 31: 163, 32: 169, 33: 174, 34: 179, 35: 183,
      36: 187, 37: 191, 38: 195, 39: 199, 40: 203, 41: 207, 42: 210
    };
    if (broilerGrams[d]) return broilerGrams[d];
    if (d > 42) return 215;
    return 13;
  } else if (type === 'sonali') {
    // Sonali cross-breed daily grams curve (Bangladesh standard 60-65 day cycle)
    if (d <= 7) return 6 + Math.round(d * 0.9); // 7-12g
    if (d <= 14) return 12 + Math.round((d - 7) * 1.1); // 13-20g
    if (d <= 21) return 20 + Math.round((d - 14) * 1.1); // 21-28g
    if (d <= 28) return 28 + Math.round((d - 21) * 1.1); // 29-36g
    if (d <= 35) return 36 + Math.round((d - 28) * 1.1); // 37-44g
    if (d <= 45) return 44 + Math.round((d - 35) * 1.0); // 45-54g
    if (d <= 60) return 54 + Math.round((d - 45) * 1.1); // 55-70g
    return 75;
  } else if (type === 'layer') {
    if (d <= 14) return Math.round(10 + (d * 0.85));
    if (d <= 28) return Math.round(22 + (d - 14) * 0.7);
    if (d <= 56) return Math.round(32 + (d - 28) * 0.55);
    if (d <= 112) return Math.round(48 + (d - 56) * 0.45);
    return 115;
  } else {
    // Deshi / indigenous
    if (d <= 14) return Math.round(8 + d * 0.8);
    if (d <= 30) return Math.round(19 + (d - 14) * 0.6);
    if (d <= 60) return Math.round(29 + (d - 30) * 0.7);
    return 60;
  }
};

/**
 * Standard cumulative feed per bird (in grams) from Day 1 to ageDays
 */
export const getStandardCumulativeFeedGramsPerBird = (type: PoultryBirdType, ageDays: number): number => {
  const maxDay = Math.max(1, ageDays);
  let totalGrams = 0;
  for (let d = 1; d <= maxDay; d++) {
    totalGrams += getDailyFeedGramsPerBird(type, d);
  }
  return totalGrams;
};

/**
 * Standard daily feed for the flock for a specific day:
 * Daily Feed = Cumulative Feed (Day) - Cumulative Feed (Day - 1)
 * Scaled accurately by the surviving flock count.
 * Returns both kg and bags (standard 50kg bag, or custom weight).
 */
export const calculateStandardDailyFeedForFlock = (
  sector: FarmSector = 'poultry',
  birdType: PoultryBirdType = 'broiler',
  survivingFlockCount: number,
  day: number,
  bagWeightKg: number = 50
): {
  dailyFeedKg: number;
  dailyBags: number;
  currentDayCumKg: number;
  prevDayCumKg: number;
  dailyGramsPerBird: number;
} => {
  const count = Math.max(0, survivingFlockCount);
  const currentDay = Math.max(1, Math.round(day));
  const bagWeight = Math.max(1, bagWeightKg || 50);

  if (count === 0) {
    return {
      dailyFeedKg: 0,
      dailyBags: 0,
      currentDayCumKg: 0,
      prevDayCumKg: 0,
      dailyGramsPerBird: 0
    };
  }

  // Calculate cumulative feed up to current day and up to previous day
  const currentDayCumKg = calculateStandardFlockCumulativeFeedKg(sector, birdType, count, currentDay);
  const prevDayCumKg = currentDay > 1 
    ? calculateStandardFlockCumulativeFeedKg(sector, birdType, count, currentDay - 1) 
    : 0;

  // Daily Feed = বর্তমান দিনের cumulative feed − আগের দিনের cumulative feed
  const rawDailyKg = Math.max(0, currentDayCumKg - prevDayCumKg);
  const dailyFeedKg = Number(rawDailyKg.toFixed(2));
  const dailyBags = Number((dailyFeedKg / bagWeight).toFixed(2));
  const dailyGramsPerBird = count > 0 ? Math.round((dailyFeedKg * 1000) / count) : 0;

  return {
    dailyFeedKg,
    dailyBags,
    currentDayCumKg,
    prevDayCumKg,
    dailyGramsPerBird
  };
};

/**
 * Standard cumulative feed consumed by the entire flock up to ageDays (in KG)
 */
export const calculateStandardFlockCumulativeFeedKg = (
  sector: FarmSector = 'poultry',
  birdType: PoultryBirdType = 'broiler',
  flockCount: number,
  ageDays: number
): number => {
  const count = Math.max(1, flockCount || 50);
  const age = Math.max(1, ageDays || 1);

  if (sector === 'cattle') {
    // 1 cattle typically consumes 1.5kg - 2.5kg concentrates per day
    return Number((count * age * 2.0).toFixed(1));
  }
  if (sector === 'fish') {
    // Fish standard average intake
    return Number((count * age * 0.04).toFixed(1));
  }

  // Poultry cumulative grams
  const cumGramsPerBird = getStandardCumulativeFeedGramsPerBird(birdType, age);
  const totalFlockKg = (count * cumGramsPerBird) / 1000;
  return Number(totalFlockKg.toFixed(1));
};

/**
 * Detect bird type automatically from batch name
 */
export const detectBirdType = (batchName?: string): PoultryBirdType => {
  if (!batchName) return 'broiler';
  const lower = batchName.toLowerCase();
  if (lower.includes('sonali') || lower.includes('সোনালী') || lower.includes('ককরেল')) return 'sonali';
  if (lower.includes('layer') || lower.includes('লেয়ার') || lower.includes('ডিম')) return 'layer';
  if (lower.includes('deshi') || lower.includes('দেশি') || lower.includes('হাস') || lower.includes('কোয়েল')) return 'deshi';
  return 'broiler';
};

/**
 * Detect full livestock sector, breed and display attributes from batch object
 */
export const detectLivestockType = (batch?: any): { sector: FarmSector; breed: string; labelBn: string; labelEn: string; icon: string } => {
  if (!batch) return { sector: 'poultry', breed: 'broiler', labelBn: 'ব্রয়লার', labelEn: 'Broiler', icon: '🐔' };
  
  const farmType = (batch.farmType || 'poultry').toLowerCase();
  const subBreed = (batch.subBreed || '').toLowerCase();
  const name = (batch.batchName || '').toLowerCase();
  
  if (farmType === 'cattle' || subBreed.includes('cattle') || subBreed.includes('dairy') || subBreed.includes('fattening') || subBreed.includes('goat') || name.includes('গরু') || name.includes('ছাগল') || name.includes('গাভী') || name.includes('ষাঁড়') || name.includes('মোটাতাজা')) {
    return { sector: 'cattle', breed: 'cattle', labelBn: 'গরু ও পশু', labelEn: 'Cattle/Goat', icon: '🐄' };
  }
  if (farmType === 'fish' || subBreed.includes('fish') || name.includes('মাছ') || name.includes('পুকুর') || name.includes('তেলাপিয়া') || name.includes('পাঙ্গাস') || name.includes('কার্প')) {
    return { sector: 'fish', breed: 'fish', labelBn: 'মৎস্য খামার', labelEn: 'Fish/Fisheries', icon: '🐟' };
  }
  if (subBreed.includes('sonali') || name.includes('sonali') || name.includes('সোনালী') || name.includes('ককরেল')) {
    return { sector: 'poultry', breed: 'sonali', labelBn: 'সোনালী মুরগি', labelEn: 'Sonali Chicken', icon: '🐥' };
  }
  if (subBreed.includes('layer') || name.includes('layer') || name.includes('লেয়ার') || name.includes('ডিম')) {
    return { sector: 'poultry', breed: 'layer', labelBn: 'লেয়ার মুরগি', labelEn: 'Layer Chicken', icon: '🥚' };
  }
  if (subBreed.includes('duck') || subBreed.includes('quail') || subBreed.includes('deshi') || name.includes('দেশি') || name.includes('হাঁস') || name.includes('কোয়েল')) {
    return { sector: 'poultry', breed: 'deshi', labelBn: 'দেশি / হাঁস / কোয়েল', labelEn: 'Deshi / Duck / Quail', icon: '🦆' };
  }
  return { sector: 'poultry', breed: 'broiler', labelBn: 'ব্রয়লার (Cobb 500 / Ross)', labelEn: 'Broiler (Cobb/Ross)', icon: '🐔' };
};

/**
 * Check if a manually entered feed consumed amount is physically impossible / abnormal
 */
export const isFlockFeedInputAbnormal = (
  sector: FarmSector = 'poultry',
  birdType: PoultryBirdType = 'broiler',
  flockCount: number,
  ageDays: number,
  enteredConsumedKg: number
): { isAbnormal: boolean; standardKg: number; messageBn: string; messageEn: string } => {
  const stdKg = calculateStandardFlockCumulativeFeedKg(sector, birdType, flockCount, ageDays);
  
  // Abnormal if more than 2.8 times scientific standard for young chicks (age <= 14 days)
  // or entered value is equal to total inward purchased stock while birds are small
  const isAbnormal = ageDays <= 14 && enteredConsumedKg > Math.max(stdKg * 2.5, 15);

  const messageBn = `${flockCount}টি বাচ্চার ${ageDays} দিনে ${enteredConsumedKg} কেজি খাদ্য খাওয়া স্বাভাবিক নয়! স্ট্যান্ডার্ড চার্ট অনুযায়ী খরচ হওয়ার কথা প্রায় ${stdKg} কেজি।`;
  const messageEn = `Unrealistic feed consumption: ${flockCount} chicks at age ${ageDays} days cannot consume ${enteredConsumedKg} kg! Standard expected is approx ${stdKg} kg.`;

  return {
    isAbnormal,
    standardKg: stdKg,
    messageBn,
    messageEn
  };
};

export interface ProgressiveFeedForecastParams {
  aliveCount: number;
  currentAgeDays: number;
  remainingStockKg: number;
  bagWeightKg?: number;
  sector?: FarmSector;
  birdType?: PoultryBirdType;
  customTargetHarvestDays?: number;
  batchName?: string;
}

export interface WeeklyFeedScheduleItem {
  weekNumber: number;
  labelBn: string;
  labelEn: string;
  startDay: number;
  endDay: number;
  avgGramsPerBird: number;
  dailyFlockKg: number;
  weekTotalKg: number;
  weekTotalBags: number;
  cumulativeBags: number;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
}

export interface FeedForecastResult {
  remainingStockKg: number;
  remainingStockBags: number;
  bagWeightKg: number;
  targetHarvestAgeDays: number;
  daysRemainingInBatch: number;
  daysStockWillLast: number;
  stockRunsOutAtFlockAge: number;
  totalFeedNeededUntilHarvestKg: number;
  totalFeedNeededUntilHarvestBags: number;
  isCoveredUntilHarvest: boolean;
  surplusBags: number;
  surplusKg: number;
  shortageBags: number;
  shortageKg: number;
  currentDailyRequirementKg: number;
  currentDailyGramsPerBird: number;
  status: 'empty' | 'critical' | 'low' | 'adequate' | 'surplus';
  forecastNoteBn: string;
  forecastNoteEn: string;
  explanationBn: string;
  explanationEn: string;
  weeklyBreakdown: WeeklyFeedScheduleItem[];
}

export type ProgressiveFeedForecast = FeedForecastResult;

/**
 * Precision Progressive Feed Runway and Batch Completion Forecast
 * Computes day-by-day feed consumption accounting for avian/livestock biological growth curve
 */
export const calculateProgressiveFeedForecast = (
  params: ProgressiveFeedForecastParams
): FeedForecastResult => {
  const {
    aliveCount = 0,
    currentAgeDays = 1,
    remainingStockKg = 0,
    bagWeightKg = 50,
    sector = 'poultry',
    birdType = 'broiler',
    customTargetHarvestDays,
    batchName
  } = params;

  const bagWeight = Math.max(1, bagWeightKg || 50);
  const remainingBags = Number((remainingStockKg / bagWeight).toFixed(1));
  const detectedType = birdType || detectBirdType(batchName);

  // Default target harvest age in days
  let targetHarvest = 35;
  if (customTargetHarvestDays && customTargetHarvestDays > 0) {
    targetHarvest = customTargetHarvestDays;
  } else if (sector === 'cattle') {
    targetHarvest = 120;
  } else if (sector === 'fish') {
    targetHarvest = 150;
  } else if (detectedType === 'sonali') {
    targetHarvest = 60;
  } else if (detectedType === 'layer') {
    targetHarvest = 365;
  } else if (detectedType === 'deshi') {
    targetHarvest = 90;
  } else {
    targetHarvest = 35;
  }

  const age = Math.max(1, currentAgeDays);
  const daysRemainingInBatch = Math.max(0, targetHarvest - age);

  // Current daily consumption rate
  let currentDailyGrams = 30;
  if (sector === 'cattle') {
    currentDailyGrams = 2000;
  } else if (sector === 'fish') {
    currentDailyGrams = 40;
  } else {
    currentDailyGrams = getDailyFeedGramsPerBird(detectedType, age);
  }

  const currentDailyRequirementKg = Number(((aliveCount * currentDailyGrams) / 1000).toFixed(1));

  // Generate Weekly Schedule Breakdown for entire batch (e.g. 1 to targetHarvest)
  const weeklyBreakdown: WeeklyFeedScheduleItem[] = [];
  const totalWeeks = Math.ceil(targetHarvest / 7);
  let runningCumBags = 0;

  for (let w = 1; w <= totalWeeks; w++) {
    const startDay = (w - 1) * 7 + 1;
    const endDay = Math.min(targetHarvest, w * 7);
    const daysInThisWeek = endDay - startDay + 1;

    let weekGramsPerBird = 0;
    for (let d = startDay; d <= endDay; d++) {
      let g = currentDailyGrams;
      if (sector === 'cattle') g = 2000;
      else if (sector === 'fish') g = 40;
      else g = getDailyFeedGramsPerBird(detectedType, d);
      weekGramsPerBird += g;
    }

    const avgGramsPerBird = daysInThisWeek > 0 ? Math.round(weekGramsPerBird / daysInThisWeek) : 0;
    const dailyFlockKg = Number(((aliveCount * avgGramsPerBird) / 1000).toFixed(1));
    const weekTotalKg = Number(((aliveCount * weekGramsPerBird) / 1000).toFixed(1));
    const weekTotalBags = Number((weekTotalKg / bagWeight).toFixed(2));
    runningCumBags = Number((runningCumBags + weekTotalBags).toFixed(2));

    const isPast = age > endDay;
    const isCurrent = age >= startDay && age <= endDay;
    const isFuture = age < startDay;

    weeklyBreakdown.push({
      weekNumber: w,
      labelBn: `সপ্তাহ ${toBnDigits(w)} (${toBnDigits(startDay)}-${toBnDigits(endDay)} দিন)`,
      labelEn: `Week ${w} (Day ${startDay}-${endDay})`,
      startDay,
      endDay,
      avgGramsPerBird,
      dailyFlockKg,
      weekTotalKg,
      weekTotalBags,
      cumulativeBags: runningCumBags,
      isPast,
      isCurrent,
      isFuture
    });
  }

  // If live count is zero or stock is zero
  if (aliveCount <= 0) {
    return {
      remainingStockKg: 0,
      remainingStockBags: 0,
      bagWeightKg: bagWeight,
      targetHarvestAgeDays: targetHarvest,
      daysRemainingInBatch: 0,
      daysStockWillLast: 0,
      stockRunsOutAtFlockAge: age,
      totalFeedNeededUntilHarvestKg: 0,
      totalFeedNeededUntilHarvestBags: 0,
      isCoveredUntilHarvest: false,
      surplusBags: 0,
      surplusKg: 0,
      shortageBags: 0,
      shortageKg: 0,
      currentDailyRequirementKg: 0,
      currentDailyGramsPerBird: 0,
      status: 'empty',
      forecastNoteBn: 'কোনো জীবিত পাখি বা প্রাণী নেই',
      forecastNoteEn: 'No live animals in batch',
      explanationBn: 'সক্রিয় ব্যাচে কোনো জীবিত প্রাণী উপস্থিত নেই।',
      explanationEn: 'No live animals present in this active batch.',
      weeklyBreakdown
    };
  }

  if (remainingStockKg <= 0.2) {
    const totalNeedToHarvestKg = daysRemainingInBatch > 0 
      ? calculateStandardFlockCumulativeFeedKg(sector, detectedType, aliveCount, targetHarvest) - calculateStandardFlockCumulativeFeedKg(sector, detectedType, aliveCount, age)
      : 0;
    const needBags = Number((Math.max(0, totalNeedToHarvestKg) / bagWeight).toFixed(1));

    return {
      remainingStockKg: 0,
      remainingStockBags: 0,
      bagWeightKg: bagWeight,
      targetHarvestAgeDays: targetHarvest,
      daysRemainingInBatch,
      daysStockWillLast: 0,
      stockRunsOutAtFlockAge: age,
      totalFeedNeededUntilHarvestKg: Math.round(Math.max(0, totalNeedToHarvestKg)),
      totalFeedNeededUntilHarvestBags: needBags,
      isCoveredUntilHarvest: false,
      surplusBags: 0,
      surplusKg: 0,
      shortageBags: needBags,
      shortageKg: Math.round(Math.max(0, totalNeedToHarvestKg)),
      currentDailyRequirementKg,
      currentDailyGramsPerBird: currentDailyGrams,
      status: 'empty',
      forecastNoteBn: 'খাবার শেষ! স্টকে কোনো খাদ্য নেই (০ দিন চলবে)। অবিলম্বে খাদ্য সংগ্রহ করুন।',
      forecastNoteEn: 'Out of feed! No stock remaining (0 days left). Reorder feed immediately.',
      explanationBn: `খাদ্য মজুত শূন্য! মুরগির বয়স ${toBnDigits(age)} দিন, জীবিত ${toBnDigits(aliveCount)}টি। ব্যাচ সমাপ্তি (${toBnDigits(targetHarvest)} দিন) পর্যন্ত মোট আনুমানিক ${toBnDigits(needBags)} বস্তা খাদ্য লাগবে। এখনই জরুরি খাদ্য সংগ্রহ করুন।`,
      explanationEn: `Feed stock is 0! Batch age ${age} days, ${aliveCount} live. Approx ${needBags} bags needed until harvest (${targetHarvest} days). Reorder feed immediately.`,
      weeklyBreakdown
    };
  }

  // Calculate day-by-day feed needed until target harvest
  let totalFeedNeededUntilHarvestKg = 0;
  if (daysRemainingInBatch > 0) {
    for (let d = age + 1; d <= targetHarvest; d++) {
      let g = currentDailyGrams;
      if (sector === 'cattle') g = 2000;
      else if (sector === 'fish') g = 40;
      else g = getDailyFeedGramsPerBird(detectedType, d);
      totalFeedNeededUntilHarvestKg += (aliveCount * g) / 1000;
    }
  }
  totalFeedNeededUntilHarvestKg = Number(totalFeedNeededUntilHarvestKg.toFixed(1));
  const totalFeedNeededUntilHarvestBags = Number((totalFeedNeededUntilHarvestKg / bagWeight).toFixed(1));

  // Simulate how many days the current stock will last
  let rem = remainingStockKg;
  let simDay = age;
  let daysSimulated = 0;

  while (rem > 0 && daysSimulated < 365) {
    simDay++;
    let g = currentDailyGrams;
    if (sector === 'cattle') g = 2000;
    else if (sector === 'fish') g = 40;
    else g = getDailyFeedGramsPerBird(detectedType, simDay);

    const dayNeed = (aliveCount * g) / 1000;
    if (rem < dayNeed) {
      daysSimulated += Number((rem / dayNeed).toFixed(1));
      rem = 0;
      break;
    }
    rem -= dayNeed;
    daysSimulated++;

    if (daysRemainingInBatch > 0 && simDay >= targetHarvest) {
      break;
    }
  }

  const isCoveredUntilHarvest = daysRemainingInBatch > 0 && remainingStockKg >= totalFeedNeededUntilHarvestKg;
  const daysStockWillLast = isCoveredUntilHarvest ? daysRemainingInBatch : Math.max(1, Math.round(daysSimulated));
  const stockRunsOutAtFlockAge = age + daysStockWillLast;

  let surplusKg = 0;
  let surplusBags = 0;
  let shortageKg = 0;
  let shortageBags = 0;

  if (isCoveredUntilHarvest) {
    surplusKg = Number(Math.max(0, remainingStockKg - totalFeedNeededUntilHarvestKg).toFixed(1));
    surplusBags = Number((surplusKg / bagWeight).toFixed(1));
  } else {
    shortageKg = Number(Math.max(0, totalFeedNeededUntilHarvestKg - remainingStockKg).toFixed(1));
    shortageBags = Number((shortageKg / bagWeight).toFixed(1));
  }

  let status: 'empty' | 'critical' | 'low' | 'adequate' | 'surplus' = 'adequate';
  if (remainingStockKg <= 0.2) status = 'empty';
  else if (daysStockWillLast <= 2) status = 'critical';
  else if (daysStockWillLast <= 5) status = 'low';
  else if (isCoveredUntilHarvest) status = 'surplus';
  else status = 'adequate';

  let forecastNoteBn = '';
  let forecastNoteEn = '';
  let explanationBn = '';
  let explanationEn = '';

  if (isCoveredUntilHarvest) {
    if (surplusBags > 0) {
      forecastNoteBn = `বর্তমান মজুত (${toBnDigits(remainingBags)} বস্তা) দিয়ে ব্যাচের বাকি ${toBnDigits(daysRemainingInBatch)} দিন সম্পূর্ণ খাদ্য নিশ্চিত আছে (উদ্বৃত্ত ~${toBnDigits(surplusBags)} বস্তা)`;
      forecastNoteEn = `Current stock (${remainingBags} bags) covers entire batch until harvest (${daysRemainingInBatch} days left, ~${surplusBags} bags surplus)`;
      explanationBn = `গুদামে মজুত আছে ${toBnDigits(remainingBags)} বস্তা (${toBnDigits(Math.round(remainingStockKg))} কেজি)। মুরগির বয়স ${toBnDigits(age)} দিন, জীবিত ${toBnDigits(aliveCount)}টি। বাকি ${toBnDigits(daysRemainingInBatch)} দিনে (৩৫তম দিন পর্যন্ত) আনুমানিক ${toBnDigits(totalFeedNeededUntilHarvestBags)} বস্তা (${toBnDigits(Math.round(totalFeedNeededUntilHarvestKg))} কেজি) খাদ্য লাগবে। বর্তমান স্টকে ব্যাচ শেষ হওয়া পর্যন্ত নিশ্চিত আছে এবং ব্যাচ শেষে প্রায় ${toBnDigits(surplusBags)} বস্তা খাদ্য উদ্বৃত্ত থাকবে।`;
      explanationEn = `Godown has ${remainingBags} bags (${Math.round(remainingStockKg)} kg). Flock age ${age} days, ${aliveCount} alive. For the remaining ${daysRemainingInBatch} days until harvest (${targetHarvest} days), approx ${totalFeedNeededUntilHarvestBags} bags (${Math.round(totalFeedNeededUntilHarvestKg)} kg) are required. Current stock covers the full batch with ~${surplusBags} bags surplus.`;
    } else {
      forecastNoteBn = `বর্তমান মজুত দিয়ে ব্যাচের বাকি ${toBnDigits(daysRemainingInBatch)} দিন সম্পূর্ণ খাদ্য নিশ্চিত আছে`;
      forecastNoteEn = `Current stock covers entire batch until harvest (${daysRemainingInBatch} days left)`;
      explanationBn = `গুদামে মজুত ${toBnDigits(remainingBags)} বস্তা দিয়ে ব্যাচের বাকি ${toBnDigits(daysRemainingInBatch)} দিনের প্রয়োজন (মোট ~${toBnDigits(totalFeedNeededUntilHarvestBags)} বস্তা) সম্পূর্ণ পূরণ হবে।`;
      explanationEn = `Current stock of ${remainingBags} bags satisfies the full batch requirement of ~${totalFeedNeededUntilHarvestBags} bags for the remaining ${daysRemainingInBatch} days.`;
    }
  } else if (daysRemainingInBatch > 0) {
    forecastNoteBn = `বর্তমান মজুত (${toBnDigits(remainingBags)} বস্তা) দিয়ে আগামী ~${toBnDigits(daysStockWillLast)} দিন চলবে (বয়স ${toBnDigits(stockRunsOutAtFlockAge)} দিন পর্যন্ত)। ব্যাচ শেষ করতে আরও প্রায় ${toBnDigits(shortageBags)} বস্তা প্রয়োজন`;
    forecastNoteEn = `Current stock (${remainingBags} bags) will last approx ${daysStockWillLast} days (until flock age ${stockRunsOutAtFlockAge}d). Need ~${shortageBags} more bags for batch completion`;
    explanationBn = `গুদামে মজুত আছে ${toBnDigits(remainingBags)} বস্তা (${toBnDigits(Math.round(remainingStockKg))} কেজি)। মুরগির বয়স ${toBnDigits(age)} দিন, জীবিত ${toBnDigits(aliveCount)}টি। বর্তমান খাদ্য দিয়ে আগামী প্রায় ${toBnDigits(daysStockWillLast)} দিন চলবে (মুরগির বয়স ${toBnDigits(stockRunsOutAtFlockAge)} দিন পর্যন্ত)। ${toBnDigits(targetHarvest)}তম দিনে ব্যাচ সমাপ্তি পর্যন্ত সম্পূর্ণ করতে আরও প্রায় ${toBnDigits(shortageBags)} বস্তা (${toBnDigits(Math.round(shortageKg))} কেজি) খাদ্য কিনতে হবে।`;
    explanationEn = `Godown has ${remainingBags} bags (${Math.round(remainingStockKg)} kg). Flock age ${age} days, ${aliveCount} alive. At progressive intake rate, this stock will last approx ${daysStockWillLast} days (until age ${stockRunsOutAtFlockAge} days). You will need ~${shortageBags} more bags (${Math.round(shortageKg)} kg) to complete the batch until harvest (${targetHarvest} days).`;
  } else {
    // Already past harvest age
    forecastNoteBn = `ব্যাচ বিক্রির উপযোগী বয়সে (${toBnDigits(age)} দিন) রয়েছে। বর্তমান মজুতে আরও প্রায় ${toBnDigits(daysStockWillLast)} দিন চলবে`;
    forecastNoteEn = `Batch has reached mature market age (${age} days). Current stock will last approx ${daysStockWillLast} days`;
    explanationBn = `মুরগির বয়স ${toBnDigits(age)} দিন, জীবিত ${toBnDigits(aliveCount)}টি। দৈনিক চাহিদা প্রায় ${toBnDigits(currentDailyRequirementKg)} কেজি। বর্তমান মজুত (${toBnDigits(remainingBags)} বস্তা) দিয়ে আরও প্রায় ${toBnDigits(daysStockWillLast)} দিন খাওয়ানো যাবে।`;
    explanationEn = `Batch age is ${age} days with ${aliveCount} live animals. Current daily intake is ~${currentDailyRequirementKg} kg. Current stock (${remainingBags} bags) will last approx ${daysStockWillLast} days.`;
  }

  return {
    remainingStockKg,
    remainingStockBags: remainingBags,
    bagWeightKg: bagWeight,
    targetHarvestAgeDays: targetHarvest,
    daysRemainingInBatch,
    daysStockWillLast,
    stockRunsOutAtFlockAge,
    totalFeedNeededUntilHarvestKg,
    totalFeedNeededUntilHarvestBags,
    isCoveredUntilHarvest,
    surplusBags,
    surplusKg,
    shortageBags,
    shortageKg,
    currentDailyRequirementKg,
    currentDailyGramsPerBird: currentDailyGrams,
    status,
    forecastNoteBn,
    forecastNoteEn,
    explanationBn,
    explanationEn,
    weeklyBreakdown
  };
};
