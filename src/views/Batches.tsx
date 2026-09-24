import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs, addDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, offlineSafeDocWrite, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Package, Plus, Trash2, CheckCircle2, ArrowRight, LayoutDashboard, Calendar, Users, DollarSign, LineChart as ChartIcon, AlertTriangle, X, ClipboardList, Award, Clock, FileSpreadsheet, Download, Wheat, Calculator, BookOpen, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import BatchComparisonCard, { BatchSummaryStats } from '../components/BatchComparisonCard';
import { BatchCompletionModal, BatchClosureReport } from '../components/BatchCompletionModal';
import { CompletedBatchReportModal } from '../components/CompletedBatchReportModal';
import { demoStore } from '../utils/demoStore';
import { useNavigate } from 'react-router-dom';
import { fetchBatchFullRecords, downloadBatchCSV, downloadBatchPDF, purgeExpiredCompletedBatches } from '../utils/batchExportUtils';

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

  // Complete batch state with date & settlement
  const [completeBatchItem, setCompleteBatchItem] = useState<any | null>(null);
  const [completionDate, setCompletionDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [completingFinancials, setCompletingFinancials] = useState<any | null>(null);
  const [viewReportBatch, setViewReportBatch] = useState<any | null>(null);

  // Delete batch state with cascade protection & Dues notice
  const [deleteBatchItem, setDeleteBatchItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [batchDuesLoading, setBatchDuesLoading] = useState(false);
  const [batchDuesInfo, setBatchDuesInfo] = useState<{
    totalReceivable: number;
    totalPayable: number;
    totalDue: number;
    receivableItems: Array<{ personName: string; phone?: string; remaining: number; totalAmount: number; details?: string }>;
    payableItems: Array<{ personName: string; phone?: string; remaining: number; totalAmount: number; details?: string }>;
    allCount: number;
  } | null>(null);
  const [confirmDeleteWithDues, setConfirmDeleteWithDues] = useState(false);
  const [exportingBatchId, setExportingBatchId] = useState<string | null>(null);

  const handleDownloadBatchArchive = async (batch: any, format: 'csv' | 'pdf') => {
    if (!currentUser) return;
    setExportingBatchId(batch.id);
    try {
      const data = await fetchBatchFullRecords(batch.id, currentUser.uid, isDemoUser);
      if (!data) {
        toast.error(language === 'bn' ? 'ডাটা লোড করা যায়নি' : 'Failed to fetch data');
        return;
      }
      if (format === 'csv') {
        downloadBatchCSV(batch, data);
      } else {
        downloadBatchPDF(batch, data);
      }
    } catch (e) {
      toast.error(language === 'bn' ? 'ডাউনলোড ব্যর্থ হয়েছে' : 'Download failed');
    } finally {
      setExportingBatchId(null);
    }
  };
  
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

    // Auto-purge completed batches that exceeded 15 days retention
    purgeExpiredCompletedBatches(currentUser.uid, isDemoUser).catch(err => {
      console.warn('Auto-purge check error:', err);
    });

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

  const handleOpenCompleteModal = async (batch: any) => {
    setCompleteBatchItem(batch);
    setCompletionDate(new Date().toISOString().split('T')[0]);
    try {
      let tSales = 0;
      let tFeed = 0;
      let tMed = 0;
      let tOther = 0;
      let feedKg = 0;
      let mort = 0;
      const cChick = Number(batch.totalChicks || 0) * Number(batch.costPerChick || 0);

      const batchBagWeight = Math.max(1, Number(localStorage.getItem(`bag_weight_${batch.id}`)) || 50);

      if (isDemoUser) {
        demoStore.getSales(batch.id).forEach(s => tSales += Number(s.totalAmount || 0));
        demoStore.getExpenses(batch.id).forEach(e => tOther += Number(e.amount || 0));
        demoStore.getFeedRecords(batch.id).forEach(f => {
          tFeed += Number(f.cost || 0);
          const fAny = f as any;
          const bags = Number(fAny.quantityBags || fAny.bags || 0);
          const bagSize = Number(fAny.bagWeightKg) || batchBagWeight;
          feedKg += Number(fAny.quantityKg || (bags * bagSize));
        });
        demoStore.getMedicineRecords(batch.id).forEach(m => tMed += Number(m.cost || 0));
        demoStore.getMortalityRecords(batch.id).forEach(m => mort += Number(m.count || 0));
      } else {
        const [salesSnap, expSnap, feedSnap, medSnap, mortSnap] = await Promise.all([
          fastGetDocs(query(collection(db, 'sales'), where('userId', '==', currentUser?.uid), where('batchId', '==', batch.id))),
          fastGetDocs(query(collection(db, 'expenses'), where('userId', '==', currentUser?.uid), where('batchId', '==', batch.id))),
          fastGetDocs(query(collection(db, 'feed_records'), where('userId', '==', currentUser?.uid), where('batchId', '==', batch.id))),
          fastGetDocs(query(collection(db, 'medicine'), where('userId', '==', currentUser?.uid), where('batchId', '==', batch.id))),
          fastGetDocs(query(collection(db, 'mortality'), where('userId', '==', currentUser?.uid), where('batchId', '==', batch.id)))
        ]);
        salesSnap.forEach(d => tSales += Number(d.data().totalAmount || 0));
        expSnap.forEach(d => tOther += Number(d.data().amount || 0));
        feedSnap.forEach(d => {
          tFeed += Number(d.data().cost || 0);
          const bagSize = Number(d.data().bagWeightKg) || batchBagWeight;
          feedKg += Number(d.data().quantityKg || (d.data().bags ? d.data().bags * bagSize : 0));
        });
        medSnap.forEach(d => tMed += Number(d.data().cost || 0));
        mortSnap.forEach(d => mort += Number(d.data().count || 0));
      }

      setCompletingFinancials({
        totalSales: tSales,
        feedCost: tFeed,
        medCost: tMed,
        otherCost: tOther,
        chickCost: cChick,
        mortalityCount: mort,
        feedConsumedKg: feedKg
      });
    } catch (e) {
      console.error('Error prefetching batch financials', e);
    }
  };

  const handleConfirmCompleteBatch = async (report: BatchClosureReport) => {
    if (!completeBatchItem) return;
    const targetId = completeBatchItem.id;
    try {
      if (isDemoUser) {
        demoStore.saveBatch({ 
          ...completeBatchItem,
          id: targetId, 
          status: 'completed',
          endDate: report.endDate,
          completedAt: report.completedAt,
          closureReport: report
        } as any);

        if (report.feedSettlementAction === 'returned_to_stock' && report.returnedFeedBags > 0) {
          demoStore.saveFeedRecord({
            batchId: targetId,
            feedType: 'উদ্বৃত্ত খাদ্য ফেরত (Returned to Stock)',
            quantityKg: -report.returnedFeedKg,
            bags: -report.returnedFeedBags,
            cost: 0,
            date: report.endDate,
            details: `[স্টক ফেরত] ব্যাচ ${completeBatchItem.batchName} সমাপ্তি থেকে ${report.returnedFeedBags} বস্তা খাদ্য মূল গুদামে ফেরত যোগ হয়েছে।`
          } as any);
        }

        toast.success(
          language === 'bn' 
            ? `ব্যাচটি সফলভাবে সমাপ্ত ও স্থায়ীভাবে সংরক্ষিত হয়েছে!` 
            : 'Batch successfully completed and archived!'
        );
        setCompleteBatchItem(null);
        setCompletingFinancials(null);
        fetchBatches();
        return;
      }

      const batchRef = doc(db, 'batches', targetId);
      await offlineSafeDocWrite(updateDoc(batchRef, { 
        status: 'completed',
        endDate: report.endDate,
        completedAt: report.completedAt,
        closureReport: report,
        updatedAt: new Date().toISOString()
      }));

      if (report.feedSettlementAction === 'returned_to_stock' && report.returnedFeedBags > 0) {
        await offlineSafeDocWrite(addDoc(collection(db, 'feed_records'), {
          userId: currentUser?.uid,
          batchId: targetId,
          feedType: 'উদ্বৃত্ত খাদ্য ফেরত (Returned to Stock)',
          quantityKg: -report.returnedFeedKg,
          bags: -report.returnedFeedBags,
          cost: 0,
          date: report.endDate,
          details: `[স্টক ফেরত] ব্যাচ ${completeBatchItem.batchName} সমাপ্তি থেকে ${report.returnedFeedBags} বস্তা (${report.returnedFeedKg} কেজি) খাদ্য মূল গুদামে ফেরত যোগ হয়েছে।`,
          createdAt: new Date().toISOString()
        }));
      }

      toast.success(
        language === 'bn' 
          ? `ব্যাচটি সফলভাবে সমাপ্ত ও স্থায়ীভাবে সংরক্ষিত হয়েছে!` 
          : 'Batch successfully completed and archived!'
      );
      setCompleteBatchItem(null);
      setCompletingFinancials(null);
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

  const handleGoToDues = () => {
    const bName = deleteBatchItem?.batchName;
    setDeleteBatchItem(null);
    toast.success(
      language === 'bn'
        ? `"${bName}"-এর বকেয়া আদায় বা পরিশোধ করতে বকেয়া খাতায় নেওয়া হয়েছে`
        : 'Navigated to Dues Ledger to manage outstanding records',
      { icon: '📖', duration: 4000 }
    );
    navigate('/dues');
  };

  // Audit batch dues whenever a batch is selected for deletion
  useEffect(() => {
    if (!deleteBatchItem) {
      setBatchDuesInfo(null);
      setBatchDuesLoading(false);
      setConfirmDeleteWithDues(false);
      return;
    }

    let isMounted = true;
    setBatchDuesLoading(true);
    setConfirmDeleteWithDues(false);

    const auditBatchDues = async () => {
      try {
        const targetId = deleteBatchItem.id;
        const targetBatchName = (deleteBatchItem.batchName || '').trim();

        let allDuesList: any[] = [];
        const relatedSourceIds = new Set<string>();
        const relatedDueIds = new Set<string>();

        if (isDemoUser) {
          const demoSales = demoStore.getSales().filter(s => s.batchId === targetId);
          const demoExpenses = demoStore.getExpenses().filter(e => e.batchId === targetId);
          const demoFeed = demoStore.getFeedRecords().filter(f => f.batchId === targetId);
          const demoMedicine = demoStore.getMedicineRecords().filter(m => m.batchId === targetId);

          demoSales.forEach(s => {
            if (s.id) relatedSourceIds.add(s.id);
            if ((s as any).dueRecordId) relatedDueIds.add((s as any).dueRecordId);
          });
          demoExpenses.forEach(e => {
            if (e.id) relatedSourceIds.add(e.id);
            if ((e as any).dueRecordId) relatedDueIds.add((e as any).dueRecordId);
          });
          demoFeed.forEach(f => {
            if (f.id) relatedSourceIds.add(f.id);
            if ((f as any).dueRecordId) relatedDueIds.add((f as any).dueRecordId);
          });
          demoMedicine.forEach(m => {
            if (m.id) relatedSourceIds.add(m.id);
            if ((m as any).dueRecordId) relatedDueIds.add((m as any).dueRecordId);
          });

          allDuesList = demoStore.getDues();
        } else if (currentUser) {
          const collectionsToCascade = [
            'feed_records',
            'medicine',
            'medicine_records',
            'expenses',
            'sales'
          ];

          await Promise.all(
            collectionsToCascade.map(async collName => {
              try {
                const q = query(
                  collection(db, collName),
                  where('userId', '==', currentUser.uid),
                  where('batchId', '==', targetId)
                );
                const snap = await fastGetDocs(q);
                snap.docs.forEach(d => {
                  relatedSourceIds.add(d.id);
                  const data = d.data();
                  if (data?.dueRecordId) relatedDueIds.add(data.dueRecordId);
                });
              } catch (e) {
                console.warn(`Audit check error on ${collName}:`, e);
              }
            })
          );

          try {
            const duesQ = query(
              collection(db, 'dues'),
              where('userId', '==', currentUser.uid)
            );
            const duesSnap = await fastGetDocs(duesQ);
            allDuesList = duesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          } catch (e) {
            console.warn('Audit check error on dues:', e);
          }
        }

        // Filter dues linked to this batch
        const matchedDues = allDuesList.filter(due => {
          if (due.batchId && due.batchId === targetId) return true;
          if (relatedDueIds.has(due.id)) return true;
          if (due.sourceId && relatedSourceIds.has(due.sourceId)) return true;
          if (targetBatchName && due.batchName && due.batchName.trim().toLowerCase() === targetBatchName.toLowerCase()) return true;
          if (targetBatchName && targetBatchName.length >= 2 && due.details) {
            const dText = due.details.toLowerCase();
            const bNameLower = targetBatchName.toLowerCase();
            if (
              dText.startsWith(bNameLower) ||
              dText.includes(`${bNameLower} -`) ||
              dText.includes(`${bNameLower} (`) ||
              dText.includes(`${bNameLower} এর`) ||
              (targetBatchName.length >= 3 && dText.includes(bNameLower) && ['sale', 'expense', 'feed', 'medicine'].includes(due.sourceType || ''))
            ) {
              return true;
            }
          }
          return false;
        });

        let totalRec = 0;
        let totalPay = 0;
        const receivableItems: any[] = [];
        const payableItems: any[] = [];

        matchedDues.forEach(d => {
          const amount = Number(d.amount) || 0;
          const totalPaid = Number(d.totalPaid) || 0;
          const remaining = Math.max(0, amount - totalPaid);
          const isSettled = d.status === 'paid' || remaining <= 0;
          const isReceivable = d.type === 'receivable' || d.type === 'payable_to_me';

          if (!isSettled && remaining > 0) {
            if (isReceivable) {
              totalRec += remaining;
              receivableItems.push({
                personName: d.personName || (language === 'bn' ? 'অজ্ঞাত ক্রেতা' : 'Customer'),
                phone: d.phone,
                remaining,
                totalAmount: amount,
                details: d.details || d.batchName
              });
            } else {
              totalPay += remaining;
              payableItems.push({
                personName: d.personName || (language === 'bn' ? 'অজ্ঞাত সরবরাহকারী' : 'Supplier'),
                phone: d.phone,
                remaining,
                totalAmount: amount,
                details: d.details || d.batchName
              });
            }
          }
        });

        if (isMounted) {
          setBatchDuesInfo({
            totalReceivable: totalRec,
            totalPayable: totalPay,
            totalDue: totalRec + totalPay,
            receivableItems,
            payableItems,
            allCount: matchedDues.length
          });
          setBatchDuesLoading(false);
        }
      } catch (err) {
        console.error('Failed to audit batch dues:', err);
        if (isMounted) {
          setBatchDuesLoading(false);
          setBatchDuesInfo({
            totalReceivable: 0,
            totalPayable: 0,
            totalDue: 0,
            receivableItems: [],
            payableItems: [],
            allCount: 0
          });
        }
      }
    };

    auditBatchDues();

    return () => {
      isMounted = false;
    };
  }, [deleteBatchItem, currentUser, isDemoUser, language]);

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

    // Optimistically remove from local state immediately so UI feels instantaneous
    setBatches(prev => prev.filter(b => b.id !== targetId));

    try {
      if (isDemoUser) {
        demoStore.deleteBatch(targetId);
        ['poultry', 'cattle', 'fish'].forEach(ft => {
          if (localStorage.getItem(`selected_batch_id_${ft}`) === targetId) {
            localStorage.removeItem(`selected_batch_id_${ft}`);
          }
        });
        toast.success(
          language === 'bn'
            ? 'ব্যাচ এবং এর সাথে সম্পর্কিত সকল হিসাব (খাবার, ঔষধ, খরচ, বিক্রি, বকেয়া) মুছে ফেলা হয়েছে'
            : t('batches.delSuccess'), 
          { duration: 3500 }
        );
        setDeleteBatchItem(null);
        return;
      }

      // 1. Gather all sub-records and their IDs in PARALLEL to ensure lightning-fast & full cascade
      const targetBatchName = (deleteBatchItem.batchName || '').trim();
      const collectionsToCascade = [
        'feed_records',
        'medicine',
        'medicine_records',
        'expenses',
        'sales',
        'mortality',
        'daily_actual_records',
        'weight_records'
      ];

      const subDocRefsToDelete: any[] = [];
      const relatedSourceIds = new Set<string>();
      const relatedDueIds = new Set<string>();

      // Query all collections concurrently
      await Promise.all(
        collectionsToCascade.map(async (collName) => {
          try {
            const q = query(
              collection(db, collName),
              where('userId', '==', currentUser?.uid),
              where('batchId', '==', targetId)
            );
            const snap = await fastGetDocs(q);
            snap.docs.forEach(d => {
              subDocRefsToDelete.push(d.ref);
              relatedSourceIds.add(d.id);
              const data = d.data();
              if (data?.dueRecordId) {
                relatedDueIds.add(data.dueRecordId);
              }
            });
          } catch (e) {
            console.warn(`Cascade sub-records error on ${collName}:`, e);
          }
        })
      );

      // 2. Cascade delete all associated Dues (বকেয়া খাতা) for this batch
      try {
        const duesQ = query(
          collection(db, 'dues'),
          where('userId', '==', currentUser?.uid)
        );
        const duesSnap = await fastGetDocs(duesQ);
        duesSnap.docs.forEach(dueDoc => {
          const dueData = dueDoc.data();
          const dueId = dueDoc.id;
          let shouldDelete = false;

          // Direct batchId match
          if (dueData.batchId && String(dueData.batchId).trim() === targetId) {
            shouldDelete = true;
          }
          // Linked dueRecordId from sub-record
          else if (relatedDueIds.has(dueId)) {
            shouldDelete = true;
          }
          // Linked sourceId from sub-record
          else if (dueData.sourceId && relatedSourceIds.has(dueData.sourceId)) {
            shouldDelete = true;
          }
          // Exact batchName match
          else if (targetBatchName && dueData.batchName && dueData.batchName.trim().toLowerCase() === targetBatchName.toLowerCase()) {
            shouldDelete = true;
          }
          // High-confidence batch title match in details text
          else if (targetBatchName && targetBatchName.length >= 2 && dueData.details) {
            const dText = dueData.details.toLowerCase();
            const bNameLower = targetBatchName.toLowerCase();
            if (
              dText.startsWith(bNameLower) ||
              dText.includes(`${bNameLower} -`) ||
              dText.includes(`${bNameLower} (`) ||
              dText.includes(`${bNameLower} এর`) ||
              (targetBatchName.length >= 2 && dText.includes(bNameLower))
            ) {
              shouldDelete = true;
            }
          }

          if (shouldDelete) {
            subDocRefsToDelete.push(dueDoc.ref);
          }
        });
      } catch (e) {
        console.warn('Cascade delete error on dues:', e);
      }

      // 3. Atomically delete all sub-records, dues, and the main batch doc via Firestore writeBatch
      const allRefsToDelete = [...subDocRefsToDelete, doc(db, 'batches', targetId)];
      const chunkSize = 400; // Safe threshold within Firestore 500 ops limit
      for (let i = 0; i < allRefsToDelete.length; i += chunkSize) {
        const chunk = allRefsToDelete.slice(i, i + chunkSize);
        const batchOp = writeBatch(db);
        chunk.forEach(ref => batchOp.delete(ref));
        await batchOp.commit();
      }

      // Reset active batch from localStorage if deleted
      ['poultry', 'cattle', 'fish'].forEach(ft => {
        if (localStorage.getItem(`selected_batch_id_${ft}`) === targetId) {
          localStorage.removeItem(`selected_batch_id_${ft}`);
        }
      });

      toast.success(
        language === 'bn'
          ? 'ব্যাচ এবং এর সকল তথ্য ও বকেয়া খাতার হিসাব স্থায়ীভাবে মুছে ফেলা হয়েছে'
          : t('batches.delSuccess'),
        { duration: 3500 }
      );
      setDeleteBatchItem(null);
    } catch (error) {
      toast.error(t('batches.delError'));
      handleFirestoreError(error, OperationType.DELETE, 'batches');
      // If error occurs, reload batches
      if (currentUser) {
        const q = query(collection(db, 'batches'), where('userId', '==', currentUser.uid));
        fastGetDocs(q).then(snap => {
          setBatches(snap.docs.map(d => ({ id: d.id, ...d.data() as any })));
        }).catch(() => {});
      }
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
    let tSalesQty = 0;
    let tSalesWeightKg = 0;
    let tMort = 0;
    let avgWeight = 0;
    const cChick = Number(batch.totalChicks || 0) * Number(batch.costPerChick || 0);

    try {
      if (isDemoUser) {
        demoStore.getSales(batchId).forEach(s => {
          tSales += Number(s.totalAmount || 0);
          tSalesQty += Number(s.quantity || 0);
          tSalesWeightKg += Number(s.totalWeightKg || 0);
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
          tSalesQty += Number(d.data().quantity || 0);
          tSalesWeightKg += Number(d.data().totalWeightKg || 0);
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

    // Retrieve measured sample weight from storage if available
    let measuredWeightGram: number | undefined = undefined;
    const savedWeight = localStorage.getItem(`batch_weight_${batchId}`);
    if (savedWeight && Number(savedWeight) > 0) {
      measuredWeightGram = Number(savedWeight);
      avgWeight = measuredWeightGram / 1000;
    } else if (avgWeight > 0) {
      measuredWeightGram = Math.round(avgWeight * 1000);
    }

    const bagWt = Math.max(1, Number(localStorage.getItem(`bag_weight_${batchId}`)) || 50);

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

          const breedNameMap: Record<string, string> = {
            broiler: 'ব্রয়লার',
            layer: 'লেয়ার',
            sonali: 'সোনালী',
            deshi: 'দেশি',
            duck: 'হাঁস',
            quail: 'কোয়েল',
            turkey: 'টার্কি',
            pigeon: 'কবুতর',
            dairy: 'ডেইরি',
            fattening: 'মোটাতাজাকরণ',
            goat: 'ছাগল',
            sheep: 'ভেড়া',
            buffalo: 'মহিষ',
            telapia: 'তেলাপিয়া',
            carp: 'কার্প',
            pangash: 'পাঙ্গাস',
            shing_pabda: 'শিং/পাবদা',
            mixed: 'মিশ্র'
          };
          const breedDisplay = batch.subBreed ? (breedNameMap[batch.subBreed.toLowerCase()] || batch.subBreed) : '';

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
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-xs">{badgeIcon}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60">
                      {badgeText}{breedDisplay ? ` • ${breedDisplay}` : ''}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 mb-3">
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
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[9px] font-bold text-slate-400 block">
                    {language === 'bn' ? 'বাচ্চা ক্রয়ের খরচ' : 'Stock Cost'}
                  </span>
                  <p className="text-xs font-black text-slate-700 font-sans">
                    ৳ {(Number(batch.totalChicks || 0) * Number(batch.costPerChick || 0)).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Real-time Profit & Loss Summary */}
              <div className="mb-2.5">
                <BatchSummary batchId={batch.id} totalChicks={batch.totalChicks} costPerChick={batch.costPerChick} />
              </div>

              {/* Action Buttons: View on Dashboard, Feed, FCR, SOP & Mark Complete */}
              {batch.status === 'active' && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleActivateOnDashboard(batch)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={language === 'bn' ? 'ড্যাশবোর্ডে সেট করুন' : 'Set on Dashboard'}
                    >
                      <LayoutDashboard size={13} />
                      <span>{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                    </button>

                    <button
                      onClick={() => navigate(`/feed?batchId=${batch.id}`)}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={language === 'bn' ? 'খাবার স্টক ও দৈনিক লগ' : 'View Feed Stock'}
                    >
                      <Wheat size={13} />
                      <span>{language === 'bn' ? 'খাবার স্টক' : 'Feed Stock'}</span>
                    </button>

                    <button
                      onClick={() => navigate(`/fcr?category=${batch.farmType || 'poultry'}&breed=${batch.subBreed || 'broiler'}&batchId=${batch.id}`)}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={language === 'bn' ? 'এই ব্যাচের FCR হিসাব ও পারফরম্যান্স' : 'Batch FCR & Performance'}
                    >
                      <Calculator size={13} className="text-indigo-600" />
                      <span>{language === 'bn' ? 'FCR হিসাব' : 'FCR'}</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => handleOpenCompleteModal(batch)} 
                    className="text-xs font-bold text-slate-600 hover:text-purple-700 px-2.5 py-1.5 rounded-xl hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                  >
                    <CheckCircle2 size={13} className="text-purple-600" />
                    <span>{language === 'bn' ? 'ব্যাচ সমাপ্ত করুন' : t('batches.markComplete')}</span>
                  </button>
                </div>
              )}

              {batch.status === 'completed' && (() => {
                const completedDate = batch.completedAt || batch.endDate || batch.updatedAt || batch.createdAt;
                const daysPassed = completedDate 
                  ? Math.max(0, Math.floor((new Date().getTime() - new Date(completedDate).getTime()) / (1000 * 60 * 60 * 24)))
                  : 0;
                const daysRemaining = Math.max(0, 15 - daysPassed);

                return (
                  <div className="space-y-2 pt-2 border-t border-slate-150">
                    {/* 15-Day Auto-Deletion Banner */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300/90 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Clock size={13} />
                        </div>
                        <div className="text-[11px] leading-tight">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded font-black text-[9px] bg-amber-500 text-white uppercase">
                              {language === 'bn' ? `আর ${daysRemaining} দিন বাকি` : `${daysRemaining} days left`}
                            </span>
                            <span className="font-extrabold text-amber-950">
                              {language === 'bn' ? '১৫ দিনের মধ্যে এই ব্যাচের ডাটা সক্রিয়ভাবে মুছে যাবে' : 'Batch data will auto-delete within 15 days'}
                            </span>
                          </div>
                          <p className="text-[10px] text-amber-900/85 font-medium mt-0.5">
                            {language === 'bn'
                              ? 'ব্যাচ সমাপ্ত হওয়ায় নতুন এন্ট্রি বন্ধ আছে। তথ্য হারানোর আগে সম্পূর্ণ হিসাব এক্সেল বা পিডিএফে ডাউনলোড করে নিন।'
                              : 'Batch is locked. Please download and backup your report before expiration.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadBatchArchive(batch, 'csv')}
                          disabled={exportingBatchId === batch.id}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                          title={language === 'bn' ? 'এক্সেল ডাউনলোড' : 'Excel'}
                        >
                          <FileSpreadsheet size={11} />
                          <span>{language === 'bn' ? 'এক্সেল' : 'CSV'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadBatchArchive(batch, 'pdf')}
                          disabled={exportingBatchId === batch.id}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                          title={language === 'bn' ? 'পিডিএফ ডাউনলোড' : 'PDF'}
                        >
                          <Download size={11} />
                          <span>{language === 'bn' ? 'PDF' : 'PDF'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-bold text-purple-800 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-purple-600" />
                        {language === 'bn' 
                          ? `ব্যাচ সমাপ্ত ${batch.endDate ? `(${new Date(batch.endDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })})` : ''}` 
                          : 'Completed & Locked'}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setViewReportBatch(batch)}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title={language === 'bn' ? 'চূড়ান্ত সমাপনী অডিট সার্টিফিকেট' : 'Audit Certificate'}
                        >
                          <Award size={12} className="text-amber-700" />
                          <span>{language === 'bn' ? 'অডিট সার্টিফিকেট' : 'Certificate'}</span>
                        </button>
                        <button
                          onClick={() => handleActivateOnDashboard(batch)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        >
                          <LayoutDashboard size={12} />
                          <span>{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                        </button>
                        <button
                          onClick={() => navigate(`/feed?batchId=${batch.id}`)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Wheat size={12} />
                          <span>{language === 'bn' ? 'খাবার' : 'Feed'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
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

      {/* Enhanced Batch Complete Modal with Feed & Inventory Settlement */}
      {completeBatchItem && (
        <BatchCompletionModal
          batch={completeBatchItem}
          isBn={language === 'bn'}
          initialFinancials={completingFinancials}
          onClose={() => {
            setCompleteBatchItem(null);
            setCompletingFinancials(null);
          }}
          onConfirmComplete={handleConfirmCompleteBatch}
        />
      )}

      {/* Completed Batch Certificate & Audit Report Modal */}
      {viewReportBatch && (
        <CompletedBatchReportModal
          batch={viewReportBatch}
          isBn={language === 'bn'}
          onClose={() => setViewReportBatch(null)}
        />
      )}

      {/* Prominent Red Warning Modal for Batch Cascade Deletion with Dues Audit & Notice */}
      {deleteBatchItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-rose-300 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-rose-100 flex items-start justify-between bg-rose-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-black text-rose-950 text-base sm:text-lg">
                    {language === 'bn' ? 'ব্যাচ মুছে ফেলার পূর্বে বকেয়া নোটিশ ও সতর্কতা' : 'Dues Audit & Batch Deletion Notice'}
                  </h3>
                  <p className="text-xs text-rose-800 font-bold mt-0.5 flex items-center gap-1.5">
                    <Package size={13} className="text-rose-600" />
                    <span>"{deleteBatchItem.batchName}"</span>
                  </p>
                </div>
              </div>
              <button
                disabled={isDeleting}
                onClick={() => setDeleteBatchItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs sm:text-sm">
              
              {/* Dues Checking Loading State */}
              {batchDuesLoading && (
                <div className="flex items-center justify-center gap-2.5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold animate-pulse">
                  <Clock size={16} className="animate-spin text-amber-600" />
                  <span>{language === 'bn' ? 'এই ব্যাচের বকেয়া খাতা ও লেনদেন হিসাব যাচাই করা হচ্ছে...' : 'Auditing batch dues and pending ledger records...'}</span>
                </div>
              )}

              {/* Dues Audit Result: If Outstanding Dues Exist */}
              {!batchDuesLoading && batchDuesInfo && batchDuesInfo.totalDue > 0 && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert size={24} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-amber-950 text-sm sm:text-base leading-snug">
                        {language === 'bn' 
                          ? `⚠️ সতর্কতা: এই ব্যাচে এখনও মোট ৳ ${batchDuesInfo.totalDue.toLocaleString()}-এর অপরিশোধিত বকেয়া হিসাব রয়েছে!`
                          : `⚠️ Alert: This batch has ৳ ${batchDuesInfo.totalDue.toLocaleString()} in unsettled pending dues!`}
                      </h4>
                      <p className="text-xs text-amber-900 font-medium mt-1 leading-relaxed">
                        {language === 'bn'
                          ? 'পরামর্শ: ব্যাচটি মুছে ফেলার পূর্বে সংশ্লিষ্ট ক্রেতা বা মহাজন/সাপ্লায়ারের সাথে বকেয়া টাকা আদায় অথবা পরিশোধ করে হিসাব ক্লোজ করে নেওয়া উত্তম।'
                          : 'Recommendation: It is highly recommended to collect or settle these outstanding dues in the Dues Ledger before deleting this batch.'}
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {/* Customer Receivables */}
                    <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-blue-700 block">
                        {language === 'bn' ? 'ক্রেতার কাছে পাওনা (বাকি)' : 'Customer Receivables'}
                      </span>
                      <p className="text-base sm:text-lg font-black text-blue-900 mt-0.5">
                        ৳ {batchDuesInfo.totalReceivable.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-blue-600 font-bold">
                        {batchDuesInfo.receivableItems.length} {language === 'bn' ? 'জন ক্রেতার কাছে বাকি' : 'unpaid customers'}
                      </span>
                    </div>

                    {/* Supplier Payables */}
                    <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-amber-800 block">
                        {language === 'bn' ? 'সরবরাহকারীর দেনা (বাকি)' : 'Supplier Payables'}
                      </span>
                      <p className="text-base sm:text-lg font-black text-amber-950 mt-0.5">
                        ৳ {batchDuesInfo.totalPayable.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-amber-700 font-bold">
                        {batchDuesInfo.payableItems.length} {language === 'bn' ? 'জন সরবরাহকারীর দেনা' : 'unpaid suppliers'}
                      </span>
                    </div>
                  </div>

                  {/* Pending Parties Preview */}
                  {(batchDuesInfo.receivableItems.length > 0 || batchDuesInfo.payableItems.length > 0) && (
                    <div className="bg-white/90 rounded-lg p-2.5 border border-amber-200 max-h-32 overflow-y-auto space-y-1.5 text-[11px]">
                      <p className="font-bold text-slate-700 text-[11px] border-b border-slate-100 pb-1">
                        {language === 'bn' ? 'এই ব্যাচের সাথে যুক্ত বকেয়ার বিবরণ:' : 'Pending parties list:'}
                      </p>
                      {batchDuesInfo.receivableItems.map((item, idx) => (
                        <div key={`rec-${idx}`} className="flex justify-between items-center text-blue-950 font-medium">
                          <span className="truncate pr-2">👤 {item.personName} <span className="text-[10px] text-blue-600">({language === 'bn' ? 'পাওনা' : 'Rec.'})</span></span>
                          <span className="font-black text-blue-700 shrink-0">৳ {item.remaining.toLocaleString()}</span>
                        </div>
                      ))}
                      {batchDuesInfo.payableItems.map((item, idx) => (
                        <div key={`pay-${idx}`} className="flex justify-between items-center text-amber-950 font-medium">
                          <span className="truncate pr-2">🏢 {item.personName} <span className="text-[10px] text-amber-700">({language === 'bn' ? 'দেনা' : 'Pay.'})</span></span>
                          <span className="font-black text-amber-800 shrink-0">৳ {item.remaining.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendation Button: Go To Dues */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={handleGoToDues}
                      className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <BookOpen size={16} />
                      <span>
                        {language === 'bn' 
                          ? '👉 বকেয়া খাতা দেখতে যান ও টাকা আদায়/পরিশোধ করুন' 
                          : 'Go to Dues Ledger to Settle Before Delete'}
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Dues Audit Result: If NO Outstanding Dues */}
              {!batchDuesLoading && batchDuesInfo && batchDuesInfo.totalDue === 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-950 text-xs sm:text-sm">
                      {language === 'bn' ? 'এই ব্যাচে কোনো অপরিশোধিত বকেয়া নেই (Zero Pending Dues)' : 'No outstanding dues for this batch.'}
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      {language === 'bn' 
                        ? 'এই ব্যাচের সমস্ত কেনাবেচা ও খরচের হিসাব সম্পূর্ণ পরিশোধিত রয়েছে।' 
                        : 'All financial dues associated with this batch have been fully settled.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Cascade Deletion Warning Details */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-xs text-rose-950 font-medium">
                <p className="font-bold text-rose-950 flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  <span>
                    {language === 'bn' 
                      ? 'স্থায়ীভাবে ডিলিট হওয়ার পর যেসকল তথ্য আর পাওয়া যাবে না:' 
                      : 'Records that will be permanently purged:'}
                  </span>
                </p>
                <ul className="list-disc list-inside space-y-1 font-bold text-rose-900 pl-1 text-[11px] bg-white/80 p-2.5 rounded-lg border border-rose-200/80">
                  <li>{language === 'bn' ? 'খাদ্য ও বস্তার হিসাব (Feed & Bags records)' : 'All feed consumption & purchase logs'}</li>
                  <li>{language === 'bn' ? 'ঔষধ ও ভ্যাকসিনের হিসাব (Medicine & vaccines)' : 'All medicine treatment records'}</li>
                  <li>{language === 'bn' ? 'দৈনিক মৃত্যুর হিসাব (Mortality logs)' : 'Daily mortality numbers'}</li>
                  <li>{language === 'bn' ? 'খরচের ভাউচার ও হিসাব (Expense records)' : 'All general expense entries'}</li>
                  <li>{language === 'bn' ? 'মুরগি বিক্রয় ও বাকি খাতার এন্ট্রি (Sales & Dues records)' : 'Sales records & ALL associated dues'}</li>
                </ul>
              </div>

              {/* Checkbox Protection if there are Pending Dues */}
              {!batchDuesLoading && batchDuesInfo && batchDuesInfo.totalDue > 0 && (
                <div className="bg-rose-100/70 border border-rose-300 rounded-xl p-3">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmDeleteWithDues}
                      onChange={(e) => setConfirmDeleteWithDues(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-rose-300 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-rose-950 leading-snug">
                      {language === 'bn'
                        ? `আমি সম্পূর্ণ সচেতনভাবে নিশ্চিত করছি যে, এই ব্যাচের ৳ ${batchDuesInfo.totalDue.toLocaleString()} অপরিশোধিত বকেয়া সহ সমস্ত হিসাব চিরতরে মুছে ফেলতে সম্মত।`
                        : `I acknowledge and confirm that all ৳ ${batchDuesInfo.totalDue.toLocaleString()} in pending dues will be permanently deleted along with this batch.`}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteBatchItem(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {language === 'bn' ? 'না, বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isDeleting || Boolean(batchDuesInfo && batchDuesInfo.totalDue > 0 && !confirmDeleteWithDues)}
                onClick={executeDelete}
                className="px-4 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 size={15} className={isDeleting ? 'animate-spin' : ''} />
                <span>
                  {isDeleting 
                    ? (language === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...') 
                    : (batchDuesInfo && batchDuesInfo.totalDue > 0
                        ? (language === 'bn' ? 'হ্যাঁ, বকেয়াসহ সম্পূর্ণ ব্যাচ মুছুন' : 'Delete Batch With All Dues')
                        : (language === 'bn' ? 'হ্যাঁ, সম্পূর্ণ ব্যাচ মুছুন' : 'Delete Batch'))}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
