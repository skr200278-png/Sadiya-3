/**
 * DEDICATED FCR VIEW (PHASE 3 ENRICHED)
 * Strict Navigation & Calculation Flow:
 * Dashboard -> FCR
 * Category -> Animal Type/Breed -> Batch
 * All calculations strictly isolated to the selected batchId.
 * No estimated or guessed data. Feed stock is never consumed feed.
 * 
 * Includes:
 * 1. Batch-isolated Actual FCR Engine (Baseline Sample + Latest Sample)
 * 2. Feed Stock & Days Runway Tracker (কত বস্তা আছে ও কত দিন চলবে)
 * 3. Growth Evaluation & Action Plan (ওজন আদর্শের চেয়ে কম/বেশি হলে করণীয়)
 * 4. Next Sample Weighing Schedule (পরবর্তী স্যাম্পল ওজনের সময়সূচি)
 * 5. Production Feed Cost Analysis (খাদ্য খরচ ও মাংস উৎপাদন ব্যয়)
 * 6. Crystal-clear instructions & tooltips on every section
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Calculator,
  ArrowLeft,
  Scale,
  Wheat,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Lock,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Info,
  Package,
  Clock,
  Coins,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, where } from 'firebase/firestore';
import { db, fastGetDocs } from '../firebase';
import { demoStore } from '../utils/demoStore';
import {
  FarmCategory,
  AnimalBreed,
  SUPPORTED_BREEDS,
  BatchIdentifier,
  DailyActualRecord
} from '../types/fcrTypes';
import { fetchBatchDailyRecords } from '../services/dailyRecordService';
import { calculateStrictBatchFcr, BatchFcrResult } from '../utils/fcrCalculationEngine';
import { 
  calculateProgressiveFeedForecast, 
  toBnDigits, 
  ProgressiveFeedForecast 
} from '../utils/feedStockCalculations';
import DailyActualRecordModal from '../components/DailyActualRecordModal';
import QuickFeedPurchaseModal from '../components/QuickFeedPurchaseModal';

export default function FCR() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, isDemoUser } = useAuth();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // 1. Hierarchical Selection State: Category -> Breed -> Batch
  const [selectedCategory, setSelectedCategory] = useState<FarmCategory>('poultry');
  const [selectedBreed, setSelectedBreed] = useState<string>('broiler');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // 2. Data state
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState<boolean>(true);
  const [dailyRecords, setDailyRecords] = useState<DailyActualRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [feedPurchases, setFeedPurchases] = useState<any[]>([]);
  const [loadingFeedPurchases, setLoadingFeedPurchases] = useState<boolean>(false);

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [isFeedPurchaseModalOpen, setIsFeedPurchaseModalOpen] = useState<boolean>(false);
  const [showGrowthCurveDetails, setShowGrowthCurveDetails] = useState<boolean>(false);

  // Fetch all batches on mount
  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      if (isDemoUser || !currentUser) {
        const demoBatches = demoStore.getBatches();
        setAllBatches(demoBatches);
      } else {
        const bSnap = await fastGetDocs(
          query(collection(db, 'batches'), where('userId', '==', currentUser.uid))
        );
        const fetched = bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllBatches(fetched);
      }
    } catch (err) {
      console.error('Failed to load batches for FCR:', err);
    } finally {
      setLoadingBatches(false);
    }
  }, [currentUser, isDemoUser]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Read URL query params on mount if provided
  useEffect(() => {
    const urlCategory = searchParams.get('category') as FarmCategory;
    const urlBreed = searchParams.get('breed');
    const urlBatchId = searchParams.get('batchId');

    if (urlCategory && (urlCategory === 'poultry' || urlCategory === 'cattle' || urlCategory === 'fish')) {
      setSelectedCategory(urlCategory);
    }
    if (urlBreed) {
      setSelectedBreed(urlBreed);
    }
    if (urlBatchId) {
      setSelectedBatchId(urlBatchId);
    }
  }, [searchParams]);

  // Batches matching Category + Breed strictly
  const matchingBatches = useMemo(() => {
    return allBatches.filter(b => {
      // 1. Must match Category
      const batchCat = b.farmType || 'poultry';
      if (batchCat !== selectedCategory) return false;

      // 2. Match Breed / SubBreed
      const batchBreed = (b.subBreed || '').toLowerCase().trim();
      const bName = (b.batchName || '').toLowerCase();
      const breedMatch =
        !selectedBreed ||
        batchBreed === selectedBreed.toLowerCase() ||
        (selectedBreed === 'broiler' && (batchBreed.includes('broiler') || bName.includes('broiler') || bName.includes('ব্রয়লার') || bName.includes('বয়লার') || bName.includes('বয়লার'))) ||
        (selectedBreed === 'sonali' && (batchBreed.includes('sonali') || bName.includes('sonali') || bName.includes('সোনালী') || bName.includes('সোনালি'))) ||
        (selectedBreed === 'layer' && (batchBreed.includes('layer') || bName.includes('layer') || bName.includes('লেয়ার') || bName.includes('লেয়ার'))) ||
        (selectedBreed === 'deshi' && (batchBreed.includes('deshi') || bName.includes('deshi') || bName.includes('দেশি') || bName.includes('দেশী'))) ||
        (selectedBreed === 'fattening' && (batchBreed.includes('fatten') || bName.includes('ষাঁড়') || bName.includes('মোটাতাজা'))) ||
        (selectedBreed === 'dairy' && (batchBreed.includes('dairy') || bName.includes('গাভী') || bName.includes('দুধ'))) ||
        (selectedBreed === 'goat' && (batchBreed.includes('goat') || bName.includes('ছাগল') || bName.includes('খাসি'))) ||
        (selectedBreed === 'telapia' && (batchBreed.includes('telapia') || bName.includes('তেলাপিয়া') || bName.includes('তেলাপি'))) ||
        (selectedBreed === 'carp' && (batchBreed.includes('carp') || bName.includes('রুই') || bName.includes('কার্প')));

      return breedMatch;
    });
  }, [allBatches, selectedCategory, selectedBreed]);

  // Selected batch object
  const currentBatch = useMemo<BatchIdentifier | null>(() => {
    if (!selectedBatchId) return null;
    const found = allBatches.find(b => b.id === selectedBatchId);
    if (!found) return null;
    return {
      id: found.id,
      userId: found.userId || (currentUser ? currentUser.uid : 'demo_khamari_user_1'),
      batchName: found.batchName,
      farmType: found.farmType || selectedCategory,
      subBreed: found.subBreed || selectedBreed,
      startDate: found.startDate,
      totalChicks: Number(found.totalChicks || 0),
      status: found.status || 'active',
      bagWeightKg: found.bagWeightKg || 50
    };
  }, [selectedBatchId, allBatches, currentUser, selectedCategory, selectedBreed]);

  // When selectedBatch changes, fetch Daily Actual Records strictly for this batch
  const loadDailyRecords = useCallback(async () => {
    if (!selectedBatchId) {
      setDailyRecords([]);
      return;
    }
    setLoadingRecords(true);
    try {
      const targetUserId = currentUser ? currentUser.uid : 'demo_khamari_user_1';
      const records = await fetchBatchDailyRecords(selectedBatchId, targetUserId, isDemoUser);
      // Strict batch isolation guarantee
      setDailyRecords(records.filter(r => r.batchId === selectedBatchId));
    } catch (err) {
      console.error('Failed to load batch daily records for FCR:', err);
    } finally {
      setLoadingRecords(false);
    }
  }, [selectedBatchId, currentUser, isDemoUser]);

  // Fetch feed purchase records (stock-in) for this batch
  const loadFeedPurchases = useCallback(async () => {
    if (!selectedBatchId) {
      setFeedPurchases([]);
      return;
    }
    setLoadingFeedPurchases(true);
    try {
      if (isDemoUser) {
        const records = demoStore.getFeedRecords().filter((r: any) =>
          r.recordType !== 'actual_consumed' && (r.batchId === selectedBatchId || !r.batchId)
        );
        setFeedPurchases(records);
      } else if (currentUser) {
        const q = query(
          collection(db, 'feed_records'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await fastGetDocs(q);
        const records = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((r: any) => r.recordType !== 'actual_consumed' && (r.batchId === selectedBatchId || !r.batchId));
        setFeedPurchases(records);
      }
    } catch (err) {
      console.error('Failed to load feed purchases for FCR:', err);
    } finally {
      setLoadingFeedPurchases(false);
    }
  }, [selectedBatchId, currentUser, isDemoUser]);

  useEffect(() => {
    loadDailyRecords();
    loadFeedPurchases();
  }, [loadDailyRecords, loadFeedPurchases]);

  const refreshAllData = useCallback(() => {
    loadDailyRecords();
    loadFeedPurchases();
  }, [loadDailyRecords, loadFeedPurchases]);

  // Handlers for Hierarchical Selection
  const handleSelectCategory = (cat: FarmCategory) => {
    setSelectedCategory(cat);
    const availableBreeds = SUPPORTED_BREEDS[cat] || [];
    const firstBreed = availableBreeds.length > 0 ? availableBreeds[0].code : '';
    setSelectedBreed(firstBreed);
    setSelectedBatchId('');
    setDailyRecords([]);
    setFeedPurchases([]);
  };

  const handleSelectBreed = (breedCode: string) => {
    setSelectedBreed(breedCode);
    setSelectedBatchId('');
    setDailyRecords([]);
    setFeedPurchases([]);
  };

  const handleSelectBatch = (bId: string) => {
    setSelectedBatchId(bId);
  };

  // Compute FCR Result via Strict Engine
  const fcrResult = useMemo<BatchFcrResult | null>(() => {
    if (!currentBatch) return null;
    return calculateStrictBatchFcr(currentBatch, dailyRecords);
  }, [currentBatch, dailyRecords]);

  // 3. Compute Feed Stock & Days Runway (কত বস্তা আছে ও কত দিন চলবে)
  const feedStockSummary = useMemo(() => {
    if (!currentBatch || !fcrResult) return null;
    const bagWeight = currentBatch.bagWeightKg || 50;

    // A. Purchased Bags & Kg
    let purchasedBags = feedPurchases.reduce((sum, r) => sum + Number(r.quantityBags || 0), 0);
    let totalCostSpent = feedPurchases.reduce((sum, r) => sum + Number(r.cost || 0), 0);

    // Local storage fallback if set
    const localStockIn = localStorage.getItem(`fcr_stock_in_${currentBatch.id}`);
    if (localStockIn && Number(localStockIn) > 0) {
      purchasedBags = Math.max(purchasedBags, Number(localStockIn));
    }

    const totalPurchasedKg = purchasedBags * bagWeight;
    const totalUsedKg = fcrResult.totalActualFeedUsedKg;
    const remainingKg = Math.max(0, totalPurchasedKg - totalUsedKg);
    const remainingBags = Number((remainingKg / bagWeight).toFixed(1));

    // B. Calculate Progressive Scientific Feed Forecast
    // (Simulates daily consumption day-by-day based on biological growth curves)
    const forecast: ProgressiveFeedForecast = calculateProgressiveFeedForecast({
      aliveCount: fcrResult.currentLiveCount,
      currentAgeDays: fcrResult.batchAgeDays,
      remainingStockKg: remainingKg,
      bagWeightKg: bagWeight,
      sector: (currentBatch.farmType as any) || 'poultry',
      batchName: currentBatch.batchName
    });

    const dailyConsumptionKg = forecast.currentDailyRequirementKg;
    const daysRunway = forecast.daysStockWillLast;
    let stockStatus: 'critical' | 'low' | 'healthy' | 'no_purchase' = 'healthy';
    if (purchasedBags === 0) {
      stockStatus = 'no_purchase';
    } else if (forecast.status === 'empty' || forecast.status === 'critical') {
      stockStatus = 'critical';
    } else if (forecast.status === 'low') {
      stockStatus = 'low';
    } else {
      stockStatus = 'healthy';
    }

    // E. Production Cost Analysis
    const avgCostPerKg = totalPurchasedKg > 0 && totalCostSpent > 0 ? (totalCostSpent / totalPurchasedKg) : 0;
    const costOfFeedUsedSoFar = Math.round(totalUsedKg * avgCostPerKg);
    const costPerKgLiveGain = fcrResult.actualFcr && avgCostPerKg > 0 ? Number((fcrResult.actualFcr * avgCostPerKg).toFixed(1)) : null;

    return {
      bagWeight,
      purchasedBags,
      totalPurchasedKg,
      totalUsedKg,
      remainingKg,
      remainingBags,
      dailyConsumptionKg: Number(dailyConsumptionKg.toFixed(1)),
      daysRunway,
      forecast,
      stockStatus,
      totalCostSpent,
      avgCostPerKg: Number(avgCostPerKg.toFixed(1)),
      costOfFeedUsedSoFar,
      costPerKgLiveGain
    };
  }, [currentBatch, fcrResult, feedPurchases]);

  // 4. Compute Growth Analysis & Actionable Advice
  const growthAnalysis = useMemo(() => {
    if (!fcrResult || fcrResult.latestMeasuredAvgWeightGram === null) return null;
    const actualGram = fcrResult.latestMeasuredAvgWeightGram;
    const expectedGram = fcrResult.expectedStandard.expectedAvgWeightGram;
    const diffGram = actualGram - expectedGram;
    const diffPercent = Number(((diffGram / expectedGram) * 100).toFixed(1));

    let status: 'lagging' | 'on_track' | 'ahead' = 'on_track';
    if (diffGram < -15) {
      status = 'lagging';
    } else if (diffGram > 15) {
      status = 'ahead';
    } else {
      status = 'on_track';
    }

    return {
      actualGram,
      expectedGram,
      diffGram,
      diffPercent,
      status
    };
  }, [fcrResult]);

  // 5. Compute Next Recommended Weighing Schedule
  const weighingSchedule = useMemo(() => {
    if (!fcrResult) return null;
    const age = fcrResult.batchAgeDays;
    const cat = fcrResult.category;
    const subBreed = (fcrResult.subBreed || '').toLowerCase();

    let routineDays = [7, 14, 21, 28, 35, 42];
    if (subBreed.includes('sonali') || subBreed.includes('সোনালী') || subBreed.includes('ককরেল')) {
      routineDays = [7, 14, 21, 28, 35, 42, 49, 56, 63, 70];
    } else if (cat === 'cattle') {
      routineDays = [15, 30, 45, 60, 75, 90, 105, 120];
    } else if (cat === 'fish') {
      routineDays = [15, 30, 45, 60, 75, 90, 105, 120];
    }

    const hasSampleToday = fcrResult.latestSample && fcrResult.latestSample.ageDays === age;
    let nextDay = routineDays.find(d => hasSampleToday ? d > age : d >= age);
    if (!nextDay) {
      nextDay = Math.ceil((age + 1) / 7) * 7;
    }

    const daysRemaining = Math.max(0, nextDay - age);
    const isToday = daysRemaining === 0;
    const isTomorrow = daysRemaining === 1;

    return {
      nextDay,
      daysRemaining,
      isToday,
      isTomorrow,
      hasSampleToday
    };
  }, [fcrResult]);

  // Available breed definitions for currently selected category
  const breedOptions = SUPPORTED_BREEDS[selectedCategory] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-24">
      {/* 1. Header with back button to Dashboard */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title={isBn ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Calculator size={18} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-850 text-base sm:text-lg flex items-center gap-2">
              {isBn ? 'FCR ও খাদ্য মজুদ ট্র্যাকার' : 'Feed Conversion Ratio & Stock Runway'}
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {isBn ? 'স্বয়ংক্রিয় খাঁটি হিসাব' : 'Auto Pure FCR'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              {isBn
                ? 'FCR, খাদ্য মজুদ, কত দিন চলবে ও বৃদ্ধির বাস্তব বিশ্লেষণ'
                : 'Batch isolated FCR, stock runway, and live growth analytics'}
            </p>
          </div>
        </div>

        {currentBatch && (
          <button
            onClick={refreshAllData}
            disabled={loadingRecords || loadingFeedPurchases}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            title={isBn ? 'রিফ্রেশ করুন' : 'Refresh'}
          >
            <RefreshCw size={16} className={loadingRecords || loadingFeedPurchases ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* 2. Hierarchical Flow Selector: Category -> Breed -> Batch */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
            <Layers size={15} className="text-indigo-600" />
            <span>{isBn ? 'ধাপভিত্তিক ব্যাচ নির্বাচন (Scope Selection)' : 'Scope Selection Flow'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">
            Category → Breed → Batch
          </span>
        </div>

        {/* STEP 1: Category Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {isBn ? '১. ক্যাটাগরি নির্বাচন করুন (Category)' : '1. Select Category'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectCategory('poultry')}
              className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedCategory === 'poultry'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-900 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg">🍗</span>
              <span>{isBn ? 'পোল্ট্রি / মুরগি' : 'Poultry'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectCategory('cattle')}
              className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedCategory === 'cattle'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg">🐂</span>
              <span>{isBn ? 'গবাদিপশু' : 'Cattle'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectCategory('fish')}
              className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedCategory === 'fish'
                  ? 'bg-cyan-500/10 border-cyan-500 text-cyan-900 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg">🐟</span>
              <span>{isBn ? 'মাছ চাষ' : 'Fish'}</span>
            </button>
          </div>
        </div>

        {/* STEP 2: Animal Type / Breed Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {isBn ? '২. জাত নির্বাচন করুন (Animal Type/Breed)' : '2. Select Animal Type/Breed'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {breedOptions.map(b => {
              const isSelected = selectedBreed === b.code;
              return (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => handleSelectBreed(b.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{b.icon}</span>
                  <span>{isBn ? b.nameBn : b.nameEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 3: Batch Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <Lock size={12} className="text-indigo-600" />
            <span>{isBn ? '৩. ব্যাচ নির্বাচন করুন (Batch Scope)' : '3. Select Batch'}</span>
          </label>

          {loadingBatches ? (
            <div className="text-xs text-slate-400 py-2">
              {isBn ? 'ব্যাচ লোড হচ্ছে...' : 'Loading batches...'}
            </div>
          ) : matchingBatches.length === 0 ? (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">
                {isBn
                  ? `এই জাতের (${breedOptions.find(b => b.code === selectedBreed)?.nameBn || selectedBreed}) কোনো ব্যাচ পাওয়া যায়নি।`
                  : `No batch found for selected breed.`}
              </p>
              <p className="text-[11px] text-amber-800">
                {isBn
                  ? 'FCR ও স্টক হিসাব দেখতে ব্যাচ মেনু থেকে এই জাতের একটি নতুন ব্যাচ চালু করুন।'
                  : 'Create a batch of this breed to calculate FCR.'}
              </p>
            </div>
          ) : (
            <select
              value={selectedBatchId}
              onChange={(e) => handleSelectBatch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="">
                {isBn ? '-- নির্দিষ্ট ব্যাচ নির্বাচন করুন --' : '-- Select a Batch --'}
              </option>
              {matchingBatches.map(b => (
                <option key={b.id} value={b.id}>
                  🟢 {b.batchName} — {b.totalChicks} {isBn ? 'বাচ্চা/সংখ্যা' : 'chicks'} (শুরু: {b.startDate})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 3. Batch Selection Guard */}
      {!selectedBatchId || !currentBatch ? (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calculator size={24} />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="font-bold text-slate-800 text-sm">
              {isBn ? 'FCR ও স্টক হিসাবের জন্য ব্যাচ নির্বাচন করুন' : 'Select a Batch to View FCR'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isBn
                ? 'FCR ও খাবার রানওয়ে সম্পূর্ণ ব্যাচভিত্তিক হিসাব। ওপর থেকে Category → Breed → Batch নির্বাচন করলেই শুধু ঐ ব্যাচের তথ্য দিয়ে স্বয়ংক্রিয় ফলাফল বের হবে।'
                : 'FCR and stock runway are strictly batch-scoped. Select your category, breed, and batch above to see isolated calculations.'}
            </p>
          </div>
        </div>
      ) : loadingRecords ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          {isBn ? 'নির্বাচিত ব্যাচের প্রকৃত রেকর্ড লোড হচ্ছে...' : 'Loading batch records...'}
        </div>
      ) : fcrResult ? (
        <div className="space-y-4">
          {/* A. Selected Batch Scope Card */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  {isBn ? 'নির্বাচিত ব্যাচ' : 'Selected Batch'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>{fcrResult.batchName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {isBn ? fcrResult.benchmark.nameBn : fcrResult.benchmark.nameEn}
                  </span>
                </h3>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">{isBn ? 'ব্যাচ বয়স' : 'Batch Age'}</span>
                <span className="text-sm font-black text-emerald-400">
                  {fcrResult.batchAgeDays} {isBn ? 'দিন' : 'days'}
                </span>
              </div>
            </div>

            {/* Flock live count */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 block">{isBn ? 'শুরুর সংখ্যা' : 'Stocking'}</span>
                <span className="font-black text-white">{fcrResult.initialQuantity}</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 block">{isBn ? 'বর্তমান জীবিত' : 'Current Live'}</span>
                <span className="font-black text-emerald-400">{fcrResult.currentLiveCount}</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 block">{isBn ? 'মোট মৃত্যু' : 'Total Mort.'}</span>
                <span className="font-black text-rose-400">{fcrResult.totalMortalityToDate}</span>
              </div>
            </div>
          </div>

          {/* B. MASTER CLEAR INSTRUCTION BANNER: কোথায় কী করতে হবে */}
          <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-950 font-black text-xs sm:text-sm">
              <Sparkles size={16} className="text-indigo-600 shrink-0" />
              <span>{isBn ? 'খামারির সহজ করণীয় দিক-নির্দেশিকা (কোথায় কী করতে হবে):' : 'Farmer Step-by-Step Action Guide:'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-indigo-950">
              <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  ১
                </span>
                <div>
                  <p className="font-bold text-slate-900">
                    {isBn ? 'প্রতিদিন খাবার দিলে:' : 'Daily Feed:'}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isBn
                      ? "নিচের 'দৈনিক রেকর্ড' বাটনে চাপ দিয়ে শুধু আজকের খাওয়ানো খাবার (কেজি) ও মৃত্যু সংখ্যা দিন।"
                      : 'Record today’s actual feed (kg) and mortality.'}
                  </p>
                </div>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  ২
                </span>
                <div>
                  <p className="font-bold text-slate-900">
                    {isBn ? 'ওজন মাপার দিনে (৭ম, ১৪তম দিনে):' : 'Weighing Days:'}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isBn
                      ? 'সব মুরগির ওজন লাগবে না; যেকোনো ৫–১০টি মুরগি এক সাথে মেপে পাখির সংখ্যা ও মোট ওজন দিন।'
                      : 'Weigh a sample of 5–10 birds together. App calculates average and weight gain.'}
                  </p>
                </div>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  ৩
                </span>
                <div>
                  <p className="font-bold text-slate-900">
                    {isBn ? 'খাবার কিনলে (স্টক এন্ট্রি):' : 'Feed Purchase:'}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isBn
                      ? "'খাদ্য ক্রয় এন্ট্রি' বাটনে কেনা বস্তার সংখ্যা লিখুন। ব্যবহৃত খাবার বাদ গিয়ে অবশিষ্ট স্টক নিজে হিসাব হবে।"
                      : 'Record purchased bags. Consumed feed auto-deducts to show stock and runway.'}
                  </p>
                </div>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  ৪
                </span>
                <div>
                  <p className="font-bold text-slate-900">
                    {isBn ? 'FCR বোঝার নিয়ম:' : 'Understanding FCR:'}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isBn
                      ? 'FCR যত কম (যেমন ১.৪০–১.৫০), খাদ্য অপচয় তত কম ও খামারে লাভ তত বেশি!'
                      : 'Lower FCR (e.g. 1.40–1.50) means better feed conversion and higher profits.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* C. The 6 Automated Outputs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* 1. Current Living Birds */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  {isBn ? 'বর্তমান জীবিত পাখি' : 'Current Living Birds'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
                  {isBn ? 'স্বয়ংক্রিয়' : 'Auto'}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900">
                {fcrResult.currentLiveCount.toLocaleString()}{' '}
                <span className="text-xs font-bold text-slate-500">{isBn ? 'টি' : 'birds'}</span>
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isBn
                  ? `শুরুর সংখ্যা (${fcrResult.initialQuantity}) − মোট মৃত্যু (${fcrResult.totalMortalityToDate})`
                  : `Start (${fcrResult.initialQuantity}) - Mort (${fcrResult.totalMortalityToDate})`}
              </p>
            </div>

            {/* 2. Batch Age */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-600" />
                  {isBn ? 'ব্যাচের বয়স' : 'Batch Age'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800">
                  {isBn ? 'স্বয়ংক্রিয়' : 'Auto'}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-indigo-950">
                {fcrResult.batchAgeDays} <span className="text-xs font-bold text-slate-500">{isBn ? 'দিন' : 'days'}</span>
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isBn ? `শুরুর তারিখ: ${fcrResult.startDate}` : `Start: ${fcrResult.startDate}`}
              </p>
            </div>

            {/* 3. Actual Feed Used */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Wheat size={14} className="text-amber-600" />
                  {isBn ? 'প্রকৃত খাবার ব্যবহার' : 'Actual Feed Used'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">
                  {fcrResult.dailyFeedRecordCount} {isBn ? 'দিন' : 'days'}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-amber-900">
                {fcrResult.totalActualFeedUsedKg > 0 ? (
                  <>
                    {fcrResult.totalActualFeedUsedKg.toLocaleString()}{' '}
                    <span className="text-xs font-bold text-slate-500">kg</span>
                  </>
                ) : (
                  <span className="text-sm text-rose-600 font-bold">{isBn ? 'রেকর্ড নেই' : 'No Feed'}</span>
                )}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isBn ? 'Daily Actual Record থেকে (খাদ্য স্টক যোগ হয়নি)' : 'Daily actual usage only (excludes stock)'}
              </p>
            </div>

            {/* 4. Measured Average Weight (Sample based) */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Scale size={14} className="text-purple-600" />
                  {isBn ? 'পরিমাপিত গড় ওজন' : 'Average Weight'}
                </span>
                {fcrResult.latestWeighingDate && (
                  <span className="text-[9px] font-bold text-slate-400">
                    {new Date(fcrResult.latestWeighingDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-lg sm:text-xl font-black text-purple-950">
                {fcrResult.latestMeasuredAvgWeightGram !== null ? (
                  <>
                    {fcrResult.latestMeasuredAvgWeightGram.toLocaleString()}{' '}
                    <span className="text-xs font-bold text-slate-500">g</span>{' '}
                    <span className="text-xs text-slate-400 font-semibold">
                      ({fcrResult.latestMeasuredAvgWeightKg} kg)
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-rose-600 font-bold">{isBn ? 'নমুনা নেওয়া হয়নি' : 'Not Weighed'}</span>
                )}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {fcrResult.latestSample ? (
                  isBn
                    ? `স্যাম্পল: ${fcrResult.latestSample.sampleBirds}টি পাখি, মোট ${fcrResult.latestSample.totalSampleWeightKg} kg`
                    : `Sample: ${fcrResult.latestSample.sampleBirds} birds, total ${fcrResult.latestSample.totalSampleWeightKg} kg`
                ) : (
                  isBn ? 'সব মুরগির ওজন লাগবে না; শুধু স্যাম্পল নিলেই হবে' : 'Sample average only (no need to weigh all)'
                )}
              </p>
            </div>

            {/* 5. Net Weight Gain per animal */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-600" />
                  {isBn ? 'গড় ওজন বৃদ্ধি' : 'Weight Gain'}
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  {fcrResult.baselineSample ? `শুরু: ${fcrResult.baselineSample.avgWeightGram}g` : 'পাখি প্রতি'}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-emerald-800">
                {fcrResult.avgWeightGainGram !== null && fcrResult.avgWeightGainGram > 0 ? (
                  <>
                    +{fcrResult.avgWeightGainGram.toLocaleString()}{' '}
                    <span className="text-xs font-bold text-slate-500">g</span>{' '}
                    <span className="text-xs text-slate-400 font-semibold">
                      ({fcrResult.avgWeightGainKg} kg)
                    </span>
                  </>
                ) : fcrResult.baselineSample ? (
                  <span className="text-xs text-indigo-700 font-bold">
                    {isBn ? '১ম স্যাম্পল সংরক্ষিত' : '1st Sample Saved'}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400 font-semibold">{isBn ? 'পরিমাপ ছাড়া অপ্রাপ্য' : 'Unavailable'}</span>
                )}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {fcrResult.baselineSample && fcrResult.latestSample && fcrResult.totalWeightSamplesTaken > 1 ? (
                  isBn
                    ? `১ম স্যাম্পল (${fcrResult.baselineSample.avgWeightGram}g) থেকে বৃদ্ধি`
                    : `Gain from 1st sample (${fcrResult.baselineSample.avgWeightGram}g)`
                ) : (
                  isBn ? 'পরবর্তী স্যাম্পল থেকে ওজন বৃদ্ধি হিসাব হবে' : 'Subsequent sample will calculate gain'
                )}
              </p>
            </div>

            {/* 6. Total Flock Weight Gain */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Activity size={14} className="text-teal-600" />
                  {isBn ? 'মোট ওজন বৃদ্ধি' : 'Total Weight Gain'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800">
                  {isBn ? 'জীবিত পাখি' : 'Live Flock'}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-teal-900">
                {fcrResult.totalFlockBiomassGainKg !== null && fcrResult.totalFlockBiomassGainKg > 0 ? (
                  <>
                    {fcrResult.totalFlockBiomassGainKg.toLocaleString()}{' '}
                    <span className="text-xs font-bold text-slate-500">kg</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-400 font-semibold">—</span>
                )}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isBn
                  ? `জীবিত ${fcrResult.currentLiveCount}টি পাখির মোট বৃদ্ধি (মৃত পাখির ওজন বাদ)`
                  : `Living birds only (mortality weight excluded)`}
              </p>
            </div>
          </div>

          {/* D. NEW FEATURE: FEED STOCK & DAYS RUNWAY (কত বস্তা খাবার আছে ও কত দিন চলবে) */}
          {feedStockSummary && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Package size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                      {isBn ? 'খাদ্য স্টক ও রানওয়ে ট্র্যাকার' : 'Feed Stock & Days Runway'}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {isBn ? 'গুদামের হিসাব' : 'Warehouse Stock'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isBn
                        ? 'গুদামে কত বস্তা খাবার অবশিষ্ট আছে এবং বর্তমান পাখিতে আর কত দিন চলবে'
                        : 'Remaining feed bags in stock and how many days it will last'}
                    </p>
                  </div>
                </div>

                {/* Quick Add Feed Stock Button */}
                <button
                  type="button"
                  onClick={() => setIsFeedPurchaseModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{isBn ? 'খাদ্য ক্রয় / স্টক এন্ট্রি' : 'Add Feed Purchase'}</span>
                </button>
              </div>

              {/* Feed Stock Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {/* 1. Remaining Bags in Stock */}
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                    <Package size={14} className="text-amber-700" />
                    {isBn ? 'গুদামে অবশিষ্ট খাবার' : 'Remaining Feed in Stock'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-amber-950">
                      {feedStockSummary.purchasedBags > 0
                        ? (isBn ? toBnDigits(feedStockSummary.remainingBags) : feedStockSummary.remainingBags.toLocaleString())
                        : (isBn ? '০' : '0')}
                    </span>
                    <span className="text-xs font-bold text-amber-800">
                      {isBn ? 'বস্তা' : 'bags'}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      ({isBn ? toBnDigits(Math.round(feedStockSummary.remainingKg)) : Math.round(feedStockSummary.remainingKg)} kg)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {feedStockSummary.purchasedBags > 0
                      ? isBn
                        ? `মোট কেনা ${toBnDigits(feedStockSummary.purchasedBags)} বস্তা − ব্যবহৃত ${toBnDigits(feedStockSummary.totalUsedKg)} kg`
                        : `Purchased ${feedStockSummary.purchasedBags} bags - Used ${feedStockSummary.totalUsedKg} kg`
                      : isBn
                      ? 'এখনও কোনো ক্রয়কৃত বস্তার এন্ট্রি দেওয়া হয়নি'
                      : 'No purchase records yet'}
                  </p>
                </div>

                {/* 2. Days Runway (কত দিন চলবে) */}
                <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-700" />
                    {isBn ? 'বর্তমান খাবারে আর কত দিন চলবে' : 'Days Runway (Will Last)'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-indigo-950">
                      {feedStockSummary.purchasedBags > 0 
                        ? `~ ${isBn ? toBnDigits(feedStockSummary.daysRunway) : feedStockSummary.daysRunway}` 
                        : '—'}
                    </span>
                    <span className="text-xs font-bold text-indigo-800">
                      {isBn ? 'দিন' : 'days'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {feedStockSummary.purchasedBags > 0
                      ? isBn
                        ? `বয়স ${toBnDigits(feedStockSummary.forecast.stockRunsOutAtFlockAge)} দিন পর্যন্ত খাদ্য নিশ্চিত`
                        : `Sufficient up to flock age ${feedStockSummary.forecast.stockRunsOutAtFlockAge} days`
                      : isBn
                      ? 'খাদ্য ক্রয়ের এন্ট্রি দিলে দিন সংখ্যা বের হবে'
                      : 'Record feed purchase to forecast runway'}
                  </p>
                </div>

                {/* 3. Daily Consumption Rate */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Wheat size={14} className="text-slate-600" />
                    {isBn ? 'বর্তমান দৈনিক খাবার চাহিদা' : 'Daily Consumption Need'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {isBn ? toBnDigits(feedStockSummary.dailyConsumptionKg) : feedStockSummary.dailyConsumptionKg}
                    </span>
                    <span className="text-xs font-bold text-slate-600">kg / {isBn ? 'দিন' : 'day'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {isBn
                      ? `বর্তমান জীবিত ${toBnDigits(fcrResult.currentLiveCount)}টি পাখির আজকের চাহিদা`
                      : `Today's requirement for ${fcrResult.currentLiveCount} live birds`}
                  </p>
                </div>
              </div>

              {/* Progressive Mathematical Explanation Box */}
              {feedStockSummary.purchasedBags > 0 && (
                <div className="p-3 bg-gradient-to-r from-amber-50/70 to-indigo-50/70 border border-amber-200/80 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      {isBn ? 'সঠিক গাণিতিক বিশ্লেষণ (পাখির বয়স বৃদ্ধির সাথে সাথে হিসাব)' : 'Progressive Feed Intake Breakdown'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                      {isBn ? 'বিজ্ঞানসম্মত স্ট্যান্ডার্ড' : 'Biological Standard'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {isBn ? feedStockSummary.forecast.explanationBn : feedStockSummary.forecast.forecastNoteEn}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 text-[10px]">
                    <div>
                      <span className="text-slate-500 block">{isBn ? 'জীবিত পাখি:' : 'Live Birds:'}</span>
                      <strong className="text-slate-800">{isBn ? toBnDigits(fcrResult.currentLiveCount) : fcrResult.currentLiveCount} {isBn ? 'টি' : 'birds'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isBn ? 'বর্তমান বয়স:' : 'Current Age:'}</span>
                      <strong className="text-slate-800">{isBn ? toBnDigits(fcrResult.batchAgeDays) : fcrResult.batchAgeDays} {isBn ? 'দিন' : 'days'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isBn ? 'চলবে বয়স পর্যন্ত:' : 'Runs Out At Age:'}</span>
                      <strong className="text-indigo-800">{isBn ? toBnDigits(feedStockSummary.forecast.stockRunsOutAtFlockAge) : feedStockSummary.forecast.stockRunsOutAtFlockAge} {isBn ? 'তম দিন' : 'days'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isBn ? 'ব্যাচ লক্ষ্য (৩৫ দিন):' : 'Batch Target:'}</span>
                      <strong className={feedStockSummary.forecast.isCoveredUntilHarvest ? 'text-emerald-700 font-black' : 'text-amber-700 font-black'}>
                        {feedStockSummary.forecast.isCoveredUntilHarvest 
                          ? (isBn ? `সম্পূর্ণ নিশ্চিত (+${toBnDigits(feedStockSummary.forecast.surplusBags)} বস্তা)` : `Covered (+${feedStockSummary.forecast.surplusBags} bags)`)
                          : (isBn ? `আরও ~${toBnDigits(feedStockSummary.forecast.shortageBags)} বস্তা লাগবে` : `Need ~${feedStockSummary.forecast.shortageBags} more bags`)}
                      </strong>
                    </div>
                  </div>

                  {/* Collapsible Weekly Growth Curve Details */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setShowGrowthCurveDetails(!showGrowthCurveDetails)}
                      className="w-full flex items-center justify-between text-[11px] font-bold text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Scale size={13} className="text-indigo-600" />
                        {isBn 
                          ? `বয়স বৃদ্ধির সাথে সাথে খাবার গ্রহণের সাপ্তাহিক তালিকা (${toBnDigits(fcrResult.currentLiveCount)} পাখির জন্য)` 
                          : `Weekly Feed Intake Curve (for ${fcrResult.currentLiveCount} birds)`}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] bg-white px-2 py-0.5 rounded border border-indigo-200 font-semibold shadow-2xs">
                        {showGrowthCurveDetails ? (isBn ? 'লুকান' : 'Hide') : (isBn ? 'চার্ট দেখুন' : 'Show Chart')}
                        {showGrowthCurveDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </span>
                    </button>

                    {showGrowthCurveDetails && feedStockSummary.forecast.weeklyBreakdown && (
                      <div className="mt-2 space-y-2 text-[11px] bg-white/90 p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                        <p className="text-[10px] text-slate-600 leading-snug">
                          {isBn
                            ? '💡 লক্ষ্য করুন: প্রথম দিকে বাচ্চা ছোট থাকায় দৈনিক সামান্য খায়, কিন্তু বয়স বৃদ্ধির সাথে সাথে প্রতিটি মুরগি বহুগুণ বেশি খাবার খায়। ফলে শেষের সপ্তাহে সবচেয়ে বেশি খাবার খরচ হয়।'
                            : '💡 Notice: Chicks consume very little in early weeks, but consumption multiplies rapidly as birds mature towards harvest.'}
                        </p>

                        <div className="overflow-x-auto">
                          <table className="w-full text-[10px] text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <th className="p-1.5">{isBn ? 'সপ্তাহ (বয়স)' : 'Week (Age)'}</th>
                                <th className="p-1.5 text-right">{isBn ? '১টি পাখির দৈনিক' : 'Per Bird/Day'}</th>
                                <th className="p-1.5 text-right">{isBn ? 'ফ্লকের দৈনিক' : 'Flock/Day'}</th>
                                <th className="p-1.5 text-right">{isBn ? 'সপ্তাহের মোট' : 'Week Total'}</th>
                                <th className="p-1.5 text-right">{isBn ? 'মোট বস্তা' : 'Total Bags'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {feedStockSummary.forecast.weeklyBreakdown.map((item) => (
                                <tr 
                                  key={item.weekNumber} 
                                  className={item.isCurrent ? 'bg-amber-50/80 font-bold text-amber-950' : 'text-slate-700 hover:bg-slate-50'}
                                >
                                  <td className="p-1.5 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                      <span>{isBn ? item.labelBn : item.labelEn}</span>
                                      {item.isCurrent && (
                                        <span className="text-[8px] bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-black">
                                          {isBn ? 'বর্তমান' : 'Current'}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-1.5 text-right whitespace-nowrap">
                                    {isBn ? toBnDigits(item.avgGramsPerBird) : item.avgGramsPerBird} g
                                  </td>
                                  <td className="p-1.5 text-right whitespace-nowrap font-semibold">
                                    {isBn ? toBnDigits(item.dailyFlockKg) : item.dailyFlockKg} kg
                                  </td>
                                  <td className="p-1.5 text-right whitespace-nowrap font-bold text-indigo-900">
                                    {isBn ? toBnDigits(item.weekTotalKg) : item.weekTotalKg} kg
                                  </td>
                                  <td className="p-1.5 text-right whitespace-nowrap font-black text-slate-900">
                                    ~{isBn ? toBnDigits(item.weekTotalBags) : item.weekTotalBags} {isBn ? 'বস্তা' : 'b'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Runway Status & Guidance Notice */}
              {feedStockSummary.stockStatus === 'no_purchase' ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
                  <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">
                      {isBn ? 'খাদ্য মজুদ ও রানওয়ে দেখতে খাদ্য ক্রয়ের তথ্য দিন:' : 'Record feed purchases to calculate runway:'}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {isBn
                        ? "আপনি যখন 'খাদ্য ক্রয় / স্টক এন্ট্রি' বাটনে চাপ দিয়ে কেনা বস্তার সংখ্যা দিবেন, তখন স্বয়ংক্রিয়ভাবে প্রতিদিন খাওয়ানো খাবার বাদ গিয়ে এখানে বাকি বস্তা ও আর কত দিন চলবে তা নির্ভুলভাবে বের হবে।"
                        : 'Click "Add Feed Purchase" to enter bags bought. Daily actual fed will auto-deduct to show remaining bags and days runway.'}
                    </p>
                  </div>
                </div>
              ) : feedStockSummary.stockStatus === 'critical' ? (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-950">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-rose-900">
                      🚨 {isBn ? 'জরুরি সতর্কবার্তা: খাবার শেষ হয়ে আসছে!' : 'Urgent: Feed Stock Depleted Soon!'}
                    </p>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      {isBn
                        ? `গুদামে মাত্র ${toBnDigits(feedStockSummary.remainingBags)} বস্তা খাবার অবশিষ্ট আছে, যা দিয়ে আর মাত্র ${toBnDigits(feedStockSummary.daysRunway)} দিন চলবে। এখনই ডিলারের সাথে যোগাযোগ করে নতুন খাবার অর্ডার করুন!`
                        : `Only ${feedStockSummary.remainingBags} bags left (~${feedStockSummary.daysRunway} days). Order feed immediately!`}
                    </p>
                  </div>
                </div>
              ) : feedStockSummary.stockStatus === 'low' ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900">
                      ⚠️ {isBn ? 'সতর্কতা: খাদ্যের মজুদ কমে আসছে' : 'Caution: Feed Stock Running Low'}
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      {isBn
                        ? `বর্তমান খাবার দিয়ে আর প্রায় ${toBnDigits(feedStockSummary.daysRunway)} দিন চলবে। পরবর্তী ২-৩ দিনের মধ্যে খাবার কেনার প্রস্তুতি নিন যাতে খাবার হঠাৎ শেষ না হয়ে যায়।`
                        : `Current feed will last ~${feedStockSummary.daysRunway} days. Prepare to re-order in the next 2-3 days.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-900">
                      ✅ {isBn ? 'পর্যাপ্ত খাদ্য মজুদ রয়েছে' : 'Sufficient Feed Stock'}
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      {isBn
                        ? feedStockSummary.forecast.forecastNoteBn
                        : `Stock has ${feedStockSummary.remainingBags} bags (~${feedStockSummary.daysRunway} days runway). Stock level is healthy.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* E. NEW FEATURE: GROWTH EVALUATION & ACTION PLAN (গ্রোথ নিরীক্ষা ও ওজনের তুলনা) */}
          {growthAnalysis && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Scale size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                      {isBn ? 'গ্রোথ ও শারীরিক বৃদ্ধির নিরীক্ষা' : 'Growth & Weight Evaluation'}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        growthAnalysis.status === 'ahead'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : growthAnalysis.status === 'lagging'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {growthAnalysis.status === 'ahead'
                          ? isBn ? '🌟 এগিয়ে আছে' : 'Ahead'
                          : growthAnalysis.status === 'lagging'
                          ? isBn ? '⚠️ পিছিয়ে আছে' : 'Lagging'
                          : isBn ? '✅ আদর্শ মানে আছে' : 'On Track'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isBn
                        ? 'আপনার স্যাম্পল মুরগির গড় ওজন বনাম আন্তর্জাতিক আদর্শ চার্টের তুলনা'
                        : 'Actual measured sample weight compared with breed benchmark'}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500">
                  {isBn ? `বয়স: ${fcrResult.batchAgeDays} দিন` : `Age: ${fcrResult.batchAgeDays} days`}
                </span>
              </div>

              {/* Weight Comparison Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    {isBn ? 'আপনার মুরগির বাস্তব গড় ওজন:' : 'Actual Sample Weight:'}
                  </span>
                  <span className="text-lg font-black text-purple-950">
                    {growthAnalysis.actualGram.toLocaleString()} g
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    {isBn ? 'এই বয়সে আন্তর্জাতিক আদর্শ ওজন:' : 'Expected Standard Weight:'}
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {growthAnalysis.expectedGram.toLocaleString()} g
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  growthAnalysis.diffGram >= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <span className="text-[10px] block font-semibold">
                    {isBn ? 'আদর্শ ওজনের সাথে পার্থক্য:' : 'Difference from Standard:'}
                  </span>
                  <span className="text-lg font-black">
                    {growthAnalysis.diffGram > 0 ? `+${growthAnalysis.diffGram}` : growthAnalysis.diffGram} g{' '}
                    <span className="text-xs font-semibold">
                      ({growthAnalysis.diffPercent > 0 ? `+${growthAnalysis.diffPercent}` : growthAnalysis.diffPercent}%)
                    </span>
                  </span>
                </div>
              </div>

              {/* Actionable Guidance Tips */}
              {growthAnalysis.status === 'lagging' ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-950">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertTriangle size={15} className="text-amber-700" />
                    <span>{isBn ? 'ওজন পিছিয়ে থাকার কারণ ও তাৎক্ষণিক করণীয়:' : 'Lagging Weight Action Steps:'}</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900 pl-1">
                    <li>
                      <strong>{isBn ? 'ব্রুডিং তাপমাত্রা:' : 'Temperature:'}</strong>{' '}
                      {isBn
                        ? 'শেডে অতিরিক্ত গরম বা ঠান্ডা থাকলে মুরগি খাওয়া কমিয়ে দেয়। সঠিক তাপমাত্রা বজায় রাখুন।'
                        : 'Ensure brooding temperature is optimal. Cold or heat stress reduces intake.'}
                    </li>
                    <li>
                      <strong>{isBn ? 'খাবার পাত্রের সংখ্যা:' : 'Feeders:'}</strong>{' '}
                      {isBn
                        ? 'প্রতি ৪০-৫০টি মুরগির জন্য অন্তত ১টি খাবারের পাত্র রাখুন যাতে সব মুরগি সমান সুযোগ পায়।'
                        : 'Provide at least 1 feeder per 40-50 birds so all birds feed equally.'}
                    </li>
                    <li>
                      <strong>{isBn ? 'আলোর ব্যবস্থা:' : 'Lighting:'}</strong>{' '}
                      {isBn
                        ? 'রাতে খাবার খাওয়ার জন্য পর্যাপ্ত আলোর ব্যবস্থা রাখুন (দিনে ২৩ ঘণ্টা আলো ও ১ ঘণ্টা অন্ধকার)।'
                        : 'Maintain 23 hours light to encourage proper feed consumption.'}
                    </li>
                    <li>
                      <strong>{isBn ? 'পানির গুণমান:' : 'Fresh Water:'}</strong>{' '}
                      {isBn
                        ? 'পানি পরিষ্কার ও ঠান্ডা রাখুন। মুরগি পানি কম খেলে খাবার খাওয়াও কমিয়ে দেয়।'
                        : 'Ensure cool and clean water. Reduced water intake lowers feed conversion.'}
                    </li>
                  </ul>
                </div>
              ) : growthAnalysis.status === 'ahead' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-950">
                  <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-700" />
                    <span>{isBn ? 'চমৎকার শারীরিক বৃদ্ধি — খামারির করণীয়:' : 'Super Growth — Farmer Advice:'}</span>
                  </p>
                  <p className="text-[11px] text-emerald-900">
                    {isBn
                      ? 'আপনার মুরগির বৃদ্ধি আন্তর্জাতিক স্ট্যান্ডার্ডের চেয়েও দ্রুত হচ্ছে। মুরগির অতিরিক্ত ওজনে যেন পায়ের ওপর চাপ না পড়ে সেজন্য লিটার শুকনো রাখুন ও বায়ু চলাচল স্বাভাবিক রাখুন।'
                      : 'Flock is outperforming standard curve. Keep litter dry and ensure good ventilation to support strong leg health.'}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-xs text-blue-950">
                  <p className="font-bold text-blue-900 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-blue-700" />
                    <span>{isBn ? 'আদর্শ মান অনুযায়ী সঠিক বৃদ্ধি (On Track):' : 'Ideal Growth (On Track):'}</span>
                  </p>
                  <p className="text-[11px] text-blue-900">
                    {isBn
                      ? 'মুরগির শারীরিক বৃদ্ধি ও খাদ্য গ্রহণ জাতের আদর্শ মান অনুযায়ী নিখুঁত গতিতে এগোচ্ছে। বর্তমান পরিচর্যা ও খাদ্য তালিকা বজায় রাখুন।'
                      : 'Weight gain perfectly aligns with standard growth charts. Keep up current feeding and management practices.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* F. NEW FEATURE: NEXT RECOMMENDED WEIGHING SCHEDULE (পরবর্তী ওজনের সময়সূচি) */}
          {weighingSchedule && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                    <span>{isBn ? 'পরবর্তী স্যাম্পল ওজনের সময়সূচি:' : 'Next Sample Weighing Schedule:'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      {isBn ? `বয়স ${weighingSchedule.nextDay} দিন` : `Age ${weighingSchedule.nextDay} days`}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {weighingSchedule.isToday ? (
                      <span className="text-emerald-600 font-bold">
                        {isBn ? '👉 আজই স্যাম্পল ওজন নেওয়ার দিন!' : '👉 Today is the day to weigh sample!'}
                      </span>
                    ) : weighingSchedule.isTomorrow ? (
                      <span className="text-indigo-600 font-bold">
                        {isBn ? '👉 আগামীকাল স্যাম্পল ওজন নেওয়ার দিন (আর ১ দিন বাকি)' : '👉 Tomorrow is sample weighing day (1 day left)'}
                      </span>
                    ) : (
                      isBn
                        ? `আর ${weighingSchedule.daysRemaining} দিন পর স্যাম্পল ওজন নেওয়ার রুটিন দিন`
                        : `${weighingSchedule.daysRemaining} days remaining until next routine weigh-in`
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(true)}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isBn ? 'স্যাম্পল ওজন এন্ট্রি দিন' : 'Enter Sample Weight'}
                </button>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {isBn ? 'মাত্র ৫-১০টি পাখি মেপে দিলেই হবে' : 'Weigh only 5-10 birds'}
                </span>
              </div>
            </div>
          )}

          {/* G. FCR RESULT OR EXPECTED STANDARD CARD */}
          {fcrResult.isCalculable && fcrResult.actualFcr !== null ? (
            /* SUCCESS RESULT CARD (ACTUAL FCR CALCULATED FROM REAL SAMPLE WEIGHT AND ACTUAL FEED) */
            <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
                    {isBn ? 'প্রকৃত FCR ফলাফল (Actual FCR Result)' : 'Actual FCR Result'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {fcrResult.actualFcr.toFixed(2)}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      fcrResult.rating === 'excellent'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : fcrResult.rating === 'good'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : fcrResult.rating === 'average'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}>
                      {isBn ? fcrResult.ratingLabelBn : fcrResult.ratingLabelEn}
                    </span>
                  </div>
                </div>

                {/* Benchmark Pill */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-right">
                  <span className="text-[10px] font-bold text-slate-500 block">
                    {isBn ? `${fcrResult.benchmark.nameBn}-এর আদর্শ রেঞ্জ` : 'Ideal Standard Range'}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-800">
                    {fcrResult.benchmark.idealMin} – {fcrResult.benchmark.idealMax}
                  </span>
                </div>
              </div>

              {/* Feedback Note */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-950 font-medium space-y-1">
                <p>💡 {isBn ? fcrResult.feedbackBn : fcrResult.feedbackEn}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
                  <span>{isBn ? `বয়সভিত্তিক প্রত্যাশিত আদর্শ FCR: ${fcrResult.expectedStandard.expectedFcrRange}` : `Age expected FCR: ${fcrResult.expectedStandard.expectedFcrRange}`}</span>
                  <span>•</span>
                  <span>{isBn ? `প্রত্যাশিত ওজন: ${fcrResult.expectedStandard.expectedAvgWeightGram}g` : `Expected wt: ${fcrResult.expectedStandard.expectedAvgWeightGram}g`}</span>
                </div>
              </div>

              {/* Step-by-Step Mathematical Formula Breakdown */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-2">
                <span className="font-bold text-slate-800 block">
                  {isBn ? 'হিসাবের গাণিতিক সূত্র ও নিরীক্ষা (Strict Calculation Breakdown):' : 'Formula Breakdown:'}
                </span>
                <p className="font-mono text-[10px] sm:text-[11px] text-indigo-950 bg-white p-2.5 rounded-lg border border-slate-200">
                  Actual FCR = মোট প্রকৃত খাবার ({fcrResult.totalActualFeedUsedKg} kg) ÷ মোট ওজন বৃদ্ধি ({fcrResult.totalFlockBiomassGainKg} kg) = <span className="font-bold text-indigo-600">{fcrResult.actualFcr.toFixed(2)}</span>
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-600 pt-1">
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="font-bold block text-slate-700">
                      {isBn ? '১ম বাস্তব স্যাম্পল (Starting / Baseline):' : 'Baseline Sample (Start):'}
                    </span>
                    <span>
                      {fcrResult.baselineSample
                        ? `${fcrResult.baselineSample.avgWeightGram}g (${fcrResult.baselineSample.date}, বয়স: ${fcrResult.baselineSample.ageDays} দিন)`
                        : `${fcrResult.initialWeightGram}g`}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="font-bold block text-slate-700">
                      {isBn ? 'বর্তমান স্যাম্পল (Latest Sample):' : 'Latest Measured Sample:'}
                    </span>
                    <span>
                      {fcrResult.latestSample
                        ? `${fcrResult.latestSample.avgWeightGram}g (${fcrResult.latestSample.date}, স্যাম্পল পাখি: ${fcrResult.latestSample.sampleBirds}টি)`
                        : '—'}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 pt-1">
                  {isBn
                    ? '✓ সব মুরগির ওজন নেওয়ার প্রয়োজন হয়নি; স্যাম্পল মুরগির গড় ওজন দিয়ে হিসাব করা হয়েছে। খাদ্য স্টক এবং মৃত মুরগির কাল্পনিক ওজন যোগ করা হয়নি।'
                    : '✓ Calculated using sample average weight. Feed inventory stock and mortality weight estimation are strictly excluded.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span>{isBn ? 'নতুন স্যাম্পল ওজন বা খাবার এন্ট্রি' : 'Add New Sample Weight or Feed'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* MISSING WEIGHT OR WAITING NEXT SAMPLE CARD - SHOW EXPECTED STANDARD AS REFERENCE ONLY (NEVER AS ACTUAL) */
            <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-amber-200 shadow-sm space-y-4">
              {/* Expected Standard Reference Banner */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={16} className="text-amber-700" />
                    <h4 className="font-black text-amber-950 text-xs sm:text-sm">
                      {isBn
                        ? 'বয়সভিত্তিক প্রত্যাশিত নির্দেশিকা (Expected Standard — এটি Actual নয়)'
                        : 'Age-based Expected Standard (Reference Only — Not Actual)'}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                    {isBn ? 'প্রত্যাশিত মান (Expected)' : 'Expected Only'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/80">
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      {isBn ? 'বর্তমান বয়সে প্রত্যাশিত গড় ওজন (Expected Weight):' : 'Expected Average Weight for Age:'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {fcrResult.expectedStandard.expectedAvgWeightGram.toLocaleString()}{' '}
                      <span className="text-xs font-bold text-slate-500">g</span>{' '}
                      <span className="text-xs text-slate-400 font-semibold">
                        ({fcrResult.expectedStandard.expectedAvgWeightKg} kg)
                      </span>
                    </span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/80">
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      {isBn ? 'বর্তমান বয়সে প্রত্যাশিত আদর্শ FCR:' : 'Expected Standard FCR for Age:'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-amber-900">
                      {fcrResult.expectedStandard.expectedFcrRange}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 pt-0.5">
                  {isBn
                    ? `* ব্যাচ বয়স: ${fcrResult.batchAgeDays} দিন | নির্দেশিকা উৎস: ${fcrResult.expectedStandard.sourceNoteBn}`
                    : `* Batch Age: ${fcrResult.batchAgeDays} days | Source: ${fcrResult.expectedStandard.sourceNoteEn}`}
                </p>
              </div>

              {/* Clear Explanation of Why Actual FCR is not shown yet */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 block">
                  {isBn ? 'আসল (Actual) FCR না দেখানোর কারণ ও বর্তমান স্থিতি:' : 'Why Actual FCR is not displayed:'}
                </span>

                {/* Case 1: First sample recorded, waiting for subsequent sample */}
                {fcrResult.missingReasons.includes('waiting_next_sample') && fcrResult.baselineSample && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-blue-900">
                      <span>✓ ১ম বাস্তব স্যাম্পল (Starting / Baseline Weight) সংরক্ষিত হয়েছে:</span>
                    </p>
                    <p className="text-[11px] text-blue-900">
                      তারিখ: <strong>{fcrResult.baselineSample.date}</strong> (বয়স: <strong>{fcrResult.baselineSample.ageDays} দিন</strong>) • স্যাম্পল পাখি: <strong>{fcrResult.baselineSample.sampleBirds}টি</strong> • গড় প্রারম্ভিক ওজন: <strong>{fcrResult.baselineSample.avgWeightGram} গ্রাম</strong>
                    </p>
                    <p className="text-[11px] text-blue-800 pt-1">
                      {isBn
                        ? 'নিয়মানুযায়ী ১ম বাস্তব স্যাম্পলটিকে Starting/Baseline ওজন ধরা হয়েছে। পরবর্তী কোনো দিনে স্যাম্পল ওজন মাপার সাথে সাথে স্বয়ংক্রিয়ভাবে Weight Gain ও Actual FCR বের হবে।'
                        : 'First sample recorded as Starting/Baseline. Subsequent sample weighing will establish weight gain and calculate Actual FCR.'}
                    </p>
                    <p className="text-[10px] text-slate-600 bg-white/80 p-1.5 rounded border border-blue-100 mt-1">
                      💡 <strong>{isBn ? 'টিপস:' : 'Tip:'}</strong> {isBn
                        ? 'আপনি যদি শুরু (ডে-১) থেকে পুরো ব্যাচের FCR দেখতে চান, তবে ডে-১ বা শুরুর দিনের একটি স্যাম্পল এন্ট্রি দিন (যেমন: বাচ্চার গড় ওজন ৪০ গ্রাম)। তাহলে সাথে সাথে শুরু থেকে বর্তমান দিনের Actual FCR হিসাব হয়ে যাবে!'
                        : 'To see FCR from Day 1, record Day 1 chick sample weight (e.g. 40g).'}
                    </p>
                  </div>
                )}

                {/* Case 2: No weight sample measured yet */}
                {fcrResult.missingReasons.includes('missing_weight') && (
                  <div className="flex items-start gap-2 text-rose-700 font-medium">
                    <span className="text-sm">❌</span>
                    <span>
                      {isBn
                        ? 'বাস্তব ওজন মাপা হয়নি: এই ব্যাচে কোনো স্যাম্পল ওজন এন্ট্রি নেই। কোনো কাল্পনিক বা অনুমানভিত্তিক Actual FCR দেওয়া নিষিদ্ধ। সব মুরগির ওজন মাপার প্রয়োজন নেই; মাত্র ৫-১০টি স্যাম্পল পাখি মেপে মোট ওজন দিলেই সাথে সাথে আসল FCR বের হবে।'
                        : 'No sample weight measured. Estimated FCR is prohibited. Weigh a small sample (5-10 birds) to get Actual FCR.'}
                    </span>
                  </div>
                )}

                {/* Case 3: Missing feed usage */}
                {fcrResult.missingReasons.includes('missing_feed') && (
                  <div className="flex items-start gap-2 text-rose-700 font-medium">
                    <span className="text-sm">❌</span>
                    <span>
                      {isBn
                        ? 'খাবার ব্যবহারের রেকর্ড নেই: এই ব্যাচের জন্য কোনো Daily Actual Feed Used এন্ট্রি দেওয়া হয়নি। Feed Stock কেনা হলেও প্রাণীকে খাওয়ানো না পর্যন্ত FCR-এ যোগ হয় না।'
                        : 'Missing actual feed consumed: No Daily Actual Feed Used records found for this batch.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button: Add Daily Record */}
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span>{isBn ? 'স্যাম্পল ওজন বা দৈনিক রেকর্ড দিন' : 'Enter Sample Weight or Daily Record'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFeedPurchaseModalOpen(true)}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Package size={15} />
                  <span>{isBn ? 'খাদ্য ক্রয় / স্টক এন্ট্রি' : 'Add Feed Purchase Stock'}</span>
                </button>
              </div>
            </div>
          )}

          {/* H. NEW FEATURE: PRODUCTION FEED COST ANALYSIS (খাদ্য খরচ ও মাংস উৎপাদন বিশ্লেষণ) */}
          {feedStockSummary && feedStockSummary.avgCostPerKg > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Coins size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                      {isBn ? 'খাদ্য ব্যয় ও মাংস উৎপাদন খরচ বিশ্লেষণ' : 'Feed Cost & Production Economics'}
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      {isBn ? 'ক্রয়কৃত খাদ্যের গড় মূল্যের ওপর ভিত্তি করে হিসাব' : 'Calculated from recorded feed purchases'}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ৳ {feedStockSummary.avgCostPerKg} / kg
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-500 block">
                    {isBn ? 'আজ পর্যন্ত ব্যবহৃত খাদ্যের মোট খরচ:' : 'Total Feed Cost Consumed:'}
                  </span>
                  <p className="text-base font-black text-slate-900">
                    ৳ {feedStockSummary.costOfFeedUsedSoFar.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {isBn
                      ? `মোট ব্যবহৃত ${feedStockSummary.totalUsedKg} kg × গড় মূল্য ৳ ${feedStockSummary.avgCostPerKg}`
                      : `${feedStockSummary.totalUsedKg} kg used × ৳ ${feedStockSummary.avgCostPerKg}/kg`}
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-500 block">
                    {isBn ? '১ কেজি ওজন বৃদ্ধিতে খাদ্য খরচ:' : 'Feed Cost per KG Live Gain:'}
                  </span>
                  <p className="text-base font-black text-emerald-700">
                    {feedStockSummary.costPerKgLiveGain !== null ? (
                      `৳ ${feedStockSummary.costPerKgLiveGain.toLocaleString()} / kg`
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold">{isBn ? 'Actual FCR হওয়ার পর বের হবে' : 'Pending FCR'}</span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {feedStockSummary.costPerKgLiveGain !== null
                      ? isBn
                        ? `Actual FCR (${fcrResult.actualFcr?.toFixed(2)}) × ৳ ${feedStockSummary.avgCostPerKg}`
                        : `FCR (${fcrResult.actualFcr?.toFixed(2)}) × ৳ ${feedStockSummary.avgCostPerKg}`
                      : isBn
                      ? 'FCR হিসাব সম্পন্ন হলে কেজি প্রতি মাংসের খরচ দেখা যাবে'
                      : 'Requires calculated FCR'}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 pt-0.5">
                💡 {isBn
                  ? 'টিপস: বাজারে ১ কেজি ব্রয়লারের বিক্রয়মূল্য থেকে এই খাদ্য খরচ এবং বাচ্চা ও ওষুধের আনুমানিক খরচ বাদ দিলে প্রতি কেজিতে আপনার প্রকৃত লাভ জানা যাবে।'
                  : 'Compare this feed cost per kg with market live-bird selling price to determine your net profit margin.'}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Modal for entering Daily Actual Record right from FCR screen */}
      {currentBatch && (
        <DailyActualRecordModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          selectedBatch={currentBatch}
          onRecordSaved={() => {
            refreshAllData();
            toast.success(isBn ? 'দৈনিক রেকর্ড সংরক্ষণ করা হয়েছে!' : 'Daily record saved!');
          }}
        />
      )}

      {/* Modal for entering Quick Feed Stock Purchase */}
      {currentBatch && (
        <QuickFeedPurchaseModal
          isOpen={isFeedPurchaseModalOpen}
          onClose={() => setIsFeedPurchaseModalOpen(false)}
          batchId={currentBatch.id}
          batchName={currentBatch.batchName}
          farmType={currentBatch.farmType}
          onSuccess={() => {
            refreshAllData();
          }}
        />
      )}
    </div>
  );
}
