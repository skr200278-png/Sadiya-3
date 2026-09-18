// Commercial Cattle (Livestock) Feeding & Growth Standards for Bangladesh
// Grounded in Bangladesh Livestock Research Institute (BLRI) & Department of Livestock Services (DLS)

export interface CattleDietPlan {
  stageId: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  concentrateDailyKgPerHead: number; // দানাদার খাবার (কেজি / মাথা / দিন)
  greenGrassKgPerHead: number; // কাঁচা ঘাস (কেজি / মাথা / দিন)
  dryStrawKgPerHead: number; // শুকনো খড় (কেজি / মাথা / দিন)
  waterLitersPerHead: number; // পানি (লিটার / মাথা / দিন)
  expectedOutcomeBn: string;
  expectedOutcomeEn: string;
  feedCompositionBn: string[];
  keyTasksBn: string[];
}

export const DAIRY_COW_SCHEDULE: CattleDietPlan[] = [
  {
    stageId: 'dairy_low',
    titleBn: 'ডেইরি গাভী (৫ লিটার দুধ উৎপাদন)',
    titleEn: 'Dairy Cow (5 Liters Milk/day)',
    descriptionBn: 'শরীর রক্ষা ও ৫ লিটার দুধ উৎপাদনের দৈনিক খাদ্য রুটিন',
    descriptionEn: 'Maintenance + 5L milk production daily ration',
    concentrateDailyKgPerHead: 4.0,
    greenGrassKgPerHead: 20,
    dryStrawKgPerHead: 4,
    waterLitersPerHead: 50,
    expectedOutcomeBn: 'দৈনিক ৫ লিটার দুধ ও স্বাস্থ্য সুরক্ষা',
    expectedOutcomeEn: '5L daily milk yield & good body condition score',
    feedCompositionBn: [
      'গমের ভুসি: ১.৫ কেজি',
      'ভুট্টা ভাঙা: ১.২ কেজি',
      'সরিষার খৈল: ০.৮ কেজি',
      'সয়াবিন মিল / ডাল ভুসি: ০.৪ কেজি',
      'ডিসিআই / লবণ / মিনারেল প্রিমিক্স: ১০০ গ্রাম'
    ],
    keyTasksBn: [
      'সকাল ও বিকেলে নির্দিষ্ট সময়ে দুধ দোহন করুন',
      'দুধ দোয়ানোর পর অন্তত ৩০ মিনিট গাভীকে দাঁড় করিয়ে রাখুন',
      '২৪ ঘণ্টা পরিষ্কার সুপেয় পানি সহজলভ্য রাখুন'
    ]
  },
  {
    stageId: 'dairy_medium',
    titleBn: 'উচ্চ উৎপাদনশীল গাভী (১০ লিটার দুধ)',
    titleEn: 'High Yield Dairy Cow (10 Liters Milk/day)',
    descriptionBn: '১০ লিটার দুধ প্রদানকারী গাভীর সুষম দানাদার ও সাইলেজ রুটিন',
    descriptionEn: '10L milk yield balanced ration with silage/green fodder',
    concentrateDailyKgPerHead: 5.8,
    greenGrassKgPerHead: 25,
    dryStrawKgPerHead: 4,
    waterLitersPerHead: 70,
    expectedOutcomeBn: 'দৈনিক ১০ লিটার দুধ ও ফ্যাট শতাংশ সঠিক রাখা',
    expectedOutcomeEn: '10L daily milk yield with balanced milk fat %',
    feedCompositionBn: [
      'গমের ভুসি: ২.০ কেজি',
      'ভুট্টা ভাঙা: ১.৮ কেজি',
      'সরিষার খৈল: ১.০ কেজি',
      'সয়াবিন মিল: ০.৭ কেজি',
      'খনিজ লবণ ও সোডিয়াম বাইকার্বনেট: ৩০০ গ্রাম'
    ],
    keyTasksBn: [
      'কাঁচা ঘাস কেটে টুকরো করে দানাদার খাদ্যের সাথে মেশান',
      'ওলান প্রদাহ (Mastitis) প্রতিরোধে টিট-ডিপ সলিউশন ব্যবহার করুন',
      'প্রতি ৩ মাস পর পর কৃমিনাশক ও খুর ছাঁটাই করুন'
    ]
  },
  {
    stageId: 'dairy_high',
    titleBn: 'শাহিওয়াল / ফ্রিজিয়ান গাভী (১৫+ লিটার দুধ)',
    titleEn: 'Commercial Elite Dairy (15+ Liters Milk/day)',
    descriptionBn: 'উচ্চ দুধ উৎপাদনকারী ক্রস গাভীর প্রিমিয়াম নিউট্রিশন',
    descriptionEn: 'High yielding commercial Holstein/Sahiwal cross ration',
    concentrateDailyKgPerHead: 7.5,
    greenGrassKgPerHead: 30,
    dryStrawKgPerHead: 3,
    waterLitersPerHead: 90,
    expectedOutcomeBn: 'দৈনিক ১৫+ লিটার দুধ ও বাছুর প্রসবের সুস্থতা',
    expectedOutcomeEn: '15L+ daily milk yield with high lactation peak',
    feedCompositionBn: [
      'গমের ভুসি: ২.৫ কেজি',
      'ভুট্টা গুঁড়া: ২.২ কেজি',
      'সয়াবিন মিল / প্রোটিন কনসেনট্রেট: ১.৫ কেজি',
      'সরিষার খৈল: ১.০ কেজি',
      'ক্যালসিয়াম জেল, বাইপাস ফ্যাট ও বাফার: ৩০০ গ্রাম'
    ],
    keyTasksBn: [
      'খাবার দিনে ৩ বারে ভাগ করে খেতে দিন',
      'দুধের ফ্যাট ঠিক রাখতে ইউএমবি (UMB) বা সাইলেজ সরবরাহ করুন',
      'গরমে ফ্যান বা স্প্রিংকলার দিয়ে গাভীর শরীর ঠান্ডা রাখুন'
    ]
  }
];

