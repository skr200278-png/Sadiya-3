import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { demoStore } from '../utils/demoStore';
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  Calculator, 
  BarChart3, 
  PieChart, 
  RotateCcw, 
  Edit3, 
  Save, 
  Check, 
  Package, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Calendar, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent,
  Sliders,
  X,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export type FarmSectorType = 'poultry' | 'cattle' | 'fish';

export interface FcrCalculatorCardProps {
  selectedBatch?: any;
  totalFeedConsumedKg?: number;
  totalFeedCost?: number;
  currentBirdCount?: number;
  activeBatches?: any[];
  onBatchChange?: (batchId: string) => void;
  batchRecords?: any[];
}

interface MilestoneData {
  day: number;
  weekLabel: string;
  stdCumFeedKg: number;    // Standard cumulative feed per bird or per flock
  stdWeightGram: number;   // Standard body weight
  actWeightGram?: number;  // Farmer's actual input
  stdFcr: number;          // Standard benchmark FCR
  actFcr?: number;         // Computed actual FCR
  actCumFeedKg?: number;   // Actual cumulative feed if specified
}

// Standard Broiler Benchmarks (Cobb 500 / Ross 308 standards per 1000 birds)
const DEFAULT_BROILER_MILESTONES: MilestoneData[] = [
  { day: 1, weekLabel: 'দিন ১', stdCumFeedKg: 9.9, stdWeightGram: 62, stdFcr: 0.21, actWeightGram: 40, actFcr: 0.25 },
  { day: 2, weekLabel: 'দিন ২', stdCumFeedKg: 23.4, stdWeightGram: 80, stdFcr: 0.37, actWeightGram: 62, actFcr: 0.38 },
  { day: 3, weekLabel: 'দিন ৩', stdCumFeedKg: 38.7, stdWeightGram: 101, stdFcr: 0.50, actWeightGram: 74, actFcr: 0.52 },
  { day: 4, weekLabel: 'দিন ৪', stdCumFeedKg: 57.5, stdWeightGram: 124, stdFcr: 0.62, actWeightGram: 94, actFcr: 0.64 },
  { day: 5, weekLabel: 'দিন ৫', stdCumFeedKg: 78.9, stdWeightGram: 150, stdFcr: 0.70, actWeightGram: 127, actFcr: 0.71 },
  { day: 6, weekLabel: 'দিন ৬', stdCumFeedKg: 103.1, stdWeightGram: 179, stdFcr: 0.75, actWeightGram: 130, actFcr: 0.76 },
  { day: 7, weekLabel: '১ম সপ্তাহ (দিন ৭)', stdCumFeedKg: 130.7, stdWeightGram: 211, stdFcr: 0.79, actWeightGram: 145, actFcr: 0.81 },
  { day: 8, weekLabel: 'দিন ৮', stdCumFeedKg: 161.0, stdWeightGram: 247, stdFcr: 0.82, actWeightGram: 200, actFcr: 0.83 },
  { day: 9, weekLabel: 'দিন ৯', stdCumFeedKg: 192.3, stdWeightGram: 286, stdFcr: 0.85, actWeightGram: 232, actFcr: 0.86 },
  { day: 10, weekLabel: 'দিন ১০', stdCumFeedKg: 227.9, stdWeightGram: 328, stdFcr: 0.88, actWeightGram: 260, actFcr: 0.89 },
  { day: 11, weekLabel: 'দিন ১১', stdCumFeedKg: 263.5, stdWeightGram: 373, stdFcr: 0.91, actWeightGram: 293, actFcr: 0.90 },
  { day: 12, weekLabel: 'দিন ১২', stdCumFeedKg: 308.1, stdWeightGram: 422, stdFcr: 0.94, actWeightGram: 330, actFcr: 0.92 },
  { day: 13, weekLabel: 'দিন ১৩', stdCumFeedKg: 352.6, stdWeightGram: 475, stdFcr: 0.97, actWeightGram: 370, actFcr: 0.95 },
  { day: 14, weekLabel: '২য় সপ্তাহ (দিন ১৪)', stdCumFeedKg: 405.1, stdWeightGram: 531, stdFcr: 1.00, actWeightGram: 483, actFcr: 0.94 },
  { day: 21, weekLabel: '৩য় সপ্তাহ (দিন ২১)', stdCumFeedKg: 1020.0, stdWeightGram: 1050, stdFcr: 1.22, actWeightGram: 990, actFcr: 1.20 },
  { day: 28, weekLabel: '৪র্থ সপ্তাহ (দিন ২৮)', stdCumFeedKg: 1980.0, stdWeightGram: 1680, stdFcr: 1.42, actWeightGram: 1640, actFcr: 1.41 },
  { day: 35, weekLabel: '৫ম সপ্তাহ (দিন ৩৫)', stdCumFeedKg: 3250.0, stdWeightGram: 2350, stdFcr: 1.56, actWeightGram: 2300, actFcr: 1.55 }
];

