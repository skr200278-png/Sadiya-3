import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Syringe, 
  ChevronRight, 
  Layers, 
  Droplet,
  Info,
  Pill,
  BookOpen,
  HelpCircle,
  Check,
  Flame,
  FileText,
  Filter,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export interface VaccineItem {
  id: string;
  targetDayMin: number;
  targetDayMax: number;
  name: string;
  category: 'vaccine' | 'medicine' | 'supplement';
  route: string;
  purpose: string;
  notes?: string;
  farmType: 'poultry' | 'cattle' | 'fish';
  subBreed?: string;
  isHatcheryGiven?: boolean;
}

export interface PopularMedicine {
  name: string;
  type: 'medicine' | 'vaccine' | 'supplement';
  generic: string;
  indication: string;
  popularBrands: string;
  targetCategory: 'broiler' | 'poultry' | 'cattle' | 'duck' | 'fish' | 'all';
  dosageTip: string;
}

// -------------------------------------------------------------
// 1. BROILER (ব্রয়লার মুরগি - ৩০-৩৫ দিন) - আধুনিক বাস্তবসম্মত শিডিউল
// (ব্রয়লারে কোনো ইনজেকশন নেই! সব পানি/ড্রপে এবং হ্যাচারি মারেক্স)
// -------------------------------------------------------------
export const SCHEDULE_BROILER: VaccineItem[] = [
  {
    id: 'br_mareks',
    targetDayMin: 0,
    targetDayMax: 1,
    name: 'মারেক্স ভ্যাকসিন (Marek\'s - হ্যাচারিতে সম্পন্ন)',
    category: 'vaccine',
    route: 'হ্যাচারিতে জন্মের পরই দেওয়া থাকে',
    purpose: 'মারেক্স ও টিউমার রোগ প্রতিরোধ (খামারে দেওয়া লাগে না)',
    notes: 'বাচ্চা ডেলিভারির আগেই হ্যাচারিতে অটোমেটিক সম্পন্ন করা হয়। খামারিকে ইনজেকশন দিতে হয় না।',
    farmType: 'poultry',
    subBreed: 'broiler',
    isHatcheryGiven: true
  },
  {
    id: 'br_brooding_med',
    targetDayMin: 1,
    targetDayMax: 3,
    name: 'গ্লুকোজ + ভিটামিন সি + ব্রুডিং অ্যান্টিবায়োটিক (রেনামক্স / কসমিক্স / ডক্সিসিন)',
    category: 'medicine',
    route: 'খাবার পানির সাথে',
    purpose: 'জার্নির ধকল দূরীকরণ, নাভি শুকানো এবং ব্যাকটেরিয়াল সংক্রমণ রোধ',
    notes: 'প্রথম দিন গ্লুকোজ ও ভিটামিন সি, ২য় ও ৩য় দিন অ্যান্টিবায়োটিক ব্রুডিং ডোজ।',
    farmType: 'poultry',
    subBreed: 'broiler'
  },
  {
    id: 'br_nd_ib',
    targetDayMin: 4,
    targetDayMax: 5,
    name: 'রানীক্ষেত + আইবি (ND+IB Live Clone 30 / Ma5)',
    category: 'vaccine',
    route: 'চোখে ১ ফোঁটা ড্রপ অথবা পরিষ্কার খাবার পানিতে',
    purpose: 'রানীক্ষেত ও সংক্রামক ব্রঙ্কাইটিস রোগ প্রতিরোধ',
    notes: 'সকালে ঠান্ডা আবহাওয়া বা ঠান্ডা পানিতে স্কিমড মিল্ক মিশিয়ে প্রয়োগ করুন। কোনো ইনজেকশন নয়।',
    farmType: 'poultry',
    subBreed: 'broiler'
  },
  {
    id: 'br_b_complex',
    targetDayMin: 6,
    targetDayMax: 8,
    name: 'ভিটামিন বি-কমপ্লেক্স ও প্রোবায়োটিক (B-Complex + Probiotic)',
    category: 'supplement',
    route: 'খাবার পানির সাথে',
    purpose: 'হজম শক্তি বৃদ্ধি, খাদ্যের অপচয় রোধ ও এফসিআর (FCR) ভালো রাখা',
    notes: 'ভ্যাকসিনের ধকল কমাতে এবং হজমে উপকারী ব্যাকটেরিয়া তৈরিতে সাহায্য করে।',
    farmType: 'poultry',
    subBreed: 'broiler'
  },
  {
    id: 'br_gumboro_1',
    targetDayMin: 9,
    targetDayMax: 11,
    name: 'গামবোরো ১ম ডোজ (IBD Intermediate Plus / 228E)',
    category: 'vaccine',
    route: 'খাওয়ার পরিষ্কার ঠান্ডা পানিতে (কোনো ইনজেকশন নয়)',
    purpose: 'মারাত্মক গামবোরো রোগ ও ঝাঁকে ঝাঁকে মৃত্যু প্রতিরোধ',
    notes: 'ভ্যাকসিন দেওয়ার ২ ঘণ্টা আগে পানির পাত্র শুকিয়ে পিপাসিত রাখুন যেন ২ ঘণ্টার মধ্যে সবাই পান করে।',
    farmType: 'poultry',
    subBreed: 'broiler'
  },
  {
    id: 'br_liver_tonic',
    targetDayMin: 12,
    targetDayMax: 15,
    name: 'লিভার টনিক ও এনজাইম (হেপাটোটেক / লিভাপেক্স / হেপাটোকেয়ার)',
    category: 'supplement',
    route: 'খাবার পানির সাথে',
    purpose: 'লিভার সুরক্ষা, হজম শক্তি বৃদ্ধি ও টক্সিন মুক্তকরণ',
    notes: 'অতিরিক্ত দানাদার ফিড দ্রুত হজমে সাহায্য করে এবং পেটে পানি জমা রোধ করে।',
    farmType: 'poultry',
    subBreed: 'broiler'
  },
  {
    id: 'br_gumboro_2',
    targetDayMin: 16,
    targetDayMax: 18,
    name: 'গামবোরো ২য় বুস্টার ডোজ (IBD Booster)',
    category: 'vaccine',
    route: 'খাওয়ার পরিষ্কার ঠান্ডা পানিতে',
    purpose: 'গামবোরো রোগের পূর্ণাঙ্গ প্রতিরোধ ক্ষমতা নিশ্চিতকরণ',
    notes: 'ক্লোরিনমুক্ত সাধারণ নলকূপের পানিতে স্কিমড মিল্ক মিশিয়ে প্রয়োগ করুন।',
    farmType: 'poultry',
    subBreed: 'broiler'
  },
  {
    id: 'br_coccidiosis',
    targetDayMin: 19,
    targetDayMax: 22,
    name: 'কক্সিডিওসিস সতর্কতা (রক্ত আমাশয় রোধক - টলট্রাজুরিল / এসবিএ৩ / কক্সিকিউর)',
    category: 'medicine',
    route: 'খাবার পানির সাথে (প্রয়োজনে ২-৩ দিন)',
    purpose: 'রক্ত আমাশয়, কক্সিডিওসিস এবং লিটার ভেজা রোগ নিরাময়',
    notes: 'লিটার ভিজা থাকলে বা পায়খানা লালচে দেখলে দ্রুত প্রয়োগ করুন।',
    farmType: 'poultry',
    subBreed: 'broiler'
  },
  {
    id: 'br_nd_lasota',
    targetDayMin: 21,
    targetDayMax: 24,
    name: 'রানীক্ষেত লাসোটা বুস্টার (ND Lasota Booster)',
    category: 'vaccine',
    route: 'খাওয়ার পরিষ্কার পানিতে',
    purpose: 'বিক্রির আগ পর্যন্ত রানীক্ষেত রোগের সম্পূর্ণ নিরাপত্তা',
    notes: 'খাবার পানিতে স্কিমড মিল্ক মিশিয়ে প্রয়োগ। কোনো ইনজেকশন নয়।',
    farmType: 'poultry',
    subBreed: 'broiler'
  },
  {
    id: 'br_calcium',
    targetDayMin: 24,
    targetDayMax: 28,
    name: 'ক্যালসিয়াম ও ভিটামিন ডি৩ (ক্যালপ্লেক্স / ক্যালসি-ডি)',
    category: 'supplement',
    route: 'খাবার পানির সাথে',
    purpose: 'দ্রুত মাংস বৃদ্ধির সাথে পায়ের হাড় মজবুত করা ও প্যারালাইসিস রোধ',
    notes: 'পায়ের দুর্বলতা ও খামারে খোঁড়া হওয়া প্রতিরোধে অত্যন্ত ফলপ্রসূ।',
    farmType: 'poultry',
    subBreed: 'broiler'
  },
  {
    id: 'br_finisher_growth',
    targetDayMin: 29,
    targetDayMax: 33,
    name: 'গ্রোথ প্রমোটার ও টক্সিন বাইন্ডার (অ্যামিনো এসিড / ভিটামিন ই-সেলেনিয়াম)',
    category: 'supplement',
    route: 'খাবার পানির সাথে',
    purpose: 'সর্বোচ্চ ফিনিশার ওজন বৃদ্ধি ও সুন্দর চকচকে পালক নিশ্চিত করা',
    notes: 'বিক্রির আগে মুরগির স্বাস্থ্য ও আকর্ষণীয় শারীরিক গঠন তৈরিতে সাহায্য করে।',
    farmType: 'poultry',
    subBreed: 'broiler'
  }
];

