import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { demoStore } from '../utils/demoStore';
import MarketRatesCard from '../components/MarketRatesCard';
import SponsorCard from '../components/SponsorCard';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Activity, 
  CheckCircle, 
  Layers, 
  ChevronRight, 
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
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [loading, setLoading] = useState(true);
  const [totalMortality, setTotalMortality] = useState<number>(0);
  const [profileData, setProfileData] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Modals state
  const [isChoresModalOpen, setIsChoresModalOpen] = useState<boolean>(false);
  const [isMarketRatesModalOpen, setIsMarketRatesModalOpen] = useState<boolean>(false);
  const [isSponsorsModalOpen, setIsSponsorsModalOpen] = useState<boolean>(false);

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
    if (isDemoUser) {
      setProfileData(demoStore.getProfile());
      const loadDemoDashboard = () => {
        const allBatches = demoStore.getBatches();
        const active = allBatches.find(b => b.status === 'active' && b.farmType === selectedType) 
          || allBatches.find(b => b.status === 'active') 
          || null;
        setActiveBatch(active);
        if (active) {
          const mort = demoStore.getMortalityRecords(active.id);
          const totalM = mort.reduce((acc, m) => acc + (Number(m.count) || 0), 0);
          setTotalMortality(totalM);
        } else {
          setTotalMortality(0);
        }

        // Activities
        const acts: any[] = [];
        demoStore.getFeedRecords().slice(0, 2).forEach(d => {
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
        demoStore.getMedicineRecords().slice(0, 2).forEach(d => {
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
        demoStore.getExpenses().slice(0, 2).forEach(d => {
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
        demoStore.getSales().slice(0, 2).forEach(d => {
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
        setLoading(false);
      };

      loadDemoDashboard();
      const unsub = demoStore.subscribe(loadDemoDashboard);
      return () => unsub();
    }

    fetchActiveBatch();
    fetchRecentActivitiesAndStats();
    
    if (currentUser) {
      const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docObj) => {
        if (docObj.exists()) {
          setProfileData(docObj.data());
        }
      }, (err) => {
        console.warn('Dashboard profile onSnapshot error:', err);
      });
      return () => unsub();
    }
  }, [currentUser, isDemoUser, selectedType]);

  const fetchActiveBatch = async () => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'batches'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'active'),
        where('farmType', '==', selectedType)
      );
      const snapshot = await fastGetDocs(q);
      if (!snapshot.empty) {
        const batchData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setActiveBatch(batchData);
        fetchMortality(batchData.id);
      } else {
        const qFallback = query(
          collection(db, 'batches'),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'active')
        );
        const fbSnap = await fastGetDocs(qFallback);
        if (!fbSnap.empty) {
          const batchData = { id: fbSnap.docs[0].id, ...fbSnap.docs[0].data() };
          setActiveBatch(batchData);
          fetchMortality(batchData.id);
        } else {
          setActiveBatch(null);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'batches');
    } finally {
      setLoading(false);
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
      heading: language === 'bn' ? 'পোল্ট্রি খামার' : 'Poultry Farm',
      tagline: language === 'bn' ? 'মুরগির ব্যাচ ও বাজার ট্র্যাকার' : 'Flock and Market Tracker',
    },
    cattle: {
      heading: language === 'bn' ? 'পশুপালন খামার' : 'Livestock Farm',
      tagline: language === 'bn' ? 'গরু, বাছুর ও দুধ ট্র্যাকার' : 'Cattle & Dairy Tracker',
    },
    fish: {
      heading: language === 'bn' ? 'মৎস্য চাষ খামার' : 'Fisheries Pond',
      tagline: language === 'bn' ? 'পুকুর ও মাছ চাষ ট্র্যাকার' : 'Pond & Fish Tracker',
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
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'poultry'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/40'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Poultry"
          >
            🐔
          </button>
          <button
            onClick={() => handleSelectTypeOnDashboard('cattle')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'cattle'
                ? 'bg-white text-amber-800 shadow-xs border border-slate-200/40'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Cattle"
          >
            🐄
          </button>
          <button
            onClick={() => handleSelectTypeOnDashboard('fish')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedType === 'fish'
                ? 'bg-white text-blue-800 shadow-xs border border-slate-200/40'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Fishery"
          >
            🐟
          </button>
        </div>
      </div>

      {/* 2. Central Active Batch Spotlight Card (কেনার তারিখ, দর, সংখ্যা, বয়স, জীবিত ও মৃত্যু) */}
      {activeBatch ? (
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-emerald-200/80 relative overflow-hidden">
          {/* Header of Active Batch */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-emerald-100">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <Package size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">
                  {language === 'bn' ? 'চলমান ব্যাচ' : 'Active Batch'}
                </p>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-850 truncate leading-tight">
                  {activeBatch.batchName}
                </h3>
              </div>
            </div>
            <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 shrink-0">
              {language === 'bn' ? 'চলমান ✓' : 'Active'}
            </span>
          </div>

          {/* Clean Grid of Key Batch Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
            {/* 1. Start / Buying Date */}
            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/70 flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                <Calendar size={10} className="text-blue-500" />
                {language === 'bn' ? 'কেনার তারিখ' : 'Buy Date'}
              </span>
              <p className="text-xs font-black text-slate-800 font-sans">
                {formatDateDisplay(activeBatch.startDate)}
              </p>
            </div>

            {/* 2. Chick Rate / Buying Cost */}
            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/70 flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                <DollarSign size={10} className="text-emerald-600" />
                {language === 'bn' ? 'বাচ্চার ক্রয়দর' : 'Chick Rate'}
              </span>
              <p className="text-xs font-black text-emerald-700 font-sans">
                {costPerChick > 0 ? `৳ ${costPerChick}/পিস` : (language === 'bn' ? 'দর যুক্ত নেই' : 'N/A')}
              </p>
            </div>

            {/* 3. Total Starting Birds */}
            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/70 flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                <Users size={10} className="text-indigo-500" />
                {language === 'bn' ? 'শুরুর সংখ্যা' : 'Total Count'}
              </span>
              <p className="text-xs font-black text-indigo-700 font-sans">
                {totalChicksCount} {language === 'bn' ? 'টি' : ''}
              </p>
            </div>

            {/* 4. Current Age */}
            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/70 flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                <Clock size={10} className="text-amber-500" />
                {language === 'bn' ? 'বর্তমান বয়স' : 'Current Age'}
              </span>
              <p className="text-xs font-black text-amber-700 font-sans">
                {calculateAge(activeBatch.startDate)} {language === 'bn' ? 'দিন' : 'days'}
              </p>
            </div>
          </div>

          {/* Secondary Highlight: Alive Birds & Mortality Rate */}
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            {/* Alive Birds */}
            <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-emerald-800 block">
                  {language === 'bn' ? 'জীবিত পাখি' : 'Alive Birds'}
                </span>
                <p className="text-sm font-black text-emerald-700 font-sans leading-none mt-1">
                  {aliveBirdsCount} <span className="text-[9px] text-emerald-600 font-bold">{language === 'bn' ? 'টি' : 'pcs'}</span>
                </p>
              </div>
              <span className="text-[9px] font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded-full border border-emerald-200">
                {totalChicksCount > 0 ? `${Math.round((aliveBirdsCount / totalChicksCount) * 100)}%` : '100%'}
              </span>
            </div>

            {/* Total Mortality & Status */}
            <div className="bg-red-50/50 p-2 rounded-xl border border-red-200 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-red-700 block">
                  {language === 'bn' ? 'মোট মৃত্যু' : 'Mortality'}
                </span>
                <p className="text-sm font-black text-red-600 font-sans leading-none mt-1">
                  {totalMortality} <span className="text-[9px] text-red-400 font-bold">/ {totalChicksCount}</span>
                </p>
              </div>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${mortStat.color}`}>
                {language === 'bn' ? mortStat.labelBn : mortStat.labelEn} ({mortalityRate}%)
              </span>
            </div>
          </div>

          {/* Direct CTA button to Batches & FCR */}
          <Link
            to="/batches"
            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {language === 'bn' ? 'ব্যাচ ও FCR এনালাইটিক্স' : 'Batch Details & FCR Analytics'}
            <ChevronRight size={13} />
          </Link>
        </div>
      ) : (
        /* Empty Batch State */
        <div className="bg-white rounded-2xl p-4 shadow-xs text-center border-dashed border-2 border-slate-200">
          <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1.5">
            <Package size={20} className="text-slate-400" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-xs mb-1">
            {language === 'bn' ? `কোনো চলমান ${selectedType === 'poultry' ? 'পোল্ট্রি' : selectedType === 'cattle' ? 'পশু' : 'মাছ'} ব্যাচ নেই` : `No active ${selectedType} batch`}
          </h4>
          <p className="text-[9px] text-slate-400 mb-2">{t('dashboard.noBatchesSub')}</p>
          <Link to="/batches" className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-emerald-700 inline-flex items-center gap-1 text-xs shadow-2xs">
            <Plus size={13} />
            {t('dashboard.createBatch')}
          </Link>
        </div>
      )}

      {/* 3. Quick Actions Launcher with 9 Buttons (খাবার, ঔষধ, মৃত্যু, খরচ, বিক্রয়, বকেয়া, 📋 তদারকি, 🏷️ বাজার দর, 🌟 স্পনসর) */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="font-extrabold text-slate-850 text-xs flex items-center gap-1.5">
            <Layers size={15} className="text-emerald-600" />
            {t('dashboard.quickActions')}
          </h4>
          <span className="text-[9px] font-bold text-slate-400">
            {language === 'bn' ? '৯টি জরুরি শর্টকাট' : '9 Quick Shortcuts'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* 1. Feed */}
          <Link to="/feed" className="bg-slate-50/80 p-2 rounded-xl border border-slate-150 flex flex-col items-center justify-center gap-1 hover:border-amber-300 hover:bg-amber-50/20 transition-all duration-150 group">
            <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 tracking-tight text-center">{t('dashboard.feed')}</span>
          </Link>

          {/* 2. Medicine */}
          <Link to="/medicine" className="bg-slate-50/80 p-2 rounded-xl border border-slate-150 flex flex-col items-center justify-center gap-1 hover:border-blue-300 hover:bg-blue-50/20 transition-all duration-150 group">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 tracking-tight text-center">{t('dashboard.medicine')}</span>
          </Link>

          {/* 3. Mortality */}
          <Link to="/mortality" className="bg-slate-50/80 p-2 rounded-xl border border-slate-150 flex flex-col items-center justify-center gap-1 hover:border-red-300 hover:bg-red-50/20 transition-all duration-150 group">
            <div className="w-8 h-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
               <AlertTriangle size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 tracking-tight text-center truncate w-full">{language === 'bn' ? 'মৃত্যু' : t('dashboard.mortality')}</span>
          </Link>

          {/* 4. Expenses */}
          <Link to="/expenses" className="bg-slate-50/80 p-2 rounded-xl border border-slate-150 flex flex-col items-center justify-center gap-1 hover:border-purple-300 hover:bg-purple-50/20 transition-all duration-150 group">
            <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
               <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 tracking-tight text-center">{t('dashboard.expenses')}</span>
          </Link>

          {/* 5. Sales */}
          <Link to="/sales" className="bg-slate-50/80 p-2 rounded-xl border border-slate-150 flex flex-col items-center justify-center gap-1 hover:border-teal-300 hover:bg-teal-50/20 transition-all duration-150 group">
            <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 tracking-tight text-center">{t('dashboard.sales')}</span>
          </Link>

          {/* 6. Dues */}
          <Link to="/dues" className="bg-slate-50/80 p-2 rounded-xl border border-slate-150 flex flex-col items-center justify-center gap-1 hover:border-pink-300 hover:bg-pink-50/20 transition-all duration-150 group">
            <div className="w-8 h-8 bg-pink-100 text-pink-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 tracking-tight text-center">{t('dashboard.dues')}</span>
          </Link>

          {/* 7. Daily Care / Chores (Tadaroki) with Live Badge */}
          <button 
            type="button"
            onClick={() => setIsChoresModalOpen(true)}
            className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-200/80 flex flex-col items-center justify-center gap-1 hover:border-emerald-400 hover:bg-emerald-50/90 transition-all duration-150 group relative cursor-pointer"
          >
            <div className="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 relative">
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
            <span className="text-[10px] font-extrabold text-emerald-800 tracking-tight block truncate">
              {language === 'bn' ? 'তদারকি' : 'Care'}
            </span>
          </button>

          {/* 8. Live Market Rates (লাইভ বাজার দর পপআপ) with LIVE Badge */}
          <button 
            type="button"
            onClick={() => setIsMarketRatesModalOpen(true)}
            className="bg-amber-50/60 p-2 rounded-xl border border-amber-200/90 flex flex-col items-center justify-center gap-1 hover:border-amber-400 hover:bg-amber-100/70 transition-all duration-150 group relative cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 relative shadow-2xs">
              <Store size={16} strokeWidth={2.3} />
              <span className="absolute -top-1 -right-1.5 text-[7px] font-black px-1 py-0.2 bg-red-600 text-white rounded-full uppercase border border-white tracking-wider animate-pulse">
                LIVE
              </span>
            </div>
            <span className="text-[10px] font-extrabold text-amber-850 tracking-tight block truncate">
              {language === 'bn' ? 'বাজার দর' : 'Market'}
            </span>
          </button>

          {/* 9. Sponsored Partners (স্পনসর খাদ্য ও ঔষধ পার্টনার্স) with PRO Badge */}
          <button 
            type="button"
            onClick={() => setIsSponsorsModalOpen(true)}
            className="bg-purple-50/60 p-2 rounded-xl border border-purple-200/90 flex flex-col items-center justify-center gap-1 hover:border-purple-400 hover:bg-purple-100/70 transition-all duration-150 group relative cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-indigo-600 to-amber-500 text-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 relative shadow-2xs">
              <Sparkles size={16} strokeWidth={2.3} />
              <span className="absolute -top-1 -right-1.5 text-[7px] font-black px-1 py-0.2 bg-amber-400 text-slate-950 rounded-full uppercase border border-white tracking-wider animate-pulse">
                PRO
              </span>
            </div>
            <span className="text-[10px] font-extrabold text-purple-950 tracking-tight block truncate">
              {language === 'bn' ? 'স্পনসর' : 'Sponsors'}
            </span>
          </button>
        </div>

        {/* Dedicated Marketplace / Buyer Network Link */}
        <Link
          to="/marketplace"
          className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between p-2 rounded-xl bg-linear-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 hover:from-amber-500/20 hover:to-red-500/20 border-amber-200/60 transition-all group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-red-500 text-white flex items-center justify-center font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Users size={14} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-850 truncate leading-tight">
                  {language === 'bn' ? 'পাইকার ডিরেক্টরি ও জরুরি মুরগি বিক্রি' : 'Buyer Network & Emergency Sale'}
                </span>
                <span className="bg-red-600 text-white text-[7px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">
                  NEW
                </span>
              </div>
              <p className="text-[9px] text-slate-500 font-bold truncate">
                {language === 'bn' ? 'সরাসরি পাইকারদের নম্বর ও বিক্রির বিজ্ঞাপন পোস্ট' : 'Find buyers & post quick sell alerts'}
              </p>
            </div>
          </div>
          <ArrowRight size={14} className="text-amber-700 shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* 4. Recent Activity Logs (Ultra-compact) */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
            <Activity size={14} className="text-green-600" />
            {t('dashboard.recentActivity')}
          </h4>
          <Link to="/reports" className="text-[9px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5">
            <FileText size={10} />
            {language === 'bn' ? 'রিপোর্ট' : 'Reports'}
          </Link>
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

    </div>
  );
}