export const BEEF_FATTENING_SCHEDULE: CattleDietPlan[] = [
  {
    stageId: 'fattening_month_1',
    titleBn: 'ষাঁড় মোটাতাজাকরণ: ১ম মাস (Day 1-30)',
    titleEn: 'Beef Fattening: Month 1 (Day 1-30)',
    descriptionBn: 'খামারে আগমনের পর কৃমিনাশক, লিভার টনিক ও খাপ খাওয়ানো রুটিন',
    descriptionEn: 'Arrival, deworming, adaptation & rumen adjustment',
    concentrateDailyKgPerHead: 2.8,
    greenGrassKgPerHead: 15,
    dryStrawKgPerHead: 4,
    waterLitersPerHead: 40,
    expectedOutcomeBn: 'দৈনিক ৭০০-৮০০ গ্রাম ওজন বৃদ্ধি ও রুচি বৃদ্ধি',
    expectedOutcomeEn: '700-800g daily weight gain & optimal rumen adaptation',
    feedCompositionBn: [
      'গমের ভুসি: ১.২ কেজি',
      'ভুট্টা ভাঙা: ০.৮ কেজি',
      'খৈল: ০.৫ কেজি',
      'রাইস পলিশ: ০.৩ কেজি',
      'খনিজ লবণ ও ডিসিপি: ৫০ গ্রাম'
    ],
    keyTasksBn: [
      'খামারে আনার পর ব্রড-স্পেকট্রাম কৃমিনাশক (Fascioliasis & Nematodes) প্রয়োগ',
      'তড়কা (Anthrax), বাদলা (BQ) ও ক্ষুরা (FMD) ভ্যাকসিন সম্পন্ন করুন',
      'হঠাৎ বেশি দানাদার খাবার না দিয়ে ধীরে ধীরে পরিমাণ বাড়ান'
    ]
  },
  {
    stageId: 'fattening_month_2',
    titleBn: 'ষাঁড় মোটাতাজাকরণ: ২য় মাস (Day 31-60)',
    titleEn: 'Beef Fattening: Month 2 (Day 31-60)',
    descriptionBn: 'মাংসপেশি গঠন ও দ্রুত শারীরিক ওজন বৃদ্ধি পর্যায়',
    descriptionEn: 'Active muscle building and accelerated growth phase',
    concentrateDailyKgPerHead: 3.8,
    greenGrassKgPerHead: 18,
    dryStrawKgPerHead: 3.5,
    waterLitersPerHead: 50,
    expectedOutcomeBn: 'দৈনিক ১,০০০ গ্রাম (১ কেজি) ওজন বৃদ্ধি',
    expectedOutcomeEn: '1,000g (1 kg) daily live weight gain',
    feedCompositionBn: [
      'ভুট্টা ভাঙা (উচ্চ শক্তি): ১.৫ কেজি',
      'গমের ভুসি: ১.৩ কেজি',
      'সরিষার খৈল / তিলের খৈল: ০.৬ কেজি',
      'সয়াবিন মিল / খেসারি ভাঙা: ০.৩ কেজি',
      'ইউরিয়া মোলাসেস স্ট্র (UMS) ও লবণ: ১০০ গ্রাম'
    ],
    keyTasksBn: [
      'ইউএমএস (UMS) বা চিটাগুড় মাখানো খড় খাওয়ালে হজমশক্তি বহুগুণ বাড়ে',
      'প্রতি ১৫ দিন পর পর ওজন মেপে বৃদ্ধির হার রেকর্ড করুন',
      'গোসল করিয়ে চামড়া পরিষ্কার ও পরজীবী মুক্ত রাখুন'
    ]
  },
  {
    stageId: 'fattening_month_3',
    titleBn: 'ষাঁড় মোটাতাজাকরণ: ৩য় মাস (Day 61-90/100)',
    titleEn: 'Beef Fattening: Month 3 (Day 61-90/100)',
    descriptionBn: 'চূড়ান্ত ফিনিশিং ও চকচকে স্বাস্থ্য নিশ্চিতকরণ পর্যায়',
    descriptionEn: 'Final finishing, marbling and market sale readiness',
    concentrateDailyKgPerHead: 4.8,
    greenGrassKgPerHead: 20,
    dryStrawKgPerHead: 3,
    waterLitersPerHead: 60,
    expectedOutcomeBn: 'দৈনিক ১,২০০ গ্রাম ওজন বৃদ্ধি ও হাটে বিক্রির উপযোগী',
    expectedOutcomeEn: '1,200g daily gain & premium market finish',
    feedCompositionBn: [
      'ভুট্টা ভাঙা: ২.০ কেজি',
      'গমের ভুসি: ১.৪ কেজি',
      'সয়াবিন মিল: ০.৮ কেজি',
      'খৈল: ০.৫ কেজি',
      'ক্যালসিয়াম, বায়োটিন ও ভিটামিন এডি৩ই: ১০০ গ্রাম'
    ],
    keyTasksBn: [
      'পশু বিক্রয়ের আগে দাঁত, ওজন ও স্বাস্থ্য পর্যবেক্ষণ',
      'কোরবানি বা মাংসের হাটে বিক্রির লক্ষ্যমাত্রা চূড়ান্ত করা'
    ]
  }
];
