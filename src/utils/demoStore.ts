/**
 * Local demo storage & mock engine for instant demo mode without Firestore errors
 */

export interface DemoBatch {
  id: string;
  userId: string;
  batchName: string;
  farmType: 'poultry' | 'cattle' | 'fish';
  startDate: string;
  totalChicks: number;
  costPerChick: number;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt?: string;
}

export interface DemoFeedRecord {
  id: string;
  userId: string;
  batchId: string;
  date: string;
  feedType: string;
  quantityBags: number;
  pricePerBag: number;
  cost: number;
  amountPaid: number;
  personName: string;
  personPhone?: string;
  details?: string;
  createdAt: string;
}

export interface DemoMedicineRecord {
  id: string;
  userId: string;
  batchId: string;
  date: string;
  medicineName: string;
  type: string;
  cost: number;
  amountPaid: number;
  personName: string;
  personPhone?: string;
  details?: string;
  createdAt: string;
}

export interface DemoMortalityRecord {
  id: string;
  userId: string;
  batchId: string;
  date: string;
  count: number;
  cause?: string;
  reason?: string;
  createdAt: string;
}

export interface DemoExpenseRecord {
  id: string;
  userId: string;
  batchId: string;
  date: string;
  category: string;
  amount: number;
  amountPaid?: number;
  paidAmount?: number;
  personName?: string;
  vendorName?: string;
  vendorPhone?: string;
  details?: string;
  description?: string;
  createdAt: string;
}

export interface DemoSaleRecord {
  id: string;
  userId: string;
  batchId: string;
  date: string;
  category?: 'chicken' | 'egg' | 'milk' | 'manure' | 'chicks' | 'cattle' | 'fish' | 'other' | string;
  productName?: string;
  unit?: string;
  saleType?: string;
  buyerName?: string;
  buyerPhone?: string;
  customerName?: string;
  customerPhone?: string;
  quantity?: number;
  totalWeightKg?: number;
  pricePerKg?: number;
  pricePerPiece?: number;
  totalAmount: number;
  amountPaid?: number;
  paidAmount?: number;
  notes?: string;
  createdAt: string;
}

export interface DemoDueRecord {
  id: string;
  userId: string;
  personName: string;
  phone?: string;
  type: 'payable' | 'receivable' | 'payable_to_me' | 'payable_by_me';
  amount: number;
  totalPaid?: number;
  details?: string;
  description?: string;
  recordDate?: string;
  date?: string;
  status: 'pending' | 'paid' | 'settled';
  payments?: { date: string; amount: number }[];
  createdAt: string;
  updatedAt?: string;
}

export interface DemoUserProfile {
  name: string;
  farmName: string;
  phone: string;
  language: 'bn' | 'en';
}

export interface DemoMarketPost {
  id: string;
  userId: string;
  farmerName: string;
  farmName: string;
  phone: string;
  district: string;
  upazila?: string;
  locationDetails: string;
  poultryType: 'broiler' | 'sonali' | 'deshi' | 'layer' | 'other';
  birdCount: number;
  avgWeightKg: number;
  totalWeightKg: number;
  expectedPricePerKg: number;
  isEmergency: boolean;
  emergencyReason?: string;
  status: 'available' | 'sold' | 'booked';
  notes?: string;
  createdAt: string;
}

export interface DemoMarketBuyer {
  id: string;
  userId: string;
  buyerName: string;
  businessName: string; // আড়ত বা দোকানের নাম
  phone: string;
  whatsapp?: string;
  district: string;
  upazila?: string;
  buyingTypes: string[]; // ['broiler', 'sonali', 'layer', 'deshi']
  currentBuyingRate?: string; // '১৮০ - ১৮৫ ৳/কেজি'
  dailyDemand?: string; // '২-৩ টন প্রতিদিন'
  address: string;
  verified: boolean;
  createdAt: string;
}

const STORAGE_PREFIX = 'demo_farm_';

