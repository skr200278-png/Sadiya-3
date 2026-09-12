/**
 * Scientific FCR and Growth Benchmarks for Farm Animals and Poultry
 * Supported: Broiler (Cobb 500 / Ross 308), Sonali, Layer, Deshi, Cattle, Fish
 * Accurately accounts for mortality, surviving birds, and net meat gain.
 */

export interface MilestoneData {
  day: number;
  weekLabel: string;
  stdCumFeedPer1000Kg: number; // Standard cumulative feed per 1000 birds (or per animal for cattle/fish)
  stdWeightGram: number;        // Standard benchmark body weight in grams
  actWeightGram?: number;       // Farmer's actual input
  stdFcr: number;               // Standard benchmark FCR
  actFcr?: number;              // Calculated actual FCR
  actCumFeedKg?: number;        // Farmer's actual cumulative feed fed (KG)
}

/**
 * Standard Broiler Benchmarks (Cobb 500 / Ross 308 standards per 1000 birds)
 */
export const DEFAULT_BROILER_MILESTONES: MilestoneData[] = [
  { day: 1, weekLabel: 'দিন ১', stdCumFeedPer1000Kg: 15.0, stdWeightGram: 60, stdFcr: 0.25, actWeightGram: 42, actFcr: 0.28 },
  { day: 2, weekLabel: 'দিন ২', stdCumFeedPer1000Kg: 33.0, stdWeightGram: 78, stdFcr: 0.42, actWeightGram: 62, actFcr: 0.44 },
  { day: 3, weekLabel: 'দিন ৩', stdCumFeedPer1000Kg: 56.0, stdWeightGram: 99, stdFcr: 0.57, actWeightGram: 80, actFcr: 0.59 },
  { day: 4, weekLabel: 'দিন ৪', stdCumFeedPer1000Kg: 84.0, stdWeightGram: 123, stdFcr: 0.68, actWeightGram: 105, actFcr: 0.70 },
  { day: 5, weekLabel: 'দিন ৫', stdCumFeedPer1000Kg: 118.0, stdWeightGram: 150, stdFcr: 0.79, actWeightGram: 130, actFcr: 0.81 },
  { day: 6, weekLabel: 'দিন ৬', stdCumFeedPer1000Kg: 142.0, stdWeightGram: 179, stdFcr: 0.79, actWeightGram: 160, actFcr: 0.80 },
  { day: 7, weekLabel: '১ম সপ্তাহ (দিন ৭)', stdCumFeedPer1000Kg: 167.0, stdWeightGram: 211, stdFcr: 0.79, actWeightGram: 195, actFcr: 0.80 },
  { day: 8, weekLabel: 'দিন ৮', stdCumFeedPer1000Kg: 205.0, stdWeightGram: 247, stdFcr: 0.83, actWeightGram: 235, actFcr: 0.84 },
  { day: 9, weekLabel: 'দিন ৯', stdCumFeedPer1000Kg: 250.0, stdWeightGram: 286, stdFcr: 0.87, actWeightGram: 275, actFcr: 0.88 },
  { day: 10, weekLabel: 'দিন ১০', stdCumFeedPer1000Kg: 305.0, stdWeightGram: 328, stdFcr: 0.93, actWeightGram: 315, actFcr: 0.94 },
  { day: 11, weekLabel: 'দিন ১১', stdCumFeedPer1000Kg: 365.0, stdWeightGram: 373, stdFcr: 0.98, actWeightGram: 360, actFcr: 0.99 },
  { day: 12, weekLabel: 'দিন ১২', stdCumFeedPer1000Kg: 425.0, stdWeightGram: 422, stdFcr: 1.01, actWeightGram: 410, actFcr: 1.02 },
  { day: 13, weekLabel: 'দিন ১৩', stdCumFeedPer1000Kg: 488.0, stdWeightGram: 475, stdFcr: 1.03, actWeightGram: 460, actFcr: 1.04 },
  { day: 14, weekLabel: '২য় সপ্তাহ (দিন ১৪)', stdCumFeedPer1000Kg: 552.0, stdWeightGram: 531, stdFcr: 1.04, actWeightGram: 510, actFcr: 1.05 },
  { day: 21, weekLabel: '৩য় সপ্তাহ (দিন ২১)', stdCumFeedPer1000Kg: 1302.0, stdWeightGram: 1050, stdFcr: 1.24, actWeightGram: 1020, actFcr: 1.25 },
  { day: 28, weekLabel: '৪র্থ সপ্তাহ (দিন ২৮)', stdCumFeedPer1000Kg: 2386.0, stdWeightGram: 1680, stdFcr: 1.42, actWeightGram: 1640, actFcr: 1.43 },
  { day: 35, weekLabel: '৫ম সপ্তাহ (দিন ৩৫)', stdCumFeedPer1000Kg: 3713.0, stdWeightGram: 2350, stdFcr: 1.58, actWeightGram: 2300, actFcr: 1.59 },
  { day: 42, weekLabel: '৬ষ্ঠ সপ্তাহ (দিন ৪২)', stdCumFeedPer1000Kg: 5160.0, stdWeightGram: 3000, stdFcr: 1.72, actWeightGram: 2950, actFcr: 1.73 }
];