// -------------------------------------------------------------
// 2. SONALI (সোনালী মুরগি - ৬০-৭০ দিন)
// -------------------------------------------------------------
export const SCHEDULE_SONALI: VaccineItem[] = [
  {
    id: 'sn_brooding',
    targetDayMin: 1,
    targetDayMax: 3,
    name: 'গ্লুকোজ + ভিটামিন সি + সেফটি ব্রুডিং অ্যান্টিবায়োটিক',
    category: 'medicine',
    route: 'খাবার পানির সাথে',
    purpose: 'জার্নির ধকল দূর ও নাভি শুকানো',
    farmType: 'poultry',
    subBreed: 'sonali'
  },
  {
    id: 'sn_nd_clone',
    targetDayMin: 4,
    targetDayMax: 5,
    name: 'রানীক্ষেত ও আইবি (Clone 30 / Ma5)',
    category: 'vaccine',
    route: 'চোখে ১ ফোঁটা ড্রপ',
    purpose: 'রানীক্ষেত ও ব্রঙ্কাইটিস প্রতিরোধ',
    farmType: 'poultry',
    subBreed: 'sonali'
  },
  {
    id: 'sn_b_comp',
    targetDayMin: 7,
    targetDayMax: 9,
    name: 'ভিটামিন বি-কমপ্লেক্স ও মাল্টিভিটামিন',
    category: 'supplement',
    route: 'পানিতে',
    purpose: 'হজম শক্তি ও রুচি বৃদ্ধি',
    farmType: 'poultry',
    subBreed: 'sonali'
  },
  {
    id: 'sn_gumboro_1',
    targetDayMin: 10,
    targetDayMax: 12,
    name: 'গামবোরো ১ম ডোজ (IBD Live)',
    category: 'vaccine',
    route: 'খাবার পানিতে',
    purpose: 'মারাত্মক গামবোরো রোগ প্রতিরোধ',
    farmType: 'poultry',
    subBreed: 'sonali'
  },
  {
    id: 'sn_gumboro_2',
    targetDayMin: 17,
    targetDayMax: 19,
    name: 'গামবোরো বুস্টার ডোজ (IBD Booster)',
    category: 'vaccine',
    route: 'খাবার পানিতে',
    purpose: 'গামবোরোর পূর্ণাঙ্গ প্রতিরোধ',
    farmType: 'poultry',
    subBreed: 'sonali'
  },
  {
    id: 'sn_lasota',
    targetDayMin: 21,
    targetDayMax: 24,
    name: 'রানীক্ষেত লাসোটা বুস্টার',
    category: 'vaccine',
    route: 'খাবার পানিতে',
    purpose: 'রানীক্ষেত রোগ সুরক্ষা',
    farmType: 'poultry',
    subBreed: 'sonali'
  },
  {
    id: 'sn_pox',
    targetDayMin: 35,
    targetDayMax: 40,
    name: 'ফাউল পক্স (Fowl Pox - গুটি বসন্ত)',
    category: 'vaccine',
    route: 'ডানার চামড়ায় সুচ ফোটানো (Wing Web)',
    purpose: 'পক্স বা গুটি বসন্ত রোগ প্রতিরোধ',
    notes: 'সোনালী মুরগিতে গুটি বসন্ত হওয়া খুব সাধারণ, তাই এটি জরুরি।',
    farmType: 'poultry',
    subBreed: 'sonali'
  },
  {
    id: 'sn_deworm',
    targetDayMin: 45,
    targetDayMax: 48,
    name: 'কৃমিনাশক কোর্স (Deworming Drench)',
    category: 'medicine',
    route: 'খাবার পানিতে',
    purpose: 'পেটের কৃমি ধ্বংস ও পুষ্টি শোষণ বৃদ্ধি',
    notes: 'সকালে খালি পেটে পানিতে মিশিয়ে দিতে হবে।',
    farmType: 'poultry',
    subBreed: 'sonali'
  },
  {
    id: 'sn_liver_cal',
    targetDayMin: 50,
    targetDayMax: 55,
    name: 'লিভার টনিক ও ক্যালসিয়াম-ডি৩',
    category: 'supplement',
    route: 'খাবার পানিতে',
    purpose: 'কৃমিনাশকের পর লিভার সতেজ রাখা ও হাড় শক্ত করা',
    farmType: 'poultry',
    subBreed: 'sonali'
  }
];

// -------------------------------------------------------------
// 3. LAYER (লেয়ার মুরগি - ডিম উৎপাদনকারী)
// -------------------------------------------------------------
export const SCHEDULE_LAYER: VaccineItem[] = [
  {
    id: 'ly_nd_clone',
    targetDayMin: 4,
    targetDayMax: 5,
    name: 'রানীক্ষেত ও আইবি (Clone 30 - চোখে ড্রপ)',
    category: 'vaccine',
    route: 'চোখে ১ ফোঁটা ড্রপ',
    purpose: 'রানীক্ষেত ও ব্রঙ্কাইটিস প্রতিরোধ',
    farmType: 'poultry',
    subBreed: 'layer'
  },
  {
    id: 'ly_gumboro_1',
    targetDayMin: 10,
    targetDayMax: 12,
    name: 'গামবোরো ১ম ডোজ (পানিতে)',
    category: 'vaccine',
    route: 'খাবার পানিতে',
    purpose: 'গামবোরো প্রতিরোধ',
    farmType: 'poultry',
    subBreed: 'layer'
  },
  {
    id: 'ly_gumboro_2',
    targetDayMin: 17,
    targetDayMax: 19,
    name: 'গামবোরো ২য় ডোজ',
    category: 'vaccine',
    route: 'পানিতে',
    purpose: 'গামবোরো সুরক্ষা',
    farmType: 'poultry',
    subBreed: 'layer'
  },
  {
    id: 'ly_lasota',
    targetDayMin: 21,
    targetDayMax: 24,
    name: 'রানীক্ষেত লাসোটা বুস্টার',
    category: 'vaccine',
    route: 'পানিতে',
    purpose: 'রানীক্ষেত সুরক্ষা',
    farmType: 'poultry',
    subBreed: 'layer'
  },
  {
    id: 'ly_pox',
    targetDayMin: 35,
    targetDayMax: 40,
    name: 'ফাউল পক্স (উইং ওয়েব)',
    category: 'vaccine',
    route: 'ডানায় সুচ ফুটিয়ে',
    purpose: 'গুটি বসন্ত প্রতিরোধ',
    farmType: 'poultry',
    subBreed: 'layer'
  },
  {
    id: 'ly_deworm_1',
    targetDayMin: 50,
    targetDayMax: 55,
    name: 'কৃমিনাশক ১ম কোর্স',
    category: 'medicine',
    route: 'খাবার পানিতে',
    purpose: 'কৃমি ধ্বংস',
    farmType: 'poultry',
    subBreed: 'layer'
  },
  {
    id: 'ly_calcium_routine',
    targetDayMin: 120,
    targetDayMax: 130,
    name: 'ক্যালসিয়াম, ফসফরাস ও ভিটামিন এডি৩ই (ডিম উৎপাদন পর্ব)',
    category: 'supplement',
    route: 'খাবার ও পানিতে নিয়মিত',
    purpose: 'ডিমের খোসা শক্ত রাখা ও নিয়মিত বেশি ডিম পাওয়া',
    notes: '১৮-২০ সপ্তাহ থেকে ডিম পাড়ার পুরো সময় নিয়মিত ক্যালসিয়াম প্রিমিক্স দিতে হবে।',
    farmType: 'poultry',
    subBreed: 'layer'
  }
];

