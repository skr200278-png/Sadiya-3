import React, { useState, useEffect } from 'react';
import { useLanguage, SUPPORTED_COUNTRIES } from '../contexts/LanguageContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MapPin, 
  RefreshCw, 
  Edit3, 
  Check, 
  DollarSign, 
  Store, 
  Tag,
  Egg,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { DemoChickRate, demoStore } from '../utils/demoStore';
import { 
  MarketItem, 
  DIVISION_KEYS, 
  DIVISION_MARKET_DATA, 
  getDivisionData,
  NATIONAL_DEFAULT_MARKET_RATES 
} from '../utils/marketRatesData';

interface MarketRatesCardProps {
  farmType: 'poultry' | 'cattle' | 'fish';
}

// Digits conversion helpers to avoid showing Bengali numerals in English
export const toEnDigits = (val: string | number | undefined | null) => {
  if (val === undefined || val === null) return '';
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/[০-৯]/g, (d) => String(bn.indexOf(d)));
};

export const toBnDigits = (val: string | number | undefined | null) => {
  if (val === undefined || val === null) return '';
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/[0-9]/g, (d) => bn[Number(d)] || d);
};

// Comprehensive English Name Mapping for Adult Live Birds & Meat
const ENGLISH_ITEM_NAMES: Record<string, string> = {
  'broiler': 'Broiler Chicken (Live)',
  'sonali': 'Sonali Chicken (Live)',
  'deshi': 'Deshi Local Chicken',
  'chick_broiler': 'Broiler Day-Old Chick (DOC)',
  'egg_layer': 'Layer Red Eggs (4 Pcs)',
  'beef_meat': 'Fresh Beef Meat',
  'raw_milk': 'Raw Fresh Milk',
  'goat_meat': 'Mutton / Goat Meat',
  'fish_rui': 'Rui / Katla Carp',
  'fish_telapia': 'Tilapia / Pangas'
};

export const formatRateDisplay = (rateText: string | number | undefined | null, currentLang: string) => {
  if (rateText === undefined || rateText === null) return '';
  const str = String(rateText);
  if (currentLang === 'en') {
    // 1. Convert Bengali numerals (০-৯) to English digits (0-9)
    let converted = toEnDigits(str);
    // 2. Strip any Bengali script characters (e.g. টাকা, কেজি, দর)
    converted = converted.replace(/[\u0980-\u09FF]/g, '').trim();
    // 3. Normalize hyphens
    converted = converted.replace(/\s*-\s*/g, ' - ');
    return converted || '0';
  }
  return toBnDigits(str);
};