export default function FcrCalculatorCard({
  selectedBatch,
  totalFeedConsumedKg = 0,
  totalFeedCost = 0,
  currentBirdCount = 0,
  activeBatches = [],
  onBatchChange,
  batchRecords = []
}: FcrCalculatorCardProps) {
  const { language } = useLanguage();
  const { currentUser, isDemoUser } = useAuth();

  // Active view tab: 'overview' (the realistic dashboard) or 'quick_calc'
  const [activeTab, setActiveTab] = useState<'overview' | 'quick_calc'>('overview');
  
  // Table view: 'weekly' (day 7, 14, 21, 28, 35) or 'all' (daily 1 to 35)
  const [tableFilter, setTableFilter] = useState<'weekly' | 'all'>('weekly');

  // Sector selection (Poultry, Cattle, Fish)
  const batchSector: FarmSectorType = (selectedBatch?.farmType as FarmSectorType) || 'poultry';
  const [activeSector, setActiveSector] = useState<FarmSectorType>(batchSector);

  // Sync active sector if batch changes
  useEffect(() => {
    if (selectedBatch?.farmType) {
      setActiveSector(selectedBatch.farmType as FarmSectorType);
    }
  }, [selectedBatch?.farmType]);

  const batchId = selectedBatch?.id || 'default_batch';
  const batchName = selectedBatch?.batchName || 'মুবাসসিন পোল্ট্রি ফার্ম (Ran-186)';
  const totalChicksHoused = Number(selectedBatch?.totalChicks || currentBirdCount || 900);

  // 1. Calculate Age
  const calculateAge = (dateStr?: string) => {
    if (!dateStr) return 14;
    const start = new Date(dateStr);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const ageDays = calculateAge(selectedBatch?.startDate);

  // 2. Real-time Mortality Tracking
  const [mortalityCount, setMortalityCount] = useState<number>(10);

  useEffect(() => {
    if (isDemoUser) {
      const records = demoStore.getMortalityRecords(batchId);
      const count = records.reduce((sum, r) => sum + Number(r.count || 0), 0);
      setMortalityCount(count > 0 ? count : 10); // 10 realistic demo count
      const unsub = demoStore.subscribe(() => {
        const updated = demoStore.getMortalityRecords(batchId);
        const uCount = updated.reduce((sum, r) => sum + Number(r.count || 0), 0);
        if (uCount > 0) setMortalityCount(uCount);
      });
      return () => unsub();
    }

    if (!currentUser || !selectedBatch?.id) return;

    try {
      const q = query(
        collection(db, 'mortality'),
        where('userId', '==', currentUser.uid),
        where('batchId', '==', selectedBatch.id)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let count = 0;
        snapshot.docs.forEach((doc) => {
          count += Number(doc.data().count || 0);
        });
        setMortalityCount(count);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("FcrCalculatorCard mortality catch:", e);
    }
  }, [batchId, currentUser, isDemoUser, selectedBatch?.id]);

  const aliveBirds = Math.max(0, totalChicksHoused - mortalityCount);
  const mortalityRate = totalChicksHoused > 0 ? ((mortalityCount / totalChicksHoused) * 100).toFixed(2) : '0.00';

  // 3. Feed Stock & Consumption Tracking
  // Storage keys for customized adjustments per batch
  const storageKeyFeedIn = `fcr_stock_in_${batchId}`;
  const storageKeyFeedUsed = `fcr_stock_used_${batchId}`;
  const storageKeyMilestones = `fcr_milestones_data_${batchId}`;

  // Calculate feed purchased from batchRecords or default (e.g. 750 KG / 15 bags)
  const defaultFeedPurchasedKg = useMemo(() => {
    if (batchRecords && batchRecords.length > 0) {
      const sum = batchRecords.reduce((acc, r) => acc + (Number(r.quantityBags || 0) * 50), 0);
      if (sum > 0) return sum;
    }
    return 750; // 750 KG (15 bags) standard as in screenshot 1
  }, [batchRecords]);

  const defaultFeedUsedKg = useMemo(() => {
    if (totalFeedConsumedKg > 0) return totalFeedConsumedKg;
    return 405.1; // 405.1 KG standard as in screenshot 1
  }, [totalFeedConsumedKg]);

  const [totalFeedInwardKg, setTotalFeedInwardKg] = useState<number>(() => {
    const saved = localStorage.getItem(storageKeyFeedIn);
    return saved ? Number(saved) : defaultFeedPurchasedKg;
  });

  const [feedConsumedKg, setFeedConsumedKg] = useState<number>(() => {
    const saved = localStorage.getItem(storageKeyFeedUsed);
    return saved ? Number(saved) : defaultFeedUsedKg;
  });

  // Modal for adjusting stock / consumption
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [modalInwardKg, setModalInwardKg] = useState<string>(String(totalFeedInwardKg));
  const [modalConsumedKg, setModalConsumedKg] = useState<string>(String(feedConsumedKg));

  const handleSaveStockAdjustment = () => {
    const inVal = Number(modalInwardKg) || 0;
    const usedVal = Number(modalConsumedKg) || 0;
    setTotalFeedInwardKg(inVal);
    setFeedConsumedKg(usedVal);
    localStorage.setItem(storageKeyFeedIn, String(inVal));
    localStorage.setItem(storageKeyFeedUsed, String(usedVal));
    setShowAdjustModal(false);
    toast.success(language === 'bn' ? 'ফিড স্টক তথ্য সফলভাবে আপডেট হয়েছে' : 'Feed stock updated successfully');
  };

  const remainingStockKg = Math.max(0, Number((totalFeedInwardKg - feedConsumedKg).toFixed(1)));
  const remainingStockPercent = totalFeedInwardKg > 0 ? Math.max(0, Math.min(100, Math.round((remainingStockKg / totalFeedInwardKg) * 100))) : 0;
  const consumedStockPercent = totalFeedInwardKg > 0 ? Math.max(0, Math.min(100, Math.round((feedConsumedKg / totalFeedInwardKg) * 100))) : 0;

  // 4. Milestone Growth & Auto FCR Calculation Table
  const [milestones, setMilestones] = useState<MilestoneData[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyMilestones);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Milestone parse error:", e);
    }
    return DEFAULT_BROILER_MILESTONES;
  });

  // Save milestones to localStorage whenever updated
  const updateMilestoneActualWeight = (day: number, newWeightStr: string) => {
    const weightNum = parseFloat(newWeightStr);
    setMilestones(prev => {
      const updated = prev.map(m => {
        if (m.day === day) {
          if (isNaN(weightNum) || weightNum <= 0) {
            return { ...m, actWeightGram: undefined, actFcr: undefined };
          }
          // Compute Actual FCR:
          // Formula: (Cumulative Feed Consumed per bird in Kg) / ((Actual Weight Gram - 42g initial) / 1000)
          // Or proportional to standard FCR:
          const netGainGram = Math.max(10, weightNum - 42); // 42g day-old chick standard
          const cumFeedPerBirdKg = (m.stdCumFeedKg * (feedConsumedKg / defaultFeedUsedKg)) / (totalChicksHoused || 900);
          
          let calculatedFcr = Number(((cumFeedPerBirdKg * 1000) / netGainGram).toFixed(2));
          // Sanity check bound for display:
          if (calculatedFcr < 0.2) calculatedFcr = Number((m.stdFcr * (m.stdWeightGram / weightNum)).toFixed(2));
          if (calculatedFcr > 3.0) calculatedFcr = 2.5;

          return {
            ...m,
            actWeightGram: weightNum,
            actFcr: calculatedFcr
          };
        }
        return m;
      });

      try {
        localStorage.setItem(storageKeyMilestones, JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage save err:", e);
      }
      return updated;
    });
  };

  // Find the closest active milestone based on age or latest input
  const currentMilestone = useMemo(() => {
    // Find closest milestone <= ageDays
    const exact = milestones.find(m => m.day === ageDays);
    if (exact) return exact;
    const previous = [...milestones].filter(m => m.day <= ageDays).pop();
    if (previous) return previous;
    return milestones[milestones.length - 1];
  }, [milestones, ageDays]);

  const currentActualWeight = currentMilestone.actWeightGram || 483;
  const currentStdWeight = currentMilestone.stdWeightGram || 531;
  const currentActualFcr = currentMilestone.actFcr || 0.94;
  const currentStdFcr = currentMilestone.stdFcr || 1.00;

  // FCR difference: Actual - Standard
  const fcrDiff = Number((currentActualFcr - currentStdFcr).toFixed(2));
  const isFcrGood = fcrDiff <= 0.02;
  const fcrDiffSign = fcrDiff > 0 ? `+${fcrDiff}` : `${fcrDiff}`;
  const fcrStatusText = fcrDiff <= 0 
    ? (language === 'bn' ? 'চমৎকার পারফরম্যান্স' : 'Excellent Performance') 
    : fcrDiff <= 0.08 
    ? (language === 'bn' ? 'স্বাভাবিক পারফরম্যান্স' : 'Normal Performance')
    : (language === 'bn' ? 'সতর্কতা: বেশি FCR' : 'Warning: High FCR');

  // Estimated feed cost and profit
  const calculatedFeedCost = totalFeedCost > 0 ? totalFeedCost : Math.round(feedConsumedKg * 68); // ~68 tk/kg standard
  const estimatedNetProfit = Math.round(aliveBirds * (currentActualWeight / 1000) * 165 - calculatedFeedCost - 35000); // 165 tk/kg live broiler

  // Filtered rows for table view
  const displayedMilestones = useMemo(() => {
    if (tableFilter === 'weekly') {
      return milestones.filter(m => [7, 14, 21, 28, 35].includes(m.day));
    }
    return milestones;
  }, [milestones, tableFilter]);

  // Quick interactive manual calculator state
  const [calcFeedKg, setCalcFeedKg] = useState<string>('405');
  const [calcBirds, setCalcBirds] = useState<string>(String(aliveBirds || 890));
  const [calcAvgWeight, setCalcAvgWeight] = useState<string>('483');
  const [calcInitialWeight, setCalcInitialWeight] = useState<string>('42');

  const manualComputedFcr = useMemo(() => {
    const fKg = parseFloat(calcFeedKg) || 0;
    const bCount = parseFloat(calcBirds) || 0;
    const wGram = parseFloat(calcAvgWeight) || 0;
    const initW = parseFloat(calcInitialWeight) || 42;

    if (fKg > 0 && bCount > 0 && wGram > initW) {
      const netMeatKg = (bCount * (wGram - initW)) / 1000;
      if (netMeatKg > 0) {
        return Number((fKg / netMeatKg).toFixed(2));
      }
    }
    return 0;
  }, [calcFeedKg, calcBirds, calcAvgWeight, calcInitialWeight]);

  // Donut chart SVG geometry calculation
  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const strokeRemaining = (remainingStockPercent / 100) * donutCircumference;
  const strokeConsumed = (consumedStockPercent / 100) * donutCircumference;

  // Reset to demo realistic data
  const handleResetData = () => {
    if (window.confirm(language === 'bn' ? 'আপনি কি সব FCR ও ওজন ডেটা রিসেট করতে চান?' : 'Do you want to reset FCR data to default demo?')) {
      localStorage.removeItem(storageKeyMilestones);
      localStorage.removeItem(storageKeyFeedIn);
      localStorage.removeItem(storageKeyFeedUsed);
      setMilestones(DEFAULT_BROILER_MILESTONES);
      setTotalFeedInwardKg(750);
      setFeedConsumedKg(405.1);
      toast.success(language === 'bn' ? 'সফলভাবে রিসেট সম্পন্ন হয়েছে' : 'Reset to default benchmarks');
    }
  };

  return (
    <div className="space-y-4">

      {/* TOP HEADER: Broiler Farm Management & Automation System (Screenshot 1 Style) */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-sm border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
              <Activity size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[11px] font-black tracking-wide uppercase">
                  {language === 'bn' ? 'খামার খাতা' : 'Khamar Khata'}
                </span>
                <span className="text-xs text-emerald-300 font-bold">
                  Broiler Farm Management & Automation System
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-950/80 border border-emerald-700/60 rounded-full text-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {language === 'bn' ? 'অটো-সেভ সক্রিয়' : 'Auto-Saved'}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-slate-200 font-semibold flex-wrap">
                <span>Farm: <strong className="text-white">{batchName}</strong></span>
                <span className="text-emerald-400/60">•</span>
                <span>Branch: <strong className="text-emerald-200">রংপুর</strong></span>
                <span className="text-emerald-400/60">•</span>
                <span>Location: <strong className="text-emerald-200">সাইতনতলা, সুন্দরগঞ্জ</strong></span>
              </div>
            </div>
          </div>

          {/* Batch Selector & Reset Button */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            {activeBatches.length > 1 && onBatchChange && (
              <select
                value={selectedBatch?.id || ''}
                onChange={(e) => onBatchChange(e.target.value)}
                className="bg-emerald-950/90 text-white border border-emerald-600/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-emerald-400 outline-none cursor-pointer"
              >
                {activeBatches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.batchName} ({b.totalChicks || 0} টি)
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleResetData}
              className="px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={language === 'bn' ? 'নমুনা মান রিলোড করুন' : 'Reload sample benchmark'}
            >
              <RotateCcw size={13} />
              <span>{language === 'bn' ? 'রিসেট' : 'Reset'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW TOGGLE TABS: Detailed Overview vs Quick Calculator */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-amber-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PieChart size={15} />
            <span>{language === 'bn' ? '📊 বাস্তব চিত্র ও FCR স্টক' : 'Flock Performance & Stock'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quick_calc')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'quick_calc'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calculator size={15} />
            <span>{language === 'bn' ? '🧮 কুইক FCR ক্যালকুলেটর' : 'Quick FCR Tool'}</span>
          </button>
        </div>

        {/* Sector Indicator */}
        <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
          <span>🐔</span>
          <span>{language === 'bn' ? 'ব্রয়লার (Cobb 500 / Ross 308)' : 'Broiler Benchmark'}</span>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-4">
          
          {/* CARD 1: ফিড স্টক অবস্থা (কেজি) — DONUT CHART & 3 STATS (Image 1 Style) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {language === 'bn' ? 'ফিড স্টক অবস্থা (কেজি)' : 'Feed Stock Status (KG)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {language === 'bn' ? 'খামারে আসা, মুরগির খাওয়া ও অবশিষ্ট খাদ্য' : 'Inward stock, consumed feed and balance'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalInwardKg(String(totalFeedInwardKg));
                  setModalConsumedKg(String(feedConsumedKg));
                  setShowAdjustModal(true);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit3 size={13} />
                <span>{language === 'bn' ? 'সমন্বয় করুন' : 'Adjust Stock'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Donut Chart Visual */}
              <div className="md:col-span-4 flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      className="text-slate-100"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {/* Consumed Feed Segment (Amber) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      className="text-amber-500 transition-all duration-700 ease-out"
                      strokeWidth="10"
                      strokeDasharray={donutCircumference}
                      strokeDashoffset={donutCircumference - strokeConsumed}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {/* Remaining Stock Segment (Emerald) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      className="text-emerald-500 transition-all duration-700 ease-out"
                      strokeWidth="10"
                      strokeDasharray={donutCircumference}
                      strokeDashoffset={donutCircumference - strokeRemaining}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  
                  {/* Center Text inside Donut */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {remainingStockPercent}%
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'bn' ? 'অবশিষ্ট' : 'Remaining'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    {language === 'bn' ? 'স্টক' : 'Stock'} ({remainingStockPercent}%)
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    {language === 'bn' ? 'ব্যবহৃত' : 'Used'} ({consumedStockPercent}%)
                  </span>
                </div>
              </div>

              {/* 3 Metric Columns */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. মোট এসেছে */}
                <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl text-center flex flex-col justify-center">
                  <span className="text-xs font-extrabold text-slate-600 block">
                    {language === 'bn' ? 'মোট এসেছে' : 'Total Arrived'}
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
                    {totalFeedInwardKg}
                  </p>
                  <span className="text-xs font-bold text-slate-500 mt-0.5">
                    {language === 'bn' ? 'কেজি' : 'KG'} ({(totalFeedInwardKg / 50).toFixed(1)} {language === 'bn' ? 'বস্তা' : 'bags'})
                  </span>
                </div>

                {/* 2. ব্যবহৃত */}
                <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl text-center flex flex-col justify-center">
                  <span className="text-xs font-extrabold text-amber-800 block">
                    {language === 'bn' ? 'ব্যবহৃত' : 'Consumed'}
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-amber-900 font-mono mt-1">
                    {feedConsumedKg}
                  </p>
                  <span className="text-xs font-bold text-amber-700 mt-0.5">
                    {language === 'bn' ? 'কেজি' : 'KG'} ({(feedConsumedKg / 50).toFixed(1)} {language === 'bn' ? 'বস্তা' : 'bags'})
                  </span>
                </div>

                {/* 3. স্টকে অবশিষ্ট */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl text-center flex flex-col justify-center">
                  <span className="text-xs font-extrabold text-emerald-800 block">
                    {language === 'bn' ? 'স্টকে অবশিষ্ট' : 'Stock Left'}
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono mt-1">
                    {remainingStockKg}
                  </p>
                  <span className="text-xs font-bold text-emerald-700 mt-0.5">
                    {language === 'bn' ? 'কেজি' : 'KG'} ({(remainingStockKg / 50).toFixed(1)} {language === 'bn' ? 'বস্তা' : 'bags'})
                  </span>
                </div>
              </div>
            </div>

            {/* STATUS BANNER: বয়স ১৪ দিন — বর্তমান অবস্থা (Image 1 Style) */}
            <div className="mt-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5 text-amber-950">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                i
              </div>
              <div className="text-xs sm:text-[13px] leading-relaxed">
                <span className="font-black text-amber-900">
                  {language === 'bn' ? `বয়স ${ageDays} দিন — বর্তমান অবস্থা` : `Age ${ageDays} Days — Current Status`}
                </span>
                <span className="hidden sm:inline mx-1.5">•</span>
                <span className="block sm:inline font-semibold">
                  {language === 'bn' 
                    ? `জীবিত ${aliveBirds} টি (মৃত্যু ${mortalityRate}%) • আজকের গড় ওজন ${currentActualWeight} গ্রাম (Std ${currentStdWeight}) • FCR ${currentActualFcr.toFixed(2)} (Std ${currentStdFcr.toFixed(2)}) • স্টকে ফিড অবশিষ্ট ${remainingStockKg} কেজি।`
                    : `Alive ${aliveBirds} (Mortality ${mortalityRate}%) • Avg Weight ${currentActualWeight}g (Std ${currentStdWeight}g) • FCR ${currentActualFcr.toFixed(2)} (Std ${currentStdFcr.toFixed(2)}) • Feed left ${remainingStockKg} KG.`}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: FLOCK VITAL PERFORMANCE METRICS (Screenshot 4 Style) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. মোট বাচ্চা */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                {language === 'bn' ? 'মোট বাচ্চা (HOUSED)' : 'TOTAL CHICKS'}
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
                {totalChicksHoused}
              </p>
              <span className="text-[11px] font-bold text-slate-500">
                {language === 'bn' ? 'প্রোইস্টা / ব্রয়লার' : 'Broiler'}
              </span>
            </div>

            {/* 2. বর্তমান জীবিত মুরগি */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                {language === 'bn' ? 'বর্তমান জীবিত মুরগি' : 'CURRENT ALIVE'}
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
                {aliveBirds}
              </p>
              <span className="text-[11px] font-bold text-rose-600">
                {language === 'bn' ? `মৃত্যু: ${mortalityCount} টি` : `Dead: ${mortalityCount}`}
              </span>
            </div>

            {/* 3. মৃত্যুর হার (%) */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                {language === 'bn' ? 'মৃত্যুর হার (%)' : 'MORTALITY RATE'}
              </span>
              <p className={`text-xl sm:text-2xl font-black font-mono mt-1 ${Number(mortalityRate) > 3 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {mortalityRate}%
              </p>
              <span className="text-[11px] font-bold text-slate-500">
                {language === 'bn' ? 'টার্গেট: < ৩.০%' : 'Target: < 3%'}
              </span>
            </div>

            {/* 4. মোট খাদ্য গ্রহণ */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                {language === 'bn' ? 'মোট খাদ্য গ্রহণ (কেজি)' : 'TOTAL FEED FED'}
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-1">
                {feedConsumedKg}
              </p>
              <span className="text-[11px] font-bold text-slate-500 truncate block">
                {language === 'bn' ? 'সর্বমোট ব্যবহৃত ফিড' : 'Total Feed Fed'}
              </span>
            </div>

            {/* 5. বর্তমান গড় ওজন */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                {language === 'bn' ? 'বর্তমান গড় ওজন' : 'CURRENT AVG WEIGHT'}
              </span>
              <p className="text-xl sm:text-2xl font-black text-indigo-700 font-mono mt-1">
                {currentActualWeight} <span className="text-xs font-bold text-slate-500">{language === 'bn' ? 'গ্রাম' : 'g'}</span>
              </p>
              <span className="text-[11px] font-bold text-slate-500">
                {language === 'bn' ? `বয়স: Day ${ageDays}` : `Age: Day ${ageDays}`}
              </span>
            </div>

            {/* 6. বর্তমান FCR (ACTUAL) */}
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                {language === 'bn' ? 'বর্তমান FCR (ACTUAL)' : 'CURRENT FCR'}
              </span>
              <p className="text-xl sm:text-2xl font-black text-yellow-300 font-mono mt-1">
                {currentActualFcr.toFixed(2)}
              </p>
              <span className="text-[11px] font-bold text-slate-300 truncate block">
                Std: {currentStdFcr.toFixed(2)}
              </span>
            </div>
          </div>

          {/* CARD 3: FCR DIFFERENCE & COST OVERVIEW CHIPS (Screenshot 3 Style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* FCR Difference Chip */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {language === 'bn' ? 'FCR পার্থক্য' : 'FCR Difference'}
                </span>
                <p className={`text-xl font-black font-mono mt-0.5 ${fcrDiff <= 0 ? 'text-emerald-600' : fcrDiff <= 0.08 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {fcrDiffSign}
                </p>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${fcrDiff <= 0 ? 'bg-emerald-100 text-emerald-800' : fcrDiff <= 0.08 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                {fcrStatusText}
              </span>
            </div>

            {/* Total Feed Cost Chip */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {language === 'bn' ? 'মোট ফিড খরচ' : 'Total Feed Cost'}
                </span>
                <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                  ৳{calculatedFeedCost.toLocaleString('bn-BD')}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-xl">
                {feedConsumedKg} {language === 'bn' ? 'কেজি ফিড' : 'KG feed'}
              </span>
            </div>

            {/* Estimated Net Profit Chip */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {language === 'bn' ? 'নিট লাভ / ক্ষতি (আনুমানিক)' : 'Net Profit (Est.)'}
                </span>
                <p className={`text-xl font-black font-mono mt-0.5 ${estimatedNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ৳{estimatedNetProfit.toLocaleString('bn-BD')}
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-xl">
                {language === 'bn' ? 'ফ্লক গ্রোথ অনুযায়ী' : 'Live Estimate'}
              </span>
            </div>
          </div>

          {/* CARD 4: দৈনিক শারীরিক ওজন (বাস্তব vs স্ট্যান্ডার্ড) লাইন চার্ট (Screenshot 3 Style) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    {language === 'bn' ? 'দৈনিক শারীরিক ওজন (বাস্তব vs স্ট্যান্ডার্ড)' : 'Body Weight Curve (Actual vs Standard)'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {language === 'bn' ? 'কয়েক সপ্তাহের শারীরিক ওজন ও গ্রোথ রেট' : 'Weekly body weight progression in grams'}
                  </p>
                </div>
              </div>

              {/* Legend Indicator */}
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3.5 h-1 bg-emerald-600 rounded-full"></span>
                  {language === 'bn' ? 'বাস্তব ওজন (gm)' : 'Actual Weight (gm)'}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-400"></span>
                  {language === 'bn' ? 'স্ট্যান্ডার্ড ওজন (gm)' : 'Std Weight (gm)'}
                </span>
              </div>
            </div>

            {/* SVG Weight Line Chart */}
            <div className="relative pt-2 pb-1 overflow-x-auto">
              <div className="min-w-[500px] h-48 sm:h-56">
                <svg className="w-full h-full" viewBox="0 0 540 180">
                  {/* Grid Lines */}
                  {[30, 70, 110, 150].map((y, i) => (
                    <g key={i}>
                      <line x1="40" y1={y} x2="520" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="32" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace" fontWeight="bold">
                        {2000 - i * 500}g
                      </text>
                    </g>
                  ))}

                  {/* Standard Curve (Dashed line) */}
                  {(() => {
                    const points = milestones.map((m, idx) => {
                      const x = 50 + (idx / (milestones.length - 1)) * 460;
                      const y = 160 - (m.stdWeightGram / 2400) * 135;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <polyline
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        points={points}
                      />
                    );
                  })()}

                  {/* Actual Weight Curve (Solid Green) */}
                  {(() => {
                    const actualPts = milestones
                      .filter(m => m.actWeightGram !== undefined)
                      .map((m) => {
                        const idx = milestones.findIndex(item => item.day === m.day);
                        const x = 50 + (idx / (milestones.length - 1)) * 460;
                        const y = 160 - ((m.actWeightGram || 0) / 2400) * 135;
                        return { x, y, day: m.day, weight: m.actWeightGram };
                      });

                    if (actualPts.length === 0) return null;

                    const polylinePoints = actualPts.map(p => `${p.x},${p.y}`).join(' ');

                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          points={polylinePoints}
                        />
                        {actualPts.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                            <rect x={p.x - 14} y={p.y - 18} width="28" height="12" rx="3" fill="#0f172a" />
                            <text x={p.x} y={p.y - 9} textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold" fontFamily="monospace">
                              {p.weight}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}

                  {/* X Axis Labels */}
                  {milestones.map((m, idx) => {
                    if (idx % 2 !== 0 && milestones.length > 8) return null;
                    const x = 50 + (idx / (milestones.length - 1)) * 460;
                    return (
                      <text key={idx} x={x} y="175" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="bold">
                        Day {m.day}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* CARD 5: WEEKLY & DAILY STANDARD VS ACTUAL TABLE (Screenshot 2 Style) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{language === 'bn' ? 'সাপ্তাহিক ও বয়স অনুযায়ী গ্রোথ টেবিল' : 'Standard vs Actual Growth Table'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                    {language === 'bn' ? 'ইনপুট দিলে অটো FCR সেভ' : 'Instant FCR on Input'}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {language === 'bn' 
                    ? 'ওজন (গ্রাম) লিখুন—স্বয়ংক্রিয়ভাবে ৭ দিনের ও বয়সের FCR বের হয়ে সেভ হয়ে থাকবে' 
                    : 'Enter actual weight in grams to automatically calculate and save 7-day FCR'}
                </p>
              </div>

              {/* Table Filter: Weekly vs All Days */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTableFilter('weekly')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    tableFilter === 'weekly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'bn' ? '📅 সপ্তাহ ভিত্তিক (Week 1 → 5)' : 'Weekly View'}
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    tableFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'bn' ? '📋 দৈনিক পূর্ণাঙ্গ তালিকা' : 'Daily View'}
                </button>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-emerald-800 text-white font-black text-[11px]">
                    <th className="py-3 px-3.5">
                      {language === 'bn' ? 'বয়স / সপ্তাহ' : 'Age / Milestone'}
                    </th>
                    <th className="py-3 px-3 text-center">
                      {language === 'bn' ? 'কিউমু. ফিড (কেজি)' : 'Cum. Feed (KG)'}
                    </th>
                    <th className="py-3 px-3 text-center">
                      {language === 'bn' ? 'STD ওজন (GM)' : 'STD Weight (GM)'}
                    </th>
                    <th className="py-3 px-3 text-center bg-amber-500 text-slate-950 font-black">
                      {language === 'bn' ? 'ACT ওজন (GM)' : 'ACT Weight (GM)'}
                    </th>
                    <th className="py-3 px-3 text-center">
                      {language === 'bn' ? 'STD FCR' : 'STD FCR'}
                    </th>
                    <th className="py-3 px-3 text-center">
                      {language === 'bn' ? 'ACT FCR' : 'ACT FCR'}
                    </th>
                    <th className="py-3 px-3.5 text-center">
                      {language === 'bn' ? 'সপ্তাহ শেষে ফিড লক্ষ্য' : 'Target Bags'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedMilestones.map((m) => {
                    const isToday = m.day === ageDays;
                    const diffFcr = m.actFcr !== undefined ? Number((m.actFcr - m.stdFcr).toFixed(2)) : undefined;

                    return (
                      <tr 
                        key={m.day} 
                        className={`transition-colors ${isToday ? 'bg-amber-50/80 font-bold' : 'hover:bg-slate-50/80'}`}
                      >
                        <td className="py-2.5 px-3.5 text-slate-900 font-bold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{m.weekLabel}</span>
                            {isToday && (
                              <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded-md">
                                {language === 'bn' ? 'আজকের বয়স' : 'Today'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                          {m.stdCumFeedKg.toFixed(1)} <span className="text-[10px] text-slate-400">kg</span>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono text-slate-700 font-bold">
                          {m.stdWeightGram} <span className="text-[10px] text-slate-400">gm</span>
                        </td>

                        {/* EDITABLE ACTUAL WEIGHT INPUT */}
                        <td className="py-2 px-2 text-center bg-amber-50/40">
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              defaultValue={m.actWeightGram || ''}
                              placeholder={String(m.stdWeightGram)}
                              onBlur={(e) => updateMilestoneActualWeight(m.day, e.target.value)}
                              className="w-20 text-center font-black font-mono py-1 px-1.5 bg-white border border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-lg text-slate-900 text-xs shadow-2xs"
                            />
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 font-bold">
                          {m.stdFcr.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {m.actFcr !== undefined ? (
                            <span className={`inline-block px-2 py-0.5 rounded-md font-mono font-black text-xs ${
                              diffFcr! <= 0 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : diffFcr! <= 0.08 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {m.actFcr.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>

                        {/* Weekly Bags Comparison */}
                        <td className="py-2.5 px-3.5 text-center text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                          {Math.round(m.stdCumFeedKg / 50)} {language === 'bn' ? 'বস্তা' : 'bags'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD 6: SMART AUTO-SUGGESTION ENGINE (কি করলে FCR High হলে ঠিক হবে) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    {language === 'bn' ? 'ভেটেরিনারি অটো-সাজেশন (FCR অপ্টিমাইজেশন)' : 'Veterinary Auto-Suggestion Engine'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {language === 'bn' ? 'FCR বেশি হলে স্বাভাবিক করার সুনির্দিষ্ট কার্যপদ্ধতি' : 'Actionable steps if FCR is higher than benchmark'}
                  </p>
                </div>
              </div>

              <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${isFcrGood ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {isFcrGood 
                  ? (language === 'bn' ? '🟢 এফসিআর স্বাভাবিক' : 'Normal FCR')
                  : (language === 'bn' ? '⚠️ এফসিআর বৃদ্ধির ঝুঁকি' : 'High FCR Alert')}
              </span>
            </div>

            {/* Dynamic Advice Box */}
            {isFcrGood ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>{language === 'bn' ? 'অভিনন্দন! আপনার খামারের এফসিআর অত্যন্ত সন্তোষজনক।' : 'Outstanding FCR Performance!'}</span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-800">
                  {language === 'bn' 
                    ? `আপনার বর্তমান FCR (${currentActualFcr.toFixed(2)}) আদর্শ মান (${currentStdFcr.toFixed(2)}) এর চেয়ে চমৎকার অবস্থানে রয়েছে। মুরগির খাবার যথাযথভাবে মাংসে রূপান্তর হচ্ছে। বর্তমান খাদ্য শিডিউল, পরিষ্কার পানি সরবরাহ এবং লিটার শুকনো রাখার নিয়মিত যত্ন ধরে রাখুন।`
                    : `Your current FCR (${currentActualFcr.toFixed(2)}) is well within profitable targets. Keep maintaining regular clean drinking water and litter dryness.`}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-3">
                <div className="flex items-center gap-2 font-black text-sm text-rose-800">
                  <AlertTriangle size={18} className="text-rose-600" />
                  <span>
                    {language === 'bn' 
                      ? 'সতর্কতা: FCR বেশি হওয়ার ৫টি মূল কারণ ও তাৎক্ষণিক সমাধান' 
                      : 'Action Plan: 5 Causes of High FCR & Solutions'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-rose-900">
                  <div className="p-2.5 rounded-xl bg-white/80 border border-rose-100 space-y-1">
                    <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px] font-black">১</span>
                      {language === 'bn' ? 'ফিডার উচ্চতা ও খাবার অপচয়' : 'Feeder Height & Spill'}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {language === 'bn'
                        ? 'ফিডারের উচ্চতা সবসময় মুরগির পিঠের সমান্তরাল রাখুন। নিচে খাবার পড়ে নষ্ট হলে ৩-৫% FCR এমনিতেই বেড়ে যায়।'
                        : 'Adjust feeder height to the bird back level to prevent spilling.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 border border-rose-100 space-y-1">
                    <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px] font-black">২</span>
                      {language === 'bn' ? 'ব্রুডিং ও শেড তাপমাত্রা' : 'Temperature Stress'}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {language === 'bn'
                        ? 'শেডে ঠান্ডা বাতাস ঢুকলে মুরগি শরীর গরম রাখতে বেশি খাবার খায় কিন্তু মাংস বাড়ে না। আদর্শ তাপমাত্রা বজায় রাখুন।'
                        : 'Cold stress forces birds to burn feed for warmth instead of meat gain.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 border border-rose-100 space-y-1">
                    <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px] font-black">৩</span>
                      {language === 'bn' ? 'অন্ত্রের স্বাস্থ্য ও কক্সিডিওসিস' : 'Gut Health & Coccidiosis'}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {language === 'bn'
                        ? 'ড্রপিংয়ে রক্ত বা অপাচ্য দানাদার খাবার থাকলে রক্ত আমাশয় বা কৃমির কারণে খাদ্য শোষণ ব্যাহত হচ্ছে। এনজাইম বা টক্সিন বাইন্ডার দিন।'
                        : 'Examine droppings for undigested feed or bloody coccidiosis.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 border border-rose-100 space-y-1">
                    <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px] font-black">৪</span>
                      {language === 'bn' ? 'লিটার আর্দ্রতা ও অ্যামোনিয়া' : 'Litter & Ammonia Gas'}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {language === 'bn'
                        ? 'স্যাঁতসেঁতে লিটারে অ্যামোনিয়া গ্যাস বাড়ে, যা খাদ্য গ্রহণ ও বৃদ্ধি কমিয়ে দেয়। তুষ উল্টে শুকনা রাখুন।'
                        : 'Wet litter generates toxic ammonia which suppresses healthy feed intake.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* TAB 2: QUICK INTERACTIVE FCR CALCULATOR */
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Calculator size={18} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight">
                  {language === 'bn' ? 'কুইক FCR ক্যালকুলেটর' : 'Quick Single FCR Calculator'}
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {language === 'bn' ? 'যেকোনো খাবার ও ওজনের মান বসিয়ে তাত্ক্ষণিক FCR যাচাই করুন' : 'Compute instant FCR for custom entries'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'মোট খাওয়ানো খাবার (কেজি):' : 'Total Feed Fed (KG):'}
              </label>
              <input
                type="number"
                value={calcFeedKg}
                onChange={(e) => setCalcFeedKg(e.target.value)}
                placeholder="405"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'জীবিত মুরগির সংখ্যা (টি):' : 'Live Birds Count:'}
              </label>
              <input
                type="number"
                value={calcBirds}
                onChange={(e) => setCalcBirds(e.target.value)}
                placeholder="890"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'বর্তমান গড় ওজন (গ্রাম):' : 'Current Avg Weight (GM):'}
              </label>
              <input
                type="number"
                value={calcAvgWeight}
                onChange={(e) => setCalcAvgWeight(e.target.value)}
                placeholder="483"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'শুরুর বাচ্চার ওজন (গ্রাম):' : 'Day-Old Weight (GM):'}
              </label>
              <input
                type="number"
                value={calcInitialWeight}
                onChange={(e) => setCalcInitialWeight(e.target.value)}
                placeholder="42"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          </div>

          {manualComputedFcr > 0 && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-3xl text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                {language === 'bn' ? 'গণনাকৃত এফসিআর (FCR)' : 'CALCULATED FCR'}
              </span>
              <p className="text-4xl sm:text-5xl font-black font-mono text-yellow-300">
                {manualComputedFcr.toFixed(2)}
              </p>
              <p className="text-xs text-slate-300">
                {language === 'bn' ? '১ কেজি মাংস বৃদ্ধিতে খাদ্য প্রয়োজন হয়েছে:' : 'Feed consumed per 1 KG live meat gain:'}{' '}
                <strong className="text-white">{manualComputedFcr.toFixed(2)} KG</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ADJUST FEED STOCK MODAL */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package size={20} className="text-amber-600" />
                <h4 className="text-base font-black text-slate-900">
                  {language === 'bn' ? 'ফিড স্টক ও ব্যবহার সমন্বয়' : 'Adjust Feed Stock & Consumed'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {language === 'bn' 
                ? 'আপনার খামারের বাস্তব রেজিস্টার অনুযায়ী মোট কত কেজি খাদ্য আসলো এবং মুরগি কত খেলো তা আপডেট করুন।' 
                : 'Enter total inward feed and actual feed fed to birds.'}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'মোট খাদ্য এসেছে (কেজি):' : 'Total Arrived Feed (KG):'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={modalInwardKg}
                    onChange={(e) => setModalInwardKg(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    ({((Number(modalInwardKg) || 0) / 50).toFixed(1)} {language === 'bn' ? 'বস্তা' : 'bags'})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'মুরগিকে খাওয়ানো হয়েছে (কেজি):' : 'Feed Consumed by Flock (KG):'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={modalConsumedKg}
                    onChange={(e) => setModalConsumedKg(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    ({((Number(modalConsumedKg) || 0) / 50).toFixed(1)} {language === 'bn' ? 'বস্তা' : 'bags'})
                  </span>
                </div>
              </div>

              {/* Preview calculation */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between font-bold text-slate-700">
                <span>{language === 'bn' ? 'স্টকে অবশিষ্ট থাকবে:' : 'Stock Remaining:'}</span>
                <span className="text-emerald-700 font-mono">
                  {Math.max(0, (Number(modalInwardKg) || 0) - (Number(modalConsumedKg) || 0))} KG
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveStockAdjustment}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-sm cursor-pointer"
              >
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