// -------------------------------------------------------------
// 4. DUCK (হাঁস পালন - হাঁসের সঠিক ও আলাদা চিকিৎসা)
// (হাঁসে মুরগির রানীক্ষেত/গামবোরো হয় না! হাঁসে ডাক প্লেগ ও কলেরা প্রধান)
// -------------------------------------------------------------
export const SCHEDULE_DUCK: VaccineItem[] = [
  {
    id: 'dk_brood',
    targetDayMin: 1,
    targetDayMax: 3,
    name: 'গ্লুকোজ + ভিটামিন সি + ইলেকট্রোলাইট',
    category: 'supplement',
    route: 'খাবার পানির সাথে',
    purpose: 'বাচ্চার ধকল দূরীকরণ ও দ্রুত সতেজতা',
    farmType: 'poultry',
    subBreed: 'duck'
  },
  {
    id: 'dk_b_comp',
    targetDayMin: 7,
    targetDayMax: 10,
    name: 'ভিটামিন বি-কমপ্লেক্স ও মাল্টিভিটামিন',
    category: 'supplement',
    route: 'পানিতে',
    purpose: 'হাঁসের দ্রুত বৃদ্ধি ও পা শক্ত করা',
    farmType: 'poultry',
    subBreed: 'duck'
  },
  {
    id: 'dk_deworm_1',
    targetDayMin: 15,
    targetDayMax: 18,
    name: 'হাঁসের প্রাথমিক কৃমিনাশক',
    category: 'medicine',
    route: 'খাবার পানিতে',
    purpose: 'পেটের কৃমি দমন ও ক্ষুধা বৃদ্ধি',
    farmType: 'poultry',
    subBreed: 'duck'
  },
  {
    id: 'dk_plague_1',
    targetDayMin: 21,
    targetDayMax: 25,
    name: 'ডাক প্লেগ ভ্যাকসিন ১ম ডোজ (Duck Plague Vaccine)',
    category: 'vaccine',
    route: 'চামড়ার নিচে ইনজেকশন (S/C - ১ মিলি)',
    purpose: 'হাঁসের সবচেয়ে মরণঘাতী ডাক প্লেগ রোগ প্রতিরোধ',
    notes: 'হাঁসের জন্য এটি সবচেয়ে জরুরি টিকা। মুরগির কোনো টিকা হাঁসে কাজ করে না।',
    farmType: 'poultry',
    subBreed: 'duck'
  },
  {
    id: 'dk_cholera_1',
    targetDayMin: 40,
    targetDayMax: 45,
    name: 'ডাক কলেরা ভ্যাকসিন (Duck Cholera Vaccine)',
    category: 'vaccine',
    route: 'বুকের মাংসে ইনজেকশন (I/M - ১ মিলি)',
    purpose: 'হাঁসের হঠাৎ মৃত্যু, সবুজ পায়খানা ও কলেরা রোগ প্রতিরোধ',
    notes: 'সরকারি উপজেলা প্রাণিসম্পদ হাসপাতাল বা বিশ্বস্ত ভেট ডিলার থেকে সংগ্রহ করুন।',
    farmType: 'poultry',
    subBreed: 'duck'
  },
  {
    id: 'dk_plague_booster',
    targetDayMin: 60,
    targetDayMax: 65,
    name: 'ডাক প্লেগ বুস্টার ডোজ (Duck Plague Booster)',
    category: 'vaccine',
    route: 'চামড়ার নিচে ইনজেকশন',
    purpose: 'ডাক প্লেগ রোগের দীর্ঘমেয়াদী পূর্ণ প্রতিরোধ',
    farmType: 'poultry',
    subBreed: 'duck'
  },
  {
    id: 'dk_calcium_egg',
    targetDayMin: 90,
    targetDayMax: 120,
    name: 'ক্যালসিয়াম ও ভিটামিন এডি৩ই (ডিম ও প্রজনন)',
    category: 'supplement',
    route: 'খাবারের সাথে মিশিয়ে',
    purpose: 'হাঁসের ডিম উৎপাদন ও হাড় মজবুত রাখা',
    farmType: 'poultry',
    subBreed: 'duck'
  }
];

// -------------------------------------------------------------
// 5. QUAIL (কোয়েল পাখি)
// -------------------------------------------------------------
export const SCHEDULE_QUAIL: VaccineItem[] = [
  {
    id: 'ql_brood',
    targetDayMin: 1,
    targetDayMax: 3,
    name: 'গ্লুকোজ + ভিটামিন সি (ধকল দূরীকরণ)',
    category: 'supplement',
    route: 'খাবার পানিতে',
    purpose: 'কোয়েলের বাচ্চা অত্যন্ত ছোট হওয়ায় প্রাথমিক ধকল ও পানিশূন্যতা রোধ',
    farmType: 'poultry',
    subBreed: 'quail'
  },
  {
    id: 'ql_bcomp',
    targetDayMin: 5,
    targetDayMax: 8,
    name: 'ভিটামিন বি-কমপ্লেক্স ও ইলেক্ট্রোলাইট',
    category: 'supplement',
    route: 'পানিতে',
    purpose: 'হজম বৃদ্ধি ও পায়ের শক্তি বৃদ্ধি',
    farmType: 'poultry',
    subBreed: 'quail'
  },
  {
    id: 'ql_calcium',
    targetDayMin: 15,
    targetDayMax: 20,
    name: 'ক্যালসিয়াম ও ভিটামিন এডি৩ই',
    category: 'supplement',
    route: 'পানিতে',
    purpose: 'দ্রুত বৃদ্ধি ও মাত্র ৪০-৪৫ দিনেই ডিম পাড়ার জন্য হাড় গঠন',
    notes: 'কোয়েল পাখির সাধারণত বড় কোনো ভ্যাকসিন লাগে না, ভিটামিন ও ক্যালসিয়ামেই সুস্থ থাকে।',
    farmType: 'poultry',
    subBreed: 'quail'
  }
];

// -------------------------------------------------------------
// 6. DAIRY CATTLE (ডেইরি গাভী - দুধের গরু)
// -------------------------------------------------------------
export const SCHEDULE_DAIRY: VaccineItem[] = [
  {
    id: 'dy_deworm',
    targetDayMin: 1,
    targetDayMax: 7,
    name: 'নিয়মিত কৃমিনাশক বোলাস (Endex / Renaflook / Albendazole)',
    category: 'medicine',
    route: 'সকালে খালি পেটে মুখে খাওয়ানো',
    purpose: 'কলিজা কৃমি, ফিতা কৃমি ও পেট কৃমি ধ্বংস করে দুধ বৃদ্ধি',
    notes: 'প্রতি ৩ মাস অন্তর কৃমিনাশক দেওয়া ডেইরি খামারের প্রধান নিয়ম।',
    farmType: 'cattle',
    subBreed: 'dairy'
  },
  {
    id: 'dy_liver_tonic',
    targetDayMin: 8,
    targetDayMax: 14,
    name: 'লিভার টনিক ও জিংক প্রিমিক্স (হেপাটোটেক / লিভাপেক্স)',
    category: 'supplement',
    route: 'খাবারের সাথে নিয়মিত ৭ দিন',
    purpose: 'কৃমিনাশকের পর লিভার সতেজ রাখা ও ক্ষুধা বৃদ্ধি',
    farmType: 'cattle',
    subBreed: 'dairy'
  },
  {
    id: 'dy_calcium_daily',
    targetDayMin: 15,
    targetDayMax: 30,
    name: 'ক্যালপ্লেক্স গোল্ড / ওরাল ক্যালসিয়াম জেল ও মিনারেল প্রিমিক্স',
    category: 'supplement',
    route: 'দানাদার খাদ্যের সাথে প্রতিদিন',
    purpose: 'দুধের উৎপাদন বাড়ানো, মিল্ক ফিভার রোধ ও স্বাস্থ্য সুরক্ষা',
    notes: 'গাভীর দুধের সাথে প্রতিদিন প্রচুর ক্যালসিয়াম বেরিয়ে যায়, তাই নিয়মিত সাপ্লিমেন্ট দরকার।',
    farmType: 'cattle',
    subBreed: 'dairy'
  },
  {
    id: 'dy_bloat_guard',
    targetDayMin: 25,
    targetDayMax: 40,
    name: 'পেট ফাঁপা ও বদহজমের জরুরি ওষুধ (ব্লটোরিল / কার্মিনেটিভ মিক্সচার)',
    category: 'medicine',
    route: 'প্রয়োজনে মুখে খাওয়ানো',
    purpose: 'কাঁচা ঘাস বা দানাদার খাদ্যে গ্যাস জমা ও পেট ফাঁপা নিয়ন্ত্রণ',
    farmType: 'cattle',
    subBreed: 'dairy'
  },
  {
    id: 'dy_fmd',
    targetDayMin: 60,
    targetDayMax: 90,
    name: 'ক্ষুরারোগ ভ্যাকসিন (FMD - Foot & Mouth Disease)',
    category: 'vaccine',
    route: 'চামড়ার নিচে ইনজেকশন (S/C)',
    purpose: 'মারাত্মক ক্ষুরারোগ, পায়ে ও মুখে ঘা এবং দুধ বন্ধ হওয়া প্রতিরোধ',
    notes: 'বছরে ২ বার সরকারি প্রাণিসম্পদ হাসপাতাল থেকে দিতে হয়।',
    farmType: 'cattle',
    subBreed: 'dairy'
  },
  {
    id: 'dy_anthrax',
    targetDayMin: 120,
    targetDayMax: 150,
    name: 'তড়কা ভ্যাকসিন (Anthrax Vaccine)',
    category: 'vaccine',
    route: 'চামড়ার নিচে ইনজেকশন',
    purpose: 'প্রাণঘাতী তড়কা রোগ প্রতিরোধ',
    farmType: 'cattle',
    subBreed: 'dairy'
  },
  {
    id: 'dy_bq_hs',
    targetDayMin: 180,
    targetDayMax: 210,
    name: 'বাদলা ও গলাফুলা ভ্যাকসিন (BQ & HS Vaccine)',
    category: 'vaccine',
    route: 'চামড়ার নিচে ইনজেকশন',
    purpose: 'বাদলা (মাংসে পচন) ও গলাফুলা রোগ থেকে সুরক্ষা',
    farmType: 'cattle',
    subBreed: 'dairy'
  }
];

