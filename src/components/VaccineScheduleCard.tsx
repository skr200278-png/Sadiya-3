import React, { useState } from 'react';
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
  Info
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
}

export const STANDARD_POULTRY_SCHEDULE: VaccineItem[] = [
  {
    id: 'p_mareks',
    targetDayMin: 0,
    targetDayMax: 1,
    name: 'মারেক্স ভ্যাকসিন (Marek\'s)',
    category: 'vaccine',
    route: 'হ্যাচারিতে চামড়ার নিচে ইনজেকশন',
    purpose: 'মারেক্স রোগ ও টিউমার প্রতিরোধ',
    farmType: 'poultry'
  },
  {
    id: 'p_nd_ib',
    targetDayMin: 4,
    targetDayMax: 5,
    name: 'রানীক্ষেত + আইবি (ND+IB Live Clone 30/Ma5)',
    category: 'vaccine',
    route: 'প্রতি বাচ্চার চোখে ১ ফোঁটা ড্রপ',
    purpose: 'রানীক্ষেত ও সংক্রামক ব্রঙ্কাইটিস প্রতিরোধ',
    notes: 'সকালে ঠান্ডা আবহাওয়ায় দিতে হবে',
    farmType: 'poultry'
  },
  {
    id: 'p_ibd_1',
    targetDayMin: 9,
    targetDayMax: 11,
    name: 'গামবোরো ১ম ডোজ (IBD Intermediate Plus)',
    category: 'vaccine',
    route: 'চোখের ড্রপ অথবা নির্ভেজাল ড্রপ পানিতে',
    purpose: 'মারাত্মক গামবোরো রোগ প্রতিরোধ',
    notes: 'ভ্যাকসিন প্রয়োগের ২ ঘণ্টা আগে পানি পিপাসিত রাখুন',
    farmType: 'poultry'
  },
  {
    id: 'p_ibd_2',
    targetDayMin: 15,
    targetDayMax: 17,
    name: 'গামবোরো ২য় বুস্টার ডোজ (IBD Booster)',
    category: 'vaccine',
    route: 'খাওয়ার পরিষ্কার ঠান্ডা পানিতে',
    purpose: 'গামবোরো রোগের পূর্ণাঙ্গ প্রতিরোধ ক্ষমতা',
    farmType: 'poultry'
  },
  {
    id: 'p_nd_lasota',
    targetDayMin: 21,
    targetDayMax: 23,
    name: 'রানীক্ষেত লাসোটা বুস্টার (ND Lasota)',
    category: 'vaccine',
    route: 'খাওয়ার পানিতে স্কিমড মিল্ক মিশিয়ে',
    purpose: 'রানীক্ষেতের আজীবন রোগ প্রতিরোধ বৃদ্ধি',
    farmType: 'poultry'
  },
  {
    id: 'p_pox',
    targetDayMin: 30,
    targetDayMax: 35,
    name: 'ফাউল পক্স (Fowl Pox - গুটি বসন্ত)',
    category: 'vaccine',
    route: 'ডানার চামড়ায় সুচ ফোটানো (Wing Web)',
    purpose: 'পক্স বা বসন্ত রোগ প্রতিরোধ',
    farmType: 'poultry'
  },
  {
    id: 'p_cholera',
    targetDayMin: 42,
    targetDayMax: 45,
    name: 'ফাউল কলেরা (Fowl Cholera)',
    category: 'vaccine',
    route: 'বুকের চামড়ার নিচে বা মাংসে ইনজেকশন',
    purpose: 'হঠাৎ মৃত্যু ও কলেরা প্রতিরোধ',
    farmType: 'poultry'
  }
];

