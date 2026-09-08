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
  postType?: 'sell' | 'buy'; // 'sell' = বিক্রয় বিজ্ঞাপন, 'buy' = ক্রয় চাহিদা বিজ্ঞাপন
  farmerName: string;
  farmName: string;
  phone: string;
  whatsapp?: string;
  country?: string;
  district: string;
  upazila?: string;
  locationDetails: string;
  poultryType: 'broiler' | 'sonali' | 'deshi' | 'layer' | 'other' | string;
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
  country?: string;
  district: string;
  upazila?: string;
  buyingTypes: string[]; // ['broiler', 'sonali', 'layer', 'deshi']
  currentBuyingRate?: string; // '১৮০ - ১৮৫ ৳/কেজি'
  dailyDemand?: string; // '২-৩ টন প্রতিদিন'
  address: string;
  verified: boolean;
  createdAt: string;
}

export interface DemoStoreListing {
  id: string;
  userId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  whatsapp?: string;
  country?: string;
  district: string;
  upazila?: string;
  address: string;
  categories: string[]; // ['poultry_feed', 'cattle_feed', 'medicine', 'vaccine', 'duck_feed', 'fish_feed', 'chicks_equip']
  availableBrands?: string;
  productsOffered?: string;
  hasHomeDelivery: boolean;
  openHours?: string;
  imageUrl?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  notes?: string;
  createdAt: string;
}

export interface DemoChickRate {
  id: string;
  category: 'poultry' | 'birds' | 'fish' | 'cattle';
  subCategory: string;
  nameBn: string;
  nameEn: string;
  unit: string;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  prevRate?: number;
  trend: 'up' | 'down' | 'stable';
  noteBn: string;
  updatedAt: string;
}

export interface DemoChickListing {
  id: string;
  userId: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  whatsapp?: string;
  country?: string;
  category: 'poultry' | 'birds' | 'fish' | 'cattle';
  subCategory: string;
  grade: 'A' | 'B' | 'C';
  pricePerUnit: number;
  unitLabel: string;
  minimumOrder: number;
  availableStock?: number;
  deliveryDate?: string;
  district: string;
  deliveryArea: string;
  vaccineDetails?: string;
  description?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  status: 'available' | 'booked';
  createdAt: string;
}

const STORAGE_PREFIX = 'demo_farm_';