/**
 * Standard Sonali Benchmarks (per 1000 birds)
 */
export const DEFAULT_SONALI_MILESTONES: MilestoneData[] = [
  { day: 14, weekLabel: '২য় সপ্তাহ (দিন ১৪)', stdCumFeedPer1000Kg: 150.0, stdWeightGram: 110, stdFcr: 1.36 },
  { day: 28, weekLabel: '৪র্থ সপ্তাহ (দিন ২৮)', stdCumFeedPer1000Kg: 440.0, stdWeightGram: 260, stdFcr: 1.69 },
  { day: 42, weekLabel: '৬ষ্ঠ সপ্তাহ (দিন ৪২)', stdCumFeedPer1000Kg: 920.0, stdWeightGram: 470, stdFcr: 1.96 },
  { day: 56, weekLabel: '৮ম সপ্তাহ (দিন ৫৬)', stdCumFeedPer1000Kg: 1550.0, stdWeightGram: 700, stdFcr: 2.21 },
  { day: 70, weekLabel: '১০ম সপ্তাহ (দিন ৭০)', stdCumFeedPer1000Kg: 2350.0, stdWeightGram: 950, stdFcr: 2.47 }
];

/**
 * Standard Layer Grower Benchmarks (per 1000 birds)
 */
export const DEFAULT_LAYER_MILESTONES: MilestoneData[] = [
  { day: 28, weekLabel: '৪র্থ সপ্তাহ (দিন ২৮)', stdCumFeedPer1000Kg: 550.0, stdWeightGram: 270, stdFcr: 2.45 },
  { day: 56, weekLabel: '৮ম সপ্তাহ (দিন ৫৬)', stdCumFeedPer1000Kg: 1450.0, stdWeightGram: 600, stdFcr: 2.65 },
  { day: 84, weekLabel: '১২তম সপ্তাহ (দিন ৮৪)', stdCumFeedPer1000Kg: 2650.0, stdWeightGram: 980, stdFcr: 2.85 },
  { day: 112, weekLabel: '১৬তম সপ্তাহ (দিন ১১২)', stdCumFeedPer1000Kg: 4100.0, stdWeightGram: 1350, stdFcr: 3.10 }
];

/**
 * Standard Cattle Fattening Benchmarks (per animal)
 */
export const DEFAULT_CATTLE_MILESTONES: MilestoneData[] = [
  { day: 30, weekLabel: '১ম মাস (দিন ৩০)', stdCumFeedPer1000Kg: 60, stdWeightGram: 165000, stdFcr: 6.0 },
  { day: 60, weekLabel: '২য় মাস (দিন ৬০)', stdCumFeedPer1000Kg: 130, stdWeightGram: 185000, stdFcr: 6.5 },
  { day: 90, weekLabel: '৩য় মাস (দিন ৯০)', stdCumFeedPer1000Kg: 210, stdWeightGram: 210000, stdFcr: 7.0 },
  { day: 120, weekLabel: '৪র্থ মাস (দিন ১২০)', stdCumFeedPer1000Kg: 300, stdWeightGram: 240000, stdFcr: 7.5 }
];

/**
 * Standard Fish Farming Benchmarks (per 1000 fingerlings)
 */
export const DEFAULT_FISH_MILESTONES: MilestoneData[] = [
  { day: 30, weekLabel: '১ম মাস (দিন ৩০)', stdCumFeedPer1000Kg: 50.0, stdWeightGram: 45, stdFcr: 1.30 },
  { day: 60, weekLabel: '২য় মাস (দিন ৬০)', stdCumFeedPer1000Kg: 160.0, stdWeightGram: 120, stdFcr: 1.45 },
  { day: 90, weekLabel: '৩য় মাস (দিন ৯০)', stdCumFeedPer1000Kg: 360.0, stdWeightGram: 240, stdFcr: 1.55 },
  { day: 120, weekLabel: '৪র্থ মাস (দিন ১২০)', stdCumFeedPer1000Kg: 680.0, stdWeightGram: 420, stdFcr: 1.68 }
];

/**
 * Get initial unit weight in grams
 */
