import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, offlineSafeDocWrite, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Package, Plus, Trash2, CheckCircle2, ArrowRight, LayoutDashboard, Calendar, Users, DollarSign, LineChart as ChartIcon, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import PoultryFeedPlan from '../components/PoultryFeedPlan';
import BatchComparisonCard, { BatchSummaryStats } from '../components/BatchComparisonCard';
import { demoStore } from '../utils/demoStore';
import { useNavigate } from 'react-router-dom';

const BatchSummary = ({ batchId, totalChicks, costPerChick }: { batchId: string, totalChicks: number, costPerChick: number }) => {
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const [totalSales, setTotalSales] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [feedCost, setFeedCost] = useState(0);
  const [medCost, setMedCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [chickCost, setChickCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchSummary = async () => {
      try {
        let tFeed = 0;
        let tMed = 0;
        let tOther = 0;
        let tSales = 0;
        const cChick = Number(totalChicks || 0) * Number(costPerChick || 0);

        if (isDemoUser) {
          demoStore.getSales(batchId).forEach(s => tSales += Number(s.totalAmount || 0));
          demoStore.getExpenses(batchId).forEach(e => tOther += Number(e.amount || 0));
          demoStore.getFeedRecords(batchId).forEach(f => tFeed += Number(f.cost || 0));
          demoStore.getMedicineRecords(batchId).forEach(m => tMed += Number(m.cost || 0));
          
          const tAllCost = cChick + tFeed + tMed + tOther;
          setChickCost(cChick);
          setFeedCost(tFeed);
          setMedCost(tMed);
          setOtherCost(tOther);
          setTotalSales(tSales);
          setTotalCost(tAllCost);
          setLoading(false);
          return;
        }

        // Fetch Sales
        const salesQ = query(collection(db, 'sales'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const salesSnap = await fastGetDocs(salesQ);
        salesSnap.forEach(doc => tSales += Number(doc.data().totalAmount || 0));

        // Fetch Expenses
        const expQ = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const expSnap = await fastGetDocs(expQ);
        expSnap.forEach(doc => tOther += Number(doc.data().amount || 0));

        // Fetch Feed Cost
        const feedQ = query(collection(db, 'feed_records'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const feedSnap = await fastGetDocs(feedQ);
        feedSnap.forEach(doc => tFeed += Number(doc.data().cost || 0));

        // Fetch Medicine Cost (check both medicine and medicine_records)
        const medQ = query(collection(db, 'medicine'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const medSnap = await fastGetDocs(medQ);
        medSnap.forEach(doc => tMed += Number(doc.data().cost || 0));

        const tAllCost = cChick + tFeed + tMed + tOther;
        setChickCost(cChick);
        setFeedCost(tFeed);
        setMedCost(tMed);
        setOtherCost(tOther);
        setTotalSales(tSales);
        setTotalCost(tAllCost);
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [batchId, currentUser, isDemoUser, totalChicks, costPerChick]);

  if (loading) return <div className="text-xs text-gray-400 mt-2">{t('batches.calculating')}</div>;

  const profit = totalSales - totalCost;
  const numChicks = Number(totalChicks) || 0;
  const costPerBird = numChicks > 0 ? (totalCost / numChicks) : 0;
  const profitPerBird = numChicks > 0 ? (profit / numChicks) : 0;

  return (
    <div className="mt-3 p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-slate-600 font-medium">{t('batches.totalSales')}</span>
        <span className="font-black text-emerald-600">৳ {totalSales.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-slate-600 font-medium">{t('batches.totalCost')}</span>
        <span className="font-black text-rose-600">৳ {totalCost.toLocaleString()}</span>
      </div>

      {/* Itemized Cost Details Drawer Toggle */}
      <button 
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="text-[10px] text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 cursor-pointer py-0.5"
      >
        <span>{showDetails ? '▲ বিস্তারিত খরচ লুকান' : '▼ বিস্তারিত খরচের তালিকা দেখুন'}</span>
      </button>

      {showDetails && (
        <div className="p-2 bg-white rounded-lg border border-slate-200/80 space-y-1 text-[11px] text-slate-600 animate-fadeIn">
          <div className="flex justify-between">
            <span>বাচ্চা ক্রয় ব্যয়:</span>
            <span className="font-bold text-slate-850">৳ {chickCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>খাদ্য (ফিড) খরচ:</span>
            <span className="font-bold text-slate-850">৳ {feedCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>ওষুধ ও ভ্যাকসিন:</span>
            <span className="font-bold text-slate-850">৳ {medCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>অন্যান্য পরিচালনা ব্যয়:</span>
            <span className="font-bold text-slate-850">৳ {otherCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-100 text-slate-500">
            <span>প্রতি পিস উৎপাদন খরচ:</span>
            <span className="font-black text-slate-700">৳ {costPerBird.toFixed(1)}</span>
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-black text-sm sm:text-base">
        <span>{t('batches.net')}{profit >= 0 ? t('batches.profit') : t('batches.loss')}</span>
        <div className="text-right">
          <span className={profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>৳ {Math.abs(profit).toLocaleString()}</span>
          {numChicks > 0 && (
            <span className="block text-[10px] font-bold text-slate-400">
              ({profit >= 0 ? 'লাভ' : 'ঘাটতি'} ৳ {Math.abs(profitPerBird).toFixed(1)} /পিস)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Batches() {
  const navigate = useNavigate();
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);

  // Complete batch state with date
  const [completeBatchItem, setCompleteBatchItem] = useState<any | null>(null);
  const [completionDate, setCompletionDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Delete batch state with cascade protection
  const [deleteBatchItem, setDeleteBatchItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Category filter state ('all' | 'poultry' | 'cattle' | 'fish' | 'completed' | 'compare')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'poultry' | 'cattle' | 'fish' | 'completed' | 'compare'>(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    if (filter === 'compare') return 'compare';
    if (filter === 'poultry') return 'poultry';
    if (filter === 'cattle') return 'cattle';
    if (filter === 'fish') return 'fish';
    if (filter === 'completed') return 'completed';
    return 'all';
  });

  // Show form state
  const [showForm, setShowForm] = useState(false);
  
  // Form fields
  const [batchName, setBatchName] = useState('');
  const [farmType, setFarmType] = useState('poultry'); // poultry, cattle, fish
  const [subBreed, setSubBreed] = useState('broiler');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalChicks, setTotalChicks] = useState('');
  const [costPerChick, setCostPerChick] = useState('');

  // Default sub-breed when farmType changes
  const handleFarmTypeChange = (type: string) => {
    setFarmType(type);
    if (type === 'cattle') setSubBreed('dairy');
    else if (type === 'fish') setSubBreed('telapia');
    else setSubBreed('broiler');
  };

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    if (isDemoUser) {
      const loadDemoBatches = () => {
        const b = demoStore.getBatches();
        setBatches([...b]);
        setLoading(false);
      };
      loadDemoBatches();
      const unsub = demoStore.subscribe(loadDemoBatches);
      return () => unsub();
    }

    const q = query(
      collection(db, 'batches'),
      where('userId', '==', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setBatches(fetchedBatches.sort((a: any, b: any) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime()));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'batches');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, isDemoUser]);

  const fetchBatches = async () => {
    // No-op: handled by onSnapshot & demoStore
  };

  const handleOpenFormWithCategory = () => {
    if (selectedFilter === 'cattle') setFarmType('cattle');
    else if (selectedFilter === 'fish') setFarmType('fish');
    else setFarmType('poultry');
    setShowForm(!showForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isSubmitting || submitLock.current) return;
    setIsSubmitting(true);
    submitLock.current = true;

    try {
      const newBatch = {
        userId: currentUser.uid,
        batchName,
        farmType: farmType as 'poultry' | 'cattle' | 'fish',
        subBreed: subBreed || '',
        startDate,
        totalChicks: Number(totalChicks),
        costPerChick: costPerChick ? Number(costPerChick) : 0,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isDemoUser) {
        const saved = demoStore.saveBatch(newBatch);
        // Automatically activate on dashboard
        localStorage.setItem('selected_farm_type', farmType);
        localStorage.setItem(`selected_batch_id_${farmType}`, saved.id);
        toast.success(language === 'bn' ? 'নতুন ব্যাচ সফলভাবে যুক্ত হয়েছে!' : t('batches.addSuccess'));
        setShowForm(false);
        setBatchName('');
        setTotalChicks('');
        setCostPerChick('');
        return;
      }

      const docRef = await offlineSafeDocWrite(addDoc(collection(db, 'batches'), newBatch));
      // Automatically activate on dashboard
      localStorage.setItem('selected_farm_type', farmType);
      if (docRef && docRef.id) {
        localStorage.setItem(`selected_batch_id_${farmType}`, docRef.id);
      }
      toast.success(language === 'bn' ? 'নতুন ব্যাচ সফলভাবে যুক্ত হয়েছে!' : t('batches.addSuccess'));
      setShowForm(false);
      setBatchName('');
      setTotalChicks('');
      setCostPerChick('');
      fetchBatches();
    } catch (error) {
      toast.error(t('batches.addError'));
      handleFirestoreError(error, OperationType.CREATE, 'batches');
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  const markCompleted = async () => {
    if (!completeBatchItem) return;
    const targetId = completeBatchItem.id;
    const selectedEndDate = completionDate || new Date().toISOString().split('T')[0];
    try {
      if (isDemoUser) {
        demoStore.saveBatch({ 
          id: targetId, 
          status: 'completed',
          endDate: selectedEndDate,
          completedAt: new Date().toISOString()
        } as any);
        toast.success(
          language === 'bn' 
            ? `ব্যাচটি সফলভাবে সমাপ্ত করা হয়েছে (${new Date(selectedEndDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })})` 
            : t('batches.completeSuccess')
        );
        setCompleteBatchItem(null);
        fetchBatches();
        return;
      }

      const batchRef = doc(db, 'batches', targetId);
      await offlineSafeDocWrite(updateDoc(batchRef, { 
        status: 'completed',
        endDate: selectedEndDate,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      toast.success(
        language === 'bn' 
          ? `ব্যাচটি সফলভাবে সমাপ্ত করা হয়েছে (${new Date(selectedEndDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })})` 
          : t('batches.completeSuccess')
      );
      setCompleteBatchItem(null);
      fetchBatches();
    } catch (error) {
      toast.error(t('batches.updateError'));
      handleFirestoreError(error, OperationType.UPDATE, `batches/${targetId}`);
      setCompleteBatchItem(null);
    }
  };

  const handleDelete = (batch: any) => {
    setDeleteBatchItem(batch);
  };

  const calculateAge = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const executeDelete = async () => {
    if (!deleteBatchItem) return;
    const targetId = deleteBatchItem.id;
    setIsDeleting(true);
    try {
      if (isDemoUser) {
        demoStore.deleteBatch(targetId);
        // Clear active batch if it was the deleted one
        ['poultry', 'cattle', 'fish'].forEach(ft => {
          if (localStorage.getItem(`selected_batch_id_${ft}`) === targetId) {
            localStorage.removeItem(`selected_batch_id_${ft}`);
          }
        });
        toast.success(
          language === 'bn'
            ? 'ব্যাচ এবং এর সাথে সম্পর্কিত সকল হিসাব (খাবার, ঔষধ, খরচ, বিক্রি) মুছে ফেলা হয়েছে'
            : t('batches.delSuccess'), 
          { duration: 3500 }
        );
        setDeleteBatchItem(null);
        fetchBatches();
        return;
      }

      // 1. Delete main batch doc
      await offlineSafeDocWrite(deleteDoc(doc(db, 'batches', targetId)));

      // 2. Cascade delete associated documents across all collections
      const collectionsToCascade = [
        'feed_records',
        'medicine',
        'medicine_records',
        'expenses',
        'sales',
        'mortality',
        'dues'
      ];

      for (const collName of collectionsToCascade) {
        try {
          const q = query(
            collection(db, collName),
            where('userId', '==', currentUser?.uid),
            where('batchId', '==', targetId)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
          }
        } catch (e) {
          console.warn(`Cascade delete error on ${collName}:`, e);
        }
      }

      // Reset active batch from localStorage if deleted
      ['poultry', 'cattle', 'fish'].forEach(ft => {
        if (localStorage.getItem(`selected_batch_id_${ft}`) === targetId) {
          localStorage.removeItem(`selected_batch_id_${ft}`);
        }
      });

      toast.success(
        language === 'bn'
          ? 'ব্যাচ এবং এর সকল তথ্য ও হিসাব স্থায়ীভাবে মুছে ফেলা হয়েছে'
          : t('batches.delSuccess'),
        { duration: 3500 }
      );
      setDeleteBatchItem(null);
      fetchBatches();
    } catch (error) {
      toast.error(t('batches.delError'));
      handleFirestoreError(error, OperationType.DELETE, 'batches');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivateOnDashboard = (batch: any) => {
    const fType = batch.farmType || 'poultry';
    localStorage.setItem('selected_farm_type', fType);
    localStorage.setItem(`selected_batch_id_${fType}`, batch.id);
    toast.success(language === 'bn' ? `"${batch.batchName}" ড্যাশবোর্ডে সেট করা হয়েছে` : 'Batch selected on Dashboard');
    navigate('/dashboard');
  };

  // Filter batches based on selected tab
  const filteredBatches = batches.filter(b => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'completed') return b.status === 'completed';
    return b.status === 'active' && b.farmType === selectedFilter;
  });

  // Counts
  const poultryCount = batches.filter(b => b.status === 'active' && b.farmType === 'poultry').length;
  const cattleCount = batches.filter(b => b.status === 'active' && b.farmType === 'cattle').length;
  const fishCount = batches.filter(b => b.status === 'active' && b.farmType === 'fish').length;
  const completedCount = batches.filter(b => b.status === 'completed').length;

  const getBatchStats = async (batchId: string): Promise<BatchSummaryStats | null> => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return null;

    let tFeed = 0;
    let tFeedBags = 0;
    let tMed = 0;
    let tOther = 0;
    let tSales = 0;
    let tMort = 0;
    let avgWeight = 0;
    const cChick = Number(batch.totalChicks || 0) * Number(batch.costPerChick || 0);

    try {
      if (isDemoUser) {
        demoStore.getSales(batchId).forEach(s => {
          tSales += Number(s.totalAmount || 0);
          if (s.totalWeightKg && s.quantity) avgWeight = Number(s.totalWeightKg) / Number(s.quantity);
        });
        demoStore.getExpenses(batchId).forEach(e => { tOther += Number(e.amount || 0); });
        demoStore.getFeedRecords(batchId).forEach(f => {
          tFeed += Number(f.cost || 0);
          tFeedBags += Number(f.quantityBags || 0);
        });
        demoStore.getMedicineRecords(batchId).forEach(m => { tMed += Number(m.cost || 0); });
        demoStore.getMortalityRecords(batchId).forEach(m => { tMort += Number(m.count || 0); });
      } else if (currentUser) {
        const salesQ = query(collection(db, 'sales'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const salesSnap = await fastGetDocs(salesQ);
        salesSnap.forEach(d => {
          tSales += Number(d.data().totalAmount || 0);
          if (d.data().totalWeightKg && d.data().quantity) {
            avgWeight = Number(d.data().totalWeightKg) / Number(d.data().quantity);
          }
        });

        const expQ = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const expSnap = await fastGetDocs(expQ);
        expSnap.forEach(d => { tOther += Number(d.data().amount || 0); });

        const feedQ = query(collection(db, 'feed_records'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const feedSnap = await fastGetDocs(feedQ);
        feedSnap.forEach(d => {
          tFeed += Number(d.data().cost || 0);
          tFeedBags += Number(d.data().quantityBags || d.data().quantity || 0);
        });

        const medQ = query(collection(db, 'medicine'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const medSnap = await fastGetDocs(medQ);
        medSnap.forEach(d => { tMed += Number(d.data().cost || 0); });

        const mortQ = query(collection(db, 'mortality'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const mortSnap = await fastGetDocs(mortQ);
        mortSnap.forEach(d => { tMort += Number(d.data().count || 0); });
      }
    } catch (err) {
      console.warn('Error computing batch stats for comparison:', err);
    }

    const tCost = cChick + tFeed + tMed + tOther;
    const netProfit = tSales - tCost;
    const numBirds = Number(batch.totalChicks || 0);
    const alive = Math.max(0, numBirds - tMort);
    const mortRate = numBirds > 0 ? Number(((tMort / numBirds) * 100).toFixed(1)) : 0;
    const costPerBird = numBirds > 0 ? tCost / numBirds : 0;
    const profitPerBird = numBirds > 0 ? netProfit / numBirds : 0;
    const age = calculateAge(batch.startDate);

    let calculatedFcr: number | undefined = undefined;
    const estWeight = avgWeight > 0 ? avgWeight : (age * 0.045);
    if (alive > 0 && estWeight > 0 && tFeedBags > 0) {
      const totalFeedKg = tFeedBags * 50;
      const totalLiveWeight = alive * estWeight;
      if (totalLiveWeight > 0) {
        calculatedFcr = Number((totalFeedKg / totalLiveWeight).toFixed(2));
      }
    }

    return {
      batchId,
      batchName: batch.batchName,
      farmType: batch.farmType || 'poultry',
      status: batch.status || 'active',
      startDate: batch.startDate,
      ageDays: age,
      totalChicks: numBirds,
      aliveCount: alive,
      mortalityCount: tMort,
      mortalityRate: mortRate,
      feedBags: tFeedBags,
      feedCost: tFeed,
      medicineCost: tMed,
      chickCost: cChick,
      otherCost: tOther,
      totalCost: tCost,
      costPerBird,
      salesRevenue: tSales,
      netProfit,
      profitPerBird,
      fcr: calculatedFcr,
      avgWeightKg: avgWeight || undefined
    };
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">{t('common.loading')}</div>;

  return (
    <div className="space-y-3.5 select-none pb-6">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-850 flex items-center gap-2 leading-none">
            <Package className="text-emerald-600" size={20} /> 
            {language === 'bn' ? 'সকল ব্যাচ ব্যবস্থাপনা' : t('batches.title')}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
            {language === 'bn' ? 'মুরগী, গরু ও মাছের একাধিক ব্যাচ পরিচালনা' : 'Manage multiple flocks, cattle lots & ponds'}
          </p>
        </div>
        <button 
          onClick={handleOpenFormWithCategory}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={15} />
          <span>{language === 'bn' ? 'নতুন ব্যাচ' : 'Add Batch'}</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
            selectedFilter === 'all'
              ? 'bg-slate-850 text-white border-slate-850 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <span>🌟</span>
          <span>{language === 'bn' ? 'সকল' : 'All'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-150 text-slate-700'}`}>
            {batches.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedFilter('poultry')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
            selectedFilter === 'poultry'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-emerald-800 border-emerald-200/70 hover:bg-emerald-50/50'
          }`}
        >
          <span>🐦</span>
          <span>{language === 'bn' ? 'পাখি (মুরগি, হাঁস, কোয়েল)' : 'Birds'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedFilter === 'poultry' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            {poultryCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedFilter('cattle')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
            selectedFilter === 'cattle'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white text-amber-800 border-amber-200/70 hover:bg-amber-50/50'
          }`}
        >
          <span>🐄</span>
          <span>{language === 'bn' ? 'পশু (গরু, ষাঁড়, ছাগল)' : 'Animals'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedFilter === 'cattle' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
            {cattleCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedFilter('fish')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
            selectedFilter === 'fish'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-blue-800 border-blue-200/70 hover:bg-blue-50/50'
          }`}
        >
          <span>🐟</span>
          <span>{language === 'bn' ? 'মাছ (তেলাপিয়া, কার্প, পাঙ্গাস)' : 'Fish'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedFilter === 'fish' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
            {fishCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedFilter('completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
            selectedFilter === 'completed'
              ? 'bg-slate-600 text-white border-slate-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200/70 hover:bg-slate-50'
          }`}
        >
          <span>🏁</span>
          <span>{language === 'bn' ? 'সমাপ্ত ব্যাচ' : 'Completed'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-150 text-slate-700'}`}>
            {completedCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedFilter('compare')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
            selectedFilter === 'compare'
              ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
              : 'bg-white text-purple-700 border-purple-200/70 hover:bg-purple-50/50'
          }`}
        >
          <span>⚖️</span>
          <span>{language === 'bn' ? 'ব্যাচ তুলনা' : 'Compare'}</span>
        </button>
      </div>

      {/* New Batch Creation Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-200 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-800">
              {language === 'bn' ? 'নতুন ব্যাচের তথ্য দিন' : 'Create New Batch'}
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {farmType === 'cattle' ? '🐄 পশু পালন' : farmType === 'fish' ? '🐟 মৎস্য চাষ' : '🐦 পাখি পালন'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('batches.batchNameLabel')}</label>
            <input 
              required 
              type="text" 
              value={batchName} 
              onChange={(e) => setBatchName(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
              placeholder={farmType === 'cattle' ? 'যেমন: ডেইরি গাভী শেড-০১' : farmType === 'fish' ? 'যেমন: তেলাপিয়া পুকুর-১' : 'যেমন: ব্রয়লার লট-০১ (১০০০ বাচ্চা)'} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'মূল শ্রেণি (Category)' : 'Main Category'}
              </label>
              <select 
                required 
                value={farmType} 
                onChange={(e) => handleFarmTypeChange(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="poultry">🐦 {language === 'bn' ? 'পাখি (মুরগি, হাঁস, কোয়েল)' : 'Birds / Poultry'}</option>
                <option value="cattle">🐄 {language === 'bn' ? 'পশু (গরু, ষাঁড়, ছাগল, ভেড়া)' : 'Animals / Cattle'}</option>
                <option value="fish">🐟 {language === 'bn' ? 'মাছ (তেলাপিয়া, কার্প, পাঙ্গাস)' : 'Fish / Aquaculture'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'নির্দিষ্ট জাত / উপ-বিভাগ' : 'Sub-category / Breed'}
              </label>
              <select 
                value={subBreed} 
                onChange={(e) => setSubBreed(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {farmType === 'poultry' && (
                  <>
                    <option value="broiler">🍗 {language === 'bn' ? 'ব্রয়লার মুরগি' : 'Broiler'}</option>
                    <option value="layer">🥚 {language === 'bn' ? 'লেয়ার মুরগি (ডিম)' : 'Layer'}</option>
                    <option value="sonali">🐓 {language === 'bn' ? 'সোনালী মুরগি' : 'Sonali'}</option>
                    <option value="deshi">🐔 {language === 'bn' ? 'দেশি মুরগি' : 'Local Deshi'}</option>
                    <option value="duck">🦆 {language === 'bn' ? 'হাঁস পালন' : 'Duck'}</option>
                    <option value="quail">🐦 {language === 'bn' ? 'কোয়েল পাখি' : 'Quail'}</option>
                    <option value="turkey">🦃 {language === 'bn' ? 'টার্কি' : 'Turkey'}</option>
                    <option value="pigeon">🕊️ {language === 'bn' ? 'কবুতর' : 'Pigeon'}</option>
                  </>
                )}
                {farmType === 'cattle' && (
                  <>
                    <option value="dairy">🥛 {language === 'bn' ? 'ডেইরি গাভী (দুধের গরু)' : 'Dairy Cow'}</option>
                    <option value="fattening">🐂 {language === 'bn' ? 'ষাঁড় মোটাতাজাকরণ (মাংস)' : 'Beef Fattening'}</option>
                    <option value="goat">🐐 {language === 'bn' ? 'ছাগল ও খাসি পালন' : 'Goat'}</option>
                    <option value="sheep">🐑 {language === 'bn' ? 'ভেড়া ও গাড়ল পালন' : 'Sheep'}</option>
                    <option value="buffalo">🐃 {language === 'bn' ? 'মহিষ পালন' : 'Buffalo'}</option>
                  </>
                )}
                {farmType === 'fish' && (
                  <>
                    <option value="telapia">🐟 {language === 'bn' ? 'তেলাপিয়া / মনোসেক্স' : 'Tilapia'}</option>
                    <option value="carp">🐠 {language === 'bn' ? 'রুই ও কার্প জাতীয় (কাতলা, মৃগেল)' : 'Carp'}</option>
                    <option value="pangash">🦈 {language === 'bn' ? 'পাঙ্গাস ও মাগুর' : 'Pangash'}</option>
                    <option value="shing_pabda">🦐 {language === 'bn' ? 'শিং, পাবদা ও কই' : 'Shing & Pabda'}</option>
                    <option value="mixed">🌊 {language === 'bn' ? 'মিশ্র মাছ চাষ' : 'Mixed Culture'}</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {farmType === 'fish' ? (language === 'bn' ? 'পোনা ছাড়ার তারিখ' : 'Stocking Date') : (language === 'bn' ? 'কেনার / শুরুর তারিখ' : t('batches.startDate'))}
            </label>
            <input 
              required 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {farmType === 'cattle' 
                  ? (language === 'bn' ? 'মোট পশুর সংখ্যা' : 'Cattle Count') 
                  : farmType === 'fish' 
                  ? (language === 'bn' ? 'মোট পোনার সংখ্যা' : 'Fry Count') 
                  : (language === 'bn' ? 'মোট বাচ্চার সংখ্যা' : t('batches.totalChicks'))}
              </label>
              <input 
                required 
                type="number" 
                value={totalChicks} 
                onChange={(e) => setTotalChicks(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                placeholder="0" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {farmType === 'cattle' 
                  ? (language === 'bn' ? 'পশুপ্রতি ক্রয়দর (৳)' : 'Price/Animal') 
                  : farmType === 'fish' 
                  ? (language === 'bn' ? 'পোনাপ্রতি দর (৳)' : 'Price/Fry') 
                  : (language === 'bn' ? 'বাচ্চাপ্রতি দর (৳)' : t('batches.costPerChick'))}
              </label>
              <input 
                type="number" 
                value={costPerChick} 
                onChange={(e) => setCostPerChick(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                placeholder="0" 
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button 
              disabled={isSubmitting} 
              type="submit" 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs disabled:bg-slate-300 transition-colors shadow-xs cursor-pointer"
            >
              {isSubmitting ? t('common.saving') : (language === 'bn' ? 'সংরক্ষণ করুন' : t('common.save'))}
            </button>
          </div>
        </form>
      )}

      {/* Batches List or Comparison View */}
      {selectedFilter === 'compare' ? (
        <BatchComparisonCard batches={batches} getBatchStats={getBatchStats} />
      ) : (
        <div className="space-y-3">
        {filteredBatches.map(batch => {
          const isPoultry = batch.farmType === 'poultry';
          const isCattle = batch.farmType === 'cattle';
          const isFish = batch.farmType === 'fish';
          const badgeIcon = isCattle ? '🐄' : isFish ? '🐟' : '🐔';
          const badgeText = isCattle ? 'গরু / ডেইরি' : isFish ? 'মাছ চাষ' : 'মুরগী';

          const countLabel = isCattle 
            ? (language === 'bn' ? 'পশুর সংখ্যা' : 'Animals') 
            : isFish 
            ? (language === 'bn' ? 'পোনার সংখ্যা' : 'Fry') 
            : (language === 'bn' ? 'বাচ্চার সংখ্যা' : 'Chicks');
          
          const rateLabel = isCattle 
            ? (language === 'bn' ? 'পশুপ্রতি দাম' : 'Cost/Animal') 
            : isFish 
            ? (language === 'bn' ? 'পোনাপ্রতি দর' : 'Cost/Fry') 
            : (language === 'bn' ? 'বাচ্চাপ্রতি দর' : 'Cost/Chick');

          const unitText = isCattle ? (language === 'bn' ? 'টি পশু' : 'heads') : isFish ? (language === 'bn' ? 'টি পোনা' : 'fry') : (language === 'bn' ? 'টি বাচ্চা' : 'birds');

          return (
            <div key={batch.id} className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-150 shadow-xs relative hover:border-emerald-300 transition-all">
              
              {/* Top Row: Title, Farm Badge, Status, Delete */}
              <div className="flex items-start justify-between gap-2 mb-2 pr-6">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">{badgeIcon}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60">
                      {badgeText}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${
                      batch.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}>
                      {batch.status === 'active' 
                        ? (language === 'bn' ? 'সক্রিয়' : t('batches.active')) 
                        : (language === 'bn' 
                            ? `সমাপ্ত ${batch.endDate ? `(${new Date(batch.endDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })})` : ''}` 
                            : `Completed ${batch.endDate || ''}`)}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm sm:text-base text-slate-850 leading-tight">
                    {batch.batchName}
                  </h3>
                  
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{language === 'bn' ? 'শুরু:' : t('batches.started')} {new Date(batch.startDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {batch.status === 'active' ? (
                      <span className="text-emerald-700 font-black">
                        • {language === 'bn' ? 'বয়স:' : t('dashboard.age')} {calculateAge(batch.startDate)} {language === 'bn' ? 'দিন' : t('dashboard.days')}
                      </span>
                    ) : (
                      <span className="text-purple-700 font-black bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        • {language === 'bn' ? 'সমাপ্তির তারিখ:' : 'End Date:'} {batch.endDate ? new Date(batch.endDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : (language === 'bn' ? 'সমাপ্ত' : 'Completed')}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(batch)}
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer absolute top-3 right-3"
                  title="Delete Batch"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Stats pill row */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 mb-3">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block">{countLabel}</span>
                  <p className="text-xs font-black text-slate-800 font-sans">
                    {Number(batch.totalChicks || 0).toLocaleString()} <span className="text-[9px] font-bold text-slate-500">{unitText}</span>
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block">{rateLabel}</span>
                  <p className="text-xs font-black text-emerald-700 font-sans">
                    ৳ {Number(batch.costPerChick || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {batch.status === 'active' && batch.farmType === 'poultry' && (
                <div className="mb-3">
                  <PoultryFeedPlan 
                    batchId={batch.id} 
                    startDate={batch.startDate} 
                    totalChicks={Number(batch.totalChicks) || 0} 
                    batchName={batch.batchName}
                  />
                </div>
              )}

              {/* Real-time Profit & Loss Summary */}
              <div className="mb-2.5">
                <BatchSummary batchId={batch.id} totalChicks={batch.totalChicks} costPerChick={batch.costPerChick} />
              </div>

              {/* Action Buttons: View on Dashboard & Mark Complete */}
              {batch.status === 'active' && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleActivateOnDashboard(batch)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LayoutDashboard size={13} />
                      <span>{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                    </button>

                    <button
                      onClick={() => navigate(`/feed?tab=fcr&batchId=${batch.id}`)}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={language === 'bn' ? 'সাপ্তাহিক ও মাসিক FCR গ্রাফ দেখুন' : 'View FCR Graph'}
                    >
                      <ChartIcon size={13} />
                      <span>{language === 'bn' ? 'FCR গ্রাফ' : 'FCR Graph'}</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setCompleteBatchItem(batch);
                      setCompletionDate(new Date().toISOString().split('T')[0]);
                    }} 
                    className="text-xs font-bold text-slate-500 hover:text-purple-700 px-2.5 py-1.5 rounded-xl hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 size={13} className="text-purple-600" />
                    <span>{language === 'bn' ? 'ব্যাচ সমাপ্ত করুন' : t('batches.markComplete')}</span>
                  </button>
                </div>
              )}

              {batch.status === 'completed' && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-150 bg-slate-50/60 -mx-3.5 -mb-3.5 px-3.5 py-2 rounded-b-2xl">
                  <span className="text-[11px] font-bold text-purple-800 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-purple-600" />
                    {language === 'bn' 
                      ? `ব্যাচ সমাপ্ত ${batch.endDate ? `(${new Date(batch.endDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })})` : ''}` 
                      : 'Completed & Archived'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleActivateOnDashboard(batch)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <LayoutDashboard size={12} />
                      <span>{language === 'bn' ? 'রিপোর্ট দেখুন' : 'View Report'}</span>
                    </button>
                    <button
                      onClick={() => navigate(`/feed?tab=fcr&batchId=${batch.id}`)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ChartIcon size={12} />
                      <span>{language === 'bn' ? 'FCR' : 'FCR'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredBatches.length === 0 && !showForm && (
          <div className="text-center text-slate-400 py-10 bg-white rounded-2xl border-dashed border-2 border-slate-200 p-6">
            <Package size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="font-extrabold text-xs text-slate-700 mb-1">
              {language === 'bn' ? 'কোনো ব্যাচ পাওয়া যায়নি' : t('batches.noBatches')}
            </p>
            <p className="text-[10px] text-slate-400 mb-3">
              {language === 'bn' ? 'এই ক্যাটাগরিতে নতুন ব্যাচ যোগ করতে নিচের বাটনে চাপুন' : 'Click below to create your first batch'}
            </p>
            <button 
              onClick={handleOpenFormWithCategory}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={13} />
              <span>{language === 'bn' ? 'নতুন ব্যাচ শুরু করুন' : 'Add Batch'}</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* Dedicated Batch Complete Modal with Date Picker */}
      {completeBatchItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-purple-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {language === 'bn' ? 'ব্যাচ সমাপ্তি নিশ্চিতকরণ' : 'Confirm Batch Completion'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    {completeBatchItem.batchName} ({language === 'bn' ? 'শুরু:' : 'Started:'} {new Date(completeBatchItem.startDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCompleteBatchItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3.5 space-y-2.5">
              <label className="block text-xs font-black text-purple-950">
                📅 {language === 'bn' ? 'সমাপ্তির তারিখ নির্বাচন করুন:' : 'Select Completion / End Date:'}
              </label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-850 shadow-2xs focus:ring-2 focus:ring-purple-500"
              />
              <div className="text-[11px] text-purple-900 space-y-1 font-medium leading-relaxed bg-white/80 p-2.5 rounded-lg border border-purple-150">
                <p className="font-bold text-purple-950">
                  ℹ️ {language === 'bn' ? 'ব্যাচ সমাপ্তির সুবিধা:' : 'Completion benefits:'}
                </p>
                <p>
                  • {language === 'bn' 
                    ? 'ব্যাচের সকল খাদ্য, ঔষধ, মৃত্যু, আয়-ব্যয় এবং বিক্রয় এর হিসাব সম্পূর্ণ সংরক্ষিত থাকবে।' 
                    : 'All records (feed, medicine, sales, expenses) remain completely preserved.'}
                </p>
                <p>
                  • {language === 'bn' 
                    ? 'ভবিষ্যতে রিপোর্ট ও অন্যান্য ব্যাচের সাথে তুলনা করার সময় এই ব্যাচটি সব তথ্যের সাথে প্রদর্শিত হবে।' 
                    : 'The batch remains accessible forever for historical reports & comparisons.'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setCompleteBatchItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={markCompleted}
                className="px-4 py-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>{language === 'bn' ? 'হ্যাঁ, ব্যাচটি সমাপ্ত করুন' : 'Confirm Complete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Red Warning Modal for Batch Cascade Deletion */}
      {deleteBatchItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border-2 border-rose-300 space-y-4">
            <div className="flex items-start justify-between border-b border-rose-150 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={22} className="text-rose-600" />
                </div>
                <div>
                  <h3 className="font-black text-rose-950 text-base">
                    {language === 'bn' ? 'ব্যাচ ও সকল তথ্য মুছে ফেলা' : 'Delete Batch & All Records'}
                  </h3>
                  <p className="text-xs text-rose-700 font-bold mt-0.5">
                    "{deleteBatchItem.batchName}"
                  </p>
                </div>
              </div>
              <button
                disabled={isDeleting}
                onClick={() => setDeleteBatchItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-xs text-rose-950 leading-relaxed font-medium">
              <p className="font-bold text-rose-900">
                ⚠️ {language === 'bn' 
                  ? 'আপনি কি নিশ্চিত যে আপনি এই ব্যাচটি সম্পূর্ণ মুছে ফেলতে চান?' 
                  : 'Are you sure you want to permanently delete this batch?'}
              </p>
              <p className="text-rose-800">
                {language === 'bn' 
                  ? 'সতর্কতা: এই ব্যাচটি ডিলিট করলে এর সাথে যুক্ত নিচের সকল তথ্য সম্পূর্ণ ও স্থায়ীভাবে ডেটাবেস থেকে মুছে যাবে এবং তা আর কখনোই ফিরিয়ে আনা সম্ভব হবে না:'
                  : 'Warning: Deleting this batch will permanently remove all associated records from the database:'}
              </p>
              <ul className="list-disc list-inside space-y-1 font-bold text-rose-900 pl-1 text-[11px] bg-white/70 p-2.5 rounded-lg border border-rose-200/70">
                <li>{language === 'bn' ? 'খাদ্য ও বস্তার হিসাব (Feed records)' : 'All feed & bags records'}</li>
                <li>{language === 'bn' ? 'ঔষধ ও ভ্যাকসিনের হিসাব (Medicine records)' : 'All medicine & vaccine logs'}</li>
                <li>{language === 'bn' ? 'দৈনিক মৃত্যুর হিসাব (Mortality records)' : 'All mortality entries'}</li>
                <li>{language === 'bn' ? 'খরচের ভাউচার ও হিসাব (Expenses)' : 'All expense records'}</li>
                <li>{language === 'bn' ? 'বিক্রয় ও বাকি খাতার এন্ট্রি (Sales & Dues)' : 'All sales and associated dues'}</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteBatchItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {language === 'bn' ? 'না, বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>
                  {isDeleting 
                    ? (language === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...') 
                    : (language === 'bn' ? 'হ্যাঁ, সকল তথ্যসহ মুছুন' : 'Yes, Delete Everything')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