// -------------------------------------------------------------
// 7. BEEF FATTENING (ষাঁড় মোটাতাজাকরণ)
// -------------------------------------------------------------
export const SCHEDULE_FATTENING: VaccineItem[] = [
  {
    id: 'ft_deworm_iver',
    targetDayMin: 1,
    targetDayMax: 5,
    name: 'কৃমি ও পরজীবী মুক্তকরণ (আইভারমেকটিন ইনজেকশন + এলবেনডাজল)',
    category: 'medicine',
    route: 'আইভারমেকটিন চামড়ায় + বোলাস মুখে',
    purpose: 'শরীরের উকুন-আটালি এবং পেটের সব কৃমি সম্পূর্ণ নির্মূল',
    notes: 'মোটাতাজাকরণ শুরুর প্রথম কাজই হলো কৃমি ও পরজীবী ধ্বংস করা।',
    farmType: 'cattle',
    subBreed: 'fattening'
  },
  {
    id: 'ft_liver_zinc',
    targetDayMin: 6,
    targetDayMax: 12,
    name: 'লিভার টনিক ও জিংকোভিট (ভিটামিন বি-কমপ্লেক্স)',
    category: 'supplement',
    route: 'দানাদার খাবারের সাথে',
    purpose: 'খাবারের রুচি দ্বিগুণ করা ও দ্রুত হজম ক্ষমতা বৃদ্ধি',
    farmType: 'cattle',
    subBreed: 'fattening'
  },
  {
    id: 'ft_rumen_enzyme',
    targetDayMin: 15,
    targetDayMax: 30,
    name: 'রুমন টনিক ও এনজাইম প্রিমিক্স (ইউরিয়া মোলাসেস ও খনিজ)',
    category: 'supplement',
    route: 'প্রতিদিনের খাবারের সাথে',
    purpose: 'খাদ্যের পুষ্টিকে সরাসরি পেশি ও মাংসে রূপান্তর',
    farmType: 'cattle',
    subBreed: 'fattening'
  },
  {
    id: 'ft_fmd',
    targetDayMin: 25,
    targetDayMax: 35,
    name: 'ক্ষুরারোগ ও বাদলা ভ্যাকসিন (FMD & BQ Vaccine)',
    category: 'vaccine',
    route: 'চামড়ার নিচে ইনজেকশন',
    purpose: 'খামারের মূল্যবান ষাঁড়কে ক্ষুরারোগ ও বাদলা রোগ থেকে রক্ষা',
    farmType: 'cattle',
    subBreed: 'fattening'
  }
];

// -------------------------------------------------------------
// 8. GOAT & SHEEP (ছাগল, খাসি ও ভেড়া)
// -------------------------------------------------------------
export const SCHEDULE_GOAT: VaccineItem[] = [
  {
    id: 'gt_deworm',
    targetDayMin: 1,
    targetDayMax: 5,
    name: 'ছাগলের নির্দিষ্ট কৃমিনাশক (ওজন মেপে কম ডোজে বোলাস/লিকুইড)',
    category: 'medicine',
    route: 'মুখে খাওয়ানো',
    purpose: 'ছাগলের পেটের কৃমি ধ্বংস করে দ্রুত বৃদ্ধি নিশ্চিত করা',
    notes: 'ছাগলের ওজন কম থাকায় গরুর সম্পূর্ণ ওষুধ কখনো দেওয়া যাবে না।',
    farmType: 'cattle',
    subBreed: 'goat'
  },
  {
    id: 'gt_liver',
    targetDayMin: 6,
    targetDayMax: 10,
    name: 'লিভার টনিক ও ভিটামিন বি-কমপ্লেক্স ড্রপ',
    category: 'supplement',
    route: 'পানিতে বা মুখে',
    purpose: 'রুচি বৃদ্ধি ও কৃমিনাশকের দুর্বলতা কাটানো',
    farmType: 'cattle',
    subBreed: 'goat'
  },
  {
    id: 'gt_ppr',
    targetDayMin: 30,
    targetDayMax: 45,
    name: 'পিপিআর ভ্যাকসিন (PPR Vaccine - ছাগলের জীবনরক্ষাকারী টিকা)',
    category: 'vaccine',
    route: 'চামড়ার নিচে ইনজেকশন (S/C - ১ মিলি)',
    purpose: 'ছাগলের সবচেয়ে মারাত্মক মড়ক রোগ (PPR) থেকে আজীবন সুরক্ষা',
    notes: '৪ মাস বয়সে একবার দিলে সারাজীবন রোগমুক্ত থাকে। সরকারি হাসপাতালে বিনামূল্যে পাওয়া যায়।',
    farmType: 'cattle',
    subBreed: 'goat'
  },
  {
    id: 'gt_cold_pneumonia',
    targetDayMin: 50,
    targetDayMax: 60,
    name: 'ঠান্ডা ও নিউমোনিয়া সতর্কতা (ডক্সিসাইক্লিন / সিপ্রোফ্লক্সাসিন)',
    category: 'medicine',
    route: 'প্রয়োজনে ভেটেরিনারি চিকিৎসকের পরামর্শে',
    purpose: 'ছাগলের কাশি, নাক দিয়ে সর্দি ও নিউমোনিয়া নিরাময়',
    farmType: 'cattle',
    subBreed: 'goat'
  }
];

// -------------------------------------------------------------
// 9. FISH (মৎস্য চাষ ও অ্যাকোয়াকালচার)
// -------------------------------------------------------------
export const SCHEDULE_FISH: VaccineItem[] = [
  {
    id: 'fs_lime_zeo',
    targetDayMin: 1,
    targetDayMax: 3,
    name: 'চুন ও জিওলাইট প্রয়োগ (Agri Lime & Zeolite)',
    category: 'supplement',
    route: 'পুকুরের পানিতে গুলে সমানভাবে ছিটিয়ে',
    purpose: 'পানির পিএইচ (pH) নিয়ন্ত্রণ, তলদেশের অ্যামোনিয়া গ্যাস দূর ও পানি শোধন',
    farmType: 'fish',
    subBreed: 'fish'
  },
  {
    id: 'fs_potash_salt',
    targetDayMin: 10,
    targetDayMax: 15,
    name: 'পটাশ (KMNO4) ও লবণ প্রয়োগ',
    category: 'medicine',
    route: 'পানিতে ছিটিয়ে অথবা গোসল দিয়ে',
    purpose: 'মাছের গায়ে লাল দাগ, ক্ষতরোগ, পাখনা পচা ও পরজীবী ধ্বংস',
    farmType: 'fish',
    subBreed: 'fish'
  },
  {
    id: 'fs_probiotic_vitc',
    targetDayMin: 20,
    targetDayMax: 25,
    name: 'ভিটামিন সি ও ফিড প্রোবায়োটিক (Vitamin C + Gut Probiotic)',
    category: 'supplement',
    route: 'খাবারের সাথে মিশিয়ে',
    purpose: 'মাছের রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি, দ্রুত খাদ্য হজম ও দ্রুত দৈহিক বৃদ্ধি',
    farmType: 'fish',
    subBreed: 'fish'
  },
  {
    id: 'fs_oxygen_powder',
    targetDayMin: 30,
    targetDayMax: 35,
    name: 'জরুরি অক্সিজেন ট্যাবলেট / পাউডার (Bio-Oxy / Oxy-Flow)',
    category: 'medicine',
    route: 'মাছ ভেসে উঠলে বা মেঘলা দিনে জরুরি ভিত্তিতে পানিতে',
    purpose: 'পানিতে তাৎক্ষণিক দ্রবীভূত অক্সিজেন সরবরাহ ও মাছের মৃত্যু রোধ',
    farmType: 'fish',
    subBreed: 'fish'
  }
];

