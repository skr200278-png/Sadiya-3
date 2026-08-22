import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { TrendingUp, TrendingDown, Minus, MapPin, RefreshCw, Edit3, Check, DollarSign, Store, Tag } from 'lucide-react';

interface MarketItem {
  id: string;
  nameBn: string;
  nameEn: string;
  category: 'poultry' | 'cattle' | 'fish';
  wholesale: string; // পাইকারি দর
  retail: string;    // খুচরা দর
  unitBn: string;
  unitEn: string;
  trend: 'up' | 'down' | 'steady';
  trendTextBn: string;
  trendTextEn: string;
}

interface MarketRatesCardProps {
  farmType: 'poultry' | 'cattle' | 'fish';
}

const DEFAULT_MARKET_RATES: MarketItem[] = [
  // Poultry
  {
    id: 'broiler',
    nameBn: 'ব্রয়লার মুরগি (Broiler)',
    nameEn: 'Broiler Chicken',
    category: 'poultry',
    wholesale: '১৭৫ - ১৮০',
    retail: '১৯৫ - ২০৫',
    unitBn: 'কেজি',
    unitEn: 'KG',
    trend: 'up',
    trendTextBn: '+২ ৳ বৃদ্ধি',
    trendTextEn: '+2 ৳ Up'
  },
  {
    id: 'sonali',
    nameBn: 'সোনালী মুরগি (Sonali)',
    nameEn: 'Sonali Chicken',
    category: 'poultry',
    wholesale: '২৮০ - ২৯০',
    retail: '৩০০ - ৩১৫',
    unitBn: 'কেজি',
    unitEn: 'KG',
    trend: 'steady',
    trendTextBn: 'স্থিতিশীল',
    trendTextEn: 'Steady'
  },
  {
    id: 'deshi',
    nameBn: 'দেশি মুরগি (Deshi)',
    nameEn: 'Deshi Local Chicken',
    category: 'poultry',
    wholesale: '৪৬০ - ৪৮০',
    retail: '৫১০ - ৫৩০',
    unitBn: 'কেজি',
    unitEn: 'KG',
    trend: 'up',
    trendTextBn: '+৫ ৳ বৃদ্ধি',
    trendTextEn: '+5 ৳ Up'
  },
  {
    id: 'chick_broiler',
    nameBn: 'একদিন বাচ্চা (ব্রয়লার DOC)',
    nameEn: 'Broiler DOC Chick',
    category: 'poultry',
    wholesale: '৫০ - ৫৪',
    retail: '৫৫ - ৫৮',
    unitBn: 'পিস',
    unitEn: 'Piece',
    trend: 'down',
    trendTextBn: '-১ ৳ হ্রাস',
    trendTextEn: '-1 ৳ Down'
  },
  {
    id: 'egg_layer',
    nameBn: 'লেয়ার লাল ডিম',
    nameEn: 'Layer Red Egg',
    category: 'poultry',
    wholesale: '৪৫ - ৪৭',
    retail: '৫০ - ৫২',
    unitBn: 'হালি',
    unitEn: '4 Pcs (Hali)',
    trend: 'steady',
    trendTextBn: 'স্থিতিশীল',
    trendTextEn: 'Steady'
  },

  // Cattle
  {
    id: 'beef_meat',
    nameBn: 'গরুর মাংস (Beef)',
    nameEn: 'Beef Meat',
    category: 'cattle',
    wholesale: '৭২০ - ৭৪০',
    retail: '৭৫০ - ৭৮০',
    unitBn: 'কেজি',
    unitEn: 'KG',
    trend: 'steady',
    trendTextBn: 'স্থিতিশীল',
    trendTextEn: 'Steady'
  },
  {
    id: 'raw_milk',
    nameBn: 'খাঁটি তরল দুধ (Fresh Milk)',
    nameEn: 'Raw Fresh Milk',
    category: 'cattle',
    wholesale: '৬৫ - ৭০',
    retail: '৭৫ - ৮৫',
    unitBn: 'লিটার',
    unitEn: 'Litre',
    trend: 'up',
    trendTextBn: '+২ ৳ বৃদ্ধি',
    trendTextEn: '+2 ৳ Up'
  },
  {
    id: 'goat_meat',
    nameBn: 'খাসির মাংস (Mutton)',
    nameEn: 'Mutton / Goat Meat',
    category: 'cattle',
    wholesale: '১০০০ - ১০৫০',
    retail: '১১০০ - ১২০০',
    unitBn: 'কেজি',
    unitEn: 'KG',
    trend: 'steady',
    trendTextBn: 'স্থিতিশীল',
    trendTextEn: 'Steady'
  },

  // Fish
  {
    id: 'fish_rui',
    nameBn: 'রুই / কাতলা মাছ',
    nameEn: 'Rui / Katla Fish',
    category: 'fish',
    wholesale: '২৭০ - ২৯০',
    retail: '৩২০ - ৩৫০',
    unitBn: 'কেজি',
    unitEn: 'KG',
    trend: 'steady',
    trendTextBn: 'স্থিতিশীল',
    trendTextEn: 'Steady'
  },
  {
    id: 'fish_telapia',
    nameBn: 'তেলাপিয়া / পাঙ্গাস',
    nameEn: 'Tilapia / Pangas',
    category: 'fish',
    wholesale: '১৬০ - ১৭০',
    retail: '১৯০ - ২১০',
    unitBn: 'কেজি',
    unitEn: 'KG',
    trend: 'down',
    trendTextBn: '-৩ ৳ হ্রাস',
    trendTextEn: '-3 ৳ Down'
  }
];

