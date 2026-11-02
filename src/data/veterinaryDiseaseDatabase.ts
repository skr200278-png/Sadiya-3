/**
 * Comprehensive Veterinary & Aquaculture Disease Database
 * Focused on Bangladesh & South Asian livestock, poultry, and fish farming standards.
 */

export type AnimalSector = 'poultry' | 'cattle' | 'fish';

export interface MedicineItem {
  genericName: string;
  brandNames: string[]; // Popular brands in BD (Renata, Square, ACI, Acme, SK+F, etc.)
  dosageBn: string;     // Exact dosage: e.g. "১ গ্রাম প্রতি ১ লিটার পানিতে"
  durationBn: string;   // e.g. "টানা ৩ থেকে ৫ দিন"
  instructionBn: string; // e.g. "সকালে ফ্রেশ পানিতে দিতে হবে"
}

export interface DiseaseRecord {
  id: string;
  sector: AnimalSector;
  species: string[]; // e.g. ['broiler', 'sonali', 'layer', 'deshi', 'duck', 'quail', 'pigeon']
  nameBn: string;
  nameEn: string;
  aliasesBn: string[];
  causeBn: string; // 'ব্যাকটেরিয়া', 'ভাইরাস', 'ছত্রাক', 'পরজীবী', 'ব্যবস্থাপনা ত্রুটি'
  severity: 'mild' | 'moderate' | 'critical';
  isCriticalRequireVet: boolean; // Viral or fatal diseases requiring mandatory vet doctor consult
  symptomsBn: string[];
  descriptionBn: string;
  medicines: MedicineItem[];
  managementTipsBn: string[];
  preventiveVaccineBn?: string;
  doctorNoteBn?: string;
}

