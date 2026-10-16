/**
 * DEDICATED FCR VIEW (STRICT BATCH SCOPING & PERIOD-BASED CALCULATION)
 * 
 * Strict User Requirements:
 * 1. Batch age increases by 1 day automatically from startDate.
 * 2. If a batch is 13 or 18 days old and farmer enters 340 kg or 750 kg feed,
 *    it is treated as the TOTAL cumulative feed consumed up to that age,
 *    NOT a 1-day consumption, and NOT auto-accumulated with arbitrary daily records.
 * 3. Shows starting birds count, total mortality to date, and living birds.
 *    Mortality entries reduce the living flock count immediately.
 * 4. Feed stock / purchase is strictly inventory and NEVER treated as consumed feed.
 * 5. When day passes (e.g. Day 18 -> Day 19), today's FCR is BLANK / waiting for new entry.
 * 6. Stock runway calculates how many days feed will last considering that birds
 *    consume progressively more feed each day as they grow older.
 * 7. Impossible input sanity checks alert the farmer (e.g. 10 kg bird at Day 1,
 *    unrealistic feed amounts, etc.).
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
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Lock,
  Plus,
  RefreshCw,
  TrendingUp,
  Info,
  Package,
  Clock,
  Coins,
  Sparkles,
  AlertCircle,
  Check,
  Trash2,
  ChevronDown,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { admobService } from '../services/admobService';
import {
  FarmCategory,
  SUPPORTED_BREEDS,
  BatchIdentifier,
  DailyActualRecord
} from '../types/fcrTypes';
import {
  calculateStrictBatchFcr,
  getBreedBenchmark
} from '../utils/fcrCalculationEngine';
import { calculateBatchAgeFromStartDate } from '../utils/fcrBatchScope';
import {
  calculateProgressiveFeedForecast,
  toBnDigits
} from '../utils/feedStockCalculations';
import {
  fetchBatchDailyRecords,
  saveDailyActualRecord,
  deleteDailyActualRecord
} from '../services/dailyRecordService';
import { demoStore } from '../utils/demoStore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, fastGetDocs } from '../firebase';

function normalizeCategorySubBreed(farmType: FarmCategory, rawBreed?: string): string {
  const b = String(rawBreed || '').toLowerCase().trim();
  if (farmType === 'cattle') {
    if (b.includes('goat') || b.includes('ছাগল') || b.includes('খাসি')) return 'goat';
    if (b.includes('sheep') || b.includes('ভেড়া') || b.includes('ভেড়া') || b.includes('গাড়ল')) return 'sheep';
    if (b.includes('buffalo') || b.includes('মহিষ')) return 'buffalo';
    if (b.includes('dairy') || b.includes('গাভী') || b.includes('দুধ') || b.includes('cow')) return 'dairy';
    return 'fattening';
  }
  if (farmType === 'fish') {
    if (b.includes('carp') || b.includes('রুই') || b.includes('কাতলা')) return 'carp';
    if (b.includes('pangash') || b.includes('পাঙ্গাস')) return 'pangash';
    if (b.includes('shing') || b.includes('pabda') || b.includes('শিং') || b.includes('পাবদা')) return 'shing_pabda';
    if (b.includes('mixed') || b.includes('মিশ্র')) return 'mixed';
    return 'telapia';
  }
  // Poultry
  if (b.includes('layer') || b.includes('লেয়ার') || b.includes('লেয়ার')) return 'layer';
  if (b.includes('sonali') || b.includes('সোনালী') || b.includes('সোনালি')) return 'sonali';
  if (b.includes('deshi') || b.includes('দেশি') || b.includes('দেশী')) return 'deshi';
  if (b.includes('duck') || b.includes('হাঁস') || b.includes('হাস')) return 'duck';
  if (b.includes('quail') || b.includes('কোয়েল') || b.includes('কোয়েল')) return 'quail';
  if (b.includes('turkey') || b.includes('টার্কি')) return 'turkey';
  if (b.includes('pigeon') || b.includes('কবুতর')) return 'pigeon';
  return 'broiler';
}

export default function FCR() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, isDemoUser } = useAuth();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // ------------------------------------------------------------
  // 1. HIERARCHICAL SCOPE SELECTION
  // Category -> Breed -> Batch
  // ------------------------------------------------------------
  const [selectedCategory, setSelectedCategory] = useState<FarmCategory>(() => {
    const saved = localStorage.getItem('selected_farm_type') as FarmCategory | null;
    return (saved === 'poultry' || saved === 'cattle' || saved === 'fish') ? saved : 'poultry';
  });
  const [selectedBreed, setSelectedBreed] = useState<string>(() => {
    const savedType = localStorage.getItem('selected_farm_type') as FarmCategory | null;
    if (savedType === 'cattle') return 'fattening';
    if (savedType === 'fish') return 'telapia';
    return 'broiler';
  });
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  const [batches, setBatches] = useState<BatchIdentifier[]>([]);
  const [feedPurchases, setFeedPurchases] = useState<any[]>([]);
  const [mortalityRecords, setMortalityRecords] = useState<any[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyActualRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isFcrModalOpen, setIsFcrModalOpen] = useState<boolean>(false);

  // ------------------------------------------------------------
  // 2. LOAD DATA
  // ------------------------------------------------------------
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isDemoUser) {
        const demoBatches = demoStore.getBatches();
        const mappedBatches: BatchIdentifier[] = (demoBatches || []).map((b: any) => {
          const fType = (b.farmType || 'poultry') as FarmCategory;
          return {
            id: b.id,
            userId: b.userId || 'demo',
            batchName: b.batchName || b.name || 'Batch',
            farmType: fType,
            subBreed: normalizeCategorySubBreed(fType, b.subBreed || b.breed),
            startDate: b.startDate || new Date().toISOString().split('T')[0],
            totalChicks: Number(b.totalChicks || b.initialCount || b.birdCount || 1000),
            costPerChick: Number(b.costPerChick || 55),
            status: b.status === 'completed' ? 'completed' : 'active',
            bagWeightKg: Number(b.bagWeightKg || 50)
          };
        });
        setBatches(mappedBatches);

        const demoFeed = demoStore.getFeedRecords();
        setFeedPurchases(demoFeed || []);

        const demoMort = demoStore.getMortalityRecords();
        setMortalityRecords(demoMort || []);
      } else if (currentUser) {
        // Fetch batches
        const bq = query(collection(db, 'batches'), where('userId', '==', currentUser.uid));
        const bsnap = await fastGetDocs(bq);
        const mappedBatches: BatchIdentifier[] = bsnap.docs.map(d => {
          const data = d.data();
          const fType = (data.farmType || 'poultry') as FarmCategory;
          return {
            id: d.id,
            userId: data.userId || currentUser.uid,
            batchName: data.batchName || data.name || 'Batch',
            farmType: fType,
            subBreed: normalizeCategorySubBreed(fType, data.subBreed || data.breed),
            startDate: data.startDate || new Date().toISOString().split('T')[0],
            totalChicks: Number(data.totalChicks || data.initialCount || data.birdCount || 1000),
            costPerChick: Number(data.costPerChick || 55),
            status: data.status === 'completed' ? 'completed' : 'active',
            bagWeightKg: Number(data.bagWeightKg || 50)
          };
        });
        setBatches(mappedBatches);

        // Fetch feed records
        const fq = query(collection(db, 'feed_records'), where('userId', '==', currentUser.uid));
        const fsnap = await fastGetDocs(fq);
        setFeedPurchases(fsnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch mortality records from Mortality Management
        const mq = query(collection(db, 'mortality'), where('userId', '==', currentUser.uid));
        const msnap = await fastGetDocs(mq);
        setMortalityRecords(msnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      console.error('Error loading FCR initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isDemoUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync batchId from URL params if present
  useEffect(() => {
    const paramBatchId = searchParams.get('batchId');
    if (paramBatchId && batches.length > 0) {
      const match = batches.find(b => b.id === paramBatchId);
      if (match) {
        setSelectedCategory(match.farmType);
        setSelectedBreed(match.subBreed);
        setSelectedBatchId(match.id);
      }
    }
  }, [searchParams, batches]);

  // Filter batches for current Category & Breed
  const availableBatches = useMemo(() => {
    return batches.filter(
      b => b.farmType === selectedCategory && b.subBreed === selectedBreed
    );
  }, [batches, selectedCategory, selectedBreed]);

  // Strictly bind currentBatch ONLY to availableBatches so other category batches never leak
  const currentBatch = useMemo(() => {
    if (!selectedBatchId) return null;
    return availableBatches.find(b => b.id === selectedBatchId) || null;
  }, [availableBatches, selectedBatchId]);

  // Auto select first batch if available, or reset to empty if none found
  useEffect(() => {
    if (availableBatches.length > 0) {
      if (!selectedBatchId || !availableBatches.some(b => b.id === selectedBatchId)) {
        setSelectedBatchId(availableBatches[0].id);
      }
    } else {
      setSelectedBatchId('');
    }
  }, [availableBatches, selectedBatchId]);

  // Load daily & FCR records for selected batch
  const loadBatchRecords = useCallback(async () => {
    if (!currentBatch) {
      setDailyRecords([]);
      return;
    }
    const recs = await fetchBatchDailyRecords(
      currentBatch.id,
      currentUser?.uid || 'demo',
      isDemoUser
    );
    setDailyRecords(recs);
  }, [currentBatch, currentUser, isDemoUser]);

  useEffect(() => {
    loadBatchRecords();
  }, [loadBatchRecords]);

  // Mortality for currently selected batch from Mortality Management records
  const currentBatchMortality = useMemo(() => {
    if (!currentBatch) return 0;
    return mortalityRecords
      .filter(m => m.batchId === currentBatch.id)
      .reduce((sum, m) => sum + (Number(m.count) || 0), 0);
  }, [currentBatch, mortalityRecords]);

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // 3. FCR CALCULATION RESULT
  // ------------------------------------------------------------
  const fcrResult = useMemo(() => {
    if (!currentBatch) return null;
    return calculateStrictBatchFcr(currentBatch, dailyRecords, currentBatchMortality);
  }, [currentBatch, dailyRecords, currentBatchMortality]);

  // ------------------------------------------------------------
  // DYNAMIC ANIMAL TERMINOLOGY (POULTRY vs CATTLE vs FISH)
  // ------------------------------------------------------------
  const animalTerms = useMemo(() => {
    const cat = currentBatch?.farmType || selectedCategory;
    const breed = (currentBatch?.subBreed || selectedBreed || '').toLowerCase();

    if (cat === 'cattle') {
      if (breed === 'goat') {
        return {
          category: 'cattle',
          breed,
          animalName: isBn ? 'ছাগল' : 'Goat',
          countUnit: isBn ? 'টি ছাগল' : 'goats',
          youngName: isBn ? 'ছাগলছানা' : 'Kid',
          ageLabel: isBn ? 'ছাগলের বয়স (দিন)' : 'Goat Age (Days)',
          sampleLabel: isBn ? 'স্যাম্পল ছাগলের ওজন পরিমাপ' : 'Sample Goat Weighing',
          sampleCountPrompt: isBn ? 'কতটি ছাগল মেপেছেন?' : 'Number of Goats Weighed',
          sampleWeightPlaceholder: isBn ? 'যেমন: ২০' : 'e.g. 20',
          liveLabel: isBn ? 'বর্তমানে জীবিত ছাগল' : 'Current Alive Goats',
          initialCountLabel: isBn ? 'শুরুর সংখ্যা' : 'Initial Stock',
          defaultUnit: 'kg' as const,
          weightUnitName: isBn ? 'কেজি' : 'kg',
          benchmarkName: isBn ? 'ছাগল/খাসির' : 'Goat',
          weighingNote: isBn ? 'টি ছাগল' : 'goats',
          defaultSampleCount: '1',
          avgWeightDisplay: (gram: number, kg: number) => `${kg} কেজি`,
        };
      }
      if (breed === 'sheep') {
        return {
          category: 'cattle',
          breed,
          animalName: isBn ? 'ভেড়া' : 'Sheep',
          countUnit: isBn ? 'টি ভেড়া' : 'sheep',
          youngName: isBn ? 'ভেড়ার বাচ্চা' : 'Lamb',
          ageLabel: isBn ? 'ভেড়ার বয়স (দিন)' : 'Sheep Age (Days)',
          sampleLabel: isBn ? 'স্যাম্পল ভেড়ার ওজন পরিমাপ' : 'Sample Sheep Weighing',
          sampleCountPrompt: isBn ? 'কতটি ভেড়া মেপেছেন?' : 'Number of Sheep Weighed',
          sampleWeightPlaceholder: isBn ? 'যেমন: ২৫' : 'e.g. 25',
          liveLabel: isBn ? 'বর্তমানে জীবিত ভেড়া' : 'Current Alive Sheep',
          initialCountLabel: isBn ? 'শুরুর সংখ্যা' : 'Initial Stock',
          defaultUnit: 'kg' as const,
          weightUnitName: isBn ? 'কেজি' : 'kg',
          benchmarkName: isBn ? 'ভেড়ার' : 'Sheep',
          weighingNote: isBn ? 'টি ভেড়া' : 'sheep',
          defaultSampleCount: '1',
          avgWeightDisplay: (gram: number, kg: number) => `${kg} কেজি`,
        };
      }
      if (breed === 'buffalo') {
        return {
          category: 'cattle',
          breed,
          animalName: isBn ? 'মহিষ' : 'Buffalo',
          countUnit: isBn ? 'টি মহিষ' : 'buffaloes',
          youngName: isBn ? 'মহিষের বাছুর' : 'Calf',
          ageLabel: isBn ? 'মহিষের বয়স (দিন)' : 'Buffalo Age (Days)',
          sampleLabel: isBn ? 'স্যাম্পল মহিষের ওজন পরিমাপ' : 'Sample Buffalo Weighing',
          sampleCountPrompt: isBn ? 'কতটি মহিষ মেপেছেন?' : 'Number of Buffaloes Weighed',
          sampleWeightPlaceholder: isBn ? 'যেমন: ২৫০' : 'e.g. 250',
          liveLabel: isBn ? 'বর্তমানে জীবিত মহিষ' : 'Current Alive Buffaloes',
          initialCountLabel: isBn ? 'শুরুর সংখ্যা' : 'Initial Stock',
          defaultUnit: 'kg' as const,
          weightUnitName: isBn ? 'কেজি' : 'kg',
          benchmarkName: isBn ? 'মহিষের' : 'Buffalo',
          weighingNote: isBn ? 'টি মহিষ' : 'buffaloes',
          defaultSampleCount: '1',
          avgWeightDisplay: (gram: number, kg: number) => `${kg} কেজি`,
        };
      }
      if (breed === 'dairy') {
        return {
          category: 'cattle',
          breed,
          animalName: isBn ? 'গাভী' : 'Dairy Cow',
          countUnit: isBn ? 'টি গাভী' : 'cows',
          youngName: isBn ? 'বাছুর' : 'Calf',
          ageLabel: isBn ? 'গাভীর বয়স (দিন)' : 'Cow Age (Days)',
          sampleLabel: isBn ? 'স্যাম্পল গাভীর ওজন পরিমাপ' : 'Sample Cow Weighing',
          sampleCountPrompt: isBn ? 'কতটি গাভী মেপেছেন?' : 'Number of Cows Weighed',
          sampleWeightPlaceholder: isBn ? 'যেমন: ৩০০' : 'e.g. 300',
          liveLabel: isBn ? 'বর্তমানে জীবিত গাভী' : 'Current Alive Cows',
          initialCountLabel: isBn ? 'শুরুর সংখ্যা' : 'Initial Stock',
          defaultUnit: 'kg' as const,
          weightUnitName: isBn ? 'কেজি' : 'kg',
          benchmarkName: isBn ? 'ডেইরি গাভীর' : 'Dairy Cow',
          weighingNote: isBn ? 'টি গাভী' : 'cows',
          defaultSampleCount: '1',
          avgWeightDisplay: (gram: number, kg: number) => `${kg} কেজি`,
        };
      }
      // Beef fattening (ষাঁড় / গরু মোটাতাজাকরণ)
      return {
        category: 'cattle',
        breed,
        animalName: isBn ? 'গরু' : 'Cattle',
        countUnit: isBn ? 'টি গরু' : 'cattle',
        youngName: isBn ? 'বাছুর' : 'Calf',
        ageLabel: isBn ? 'গরুর বয়স (দিন)' : 'Cattle Age (Days)',
        sampleLabel: isBn ? 'স্যাম্পল গরুর ওজন পরিমাপ' : 'Sample Cattle Weighing',
        sampleCountPrompt: isBn ? 'কতটি গরু মেপেছেন?' : 'Number of Cattle Weighed',
        sampleWeightPlaceholder: isBn ? 'যেমন: ১৮০' : 'e.g. 180',
        liveLabel: isBn ? 'বর্তমানে জীবিত গরু' : 'Current Alive Cattle',
        initialCountLabel: isBn ? 'শুরুর সংখ্যা' : 'Initial Stock',
        defaultUnit: 'kg' as const,
        weightUnitName: isBn ? 'কেজি' : 'kg',
        benchmarkName: isBn ? 'গরু মোটাতাজাকরণের' : 'Cattle Fattening',
        weighingNote: isBn ? 'টি গরু' : 'cattle',
        defaultSampleCount: '1',
        avgWeightDisplay: (gram: number, kg: number) => `${kg} কেজি`,
      };
    }

    if (cat === 'fish') {
      let fishType = isBn ? 'মাছ' : 'Fish';
      if (breed === 'telapia') fishType = isBn ? 'তেলাপিয়া মাছ' : 'Tilapia';
      else if (breed === 'carp') fishType = isBn ? 'রুই/কার্প মাছ' : 'Carp';
      else if (breed === 'pangash') fishType = isBn ? 'পাঙ্গাস মাছ' : 'Pangash';
      else if (breed === 'shing_pabda') fishType = isBn ? 'শিং/পাবদা মাছ' : 'Catfish';
      else if (breed === 'mixed') fishType = isBn ? 'মিশ্র মাছ' : 'Mixed Fish';

      return {
        category: 'fish',
        breed,
        animalName: fishType,
        countUnit: isBn ? 'টি মাছ' : 'fish',
        youngName: isBn ? 'পোনা মাছ' : 'Fingerling',
        ageLabel: isBn ? 'চাষের বয়স (দিন)' : 'Culture Age (Days)',
        sampleLabel: isBn ? 'স্যাম্পল মাছের ওজন পরিমাপ' : 'Sample Fish Weighing',
        sampleCountPrompt: isBn ? 'কতটি মাছ মেপেছেন?' : 'Number of Fish Sampled',
        sampleWeightPlaceholder: isBn ? 'যেমন: ২.৫' : 'e.g. 2.5',
        liveLabel: isBn ? 'বর্তমানে জীবিত মাছ' : 'Current Live Fish',
        initialCountLabel: isBn ? 'পোনা ছাড়ার সংখ্যা' : 'Fingerlings Stocked',
        defaultUnit: 'g' as const,
        weightUnitName: isBn ? 'গ্রাম' : 'g',
        benchmarkName: fishType,
        weighingNote: isBn ? 'টি মাছ' : 'fish',
        defaultSampleCount: '10',
        avgWeightDisplay: (gram: number, kg: number) => gram >= 1000 ? `${kg} কেজি` : `${gram} গ্রাম`,
      };
    }

    // Default Poultry (মুরগি / হাঁস / পাখি)
    let birdType = isBn ? 'মুরগি' : 'Chicken';
    if (breed === 'duck') birdType = isBn ? 'হাঁস' : 'Duck';
    else if (breed === 'quail') birdType = isBn ? 'কোয়েল' : 'Quail';
    else if (breed === 'turkey') birdType = isBn ? 'টার্কি' : 'Turkey';
    else if (breed === 'pigeon') birdType = isBn ? 'কবুতর' : 'Pigeon';
    else if (breed === 'sonali') birdType = isBn ? 'সোনালী মুরগি' : 'Sonali';
    else if (breed === 'layer') birdType = isBn ? 'লেয়ার মুরগি' : 'Layer';
    else if (breed === 'deshi') birdType = isBn ? 'দেশি মুরগি' : 'Local Chicken';
    else if (breed === 'broiler') birdType = isBn ? 'ব্রয়লার মুরগি' : 'Broiler';

    return {
      category: 'poultry',
      breed,
      animalName: birdType,
      countUnit: isBn ? 'টি পাখি' : 'birds',
      youngName: isBn ? 'বাচ্চা' : 'Chick',
      ageLabel: isBn ? `${birdType}-র বয়স (দিন)` : `${birdType} Age (Days)`,
      sampleLabel: isBn ? `স্যাম্পল ${birdType}-র ওজন পরিমাপ` : `Sample ${birdType} Weighing`,
      sampleCountPrompt: isBn ? `কতটি ${birdType} মেপেছেন?` : `Number of ${birdType} Weighed`,
      sampleWeightPlaceholder: isBn ? 'যেমন: ৯.৫' : 'e.g. 9.5',
      liveLabel: isBn ? 'বর্তমানে জীবিত পাখি' : 'Current Alive Flock',
      initialCountLabel: isBn ? 'শুরুর সংখ্যা' : 'Initial Count',
      defaultUnit: 'kg' as const,
      weightUnitName: isBn ? 'গ্রাম' : 'g',
      benchmarkName: birdType,
      weighingNote: isBn ? 'টি পাখি' : 'birds',
      defaultSampleCount: '10',
      avgWeightDisplay: (gram: number, kg: number) => `${gram} গ্রাম (${kg} কেজি)`,
    };
  }, [currentBatch, selectedCategory, selectedBreed, isBn]);

  // ------------------------------------------------------------
  // 4. REAL FEED STOCK & PROGRESSIVE RUNWAY
  // ------------------------------------------------------------
  const feedStockSummary = useMemo(() => {
    if (!currentBatch || !fcrResult) return null;
    const bagWeight = Number(currentBatch.bagWeightKg || 50);

    // Purchased stock
    const purchasedBags = feedPurchases.reduce((sum, record) => {
      if (record.batchId !== currentBatch.id) return sum;
      if (record.recordType === 'actual_consumed') return sum;
      const bags = Number(record.quantityBags || 0);
      return sum + (Number.isFinite(bags) && bags > 0 ? bags : 0);
    }, 0);

    const totalCostSpent = feedPurchases.reduce((sum, record) => {
      if (record.batchId !== currentBatch.id) return sum;
      if (record.recordType === 'actual_consumed') return sum;
      const cost = Number(record.cost || 0);
      return sum + (Number.isFinite(cost) && cost > 0 ? cost : 0);
    }, 0);

    const totalPurchasedKg = purchasedBags * bagWeight;

    // Actual feed consumed up to date (from FCR result)
    const totalUsedKg = fcrResult.totalActualFeedUsedKg;
    const remainingKg = Math.max(0, totalPurchasedKg - totalUsedKg);
    const remainingBags = bagWeight > 0 ? Number((remainingKg / bagWeight).toFixed(1)) : 0;

    // Progressive Runway calculation considering progressive feed requirement as animals grow older
    const forecast = calculateProgressiveFeedForecast({
      aliveCount: fcrResult.currentLiveCount,
      currentAgeDays: fcrResult.batchAgeDays,
      remainingStockKg: remainingKg,
      bagWeightKg: bagWeight,
      sector: currentBatch.farmType,
      birdType: currentBatch.subBreed as any,
      batchName: currentBatch.batchName
    });

    const avgCostPerKg = totalPurchasedKg > 0 && totalCostSpent > 0 ? totalCostSpent / totalPurchasedKg : 62;
    const costOfFeedUsedSoFar = Math.round(totalUsedKg * avgCostPerKg);
    const costPerKgLiveGain = fcrResult.actualFcr && fcrResult.actualFcr > 0 ? Math.round(fcrResult.actualFcr * avgCostPerKg) : null;

    return {
      bagWeight,
      purchasedBags,
      totalPurchasedKg,
      totalUsedKg,
      remainingKg,
      remainingBags,
      daysRunway: forecast.daysStockWillLast,
      stockRunsOutAtFlockAge: forecast.stockRunsOutAtFlockAge,
      totalCostSpent,
      avgCostPerKg: Math.round(avgCostPerKg),
      costOfFeedUsedSoFar,
      costPerKgLiveGain,
      forecastStatus: forecast.status
    };
  }, [currentBatch, fcrResult, feedPurchases]);

  // ------------------------------------------------------------
  // 5. FCR MEASUREMENT MODAL FORM STATE
  // ------------------------------------------------------------
  const [formAgeDays, setFormAgeDays] = useState<number>(1);
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formFeedMode, setFormFeedMode] = useState<'kg' | 'bag'>('kg');
  const [formFeedAmount, setFormFeedAmount] = useState<string>('');
  const [formSampleCount, setFormSampleCount] = useState<string>('10');
  const [formSampleTotalWeight, setFormSampleTotalWeight] = useState<string>('');
  const [formSampleUnit, setFormSampleUnit] = useState<'kg' | 'g'>('kg');
  const [formNotes, setFormNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Open modal with current batch defaults
  const handleOpenFcrModal = () => {
    if (!currentBatch) {
      toast.error(isBn ? 'আগে একটি ব্যাচ নির্বাচন করুন' : 'Please select a batch first');
      return;
    }
    const calculatedAge = calculateBatchAgeFromStartDate(currentBatch.startDate);
    setFormAgeDays(calculatedAge);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormSampleUnit(animalTerms.defaultUnit);
    setFormSampleCount(animalTerms.defaultSampleCount);

    // If there is an existing measurement for this age, prefill it for editing
    const existingRec = dailyRecords.find(r => r.batchAgeDays === calculatedAge);
    if (existingRec) {
      setFormFeedAmount(existingRec.actualFeedUsedKg ? String(existingRec.actualFeedUsedKg) : '');
      setFormSampleCount(existingRec.weightSampleCount ? String(existingRec.weightSampleCount) : animalTerms.defaultSampleCount);
      setFormSampleTotalWeight(existingRec.totalSampleWeightKg ? String(existingRec.totalSampleWeightKg) : '');
      if (existingRec.weightInputUnit) {
        setFormSampleUnit(existingRec.weightInputUnit);
      }
    } else {
      // Suggest previous cumulative feed if any
      const prevRecords = dailyRecords.filter(r => r.actualFeedUsedKg && Number(r.actualFeedUsedKg) > 0);
      if (prevRecords.length > 0) {
        setFormFeedAmount(String(prevRecords[0].actualFeedUsedKg));
      } else {
        setFormFeedAmount('');
      }
      setFormSampleTotalWeight('');
    }
    setIsFcrModalOpen(true);
  };

  // Real-time sanity calculations inside modal
  const modalSanity = useMemo(() => {
    const birds = Number(formSampleCount || 0);
    const weightVal = Number(formSampleTotalWeight || 0);
    const bagWeight = Number(currentBatch?.bagWeightKg || 50);

    let totalFeedKg = Number(formFeedAmount || 0);
    if (formFeedMode === 'bag') {
      totalFeedKg = totalFeedKg * bagWeight;
    }

    let avgWeightGram = 0;
    let avgWeightKg = 0;

    if (birds > 0 && weightVal > 0) {
      if (formSampleUnit === 'kg') {
        avgWeightGram = Math.round((weightVal * 1000) / birds);
        avgWeightKg = Number((weightVal / birds).toFixed(3));
      } else {
        avgWeightGram = Math.round(weightVal / birds);
        avgWeightKg = Number(((weightVal / birds) / 1000).toFixed(3));
      }
    }

    let warningMessage = '';

    // Category-specific sanity checks
    if (animalTerms.category === 'cattle') {
      if (animalTerms.breed === 'goat' || animalTerms.breed === 'sheep') {
        if (avgWeightKg > 150) {
          warningMessage = isBn
            ? `ছাগল/ভেড়ার গড় ওজন সাধারণত ৫ – ৬০ কেজি হয়। এখানে ${avgWeightKg.toFixed(1)} কেজি দেওয়া হয়েছে, যা যাচাই করা দরকার!`
            : `Goat/sheep average weight is usually 5-60 kg. Entered ${avgWeightKg.toFixed(1)} kg seems high!`;
        }
      } else {
        if (avgWeightKg > 1800) {
          warningMessage = isBn
            ? `গরু/মহিষের গড় ওজন সাধারণত ১০০ – ৮০০ কেজি হয়। এখানে ${avgWeightKg.toFixed(1)} কেজি দেওয়া হয়েছে, যা যাচাই করা দরকার!`
            : `Cattle average weight entered is ${avgWeightKg.toFixed(1)} kg, which seems unusually high!`;
        }
      }
    } else if (animalTerms.category === 'fish') {
      if (avgWeightGram > 25000) {
        warningMessage = isBn
          ? `মাছের গড় ওজন ${(avgWeightGram / 1000).toFixed(1)} কেজি দেওয়া হয়েছে, যা অস্বাভাবিক মনে হচ্ছে!`
          : `Fish average weight seems unusually high!`;
      }
    } else {
      // Poultry
      if (formAgeDays <= 5 && avgWeightGram > 250) {
        warningMessage = isBn
          ? `১-৫ দিনের বাচ্চার ওজন সাধারণত ৪০-১০০ গ্রাম হয়। এখানে গড় ওজন ${avgWeightGram} গ্রাম দেওয়া হয়েছে, যা অবাস্তব বা ভুল হতে পারে!`
          : `At age 1-5 days, chick weight is usually 40-100g. Entered ${avgWeightGram}g seems unrealistic!`;
      } else if (formAgeDays <= 30 && avgWeightGram > 4500) {
        warningMessage = isBn
          ? `৩০ দিনের মধ্যে ব্রয়লারের গড় ওজন ${(avgWeightGram/1000).toFixed(1)} কেজি হওয়া অসম্ভব!`
          : `Average weight ${(avgWeightGram/1000).toFixed(1)} kg at 30 days is impossible!`;
      }

      // Check feed per bird for poultry
      const liveFlock = Math.max(1, (currentBatch?.totalChicks || 1000) - currentBatchMortality);
      if (totalFeedKg > 0 && liveFlock > 0) {
        const feedPerBirdKg = totalFeedKg / liveFlock;
        if (formAgeDays <= 14 && feedPerBirdKg > 2.5) {
          warningMessage = isBn
            ? `প্রতিটি বাচ্চার গড় খাবার পড়েছে ${feedPerBirdKg.toFixed(2)} কেজি, যা ${formAgeDays} দিনের বাচ্চার জন্য অসম্ভব রকমের বেশি!`
            : `Feed per bird is ${feedPerBirdKg.toFixed(2)} kg, which is impossibly high for age ${formAgeDays}!`;
        }
      }
    }

    return {
      avgWeightGram,
      avgWeightKg,
      totalFeedKg,
      warningMessage
    };
  }, [formSampleCount, formSampleTotalWeight, formSampleUnit, formFeedAmount, formFeedMode, formAgeDays, currentBatch, currentBatchMortality, animalTerms, isBn]);

  // Handle Save FCR Entry
  const handleSaveFcrEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBatch) return;

    const birds = Number(formSampleCount || 0);
    const sampleWeight = Number(formSampleTotalWeight || 0);
    if (birds <= 0 || sampleWeight <= 0) {
      toast.error(isBn ? `স্যাম্পল ${animalTerms.animalName}-র সংখ্যা ও মোট ওজন সঠিকভাবে দিন` : 'Enter valid sample count and weight');
      return;
    }

    const bagWeight = Number(currentBatch.bagWeightKg || 50);
    let feedKg = Number(formFeedAmount || 0);
    let feedBags = 0;
    if (formFeedMode === 'bag') {
      feedBags = feedKg;
      feedKg = feedKg * bagWeight;
    } else {
      feedBags = Number((feedKg / bagWeight).toFixed(2));
    }

    if (feedKg <= 0) {
      toast.error(isBn ? 'শুরু থেকে এই বয়স পর্যন্ত মোট খাবার (কেজি বা বস্তা) দিন' : 'Enter valid total feed consumed');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentLive = Math.max(0, currentBatch.totalChicks - currentBatchMortality);

      const recordId = `fcr_${currentBatch.id}_day${formAgeDays}`;
      const newRecord: DailyActualRecord = {
        id: recordId,
        userId: currentUser?.uid || 'demo',
        batchId: currentBatch.id,
        date: formDate,
        batchAgeDays: formAgeDays,
        openingLiveCount: currentBatch.totalChicks,
        todayMortality: null, // Mortality is recorded strictly in Mortality Management
        totalMortalityToDate: currentBatchMortality,
        currentLiveCount: currentLive,
        feedInputMode: formFeedMode,
        actualFeedUsedKg: feedKg,
        actualFeedUsedBags: feedBags,
        bagWeightKgUsed: bagWeight,
        cumulativeActualFeedUsedKg: feedKg,
        feedEntryType: 'cumulative',
        isFcrMeasurement: true,
        sanityWarning: modalSanity.warningMessage || undefined,
        weightSampleCount: birds,
        totalSampleWeightKg: formSampleUnit === 'kg' ? sampleWeight : sampleWeight / 1000,
        weightInputUnit: formSampleUnit,
        avgWeightGram: modalSanity.avgWeightGram,
        avgWeightKg: modalSanity.avgWeightKg,
        notes: formNotes,
        createdAt: new Date().toISOString()
      };

      await saveDailyActualRecord(newRecord, isDemoUser);
      toast.success(isBn ? `${formAgeDays} দিনের FCR পরিমাপ সফলভাবে সংরক্ষিত হয়েছে!` : `Day ${formAgeDays} FCR record saved!`);
      setIsFcrModalOpen(false);
      await loadBatchRecords();
      admobService.showInterstitialIfEligible('action:saved_fcr', true);
    } catch (err) {
      console.error('Error saving FCR entry:', err);
      toast.error(isBn ? 'সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete an old measurement
  const handleDeleteRecord = async (rec: DailyActualRecord) => {
    if (!window.confirm(isBn ? 'আপনি কি নিশ্চিতভাবে এই পরিমাপটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this record?')) {
      return;
    }
    try {
      await deleteDailyActualRecord(rec.id, rec.batchId, rec.date, isDemoUser);
      toast.success(isBn ? 'পরিমাপ মুছে ফেলা হয়েছে' : 'Record deleted');
      await loadBatchRecords();
    } catch (err) {
      toast.error(isBn ? 'মুছতে ব্যর্থ হয়েছে' : 'Failed to delete');
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* ------------------------------------------------------------ */}
      {/* TOP PAGE HEADER CARD */}
      {/* ------------------------------------------------------------ */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition shrink-0"
            title={isBn ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {isBn ? 'FCR হিসাব ও রূপান্তর হার' : 'Feed Conversion Ratio (FCR)'}
            </h1>
            <p className="text-[11px] text-slate-500">
              {isBn
                ? 'পোল্ট্রি, গবাদি পশু ও মাছের জাতভিত্তিক খাঁটি FCR ও খাদ্য স্টক বিশ্লেষণ'
                : 'Scientific FCR calculation & feed stock analysis'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBatchRecords}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200 text-xs flex items-center gap-1 font-bold"
            title={isBn ? 'রিফ্রেশ' : 'Refresh'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
          {currentBatch && (
            <button
              onClick={handleOpenFcrModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isBn ? 'FCR তথ্য এন্ট্রি' : 'Add Measurement'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* ------------------------------------------------------------ */}
        {/* STEP 1: CATEGORY -> BREED -> BATCH SELECTOR */}
        {/* ------------------------------------------------------------ */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isBn ? 'ধাপ ১: খামারের ধরন ও ব্যাচ নির্বাচন' : 'Step 1: Category & Batch Selection'}
            </span>
            <span className="text-xs text-slate-500">
              {isBn ? 'অন্যান্য ব্যাচের তথ্যের সাথে মিশে যাওয়া সম্পূর্ণ সুরক্ষিত' : 'Strict batch isolation enforced'}
            </span>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {(['poultry', 'cattle', 'fish'] as FarmCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  const firstBreed = SUPPORTED_BREEDS[cat][0].code;
                  setSelectedBreed(firstBreed);
                  setSelectedBatchId('');
                }}
                className={`py-2.5 px-3 rounded-lg text-sm font-semibold border transition text-center cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat === 'poultry' && (isBn ? '🐔 পোল্ট্রি খামার' : '🐔 Poultry')}
                {cat === 'cattle' && (isBn ? '🐂 গবাদি পশু' : '🐂 Cattle')}
                {cat === 'fish' && (isBn ? '🐟 মৎস্য খামার' : '🐟 Fish')}
              </button>
            ))}
          </div>

          {/* Breed Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {SUPPORTED_BREEDS[selectedCategory].map(br => (
              <button
                key={br.code}
                onClick={() => {
                  setSelectedBreed(br.code);
                  setSelectedBatchId('');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  selectedBreed === br.code
                    ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{br.icon}</span>
                <span>{isBn ? br.nameBn : br.nameEn}</span>
              </button>
            ))}
          </div>

          {/* Batch Selector */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isBn ? 'সক্রিয় ব্যাচ নির্বাচন করুন' : 'Select Active Batch'}
            </label>
            {availableBatches.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
                <span>
                  {isBn
                    ? 'এই জাতের কোনো ব্যাচ পাওয়া যায়নি। আগে ব্যাচ তৈরি করুন।'
                    : 'No batches found for this breed. Please create a batch first.'}
                </span>
                <button
                  onClick={() => navigate('/batches')}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium cursor-pointer"
                >
                  {isBn ? 'নতুন ব্যাচ' : 'New Batch'}
                </button>
              </div>
            ) : (
              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
              >
                {availableBatches.map(b => {
                  const age = calculateBatchAgeFromStartDate(b.startDate);
                  return (
                    <option key={b.id} value={b.id}>
                      {b.batchName} — {isBn ? `বয়স: ${age} দিন | শুরুর সংখ্যা: ${b.totalChicks} ${animalTerms.countUnit}` : `Age: ${age}d | Total: ${b.totalChicks}`}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>

        {/* EMPTY STATE IF NO ACTIVE BATCH IN SELECTED CATEGORY/BREED */}
        {!currentBatch && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <Scale className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                {isBn 
                  ? 'এই ক্যাটাগরি ও জাতের কোনো সক্রিয় ব্যাচ নেই' 
                  : 'No active batch in this category & breed'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isBn 
                  ? 'অন্য ক্যাটাগরি (পোল্ট্রি, গবাদি পশু, মৎস্য) নির্বাচন করুন অথবা এই জাতের জন্য একটি নতুন ব্যাচ তৈরি করে FCR ও খাদ্য স্টক হিসাব শুরু করুন।' 
                  : 'Switch category/breed or create a new batch to track FCR and feed inventory.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/batches')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? 'নতুন ব্যাচ তৈরি করুন' : 'Create New Batch'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* STEP 2: SELECTED BATCH HERO BANNER & LIVE COUNT */}
        {/* ------------------------------------------------------------ */}
        {currentBatch && fcrResult && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {currentBatch.batchName}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                    {isBn ? 'সক্রিয় ব্যাচ' : 'Active Batch'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>{isBn ? `শুরুর তারিখ: ${currentBatch.startDate}` : `Started: ${currentBatch.startDate}`}</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {isBn ? `বর্তমান বয়স: ${fcrResult.batchAgeDays} দিন` : `Current Age: ${fcrResult.batchAgeDays} days`}
                  </span>
                  <span>•</span>
                  <span>{isBn ? `বস্তা ওজন: ${currentBatch.bagWeightKg || 50} কেজি` : `Bag: ${currentBatch.bagWeightKg || 50}kg`}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenFcrModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'FCR তথ্য এন্ট্রি' : 'Add Measurement'}</span>
                </button>
              </div>
            </div>

            {/* Flock Live Count & Mortality Summary */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl text-center flex flex-col justify-between">
                <span className="block text-[10px] sm:text-xs text-slate-500 font-semibold">{animalTerms.initialCountLabel}</span>
                <span className="text-base sm:text-lg font-black text-slate-800 my-0.5">{currentBatch.totalChicks}</span>
                <span className="text-[10px] sm:text-xs text-slate-400 block">{animalTerms.countUnit}</span>
              </div>

              <div 
                onClick={() => navigate(`/mortality?batchId=${currentBatch.id}`)}
                className="p-2 sm:p-3 bg-rose-50 hover:bg-rose-100/70 transition border border-rose-200 rounded-xl text-center cursor-pointer group flex flex-col justify-between"
                title={isBn ? 'মৃত্যু ব্যবস্থাপনা দেখতে ক্লিক করুন' : 'Click to view Mortality Management'}
              >
                <div>
                  <span className="block text-[10px] sm:text-xs text-rose-600 font-bold leading-tight">{isBn ? 'মোট মৃত্যু' : 'Total Mortality'}</span>
                  <div className="flex items-baseline justify-center gap-1 my-0.5">
                    <span className="text-base sm:text-lg font-black text-rose-700">{fcrResult.totalMortalityToDate}</span>
                    <span className="text-[10px] sm:text-xs text-rose-500 font-semibold">
                      ({currentBatch.totalChicks > 0
                        ? `${((fcrResult.totalMortalityToDate / currentBatch.totalChicks) * 100).toFixed(1)}%`
                        : '0%'})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] sm:text-2xs text-rose-600 group-hover:underline block font-semibold">
                  {isBn ? 'সিঙ্ককৃত (দেখুন →)' : 'Synced (View →)'}
                </span>
              </div>

              <div className="p-2 sm:p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center flex flex-col justify-between">
                <span className="block text-[10px] sm:text-xs text-emerald-700 font-semibold">{animalTerms.liveLabel}</span>
                <span className="text-base sm:text-lg font-black text-emerald-800 my-0.5">{fcrResult.currentLiveCount}</span>
                <span className="text-[10px] sm:text-xs text-emerald-600 block font-medium">{animalTerms.countUnit}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* SANITY WARNING ALERT BANNER */}
        {/* ------------------------------------------------------------ */}
        {fcrResult?.sanityWarning?.isAbnormal && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900">
                {isBn ? 'অস্বাভাবিক ইনপুট সংকেত (Sanity Alert)' : 'Impossible / Abnormal Entry Detected'}
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                {isBn ? fcrResult.sanityWarning.messageBn : fcrResult.sanityWarning.messageEn}
              </p>
              <p className="text-xs text-amber-700 font-medium pt-1">
                {isBn
                  ? `উপরে "FCR তথ্য এন্ট্রি" বোতামে ক্লিক করে স্যাম্পল ${animalTerms.animalName}-র ওজন বা মোট খাবারের পরিমাণ পুনরায় যাচাই ও সংশোধন করুন।`
                  : 'Please check your sample weight or cumulative feed entry to correct unrealistic numbers.'}
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* STEP 3: MAIN FCR CARD (UP-TO-DATE vs AGE-GAP WAITING) */}
        {/* ------------------------------------------------------------ */}
        {currentBatch && fcrResult && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">
                  {isBn ? `${animalTerms.animalName}-র খাদ্য রূপান্তর অনুপাত (FCR) বিশ্লেষণ` : `${animalTerms.animalName} FCR Analysis`}
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-900/80 text-emerald-100 border border-emerald-700/80">
                {isBn ? `স্ট্যান্ডার্ড রেঞ্জ: ${fcrResult.benchmark.idealMin} – ${fcrResult.benchmark.idealMax}` : `Standard: ${fcrResult.benchmark.idealMin} – ${fcrResult.benchmark.idealMax}`}
              </span>
            </div>

            <div className="p-6">
              {/* CASE A: AGE GAP WAITING (Day passed e.g. Day 18 -> Day 19) */}
              {fcrResult.isAgeGapWaiting ? (
                <div className="text-center py-6 px-4 space-y-4 max-w-lg mx-auto">
                  <div className="w-14 h-14 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-slate-900">
                      {isBn ? `আজ ${fcrResult.batchAgeDays}তম দিনের FCR ফাঁকা রয়েছে` : `Day ${fcrResult.batchAgeDays} FCR Pending`}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {isBn
                        ? `সর্বশেষ পরিমাপ নেওয়া হয়েছিল ${fcrResult.latestMeasurementAgeDays} দিন বয়সে (FCR ছিল ${fcrResult.actualFcr || '—'})। ইতিমধ্যে ১ বা একাধিক দিন পার হওয়ায় ${animalTerms.animalName} নতুন খাবার খেয়েছে ও ওজন বেড়েছে। আজ পর্যন্ত মোট খাবার ও স্যাম্পল ${animalTerms.animalName}-র ওজনের তথ্য দিন।`
                        : `Last measurement was on Day ${fcrResult.latestMeasurementAgeDays}. Please enter today's cumulative feed and sample weight.`}
                    </p>
                  </div>

                  <button
                    onClick={handleOpenFcrModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isBn ? `আজ ${fcrResult.batchAgeDays}তম দিনের তথ্য এন্ট্রি দিন` : `Enter Day ${fcrResult.batchAgeDays} Data`}</span>
                  </button>

                  {fcrResult.actualFcr !== null && (
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 text-left">
                      <span className="font-semibold text-slate-700 block mb-1">
                        {isBn ? `পূর্ববর্তী ${fcrResult.latestMeasurementAgeDays} দিনের পরিমাপ সারাংশ:` : `Previous Day ${fcrResult.latestMeasurementAgeDays} Summary:`}
                      </span>
                      <div className="flex items-center justify-between">
                        <span>{isBn ? 'FCR:' : 'FCR:'} <strong>{fcrResult.actualFcr}</strong></span>
                        <span>{isBn ? 'গড় ওজন:' : 'Avg Weight:'} <strong>{animalTerms.category === 'cattle' ? `${fcrResult.latestMeasuredAvgWeightKg} কেজি` : `${fcrResult.latestMeasuredAvgWeightGram} গ্রাম`}</strong></span>
                        <span>{isBn ? 'মোট খাবার:' : 'Total Feed:'} <strong>{fcrResult.totalActualFeedUsedKg} কেজি</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              ) : fcrResult.isCalculable && fcrResult.actualFcr !== null ? (
                /* CASE B: UP-TO-DATE ACTIVE FCR REPORT */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-5 bg-gradient-to-r from-emerald-50 via-slate-50 to-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-center sm:text-left space-y-1">
                      <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                        {isBn ? `বয়স ${fcrResult.batchAgeDays} দিনে নির্ণীত প্রকৃত FCR` : `Actual FCR at Age ${fcrResult.batchAgeDays} Days`}
                      </span>
                      <div className="flex items-baseline gap-3 justify-center sm:justify-start">
                        <span className="text-4xl font-extrabold text-slate-900">
                          {fcrResult.actualFcr}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          fcrResult.rating === 'excellent'
                            ? 'bg-emerald-200 text-emerald-900'
                            : fcrResult.rating === 'good'
                            ? 'bg-emerald-100 text-emerald-800'
                            : fcrResult.rating === 'average'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isBn ? fcrResult.ratingLabelBn : fcrResult.ratingLabelEn}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {isBn ? fcrResult.feedbackBn : fcrResult.feedbackEn}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-center sm:items-end gap-1">
                      <button
                        onClick={handleOpenFcrModal}
                        className="px-3.5 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                      >
                        {isBn ? 'পরিমাপ আপডেট করুন' : 'Edit / Update'}
                      </button>
                      <span className="text-2xs text-slate-400">
                        {isBn ? `পরিমাপের তারিখ: ${fcrResult.latestWeighingDate}` : `Measured on: ${fcrResult.latestWeighingDate}`}
                      </span>
                    </div>
                  </div>

                  {/* 4 Pillars Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-xs text-slate-500 block mb-1">
                        {isBn ? `স্যাম্পল ${animalTerms.animalName}-র গড় ওজন` : `Sample Avg Weight`}
                      </span>
                      <span className="text-xl font-bold text-slate-900">
                        {animalTerms.category === 'cattle' ? (
                          <>{fcrResult.latestMeasuredAvgWeightKg} <span className="text-xs font-normal">কেজি</span></>
                        ) : (
                          <>{fcrResult.latestMeasuredAvgWeightGram} <span className="text-xs font-normal">গ্রাম</span></>
                        )}
                      </span>
                      <span className="text-2xs text-slate-400 block mt-0.5">
                        ({fcrResult.latestMeasuredAvgWeightKg} কেজি/{animalTerms.animalName})
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-xs text-slate-500 block mb-1">
                        {isBn ? 'মোট প্রকৃত খাবার' : 'Total Feed Used'}
                      </span>
                      <span className="text-xl font-bold text-slate-900">
                        {fcrResult.totalActualFeedUsedKg} <span className="text-xs font-normal">কেজি</span>
                      </span>
                      <span className="text-2xs text-slate-400 block mt-0.5">
                        ({(fcrResult.totalActualFeedUsedKg / (currentBatch.bagWeightKg || 50)).toFixed(1)} বস্তা)
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-xs text-slate-500 block mb-1">
                        {isBn ? 'মোট জীবন্ত ওজন বৃদ্ধি' : 'Biomass Gain'}
                      </span>
                      <span className="text-xl font-bold text-slate-900">
                        {fcrResult.totalFlockBiomassGainKg} <span className="text-xs font-normal">কেজি</span>
                      </span>
                      <span className="text-2xs text-slate-400 block mt-0.5">
                        ({fcrResult.currentLiveCount}{animalTerms.countUnit})
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-xs text-slate-500 block mb-1">
                        {isBn ? (animalTerms.category === 'cattle' ? 'প্রতি কেজি বৃদ্ধিতে খাদ্য খরচ' : 'প্রতি কেজি মাংসে খাদ্য খরচ') : 'Feed Cost / kg Gain'}
                      </span>
                      <span className="text-xl font-bold text-emerald-800">
                        {feedStockSummary?.costPerKgLiveGain ? `${feedStockSummary.costPerKgLiveGain} ৳` : '—'}
                      </span>
                      <span className="text-2xs text-slate-400 block mt-0.5">
                        (গড় খাদ্য দর: {feedStockSummary?.avgCostPerKg || 62} ৳/কেজি)
                      </span>
                    </div>
                  </div>

                  {/* Formula Transparency Box */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                    <span className="font-semibold text-slate-700 block">
                      {isBn ? 'FCR সূত্র ও হিসাব পদ্ধতি:' : 'FCR Formula & Calculation:'}
                    </span>
                    <p>
                      <strong>FCR = মোট প্রকৃত খাবার ({fcrResult.totalActualFeedUsedKg} কেজি) ÷ মোট ওজন বৃদ্ধি ({fcrResult.totalFlockBiomassGainKg} কেজি) = {fcrResult.actualFcr}</strong>
                    </p>
                    <p className="text-2xs text-slate-500">
                      * প্রতিটি {animalTerms.animalName}-র গড় ওজন বৃদ্ধি = {
                        animalTerms.category === 'cattle' 
                          ? `${fcrResult.latestMeasuredAvgWeightKg} কেজি - ${(fcrResult.initialWeightGram / 1000).toFixed(1)} কেজি (শুরুর গড় ওজন)` 
                          : `${fcrResult.latestMeasuredAvgWeightGram} গ্রাম - ${fcrResult.initialWeightGram} গ্রাম (শুরুর বাচ্চা/পোনা)`
                      } = {fcrResult.avgWeightGainKg} কেজি।
                    </p>
                  </div>
                </div>
              ) : (
                /* CASE C: NO MEASUREMENT YET */
                <div className="text-center py-8 px-4 space-y-4 max-w-md mx-auto">
                  <div className="w-14 h-14 mx-auto bg-slate-100 text-slate-500 rounded-full flex items-center justify-center">
                    <Scale className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900">
                      {isBn ? 'এখনও কোনো FCR পরিমাপ নেওয়া হয়নি' : 'No FCR Measurements Yet'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isBn
                        ? `ব্যাচের বর্তমান বয়স ${fcrResult.batchAgeDays} দিন। শুরু থেকে আজ পর্যন্ত মোট কত কেজি খাবার খেয়েছে এবং স্যাম্পল ${animalTerms.animalName}-র ওজন দিয়ে প্রথম FCR দেখুন।`
                        : `Current age is ${fcrResult.batchAgeDays} days. Enter total feed used and sample weight to calculate FCR.`}
                    </p>
                  </div>
                  <button
                    onClick={handleOpenFcrModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isBn ? 'প্রথম FCR পরিমাপ এন্ট্রি দিন' : 'Enter First Measurement'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* STEP 4: REAL FEED STOCK & PROGRESSIVE RUNWAY */}
        {/* ------------------------------------------------------------ */}
        {currentBatch && feedStockSummary && fcrResult && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Wheat className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-base text-slate-900">
                    {isBn ? 'খাদ্য মজুদ ও রানওয়ে (কত দিন চলবে)' : 'Feed Stock & Progressive Runway'}
                  </h3>
                </div>
                <p className="text-2xs text-slate-500 font-medium">
                  {isBn
                    ? 'খাবার ব্যবস্থাপনা থেকে ক্রয়কৃত খাদ্য স্বয়ংক্রিয়ভাবে এখানে সিঙ্ক হয়।'
                    : 'Feed stock purchases are automatically synced from Feed Management.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/feed?batchId=${currentBatch.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                title={isBn ? 'খাবার ব্যবস্থাপনায় যান' : 'Go to Feed Management'}
              >
                <Wheat className="w-3.5 h-3.5 text-slate-500" />
                <span>{isBn ? 'খাবার ব্যবস্থাপনা' : 'Feed Management'}</span>
              </button>
            </div>

            {/* Stock Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500 block">{isBn ? 'মোট ক্রয়কৃত খাদ্য' : 'Total Feed Purchased'}</span>
                <span className="text-xl font-bold text-slate-900">
                  {feedStockSummary.purchasedBags} <span className="text-xs font-normal">বস্তা</span>
                </span>
                <span className="text-2xs text-slate-400 block">({feedStockSummary.totalPurchasedKg} কেজি)</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500 block">{isBn ? 'মোট প্রকৃত খাওয়ানো' : 'Actual Feed Consumed'}</span>
                <span className="text-xl font-bold text-slate-900">
                  {feedStockSummary.totalUsedKg} <span className="text-xs font-normal">কেজি</span>
                </span>
                <span className="text-2xs text-slate-400 block">
                  ({(feedStockSummary.totalUsedKg / feedStockSummary.bagWeight).toFixed(1)} বস্তা)
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-xs text-emerald-700 font-medium block">
                  {isBn ? 'স্টকে অবশিষ্ট মজুদ' : 'Remaining Feed in Stock'}
                </span>
                <span className="text-xl font-bold text-emerald-900">
                  {feedStockSummary.remainingBags} <span className="text-xs font-normal">বস্তা</span>
                </span>
                <span className="text-2xs text-emerald-600 block">({feedStockSummary.remainingKg} কেজি)</span>
              </div>
            </div>

            {/* Progressive Growth Runway Highlight */}
            <div className={`p-4 rounded-xl border ${
              feedStockSummary.daysRunway <= 3
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : feedStockSummary.daysRunway <= 7
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            } flex items-start gap-3`}>
              <Clock className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold">
                  {isBn
                    ? `স্টকের খাবার আর প্রায় ${feedStockSummary.daysRunway} দিন চলবে`
                    : `Stock will last approx ${feedStockSummary.daysRunway} days`}
                </h4>
                <p className="text-xs leading-relaxed opacity-90">
                  {isBn
                    ? `${animalTerms.animalName}-র বৃদ্ধির সাথে সাথে প্রতিদিন খাবারের চাহিদা স্বয়ংক্রিয়ভাবে বাড়ে (বৈজ্ঞানিক গ্রোথ কার্ভ অনুযায়ী)। বর্তমান ${fcrResult.currentLiveCount}টি ${animalTerms.animalName}-র জন্য এই ${feedStockSummary.remainingBags} বস্তা খাদ্য ব্যাচের বয়স প্রায় ${feedStockSummary.stockRunsOutAtFlockAge} দিন পর্যন্ত চলবে।`
                    : `Feed consumption increases daily as ${animalTerms.animalName} grows. For ${fcrResult.currentLiveCount} ${animalTerms.countUnit}, remaining ${feedStockSummary.remainingBags} bags will last until age ${feedStockSummary.stockRunsOutAtFlockAge} days.`}
                </p>
                {feedStockSummary.daysRunway <= 3 && (
                  <p className="text-xs font-bold text-rose-700 pt-1">
                    ⚠️ {isBn ? 'সতর্কতা: খাদ্য মজুদ শেষ পর্যায়ে! নতুন খাবার কেনার অর্ডার দিন।' : 'Alert: Low feed stock! Please order new feed.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* STEP 5: MEASUREMENT HISTORY TABLE */}
        {/* ------------------------------------------------------------ */}
        {currentBatch && dailyRecords.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">
                {isBn ? `এই ব্যাচের অতীত FCR ও ${animalTerms.animalName}-র ওজনের রেকর্ড` : 'Measurement & Weight History'}
              </h3>
              <span className="text-xs text-slate-500">
                {isBn ? `মোট রেকর্ড: ${dailyRecords.length}টি` : `Total records: ${dailyRecords.length}`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{isBn ? 'তারিখ ও বয়স' : 'Date & Age'}</th>
                    <th className="px-4 py-3 font-semibold">{isBn ? `স্যাম্পল ${animalTerms.animalName} ওজন` : 'Sample Weight'}</th>
                    <th className="px-4 py-3 font-semibold">{isBn ? 'খাবার খরচ' : 'Feed Consumed'}</th>
                    <th className="px-4 py-3 font-semibold">{animalTerms.liveLabel}</th>
                    <th className="px-4 py-3 font-semibold">{isBn ? 'ধরন' : 'Type'}</th>
                    <th className="px-4 py-3 text-right font-semibold">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {dailyRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {rec.date}
                        <span className="block text-2xs text-slate-400 font-normal">
                          {isBn ? `বয়স: ${rec.batchAgeDays} দিন` : `Age: ${rec.batchAgeDays}d`}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {rec.avgWeightGram ? (
                          <span>
                            <strong>
                              {animalTerms.category === 'cattle' 
                                ? `${(rec.avgWeightGram / 1000).toFixed(1)} কেজি` 
                                : `${rec.avgWeightGram} গ্রাম`}
                            </strong>
                            <span className="block text-2xs text-slate-400">
                              ({rec.weightSampleCount || 1}টি {animalTerms.animalName} = {rec.totalSampleWeightKg} কেজি)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {rec.actualFeedUsedKg ? (
                          <span>
                            <strong>{rec.actualFeedUsedKg}</strong> কেজি
                            <span className="block text-2xs text-slate-400">
                              ({(rec.actualFeedUsedKg / (rec.bagWeightKgUsed || 50)).toFixed(1)} বস্তা)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {rec.currentLiveCount} {animalTerms.countUnit}
                        {rec.todayMortality && rec.todayMortality > 0 ? (
                          <span className="block text-2xs text-rose-600">
                            {isBn ? `(-${rec.todayMortality} মৃত্যু)` : `(-${rec.todayMortality} dead)`}
                          </span>
                        ) : null}
                      </td>

                      <td className="px-4 py-3">
                        {rec.isFcrMeasurement ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-2xs font-semibold">
                            {isBn ? 'FCR পরিমাপ' : 'FCR Entry'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-2xs">
                            {isBn ? 'দৈনিক রেকর্ড' : 'Daily'}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteRecord(rec)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------ */}
      {/* STEP 6: DEDICATED FCR MEASUREMENT MODAL */}
      {/* ------------------------------------------------------------ */}
      {isFcrModalOpen && currentBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isBn ? `${animalTerms.animalName}-র FCR পরিমাপ ও ওজন এন্ট্রি` : `${animalTerms.animalName} FCR & Weight Entry`}
                </h3>
                <p className="text-xs text-slate-500">
                  {currentBatch.batchName} ({isBn ? 'ব্যাচ' : 'Batch'})
                </p>
              </div>
              <button
                onClick={() => setIsFcrModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFcrEntry} className="space-y-4">
              {/* Age and Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {animalTerms.ageLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formAgeDays}
                    onChange={e => setFormAgeDays(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-2xs text-slate-400 block mt-0.5">
                    {isBn ? 'যেমন: ১৩, ১৪ বা ১৮ দিন' : 'e.g. 13, 14, or 18 days'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'পরিমাপের তারিখ' : 'Measurement Date'}
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Cumulative Feed Consumed up to this age */}
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950">
                    {isBn ? `শুরু থেকে ${formAgeDays} দিন বয়স পর্যন্ত মোট খাবার:` : `Total Feed Consumed up to Age ${formAgeDays}:`}
                  </label>
                  <div className="flex items-center gap-1 bg-white border border-emerald-300 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setFormFeedMode('kg')}
                      className={`px-2 py-0.5 text-xs font-medium rounded cursor-pointer ${
                        formFeedMode === 'kg' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'
                      }`}
                    >
                      {isBn ? 'কেজি' : 'KG'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormFeedMode('bag')}
                      className={`px-2 py-0.5 text-xs font-medium rounded cursor-pointer ${
                        formFeedMode === 'bag' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'
                      }`}
                    >
                      {isBn ? 'বস্তা' : 'Bag'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    placeholder={isBn ? 'যেমন: ৩৪০' : 'e.g. 340'}
                    value={formFeedAmount}
                    onChange={e => setFormFeedAmount(e.target.value)}
                    required
                    className="w-full pl-3 pr-16 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-emerald-700">
                    {formFeedMode === 'kg' ? (isBn ? 'কেজি' : 'KG') : (isBn ? 'বস্তা' : 'Bags')}
                  </span>
                </div>

                <p className="text-2xs text-emerald-800 leading-relaxed">
                  {isBn
                    ? `* এই ${formAgeDays} দিনে সর্বমোট যত খাবার খাওয়ানো হয়েছে। স্টকে পড়ে থাকা খাবার এতে অন্তর্ভুক্ত করবেন না।`
                    : `* Actual feed consumed up to day ${formAgeDays}. Do not include unused stock.`}
                </p>
              </div>

              {/* Sample Animal Weighing */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  {animalTerms.sampleLabel}:
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs text-slate-500 mb-1">
                      {animalTerms.sampleCountPrompt}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={formSampleCount}
                      onChange={e => setFormSampleCount(e.target.value)}
                      required
                      placeholder={animalTerms.defaultSampleCount}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-2xs text-slate-500">
                        {isBn ? 'স্যাম্পলের মোট ওজন' : 'Total Sample Weight'}
                      </label>
                      <div className="flex items-center gap-1 text-2xs text-slate-600">
                        <button
                          type="button"
                          onClick={() => setFormSampleUnit('kg')}
                          className={`px-1.5 py-0.2 rounded cursor-pointer ${formSampleUnit === 'kg' ? 'bg-slate-700 text-white font-bold' : ''}`}
                        >
                          কেজি
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormSampleUnit('g')}
                          className={`px-1.5 py-0.2 rounded cursor-pointer ${formSampleUnit === 'g' ? 'bg-slate-700 text-white font-bold' : ''}`}
                        >
                          গ্রাম
                        </button>
                      </div>
                    </div>

                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder={formSampleUnit === 'kg' ? animalTerms.sampleWeightPlaceholder : 'যেমন: ২৫০০'}
                      value={formSampleTotalWeight}
                      onChange={e => setFormSampleTotalWeight(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                    />
                  </div>
                </div>

                {modalSanity.avgWeightGram > 0 && (
                  <div className="p-2 bg-white border border-slate-200 rounded text-xs text-slate-700 flex items-center justify-between">
                    <span>{isBn ? `প্রতিটি ${animalTerms.animalName}-র গড় ওজন:` : `Average weight per ${animalTerms.animalName}:`}</span>
                    <span className="font-bold text-emerald-700">
                      {animalTerms.category === 'cattle' 
                        ? `${modalSanity.avgWeightKg} কেজি` 
                        : `${modalSanity.avgWeightGram} গ্রাম (${modalSanity.avgWeightKg} কেজি)`}
                    </span>
                  </div>
                )}
              </div>

              {/* Mortality Auto-Synced from Mortality Management */}
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{isBn ? `${animalTerms.animalName} মৃত্যু এন্ট্রি থেকে সিঙ্ককৃত তথ্য` : 'Mortality (Synced from Mortality Management)'}</span>
                  </div>
                  <p className="text-2xs text-rose-700 font-medium">
                    {isBn 
                      ? 'মৃত্যু এন্ট্রি অপশনে দেওয়া মৃত্যুর হিসাব এখানে স্বয়ংক্রিয়ভাবে সিঙ্ক হয়ে গেছে। এখানে আর আলাদা করে এন্ট্রি লাগবে না।' 
                      : 'Mortality entered in Mortality Management is automatically synced here. No re-entry needed.'}
                  </p>
                </div>
                <div className="text-right shrink-0 pl-3">
                  <span className="text-sm font-black text-rose-700 block">
                    {currentBatchMortality} {isBn ? 'টি মৃত' : 'dead'}
                  </span>
                  <span className="text-2xs text-emerald-700 font-bold block">
                    {isBn ? `জীবিত: ${Math.max(0, currentBatch.totalChicks - currentBatchMortality)} ${animalTerms.countUnit}` : `Alive: ${Math.max(0, currentBatch.totalChicks - currentBatchMortality)}`}
                  </span>
                </div>
              </div>

              {/* Real-time Sanity Alert inside Modal */}
              {modalSanity.warningMessage && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{modalSanity.warningMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFcrModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
                >
                  {isSubmitting ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'FCR হিসাব করুন ও সংরক্ষণ করুন' : 'Calculate & Save FCR')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
