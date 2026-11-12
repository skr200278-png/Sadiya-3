import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  AnimalSector, 
  DiseaseRecord, 
  SPECIES_BY_SECTOR, 
  VETERINARY_DISEASE_DB, 
  searchVeterinaryDiseases 
} from '../data/veterinaryDiseaseDatabase';
import { useLanguage } from '../contexts/LanguageContext';
import { openWhatsAppSafe } from '../utils/whatsappHelper';
import { 
  Stethoscope, 
  Search, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  PhoneCall, 
  MessageCircle, 
  Pill, 
  Sparkles, 
  Activity, 
  ChevronRight, 
  HelpCircle, 
  RotateCcw, 
  Calculator, 
  BookOpen, 
  Info,
  Clock,
  Droplets,
  Share2,
  ArrowLeft,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DiseaseDoctorAdvisor() {
  const { language } = useLanguage();

  // Selection states
  const [selectedSector, setSelectedSector] = useState<AnimalSector>('poultry');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [animalAge, setAnimalAge] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeExpandedId, setActiveExpandedId] = useState<string | null>(null);

  // Dosage Calculator tool state
  const [calcWaterLiters, setCalcWaterLiters] = useState<string>('50');

  // Sector species list
  const currentSpeciesList = useMemo(() => {
    return SPECIES_BY_SECTOR[selectedSector] || [];
  }, [selectedSector]);

  // Common quick-symptom tags based on current sector
  const quickSymptoms = useMemo(() => {
    if (selectedSector === 'poultry') {
      return [
        { label: 'সর্দি / ঘড়ঘড় শব্দ', query: 'সর্দি' },
        { label: 'চুনা পায়খানা', query: 'চুনা পায়খানা' },
        { label: 'রক্ত আমাশয়', query: 'রক্ত আমাশয়' },
        { label: 'ঘাড় বাঁকা / রানিখেত', query: 'রানিখেত' },
        { label: 'গামবোরো / কাঁপুনি', query: 'গামবোরো' },
        { label: 'মাথার ঝুঁটি নীল / কলেরা', query: 'কলেরা' },
        { label: 'মুখে গুটি / বসন্ত', query: 'বসন্ত' },
        { label: 'পেটে জল / অ্যাসাইটিস', query: 'পেটে জল' },
        { label: 'হাঁপানি / নিউমোনিয়া', query: 'নিউমোনিয়া' }
      ];
    } else if (selectedSector === 'cattle') {
      return [
        { label: 'লালা ঝরা ও ক্ষুরে ঘা (FMD)', query: 'ক্ষুরারোগ' },
        { label: 'ওলান ফোলা / রক্ত দুধ', query: 'ওলান' },
        { label: 'চামড়ায় চাকা / লাম্পি (LSD)', query: 'লাম্পি' },
        { label: 'পেট ফাঁপা (টিম্প্যানি)', query: 'পেট ফাঁপা' },
        { label: 'বাছুরের পাতলা পায়খানা', query: 'বাছুরের' },
        { label: 'ছাগলের পিপিআর (PPR)', query: 'পিপিআর' },
        { label: 'তড়কা / অ্যানথ্রাক্স', query: 'তড়কা' }
      ];
    } else {
      return [
        { label: 'মাছের ঘা / লাল দাগ (EUS)', query: 'ক্ষতরোগ' },
        { label: 'লেজ ও পাখনা পচা', query: 'পাখনা পচা' },
        { label: 'ফুলকা পচা / খাবি খাওয়া', query: 'ফুলকা' },
        { label: 'মাছের উকুন / আর্গুলোসিস', query: 'উকুন' },
        { label: 'অক্সিজেন সংকট / মাছ ভাসা', query: 'অক্সিজেন' }
      ];
    }
  }, [selectedSector]);

  // Filtered diseases matching user's criteria
  const searchResults = useMemo(() => {
    return searchVeterinaryDiseases(searchQuery, selectedSector, selectedSpecies);
  }, [searchQuery, selectedSector, selectedSpecies]);

  // Selected species name
  const selectedSpeciesLabel = useMemo(() => {
    const found = currentSpeciesList.find(s => s.id === selectedSpecies);
    return found ? (language === 'bn' ? found.nameBn : found.nameEn) : '';
  }, [currentSpeciesList, selectedSpecies, language]);

  // Quick symptom click
  const handleSelectQuickSymptom = (tagQuery: string) => {
    setSearchQuery(tagQuery);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSpecies('all');
    setAnimalAge('');
    toast.success(language === 'bn' ? 'ফিল্টার রিসেট করা হয়েছে' : 'Filters reset');
  };

  // Handle WhatsApp Doctor Consultation
  const handleConsultDoctorWhatsApp = (diseaseName?: string) => {
    const sectorNameBn = selectedSector === 'poultry' ? 'পাখি/মুরগি' : selectedSector === 'cattle' ? 'গবাদি পশু' : 'মাছ/মৎস্য';
    const speciesText = selectedSpecies !== 'all' ? selectedSpeciesLabel : sectorNameBn;
    const diseaseText = diseaseName || searchQuery || 'অজ্ঞাত রোগ/উপসর্গ';
    const ageText = animalAge ? `বয়স: ${animalAge}` : '';

    const msg = `আসসালামু আলাইকুম ডাক্তার সাহেব। আমার খামারে ${speciesText}-এ সমস্যা দেখা দিয়েছে।\n\n📌 রোগের ধরন/লক্ষণ: ${diseaseText}\n${ageText ? `📌 ${ageText}\n` : ''}📌 অবস্থা: অতি দ্রুত সঠিক প্রেসক্রিপশন ও পরামর্শ প্রয়োজন।\n\n(রেফারেন্স: ভাই ভাই বিসমিল্লাহ খামার অ্যাপ)`;

    // Official Bangladesh Government & Registered Veterinary Telemedicine Hotline
    openWhatsAppSafe({
      phone: '8801711285098',
      message: msg,
      lang: language === 'bn' ? 'bn' : 'en'
    });
  };

  // Copy prescription to clipboard
  const handleCopyPrescription = (disease: DiseaseRecord) => {
    const medList = disease.medicines.map((m, idx) => 
      `${idx + 1}. ${m.genericName}\n   ব্র্যান্ড: ${m.brandNames.join(', ')}\n   মাত্রা: ${m.dosageBn}\n   মেয়াদ: ${m.durationBn}`
    ).join('\n\n');

    const textToCopy = `📋 রোগ: ${disease.nameBn} (${disease.nameEn})\nকারণ: ${disease.causeBn}\n\n💊 ঔষধ ও মাত্রা:\n${medList}\n\n⚠️ খামার ব্যবস্থাপনা:\n${disease.managementTipsBn.join('\n')}\n\n- ভাই ভাই বিসমিল্লাহ খামার অ্যাপ`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      toast.success(language === 'bn' ? 'প্রেসক্রিপশন কপি করা হয়েছে!' : 'Prescription copied!');
    }
  };

  return (
    <div className="space-y-3.5 pb-32 max-w-4xl mx-auto px-1 sm:px-2 animate-fadeIn">
      {/* 📱 0. Mobile Top Bar (Quick Navigation & Emergency Action) */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-transform active:scale-95 shrink-0"
        >
          <ArrowLeft size={14} />
          <span>{language === 'bn' ? 'হোমে ফিরে যান' : 'Back'}</span>
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href="tel:16123"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-black shadow-2xs active:scale-95"
            title="সরকারি প্রাণিসম্পদ কল সেন্টার (১৬১২৩)"
          >
            <PhoneCall size={12} />
            <span>১৬১২৩</span>
          </a>

          <Link
            to="/doctor"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-black shadow-2xs active:scale-95"
            title="রেজিস্টার্ড ভেটেরিনারি সার্জন ডিরেক্টরি"
          >
            <Stethoscope size={12} />
            <span>{language === 'bn' ? 'ডাক্তার' : 'Doctors'}</span>
          </Link>
        </div>
      </div>

      {/* 🌟 1. Compact Hero Diagnostic Banner Card */}
      <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 rounded-2xl p-4 text-white shadow-lg border border-emerald-500/30 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 text-[9.5px] font-black uppercase tracking-wider mb-1.5">
              <Sparkles size={11} className="text-emerald-300" />
              <span>{language === 'bn' ? 'স্মার্ট ভেটেরিনারি রোগ ও ঔষধ নির্ণয়ক' : 'Smart Vet Diagnosis & Rx'}</span>
            </div>
            <h1 className="text-base sm:text-xl font-black tracking-tight leading-snug">
              {language === 'bn' ? 'রোগের নাম লিখুন — সঠিক ঔষধ জানুন' : 'Disease Diagnosis & Prescription'}
            </h1>
            <p className="text-[11px] text-teal-100/85 mt-1 leading-relaxed">
              {language === 'bn'
                ? 'মুরগি, গরু-ছাগল ও মাছের খামারে যেকোনো রোগের নাম বা লক্ষণ লিখে সঠিক জেনেরিক ও জনপ্রিয় ব্র্যান্ড ঔষধের ডোজ জানুন।'
                : 'Input disease or symptoms to get verified generic and branded medicine dosages.'}
            </p>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Pill size={22} className="text-emerald-300" />
          </div>
        </div>

        {/* 1-Tap Emergency Hotline & Vet Telemedicine Strip */}
        <div className="mt-3 pt-2.5 border-t border-white/15 grid grid-cols-2 gap-2 relative z-10">
          <a
            href="tel:16123"
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs transition-transform active:scale-95 text-center"
          >
            <PhoneCall size={13} />
            <span>১৬১২৩ (হটলাইন)</span>
          </a>

          <button
            type="button"
            onClick={() => handleConsultDoctorWhatsApp()}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-transform active:scale-95 text-center cursor-pointer"
          >
            <MessageCircle size={13} />
            <span>{language === 'bn' ? 'ডাক্তার হোয়াটসঅ্যাপ' : 'Doctor WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* 🐾 2. Sector Selector Tabs (Phone Segmented Control: পাখি | পশু | মাছ) */}
      <div className="bg-white rounded-2xl p-3 shadow-2xs border border-slate-150 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            {language === 'bn' ? '১. সেক্টর নির্বাচন করুন:' : '1. Select Sector:'}
          </label>
          <span className="text-[10px] font-bold text-slate-500">
            {language === 'bn' ? 'পাখি • গবাদি পশু • মাছ' : 'Poultry • Cattle • Fish'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* Poultry */}
          <button
            type="button"
            onClick={() => {
              setSelectedSector('poultry');
              setSelectedSpecies('all');
            }}
            className={`py-2 px-1 sm:px-2 rounded-xl text-center font-black text-xs transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 border ${
              selectedSector === 'poultry'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-md scale-[1.02]'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-base sm:text-lg">🐔</span>
            <span className="truncate">{language === 'bn' ? 'পাখি (পোল্ট্রি)' : 'Poultry'}</span>
          </button>

          {/* Cattle */}
          <button
            type="button"
            onClick={() => {
              setSelectedSector('cattle');
              setSelectedSpecies('all');
            }}
            className={`py-2 px-1 sm:px-2 rounded-xl text-center font-black text-xs transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 border ${
              selectedSector === 'cattle'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-md scale-[1.02]'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-base sm:text-lg">🐄</span>
            <span className="truncate">{language === 'bn' ? 'পশু (ডেইরি)' : 'Livestock'}</span>
          </button>

          {/* Fish */}
          <button
            type="button"
            onClick={() => {
              setSelectedSector('fish');
              setSelectedSpecies('all');
            }}
            className={`py-2 px-1 sm:px-2 rounded-xl text-center font-black text-xs transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 border ${
              selectedSector === 'fish'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-md scale-[1.02]'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-base sm:text-lg">🐟</span>
            <span className="truncate">{language === 'bn' ? 'মাছ (মৎস্য)' : 'Fisheries'}</span>
          </button>
        </div>

        {/* Horizontal Breed / Species Filter Chips */}
        <div>
          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
            {language === 'bn' ? 'নির্দিষ্ট প্রজাতি বা জাত নির্বাচন:' : 'Species / Breed Filter:'}
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {currentSpeciesList.map(species => (
              <button
                key={species.id}
                type="button"
                onClick={() => setSelectedSpecies(species.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
                  selectedSpecies === species.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{species.icon}</span>
                <span>{language === 'bn' ? species.nameBn : species.nameEn}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🔍 3. Mobile Search & Symptom Input Bar */}
      <div className="bg-white rounded-2xl p-3.5 shadow-2xs border border-slate-150 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            {language === 'bn' ? '২. রোগ বা উপসর্গের নাম লিখুন:' : '2. Enter Disease or Symptoms:'}
          </label>
          {searchQuery && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Clear'}</span>
            </button>
          )}
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Main Search Input */}
          <div className="sm:col-span-2 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                selectedSector === 'poultry'
                  ? 'যেমন: সর্দি, রানিখেত, রক্ত আমাশয়...'
                  : selectedSector === 'cattle'
                  ? 'যেমন: ক্ষুরারোগ, ওলান ফোলা, লাম্পি...'
                  : 'যেমন: ক্ষতরোগ, পাখনা পচা, ফুলকা পচা...'
              }
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs font-bold text-slate-800 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Age / Batch status (Optional) */}
          <div className="relative">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={animalAge}
              onChange={(e) => setAnimalAge(e.target.value)}
              placeholder={language === 'bn' ? 'বয়স / দিন (যেমন: ১৫ দিন)' : 'Age/Day (e.g. 15 days)'}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs font-bold text-slate-800 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Quick Symptom Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-bold text-slate-500">
              {language === 'bn' ? 'খামারে সচরাচর দেখা দেওয়া লক্ষণ (ক্লিক করুন):' : 'Common symptoms (Tap to find):'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickSymptoms.map((sym, idx) => {
              const isSelected = searchQuery.toLowerCase().includes(sym.query.toLowerCase());
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuickSymptom(sym.query)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80 active:scale-95'
                  }`}
                >
                  {sym.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 💊 4. Results & Prescription Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs sm:text-sm font-black text-slate-800">
              {language === 'bn' ? 'রোগ নির্ণয় ও সঠিক ঔষধ প্রেসক্রিপশন' : 'Diagnosis & Medicine Prescriptions'}
            </h2>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {searchResults.length} {language === 'bn' ? 'টি পাওয়া গেছে' : 'found'}
            </span>
          </div>

          {searchQuery && (
            <span className="text-[11px] text-slate-500 font-bold truncate max-w-[140px]">
              {language === 'bn' ? 'খোঁজা:' : 'Query:'} <span className="text-emerald-700 font-black">"{searchQuery}"</span>
            </span>
          )}
        </div>

        {/* Case A: Results Found */}
        {searchResults.length > 0 ? (
          <div className="space-y-3">
            {searchResults.map((disease) => {
              const isCritical = disease.isCriticalRequireVet;
              const isExpanded = activeExpandedId === disease.id || searchResults.length === 1;

              return (
                <div
                  key={disease.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isCritical
                      ? 'border-red-300 ring-2 ring-red-500/10 shadow-sm'
                      : 'border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* Card Header Bar */}
                  <div className="p-3.5 sm:p-4">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {/* Severity Badge */}
                          {disease.severity === 'critical' ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200 text-[10px] font-black inline-flex items-center gap-1">
                              <AlertTriangle size={11} className="text-red-600" />
                              {language === 'bn' ? 'মারাত্মক মরণব্যাধি / জরুরি' : 'Critical / Fatal'}
                            </span>
                          ) : disease.severity === 'moderate' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black inline-flex items-center gap-1">
                              <Activity size={11} className="text-amber-700" />
                              {language === 'bn' ? 'মাঝারি ঝুঁকি' : 'Moderate'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black inline-flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-emerald-700" />
                              {language === 'bn' ? 'সহজ নিরাময়যোগ্য' : 'Mild'}
                            </span>
                          )}

                          {/* Cause tag */}
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                            {disease.causeBn}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                          {disease.nameBn}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-500 truncate">
                          {disease.nameEn}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyPrescription(disease)}
                          title={language === 'bn' ? 'প্রেসক্রিপশন কপি করুন' : 'Copy Rx'}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                        >
                          <Share2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveExpandedId(isExpanded ? null : disease.id)}
                          className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                        >
                          <span>{isExpanded ? (language === 'bn' ? 'সংক্ষেপ' : 'Less') : (language === 'bn' ? 'বিস্তারিত' : 'More')}</span>
                          <ChevronRight size={13} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Brief description */}
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {disease.descriptionBn}
                    </p>

                    {/* Symptoms list */}
                    <div className="mt-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-150">
                      <span className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider block mb-1">
                        🔍 {language === 'bn' ? 'মূল উপসর্গ ও লক্ষণসমূহ:' : 'Key Symptoms:'}
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs font-medium text-slate-700">
                        {disease.symptomsBn.map((sym, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{sym}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* ⚠️ CRITICAL VIRAL / VET REQUIRED ALERT */}
                    {isCritical && (
                      <div className="mt-3 bg-red-50 border-2 border-red-300 rounded-2xl p-3 sm:p-3.5 space-y-2.5 animate-in fade-in">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                            <ShieldAlert size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-red-900 leading-tight">
                              ⚠️ {language === 'bn' ? 'জরুরি সতর্কতা: এটি অত্যন্ত জটিল বা ভাইরাসজনিত রোগ!' : 'Mandatory Alert: Fatal / Viral Disease!'}
                            </h4>
                            <p className="text-[11px] text-red-800/90 mt-0.5 leading-relaxed font-medium">
                              {language === 'bn'
                                ? 'ভাইরাস সরাসরি মারার কোনো অ্যান্টিবায়োটিক নেই। ভুল বা অতিরিক্ত ওষুধ দিলে খামারের ব্যাপক মড়ক দেখা দেবে। দ্রুত রেজিস্টার্ড ভেটেরিনারি ডাক্তারের পরামর্শ নিন এবং বায়োসিকিউরিটি কড়াকড়ি করুন।'
                                : 'Viruses cannot be cured directly with antibiotics. Consult a verified veterinarian immediately.'}
                            </p>
                          </div>
                        </div>

                        {/* Direct 1-Click Consultation Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-red-200/80">
                          <button
                            type="button"
                            onClick={() => handleConsultDoctorWhatsApp(disease.nameBn)}
                            className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black py-2.5 px-3 rounded-xl shadow-xs text-xs cursor-pointer transition-all"
                          >
                            <MessageCircle size={15} />
                            <span>{language === 'bn' ? 'অভিজ্ঞ ডাক্তারকে হোয়াটসঅ্যাপে জানান' : 'WhatsApp Doctor'}</span>
                          </button>

                          <a
                            href="tel:16123"
                            className="w-full flex items-center justify-center gap-1.5 bg-red-700 hover:bg-red-800 active:scale-98 text-white font-black py-2.5 px-3 rounded-xl shadow-xs text-xs transition-all"
                          >
                            <PhoneCall size={15} />
                            <span>{language === 'bn' ? 'সরকারি জরুরি কল (১৬১২৩)' : 'Govt Helpline 16123'}</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Collapsible / Expanded Prescription Block */}
                    {isExpanded && (
                      <div className="mt-3.5 pt-3.5 border-t border-slate-200 space-y-3 animate-in fade-in">
                        {/* Medicine Heading */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Pill size={14} className="text-emerald-600" />
                            {language === 'bn' ? 'সঠিক ঔষধের তালিকা ও প্রয়োগমাত্রা (Prescription):' : 'Prescribed Medicines & Dosage:'}
                          </span>
                        </div>

                        {/* Medicines List */}
                        <div className="space-y-2.5">
                          {disease.medicines.map((med, mIdx) => (
                            <div
                              key={mIdx}
                              className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 hover:border-slate-300 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                    {mIdx + 1}
                                  </span>
                                  {med.genericName}
                                </h5>
                              </div>

                              {/* Popular Brand Names in BD */}
                              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-500">
                                  {language === 'bn' ? 'জনপ্রিয় ব্র্যান্ড:' : 'Top Brands:'}
                                </span>
                                {med.brandNames.map((brand, bIdx) => (
                                  <span
                                    key={bIdx}
                                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[10px] font-black shadow-2xs"
                                  >
                                    {brand}
                                  </span>
                                ))}
                              </div>

                              {/* Exact Dosage & Duration */}
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                                <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                                  <span className="text-[9.5px] font-black text-emerald-800 uppercase block">
                                    ⚖️ {language === 'bn' ? 'সঠিক প্রয়োগমাত্রা (Dosage):' : 'Dosage:'}
                                  </span>
                                  <p className="font-black text-emerald-950 mt-0.5 text-xs">
                                    {med.dosageBn}
                                  </p>
                                </div>

                                <div className="bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                                  <span className="text-[9.5px] font-black text-blue-800 uppercase block">
                                    ⏳ {language === 'bn' ? 'খাওয়ানোর মেয়াদ (Duration):' : 'Duration:'}
                                  </span>
                                  <p className="font-black text-blue-950 mt-0.5 text-xs">
                                    {med.durationBn}
                                  </p>
                                </div>
                              </div>

                              {/* Instructions & Notes */}
                              <p className="text-[10.5px] text-slate-600 mt-2 font-medium bg-white p-2 rounded-lg border border-slate-150 leading-relaxed">
                                💡 <span className="font-bold">{language === 'bn' ? 'নিয়ম ও সতর্কতা:' : 'Note:'}</span> {med.instructionBn}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Management & Biosecurity Tips */}
                        <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/80">
                          <span className="text-xs font-black text-amber-900 block mb-1">
                            🛡️ {language === 'bn' ? 'খামারির জরুরি করণীয় ও প্রতিরোধ ব্যবস্থা:' : 'Farm Biosecurity & Care:'}
                          </span>
                          <ul className="space-y-1 text-xs text-amber-950 font-medium">
                            {disease.managementTipsBn.map((tip, tIdx) => (
                              <li key={tIdx} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">✔</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>

                          {disease.preventiveVaccineBn && (
                            <div className="mt-2 pt-2 border-t border-amber-200 flex items-start gap-1.5 text-xs text-amber-900 font-bold">
                              <span>💉</span>
                              <span>
                                {language === 'bn' ? 'টিকা (ভ্যাকসিন) পরামর্শ:' : 'Vaccine advice:'} {disease.preventiveVaccineBn}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Single Tap Action Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleConsultDoctorWhatsApp(disease.nameBn)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-2 px-3 rounded-xl border border-emerald-200 transition-colors cursor-pointer active:scale-95"
                          >
                            <MessageCircle size={14} />
                            <span>{language === 'bn' ? 'ডাক্তারের প্রেসক্রিপশন নিশ্চিত করুন' : 'Verify with Doctor'}</span>
                          </button>

                          <Link
                            to="/medicine"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 py-2 px-3 rounded-xl border border-slate-200 transition-colors active:scale-95"
                          >
                            <span>{language === 'bn' ? 'ঔষধ খরচের খাতায় যোগ' : 'Add to Medicine Expense'}</span>
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Case B: NOT Found / Unrecognized Disease -> Fallback with Doctor Referral */
          <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm text-center space-y-3.5 animate-in fade-in">
            <div className="w-13 h-13 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <Stethoscope size={26} />
            </div>

            <div className="max-w-md mx-auto">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {language === 'bn' ? 'সঠিক রোগ নিশ্চিত হতে ডাক্তারের পরামর্শ নিন' : 'Consult a Veterinarian for Exact Diagnosis'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {language === 'bn' ? (
                  <>
                    আপনার উল্লেখিত <strong>"{searchQuery || selectedSpeciesLabel}"</strong> সম্পর্কিত তথ্য আমাদের প্রাথমিক তালিকায় নিশ্চিত হওয়া যায়নি। 
                    খামারে কোনো আন্দাজে ওষুধ খাওয়ানো বিপজ্জনক। অবিলম্বে অভিজ্ঞ ডাক্তারের সাথে কথা বলুন।
                  </>
                ) : (
                  'No exact match found in our primary knowledgebase. Please consult a registered veterinarian.'
                )}
              </p>
            </div>

            {/* Direct Connect Buttons */}
            <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleConsultDoctorWhatsApp(searchQuery)}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-3 rounded-xl shadow-xs text-xs cursor-pointer active:scale-98 transition-all"
              >
                <MessageCircle size={15} />
                <span>{language === 'bn' ? 'হোয়াটসঅ্যাপে ডাক্তারকে বলুন' : 'Ask Doctor (WhatsApp)'}</span>
              </button>

              <a
                href="tel:16123"
                className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-black py-2.5 px-3 rounded-xl shadow-xs text-xs active:scale-98 transition-all"
              >
                <PhoneCall size={15} />
                <span>{language === 'bn' ? 'হটলাইনে কল: ১৬১২৩' : 'Hotline: 16123'}</span>
              </a>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                {language === 'bn' ? 'সব সাধারণ রোগ দেখতে এখানে চাপুন' : 'Show all common diseases'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 💧 5. Water & Medicine Dosage Quick Calculator Widget (Mobile-Friendly) */}
      <div className="bg-slate-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-md space-y-2.5 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Calculator size={15} />
            </div>
            <div>
              <h4 className="text-xs font-black">
                {language === 'bn' ? 'পানি ও ঔষধের ডোজ ক্যালকুলেটর' : 'Water & Medicine Calculator'}
              </h4>
              <p className="text-[9.5px] text-slate-400">
                {language === 'bn' ? 'কত লিটার পানিতে কত গ্রাম ঔষধ লাগবে তাৎক্ষণিক হিসাব' : 'Calculate grams/ml for water volume'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <div>
            <label className="text-[10px] font-bold text-slate-300 block mb-1">
              {language === 'bn' ? 'পানির পরিমাণ (লিটার):' : 'Water (Liters):'}
            </label>
            <div className="relative">
              <Droplets size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                value={calcWaterLiters}
                onChange={(e) => setCalcWaterLiters(e.target.value)}
                placeholder="50"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="sm:col-span-2 grid grid-cols-3 gap-1 text-center">
            <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
              <span className="text-[8.5px] text-slate-400 block font-bold">১ গ্রাম / ১ লিটার</span>
              <span className="text-xs font-black text-emerald-400">
                {(Number(calcWaterLiters) || 0) * 1} গ্রাম
              </span>
            </div>

            <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
              <span className="text-[8.5px] text-slate-400 block font-bold">১ গ্রাম / ২ লিটার</span>
              <span className="text-xs font-black text-cyan-400">
                {((Number(calcWaterLiters) || 0) * 0.5).toFixed(1)} গ্রাম
              </span>
            </div>

            <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
              <span className="text-[8.5px] text-slate-400 block font-bold">১ মিলি / ১ লিটার</span>
              <span className="text-xs font-black text-amber-400">
                {(Number(calcWaterLiters) || 0) * 1} মিলি
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