export const VETERINARY_DISEASE_DB: DiseaseRecord[] = [
  // ==========================================
  // ১. পাখি (POULTRY) - ব্রয়লার, সোনালী, লেয়ার, হাঁস ইত্যাদি
  // ==========================================
  {
    id: 'poultry_crd',
    sector: 'poultry',
    species: ['broiler', 'sonali', 'layer', 'deshi', 'quail', 'pigeon'],
    nameBn: 'সিআরডি / ঠান্ডা ও সর্দি-কাশি (মাইকোপ্লাজমোসিস)',
    nameEn: 'Chronic Respiratory Disease (CRD)',
    aliasesBn: ['সর্দি', 'ঠান্ডা', 'কাশি', 'ঘড়ঘড়', 'ঘড় ঘড় শব্দ', 'নাক দিয়ে পানি', 'চোখ ফোলা', 'হাঁচি', 'crd', 'cold'],
    causeBn: 'ব্যাকটেরিয়া (মাইকোপ্লাজমা গ্যালিসেপটিকাম) ও পরিবেশগত ধকল',
    severity: 'moderate',
    isCriticalRequireVet: false,
    symptomsBn: [
      'রাতে বা শান্ত পরিবেশে নাকে-গলায় ঘড়ঘড় শব্দ হওয়া',
      'নাক ও চোখ দিয়ে সর্দি বা পানি পড়া',
      'মাথা ঝাঁকানো ও ঘন ঘন হাঁচি দেওয়া',
      'চোখ ফুলে যাওয়া বা চোখে পিঁচুটি জমা',
      'খাবার গ্রহণ কমে যাওয়া ও বৃদ্ধি থমকে যাওয়া'
    ],
    descriptionBn: 'পোল্ট্রি খামারের সবচেয়ে পরিচিত ব্যাকটেরিয়াজনিত রোগ। সঠিক সময়ে চিকিৎসা না করালে এটি জটিল রূপ (CCRD) ধারণ করে প্রচুর আর্থিক ক্ষতি করে।',
    medicines: [
      {
        genericName: 'ডক্সিসাইক্লিন + কলিস্টিন (Doxycycline + Colistin)',
        brandNames: ['Doxitin (রেনেক্স)', 'Renamycin (রেনেটা)', 'Doxivet (স্কয়ার)', 'Colidox (এসিআই)'],
        dosageBn: '১ গ্রাম পাউডার প্রতি ২ লিটার খাবার পানিতে',
        durationBn: 'টানা ৪ থেকে ৫ দিন (প্রতিদিন সকালে ও সন্ধ্যায় ফ্রেশ পানিতে)',
        instructionBn: 'সর্দি বা কফের জন্য সাথে মিউকোলাইটিক বা ব্রোমহেক্সিন (যেমন: Mentovet বা Respo-Mint ১ মিলি / ৪ লিটার) দিলে দ্রুত কফ পরিষ্কার হয়।'
      },
      {
        genericName: 'টাইলোসিন টার্ট্রেট (Tylosin Tartrate)',
        brandNames: ['Tylosin Vet (রেনেটা)', 'Tylocip (স্কয়ার)', 'Pharmasin'],
        dosageBn: '১ গ্রাম পাউডার প্রতি ১.৫ থেকে ২ লিটার পানিতে',
        durationBn: 'টানা ৩ থেকে ৫ দিন',
        instructionBn: 'তীব্র বা দীর্ঘস্থায়ী ঘড়ঘড় শব্দের ক্ষেত্রে টাইলোসিন অত্যন্ত কার্যকর।'
      },
      {
        genericName: 'ভিটামিন সি + ইলেক্ট্রোলাইট (সহায়ক পুষ্টি)',
        brandNames: ['C-Vet (স্কয়ার)', 'Electrolyte Vet', 'Alquolyt'],
        dosageBn: '১ গ্রাম প্রতি ২ লিটার পানিতে দুপুরের গরমের সময়',
        durationBn: '৩ দিন',
        instructionBn: 'রোগের সময় শ্বাসকষ্ট ও স্ট্রেস কমাতে চমৎকার কাজ করে।'
      }
    ],
    managementTipsBn: [
      'শেডের অ্যামোনিয়া গ্যাস পরীক্ষা করুন; শেডের পর্দা নিচ থেকে ১ ফুট খোলা রেখে পর্যাপ্ত বাতাস চলাচলের ব্যবস্থা করুন।',
      'ভেজা লিটার অবিলম্বে অপসারণ করে শুকনা চুন ও নতুন লিটার ব্যবহার করুন।',
      'শেডের ভেতরে কোনো অবস্থাতেই ধোঁয়া বা অতিরিক্ত ধুলাবালি জমতে দেবেন না।'
    ],
    preventiveVaccineBn: 'সুস্থ অবস্থায় বায়োসিকিউরিটি রক্ষা ও মাইকোপ্লাজমা মুক্ত বাচ্চা সংগ্রহ।'
  },
  {
    id: 'poultry_ranikhet',
    sector: 'poultry',
    species: ['broiler', 'sonali', 'layer', 'deshi', 'quail', 'pigeon'],
    nameBn: 'রানিখেত রোগ (Newcastle Disease - ND)',
    nameEn: 'Ranikhet Disease / Newcastle Disease',
    aliasesBn: ['রানিখেত', 'রানীক্ষেত', 'ranikhet', 'nd', 'ঘাড় বাঁকা', 'ঘাড় ঘুরানো', 'সবুজ পায়খানা', 'চুনা সবুজ পায়খানা'],
    causeBn: 'ভাইরাস (প্যারামাইক্সোভাইরাস - Type 1)',
    severity: 'critical',
    isCriticalRequireVet: true,
    symptomsBn: [
      'ঘাড় বাঁকা হয়ে যাওয়া বা উল্টো দিকে পাক খাওয়া (Torticollis)',
      'গাঢ় সবুজ রঙের সাথে চুনাযুক্ত পানির মতো পাতলা পায়খানা',
      'পা ও ডানা অবশ হয়ে খুঁড়িয়ে চলা বা বসে পড়া',
      'তীব্র শ্বাসকষ্ট, হাঁ করে শ্বাস নেওয়া ও ঘড়ঘড় আওয়াজ',
      'হঠাৎ খামারে ব্যাপকভাবে মৃত্যুর মিছিল শুরু হওয়া'
    ],
    descriptionBn: 'পোল্ট্রির অন্যতম মরণঘাতী ভাইরাসজনিত রোগ। ভাইরাস রোগে কোনো অ্যান্টিবায়োটিক সরাসরি ভাইরাস মারতে পারে না। সঠিক সময়ে ভ্যাকসিনের মাধ্যমেই এটি প্রতিরোধ করতে হয়।',
    medicines: [
      {
        genericName: 'ইলেক্ট্রোলাইট + গ্লুকোজ + ভিটামিন সি (ভাইরাস সাপোর্ট)',
        brandNames: ['Glucolyte Vet', 'Electrolyte Plus', 'C-Vet'],
        dosageBn: 'প্রতি লিটার পানিতে ২ গ্রাম গ্লুকোজ ও ১ গ্রাম ইলেক্ট্রোলাইট',
        durationBn: 'টানা ৫ থেকে ৭ দিন',
        instructionBn: 'শরীরে শক্তির জোগান দিতে ও ডিহাইড্রেশন রোধে দিতে হবে।'
      },
      {
        genericName: 'ভিটামিন ই + সেলেনিয়াম (স্নায়ু ও রোগ প্রতিরোধ বৃদ্ধি)',
        brandNames: ['E-Sel (রেনেটা)', 'Vit-E Selen (স্কয়ার)', 'Evita-Vet'],
        dosageBn: '১ মিলি প্রতি ২ লিটার খাবার পানিতে',
        durationBn: 'টানা ৫ দিন',
        instructionBn: 'ঘাড় বাঁকা ও প্যারালাইসিস হওয়া পাখির স্নায়বিক দুর্বলতা কাটাতে সহায়ক।'
      },
      {
        genericName: 'সেকেন্ডারি ব্যাকটেরিয়া রোধক ব্রড-স্পেকট্রাম অ্যান্টিবায়োটিক',
        brandNames: ['Renamox (এমোক্সিসিলিন)', 'Ciprocin Vet'],
        dosageBn: 'কেবলমাত্র ডাক্তারের নির্দেশনায় সেকেন্ডারি ইনফেকশন রোধে পরিমিত মাত্রায়',
        durationBn: '৩-৫ দিন',
        instructionBn: 'সরাসরি ভাইরাস ধ্বংস করে না, কেবল ফুসফুস ও অন্ত্রে ব্যাকটেরিয়া সংক্রমণ ঠেকায়।'
      }
    ],
    managementTipsBn: [
      '⚠️ আক্রান্ত পাখিকে সাথে সাথে আলাদা (আইসোলেশন) করুন এবং মৃত পাখি শেড থেকে দূরে কমপক্ষে ৩ ফুট মাটির নিচে পুতে ফেলুন।',
      'খামারের মেঝে, দেয়াল ও চারপাশ ভাইরোসিড (Virocid) বা টিমসেন (Timsen) দিয়ে দিনে ২ বার জীবাণুমুক্ত স্প্রে করুন।',
      'কোনো অবস্থাতেই সুস্থ পাখির শেডে আক্রান্ত শেডের জুতো বা সরঞ্জাম নিয়ে যাবেন না।'
    ],
    preventiveVaccineBn: '৪-৫ দিনে চোখে BCRDV / Clone-30 ড্রপ এবং ২১-২৪ দিনে RDV বুস্টার ভ্যাকসিন।'
  },
  {
    id: 'poultry_gumboro',
    sector: 'poultry',
    species: ['broiler', 'sonali', 'layer', 'deshi'],
    nameBn: 'গামবোরো রোগ (Infectious Bursal Disease - IBD)',
    nameEn: 'Gumboro Disease (IBD)',
    aliasesBn: ['গামবোরো', 'গামবুরো', 'gumboro', 'ibd', 'সাদা পাতলা পায়খানা', 'পালক ভেজা', 'পাছায় ময়লা'],
    causeBn: 'ভাইরাস (বিরনাভাইরাস - Birnavirus)',
    severity: 'critical',
    isCriticalRequireVet: true,
    symptomsBn: [
      'সাদা রঙের পানির মতো পাতলা পায়খানা (Chalky White Diarrhea)',
      'পায়ুপথের চারপাশের পালক সাদা মল ও পানিতে ভিজে লেপ্টে থাকা',
      'পাখি এক কোণায় জটলা বেঁধে ঠকঠক করে কাঁপা ও ঘুমানো',
      'প্রচণ্ড পানির পিপাসা লাগা কিন্তু খাবার খাওয়া একবারে বন্ধ করে দেওয়া',
      '১৪ থেকে ২৮ দিন বয়সের মধ্যে আকস্মিক মৃত্যুহার আকাশচুম্বী হওয়া'
    ],
    descriptionBn: 'মুরগির রোগ প্রতিরোধ অঙ্গ (বার্সা) ধ্বংসকারী অতি সংক্রামক ভাইরাস। ভুল চিকিৎসায় ২-৩ দিনে পুরো খামার উজাড় হতে পারে।',
    medicines: [
      {
        genericName: 'প্যারাসিটামল + ভিটামিন সি (জ্বর ও প্রদাহ নাশক)',
        brandNames: ['Fast Vet', 'Pyrovet', 'Para-C'],
        dosageBn: '১ মিলি বা ১ গ্রাম প্রতি ২ লিটার পানিতে',
        durationBn: 'টানা ৩ দিন (দুপুরের পানিতে)',
        instructionBn: 'গামবোরোতে তীব্র জ্বর ও শরীরে প্রচণ্ড ব্যথা হয়; প্যারাসিটামল তা কমাতে সাহায্য করে।'
      },
      {
        genericName: 'কিডনি প্রটেক্টর ও ইলেক্ট্রোলাইট (মূত্রনালী পরিষ্কারক)',
        brandNames: ['Renalin (রেনেটা)', 'Urocare Vet', 'Nephrotec'],
        dosageBn: '১ মিলি প্রতি ১ লিটার পানিতে',
        durationBn: 'টানা ৩ থেকে ৫ দিন',
        instructionBn: 'গামবোরো হলে কিডনিতে ইউরেট জমে কিডনি ফুলে যায়; রেনালিন কিডনিকে সচল রাখে।'
      },
      {
        genericName: 'ইমিউনো বুস্টার ও লিভার টনিক',
        brandNames: ['Immunovet', 'Superliv Liquid', 'Hepato-Protect'],
        dosageBn: '১ মিলি প্রতি ২ লিটার পানিতে',
        durationBn: '৫ দিন',
        instructionBn: 'ধ্বংসপ্রাপ্ত রোগ প্রতিরোধ ক্ষমতা পুনরুদ্ধারে সহায়ক।'
      }
    ],
    managementTipsBn: [
      '⚠️ এই রোগে ভুলেও অতিরিক্ত অ্যান্টিবায়োটিক দেওয়া যাবে না; অতিরিক্ত অ্যান্টিবায়োটিকে কিডনি বিকল হয়ে আরও বেশি মুরগি মারা যায়!',
      'পানির পাত্র সার্বক্ষণিক পরিষ্কার ও ঠান্ডা রাখুন; পর্যাপ্ত ইলেক্ট্রোলাইট মিশ্রিত পানি সরবরাহ করুন।',
      'খামার জীবাণুমুক্ত স্প্রে করুন এবং বাইরের কোনো দর্শনার্থী প্রবেশ বন্ধ রাখুন।'
    ],
    preventiveVaccineBn: '১০-১২ দিনে প্রথম গামবোরো (Intermediate Plus) এবং ১৭-১৯ দিনে বুস্টার ভ্যাকসিন।'
  },
  {
    id: 'poultry_coccidiosis',
    sector: 'poultry',
    species: ['broiler', 'sonali', 'layer', 'deshi', 'quail'],
    nameBn: 'কক্সিডিওসিস / রক্ত আমাশয়',
    nameEn: 'Coccidiosis',
    aliasesBn: ['রক্ত আমাশয়', 'কক্সি', 'কক্সিডিওসিস', 'রক্ত পায়খানা', 'লাল পায়খানা', 'খয়েরি পায়খানা', 'coccidiosis', 'bloody diarrhea'],
    causeBn: 'এককোষী প্রোটোজোয়া পরজীবী (Eimeria tenella / necatrix)',
    severity: 'moderate',
    isCriticalRequireVet: false,
    symptomsBn: [
      'মলের সাথে তাজা লাল রক্ত বা চকোলেট রঙের রক্ত আমাশয় যাওয়া',
      'পাখির পালক উসকোখুসকো ও চোখ বন্ধ করে ঝিম ধরে থাকা',
      'শারীরিক বৃদ্ধি থেমে যাওয়া ও রক্তশূন্যতায় ফ্যাকাসে হয়ে যাওয়া',
      'পায়ুপথে রক্ত লেগে থাকা ও খাবার না খাওয়া'
    ],
    descriptionBn: 'ভেজা লিটার ও স্যাঁতসেঁতে পরিবেশে এই পরজীবী দ্রুত বংশবৃদ্ধি করে অন্ত্রের প্রাচীর কেটে রক্তক্ষরণ ঘটায়।',
    medicines: [
      {
        genericName: 'টোলট্রাজুরিল (Toltrazuril 2.5%)',
        brandNames: ['Coxitril (স্কয়ার)', 'Toltrazuril Vet (রেনেটা)', 'Toltraz (একমি)'],
        dosageBn: '১ মিলি প্রতি ১ লিটার খাবার পানিতে',
        durationBn: 'টানা ২ দিন (প্রতিদিন টানা ৮ ঘণ্টা এই পানিতে রাখতে হবে)',
        instructionBn: 'আধুনিক কক্সি প্রতিরোধে সবচেয়ে নির্ভরযোগ্য ও দ্রুত কার্যকরী ঔষধ।'
      },
      {
        genericName: 'সালফাক্লোজিন সোডিয়াম (Sulphaclozine Sodium)',
        brandNames: ['ESb3 30% (নোভারটিস/এলানকো)', 'Coxivet (এসিআই)', 'Sulfacloz-Vet'],
        dosageBn: '১.৫ থেকে ২ গ্রাম পাউডার প্রতি ১ লিটার খাবার পানিতে',
        durationBn: 'টানা ৩ দিন দিয়ে ২ দিন বিরতি, অতঃপর পুনরায় ২ দিন (3-2-2 নিয়ম)',
        instructionBn: 'পুরাতন ও তীব্র রক্ত আমাশয়ে অত্যন্ত সফল ওষুধ।'
      },
      {
        genericName: 'ভিটামিন কে + ভিটামিন এ (রক্ত জমাট বাঁধার জন্য)',
        brandNames: ['Hemovit Vet', 'Vit-K3', 'K-Sol'],
        dosageBn: '১ গ্রাম প্রতি ২ লিটার পানিতে',
        durationBn: 'টানা ৩ দিন',
        instructionBn: 'অন্ত্রের রক্তপাত বন্ধ করতে সাহায্য করে।'
      }
    ],
    managementTipsBn: [
      'শেডের কোনো স্থানে লিটার ভিজে থাকলে সাথে সাথে ফেলে শুকনা তুঁষ দিন।',
      'পানির পাত্র এমনভাবে স্থাপন করুন যাতে নিচে পানি না ছিটায়।',
      'কক্সির চিকিৎসাকালে লিটার সম্পূর্ণ শুকনা ও ঝরঝরে রাখা অত্যন্ত জরুরি।'
    ],
    preventiveVaccineBn: 'লেয়ার ও ব্রিডারে কক্সিডিওসিস ভ্যাকসিন ব্যবহার করা যায়।'
  },
  {
    id: 'poultry_pullorum',
    sector: 'poultry',
    species: ['broiler', 'sonali', 'layer', 'deshi', 'quail'],
    nameBn: 'পুলোরাম / চুনা পায়খানা (Bacillary White Diarrhea)',
    nameEn: 'Pullorum Disease / Bacillary White Diarrhea',
    aliasesBn: ['চুনা পায়খানা', 'চুনা পায়খানা', 'সাদা পায়খানা', 'পুলোরাম', 'pullorum', 'white diarrhea'],
    causeBn: 'ব্যাকটেরিয়া (Salmonella pullorum)',
    severity: 'moderate',
    isCriticalRequireVet: false,
    symptomsBn: [
      'চকের মতো ধবধবে সাদা আঠালো পায়খানা হওয়া',
      'পায়ুপথের মুখ আঠালো সাদা পায়খানা দিয়ে আটকে যাওয়া (Pasting of vent)',
      'বাচ্চা ব্যথায় তীব্র চিৎকার ও কিচিরমিচির করা',
      'ব্রুডারে এক জায়গায় জড়ো হয়ে কাঁপতে থাকা'
    ],
    descriptionBn: 'সালমোনেলা ব্যাকটেরিয়াজনিত রোগ যা মূলত ডিম বা হ্যাচারি থেকে এক দিনের বাচ্চার দেহে সংক্রমিত হয়।',
    medicines: [
      {
        genericName: 'এমোক্সিসিলিন ট্রাইহাইড্রেট (Amoxicillin Trihydrate)',
        brandNames: ['Renamox (রেনেটা)', 'Moxivet (স্কয়ার)', 'Amoxivet (এসিআই)'],
        dosageBn: '১ গ্রাম পাউডার প্রতি ২ লিটার খাবার পানিতে',
        durationBn: 'টানা ৪ থেকে ৫ দিন',
        instructionBn: 'সকালে ও সন্ধ্যায় পরিষ্কার পানিতে গুলে খাওয়াতে হবে।'
      },
      {
        genericName: 'সিপ্রোফ্লক্সাসিন (Ciprofloxacin Vet)',
        brandNames: ['Ciprocin Vet (স্কয়ার)', 'Cipro-A (এসিআই)', 'Avicyp'],
        dosageBn: '১ মিলি প্রতি ২ লিটার খাবার পানিতে',
        durationBn: 'টানা ৩ থেকে ৫ দিন',
        instructionBn: 'তীব্র ইনফেকশনের ক্ষেত্রে ব্যাকটেরিয়া ধ্বংস করতে অত্যন্ত ফলপ্রসূ।'
      }
    ],
    managementTipsBn: [
      'আক্রান্ত বাচ্চার পায়ুপথের শক্ত হয়ে যাওয়া পায়খানা কুসুম গরম পানিতে তুলা ভিজিয়ে পরিষ্কার করে দিন।',
      'ব্রুডারের তাপমাত্রা সঠিক (৯৫°F থেকে শুরু করে প্রতি সপ্তাহে ৫° করে কমানো) নিশ্চিত করুন।'
    ]
  },
  {
    id: 'poultry_fowl_cholera',
    sector: 'poultry',
    species: ['broiler', 'sonali', 'layer', 'deshi', 'duck'],
    nameBn: 'ফাউল কলেরা (Fowl Cholera)',
    nameEn: 'Fowl Cholera',
    aliasesBn: ['কলেরা', 'ফাউল কলেরা', 'cholera', 'মাথার ঝুঁটি নীল', 'গলকম্বল ফোলা', 'হলুদ সবুজ পায়খানা'],
    causeBn: 'ব্যাকটেরিয়া (Pasteurella multocida)',
    severity: 'moderate',
    isCriticalRequireVet: false,
    symptomsBn: [
      'হলুদ বা সবুজ রঙের তীব্র দুর্গন্ধযুক্ত পাতলা পায়খানা',
      'মাথার ঝুঁটি (Comb) ও গলকম্বল কালচে-নীল বা রক্তবর্ণ ধারণ করা',
      'তীব্র জ্বর, অস্থিরতা ও প্রচুর পানির পিপাসা',
      'মুখ ও নাক দিয়ে আঠালো শ্লেষ্মা বা ফেনা বের হওয়া',
      'হঠাৎ সুস্থ দেখতে পাখি কয়েক ঘণ্টার ব্যবধানে মারা যাওয়া'
    ],
    descriptionBn: 'একটি মারাত্মক তীব্র ব্যাকটেরিয়াজনিত সংক্রামক রোগ যা হাঁস ও বড় বয়সের মুরগিতে বেশি দেখা যায়।',
    medicines: [
      {
        genericName: 'সালফাডায়াজিন + ট্রাইমিথোপ্রিম (Co-trimoxazole)',
        brandNames: ['Cotrim Vet (স্কয়ার)', 'Sultrim (রেনেটা)', 'Trimovet'],
        dosageBn: '১ গ্রাম পাউডার বা ১ মিলি প্রতি ১.৫ লিটার পানিতে',
        durationBn: 'টানা ৫ দিন',
        instructionBn: 'সকালে ফ্রেশ পানিতে দিতে হবে।'
      },
      {
        genericName: 'এনরোফ্লক্সাসিন (Enrofloxacin 10%)',
        brandNames: ['Enrocip (স্কয়ার)', 'Enrosol (একমি)', 'Renacin (রেনেটা)'],
        dosageBn: '১ মিলি প্রতি ২ লিটার খাবার পানিতে',
        durationBn: 'টানা ৪ থেকে ৫ দিন',
        instructionBn: 'তীব্র সংক্রমণে এনরোফ্লক্সাসিন দ্রুত নিয়ন্ত্রণে আনে।'
      }
    ],
    managementTipsBn: [
      'আক্রান্ত পাখিকে সুস্থ দল থেকে আলাদা করুন। শেডের পানির পাত্র ব্লিচিং পাউডার বা পটাশ দিয়ে ধুয়ে জীবাণুমুক্ত করুন।'
    ],
    preventiveVaccineBn: 'সোনালী ও লেয়ার মুরগিতে ৮-১২ সপ্তাহে ফাউল কলেরা ভ্যাকসিন প্রয়োগ।'
  },
  {
    id: 'poultry_fowl_pox',
    sector: 'poultry',
    species: ['broiler', 'sonali', 'layer', 'deshi', 'pigeon', 'quail'],
    nameBn: 'ফাউল পক্স / মুরগির বসন্ত',
    nameEn: 'Fowl Pox',
    aliasesBn: ['বসন্ত', 'পক্স', 'গুটি', 'ফোস্কা', 'চোখে গুটি', 'fowl pox', 'pox'],
    causeBn: 'ভাইরাস (এভিয়ান পক্সভাইরাস - মশা ও মাছির মাধ্যমে ছড়ায়)',
    severity: 'moderate',
    isCriticalRequireVet: false,
    symptomsBn: [
      'ঝুঁটি, গলকম্বল, চোখের পাতা ও ঠোঁটের কোণে খসখসে গুটি বা ফোস্কা ওঠা',
      'চোখ ফুলে যাওয়া ও পিঁচুটি জমে চোখ বন্ধ হয়ে যাওয়া',
      'ডিপথেরিক রূপে মুখের ভেতরে ও গলায় হলদেটে ক্ষতের আবরণ তৈরি হওয়া (শ্বাস নিতে কষ্ট)'
    ],
    descriptionBn: 'ধীরগতির ভাইরাসজনিত রোগ যা মূলত মশার কামড় ও খামারের ক্ষতের মাধ্যমে এক পাখি থেকে অন্য পাখিতে ছড়ায়।',
    medicines: [
      {
        genericName: 'পভিডোন আয়োডিন ও গ্লিসারিন (লোকাল অ্যান্টিসেপটিক)',
        brandNames: ['Pevisone', 'Viodin Ointment', 'Glycerin'],
        dosageBn: 'তুলা দিয়ে আলতো করে গুটির ওপর দিনে ২ বার প্রলেপ দিতে হবে',
        durationBn: 'গুটি শুকিয়ে যাওয়া পর্যন্ত (৫-৭ দিন)',
        instructionBn: 'গুটি জোর করে খোঁচা দিয়ে তুলে ফেলা যাবে না, এতে ঘা ছড়িয়ে পড়ে।'
      },
      {
        genericName: 'সেকেন্ডারি ব্যাকটেরিয়া রোধে টেট্রাসাইক্লিন বা এমোক্সিসিলিন',
        brandNames: ['Renamycin Powder', 'Moxivet'],
        dosageBn: '১ গ্রাম প্রতি ২ লিটার পানিতে',
        durationBn: 'টানা ৩ থেকে ৫ দিন',
        instructionBn: 'গুটির কারণে হওয়া ক্ষত থেকে ব্যাকটেরিয়া ইনফেকশন রোধে দিতে হয়।'
      }
    ],
    managementTipsBn: [
      'শেডে মশা ও মাছি দমনের জন্য নিরাপদ নেট ব্যবহার করুন বা ফাঁদ পাতুন।',
      'ভিটামিন এ (যেমন: Vit-A Vet) পানিতে দিলে মুখের ত্বক ও শ্লেষ্মা দ্রুত সারে।'
    ],
    preventiveVaccineBn: 'লেয়ার ও সোনালী মুরগিতে ৫-৬ সপ্তাহে ডানার চামড়ায় সুই ফুটিয়ে পক্স ভ্যাকসিন দিন।'
  },
  {
    id: 'poultry_brooder_pneumonia',
    sector: 'poultry',
    species: ['broiler', 'sonali', 'layer', 'deshi', 'duck'],
    nameBn: 'ব্রুডার নিউমোনিয়া / ছত্রাকজনিত শ্বাসকষ্ট',
    nameEn: 'Brooder Pneumonia / Aspergillosis',
    aliasesBn: ['ব্রুডার নিউমোনিয়া', 'নিউমোনিয়া', 'ছত্রাক রোগ', 'হাঁ করে শ্বাস', 'হাঁপানি', 'aspergillosis'],
    causeBn: 'ছত্রাক বা ফাঙ্গাস (Aspergillus fumigatus) - পচা বা ভেজা লিটার থেকে',
    severity: 'moderate',
    isCriticalRequireVet: false,
    symptomsBn: [
      'বাচ্চা হাঁ করে দ্রুত দম নেওয়া কিন্তু কোনো ঘড়ঘড় শব্দ না থাকা',
      'তীব্র পানির পিপাসা ও চোখ ঘোলাটে/নীলাভ হয়ে যাওয়া',
      'খাবার না খাওয়া ও দ্রুত শুকিয়ে যাওয়া'
    ],
    descriptionBn: 'ভেজা, ছত্রাকযুক্ত কাঠের গুঁড়া বা দুর্গন্ধযুক্ত লিটারের ধুলিকণা থেকে ফুসফুসে ছত্রাক সংক্রমণ ঘটে। সাধারণ অ্যান্টিবায়োটিক এতে কাজ করে না।',
    medicines: [
      {
        genericName: 'কপার সালফেট / বিশুদ্ধ তুঁতে (Copper Sulphate)',
        brandNames: ['বিশুদ্ধ তুঁতে (ফার্মাসিউটিক্যাল গ্রেড)'],
        dosageBn: '১ গ্রাম তুঁতে প্রতি ৫ লিটার খাবার পানিতে',
        durationBn: 'টানা ৩ দিন (সকালে)',
        instructionBn: 'তামা বা ধাতব পাত্রে মেশানো যাবে না; প্লাস্টিকের পাত্রে মিশিয়ে খাওয়াতে হবে।'
      },
      {
        genericName: 'অ্যান্টিফাঙ্গাল ও লিভার টনিক',
        brandNames: ['Mycostatin Liquid', 'Fungisorb', 'Superliv'],
        dosageBn: '১ মিলি প্রতি ২ লিটার পানিতে',
        durationBn: 'টানা ৪ থেকে ৫ দিন',
        instructionBn: 'ছত্রাকের বিষক্রিয়া কমাতে সহায়ক।'
      }
    ],
    managementTipsBn: [
      'ভেজা ও ছত্রাক পড়া লিটার অবিলম্বে শেড থেকে ফেলে শুকনা নতুন তুঁষ বা কাঠের গুঁড়া দিন।',
      'ব্রুডারে ভেন্টিলেশন বাড়ান যাতে ভেতরে বাষ্প না জমে।'
    ]
  },
  {
    id: 'poultry_ascites',
    sector: 'poultry',
    species: ['broiler', 'sonali'],
    nameBn: 'অ্যাসাইটিস / পেটে জল জমা বা পেট ফোলা',
    nameEn: 'Ascites / Water Belly',
    aliasesBn: ['পেটে পানি', 'পেট ফোলা', 'পেটে জল', 'ড্রামের মতো পেট', 'ascites', 'water belly'],
    causeBn: 'অক্সিজেন স্বল্পতা, অতিরিক্ত দ্রুত বৃদ্ধি, ঠান্ডা ও হার্টের দুর্বলতা',
    severity: 'moderate',
    isCriticalRequireVet: false,
    symptomsBn: [
      'পেটের নিচের অংশ তরল জমে বেলুনের মতো ফুলে ভারী হয়ে যাওয়া',
      'পাখি হাঁটতে কষ্ট পেয়ে পেটের ওপর ভর দিয়ে বসে থাকা',
      'ঝুঁটি ও মুখ রক্তশূন্য ফ্যাকাসে বা কালচে রঙ হওয়া',
      'শ্বাস নিতে কষ্ট হওয়া'
    ],
    descriptionBn: 'দ্রুত বর্ধনশীল ব্রয়লারের হার্টের ওপর চাপ পড়লে লিভার থেকে রক্তরস চুইয়ে পেটে তরল জমে এই রোগ সৃষ্টি করে।',
    medicines: [
      {
        genericName: 'ডাইউরেটিক ও কিডনি ফ্লাশার (প্রস্রাববর্ধক তরল নিষ্কাশক)',
        brandNames: ['Renalin (রেনেটা)', 'Diurivet', 'Urocare'],
        dosageBn: '১ মিলি প্রতি ১ লিটার পানিতে',
        durationBn: 'টানা ৩ থেকে ৪ দিন',
        instructionBn: 'শরীরের বাড়তি জমে থাকা তরল প্রস্রাবের মাধ্যমে বের করে দিতে সাহায্য করে।'
      },
      {
        genericName: 'ভিটামিন সি + লিভার টনিক',
        brandNames: ['C-Vet', 'Livol Liquid'],
        dosageBn: '১ গ্রাম প্রতি ২ লিটার পানিতে',
        durationBn: 'টানা ৫ দিন',
        instructionBn: 'হার্ট ও রক্তনালীর চাপ কমাতে কার্যকর।'
      }
    ],
    managementTipsBn: [
      'শেডের ভেন্টিলেশন বাড়ান; শেডের ভেতর পর্যাপ্ত তাজা অক্সিজেন নিশ্চিত করুন।',
      'খাবারের শক্তি ও প্রোটিন কিছুটা কমিয়ে আলো বা ফিডিং নিয়ন্ত্রণ করুন।'
    ]
  },
  {
    id: 'poultry_duck_plague',
    sector: 'poultry',
    species: ['duck'],
    nameBn: 'হাঁসের প্লেগ / ডাক প্লেগ (Duck Viral Enteritis)',
    nameEn: 'Duck Plague / Duck Viral Enteritis',
    aliasesBn: ['হাঁসের প্লেগ', 'ডাক প্লেগ', 'duck plague', 'হাঁস মরা', 'হাঁসের চোখ লাল', 'আলো সইতে না পারা'],
    causeBn: 'হার্পিস ভাইরাস (Herpesvirus)',
    severity: 'critical',
    isCriticalRequireVet: true,
    symptomsBn: [
      'হাঁসের চোখ লাল হয়ে যাওয়া এবং আলোর দিকে তাকাতে না পারা (Photophobia)',
      'পানির মতো দুর্গন্ধযুক্ত পাতলা মল ও মলদ্বারে রক্ত দেখা যাওয়া',
      'ডানা ঝুলে পড়া ও ঘাড় বাঁকা হয়ে যাওয়া',
      'নাক-মুখ দিয়ে জলীয় পদার্থ বের হওয়া ও হঠাৎ ব্যাপক মৃত্যু'
    ],
    descriptionBn: 'হাঁসের সবচেয়ে সর্বনাশা ভাইরাসজনিত মহামারি। অবিলম্বে আইসোলেশন ও অভিজ্ঞ ডাক্তারের তত্ত্বাবধান জরুরি।',
    medicines: [
      {
        genericName: 'ইলেক্ট্রোলাইট ও সেকেন্ডারি ইনফেকশন নিয়ন্ত্রণ',
        brandNames: ['Electrolyte Vet', 'Renamox'],
        dosageBn: '১ গ্রাম প্রতি ২ লিটার পানিতে',
        durationBn: 'টানা ৫ দিন',
        instructionBn: 'শরীরের প্রতিরোধ বৃদ্ধি ও ডিহাইড্রেশন রোধে।'
      }
    ],
    managementTipsBn: [
      'আক্রান্ত হাঁসকে সাথে সাথে অন্য পুকুর বা জলাশয় থেকে তুলে শুকনো শুকনো জায়গায় আলাদা রাখুন।',
      'পুকুরে চুন ও পটাশ প্রয়োগ করে পানি জীবাণুমুক্ত করুন।'
    ],
    preventiveVaccineBn: 'ডাক প্লেগ ভ্যাকসিন সুস্থ হাঁসকে নিয়মিত প্রয়োগ করুন।'
  },

  // ==========================================
  // ২. পশু (CATTLE & LIVESTOCK) - গরু, মহিষ, বাছুর, ছাগল, ভেড়া
  // ==========================================
  {
    id: 'cattle_fmd',
    sector: 'cattle',
    species: ['dairy_cow', 'bull', 'calf', 'goat', 'sheep', 'buffalo'],
    nameBn: 'ক্ষুরারোগ বা বাথান রোগ (Foot and Mouth Disease - FMD)',
    nameEn: 'Foot and Mouth Disease (FMD)',
    aliasesBn: ['ক্ষুরারোগ', 'খুরা রোগ', 'বাথান', 'fmd', 'লালা ঝরা', 'পায়ের ক্ষুরে ঘা', 'মুখে ঘা', 'খোঁড়ানো'],
    causeBn: 'ভাইরাস (অ্যাপথোভাইরাস - Picornaviridae)',
    severity: 'critical',
    isCriticalRequireVet: true,
    symptomsBn: [
      'মুখ থেকে অনবরত দড়ির মতো ঘন আঠালো লালা ঝরা',
      'জিহ্বা, মাড়ি ও ঠোঁটের ভেতরে পানির ফোস্কা বা কাঁচা ঘা হওয়া',
      'পায়ের দুই ক্ষুরের মাঝখানে তীব্র ঘা হয়ে পোকা হওয়া ও খোঁড়ানো',
      '১০৪° থেকে ১০৬° ফারেনহাইট পর্যন্ত তীব্র জ্বর ও জাবর কাটা বন্ধ হওয়া',
      'গাভীর দুধের উৎপাদন হঠাৎ শূন্যের কোঠায় নেমে যাওয়া'
    ],
    descriptionBn: 'গবাদি পশুর এক নম্বর সংক্রামক ভাইরাস রোগ। ভাইরাস সরাসরি ধ্বংসের ওষুধ না থাকলেও সঠিক ক্ষত পরিচর্যা ও সেকেন্ডারি ইনফেকশন রোধে বাঁচানো সম্ভব।',
    medicines: [
      {
        genericName: 'ফিটকিরি ও পটাশ পানি (মুখ ও পায়ের ওয়াশ)',
        brandNames: ['পটাশিয়াম পারম্যাঙ্গানেট / ফিটকিরি ওয়াশ'],
        dosageBn: '১ চামচ ফিটকিরি ১ লিটার কুসুম গরম পানিতে মিশিয়ে মুখ দিনে ৩ বার ধোয়া',
        durationBn: 'ঘা শুকানো পর্যন্ত (টানা ৭ দিন)',
        instructionBn: 'পায়ের ঘা পটাশ পানি দিয়ে ধুয়ে নেগাসুন্ট (Negasunt) পাউডার বা অ্যান্টিসেপটিক স্প্রে লাগাতে হবে যাতে মাছি না বসে পোকা না পড়ে।'
      },
      {
        genericName: 'ব্যথানাশক ও জ্বরনাশক (NSAID)',
        brandNames: ['Ketovet (কিটোরোলাক)', 'Paravet (প্যারাসিটামল)', 'Melovet (মেলোক্সিকাম)'],
        dosageBn: 'শরীরের ওজন অনুযায়ী ডাক্তারের পরামর্শে ইনজেকশন বা বোলাস',
        durationBn: 'টানা ৩ দিন',
        instructionBn: 'পশু যাতে সহজে নরম খাবার খেতে পারে তার জন্য মুখের ব্যথা ও জ্বর কমাতে হবে।'
      },
      {
        genericName: 'ব্রড স্পেকট্রাম অ্যান্টিবায়োটিক (ডাক্তারের প্রেসক্রিপশনে)',
        brandNames: ['Ceftron Vet (সেফট্রায়াক্সন)', 'Amoxivet Inj'],
        dosageBn: 'ডাক্তারের নির্ধারিত মাত্রায় মাংসে ইনজেকশন',
        durationBn: 'টানা ৫ দিন',
        instructionBn: 'ফুসফুস ও পায়ের ক্ষতের সেকেন্ডারি ব্যাকটেরিয়া সংক্রমণ রোধে।'
      }
    ],
    managementTipsBn: [
      'পশুকে নরম জাউভাত, কুঁড়া, গুড়ের পানি ও নরম কচি ঘাস খেতে দিন; কোনো শক্ত খড় বা ভুসি দেবেন না।',
      'মেঝে সবসময় শুকনো ও পরিষ্কার রাখুন; গোবর জমতে দেবেন না।'
    ],
    preventiveVaccineBn: 'প্রতি ৬ মাস পরপর নিয়মিত FMD ট্রাইভ্যালেন্ট ভ্যাকসিন প্রয়োগ করুন।'
  },
  {
    id: 'cattle_lsd',
    sector: 'cattle',
    species: ['dairy_cow', 'bull', 'calf', 'buffalo'],
    nameBn: 'লাম্পি স্কিন ডিজিজ (Lumpy Skin Disease - LSD)',
    nameEn: 'Lumpy Skin Disease (LSD)',
    aliasesBn: ['লাম্পি', 'লাম্পি স্কিন', 'lsd', 'গায়ে গুটি', 'চামড়ায় চাকা', 'পা ফোলা', 'জ্বর'],
    causeBn: 'ভাইরাস (ক্যাপ্রিপক্স ভাইরাস - মশা ও মাছির মাধ্যমে ছড়ায়)',
    severity: 'critical',
    isCriticalRequireVet: true,
    symptomsBn: [
      'সারা শরীরের চামড়ায় ১ থেকে ৫ সেমি আকারের গোল গোল শক্ত চাকা বা গুটি ওঠা',
      'তীব্র জ্বর (১০৫°F পর্যন্ত) এবং পশু নিস্তেজ হয়ে খাওয়া বন্ধ করা',
      'পায়ের নিচের অংশ ফুলে হাতিপায়ের মতো মোটা হওয়া',
      'চোখ ও নাক দিয়ে জল পড়া এবং পরবর্তীতে গুটি ফেটে গভীর ঘা সৃষ্টি হওয়া'
    ],
    descriptionBn: 'গরুর একটি ভয়ঙ্কর মশাবাহী ভাইরাস রোগ। সময়মতো প্রাথমিক চিকিৎসা ও মশা নিয়ন্ত্রণ না করলে পশুর চামড়া স্থায়ীভাবে নষ্ট ও মৃত্যু হতে পারে।',
    medicines: [
      {
        genericName: 'জ্বর ও ব্যথানাশক (Paracetamol / Meloxicam)',
        brandNames: ['Fast Vet Bolus', 'Pyrovet', 'Melovet'],
        dosageBn: '১টি করে বোলাস সকালে ও রাতে (বড় গরুর জন্য)',
        durationBn: 'টানা ৩ থেকে ৫ দিন',
        instructionBn: 'জ্বর ও শরীরের তীব্র ব্যথা কমাতে হবে।'
      },
      {
        genericName: 'অ্যান্টিহিস্টামিনিন (চুলকানি ও প্রদাহ নাশক)',
        brandNames: ['Astavet Inj / Bolus (স্কয়ার)', 'Antihist Vet', 'Histavet'],
        dosageBn: 'ওজন অনুযায়ী সকালে ও সন্ধ্যায়',
        durationBn: 'টানা ৫ দিন',
        instructionBn: 'চামড়ার গুটি ও এলার্জি ফোলা কমাতে।'
      },
      {
        genericName: 'ক্ষতের যত্ন ও অ্যান্টিসেপটিক স্প্রে',
        brandNames: ['Povidone Iodine', 'Cetrimide Spray'],
        dosageBn: 'গুটি ফেটে ঘা হলে নিমপাতা সেদ্ধ পানি দিয়ে ধুয়ে স্প্রে করুন',
        durationBn: 'ঘা শুকানো পর্যন্ত',
        instructionBn: 'মাছি বসা ঠেকাতে ন্যাপথলিন বা তারপিন তেল দিয়ে শেড জীবাণুমুক্ত রাখুন।'
      }
    ],
    managementTipsBn: [
      'শেডে সার্বক্ষণিক মশারি টাঙান বা কয়েল/ধোঁয়া দিয়ে মশা-মাছি সম্পূর্ণ দূর করুন।',
      'আক্রান্ত গরুকে কোনো অবস্থাতেই পানিতে ভেজাবেন না।'
    ],
    preventiveVaccineBn: 'গোট পক্স (Goat Pox) ভ্যাকসিন দিয়ে আগে থেকেই LSD প্রতিরোধ করা যায়।'
  },
  {
    id: 'cattle_mastitis',
    sector: 'cattle',
    species: ['dairy_cow', 'buffalo', 'goat'],
    nameBn: 'ম্যাসটাইটিস / ওলান প্রদাহ বা ওলান ফোলা',
    nameEn: 'Bovine Mastitis',
    aliasesBn: ['ওলান ফোলা', 'ওলান প্রদাহ', 'ম্যাসটাইটিস', 'mastitis', 'দুধে রক্ত', 'দুধে পুঁজ', 'ছানা ছানা দুধ', 'বাট ফোলা'],
    causeBn: 'ব্যাকটেরিয়া (Staphylococcus aureus / Streptococcus) - নোংরা মেঝে থেকে',
    severity: 'moderate',
    isCriticalRequireVet: false,
    symptomsBn: [
      'ওলান অতিরিক্ত ফুলে শক্ত, লাল ও হাত দিলে খুব গরম লাগা',
      'দুধ দোয়ানোর সময় গাভী লাথি মারা ও বাট ছুঁতে না দেওয়া',
      'দুধে রক্তের ছোপ, পুঁজের মতো হলুদ গন্ধযুক্ত রস বা দইয়ের মতো ছানা আসা',
      'দুধের পরিমাণ হঠাৎ মারাত্মক কমে যাওয়া'
    ],
    descriptionBn: 'দুগ্ধবতী গাভীর প্রধান শত্রু। দ্রুত চিকিৎসা না নিলে আক্রান্ত বাট চিরতরে নষ্ট (কানা) হয়ে যায়।',
    medicines: [
      {
        genericName: 'ইন্ট্রাম্যামারি অ্যান্টিবায়োটিক টিউব (বাটের ভেতরে দেওয়ার ড্রপ)',
        brandNames: ['Ubrocel (বোয়েহরিঙ্গার)', 'Mastijet Forte', 'Cobactan LC'],
        dosageBn: 'আক্রান্ত বাটের সব দুধ সম্পূর্ণ নিংড়ে ফেলে ১টি টিউবের পুরো ওষুধ বাটের নালীতে ঢুকিয়ে আলতো ম্যাসাজ করতে হবে',
        durationBn: 'টানা ৩ দিন (প্রতিদিন ১ বার দুধ দোয়ানোর পর)',
        instructionBn: 'বাটের মুখ ব্যবহারের আগে অবশ্যই স্পিরিট বা জীবাণুনাশক দিয়ে মুছে নিতে হবে।'
      },
      {
        genericName: 'ব্যথানাশক ও ফোলা কমানোর ওষুধ',
        brandNames: ['Ketovet', 'Melovet Bolus'],
        dosageBn: '১টি বোলাস দিনে ২ বার',
        durationBn: '৩ দিন',
        instructionBn: 'ওলানের তীব্র ব্যথা ও ফোলা কমায়।'
      },
      {
        genericName: 'ইনজেকশন অ্যান্টিবায়োটিক (গুরুতর অবস্থায় ডাক্তারের প্রেসক্রিপশনে)',
        brandNames: ['Ceftriaxone / Amoxicillin Vet Inj'],
        dosageBn: 'ডাক্তারের পরামর্শমতো মাংসে প্রয়োগ',
        durationBn: 'টানা ৩-৫ দিন',
        instructionBn: 'সিস্টেমেটিক ইনফেকশন ছড়িয়ে পড়া ঠেকাতে।'
      }
    ],
    managementTipsBn: [
      'দুধ দোয়ানোর পর পশুকে কমপক্ষে আধা ঘণ্টা দাঁড়িয়ে রাখুন (ঘাস খেতে দিন), যাতে বাটের মুখ বন্ধ হওয়ার সময় পায়।',
      'মেঝেতে সবসময় ব্লিচিং বা চুন ছড়িয়ে শুকনো রাখুন।'
    ]
  },
  {
    id: 'cattle_bloat',
    sector: 'cattle',
    species: ['dairy_cow', 'bull', 'calf', 'goat', 'sheep', 'buffalo'],
    nameBn: 'টিম্প্যানি বা পেট ফাঁপা (Bloat / Tympany)',
    nameEn: 'Ruminal Tympany / Bloat',
    aliasesBn: ['পেট ফাঁপা', 'পেট ফোলা', 'গ্যাস হওয়া', 'পেটে বায়ু', 'bloat', 'tympany', 'পেটের বাম পাশ ফোলা'],
    causeBn: 'অতিরিক্ত কাঁচা নরম ঘাস, পচা খড়, বা দানাদার খাবার দ্রুত খাওয়া',
    severity: 'critical',
    isCriticalRequireVet: false,
    symptomsBn: [
      'পেটের বাম পাশ ড্রামের মতো মারাত্মক ফুলে ওঠা এবং টোকা দিলে ফাঁপা ঢোলের আওয়াজ হওয়া',
      'পশুর প্রচণ্ড অস্থিরতা, বারবার পেটের দিকে তাকানো ও লাথি মারা',
      'জিহ্বা বের করে হাঁসফাঁস করে কষ্টসহকারে শ্বাস নেওয়া',
      'বসে পড়া ও চোখ ঠিকরে বের হয়ে আসা (জরুরি চিকিৎসা না পেলে দম বন্ধ হয়ে মৃত্যু)'
    ],
    descriptionBn: 'রুমেmen-এ অতিরিক্ত গ্যাস জমে ডায়াফ্রামে চাপ সৃষ্টি করে হার্ট ও ফুসফুসের কাজ বন্ধ করে দেয়। এটি একটি প্রাণঘাতী ইমার্জেন্সি অবস্থা।',
    medicines: [
      {
        genericName: 'সিমেথিকন / ডাইমেথিকন (অ্যান্টি-ব্লট কার্মিনেটিভ তরল)',
        brandNames: ['D-Bloat (রেনেটা)', 'Tympanil (স্কয়ার)', 'Nogast Vet'],
        dosageBn: 'বড় পশুর জন্য ১০০ মিলি বোতল একবারে সরাসরি মুখে খাওয়াতে হবে (বাছুরের জন্য ২৫-৫০ মিলি)',
        durationBn: 'একক ডোজ; প্রয়োজন হলে ৪ ঘণ্টা পর পুনরাবৃত্তি',
        instructionBn: 'গ্যাস ফেনাকে তরলে রূপান্তর করে দ্রুত পায়ুপথ ও ঢেঁকুর দিয়ে গ্যাস বের করে দেয়।'
      },
      {
        genericName: 'সরিষার তেল + আদা ও খাওয়ার সোডা (ঘরোয়া তাৎক্ষণিক সমাধান)',
        brandNames: ['ঘরোয়া সমাধান'],
        dosageBn: '২৫০ মিলি খাঁটি সরিষার তেলে ৫০ গ্রাম খাওয়ার সোডা ও আদা বাটা মিশিয়ে মুখে খাওয়ালে দ্রুত গ্যাস নামে',
        durationBn: 'তাৎক্ষণিক ইমার্জেন্সিতে',
        instructionBn: 'ওষুধ হাতের কাছে না থাকলে অবিলম্বে এই পদ্ধতি প্রয়োগ করতে হবে।'
      }
    ],
    managementTipsBn: [
      'পশুর মুখে একটি নরম দড়ি বা কাঠের টুকরা আড়াআড়ি বেঁধে দিন যাতে সে চিবিয়ে চিবিয়ে ঢেঁকুর তোলে।',
      'সামনের পা দুটি উঁচু স্থানে রাখুন যাতে ফুসফুসের ওপর চাপ কম পড়ে।'
    ]
  },
  {
    id: 'cattle_anthrax',
    sector: 'cattle',
    species: ['dairy_cow', 'bull', 'goat', 'sheep', 'buffalo'],
    nameBn: 'তড়কা রোগ / অ্যানথ্রাক্স (Anthrax) - অত্যন্ত ঝুঁকিপূর্ণ!',
    nameEn: 'Anthrax',
    aliasesBn: ['তড়কা', 'অ্যানথ্রাক্স', 'anthrax', 'কালো রক্ত পড়া', 'হঠাৎ মৃত্যু', 'জমাট না বাঁধা রক্ত'],
    causeBn: 'ব্যাকটেরিয়া (Bacillus anthracis) - মাটিতে দীর্ঘদিন বেঁচে থাকা স্পোর',
    severity: 'critical',
    isCriticalRequireVet: true,
    symptomsBn: [
      'মৃত বা আক্রান্ত পশুর নাক, মুখ ও পায়ুপথ দিয়ে আলকাতরার মতো কালো রক্ত বের হওয়া যা কখনো জমাট বাঁধে না',
      'তীব্র জ্বর (১০৭°F পর্যন্ত) হয়ে মাত্র কয়েক ঘণ্টার মধ্যে খিঁচুনি দিয়ে মারা যাওয়া',
      'মৃত্যুর পর শরীর অস্বাভাবিক দ্রুত ফুলে ওঠে এবং শক্ত হয় না (Rigor mortis হয় না)'
    ],
    descriptionBn: '⚠️ এটি মানুষে সংক্রামক (Zoonotic) মারাত্মক জাতীয় দুর্যোগপূর্ণ ব্যাধি! আক্রান্ত পশুর মাংস কাটাছেঁড়া বা খাওয়া আইনত নিষিদ্ধ এবং মৃত্যুঝুঁকি তৈরি করে।',
    medicines: [
      {
        genericName: 'পেনিসিলিন জি মেগা ডোজ (ডাক্তারের জরুরি হস্তক্ষেপ)',
        brandNames: ['Pronapen Inj', 'Penivet Inj'],
        dosageBn: 'রোগের প্রাথমিক অবস্থায় কেবলমাত্র রেজিস্টার্ড ডাক্তারের মাধ্যমে মাংসে ইনজেকশন',
        durationBn: 'ডাক্তারের সিদ্ধান্ত অনুযায়ী',
        instructionBn: 'দেরি হলে কোনো চিকিৎসাতেই পশু বাঁচে না।'
      }
    ],
    managementTipsBn: [
      '⚠️ কোনো অবস্থাতেই মরা পশু কাটাছেঁড়া বা চামড়া ছিলবেন না! স্পোর বাতাসে ছড়িয়ে সারা এলাকা দূষিত করবে।',
      'মরা পশুর গায়ে ৬ ফুট গভীর গর্ত করে প্রচুর চুন ও ব্লিচিং পাউডার দিয়ে মাটির নিচে পুঁতে ফেলুন।',
      'তাৎক্ষণিকভাবে উপজেলা প্রাণিসম্পদ কর্মকর্তাকে (ইউএলও) অবগত করুন।'
    ],
    preventiveVaccineBn: 'প্রতি বছর বর্ষার আগে সরকারি অ্যানথ্রাক্স স্পোর ভ্যাকসিন প্রয়োগ নিশ্চিত করুন।'
  },
  {
    id: 'cattle_calf_scour',
    sector: 'cattle',
    species: ['calf'],
    nameBn: 'বাছুরের পাতলা পায়খানা / কাফ স্কাউর (Calf Scour)',
    nameEn: 'Calf Scour / Diarrhea',
    aliasesBn: ['বাছুরের ডায়রিয়া', 'বাছুরের পায়খানা', 'সাদা পায়খানা', 'কাফ স্কাউর', 'calf scour'],
    causeBn: 'ই-কোলাই ব্যাকটেরিয়া, রোটাভাইরাস ও দুধের হজমজনিত গোলযোগ',
    severity: 'moderate',
    isCriticalRequireVet: false,
    symptomsBn: [
      'বাছুরের হলুদ বা সাদা দুর্গন্ধযুক্ত পাতলা জলীয় পায়খানা',
      'চোখ কোটরে ঢুকে যাওয়া ও চামড়া টেনে ধরলে আগের জায়গায় ফিরে না যাওয়া (তীব্র ডিহাইড্রেশন)',
      'দুধ খাওয়া বন্ধ করে মাথা গুঁজে শুয়ে থাকা'
    ],
    descriptionBn: 'নবজাতক বাছুরের প্রধান ঘাতক রোগ। সঠিক সময়ে স্যালাইন ও ওষুধ না দিলে পানিশূন্যতায় বাছুর মারা যায়।',
    medicines: [
      {
        genericName: 'ওরাল স্যালাইন ও ইলেক্ট্রোলাইট (জীবন রক্ষাকারী)',
        brandNames: ['Oral Saline (SMC)', 'Glucolyte Vet'],
        dosageBn: 'প্রতি ১ লিটার কুসুম গরম পানিতে ১ প্যাকেট স্যালাইন গুলে দিনে ৪-৫ বার অল্প অল্প করে পান করাতে হবে',
        durationBn: 'টানা ৩ দিন',
        instructionBn: 'দুধ দেওয়া সাময়িক কমিয়ে দিয়ে পর্যাপ্ত স্যালাইন দেওয়া সবচেয়ে জরুরি।'
      },
      {
        genericName: 'সালফা মেথোক্সাজোল + ট্রাইমিথোপ্রিম',
        brandNames: ['Cotrim Bolus (স্কয়ার)', 'Sultrim Vet'],
        dosageBn: 'অর্ধেক (১/২) বোলাস গুঁড়া করে পানির সাথে দিনে ২ বার',
        durationBn: 'টানা ৩ দিন',
        instructionBn: 'অন্ত্রের ব্যাকটেরিয়া সংক্রমণ দমন করতে।'
      }
    ],
    managementTipsBn: [
      'বাছুরকে জন্মের ২ ঘণ্টার মধ্যে শালদুধ (Colostrum) অবশ্যই পর্যাপ্ত পরিমাণে খাওয়ান।',
      'বাছুরের থাকার জায়গা শুষ্ক, গরম ও খড় বিছিয়ে আরামদায়ক রাখুন।'
    ]
  },
  {
    id: 'cattle_ppr',
    sector: 'cattle',
    species: ['goat', 'sheep'],
    nameBn: 'ছাগলের পিপিআর রোগ (PPR - Goat Plague)',
    nameEn: 'Peste des Petits Ruminants (PPR)',
    aliasesBn: ['পিপিআর', 'ছাগলের প্লেগ', 'ppr', 'ছাগলের মুখে ঘা', 'ছাগলের পাতলা পায়খানা', 'চোখ দিয়ে পুঁজ'],
    causeBn: 'ভাইরাস (মরবিলিভাইরাস - Morbillivirus)',
    severity: 'critical',
    isCriticalRequireVet: true,
    symptomsBn: [
      'তীব্র জ্বর (১০৫° থেকে ১০৭° ফারেনহাইট) ও শরীর কাঁপানো',
      'মুখে, জিহ্বায় ও মাড়িতে কাঁচা ঘা হওয়া এবং মুখ দিয়ে দুর্গন্ধময় ফেনা ঝরা',
      'চোখ ও নাক দিয়ে প্রথমে পানি এবং পরে পুঁজ বের হয়ে চোখ জুড়ে যাওয়া',
      'কালো বা কালচে সবুজ তীব্র দুর্গন্ধযুক্ত ডায়রিয়া ও নিউমোনিয়ার মতো কাশি'
    ],
    descriptionBn: 'ছাগল ও ভেড়ার সবচেয়ে প্রাণঘাতী মহামারি ভাইরাস। দ্রুত আইসোলেশন ও নিবিড় চিকিৎসা ছাড়া মৃত্যুহার ৯০% পর্যন্ত পৌঁছায়।',
    medicines: [
      {
        genericName: 'মুখের ঘা পরিষ্কার ও গ্লিসারিন প্রলেপ',
        brandNames: ['Boric Acid powder + Glycerin / Povidone Iodine'],
        dosageBn: 'বোরেক্স গ্লিসারিন দিয়ে দিনে ৩ বার মুখের ঘা আলতো করে মুছে পরিষ্কার করতে হবে',
        durationBn: 'ঘা না শুকানো পর্যন্ত',
        instructionBn: 'ছাগল যাতে তরল জাউ বা ঘাসের রস খেতে পারে।'
      },
      {
        genericName: 'সেকেন্ডারি নিউমোনিয়া রোধে সেফটিয়োফার বা অক্সিটেট্রাসাইক্লিন',
        brandNames: ['Ceftiofur Inj', 'Renamycin 100 Inj'],
        dosageBn: 'ডাক্তারের নির্দেশনামতো মাংসে ইনজেকশন',
        durationBn: 'টানা ৫ দিন',
        instructionBn: 'ভাইরাস ধ্বংস না হলেও ফুসফুসের ব্যাকটেরিয়া সংক্রমণ রোধে।'
      }
    ],
    managementTipsBn: [
      'আক্রান্ত ছাগলকে সাথে সাথে সুস্থ ছাগলের পাল থেকে বহু দূরে আলাদা ঘরে রাখুন।',
      'ঘরের ঠান্ডা বাতাস ও কুয়াশা প্রতিরোধ করতে চটের বস্তা দিয়ে উষ্ণ পরিবেশ তৈরি করুন।'
    ],
    preventiveVaccineBn: 'বাচ্চার বয়স ৩ মাস হলে একবার পিপিআর ভ্যাকসিন দিলে ৩ বছর পর্যন্ত নিরাপত্তা পাওয়া যায়।'
  },

  // ==========================================
  // ৩. মাছ (FISH & AQUACULTURE) - কার্প, পাঙ্গাশ, তেলাপিয়া, শিং-মাগুর
  // ==========================================
  {
    id: 'fish_eus',
    sector: 'fish',
    species: ['carp', 'tilapia', 'pangasius', 'catfish', 'fingerlings'],
    nameBn: 'ক্ষতরোগ বা মাছের ঘা (Epizootic Ulcerative Syndrome - EUS)',
    nameEn: 'Epizootic Ulcerative Syndrome (EUS)',
    aliasesBn: ['ক্ষতরোগ', 'মাছের ঘা', 'লাল দাগ', 'eus', 'আঁইশ খসা', 'লেজে ঘা', 'মাছের গায়ে ক্ষত'],
    causeBn: 'ছত্রাক (Aphanomyces invadans) ও ব্যাকটেরিয়ার যৌথ আক্রমণ (শীতকালে বেশি হয়)',
    severity: 'moderate',
    isCriticalRequireVet: false,
    symptomsBn: [
      'মাছের গায়ে বা লেজের গোড়ায় ছোট লাল ফোটা বা দাগ দেখা দেওয়া',
      'পরবর্তীতে চামড়া খসে গভীর ক্ষত বা গর্তের সৃষ্টি হওয়া',
      'ক্ষতের চারপাশের মাংস পচে দুর্গন্ধ বের হওয়া',
      'মাছ দুর্বল হয়ে পানির কিনারে বা ওপরে ভেসে অস্বাভাবিক সাঁতার কাটা'
    ],
    descriptionBn: 'শীতের শুরুতে পানির তাপমাত্রা কমে গেলে ও তলদেশে বিষাক্ত গ্যাস জমলে কার্প ও দেশি মাছে এই ঘা মহামারি রূপ নেয়।',
    medicines: [
      {
        genericName: 'পুকুরে চুন ও লবণের যৌথ প্রয়োগ (পানির চিকিৎসায়)',
        brandNames: ['কৃষি চুন (Calcium Carbonate) + আয়োডিনমুক্ত মোটা লবণ'],
        dosageBn: 'প্রতি শতাংশে ১ কেজি চুন ও ১ কেজি লবণ',
        durationBn: 'শীতের শুরুতে এবং ঘা দেখা দিলে ৩ দিন পর পুনরায় অর্ধেক মাত্রায়',
        instructionBn: 'চুন আগে মাটির পাত্রে ভিজিয়ে ঠান্ডা করে পুরো পুকুরে ছিটিয়ে দিতে হবে; লবণ পানিতে গুলে সমানভাবে ছিটাতে হবে।'
      },
      {
        genericName: 'জীবাণুনাশক ওয়াশ (পটাশিয়াম পারম্যাঙ্গানেট / টিমসেন)',
        brandNames: ['Timsen (রেনেটা)', 'Polydine (স্কয়ার)', 'Fish-Heal'],
        dosageBn: 'টিমসেন প্রতি শতাংশে ১ থেকে ২ গ্রাম অথবা পটাশ ৫ গ্রাম',
        durationBn: '৩ দিন ব্যবধানে ২ বার',
        instructionBn: 'পুকুরের সব ধরণের ক্ষতিকর ব্যাকটেরিয়া ও ফাঙ্গাস ধ্বংস করতে অত্যন্ত সফল।'
      },
      {
        genericName: 'খাবারের সাথে অ্যান্টিবায়োটিক (রেনামাইসিন / অক্সিটেট্রাসাইক্লিন)',
        brandNames: ['Renamycin Vet Powder', 'Oxysent 20%'],
        dosageBn: 'প্রতি কেজি খাবারে ৩ থেকে ৫ গ্রাম পাউডার চিটাগুড় বা তেল দিয়ে মাখিয়ে খাওয়াতে হবে',
        durationBn: 'টানা ৫ থেকে ৭ দিন',
        instructionBn: 'দেহের অভ্যন্তরীণ ক্ষত দ্রুত শুকিয়ে মাছকে সুস্থ করে তোলে।'
      }
    ],
    managementTipsBn: [
      'পুকুরের তলার পচা কাদা সরিয়ে ফেলুন বা হররা টেনে বিষাক্ত গ্যাস বের করে দিন।',
      'আক্রান্ত সময়ে পুকুরে জাল টানা সম্পূর্ণরূপে বন্ধ রাখুন, কারণ জাল টানলে মাছের গায়ে আরও আঘাত লাগে।'
    ]
  },
  {
    id: 'fish_tail_fin_rot',
    sector: 'fish',
    species: ['carp', 'tilapia', 'pangasius', 'catfish'],
    nameBn: 'লেজ ও পাখনা পচা রোগ (Tail and Fin Rot)',
    nameEn: 'Tail and Fin Rot Disease',
    aliasesBn: ['পাখনা পচা', 'লেজ পচা', 'পাখনা ক্ষয়ে যাওয়া', 'fin rot', 'tail rot', 'লেজ ফাটা'],
    causeBn: 'ব্যাকটেরিয়া (Aeromonas / Pseudomonas)',
    severity: 'mild',
    isCriticalRequireVet: false,
    symptomsBn: [
      'পাখনা ও লেজের কিনারায় সাদা সাদা রেখা দেখা দেওয়া ও পরে তা পচে ক্ষয়ে যাওয়া',
      'পাখনার পর্দা ফেটে গিয়ে কেবল মাছের কাটার মতো অংশগুলো অবশিষ্ট থাকা',
      'লেজের গোড়ায় লাল রক্তক্ষরণ দেখা দেওয়া ও সাঁতারের গতি ধীর হওয়া'
    ],
    descriptionBn: 'পুকুরের পানি দূষিত হলে ও মাত্রাতিরিক্ত জৈব পদার্থ জমলে এই ব্যাকটেরিয়া মাছের লেজ ও পাখনা ধ্বংস করে।',
    medicines: [
      {
        genericName: 'অ্যাকোয়া ডিজইনফেকট্যান্ট ও ব্লু ওয়াশ',
        brandNames: ['Methylene Blue', 'Timsen', 'Aqua-Clean'],
        dosageBn: 'টিমসেন ১ গ্রাম প্রতি শতাংশে ৩ ফুট পানিতে',
        durationBn: 'একক প্রয়োগ, প্রয়োজনে ৩ দিন পর আরেকবার',
        instructionBn: 'পানির ক্ষতিকর জীবাণু দূর করে পাখনার পচন থামায়।'
      },
      {
        genericName: 'ফিড অ্যান্টিবায়োটিক মিক্স',
        brandNames: ['Ciprocin Fish Grade', 'Enrofloxacin Powder'],
        dosageBn: '২ থেকে ৩ গ্রাম প্রতি কেজি সম্পূরক খাদ্যে',
        durationBn: 'টানা ৫ দিন',
        instructionBn: 'মাছের শরীরের ব্যাকটেরিয়াল ইনফেকশন থামিয়ে নতুন পাখনা গজাতে সাহায্য করে।'
      }
    ],
    managementTipsBn: [
      'পুকুরে এক-তৃতীয়াংশ পুরাতন নোংরা পানি বের করে দিয়ে গভীর নলকূপের ফ্রেশ পানি প্রবেশ করান।'
    ]
  },
  {
    id: 'fish_gill_rot',
    sector: 'fish',
    species: ['carp', 'tilapia', 'catfish'],
    nameBn: 'ফুলকা পচা রোগ / ফুলকা রোগ (Gill Rot)',
    nameEn: 'Gill Rot / Branchiomycosis',
    aliasesBn: ['ফুলকা পচা', 'ফুলকা রোগ', 'gill rot', 'ফুলকা ফ্যাকাসে', 'পানির ওপরে খাবি'],
    causeBn: 'ছত্রাক ও ব্যাকটেরিয়া (Branchiomyces sanguinis)',
    severity: 'moderate',
    isCriticalRequireVet: false,
    symptomsBn: [
      'ফুলকার লাল রঙ নষ্ট হয়ে সাদাটে বা ধূসর ছোপ ছোপ পচা দাগ হওয়া',
      'ফুলকার অংশ পচে খসে পড়া ও রক্তহীন ফ্যাকাসে দেখানো',
      'মাছ শ্বাসকষ্টে পানির উপরিভাগে এসে বারবার খাবি খাওয়া'
    ],
    descriptionBn: 'পুকুরে অতিরিক্ত খাবার পচে অ্যামোনিয়া গ্যাস বাড়লে ফুলকায় এই সংক্রমণ হয়, যার ফলে মাছ অক্সিজেন নিতে পারে না।',
    medicines: [
      {
        genericName: 'কপার সালফেট বা তুঁতে দ্রবণ',
        brandNames: ['তুঁতে (Copper Sulphate)'],
        dosageBn: 'প্রতি শতাংশে ১৫০ থেকে ২০০ গ্রাম তুঁতে মাটির পাত্রে গুলিয়ে পুরো পুকুরে ছিটাতে হবে',
        durationBn: 'একক প্রয়োগ (সকালে রোদ উঠলে)',
        instructionBn: 'ফুলকার ছত্রাক ও প্যারাসাইট দূর করতে দ্রুত কাজ করে।'
      },
      {
        genericName: 'চুন ও জিওলাইট প্রয়োগ',
        brandNames: ['Aqua-Zeolite', 'Gasonil'],
        dosageBn: 'প্রতি শতাংশে ২৫০ গ্রাম জিওলাইট ও ৫০০ গ্রাম চুন',
        durationBn: 'একক প্রয়োগ',
        instructionBn: 'পানির অ্যামোনিয়া ও বিষাক্ত গ্যাস শোষণ করে ফুলকাকে রক্ষা করে।'
      }
    ],
    managementTipsBn: [
      'তাৎক্ষণিকভাবে অতিরিক্ত খাবার দেওয়া বন্ধ করুন। পুকুরে পাম্প বা সাঁতার কেটে পানি আলোড়িত করুন।'
    ]
  },
  {
    id: 'fish_lice',
    sector: 'fish',
    species: ['carp', 'catfish'],
    nameBn: 'মাছের উকুন বা আর্গুলোসিস (Fish Lice / Argulus)',
    nameEn: 'Argulosis / Fish Lice',
    aliasesBn: ['উকুন', 'মাছের উকুন', 'আর্গুলুস', 'argulus', 'মাছের পোকা', 'বাঁশে গা ঘষা', 'চামড়ায় ক্ষত'],
    causeBn: 'বহিঃপরজীবী বা উকুন (Argulus foliaceus)',
    severity: 'mild',
    isCriticalRequireVet: false,
    symptomsBn: [
      'মাছের গায়ে, পাখনায় ও পেটের কাছে চ্যাপ্টা গোল আকৃতির পোকা বা উকুন কামড়ে থাকতে দেখা যাওয়া',
      'মাছ চুলকানি ও অস্বস্তিতে পানির বাঁশ, খুঁটি বা পাড়ে গা ঘষাঘষি করা',
      'উকুনের কামড়ে ক্ষত তৈরি হয়ে সেকেন্ডারি লাল ঘা হওয়া ও মাছ দ্রুত শুকিয়ে যাওয়া'
    ],
    descriptionBn: 'রুই ও কাতলা মাছের অতি পরিচিত রক্তচোষা পরজীবী উকুন। সময়মতো না তাড়াতে পারলে মাছের বৃদ্ধি বন্ধ হয়ে মারাত্মক ঘা হয়ে যায়।',
    medicines: [
      {
        genericName: 'আইভারমেকটিন বা ডেল্টামেথ্রিন অ্যাকোয়া সলিউশন',
        brandNames: ['Arguless (স্কয়ার)', 'Deltavet Aqua', 'Ectofix', 'Ivervet'],
        dosageBn: '১ মিলি প্রতি শতাংশে ৩ ফুট গভীরতায় পানিতে সমানভাবে স্প্রে করতে হবে',
        durationBn: 'প্রথম প্রয়োগের ৭-১০ দিন পর আরেকবার বুস্টার ডোজ দিতে হবে (উকুনের ডিম ফুটে নতুন উকুন বের হলে মারার জন্য)',
        instructionBn: 'সকালে রোদ ওঠার পর পুকুরে স্প্রে করতে হবে।'
      }
    ],
    managementTipsBn: [
      'পুকুরের পানিতে পুঁতে রাখা পুরোনো বাঁশ বা খুঁটি তুলে কড়া রোদে শুকিয়ে চুন মেখে দিন, কারণ উকুন বাঁশের খাঁজে ডিম পাড়ে।'
    ]
  },
  {
    id: 'fish_oxygen_depletion',
    sector: 'fish',
    species: ['carp', 'tilapia', 'pangasius', 'catfish', 'fingerlings'],
    nameBn: 'অক্সিজেন স্বল্পতা ও মাছের খাবি খাওয়া (Oxygen Depletion)',
    nameEn: 'Oxygen Depletion / Asphyxiation',
    aliasesBn: ['খাবি খাওয়া', 'অক্সিজেন সংকট', 'মাছ ভাসা', 'অক্সিজেন অভাব', 'oxygen', 'ভোরে মাছ ভাসা'],
    causeBn: 'মেঘলা আবহাওয়া, অতিরিক্ত মাছের ঘনত্ব, শেওলা পচন ও রাতের বেলা ফাইটোপ্ল্যাঙ্কটনের শ্বাসকার্য',
    severity: 'critical',
    isCriticalRequireVet: false,
    symptomsBn: [
      'শেষ রাতের দিকে বা ভোরে সব মাছ পানির উপরিভাগে এসে হাঁ করে শ্বাস নেওয়া (খাবি খাওয়া)',
      'মানুষের উপস্থিতি টের পেলেও মাছ পানিতে ডুব না দেওয়া',
      'বড় ও ওজনের মাছগুলো শ্বাসকষ্টে সবার আগে পেট উল্টে মরে ভেসে ওঠা'
    ],
    descriptionBn: 'মাছ চাষের সবচেয়ে আকস্মিক ঘাতক দুর্যোগ। জরুরি ব্যবস্থা না নিলে কয়েক ঘণ্টার মধ্যে পুকুরের লাখ টাকার বড় মাছ মরে ভেসে উঠতে পারে।',
    medicines: [
      {
        genericName: 'জরুরি অক্সিজেন ট্যাবলেট / পাউডার (Sodium Percarbonate)',
        brandNames: ['Oxyflow (স্কয়ার)', 'Oxymax (রেনেটা)', 'Oxylife (একমি)', 'Bioxy'],
        dosageBn: 'প্রতি শতাংশে ৩ থেকে ৫টি ট্যাবলেট সরাসরি পানিতে ছুড়ে মারুন অথবা ২৫০ গ্রাম পাউডার',
        durationBn: 'তাৎক্ষণিক ইমার্জেন্সিতে',
        instructionBn: 'পানিতে পড়ার সাথে সাথেই প্রচুর বিশুদ্ধ দ্রবীভূত অক্সিজেন ছাড়ে এবং মাছ রক্ষা পায়।'
      }
    ],
    managementTipsBn: [
      'দ্রুত স্যালোমেশিন বা পাম্প দিয়ে ফোয়ারার মতো পানি ছিটিয়ে পুকুরে দিন।',
      'কয়েকজন মিলে পুকুরে নেমে জোরে সাঁতার কেটে পানি নাড়াচাড়া করুন।'
    ]
  }
];

