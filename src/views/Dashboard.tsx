import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, doc, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { demoStore } from '../utils/demoStore';
import MarketRatesCard from '../components/MarketRatesCard';
import SponsorCard from '../components/SponsorCard';
import QuickDailyLogModal from '../components/QuickDailyLogModal';
import type { InsightMetricData } from '../components/SmartFarmInsightsCard';
import { 
  SCHEDULE_BROILER, 
  SCHEDULE_SONALI, 
  SCHEDULE_LAYER, 
  SCHEDULE_DAIRY, 
  SCHEDULE_FISH, 
  VaccineItem 
} from '../components/VaccineScheduleCard';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Activity, 
  CheckCircle, 
  CheckCircle2,
  Syringe,
  Droplets,
  Layers, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  ClipboardCheck, 
  X,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Plus,
  Store,
  FileText,
  Flame,
  ArrowRight,
  BarChart3,
  BarChart2,
  Stethoscope,
  Zap,
  Wheat,
  Pill,
  GitCompare,
  Bird,
  Scale,
  Calculator,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSopForDay } from '../utils/broilerSopData';
import { BroilerDailySopCard } from '../components/BroilerDailySopCard';
import { fetchBatchDailyRecords } from '../services/dailyRecordService';
import { calculateStrictBatchFcr } from '../utils/fcrCalculationEngine';
import { calculateProgressiveFeedForecast } from '../utils/feedStockCalculations';
import FeedQualityGuideModal from '../components/FeedQualityGuideModal';

interface Chores {
  id: string;
  textBn: string;
  textEn: string;
  completed: boolean;
}