const initialMarketBuyers: DemoMarketBuyer[] = [
  {
    id: 'buyer_1',
    userId: 'demo_buyer_1',
    buyerName: 'হাজী মো. রফিকুল ইসলাম',
    businessName: 'বিসমিল্লাহ পোল্ট্রি আড়ত',
    phone: '01711223344',
    whatsapp: '01711223344',
    district: 'গাজীপুর',
    upazila: 'জয়দেবপুর',
    buyingTypes: ['broiler', 'sonali'],
    currentBuyingRate: '১৭৫ - ১৮০ ৳/কেজি',
    dailyDemand: '৩ টন প্রতিদিন',
    address: 'জয়দেবপুর বাজার পোল্ট্রি মার্কেট, গাজীপুর',
    verified: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'buyer_2',
    userId: 'demo_buyer_2',
    buyerName: 'মো. শাহীন আলম (বেপারি)',
    businessName: 'শাহীন ব্রাদার্স সাপ্লাইয়ার্স',
    phone: '01822334455',
    whatsapp: '01822334455',
    district: 'ঢাকা',
    upazila: 'কাপ্তান বাজার',
    buyingTypes: ['broiler', 'sonali', 'layer'],
    currentBuyingRate: '১৭৮ - ১৮২ ৳/কেজি',
    dailyDemand: '৫ টন (ক্যাশ পেমেন্ট)',
    address: 'কাপ্তান বাজার ৩ নং গেট, ঢাকা',
    verified: true,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'buyer_3',
    userId: 'demo_buyer_3',
    buyerName: 'আলহাজ্ব আবুল কালাম',
    businessName: 'কালাম ট্রেডার্স ও লাইভস্টক',
    phone: '01933445566',
    whatsapp: '01933445566',
    district: 'টাঙ্গাইল',
    upazila: 'মির্জাপুর',
    buyingTypes: ['sonali', 'deshi', 'broiler'],
    currentBuyingRate: '২৮০ - ২৯০ ৳ (সোনালী)',
    dailyDemand: '১.৫ টন',
    address: 'মির্জাপুর নতুন বাসস্ট্যান্ড সংলগ্ন, টাঙ্গাইল',
    verified: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'buyer_4',
    userId: 'demo_buyer_4',
    buyerName: 'মো. জয়নাল আবেদীন',
    businessName: 'মেঘনা পোল্ট্রি ডিলার',
    phone: '01644556677',
    whatsapp: '01644556677',
    district: 'ময়মনসিংহ',
    upazila: 'ভালুকা',
    buyingTypes: ['broiler'],
    currentBuyingRate: '১৭৪ - ১৭৮ ৳/কেজি',
    dailyDemand: '২ টন',
    address: 'ভালুকা বাসস্ট্যান্ড রোড, ময়মনসিংহ',
    verified: true,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  }
];

const initialMarketPosts: DemoMarketPost[] = [
  {
    id: 'post_1',
    userId: 'demo_other_user_1',
    farmerName: 'মো. কামরুল হাসান',
    farmName: 'সবুজ বাংলা পোল্ট্রি খামার',
    phone: '01799887766',
    district: 'গাজীপুর',
    upazila: 'শ্রীপুর',
    locationDetails: 'মাওনা চৌরাস্তা থেকে ২ কিমি পূর্বে, শ্রীপুর',
    poultryType: 'broiler',
    birdCount: 1500,
    avgWeightKg: 1.95,
    totalWeightKg: 2925,
    expectedPricePerKg: 178,
    isEmergency: true,
    emergencyReason: 'গরম বৃদ্ধি ও অতিরিক্ত ওজনের কারণে দ্রুত বিক্রি জরুরি',
    status: 'available',
    notes: 'সম্পূর্ণ সুস্থ ও সতেজ ব্রয়লার। আজ রাতেই গাড়ি পাঠিয়ে ওজন করে নেওয়া যাবে।',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString() // 2 hours ago
  },
  {
    id: 'post_2',
    userId: 'demo_other_user_2',
    farmerName: 'মো. রোকনুজ্জামান',
    farmName: 'মা-বাবার দোয়া এগ্রো',
    phone: '01855667788',
    district: 'টাঙ্গাইল',
    upazila: 'সখিপুর',
    locationDetails: 'সখিপুর বাজার সংলগ্ন খামার',
    poultryType: 'sonali',
    birdCount: 800,
    avgWeightKg: 0.95,
    totalWeightKg: 760,
    expectedPricePerKg: 285,
    isEmergency: false,
    status: 'available',
    notes: '৬০ দিনের সুন্দর কালার সোনালী মুরগি। পাইকার ভাইদের সরাসরি যোগাযোগ করার অনুরোধ।',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString()
  }
];

