/**
 * ============================================================================
 * FCR DATA ARCHITECTURE & BATCH-SCOPING TYPE DEFINITIONS
 * ============================================================================
 * Strict Scoping Rules:
 * 1. Category -> Animal Type/Breed -> Batch must be selected in sequence.
 * 2. Every FCR record MUST contain a valid batchId.
 * 3. Feed Stock / Purchase is strictly separated from Actual Consumed Feed.
 * 4. Bag weight is configurable per batch (never hard-coded).
 * 5. Batch age is computed strictly from batch.startDate.
 * 6. Completed batches remain in historical archives and never leak into active FCR.
 */

// 1. Root Farm Categories
export type FarmCategory = 'poultry' | 'cattle' | 'fish';

// 2. Specific Breeds / Animal Types under each Category
export type PoultryBreed =
  | 'broiler'
  | 'layer'
  | 'sonali'
  | 'deshi'
  | 'duck'
  | 'quail'
  | 'turkey'
  | 'pigeon';

export type CattleBreed =
  | 'dairy'
  | 'fattening'
  | 'goat'
  | 'sheep'
  | 'buffalo';

export type FishBreed =
  | 'telapia'
  | 'carp'
  | 'pangash'
  | 'shing_pabda'
  | 'mixed';

export type AnimalBreed = PoultryBreed | CattleBreed | FishBreed | string;

export interface BreedDefinition {
  code: string;
  category: FarmCategory;
  nameBn: string;
  nameEn: string;
  icon: string;
}

export const SUPPORTED_BREEDS: Record<FarmCategory, BreedDefinition[]> = {
  poultry: [
    { code: 'broiler', category: 'poultry', nameBn: 'ব্রয়লার মুরগি', nameEn: 'Broiler Chicken', icon: '🍗' },
    { code: 'layer', category: 'poultry', nameBn: 'লেয়ার মুরগি (ডিম)', nameEn: 'Layer (Egg)', icon: '🥚' },
    { code: 'sonali', category: 'poultry', nameBn: 'সোনালী মুরগি', nameEn: 'Sonali Chicken', icon: '🐓' },
    { code: 'deshi', category: 'poultry', nameBn: 'দেশি মুরগি', nameEn: 'Local Deshi', icon: '🐔' },
    { code: 'duck', category: 'poultry', nameBn: 'হাঁস পালন', nameEn: 'Duck', icon: '🦆' },
    { code: 'quail', category: 'poultry', nameBn: 'কোয়েল পাখি', nameEn: 'Quail', icon: '🐦' },
    { code: 'turkey', category: 'poultry', nameBn: 'টার্কি', nameEn: 'Turkey', icon: '🦃' },
    { code: 'pigeon', category: 'poultry', nameBn: 'কবুতর', nameEn: 'Pigeon', icon: '🕊️' }
  ],
  cattle: [
    { code: 'dairy', category: 'cattle', nameBn: 'ডেইরি গাভী (দুধ)', nameEn: 'Dairy Cow (Milk)', icon: '🥛' },
    { code: 'fattening', category: 'cattle', nameBn: 'ষাঁড় মোটাতাজাকরণ (মাংস)', nameEn: 'Beef Fattening (Meat)', icon: '🐂' },
    { code: 'goat', category: 'cattle', nameBn: 'ছাগল ও খাসি', nameEn: 'Goat / Buck', icon: '🐐' },
    { code: 'sheep', category: 'cattle', nameBn: 'ভেড়া ও গাড়ল', nameEn: 'Sheep', icon: '🐑' },
    { code: 'buffalo', category: 'cattle', nameBn: 'মহিষ পালন', nameEn: 'Buffalo', icon: '🐃' }
  ],
  fish: [
    { code: 'telapia', category: 'fish', nameBn: 'তেলাপিয়া / মনোসেক্স', nameEn: 'Tilapia / Monosex', icon: '🐟' },
    { code: 'carp', category: 'fish', nameBn: 'রুই ও কার্প জাতীয়', nameEn: 'Carp (Rohu, Catla, Mrigal)', icon: '🐠' },
    { code: 'pangash', category: 'fish', nameBn: 'পাঙ্গাস ও মাগুর', nameEn: 'Pangash / Catfish', icon: '🦈' },
    { code: 'shing_pabda', category: 'fish', nameBn: 'শিং, পাবদা ও কই', nameEn: 'Shing, Pabda & Climbing Perch', icon: '🦐' },
    { code: 'mixed', category: 'fish', nameBn: 'মিশ্র মাছ চাষ', nameEn: 'Mixed Fish Culture', icon: '🌊' }
  ]
};

// 3. Batch Identification & Scope
export type BatchStatus = 'active' | 'completed' | 'archived';

export interface BatchIdentifier {
  id: string;
  userId: string;
  batchName: string;
  farmType: FarmCategory;
  subBreed: string;
  startDate: string; // ISO string or YYYY-MM-DD
  completionDate?: string;
  totalChicks: number; // initial stocking quantity (heads/fingerlings)
  costPerChick?: number;
  status: BatchStatus;
  bagWeightKg?: number; // Configurable bag weight for this specific batch
  createdAt?: string;
  updatedAt?: string;
}