// -------------------------------------------------------------
// BANGLADESH MOST POPULAR VETERINARY MEDICINES DIRECTORY
// -------------------------------------------------------------
export const POPULAR_MEDICINE_GUIDE: PopularMedicine[] = [
  // Broiler / Poultry
  {
    name: 'রেনামক্স / কসমিক্স প্লাস (Renamox / Cosmix Plus)',
    type: 'medicine',
    generic: 'Amoxicillin Trihydrate / Doxycycline + Colistin',
    indication: 'বাচ্চার নাভি পাকা/শুকানো, ব্রুডিং ব্যাকটেরিয়াল ইনফেকশন ও প্রাথমিক ধকল রোধ',
    popularBrands: 'Renata / Square / ACI',
    targetCategory: 'broiler',
    dosageTip: '১ গ্রাম প্রতি ১-২ লিটার খাবার পানিতে ৩-৫ দিন'
  },
  {
    name: 'ক্যালপ্লেক্স / ক্যালসি-ডি (Calplex / Calci-D)',
    type: 'supplement',
    generic: 'Liquid Calcium + Phosphorus + Vitamin D3',
    indication: 'দ্রুত ওজন বৃদ্ধির সাথে পায়ের হাড় শক্ত করা ও প্যারালাইসিস/লেংড়া হওয়া রোধ',
    popularBrands: 'Square / Eskayef / Renata',
    targetCategory: 'broiler',
    dosageTip: '১ মিলি প্রতি লিটার পানিতে সপ্তাহে ২-৩ দিন'
  },
  {
    name: 'হেপাটোটেক / লিভাপেক্স (Hepatotec / Livapex)',
    type: 'supplement',
    generic: 'Herbal Liver Tonic + Choline Chloride + Biotin',
    indication: 'লিভার সুরক্ষা, হজম শক্তি বৃদ্ধি, অতিরিক্ত খাদ্য হজমে সহায়তা ও টক্সিন দূরীকরণ',
    popularBrands: 'Square / ACME / Renata',
    targetCategory: 'broiler',
    dosageTip: '১ মিলি প্রতি লিটার খাবার পানিতে ৩ দিন'
  },
  {
    name: 'কক্সিকিউর / এসবিএ৩ / টলট্রাজুরিল (Toltrazuril / ESB3)',
    type: 'medicine',
    generic: 'Toltrazuril / Sulfaclozine Sodium',
    indication: 'রক্ত আমাশয় ও কক্সিডিওসিস (Coccidiosis) নিরাময় এবং লিটার ভেজা রোধ',
    popularBrands: 'Square (Tolracox) / Novartis (ESB3) / Renata',
    targetCategory: 'broiler',
    dosageTip: '১ মিলি প্রতি লিটার পানিতে পরপর ২ দিন'
  },
  {
    name: 'টাইলোসিন / ডক্সিটিন (Tylosin + Doxycycline)',
    type: 'medicine',
    generic: 'Tylosin Tartrate + Doxycycline HCl',
    indication: 'ঠান্ডা, ঘড়ঘড় শব্দ, শ্বাসকষ্ট ও সিআরডি (CRD) রোগের কার্যকর নিরাময়',
    popularBrands: 'Renata (Doxytin) / Square / Opsonin',
    targetCategory: 'broiler',
    dosageTip: '১ গ্রাম প্রতি ২ লিটার পানিতে ৩-৫ দিন'
  },
  {
    name: 'ভিটামিন বি-কমপ্লেক্স ও প্রোবায়োটিক (B-Complex + Probiotic)',
    type: 'supplement',
    generic: 'Vitamin B1, B2, B6, B12 + Gut Microbes',
    indication: 'রুচি বৃদ্ধি, পরিপাকতন্ত্রে উপকারী ব্যাকটেরিয়া তৈরি ও এফসিআর (FCR) উন্নতকরণ',
    popularBrands: 'Square / ACI / Renata',
    targetCategory: 'broiler',
    dosageTip: '১ মিলি প্রতি ১-২ লিটার পানিতে'
  },

  // Cattle / Animals
  {
    name: 'এলবেনডাজল / ট্রাইক্লাবেনডাজল (Endex / Renaflook / Albendazole)',
    type: 'medicine',
    generic: 'Triclabendazole + Levamisole / Albendazole Bolus',
    indication: 'গরু, ষাঁড় ও ছাগলের কলিজা কৃমি, ফিতা কৃমি ও গোল কৃমির চূড়ান্ত নিরাময়',
    popularBrands: 'Novartis (Endex) / Renata / Square',
    targetCategory: 'cattle',
    dosageTip: 'শরীরের ওজন অনুযায়ী সকালে খালি পেটে ১টি বোলাস'
  },
  {
    name: 'ব্লটোরিল / কার্মিনেটিভ মিক্সচার / রুমন এফএস (Blotoril / Carminative)',
    type: 'medicine',
    generic: 'Simethicone + Herbal Carminative',
    indication: 'গবাদিপশুর মারাত্মক পেট ফাঁপা, গ্যাস জমা, বদহজম ও বুক চেপে ধরা রোধ',
    popularBrands: 'Square / Renata / ACME',
    targetCategory: 'cattle',
    dosageTip: '১০০ মিলি সরাসরি মুখে অথবা কুসুম গরম পানিতে মিশিয়ে'
  },
  {
    name: 'ক্যালপ্লেক্স গোল্ড / ওরাল ক্যালসিয়াম জেল (Oral Calcium Gel)',
    type: 'supplement',
    generic: 'High Ionic Calcium + Magnesium',
    indication: 'ডেইরি গাভীর দুধ উৎপাদন বৃদ্ধি ও প্রসবের পর মিল্ক ফিভার (দুধ জ্বর) প্রতিরোধ',
    popularBrands: 'Square / Eskayef / Renata',
    targetCategory: 'cattle',
    dosageTip: 'প্রতিদিন ৫০-১০০ মিলি নিয়মিত খাবারের সাথে'
  },
  {
    name: 'আইভারমেকটিন ইনজেকশন (Ivermectin 1%)',
    type: 'medicine',
    generic: 'Ivermectin S/C',
    indication: 'শরীরের চামড়ার উকুন, আটালি, মাইট ও পাকস্থলীর কৃমি সম্পূর্ণ নির্মূল',
    popularBrands: 'Renata (Vermic) / Square (A-Mectin)',
    targetCategory: 'cattle',
    dosageTip: 'প্রতি ৫০ কেজি ওজনের জন্য ১ মিলি চামড়ার নিচে (S/C)'
  },
  {
    name: 'জিংকোভিট / মিনারেল প্রিমিক্স (Zinc + Minerals)',
    type: 'supplement',
    generic: 'Chelated Zinc + Vitamins',
    indication: 'গরু-ছাগলের লোম পড়া বন্ধ, ক্ষুর মজবুত রাখা ও খামারে প্রজনন ক্ষমতা বৃদ্ধি',
    popularBrands: 'Square / ACI / Renata',
    targetCategory: 'cattle',
    dosageTip: 'প্রতিদিন ২০-৩০ গ্রাম দানাদার খাদ্যের সাথে'
  },

  // Duck
  {
    name: 'ডাক প্লেগ ভ্যাকসিন (Duck Plague Vaccine)',
    type: 'vaccine',
    generic: 'Attenuated Live Duck Plague Virus',
    indication: 'হাঁসের সবচেয়ে মরণঘাতী ডাক প্লেগ (মাথা নিচু হয়ে মৃত্যু) প্রতিরোধ',
    popularBrands: 'প্রাণিসম্পদ অধিদপ্তর (DLS) / সরকারি পশু হাসপাতাল',
    targetCategory: 'duck',
    dosageTip: '২১-২৫ দিন বয়সে প্রতি হাঁসকে ১ মিলি চামড়ার নিচে'
  },
  {
    name: 'ডাক কলেরা ভ্যাকসিন (Duck Cholera Vaccine)',
    type: 'vaccine',
    generic: 'Pasteurella Multocida Vaccine',
    indication: 'হাঁসের হঠাৎ মৃত্যু, সবুজ পায়খানা ও কলেরা রোগ প্রতিরোধ',
    popularBrands: 'প্রাণিসম্পদ অধিদপ্তর (DLS)',
    targetCategory: 'duck',
    dosageTip: '৪০-৪৫ দিন বয়সে ১ মিলি মাংসে ইনজেকশন'
  },

  // Fish
  {
    name: 'কৃষি চুন ও জিওলাইট (Agri Lime & Zeolite)',
    type: 'supplement',
    generic: 'CaCO3 + Hydrated Aluminum Silicate',
    indication: 'পুকুরের তলদেশের বিষাক্ত গ্যাস শোষণ, পিএইচ (pH) নিয়ন্ত্রণ ও পানি স্বচ্ছকরণ',
    popularBrands: 'মেগা জিও / এসিআই জিওলাইট',
    targetCategory: 'fish',
    dosageTip: 'প্রতি শতাংশে ১-২ কেজি পুকুরের পানিতে গুলে ছিটান'
  },
  {
    name: 'পটাশিয়াম পারম্যাঙ্গানেট / পটাশ (KMNO4)',
    type: 'medicine',
    generic: 'Potassium Permanganate',
    indication: 'মাছের গায়ে লাল দাগ, ক্ষতরোগ, পাখনা পচা ও পরজীবী নির্মূল',
    popularBrands: 'ভেটেরিনারি স্ট্যান্ডার্ড পটাশ',
    targetCategory: 'fish',
    dosageTip: 'প্রতি শতাংশে ২-৩ গ্রাম পানিতে গুলে ছিটাতে হয়'
  },
  {
    name: 'অক্সিজেন পাউডার / ট্যাবলেট (Bio-Oxy / Oxy-Flow)',
    type: 'medicine',
    generic: 'Sodium Percarbonate',
    indication: 'ভোরবেলায় বা মেঘলা দিনে মাছ ভেসে উঠলে জরুরি অক্সিজেন সরবরাহ',
    popularBrands: 'স্কয়ার / এসিআই একুয়াকালচার',
    targetCategory: 'fish',
    dosageTip: 'প্রতি শতাংশে ৫০-১০০ গ্রাম দ্রুত ছিটিয়ে দিন'
  }
];

