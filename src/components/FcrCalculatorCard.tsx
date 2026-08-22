import React, { useState, useEffect } from 'react';
import { Scale, Calculator, TrendingUp, AlertTriangle, CheckCircle2, Info, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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

  // Interactive inputs with auto-fallback from batch data
  const [totalFeedKg, setTotalFeedKg] = useState<string>(totalFeedConsumedKg > 0 ? totalFeedConsumedKg.toString() : '');
  const [averageWeightGram, setAverageWeightGram] = useState<string>('');
  const [birdsCount, setBirdsCount] = useState<string>(currentBirdCount > 0 ? currentBirdCount.toString() : '');
  const [initialChickWeightGram, setInitialChickWeightGram] = useState<string>('42'); // Standard 42g day-old chick

  useEffect(() => {
    if (totalFeedConsumedKg > 0 && !totalFeedKg) {
      setTotalFeedKg(totalFeedConsumedKg.toString());
    }
    if (currentBirdCount > 0 && !birdsCount) {
      setBirdsCount(currentBirdCount.toString());
    }
  }, [totalFeedConsumedKg, currentBirdCount]);

  const feedVal = parseFloat(totalFeedKg) || 0;
  const avgWeightVal = parseFloat(averageWeightGram) || 0;
  const birdsVal = parseFloat(birdsCount) || 0;
  const initialWeightVal = parseFloat(initialChickWeightGram) || 40;

  // Total Live Weight (KG)
  const totalLiveWeightKg = birdsVal > 0 && avgWeightVal > 0 ? (birdsVal * avgWeightVal) / 1000 : 0;
  // Total Initial Weight (KG)
  const totalInitialWeightKg = birdsVal > 0 ? (birdsVal * initialWeightVal) / 1000 : 0;
  // Net Weight Gained (KG)
  const netWeightGainedKg = Math.max(0, totalLiveWeightKg - totalInitialWeightKg);

  // FCR Calculation
  const calculatedFCR = netWeightGainedKg > 0 && feedVal > 0 ? (feedVal / netWeightGainedKg) : 0;

  // Cost per kg feed
  const feedCostPerKg = feedVal > 0 && totalFeedCost > 0 ? (totalFeedCost / feedVal) : 0;
  const feedCostPerKgLiveWeight = calculatedFCR > 0 && feedCostPerKg > 0 ? calculatedFCR * feedCostPerKg : 0;

  const farmType = selectedBatch?.farmType || 'poultry';

  // FCR Grade
  const getFcrAnalysis = (fcr: number) => {
    if (fcr === 0) return null;

    if (fcr <= 1.45) {
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

  const analysis = getFcrAnalysis(calculatedFCR);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Scale size={22} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {language === 'bn' ? '📉 অটো FCR ও গ্রোথ ক্যালকুলেটর' : 'Feed Conversion Ratio (FCR)'}
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                {language === 'bn' ? 'খাবার রূপান্তরের হার ও প্রতি কেজি মাংস উৎপাদনে খাদ্য খরচ' : 'Measure feed efficiency & live meat growth performance'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'bn' ? 'মোট খাওয়ানো খাবার (কেজি):' : 'Total Feed Fed (KG):'}
            </label>
            <input
              type="number"
              value={totalFeedKg}
              onChange={(e) => setTotalFeedKg(e.target.value)}
              placeholder="e.g. 2400"
              className="w-full border border-slate-300 rounded-xl p-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'bn' ? 'বর্তমান জীবিত সংখ্যা (টি/টি মাথা):' : 'Live Birds Count:'}
            </label>
            <input
              type="number"
              value={birdsCount}
              onChange={(e) => setBirdsCount(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full border border-slate-300 rounded-xl p-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'bn' ? 'গড় ওজন (গ্রাম হিসেবে):' : 'Average Weight (Grams):'}
            </label>
            <input
              type="number"
              value={averageWeightGram}
              onChange={(e) => setAverageWeightGram(e.target.value)}
              placeholder="e.g. 1650"
              className="w-full border border-slate-300 rounded-xl p-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
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
                  {language === 'bn' ? '১ কেজি ওজনে খাবার লেগেছে' : 'Feed needed for 1kg meat'}: <strong>{calculatedFCR.toFixed(2)} KG</strong>
                </p>
              </div>

              {/* Total Meat Weight */}
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
                  {language === 'bn' ? 'প্রতি কেজি মাংসে খাদ্য ব্যয়' : 'FEED COST / KG MEAT'}
                </span>
                <p className="text-2xl font-black text-teal-700 font-mono mt-1">
                  ৳{feedCostPerKgLiveWeight > 0 ? feedCostPerKgLiveWeight.toFixed(2) : (calculatedFCR * 65).toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {language === 'bn' ? '(ফিডের আনুমানিক বাজার দর অনুযায়ী)' : '(Estimated based on feed rate)'}
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
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${analysis.badge}`}>
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
                  ? 'FCR (Feed Conversion Ratio) হলো ১ কেজি মাংস তৈরি করতে আপনার পশুপাখি কত কেজি খাবার খেলো। FCR যত কম হবে (যেমন: ১.৪৫ - ১.৫৫), খামারির লাভ তত বেশি হবে।' 
                  : 'FCR measures how many kilograms of feed are needed to produce one kilogram of live animal meat. Lower FCR means maximum profit.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