export const getInitialUnitWeightGram = (sector: string, birdType?: string): number => {
  if (sector === 'cattle') return 25000; // 25 kg calf standard
  if (sector === 'fish') return 10;      // 10g fingerling
  if (birdType === 'sonali') return 30;  // 30g Sonali chick
  if (birdType === 'layer') return 36;   // 36g Layer chick
  if (birdType === 'deshi') return 32;   // 32g Deshi chick
  return 42;                             // 42g Broiler standard (Cobb 500 / Ross 308)
};

/**
 * Get standard milestones for sector & breed
 */
export const getMilestonesForSector = (sector: string, birdType?: string): MilestoneData[] => {
  if (sector === 'cattle') return DEFAULT_CATTLE_MILESTONES;
  if (sector === 'fish') return DEFAULT_FISH_MILESTONES;
  if (birdType === 'sonali') return DEFAULT_SONALI_MILESTONES;
  if (birdType === 'layer') return DEFAULT_LAYER_MILESTONES;
  return DEFAULT_BROILER_MILESTONES;
};

/**
 * Complete Scientific FCR and Growth Calculation
 */
export interface ScientificFcrResult {
  aliveBirds: number;
  mortalityRatePct: number;
  livabilityRatePct: number;
  initialUnitWeightGram: number;
  netGainPerUnitGram: number;
  netGainPerUnitKg: number;
  totalNetMeatKg: number;
  totalLiveWeightKg: number;
  actualNetFcr: number;
  commercialGrossFcr: number;
  epefScore: number;
  statusLevel: 'excellent' | 'normal' | 'warning';
}

export const computeScientificFcr = ({
  sector,
  birdType,
  totalHoused,
  mortalityCount,
  currentWeightGram,
  feedConsumedKg,
  ageDays
}: {
  sector: string;
  birdType?: string;
  totalHoused: number;
  mortalityCount: number;
  currentWeightGram: number;
  feedConsumedKg: number;
  ageDays: number;
}): ScientificFcrResult => {
  const housed = Math.max(1, totalHoused || 1);
  const mort = Math.max(0, mortalityCount || 0);
  const alive = Math.max(0, housed - mort);
  const mortRate = Number(((mort / housed) * 100).toFixed(2));
  const livability = Number(((alive / housed) * 100).toFixed(2));

  const initWeight = getInitialUnitWeightGram(sector, birdType);
  const currentWeight = Math.max(initWeight, currentWeightGram || initWeight);

  const netGainPerUnitGram = Math.max(5, currentWeight - initWeight);
  const netGainPerUnitKg = netGainPerUnitGram / 1000;

  // Surviving flock total net meat gain in KG
  const totalNetMeatKg = Number((alive * netGainPerUnitKg).toFixed(2));

  // Surviving flock total gross live weight in KG
  const totalLiveWeightKg = Number(((alive * currentWeight) / 1000).toFixed(2));

  // 1. Net Biomass FCR = Feed Consumed / Net Meat Gained
  let actualNetFcr = 0;
  if (feedConsumedKg > 0 && totalNetMeatKg > 0) {
    actualNetFcr = Number((feedConsumedKg / totalNetMeatKg).toFixed(2));
  }

  // 2. Commercial Gross FCR = Feed Consumed / Total Live Weight
  let commercialGrossFcr = 0;
  if (feedConsumedKg > 0 && totalLiveWeightKg > 0) {
    commercialGrossFcr = Number((feedConsumedKg / totalLiveWeightKg).toFixed(2));
  }

  // Fallback if net meat is 0
  if (actualNetFcr === 0) actualNetFcr = commercialGrossFcr;

  // 3. EPEF (European Production Efficiency Factor)
  // International Standard Formula: (Livability % * Live Body Weight in kg) / (Age in Days * Commercial FCR) * 100
  let epefScore = 0;
  const fcrForEpef = commercialGrossFcr > 0 ? commercialGrossFcr : actualNetFcr;
  if (ageDays > 0 && fcrForEpef > 0) {
    epefScore = Math.round(((livability * (currentWeight / 1000)) / (ageDays * fcrForEpef)) * 100);
  }

  // Status determination
  let statusLevel: 'excellent' | 'normal' | 'warning' = 'normal';
  if (actualNetFcr > 0) {
    if (actualNetFcr <= 1.45) statusLevel = 'excellent';
    else if (actualNetFcr <= 1.70) statusLevel = 'normal';
    else statusLevel = 'warning';
  }

  return {
    aliveBirds: alive,
    mortalityRatePct: mortRate,
    livabilityRatePct: livability,
    initialUnitWeightGram: initWeight,
    netGainPerUnitGram,
    netGainPerUnitKg,
    totalNetMeatKg,
    totalLiveWeightKg,
    actualNetFcr,
    commercialGrossFcr,
    epefScore,
    statusLevel
  };
};