export const getItemDisplayName = (item: any, currentLang: string) => {
  if (currentLang === 'en') {
    if (item.id && ENGLISH_ITEM_NAMES[item.id]) {
      return ENGLISH_ITEM_NAMES[item.id];
    }
    if (item.nameEn && item.nameEn.trim() && !/[\u0980-\u09FF]/.test(item.nameEn)) {
      return item.nameEn.trim();
    }
    // Extract English within parenthesis if exists, e.g. "ব্রয়লার মুরগি (Broiler)" -> "Broiler"
    const raw = item.nameBn || item.name || '';
    const match = raw.match(/\(([A-Za-z0-9\s\/\-_]+)\)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    // Strip all Bengali characters
    const stripped = raw.replace(/[\u0980-\u09FF]/g, '').replace(/[()]/g, '').trim();
    if (stripped) return stripped;
    return 'Live Bird / Livestock';
  }
  return item.nameBn || item.name || item.nameEn || 'মুরগি / পণ্য';
};

export const getItemUnitDisplay = (item: any, currentLang: string) => {
  if (currentLang === 'en') {
    if (item.unitEn && item.unitEn.trim() && !/[\u0980-\u09FF]/.test(item.unitEn)) {
      return item.unitEn.trim();
    }
    const raw = (item.unitBn || item.unit || item.unitEn || '').trim();
    if (raw.includes('কেজি') || raw.toLowerCase().includes('kg')) return 'KG';
    if (raw.includes('পিস') || raw.toLowerCase().includes('piece') || raw.toLowerCase().includes('pc')) return 'Piece';
    if (raw.includes('হালি')) return '4 Pcs';
    if (raw.includes('লিটার') || raw.toLowerCase().includes('liter') || raw.toLowerCase().includes('litre')) return 'Litre';
    const stripped = raw.replace(/[\u0980-\u09FF]/g, '').trim();
    return stripped || 'KG';
  }
  return item.unitBn || item.unit || item.unitEn || 'কেজি';
};

export const getTrendDisplay = (item: any, currentLang: string, currencySymbol: string) => {
  if (currentLang === 'en') {
    if (item.trendTextEn && !/[\u0980-\u09FF]/.test(item.trendTextEn)) {
      return toEnDigits(item.trendTextEn).replace('৳', currencySymbol).trim();
    }
    if (item.trend === 'up') return '+Up';
    if (item.trend === 'down') return '-Down';
    return 'Steady';
  }
  return item.trendTextBn || (item.trend === 'up' ? '+বৃদ্ধি' : item.trend === 'down' ? '-হ্রাস' : 'স্থিতিশীল');
};

export const getChickDisplayName = (chick: any, currentLang: string) => {
  if (currentLang === 'en') {
    if (chick.id === 'rate_broiler' || chick.subCategory === 'broiler') return 'Broiler Day-Old Chick (DOC)';
    if (chick.id === 'rate_sonali' || chick.subCategory === 'sonali') return 'Sonali Classic / Hybrid Chick';
    if (chick.id === 'rate_layer_brown' || chick.subCategory === 'layer') return 'Layer Brown Egg Chick';
    if (chick.id === 'rate_cockerel' || chick.subCategory === 'cockerel') return 'Cockerel / Fayoumi Chick';
    if (chick.id === 'rate_quail' || chick.subCategory === 'quail') return 'Japanese Quail Chick';
    if (chick.id === 'rate_duck' || chick.subCategory === 'duck') return 'Duckling (Khaki / Pekin)';
    if (chick.nameEn && !/[\u0980-\u09FF]/.test(chick.nameEn)) return chick.nameEn.trim();
    return 'Hatchery Day-Old Chick';
  }
  return chick.nameBn || chick.nameEn || 'একদিনের বাচ্চা';
};

export const getChickNoteDisplay = (chick: any, currentLang: string) => {
  if (currentLang === 'en') {
    if (chick.id === 'rate_broiler' || chick.subCategory === 'broiler') return 'Grade-A: 40g+ weight, Gumboro & Marek vaccinated. Fast uniform growth.';
    if (chick.id === 'rate_sonali' || chick.subCategory === 'sonali') return 'Grade-A: Classic & hybrid cross, 39g+ weight, 98% vigor.';
    if (chick.id === 'rate_layer_brown' || chick.subCategory === 'layer') return 'Grade-A: 92-95% peak egg production record with high immunity.';
    if (chick.id === 'rate_cockerel' || chick.subCategory === 'cockerel') return 'Grade-A: 100% male sexed chick, disease-free.';
    if (chick.id === 'rate_quail' || chick.subCategory === 'quail') return 'Grade-A: Starts laying eggs in 42 days, active healthy hybrid.';
    if (chick.id === 'rate_duck' || chick.subCategory === 'duck') return 'Grade-A: High egg laying breed ducklings.';
    if (chick.noteEn && !/[\u0980-\u09FF]/.test(chick.noteEn)) return chick.noteEn;
    return 'Premium certified hatchery high-grade chicks.';
  }
  return chick.noteBn || chick.noteEn || 'হ্যাচারির গ্রেড-১ মানের বাচ্চা';
};

export default function MarketRatesCard({ farmType }: MarketRatesCardProps) {
  const { language, country, currencySymbol } = useLanguage();
  const [activeTab, setActiveTab] = useState<'meat' | 'chicks'>('meat');

  // Active Division Key: prioritizes 'international' if user is in an outside country
  const [selectedDivisionKey, setSelectedDivisionKey] = useState<string>(() => {
    const savedCountry = localStorage.getItem('appCountry');
    if (savedCountry && savedCountry !== 'BD') return 'international';
    const saved = localStorage.getItem('user_market_division_key');
    if (saved) return saved;
    return 'national';
  });

  const matchedCountry = SUPPORTED_COUNTRIES.find(c => c.code === country);
  const currentDivInfo = getDivisionData(selectedDivisionKey);

  const divisionDisplayName = selectedDivisionKey === 'international' && country && country !== 'BD'
    ? (language === 'bn' ? `${matchedCountry ? matchedCountry.nameBn : 'আন্তর্জাতিক'} বাজার` : `${matchedCountry ? matchedCountry.nameEn : 'International'} Local Market`)
    : (language === 'bn' ? currentDivInfo.nameBn : (currentDivInfo.key === 'national' ? 'National Average (BD)' : currentDivInfo.nameEn));

  const hubDisplayNote = selectedDivisionKey === 'international' && country && country !== 'BD'
    ? (language === 'bn' 
        ? `${matchedCountry ? matchedCountry.nameBn : 'প্রবাসী'}-এর স্থানীয় বর্তমান বাজার ও খামারের নিজস্ব রেট` 
        : `Local farm & live market rates in ${matchedCountry ? matchedCountry.nameEn : 'your country'}`)
    : (language === 'bn' ? currentDivInfo.hubNoteBn : currentDivInfo.hubNoteEn);

  // Livestock & Egg Rates
  const [rates, setRates] = useState<MarketItem[]>(() => {
    const savedCountry = localStorage.getItem('appCountry');
    const isForeign = savedCountry && savedCountry !== 'BD';
    const key = isForeign ? 'international' : (localStorage.getItem('user_market_division_key') || 'national');
    const saved = localStorage.getItem(`user_market_rates_cache_${key}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return getDivisionData(key).rates;
      }
    }
    // Backward compatibility for legacy cache only for Bangladesh national
    const legacySaved = localStorage.getItem('user_market_rates_cache');
    if (legacySaved && key === 'national' && !isForeign) {
      try {
        return JSON.parse(legacySaved);
      } catch (e) {
        return getDivisionData('national').rates;
      }
    }
    return getDivisionData(key).rates;
  });

  // Chick Market Rates (Grade A, B, C)
  const [chickRates, setChickRates] = useState<DemoChickRate[]>(() => {
    const savedCountry = localStorage.getItem('appCountry');
    const isForeign = savedCountry && savedCountry !== 'BD';
    const key = isForeign ? 'international' : (localStorage.getItem('user_market_division_key') || 'national');
    const saved = localStorage.getItem(`user_chick_rates_cache_${key}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return getDivisionData(key).chickRates;
      }
    }
    return getDivisionData(key).chickRates;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editRates, setEditRates] = useState<MarketItem[]>(rates);
  const [editChickRates, setEditChickRates] = useState<DemoChickRate[]>(chickRates);
  const [showSwitchedToast, setShowSwitchedToast] = useState(false);

  // Handle Division Selection Change
  const handleDivisionChange = (newKey: string) => {
    setSelectedDivisionKey(newKey);
    localStorage.setItem('user_market_division_key', newKey);
    const divData = getDivisionData(newKey);
    localStorage.setItem('user_market_division', language === 'bn' ? divData.nameBn : divData.nameEn);

    // Check if user has saved custom edits for this division
    const savedRates = localStorage.getItem(`user_market_rates_cache_${newKey}`);
    const newRates = savedRates ? JSON.parse(savedRates) : divData.rates;
    setRates(newRates);
    setEditRates(newRates);

    const savedChickRates = localStorage.getItem(`user_chick_rates_cache_${newKey}`);
    const newChickRates = savedChickRates ? JSON.parse(savedChickRates) : divData.chickRates;
    setChickRates(newChickRates);
    setEditChickRates(newChickRates);

    setIsEditing(false);
    setShowSwitchedToast(true);
    setTimeout(() => setShowSwitchedToast(false), 2200);
  };

  // Auto-switch to international if country is outside Bangladesh
  useEffect(() => {
    if (country && country !== 'BD') {
      if (selectedDivisionKey !== 'international') {
        handleDivisionChange('international');
      }
    }
  }, [country]);

  useEffect(() => {
    setEditRates(rates);
  }, [rates]);

  useEffect(() => {
    setEditChickRates(chickRates);
  }, [chickRates]);

  const filteredRates = rates.filter(r => r.category === farmType);

  const handleSaveRates = () => {
    if (activeTab === 'meat') {
      setRates(editRates);
      localStorage.setItem(`user_market_rates_cache_${selectedDivisionKey}`, JSON.stringify(editRates));
      if (selectedDivisionKey === 'national') {
        localStorage.setItem('user_market_rates_cache', JSON.stringify(editRates));
      }
    } else {
      setChickRates(editChickRates);
      localStorage.setItem(`user_chick_rates_cache_${selectedDivisionKey}`, JSON.stringify(editChickRates));
      if (selectedDivisionKey === 'national') {
        localStorage.setItem('user_chick_rates_cache', JSON.stringify(editChickRates));
        editChickRates.forEach(r => demoStore.updateChickRate(r.id, r));
      }
    }
    setIsEditing(false);
  };

  const handleResetDefaults = () => {
    const divData = getDivisionData(selectedDivisionKey);
    if (activeTab === 'meat') {
      setRates(divData.rates);
      setEditRates(divData.rates);
      localStorage.removeItem(`user_market_rates_cache_${selectedDivisionKey}`);
      if (selectedDivisionKey === 'national') {
        localStorage.removeItem('user_market_rates_cache');
      }
    } else {
      setChickRates(divData.chickRates);
      setEditChickRates(divData.chickRates);
      localStorage.removeItem(`user_chick_rates_cache_${selectedDivisionKey}`);
      if (selectedDivisionKey === 'national') {
        localStorage.removeItem('user_chick_rates_cache');
      }
    }
    setIsEditing(false);
  };

  const todayFormatted = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-200/70 relative overflow-hidden animate-fadeIn">
      {/* Toast notification when division switched */}
      {showSwitchedToast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-amber-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
          <CheckCircle2 size={13} className="text-amber-200" />
          <span>{language === 'bn' ? `${divisionDisplayName}-এর লাইভ বাজার দর লোড হয়েছে` : `Loaded ${divisionDisplayName} live market rates`}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-amber-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0 font-bold">
            <Store size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-slate-850 text-sm leading-tight">
                {language === 'bn' ? 'আজকের লাইভ বাজার দর' : 'Today\'s Market Rates'}
              </h4>
              <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
              <span>📅 {todayFormatted}</span>
              <span>•</span>
              <span className="text-amber-800 font-black">{divisionDisplayName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleResetDefaults()}
            className="p-1.5 text-xs font-bold text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title={language === 'bn' ? 'বিভাগীয় লাইভ রেট রিলোড' : 'Reload Live Rate'}
          >
            <RefreshCw size={13} />
            <span className="text-[10px] hidden sm:inline">{language === 'bn' ? 'লাইভ রিফ্রেশ' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title={language === 'bn' ? 'দর পরিবর্তন' : 'Edit Rate'}
          >
            <Edit3 size={13} />
            <span className="text-[10px] hidden sm:inline">{isEditing ? (language === 'bn' ? 'বাতিল' : 'Cancel') : (language === 'bn' ? 'দর পরিবর্তন' : 'Edit')}</span>
          </button>
        </div>
      </div>

      {/* Division Selector & Hub Highlights */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-2 sm:p-2.5 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <MapPin size={15} className="text-amber-700 shrink-0" />
            <span className="text-xs font-black text-amber-950">
              {language === 'bn' ? 'আপনার বিভাগ / বাজার নির্বাচন করুন:' : 'Select Market / Region:'}
            </span>
            <select
              value={selectedDivisionKey}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-black text-amber-900 shadow-2xs focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              {(() => {
                // If country is outside Bangladesh, prioritize international at the top of select
                const sortedDivs = (country && country !== 'BD')
                  ? [
                      DIVISION_KEYS.find(d => d.key === 'international')!,
                      ...DIVISION_KEYS.filter(d => d.key !== 'international')
                    ]
                  : DIVISION_KEYS;

                return sortedDivs.map((div) => {
                  let label = language === 'bn' ? div.nameBn : div.nameEn;
                  if (div.key === 'international' && country && country !== 'BD') {
                    const matched = SUPPORTED_COUNTRIES.find(c => c.code === country);
                    label = language === 'bn' 
                      ? `${matched ? matched.nameBn : 'আন্তর্জাতিক'} স্থানীয় বাজার` 
                      : `${matched ? matched.nameEn : 'International'} Local Market`;
                  } else if (language === 'en') {
                    if (div.key === 'national') label = 'Bangladesh National Average';
                    else if (div.key !== 'international') label = `${div.nameEn} Division`;
                  }
                  return (
                    <option key={div.key} value={div.key}>
                      {label}
                    </option>
                  );
                });
              })()}
            </select>
          </div>

          <div className="text-[10.5px] text-amber-900/90 font-medium flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-lg border border-amber-200/60">
            <span className="text-amber-700 font-bold shrink-0">📍 {language === 'bn' ? 'আড়ত:' : 'Hub:'}</span>
            <span className="font-bold truncate">{hubDisplayNote}</span>
          </div>
        </div>

        {/* Quick Division Pills for 1-Click Switching */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 mt-2 border-t border-amber-200/60 scrollbar-none pb-0.5">
          {(() => {
            const sortedDivs = (country && country !== 'BD')
              ? [
                  DIVISION_KEYS.find(d => d.key === 'international')!,
                  ...DIVISION_KEYS.filter(d => d.key !== 'international')
                ]
              : DIVISION_KEYS;

            return sortedDivs.map((div) => {
              const isSelected = selectedDivisionKey === div.key;
              let label = language === 'bn' ? div.nameBn.replace(' বিভাগ', '') : div.nameEn;
              if (div.key === 'international' && country && country !== 'BD') {
                const matched = SUPPORTED_COUNTRIES.find(c => c.code === country);
                label = language === 'bn' ? (matched ? matched.nameBn : 'প্রবাসী') : (matched ? matched.nameEn : 'International');
              } else if (language === 'en') {
                if (div.key === 'national') label = 'National (BD)';
              }

              return (
                <button
                  key={div.key}
                  type="button"
                  onClick={() => handleDivisionChange(div.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-2xs scale-102 ring-1 ring-amber-700'
                      : 'bg-white hover:bg-amber-100/70 text-slate-700 hover:text-amber-900 border border-amber-200/70'
                  }`}
                >
                  {label}
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Sub-Tabs: মুরগি/পণ্য বনাম বাচ্চার বাজার দর */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 border border-slate-200">
        <button
          type="button"
          onClick={() => { setActiveTab('meat'); setIsEditing(false); }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'meat'
              ? 'bg-white text-slate-900 shadow-2xs font-extrabold border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🐔</span>
          <span>{language === 'bn' ? (farmType === 'poultry' ? 'মুরগি ও ডিমের দর' : 'পণ্য ও মাংসের দর') : (farmType === 'poultry' ? 'Live Birds & Eggs' : 'Livestock & Meat')}</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('chicks'); setIsEditing(false); }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'chicks'
              ? 'bg-amber-500 text-white shadow-2xs font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🐣</span>
          <span>{language === 'bn' ? 'বাচ্চার বাজার দর (A, B, C)' : 'Chick Rates (A, B, C)'}</span>
        </button>
      </div>

      {/* Edit Mode */}
      {isEditing ? (
        <div className="space-y-3 bg-amber-50/40 p-3 rounded-xl border border-amber-200">
          <p className="text-[11px] font-bold text-slate-700 mb-2">
            {activeTab === 'meat'
              ? (language === 'bn' ? `আপনার এলাকার নিজস্ব পাইকারি ও খুচরা রেট লিখুন (${currencySymbol}):` : `Set your local wholesale & retail prices (${currencySymbol}):`)
              : (language === 'bn' ? `বাচ্চার গ্রেড অনুযায়ী নিজস্ব রেট লিখুন (${currencySymbol}/পিস):` : `Set your local chick grade prices (${currencySymbol}/Piece):`)}
          </p>
          
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {activeTab === 'meat' ? (
              editRates.filter(r => r.category === farmType).map((item) => (
                <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                  <p className="font-bold text-slate-800 mb-1.5">{getItemDisplayName(item, language)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block mb-0.5">{language === 'bn' ? `পাইকারি (${currencySymbol})` : `Wholesale (${currencySymbol})`}</span>
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
                      <span className="text-[9px] text-slate-500 font-bold block mb-0.5">{language === 'bn' ? `খুচরা (${currencySymbol})` : `Retail (${currencySymbol})`}</span>
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
              ))
            ) : (
              editChickRates.map((item) => (
                <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                  <p className="font-bold text-slate-800 mb-1.5">{getChickDisplayName(item, language)}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <span className="text-[9px] text-emerald-700 font-bold block mb-0.5">Grade A ({currencySymbol})</span>
                      <input
                        type="number"
                        value={item.gradeA}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setEditChickRates(prev => prev.map(p => p.id === item.id ? { ...p, gradeA: val } : p));
                        }}
                        className="w-full p-1.5 text-xs border border-slate-200 rounded font-sans font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-amber-700 font-bold block mb-0.5">Grade B ({currencySymbol})</span>
                      <input
                        type="number"
                        value={item.gradeB}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setEditChickRates(prev => prev.map(p => p.id === item.id ? { ...p, gradeB: val } : p));
                        }}
                        className="w-full p-1.5 text-xs border border-slate-200 rounded font-sans font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-purple-700 font-bold block mb-0.5">Grade C ({currencySymbol})</span>
                      <input
                        type="number"
                        value={item.gradeC}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setEditChickRates(prev => prev.map(p => p.id === item.id ? { ...p, gradeC: val } : p));
                        }}
                        className="w-full p-1.5 text-xs border border-slate-200 rounded font-sans font-bold text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveRates}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check size={14} />
              <span>{language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Rates'}</span>
            </button>
            <button
              onClick={handleResetDefaults}
              className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'ডিফল্ট' : 'Reset'}
            </button>
          </div>
        </div>
      ) : activeTab === 'meat' ? (
        /* 1. Live Livestock / Meat / Egg Rates View */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredRates.map((item) => (
            <div 
              key={item.id} 
              className="bg-slate-50/70 hover:bg-amber-50/20 border border-slate-150/80 hover:border-amber-200/80 p-3 rounded-xl transition-all duration-150 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-1 mb-1.5">
                <span className="text-xs font-extrabold text-slate-800 leading-tight">
                  {getItemDisplayName(item, language)}
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0 ${
                  item.trend === 'up' ? 'bg-emerald-100 text-emerald-800' :
                  item.trend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-slate-200/70 text-slate-600'
                }`}>
                  {item.trend === 'up' && <TrendingUp size={10} />}
                  {item.trend === 'down' && <TrendingDown size={10} />}
                  {item.trend === 'steady' && <Minus size={10} />}
                  <span>{getTrendDisplay(item, language, currencySymbol)}</span>
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
                    {currencySymbol} {formatRateDisplay(item.wholesale, language)} <span className="text-[9px] text-slate-400 font-semibold font-sans">/{getItemUnitDisplay(item, language)}</span>
                  </p>
                </div>

                {/* Retail Rate */}
                <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block leading-none mb-0.5">
                    {language === 'bn' ? 'খুচরা দর' : 'Retail'}
                  </span>
                  <p className="text-xs font-black text-emerald-700 font-sans leading-tight">
                    {currencySymbol} {formatRateDisplay(item.retail, language)} <span className="text-[9px] text-slate-400 font-semibold font-sans">/{getItemUnitDisplay(item, language)}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 2. Chick Market Rates (Grade A, B, C) */
        <div className="space-y-2.5">
          {/* Grade summary pill */}
          <div className="bg-amber-50/70 rounded-xl p-2 border border-amber-200/80 flex flex-wrap items-center justify-between gap-1 text-[10px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">{language === 'bn' ? 'Grade A (১ম)' : 'Grade A (1st)'}</span>
              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">{language === 'bn' ? 'Grade B (২য়)' : 'Grade B (2nd)'}</span>
              <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md">{language === 'bn' ? 'Grade C (৩য়)' : 'Grade C (3rd)'}</span>
            </div>
            <span className="text-slate-500 font-medium">{language === 'bn' ? 'প্রতি পিস বাচ্চার রেট' : 'Rate per chick piece'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-0.5">
            {chickRates.map((chick) => (
              <div 
                key={chick.id}
                className="bg-slate-50/80 hover:bg-amber-50/20 border border-slate-200 hover:border-amber-200 rounded-xl p-2.5 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="text-xs font-extrabold text-slate-800 leading-tight">
                    {getChickDisplayName(chick, language)}
                  </span>
                  <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0 ${
                    chick.trend === 'up' ? 'bg-red-100 text-red-700' :
                    chick.trend === 'down' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-200/70 text-slate-600'
                  }`}>
                    {chick.trend === 'up' && <TrendingUp size={9} />}
                    {chick.trend === 'down' && <TrendingDown size={9} />}
                    {chick.trend === 'stable' && <Minus size={9} />}
                    <span>{chick.trend === 'up' ? (language === 'bn' ? 'উর্ধ্বমুখী' : 'Up') : chick.trend === 'down' ? (language === 'bn' ? 'নিম্নমুখী' : 'Down') : (language === 'bn' ? 'স্থির' : 'Stable')}</span>
                  </span>
                </div>

                {/* 3 Grade Price Badges */}
                <div className="grid grid-cols-3 gap-1 my-1">
                  <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-lg p-1 text-center">
                    <span className="text-[8px] font-black text-emerald-800 uppercase block leading-tight">Grade A</span>
                    <span className="text-xs font-black text-emerald-950">{currencySymbol}{formatRateDisplay(chick.gradeA, language)}</span>
                  </div>
                  <div className="bg-amber-50/90 border border-amber-200/80 rounded-lg p-1 text-center">
                    <span className="text-[8px] font-black text-amber-800 uppercase block leading-tight">Grade B</span>
                    <span className="text-xs font-black text-amber-950">{currencySymbol}{formatRateDisplay(chick.gradeB, language)}</span>
                  </div>
                  <div className="bg-purple-50/90 border border-purple-200/80 rounded-lg p-1 text-center">
                    <span className="text-[8px] font-black text-purple-800 uppercase block leading-tight">Grade C</span>
                    <span className="text-xs font-black text-purple-950">{currencySymbol}{formatRateDisplay(chick.gradeC, language)}</span>
                  </div>
                </div>

                <p className="text-[9.5px] text-slate-500 font-medium leading-tight mt-1 line-clamp-2">
                  💡 {getChickNoteDisplay(chick, language)}
                </p>
              </div>
            ))}
          </div>

          {/* Direct Link to Chick Store Directory */}
          <div className="pt-2 border-t border-slate-150 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-semibold">
              {language === 'bn' ? 'সরাসরি হ্যাচারি থেকে কিনতে চান?' : 'Want to buy directly from hatcheries?'}
            </span>
            <a 
              href="#/chick-market" 
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 shadow-2xs transition-colors"
            >
              <span>{language === 'bn' ? '🏬 হ্যাচারি ও স্টোর ডিরেক্টরি ➔' : '🏬 Hatcheries & Store Directory ➔'}</span>
            </a>
          </div>
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
