// Commercial Layer Chicken Standard SOP & Feed/Production Schedule (Week 1 to Week 72+)
// Grounded in Hy-Line Brown / Novogen Brown / Lohmann Brown Commercial Layer Management Guide

export interface LayerWeeklySopItem {
  week: number;
  phaseBn: string;
  phaseEn: string;
  ageDaysStart: number;
  ageDaysEnd: number;
  feedDailyGm: number; // Grams per bird per day
  bodyWeightGm: number; // Target weight in grams
  eggProductionPct: number; // Expected egg lay rate (0 to 96%)
  waterDailyMl: number; // Clean water per bird per day (ml)
  lightingHours: number; // Recommended daily light hours
  feedTypeBn: string;
  feedTypeEn: string;
  keyTasksBn: string[];
  keyTasksEn: string[];
  isCritical?: boolean;
}

export const LAYER_SOP_SCHEDULE: LayerWeeklySopItem[] = [
  // Phase 1: Chick Brooding Phase (Weeks 1 to 8)
  {
    week: 1,
    phaseBn: 'স্টার্টার বাচ্চা ব্রুডিং',
    phaseEn: 'Chick Starter Brooding',
    ageDaysStart: 1,
    ageDaysEnd: 7,
    feedDailyGm: 12,
    bodyWeightGm: 72,
    eggProductionPct: 0,
    waterDailyMl: 25,
    lightingHours: 23,
    feedTypeBn: 'লেয়ার চিক স্টার্টার ক্রাম্বল',
    feedTypeEn: 'Layer Chick Starter Crumble',
    keyTasksBn: [
      'ব্রুডার তাপমাত্রা ৯৩-৯৫°F বজায় রাখুন',
      'প্রথম দিন গ্লুকোজ ও ভিটামিন-সি পানি দিন',
      '২৪ ঘণ্টায় ক্রপ ফিল (খাবার থলি) পরীক্ষা করুন (>৮৫%)'
    ],
    keyTasksEn: [
      'Maintain brooder temperature 93-95°F',
      'Provide glucose and electrolyte water on Day 1',
      'Check 24-hr crop fill (>85%)'
    ],
    isCritical: true
  },
  {
    week: 2,
    phaseBn: 'স্টার্টার বাচ্চা ব্রুডিং',
    phaseEn: 'Chick Starter Brooding',
    ageDaysStart: 8,
    ageDaysEnd: 14,
    feedDailyGm: 17,
    bodyWeightGm: 125,
    eggProductionPct: 0,
    waterDailyMl: 35,
    lightingHours: 20,
    feedTypeBn: 'লেয়ার চিক স্টার্টার ক্রাম্বল',
    feedTypeEn: 'Layer Chick Starter Crumble',
    keyTasksBn: [
      'তাপমাত্রা ৩°F কমিয়ে ৯০°F-এ নামান',
      'রানিখেত (ND/IB) চোখের ড্রপ ভ্যাকসিন নিশ্চিত করুন (Day 7-10)',
      'ড্রিংকার নিয়মিত জীবাণুমুক্ত করুন'
    ],
    keyTasksEn: [
      'Reduce brooder temperature to 90°F',
      'Administer ND+IB eye drop vaccine',
      'Sanitize drinkers twice daily'
    ]
  },
  {
    week: 3,
    phaseBn: 'স্টার্টার বাচ্চা ব্রুডিং',
    phaseEn: 'Chick Starter Brooding',
    ageDaysStart: 15,
    ageDaysEnd: 21,
    feedDailyGm: 23,
    bodyWeightGm: 195,
    eggProductionPct: 0,
    waterDailyMl: 50,
    lightingHours: 18,
    feedTypeBn: 'লেয়ার চিক স্টার্টার ক্রাম্বল',
    feedTypeEn: 'Layer Chick Starter Crumble',
    keyTasksBn: [
      'গামবোরো (IBD) ১ম ডোজ ভ্যাকসিন প্রদান (Day 14-16)',
      'তাপমাত্রা ৮৫°F-এ রাখুন',
      'লিটার শুকনা ও ঝরঝরে রাখুন'
    ],
    keyTasksEn: [
      'Administer Gumboro (IBD) 1st dose vaccine',
      'Maintain brooder at 85°F',
      'Ensure dry and friable litter'
    ]
  },
  {
    week: 4,
    phaseBn: 'স্টার্টার বাচ্চা ব্রুডিং',
    phaseEn: 'Chick Starter Brooding',
    ageDaysStart: 22,
    ageDaysEnd: 28,
    feedDailyGm: 29,
    bodyWeightGm: 285,
    eggProductionPct: 0,
    waterDailyMl: 65,
    lightingHours: 16,
    feedTypeBn: 'লেয়ার চিক স্টার্টার',
    feedTypeEn: 'Layer Chick Starter',
    keyTasksBn: [
      'গামবোরো বুস্টার ডোজ ভ্যাকসিন প্রদান (Day 21-23)',
      'বাচ্চার ওজন মেপে গ্রোথ চার্টের সাথে মেলান',
      'ব্রুডারের জায়গা বাড়িয়ে দিন'
    ],
    keyTasksEn: [
      'Administer Gumboro booster dose',
      'Sample flock body weights against standard',
      'Expand brooding area'
    ]
  },
  {
    week: 5,
    phaseBn: 'স্টার্টার বাচ্চা পর্যায়',
    phaseEn: 'Chick Starter Phase',
    ageDaysStart: 29,
    ageDaysEnd: 35,
    feedDailyGm: 35,
    bodyWeightGm: 385,
    eggProductionPct: 0,
    waterDailyMl: 80,
    lightingHours: 14,
    feedTypeBn: 'লেয়ার চিক স্টার্টার',
    feedTypeEn: 'Layer Chick Starter',
    keyTasksBn: [
      'রানিখেত লাসোটা বুস্টার ভ্যাকসিন (পানিতে)',
      'ঠোঁট ছাঁটাই বা ট্রিম করার পূর্ব প্রস্তুতি',
      'শেডে প্রাকৃতিক বায়ু চলাচল স্বাভাবিক রাখুন'
    ],
    keyTasksEn: [
      'Administer ND Lasota booster in water',
      'Pre-beak trimming evaluation and vitamin K support',
      'Optimize natural shed ventilation'
    ]
  },
  {
    week: 6,
    phaseBn: 'স্টার্টার বাচ্চা পর্যায়',
    phaseEn: 'Chick Starter Phase',
    ageDaysStart: 36,
    ageDaysEnd: 42,
    feedDailyGm: 40,
    bodyWeightGm: 485,
    eggProductionPct: 0,
    waterDailyMl: 95,
    lightingHours: 13,
    feedTypeBn: 'লেয়ার চিক স্টার্টার',
    feedTypeEn: 'Layer Chick Starter',
    keyTasksBn: [
      'দক্ষ টেকনিশিয়ান দিয়ে সতর্কতার সাথে ঠোঁট ট্রিম করুন',
      'ঠোঁট কাটার আগে ও পরে ২ দিন পানিতে ভিটামিন-কে দিন',
      'ফিডারে খাবার কিছুটা উঁচুতে দিন'
    ],
    keyTasksEn: [
      'Precision infra-red/hot blade beak trimming by expert',
      'Provide Vitamin K 48 hrs before & after beak trimming',
      'Maintain deeper feed in troughs'
    ],
    isCritical: true
  },
  {
    week: 7,
    phaseBn: 'স্টার্টার বাচ্চা পর্যায়',
    phaseEn: 'Chick Starter Phase',
    ageDaysStart: 43,
    ageDaysEnd: 49,
    feedDailyGm: 45,
    bodyWeightGm: 585,
    eggProductionPct: 0,
    waterDailyMl: 105,
    lightingHours: 12,
    feedTypeBn: 'লেয়ার চিক স্টার্টার',
    feedTypeEn: 'Layer Chick Starter',
    keyTasksBn: [
      'বসন্ত (Fowl Pox) উইং ওয়েব পাখা ছিদ্র করে টিকা দিন',
      'ফ্লক ইউনিফর্মিটি (ওজনের সমতা) যাচাই (>৮৫% লক্ষ্য)'
    ],
    keyTasksEn: [
      'Administer Fowl Pox wing-web prick vaccination',
      'Audit flock body weight uniformity (>85% target)'
    ]
  },
  {
    week: 8,
    phaseBn: 'গ্রোয়ার রূপান্তর পর্যায়',
    phaseEn: 'Grower Transition Phase',
    ageDaysStart: 50,
    ageDaysEnd: 56,
    feedDailyGm: 49,
    bodyWeightGm: 685,
    eggProductionPct: 0,
    waterDailyMl: 115,
    lightingHours: 12,
    feedTypeBn: 'লেয়ার গ্রোয়ার ফিড',
    feedTypeEn: 'Layer Grower Feed',
    keyTasksBn: [
      'স্টার্টার থেকে ধীরে ধীরে গ্রোয়ার খাদ্যে রূপান্তর করুন',
      'কৃমির ওষুধ (Deworming) প্রদানের সময়সূচি নির্ধারণ'
    ],
    keyTasksEn: [
      'Gradually transition from starter to grower feed',
      'Plan routine deworming protocol'
    ]
  },

  // Phase 2: Grower & Developer Phase (Weeks 9 to 17)
  {
    week: 9,
    phaseBn: 'গ্রোয়ার বাড়ন্ত পর্যায়',
    phaseEn: 'Grower Development Phase',
    ageDaysStart: 57,
    ageDaysEnd: 63,
    feedDailyGm: 53,
    bodyWeightGm: 785,
    eggProductionPct: 0,
    waterDailyMl: 125,
    lightingHours: 12,
    feedTypeBn: 'লেয়ার গ্রোয়ার ফিড',
    feedTypeEn: 'Layer Grower Feed',
    keyTasksBn: [
      'কৃমিনাশক প্রয়োগ ও পরদিন লিভার টনিক দিন',
      'কক্সিডিওসিস প্রতিরোধে শুকনো লিটার তদারকি'
    ],
    keyTasksEn: [
      'Administer dewormer followed by liver tonic',
      'Inspect litter dry condition to prevent coccidiosis'
    ]
  },
  {
    week: 10,
    phaseBn: 'গ্রোয়ার বাড়ন্ত পর্যায়',
    phaseEn: 'Grower Development Phase',
    ageDaysStart: 64,
    ageDaysEnd: 70,
    feedDailyGm: 57,
    bodyWeightGm: 885,
    eggProductionPct: 0,
    waterDailyMl: 135,
    lightingHours: 12,
    feedTypeBn: 'লেয়ার গ্রোয়ার ফিড',
    feedTypeEn: 'Layer Grower Feed',
    keyTasksBn: [
      'ফাউল কলেরা (Fowl Cholera) ১ম ইনজেকশন টিকা',
      'প্রতি সপ্তাহে মুরগির নমুনা ওজন নিয়ে রেকর্ড করুন'
    ],
    keyTasksEn: [
      'Administer Fowl Cholera 1st injection',
      'Sample weight 5% of flock weekly'
    ]
  },
  {
    week: 12,
    phaseBn: 'গ্রোয়ার বাড়ন্ত পর্যায়',
    phaseEn: 'Grower Development Phase',
    ageDaysStart: 78,
    ageDaysEnd: 84,
    feedDailyGm: 65,
    bodyWeightGm: 1085,
    eggProductionPct: 0,
    waterDailyMl: 150,
    lightingHours: 12,
    feedTypeBn: 'লেয়ার গ্রোয়ার ফিড',
    feedTypeEn: 'Layer Grower Feed',
    keyTasksBn: [
      'রানিখেত কিল্ড (ND Killed Injectable) ইনজেকশন নিশ্চিত করুন',
      'মুরগির হাড়ের ফ্রেম ও দৈর্ঘ্যের গঠন পর্যবেক্ষণ করুন'
    ],
    keyTasksEn: [
      'Administer ND Killed oil-adjuvant injection',
      'Check body frame and skeletal development'
    ]
  },
  {
    week: 14,
    phaseBn: 'গ্রোয়ার ডেভেলপার পর্যায়',
    phaseEn: 'Developer Phase',
    ageDaysStart: 92,
    ageDaysEnd: 98,
    feedDailyGm: 73,
    bodyWeightGm: 1260,
    eggProductionPct: 0,
    waterDailyMl: 165,
    lightingHours: 12,
    feedTypeBn: 'লেয়ার ডেভেলপার ফিড',
    feedTypeEn: 'Layer Developer Feed',
    keyTasksBn: [
      'মুরগি যেন অতিরিক্ত চর্বি না জমায় সেদিকে খেয়াল রাখুন',
      'খাঁচা বা ফ্লোরের স্পেস বাড়িয়ে ঘনত্ব ঠিক করুন'
    ],
    keyTasksEn: [
      'Prevent excess body fat accumulation',
      'Ensure adequate floor / cage space allowance'
    ]
  },
  {
    week: 16,
    phaseBn: 'লেয়িং খাঁচায় স্থানান্তর পর্যায়',
    phaseEn: 'Pre-Layer Housing Transfer',
    ageDaysStart: 106,
    ageDaysEnd: 112,
    feedDailyGm: 79,
    bodyWeightGm: 1420,
    eggProductionPct: 0,
    waterDailyMl: 175,
    lightingHours: 12,
    feedTypeBn: 'লেয়ার ডেভেলপার ফিড',
    feedTypeEn: 'Layer Developer Feed',
    keyTasksBn: [
      'ডিম পাড়ার খাঁচা বা ঘরে স্থানান্তর সম্পন্ন করুন (ডিম শুরু হওয়ার আগেই স্থানান্তর জরুরি)',
      'স্থানান্তরের পর মাল্টিভিটামিন ও ইলেকট্রোলাইট দিন'
    ],
    keyTasksEn: [
      'Complete transfer to laying cages/nesting pens before onset of lay',
      'Provide anti-stress multivitamins post transfer'
    ],
    isCritical: true
  },

  // Phase 3: Pre-Lay & Point of Lay (Weeks 18 to 20)
  {
    week: 18,
    phaseBn: 'প্রাক-ডিম পাড়া পর্যায়',
    phaseEn: 'Pre-Lay & Point of Lay',
    ageDaysStart: 120,
    ageDaysEnd: 126,
    feedDailyGm: 86,
    bodyWeightGm: 1570,
    eggProductionPct: 4, // 2-5% early eggs
    waterDailyMl: 190,
    lightingHours: 13,
    feedTypeBn: 'প্রি-লে ফিড (উচ্চ ক্যালসিয়াম ২.৫%)',
    feedTypeEn: 'Pre-Lay Feed (High Calcium 2.5%)',
    keyTasksBn: [
      'প্রি-লে ফিড চালু করুন এবং ঝিনুক কুচি (Oyster shell grit) দিন',
      'আলোর সময় প্রতিদিন ১৫-৩০ মিনিট করে বাড়িয়ে ১৩ ঘণ্টায় নিন',
      'প্রথম ডিম আসা শুরু হতে পারে'
    ],
    keyTasksEn: [
      'Introduce pre-lay feed with elevated calcium & limestone grit',
      'Step up light stimulation to 13 hours daily',
      'Onset of first early eggs'
    ],
    isCritical: true
  },
  {
    week: 19,
    phaseBn: 'ডিম পাড়ার সূচনা (১০-২৫%)',
    phaseEn: 'Onset of Lay (10-25%)',
    ageDaysStart: 127,
    ageDaysEnd: 133,
    feedDailyGm: 93,
    bodyWeightGm: 1640,
    eggProductionPct: 20,
    waterDailyMl: 200,
    lightingHours: 14,
    feedTypeBn: 'লেয়ার-১ খাদ্য (লেয়ার ম্যাশ)',
    feedTypeEn: 'Layer-1 Mash Feed (4.0% Ca)',
    keyTasksBn: [
      'লেয়ার-১ সম্পূর্ণ ডিম পাড়ার খাদ্য চালু করুন',
      'আলো বাড়িয়ে ১৪ ঘণ্টা করুন',
      'দৈনিক ডিম সংগ্রহ ও গ্রেডিং শুরু করুন'
    ],
    keyTasksEn: [
      'Switch to complete Layer Phase 1 mash',
      'Increase light to 14 hours',
      'Begin daily egg collection and grading'
    ]
  },
  {
    week: 20,
    phaseBn: 'ডিম উৎপাদন বৃদ্ধি (৫০%+)',
    phaseEn: 'Rapid Lay Ramp-up (50%+)',
    ageDaysStart: 134,
    ageDaysEnd: 140,
    feedDailyGm: 100,
    bodyWeightGm: 1710,
    eggProductionPct: 58,
    waterDailyMl: 215,
    lightingHours: 15,
    feedTypeBn: 'লেয়ার-১ খাদ্য (লেয়ার ম্যাশ)',
    feedTypeEn: 'Layer-1 Mash Feed',
    keyTasksBn: [
      'ডিম উৎপাদন ৫০% অতিক্রম করবে',
      'আলো ১৫ ঘণ্টায় উন্নীত করুন',
      'প্রতিদিন বিকেলে ক্যালসিয়াম গ্রিট বা ঝিনুক গুঁড়া সরবরাহ নিশ্চিত করুন'
    ],
    keyTasksEn: [
      'Flock crosses 50% lay rate',
      'Step up light to 15 hours',
      'Ensure coarse limestone/grit supplementation in afternoon'
    ]
  },

  // Phase 4: Peak Production (Weeks 21 to 40)
  {
    week: 22,
    phaseBn: 'পিক প্রোডাকশন প্রবেশ (৮৮-৯২%)',
    phaseEn: 'Entering Peak Production (90%)',
    ageDaysStart: 148,
    ageDaysEnd: 154,
    feedDailyGm: 110,
    bodyWeightGm: 1820,
    eggProductionPct: 90,
    waterDailyMl: 230,
    lightingHours: 16,
    feedTypeBn: 'লেয়ার-১ প্রোডাকশন ম্যাশ',
    feedTypeEn: 'Layer-1 Peak Production Mash',
    keyTasksBn: [
      'ডিম উৎপাদন ৯০% ছুঁয়ে যাবে',
      'আলো চূড়ান্ত ১৬ ঘণ্টায় স্থির করুন (কখনোই আলো কমাবেন না)',
      'খাবারের পরিভোগ ১১০ গ্রাম নিশ্চিত করুন'
    ],
    keyTasksEn: [
      'Egg production hits 90% benchmark',
      'Fix maximum photoperiod at 16 hours (never decrease light during lay)',
      'Ensure daily intake reaches 110g/bird'
    ],
    isCritical: true
  },
  {
    week: 25,
    phaseBn: 'সর্বোচ্চ পিক প্রোডাকশন (৯৫%)',
    phaseEn: 'Maximum Peak Production (95%)',
    ageDaysStart: 169,
    ageDaysEnd: 175,
    feedDailyGm: 115,
    bodyWeightGm: 1880,
    eggProductionPct: 95,
    waterDailyMl: 240,
    lightingHours: 16,
    feedTypeBn: 'লেয়ার-১ প্রোডাকশন ম্যাশ',
    feedTypeEn: 'Layer-1 Peak Production Mash',
    keyTasksBn: [
      'সর্বোচ্চ পিক ডিম উৎপাদন (প্রতি ১০০০ মুরগিতে ৯৫০+ ডিম দৈনিক)',
      'প্রতিটি মুরগি প্রতিদিন ১১৫ গ্রাম খাবার খাবে (১০০০ মুরগিতে ১১৫ কেজি / ২.৩ বস্তা)',
      'পানির প্রবাহ ও পাইপলাইন নিয়মিত ফ্ল্যাশ করুন'
    ],
    keyTasksEn: [
      'Peak egg production (950+ eggs/day per 1000 hens)',
      'Target daily feed intake: 115g/hen (115 kg / 2.3 bags per 1000 birds)',
      'Maintain fresh, cool drinking water'
    ],
    isCritical: true
  },
  {
    week: 30,
    phaseBn: 'পিক লেয়িং পর্যায় (৯৩%)',
    phaseEn: 'Peak Production Plateau (93%)',
    ageDaysStart: 204,
    ageDaysEnd: 210,
    feedDailyGm: 115,
    bodyWeightGm: 1920,
    eggProductionPct: 93,
    waterDailyMl: 240,
    lightingHours: 16,
    feedTypeBn: 'লেয়ার-১ প্রোডাকশন ম্যাশ',
    feedTypeEn: 'Layer-1 Peak Mash',
    keyTasksBn: [
      'পিক উৎপাদন স্থায়ী রাখতে পুষ্টিগুণ ঠিক রাখুন',
      'ডিমের খোসার মান (Shell quality) পর্যবেক্ষণ করুন'
    ],
    keyTasksEn: [
      'Maintain consistent feed quality to sustain peak plateau',
      'Monitor eggshell breaking strength'
    ]
  },
  {
    week: 40,
    phaseBn: 'পিক পরবর্তী পর্যায় (৮৯%)',
    phaseEn: 'Post-Peak Production (89%)',
    ageDaysStart: 274,
    ageDaysEnd: 280,
    feedDailyGm: 115,
    bodyWeightGm: 1960,
    eggProductionPct: 89,
    waterDailyMl: 240,
    lightingHours: 16,
    feedTypeBn: 'লেয়ার-২ খাদ্য (লেয়ার ম্যাশ)',
    feedTypeEn: 'Layer-2 Mash Feed',
    keyTasksBn: [
      'লেয়ার-২ খাদ্যে রূপান্তর করুন',
      'ক্যালসিয়াম শোষণ বাড়াতে ভিটামিন ডি-৩ নিশ্চিত করুন'
    ],
    keyTasksEn: [
      'Transition to Layer Phase 2 formulation',
      'Supplement Vitamin D3 for shell integrity'
    ]
  },

  // Phase 5: Sustained Laying Phase (Weeks 41 to 72+)
  {
    week: 50,
    phaseBn: 'নিয়মিত লেয়িং পর্যায় (৮৫%)',
    phaseEn: 'Sustained Production (85%)',
    ageDaysStart: 344,
    ageDaysEnd: 350,
    feedDailyGm: 116,
    bodyWeightGm: 1990,
    eggProductionPct: 85,
    waterDailyMl: 245,
    lightingHours: 16,
    feedTypeBn: 'লেয়ার-২ খাদ্য',
    feedTypeEn: 'Layer-2 Mash Feed',
    keyTasksBn: [
      'ডিম উৎপাদন ৮৫% এ বজায় রাখা',
      'অনুৎপাদনশীল মুরগি চিহ্নিত (Culling) করুন'
    ],
    keyTasksEn: [
      'Sustain 85% lay rate',
      'Identify and cull unproductive birds'
    ]
  },
  {
    week: 60,
    phaseBn: 'নিয়মিত লেয়িং পর্যায় (৮১%)',
    phaseEn: 'Late Laying Phase (81%)',
    ageDaysStart: 414,
    ageDaysEnd: 420,
    feedDailyGm: 116,
    bodyWeightGm: 2010,
    eggProductionPct: 81,
    waterDailyMl: 245,
    lightingHours: 16,
    feedTypeBn: 'লেয়ার-২ খাদ্য',
    feedTypeEn: 'Layer-2 Mash Feed',
    keyTasksBn: [
      'ডিমের খোসার পুরুত্ব বজায় রাখতে বাড়তি ক্যালসিয়াম দিন',
      'খাবারের অপচয় রোধে ফিডার লেভেল নিয়ন্ত্রণ করুন'
    ],
    keyTasksEn: [
      'Supplement extra coarse limestone for eggshell quality',
      'Control feeder depth to avoid feed wastage'
    ]
  },
  {
    week: 72,
    phaseBn: 'চূড়ান্ত চক্র সমাপ্তি বা মোল্টিং (৭৫%)',
    phaseEn: 'Flock Completion / Molting (75%)',
    ageDaysStart: 498,
    ageDaysEnd: 504,
    feedDailyGm: 116,
    bodyWeightGm: 2040,
    eggProductionPct: 75,
    waterDailyMl: 245,
    lightingHours: 16,
    feedTypeBn: 'লেয়ার-২ খাদ্য',
    feedTypeEn: 'Layer-2 Mash Feed',
    keyTasksBn: [
      'ফ্লকের ডিম বিক্রির লাভ-ক্ষতি পর্যালোচনা',
      'বয়োবৃদ্ধ মুরগি (Spent hen) মাংসের বাজারে বিক্রয় অথবা মোল্টিং সিদ্ধান্ত'
    ],
    keyTasksEn: [
      'Flock lifetime profitability evaluation',
      'Depopulate spent hens for meat market or induce molting'
    ],
    isCritical: true
  }
];

export function getLayerSopForAge(ageDays: number): LayerWeeklySopItem {
  const boundedDays = Math.max(1, Math.round(ageDays));
  const week = Math.max(1, Math.ceil(boundedDays / 7));
  
  // Find closest or matching week
  const exact = LAYER_SOP_SCHEDULE.find(s => s.week === week);
  if (exact) return exact;
  
  // Find highest item whose week <= current week
  let best = LAYER_SOP_SCHEDULE[0];
  for (const item of LAYER_SOP_SCHEDULE) {
    if (item.week <= week) {
      best = item;
    } else {
      break;
    }
  }
  return best;
}