const initialBatches: DemoBatch[] = [
  {
    id: 'demo_batch_1',
    userId: 'demo_khamari_user_1',
    batchName: 'ব্রয়লার লট-০১ (১০০০ বাচ্চা)',
    farmType: 'poultry',
    startDate: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
    totalChicks: 1000,
    costPerChick: 36,
    status: 'active',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'demo_batch_2',
    userId: 'demo_khamari_user_1',
    batchName: 'সোনালী মুরগি লট-০২',
    farmType: 'poultry',
    startDate: new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0],
    totalChicks: 500,
    costPerChick: 28,
    status: 'completed',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: 'demo_batch_3',
    userId: 'demo_khamari_user_1',
    batchName: 'গাভী পালন প্রকল্প',
    farmType: 'cattle',
    startDate: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
    totalChicks: 8,
    costPerChick: 45000,
    status: 'active',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString()
  },
  {
    id: 'demo_batch_4',
    userId: 'demo_khamari_user_1',
    batchName: 'তেলাপিয়া মাছ চাষ পুকুর-১',
    farmType: 'fish',
    startDate: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0],
    totalChicks: 4000,
    costPerChick: 2.5,
    status: 'active',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
  }
];

const initialFeed: DemoFeedRecord[] = [
  {
    id: 'demo_feed_1',
    userId: 'demo_khamari_user_1',
    batchId: 'demo_batch_1',
    date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    feedType: 'Starter / প্রাথমিক',
    quantityBags: 8,
    pricePerBag: 3200,
    cost: 25600,
    amountPaid: 25600,
    personName: 'জনতা ফিডস',
    personPhone: '01711223344',
    details: 'স্টার্টার ফিড নগদ পরিশোধ',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'demo_feed_2',
    userId: 'demo_khamari_user_1',
    batchId: 'demo_batch_1',
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    feedType: 'Grower / গ্রোয়ার',
    quantityBags: 12,
    pricePerBag: 3100,
    cost: 37200,
    amountPaid: 30000,
    personName: 'জনতা ফিডস',
    personPhone: '01711223344',
    details: 'গ্রোয়ার ফিড (৭,২০০ টাকা বাকি)',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

const initialMedicine: DemoMedicineRecord[] = [
  {
    id: 'demo_med_1',
    userId: 'demo_khamari_user_1',
    batchId: 'demo_batch_1',
    date: new Date(Date.now() - 16 * 86400000).toISOString().split('T')[0],
    medicineName: 'রানীক্ষেত ভ্যাকসিন (ND Clone)',
    type: 'vaccine',
    cost: 450,
    amountPaid: 450,
    personName: 'ফার্মাসিউটিক্যালস',
    personPhone: '01812345678',
    details: 'চোখে ড্রপ প্রয়োগ',
    createdAt: new Date(Date.now() - 16 * 86400000).toISOString()
  },
  {
    id: 'demo_med_2',
    userId: 'demo_khamari_user_1',
    batchId: 'demo_batch_1',
    date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
    medicineName: 'গামবোরো ভ্যাকসিন ও ভিটামিন সি',
    type: 'medicine',
    cost: 1100,
    amountPaid: 1100,
    personName: 'ফার্মাসিউটিক্যালস',
    personPhone: '01812345678',
    details: 'পানিতে মিশিয়ে খাওয়ানো হয়েছে',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
  }
];

const initialMortality: DemoMortalityRecord[] = [
  {
    id: 'demo_mort_1',
    userId: 'demo_khamari_user_1',
    batchId: 'demo_batch_1',
    date: new Date(Date.now() - 17 * 86400000).toISOString().split('T')[0],
    count: 3,
    cause: 'ব্রুডিং স্ট্রেস ও অতিরিক্ত গরম',
    reason: 'ব্রুডিং স্ট্রেস ও অতিরিক্ত গরম',
    createdAt: new Date(Date.now() - 17 * 86400000).toISOString()
  },
  {
    id: 'demo_mort_2',
    userId: 'demo_khamari_user_1',
    batchId: 'demo_batch_1',
    date: new Date(Date.now() - 9 * 86400000).toISOString().split('T')[0],
    count: 4,
    cause: 'স্বাভাবিক দুর্বলতা',
    reason: 'স্বাভাবিক দুর্বলতা',
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString()
  }
];

const initialExpenses: DemoExpenseRecord[] = [
  {
    id: 'demo_exp_1',
    userId: 'demo_khamari_user_1',
    batchId: 'demo_batch_1',
    date: new Date(Date.now() - 19 * 86400000).toISOString().split('T')[0],
    category: 'তুষ / লিটার কুঁড়া',
    amount: 2500,
    amountPaid: 2500,
    paidAmount: 2500,
    personName: 'করিম স’মিল',
    vendorName: 'করিম স’মিল',
    vendorPhone: '01911223344',
    details: 'মেঝেতে বিছানোর শুকনো ধানের তুষ',
    description: 'মেঝেতে বিছানোর শুকনো ধানের তুষ',
    createdAt: new Date(Date.now() - 19 * 86400000).toISOString()
  },
  {
    id: 'demo_exp_2',
    userId: 'demo_khamari_user_1',
    batchId: 'demo_batch_1',
    date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    category: 'বিদ্যুৎ ও জেনারেটর',
    amount: 3200,
    amountPaid: 3200,
    paidAmount: 3200,
    personName: 'পল্লী বিদ্যুৎ অফিস',
    vendorName: 'পল্লী বিদ্যুৎ অফিস',
    vendorPhone: '',
    details: 'খামারের মাসিক বিদ্যুৎ ও লাইটিং বিল',
    description: 'খামারের মাসিক বিদ্যুৎ ও লাইটিং বিল',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

const initialSales: DemoSaleRecord[] = [
  {
    id: 'demo_sale_1',
    userId: 'demo_khamari_user_1',
    batchId: 'demo_batch_1',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    buyerName: 'রফিক পোল্ট্রি আড়ৎ',
    customerName: 'রফিক পোল্ট্রি আড়ৎ',
    customerPhone: '01855667788',
    quantity: 250,
    totalWeightKg: 450,
    pricePerKg: 185,
    totalAmount: 83250,
    amountPaid: 65000,
    paidAmount: 65000,
    notes: 'প্রথম লটের আংশিক বিক্রয় (১৮,২৫০ টাকা বকেয়া)',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

const initialDues: DemoDueRecord[] = [
  {
    id: 'demo_due_1',
    userId: 'demo_khamari_user_1',
    personName: 'রফিক পোল্ট্রি আড়ৎ',
    phone: '01855667788',
    type: 'receivable',
    amount: 18250,
    totalPaid: 0,
    details: 'মুরগি বিক্রয়ের বকেয়া টাকা',
    description: 'মুরগি বিক্রয়ের বকেয়া টাকা',
    recordDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'demo_due_2',
    userId: 'demo_khamari_user_1',
    personName: 'জনতা ফিডস',
    phone: '01711223344',
    type: 'payable',
    amount: 7200,
    totalPaid: 0,
    details: 'গ্রোয়ার ফিড ক্রয়ের বাকি বিল',
    description: 'গ্রোয়ার ফিড ক্রয়ের বাকি বিল',
    recordDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

const initialProfile: DemoUserProfile = {
  name: 'মোঃ আবু সুফিয়ান (ডেমো)',
  farmName: 'সোনার বাংলা ডেমো খামার',
  phone: '01700-000000',
  language: 'bn'
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach(fn => {
    try { fn(); } catch (e) { console.error('Demo store listener error:', e); }
  });
}

function getItem<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
    notifyListeners();
  } catch (e) {
    console.error('Demo store setItem error:', e);
  }
}

export const demoStore = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // Batches
  getBatches(): DemoBatch[] {
    return getItem<DemoBatch[]>('batches', initialBatches);
  },
  saveBatch(batch: Omit<DemoBatch, 'id' | 'createdAt'> & { id?: string }): DemoBatch {
    const batches = this.getBatches();
    if (batch.id) {
      const idx = batches.findIndex(b => b.id === batch.id);
      if (idx !== -1) {
        batches[idx] = { ...batches[idx], ...batch, updatedAt: new Date().toISOString() };
        setItem('batches', batches);
        return batches[idx];
      }
    }
    const newBatch: DemoBatch = {
      ...batch,
      id: 'demo_batch_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    batches.unshift(newBatch);
    setItem('batches', batches);
    return newBatch;
  },
  deleteBatch(id: string): void {
    const batches = this.getBatches().filter(b => b.id !== id);
    setItem('batches', batches);
  },

  // Feed
  getFeedRecords(batchId?: string): DemoFeedRecord[] {
    const records = getItem<DemoFeedRecord[]>('feed', initialFeed);
    return batchId ? records.filter(r => r.batchId === batchId) : records;
  },
  saveFeedRecord(record: Omit<DemoFeedRecord, 'id' | 'createdAt'>): DemoFeedRecord {
    const records = this.getFeedRecords();
    const newRecord: DemoFeedRecord = {
      ...record,
      id: 'demo_feed_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    setItem('feed', records);
    return newRecord;
  },
  deleteFeedRecord(id: string): void {
    const records = this.getFeedRecords().filter(r => r.id !== id);
    setItem('feed', records);
  },

  // Medicine
  getMedicineRecords(batchId?: string): DemoMedicineRecord[] {
    const records = getItem<DemoMedicineRecord[]>('medicine', initialMedicine);
    return batchId ? records.filter(r => r.batchId === batchId) : records;
  },
  saveMedicineRecord(record: Omit<DemoMedicineRecord, 'id' | 'createdAt'>): DemoMedicineRecord {
    const records = this.getMedicineRecords();
    const newRecord: DemoMedicineRecord = {
      ...record,
      id: 'demo_med_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    setItem('medicine', records);
    return newRecord;
  },
  deleteMedicineRecord(id: string): void {
    const records = this.getMedicineRecords().filter(r => r.id !== id);
    setItem('medicine', records);
  },

  // Mortality
  getMortalityRecords(batchId?: string): DemoMortalityRecord[] {
    const records = getItem<DemoMortalityRecord[]>('mortality', initialMortality);
    return batchId ? records.filter(r => r.batchId === batchId) : records;
  },
  saveMortalityRecord(record: Omit<DemoMortalityRecord, 'id' | 'createdAt'>): DemoMortalityRecord {
    const records = this.getMortalityRecords();
    const newRecord: DemoMortalityRecord = {
      ...record,
      id: 'demo_mort_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    setItem('mortality', records);
    return newRecord;
  },
  deleteMortalityRecord(id: string): void {
    const records = this.getMortalityRecords().filter(r => r.id !== id);
    setItem('mortality', records);
  },

  // Expenses
  getExpenses(batchId?: string): DemoExpenseRecord[] {
    const records = getItem<DemoExpenseRecord[]>('expenses', initialExpenses);
    return batchId ? records.filter(r => r.batchId === batchId) : records;
  },
  saveExpense(record: Omit<DemoExpenseRecord, 'id' | 'createdAt'>): DemoExpenseRecord {
    const records = this.getExpenses();
    const newRecord: DemoExpenseRecord = {
      ...record,
      id: 'demo_exp_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    setItem('expenses', records);
    return newRecord;
  },
  deleteExpense(id: string): void {
    const records = this.getExpenses().filter(r => r.id !== id);
    setItem('expenses', records);
  },

  // Sales
  getSales(batchId?: string): DemoSaleRecord[] {
    const records = getItem<DemoSaleRecord[]>('sales', initialSales);
    return batchId ? records.filter(r => r.batchId === batchId) : records;
  },
  saveSale(record: Omit<DemoSaleRecord, 'id' | 'createdAt'>): DemoSaleRecord {
    const records = this.getSales();
    const newRecord: DemoSaleRecord = {
      ...record,
      id: 'demo_sale_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    setItem('sales', records);
    return newRecord;
  },
  deleteSale(id: string): void {
    const records = this.getSales().filter(r => r.id !== id);
    setItem('sales', records);
  },

  // Dues
  getDues(): DemoDueRecord[] {
    return getItem<DemoDueRecord[]>('dues', initialDues);
  },
  saveDue(record: Omit<DemoDueRecord, 'id' | 'createdAt'> & { id?: string }): DemoDueRecord {
    const records = this.getDues();
    if (record.id) {
      const idx = records.findIndex(r => r.id === record.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...record, updatedAt: new Date().toISOString() };
        setItem('dues', records);
        return records[idx];
      }
    }
    const newRecord: DemoDueRecord = {
      ...record,
      id: 'demo_due_' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    setItem('dues', records);
    return newRecord;
  },
  deleteDue(id: string): void {
    const records = this.getDues().filter(r => r.id !== id);
    setItem('dues', records);
  },

  // Profile
  getProfile(): DemoUserProfile {
    return getItem<DemoUserProfile>('profile', initialProfile);
  },
  saveProfile(profile: Partial<DemoUserProfile>): DemoUserProfile {
    const current = this.getProfile();
    const updated = { ...current, ...profile };
    setItem('profile', updated);
    return updated;
  },
  setProfile(profile: Partial<DemoUserProfile>): DemoUserProfile {
    return this.saveProfile(profile);
  },

  // Marketplace Sell Posts
  getMarketPosts(): DemoMarketPost[] {
    return getItem<DemoMarketPost[]>('market_posts', initialMarketPosts);
  },
  saveMarketPost(post: Omit<DemoMarketPost, 'id' | 'createdAt'> & { id?: string }): DemoMarketPost {
    const records = this.getMarketPosts();
    if (post.id) {
      const idx = records.findIndex(r => r.id === post.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...post };
        setItem('market_posts', records);
        return records[idx];
      }
    }
    const newRecord: DemoMarketPost = {
      ...post,
      id: 'market_post_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    setItem('market_posts', records);
    return newRecord;
  },
  deleteMarketPost(id: string): void {
    const records = this.getMarketPosts().filter(r => r.id !== id);
    setItem('market_posts', records);
  },

  // Market Buyers Directory
  getMarketBuyers(): DemoMarketBuyer[] {
    return getItem<DemoMarketBuyer[]>('market_buyers', initialMarketBuyers);
  },
  saveMarketBuyer(buyer: Omit<DemoMarketBuyer, 'id' | 'createdAt'> & { id?: string }): DemoMarketBuyer {
    const records = this.getMarketBuyers();
    if (buyer.id) {
      const idx = records.findIndex(r => r.id === buyer.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...buyer };
        setItem('market_buyers', records);
        return records[idx];
      }
    }
    const newRecord: DemoMarketBuyer = {
      ...buyer,
      id: 'buyer_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    setItem('market_buyers', records);
    return newRecord;
  },
  deleteMarketBuyer(id: string): void {
    const records = this.getMarketBuyers().filter(r => r.id !== id);
    setItem('market_buyers', records);
  }
};