export const STANDARD_CATTLE_SCHEDULE: VaccineItem[] = [
  {
    id: 'c_deworm',
    targetDayMin: 1,
    targetDayMax: 7,
    name: 'নিয়মিত কৃমিনাশক (Deworming Drench/Bolus)',
    category: 'medicine',
    route: 'মুখে খাওয়ানো (ট্যাবলেট/লিকুইড)',
    purpose: 'পেট ও কলিজার কৃমি দূর করে দ্রুত বৃদ্ধি',
    farmType: 'cattle'
  },
  {
    id: 'c_anthrax',
    targetDayMin: 30,
    targetDayMax: 45,
    name: 'তড়কা ভ্যাকসিন (Anthrax Vaccine)',
    category: 'vaccine',
    route: 'চামড়ার নিচে (S/C)',
    purpose: 'প্রাণঘাতী তড়কা রোগ প্রতিরোধ',
    farmType: 'cattle'
  },
  {
    id: 'c_bq',
    targetDayMin: 60,
    targetDayMax: 75,
    name: 'বাদলা ভ্যাকসিন (Black Quarter - BQ)',
    category: 'vaccine',
    route: 'চামড়ার নিচে (S/C)',
    purpose: 'বাদলা বা মাংসপেশির পচন রোগ প্রতিরোধ',
    farmType: 'cattle'
  },
  {
    id: 'c_fmd',
    targetDayMin: 90,
    targetDayMax: 105,
    name: 'ক্ষুরারোগ ভ্যাকসিন (FMD - Foot & Mouth Disease)',
    category: 'vaccine',
    route: 'চামড়ার নিচে (S/C)',
    purpose: 'মারাত্মক ক্ষুরারোগ ও মুখে ঘা প্রতিরোধ',
    farmType: 'cattle'
  }
];