// Backward-compatibility exports
export const STANDARD_POULTRY_SCHEDULE = SCHEDULE_BROILER;
export const STANDARD_CATTLE_SCHEDULE = SCHEDULE_DAIRY;
export const STANDARD_FISH_SCHEDULE = SCHEDULE_FISH;

/**
 * Intelligent helper to detect the specific sub-breed / animal type from batch data
 */
export function detectSubBreed(batch: any): string {
  if (!batch) return 'broiler';
  if (batch.subBreed && batch.subBreed.trim() !== '') {
    const sb = batch.subBreed.toLowerCase();
    if (sb.includes('broiler')) return 'broiler';
    if (sb.includes('sonali')) return 'sonali';
    if (sb.includes('layer')) return 'layer';
    if (sb.includes('duck')) return 'duck';
    if (sb.includes('quail')) return 'quail';
    if (sb.includes('dairy')) return 'dairy';
    if (sb.includes('fattening')) return 'fattening';
    if (sb.includes('goat') || sb.includes('sheep')) return 'goat';
    if (sb.includes('fish') || sb.includes('carp') || sb.includes('telapia')) return 'fish';
    return sb;
  }

  const name = (batch.batchName || '').toLowerCase();
  const farmType = batch.farmType || 'poultry';

  if (farmType === 'fish' || name.includes('মাছ') || name.includes('পুকুর') || name.includes('fish')) {
    return 'fish';
  }
  if (farmType === 'cattle' || name.includes('গরু') || name.includes('গাভী') || name.includes('ষাঁড়') || name.includes('ষাঁড়') || name.includes('ছাগল') || name.includes('cattle')) {
    if (name.includes('ষাঁড়') || name.includes('ষাঁড়') || name.includes('মোটাতাজা') || name.includes('fattening')) return 'fattening';
    if (name.includes('ছাগল') || name.includes('খাসি') || name.includes('ভেড়া') || name.includes('ভেড়া') || name.includes('goat')) return 'goat';
    return 'dairy';
  }

  // Poultry category
  if (name.includes('সোনালী') || name.includes('sonali')) return 'sonali';
  if (name.includes('লেয়ার') || name.includes('লেয়ার') || name.includes('layer') || name.includes('ডিম')) return 'layer';
  if (name.includes('হাঁস') || name.includes('হাস') || name.includes('duck')) return 'duck';
  if (name.includes('কোয়েল') || name.includes('কোয়েল') || name.includes('quail')) return 'quail';

  // Default poultry in Bangladesh commercial farms is broiler (পল্টি / ব্রয়লার)
  return 'broiler';
}

const SCHEDULE_MAP: Record<string, VaccineItem[]> = {
  broiler: SCHEDULE_BROILER,
  sonali: SCHEDULE_SONALI,
  layer: SCHEDULE_LAYER,
  deshi: SCHEDULE_SONALI,
  duck: SCHEDULE_DUCK,
  quail: SCHEDULE_QUAIL,
  dairy: SCHEDULE_DAIRY,
  fattening: SCHEDULE_FATTENING,
  goat: SCHEDULE_GOAT,
  fish: SCHEDULE_FISH
};

interface VaccineScheduleCardProps {
  selectedBatch: any;
  existingRecords: any[];
  onQuickApply: (vaccine: VaccineItem) => void;
}

