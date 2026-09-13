// Standard Operating Procedure (SOP) & Daily Work Schedule Data
// Grounded in commercial Bangladeshi & International Broiler Management Charts (Cobb 500 / Ross 308)

export interface DailySopItem {
  day: number;
  week: number;
  feedDailyGm: number;
  feedCumGm: number;
  bodyWeightGm: number;
  fcrStd: number;
  tempFMin: number;
  tempFMax: number;
  relHumidityMin: number;
  relHumidityMax: number;
  tasks: string[];
  tasksBn: string[];
  isCritical?: boolean;
}

export interface BroodingChecklist {
  id: string;
  category: 'space' | 'heating' | 'hygiene' | 'crop_fill' | 'feed_water';
  title: string;
  titleBn: string;
  specification: string;
  specificationBn: string;
}

export interface CropFillMilestone {
  hour: number;
  dayLabel: string;
  dayLabelBn: string;
  targetPercent: number;
  description: string;
  descriptionBn: string;
}

export interface EquipmentSlotGuide {
  slot: number;
  ageDaysRange: string;
  ageDaysRangeBn: string;
  panFillPercent: number;
  title: string;
  titleBn: string;
  instruction: string;
  instructionBn: string;
}

// 1. Crop Fill Milestones (Day 1-2)
export const CROP_FILL_MILESTONES: CropFillMilestone[] = [
  {
    hour: 4,
    dayLabel: 'Day 1 (4 Hours)',
    dayLabelBn: '১ম দিন (৪ ঘণ্টা পর)',
    targetPercent: 80,
    description: 'At least 80% chicks must have a soft, pliable crop with water and feed.',
    descriptionBn: 'কমপক্ষে ৮০% বাচ্চার পেটে (ক্রপ) নরম খাবার ও পানি থাকতে হবে।'
  },
  {
    hour: 8,
    dayLabel: 'Day 1 (8 Hours)',
    dayLabelBn: '১ম দিন (৮ ঘণ্টা পর)',
    targetPercent: 80,
    description: '80% chicks must have well-filled crops.',
    descriptionBn: '৮০% বাচ্চার পেট ভালোভাবে ভরা থাকতে হবে।'
  },
  {
    hour: 12,
    dayLabel: 'Day 1 (12 Hours)',
    dayLabelBn: '১ম দিন (১২ ঘণ্টা পর)',
    targetPercent: 85,
    description: '85% chicks should have adequate crop fill.',
    descriptionBn: '৮৫% বাচ্চার ক্রপ পরীক্ষা করে পূর্ণ পাওয়া আবশ্যক।'
  },
  {
    hour: 24,
    dayLabel: 'Day 1 (24 Hours)',
    dayLabelBn: '১ম দিন (২৪ ঘণ্টা পর)',
    targetPercent: 95,
    description: '95% chicks must achieve optimal crop fill. If under 95%, increase feeder paper/trays.',
    descriptionBn: '৯৫% বাচ্চার ক্রপ ভরা থাকতে হবে। কম হলে খাবারের পেপারের সংখ্যা বাড়ান।'
  },
  {
    hour: 48,
    dayLabel: 'Day 2 (48 Hours)',
    dayLabelBn: '২য় দিন (৪৮ ঘণ্টা পর)',
    targetPercent: 100,
    description: '100% chicks must have complete crop fill indicating successful brooding initiation.',
    descriptionBn: '১০০% বাচ্চার ক্রপ সম্পূর্ণ ভরাট থাকতে হবে।'
  }
];

// 2. Feeder Slot Level Adjustment Guide (Image 2)
export const FEEDER_SLOT_GUIDES: EquipmentSlotGuide[] = [
  {
    slot: 1,
    ageDaysRange: 'Day 11 to 14',
    ageDaysRangeBn: '১১ থেকে ১৪ দিন',
    panFillPercent: 80,
    title: '1st Slot (Grill & Cone Extension)',
    titleBn: '১ম স্লট (গ্রিল ও কোন এক্সটেনশন)',
    instruction: 'Keep 80% feed volume in bottom pan to encourage initial feeder adaptation.',
    instructionBn: 'খাদ্যের পাত্রের তলায় ৮০% খাদ্য রাখুন যাতে বাচ্চা সহজে ফিডারে অভ্যস্ত হয়।'
  },
  {
    slot: 2,
    ageDaysRange: 'Day 15 to 23',
    ageDaysRangeBn: '১৫ থেকে ২৩ দিন',
    panFillPercent: 50,
    title: '2nd Slot & Hang Feeders',
    titleBn: '২য় স্লট ও ফিডার ঝোলানো',
    instruction: 'Keep 50% feed in bottom pan. Hang the feeders at bird back height to avoid wastage.',
    instructionBn: 'পাত্রের ৫০% খাবার রাখুন এবং ১৫তম দিনে ফিডার মুরগির পিঠের উচ্চতায় ঝুলিয়ে দিন।'
  },
  {
    slot: 3,
    ageDaysRange: 'Day 24 to Marketing',
    ageDaysRangeBn: '২৪ দিন থেকে বিক্রয় পর্যন্ত',
    panFillPercent: 25,
    title: '3rd Slot (Anti-Spill Position)',
    titleBn: '৩য় স্লট (খাদ্য অপচয় রোধ)',
    instruction: 'Keep 25% feed in bottom pan. Prevents feed spilling while birds eat vigorously.',
    instructionBn: 'পাত্রের ২৫% খাবার রাখুন যাতে বড় মুরগি খাবার না ছিটিয়ে পরিচ্ছন্নভাবে খেতে পারে।'
  }
];

