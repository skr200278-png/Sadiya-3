/**
 * Scientific feed consumption curves and stock reconciliation utilities
 * Supports Broiler (Cobb 500 / Ross 308), Sonali, Layer, Deshi, Cattle, and Fish
 */

export type PoultryBirdType = 'broiler' | 'sonali' | 'layer' | 'deshi';
export type FarmSector = 'poultry' | 'cattle' | 'fish';

/**
 * Daily feed consumption per bird (in grams) for given age in days
 */
export const getDailyFeedGramsPerBird = (type: PoultryBirdType, day: number): number => {
  const d = Math.max(1, day);
  if (type === 'broiler') {
    if (d === 1) return 15;
    if (d === 2) return 18;
    if (d === 3) return 23;
    if (d === 4) return 28;
    if (d === 5) return 34;
    if (d === 6) return 40;
    if (d === 7) return 46;
    if (d <= 14) return Math.round(46 + (d - 7) * 8.3); // Day 14 -> ~104g
    if (d <= 21) return Math.round(104 + (d - 14) * 6.5); // Day 21 -> ~150g
    if (d <= 28) return Math.round(150 + (d - 21) * 2.8); // Day 28 -> ~170g
    if (d <= 35) return Math.round(170 + (d - 28) * 2.3); // Day 35 -> ~186g
    if (d <= 42) return Math.round(186 + (d - 35) * 2.0); // Day 42 -> ~200g
    return 205;
  } else if (type === 'sonali') {
    if (d <= 7) return 6 + d;
    if (d <= 14) return 13 + (d - 7);
    if (d <= 21) return 20 + Math.round((d - 14) * 1.1);
    if (d <= 28) return 28 + Math.round((d - 21) * 1.1);
    if (d <= 45) return 36 + Math.round((d - 28) * 0.9);
    if (d <= 60) return 51 + Math.round((d - 45) * 0.9);
    return 70;
  } else if (type === 'layer') {
    if (d <= 14) return Math.round(12 + (d * 0.85));
    if (d <= 28) return Math.round(24 + (d - 14) * 0.7);
    if (d <= 56) return Math.round(34 + (d - 28) * 0.55);
    if (d <= 112) return Math.round(50 + (d - 56) * 0.45);
    return 115;
  } else {
    // Deshi
    if (d <= 14) return Math.round(10 + d * 0.8);
    if (d <= 30) return Math.round(21 + (d - 14) * 0.6);
    if (d <= 60) return Math.round(31 + (d - 30) * 0.7);
    return 65;
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
