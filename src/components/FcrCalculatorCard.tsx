import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, offlineSafeDocWrite } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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
  HelpCircle,
  ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BroilerDailySopCard } from './BroilerDailySopCard';
import { 
  calculateStandardFlockCumulativeFeedKg, 
  detectBirdType,
  detectLivestockType
} from '../utils/feedStockCalculations';
import { 
  MilestoneData, 
  getMilestonesForSector, 
  getInitialUnitWeightGram, 
  computeScientificFcr,
  getStandardBenchmarkForAge,
  DEFAULT_BROILER_MILESTONES 
} from '../utils/fcrCalculations';
import FcrBreakdownModal from './FcrBreakdownModal';
import FcrWeightModal from './FcrWeightModal';

export type FarmSectorType = 'poultry' | 'cattle' | 'fish';

export interface FcrCalculatorCardProps {
  selectedBatch?: any;
  totalFeedPurchasedKg?: number;
  totalFeedConsumedKg?: number;
  totalFeedCost?: number;
  currentBirdCount?: number;
  activeBatches?: any[];
  allBatches?: any[];
  onBatchChange?: (batchId: string) => void;
  onNavigateToBatches?: () => void;
  batchRecords?: any[];
}

export default function FcrCalculatorCard({
  selectedBatch,
  totalFeedPurchasedKg = 0,
  totalFeedConsumedKg = 0,
  totalFeedCost = 0,
  currentBirdCount = 0,
  activeBatches = [],
  allBatches = [],
  onBatchChange,
  onNavigateToBatches,
  batchRecords = []
}: FcrCalculatorCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currentUser, isDemoUser } = useAuth();
  const isBn = language === 'bn';

  // Available batches across active and completed lists
  const allAvailableBatches = useMemo(() => {
    if (activeBatches && activeBatches.length > 0) return activeBatches;
    if (allBatches && allBatches.length > 0) return allBatches;
    return [];
  }, [activeBatches, allBatches]);

  const hasAnyBatch = allAvailableBatches.length > 0;

  // Active view tab: 'overview' (the realistic dashboard) or 'quick_calc'
  const [activeTab, setActiveTab] = useState<'overview' | 'quick_calc'>('overview');
  
  // Table view: 'weekly' (day 7, 14, 21, 28, 35) or 'all' (all available milestones)
  const [tableFilter, setTableFilter] = useState<'weekly' | 'all'>('weekly');

  // Livestock category filter for the batch selector
  const [selectedLivestockCategory, setSelectedLivestockCategory] = useState<string>('all');

  // Sector and Breed detection based on current selected batch
  const detectedLivestock = useMemo(() => detectLivestockType(selectedBatch), [selectedBatch]);
  const [birdType, setBirdType] = useState<string>(detectedLivestock.breed);
  const [activeSector, setActiveSector] = useState<FarmSectorType>(detectedLivestock.sector);

  // Sync sector & breed whenever batch changes
  useEffect(() => {
    if (selectedBatch) {
      const detected = detectLivestockType(selectedBatch);
      setActiveSector(detected.sector);
      setBirdType(detected.breed);
    }
  }, [selectedBatch]);

  const batchId = selectedBatch?.id || '';
  const batchName = selectedBatch?.batchName || (isBn ? 'নির্বাচন করা ব্যাচ' : 'Selected Batch');
  const totalChicksHoused = Number(selectedBatch?.totalChicks || currentBirdCount || 0);

  // 1. Calculate Age
  const calculateAge = (dateStr?: string) => {
    if (!dateStr) return 1;
    const start = new Date(dateStr);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = Math.max(0, now.getTime() - start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const ageDays = calculateAge(selectedBatch?.startDate);

  // 2. Real-time Mortality Tracking (defaults strictly to 0, not fake 10!)
  const [mortalityCount, setMortalityCount] = useState<number>(0);

  useEffect(() => {
    if (!batchId) {
      setMortalityCount(0);
      return;
    }

    if (isDemoUser) {
      const records = demoStore.getMortalityRecords(batchId);
      const count = records.reduce((sum, r) => sum + Number(r.count || 0), 0);
      setMortalityCount(count);
      const unsub = demoStore.subscribe(() => {
        const updated = demoStore.getMortalityRecords(batchId);
        const uCount = updated.reduce((sum, r) => sum + Number(r.count || 0), 0);
        setMortalityCount(uCount);
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
      console.warn("FcrCalculatorCard mortality query:", e);
    }
  }, [batchId, currentUser, isDemoUser, selectedBatch?.id]);

  const aliveBirds = Math.max(0, totalChicksHoused - mortalityCount);
  const initialUnitWeightGram = getInitialUnitWeightGram(activeSector, birdType);

  // 3. Feed Stock & Consumption Tracking
  const storageKeyFeedIn = `fcr_stock_in_${batchId}`;
  const storageKeyFeedUsed = `fcr_stock_used_${batchId}`;
  const storageKeyMilestones = `fcr_milestones_data_${batchId}_${activeSector}_${birdType}`;
  const storageKeyWeight = `fcr_current_weight_${batchId}`;

  // Standard cumulative feed calculation for surviving flock
  const standardCumulativeKg = useMemo(() => {
    return calculateStandardFlockCumulativeFeedKg(activeSector, birdType as any, aliveBirds, ageDays);
  }, [activeSector, birdType, aliveBirds, ageDays]);

  // Feed purchased from logs, batch properties or actual calculations (no fake 750 defaults)
  const defaultFeedPurchasedKg = useMemo(() => {
    if (batchRecords && batchRecords.length > 0) {
      const sum = batchRecords.reduce((acc, r) => acc + (Number(r.quantityBags || 0) * 50) + (Number(r.quantityKg || 0)), 0);
      if (sum > 0) return sum;
    }
    if (selectedBatch?.feedStockInKg !== undefined && Number(selectedBatch.feedStockInKg) > 0) {
      return Number(selectedBatch.feedStockInKg);
    }
    if (totalFeedPurchasedKg && totalFeedPurchasedKg > 0) return totalFeedPurchasedKg;
    return 0;
  }, [batchRecords, selectedBatch?.feedStockInKg, totalFeedPurchasedKg]);

  const defaultFeedUsedKg = useMemo(() => {
    if (selectedBatch?.feedStockUsedKg !== undefined && Number(selectedBatch.feedStockUsedKg) > 0) {
      return Number(selectedBatch.feedStockUsedKg);
    }
    if (totalFeedConsumedKg && totalFeedConsumedKg > 0) {
      return totalFeedConsumedKg;
    }
    return defaultFeedPurchasedKg > 0 ? defaultFeedPurchasedKg : 0;
  }, [selectedBatch?.feedStockUsedKg, totalFeedConsumedKg, defaultFeedPurchasedKg]);

  const [totalFeedInwardKg, setTotalFeedInwardKg] = useState<number>(() => {
    const saved = localStorage.getItem(storageKeyFeedIn);
    return saved ? Number(saved) : defaultFeedPurchasedKg;
  });

  const [feedConsumedKg, setFeedConsumedKg] = useState<number>(() => {
    const saved = localStorage.getItem(storageKeyFeedUsed);
    if (saved) {
      return Number(saved);
    }
    return defaultFeedUsedKg;
  });

  // Sync state whenever selectedBatch or props update
  useEffect(() => {
    const bId = selectedBatch?.id || batchId;
    const keyIn = `fcr_stock_in_${bId}`;
    const keyUsed = `fcr_stock_used_${bId}`;

    if (selectedBatch?.feedStockInKg !== undefined && selectedBatch?.feedStockUsedKg !== undefined) {
      const inVal = Number(selectedBatch.feedStockInKg);
      const usedVal = Number(selectedBatch.feedStockUsedKg);
      setTotalFeedInwardKg(inVal);
      setFeedConsumedKg(usedVal);
      localStorage.setItem(keyIn, String(inVal));
      localStorage.setItem(keyUsed, String(usedVal));
      return;
    }

    const savedIn = localStorage.getItem(keyIn);
    const savedUsed = localStorage.getItem(keyUsed);

    if (savedIn !== null) {
      setTotalFeedInwardKg(Number(savedIn));
    } else {
      setTotalFeedInwardKg(defaultFeedPurchasedKg);
    }

    if (savedUsed !== null) {
      setFeedConsumedKg(Number(savedUsed));
    } else {
      setFeedConsumedKg(defaultFeedUsedKg);
    }
  }, [batchId, selectedBatch?.id, selectedBatch?.feedStockInKg, selectedBatch?.feedStockUsedKg, defaultFeedPurchasedKg, defaultFeedUsedKg]);

  // 4. Milestone Growth Benchmarks
  const baseMilestones = useMemo(() => {
    return getMilestonesForSector(activeSector, birdType);
  }, [activeSector, birdType]);

  const [milestones, setMilestones] = useState<MilestoneData[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyMilestones);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Milestone parse error:", e);
    }
    return baseMilestones;
  });

  // Re-initialize milestones when sector or breed changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKeyMilestones);
      if (saved) {
        setMilestones(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.warn("Milestone sync error:", e);
    }
    setMilestones(baseMilestones);
  }, [storageKeyMilestones, baseMilestones]);

  // Dynamic standard benchmark for current age and sector
  const stdBenchmark = useMemo(() => {
    return getStandardBenchmarkForAge(activeSector, birdType, ageDays);
  }, [activeSector, birdType, ageDays]);

  // Current milestone based on age
  const currentMilestone = useMemo(() => {
    const exact = milestones.find(m => m.day === ageDays);
    if (exact) return exact;
    const previous = [...milestones].filter(m => m.day <= ageDays).pop();
    if (previous) return previous;
    return milestones[0] || baseMilestones[0];
  }, [milestones, ageDays, baseMilestones]);

  // Current Average Body Weight (editable and persistent per batch)
  const [currentActualWeight, setCurrentActualWeight] = useState<number>(() => {
    const savedW = localStorage.getItem(storageKeyWeight);
    if (savedW && Number(savedW) > 0) return Number(savedW);
    return currentMilestone?.actWeightGram || currentMilestone?.stdWeightGram || stdBenchmark.stdWeightGram;
  });

  // Keep currentActualWeight in sync when batch or milestone changes
  useEffect(() => {
    if (batchId) {
      const savedW = localStorage.getItem(`fcr_current_weight_${batchId}`);
      if (savedW && Number(savedW) > 0) {
        setCurrentActualWeight(Number(savedW));
        return;
      }
      const latestWJson = localStorage.getItem(`latest_weight_${batchId}`);
      if (latestWJson) {
        try {
          const parsed = JSON.parse(latestWJson);
          if (parsed.avgWeightGram && Number(parsed.avgWeightGram) > 0) {
            setCurrentActualWeight(Number(parsed.avgWeightGram));
            return;
          }
        } catch (e) {}
      }
    }
    if (currentMilestone?.actWeightGram && currentMilestone.actWeightGram > 0) {
      setCurrentActualWeight(currentMilestone.actWeightGram);
      return;
    }
    setCurrentActualWeight(currentMilestone?.stdWeightGram || stdBenchmark.stdWeightGram);
  }, [batchId, currentMilestone?.actWeightGram, currentMilestone?.stdWeightGram, stdBenchmark.stdWeightGram]);

  // Full Scientific FCR metrics
  const scientificMetrics = useMemo(() => {
    return computeScientificFcr({
      sector: activeSector,
      birdType,
      totalHoused: totalChicksHoused,
      mortalityCount,
      currentWeightGram: currentActualWeight,
      feedConsumedKg,
      ageDays
    });
  }, [activeSector, birdType, totalChicksHoused, mortalityCount, currentActualWeight, feedConsumedKg, ageDays]);

  // FCR Calculation Mode: 'commercial' (Gross Live Weight = Feed / Live Weight) vs 'net' (Net Gain = Feed / (Live Weight - Initial Chick Weight))
  const [fcrMode, setFcrMode] = useState<'commercial' | 'net'>(() => {
    return (localStorage.getItem('fcr_calculation_mode') as 'commercial' | 'net') || 'commercial';
  });

  const handleToggleFcrMode = (mode: 'commercial' | 'net') => {
    setFcrMode(mode);
    localStorage.setItem('fcr_calculation_mode', mode);
  };

  const currentStdWeight = currentMilestone?.stdWeightGram || stdBenchmark.stdWeightGram;
  const currentStdFcr = currentMilestone?.stdFcr || stdBenchmark.stdFcr;
  
  // Selected actual FCR based on chosen mode
  const currentActualFcr = fcrMode === 'commercial' 
    ? (scientificMetrics.commercialGrossFcr > 0 ? scientificMetrics.commercialGrossFcr : scientificMetrics.actualNetFcr)
    : scientificMetrics.actualNetFcr;

  // FCR differences against standard benchmark
  const fcrDiff = Number((currentActualFcr - currentStdFcr).toFixed(2));
  const isFcrGood = fcrDiff <= 0.04;
  const fcrDiffSign = fcrDiff > 0 ? `+${fcrDiff}` : `${fcrDiff}`;
  const fcrStatusText = fcrDiff <= 0 
    ? (isBn ? 'চমৎকার পারফরম্যান্স' : 'Excellent Performance') 
    : fcrDiff <= 0.08 
    ? (isBn ? 'স্বাভাবিক পারফরম্যান্স' : 'Normal Performance')
    : (isBn ? 'সতর্কতা: বেশি FCR' : 'Warning: High FCR');

  // Stock remaining & calculations
  const remainingStockKg = Math.max(0, Number((totalFeedInwardKg - feedConsumedKg).toFixed(1)));
  const remainingStockPercent = totalFeedInwardKg > 0 ? Math.max(0, Math.min(100, Math.round((remainingStockKg / totalFeedInwardKg) * 100))) : 0;
  const consumedStockPercent = totalFeedInwardKg > 0 ? Math.max(0, Math.min(100, Math.round((feedConsumedKg / totalFeedInwardKg) * 100))) : 0;

  // Cost & Profit Estimation
  const calculatedFeedCost = totalFeedCost > 0 ? totalFeedCost : Math.round(feedConsumedKg * 68);
  const livePricePerKg = activeSector === 'cattle' ? 550 : activeSector === 'fish' ? 220 : 165;
  const estimatedRevenue = Math.round(scientificMetrics.totalLiveWeightKg * livePricePerKg);
  const estimatedChickCost = totalChicksHoused * (activeSector === 'cattle' ? 25000 : activeSector === 'fish' ? 4 : 45);
  const estimatedNetProfit = Math.round(estimatedRevenue - calculatedFeedCost - estimatedChickCost);

  // Dynamic Row Calculation Helper
  const calculateRowActualFcr = (rowFeedKg: number, rowWeightGram: number) => {
    if (rowFeedKg <= 0 || rowWeightGram <= 0 || aliveBirds <= 0) return undefined;
    if (fcrMode === 'net') {
      const netGainGram = Math.max(10, rowWeightGram - initialUnitWeightGram);
      const totalFlockNetMeatKg = (aliveBirds * netGainGram) / 1000;
      if (totalFlockNetMeatKg <= 0) return undefined;
      return Number((rowFeedKg / totalFlockNetMeatKg).toFixed(2));
    } else {
      const totalFlockLiveKg = (aliveBirds * rowWeightGram) / 1000;
      if (totalFlockLiveKg <= 0) return undefined;
      return Number((rowFeedKg / totalFlockLiveKg).toFixed(2));
    }
  };

  // Update Milestone Actual Weight & Feed
  const updateMilestoneData = (day: number, newWeightStr?: string, newFeedStr?: string) => {
    setMilestones(prev => {
      const updated = prev.map(m => {
        if (m.day === day) {
          const wNum = newWeightStr !== undefined ? parseFloat(newWeightStr) : m.actWeightGram;
          const fNum = newFeedStr !== undefined ? parseFloat(newFeedStr) : m.actCumFeedKg;

          const actWeight = !isNaN(wNum as number) && (wNum as number) > 0 ? (wNum as number) : undefined;
          const actFeed = !isNaN(fNum as number) && (fNum as number) > 0 ? (fNum as number) : undefined;

          // Compute standard flock feed for row if actFeed is not specified
          const rowFeedToUse = actFeed !== undefined 
            ? actFeed 
            : (day === ageDays ? feedConsumedKg : (m.stdCumFeedPer1000Kg * aliveBirds) / 1000);

          const rowWeightToUse = actWeight !== undefined ? actWeight : m.stdWeightGram;

          const calculatedFcr = calculateRowActualFcr(rowFeedToUse, rowWeightToUse);

          return {
            ...m,
            actWeightGram: actWeight,
            actCumFeedKg: actFeed,
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

    // If updating today's milestone, also update current weight state
    if (day === ageDays && newWeightStr) {
      const parsedW = parseFloat(newWeightStr);
      if (parsedW > 0) {
        setCurrentActualWeight(parsedW);
        localStorage.setItem(storageKeyWeight, String(parsedW));
      }
    }
  };

  // Save new average weight directly
  const handleSaveWeightDirect = (newWeight: number) => {
    setCurrentActualWeight(newWeight);
    localStorage.setItem(storageKeyWeight, String(newWeight));
    updateMilestoneData(currentMilestone.day, String(newWeight));
    toast.success(isBn ? `গড় ওজন ${newWeight} গ্রাম হিসেবে সেভ হয়েছে` : `Weight saved: ${newWeight}g`);
  };

  // Modals state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showFcrBreakdownModal, setShowFcrBreakdownModal] = useState(false);
  const [showSopModal, setShowSopModal] = useState(false);
  const [modalInwardKg, setModalInwardKg] = useState<string>(String(totalFeedInwardKg));
  const [modalConsumedKg, setModalConsumedKg] = useState<string>(String(feedConsumedKg));

  // Save stock adjustments
  const handleSaveStockAdjustment = async () => {
    const inVal = Number(modalInwardKg) || 0;
    const usedVal = Number(modalConsumedKg) || 0;
    const remKg = Math.max(0, Number((inVal - usedVal).toFixed(1)));
    const nowIso = new Date().toISOString();

    setTotalFeedInwardKg(inVal);
    setFeedConsumedKg(usedVal);

    localStorage.setItem(storageKeyFeedIn, String(inVal));
    localStorage.setItem(storageKeyFeedUsed, String(usedVal));

    if (batchId && batchId !== 'default_batch') {
      localStorage.setItem('fcr_stock_in_default_batch', String(inVal));
      localStorage.setItem('fcr_stock_used_default_batch', String(usedVal));
    }

    try {
      if (currentUser && !isDemoUser && batchId && batchId !== 'default_batch') {
        await offlineSafeDocWrite(updateDoc(doc(db, 'batches', batchId), {
          feedStockInKg: inVal,
          feedStockUsedKg: usedVal,
          feedStockRemainingKg: remKg,
          feedStockUpdatedAt: nowIso,
          updatedAt: nowIso
        }));
      } else if (isDemoUser && batchId) {
        demoStore.saveBatch({
          id: batchId,
          feedStockInKg: inVal,
          feedStockUsedKg: usedVal,
          feedStockRemainingKg: remKg,
          feedStockUpdatedAt: nowIso,
          updatedAt: nowIso
        } as any);
      }
    } catch (err) {
      console.warn("Could not save feed stock adjustment to database:", err);
    }

    window.dispatchEvent(new CustomEvent('feed_stock_updated', {
      detail: { batchId, inKg: inVal, usedKg: usedVal, remainingKg: remKg }
    }));

    setShowAdjustModal(false);
    toast.success(isBn ? 'ফিড স্টক তথ্য সফলভাবে আপডেট হয়েছে' : 'Feed stock updated successfully');
  };

  const handleApplyAutoScientificFeed = async () => {
    const inVal = totalFeedInwardKg > 0 ? totalFeedInwardKg : defaultFeedPurchasedKg;
    const usedVal = standardCumulativeKg;
    const remKg = Math.max(0, Number((inVal - usedVal).toFixed(1)));
    const nowIso = new Date().toISOString();

    setTotalFeedInwardKg(inVal);
    setFeedConsumedKg(usedVal);

    localStorage.setItem(storageKeyFeedIn, String(inVal));
    localStorage.setItem(storageKeyFeedUsed, String(usedVal));

    if (batchId && batchId !== 'default_batch') {
      localStorage.setItem('fcr_stock_in_default_batch', String(inVal));
      localStorage.setItem('fcr_stock_used_default_batch', String(usedVal));
    }

    try {
      if (currentUser && !isDemoUser && batchId && batchId !== 'default_batch') {
        await offlineSafeDocWrite(updateDoc(doc(db, 'batches', batchId), {
          feedStockInKg: inVal,
          feedStockUsedKg: usedVal,
          feedStockRemainingKg: remKg,
          feedStockUpdatedAt: nowIso,
          updatedAt: nowIso
        }));
      } else if (isDemoUser && batchId) {
        demoStore.saveBatch({
          id: batchId,
          feedStockInKg: inVal,
          feedStockUsedKg: usedVal,
          feedStockRemainingKg: remKg,
          feedStockUpdatedAt: nowIso,
          updatedAt: nowIso
        } as any);
      }
    } catch (err) {
      console.warn("Could not save auto feed stock adjustment:", err);
    }

    window.dispatchEvent(new CustomEvent('feed_stock_updated', {
      detail: { batchId, inKg: inVal, usedKg: usedVal, remainingKg: remKg }
    }));

    toast.success(
      isBn
        ? `বয়স (${ageDays} দিন) ও ${aliveBirds}টি বাচ্চার জন্য স্ট্যান্ডার্ড খরচ ${usedVal} কেজি এবং অবশিষ্ট ${remKg} কেজি (${(remKg / 50).toFixed(1)} বস্তা) সেট হয়েছে!`
        : `Auto applied: ${usedVal} kg consumed & ${remKg} kg remaining!`
    );
  };

  // Reset to default benchmark
  const handleResetData = () => {
    if (window.confirm(isBn ? 'আপনি কি সব FCR ও স্টক ডেটা রিসেট করতে চান?' : 'Do you want to reset FCR data?')) {
      localStorage.removeItem(storageKeyMilestones);
      localStorage.removeItem(storageKeyFeedIn);
      localStorage.removeItem(storageKeyFeedUsed);
      localStorage.removeItem(storageKeyWeight);
      setMilestones(baseMilestones);
      setTotalFeedInwardKg(defaultFeedPurchasedKg);
      setFeedConsumedKg(defaultFeedUsedKg);
      setCurrentActualWeight(currentMilestone?.stdWeightGram || 483);
      toast.success(isBn ? 'সফলভাবে রিসেট সম্পন্ন হয়েছে' : 'Reset to default benchmarks');
    }
  };

  // Filtered rows for table view
  const displayedMilestones = useMemo(() => {
    if (tableFilter === 'weekly') {
      if (activeSector === 'cattle' || activeSector === 'fish') {
        return milestones;
      }
      return milestones.filter(m => [7, 14, 21, 28, 35, 42].includes(m.day));
    }
    return milestones;
  }, [milestones, tableFilter, activeSector]);

  // Quick interactive manual calculator state
  const [calcSector, setCalcSector] = useState<FarmSectorType>('poultry');
  const [calcBreed, setCalcBreed] = useState<string>('broiler');
  const [calcAgeDays, setCalcAgeDays] = useState<string>('32');
  const [calcFeedKg, setCalcFeedKg] = useState<string>('2500');
  const [calcFeedBags, setCalcFeedBags] = useState<string>('50');
  const [calcFeedUnit, setCalcFeedUnit] = useState<'kg' | 'bags'>('bags');
  const [calcBirdsHoused, setCalcBirdsHoused] = useState<string>(String(totalChicksHoused > 0 ? totalChicksHoused : 900));
  const [calcMortality, setCalcMortality] = useState<string>(String(mortalityCount > 0 ? mortalityCount : 15));
  const [calcAvgWeight, setCalcAvgWeight] = useState<string>('1600');
  const [calcInitialWeight, setCalcInitialWeight] = useState<string>(String(initialUnitWeightGram));

  const handleCalcBreedChange = (newBreed: string) => {
    setCalcBreed(newBreed);
    if (newBreed === 'cattle') setCalcSector('cattle');
    else if (newBreed === 'fish') setCalcSector('fish');
    else setCalcSector('poultry');
    const initW = getInitialUnitWeightGram(
      newBreed === 'cattle' ? 'cattle' : newBreed === 'fish' ? 'fish' : 'poultry', 
      newBreed
    );
    setCalcInitialWeight(String(initW));
  };

  const manualCalcResult = useMemo(() => {
    const fKg = calcFeedUnit === 'bags' 
      ? (parseFloat(calcFeedBags) || 0) * 50 
      : (parseFloat(calcFeedKg) || 0);
    const housed = parseFloat(calcBirdsHoused) || 0;
    const mort = parseFloat(calcMortality) || 0;
    const alive = Math.max(0, housed - mort);
    const wGram = parseFloat(calcAvgWeight) || 0;
    const initW = parseFloat(calcInitialWeight) || getInitialUnitWeightGram(calcSector, calcBreed);
    const age = Math.max(1, parseFloat(calcAgeDays) || 30);

    if (fKg > 0 && alive > 0 && wGram > initW) {
      const netGainKg = Math.max(0.001, (wGram - initW) / 1000);
      const totalNetMeatFlockKg = alive * netGainKg;
      const totalLiveFlockKg = (alive * wGram) / 1000;

      const netFcr = Number((fKg / totalNetMeatFlockKg).toFixed(2));
      const grossFcr = Number((fKg / totalLiveFlockKg).toFixed(2));

      // Benchmark comparison
      const benchmark = getStandardBenchmarkForAge(calcSector, calcBreed, age);
      const stdFcr = benchmark.stdFcr;
      const diffFcr = Number((grossFcr - stdFcr).toFixed(2));

      // European Production Efficiency Factor (EPEF)
      const livabilityPercent = housed > 0 ? (alive / housed) * 100 : 98;
      const avgWeightKg = wGram / 1000;
      const epef = grossFcr > 0 && age > 0
        ? Math.round(((livabilityPercent * avgWeightKg) / (age * grossFcr)) * 100)
        : 0;

      return {
        feedKg: fKg,
        aliveBirds: alive,
        totalNetMeatKg: Number(totalNetMeatFlockKg.toFixed(2)),
        totalLiveKg: Number(totalLiveFlockKg.toFixed(2)),
        netFcr,
        grossFcr,
        stdFcr,
        diffFcr,
        epef,
        livabilityPercent: Number(livabilityPercent.toFixed(1))
      };
    }
    return null;
  }, [calcFeedKg, calcFeedBags, calcFeedUnit, calcBirdsHoused, calcMortality, calcAvgWeight, calcInitialWeight, calcAgeDays, calcSector, calcBreed]);

  // Filtered batch list based on category filter
  const filteredBatches = useMemo(() => {
    if (!allAvailableBatches || allAvailableBatches.length === 0) return [];
    if (selectedLivestockCategory === 'all') return allAvailableBatches;
    return allAvailableBatches.filter((b: any) => {
      const info = detectLivestockType(b);
      if (selectedLivestockCategory === 'broiler') return info.breed === 'broiler';
      if (selectedLivestockCategory === 'sonali') return info.breed === 'sonali';
      if (selectedLivestockCategory === 'layer') return info.breed === 'layer';
      if (selectedLivestockCategory === 'cattle') return info.sector === 'cattle';
      if (selectedLivestockCategory === 'fish') return info.sector === 'fish';
      return true;
    });
  }, [allAvailableBatches, selectedLivestockCategory]);

  // Donut chart SVG geometry
  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const strokeRemaining = (remainingStockPercent / 100) * donutCircumference;
  const strokeConsumed = (consumedStockPercent / 100) * donutCircumference;

  // NO BATCH GUARD SCREEN: When user has no batch, show helpful notice and standalone calculator
  if (!hasAnyBatch && activeTab !== 'quick_calc') {
    return (
      <div className="space-y-4">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-5 rounded-3xl shadow-sm border border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Activity size={26} />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[11px] font-black tracking-wide uppercase">
                {isBn ? 'খামার খাতা' : 'Khamar Khata'}
              </span>
              <h3 className="text-base font-black text-white mt-0.5">
                {isBn ? 'এফসিআর (FCR) পারফরম্যান্স ও খাদ্য রূপান্তর অনুপাত' : 'FCR Feed Conversion Ratio'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('quick_calc')}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Calculator size={15} />
            <span>{isBn ? '🧮 কুইক সার্বজনীন ক্যালকুলেটর' : 'Universal FCR Calculator'}</span>
          </button>
        </div>

        {/* Empty State Banner */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle size={32} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              {isBn ? 'কোনো সক্রিয় ব্যাচ পাওয়া যায়নি' : 'No Active Batch Found'}
            </h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {isBn
                ? 'সঠিক FCR নির্ণয়ের জন্য নির্দিষ্ট ব্যাচের বয়স, পশু-পাখির সংখ্যা, বাস্তব মৃত্যুহার, এবং প্রকৃত খাদ্য গ্রহণের হিসাব প্রয়োজন। আপনার অ্যাকাউন্টে বর্তমানে কোনো ব্যাচ নেই।'
                : 'Accurate FCR requires a specific batch age, stock count, mortality, and feed consumption records. No batch is currently active in your account.'}
            </p>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{isBn ? 'ব্যাচভিত্তিক সক্রিয় FCR কীভাবে কাজ করে?' : 'How Batch-Based FCR Works?'}</span>
            </div>
            <ul className="text-xs text-emerald-800/90 space-y-1.5 pl-6 list-disc font-medium">
              <li>{isBn ? 'ব্রয়লার, সোনালী, লেয়ার, গরু বা মাছের জন্য ভিন্ন ভিন্ন বৈজ্ঞানিক স্ট্যান্ডার্ড প্রয়োগ করা হয়।' : 'Applies breed-specific benchmarks for Broiler, Sonali, Layer, Cattle, or Fish.'}</li>
              <li>{isBn ? 'বাস্তব মৃত্যু সংখ্যা বাদ দিয়ে কেবল জীবিত প্রাণীর খাদ্য রূপান্তর ও লাভজনকতা মাপা হয়।' : 'Accounts for true mortality count to calculate net living biomass.'}</li>
              <li>{isBn ? 'খাদ্যের স্টক, বয়স অনুযায়ী সম্ভাব্য খরচ এবং নিট ও গ্রস FCR স্বয়ংক্রিয়ভাবে আপডেট হয়।' : 'Feed stock, age milestones, and net/gross FCR automatically update in real time.'}</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (onNavigateToBatches) onNavigateToBatches();
                else navigate('/batches');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Plus size={18} />
              <span>{isBn ? 'নতুন ব্যাচ তৈরি করুন' : 'Create New Batch'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quick_calc')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Calculator size={18} className="text-amber-600" />
              <span>{isBn ? 'সরাসরি ক্যালকুলেটরে হিসাব করুন' : 'Open Standalone Calculator'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* TOP HEADER: Multi-Sector Farm Management & Accurate Automation */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-sm border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
              <Activity size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[11px] font-black tracking-wide uppercase">
                  {isBn ? 'খামার খাতা' : 'Khamar Khata'}
                </span>
                <span className="text-xs text-emerald-300 font-bold">
                  {activeSector === 'cattle' 
                    ? (isBn ? 'গরু ও পশু মোটাতাজাকরণ FCR সিস্টেম' : 'Cattle Fattening FCR System')
                    : activeSector === 'fish'
                    ? (isBn ? 'মৎস্য খামার নির্ভুল FCR ব্যবস্থাপনা' : 'Fish Farm Scientific FCR System')
                    : (isBn ? 'পোল্ট্রি ও ব্রয়লার নিখুঁত FCR অটোমেশন' : 'Poultry & Broiler Precision FCR')}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-950/80 border border-emerald-700/60 rounded-full text-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {isBn ? 'সক্রিয় ব্যাচ ক্যালকুলেশন' : 'Live Batch Calculation'}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-slate-200 font-semibold flex-wrap">
                <span>{isBn ? 'ব্যাচ:' : 'Batch:'} <strong className="text-white">{batchName}</strong></span>
                <span className="text-emerald-400/60">•</span>
                <span>{isBn ? 'বয়স:' : 'Age:'} <strong className="text-amber-300">{ageDays} {isBn ? 'দিন' : 'Days'}</strong></span>
                <span className="text-emerald-400/60">•</span>
                <span>{isBn ? 'ধরন:' : 'Type:'} <strong className="text-emerald-200 capitalize">{birdType} ({activeSector})</strong></span>
                <span className="text-emerald-400/60">•</span>
                <span>{isBn ? 'জীবিত:' : 'Alive:'} <strong className="text-emerald-300">{aliveBirds} {isBn ? 'টি' : ''}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleResetData}
              className="px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isBn ? 'নমুনা মান রিলোড করুন' : 'Reload sample benchmark'}
            >
              <RotateCcw size={13} />
              <span>{isBn ? 'রিসেট' : 'Reset'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVESTOCK TYPE & BATCH SELECTOR (পশু-পাখির ধরণ অনুযায়ী ব্যাচ বাছাই ও সক্রিয় এফসিআর) */}
      {allAvailableBatches.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold">
                {detectedLivestock.icon}
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {isBn ? 'পশু-পাখির ধরণ ও ব্যাচ নির্বাচন' : 'Livestock Type & Batch Selection'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isBn 
                    ? 'যে ব্যাচ সিলেক্ট করবেন সেই ব্যাচের বয়স, খাদ্য ও জীবিত সংখ্যার ওপর সক্রিয় FCR নির্ণয় হবে' 
                    : 'Active FCR is calculated on the selected batch based on its age, feed, and alive population'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigateToBatches) onNavigateToBatches();
                else navigate('/batches');
              }}
              className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>{isBn ? 'নতুন ব্যাচ (+)' : 'New Batch'}</span>
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: isBn ? `সকল ব্যাচ (${allAvailableBatches.length})` : `All (${allAvailableBatches.length})`, icon: '📋' },
              { id: 'broiler', label: isBn ? 'ব্রয়লার' : 'Broiler', icon: '🐔' },
              { id: 'sonali', label: isBn ? 'সোনালী' : 'Sonali', icon: '🐥' },
              { id: 'layer', label: isBn ? 'লেয়ার' : 'Layer', icon: '🥚' },
              { id: 'cattle', label: isBn ? 'গরু ও পশু' : 'Cattle/Goat', icon: '🐄' },
              { id: 'fish', label: isBn ? 'মাছ' : 'Fish', icon: '🐟' },
            ].map(cat => {
              const isActive = selectedLivestockCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedLivestockCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Batch Dropdown & Breed Fine-Tuning */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isBn ? '🎯 সক্রিয় ব্যাচ নির্বাচন করুন:' : '🎯 Select Target Batch:'}
              </label>
              <select
                value={selectedBatch?.id || ''}
                onChange={(e) => {
                  const bId = e.target.value;
                  if (onBatchChange) onBatchChange(bId);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none cursor-pointer"
              >
                {filteredBatches.map((b: any) => {
                  const info = detectLivestockType(b);
                  const bAge = calculateAge(b.startDate);
                  return (
                    <option key={b.id} value={b.id}>
                      {info.icon} {b.batchName} — {info.labelBn} ({bAge} দিন | {b.totalChicks || 0} টি)
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isBn ? '🧬 এফসিআর গ্রোথ স্ট্যান্ডার্ড (Standard Benchmark):' : '🧬 FCR Growth Standard Benchmark:'}
              </label>
              <select
                value={birdType}
                onChange={(e) => {
                  const val = e.target.value;
                  setBirdType(val);
                  if (val === 'cattle') setActiveSector('cattle');
                  else if (val === 'fish') setActiveSector('fish');
                  else setActiveSector('poultry');
                  toast.success(isBn ? `স্ট্যান্ডার্ড চার্ট: ${val} নির্বাচন করা হয়েছে` : `Standard chart set to ${val}`);
                }}
                className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none cursor-pointer"
              >
                <option value="broiler">🐔 ব্রয়লার (Cobb 500 / Ross 308 Standard)</option>
                <option value="sonali">🐥 সোনালী মুরগি (Sonali Standard)</option>
                <option value="layer">🥚 লেয়ার গ্রোয়ার (Layer Grower)</option>
                <option value="deshi">🦆 দেশি মুরগি / হাঁস / কোয়েল</option>
                <option value="cattle">🐄 গরু মোটাতাজাকরণ (Cattle Fattening)</option>
                <option value="fish">🐟 মাছ চাষ (Aquaculture Scientific FCR)</option>
              </select>
            </div>
          </div>
        </div>
      )}

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
            <span>{isBn ? '📊 বাস্তব চিত্র ও FCR স্টক' : 'Flock Performance & Stock'}</span>
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
            <span>{isBn ? '🧮 কুইক FCR ক্যালকুলেটর' : 'Quick FCR Tool'}</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
          <span>{activeSector === 'cattle' ? '🐄' : activeSector === 'fish' ? '🐟' : '🐔'}</span>
          <span className="capitalize">{birdType} স্ট্যান্ডার্ড বেঞ্চমার্ক</span>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-4">
          
          {/* CARD 1: ফিড স্টক অবস্থা (কেজি) — DONUT CHART & 3 STATS */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {isBn ? 'ফিড স্টক অবস্থা (কেজি)' : 'Feed Stock Status (KG)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {isBn ? 'খামারে আসা, পশু/পাখির খাওয়া ও অবশিষ্ট খাদ্য' : 'Inward stock, consumed feed and balance'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={handleApplyAutoScientificFeed}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title={isBn ? `বয়স (${ageDays} দিন) ও ${aliveBirds}টি জীবিত পাখি অনুযায়ী অটো স্ট্যান্ডার্ড হিসাব` : `Auto standard calculation for ${ageDays} days`}
                >
                  <Sparkles size={13} className="text-emerald-600 animate-pulse" />
                  <span>{isBn ? `অটো হিসাব (${standardCumulativeKg} কেজি)` : `Auto Std (${standardCumulativeKg}kg)`}</span>
                </button>

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
                  <span>{isBn ? 'সমন্বয় করুন' : 'Adjust Stock'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Donut Chart Visual */}
              <div className="md:col-span-4 flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      className="text-slate-100"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                    />
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
                  
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {remainingStockPercent}%
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {isBn ? 'অবশিষ্ট' : 'Remaining'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    {isBn ? 'স্টক' : 'Stock'} ({remainingStockPercent}%)
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    {isBn ? 'ব্যবহৃত' : 'Used'} ({consumedStockPercent}%)
                  </span>
                </div>
              </div>

              {/* 3 Metric Columns */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. মোট এসেছে */}
                <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl text-center flex flex-col justify-center">
                  <span className="text-xs font-extrabold text-slate-600 block">
                    {isBn ? 'মোট এসেছে' : 'Total Arrived'}
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
                    {totalFeedInwardKg}
                  </p>
                  <span className="text-xs font-bold text-slate-500 mt-0.5">
                    {isBn ? 'কেজি' : 'KG'} ({(totalFeedInwardKg / 50).toFixed(1)} {isBn ? 'বস্তা' : 'bags'})
                  </span>
                </div>

                {/* 2. ব্যবহৃত */}
                <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl text-center flex flex-col justify-center">
                  <span className="text-xs font-extrabold text-amber-800 block">
                    {isBn ? 'ব্যবহৃত' : 'Consumed'}
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-amber-900 font-mono mt-1">
                    {feedConsumedKg}
                  </p>
                  <span className="text-xs font-bold text-amber-700 mt-0.5">
                    {isBn ? 'কেজি' : 'KG'} ({(feedConsumedKg / 50).toFixed(1)} {isBn ? 'বস্তা' : 'bags'})
                  </span>
                </div>

                {/* 3. স্টকে অবশিষ্ট */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl text-center flex flex-col justify-center">
                  <span className="text-xs font-extrabold text-emerald-800 block">
                    {isBn ? 'স্টকে অবশিষ্ট' : 'Stock Left'}
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono mt-1">
                    {remainingStockKg}
                  </p>
                  <span className="text-xs font-bold text-emerald-700 mt-0.5">
                    {isBn ? 'কেজি' : 'KG'} ({(remainingStockKg / 50).toFixed(1)} {isBn ? 'বস্তা' : 'bags'})
                  </span>
                </div>
              </div>
            </div>

            {/* STATUS BANNER */}
            <div className="mt-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5 text-amber-950">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                i
              </div>
              <div className="text-xs sm:text-[13px] leading-relaxed">
                <span className="font-black text-amber-900">
                  {isBn ? `বয়স ${ageDays} দিন — বর্তমান অবস্থা:` : `Age ${ageDays} Days — Current Status:`}
                </span>
                <span className="hidden sm:inline mx-1.5">•</span>
                <span className="block sm:inline font-semibold">
                  {isBn 
                    ? `জীবিত ${aliveBirds} টি (মৃত্যু ${mortalityCount} টি, ${scientificMetrics.mortalityRatePct}%) • আজকের গড় ওজন ${currentActualWeight} গ্রাম (Std ${currentStdWeight}) • বাণিজ্যিক FCR ${scientificMetrics.commercialGrossFcr.toFixed(2)} (Std ${currentStdFcr.toFixed(2)}) • নিট FCR ${scientificMetrics.actualNetFcr.toFixed(2)} • স্টকে ফিড অবশিষ্ট ${remainingStockKg} কেজি।`
                    : `Alive ${aliveBirds} (Mortality ${mortalityCount}, ${scientificMetrics.mortalityRatePct}%) • Avg Weight ${currentActualWeight}g (Std ${currentStdWeight}g) • Commercial FCR ${scientificMetrics.commercialGrossFcr.toFixed(2)} (Std ${currentStdFcr.toFixed(2)}) • Net FCR ${scientificMetrics.actualNetFcr.toFixed(2)} • Feed left ${remainingStockKg} KG.`}
                </span>
              </div>
            </div>
          </div>

          {/* DUAL FCR MODE TOGGLE BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-700">
                {isBn ? 'FCR হিসাব পদ্ধতি:' : 'FCR Calculation Mode:'}
              </span>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => handleToggleFcrMode('commercial')}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    fcrMode === 'commercial' 
                      ? 'bg-amber-500 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={isBn ? 'মোট খাদ্য ÷ মোট লাইভ ওজন (ডিলার ও ফিড চার্ট মান)' : 'Feed / Live Weight'}
                >
                  {isBn ? '১. বাণিজ্যিক গ্রস FCR' : '1. Commercial Gross FCR'}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleFcrMode('net')}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    fcrMode === 'net' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={isBn ? 'মোট খাদ্য ÷ (লাইভ ওজন - বাচ্চার ওজন)' : 'Feed / Net Gain'}
                >
                  {isBn ? '২. বৈজ্ঞানিক নিট FCR' : '2. Scientific Net FCR'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              {birdType === 'broiler' && (
                <button
                  type="button"
                  onClick={() => setShowSopModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                  title={isBn ? 'ব্রয়লার দৈনিক কাজের শিডিউল, ক্রপ ফিল ও ফিডার স্লট গাইড' : 'Daily Broiler SOP Schedule Guide'}
                >
                  <ClipboardList size={14} className="text-emerald-600" />
                  <span>{isBn ? '📋 দৈনিক এসওপি চার্ট' : '📋 Daily SOP Guide'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowFcrBreakdownModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
              >
                <Info size={14} className="text-indigo-600" />
                <span>{isBn ? 'গাণিতিক সূত্র ও ধাপসমূহ দেখুন' : 'Verify Mathematical Steps'}</span>
              </button>
            </div>
          </div>

          {/* CARD 2: FLOCK VITAL PERFORMANCE METRICS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. মোট বাচ্চা */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                {isBn ? 'মোট সংখ্যা (HOUSED)' : 'TOTAL HOUSED'}
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
                {totalChicksHoused}
              </p>
              <span className="text-[11px] font-bold text-slate-500 capitalize">
                {birdType}
              </span>
            </div>

            {/* 2. বর্তমান জীবিত সংখ্যা */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                {isBn ? 'বর্তমান জীবিত' : 'CURRENT ALIVE'}
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
                {aliveBirds}
              </p>
              <span className="text-[11px] font-bold text-rose-600">
                {isBn ? `মৃত্যু: ${mortalityCount} টি` : `Dead: ${mortalityCount}`}
              </span>
            </div>

            {/* 3. মৃত্যুর হার (%) */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                {isBn ? 'মৃত্যুর হার (%)' : 'MORTALITY RATE'}
              </span>
              <p className={`text-xl sm:text-2xl font-black font-mono mt-1 ${scientificMetrics.mortalityRatePct > 3 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {scientificMetrics.mortalityRatePct}%
              </p>
              <span className="text-[11px] font-bold text-slate-500">
                {isBn ? `বেঁচে আছে: ${scientificMetrics.livabilityRatePct}%` : `Live: ${scientificMetrics.livabilityRatePct}%`}
              </span>
            </div>

            {/* 4. মোট খাদ্য গ্রহণ */}
            <div 
              onClick={() => {
                setModalInwardKg(String(totalFeedInwardKg));
                setModalConsumedKg(String(feedConsumedKg));
                setShowAdjustModal(true);
              }}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-400 cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  {isBn ? 'মোট খাদ্য গ্রহণ' : 'TOTAL FEED FED'}
                </span>
                <Edit3 size={12} className="text-slate-400 group-hover:text-amber-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-1">
                {feedConsumedKg}
              </p>
              <span className="text-[11px] font-bold text-slate-500 truncate block">
                {isBn ? `${(feedConsumedKg / 50).toFixed(1)} বস্তা খাওয়া শেষ` : `${(feedConsumedKg / 50).toFixed(1)} bags`}
              </span>
            </div>

            {/* 5. বর্তমান গড় ওজন (EDITABLE) */}
            <div 
              onClick={() => setShowWeightModal(true)}
              className="bg-white p-3.5 rounded-2xl border border-indigo-200 shadow-2xs hover:border-indigo-500 cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                  {isBn ? 'বর্তমান গড় ওজন' : 'CURRENT AVG WEIGHT'}
                </span>
                <Edit3 size={12} className="text-indigo-400 group-hover:text-indigo-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-indigo-700 font-mono mt-1">
                {currentActualWeight} <span className="text-xs font-bold text-slate-500">{isBn ? 'গ্রাম' : 'g'}</span>
              </p>
              <span className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                <span>Std: {currentStdWeight}g</span>
                <span className="text-indigo-600 font-bold underline text-[10px]">{isBn ? 'পরিবর্তন' : 'Edit'}</span>
              </span>
            </div>

            {/* 6. বর্তমান FCR (ACTUAL) */}
            <div 
              onClick={() => setShowFcrBreakdownModal(true)}
              className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-2xs hover:border-yellow-400 cursor-pointer transition-colors group"
              title={isBn ? 'FCR সূত্র ও হিসাবের বিস্তারিত দেখুন' : 'Click to inspect formula'}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                  {fcrMode === 'commercial' 
                    ? (isBn ? 'বাণিজ্যিক FCR' : 'COMMERCIAL FCR')
                    : (isBn ? 'বৈজ্ঞানিক নিট FCR' : 'ACTUAL NET FCR')}
                </span>
                <Info size={12} className="text-amber-400 group-hover:scale-125 transition-transform" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-yellow-300 font-mono mt-1">
                {currentActualFcr.toFixed(2)}
              </p>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mt-0.5">
                <span>Std: {currentStdFcr.toFixed(2)}</span>
                <span className="text-amber-300 underline font-black">
                  {fcrMode === 'commercial' 
                    ? (isBn ? `নিট: ${scientificMetrics.actualNetFcr.toFixed(2)}` : `Net: ${scientificMetrics.actualNetFcr.toFixed(2)}`)
                    : (isBn ? `বাণিজ্যিক: ${scientificMetrics.commercialGrossFcr.toFixed(2)}` : `Comm: ${scientificMetrics.commercialGrossFcr.toFixed(2)}`)}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: FCR DIFFERENCE & COST OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* FCR Difference Chip */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {fcrMode === 'commercial' 
                    ? (isBn ? 'বাণিজ্যিক FCR পার্থক্য' : 'Commercial FCR Diff') 
                    : (isBn ? 'নিট FCR পার্থক্য' : 'Net FCR Diff')}
                </span>
                <p className={`text-xl font-black font-mono mt-0.5 ${fcrDiff <= 0 ? 'text-emerald-600' : fcrDiff <= 0.08 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {fcrDiffSign}
                </p>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${fcrDiff <= 0 ? 'bg-emerald-100 text-emerald-800' : fcrDiff <= 0.08 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                {fcrStatusText}
              </span>
            </div>

            {/* Flock Total Live Weight OR Net Meat Gain */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {fcrMode === 'commercial' 
                    ? (isBn ? 'জীবিত মোট লাইভ ওজন' : 'Flock Total Live Weight')
                    : (isBn ? 'জীবিত মোট নিট মাংস' : 'Flock Net Meat Gain')}
                </span>
                <p className="text-xl font-black text-indigo-700 font-mono mt-0.5">
                  {fcrMode === 'commercial' ? scientificMetrics.totalLiveWeightKg : scientificMetrics.totalNetMeatKg} <span className="text-xs font-bold text-slate-500">KG</span>
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-indigo-50 px-2 py-1 rounded-xl">
                {scientificMetrics.aliveBirds} {isBn ? 'টি পাখি' : 'birds'}
              </span>
            </div>

            {/* Total Feed Cost Chip */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {isBn ? 'মোট ফিড খরচ' : 'Total Feed Cost'}
                </span>
                <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                  ৳{calculatedFeedCost.toLocaleString('bn-BD')}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-xl">
                {feedConsumedKg} {isBn ? 'কেজি' : 'KG'}
              </span>
            </div>

            {/* EPEF Index */}
            <div 
              onClick={() => setShowFcrBreakdownModal(true)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-400"
            >
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {isBn ? 'EPEF পারফরম্যান্স ইনডেক্স' : 'EPEF Efficiency'}
                </span>
                <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                  {scientificMetrics.epefScore}
                </p>
              </div>
              <span className={`text-xs font-black px-2 py-1 rounded-xl ${scientificMetrics.epefScore >= 280 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {scientificMetrics.epefScore >= 280 ? (isBn ? 'চমৎকার' : 'High') : (isBn ? 'মাঝারি' : 'Fair')}
              </span>
            </div>
          </div>

          {/* CARD 4: INTERACTIVE WEIGHT vs AGE SVG LINE CHART */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    {isBn ? 'বয়স অনুযায়ী ওজন বৃদ্ধির স্ট্যান্ডার্ড চার্ট' : 'Standard vs Actual Weight Chart'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {isBn ? 'ব্রয়লার স্ট্যান্ডার্ড বেঞ্চমার্ক এবং খামারের বাস্তব বৃদ্ধির তুলনা' : 'Growth trajectory against Cobb 500 benchmark'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-1 bg-slate-400 rounded-full"></span>
                  {isBn ? 'স্ট্যান্ডার্ড ওজন' : 'Standard'}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-1 bg-emerald-500 rounded-full"></span>
                  {isBn ? 'বাস্তব ওজন' : 'Actual'}
                </span>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="w-full overflow-x-auto pt-2">
              <div className="min-w-[500px] h-48 sm:h-56 relative flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 520 180">
                  <line x1="45" y1="20" x2="45" y2="160" stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1="45" y1="160" x2="510" y2="160" stroke="#cbd5e1" strokeWidth="1.5" />
                  
                  {[0, 800, 1600, 2400].map((val, i) => {
                    const y = 160 - (val / 2400) * 135;
                    return (
                      <g key={i}>
                        <line x1="45" y1={y} x2="510" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="38" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="bold">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Standard Curve */}
                  {(() => {
                    const maxWeight = 2600;
                    const points = milestones.map((m, idx) => {
                      const x = 50 + (idx / Math.max(1, milestones.length - 1)) * 450;
                      const y = 160 - (Math.min(maxWeight, m.stdWeightGram) / maxWeight) * 135;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <polyline
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2.5"
                        strokeDasharray="4,4"
                        strokeLinecap="round"
                        points={points}
                      />
                    );
                  })()}

                  {/* Actual Curve */}
                  {(() => {
                    const maxWeight = 2600;
                    const actualPts = milestones
                      .filter(m => m.actWeightGram !== undefined && m.actWeightGram > 0)
                      .map((m) => {
                        const idx = milestones.findIndex(item => item.day === m.day);
                        const x = 50 + (idx / Math.max(1, milestones.length - 1)) * 450;
                        const y = 160 - (Math.min(maxWeight, m.actWeightGram || 0) / maxWeight) * 135;
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
                    const x = 50 + (idx / Math.max(1, milestones.length - 1)) * 450;
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

          {/* CARD 5: WEEKLY & DAILY STANDARD VS ACTUAL TABLE */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{isBn ? 'সাপ্তাহিক ও বয়স অনুযায়ী গ্রোথ টেবিল' : 'Standard vs Actual Growth Table'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                    {isBn ? 'বাস্তব ইনপুট দিলে সঠিক FCR' : 'Precision Feed & Weight Input'}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {isBn 
                    ? `মৃত্যু (${mortalityCount}টি) ও জীবিত (${aliveBirds}টি) সংখ্যা অনুযায়ী প্রতিটি বয়সের খাদ্য ও ওজনের নির্ভুল FCR বের হবে` 
                    : `Feed & weight inputs calculate precise mortality-adjusted FCR for each milestone`}
                </p>
              </div>

              {/* Table Filter & FCR Mode */}
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleToggleFcrMode('commercial')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      fcrMode === 'commercial' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={isBn ? 'বাণিজ্যিক FCR মোড' : 'Commercial FCR'}
                  >
                    {isBn ? 'বাণিজ্যিক' : 'Gross'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleFcrMode('net')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      fcrMode === 'net' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={isBn ? 'বৈজ্ঞানিক নিট FCR মোড' : 'Scientific Net FCR'}
                  >
                    {isBn ? 'নিট বৃদ্ধি' : 'Net'}
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTableFilter('weekly')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      tableFilter === 'weekly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isBn ? '📅 সপ্তাহ' : 'Weekly'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      tableFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isBn ? '📋 সম্পূর্ণ' : 'Full'}
                  </button>
                </div>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-emerald-800 text-white font-black text-[11px]">
                    <th className="py-3 px-3.5 whitespace-nowrap">
                      {isBn ? 'বয়স / সপ্তাহ' : 'Age / Milestone'}
                    </th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">
                      {isBn ? `STD কিউমু. ফিড (${aliveBirds}টিতে)` : 'STD Feed'}
                    </th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">
                      {isBn ? 'STD ওজন (GM)' : 'STD Weight (GM)'}
                    </th>
                    <th className="py-3 px-3 text-center bg-amber-500 text-slate-950 font-black whitespace-nowrap">
                      {isBn ? 'ACT কিউমু. ফিড (কেজি / বস্তা)' : 'ACT Feed (KG)'}
                    </th>
                    <th className="py-3 px-3 text-center bg-amber-500 text-slate-950 font-black whitespace-nowrap">
                      {isBn ? 'ACT ওজন (GM)' : 'ACT Weight (GM)'}
                    </th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">
                      {isBn ? 'STD FCR' : 'STD FCR'}
                    </th>
                    <th className="py-3 px-3 text-center whitespace-nowrap bg-emerald-900/80">
                      {isBn 
                        ? (fcrMode === 'commercial' ? 'ACT FCR (বাণিজ্যিক)' : 'ACT FCR (নিট)') 
                        : (fcrMode === 'commercial' ? 'ACT FCR (Gross)' : 'ACT FCR (Net)')}
                    </th>
                    <th className="py-3 px-3.5 text-center whitespace-nowrap">
                      {isBn ? 'অবস্থা' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedMilestones.map((m) => {
                    const isToday = m.day === ageDays;
                    // Standard feed scaled for surviving flock count
                    const stdFlockFeedKg = Number(((m.stdCumFeedPer1000Kg * (aliveBirds || 1000)) / 1000).toFixed(1));

                    // Effective row feed: entered or today's or std
                    const effectiveRowFeedKg = m.actCumFeedKg !== undefined 
                      ? m.actCumFeedKg 
                      : (isToday ? feedConsumedKg : stdFlockFeedKg);

                    // Effective row weight: entered or today's or std
                    const effectiveRowWeight = m.actWeightGram !== undefined 
                      ? m.actWeightGram 
                      : (isToday ? currentActualWeight : m.stdWeightGram);

                    // Real-time FCR calculation for this milestone row
                    const rowActualFcr = calculateRowActualFcr(effectiveRowFeedKg, effectiveRowWeight);
                    const diffFcr = rowActualFcr !== undefined ? Number((rowActualFcr - m.stdFcr).toFixed(2)) : undefined;

                    return (
                      <tr 
                        key={m.day} 
                        className={`transition-colors ${isToday ? 'bg-amber-50/80 font-bold' : 'hover:bg-slate-50/80'}`}
                      >
                        {/* Milestone Age */}
                        <td className="py-2.5 px-3.5 text-slate-900 font-bold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{m.weekLabel}</span>
                            {isToday && (
                              <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded-md">
                                {isBn ? 'আজকের বয়স' : 'Today'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Standard Feed for Surviving Flock */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700 whitespace-nowrap">
                          <span>{stdFlockFeedKg} kg</span>
                          <span className="text-[10px] text-slate-400 block">({Math.round(stdFlockFeedKg / 50)} {isBn ? 'বস্তা' : 'bags'})</span>
                        </td>

                        {/* Standard Weight */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700 font-bold whitespace-nowrap">
                          {m.stdWeightGram} <span className="text-[10px] text-slate-400">gm</span>
                        </td>

                        {/* EDITABLE ACTUAL FEED (KG or Bags) */}
                        <td className="py-2 px-2 text-center bg-amber-50/30 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              defaultValue={m.actCumFeedKg || (isToday ? feedConsumedKg : '')}
                              placeholder={String(stdFlockFeedKg)}
                              onBlur={(e) => updateMilestoneData(m.day, undefined, e.target.value)}
                              className="w-20 text-center font-black font-mono py-1 px-1 bg-white border border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-lg text-slate-900 text-xs shadow-2xs"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">kg</span>
                          </div>
                        </td>

                        {/* EDITABLE ACTUAL WEIGHT INPUT */}
                        <td className="py-2 px-2 text-center bg-amber-50/50 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              defaultValue={m.actWeightGram || (isToday ? currentActualWeight : '')}
                              placeholder={String(m.stdWeightGram)}
                              onBlur={(e) => updateMilestoneData(m.day, e.target.value, undefined)}
                              className="w-20 text-center font-black font-mono py-1 px-1 bg-white border border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg text-slate-900 text-xs shadow-2xs"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">gm</span>
                          </div>
                        </td>

                        {/* Standard FCR */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 font-bold whitespace-nowrap">
                          {m.stdFcr.toFixed(2)}
                        </td>

                        {/* Actual FCR */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {rowActualFcr !== undefined ? (
                            <span className={`inline-block px-2.5 py-1 rounded-md font-mono font-black text-xs ${
                              diffFcr! <= 0 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : diffFcr! <= 0.08 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {rowActualFcr.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-2.5 px-3.5 text-center text-[11px] font-bold whitespace-nowrap">
                          {rowActualFcr !== undefined ? (
                            diffFcr! <= 0 ? (
                              <span className="text-emerald-700 flex items-center justify-center gap-1">
                                <CheckCircle2 size={13} />
                                {isBn ? 'চমৎকার' : 'Good'}
                              </span>
                            ) : diffFcr! <= 0.08 ? (
                              <span className="text-amber-700 flex items-center justify-center gap-1">
                                {isBn ? 'স্বাভাবিক' : 'Normal'}
                              </span>
                            ) : (
                              <span className="text-rose-700 flex items-center justify-center gap-1">
                                <AlertTriangle size={13} />
                                {isBn ? 'বেশি FCR' : 'High'}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD 6: SMART AUTO-SUGGESTION ENGINE */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    {isBn ? 'ভেটেরিনারি অটো-সাজেশন (FCR অপ্টিমাইজেশন)' : 'Veterinary Auto-Suggestion Engine'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {isBn ? 'FCR বেশি হলে স্বাভাবিক করার সুনির্দিষ্ট কার্যপদ্ধতি' : 'Actionable steps if FCR is higher than benchmark'}
                  </p>
                </div>
              </div>

              <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${isFcrGood ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {isFcrGood 
                  ? (isBn ? '🟢 এফসিআর স্বাভাবিক' : 'Normal FCR')
                  : (isBn ? '⚠️ এফসিআর বৃদ্ধির ঝুঁকি' : 'High FCR Alert')}
              </span>
            </div>

            {/* Dynamic Advice Box */}
            {isFcrGood ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>{isBn ? 'অভিনন্দন! আপনার খামারের এফসিআর অত্যন্ত সন্তোষজনক।' : 'Outstanding FCR Performance!'}</span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-800">
                  {isBn 
                    ? `আপনার বর্তমান নিট FCR (${currentActualFcr.toFixed(2)}) আদর্শ মান (${currentStdFcr.toFixed(2)}) এর সাথে অত্যন্ত সামঞ্জস্যপূর্ণ। মৃত্যু সংখ্যা বাদ দিয়েও বেঁচে থাকা ${aliveBirds}টি পাখির খাদ্য রূপান্তর হার অত্যন্ত চমৎকার। পানি সরবরাহ ও শুকনো লিটার বজায় রাখুন।`
                    : `Your current net FCR (${currentActualFcr.toFixed(2)}) is well within profitable targets for your surviving ${aliveBirds} birds.`}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-3">
                <div className="flex items-center gap-2 font-black text-sm text-rose-800">
                  <AlertTriangle size={18} className="text-rose-600" />
                  <span>
                    {isBn 
                      ? 'সতর্কতা: FCR বেশি হওয়ার ৫টি মূল কারণ ও তাৎক্ষণিক সমাধান' 
                      : 'Action Plan: 5 Causes of High FCR & Solutions'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-rose-900">
                  <div className="p-2.5 rounded-xl bg-white/80 border border-rose-100 space-y-1">
                    <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px] font-black">১</span>
                      {isBn ? 'ফিডার উচ্চতা ও খাবার অপচয়' : 'Feeder Height & Spill'}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {isBn
                        ? 'ফিডারের উচ্চতা সবসময় মুরগির পিঠের সমান্তরাল রাখুন। নিচে খাবার পড়ে নষ্ট হলে ৩-৫% FCR এমনিতেই বেড়ে যায়।'
                        : 'Adjust feeder height to the bird back level to prevent spilling.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 border border-rose-100 space-y-1">
                    <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px] font-black">২</span>
                      {isBn ? 'ব্রুডিং ও শেড তাপমাত্রা' : 'Temperature Stress'}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {isBn
                        ? 'শেডে ঠান্ডা বাতাস ঢুকলে মুরগি শরীর গরম রাখতে বেশি খাবার খায় কিন্তু মাংস বাড়ে না। আদর্শ তাপমাত্রা বজায় রাখুন।'
                        : 'Cold stress forces birds to burn feed for warmth instead of meat gain.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 border border-rose-100 space-y-1">
                    <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px] font-black">৩</span>
                      {isBn ? 'অন্ত্রের স্বাস্থ্য ও কক্সিডিওসিস' : 'Gut Health & Coccidiosis'}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {isBn
                        ? 'ড্রপিংয়ে রক্ত বা অপাচ্য দানাদার খাবার থাকলে রক্ত আমাশয় বা কৃমির কারণে খাদ্য শোষণ ব্যাহত হচ্ছে। এনজাইম বা টক্সিন বাইন্ডার দিন।'
                        : 'Examine droppings for undigested feed or bloody coccidiosis.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 border border-rose-100 space-y-1">
                    <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center text-[10px] font-black">৪</span>
                      {isBn ? 'লিটার আর্দ্রতা ও অ্যামোনিয়া' : 'Litter & Ammonia Gas'}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {isBn
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
        /* QUICK FCR CALCULATOR TAB */
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Calculator size={20} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {isBn ? 'কুইক সার্বজনীন FCR ক্যালকুলেটর (যেকোনো পশু-পাখি-মাছ)' : 'Universal Precision FCR Calculator'}
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {isBn ? 'মৃত্যু সমন্বয়, গড় ওজন ও বয়সের ভিত্তিতে তাৎক্ষণিক বিজ্ঞানসম্মত FCR ও পারফরম্যান্স নির্ণয়' : 'Instantly calculate net FCR, gross FCR, and EPEF efficiency for any livestock'}
                </p>
              </div>
            </div>

            {/* Feed Unit Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCalcFeedUnit('bags')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  calcFeedUnit === 'bags' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {isBn ? 'বস্তা (Bags)' : 'Bags'}
              </button>
              <button
                type="button"
                onClick={() => setCalcFeedUnit('kg')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  calcFeedUnit === 'kg' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {isBn ? 'কেজি (KG)' : 'KG'}
              </button>
            </div>
          </div>

          {/* Breed / Livestock Selector in Quick Calc */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? '১. পশু-পাখি বা মাছের প্রজাতি নির্বাচন:' : '1. Livestock / Breed Type:'}
              </label>
              <select
                value={calcBreed}
                onChange={(e) => handleCalcBreedChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="broiler">🐔 ব্রয়লার (Cobb 500 / Ross 308)</option>
                <option value="sonali">🐥 সোনালী মুরগি (Sonali Standard)</option>
                <option value="layer">🥚 লেয়ার গ্রোয়ার (Layer Grower)</option>
                <option value="deshi">🦆 দেশি মুরগি / হাঁস / কোয়েল</option>
                <option value="cattle">🐄 গরু ও পশু মোটাতাজাকরণ (Cattle Fattening)</option>
                <option value="fish">🐟 মাছের খামার (Aquaculture FCR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? '২. বাচ্চার বর্তমান বয়স (দিন):' : '2. Flock Age (Days):'}
              </label>
              <input
                type="number"
                value={calcAgeDays}
                onChange={(e) => setCalcAgeDays(e.target.value)}
                placeholder="32"
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {/* Feed Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {calcFeedUnit === 'bags' 
                  ? (isBn ? 'মোট খাদ্য (বস্তা):' : 'Total Feed (Bags):')
                  : (isBn ? 'মোট খাদ্য (কেজি):' : 'Total Feed (KG):')}
              </label>
              <input
                type="number"
                value={calcFeedUnit === 'bags' ? calcFeedBags : calcFeedKg}
                onChange={(e) => {
                  if (calcFeedUnit === 'bags') {
                    setCalcFeedBags(e.target.value);
                    setCalcFeedKg(String((parseFloat(e.target.value) || 0) * 50));
                  } else {
                    setCalcFeedKg(e.target.value);
                    setCalcFeedBags(String((parseFloat(e.target.value) || 0) / 50));
                  }
                }}
                placeholder={calcFeedUnit === 'bags' ? '50' : '2500'}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {calcFeedUnit === 'bags' 
                  ? `= ${((parseFloat(calcFeedBags) || 0) * 50)} কেজি`
                  : `= ${((parseFloat(calcFeedKg) || 0) / 50).toFixed(1)} বস্তা`}
              </span>
            </div>

            {/* Total Chick Count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'শুরুর মোট সংখ্যা:' : 'Total Housed:'}
              </label>
              <input
                type="number"
                value={calcBirdsHoused}
                onChange={(e) => setCalcBirdsHoused(e.target.value)}
                placeholder="900"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            {/* Mortality Count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'মোট মৃত্যু (সংখ্যা):' : 'Total Mortality:'}
              </label>
              <input
                type="number"
                value={calcMortality}
                onChange={(e) => setCalcMortality(e.target.value)}
                placeholder="15"
                className="w-full border border-rose-300 text-rose-700 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-rose-500 bg-rose-50/50"
              />
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                {isBn ? 'জীবিত:' : 'Alive:'} {Math.max(0, (parseFloat(calcBirdsHoused) || 0) - (parseFloat(calcMortality) || 0))} টি
              </span>
            </div>

            {/* Average Weight */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'বর্তমান গড় ওজন (গ্রাম):' : 'Current Avg Weight (GM):'}
              </label>
              <input
                type="number"
                value={calcAvgWeight}
                onChange={(e) => setCalcAvgWeight(e.target.value)}
                placeholder="1600"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            {/* Initial Weight */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'প্রারম্ভিক ওজন (গ্রাম):' : 'Day-Old Weight (GM):'}
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

          {/* Computed Results */}
          {manualCalcResult && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Net FCR */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-3xl text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                    {isBn ? 'প্রকৃত নিট FCR (NET FCR)' : 'ACTUAL NET FCR'}
                  </span>
                  <p className="text-3xl sm:text-4xl font-black font-mono text-yellow-300">
                    {manualCalcResult.netFcr.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {isBn 
                      ? `নিট মাংস বৃদ্ধি ${manualCalcResult.totalNetMeatKg} কেজি` 
                      : `Net meat gained ${manualCalcResult.totalNetMeatKg} KG`}
                  </p>
                </div>

                {/* Gross FCR */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {isBn ? 'বাণিজ্যিক গ্রস FCR (LIVE FCR)' : 'COMMERCIAL LIVE FCR'}
                  </span>
                  <p className="text-3xl sm:text-4xl font-black font-mono text-slate-800">
                    {manualCalcResult.grossFcr.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isBn 
                      ? `মোট জীবিত ওজন ${manualCalcResult.totalLiveKg} কেজি` 
                      : `Total live weight ${manualCalcResult.totalLiveKg} KG`}
                  </p>
                </div>

                {/* Target Standard Benchmark */}
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-3xl text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                    {isBn ? 'আদর্শ টার্গেট FCR' : 'TARGET BENCHMARK'}
                  </span>
                  <p className="text-3xl sm:text-4xl font-black font-mono text-emerald-900">
                    {manualCalcResult.stdFcr.toFixed(2)}
                  </p>
                  <p className="text-[11px] font-bold text-emerald-700">
                    {manualCalcResult.diffFcr <= 0 
                      ? (isBn ? `টার্গেট থেকে ${Math.abs(manualCalcResult.diffFcr)} ভালো` : `${Math.abs(manualCalcResult.diffFcr)} better`)
                      : (isBn ? `টার্গেট থেকে +${manualCalcResult.diffFcr} বেশি` : `+${manualCalcResult.diffFcr} above target`)}
                  </p>
                </div>

                {/* EPEF Efficiency */}
                <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-3xl text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                    {isBn ? 'EPEF পারফরম্যান্স স্কোর' : 'EPEF EFFICIENCY'}
                  </span>
                  <p className="text-3xl sm:text-4xl font-black font-mono text-amber-900">
                    {manualCalcResult.epef}
                  </p>
                  <p className="text-[11px] font-black">
                    {manualCalcResult.epef >= 350 ? (
                      <span className="text-emerald-700">🏆 {isBn ? 'আন্তর্জাতিক মান (অসাধারণ)' : 'Excellent'}</span>
                    ) : manualCalcResult.epef >= 280 ? (
                      <span className="text-blue-700">✅ {isBn ? 'সন্তোষজনক ও লাভজনক' : 'Good'}</span>
                    ) : (
                      <span className="text-rose-700">⚠️ {isBn ? 'উন্নয়ন প্রয়োজন' : 'Needs improvement'}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Formula & Method Notice */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">
                    {isBn ? 'ক্যালকুলেশন মেথড:' : 'Calculation Method:'}
                  </strong>{' '}
                  {isBn
                    ? `মোট জীবিত পাখি: ${manualCalcResult.aliveBirds}টি (লিভাবিলিটি ${manualCalcResult.livabilityPercent}%)। নিট FCR = মোট খাদ্য (${manualCalcResult.feedKg} কেজি) ÷ প্রকৃত মাংস বৃদ্ধি (${manualCalcResult.totalNetMeatKg} কেজি)।`
                    : `Alive birds: ${manualCalcResult.aliveBirds} (${manualCalcResult.livabilityPercent}% livability). Net FCR = Feed / Net Weight Gain.`}
                </div>
              </div>
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
                  {isBn ? 'ফিড স্টক ও ব্যবহার সমন্বয়' : 'Adjust Feed Stock & Consumed'}
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
              {isBn 
                ? 'আপনার খামারের বাস্তব রেজিস্টার অনুযায়ী মোট কত কেজি খাদ্য আসলো এবং মুরগি কত খেলো তা আপডেট করুন।' 
                : 'Enter total inward feed and actual feed fed to birds.'}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'মোট খাদ্য এসেছে (কেজি):' : 'Total Arrived Feed (KG):'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={modalInwardKg}
                    onChange={(e) => setModalInwardKg(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    ({((Number(modalInwardKg) || 0) / 50).toFixed(1)} {isBn ? 'বস্তা' : 'bags'})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'মোট খাদ্য খেয়েছে (কেজি):' : 'Total Consumed Feed (KG):'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={modalConsumedKg}
                    onChange={(e) => setModalConsumedKg(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    ({((Number(modalConsumedKg) || 0) / 50).toFixed(1)} {isBn ? 'বস্তা' : 'bags'})
                  </span>
                </div>
              </div>

              {/* Quick bags button presets */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">
                  {isBn ? 'দ্রুত বস্তা সিলেক্ট:' : 'Quick Bags Preset:'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[20, 30, 40, 50, 54, 60].map(bags => (
                    <button
                      key={bags}
                      type="button"
                      onClick={() => {
                        setModalConsumedKg(String(bags * 50));
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      {bags} {isBn ? 'বস্তা' : 'bags'} ({bags * 50}kg)
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveStockAdjustment}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save size={14} />
                <span>{isBn ? 'সংরক্ষণ করুন' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK WEIGHT EDIT MODAL */}
      <FcrWeightModal
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        language={language}
        ageDays={ageDays}
        initialWeight={currentActualWeight}
        stdWeight={currentStdWeight}
        onSave={handleSaveWeightDirect}
      />

      {/* DETAILED SCIENTIFIC FCR BREAKDOWN MODAL */}
      <FcrBreakdownModal
        isOpen={showFcrBreakdownModal}
        onClose={() => setShowFcrBreakdownModal(false)}
        language={language}
        batchName={batchName}
        ageDays={ageDays}
        totalHoused={totalChicksHoused}
        mortalityCount={mortalityCount}
        feedConsumedKg={feedConsumedKg}
        currentWeightGram={currentActualWeight}
        stdFcr={currentStdFcr}
        metrics={scientificMetrics}
      />

      {/* BROILER DAILY FLOCK RECORD & SOP MODAL */}
      {showSopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="max-w-4xl w-full my-auto">
            <BroilerDailySopCard
              batchName={batchName}
              batchId={batchId}
              batchAgeDays={ageDays}
              isBn={isBn}
              onClose={() => setShowSopModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