export const initialChickRates: DemoChickRate[] = [
  {
    id: 'rate_broiler',
    category: 'poultry',
    subCategory: 'broiler',
    nameBn: 'ব্রয়লার একদিনের বাচ্চা (DOC)',
    nameEn: 'Broiler Day Old Chick',
    unit: 'প্রতি পিস',
    gradeA: 64,
    gradeB: 56,
    gradeC: 48,
    trend: 'up',
    noteBn: 'গ্রেড-এ: ওজন ৪০গ্রাম+, গামবোরো ও মারেক্স স্প্রে করা। দ্রুত ওজনে বৃদ্ধি।',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rate_sonali',
    category: 'poultry',
    subCategory: 'sonali',
    nameBn: 'সোনালী বাচ্চা (Sonali DOC)',
    nameEn: 'Sonali Classic / Hybrid Chick',
    unit: 'প্রতি পিস',
    gradeA: 38,
    gradeB: 32,
    gradeC: 27,
    trend: 'stable',
    noteBn: 'গ্রেড-এ: ক্লাসিক ও হাইব্রিড ক্রস, ৩৯+ গ্রাম ওজন, ৯৮% জীবনীশক্তি।',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rate_layer_brown',
    category: 'poultry',
    subCategory: 'layer',
    nameBn: 'লেয়ার বাদামী ডিমের বাচ্চা (Layer Brown DOC)',
    nameEn: 'Layer Brown DOC (Lohmann/Novogen)',
    unit: 'প্রতি পিস',
    gradeA: 72,
    gradeB: 65,
    gradeC: 58,
    trend: 'stable',
    noteBn: 'গ্রেড-এ: ৯২-৯৫% ডিম উৎপাদন রেকর্ড ও উচ্চ রোগ প্রতিরোধ ক্ষমতা।',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rate_cockerel',
    category: 'poultry',
    subCategory: 'cockerel',
    nameBn: 'কক / ফাউমি একদিনের বাচ্চা (Fayoumi/Cock)',
    nameEn: 'Cockerel / Fayoumi Chick',
    unit: 'প্রতি পিস',
    gradeA: 26,
    gradeB: 22,
    gradeC: 18,
    trend: 'down',
    noteBn: 'গ্রেড-এ: শতভাগ পুং বাচ্চা আলাদা করা, রোগমুক্ত।',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rate_quail',
    category: 'birds',
    subCategory: 'quail',
    nameBn: 'জাপানি কোয়েল পাখির বাচ্চা (Quail Chick)',
    nameEn: 'Japanese Quail Chick',
    unit: 'প্রতি পিস',
    gradeA: 12,
    gradeB: 9,
    gradeC: 7,
    trend: 'stable',
    noteBn: 'গ্রেড-এ: ৪২ দিনে ডিম দেওয়া শুরু করে, হাইব্রিড সুস্থ বাচ্চা।',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rate_duck',
    category: 'birds',
    subCategory: 'duck',
    nameBn: 'খাকি ক্যাম্পবেল ও বেইজিং হাঁসের বাচ্চা',
    nameEn: 'Duckling (Khaki Campbell / Pekin)',
    unit: 'প্রতি পিস',
    gradeA: 55,
    gradeB: 48,
    gradeC: 40,
    trend: 'up',
    noteBn: 'গ্রেড-এ: হাঁসের প্লেগ প্রতিরোধী অ্যান্টিবডি সম্পন্ন প্যারেন্টস থেকে উৎপাদিত।',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rate_tilapia',
    category: 'fish',
    subCategory: 'tilapia',
    nameBn: 'মনোসেক্স তেলাপিয়া পোনা (Mono-sex Tilapia)',
    nameEn: 'Mono-sex Tilapia Fry',
    unit: 'প্রতি হাজার',
    gradeA: 1800,
    gradeB: 1400,
    gradeC: 1100,
    trend: 'stable',
    noteBn: 'গ্রেড-এ: ৯৯% পুরুষ তেলাপিয়া হরমোন ট্রিটমেন্ট সম্পন্ন, দ্রুত বৃদ্ধি পায়।',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rate_carp',
    category: 'fish',
    subCategory: 'carp',
    nameBn: 'রুই ও কাতলা মাছের ধানী/আঙুল পোনা (Carp Fingerling)',
    nameEn: 'Carp Species Fingerling (2-3 inch)',
    unit: 'প্রতি কেজি/হাজার',
    gradeA: 2800,
    gradeB: 2200,
    gradeC: 1700,
    trend: 'up',
    noteBn: 'গ্রেড-এ: ব্রুড স্টক বাছাই করা স্বাস্থ্যবান ২-৩ ইঞ্চি আঙুল পোনা।',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rate_pangash',
    category: 'fish',
    subCategory: 'pangash',
    nameBn: 'পাঙ্গাশ ও থাই কই মাছের পোনা',
    nameEn: 'Pangasius & Thai Koi Fingerling',
    unit: 'প্রতি হাজার',
    gradeA: 1500,
    gradeB: 1200,
    gradeC: 950,
    trend: 'stable',
    noteBn: 'গ্রেড-এ: কন্ডিশনিং করা পোনা, পরিবহনে কোনো ক্ষতি হয় না।',
    updatedAt: new Date().toISOString()
  }
];