// 3. Complete 0-49 Days SOP & Work Schedule Table
export const BROILER_SOP_SCHEDULE: DailySopItem[] = [
  {
    day: 0,
    week: 1,
    feedDailyGm: 0,
    feedCumGm: 0,
    bodyWeightGm: 42,
    fcrStd: 0,
    tempFMin: 86,
    tempFMax: 88,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Pre-placement shed fumigation & disinfection completed',
      'Airtight tent brooding set up (covering 33% shed space)',
      'Round brooder arranged for 350 chicks with 100W bulb',
      'Ensure 80kg coal / 1000 chicks heating backup ready',
      'Water sanitizer in tank & drinker lid level water filled',
      'Tyre & Bell drinker arrangement with Paper feeding laid out'
    ],
    tasksBn: [
      'শেড জীবাণুমুক্তকরণ ও ফিউমিগেশন নিশ্চিত করুন',
      'শেডের ৩৩% জায়গায় এয়ারটাইট ব্রুডিং টেন্ট স্থাপন করুন',
      'প্রতি ৩৫০ বাচ্চার জন্য ১টি গোল ব্রুডার ও ১০০ ওয়াট বাল্ব প্রস্তুত রাখুন',
      'প্রতি ১০০০ বাচ্চার জন্য ৮০ কেজি কয়লা/হিটার বিকল্প মজুদ রাখুন',
      'পানিতে ওয়াটার স্যানিটাইজার যোগ করুন ও ড্রিংকারে ঢাকনা পর্যন্ত পানি দিন',
      'টায়ার/বেল ড্রিংকার সাজান এবং পেপারের ওপর খাদ্য ছিটিয়ে দিন'
    ],
    isCritical: true
  },
  {
    day: 1,
    week: 1,
    feedDailyGm: 13,
    feedCumGm: 13,
    bodyWeightGm: 62,
    fcrStd: 0.21,
    tempFMin: 86,
    tempFMax: 88,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Feed paper replenishment (13g feed intake per chick)',
      'Perform Crop Fill audit at 4, 8, 12, and 24 hours (Target 80-95%)',
      'Clean chick drinkers 2 times daily',
      'Check chick comfort & cluster behavior under brooder'
    ],
    tasksBn: [
      'খাবারের পেপার পরিবর্তন বা খাবার ছিটানো (প্রতি বাচ্চার খাদ্য ১৩ গ্রাম)',
      '৪, ৮, ১২ এবং ২৪ ঘণ্টা পর ক্রপ ফিল পরীক্ষা করুন (টার্গেট ৮০-৯৫%)',
      'দিনে ২ বার ড্রিংকার পরিষ্কার করে বিশুদ্ধ পানি দিন',
      'ব্রুডারে বাচ্চার আরাম ও তাপমাত্রা ঠিক আছে কিনা লক্ষ্য করুন'
    ],
    isCritical: true
  },
  {
    day: 2,
    week: 1,
    feedDailyGm: 17,
    feedCumGm: 30,
    bodyWeightGm: 80,
    fcrStd: 0.37,
    tempFMin: 86,
    tempFMax: 88,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Clean bell drinkers twice daily',
      'Maintain paper feeding and check litter dry condition',
      'Verify 48-hour 100% crop fill completion'
    ],
    tasksBn: [
      'দিনে ২ বার বেল ড্রিংকার ধৌত ও স্যানিটাইজ করুন',
      'পেপারে খাবার চলমান রাখুন এবং লিটার শুকনো আছে কিনা দেখুন',
      '৪৮ ঘণ্টায় ১০০% বাচ্চার ক্রপ ভরা নিশ্চিত করুন'
    ]
  },
  {
    day: 3,
    week: 1,
    feedDailyGm: 20,
    feedCumGm: 50,
    bodyWeightGm: 101,
    fcrStd: 0.49,
    tempFMin: 84,
    tempFMax: 87,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Prepare for transition from paper to feeder trays',
      'Monitor drinker water temperature (not too hot or cold)',
      'Gradual ventilation check'
    ],
    tasksBn: [
      'পেপার থেকে ট্রে বা ফিডারে স্থানান্তরের প্রস্তুতি নিন',
      'পানির তাপমাত্রা স্বাভাবিক রাখুন (খুব গরম বা ঠান্ডা নয়)',
      'বাতাস চলাচলের হালকা ব্যবস্থা নিন'
    ]
  },
  {
    day: 4,
    week: 1,
    feedDailyGm: 24,
    feedCumGm: 74,
    bodyWeightGm: 124,
    fcrStd: 0.59,
    tempFMin: 84,
    tempFMax: 87,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Start litter raking daily 2 times (Morning & Afternoon)',
      'Introduce auto feeder feeding (Ratio 1:50 chicks)',
      'Remove worn out feeder paper gradually'
    ],
    tasksBn: [
      'প্রতিদিন ২ বার লিটার রেক বা উলটপালট শুরু করুন (সকাল ও বিকেল)',
      'অটো ফিডার চালু করুন (প্রতি ৫০ বাচ্চার জন্য ১টি ফিডার)',
      'পুরোনো খাবার পেপার ধীরে ধীরে অপসারণ করুন'
    ],
    isCritical: true
  },
  {
    day: 5,
    week: 1,
    feedDailyGm: 27,
    feedCumGm: 101,
    bodyWeightGm: 150,
    fcrStd: 0.67,
    tempFMin: 83,
    tempFMax: 86,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Fit bell drinker 1:150 using T-Nipple',
      'Adjust chick drinker stand to normal height position',
      'Litter moisture check & raking'
    ],
    tasksBn: [
      'টি-নিপল ব্যবহার করে বেল ড্রিংকার ফিট করুন (১:১৫০ অনুপাতে)',
      'চিক ড্রিংকার স্ট্যান্ড স্বাভাবিক পজিশনে রাখুন',
      'লিটারের আর্দ্রতা পরীক্ষা ও রেক করুন'
    ],
    isCritical: true
  },
  {
    day: 6,
    week: 1,
    feedDailyGm: 31,
    feedCumGm: 132,
    bodyWeightGm: 179,
    fcrStd: 0.74,
    tempFMin: 83,
    tempFMax: 86,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Ensure all birds are drinking comfortably from bell drinkers',
      'Maintain clean sanitized water supply',
      'Record daily feed bags & mortality'
    ],
    tasksBn: [
      'সব বাচ্চা ড্রিংকার থেকে পানি পাচ্ছে কিনা খেয়াল করুন',
      'বিশুদ্ধ পানি নিশ্চিত রাখুন',
      'দৈনিক খাবারের বস্তা ও মৃত্যুর হিসাব সংরক্ষণ করুন'
    ]
  },
  {
    day: 7,
    week: 1,
    feedDailyGm: 35,
    feedCumGm: 167,
    bodyWeightGm: 211,
    fcrStd: 0.79,
    tempFMin: 83,
    tempFMax: 86,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Weaks separation & forced culls (Separate underweight & defective chicks)',
      'Perform 7th-day flock weight sample (Target 211g, FCR 0.79)',
      'Disinfection foot dip refreshed at farm entrance'
    ],
    tasksBn: [
      'দুর্বল ও বিকলাঙ্গ বাচ্চা আলাদা করুন (Weaks Separation & Culling)',
      '৭ম দিনের গড় ওজন ও এফসিআর পরীক্ষা (টার্গেট ২১১ গ্রাম, FCR ০.৭৯)',
      'শেডের প্রবেশমুখে ফুটবাথ জীবাণুনাশক পরিবর্তন করুন'
    ],
    isCritical: true
  },
  {
    day: 8,
    week: 2,
    feedDailyGm: 39,
    feedCumGm: 206,
    bodyWeightGm: 247,
    fcrStd: 0.83,
    tempFMin: 81,
    tempFMax: 84,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Disinfectant spray on shed & surrounding area',
      'Remove round brooders & expand partition (1:500 chicks)',
      'Litter raking twice daily'
    ],
    tasksBn: [
      'শেড ও চারপাশের বাতাসে হালকা জীবাণুনাশক স্প্রে করুন',
      'গোল ব্রুডার তুলে দিন এবং জায়গা বড় করে পার্টেশন করুন (১:৫০০)',
      'দিনে দুইবার লিটার রেক করুন'
    ],
    isCritical: true
  },
  {
    day: 9,
    week: 2,
    feedDailyGm: 43,
    feedCumGm: 249,
    bodyWeightGm: 286,
    fcrStd: 0.87,
    tempFMin: 81,
    tempFMax: 84,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Observe bird spread across newly expanded space',
      'Check feeder distribution uniformity',
      'Clean water drinkers'
    ],
    tasksBn: [
      'নতুন বড় জায়গায় বাচ্চা সমানভাবে ছড়িয়ে পড়ছে কিনা দেখুন',
      'খাদ্যের পাত্র সমান দূরত্বে রাখুন',
      'ড্রিংকার পরিষ্কার রাখুন'
    ]
  },
  {
    day: 10,
    week: 2,
    feedDailyGm: 47,
    feedCumGm: 296,
    bodyWeightGm: 328,
    fcrStd: 0.90,
    tempFMin: 81,
    tempFMax: 84,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Clean water pipeline with 5% H2O2 (Hydrogen Peroxide flushing)',
      'Flush fresh clean water after chemical sanitization',
      'Check nipple water pressure & line flow'
    ],
    tasksBn: [
      'পানির পাইপলাইন ৫% হাইড্রোজেন পারক্সাইড (5% H2O2) দিয়ে ফ্লাশিং/পরিষ্কার করুন',
      'কেমিক্যাল বের করে বিশুদ্ধ পানি দিয়ে পাইপ ধুয়ে দিন',
      'নিপলের পানির প্রেসার পরীক্ষা করুন'
    ],
    isCritical: true
  },
  {
    day: 11,
    week: 2,
    feedDailyGm: 52,
    feedCumGm: 348,
    bodyWeightGm: 373,
    fcrStd: 0.93,
    tempFMin: 79,
    tempFMax: 82,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Set feeder in 1st Slot with grill & cone extension funnel',
      'Keep 80% feed in bottom pan',
      'Position & removal of chick feeder central plate'
    ],
    tasksBn: [
      'ফিডার ১ম স্লট (Slot 1) এ রাখুন এবং গ্রিল ও কোন এক্সটেনশন লাগান',
      'পাত্রের তলায় ৮০% খাবার রাখুন',
      'বাচ্চার পুরোনো সেন্ট্রাল প্লেট সরিয়ে বড় পাত্র বসান'
    ],
    isCritical: true
  },
  {
    day: 12,
    week: 2,
    feedDailyGm: 57,
    feedCumGm: 405,
    bodyWeightGm: 422,
    fcrStd: 0.96,
    tempFMin: 79,
    tempFMax: 82,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Check feed distribution in Slot 1 feeders',
      'Ensure drinkers are at bird back height',
      'Litter raking twice daily'
    ],
    tasksBn: [
      '১ম স্লটের ফিডারে খাবার সরবরাহ ঠিক আছে কিনা দেখুন',
      'ড্রিংকার পাখির পিঠের উচ্চতায় সেট রাখুন',
      'লিটার দুই বেলা রেক করুন'
    ]
  },
  {
    day: 13,
    week: 2,
    feedDailyGm: 61,
    feedCumGm: 466,
    bodyWeightGm: 475,
    fcrStd: 0.98,
    tempFMin: 79,
    tempFMax: 82,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Check nighttime ventilation and ammonia smell',
      'Verify water consumption trend'
    ],
    tasksBn: [
      'রাতের ভেন্টিলেশন ও অ্যামোনিয়া গ্যাসের গন্ধ পরীক্ষা করুন',
      'পানি খাওয়ার পরিমাণ বাড়ল কিনা লক্ষ করুন'
    ]
  },
  {
    day: 14,
    week: 2,
    feedDailyGm: 67,
    feedCumGm: 533,
    bodyWeightGm: 531,
    fcrStd: 1.00,
    tempFMin: 79,
    tempFMax: 82,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Disinfectant spray across flock and shed',
      'Week 2 weight audit (Target 531g, FCR 1.00-1.04)',
      'Prepare equipment for hanging feeders tomorrow'
    ],
    tasksBn: [
      'শেড ও মুরগির ওপর অনুমোদিত জীবাণুনাশক স্প্রে করুন',
      '১৪ দিনের ওজন স্যাম্পল নিন (টার্গেট ৫৩১ গ্রাম, FCR ১.০০-১.০৪)',
      'আগামীকাল ফিডার ঝোলানোর দড়ি/হুক পরীক্ষা করুন'
    ],
    isCritical: true
  },
  {
    day: 15,
    week: 3,
    feedDailyGm: 72,
    feedCumGm: 605,
    bodyWeightGm: 590,
    fcrStd: 1.02,
    tempFMin: 77,
    tempFMax: 80,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Hang the feeders from ceiling at bird back height',
      'Adjust feeder to 2nd Slot (50% feed in bottom pan)',
      'Equipment alignment across the entire shed'
    ],
    tasksBn: [
      'ফিডারগুলো ঝুলিয়ে দিন (পাখির পিঠের উচ্চতায়)',
      'ফিডার ২য় স্লটে (Slot 2) দিন (পাত্রে ৫০% খাবার থাকবে)',
      'পুরো শেডের পাত্রগুলোর লেভেল সমান ও সারিবদ্ধ রাখুন'
    ],
    isCritical: true
  },
  {
    day: 16,
    week: 3,
    feedDailyGm: 77,
    feedCumGm: 682,
    bodyWeightGm: 652,
    fcrStd: 1.05,
    tempFMin: 77,
    tempFMax: 80,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Observe hanging feeder swinging & adjust height',
      'Check litter under drinkers for any leakage',
      'Litter raking twice daily'
    ],
    tasksBn: [
      'ঝুলন্ত ফিডার বেশি দুলছে কিনা দেখুন ও উচ্চতা ঠিক করুন',
      'ড্রিংকারের নিচে পানি পড়ে লিটার ভিজছে কিনা খেয়াল করুন',
      'দিনে ২ বার লিটার রেক করুন'
    ]
  },
  {
    day: 17,
    week: 3,
    feedDailyGm: 83,
    feedCumGm: 765,
    bodyWeightGm: 718,
    fcrStd: 1.07,
    tempFMin: 77,
    tempFMax: 80,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Clean water pipeline with 5% H2O2 flushing',
      'Flush thoroughly with fresh drinking water',
      'Verify water sanitizer level'
    ],
    tasksBn: [
      'পানির পাইপলাইন ৫% হাইড্রোজেন পারক্সাইড (5% H2O2) দিয়ে পরিষ্কার করুন',
      'পরিষ্কার পানি দিয়ে পাইপ ফ্লাশ করে দিন',
      'পানিতে ওয়াটার স্যানিটাইজার নিশ্চিত করুন'
    ],
    isCritical: true
  },
  {
    day: 18,
    week: 3,
    feedDailyGm: 89,
    feedCumGm: 854,
    bodyWeightGm: 786,
    fcrStd: 1.08,
    tempFMin: 73,
    tempFMax: 75,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Maintain comfortable shed temperature (73-75°F)',
      'Cross ventilation and curtain adjustment'
    ],
    tasksBn: [
      'শেডের তাপমাত্রা ৭৩-৭৫°F রাখুন',
      'পর্দা নিয়ন্ত্রণ করে বাতাস চলাচল ঠিক রাখুন'
    ]
  },
  {
    day: 19,
    week: 3,
    feedDailyGm: 94,
    feedCumGm: 948,
    bodyWeightGm: 858,
    fcrStd: 1.10,
    tempFMin: 73,
    tempFMax: 75,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Fill feeders full in the evening before dark',
      'Ensure uninterrupted clean water supply'
    ],
    tasksBn: [
      'সন্ধ্যায় আঁধার হওয়ার আগেই ফিডারে পর্যাপ্ত খাবার দিন (Feeder Full in Evening)',
      'রাতে নিরবচ্ছিন্ন পানি সরবরাহ নিশ্চিত রাখুন'
    ],
    isCritical: true
  },
  {
    day: 20,
    week: 3,
    feedDailyGm: 100,
    feedCumGm: 1048,
    bodyWeightGm: 933,
    fcrStd: 1.12,
    tempFMin: 73,
    tempFMax: 75,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Clean water pipeline with 5% H2O2 flushing',
      'Check drinker nipple water flow rate'
    ],
    tasksBn: [
      'পানির পাইপলাইন ৫% H2O2 দিয়ে ফ্লাশিং করুন',
      'নিপলের পানির স্পিড চেক করুন'
    ],
    isCritical: true
  },
  {
    day: 21,
    week: 3,
    feedDailyGm: 106,
    feedCumGm: 1154,
    bodyWeightGm: 1010,
    fcrStd: 1.14,
    tempFMin: 73,
    tempFMax: 75,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Week 3 weight and FCR audit (Target ~1000g, FCR ~1.14-1.29)',
      'Separate and cull non-growing birds',
      'Check stock remaining feed bags'
    ],
    tasksBn: [
      '২১ দিনের ওজন ও এফসিআর পরীক্ষা (টার্গেট ১০০০ গ্রাম, FCR ১.১৪-১.২৯)',
      'ছোট বা অনুৎপাদনশীল পাখি আলাদা বা ছাঁটাই করুন',
      'খাদ্যের স্টকে কত বস্তা অবশিষ্ট আছে মেলান'
    ],
    isCritical: true
  },
  {
    day: 22,
    week: 4,
    feedDailyGm: 112,
    feedCumGm: 1266,
    bodyWeightGm: 1090,
    fcrStd: 1.16,
    tempFMin: 72,
    tempFMax: 75,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Disinfectant spray on flock and walkways',
      'Litter conditioning and dry top-up if damp'
    ],
    tasksBn: [
      'শেড ও রাস্তায় জীবাণুনাশক স্প্রে করুন',
      'লিটার বেশি ভেজা হলে উপরে শুকনা তুষ ছিটিয়ে রেক করুন'
    ],
    isCritical: true
  },
  {
    day: 23,
    week: 4,
    feedDailyGm: 118,
    feedCumGm: 1386,
    bodyWeightGm: 1172,
    fcrStd: 1.18,
    tempFMin: 72,
    tempFMax: 75,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Raise drinkers and feeders to match fast-growing bird height',
      'Check fan & ventilation operations'
    ],
    tasksBn: [
      'মুরগির বৃদ্ধির সাথে সাথে ড্রিংকার ও ফিডার আরও কিছুটা ওপরে তুলুন',
      'ফ্যান ও বাতাস চলাচলের ব্যবস্থা সচল রাখুন'
    ]
  },
  {
    day: 24,
    week: 4,
    feedDailyGm: 124,
    feedCumGm: 1508,
    bodyWeightGm: 1257,
    fcrStd: 1.20,
    tempFMin: 70,
    tempFMax: 75,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Adjust feeders to 3rd Slot (25% feed in bottom pan)',
      'Anti-spill positioning to prevent feed wastage',
      'Clean bell drinkers'
    ],
    tasksBn: [
      'ফিডার ৩য় স্লটে (Slot 3) সেট করুন (পাত্রে ২৫% খাবার থাকবে)',
      'খাবার ছিটানো বন্ধের জন্য নিখুঁত লেভেলে ঝুলিয়ে রাখুন',
      'ড্রিংকার পরিষ্কার করুন'
    ],
    isCritical: true
  },
  {
    day: 25,
    week: 4,
    feedDailyGm: 130,
    feedCumGm: 1638,
    bodyWeightGm: 1344,
    fcrStd: 1.22,
    tempFMin: 70,
    tempFMax: 75,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Night ventilation inspection',
      'Feed consumption monitoring'
    ],
    tasksBn: [
      'রাতের ভেন্টিলেশন পরীক্ষা করুন',
      'দৈনিক খাবার খাওয়া স্বাভাবিক আছে কিনা লক্ষ্য করুন'
    ]
  },
  {
    day: 26,
    week: 4,
    feedDailyGm: 136,
    feedCumGm: 1774,
    bodyWeightGm: 1433,
    fcrStd: 1.24,
    tempFMin: 70,
    tempFMax: 75,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Regular litter raking twice daily',
      'Check bird crop levels and uniformity'
    ],
    tasksBn: [
      'দিনে ২ বার লিটার রেক করুন',
      'মুরগির পেট ও স্বাস্থ্য সমান আছে কিনা দেখুন'
    ]
  },
  {
    day: 27,
    week: 4,
    feedDailyGm: 141,
    feedCumGm: 1915,
    bodyWeightGm: 1524,
    fcrStd: 1.26,
    tempFMin: 70,
    tempFMax: 75,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Disinfectant spray across flock and perimeter',
      'Clean water tank and lines'
    ],
    tasksBn: [
      'শেড ও মুরগির ওপর জীবাণুনাশক স্প্রে করুন',
      'পানির ট্যাঙ্ক ও লাইন পরিষ্কার রাখুন'
    ],
    isCritical: true
  },
  {
    day: 28,
    week: 4,
    feedDailyGm: 147,
    feedCumGm: 2062,
    bodyWeightGm: 1616,
    fcrStd: 1.28,
    tempFMin: 70,
    tempFMax: 75,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Week 4 weight audit (Target ~1616g, FCR ~1.28-1.50)',
      'Calculate cumulative flock FCR & EPEF score',
      'Review feed stock inventory'
    ],
    tasksBn: [
      '২৮ দিনের ওজন ও এফসিআর পরীক্ষা (টার্গেট ১৬১৬ গ্রাম, FCR ১.২৮-১.৫০)',
      'ফ্লকের নিট FCR ও EPEF স্কোর ক্যালকুলেট করুন',
      'ফিড গোডাউনের বস্তার হিসাব মেলান'
    ],
    isCritical: true
  },
  {
    day: 29,
    week: 5,
    feedDailyGm: 153,
    feedCumGm: 2215,
    bodyWeightGm: 1710,
    fcrStd: 1.30,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Check feeder height to ensure bottom pan is at bird breast level',
      'Increase air circulation for heavy birds'
    ],
    tasksBn: [
      'ফিডারের তলা মুরগির বুকের সমান উচ্চতায় আছে কিনা নিশ্চিত করুন',
      'বড় মুরগির জন্য বাতাস চলাচলের গতি বাড়ান'
    ]
  },
  {
    day: 30,
    week: 5,
    feedDailyGm: 158,
    feedCumGm: 2373,
    bodyWeightGm: 1805,
    fcrStd: 1.31,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Monitor drinker water consumption (approx 2-2.5x feed weight)',
      'Sanitizer check in water'
    ],
    tasksBn: [
      'পানি খাওয়ার পরিমাণ পরীক্ষা করুন (খাদ্যের ওজনের ২-২.৫ গুণ হওয়া উচিত)',
      'পানিতে স্যানিটাইজার মাত্রা ঠিক রাখুন'
    ]
  },
  {
    day: 31,
    week: 5,
    feedDailyGm: 163,
    feedCumGm: 2536,
    bodyWeightGm: 1901,
    fcrStd: 1.33,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Check flock uniformity and health',
      'Rake litter to keep floor completely dry'
    ],
    tasksBn: [
      'ফ্লকের একরূপতা ও স্বাস্থ্য পরীক্ষা করুন',
      'লিটার সবসময় ঝরঝরে ও শুকনো রাখুন'
    ]
  },
  {
    day: 32,
    week: 5,
    feedDailyGm: 169,
    feedCumGm: 2705,
    bodyWeightGm: 1999,
    fcrStd: 1.35,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Check drinker nipple water flow (60-80 ml/min for mature birds)',
      'Clean bell drinkers'
    ],
    tasksBn: [
      'নিপলের পানির স্পিড চেক করুন (মিনিটে ৬০-৮০ মিলি হওয়া উচিত)',
      'বেল ড্রিংকার পরিষ্কার করুন'
    ]
  },
  {
    day: 33,
    week: 5,
    feedDailyGm: 174,
    feedCumGm: 2879,
    bodyWeightGm: 2057,
    fcrStd: 1.37,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Disinfectant spray across flock and perimeter',
      'Observe breathing sounds at night for respiratory issues'
    ],
    tasksBn: [
      'শেড ও আশপাশে জীবাণুনাশক স্প্রে করুন',
      'রাতে নিঃশ্বাসের শব্দ শুনে কোনো শ্বাসকষ্ট বা খকখক আছে কিনা পরীক্ষা করুন'
    ],
    isCritical: true
  },
  {
    day: 34,
    week: 5,
    feedDailyGm: 179,
    feedCumGm: 3058,
    bodyWeightGm: 2196,
    fcrStd: 1.39,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Weight sampling across 4 sections of shed',
      'Prepare for final finisher feed plan'
    ],
    tasksBn: [
      'শেডের ৪টি কোণা থেকে ওজন স্যাম্পল নিয়ে গড় করুন',
      'ফিনিশার ফিডের ব্যবস্থাপনা ঠিক করুন'
    ]
  },
  {
    day: 35,
    week: 5,
    feedDailyGm: 183,
    feedCumGm: 3241,
    bodyWeightGm: 2295,
    fcrStd: 1.41,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Clean water pipeline with 5% H2O2 flushing',
      'Week 5 weight audit (Target ~2295g, FCR ~1.41-1.73)',
      'Pre-marketing flock assessment'
    ],
    tasksBn: [
      'পানির পাইপলাইন ৫% H2O2 দিয়ে পরিষ্কার করুন',
      '৩৫ দিনের ওজন ও এফসিআর হিসাব (টার্গেট ২২৯৫ গ্রাম, FCR ১.৪১-১.৭৩)',
      'বিক্রয়ের পরিকল্পনা শুরু করুন'
    ],
    isCritical: true
  },
  {
    day: 36,
    week: 6,
    feedDailyGm: 188,
    feedCumGm: 3429,
    bodyWeightGm: 2395,
    fcrStd: 1.43,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Monitor feed intake carefully for early harvest signs',
      'Maintain maximum ventilation'
    ],
    tasksBn: [
      'খাদ্য গ্রহণ মনিটর করুন',
      'পর্যাপ্ত বাতাস চলাচল বজায় রাখুন'
    ]
  },
  {
    day: 37,
    week: 6,
    feedDailyGm: 192,
    feedCumGm: 3621,
    bodyWeightGm: 2495,
    fcrStd: 1.45,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Litter management and ventilation check',
      'Market price communication with local buyers'
    ],
    tasksBn: [
      'লিটার শুকনো রাখুন',
      'পাইকার বা বাজারে ব্রয়লারের বর্তমান দর যাচাই করুন'
    ]
  },
  {
    day: 38,
    week: 6,
    feedDailyGm: 196,
    feedCumGm: 3817,
    bodyWeightGm: 2595,
    fcrStd: 1.47,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Check water availability and nipple condition',
      'Keep birds calm during hot hours'
    ],
    tasksBn: [
      'পানি পর্যাপ্ত আছে কিনা নিশ্চিত করুন',
      'গরমের সময় মুরগিকে শান্ত রাখুন'
    ]
  },
  {
    day: 39,
    week: 6,
    feedDailyGm: 200,
    feedCumGm: 4017,
    bodyWeightGm: 2695,
    fcrStd: 1.49,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Night ventilation & lighting management',
      'Sample weight check'
    ],
    tasksBn: [
      'রাতের ভেন্টিলেশন ও লাইটিং ম্যানেজমেন্ট',
      'স্যাম্পল ওজন যাচাই'
    ]
  },
  {
    day: 40,
    week: 6,
    feedDailyGm: 204,
    feedCumGm: 4221,
    bodyWeightGm: 2795,
    fcrStd: 1.51,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Check for bird mobility & leg health',
      'Regular drinker sanitization'
    ],
    tasksBn: [
      'মুরগির পায়ের শক্তি ও হাঁটাচলা স্বাভাবিক কিনা দেখুন',
      'ড্রিংকার নিয়মিত স্যানিটাইজ করুন'
    ]
  },
  {
    day: 41,
    week: 6,
    feedDailyGm: 207,
    feedCumGm: 4428,
    bodyWeightGm: 2895,
    fcrStd: 1.53,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Preparation for 42nd-day major audit or marketing',
      'Review feed stock'
    ],
    tasksBn: [
      '৪২তম দিনের প্রধান অডিট বা বিক্রয়ের প্রস্তুতি নিন',
      'ফিড স্টক পরীক্ষা করুন'
    ]
  },
  {
    day: 42,
    week: 6,
    feedDailyGm: 211,
    feedCumGm: 4639,
    bodyWeightGm: 2995,
    fcrStd: 1.55,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Disinfectant spray across shed',
      'Week 6 weight audit (Target ~2995g, FCR ~1.55-1.99)',
      'Primary marketing window open (Most commercial batches sold around 35-42 days)'
    ],
    tasksBn: [
      'শেডে জীবাণুনাশক স্প্রে করুন',
      '৪২ দিনের ওজন অডিট (টার্গেট ২৯৯৫ গ্রাম, FCR ১.৫৫-১.৯৯)',
      'প্রধান বিক্রয় সময়কাল (অধিকাংশ ব্রয়লার ৩৫-৪২ দিনেই বিক্রি সম্পন্ন হয়)'
    ],
    isCritical: true
  },
  {
    day: 43,
    week: 7,
    feedDailyGm: 214,
    feedCumGm: 4853,
    bodyWeightGm: 3093,
    fcrStd: 1.57,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Heavy bird management: avoid heat stress',
      'Strict water availability'
    ],
    tasksBn: [
      'ভারী মুরগির হিট স্ট্রোক রোধে ঠান্ডা বাতাস নিশ্চিত করুন',
      'সারাক্ষণ বিশুদ্ধ পানি সচল রাখুন'
    ]
  },
  {
    day: 44,
    week: 7,
    feedDailyGm: 217,
    feedCumGm: 5070,
    bodyWeightGm: 3192,
    fcrStd: 1.59,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Check buyer lifting schedule and truck logistics',
      'Feed monitoring'
    ],
    tasksBn: [
      'পাইকারদের গাড়ি ও ওজন মাপার ব্যবস্থা চূড়ান্ত করুন',
      'ফিড খরচ মনিটর করুন'
    ]
  },
  {
    day: 45,
    week: 7,
    feedDailyGm: 219,
    feedCumGm: 5289,
    bodyWeightGm: 3289,
    fcrStd: 1.60,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Maintain fresh water and clean litter',
      'Observe flock activity'
    ],
    tasksBn: [
      'বিশুদ্ধ পানি ও শুকনো লিটার বজায় রাখুন',
      'ফ্লকের সক্রিয়তা লক্ষ্য করুন'
    ]
  },
  {
    day: 46,
    week: 7,
    feedDailyGm: 222,
    feedCumGm: 5511,
    bodyWeightGm: 3386,
    fcrStd: 1.63,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Monitor feed intake against growth',
      'Clean water lines'
    ],
    tasksBn: [
      'খাদ্যের বিপরীতে ওজন বৃদ্ধি যাচাই করুন',
      'পানির লাইন পরিষ্কার রাখুন'
    ]
  },
  {
    day: 47,
    week: 7,
    feedDailyGm: 224,
    feedCumGm: 5735,
    bodyWeightGm: 3482,
    fcrStd: 1.65,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Marketing preparations: weigh scale verification and crates disinfection',
      'Ensure zero medicine withdrawal violations'
    ],
    tasksBn: [
      'বিক্রয়ের প্রস্তুতি: দাঁড়িপাল্লা ও খাঁচা জীবাণুমুক্ত করুন',
      'কোনো অ্যান্টিবায়োটিকের উইথড্রয়াল পিরিয়ড বাকি নেই তা নিশ্চিত করুন'
    ]
  },
  {
    day: 48,
    week: 7,
    feedDailyGm: 226,
    feedCumGm: 5961,
    bodyWeightGm: 3577,
    fcrStd: 1.67,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Pre-harvest feed withdrawal plan (Withdraw feed 6-8 hours before lifting, never withdraw water)',
      'Keep shed dim to avoid panic during catching'
    ],
    tasksBn: [
      'ফিড প্রত্যাহার পরিকল্পনা (গাড়িতে তোলার ৬-৮ ঘণ্টা আগে খাদ্য বন্ধ করুন, পানি কখনোই বন্ধ করবেন না)',
      'ধরা বা লোডিংয়ের সময় আলো ডিম করে রাখুন যাতে দৌড়াদৌড়ি না করে'
    ],
    isCritical: true
  },
  {
    day: 49,
    week: 7,
    feedDailyGm: 228,
    feedCumGm: 6189,
    bodyWeightGm: 3671,
    fcrStd: 1.69,
    tempFMin: 68,
    tempFMax: 72,
    relHumidityMin: 60,
    relHumidityMax: 70,
    tasks: [
      'Final flock harvesting, weighing & marketing',
      'Batch completion & inventory settlement (return remaining feed to stock)',
      'Shed clean-out, litter disposal >1000 ft away & disinfection for next batch'
    ],
    tasksBn: [
      'চূড়ান্ত বিক্রয়, ওজন ও ক্যাশ মেমো সংগ্রহ',
      'অ্যাপে ব্যাচ সমাপ্তি ও অবশিষ্ট খাদ্যের স্টক গুদামে ফেরত সমন্বয়',
      'শেড পরিষ্কার, লিটার ১০০০ ফুট দূরে সংরক্ষণ ও পরবর্তী ব্যাচের জীবাণুমুক্তকরণ'
    ],
    isCritical: true
  }
];

export function getSopForDay(day: number): DailySopItem {
  const boundedDay = Math.max(0, Math.min(49, Math.round(day)));
  const item = BROILER_SOP_SCHEDULE.find(s => s.day === boundedDay);
  if (item) return item;
  return BROILER_SOP_SCHEDULE[BROILER_SOP_SCHEDULE.length - 1];
}
