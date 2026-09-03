import React, { useState, useEffect } from 'react';
import { Scale, Calculator, TrendingUp, AlertTriangle, CheckCircle2, Info, ArrowRight, Sparkles, LineChart as ChartIcon, BarChart3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import FcrMilestoneGraph, { FarmSectorType } from './FcrMilestoneGraph';

interface FcrCalculatorCardProps {
  selectedBatch: any;
  totalFeedConsumedKg?: number;
  totalFeedCost?: number;
  currentBirdCount?: number;
}

export default function FcrCalculatorCard({
  selectedBatch,
  totalFeedConsumedKg = 0,
  totalFeedCost = 0,
  currentBirdCount = 0
}: FcrCalculatorCardProps) {
  const { language } = useLanguage();

  // Mode: 'graph' (Lifecycle curve) or 'calculator' (Quick single ratio)
  const [activeMode, setActiveMode] = useState<'graph' | 'calculator'>('graph');

  // Detect sector from selected batch
  const farmType: FarmSectorType = 
    selectedBatch?.farmType === 'cattle' ? 'cattle' :
    selectedBatch?.farmType === 'fish' ? 'fish' : 'poultry';

  // Interactive inputs with auto-fallback from batch data
  const [totalFeedKg, setTotalFeedKg] = useState<string>(totalFeedConsumedKg > 0 ? totalFeedConsumedKg.toString() : '');
  const [averageWeight, setAverageWeight] = useState<string>('');
  const [animalCount, setAnimalCount] = useState<string>(currentBirdCount > 0 ? currentBirdCount.toString() : '');
  const [initialWeight, setInitialWeight] = useState<string>(
    farmType === 'cattle' ? '180' : farmType === 'fish' ? '5' : '42'
  );

  useEffect(() => {
    if (totalFeedConsumedKg > 0 && !totalFeedKg) {
      setTotalFeedKg(totalFeedConsumedKg.toString());
    }
    if (currentBirdCount > 0 && !animalCount) {
      setAnimalCount(currentBirdCount.toString());
    }
  }, [totalFeedConsumedKg, currentBirdCount]);

  useEffect(() => {
    // Adjust default initial weight when batch changes sector
    if (farmType === 'cattle') {
      setInitialWeight('180'); // 180kg initial young cattle
    } else if (farmType === 'fish') {
      setInitialWeight('10'); // 10g fry
    } else {
      setInitialWeight('42'); // 42g day-old chick
    }
  }, [farmType]);

  const feedVal = parseFloat(totalFeedKg) || 0;
  const avgWeightVal = parseFloat(averageWeight) || 0;
  const countVal = parseFloat(animalCount) || 0;
  const initialWeightVal = parseFloat(initialWeight) || 0;

  // Weight conversion logic based on sector:
  // Cattle weights are in KG; poultry & fish avg weights are in Grams
  const isCattle = farmType === 'cattle';
  const totalLiveWeightKg = countVal > 0 && avgWeightVal > 0 
    ? (isCattle ? countVal * avgWeightVal : (countVal * avgWeightVal) / 1000) 
    : 0;

  const totalInitialWeightKg = countVal > 0 && initialWeightVal > 0 
    ? (isCattle ? countVal * initialWeightVal : (countVal * initialWeightVal) / 1000) 
    : 0;

  // Net Weight Gained (KG)
  const netWeightGainedKg = Math.max(0, totalLiveWeightKg - totalInitialWeightKg);

  // FCR Calculation: Total Feed (KG) / Net Live Weight Gained (KG)
  const calculatedFCR = netWeightGainedKg > 0 && feedVal > 0 ? (feedVal / netWeightGainedKg) : 0;

  // Cost per kg feed
  const feedCostPerKg = feedVal > 0 && totalFeedCost > 0 ? (totalFeedCost / feedVal) : 0;
  const feedCostPerKgLiveWeight = calculatedFCR > 0 && feedCostPerKg > 0 ? calculatedFCR * feedCostPerKg : 0;

  // Multi-sector FCR Evaluation
  const getFcrAnalysis = (fcr: number, sector: FarmSectorType) => {
    if (fcr === 0) return null;

    if (sector === 'cattle') {
      // Cattle FCR criteria (~6.0 to 8.5)
      if (fcr <= 6.5) {
        return {
          level: 'excellent',
          text: language === 'bn' ? 'অসাধারণ খাদ্য রূপান্তর (Excellent Cattle FCR)' : 'Outstanding Cattle FCR',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
          badge: 'bg-emerald-600 text-white',
          desc: language === 'bn' 
            ? 'পশুর খাদ্য রূপান্তর ক্ষমতা অত্যন্ত উচ্চ। দানাদার ও সাইলেজ অনুপাত আদর্শ।' 
            : 'Exceptional feed-to-beef conversion. Daily live weight gain is optimal.'
        };
      } else if (fcr <= 7.5) {
        return {
          level: 'good',
          text: language === 'bn' ? 'সন্তোষজনক ও স্বাভাবিক FCR (Standard Normal)' : 'Good Cattle FCR',
          color: 'text-teal-700 bg-teal-50 border-teal-300',
          badge: 'bg-teal-600 text-white',
          desc: language === 'bn' 
            ? 'এফসিআর স্বাভাবিক রয়েছে। নিয়মিত সুপেয় পানি ও প্রোটিন ব্যালান্স বজায় রাখুন।' 
            : 'FCR is normal and within profitable livestock standards.'
        };
      } else if (fcr <= 8.5) {
        return {
          level: 'warning',
          text: language === 'bn' ? 'সতর্কতা: মাঝারি FCR (Caution)' : 'Average Cattle FCR',
          color: 'text-amber-800 bg-amber-50 border-amber-300',
          badge: 'bg-amber-500 text-white',
          desc: language === 'bn' 
            ? 'খাবার তুলনায় ওজন বৃদ্ধি কিছুটা ধীর। কৃমিনাশক, জাবর কাটা ও লিভার টনিক পরীক্ষা করুন।' 
            : 'Conversion is slower. Check deworming status and crude protein content.'
        };
      } else {
        return {
          level: 'danger',
          text: language === 'bn' ? 'উদ্বেগজনক: উচ্চ FCR / খাদ্য অপচয়' : 'High Cattle FCR',
          color: 'text-red-800 bg-red-50 border-red-300',
          badge: 'bg-red-600 text-white',
          desc: language === 'bn' 
            ? 'খাদ্য রূপান্তরের চেয়ে খরচ বেশি হচ্ছে। ভেটেরিনারি চিকিৎসকের পরামর্শ নিয়ে খাবারের ফর্মুলা পরিবর্তন করুন।' 
            : 'Poor feed conversion. Seek veterinary nutritionist advice immediately.'
        };
      }
    }

    if (sector === 'fish') {
      // Fish FCR criteria (~1.15 to 1.75)
      if (fcr <= 1.35) {
        return {
          level: 'excellent',
          text: language === 'bn' ? 'অসাধারণ ও লাভজনক FCR (Excellent Fish FCR)' : 'Outstanding Fish FCR',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
          badge: 'bg-emerald-600 text-white',
          desc: language === 'bn' 
            ? 'মাছের বৃদ্ধি অত্যন্ত চমৎকার। ভাসমান ফিডের সম্পূর্ণ সদ্ব্যবহার হচ্ছে।' 
            : 'Superior aquaculture feed conversion efficiency.'
        };
      } else if (fcr <= 1.55) {
        return {
          level: 'good',
          text: language === 'bn' ? 'সন্তোষজনক ও স্বাভাবিক FCR (Good & Normal)' : 'Standard Fish FCR',
          color: 'text-teal-700 bg-teal-50 border-teal-300',
          badge: 'bg-teal-600 text-white',
          desc: language === 'bn' 
            ? 'মাছ চাষের স্বাভাবিক মানদণ্ডের মধ্যে রয়েছে। পুকুরের পানির গুণাগুণ ঠিক রাখুন।' 
            : 'FCR is normal and sustainable for commercial aquaculture.'
        };
      } else if (fcr <= 1.75) {
        return {
          level: 'warning',
          text: language === 'bn' ? 'সতর্কতা: বেশি FCR / ওভারফিডিং চেক' : 'Caution: High Fish FCR',
          color: 'text-amber-800 bg-amber-50 border-amber-300',
          badge: 'bg-amber-500 text-white',
          desc: language === 'bn' 
            ? 'খাবার বেশি দেওয়া হচ্ছে কিনা চেক করুন। অতিরিক্ত খাবার পানিতে নষ্ট হলে FCR বেড়ে যায়।' 
            : 'Check for overfeeding or poor feed consumption on feeding trays.'
        };
      } else {
        return {
          level: 'danger',
          text: language === 'bn' ? 'উদ্বেগজনক: তীব্র খাদ্য অপচয়' : 'Severe Fish Feed Loss',
          color: 'text-red-800 bg-red-50 border-red-300',
          badge: 'bg-red-600 text-white',
          desc: language === 'bn' 
            ? 'খাবারের অপচয় হচ্ছে ও তলদেশে গ্যাস জমে অ্যামোনিয়া তৈরি হতে পারে। দ্রুত খাদ্যের পরিমাণ সমন্বয় করুন।' 
            : 'Feed is being wasted in the pond bottom, causing poor FCR and ammonia spike.'
        };
      }
    }

    // Default Poultry Criteria (~1.30 to 1.85)
    if (fcr <= 1.48) {
      return {
        level: 'excellent',
        text: language === 'bn' ? 'অসাধারণ ও অত্যন্ত লাভজনক এফসিআর (Excellent)' : 'Outstanding & Highly Profitable FCR',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
        badge: 'bg-emerald-600 text-white',
        desc: language === 'bn' 
          ? 'খাবারের রূপান্তর হার অত্যন্ত চমৎকার। খামারের খাবার ব্যবস্থাপনা ও ব্রুডিং অত্যন্ত মানসম্মত।' 
          : 'Feed conversion is exceptional with high profitability.'
      };
    } else if (fcr <= 1.65) {
      return {
        level: 'good',
        text: language === 'bn' ? 'সন্তোষজনক ও স্বাভাবিক এফসিআর (Good & Normal)' : 'Standard & Good FCR',
        color: 'text-teal-700 bg-teal-50 border-teal-300',
        badge: 'bg-teal-600 text-white',
        desc: language === 'bn' 
          ? 'এফসিআর স্বাভাবিক রয়েছে। পানি ও খাবারের পাত্র নিয়মিত পরিষ্কার রাখুন।' 
          : 'FCR is normal and within profitable farm standards.'
      };
    } else if (fcr <= 1.85) {
      return {
        level: 'warning',
        text: language === 'bn' ? 'সতর্কতা: মাঝারি এফসিআর (Caution / Moderate)' : 'Caution: Average FCR',
        color: 'text-amber-800 bg-amber-50 border-amber-300',
        badge: 'bg-amber-500 text-white',
        desc: language === 'bn' 
          ? 'খাবার অপচয় হচ্ছে কিনা বা খাদ্যের পুষ্টিমান ঠিক আছে কিনা খতিয়ে দেখুন।' 
          : 'Check for feed wastage, feeder height and gut health.'
      };
    } else {
      return {
        level: 'danger',
        text: language === 'bn' ? 'উদ্বেগজনক: উচ্চ এফসিআর / খাদ্যের ক্ষতি (High FCR)' : 'High FCR - Loss of Feed Efficiency',
        color: 'text-red-800 bg-red-50 border-red-300',
        badge: 'bg-red-600 text-white',
        desc: language === 'bn' 
          ? 'খাবারের তুলনায় ওজন বাড়ছে না। দ্রুত লিটার, তাপমাত্রা, কৃমিনাশক ও ভেটেরিনারি পরামর্শ নিন।' 
          : 'Low feed-to-meat conversion. Seek veterinary guidance & examine feed quality.'
      };
    }
  };

  const analysis = getFcrAnalysis(calculatedFCR, farmType);

  return (
    <div className="space-y-4">
      
      {/* Top Toggle Switch between Lifecycle Graph and Quick Calculator */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveMode('graph')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'graph'
                ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-amber-300 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 size={15} />
            <span>
              {language === 'bn' 
                ? (farmType === 'poultry' ? '📉 FCR গ্রাফ (Day 7 → 35)' : farmType === 'cattle' ? '📉 FCR গ্রাফ (মাস ১ → ৫)' : '📉 FCR গ্রাফ (মাস ১ → ৫)')
                : 'FCR Lifecycle Graph'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('calculator')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'calculator'
                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calculator size={15} />
            <span>{language === 'bn' ? '🧮 কুইক FCR ক্যালকুলেটর' : 'Quick FCR Tool'}</span>
          </button>
        </div>

        {selectedBatch && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700">
            <span>{farmType === 'cattle' ? '🐐' : farmType === 'fish' ? '🐟' : '🐔'}</span>
            <span className="truncate max-w-[150px]">{selectedBatch.batchName}</span>
          </div>
        )}
      </div>

      {/* Mode 1: Multi-Sector FCR Lifecycle & Milestone Graph */}
      {activeMode === 'graph' && (
        <FcrMilestoneGraph
          initialSector={farmType}
          batchId={selectedBatch?.id || 'default'}
          batchName={selectedBatch?.batchName}
          currentBirdCount={currentBirdCount}
        />
      )}

      {/* Mode 2: Quick Interactive Single FCR Calculator */}
      {activeMode === 'calculator' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-2xl">
                  <Scale size={22} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                    <span>{language === 'bn' ? '📉 কুইক FCR ও রূপান্তর হিসাব' : 'Feed Conversion Ratio (FCR)'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/20 text-yellow-200">
                      {farmType === 'cattle' ? (language === 'bn' ? 'ছাগল ও পশু' : 'Goat & Cattle') : farmType === 'fish' ? (language === 'bn' ? 'মাছ' : 'Fish') : (language === 'bn' ? 'মুরগী ও পাখি' : 'Chicken & Birds')}
                    </span>
                  </h3>
                  <p className="text-xs text-blue-100 font-medium">
                    {language === 'bn' 
                      ? 'খাবার রূপান্তরের হার ও প্রতি কেজি ওজন বৃদ্ধিতে খাদ্য ব্যয় নির্ধারণ' 
                      : 'Measure feed efficiency & live meat growth performance'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Form Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'মোট খাওয়ানো খাবার (কেজি):' : 'Total Feed Fed (KG):'}
                </label>
                <input
                  type="number"
                  value={totalFeedKg}
                  onChange={(e) => setTotalFeedKg(e.target.value)}
                  placeholder="e.g. 2400"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {farmType === 'cattle'
                    ? (language === 'bn' ? 'পশুর সংখ্যা (টি):' : 'Cattle Count:')
                    : farmType === 'fish'
                    ? (language === 'bn' ? 'মাছের সংখ্যা (টি):' : 'Fish Count:')
                    : (language === 'bn' ? 'জীবিত পাখির সংখ্যা (টি):' : 'Live Birds Count:')}
                </label>
                <input
                  type="number"
                  value={animalCount}
                  onChange={(e) => setAnimalCount(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {farmType === 'cattle'
                    ? (language === 'bn' ? 'বর্তমান গড় ওজন (কেজি):' : 'Current Avg Weight (KG):')
                    : (language === 'bn' ? 'বর্তমান গড় ওজন (গ্রাম):' : 'Current Avg Weight (Grams):')}
                </label>
                <input
                  type="number"
                  value={averageWeight}
                  onChange={(e) => setAverageWeight(e.target.value)}
                  placeholder={farmType === 'cattle' ? 'e.g. 320' : 'e.g. 1650'}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {farmType === 'cattle'
                    ? (language === 'bn' ? 'শুরুর গড় ওজন (কেজি):' : 'Initial Weight (KG):')
                    : (language === 'bn' ? 'শুরুর বাচ্চার ওজন (গ্রাম):' : 'Initial Chick Weight (Grams):')}
                </label>
                <input
                  type="number"
                  value={initialWeight}
                  onChange={(e) => setInitialWeight(e.target.value)}
                  placeholder={farmType === 'cattle' ? '180' : farmType === 'fish' ? '10' : '42'}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>
            </div>

            {/* Calculated Result Display */}
            {calculatedFCR > 0 ? (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* FCR Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-sm text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                      {language === 'bn' ? 'এফ সি আর (FCR)' : 'CALCULATED FCR'}
                    </span>
                    <p className="text-3xl sm:text-4xl font-black font-mono text-yellow-300 mt-1">
                      {calculatedFCR.toFixed(3)}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      {language === 'bn' ? '১ কেজি ওজনে খাবার লেগেছে' : 'Feed needed for 1kg gain'}: <strong>{calculatedFCR.toFixed(2)} KG</strong>
                    </p>
                  </div>

                  {/* Total Live Weight */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {language === 'bn' ? 'মোট জীবন্ত ওজন' : 'TOTAL LIVE WEIGHT'}
                    </span>
                    <p className="text-2xl font-black text-slate-800 font-mono mt-1">
                      {totalLiveWeightKg.toFixed(1)} <span className="text-sm font-bold text-slate-500">{language === 'bn' ? 'কেজি' : 'KG'}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {language === 'bn' ? 'অর্জিত নেট ওজন' : 'Net Weight Gained'}: {netWeightGainedKg.toFixed(1)} KG
                    </p>
                  </div>

                  {/* Feed Cost Per KG Meat */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {language === 'bn' ? 'প্রতি কেজি বৃদ্ধিতে খাদ্য ব্যয়' : 'FEED COST / KG GAIN'}
                    </span>
                    <p className="text-2xl font-black text-teal-700 font-mono mt-1">
                      ৳{feedCostPerKgLiveWeight > 0 ? feedCostPerKgLiveWeight.toFixed(2) : (calculatedFCR * (farmType === 'cattle' ? 35 : 65)).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {language === 'bn' ? '(খাদ্যের গড় বাজার দর অনুযায়ী)' : '(Estimated based on feed rate)'}
                    </p>
                  </div>
                </div>

                {/* Analysis Banner */}
                {analysis && (
                  <div className={`p-4 rounded-2xl border ${analysis.color} space-y-1`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                        <Sparkles size={16} />
                        {analysis.text}
                      </h4>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${analysis.badge}`}>
                        {language === 'bn' ? 'রেটিং' : 'Status'}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium">
                      {analysis.desc}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5">
                <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    {language === 'bn' ? '💡 এফ সি আর (FCR) কী এবং কেন গুরুত্বপূর্ণ?' : '💡 What is FCR and why it matters?'}
                  </p>
                  <p className="text-indigo-800 leading-relaxed font-medium">
                    {language === 'bn' 
                      ? (farmType === 'cattle' 
                          ? 'পশু মোটাতাজাকরণে FCR হলো ১ কেজি ওজন বাড়াতে কত কেজি খাবার খেলো (আদর্শ মাত্রা ৬.০ - ৭.৫)। FCR যত কম হবে খামারির লাভ তত বেশি।'
                          : farmType === 'fish'
                          ? 'মাছ চাষে ১ কেজি মাছের শারীরিক বৃদ্ধির জন্য যত কেজি খাবার প্রয়োজন হয় তাই FCR (আদর্শ মাত্রা ১.২০ - ১.৫০)।'
                          : 'FCR (Feed Conversion Ratio) হলো ১ কেজি মাংস তৈরি করতে কত কেজি খাবার খেলো। ব্রয়লারে আদর্শ FCR ১.৪৫ - ১.৬০। FCR কম হলে খামারির লাভ সর্বোচ্চ হয়।')
                      : 'FCR measures feed needed to produce 1 KG of live animal or fish gain. Lower FCR guarantees maximum operational profitability.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