export default function VaccineScheduleCard({
  selectedBatch,
  existingRecords,
  onQuickApply
}: VaccineScheduleCardProps) {
  const { language } = useLanguage();
  
  // Auto-detect default sub-breed from the active batch
  const defaultSubBreed = selectedBatch ? detectSubBreed(selectedBatch) : 'broiler';
  const [activeSubBreed, setActiveSubBreed] = useState<string>(defaultSubBreed);
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'completed'>('all');
  const [viewTab, setViewTab] = useState<'schedule' | 'directory'>('schedule');

  // Keep activeSubBreed synced when selectedBatch changes
  useEffect(() => {
    if (selectedBatch) {
      setActiveSubBreed(detectSubBreed(selectedBatch));
    }
  }, [selectedBatch?.id, selectedBatch?.subBreed, selectedBatch?.batchName]);

  if (!selectedBatch) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-400">
        <Syringe size={32} className="mx-auto text-slate-300 mb-2" />
        <p className="font-bold text-sm text-slate-600">
          {language === 'bn' ? 'ভ্যাকসিন ও ওষুধ শিডিউল দেখতে একটি ব্যাচ নির্বাচন করুন।' : 'Select a batch to view health schedule.'}
        </p>
      </div>
    );
  }

  // Calculate batch age in days
  const startDate = new Date(selectedBatch.startDate);
  const today = new Date();
  const diffTime = Math.max(0, today.getTime() - startDate.getTime());
  const batchAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Selected schedule list
  const currentSchedule = SCHEDULE_MAP[activeSubBreed] || SCHEDULE_BROILER;

  // Status computation for schedule items
  const getStatus = (item: VaccineItem) => {
    if (item.isHatcheryGiven) return 'completed';
    const isRecorded = existingRecords.some(r => {
      const matchBatch = r.batchId === selectedBatch.id;
      const firstName = item.name.split(' ')[0].toLowerCase();
      const matchName = r.medicineName && r.medicineName.toLowerCase().includes(firstName);
      return matchBatch && matchName;
    });

    if (isRecorded) return 'completed';
    if (batchAgeDays >= item.targetDayMin && batchAgeDays <= item.targetDayMax + 3) return 'due_now';
    if (batchAgeDays > item.targetDayMax + 3) return 'overdue';
    if (item.targetDayMin - batchAgeDays <= 3) return 'upcoming';
    return 'future';
  };

  const filteredItems = currentSchedule.filter(item => {
    const status = getStatus(item);
    if (filterMode === 'due') return status === 'due_now' || status === 'overdue' || status === 'upcoming';
    if (filterMode === 'completed') return status === 'completed';
    return true;
  });

  // Species Tabs Definition
  const speciesTabs = [
    { key: 'broiler', label: '🍗 ব্রয়লার (পল্টি)', badge: '৩০-৩৫ দিন' },
    { key: 'sonali', label: '🐓 সোনালী', badge: '৬০-৭০ দিন' },
    { key: 'layer', label: '🥚 লেয়ার (ডিম)', badge: 'ডিমপাড়া' },
    { key: 'duck', label: '🦆 হাঁস পালন', badge: 'প্লেগ/কলেরা' },
    { key: 'quail', label: '🐦 কোয়েল', badge: 'ভিটামিন' },
    { key: 'dairy', label: '🥛 ডেইরি গাভী', badge: 'দুধ/টিকা' },
    { key: 'fattening', label: '🐂 ষাঁড় মোটাতাজা', badge: 'মাংস বৃদ্ধি' },
    { key: 'goat', label: '🐐 ছাগল ও ভেড়া', badge: 'পিপিআর/কৃমি' },
    { key: 'fish', label: '🐟 মাছ চাষ', badge: 'চুন/জিওলাইট' },
  ];

  // Specific Veterinary Advisory Notes per breed
  const getAdvisoryNote = () => {
    switch (activeSubBreed) {
      case 'broiler':
        return {
          title: 'বাস্তব খামার বাস্তবতা (ব্রয়লার পল্টি)',
          desc: 'ব্রয়লার মুরগির জীবনকাল ৩০-৩৫ দিন। আধুনিক খামারে কোনো ইনজেকশন দেওয়া হয় না! মারেক্স ভ্যাকসিন হ্যাচারি থেকেই দেওয়া থাকে। খামারে শুধুমাত্র খাবার পানি ও চোখের ড্রপের মাধ্যমে রানীক্ষেত ও গামবোরো ভ্যাকসিন এবং বয়স অনুযায়ী সঠিক ওষুধ (অ্যান্টিবায়োটিক ব্রুডিং, বি-কমপ্লেক্স, লিভার টনিক, ক্যালসিয়াম-ডি) প্রয়োগ করতে হয়।',
          color: 'bg-emerald-50 text-emerald-900 border-emerald-200'
        };
      case 'sonali':
        return {
          title: 'বাস্তব খামার বাস্তবতা (সোনালী মুরগি)',
          desc: 'সোনালী মুরগি ৬০-৭০ দিন পালন করা হয়। এদের জন্য পানি/ড্রপে ভ্যাকসিনের পাশাপাশি ৩৫-৪০ দিনে ডানার চামড়ায় গুটি বসন্ত (ফাউল পক্স) এবং ৪৫ দিনে কৃমিনাশক ওষুধ দেওয়া অত্যন্ত জরুরি।',
          color: 'bg-amber-50 text-amber-900 border-amber-200'
        };
      case 'layer':
        return {
          title: 'বাস্তব খামার বাস্তবতা (লেয়ার মুরগি)',
          desc: 'লেয়ার মুরগি দীর্ঘমেয়াদে ডিম দেয়। ব্রুডিং ভ্যাকসিনের পাশাপাশি নিয়মিত কৃমিনাশক এবং ডিম পাড়ার পুরো সময়ে পর্যাপ্ত ক্যালসিয়াম ও ভিটামিন এডি৩ই সাপ্লিমেন্ট নিশ্চিত করতে হয়।',
          color: 'bg-yellow-50 text-yellow-900 border-yellow-200'
        };
      case 'duck':
        return {
          title: 'সতর্কতা: হাঁসে মুরগির ওষুধ ও ভ্যাকসিন চলবে না!',
          desc: 'হাঁসে রানীক্ষেত বা গামবোরো হয় না! হাঁসের প্রধান মরণঘাতী রোগ হলো "ডাক প্লেগ" এবং "ডাক কলেরা"। ২১-২৫ দিনে ডাক প্লেগ এবং ৪০-৪৫ দিনে ডাক কলেরা ভ্যাকসিন দেওয়া হাঁস খামারের প্রধান সুরক্ষা।',
          color: 'bg-sky-50 text-sky-900 border-sky-200'
        };
      case 'dairy':
        return {
          title: 'বাস্তব খামার বাস্তবতা (ডেইরি গাভী)',
          desc: 'দুধের গাভীর জন্য প্রতি ৩ মাস অন্তর কৃমিনাশক এবং নিয়মিত ক্যালসিয়াম ও লিভার টনিক অপরিহার্য। পাশাপাশি সরকারি প্রাণিসম্পদ হাসপাতাল থেকে ক্ষুরারোগ (FMD), বাদলা (BQ) ও তড়কা ভ্যাকসিন দেওয়া আবশ্যক।',
          color: 'bg-indigo-50 text-indigo-900 border-indigo-200'
        };
      case 'fattening':
        return {
          title: 'বাস্তব খামার বাস্তবতা (ষাঁড় মোটাতাজাকরণ)',
          desc: 'মোটাতাজাকরণের শুরুতে আইভারমেকটিন ইনজেকশন ও কৃমিনাশক বোলাস দিয়ে পেট ও চামড়া সম্পূর্ণ পরজীবীমুক্ত করতে হবে। এরপর লিভার টনিক, রুমন এনজাইম ও মিনারেল দিলে দ্রুত মাংস বৃদ্ধি পায়।',
          color: 'bg-orange-50 text-orange-900 border-orange-200'
        };
      case 'goat':
        return {
          title: 'বাস্তব খামার বাস্তবতা (ছাগল ও ভেড়া)',
          desc: 'ছাগলের জন্য পিপিআর (PPR) ভ্যাকসিন জীবনরক্ষাকারী টিকা। ওজন অনুযায়ী সঠিক কম ডোজে কৃমিনাশক এবং ঠান্ডা/নিউমোনিয়ার দ্রুত চিকিৎসা ছাগল খামারের প্রধান চাবিকাঠি।',
          color: 'bg-rose-50 text-rose-900 border-rose-200'
        };
      case 'fish':
        return {
          title: 'বাস্তব খামার বাস্তবতা (মৎস্য চাষ)',
          desc: 'মাছের ক্ষেত্রে পানির পরিবেশ ঠিক রাখা সবচেয়ে বড় ওষুধ। চুন ও জিওলাইট দিয়ে গ্যাস নিয়ন্ত্রণ এবং খাবারের সাথে ভিটামিন সি ও প্রোবায়োটিক দিয়ে মাছের দ্রুত বৃদ্ধি নিশ্চিত করুন।',
          color: 'bg-cyan-50 text-cyan-900 border-cyan-200'
        };
      default:
        return {
          title: 'সঠিক ওষুধ ও ভ্যাকসিন শিডিউল',
          desc: 'পশুপাখির বয়স অনুযায়ী সঠিক অনুমোদিত ওষুধ ও ভ্যাকসিন প্রয়োগ করুন। কোনো বিভ্রান্তি হলে রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের পরামর্শ নিন।',
          color: 'bg-slate-50 text-slate-800 border-slate-200'
        };
    }
  };

  const advisory = getAdvisoryNote();

  // Filter popular medicines for the directory tab
  const relevantMedicines = POPULAR_MEDICINE_GUIDE.filter(m => {
    if (activeSubBreed === 'fish') return m.targetCategory === 'fish';
    if (activeSubBreed === 'dairy' || activeSubBreed === 'fattening' || activeSubBreed === 'goat') return m.targetCategory === 'cattle';
    if (activeSubBreed === 'duck') return m.targetCategory === 'duck' || m.targetCategory === 'all';
    return m.targetCategory === 'broiler' || m.targetCategory === 'poultry' || m.targetCategory === 'all';
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-3">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 text-white p-4 space-y-2.5">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-teal-100 px-2.5 py-0.5 rounded-md backdrop-blur-xs">
              💉 {language === 'bn' ? 'সঠিক স্বাস্থ্য, ওষুধ ও ভ্যাকসিন ক্যালেন্ডার' : 'Smart Veterinary Protocol'}
            </span>
            <h3 className="text-base sm:text-lg font-black text-white pt-0.5">
              {selectedBatch.batchName} ({language === 'bn' ? 'বর্তমান বয়স:' : 'Age:'} <span className="underline decoration-yellow-300 font-mono font-black">{batchAgeDays} {language === 'bn' ? 'দিন' : 'Days'}</span>)
            </h3>
          </div>

          <div className="text-right">
            <span className="text-xs font-black bg-yellow-400 text-slate-950 px-2.5 py-1 rounded-xl shadow-xs inline-block">
              {speciesTabs.find(s => s.key === activeSubBreed)?.label || 'খামার'}
            </span>
          </div>
        </div>

        <p className="text-xs text-teal-100 font-medium leading-relaxed">
          {language === 'bn' 
            ? 'পশুপাখির প্রজাতি অনুযায়ী শতভাগ বাস্তবভিত্তিক ওষুধ ও ভ্যাকসিন শিডিউল। ভুল ওষুধ রোধে প্রতিটি প্রাণীর আলাদা তালিকা।' 
            : 'Authentic veterinary protocols customized per species to prevent misuse. 1-Click quick log.'}
        </p>
      </div>

      {/* 2. Interactive Species / Sub-breed Selector Carousel */}
      <div className="px-3 pt-1 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span>{language === 'bn' ? '🎯 নির্দিষ্ট প্রাণী বা জাত পরিবর্তন করুন:' : 'Select Animal / Breed Protocol:'}</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-black">
            {language === 'bn' ? 'স্বয়ংক্রিয়ভাবে চিহ্নিত' : 'Auto-detected'}
          </span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
          {speciesTabs.map(tab => {
            const isSelected = activeSubBreed === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSubBreed(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs scale-102'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Advisory Callout Box */}
      <div className="px-3">
        <div className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${advisory.color}`}>
          <div className="flex items-center gap-1.5 font-black text-[12px]">
            <AlertCircle size={15} className="shrink-0" />
            <span>{advisory.title}</span>
          </div>
          <p className="text-[11px] font-medium opacity-95">
            {advisory.desc}
          </p>
        </div>
      </div>

      {/* 4. Top View Mode Tabs (Schedule vs Popular Medicines Directory) */}
      <div className="px-3">
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewTab('schedule')}
            className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewTab === 'schedule'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Calendar size={14} />
            <span>{language === 'bn' ? 'বয়সভিত্তিক শিডিউল' : 'Age Protocol'} ({currentSchedule.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('directory')}
            className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewTab === 'directory'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Pill size={14} />
            <span>{language === 'bn' ? 'চলতি ভালো ওষুধ গাইড' : 'Popular Medicines'}</span>
          </button>
        </div>
      </div>

      {viewTab === 'schedule' ? (
        <>
          {/* Filter Tabs */}
          <div className="px-3 flex items-center justify-between gap-2">
            <div className="flex gap-1.5 text-xs font-bold bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'bn' ? 'সকল ধাপ' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('due')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'due' ? 'bg-white text-red-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🔴 {language === 'bn' ? 'জরুরি / সময়মতো' : 'Due/Upcoming'}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('completed')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'completed' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🟢 {language === 'bn' ? 'সম্পন্ন' : 'Completed'}
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
              {currentSchedule.length} {language === 'bn' ? 'টি নির্ধারিত ধাপ' : 'Protocols'}
            </span>
          </div>

          {/* Schedule Items List */}
          <div className="p-3 pt-0 space-y-2.5">
            {filteredItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-xl">
                {language === 'bn' ? 'এই ফিল্টারে কোনো শিডিউল পাওয়া যায়নি।' : 'No items match this filter.'}
              </div>
            ) : (
              filteredItems.map(item => {
                const status = getStatus(item);
                const isDone = status === 'completed';
                const isDueNow = status === 'due_now';
                const isOverdue = status === 'overdue';
                const isUpcoming = status === 'upcoming';

                return (
                  <div 
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isDone 
                        ? 'bg-emerald-50/40 border-emerald-200 text-slate-700' 
                        : isDueNow 
                          ? 'bg-amber-50/80 border-amber-300 shadow-2xs' 
                          : isOverdue 
                            ? 'bg-red-50/60 border-red-300' 
                            : isUpcoming 
                              ? 'bg-blue-50/50 border-blue-200' 
                              : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Category Icon */}
                          {item.category === 'vaccine' ? (
                            <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Syringe size={11} /> {language === 'bn' ? 'টিকা' : 'Vaccine'}
                            </span>
                          ) : item.category === 'medicine' ? (
                            <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Pill size={11} /> {language === 'bn' ? 'ওষুধ' : 'Medicine'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Sparkles size={11} /> {language === 'bn' ? 'সাপ্লিমেন্ট' : 'Supplement'}
                            </span>
                          )}

                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {item.name}
                          </span>

                          {/* Status Badge */}
                          {item.isHatcheryGiven ? (
                            <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              🐣 {language === 'bn' ? 'হ্যাচারিতে দেওয়া থাকে' : 'Hatchery Done'}
                            </span>
                          ) : isDone ? (
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 size={11} /> {language === 'bn' ? 'দেওয়া হয়েছে' : 'Given'}
                            </span>
                          ) : isDueNow ? (
                            <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-md animate-pulse">
                              ⚡ {language === 'bn' ? 'আজকের বয়স উপযোগী' : 'Due Today'}
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                              ⚠️ {language === 'bn' ? 'সময় পার হয়েছে' : 'Overdue'}
                            </span>
                          ) : isUpcoming ? (
                            <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                              ⏳ {language === 'bn' ? `${item.targetDayMin - batchAgeDays} দিন পর` : `In ${item.targetDayMin - batchAgeDays}d`}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {language === 'bn' ? 'ভবিষ্যৎ শিডিউল' : 'Scheduled'}
                            </span>
                          )}
                        </div>

                        {/* Practical Route & Age */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                          <span>
                            🎯 <strong className="text-slate-800">{language === 'bn' ? 'বয়স:' : 'Age:'}</strong>{' '}
                            {item.targetDayMin === item.targetDayMax ? `${item.targetDayMin}তম দিন` : `${item.targetDayMin}-${item.targetDayMax} দিন`}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>
                            💧 <strong className="text-slate-800">{language === 'bn' ? 'প্রয়োগের মাধ্যম:' : 'Route:'}</strong>{' '}
                            <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              {item.route}
                            </span>
                          </span>
                        </div>

                        {/* Purpose */}
                        <p className="text-[11px] text-slate-600 flex items-start gap-1 pt-0.5">
                          <Info size={12} className="text-slate-400 shrink-0 mt-0.5" />
                          <span>{item.purpose}</span>
                        </p>

                        {/* Notes if any */}
                        {item.notes && (
                          <p className="text-[10px] text-amber-800 bg-amber-50/70 p-1.5 rounded-lg border border-amber-200/60 font-medium">
                            💡 {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Quick Action Button */}
                      <div className="shrink-0 flex items-center self-center pl-2">
                        {!isDone && !item.isHatcheryGiven ? (
                          <button
                            type="button"
                            onClick={() => onQuickApply(item)}
                            className={`text-xs font-black px-3 py-2 rounded-xl flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs ${
                              isDueNow || isOverdue
                                ? 'bg-teal-700 hover:bg-teal-800 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Sparkles size={13} />
                            <span>{language === 'bn' ? 'লগ করুন' : 'Apply'}</span>
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-xs flex items-center gap-0.5 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                            <CheckCircle2 size={16} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* 5. Popular Veterinary Medicines Directory */
        <div className="p-3 pt-0 space-y-3">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
            <h4 className="font-black flex items-center gap-1.5 text-blue-950">
              <Pill size={15} />
              {language === 'bn' ? 'চলতি ও জনপ্রিয় বিশ্বস্ত ভেটেরিনারি ওষুধসমূহ' : 'Popular Trusted Veterinary Brands'}
            </h4>
            <p className="text-[11px] text-blue-800">
              {language === 'bn'
                ? 'বর্তমানে বাংলাদেশের শীর্ষ কোম্পানিগুলোর (Square, Renata, ACI, Eskayef) যে ওষুধগুলো সবচেয়ে বেশি কার্যকর এবং খামারিরা ব্যবহার করেন:'
                : 'Top veterinary medicines actively prescribed in Bangladesh commercial farms:'}
            </p>
          </div>

          <div className="space-y-2.5">
            {relevantMedicines.map((med, idx) => (
              <div 
                key={idx}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 hover:border-blue-300 transition-all"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {med.name}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-mono">
                      জেনেরিক: {med.generic}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onQuickApply({
                      id: `pop_${idx}`,
                      name: med.name.split(' ')[0],
                      category: med.type,
                      targetDayMin: batchAgeDays,
                      targetDayMax: batchAgeDays,
                      route: med.dosageTip,
                      purpose: med.indication,
                      farmType: selectedBatch.farmType || 'poultry'
                    })}
                    className="shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>{language === 'bn' ? 'হিসাবে নিন' : 'Log'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                  🎯 <strong className="text-slate-900">{language === 'bn' ? 'কাজ/উপকারিতা:' : 'Indication:'}</strong> {med.indication}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    🏢 <strong className="text-slate-800">{language === 'bn' ? 'ব্র্যান্ডসমূহ:' : 'Brands:'}</strong> {med.popularBrands}
                  </div>
                  <div>
                    ⚖️ <strong className="text-slate-800">{language === 'bn' ? 'ডোজ পরামর্শ:' : 'Dosage:'}</strong> {med.dosageTip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
