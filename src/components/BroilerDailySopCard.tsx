import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  Calendar, 
  Thermometer, 
  Droplets, 
  Layers, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Sliders,
  RotateCcw,
  Bird,
  Package,
  Scale,
  Wheat,
  Info,
  Users,
  Egg,
  Fish,
  Milk,
  ShieldAlert,
  Flame,
  Clock,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Table,
  LayoutGrid,
  Check
} from 'lucide-react';
import { 
  BROILER_SOP_SCHEDULE, 
  CROP_FILL_MILESTONES, 
  FEEDER_SLOT_GUIDES, 
  getSopForDay, 
  DailySopItem 
} from '../utils/broilerSopData';
import { SONALI_SOP_SCHEDULE, getSonaliSopForDay } from '../utils/sonaliSopData';
import { 
  LAYER_SOP_SCHEDULE, 
  getLayerSopForAge, 
  LayerWeeklySopItem 
} from '../utils/layerSopData';
import { 
  DAIRY_COW_SCHEDULE, 
  BEEF_FATTENING_SCHEDULE, 
  CattleDietPlan 
} from '../utils/cattleSopData';
import { 
  FISH_FEEDING_SCHEDULE, 
  FishFeedingPhase 
} from '../utils/fishSopData';
import { fastGetDocs, db } from '../firebase';
import { collection, query, where } from 'firebase/firestore';
import { demoStore } from '../utils/demoStore';
import { calculateBatchAgeFromStartDate } from '../utils/fcrBatchScope';

export interface BatchOption {
  id: string;
  name?: string;
  batchName?: string;
  startDate?: string;
  totalChicks?: number | string;
  quantity?: number | string;
  farmType?: string;
  category?: string;
  breed?: string;
  subBreed?: string;
  mortality?: number | string;
}

interface BroilerDailySopCardProps {
  batches?: BatchOption[];
  selectedBatchId?: string;
  initialBatch?: BatchOption | null;
  farmCategory?: 'poultry' | 'cattle' | 'fish';
  isBn?: boolean;
  onClose?: () => void;
  currentUser?: any;
  isDemoUser?: boolean;
}

type FarmCategory = 'poultry' | 'cattle' | 'fish';
type PoultryBreedType = 'broiler' | 'sonali' | 'layer';
type CattleType = 'dairy' | 'beef';