export const SPECIES_BY_SECTOR: Record<AnimalSector, { id: string; nameBn: string; nameEn: string; icon: string }[]> = {
  poultry: [
    { id: 'all', nameBn: 'সকল পাখি', nameEn: 'All Poultry', icon: '🐔' },
    { id: 'broiler', nameBn: 'ব্রয়লার মুরগি', nameEn: 'Broiler', icon: '🍗' },
    { id: 'sonali', nameBn: 'সোনালী মুরগি', nameEn: 'Sonali', icon: '🐓' },
    { id: 'layer', nameBn: 'লেয়ার (ডিম)', nameEn: 'Layer', icon: '🥚' },
    { id: 'deshi', nameBn: 'দেশি মুরগি', nameEn: 'Deshi', icon: '🐥' },
    { id: 'duck', nameBn: 'হাঁস', nameEn: 'Duck', icon: '🦆' },
    { id: 'quail', nameBn: 'কোয়েল', nameEn: 'Quail', icon: '🐦' },
    { id: 'pigeon', nameBn: 'কবুতর', nameEn: 'Pigeon', icon: '🕊️' }
  ],
  cattle: [
    { id: 'all', nameBn: 'সকল গবাদি পশু', nameEn: 'All Cattle', icon: '🐄' },
    { id: 'dairy_cow', nameBn: 'দুধের গাভী', nameEn: 'Dairy Cow', icon: '🥛' },
    { id: 'bull', nameBn: 'ষাঁড় / মোটাতাজাকরণ', nameEn: 'Beef Bull', icon: '🐂' },
    { id: 'calf', nameBn: 'বাছুর', nameEn: 'Calf', icon: '🐮' },
    { id: 'goat', nameBn: 'ছাগল', nameEn: 'Goat', icon: '🐐' },
    { id: 'sheep', nameBn: 'ভেড়া', nameEn: 'Sheep', icon: '🐑' },
    { id: 'buffalo', nameBn: 'মহিষ', nameEn: 'Buffalo', icon: '🐃' }
  ],
  fish: [
    { id: 'all', nameBn: 'সকল মাছ', nameEn: 'All Fish', icon: '🐟' },
    { id: 'carp', nameBn: 'রুই / কাতলা / কার্প', nameEn: 'Carp / Rui / Catla', icon: '🐠' },
    { id: 'tilapia', nameBn: 'তেলাপিয়া', nameEn: 'Tilapia', icon: '🐟' },
    { id: 'pangasius', nameBn: 'পাঙ্গাশ', nameEn: 'Pangasius', icon: '🐡' },
    { id: 'catfish', nameBn: 'শিং / মাগুর', nameEn: 'Catfish / Shing', icon: '🦈' },
    { id: 'fingerlings', nameBn: 'মাছের পোনা ও নার্সারি', nameEn: 'Fingerlings', icon: '🌊' }
  ]
};