export const initialChickListings: DemoChickListing[] = [
  {
    id: 'chick_ad_1',
    userId: 'company_kazi_farms',
    companyName: 'কাজী ফার্মস গ্রুপ (Kazi Farms Ltd.)',
    contactPerson: 'মোঃ কামরুল হাসান (হেড অফ সেলস)',
    phone: '01713000111',
    whatsapp: '01713000111',
    category: 'poultry',
    subCategory: 'ব্রয়লার (Broiler DOC)',
    grade: 'A',
    pricePerUnit: 64,
    unitLabel: 'পিস (১০০+২ ফ্রি প্রতি বক্স)',
    minimumOrder: 200,
    availableStock: 50000,
    deliveryDate: 'প্রতি রবি ও বুধবার দেশব্যাপী',
    district: 'গাজীপুর',
    deliveryArea: 'সারা দেশে এসি ভ্যান ও নিজস্ব বাহনে ডেলিভারি',
    vaccineDetails: 'হ্যাচারিতেই মারেক্স ও রোটেশনাল গামবোরো স্প্রে ভ্যাকসিনেটেড',
    description: 'সর্বোচ্চ এফসিআর (FCR) ও আন্তর্জাতিক মানের সুস্থ ও চকচকে ব্রয়লার বাচ্চা। সরাসরি হ্যাচারি পয়েন্ট বা ডিলারের মাধ্যমে সংগ্রহ করুন।',
    isVerified: true,
    isFeatured: true,
    status: 'available',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'chick_ad_2',
    userId: 'company_paragon',
    companyName: 'প্যারাগন পোল্ট্রি ও হ্যাচারি (Paragon Group)',
    contactPerson: 'ইঞ্জি. তারেক মাহমুদ',
    phone: '01711889922',
    whatsapp: '01711889922',
    category: 'poultry',
    subCategory: 'সোনালী হাইব্রিড বাচ্চা (Sonali Hybrid)',
    grade: 'A',
    pricePerUnit: 38,
    unitLabel: 'পিস',
    minimumOrder: 500,
    availableStock: 35000,
    deliveryDate: 'সপ্তাহের প্রতিদিন সকালের শিফটে',
    district: 'ময়মনসিংহ',
    deliveryArea: 'ময়মনসিংহ, ঢাকা, টাঙ্গাইল ও সিলেট অঞ্চল',
    vaccineDetails: 'এনডি ও গামবোরো মাতৃক অ্যান্টিবডি সমৃদ্ধ',
    description: '১০০% অরিজিনাল প্যারেন্টস থেকে সংগৃহীত। দ্রুত বর্ধনশীল এবং ৬০ দিনে ৮৫০-৯০০ গ্রাম গড় ওজন নিশ্চিত।',
    isVerified: true,
    isFeatured: true,
    status: 'available',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'chick_ad_3',
    userId: 'company_cp_bangladesh',
    companyName: 'সিপি বাংলাদেশ কোং লিঃ (C.P. Bangladesh)',
    contactPerson: 'জনাব মোস্তাফিজুর রহমান',
    phone: '01844556677',
    whatsapp: '01844556677',
    category: 'poultry',
    subCategory: 'লেয়ার বাদামী ডিমের বাচ্চা (CP Layer)',
    grade: 'A',
    pricePerUnit: 72,
    unitLabel: 'পিস',
    minimumOrder: 1000,
    availableStock: 20000,
    deliveryDate: 'অগ্রিম বুকিং সাপেক্ষে ৫ দিনের মধ্যে ডেলিভারি',
    district: 'ঢাকা',
    deliveryArea: 'সমগ্র বাংলাদেশ ডিলার পয়েন্টে ডেলিভারি',
    vaccineDetails: 'কমপ্লিট হ্যাচারি বায়োসিকিউরিটি ও প্রি-ভ্যাকসিনেশন সম্পন্ন',
    description: 'টানা ৮০-৮৫ সপ্তাহ পর্যন্ত পিক ডিম উৎপাদন ধরে রাখতে সক্ষম। বিশ্বখ্যাত সিপি লেয়ার ব্রিড।',
    isVerified: true,
    isFeatured: true,
    status: 'available',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'chick_ad_4',
    userId: 'company_bogura_sonali',
    companyName: 'বগুড়া গ্রিন হ্যাচারি অ্যান্ড ব্রিডার্স',
    contactPerson: 'আলহাজ্ব নজরুল ইসলাম',
    phone: '01912334455',
    whatsapp: '01912334455',
    category: 'poultry',
    subCategory: 'সোনালী ক্লাসিক বাচ্চা',
    grade: 'B',
    pricePerUnit: 32,
    unitLabel: 'পিস',
    minimumOrder: 200,
    availableStock: 15000,
    deliveryDate: 'প্রতি সোম ও শুক্রবার',
    district: 'বগুড়া',
    deliveryArea: 'উত্তরবঙ্গের ১৬ জেলায় সরাসরি বাসে ডেলিভারি',
    vaccineDetails: 'রানীক্ষেত ড্রপ ভ্যাকসিন দেওয়া আছে',
    description: 'বগুড়ার অরিজিনাল সোনালী বাচ্চা। গ্রেড-বি এর মধ্যে সবচেয়ে তাজা ও সাশ্রয়ী মূল্যে সংগ্রহ করতে পারবেন।',
    isVerified: true,
    isFeatured: false,
    status: 'available',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'chick_ad_5',
    userId: 'company_muktagacha_fish',
    companyName: 'মুক্তাগাছা সরকারি অনুমোদিত মৎস্য হ্যাচারি',
    contactPerson: 'মৎস্যবিদ মো. আবুল হোসেন',
    phone: '01712998877',
    whatsapp: '01712998877',
    category: 'fish',
    subCategory: 'মনোসেক্স তেলাপিয়া ও গুলশা পোনা',
    grade: 'A',
    pricePerUnit: 1800,
    unitLabel: 'প্রতি হাজার',
    minimumOrder: 2000,
    availableStock: 80000,
    deliveryDate: 'অক্সিজেন ব্যাগে করে ২৪ ঘণ্টার মধ্যে ডেলিভারি',
    district: 'ময়মনসিংহ',
    deliveryArea: 'ঢাকা, ময়মনসিংহ, রংপুর ও রাজশাহী',
    vaccineDetails: 'রোগমুক্ত ব্রুড ও কন্ডিশনিং সম্পন্ন পোনা',
    description: '১০০% মনোসেক্স গ্যারান্টি। কোনো মাদী বাচ্চা মিশে থাকবে না। পুকুরে দ্রুত বৃদ্ধি পাবে এবং ৪ মাসে ৫০০+ গ্রাম হবে।',
    isVerified: true,
    isFeatured: true,
    status: 'available',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'chick_ad_6',
    userId: 'company_quail_bird',
    companyName: 'রংপুর কোয়েল ও টার্কি ব্রিডিং ফার্ম',
    contactPerson: 'ডা. আসাদুজ্জামান',
    phone: '01725667788',
    whatsapp: '01725667788',
    category: 'birds',
    subCategory: 'জাপানি কোয়েল ও হাঁসের বাচ্চা',
    grade: 'A',
    pricePerUnit: 12,
    unitLabel: 'পিস (কোয়েল বাচ্চা)',
    minimumOrder: 500,
    availableStock: 10000,
    deliveryDate: 'সপ্তাহের যে কোনো দিন',
    district: 'রংপুর',
    deliveryArea: 'কুরিয়ার ও ট্রেন সার্ভিসের মাধ্যমে ডেলিভারি',
    vaccineDetails: 'স্যালাইন ও গ্লুকোজ কেয়ার প্যাকেজ সহ',
    description: '১ দিনের তাজা কোয়েল বাচ্চা ও বেইজিং হাঁসের সুস্থ বাচ্চা পাইকারি ও খুচরা বিক্রয় করা হয়।',
    isVerified: true,
    isFeatured: false,
    status: 'available',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

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

const initialMarketPosts: DemoMarketPost[] = [];

const initialStoreListings: DemoStoreListing[] = [];

const initialBatches: DemoBatch[] = [
  // 🐔 ৪টি মুরগির ব্যাচ (Poultry Batches)
  {
    id: 'demo_batch_1',
    userId: 'demo_khamari_user_1',
    batchName: 'ব্রয়লার শেড-০১ (১০০০ বাচ্চা)',
    farmType: 'poultry',
    startDate: new Date(Date.now() - 22 * 86400000).toISOString().split('T')[0],
    totalChicks: 1000,
    costPerChick: 36,
    status: 'active',
    createdAt: new Date(Date.now() - 22 * 86400000).toISOString()
  },
  {
    id: 'demo_batch_2',
    userId: 'demo_khamari_user_1',
    batchName: 'সোনালী মুরগি শেড-০২ (৮০০ বাচ্চা)',
    farmType: 'poultry',
    startDate: new Date(Date.now() - 40 * 86400000).toISOString().split('T')[0],
    totalChicks: 800,
    costPerChick: 30,
    status: 'active',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString()
  },
  {
    id: 'demo_batch_p3',
    userId: 'demo_khamari_user_1',
    batchName: 'লেয়ার ডিম মুরগি শেড-০৩ (৬০০ পাখি)',
    farmType: 'poultry',
    startDate: new Date(Date.now() - 75 * 86400000).toISOString().split('T')[0],
    totalChicks: 600,
    costPerChick: 42,
    status: 'active',
    createdAt: new Date(Date.now() - 75 * 86400000).toISOString()
  },
  {
    id: 'demo_batch_p4',
    userId: 'demo_khamari_user_1',
    batchName: 'দেশি মুরগি ব্রিডিং শেড-০৪ (৩০০ পিস)',
    farmType: 'poultry',
    startDate: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    totalChicks: 300,
    costPerChick: 25,
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },

  // 🐄 ৪টি গরুর ব্যাচ (Cattle / Livestock Batches)
  {
    id: 'demo_batch_3',
    userId: 'demo_khamari_user_1',
    batchName: 'ডেইরি গাভী শেড-০১ (দুধ প্রকল্প - ৮টি)',
    farmType: 'cattle',
    startDate: new Date(Date.now() - 120 * 86400000).toISOString().split('T')[0],
    totalChicks: 8,
    costPerChick: 65000,
    status: 'active',
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString()
  },
  {
    id: 'demo_batch_c2',
    userId: 'demo_khamari_user_1',
    batchName: 'ষাঁড় মোটাতাজাকরণ লট-০২ (কোরবানি - ৬টি)',
    farmType: 'cattle',
    startDate: new Date(Date.now() - 80 * 86400000).toISOString().split('T')[0],
    totalChicks: 6,
    costPerChick: 55000,
    status: 'active',
    createdAt: new Date(Date.now() - 80 * 86400000).toISOString()
  },
  {
    id: 'demo_batch_c3',
    userId: 'demo_khamari_user_1',
    batchName: 'বাছুর পালন শেড-০৩ (৪টি বাছুর)',
    farmType: 'cattle',
    startDate: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0],
    totalChicks: 4,
    costPerChick: 22000,
    status: 'active',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
  },
  {
    id: 'demo_batch_c4',
    userId: 'demo_khamari_user_1',
    batchName: 'দেশি ও ব্রাহমা ক্রস শেড-০৪ (৫টি)',
    farmType: 'cattle',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    totalChicks: 5,
    costPerChick: 48000,
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },

  // 🐟 ২টি মাছের ব্যাচ (Fish Batches)
  {
    id: 'demo_batch_4',
    userId: 'demo_khamari_user_1',
    batchName: 'তেলাপিয়া মাছ চাষ পুকুর-১ (৪০০০ পোনা)',
    farmType: 'fish',
    startDate: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0],
    totalChicks: 4000,
    costPerChick: 2.5,
    status: 'active',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
  },
  {
    id: 'demo_batch_f2',
    userId: 'demo_khamari_user_1',
    batchName: 'রুই-কাতলা মিশ্র চাষ পুকুর-২ (২০০০ পোনা)',
    farmType: 'fish',
    startDate: new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0],
    totalChicks: 2000,
    costPerChick: 6,
    status: 'active',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
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
    const raw = getItem<DemoMarketPost[]>('market_posts', initialMarketPosts);
    // Purge legacy hardcoded dummy posts if they exist
    const filtered = (raw || []).filter(p => p && p.id !== 'post_1' && p.id !== 'post_2' && p.id !== 'post_3' && !p.userId?.startsWith('demo_other_user_'));
    if (filtered.length !== (raw || []).length) {
      setItem('market_posts', filtered);
    }
    return filtered;
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
  },

  // Store & Shop Listings Directory
  getStoreListings(): DemoStoreListing[] {
    const raw = getItem<DemoStoreListing[]>('store_listings', initialStoreListings);
    // Purge legacy hardcoded dummy stores if they exist in cache/localStorage
    const filtered = (raw || []).filter(s => s && s.id !== 'store_1' && s.id !== 'store_2' && s.id !== 'store_3' && s.id !== 'store_4' && !s.userId?.startsWith('demo_store_'));
    if (filtered.length !== (raw || []).length) {
      setItem('store_listings', filtered);
    }
    return filtered;
  },
  saveStoreListing(store: Omit<DemoStoreListing, 'id' | 'createdAt'> & { id?: string }): DemoStoreListing {
    const records = this.getStoreListings();
    if (store.id) {
      const idx = records.findIndex(r => r.id === store.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...store };
        setItem('store_listings', records);
        return records[idx];
      }
    }
    const newRecord: DemoStoreListing = {
      ...store,
      id: 'store_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    setItem('store_listings', records);
    return newRecord;
  },
  deleteStoreListing(id: string): void {
    const records = this.getStoreListings().filter(r => r.id !== id);
    setItem('store_listings', records);
  },

  // ----------------- Chick Market Rates (A, B, C Grades) -----------------
  getChickRates(): DemoChickRate[] {
    return getItem<DemoChickRate[]>('chick_rates', initialChickRates);
  },
  updateChickRate(id: string, updates: Partial<DemoChickRate>): DemoChickRate | null {
    const rates = this.getChickRates();
    const idx = rates.findIndex(r => r.id === id);
    if (idx !== -1) {
      rates[idx] = { ...rates[idx], ...updates, updatedAt: new Date().toISOString() };
      setItem('chick_rates', rates);
      return rates[idx];
    }
    return null;
  },

  // ----------------- Chick & DOC Listings (Hatchery / Company Ads) -----------------
  getChickListings(): DemoChickListing[] {
    return getItem<DemoChickListing[]>('chick_listings', initialChickListings);
  },
  saveChickListing(listing: Omit<DemoChickListing, 'id' | 'createdAt'> & { id?: string }): DemoChickListing {
    const records = this.getChickListings();
    if (listing.id) {
      const idx = records.findIndex(r => r.id === listing.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...listing };
        setItem('chick_listings', records);
        return records[idx];
      }
    }
    const newRecord: DemoChickListing = {
      ...listing,
      id: 'chick_ad_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    setItem('chick_listings', records);
    return newRecord;
  },
  deleteChickListing(id: string): void {
    const records = this.getChickListings().filter(r => r.id !== id);
    setItem('chick_listings', records);
  },

  // Clear all demo/test data for production readiness
  clearAllData(): void {
    setItem('batches', []);
    setItem('feed_records', []);
    setItem('medicine_records', []);
    setItem('mortality_records', []);
    setItem('expense_records', []);
    setItem('sale_records', []);
    setItem('due_records', []);
    setItem('market_posts', []);
    setItem('market_buyers', []);
    setItem('store_listings', []);
    setItem('chick_rates', []);
    setItem('chick_listings', []);
  },

  // Reset back to initial sample demo data
  resetToInitialDemo(): void {
    setItem('batches', initialBatches);
    setItem('feed_records', initialFeed);
    setItem('medicine_records', initialMedicine);
    setItem('mortality_records', initialMortality);
    setItem('expense_records', initialExpenses);
    setItem('sale_records', initialSales);
    setItem('due_records', initialDues);
    setItem('market_posts', initialMarketPosts);
    setItem('market_buyers', initialMarketBuyers);
    setItem('store_listings', initialStoreListings);
    setItem('chick_rates', initialChickRates);
    setItem('chick_listings', initialChickListings);
  }
};