export default function MarketRatesCard({ farmType }: MarketRatesCardProps) {
  const { language } = useLanguage();
  const [rates, setRates] = useState<MarketItem[]>(() => {
    const saved = localStorage.getItem('user_market_rates_cache');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_MARKET_RATES;
      }
    }
    return DEFAULT_MARKET_RATES;
  });

  const [selectedDivision, setSelectedDivision] = useState<string>(() => {
    return localStorage.getItem('user_market_division') || (language === 'bn' ? 'জাতীয় গড় বাজার' : 'National Avg');
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editRates, setEditRates] = useState<MarketItem[]>(rates);

  useEffect(() => {
    setEditRates(rates);
  }, [rates]);

  const filteredRates = rates.filter(r => r.category === farmType);

  const handleSaveRates = () => {
    setRates(editRates);
    localStorage.setItem('user_market_rates_cache', JSON.stringify(editRates));
    setIsEditing(false);
  };

  const handleResetDefaults = () => {
    setRates(DEFAULT_MARKET_RATES);
    setEditRates(DEFAULT_MARKET_RATES);
    localStorage.removeItem('user_market_rates_cache');
    setIsEditing(false);
  };

  const todayFormatted = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-200/70 relative overflow-hidden animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-amber-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0 font-bold">
            <Store size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-slate-850 text-sm leading-tight">
                {language === 'bn' ? 'আজকের লাইভ বাজার দর' : 'Today\'s Market Rates'}
              </h4>
              <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider border border-amber-300">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
              <span>📅 {todayFormatted}</span>
              <span>•</span>
              <span className="text-amber-700 font-semibold">{selectedDivision}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title={language === 'bn' ? 'দর পরিবর্তন' : 'Edit Rate'}
          >
            <Edit3 size={13} />
            <span className="text-[10px] hidden sm:inline">{isEditing ? (language === 'bn' ? 'বাতিল' : 'Cancel') : (language === 'bn' ? 'দর বদল' : 'Edit')}</span>
          </button>
        </div>
      </div>

      {/* Edit Mode Inputs */}
      {isEditing ? (
        <div className="space-y-3 bg-amber-50/40 p-3 rounded-xl border border-amber-200">
          <p className="text-[11px] font-bold text-slate-700 mb-2">
            {language === 'bn' ? 'আপনার এলাকার নিজস্ব পাইকারি ও খুচরা রেট লিখুন:' : 'Set your local wholesale & retail prices:'}
          </p>
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {editRates.filter(r => r.category === farmType).map((item) => (
              <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                <p className="font-bold text-slate-800 mb-1.5">{language === 'bn' ? item.nameBn : item.nameEn}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block mb-0.5">{language === 'bn' ? 'পাইকারি (৳)' : 'Wholesale'}</span>
                    <input
                      type="text"
                      value={item.wholesale}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditRates(prev => prev.map(p => p.id === item.id ? { ...p, wholesale: val } : p));
                      }}
                      className="w-full p-1.5 text-xs border border-slate-200 rounded font-sans font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block mb-0.5">{language === 'bn' ? 'খুচরা (৳)' : 'Retail'}</span>
                    <input
                      type="text"
                      value={item.retail}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditRates(prev => prev.map(p => p.id === item.id ? { ...p, retail: val } : p));
                      }}
                      className="w-full p-1.5 text-xs border border-slate-200 rounded font-sans font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveRates}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check size={14} />
              {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Rates'}
            </button>
            <button
              onClick={handleResetDefaults}
              className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'ডিফল্ট' : 'Reset'}
            </button>
          </div>
        </div>
      ) : (
        /* Market Rates View Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredRates.map((item) => (
            <div 
              key={item.id} 
              className="bg-slate-50/70 hover:bg-amber-50/20 border border-slate-150/80 hover:border-amber-200/80 p-3 rounded-xl transition-all duration-150 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-1 mb-1.5">
                <span className="text-xs font-extrabold text-slate-800 leading-tight">
                  {language === 'bn' ? item.nameBn : item.nameEn}
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0 ${
                  item.trend === 'up' ? 'bg-emerald-100 text-emerald-800' :
                  item.trend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-slate-200/70 text-slate-600'
                }`}>
                  {item.trend === 'up' && <TrendingUp size={10} />}
                  {item.trend === 'down' && <TrendingDown size={10} />}
                  {item.trend === 'steady' && <Minus size={10} />}
                  <span>{language === 'bn' ? item.trendTextBn : item.trendTextEn}</span>
                </span>
              </div>

              {/* Price Columns */}
              <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200/50">
                {/* Wholesale Rate */}
                <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block leading-none mb-0.5">
                    {language === 'bn' ? 'পাইকারি দর' : 'Wholesale'}
                  </span>
                  <p className="text-xs font-black text-amber-750 font-sans leading-tight">
                    ৳ {item.wholesale} <span className="text-[9px] text-slate-400 font-semibold font-sans">/{language === 'bn' ? item.unitBn : item.unitEn}</span>
                  </p>
                </div>

                {/* Retail Rate */}
                <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block leading-none mb-0.5">
                    {language === 'bn' ? 'খুচরা দর' : 'Retail'}
                  </span>
                  <p className="text-xs font-black text-emerald-700 font-sans leading-tight">
                    ৳ {item.retail} <span className="text-[9px] text-slate-400 font-semibold font-sans">/{language === 'bn' ? item.unitBn : item.unitEn}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info / Tip & Marketplace Link */}
      <div className="mt-3 pt-2.5 border-t border-amber-100/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-bold">
        <span>💡 {language === 'bn' ? 'প্রতিদিনের বাজার ওঠানামার সাথে সামঞ্জস্যপূর্ণ' : 'Updated with daily livestock market shifts'}</span>
        <a 
          href="#/marketplace" 
          className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-extrabold flex items-center gap-1 transition-colors"
        >
          {language === 'bn' ? 'পাইকার ডিরেক্টরি ও বিজ্ঞাপন ➔' : 'Wholesale Buyers & Ads ➔'}
        </a>
      </div>
    </div>
  );
}