export default function Dashboard() {
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [categoryBatches, setCategoryBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMortality, setTotalMortality] = useState<number>(0);
  const [profileData, setProfileData] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Modals state
  const [isChoresModalOpen, setIsChoresModalOpen] = useState<boolean>(false);
  const [isMarketRatesModalOpen, setIsMarketRatesModalOpen] = useState<boolean>(false);
  const [isSponsorsModalOpen, setIsSponsorsModalOpen] = useState<boolean>(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState<boolean>(false);
  const [isSopModalOpen, setIsSopModalOpen] = useState<boolean>(false);
  const [isFeedQualityOpen, setIsFeedQualityOpen] = useState<boolean>(false);
  const [quickLogTab, setQuickLogTab] = useState<'all' | 'feed' | 'water' | 'mortality' | 'weight' | 'expense' | 'sales'>('all');
  const [quickActionTab, setQuickActionTab] = useState<'daily' | 'trade' | 'services'>('daily');
  const [showBatchDetails, setShowBatchDetails] = useState<boolean>(false);
  const [batchMetrics, setBatchMetrics] = useState<InsightMetricData | null>(null);

  const openQuickLog = (tab: 'all' | 'feed' | 'water' | 'mortality' | 'weight' | 'expense' | 'sales' = 'all') => {
    setQuickLogTab(tab);
    setIsQuickLogOpen(true);
  };

  // Selected Farm Type State synchronized with localStorage
  const [selectedType, setSelectedType] = useState<'poultry' | 'cattle' | 'fish'>(
    () => (localStorage.getItem('selected_farm_type') as any) || 'poultry'
  );

  // Chores Checklist State
  const [chores, setChores] = useState<Chores[]>([]);

  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  // Load and initialize chores dynamically based on selectedType
  useEffect(() => {
    const todayStr = getTodayDateString();
    const cacheKey = `farm_chores_${selectedType}_${todayStr}`;
    const savedChores = localStorage.getItem(cacheKey);
    
    const defaultChoresMap = {
      poultry: [
        { id: 'p1', textBn: 'সকালে পানি ও ফ্রেশ স্টার্টার/গ্রোয়ার খাবার দিন', textEn: 'Provide clean morning water & chick feed', completed: false },
        { id: 'p2', textBn: 'মুরগির লিটার বিছানা ওলট-পালট করে শুকনো রাখুন', textEn: 'Ensure litter or floor is dry and fluffy', completed: false },
        { id: 'p3', textBn: 'ঘরের বাতাস চলাচল (ভেন্টিলেশন) ও পর্দা চেক করুন', textEn: 'Verify poultry curtains and fresh ventilation', completed: false },
        { id: 'p4', textBn: 'চেক করুন ঘরের তাপমাত্রা স্বাভাবিক পর্যায়ে আছে কিনা', textEn: 'Monitor chicken house temperature & heat levels', completed: false },
        { id: 'p5', textBn: 'অসুস্থ বা দুর্বল মুরগিগুলো আলাদা খাঁচায় রাখুন', textEn: 'Isolate sick or inactive birds immediately', completed: false },
      ],
      cattle: [
        { id: 'c1', textBn: 'সকালে সুষম দানাদার খাদ্য মিক্স ও তুষার/খড় দিন', textEn: 'Feed dry hay and dairy concentrate mixes', completed: false },
        { id: 'c2', textBn: 'গোয়ালঘর পরিষ্কার করে মেঝে সম্পূর্ণ শুকনো রাখুন', textEn: 'Clean dung down and dry the stable floor', completed: false },
        { id: 'c3', textBn: 'পশুর স্বাভাবিক তাপমাত্রা ও ওলান প্রদাহ চেক করুন', textEn: 'Check cattle body warmth & udder comfort daily', completed: false },
        { id: 'c4', textBn: 'পর্যাপ্ত বিশুদ্ধ খাবার পানি সরবরাহ সচল রাখুন', textEn: 'Ensure non-contaminated drinking water is ready', completed: false },
        { id: 'c5', textBn: 'পশুকে সবুজ কাঁচা ঘাস অথবা সাইলেজ খাওয়ান', textEn: 'Provide green meadow grass or rich Silage portions', completed: false },
      ],
      fish: [
        { id: 'f1', textBn: 'সকাল এবং বিকেলে নিয়ম মেনে ভাসমান খাবার দিন', textEn: 'Feed floating pellets twice on schedule', completed: false },
        { id: 'f2', textBn: 'পানির স্বাভাবিক গভীরতা ও রঙ চেক করুন', textEn: 'Verify natural depth and green plankton shade', completed: false },
        { id: 'f3', textBn: 'পুকুরে অক্সিজেনের ঘাটতি আছে কিনা দেখে নিন', textEn: 'Inspect dawn gas bubbling or oxygen depletion', completed: false },
        { id: 'f4', textBn: 'পানির pH ও তাপমাত্রা রিডিং ঠিক রাখুন', textEn: 'Check pond pH and adjust lime if acidic', completed: false },
        { id: 'f5', textBn: 'ক্ষতিকর শ্যাওলাস্তর বা কচুরিপানা পরিষ্কার করুন', textEn: 'Remove dark toxic weed beds or excessive hyacinths', completed: false },
      ]
    };

    const currentDefaults = defaultChoresMap[selectedType] || defaultChoresMap.poultry;

    if (savedChores) {
      try {
        setChores(JSON.parse(savedChores));
      } catch (e) {
        setChores(currentDefaults);
      }
    } else {
      setChores(currentDefaults);
      localStorage.setItem(cacheKey, JSON.stringify(currentDefaults));
    }
  }, [selectedType]);

  const toggleChore = (id: string) => {
    const updated = chores.map(c => c.id === id ? { ...c, completed: !c.completed } : c);
    setChores(updated);
    const todayStr = getTodayDateString();
    const cacheKey = `farm_chores_${selectedType}_${todayStr}`;
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  };

  useEffect(() => {
    const isDemo = Boolean(isDemoUser || currentUser?.uid === 'demo_khamari_user_1' || !auth.currentUser);

    if (isDemo) {
      setProfileData(demoStore.getProfile());
      const loadDemoDashboard = () => {
        const allBatches = demoStore.getBatches();
        const activeMatching = allBatches.filter(b => b.status === 'active' && b.farmType === selectedType);
        setCategoryBatches(activeMatching);

        const savedBatchId = localStorage.getItem(`selected_batch_id_${selectedType}`);
        const selected = activeMatching.find(b => b.id === savedBatchId) 
          || activeMatching[0] 
          || null;
        
        setActiveBatch(selected);
        if (selected) {
          const mort = demoStore.getMortalityRecords(selected.id);
          const totalM = mort.reduce((acc, m) => acc + (Number(m.count) || 0), 0);
          setTotalMortality(totalM);
          loadActivities(selected.id);
          fetchBatchMetrics(selected);
        } else {
          setTotalMortality(0);
          loadActivities();
          setBatchMetrics(null);
          localStorage.removeItem(`selected_batch_id_${selectedType}`);
        }
        setLoading(false);
      };

      const loadActivities = (batchIdFilter?: string) => {
        const acts: any[] = [];
        const feeds = batchIdFilter 
          ? demoStore.getFeedRecords(batchIdFilter) 
          : demoStore.getFeedRecords();
        feeds.slice(0, 2).forEach(d => {
          acts.push({
            id: d.id,
            type: 'feed',
            date: d.date,
            titleBn: 'খাবারের হিসাব',
            titleEn: 'Feed Record',
            detailsBn: `${d.feedType} - ${d.quantityBags} ব্যাগ`,
            detailsEn: `${d.feedType} - ${d.quantityBags} bags`,
            amount: d.cost || 0
          });
        });

        const meds = batchIdFilter 
          ? demoStore.getMedicineRecords(batchIdFilter) 
          : demoStore.getMedicineRecords();
        meds.slice(0, 2).forEach(d => {
          acts.push({
            id: d.id,
            type: 'medicine',
            date: d.date,
            titleBn: 'ঔষধ ভ্যাকসিন',
            titleEn: 'Medicine/Vaccine',
            detailsBn: `${d.type === 'vaccine' ? 'ভ্যাকসিন' : 'ঔষধ'} - ${d.medicineName}`,
            detailsEn: `${d.type === 'vaccine' ? 'Vaccine' : 'Medicine'} - ${d.medicineName}`,
            amount: d.cost || 0
          });
        });

        const exps = batchIdFilter 
          ? demoStore.getExpenses(batchIdFilter) 
          : demoStore.getExpenses();
        exps.slice(0, 2).forEach(d => {
          acts.push({
            id: d.id,
            type: 'expense',
            date: d.date,
            titleBn: 'অন্যান্য খরচ',
            titleEn: 'Other Expense',
            detailsBn: `${d.category || 'অন্যান্য'} - ${d.description || ''}`,
            detailsEn: `${d.category || 'Other'} - ${d.description || ''}`,
            amount: d.amount || 0
          });
        });

        const sales = batchIdFilter 
          ? demoStore.getSales(batchIdFilter) 
          : demoStore.getSales();
        sales.slice(0, 2).forEach(d => {
          acts.push({
            id: d.id,
            type: 'sales',
            date: d.date,
            titleBn: 'বিক্রির হিসাব',
            titleEn: 'Sales Record',
            detailsBn: `ওজন: ${d.totalWeightKg ? d.totalWeightKg + ' কেজি' : d.quantity + ' টি'}`,
            detailsEn: `Weight: ${d.totalWeightKg ? d.totalWeightKg + ' kg' : d.quantity + ' pcs'}`,
            amount: d.totalAmount || 0
          });
        });
        acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentActivities(acts.slice(0, 3));
      };

      loadDemoDashboard();
      const unsub = demoStore.subscribe(loadDemoDashboard);
      return () => unsub();
    }

    fetchRecentActivitiesAndStats();
    
    if (currentUser && auth.currentUser) {
      const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docObj) => {
        if (docObj.exists()) {
          setProfileData(docObj.data());
        }
      }, (err) => {
        console.warn('Dashboard profile onSnapshot error:', err);
      });

      const qBatches = query(
        collection(db, 'batches'),
        where('userId', '==', currentUser.uid)
      );
      const unsubBatches = onSnapshot(qBatches, (snapshot) => {
        const allBatches = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const activeBatches = allBatches.filter((b: any) => b.status === 'active' && (b.farmType || 'poultry') === selectedType);
        setCategoryBatches(activeBatches);

        const savedBatchId = localStorage.getItem(`selected_batch_id_${selectedType}`);
        const matched = activeBatches.find((b: any) => b.id === savedBatchId) || activeBatches[0] || null;

        setActiveBatch(matched);
        if (matched) {
          fetchMortality(matched.id);
          fetchBatchMetrics(matched);
        } else {
          setTotalMortality(0);
          setBatchMetrics(null);
          localStorage.removeItem(`selected_batch_id_${selectedType}`);
        }
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'batches');
        setLoading(false);
      });

      return () => {
        unsubProfile();
        unsubBatches();
      };
    } else {
      fetchActiveBatches();
    }
  }, [currentUser, isDemoUser, selectedType]);

  // Real-time synchronization when feed stock is adjusted in FCR & Stock card or Feed Plan
  useEffect(() => {
    const handleFeedStockUpdate = (e: any) => {
      if (activeBatch && (!e.detail?.batchId || e.detail?.batchId === activeBatch.id || e.detail?.batchId === 'default_batch')) {
        fetchBatchMetrics({
          ...activeBatch,
          feedStockInKg: e.detail?.inKg,
          feedStockUsedKg: e.detail?.usedKg,
          feedStockRemainingKg: e.detail?.remainingKg
        });
      }
    };
    window.addEventListener('feed_stock_updated', handleFeedStockUpdate);
    return () => window.removeEventListener('feed_stock_updated', handleFeedStockUpdate);
  }, [activeBatch]);

  const fetchActiveBatches = async () => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'batches'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'active'),
        where('farmType', '==', selectedType)
      );
      const snapshot = await fastGetDocs(q);
      const batchesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategoryBatches(batchesList);

      const savedBatchId = localStorage.getItem(`selected_batch_id_${selectedType}`);
      const matched = batchesList.find(b => b.id === savedBatchId) || batchesList[0] || null;
      
      setActiveBatch(matched);
      if (matched) {
        fetchMortality(matched.id);
        fetchBatchMetrics(matched);
      } else {
        setTotalMortality(0);
        setBatchMetrics(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'batches');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBatch = (batch: any) => {
    setActiveBatch(batch);
    localStorage.setItem(`selected_batch_id_${selectedType}`, batch.id);
    if (isDemoUser) {
      const mort = demoStore.getMortalityRecords(batch.id);
      const totalM = mort.reduce((acc, m) => acc + (Number(m.count) || 0), 0);
      setTotalMortality(totalM);
    } else {
      fetchMortality(batch.id);
    }
    fetchBatchMetrics(batch);
  };

  const fetchBatchMetrics = async (batch: any) => {
    if (!batch) {
      setBatchMetrics(null);
      return;
    }
    try {
      let tFeedCost = 0;
      let tFeedBags = 0;
      let tMedCost = 0;
      let tOtherExp = 0;
      let tSales = 0;
      let tSalesQty = 0;
      let tSalesWeightKg = 0;
      let tMort = 0;
      let avgWeight = 0;

      const chickCost = Number(batch.totalChicks || 0) * Number(batch.costPerChick || 0);

      if (isDemoUser) {
        demoStore.getFeedRecords(batch.id).forEach(f => {
          tFeedCost += Number(f.cost || 0);
          if ((f as any).recordType !== 'actual_consumed') {
            tFeedBags += Number(f.quantityBags || 0);
          }
        });
        demoStore.getMedicineRecords(batch.id).forEach(m => {
          tMedCost += Number(m.cost || 0);
        });
        demoStore.getExpenses(batch.id).forEach(e => {
          tOtherExp += Number(e.amount || 0);
        });
        demoStore.getSales(batch.id).forEach(s => {
          tSales += Number(s.totalAmount || 0);
          tSalesQty += Number(s.quantity || 0);
          tSalesWeightKg += Number(s.totalWeightKg || 0);
          if (s.totalWeightKg && s.quantity) {
            avgWeight = Number(s.totalWeightKg) / Number(s.quantity);
          }
        });
        demoStore.getMortalityRecords(batch.id).forEach(m => {
          tMort += Number(m.count || 0);
        });
      } else if (currentUser) {
        const feedQ = query(collection(db, 'feed_records'), where('userId', '==', currentUser.uid), where('batchId', '==', batch.id));
        const feedSnap = await fastGetDocs(feedQ);
        feedSnap.forEach(d => {
          const fData = d.data();
          tFeedCost += Number(fData.cost || 0);
          if (fData.recordType !== 'actual_consumed') {
            tFeedBags += Number(fData.quantityBags || fData.quantity || 0);
          }
        });

        const medQ = query(collection(db, 'medicine'), where('userId', '==', currentUser.uid), where('batchId', '==', batch.id));
        const medSnap = await fastGetDocs(medQ);
        medSnap.forEach(d => {
          tMedCost += Number(d.data().cost || 0);
        });

        const expQ = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid), where('batchId', '==', batch.id));
        const expSnap = await fastGetDocs(expQ);
        expSnap.forEach(d => {
          tOtherExp += Number(d.data().amount || 0);
        });

        const salesQ = query(collection(db, 'sales'), where('userId', '==', currentUser.uid), where('batchId', '==', batch.id));
        const salesSnap = await fastGetDocs(salesQ);
        salesSnap.forEach(d => {
          tSales += Number(d.data().totalAmount || d.data().totalPrice || 0);
          tSalesQty += Number(d.data().quantity || 0);
          tSalesWeightKg += Number(d.data().totalWeightKg || 0);
          if (d.data().totalWeightKg && d.data().quantity) {
            avgWeight = Number(d.data().totalWeightKg) / Number(d.data().quantity);
          }
        });

        const mortQ = query(collection(db, 'mortality'), where('userId', '==', currentUser.uid), where('batchId', '==', batch.id));
        const mortSnap = await fastGetDocs(mortQ);
        mortSnap.forEach(d => {
          tMort += Number(d.data().count || 0);
        });
      }

      const totalCost = chickCost + tFeedCost + tMedCost + tOtherExp;
      const netProfit = tSales - totalCost;
      const age = calculateAge(batch.startDate);

      const bagWeightKg = Math.max(1, Number(batch.bagWeightKg) || Number(localStorage.getItem(`bag_weight_${batch.id}`)) || 50);

      // Fetch batch daily actual records for 100% exact parity with FCR calculations
      const dailyRecords = await fetchBatchDailyRecords(batch.id, currentUser?.uid || 'demo', isDemoUser);

      const batchScopeItem = {
        id: batch.id,
        userId: batch.userId || currentUser?.uid || 'demo',
        batchName: batch.name || batch.batchName || 'Batch',
        farmType: (batch.farmType || 'poultry') as any,
        subBreed: batch.subBreed || batch.breed || 'broiler',
        startDate: batch.startDate || new Date().toISOString().split('T')[0],
        totalChicks: Number(batch.totalChicks || batch.birdCount || 1000),
        costPerChick: Number(batch.costPerChick || 55),
        status: (batch.status === 'completed' ? 'completed' : 'active') as any,
        bagWeightKg
      };

      const fcrResult = calculateStrictBatchFcr(batchScopeItem, dailyRecords, tMort);

      let actualUsedFeedKg = fcrResult.totalActualFeedUsedKg;
      if (actualUsedFeedKg === 0) {
        if (batch.feedStockUsedKg !== undefined && Number(batch.feedStockUsedKg) > 0) {
          actualUsedFeedKg = Number(batch.feedStockUsedKg);
        } else {
          const savedUsed = localStorage.getItem(`fcr_stock_used_${batch.id}`);
          if (savedUsed && Number(savedUsed) > 0) {
            actualUsedFeedKg = Number(savedUsed);
          }
        }
      }

      let totalPurchasedBags = tFeedBags;
      if (totalPurchasedBags === 0) {
        if (batch.feedStockInKg !== undefined && Number(batch.feedStockInKg) > 0) {
          totalPurchasedBags = Number((Number(batch.feedStockInKg) / bagWeightKg).toFixed(1));
        } else {
          const savedIn = localStorage.getItem(`fcr_stock_in_${batch.id}`);
          if (savedIn && Number(savedIn) > 0) {
            totalPurchasedBags = Number((Number(savedIn) / bagWeightKg).toFixed(1));
          }
        }
      }

      const totalPurchasedKg = totalPurchasedBags * bagWeightKg;
      const remainingKg = Math.max(0, totalPurchasedKg - actualUsedFeedKg);
      const remainingBags = bagWeightKg > 0 ? Number((remainingKg / bagWeightKg).toFixed(1)) : 0;
      const feedPurchasedBags = totalPurchasedBags;
      const feedUsedBags = bagWeightKg > 0 ? Number((actualUsedFeedKg / bagWeightKg).toFixed(1)) : 0;

      // Precision runway forecast identical to FCR view
      const forecast = calculateProgressiveFeedForecast({
        aliveCount: fcrResult.currentLiveCount,
        currentAgeDays: fcrResult.batchAgeDays,
        remainingStockKg: remainingKg,
        bagWeightKg: bagWeightKg,
        sector: batchScopeItem.farmType,
        birdType: batchScopeItem.subBreed as any,
        batchName: batchScopeItem.batchName
      });

      const daysLeft = forecast.daysStockWillLast;
      const feedForecastNote = language === 'bn' ? forecast.forecastNoteBn : forecast.forecastNoteEn;
      const isFeedCoversEntireBatch = forecast.isCoveredUntilHarvest;
      const avgDaily = bagWeightKg > 0 ? Number((forecast.currentDailyRequirementKg / bagWeightKg).toFixed(2)) : 1;

      // Retrieve measured sample weight from storage if available
      let measuredWeightGram: number | undefined = undefined;
      const savedWeight = localStorage.getItem(`batch_weight_${batch.id}`);
      if (savedWeight && Number(savedWeight) > 0) {
        measuredWeightGram = Number(savedWeight);
        avgWeight = measuredWeightGram / 1000;
      } else if (fcrResult.latestMeasuredAvgWeightGram) {
        measuredWeightGram = fcrResult.latestMeasuredAvgWeightGram;
        avgWeight = (fcrResult.latestMeasuredAvgWeightKg || measuredWeightGram / 1000);
      } else if (avgWeight > 0) {
        measuredWeightGram = Math.round(avgWeight * 1000);
      }

      const totalBirds = Number(batch.totalChicks || 0);
      const aliveBirds = fcrResult.currentLiveCount;
      const mortRate = totalBirds > 0 ? Number(((tMort / totalBirds) * 100).toFixed(1)) : 0;
      const survivalRate = Number((100 - mortRate).toFixed(1));

      setBatchMetrics({
        totalChicks: totalBirds,
        aliveBirds,
        totalMortality: tMort,
        mortalityRate: mortRate,
        survivalRate,
        feedBagsPurchased: feedPurchasedBags,
        feedBagsUsed: feedUsedBags,
        feedStockRemainingBags: remainingBags,
        feedConsumedKg: actualUsedFeedKg,
        avgDailyFeedBags: avgDaily,
        daysOfFeedLeft: daysLeft,
        feedForecastNote,
        isFeedCoversEntireBatch,
        totalFeedCost: tFeedCost,
        totalMedicineCost: tMedCost,
        totalChickCost: chickCost,
        totalOtherExpenses: tOtherExp,
        totalCost,
        totalSalesRevenue: tSales,
        netProfit,
        avgWeightKg: avgWeight > 0 ? avgWeight : undefined,
        currentAvgWeightGram: measuredWeightGram,
        batchAgeDays: fcrResult.batchAgeDays || age,
        farmType: batch.farmType || 'poultry',
        species: batch.subBreed || batch.breed || 'broiler'
      });
    } catch (err) {
      console.warn('Error computing batch metrics:', err);
    }
  };

  const fetchMortality = async (batchId: string) => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'mortality'),
        where('userId', '==', currentUser.uid),
        where('batchId', '==', batchId)
      );
      const snapshot = await fastGetDocs(q);
      let count = 0;
      snapshot.forEach(doc => {
        count += (Number(doc.data().count) || 0);
      });
      setTotalMortality(count);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'mortality');
    }
  };

  const fetchRecentActivitiesAndStats = async () => {
    if (!currentUser) return;
    try {
      const activities: any[] = [];

      // Get last feed records
      const feedQ = query(
        collection(db, 'feed_records'),
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc')
      );
      try {
        const feedSnap = await fastGetDocs(feedQ);
        feedSnap.docs.slice(0, 1).forEach(d => {
          activities.push({
            id: d.id,
            type: 'feed',
            date: d.data().date,
            titleBn: 'খাবারের হিসাব',
            titleEn: 'Feed Record',
            detailsBn: `${d.data().feedType} - ${d.data().quantity} ব্যাগ/কেজি`,
            detailsEn: `${d.data().feedType} - ${d.data().quantity} bags/kg`,
            amount: d.data().totalPrice || 0
          });
        });
      } catch (e) {}

      // Get last medicine records
      const medQ = query(
        collection(db, 'medicine_records'),
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc')
      );
      try {
        const medSnap = await fastGetDocs(medQ);
        medSnap.docs.slice(0, 1).forEach(d => {
          activities.push({
            id: d.id,
            type: 'medicine',
            date: d.data().date,
            titleBn: 'ঔষধ ভ্যাকসিন',
            titleEn: 'Medicine/Vaccine',
            detailsBn: `${d.data().type === 'vaccine' ? 'ভ্যাকসিন' : 'ঔষধ'} - ${d.data().name}`,
            detailsEn: `${d.data().type === 'vaccine' ? 'Vaccine' : 'Medicine'} - ${d.data().name}`,
            amount: d.data().totalPrice || 0
          });
        });
      } catch (e) {}

      // Get last expenses
      const expQ = query(
        collection(db, 'expenses'),
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc')
      );
      try {
        const expSnap = await fastGetDocs(expQ);
        expSnap.docs.slice(0, 1).forEach(d => {
          activities.push({
            id: d.id,
            type: 'expense',
            date: d.data().date,
            titleBn: 'অন্যান্য খরচ',
            titleEn: 'Other Expense',
            detailsBn: `${d.data().category || 'অন্যান্য'} - ${d.data().details || ''}`,
            detailsEn: `${d.data().category || 'Other'} - ${d.data().details || ''}`,
            amount: d.data().amount || 0
          });
        });
      } catch (e) {}

      // Get last sales
      const salesQ = query(
        collection(db, 'sales'),
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc')
      );
      try {
        const salesSnap = await fastGetDocs(salesQ);
        salesSnap.docs.slice(0, 1).forEach(d => {
          activities.push({
            id: d.id,
            type: 'sales',
            date: d.data().date,
            titleBn: 'বিক্রির হিসাব',
            titleEn: 'Sales Record',
            detailsBn: `ওজন: ${d.data().weight ? d.data().weight + ' কেজি' : d.data().quantity + ' টি'}`,
            detailsEn: `Weight: ${d.data().weight ? d.data().weight + ' kg' : d.data().quantity + ' pcs'}`,
            amount: d.data().totalPrice || 0
          });
        });
      } catch (e) {}

      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(activities.slice(0, 3));
    } catch (e) {
      console.error("Error activity logs:", e);
    }
  };

  const calculateAge = (startDate: string) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getMortalityStatus = (rate: number) => {
    if (rate <= 3.5) return { color: 'text-emerald-700 bg-emerald-50 border border-emerald-200', labelBn: 'চমৎকার', labelEn: 'Excellent' };
    if (rate <= 6.5) return { color: 'text-amber-700 bg-amber-50 border border-amber-200', labelBn: 'স্বাভাবিক', labelEn: 'Normal' };
    return { color: 'text-red-700 bg-red-50 border border-red-200', labelBn: 'উচ্চ মৃত্যুঝুঁকি', labelEn: 'High Risk' };
  };

  const handleSelectTypeOnDashboard = (type: 'poultry' | 'cattle' | 'fish') => {
    setSelectedType(type);
    localStorage.setItem('selected_farm_type', type);
  };

  // Active batch vaccine calculation
  const [vaccineDoneVersion, setVaccineDoneVersion] = useState(0);

  const activeBatchVaccine = React.useMemo(() => {
    if (!activeBatch) return null;
    const age = calculateAge(activeBatch.startDate);
    const fType = activeBatch.farmType || 'poultry';
    let schedule = SCHEDULE_BROILER;
    const bName = (activeBatch.batchName || '').toLowerCase();
    if (fType === 'cattle') schedule = SCHEDULE_DAIRY;
    else if (fType === 'fish') schedule = SCHEDULE_FISH;
    else if (bName.includes('সোনালী') || bName.includes('sonali')) schedule = SCHEDULE_SONALI;
    else if (bName.includes('লেয়ার') || bName.includes('layer')) schedule = SCHEDULE_LAYER;

    const actionable = schedule.filter(item => !item.isHatcheryGiven);
    const completedKey = `vax_done_${activeBatch.id}_`;

    // 1. Due today or active window (targetDayMin <= age <= targetDayMax)
    const dueToday = actionable.find(item => item.targetDayMin <= age && age <= item.targetDayMax);
    if (dueToday) {
      const isDone = localStorage.getItem(`${completedKey}${dueToday.id}`) === 'true';
      return { item: dueToday, isDueToday: true, daysUntil: 0, age, isDone };
    }

    // 2. Next upcoming vaccine
    const upcoming = actionable.find(item => item.targetDayMin > age);
    if (upcoming) {
      const isDone = localStorage.getItem(`${completedKey}${upcoming.id}`) === 'true';
      return { item: upcoming, isDueToday: false, daysUntil: upcoming.targetDayMin - age, age, isDone };
    }

    return null;
  }, [activeBatch, vaccineDoneVersion]);

  const toggleVaccineDone = (item: VaccineItem) => {
    if (!activeBatch) return;
    const key = `vax_done_${activeBatch.id}_${item.id}`;
    const current = localStorage.getItem(key) === 'true';
    localStorage.setItem(key, String(!current));
    setVaccineDoneVersion(v => v + 1);
  };

  const totalCompletedChores = chores.filter(c => c.completed).length;
  const progressPercent = chores.length > 0 ? Math.round((totalCompletedChores / chores.length) * 100) : 0;

  const totalChicksCount = Number(activeBatch?.totalChicks || 0);
  const aliveBirdsCount = Math.max(0, totalChicksCount - totalMortality);
  const costPerChick = Number(activeBatch?.costPerChick || 0);

  const mortalityRate = totalChicksCount > 0
    ? Number(((totalMortality / totalChicksCount) * 100).toFixed(1))
    : 0;
  
  const mortStat = getMortalityStatus(mortalityRate);

  const styleConfig = {
    poultry: {
      heading: language === 'bn' ? 'পাখি পালন খামার' : 'Bird & Poultry Farm',
      tagline: language === 'bn' ? 'মুরগি, হাঁস, কোয়েল ব্যাচ ও হিসাব' : 'Flock, Duck and Market Tracker',
      unitLabel: language === 'bn' ? 'বাচ্চা' : 'Chicks',
      unitItem: language === 'bn' ? 'টি পাখি' : 'birds',
      buyLabel: language === 'bn' ? 'বাচ্চার ক্রয়দর' : 'Chick Rate',
      rateSuffix: language === 'bn' ? '৳ /পিস' : '৳ /pc',
      aliveLabel: language === 'bn' ? 'জীবিত পাখি' : 'Alive Birds',
      mortLabel: language === 'bn' ? 'মোট মৃত্যু' : 'Mortality',
      countLabel: language === 'bn' ? 'শুরুর সংখ্যা' : 'Total Count',
      ageLabel: language === 'bn' ? 'বর্তমান বয়স' : 'Current Age',
      icon: '🐦'
    },
    cattle: {
      heading: language === 'bn' ? 'পশু পালন খামার' : 'Livestock Farm',
      tagline: language === 'bn' ? 'গরু, ষাঁড়, ছাগল ও দুধ ট্র্যাকার' : 'Cattle, Goat & Dairy Tracker',
      unitLabel: language === 'bn' ? 'পশু' : 'Cattle',
      unitItem: language === 'bn' ? 'টি পশু' : 'heads',
      buyLabel: language === 'bn' ? 'পশুর ক্রয়দর' : 'Cattle Price',
      rateSuffix: language === 'bn' ? '৳ /পশু' : '৳ /head',
      aliveLabel: language === 'bn' ? 'জীবিত ও সুস্থ' : 'Healthy Cattle',
      mortLabel: language === 'bn' ? 'মৃত / অসুস্থ' : 'Loss / Illness',
      countLabel: language === 'bn' ? 'মোট পশুর সংখ্যা' : 'Total Animals',
      ageLabel: language === 'bn' ? 'পালন বয়স' : 'Farming Days',
      icon: '🐄'
    },
    fish: {
      heading: language === 'bn' ? 'মাছ চাষ খামার' : 'Fisheries Pond',
      tagline: language === 'bn' ? 'তেলাপিয়া, কার্প ও মাছ চাষ ট্র্যাকার' : 'Pond & Fish Tracker',
      unitLabel: language === 'bn' ? 'পোনা' : 'Fingerlings',
      unitItem: language === 'bn' ? 'টি পোনা' : 'fry',
      buyLabel: language === 'bn' ? 'পোনা ক্রয়দর' : 'Fry Rate',
      rateSuffix: language === 'bn' ? '৳ /পিস' : '৳ /pc',
      aliveLabel: language === 'bn' ? 'জীবিত মাছ' : 'Live Fish',
      mortLabel: language === 'bn' ? 'পোনা মৃত্যু' : 'Fry Loss',
      countLabel: language === 'bn' ? 'মোট পোনা সংখ্যা' : 'Total Fry',
      ageLabel: language === 'bn' ? 'চাষের বয়স' : 'Culture Age',
      icon: '🐟'
    }
  };

  const activeStyle = styleConfig[selectedType] || styleConfig.poultry;

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">{t('common.loading')}</div>;

  return (
    <div className="space-y-3 pb-3 animate-fadeIn select-none">
      
      {/* 1. Header Bar with Farm Switcher (Ultra-compact) */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-100 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500 shrink-0" />
            <h2 className="text-sm sm:text-base font-black text-slate-850 tracking-tight leading-none">
              {activeStyle.heading}
            </h2>
          </div>
          <p className="text-[9px] text-slate-400 font-bold mt-0.5">
            {activeStyle.tagline}
          </p>
        </div>

        {/* Local Farm Type Switcher */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5 shrink-0 border border-slate-200/60 shadow-2xs">
          <button
            onClick={() => handleSelectTypeOnDashboard('poultry')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedType === 'poultry'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/40'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Birds & Poultry"
          >
            <span>🐦</span>
            <span className="text-[10px] hidden sm:inline">{language === 'bn' ? 'পাখি' : 'Birds'}</span>
          </button>
          <button
            onClick={() => handleSelectTypeOnDashboard('cattle')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedType === 'cattle'
                ? 'bg-white text-amber-800 shadow-xs border border-slate-200/40'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Animals & Cattle"
          >
            <span>🐄</span>
            <span className="text-[10px] hidden sm:inline">{language === 'bn' ? 'পশু' : 'Animals'}</span>
          </button>
          <button
            onClick={() => handleSelectTypeOnDashboard('fish')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedType === 'fish'
                ? 'bg-white text-blue-800 shadow-xs border border-slate-200/40'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Fish & Aquaculture"
          >
            <span>🐟</span>
            <span className="text-[10px] hidden sm:inline">{language === 'bn' ? 'মাছ' : 'Fish'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Multi-Batch Selector Bar */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-100">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm">{activeStyle.icon}</span>
            <h3 className="text-xs font-extrabold text-slate-800 truncate">
              {language === 'bn' 
                ? `${selectedType === 'poultry' ? 'পাখির (মুরগি/হাঁস)' : selectedType === 'cattle' ? 'পশুর (গরু/ছাগল)' : 'মাছের'} সক্রিয় ব্যাচসমূহ (${categoryBatches.length}টি)`
                : `Active ${selectedType} Batches (${categoryBatches.length})`}
            </h3>
          </div>
          <Link
            to="/batches"
            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 px-2 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1 shrink-0 transition-colors"
          >
            <Plus size={11} />
            <span>{language === 'bn' ? 'নতুন ব্যাচ' : 'New Batch'}</span>
          </Link>
        </div>

        {/* Horizontal scrollable batch selector buttons */}
        {categoryBatches.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categoryBatches.map((b) => {
              const isCurrent = activeBatch?.id === b.id;
              const batchAge = calculateAge(b.startDate);
              return (
                <button
                  key={b.id}
                  onClick={() => handleSelectBatch(b)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2 border ${
                    isCurrent
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border-emerald-700 shadow-xs font-extrabold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/70 font-bold'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                  <div className="min-w-0 max-w-[170px] sm:max-w-[220px]">
                    <p className="text-[11px] truncate leading-tight">{b.batchName}</p>
                    <p className={`text-[9px] truncate ${isCurrent ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {b.totalChicks} {activeStyle.unitItem} • {batchAge} {language === 'bn' ? 'দিন' : 'd'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-2 text-center text-[10px] text-slate-400 font-medium">
            {language === 'bn' ? `এই ক্যাটাগরিতে কোনো সক্রিয় ব্যাচ নেই।` : `No active batch in this category.`}
          </div>
        )}
      </div>

      {/* 3. Central Active Batch Spotlight Card (Compact Hero Card with Collapsible Details) */}
      {activeBatch ? (
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-xs border border-emerald-200/80 relative overflow-hidden space-y-2">
          {/* Header of Active Batch */}
          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100/80 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <Package size={15} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-850 truncate leading-tight">
                    {activeBatch.batchName}
                  </h3>
                  <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    {calculateAge(activeBatch.startDate)} {language === 'bn' ? 'দিন' : 'd'}
                  </span>
                </div>
                <p className="text-[8.5px] font-bold text-slate-400 truncate">
                  {formatDateDisplay(activeBatch.startDate)} • {totalChicksCount.toLocaleString()} {language === 'bn' ? 'টি' : ''} {activeStyle.unitItem}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                {language === 'bn' ? 'চলমান ✓' : 'Active'}
              </span>
              <button
                type="button"
                onClick={() => setShowBatchDetails(!showBatchDetails)}
                className="text-[10px] font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200/80 flex items-center gap-0.5 cursor-pointer transition-colors"
                title={showBatchDetails ? 'সংক্ষেপ' : 'বিস্তারিত'}
              >
                <span>{showBatchDetails ? (language === 'bn' ? 'সংক্ষেপ' : 'Less') : (language === 'bn' ? 'বিস্তারিত' : 'More')}</span>
                {showBatchDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            </div>
          </div>

          {/* Clean 4-Column Metric Strip (Mobile 2x2, Desktop 4x1) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {/* 1. Alive Animals */}
            <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-[8.5px] font-bold text-emerald-800 block">
                  {activeStyle.aliveLabel}
                </span>
                <p className="text-xs sm:text-sm font-black text-emerald-700 font-sans leading-none mt-0.5">
                  {aliveBirdsCount.toLocaleString()} <span className="text-[8.5px] text-emerald-600 font-bold">{language === 'bn' ? 'টি' : 'pcs'}</span>
                </p>
              </div>
              <span className="text-[8.5px] font-black text-emerald-700 bg-white px-1.5 py-0.2 rounded-md border border-emerald-200">
                {totalChicksCount > 0 ? `${Math.round((aliveBirdsCount / totalChicksCount) * 100)}%` : '100%'}
              </span>
            </div>

            {/* 2. Total Mortality */}
            <div className="bg-red-50/60 p-2 rounded-xl border border-red-200/80 flex items-center justify-between">
              <div>
                <span className="text-[8.5px] font-bold text-red-700 block">
                  {activeStyle.mortLabel}
                </span>
                <p className="text-xs sm:text-sm font-black text-red-600 font-sans leading-none mt-0.5">
                  {totalMortality.toLocaleString()} <span className="text-[8.5px] text-red-400 font-bold">/ {totalChicksCount.toLocaleString()}</span>
                </p>
              </div>
              <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-md ${mortStat.color}`}>
                {mortalityRate}%
              </span>
            </div>

            {/* 3. Buying Rate */}
            <div className="bg-slate-50/90 p-2 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[8.5px] font-bold text-slate-500 block">
                  {activeStyle.buyLabel}
                </span>
                <p className="text-xs sm:text-sm font-black text-slate-800 font-sans leading-none mt-0.5">
                  {costPerChick > 0 ? `৳ ${costPerChick.toLocaleString()}` : (language === 'bn' ? 'দর যুক্ত নেই' : 'N/A')}
                </p>
              </div>
              <span className="text-[8px] font-bold text-slate-400">
                {activeStyle.rateSuffix}
              </span>
            </div>

            {/* 4. Live Balance */}
            <div className={`p-2 rounded-xl border flex items-center justify-between ${
              batchMetrics && batchMetrics.netProfit >= 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
            }`}>
              <div>
                <span className="text-[8.5px] font-bold text-slate-500 block">
                  {language === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Net Balance'}
                </span>
                <p className={`text-xs sm:text-sm font-black font-sans leading-none mt-0.5 ${
                  batchMetrics && batchMetrics.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {batchMetrics ? `${batchMetrics.netProfit >= 0 ? '+' : '-'} ৳ ${Math.abs(batchMetrics.netProfit).toLocaleString()}` : '--'}
                </p>
              </div>
              <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-md ${
                batchMetrics && batchMetrics.netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
              }`}>
                {batchMetrics && batchMetrics.netProfit >= 0 ? (language === 'bn' ? 'মুনাফা' : 'Profit') : (language === 'bn' ? 'বিনিয়োগ' : 'Invest')}
              </span>
            </div>
          </div>

          {/* Today's Vaccine Alert & SOP Notification Bar (Slim, Modern & Actionable) */}
          <div className="flex items-center justify-between gap-1.5 p-2 bg-gradient-to-r from-teal-50 via-emerald-50 to-amber-50 rounded-xl border border-teal-200/80 text-[10.5px]">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              {activeBatchVaccine && !activeBatchVaccine.isDone ? (
                <>
                  <span className="text-xs shrink-0 animate-pulse">🚨</span>
                  <div className="min-w-0 truncate">
                    <span className="font-black text-red-900">
                      {activeBatchVaccine.isDueToday ? (language === 'bn' ? 'আজকের টিকা: ' : 'Today\'s Vaccine: ') : (language === 'bn' ? `আসন্ন টিকা (${activeBatchVaccine.daysUntil} দিন): ` : `Upcoming (${activeBatchVaccine.daysUntil}d): `)}
                    </span>
                    <span className="font-bold text-slate-800 truncate">
                      {activeBatchVaccine.item.name}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs shrink-0">📋</span>
                  <div className="min-w-0 truncate">
                    <span className="font-black text-teal-950">
                      {language === 'bn' ? 'দৈনিক এসওপি শিডিউল: ' : 'Daily SOP: '}
                    </span>
                    <span className="font-bold text-slate-700 truncate">
                      {language === 'bn' ? `বয়স ${calculateAge(activeBatch.startDate)} দিন • খাদ্য ও তদারকি গাইড` : `Age ${calculateAge(activeBatch.startDate)}d Schedule`}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {activeBatchVaccine && !activeBatchVaccine.isDone ? (
                <button
                  type="button"
                  onClick={() => toggleVaccineDone(activeBatchVaccine.item)}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[9.5px] font-black cursor-pointer shadow-2xs transition-all active:scale-95 flex items-center gap-0.5"
                >
                  <CheckCircle2 size={10} />
                  <span>{language === 'bn' ? 'টিকা দিন' : 'Mark Done'}</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setIsSopModalOpen(true)}
                className="px-2 py-0.5 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[9.5px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-0.5"
              >
                <span>{language === 'bn' ? 'এসওপি' : 'SOP'}</span>
                <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* Collapsible Section for Complete Batch Financials & Stock */}
          {showBatchDetails && (
            <div className="pt-2 border-t border-slate-150 space-y-2 animate-in fade-in">
              {/* Financial Breakdown */}
              {batchMetrics && (
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-[10.5px] flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-slate-600 font-bold">
                    {language === 'bn' ? 'আয়-ব্যয় হিসাব:' : 'Financials:'}
                  </span>
                  <div className="flex items-center gap-2 font-black">
                    <span className="text-emerald-700">
                      {language === 'bn' ? 'বিক্রি' : 'Sales'}: ৳ {batchMetrics.totalSalesRevenue.toLocaleString()}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-rose-600">
                      {language === 'bn' ? 'খরচ' : 'Cost'}: ৳ {batchMetrics.totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Feed Stock & Forecast Info */}
              {batchMetrics && (
                <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200/80 text-[10.5px] flex items-center justify-between gap-1">
                  <span className="font-bold text-amber-950 truncate">
                    🌾 {batchMetrics.feedForecastNote || (language === 'bn' ? 'ফিড স্টক হিসাব' : 'Feed Forecast')}
                  </span>
                  <span className="text-[9.5px] font-black bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded font-sans shrink-0">
                    {batchMetrics.feedStockRemainingBags} {language === 'bn' ? 'ব্যাগ বাকি' : 'bags left'}
                  </span>
                </div>
              )}

              {/* Quick links footer */}
              <div className="flex items-center justify-between pt-1 text-[11px] font-bold text-slate-500">
                <Link to="/batches" className="hover:text-emerald-700 flex items-center gap-1 transition-colors">
                  <Package size={12} />
                  <span>{language === 'bn' ? 'সকল ব্যাচ তালিকা' : 'All Batches'}</span>
                </Link>
                <Link 
                  to={`/feed${activeBatch?.id ? `?batchId=${activeBatch.id}` : ''}`} 
                  className="text-amber-700 hover:text-amber-800 flex items-center gap-1 font-black transition-colors"
                >
                  <span>{language === 'bn' ? 'খাবার স্টক বিস্তারিত' : 'Feed Stock Details'}</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty Batch State */
        <div className="bg-white rounded-2xl p-4 shadow-xs text-center border-dashed border-2 border-slate-200">
          <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1.5">
            <Package size={20} className="text-slate-400" />
          </div>
          <h4 className="font-extrabold text-slate-850 text-xs mb-1">
            {language === 'bn' ? `কোনো চলমান ${selectedType === 'poultry' ? 'পোল্ট্রি' : selectedType === 'cattle' ? 'পশু' : 'মাছ'} ব্যাচ নেই` : `No active ${selectedType} batch`}
          </h4>
          <p className="text-[9px] text-slate-400 mb-2">
            {language === 'bn' ? 'নতুন ব্যাচ শুরু করতে নিচের বাটনে চাপ দিন' : 'Click below to create a new batch'}
          </p>
          <Link to="/batches" className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-emerald-700 inline-flex items-center gap-1 text-xs shadow-2xs">
            <Plus size={13} />
            {t('dashboard.createBatch')}
          </Link>
        </div>
      )}

      {/* 4. Quick Actions Hub (Modern 3-Tab Selector - Saves massive vertical space!) */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-xs border border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <h4 className="font-extrabold text-slate-850 text-xs flex items-center gap-1.5">
            <Layers size={14} className="text-emerald-600" />
            <span>{t('dashboard.quickActions')}</span>
          </h4>

          {/* 3 Interactive Tab Selector Buttons */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5 border border-slate-200/60 shadow-2xs text-[10.5px] font-black">
            <button
              type="button"
              onClick={() => setQuickActionTab('daily')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                quickActionTab === 'daily'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📝</span>
              <span>{language === 'bn' ? 'দৈনিক এন্ট্রি' : 'Daily'}</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickActionTab('trade')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                quickActionTab === 'trade'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>💰</span>
              <span>{language === 'bn' ? 'বাণিজ্য ও দর' : 'Trade'}</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickActionTab('services')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                quickActionTab === 'services'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🩺</span>
              <span>{language === 'bn' ? 'টুলস ও সেবা' : 'Tools'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Daily Entry (6 Essential Daily Actions in 2 Rows of 3) */}
        {quickActionTab === 'daily' && (
          <div className="grid grid-cols-3 gap-2 animate-in fade-in">
            {/* Feed */}
            <Link to="/feed" className="bg-slate-50 hover:bg-amber-50/40 p-2 rounded-xl border border-slate-150 hover:border-amber-300 flex flex-col items-center justify-center gap-1 transition-all group">
              <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <Wheat size={16} />
              </div>
              <span className="text-[10px] font-black text-slate-700 tracking-tight text-center truncate w-full">{t('dashboard.feed')}</span>
            </Link>

            {/* Water Log */}
            <button 
              type="button"
              onClick={() => openQuickLog('water')}
              className="bg-cyan-50/80 hover:bg-cyan-100/80 p-2 rounded-xl border border-cyan-200/90 hover:border-cyan-400 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <Droplets size={16} className="text-white fill-white/20" />
              </div>
              <span className="text-[10px] font-black text-cyan-950 tracking-tight text-center truncate w-full">
                {language === 'bn' ? 'পানির হিসাব' : 'Water Log'}
              </span>
            </button>

            {/* Medicine */}
            <Link to="/medicine" className="bg-slate-50 hover:bg-blue-50/40 p-2 rounded-xl border border-slate-150 hover:border-blue-300 flex flex-col items-center justify-center gap-1 transition-all group">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <Pill size={16} />
              </div>
              <span className="text-[10px] font-black text-slate-700 tracking-tight text-center truncate w-full">{t('dashboard.medicine')}</span>
            </Link>

            {/* Mortality */}
            <Link to="/mortality" className="bg-slate-50 hover:bg-red-50/40 p-2 rounded-xl border border-slate-150 hover:border-red-300 flex flex-col items-center justify-center gap-1 transition-all group">
              <div className="w-8 h-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <AlertTriangle size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black text-slate-700 tracking-tight text-center truncate w-full">{language === 'bn' ? 'মৃত্যু' : t('dashboard.mortality')}</span>
            </Link>

            {/* Expenses */}
            <Link to="/expenses" className="bg-slate-50 hover:bg-purple-50/40 p-2 rounded-xl border border-slate-150 hover:border-purple-300 flex flex-col items-center justify-center gap-1 transition-all group">
              <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <DollarSign size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black text-slate-700 tracking-tight text-center truncate w-full">{t('dashboard.expenses')}</span>
            </Link>

            {/* Chores / Care (Tadaroki) */}
            <button 
              type="button"
              onClick={() => setIsChoresModalOpen(true)}
              className="bg-emerald-50/60 hover:bg-emerald-100/70 p-2 rounded-xl border border-emerald-200/90 hover:border-emerald-400 flex flex-col items-center justify-center gap-1 transition-all group relative cursor-pointer"
            >
              <div className="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 relative shadow-2xs">
                <ClipboardCheck size={16} strokeWidth={2.3} />
                {chores.length > 0 && (
                  <span className={`absolute -top-1 -right-1 text-[8px] font-black px-1 py-0.2 rounded-full border border-white font-sans ${
                    totalCompletedChores === chores.length 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-amber-500 text-white'
                  }`}>
                    {totalCompletedChores}/{chores.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-black text-emerald-900 tracking-tight block truncate">
                {language === 'bn' ? 'তদারকি' : 'Care'}
              </span>
            </button>
          </div>
        )}

        {/* Tab 2: Trade & Market (বাণিজ্য ও বাজার) */}
        {quickActionTab === 'trade' && (
          <div className="grid grid-cols-3 gap-2 animate-in fade-in">
            {/* Sales */}
            <Link to="/sales" className="bg-slate-50 hover:bg-teal-50/40 p-2 rounded-xl border border-slate-150 hover:border-teal-300 flex flex-col items-center justify-center gap-1 transition-all group">
              <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <TrendingUp size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black text-slate-700 tracking-tight text-center truncate w-full">{t('dashboard.sales')}</span>
            </Link>

            {/* Dues */}
            <Link to="/dues" className="bg-slate-50 hover:bg-pink-50/40 p-2 rounded-xl border border-slate-150 hover:border-pink-300 flex flex-col items-center justify-center gap-1 transition-all group">
              <div className="w-8 h-8 bg-pink-100 text-pink-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <FileText size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black text-slate-700 tracking-tight text-center truncate w-full">{t('dashboard.dues')}</span>
            </Link>

            {/* Live Market Rates */}
            <button 
              type="button"
              onClick={() => setIsMarketRatesModalOpen(true)}
              className="bg-amber-50/70 hover:bg-amber-100/80 p-2 rounded-xl border border-amber-200/90 hover:border-amber-400 flex flex-col items-center justify-center gap-1 transition-all group relative cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 relative shadow-2xs">
                <Store size={16} strokeWidth={2.3} />
                <span className="absolute -top-1 -right-1 text-[7px] font-black px-1 py-0.2 bg-red-600 text-white rounded-full uppercase border border-white tracking-wider animate-pulse">
                  LIVE
                </span>
              </div>
              <span className="text-[10px] font-black text-amber-900 tracking-tight block truncate">
                {language === 'bn' ? 'লাইভ বাজার দর' : 'Live Market'}
              </span>
            </button>

            {/* Chicks Market */}
            <Link 
              to="/chicks"
              className="bg-orange-50/70 hover:bg-orange-100/80 p-2 rounded-xl border border-orange-200/90 hover:border-orange-400 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <span className="text-sm leading-none">🐣</span>
              </div>
              <span className="text-[10px] font-black text-orange-950 tracking-tight block truncate">
                {language === 'bn' ? 'বাচ্চা ক্রয়' : 'Chick Booking'}
              </span>
            </Link>

            {/* Batch Compare */}
            <Link 
              to="/batches?filter=compare"
              className="bg-blue-50/70 hover:bg-blue-100/80 p-2 rounded-xl border border-blue-200/90 hover:border-blue-400 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <GitCompare size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black text-blue-900 tracking-tight block truncate">
                {language === 'bn' ? 'ব্যাচ তুলনা' : 'Compare'}
              </span>
            </Link>

            {/* All Batches */}
            <Link 
              to="/batches"
              className="bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-slate-200/90 hover:border-slate-300 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <Package size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black text-slate-700 tracking-tight block truncate">
                {language === 'bn' ? 'সব ব্যাচ' : 'Batches'}
              </span>
            </Link>
          </div>
        )}

        {/* Tab 3: Tools & Services (টুলস ও সেবা) */}
        {quickActionTab === 'services' && (
          <div className="grid grid-cols-3 gap-2 animate-in fade-in">
            {/* Vaccine Schedule */}
            <Link 
              to="/medicine?tab=schedule"
              className="bg-indigo-50/80 hover:bg-indigo-100/90 p-2 rounded-xl border border-indigo-200/90 hover:border-indigo-400 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer shadow-2xs relative"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <Syringe size={16} strokeWidth={2.4} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-indigo-950 tracking-tight text-center truncate w-full">
                {language === 'bn' ? 'টিকা শিডিউল' : 'Vaccine'}
              </span>
              <span className="absolute -top-1 -right-1 text-[7px] font-black px-1.5 py-0.2 bg-purple-600 text-white rounded-full uppercase border border-white tracking-wider">
                {language === 'bn' ? 'রুটিন' : 'PLAN'}
              </span>
            </Link>

            {/* SOP Chart */}
            <button 
              type="button"
              onClick={() => setIsSopModalOpen(true)}
              className="bg-emerald-50/70 hover:bg-emerald-100/80 p-2 rounded-xl border border-emerald-200/90 hover:border-emerald-400 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer shadow-2xs relative"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-teal-700 to-emerald-700 text-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <ClipboardList size={16} strokeWidth={2.4} />
              </div>
              <span className="text-[10px] font-black text-emerald-950 tracking-tight block truncate">
                {language === 'bn' ? 'এসওপি চার্ট' : 'SOP Chart'}
              </span>
            </button>

            {/* Smart Disease Advisor */}
            <Link
              to="/disease-advisor"
              className="bg-emerald-50/80 hover:bg-emerald-100/90 p-2 rounded-xl border border-emerald-300 hover:border-emerald-500 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer shadow-2xs relative"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 text-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                <span className="text-base leading-none">🩺</span>
              </div>
              <span className="text-[10px] font-black text-emerald-950 tracking-tight text-center truncate w-full">
                {language === 'bn' ? 'রোগ ও ঔষধ' : 'Disease Rx'}
              </span>
              <span className="absolute -top-1 -right-1 text-[7px] font-black px-1.5 py-0.2 bg-amber-500 text-white rounded-full uppercase border border-white tracking-wider animate-pulse">
                NEW
              </span>
            </Link>

            {/* Doctor Consultation */}
            <Link
              to="/doctor"
              className="bg-teal-50/70 hover:bg-teal-100/80 p-2 rounded-xl border border-teal-200/90 hover:border-teal-400 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer shadow-2xs relative"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center rounded-xl font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Stethoscope size={16} />
              </div>
              <span className="text-[10px] font-black text-teal-950 tracking-tight block truncate">
                {language === 'bn' ? 'ডাক্তার কল' : 'Vet Care'}
              </span>
              <span className="absolute -top-1 -right-1 text-[7px] font-black px-1.5 py-0.2 bg-emerald-600 text-white rounded-full uppercase border border-white tracking-wider">
                24/7
              </span>
            </Link>

            {/* FCR Calculator */}
            <Link
              to="/fcr"
              className="bg-emerald-50/60 hover:bg-emerald-100/70 p-2 rounded-xl border border-emerald-200/90 hover:border-emerald-400 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center rounded-xl font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Calculator size={16} strokeWidth={2.3} />
              </div>
              <span className="text-[10px] font-black text-emerald-950 tracking-tight block truncate">
                {language === 'bn' ? 'FCR হিসাব' : 'FCR Calc'}
              </span>
            </Link>

            {/* Feed Quality Guide */}
            <button
              type="button"
              onClick={() => setIsFeedQualityOpen(true)}
              className="bg-amber-50/60 hover:bg-amber-100/70 p-2 rounded-xl border border-amber-200/90 hover:border-amber-400 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center rounded-xl font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Wheat size={16} strokeWidth={2.3} />
              </div>
              <span className="text-[10px] font-black text-amber-950 tracking-tight block truncate">
                {language === 'bn' ? 'ফিড পুষ্টি' : 'Feed Guide'}
              </span>
            </button>

            {/* Sponsors */}
            <button 
              type="button"
              onClick={() => setIsSponsorsModalOpen(true)}
              className="bg-purple-50/60 hover:bg-purple-100/70 p-2 rounded-xl border border-purple-200/90 hover:border-purple-400 flex flex-col items-center justify-center gap-1 transition-all group relative cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-indigo-600 to-amber-500 text-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 relative shadow-2xs">
                <Sparkles size={16} strokeWidth={2.3} />
              </div>
              <span className="text-[10px] font-black text-purple-950 tracking-tight block truncate">
                {language === 'bn' ? 'স্পনসর' : 'Sponsors'}
              </span>
            </button>
          </div>
        )}

        {/* 2-Column Balanced Hub: 6 Smart Service Tiles (Saves ~400px compared to giant vertical banners!) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              {language === 'bn' ? 'খামার সেবা ও বাজার টুলস' : 'Farm Tools & Hub'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 1. FCR Tool */}
            <Link
              to="/fcr"
              className="p-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-200/80 transition-all group flex items-center justify-between gap-1.5 min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Calculator size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-850 truncate leading-tight">
                    {language === 'bn' ? 'FCR হিসাব' : 'FCR Engine'}
                  </p>
                  <p className="text-[8.5px] text-slate-500 font-bold truncate">
                    {language === 'bn' ? 'খাঁটি FCR নির্ণয়' : 'Isolated FCR'}
                  </p>
                </div>
              </div>
              <ChevronRight size={12} className="text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* 2. Feed Quality Guide */}
            <button
              type="button"
              onClick={() => setIsFeedQualityOpen(true)}
              className="p-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-200/80 transition-all group flex items-center justify-between gap-1.5 min-w-0 cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Wheat size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-850 truncate leading-tight">
                    {language === 'bn' ? 'ফিড পুষ্টি গাইড' : 'Feed Guide'}
                  </p>
                  <p className="text-[8.5px] text-slate-500 font-bold truncate">
                    {language === 'bn' ? 'ভালো ফিড চেনার উপায়' : 'Nutrition chart'}
                  </p>
                </div>
              </div>
              <ChevronRight size={12} className="text-amber-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* 3. Reports & Analytics (Unified) */}
            <Link
              to="/reports"
              className="p-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-200/80 transition-all group flex items-center justify-between gap-1.5 min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <BarChart3 size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-850 truncate leading-tight">
                    {language === 'bn' ? 'রিপোর্ট ও খামার বিশ্লেষণ' : 'Reports & Analytics'}
                  </p>
                  <p className="text-[8.5px] text-slate-500 font-bold truncate">
                    {language === 'bn' ? 'লাভ-ক্ষতি, ইনসাইটস ও ব্যাকআপ' : 'P&L, insights & export'}
                  </p>
                </div>
              </div>
              <ChevronRight size={12} className="text-indigo-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* 4. Veterinary Doctor Consultation */}
            <Link
              to="/doctor"
              className="p-2 rounded-xl bg-gradient-to-r from-teal-500/10 to-blue-500/10 hover:from-teal-500/20 hover:to-blue-500/20 border border-teal-200/80 transition-all group flex items-center justify-between gap-1.5 min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Stethoscope size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-850 truncate leading-tight">
                    {language === 'bn' ? 'ডাক্তারি পরামর্শ' : 'Vet Helpline'}
                  </p>
                  <p className="text-[8.5px] text-slate-500 font-bold truncate">
                    {language === 'bn' ? '১৬১২৩ ও সার্জন কল' : 'Doctor & hotline'}
                  </p>
                </div>
              </div>
              <ChevronRight size={12} className="text-teal-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* 5. Marketplace / Buyer Network */}
            <Link
              to="/marketplace"
              className="p-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 border border-orange-200/80 transition-all group flex items-center justify-between gap-1.5 min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-red-500 text-white flex items-center justify-center font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Users size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-850 truncate leading-tight">
                    {language === 'bn' ? 'পাইকার ও বিক্রি' : 'Wholesale Market'}
                  </p>
                  <p className="text-[8.5px] text-slate-500 font-bold truncate">
                    {language === 'bn' ? 'পাইকার ও বিজ্ঞাপন' : 'Buyers directory'}
                  </p>
                </div>
              </div>
              <ChevronRight size={12} className="text-amber-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* 6. Store Directory */}
            <Link
              to="/store"
              className="p-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:to-cyan-500/20 border border-emerald-200/80 transition-all group flex items-center justify-between gap-1.5 min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Store size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-850 truncate leading-tight">
                    {language === 'bn' ? 'দোকান ডিরেক্টরি' : 'Agri-Vet Stores'}
                  </p>
                  <p className="text-[8.5px] text-slate-500 font-bold truncate">
                    {language === 'bn' ? '৬৪ জেলার দোকান' : 'Feed & Medicine'}
                  </p>
                </div>
              </div>
              <ChevronRight size={12} className="text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* 7. Smart Disease Diagnosis & Medicine Rx (NEW) */}
            <Link
              to="/disease-advisor"
              className="p-2 rounded-xl bg-gradient-to-r from-emerald-600/15 via-teal-600/15 to-slate-900/10 hover:from-emerald-600/25 hover:to-teal-600/25 border border-emerald-300 transition-all group flex items-center justify-between gap-1.5 min-w-0 relative shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-slate-900 text-white flex items-center justify-center font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Pill size={14} className="text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] font-black text-slate-900 truncate leading-tight">
                      {language === 'bn' ? 'রোগ ও ঔষধ গাইড' : 'Disease Rx Guide'}
                    </p>
                    <span className="px-1 py-0.2 bg-emerald-600 text-white rounded text-[7px] font-black uppercase">
                      NEW
                    </span>
                  </div>
                  <p className="text-[8.5px] text-emerald-800 font-bold truncate">
                    {language === 'bn' ? 'রোগ লিখে সঠিক ঔষধ' : 'Instant Rx advisor'}
                  </p>
                </div>
              </div>
              <ChevronRight size={12} className="text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* 8. Chick Market / Hatchery */}
            <Link
              to="/chicks"
              className="p-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-orange-200/80 transition-all group flex items-center justify-between gap-1.5 min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <span className="text-xs leading-none">🐣</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-850 truncate leading-tight">
                    {language === 'bn' ? 'বাচ্চা ও হ্যাচারি' : 'Chick Market'}
                  </p>
                  <p className="text-[8.5px] text-slate-500 font-bold truncate">
                    {language === 'bn' ? 'দর ও বাচ্চা ক্রয়' : 'Chick booking'}
                  </p>
                </div>
              </div>
              <ChevronRight size={12} className="text-amber-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Recent Activity Logs (Ultra-compact) */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
            <Activity size={14} className="text-green-600" />
            {t('dashboard.recentActivity')}
          </h4>
          <span className="text-[9px] font-bold text-slate-400">
            {recentActivities.length > 0 ? `${recentActivities.length} ${language === 'bn' ? 'টি এন্ট্রি' : 'entries'}` : (language === 'bn' ? 'লাইভ আপডেট' : 'Live')}
          </span>
        </div>

        {recentActivities.length > 0 ? (
          <div className="space-y-1.5">
            {recentActivities.map((act) => {
              const dateObj = new Date(act.date);
              const formattedDate = isNaN(dateObj.getTime()) 
                ? act.date 
                : dateObj.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' });
              
              let typeColor = 'bg-slate-100 text-slate-600';
              if (act.type === 'feed') typeColor = 'bg-orange-50 text-orange-600 border border-orange-100';
              if (act.type === 'medicine') typeColor = 'bg-blue-50 text-blue-600 border border-blue-100';
              if (act.type === 'expense') typeColor = 'bg-purple-50 text-purple-600 border border-purple-100';
              if (act.type === 'sales') typeColor = 'bg-teal-50 text-teal-600 border border-teal-100';

              return (
                <div key={act.id} className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${typeColor}`}>
                        {language === 'bn' ? act.titleBn : act.titleEn}
                      </span>
                      <span className="text-[9px] text-slate-400 font-sans">{formattedDate}</span>
                    </div>
                    <p className="text-[10px] text-slate-700 font-bold truncate">
                      {language === 'bn' ? act.detailsBn : act.detailsEn}
                    </p>
                  </div>
                  
                  {act.amount > 0 && (
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-black font-sans ${act.type === 'sales' ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {act.type === 'sales' ? '+' : '-'} ৳ {act.amount}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-3 text-slate-400 text-[10px] border border-dashed border-slate-150 rounded-xl">
            {t('dashboard.noActivity')}
          </div>
        )}
      </div>

      {/* 5. Chores Modal Dialog */}
      {isChoresModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-3.5 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <ClipboardCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-850 leading-tight">
                    {language === 'bn' ? 'আজকের খামার তদারকি তালিকা' : 'Daily Farm Operations Checklist'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                    {language === 'bn' ? 'কাজ শেষ করে টিক দিয়ে সম্পন্ন করুন' : 'Tick off operations as you finish them.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsChoresModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Progress Status Bar */}
            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-150">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-slate-700">
                  {language === 'bn' ? 'সার্বিক অগ্রগতি:' : 'Progress:'}
                </span>
                <span className="text-[10px] font-black text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200 font-sans shadow-2xs">
                  {totalCompletedChores}/{chores.length} {language === 'bn' ? 'সম্পন্ন' : 'Done'} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Chores Checkbox List */}
            <div className="space-y-1.5">
              {chores.map((chore) => (
                <button
                  key={chore.id}
                  onClick={() => toggleChore(chore.id)}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 transition-all duration-150 cursor-pointer ${
                    chore.completed 
                      ? 'bg-slate-50/80 border border-slate-200/60 text-slate-400 line-through' 
                      : 'bg-white border border-slate-200 text-slate-850 hover:bg-emerald-50/30 hover:border-emerald-300 shadow-2xs'
                  }`}
                >
                  <div className="shrink-0 transition-transform active:scale-95 duration-100">
                    {chore.completed ? (
                      <CheckSquare size={17} className="text-emerald-600" />
                    ) : (
                      <Square size={17} className="text-slate-400 hover:text-emerald-600" />
                    )}
                  </div>
                  <span className="text-xs font-bold leading-relaxed">
                    {language === 'bn' ? chore.textBn : chore.textEn}
                  </span>
                </button>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-1">
              <button
                onClick={() => setIsChoresModalOpen(false)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={15} />
                {language === 'bn' ? 'সম্পন্ন / বন্ধ করুন' : 'Done / Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. Live Market Rates Modal Dialog */}
      {isMarketRatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-3 animate-scaleUp">
            
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <Store size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-850 leading-tight">
                    {language === 'bn' ? 'আজকের লাইভ বাজার দর' : 'Live Market Rates'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                    {language === 'bn' ? 'পাইকারি ও খুচরা দর তালিকা' : 'Daily Wholesale & Retail price board'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsMarketRatesModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Embedded MarketRatesCard */}
            <MarketRatesCard farmType={selectedType} />

            {/* Close Button */}
            <button
              onClick={() => setIsMarketRatesModalOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* 7. Sponsors & Partners Modal Dialog */}
      {isSponsorsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-3 animate-scaleUp">
            
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-850 leading-tight">
                    {language === 'bn' ? 'স্পনসর খাদ্য ও ঔষধ পার্টনার্স' : 'Sponsored Feed & Health Partners'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                    {language === 'bn' ? 'যাচাইকৃত কোম্পানি ও ফ্রি ডাক্তার হেল্পলাইন' : 'Verified feed mills & vet consultation helplines'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSponsorsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Embedded SponsorCard with Tabs */}
            <SponsorCard type="all" />

            {/* Close Button */}
            <button
              onClick={() => setIsSponsorsModalOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* 8. Unified Quick Daily Log Modal */}
      <QuickDailyLogModal
        isOpen={isQuickLogOpen}
        initialTab={quickLogTab}
        onClose={() => setIsQuickLogOpen(false)}
        activeBatch={activeBatch}
        batches={categoryBatches}
        onSuccess={() => {
          if (activeBatch) {
            fetchMortality(activeBatch.id);
            fetchBatchMetrics(activeBatch);
          }
          fetchRecentActivitiesAndStats();
        }}
      />

      {/* 9. Dynamic Batch SOP & Standard Feed Planner Modal */}
      {isSopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="max-w-5xl w-full my-auto">
            <BroilerDailySopCard
              batches={categoryBatches}
              selectedBatchId={activeBatch?.id}
              initialBatch={activeBatch}
              farmCategory={selectedType}
              isBn={language === 'bn'}
              currentUser={currentUser}
              isDemoUser={isDemoUser}
              onClose={() => setIsSopModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 10. Feed Quality & Nutrition Guide Modal */}
      <FeedQualityGuideModal 
        isOpen={isFeedQualityOpen}
        onClose={() => setIsFeedQualityOpen(false)}
        defaultFarmType={selectedType}
      />

    </div>
  );
}