// 4. Hierarchical Batch Selector State (Category -> Breed -> Batch)
export interface FcrBatchScopeSelectorState {
  category: FarmCategory | null;
  subBreed: string | null;
  batchId: string | null;
  selectedBatch: BatchIdentifier | null;
  isScopeReady: boolean; // True ONLY when a valid active batch matching category and breed is selected
}

// 5. Feed Data Segregation Models
// A. Feed Stock & Inward Purchase (Inventory only - NEVER counted as feed consumed by animals)
export interface FeedPurchaseRecord {
  id: string;
  batchId: string; // MANDATORY
  feedType: string;
  bagsReceived: number;
  bagWeightKg: number; // Configurable per purchase or inherited from batch
  totalPurchasedKg: number;
  cost: number;
  date: string;
  supplier?: string;
  recordType: 'purchase_stock';
}

// B. Actual Feed Dispensed / Fed to Animals (The ONLY feed allowed into FCR numerator)
export interface ActualFeedUsageRecord {
  id: string;
  batchId: string; // MANDATORY - must strictly match active batch
  feedType: string;
  quantityKg: number; // Pure kilograms fed to the animals
  bagsFed?: number;
  bagWeightKg: number;
  date: string; // Feeding date
  feedCost?: number;
  feedingTime?: 'morning' | 'noon' | 'evening' | 'custom';
  recordType: 'actual_consumed';
}

// 6. Mortality Records (Mandatory batchId)
export interface BatchMortalityRecord {
  id: string;
  batchId: string; // MANDATORY
  count: number;
  date: string;
  cause?: string;
}

// 7. Weight Measurement Records (Mandatory batchId)
export interface BatchWeightRecord {
  id: string;
  batchId: string; // MANDATORY
  sampleCount: number; // Number of birds/animals weighed
  totalSampleWeightKg: number; // Total weight of sample
  avgWeightGram: number; // Calculated average weight in grams
  date: string;
  notes?: string;
}

// 8. Sales / Harvest Records (Mandatory batchId)
export interface BatchSalesRecord {
  id: string;
  batchId: string; // MANDATORY
  quantity: number; // Quantity sold
  totalWeightKg: number; // Total biomass sold in kg
  totalAmount: number;
  date: string;
  buyerName?: string;
}

// 9. Fully Isolated Raw Dataset Prepared for Batch-Scoped Evaluation
export interface BatchFcrRawDataset {
  batch: BatchIdentifier;
  ageDays: number; // Purely calculated from batch.startDate
  // Feed separation
  feedPurchases: FeedPurchaseRecord[];
  totalPurchasedKg: number;
  actualFeedUsage: ActualFeedUsageRecord[];
  totalActualFeedConsumedKg: number;
  // Mortality & live count
  mortalityRecords: BatchMortalityRecord[];
  totalMortalityCount: number;
  currentLiveQuantity: number;
  // Weight & biomass
  weightRecords: BatchWeightRecord[];
  latestMeasuredAvgWeightGram: number; // 0 if not measured
  // Sales & offloaded biomass
  salesRecords: BatchSalesRecord[];
  totalSoldQuantity: number;
  totalSoldWeightKg: number;
  // Configurable batch settings
  configuredBagWeightKg: number;
}

// 10. Daily Actual Record Architecture (Step 2)
export interface DailyActualRecord {
  id: string;
  userId: string;
  batchId: string; // Strictly scoped to active batch
  date: string; // YYYY-MM-DD
  batchAgeDays: number; // Derived strictly from batch.startDate

  // Live Count & Mortality
  openingLiveCount: number; // Flock count before today's mortality/sales
  todayMortality: number | null; // User input (null if not provided; never assumed)
  totalMortalityToDate: number; // Cumulative mortality including today
  currentLiveCount: number; // openingLiveCount - (todayMortality || 0)

  // Actual Feed Consumed (Separated from Inventory Stock)
  feedInputMode: 'kg' | 'bag';
  actualFeedUsedKg: number | null; // In kg (null if not entered, never assumed 0)
  actualFeedUsedBags: number | null; // In bags
  bagWeightKgUsed: number; // Configured bag weight (e.g. 50, 25, etc.)
  cumulativeActualFeedUsedKg: number; // Running total of actual feed for this batch

  // Sample Weighing (Optional per day)
  weightSampleCount: number | null; // Number of birds/animals weighed
  totalSampleWeightKg: number | null; // Total weight in KG
  weightInputUnit: 'kg' | 'g'; // Unit used for input display
  avgWeightGram: number | null; // Calculated average weight in grams
  avgWeightKg: number | null; // Calculated average weight in kg

  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyRecordFormInput {
  date: string;
  todayMortality: string; // string input to distinguish empty/unentered vs 0
  feedInputMode: 'kg' | 'bag';
  feedAmount: string; // string input to distinguish empty/unentered vs 0
  weightSampleCount: string;
  totalSampleWeight: string;
  weightInputUnit: 'kg' | 'g';
  notes: string;
}