export const STANDARD_FISH_SCHEDULE: VaccineItem[] = [
  {
    id: 'f_lime',
    targetDayMin: 1,
    targetDayMax: 3,
    name: 'চুন ও জিওলাইট প্রয়োগ (Lime & Zeolite)',
    category: 'supplement',
    route: 'পুকুরের পানিতে ছিটিয়ে',
    purpose: 'পানির পিএইচ (pH) নিয়ন্ত্রণ ও গ্যাস মুক্তকরণ',
    farmType: 'fish'
  },
  {
    id: 'f_probiotic',
    targetDayMin: 10,
    targetDayMax: 15,
    name: 'পানিতে প্রোবায়োটিক প্রয়োগ (Water Probiotic)',
    category: 'supplement',
    route: 'পানিতে প্রয়োগ',
    purpose: 'উপকারী প্ল্যাঙ্কটন বৃদ্ধি ও অ্যামোনিয়া দূরীকরণ',
    farmType: 'fish'
  },
  {
    id: 'f_vitc',
    targetDayMin: 25,
    targetDayMax: 30,
    name: 'ভিটামিন সি ও রোগ প্রতিরোধক মিনারেল',
    category: 'medicine',
    route: 'খাবারের সাথে মিশিয়ে',
    purpose: 'মাছের রোগ প্রতিরোধ ক্ষমতা ও দ্রুত বৃদ্ধি',
    farmType: 'fish'
  }
];

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
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'completed'>('all');

  if (!selectedBatch) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-400">
        <Syringe size={32} className="mx-auto text-slate-300 mb-2" />
        <p className="font-bold text-sm text-slate-600">
          {language === 'bn' ? 'ভ্যাকসিন শিডিউল দেখতে একটি ব্যাচ নির্বাচন করুন।' : 'Select a batch to view vaccine schedule.'}
        </p>
      </div>
    );
  }

  // Calculate batch age in days
  const startDate = new Date(selectedBatch.startDate);
  const today = new Date();
  const diffTime = Math.max(0, today.getTime() - startDate.getTime());
  const batchAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Determine schedule list based on farmType
  const farmType = selectedBatch.farmType || 'poultry';
  const scheduleList = farmType === 'cattle' 
    ? STANDARD_CATTLE_SCHEDULE 
    : farmType === 'fish' 
      ? STANDARD_FISH_SCHEDULE 
      : STANDARD_POULTRY_SCHEDULE;

  // Check which ones are already completed in records
  const getStatus = (item: VaccineItem) => {
    const isRecorded = existingRecords.some(r => {
      const matchBatch = r.batchId === selectedBatch.id;
      const matchName = r.medicineName && r.medicineName.toLowerCase().includes(item.name.split(' ')[0].toLowerCase());
      return matchBatch && matchName;
    });

    if (isRecorded) return 'completed';
    if (batchAgeDays >= item.targetDayMin && batchAgeDays <= item.targetDayMax + 3) return 'due_now';
    if (batchAgeDays > item.targetDayMax + 3) return 'overdue';
    if (item.targetDayMin - batchAgeDays <= 3) return 'upcoming';
    return 'future';
  };

  const filteredItems = scheduleList.filter(item => {
    const status = getStatus(item);
    if (filterMode === 'due') return status === 'due_now' || status === 'overdue' || status === 'upcoming';
    if (filterMode === 'completed') return status === 'completed';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
              💉 {language === 'bn' ? 'স্মার্ট স্বাস্থ্য ও টিকা ক্যালেন্ডার' : 'Smart Vaccine Protocol'}
            </span>
            <h3 className="text-base sm:text-lg font-black text-white pt-0.5">
              {selectedBatch.batchName} ({language === 'bn' ? 'বর্তমান বয়স:' : 'Age:'} <span className="underline decoration-yellow-300 font-mono font-black">{batchAgeDays} {language === 'bn' ? 'দিন' : 'Days'}</span>)
            </h3>
          </div>

          <div className="text-right">
            <span className="text-xs font-black bg-yellow-400 text-slate-950 px-2.5 py-1 rounded-xl shadow-xs inline-block">
              {farmType === 'cattle' ? '🐂 গবাদিপশু' : farmType === 'fish' ? '🐟 মৎস্য' : '🐔 পোল্ট্রি'}
            </span>
          </div>
        </div>

        <p className="text-xs text-teal-100 font-medium leading-relaxed">
          {language === 'bn' 
            ? 'পশুপাখির বয়স অনুযায়ী আদর্শ ভ্যাকসিনের শিডিউল। ১-ক্লিকেই রেজিস্টারে যুক্ত করতে পারবেন।' 
            : 'Veterinary recommended schedule based on batch age. 1-Click quick log into medicine register.'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 flex items-center justify-between gap-2">
        <div className="flex gap-1.5 text-xs font-bold bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filterMode === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'bn' ? 'সকল শিডিউল' : 'All'}
          </button>
          <button
            onClick={() => setFilterMode('due')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filterMode === 'due' ? 'bg-white text-red-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔴 {language === 'bn' ? 'জরুরি / আসন্ন' : 'Due/Upcoming'}
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filterMode === 'completed' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🟢 {language === 'bn' ? 'সম্পন্ন' : 'Completed'}
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
          {scheduleList.length} {language === 'bn' ? 'টি নির্ধারিত টিকা' : 'Total protocols'}
        </span>
      </div>

      {/* Schedule Items List */}
      <div className="p-4 pt-1 space-y-2.5">
        {filteredItems.map(item => {
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
                  ? 'bg-emerald-50/50 border-emerald-200 text-slate-700' 
                  : isDueNow 
                    ? 'bg-amber-50 border-amber-300 shadow-2xs' 
                    : isOverdue 
                      ? 'bg-red-50/60 border-red-300' 
                      : isUpcoming 
                        ? 'bg-blue-50/50 border-blue-200' 
                        : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                      <Syringe size={14} className={isDone ? 'text-emerald-600' : isDueNow ? 'text-amber-600' : 'text-slate-400'} />
                      {item.name}
                    </span>

                    {/* Status Badge */}
                    {isDone ? (
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

                  <p className="text-xs text-slate-600 font-medium">
                    🎯 <strong className="text-slate-800">{language === 'bn' ? 'বয়স:' : 'Age:'}</strong> {item.targetDayMin === item.targetDayMax ? `${item.targetDayMin}তম দিন` : `${item.targetDayMin}-${item.targetDayMax} দিন`} 
                    {' | '}
                    <strong className="text-slate-800">{language === 'bn' ? 'পদ্ধতি:' : 'Route:'}</strong> {item.route}
                  </p>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Info size={11} className="text-slate-400 shrink-0" />
                    <span>{item.purpose}</span>
                  </p>
                </div>

                {/* Quick Action Button */}
                <div className="shrink-0 flex items-center">
                  {!isDone ? (
                    <button
                      type="button"
                      onClick={() => onQuickApply(item)}
                      className={`text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs ${
                        isDueNow || isOverdue
                          ? 'bg-teal-600 hover:bg-teal-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Sparkles size={13} />
                      <span>{language === 'bn' ? 'লগ করুন' : 'Apply'}</span>
                    </button>
                  ) : (
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-0.5">
                      <CheckCircle2 size={16} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
