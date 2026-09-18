// Commercial Aquaculture (Fish Farming) Feeding & Water Quality Standards for Bangladesh
// Grounded in Department of Fisheries (DoF) Bangladesh & BFRI Standards

export interface FishFeedingPhase {
  stageId: string;
  titleBn: string;
  titleEn: string;
  ageDaysRangeBn: string;
  targetWeightGm: number;
  feedRatePctBiomass: number; // শতাংশ হারে খাদ্য (মাছের মোট ওজনের %)
  proteinRequirementPct: number; // খাদ্যে অপরিশোধিত প্রোটিন (%)
  pelletSizeMm: string;
  feedFrequencyDaily: number; // দিনে কতবার খাবার দিতে হবে
  waterParamsBn: string[];
  keyTasksBn: string[];
}

export const FISH_FEEDING_SCHEDULE: FishFeedingPhase[] = [
  {
    stageId: 'fingerling_nursery',
    titleBn: 'পোনা লালন-পালন পর্যায় (Nursery / Fingerling)',
    titleEn: 'Fingerling / Nursery Phase (1-30 Days)',
    ageDaysRangeBn: '১ থেকে ৩০ দিন',
    targetWeightGm: 25,
    feedRatePctBiomass: 6.0, // ৬% খাদ্য
    proteinRequirementPct: 32,
    pelletSizeMm: '০.৫ - ১.০ মিমি (মাইক্রো ফ্লোটিং/পাউডার)',
    feedFrequencyDaily: 3,
    waterParamsBn: [
      'দ্রবীভূত অক্সিজেন (DO): ৫.০ - ৭.০ ppm',
      'পানির পিএইচ (pH): ৭.৫ - ৮.৫',
      'অ্যামোনিয়া (Ammonia): ০.০২ ppm-এর নিচে',
      'পানির স্বচ্ছতা (Secchi disk): ২৫-৩০ সেমি'
    ],
    keyTasksBn: [
      'পুকুর প্রস্তুতির পর পোনা ছাড়ার সময় ধীরে ধীরে তাপমাত্রা ও পানি খাপ খাওয়ান (Acclimatization)',
      'সকাল ৮টা, দুপুর ১২টা ও বিকাল ৪টায় দিনে ৩ বারে বিভক্ত করে খাবার ছিটিয়ে দিন',
      'অতিরিক্ত খাবার যেন পচে পানির তলায় গ্যাস না জমায় খেয়াল রাখুন'
    ]
  },
  {
    stageId: 'grower_phase',
    titleBn: 'বাড়ন্ত পর্যায় (Grower Phase)',
    titleEn: 'Grower Phase (31-90 Days)',
    ageDaysRangeBn: '৩১ থেকে ৯০ দিন',
    targetWeightGm: 180,
    feedRatePctBiomass: 3.5, // ৩.৫% খাদ্য
    proteinRequirementPct: 28,
    pelletSizeMm: '১.৫ - ২.৫ মিমি ফ্লোটিং ফিড',
    feedFrequencyDaily: 2,
    waterParamsBn: [
      'দ্রবীভূত অক্সিজেন (DO): > ৫.০ ppm',
      'পানির পিএইচ (pH): ৭.২ - ৮.২',
      'অ্যামোনিয়া: < ০.০৫ ppm'
    ],
    keyTasksBn: [
      'প্রতি ১৫ দিন পর পর জাল টেনে অন্তত ২০-৩০টি মাছের নমুনা ওজন (Sampling) নিন',
      'মাছের গড় ওজন ও মোট সংখ্যা গুণ করে পুকুরের প্রকৃত খাদ্য হিসাব নির্ধারণ করুন',
      'মাসে একবার প্রতি শতকে ২৫০ গ্রাম চুন ও লবণ প্রয়োগ করুন'
    ]
  },
  {
    stageId: 'finisher_harvest',
    titleBn: 'চূড়ান্ত মোটাতাজাকরণ ও বাজারজাত (Finisher Phase)',
    titleEn: 'Finisher Phase (91-180+ Days)',
    ageDaysRangeBn: '৯১ থেকে ১৮০+ দিন',
    targetWeightGm: 650,
    feedRatePctBiomass: 2.0, // ২.০% খাদ্য
    proteinRequirementPct: 26,
    pelletSizeMm: '৩.০ - ৪.০ মিমি ফ্লোটিং ফিড',
    feedFrequencyDaily: 2,
    waterParamsBn: [
      'দ্রবীভূত অক্সিজেন (DO): > ৪.৫ ppm',
      'গ্যাস মুক্ত তলদেশ: মাঝে মাঝে হররা টানুন'
    ],
    keyTasksBn: [
      'সকাল ৯টা ও বিকাল ৪টায় নির্দিষ্ট জায়গায় খাবার দিন',
      'মেঘলা দিনে বা বৃষ্টি হলে খাদ্যের পরিমাণ ৩০-৫০% কমিয়ে দিন',
      'মাছ ধরার ও হাটে পাঠানোর আগের দিন খাদ্য পুরোপুরি বন্ধ রাখুন'
    ]
  }
];