/**
 * Intelligent search function:
 * Searches query across nameBn, nameEn, aliases, symptoms, and description.
 * Filters by sector and species if specified.
 */
export function searchVeterinaryDiseases(
  query: string,
  sector?: AnimalSector,
  speciesId?: string
): DiseaseRecord[] {
  const cleanQ = query.trim().toLowerCase();

  return VETERINARY_DISEASE_DB.filter(record => {
    // 1. Sector match
    if (sector && record.sector !== sector) {
      return false;
    }

    // 2. Species match (if not 'all')
    if (speciesId && speciesId !== 'all') {
      if (!record.species.includes(speciesId)) {
        return false;
      }
    }

    // 3. Search query match
    if (!cleanQ) return true;

    const matchesName = record.nameBn.toLowerCase().includes(cleanQ) || 
                        record.nameEn.toLowerCase().includes(cleanQ);

    const matchesAliases = record.aliasesBn.some(a => 
      a.toLowerCase().includes(cleanQ) || cleanQ.includes(a.toLowerCase())
    );

    const matchesSymptoms = record.symptomsBn.some(s => 
      s.toLowerCase().includes(cleanQ)
    );

    const matchesCause = record.causeBn.toLowerCase().includes(cleanQ);
    const matchesDesc = record.descriptionBn.toLowerCase().includes(cleanQ);

    return matchesName || matchesAliases || matchesSymptoms || matchesCause || matchesDesc;
  });
}