export const BroilerDailySopCard: React.FC<BroilerDailySopCardProps> = ({
  batches = [],
  selectedBatchId,
  initialBatch,
  farmCategory = 'poultry',
  isBn = true,
  onClose,
  currentUser,
  isDemoUser = false
}) => {
  // Batch Selection State
  const [currentBatchId, setCurrentBatchId] = useState<string>(() => {
    return selectedBatchId || initialBatch?.id || (batches.length > 0 ? batches[0].id : 'custom-sim');
  });

  // Calculate age helper (in days) - strictly matching app-wide standard flock age calculation
  const calculateAge = (startDateStr?: string): number => {
    if (!startDateStr) return 7;
    try {
      return calculateBatchAgeFromStartDate(startDateStr);
    } catch {
      return 7;
    }
  };

  // Find currently active batch from list or initialBatch
  const selectedBatch = useMemo(() => {
    const found = batches.find(b => b.id === currentBatchId);
    if (found) return found;
    if (initialBatch && initialBatch.id === currentBatchId) return initialBatch;
    return batches[0] || initialBatch || null;
  }, [batches, currentBatchId, initialBatch]);

  // Determine Category (Poultry, Cattle, Fish)
  const detectedCategory = useMemo<FarmCategory>(() => {
    if (farmCategory) return farmCategory;
    if (!selectedBatch) return 'poultry';
    const bType = (selectedBatch.farmType || selectedBatch.category || '').toLowerCase();
    const bName = (selectedBatch.name || selectedBatch.batchName || '').toLowerCase();
    if (bType.includes('cattle') || bType.includes('পশু') || bName.includes('গরু') || bName.includes('cow') || bName.includes('dairy') || bName.includes('bull')) {
      return 'cattle';
    }
    if (bType.includes('fish') || bType.includes('মাছ') || bName.includes('fish') || bName.includes('পুকুর')) {
      return 'fish';
    }
    return 'poultry';
  }, [farmCategory, selectedBatch]);

  const [activeCategory, setActiveCategory] = useState<FarmCategory>(detectedCategory);

  useEffect(() => {
    setActiveCategory(detectedCategory);
  }, [detectedCategory]);

  // Sub-type selection within category
  // Poultry: broiler | sonali | layer
  const detectedPoultryBreed = useMemo<PoultryBreedType>(() => {
    if (!selectedBatch) return 'broiler';
    const name = (selectedBatch.name || selectedBatch.batchName || '').toLowerCase();
    const breed = (selectedBatch.breed || selectedBatch.subBreed || '').toLowerCase();
    if (name.includes('layer') || name.includes('লেয়ার') || breed.includes('layer') || breed.includes('লেয়ার')) {
      return 'layer';
    }
    if (name.includes('sonali') || name.includes('সোনালী') || breed.includes('sonali') || breed.includes('সোনালী')) {
      return 'sonali';
    }
    return 'broiler';
  }, [selectedBatch]);

  const [poultryBreed, setPoultryBreed] = useState<PoultryBreedType>(detectedPoultryBreed);
  useEffect(() => {
    setPoultryBreed(detectedPoultryBreed);
  }, [detectedPoultryBreed]);

  // Cattle: dairy | beef
  const [cattleType, setCattleType] = useState<CattleType>('dairy');
  const [selectedDairyPlanIdx, setSelectedDairyPlanIdx] = useState<number>(1); // Default: 10L cow
  const [selectedBeefPlanIdx, setSelectedBeefPlanIdx] = useState<number>(1); // Default: Month 2

  // Fish: nursery | grower | finisher
  const [selectedFishPhaseIdx, setSelectedFishPhaseIdx] = useState<number>(1); // Default: grower

  // Batch specific mortality state
  const [batchMortality, setBatchMortality] = useState<number>(0);

  // Dynamic fetch mortality for selected batch
  useEffect(() => {
    let isMounted = true;
    if (!selectedBatch?.id || selectedBatch.id === 'custom-sim') {
      setBatchMortality(0);
      return;
    }

    const loadMortality = async () => {
      try {
        if (isDemoUser) {
          const records = demoStore.getMortalityRecords(selectedBatch.id);
          const totalM = records.reduce((acc, r) => acc + (Number(r.count) || 0), 0);
          if (isMounted) setBatchMortality(totalM);
          return;
        }

        if (currentUser?.uid) {
          const q = query(
            collection(db, 'mortality'),
            where('userId', '==', currentUser.uid),
            where('batchId', '==', selectedBatch.id)
          );
          const snap = await fastGetDocs(q);
          const totalM = snap.docs.reduce((acc, doc) => acc + (Number(doc.data().count) || 0), 0);
          if (isMounted) setBatchMortality(totalM);
        } else if (selectedBatch.mortality) {
          if (isMounted) setBatchMortality(Number(selectedBatch.mortality) || 0);
        }
      } catch (err) {
        console.warn('Could not load batch mortality for SOP:', err);
        if (isMounted && selectedBatch.mortality) {
          setBatchMortality(Number(selectedBatch.mortality) || 0);
        }
      }
    };

    loadMortality();
    return () => { isMounted = false; };
  }, [selectedBatch?.id, isDemoUser, currentUser]);

  // Initial head count from selected batch
  const initialHeadCount = useMemo(() => {
    if (!selectedBatch) return activeCategory === 'cattle' ? 5 : (activeCategory === 'fish' ? 2000 : 1000);
    const count = Number(selectedBatch.totalChicks || selectedBatch.quantity || 0);
    if (count > 0) return count;
    return activeCategory === 'cattle' ? 5 : (activeCategory === 'fish' ? 2000 : 1000);
  }, [selectedBatch, activeCategory]);

  // Accurate Live Count: Initial count minus mortality (never locked to 100)
  const calculatedLiveCount = useMemo(() => {
    const count = initialHeadCount - batchMortality;
    return Math.max(1, count);
  }, [initialHeadCount, batchMortality]);

  // Manual simulation override allows farmer to test any count
  const [simulatedCount, setSimulatedCount] = useState<number>(calculatedLiveCount);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    if (!isSimulating) {
      setSimulatedCount(calculatedLiveCount);
    }
  }, [calculatedLiveCount, isSimulating]);

  const effectiveLiveCount = isSimulating ? simulatedCount : calculatedLiveCount;

  // Actual batch age in days (starts from 1)
  const batchAgeDays = useMemo(() => {
    if (!selectedBatch?.startDate) return 7;
    return Math.max(1, calculateAge(selectedBatch.startDate));
  }, [selectedBatch]);

  // Active Tab:
  // - 'today': Daily advice & tasks
  // - 'full_chart': 1-46 / 1-60 / 1-72 weeks master schedule
  // - 'crop_brood': Brooding / SOP guide
  const [activeTab, setActiveTab] = useState<'today' | 'full_chart' | 'crop_brood'>('today');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);
  const [fullChartMobileMode, setFullChartMobileMode] = useState<'cards' | 'table'>('cards');

  // Max schedule days for poultry:
  // Broiler: 46 days (১ থেকে ৪৬ দিন)
  // Sonali: 60 days (১ থেকে ৬০ দিন)
  const maxPoultryDays = poultryBreed === 'broiler' ? 46 : 60;
  
  // Selected day for Broiler/Sonali (strictly 1 to maxPoultryDays, NO DAY 0)
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    return Math.max(1, Math.min(maxPoultryDays, Math.round(batchAgeDays)));
  });

  useEffect(() => {
    setSelectedDay(Math.max(1, Math.min(maxPoultryDays, Math.round(batchAgeDays))));
  }, [batchAgeDays, maxPoultryDays]);

  // Layer age in weeks (1 to 72+)
  const layerAgeWeeks = useMemo(() => {
    return Math.max(1, Math.ceil(batchAgeDays / 7));
  }, [batchAgeDays]);

  const [selectedLayerWeek, setSelectedLayerWeek] = useState<number>(layerAgeWeeks);

  useEffect(() => {
    setSelectedLayerWeek(layerAgeWeeks);
  }, [layerAgeWeeks]);

  // Local task completion persistence scoped per batch
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`sop_completed_${selectedBatch?.id || 'default'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleTask = (key: string) => {
    setCompletedTasks(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(`sop_completed_${selectedBatch?.id || 'default'}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Storage error', e);
      }
      return updated;
    });
  };

  // Week filter for master tables
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | 'all'>('all');

  // Active schedule items
  const activePoultrySchedule = poultryBreed === 'sonali' ? SONALI_SOP_SCHEDULE : BROILER_SOP_SCHEDULE;
  const currentBroilerSonaliSop = poultryBreed === 'sonali' 
    ? getSonaliSopForDay(selectedDay) 
    : getSopForDay(selectedDay);

  const currentLayerSop = getLayerSopForAge(selectedLayerWeek * 7);

  // Calculations for Broiler/Sonali today
  const poultryDailyFeedKg = Number(((effectiveLiveCount * currentBroilerSonaliSop.feedDailyGm) / 1000).toFixed(2));
  const poultryDailyFeedBags = Number((poultryDailyFeedKg / 50).toFixed(2));
  const poultryMorningFeedKg = Number((poultryDailyFeedKg * 0.40).toFixed(2));
  const poultryEveningFeedKg = Number((poultryDailyFeedKg * 0.60).toFixed(2));
  const poultryWaterLitersMin = Math.round(poultryDailyFeedKg * 2.0);
  const poultryWaterLitersMax = Math.round(poultryDailyFeedKg * 2.5);
  const poultryBiomassKg = Number(((effectiveLiveCount * currentBroilerSonaliSop.bodyWeightGm) / 1000).toFixed(1));

  // Calculations for Layer today
  const layerDailyFeedKg = Number(((effectiveLiveCount * currentLayerSop.feedDailyGm) / 1000).toFixed(2));
  const layerDailyFeedBags = Number((layerDailyFeedKg / 50).toFixed(2));
  const layerWaterLiters = Number(((effectiveLiveCount * currentLayerSop.waterDailyMl) / 1000).toFixed(1));
  const layerExpectedEggsDaily = Math.round(effectiveLiveCount * (currentLayerSop.eggProductionPct / 100));

  // Calculations for Cattle today
  const currentCattlePlan = cattleType === 'dairy' 
    ? DAIRY_COW_SCHEDULE[selectedDairyPlanIdx] 
    : BEEF_FATTENING_SCHEDULE[selectedBeefPlanIdx];

  const cattleConcentrateKg = Number((effectiveLiveCount * currentCattlePlan.concentrateDailyKgPerHead).toFixed(1));
  const cattleConcentrateBags = Number((cattleConcentrateKg / 50).toFixed(2));
  const cattleGreenGrassKg = Math.round(effectiveLiveCount * currentCattlePlan.greenGrassKgPerHead);
  const cattleDryStrawKg = Math.round(effectiveLiveCount * currentCattlePlan.dryStrawKgPerHead);
  const cattleWaterLiters = Math.round(effectiveLiveCount * currentCattlePlan.waterLitersPerHead);

  // Calculations for Fish today
  const currentFishPhase = FISH_FEEDING_SCHEDULE[selectedFishPhaseIdx];
  const fishBiomassKg = Number(((effectiveLiveCount * currentFishPhase.targetWeightGm) / 1000).toFixed(1));
  const fishDailyFeedKg = Number((fishBiomassKg * (currentFishPhase.feedRatePctBiomass / 100)).toFixed(2));
  const fishDailyFeedBags = Number((fishDailyFeedKg / 25).toFixed(2)); // Standard fish feed bag is 25kg

  // Available weeks for filter
  const availableWeeks = Array.from(new Set(activePoultrySchedule.map(s => s.week))).sort((a, b) => a - b);
  const filteredPoultryDays = selectedWeekFilter === 'all' 
    ? activePoultrySchedule 
    : activePoultrySchedule.filter(s => s.week === selectedWeekFilter);

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-emerald-200/80 shadow-2xl overflow-hidden animate-fadeIn max-h-[96vh] sm:max-h-[92vh] flex flex-col">
      {/* 1. Header Banner & Universal Category Switcher */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-3 sm:p-5 shrink-0">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
              <ClipboardList size={20} className="text-emerald-300 sm:w-[22px] sm:h-[22px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wide">
                  {isBn ? 'বাস্তব খামার স্ট্যান্ডার্ড' : 'Commercial Farm SOP'}
                </span>
                {selectedBatch && (
                  <span className="text-[11px] sm:text-xs text-emerald-200 font-bold truncate">
                    {selectedBatch.name || selectedBatch.batchName} ({isBn ? `বয়স: ${batchAgeDays} দিন` : `Age: ${batchAgeDays}d`})
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-lg font-black text-white mt-0.5 truncate">
                {isBn ? 'খামার এসওপি ও সুষম খাদ্য শিডিউল' : 'Farm SOP & Feed Schedule'}
              </h2>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/15 transition-colors cursor-pointer shrink-0"
              title={isBn ? 'বন্ধ করুন' : 'Close'}
            >
              ✕
            </button>
          )}
        </div>

        {/* Mobile Quick Status & Filter Expand Bar (sm:hidden) */}
        <div className="sm:hidden mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-[11px]">
            <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black">
              {activeCategory === 'poultry'
                ? (poultryBreed === 'broiler' ? '🍗 ব্রয়লার' : poultryBreed === 'sonali' ? '🐥 সোনালী' : '🥚 লেয়ার')
                : (activeCategory === 'cattle' ? (cattleType === 'dairy' ? '🥛 ডেইরি' : '🐂 মোটাতাজা') : '🐟 মাছ')}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-white/15 text-white font-bold">
              {effectiveLiveCount.toLocaleString()} {isBn ? 'টি' : 'heads'}
            </span>
            {activeCategory === 'poultry' && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/25 text-emerald-200 font-bold">
                {isBn ? `${batchAgeDays} দিন` : `Day ${batchAgeDays}`}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-white/15 hover:bg-white/25 text-amber-300 border border-white/20 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Sliders size={12} />
            <span>{isMobileFiltersOpen ? (isBn ? 'সংক্ষিপ্ত ▲' : 'Hide ▲') : (isBn ? 'ব্যাচ/ফিল্টার ▼' : 'Filters ▼')}</span>
          </button>
        </div>

        {/* Collapsible on Mobile, Always Visible on Desktop (sm:block) */}
        <div className={`${isMobileFiltersOpen ? 'block' : 'hidden'} sm:block transition-all space-y-3`}>
          {/* Top 3 Main Category Pills: পাখি (Poultry) | পশু (Cattle) | মাছ (Fish) */}
          <div className="mt-3.5 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-2xl border border-white/15">
              <button
                type="button"
                onClick={() => setActiveCategory('poultry')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === 'poultry'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Bird size={14} />
                <span>{isBn ? '🐔 পাখি (মুরগি/হাঁস)' : '🐔 Poultry'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('cattle')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === 'cattle'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Milk size={14} />
                <span>{isBn ? '🐄 পশু (গরু/মহিষ)' : '🐄 Cattle'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('fish')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === 'fish'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Fish size={14} />
                <span>{isBn ? '🐟 মাছ চাষ' : '🐟 Aquaculture'}</span>
              </button>
            </div>

            {/* Sub-breed / Specific Type Selector */}
            {activeCategory === 'poultry' && (
              <div className="flex items-center gap-1 bg-emerald-950/80 p-0.5 rounded-xl border border-white/20 text-xs">
                <button
                  type="button"
                  onClick={() => setPoultryBreed('broiler')}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    poultryBreed === 'broiler' ? 'bg-amber-400 text-slate-950' : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  🍗 {isBn ? 'ব্রয়লার (১-৪৬ দিন)' : 'Broiler (1-46d)'}
                </button>
                <button
                  type="button"
                  onClick={() => setPoultryBreed('sonali')}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    poultryBreed === 'sonali' ? 'bg-amber-400 text-slate-950' : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  🐥 {isBn ? 'সোনালী (১-৬০ দিন)' : 'Sonali (1-60d)'}
                </button>
                <button
                  type="button"
                  onClick={() => setPoultryBreed('layer')}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    poultryBreed === 'layer' ? 'bg-amber-400 text-slate-950' : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  🥚 {isBn ? 'লেয়ার (ডিম উৎপাদন)' : 'Layer (Commercial)'}
                </button>
              </div>
            )}

            {activeCategory === 'cattle' && (
              <div className="flex items-center gap-1 bg-emerald-950/80 p-0.5 rounded-xl border border-white/20 text-xs">
                <button
                  type="button"
                  onClick={() => setCattleType('dairy')}
                  className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    cattleType === 'dairy' ? 'bg-amber-400 text-slate-950' : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  🥛 {isBn ? 'দুগ্ধবতী গাভী' : 'Dairy Cow'}
                </button>
                <button
                  type="button"
                  onClick={() => setCattleType('beef')}
                  className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    cattleType === 'beef' ? 'bg-amber-400 text-slate-950' : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  🐂 {isBn ? 'ষাঁড় মোটাতাজাকরণ' : 'Beef Fattening'}
                </button>
              </div>
            )}

            {activeCategory === 'fish' && (
              <div className="flex items-center gap-1 bg-emerald-950/80 p-0.5 rounded-xl border border-white/20 text-xs">
                {FISH_FEEDING_SCHEDULE.map((phase, idx) => (
                  <button
                    key={phase.stageId}
                    type="button"
                    onClick={() => setSelectedFishPhaseIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                      selectedFishPhaseIdx === idx ? 'bg-amber-400 text-slate-950' : 'text-emerald-200 hover:text-white'
                    }`}
                  >
                    {isBn ? phase.titleBn.split(' ')[0] + ' ' + phase.titleBn.split(' ')[1] : phase.titleEn.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Batch Selector & Live Bird/Animal Count Controls */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Batch Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-emerald-200 flex items-center gap-1">
                <Package size={13} />
                <span>{isBn ? 'ব্যাচ:' : 'Batch:'}</span>
              </span>
              <select
                value={currentBatchId}
                onChange={(e) => {
                  setCurrentBatchId(e.target.value);
                  setIsSimulating(false);
                }}
                className="bg-emerald-950 text-white text-xs font-bold px-2.5 py-1 rounded-xl border border-emerald-500/40 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.name || b.batchName} ({b.totalChicks || b.quantity} {isBn ? 'মাথা' : 'heads'})
                  </option>
                ))}
                <option value="custom-sim" className="bg-slate-900 text-amber-300">
                  ⭐ {isBn ? 'কাস্টম সংখ্যা দিয়ে হিসাব' : 'Custom Simulation'}
                </option>
              </select>
            </div>

            {/* Counts Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-2 py-0.5 bg-white/10 rounded-lg flex items-center gap-1 text-[11px] font-bold">
                <span className="text-slate-300">{isBn ? 'শুরুর সংখ্যা:' : 'Initial:'}</span>
                <span className="font-black text-white">{initialHeadCount.toLocaleString()}</span>
              </div>

              {batchMortality > 0 && (
                <div className="px-2 py-0.5 bg-rose-500/20 border border-rose-400/30 rounded-lg flex items-center gap-1 text-[11px] font-bold text-rose-200">
                  <span>{isBn ? 'মৃত্যু বাদ:' : 'Mortality:'}</span>
                  <span className="font-black text-white">{batchMortality.toLocaleString()}</span>
                </div>
              )}

              {/* Effective Live Count Highlight */}
              <div className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded-xl flex items-center gap-1.5 font-black shadow-xs">
                <span>{isBn ? 'বর্তমান জীবিত:' : 'Live Count:'}</span>
                <span className="text-xs underline">{effectiveLiveCount.toLocaleString()} {isBn ? 'টি' : 'heads'}</span>
              </div>

              {/* Custom Simulation Input */}
              <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-xl">
                <span className="text-[10px] text-slate-300 font-bold">{isBn ? 'অন্য সংখ্যা:' : 'Custom:'}</span>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={simulatedCount}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value) || 1);
                    setSimulatedCount(val);
                    setIsSimulating(true);
                  }}
                  className="w-16 bg-slate-900 text-white font-black text-xs px-1 py-0.5 rounded border border-white/20 text-center"
                  title={isBn ? 'যে কোনো সংখ্যা লিখে খাদ্য হিসাব দেখতে পারেন' : 'Enter custom count to simulate'}
                />
                {isSimulating && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSimulating(false);
                      setSimulatedCount(calculatedLiveCount);
                    }}
                    className="text-[10px] text-amber-300 underline font-bold cursor-pointer"
                  >
                    {isBn ? 'রিসেট' : 'Reset'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Single Line with Horizontal Scroll on Mobile */}
        <div className="flex items-center gap-1.5 mt-2.5 sm:mt-3 bg-emerald-950/60 p-1 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'today' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calendar size={13} />
            <span>
              {activeCategory === 'poultry' 
                ? (poultryBreed === 'layer' ? (isBn ? `সপ্তাহ ${selectedLayerWeek}: ডিম ও খাদ্য` : `Wk ${selectedLayerWeek}: Feed`) : (isBn ? `দিন ${selectedDay} খাদ্য তালিকা` : `Day ${selectedDay} Plan`))
                : (isBn ? 'আজকের পুষ্টি ও খাদ্য' : 'Daily Diet')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('full_chart')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'full_chart' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers size={13} />
            <span>
              {activeCategory === 'poultry'
                ? (poultryBreed === 'layer' ? (isBn ? '১-৭২ সপ্তাহের চার্ট' : '1-72 Wk Layer Chart') : (isBn ? `১-${maxPoultryDays} দিনের পূর্ণাঙ্গ চার্ট (${effectiveLiveCount.toLocaleString()}টি)` : `1-${maxPoultryDays}d Master Chart`))
                : (activeCategory === 'cattle' ? (isBn ? 'গরুর খাদ্য তালিকা' : 'Cattle Ration Chart') : (isBn ? 'মাছের খাদ্য চার্ট' : 'Fish Schedule'))}
            </span>
          </button>

          {activeCategory === 'poultry' && (
            <button
              type="button"
              onClick={() => setActiveTab('crop_brood')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'crop_brood' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sliders size={13} />
              <span>{isBn ? 'ব্রুডিং ও ক্রপ ফিল' : 'Brooding SOP'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
        
        {/* ========================================================================= */}
        {/* CATEGORY: 1. POULTRY (BROILER / SONALI / LAYER)                           */}
        {/* ========================================================================= */}
        {activeCategory === 'poultry' && (
          <>
            {/* BROILER & SONALI VIEW */}
            {poultryBreed !== 'layer' && activeTab === 'today' && (
              <div className="space-y-4">
                {/* Day Selector & Environmental Target Bar (Starts strictly from Day 1) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedDay(prev => Math.max(1, prev - 1))}
                        disabled={selectedDay === 1}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                        title={isBn ? 'আগের দিন' : 'Previous Day'}
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-center shadow-2xs min-w-[85px] sm:min-w-[90px]">
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 block">
                          {isBn ? `সপ্তাহ ${currentBroilerSonaliSop.week}` : `Week ${currentBroilerSonaliSop.week}`}
                        </span>
                        <span className="text-sm sm:text-base font-black text-slate-900">
                          {isBn ? `দিন ${selectedDay}` : `Day ${selectedDay}`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedDay(prev => Math.min(maxPoultryDays, prev + 1))}
                        disabled={selectedDay === maxPoultryDays}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                        title={isBn ? 'পরের দিন' : 'Next Day'}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {Math.round(batchAgeDays) === selectedDay ? (
                      <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] sm:text-xs font-black flex items-center gap-1 border border-emerald-200">
                        <Sparkles size={11} />
                        {isBn ? 'আজকের বয়স' : 'Current Age'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedDay(Math.max(1, Math.min(maxPoultryDays, Math.round(batchAgeDays))))}
                        className="text-[11px] sm:text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                      >
                        {isBn ? 'আজকের দিনে ফিরুন' : 'Back to Today'}
                      </button>
                    )}
                  </div>

                  {/* Climate & Target Specs - 2x2 grid on mobile, flex on desktop */}
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-extrabold text-rose-900 justify-center">
                      <Thermometer size={14} className="text-rose-600 shrink-0" />
                      <span>{currentBroilerSonaliSop.tempFMin}-{currentBroilerSonaliSop.tempFMax}°F</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-extrabold text-blue-900 justify-center">
                      <Droplets size={14} className="text-blue-600 shrink-0" />
                      <span>{currentBroilerSonaliSop.relHumidityMin}-{currentBroilerSonaliSop.relHumidityMax}% RH</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-extrabold text-amber-900 justify-center">
                      <span>🎯 {isBn ? '১টির খাদ্য:' : '1 Bird:'}</span>
                      <span className="font-black text-slate-900">{currentBroilerSonaliSop.feedDailyGm}g</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-extrabold text-emerald-900 justify-center">
                      <span>⚖️ {isBn ? 'টার্গেট:' : 'Target:'}</span>
                      <span className="font-black text-slate-900">{currentBroilerSonaliSop.bodyWeightGm}g</span>
                    </div>
                  </div>
                </div>

                {/* Total Feed Needed Calculation Card */}
                <div className="bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-teal-500/15 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-amber-300/80 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-2xs shrink-0">
                        <Wheat size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                          {isBn 
                            ? `দিন ${selectedDay}: জীবিত ${effectiveLiveCount.toLocaleString()}টি মুরগির মোট খাদ্য হিসাব` 
                            : `Day ${selectedDay}: Feed for ${effectiveLiveCount.toLocaleString()} Live Birds`}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-slate-600 font-bold truncate">
                          {isBn 
                            ? `প্রতি মুরগি ${currentBroilerSonaliSop.feedDailyGm} গ্রাম × ${effectiveLiveCount.toLocaleString()} টি জীবিত মুরগি` 
                            : `${currentBroilerSonaliSop.feedDailyGm}g/bird × ${effectiveLiveCount.toLocaleString()} live birds`}
                        </p>
                      </div>
                    </div>

                    {/* Total Feed Badge */}
                    <div className="text-left sm:text-right bg-white p-2.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-amber-300 shadow-xs flex sm:block items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-800 block">
                        {isBn ? 'আজ সারাদিনে মোট খাবার লাগবে' : 'Total Feed Today'}
                      </span>
                      <div className="flex items-baseline gap-1.5 justify-end">
                        <span className="text-lg sm:text-2xl font-black text-amber-700">
                          {poultryDailyFeedKg.toLocaleString()} {isBn ? 'কেজি' : 'kg'}
                        </span>
                        <span className="text-xs font-black text-slate-600">
                          ({poultryDailyFeedBags} {isBn ? 'বস্তা' : 'bags'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Feed Distribution Timing & Water Needs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-amber-800 flex items-center gap-1">
                          <Sun size={14} />
                          <span>{isBn ? 'সকাল (ভোর ৬টা - ৮টা)' : 'Morning (40%)'}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">৪০%</span>
                      </div>
                      <p className="text-lg font-black text-slate-900">
                        {poultryMorningFeedKg} {isBn ? 'কেজি' : 'kg'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {isBn ? 'সকালে পরিষ্কার ফিডারে খাবার দিন' : 'Distribute in clean feeders'}
                      </p>
                    </div>

                    <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-indigo-800 flex items-center gap-1">
                          <Moon size={14} />
                          <span>{isBn ? 'বিকাল / রাত (বিকাল ৪টা - রাত)' : 'Evening (60%)'}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">৬০%</span>
                      </div>
                      <p className="text-lg font-black text-slate-900">
                        {poultryEveningFeedKg} {isBn ? 'কেজি' : 'kg'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {isBn ? 'রাতের ঠান্ডায় মুরগি বেশি খায় ও দ্রুত বাড়ে' : 'Main feed eaten in cool night'}
                      </p>
                    </div>

                    <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-blue-800 flex items-center gap-1">
                          <Droplets size={14} />
                          <span>{isBn ? 'সুপেয় পানির চাহিদা' : 'Daily Water Requirement'}</span>
                        </span>
                        <span className="text-[10px] font-bold text-blue-600">২-২.৫x</span>
                      </div>
                      <p className="text-lg font-black text-blue-900">
                        {poultryWaterLitersMin} – {poultryWaterLitersMax} {isBn ? 'লিটার' : 'liters'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {isBn ? `টার্গেট মোট ওজন: ${poultryBiomassKg} কেজি` : `Target Live Biomass: ${poultryBiomassKg} kg`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Daily Checklist Tasks */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>{isBn ? `দিন ${selectedDay}-এর নির্দিষ্ট কাজের তালিকা (SOP Work)` : `Day ${selectedDay} Tasks`}</span>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {(isBn ? currentBroilerSonaliSop.tasksBn : currentBroilerSonaliSop.tasks).map((task, idx) => {
                      const key = `p_${poultryBreed}_day_${selectedDay}_task_${idx}`;
                      const isDone = !!completedTasks[key];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleTask(key)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isDone
                              ? 'bg-emerald-50/70 border-emerald-300 text-slate-500'
                              : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs text-slate-800'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isDone ? (
                              <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                                <CheckCircle2 size={14} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-lg border-2 border-slate-300 hover:border-emerald-500 transition-colors" />
                            )}
                          </div>
                          <span className={`text-xs font-bold leading-relaxed ${isDone ? 'line-through text-slate-400' : ''}`}>
                            {task}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* LAYER COMMERCIAL VIEW */}
            {poultryBreed === 'layer' && activeTab === 'today' && (
              <div className="space-y-4">
                {/* Week Selector & Layer Phase Details */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedLayerWeek(prev => Math.max(1, prev - 1))}
                      disabled={selectedLayerWeek <= 1}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="px-3.5 py-1.5 bg-white border border-amber-400 rounded-xl text-center shadow-2xs min-w-[100px]">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700 block">
                        {isBn ? 'লেয়ার পর্যায়' : 'Layer Phase'}
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {isBn ? `সপ্তাহ ${selectedLayerWeek}` : `Week ${selectedLayerWeek}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedLayerWeek(prev => Math.min(72, prev + 1))}
                      disabled={selectedLayerWeek >= 72}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                      <ChevronRight size={16} />
                    </button>

                    <span className="text-xs font-bold text-slate-600">
                      (বয়স: {currentLayerSop.ageDaysStart}-{currentLayerSop.ageDaysEnd} দিন)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black">
                      {isBn ? currentLayerSop.phaseBn : currentLayerSop.phaseEn}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-xs font-black">
                      💡 {currentLayerSop.lightingHours} {isBn ? 'ঘণ্টা আলো' : 'Hrs Light'}
                    </span>
                  </div>
                </div>

                {/* Layer Feeding & Egg Production Performance Card */}
                <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-emerald-500/15 p-4 rounded-3xl border-2 border-amber-400 shadow-sm space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-2xs">
                        <Egg size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm sm:text-base">
                          {isBn 
                            ? `সপ্তাহ ${selectedLayerWeek}: ${effectiveLiveCount.toLocaleString()}টি লেয়ার মুরগির ডিম ও খাদ্য হিসাব` 
                            : `Week ${selectedLayerWeek}: Feed & Egg Production for ${effectiveLiveCount.toLocaleString()} Layers`}
                        </h3>
                        <p className="text-[11px] text-slate-600 font-bold">
                          {isBn ? `খাদ্যের ধরন: ${currentLayerSop.feedTypeBn}` : `Feed Type: ${currentLayerSop.feedTypeEn}`}
                        </p>
                      </div>
                    </div>

                    {/* Egg Production Highlight */}
                    <div className="text-right bg-white px-4 py-2 rounded-2xl border border-amber-400 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-amber-800 block">
                        {isBn ? 'কাঙ্ক্ষিত দৈনিক ডিম উৎপাদন' : 'Expected Daily Eggs'}
                      </span>
                      <div className="flex items-baseline gap-1.5 justify-end">
                        <span className="text-xl sm:text-2xl font-black text-amber-700">
                          {layerExpectedEggsDaily.toLocaleString()} {isBn ? 'টি ডিম' : 'eggs'}
                        </span>
                        <span className="text-xs font-black text-emerald-700">
                          ({currentLayerSop.eggProductionPct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Metric Boxes: Daily Feed, Total Feed, Water */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-xs font-black text-amber-800 block">
                        🌾 {isBn ? '১টি মুরগির খাদ্য' : 'Feed/Hen/Day'}
                      </span>
                      <p className="text-lg font-black text-slate-900">
                        {currentLayerSop.feedDailyGm} {isBn ? 'গ্রাম' : 'grams'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {isBn ? `গড় শারীরিক ওজন: ${currentLayerSop.bodyWeightGm} গ্রাম` : `Target Body Weight: ${currentLayerSop.bodyWeightGm}g`}
                      </p>
                    </div>

                    <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-xs font-black text-emerald-800 block">
                        📦 {isBn ? 'পুরো ফ্লকের দৈনিক খাদ্য' : 'Total Flock Feed'}
                      </span>
                      <p className="text-lg font-black text-emerald-900">
                        {layerDailyFeedKg.toLocaleString()} {isBn ? 'কেজি' : 'kg'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        ({layerDailyFeedBags} {isBn ? 'বস্তা - ৫০ কেজি' : 'bags of 50kg'})
                      </p>
                    </div>

                    <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-xs font-black text-blue-800 block">
                        💧 {isBn ? 'দৈনিক পানির চাহিদা' : 'Daily Water'}
                      </span>
                      <p className="text-lg font-black text-blue-900">
                        {layerWaterLiters.toLocaleString()} {isBn ? 'লিটার' : 'liters'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {isBn ? 'ডিমের সাইজ ও উৎপাদনের জন্য পানি অপরিহার্য' : 'Clean drinking water essential for lay'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Layer Key Weekly Tasks */}
                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>{isBn ? `সপ্তাহ ${selectedLayerWeek}-এর জন্য জরুরি এসওপি গাইড` : `Week ${selectedLayerWeek} Critical Tasks`}</span>
                  </h3>

                  <div className="space-y-2">
                    {(isBn ? currentLayerSop.keyTasksBn : currentLayerSop.keyTasksEn).map((task, idx) => {
                      const key = `layer_wk_${selectedLayerWeek}_task_${idx}`;
                      const isDone = !!completedTasks[key];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleTask(key)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isDone ? 'bg-emerald-50/70 border-emerald-300 text-slate-500' : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs text-slate-800'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isDone ? (
                              <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                                <CheckCircle2 size={14} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-lg border-2 border-slate-300 hover:border-emerald-500 transition-colors" />
                            )}
                          </div>
                          <span className={`text-xs font-bold leading-relaxed ${isDone ? 'line-through text-slate-400' : ''}`}>
                            {task}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* FULL 1-46 / 1-60 DAY POULTRY TABLE (STARTS AT DAY 1, NO DAY 0) */}
            {activeTab === 'full_chart' && poultryBreed !== 'layer' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                      <span className="text-xs font-black text-slate-700 shrink-0 mr-1">
                        {isBn ? 'সপ্তাহ:' : 'Week:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedWeekFilter('all')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                          selectedWeekFilter === 'all' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                        }`}
                      >
                        {isBn ? 'সব' : 'All'}
                      </button>
                      {availableWeeks.map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWeekFilter(w)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                            selectedWeekFilter === w ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                          }`}
                        >
                          {isBn ? `সপ্তাহ ${w}` : `Wk ${w}`}
                        </button>
                      ))}
                    </div>

                    {/* Mobile View Toggle: Cards vs Table */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-xl text-xs sm:hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => setFullChartMobileMode('cards')}
                        className={`px-2 py-1 rounded-lg font-black flex items-center gap-1 cursor-pointer ${
                          fullChartMobileMode === 'cards' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600'
                        }`}
                        title={isBn ? 'মোবাইল কার্ড ভিউ' : 'Card View'}
                      >
                        <LayoutGrid size={12} />
                        <span>{isBn ? 'কার্ড' : 'Card'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFullChartMobileMode('table')}
                        className={`px-2 py-1 rounded-lg font-black flex items-center gap-1 cursor-pointer ${
                          fullChartMobileMode === 'table' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600'
                        }`}
                        title={isBn ? 'টেবিল ভিউ' : 'Table View'}
                      >
                        <Table size={12} />
                        <span>{isBn ? 'টেবিল' : 'Table'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] sm:text-xs font-bold text-slate-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>
                      {isBn 
                        ? `১ থেকে ${maxPoultryDays} দিনের হিসাব (${effectiveLiveCount.toLocaleString()}টি জীবিত মুরগি)` 
                        : `1 to ${maxPoultryDays} Days for ${effectiveLiveCount.toLocaleString()} Live Birds`}
                    </span>
                  </div>
                </div>

                {/* Mobile Cards View */}
                {fullChartMobileMode === 'cards' && (
                  <div className="sm:hidden space-y-2.5">
                    {filteredPoultryDays.map((row) => {
                      const isToday = Math.round(batchAgeDays) === row.day;
                      const tasks = isBn ? row.tasksBn : row.tasks;
                      const rowFlockFeedKg = Number(((effectiveLiveCount * row.feedDailyGm) / 1000).toFixed(2));
                      const rowFlockFeedBags = Number((rowFlockFeedKg / 50).toFixed(2));
                      const rowFlockBiomassKg = Number(((effectiveLiveCount * row.bodyWeightGm) / 1000).toFixed(1));

                      return (
                        <div 
                          key={row.day}
                          className={`p-3 rounded-2xl border transition-all ${
                            isToday
                              ? 'bg-amber-50/90 border-amber-400 shadow-md ring-2 ring-amber-400/50'
                              : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-150 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-xl text-xs font-black ${
                                isToday ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-white'
                              }`}>
                                {isBn ? `দিন ${row.day}` : `Day ${row.day}`}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">
                                {isBn ? `সপ্তাহ ${row.week}` : `Wk ${row.week}`}
                              </span>
                              {isToday && (
                                <span className="px-2 py-0.5 rounded-lg bg-amber-200 text-amber-900 text-[10px] font-black animate-pulse">
                                  {isBn ? '🌟 আজকের দিন' : 'Today'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold">
                              <span className="px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                                🌡️ {row.tempFMin}-{row.tempFMax}°F
                              </span>
                              {row.fcrStd > 0 && (
                                <span className="px-1.5 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700">
                                  FCR {row.fcrStd.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-amber-100/60 p-2 rounded-xl border border-amber-200 space-y-0.5">
                              <span className="text-[10px] font-bold text-amber-900 uppercase block">
                                {isBn ? '🌾 মোট খাদ্য (আজ)' : '🌾 Total Feed'}
                              </span>
                              <div className="text-base font-black text-amber-950">
                                {rowFlockFeedKg} {isBn ? 'কেজি' : 'kg'}
                              </div>
                              <div className="text-[10px] font-semibold text-amber-800">
                                ({rowFlockFeedBags} {isBn ? 'বস্তা' : 'bags'} • ১টির: {row.feedDailyGm}g)
                              </div>
                            </div>

                            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 space-y-0.5">
                              <span className="text-[10px] font-bold text-emerald-900 uppercase block">
                                {isBn ? '⚖️ টার্গেট ওজন' : '⚖️ Target Wt'}
                              </span>
                              <div className="text-base font-black text-emerald-950">
                                {row.bodyWeightGm} {isBn ? 'গ্রাম' : 'g'}
                              </div>
                              <div className="text-[10px] font-semibold text-emerald-700">
                                {isBn ? `মোট: ${rowFlockBiomassKg} কেজি` : `Biomass: ${rowFlockBiomassKg}kg`}
                              </div>
                            </div>
                          </div>

                          {tasks && tasks.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                {isBn ? '📋 নির্দিষ্ট কাজ:' : 'Key Tasks:'}
                              </span>
                              {tasks.slice(0, 2).map((t, idx) => (
                                <div key={idx} className="flex items-start gap-1">
                                  <span className="text-emerald-600 font-bold">•</span>
                                  <span className="line-clamp-1">{t}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Master Table with Sticky Day Column and Sticky Header */}
                <div className={`${fullChartMobileMode === 'table' ? 'block' : 'hidden'} sm:block overflow-x-auto max-h-[68vh] sm:max-h-[74vh] overflow-y-auto rounded-2xl border border-slate-200 relative`}>
                  <table className="w-full text-left text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 z-30 shadow-xs">
                      <tr className="bg-slate-900 text-white font-black text-[11px]">
                        <th className="py-3 px-3 whitespace-nowrap sticky left-0 top-0 z-40 bg-slate-900 text-amber-300 shadow-xs border-b border-slate-700">
                          {isBn ? 'দিন' : 'Day'}
                        </th>
                        <th className="py-3 px-2.5 text-center whitespace-nowrap sticky top-0 z-30 bg-slate-900 border-b border-slate-700">{isBn ? '১টির খাদ্য (gm)' : '1 Bird (gm)'}</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap sticky top-0 z-30 bg-amber-950 text-amber-200 border-b border-amber-800">
                          {isBn ? `ব্যাচের মোট খাদ্য (${effectiveLiveCount}টি)` : `Batch Feed (Kg)`}
                        </th>
                        <th className="py-3 px-2.5 text-center whitespace-nowrap sticky top-0 z-30 bg-slate-900 border-b border-slate-700">{isBn ? 'সর্বমোট খাদ্য' : 'Cum Feed'}</th>
                        <th className="py-3 px-2.5 text-center whitespace-nowrap sticky top-0 z-30 bg-slate-900 border-b border-slate-700">{isBn ? 'গড় ওজন (gm)' : 'Std Wt (gm)'}</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap sticky top-0 z-30 bg-emerald-950 text-emerald-200 border-b border-emerald-800">
                          {isBn ? 'মোট ওজন (কেজি)' : 'Live Biomass (kg)'}
                        </th>
                        <th className="py-3 px-2.5 text-center whitespace-nowrap sticky top-0 z-30 bg-slate-900 border-b border-slate-700">{isBn ? 'STD FCR' : 'STD FCR'}</th>
                        <th className="py-3 px-2.5 text-center whitespace-nowrap sticky top-0 z-30 bg-slate-900 border-b border-slate-700">{isBn ? 'তাপমাত্রা (°F)' : 'Temp °F'}</th>
                        <th className="py-3 px-4 min-w-[260px] sticky top-0 z-30 bg-slate-900 border-b border-slate-700">{isBn ? 'ফার্ম কাজের শিডিউল (SOP Work)' : 'Daily Work Schedule'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {filteredPoultryDays.map((row) => {
                        const isToday = Math.round(batchAgeDays) === row.day;
                        const tasks = isBn ? row.tasksBn : row.tasks;
                        const rowFlockFeedKg = Number(((effectiveLiveCount * row.feedDailyGm) / 1000).toFixed(2));
                        const rowFlockFeedBags = Number((rowFlockFeedKg / 50).toFixed(2));
                        const rowFlockCumFeedKg = Number(((effectiveLiveCount * row.feedCumGm) / 1000).toFixed(1));
                        const rowFlockBiomassKg = Number(((effectiveLiveCount * row.bodyWeightGm) / 1000).toFixed(1));

                        return (
                          <tr 
                            key={row.day}
                            className={`group transition-colors ${
                              isToday 
                                ? 'bg-amber-100/70 font-bold' 
                                : row.isCritical 
                                  ? 'bg-emerald-50/40 hover:bg-emerald-50/70' 
                                  : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className={`py-2.5 px-3 font-black whitespace-nowrap sticky left-0 z-20 ${
                              isToday ? 'bg-amber-100 text-slate-950 font-black' : 'bg-white text-slate-900 group-hover:bg-slate-50'
                            } border-r border-b border-slate-200 shadow-2xs`}>
                              <div className="flex items-center gap-1.5">
                                <span>{isBn ? `দিন ${row.day}` : `D ${row.day}`}</span>
                                {isToday && (
                                  <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-md">
                                    {isBn ? 'আজ' : 'Today'}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 border-b border-slate-100">{row.feedDailyGm}</td>

                            <td className="py-2.5 px-3 text-center font-black text-amber-900 bg-amber-50/80 whitespace-nowrap border-b border-amber-100">
                              <span>{rowFlockFeedKg} কেজি</span>
                              <span className="text-[10px] text-slate-500 font-bold block">
                                ({rowFlockFeedBags} বস্তা)
                              </span>
                            </td>

                            <td className="py-2.5 px-2.5 text-center font-bold text-slate-600 whitespace-nowrap border-b border-slate-100">
                              {rowFlockCumFeedKg} kg
                            </td>

                            <td className="py-2.5 px-2.5 text-center font-black text-slate-800 border-b border-slate-100">{row.bodyWeightGm}</td>

                            <td className="py-2.5 px-3 text-center font-black text-emerald-800 bg-emerald-50/60 whitespace-nowrap border-b border-emerald-100">
                              {rowFlockBiomassKg} কেজি
                            </td>

                            <td className="py-2.5 px-2.5 text-center font-bold text-purple-900 border-b border-slate-100">
                              {row.fcrStd > 0 ? row.fcrStd.toFixed(2) : '-'}
                            </td>

                            <td className="py-2.5 px-2.5 text-center font-semibold text-rose-700 whitespace-nowrap border-b border-slate-100">
                              {row.tempFMin}-{row.tempFMax}°F
                            </td>

                            <td className="py-2.5 px-4 text-slate-700 text-[11px] leading-relaxed border-b border-slate-100">
                              {tasks.map((t, tidx) => (
                                <div key={tidx} className="flex items-start gap-1 py-0.5">
                                  <span className="text-emerald-600 font-bold">•</span>
                                  <span>{t}</span>
                                </div>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FULL LAYER MASTER SCHEDULE (1-72 WEEKS) */}
            {activeTab === 'full_chart' && poultryBreed === 'layer' && (
              <div className="space-y-3">
                {/* Mobile Cards for Layer */}
                <div className="sm:hidden space-y-2.5">
                  {LAYER_SOP_SCHEDULE.map((row) => {
                    const isCurrentWeek = selectedLayerWeek === row.week;
                    const rowFeedKg = Number(((effectiveLiveCount * row.feedDailyGm) / 1000).toFixed(1));
                    const rowFeedBags = Number((rowFeedKg / 50).toFixed(2));
                    const rowEggs = Math.round(effectiveLiveCount * (row.eggProductionPct / 100));

                    return (
                      <div
                        key={row.week}
                        className={`p-3 rounded-2xl border transition-all ${
                          isCurrentWeek
                            ? 'bg-amber-50/90 border-amber-400 shadow-md ring-2 ring-amber-400/50'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-150 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-xl text-xs font-black ${
                              isCurrentWeek ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-white'
                            }`}>
                              সপ্তাহ {row.week}
                            </span>
                            <span className="text-[11px] font-bold text-slate-600">
                              ({row.ageDaysStart}-{row.ageDaysEnd} দিন)
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                            {isBn ? row.phaseBn : row.phaseEn}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-amber-100/60 p-2 rounded-xl border border-amber-200 space-y-0.5">
                            <span className="text-[10px] font-bold text-amber-900 uppercase block">🌾 খাদ্য (আজ)</span>
                            <div className="text-base font-black text-amber-950">{rowFeedKg} কেজি</div>
                            <div className="text-[10px] text-amber-800 font-semibold">({rowFeedBags} বস্তা • ১টির: {row.feedDailyGm}g)</div>
                          </div>

                          <div className="bg-orange-50 p-2 rounded-xl border border-orange-200 space-y-0.5">
                            <span className="text-[10px] font-bold text-orange-900 uppercase block">🥚 ডিম উৎপাদন</span>
                            <div className="text-base font-black text-orange-950">{row.eggProductionPct}%</div>
                            <div className="text-[10px] text-orange-800 font-semibold">{rowEggs > 0 ? `${rowEggs.toLocaleString()} টি/দিন` : 'উৎপাদন পূর্ব'}</div>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                          <span className="font-bold text-amber-900 block mb-0.5">{isBn ? row.feedTypeBn : row.feedTypeEn} (আলো: {row.lightingHours} ঘণ্টা)</span>
                          {(isBn ? row.keyTasksBn : row.keyTasksEn).slice(0, 2).map((t, idx) => (
                            <div key={idx} className="text-slate-600">• {t}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Table for Tablet & Desktop with Sticky Column & Sticky Header */}
                <div className="hidden sm:block overflow-x-auto max-h-[68vh] sm:max-h-[74vh] overflow-y-auto rounded-2xl border border-slate-200 relative">
                  <table className="w-full text-left text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 z-30 shadow-xs">
                      <tr className="bg-slate-900 text-white font-black text-[11px]">
                        <th className="py-3 px-3 sticky left-0 top-0 z-40 bg-slate-900 text-amber-300 border-b border-slate-700 shadow-xs">{isBn ? 'সপ্তাহ (বয়স)' : 'Week'}</th>
                        <th className="py-3 px-3 sticky top-0 z-30 bg-slate-900 border-b border-slate-700">{isBn ? 'উৎপাদন পর্যায়' : 'Phase'}</th>
                        <th className="py-3 px-2 text-center sticky top-0 z-30 bg-slate-900 border-b border-slate-700">{isBn ? '১টির খাদ্য (gm)' : 'Feed/Hen'}</th>
                        <th className="py-3 px-3 text-center sticky top-0 z-30 bg-amber-950 text-amber-200 border-b border-amber-800">
                          {isBn ? `ফ্লকের খাদ্য (${effectiveLiveCount}টি)` : 'Flock Feed'}
                        </th>
                        <th className="py-3 px-2 text-center sticky top-0 z-30 bg-slate-900 border-b border-slate-700">{isBn ? 'গড় ওজন (gm)' : 'Weight'}</th>
                        <th className="py-3 px-3 text-center sticky top-0 z-30 bg-orange-950 text-orange-200 border-b border-orange-800">
                          {isBn ? 'ডিম উৎপাদন %' : 'Lay %'}
                        </th>
                        <th className="py-3 px-3 text-center sticky top-0 z-30 bg-emerald-950 text-emerald-200 border-b border-emerald-800">
                          {isBn ? 'দৈনিক ডিম (টি)' : 'Daily Eggs'}
                        </th>
                        <th className="py-3 px-2 text-center sticky top-0 z-30 bg-slate-900 border-b border-slate-700">{isBn ? 'আলো' : 'Light'}</th>
                        <th className="py-3 px-4 min-w-[240px] sticky top-0 z-30 bg-slate-900 border-b border-slate-700">{isBn ? 'জরুরি ব্যবস্থাপনা ও খাদ্য' : 'Management & Diet'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {LAYER_SOP_SCHEDULE.map((row) => {
                        const isCurrentWeek = selectedLayerWeek === row.week;
                        const rowFeedKg = Number(((effectiveLiveCount * row.feedDailyGm) / 1000).toFixed(1));
                        const rowFeedBags = Number((rowFeedKg / 50).toFixed(2));
                        const rowEggs = Math.round(effectiveLiveCount * (row.eggProductionPct / 100));

                        return (
                          <tr key={row.week} className={`group ${isCurrentWeek ? 'bg-amber-100/70 font-bold' : 'hover:bg-slate-50'}`}>
                            <td className={`py-2.5 px-3 font-black whitespace-nowrap sticky left-0 z-20 ${
                              isCurrentWeek ? 'bg-amber-100 text-slate-950' : 'bg-white text-slate-900 group-hover:bg-slate-50'
                            } border-r border-b border-slate-200`}>
                              সপ্তাহ {row.week} ({row.ageDaysStart}-{row.ageDaysEnd} দিন)
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 border-b border-slate-100">{isBn ? row.phaseBn : row.phaseEn}</td>
                            <td className="py-2.5 px-2 text-center font-bold border-b border-slate-100">{row.feedDailyGm}g</td>
                            <td className="py-2.5 px-3 text-center font-black text-amber-900 bg-amber-50/80 border-b border-amber-100">
                              {rowFeedKg} কেজি ({rowFeedBags} বস্তা)
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold border-b border-slate-100">{row.bodyWeightGm}g</td>
                            <td className="py-2.5 px-3 text-center font-black text-orange-800 bg-orange-50/80 border-b border-orange-100">
                              {row.eggProductionPct}%
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-emerald-800 bg-emerald-50/80 border-b border-emerald-100">
                              {rowEggs > 0 ? `${rowEggs.toLocaleString()} টি` : '-'}
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold border-b border-slate-100">{row.lightingHours}h</td>
                            <td className="py-2.5 px-4 text-[11px] text-slate-700 border-b border-slate-100">
                              <span className="font-bold text-amber-900 block mb-0.5">{isBn ? row.feedTypeBn : row.feedTypeEn}</span>
                              {(isBn ? row.keyTasksBn : row.keyTasksEn).map((t, idx) => (
                                <div key={idx} className="text-slate-600">• {t}</div>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BROODING & CROP FILL SOP */}
            {activeTab === 'crop_brood' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">
                        {isBn ? 'বাচ্চার ক্রপ ফিল অডিট গাইড (পেটে খাবার যাচাই)' : 'Crop Fill Audit Milestones'}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold">
                        {isBn ? 'বাচ্চা খামারে আসার পর ১-২ দিনে পর্যাপ্ত খাবার ও পানি খেলে মৃত্যুহার শূন্যে নামিয়ে আনা সম্ভব' : 'Audit soft crops to ensure brooding success'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {CROP_FILL_MILESTONES.map((m) => (
                      <div key={m.hour} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">
                            {isBn ? m.dayLabelBn : m.dayLabel}
                          </span>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                            {m.targetPercent}% {isBn ? 'লক্ষ্য' : 'Target'}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700">
                          {isBn ? m.descriptionBn : m.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Sliders size={16} className="text-teal-600" />
                    <span>{isBn ? 'ফিডার ও ড্রিংকার প্রতি মুরগির সঠিক অনুপাত' : 'Feeder & Drinker Space Recommendations'}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {FEEDER_SLOT_GUIDES.map((g) => (
                      <div key={g.slot} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                        <span className="text-xs font-black text-emerald-800 block">
                          {isBn ? g.titleBn : g.title} ({isBn ? g.ageDaysRangeBn : g.ageDaysRange})
                        </span>
                        <p className="text-sm font-black text-slate-900">
                          {isBn ? `প্যান ফিল: ${g.panFillPercent}%` : `Pan Fill: ${g.panFillPercent}%`}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold">
                          {isBn ? g.instructionBn : g.instruction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* CATEGORY: 2. CATTLE / LIVESTOCK (ডেইরি গাভী ও ষাঁড় মোটাতাজাকরণ)          */}
        {/* ========================================================================= */}
        {activeCategory === 'cattle' && (
          <div className="space-y-4">
            {/* Cattle Sub-mode Selector: Dairy Cow vs Beef Fattening */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-700">
                  {cattleType === 'dairy' ? (isBn ? 'দুধের মাত্রা নির্বাচন করুন:' : 'Select Milk Yield:') : (isBn ? 'মোটাতাজাকরণের মাস:' : 'Fattening Month:')}
                </span>

                {cattleType === 'dairy' ? (
                  <div className="flex items-center gap-1.5">
                    {DAIRY_COW_SCHEDULE.map((plan, idx) => (
                      <button
                        key={plan.stageId}
                        type="button"
                        onClick={() => setSelectedDairyPlanIdx(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          selectedDairyPlanIdx === idx ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isBn ? plan.titleBn.split('(')[1]?.replace(')', '') || plan.titleBn : plan.titleEn}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {BEEF_FATTENING_SCHEDULE.map((plan, idx) => (
                      <button
                        key={plan.stageId}
                        type="button"
                        onClick={() => setSelectedBeefPlanIdx(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          selectedBeefPlanIdx === idx ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isBn ? `মাস ${idx + 1}` : `Month ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-black">
                  {effectiveLiveCount} {isBn ? 'টি গরু/পশুর জন্য হিসাব' : 'Cattle Heads'}
                </span>
              </div>
            </div>

            {/* Cattle Nutrition Summary Card */}
            <div className="bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-teal-500/15 p-4 rounded-3xl border-2 border-amber-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-2xs">
                    <Wheat size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      {isBn ? currentCattlePlan.titleBn : currentCattlePlan.titleEn}
                    </h3>
                    <p className="text-[11px] text-slate-600 font-bold">
                      {isBn ? currentCattlePlan.descriptionBn : currentCattlePlan.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="text-right bg-white px-4 py-2 rounded-2xl border border-amber-300 shadow-xs">
                  <span className="text-[10px] font-black uppercase text-amber-800 block">
                    {isBn ? 'মোট দানাদার খাদ্য লাগবে' : 'Total Concentrate Feed'}
                  </span>
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <span className="text-xl sm:text-2xl font-black text-amber-700">
                      {cattleConcentrateKg.toLocaleString()} {isBn ? 'কেজি' : 'kg'}
                    </span>
                    <span className="text-xs font-black text-slate-600">
                      ({cattleConcentrateBags} {isBn ? 'বস্তা' : 'bags'})
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Pillars of Cattle Diet: Concentrate, Green Grass, Dry Straw, Water */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-amber-800 block">
                    🌾 {isBn ? 'দানাদার খাদ্য' : 'Concentrate Feed'}
                  </span>
                  <p className="text-base sm:text-lg font-black text-slate-900">
                    {cattleConcentrateKg} {isBn ? 'কেজি' : 'kg'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {isBn ? `গরুপ্রতি ${currentCattlePlan.concentrateDailyKgPerHead} কেজি/দিন` : `${currentCattlePlan.concentrateDailyKgPerHead} kg/head`}
                  </p>
                </div>

                <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-emerald-800 block">
                    🌿 {isBn ? 'কাঁচা ঘাস / সাইলেজ' : 'Green Grass'}
                  </span>
                  <p className="text-base sm:text-lg font-black text-emerald-900">
                    {cattleGreenGrassKg} {isBn ? 'কেজি' : 'kg'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {isBn ? `গরুপ্রতি ${currentCattlePlan.greenGrassKgPerHead} কেজি` : `${currentCattlePlan.greenGrassKgPerHead} kg/head`}
                  </p>
                </div>

                <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-orange-800 block">
                    🌾 {isBn ? 'শুকনো খড় / UMS' : 'Dry Straw / UMS'}
                  </span>
                  <p className="text-base sm:text-lg font-black text-orange-900">
                    {cattleDryStrawKg} {isBn ? 'কেজি' : 'kg'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {isBn ? `গরুপ্রতি ${currentCattlePlan.dryStrawKgPerHead} কেজি` : `${currentCattlePlan.dryStrawKgPerHead} kg/head`}
                  </p>
                </div>

                <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-blue-800 block">
                    💧 {isBn ? 'সুপেয় পানি' : 'Water Needed'}
                  </span>
                  <p className="text-base sm:text-lg font-black text-blue-900">
                    {cattleWaterLiters} {isBn ? 'লিটার' : 'liters'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {isBn ? `গরুপ্রতি ${currentCattlePlan.waterLitersPerHead} লিটার` : `${currentCattlePlan.waterLitersPerHead} L/head`}
                  </p>
                </div>
              </div>
            </div>

            {/* Cattle Feed Composition & Daily Management Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <Wheat size={14} className="text-amber-700" />
                  <span>{isBn ? 'দানাদার খাবারের সুষম মিশ্রণ ফর্মুলা (BLRI স্ট্যান্ডার্ড)' : 'Concentrate Feed Formulation'}</span>
                </h4>
                <div className="space-y-1.5">
                  {currentCattlePlan.feedCompositionBn.map((comp, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{comp}</span>
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  <span>{isBn ? 'জরুরি খামার ব্যবস্থাপনা ও তদারকি' : 'Critical Herd Management'}</span>
                </h4>
                <div className="space-y-1.5">
                  {currentCattlePlan.keyTasksBn.map((task, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-start gap-2">
                      <span className="text-emerald-600 font-black">•</span>
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CATEGORY: 3. FISH / AQUACULTURE (মাছ চাষ - পুকুর ও খাদ্য স্ট্যান্ডার্ড)      */}
        {/* ========================================================================= */}
        {activeCategory === 'fish' && (
          <div className="space-y-4">
            {/* Fish Stage Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-700 mr-1">
                  {isBn ? 'মাছের বৃদ্ধির পর্যায়:' : 'Growth Phase:'}
                </span>
                {FISH_FEEDING_SCHEDULE.map((phase, idx) => (
                  <button
                    key={phase.stageId}
                    type="button"
                    onClick={() => setSelectedFishPhaseIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedFishPhaseIdx === idx ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isBn ? phase.titleBn : phase.titleEn}
                  </button>
                ))}
              </div>

              <span className="px-3 py-1 bg-cyan-100 text-cyan-900 border border-cyan-300 rounded-xl text-xs font-black">
                {effectiveLiveCount.toLocaleString()} {isBn ? 'টি মাছের পুকুর' : 'Total Fish'}
              </span>
            </div>

            {/* Fish Biomass & Feeding Rate Card */}
            <div className="bg-gradient-to-br from-cyan-500/15 via-teal-500/10 to-emerald-500/15 p-4 rounded-3xl border-2 border-cyan-400 shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black shadow-2xs">
                    <Fish size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      {isBn ? currentFishPhase.titleBn : currentFishPhase.titleEn} ({currentFishPhase.ageDaysRangeBn})
                    </h3>
                    <p className="text-[11px] text-slate-600 font-bold">
                      {isBn 
                        ? `খাদ্য হার: মাছের মোট ওজনের (বায়োমাস) ${currentFishPhase.feedRatePctBiomass}% • প্রোটিন: ${currentFishPhase.proteinRequirementPct}%` 
                        : `Feed Rate: ${currentFishPhase.feedRatePctBiomass}% Biomass • Protein: ${currentFishPhase.proteinRequirementPct}%`}
                    </p>
                  </div>
                </div>

                <div className="text-right bg-white px-4 py-2 rounded-2xl border border-cyan-400 shadow-xs">
                  <span className="text-[10px] font-black uppercase text-cyan-800 block">
                    {isBn ? 'পুকুরে দৈনিক ভাসমান খাবার' : 'Daily Floating Feed'}
                  </span>
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <span className="text-xl sm:text-2xl font-black text-cyan-700">
                      {fishDailyFeedKg.toLocaleString()} {isBn ? 'কেজি' : 'kg'}
                    </span>
                    <span className="text-xs font-black text-slate-600">
                      ({fishDailyFeedBags} {isBn ? 'বস্তা - ২৫ কেজি' : 'bags of 25kg'})
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Metric Boxes: Biomass, Pellet size, Feeding times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-cyan-800 block">
                    ⚖️ {isBn ? 'মোট মাছের ওজন (বায়োমাস)' : 'Estimated Pond Biomass'}
                  </span>
                  <p className="text-lg font-black text-slate-900">
                    {fishBiomassKg.toLocaleString()} {isBn ? 'কেজি' : 'kg'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {isBn ? `গড় মাছের ওজন: ${currentFishPhase.targetWeightGm} গ্রাম` : `Avg Fish Weight: ${currentFishPhase.targetWeightGm}g`}
                  </p>
                </div>

                <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-emerald-800 block">
                    🌾 {isBn ? 'খাবারের দানা (পেলেট সাইজ)' : 'Pellet Size & Type'}
                  </span>
                  <p className="text-base sm:text-lg font-black text-emerald-900">
                    {currentFishPhase.pelletSizeMm}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {isBn ? `প্রোটিন রিকোয়ারমেন্ট: ${currentFishPhase.proteinRequirementPct}%` : `Protein: ${currentFishPhase.proteinRequirementPct}%`}
                  </p>
                </div>

                <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-blue-800 block">
                    ⏰ {isBn ? 'দৈনিক খাবার বণ্টন' : 'Feeding Schedule'}
                  </span>
                  <p className="text-lg font-black text-blue-900">
                    {currentFishPhase.feedFrequencyDaily} {isBn ? 'বার' : 'times/day'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {isBn ? 'সকাল ও বিকেলে নির্দিষ্ট জায়গায় খাবার দিন' : 'Fixed feeding spots at dawn & dusk'}
                  </p>
                </div>
              </div>
            </div>

            {/* Fish Water Quality SOP & Management */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <Droplets size={14} className="text-blue-600" />
                  <span>{isBn ? 'পুকুরের পানির গুণমান প্যারামিটার (DoF স্ট্যান্ডার্ড)' : 'Ideal Water Parameters'}</span>
                </h4>
                <div className="space-y-1.5">
                  {currentFishPhase.waterParamsBn.map((param, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{param}</span>
                      <CheckCircle2 size={13} className="text-blue-600" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  <span>{isBn ? 'মাছ চাষের জরুরি ব্যবস্থাপনা ও নমুনা ওজন' : 'Sampling & Management Tasks'}</span>
                </h4>
                <div className="space-y-1.5">
                  {currentFishPhase.keyTasksBn.map((task, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-start gap-2">
                      <span className="text-cyan-600 font-black">•</span>
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
