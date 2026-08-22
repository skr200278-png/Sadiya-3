import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, offlineSafeDocWrite, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  User, 
  Phone, 
  Filter, 
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowDownRight,
  FileText,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { demoStore } from '../utils/demoStore';
import CashMemoModal, { CashMemoData } from '../components/CashMemoModal';

export default function Sales() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [memoData, setMemoData] = useState<CashMemoData | null>(null);
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const [records, setRecords] = useState<any[]>([]);
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  
  const [showForm, setShowForm] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Product Category & Dynamic Units
  const [category, setCategory] = useState<'chicken' | 'egg' | 'milk' | 'manure' | 'chicks' | 'cattle' | 'fish' | 'other'>('chicken');
  const [customProductName, setCustomProductName] = useState('');
  const [unitType, setUnitType] = useState('kg'); // 'kg', 'pcs', 'hali', 'case', 'liter', 'bag', 'trolley', 'mon'
  
  // Weights / Quantities & Pricing
  const [saleType, setSaleType] = useState<'weight' | 'quantity'>('weight'); // 'weight' or 'quantity'
  const [totalWeightKg, setTotalWeightKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerPiece, setPricePerPiece] = useState('');
  
  // Buyer & Financials
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [batchCosts, setBatchCosts] = useState<{
    costPerChick: number;
    totalChicks: number;
    liveBirds: number;
    grandTotalCost: number;
    costPerBird: number;
    farmType: string;
  } | null>(null);

  // Auto-adjust default category based on batch type
  const handleBatchChange = (selectedBatchId: string) => {
    setBatchId(selectedBatchId);
    const batch = activeBatches.find(b => b.id === selectedBatchId);
    if (batch) {
      if (batch.farmType === 'cattle') {
        setCategory('milk');
        setSaleType('quantity');
        setUnitType('liter');
      } else if (batch.farmType === 'fish') {
        setCategory('fish');
        setSaleType('weight');
        setUnitType('kg');
      } else {
        // default poultry
        setCategory('chicken');
        setSaleType('weight');
        setUnitType('kg');
      }
    }
  };

  // Switch form layout & units when category changes
  const handleCategoryChange = (newCat: any) => {
    setCategory(newCat);
    if (newCat === 'chicken') {
      setSaleType('weight');
      setUnitType('kg');
    } else if (newCat === 'egg') {
      setSaleType('quantity');
      setUnitType('hali');
    } else if (newCat === 'milk') {
      setSaleType('quantity');
      setUnitType('liter');
    } else if (newCat === 'manure') {
      setSaleType('quantity');
      setUnitType('bag');
    } else if (newCat === 'chicks' || newCat === 'cattle') {
      setSaleType('quantity');
      setUnitType('pcs');
    } else if (newCat === 'fish') {
      setSaleType('weight');
      setUnitType('kg');
    } else {
      setSaleType('quantity');
      setUnitType('pcs');
    }
  };

  // Fetch costs for poultry profit calculator
  useEffect(() => {
    if (!currentUser || !batchId) {
      setBatchCosts(null);
      return;
    }

    const fetchBatchSummaryCosts = async () => {
      try {
        const batch = activeBatches.find(b => b.id === batchId);
        if (!batch) return;

        const originalChicksCost = (Number(batch.totalChicks) || 0) * (Number(batch.costPerChick) || 0);

        if (isDemoUser) {
          let tExpenses = 0;
          demoStore.getExpenses(batchId).forEach(e => tExpenses += Number(e.amount || 0));
          let tFeed = 0;
          demoStore.getFeedRecords(batchId).forEach(f => tFeed += Number(f.cost || 0));
          let tMed = 0;
          demoStore.getMedicineRecords(batchId).forEach(m => tMed += Number(m.cost || 0));
          let tMort = 0;
          demoStore.getMortalityRecords(batchId).forEach(m => tMort += Number(m.count || 0));

          const liveBirds = Math.max(1, (Number(batch.totalChicks) || 0) - tMort);
          const grandTotalCost = originalChicksCost + tExpenses + tFeed + tMed;
          const costPerBird = grandTotalCost / liveBirds;

          setBatchCosts({
            costPerChick: Number(batch.costPerChick) || 0,
            totalChicks: Number(batch.totalChicks) || 0,
            liveBirds,
            grandTotalCost,
            costPerBird,
            farmType: batch.farmType || 'poultry'
          });
          return;
        }

        // Expenses
        const expQ = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const expSnap = await fastGetDocs(expQ);
        let tExpenses = 0;
        expSnap.forEach(doc => tExpenses += (Number(doc.data().amount) || 0));

        // Feed Cost
        const feedQ = query(collection(db, 'feed_records'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const feedSnap = await fastGetDocs(feedQ);
        let tFeed = 0;
        feedSnap.forEach(doc => tFeed += (Number(doc.data().cost) || 0));

        // Medicine Cost
        const medQ = query(collection(db, 'medicine_records'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const medSnap = await fastGetDocs(medQ);
        let tMed = 0;
        medSnap.forEach(doc => tMed += (Number(doc.data().cost) || 0));

        // Mortality
        const mortQ = query(collection(db, 'mortality'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const mortSnap = await fastGetDocs(mortQ);
        let tMort = 0;
        mortSnap.forEach(doc => tMort += (Number(doc.data().count) || 0));

        const liveBirds = Math.max(1, (Number(batch.totalChicks) || 0) - tMort);
        const grandTotalCost = originalChicksCost + tExpenses + tFeed + tMed;
        const costPerBird = grandTotalCost / liveBirds;

        setBatchCosts({
          costPerChick: Number(batch.costPerChick) || 0,
          totalChicks: Number(batch.totalChicks) || 0,
          liveBirds,
          grandTotalCost,
          costPerBird,
          farmType: batch.farmType || 'poultry'
        });
      } catch (error) {
        console.error("Error fetching batch costs for indicator:", error);
      }
    };

    fetchBatchSummaryCosts();
  }, [batchId, currentUser, isDemoUser, activeBatches]);

  // Real-time synchronization for Sales & Batches
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    if (isDemoUser) {
      const loadDemoData = () => {
        const batches = demoStore.getBatches();
        setActiveBatches(batches);
        if (batches.length > 0 && !batchId) {
          setBatchId(batches[0].id);
          if (batches[0].farmType === 'cattle') {
            setCategory('milk');
            setSaleType('quantity');
            setUnitType('liter');
          } else {
            setCategory('chicken');
            setSaleType('weight');
            setUnitType('kg');
          }
        }
        const sales = demoStore.getSales();
        setRecords([...sales].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
      };
      loadDemoData();
      const unsub = demoStore.subscribe(loadDemoData);
      return () => unsub();
    }

    const batchesQuery = query(collection(db, 'batches'), where('userId', '==', currentUser.uid));
    const unsubscribeBatches = onSnapshot(batchesQuery, (snap) => {
      const batches: any[] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setActiveBatches(batches);
      if (batches.length > 0 && !batchId) {
        setBatchId(batches[0].id);
        if (batches[0].farmType === 'cattle') {
          setCategory('milk');
          setSaleType('quantity');
          setUnitType('liter');
        } else {
          setCategory('chicken');
          setSaleType('weight');
          setUnitType('kg');
        }
      }
    }, (error) => {
      console.warn('Sales activeBatches onSnapshot error:', error);
    });

    const salesQuery = query(collection(db, 'sales'), where('userId', '==', currentUser.uid));
    const unsubscribeSales = onSnapshot(salesQuery, (snap) => {
      const fetchedRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setRecords(fetchedRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sales');
      setLoading(false);
    });

    return () => {
      unsubscribeBatches();
      unsubscribeSales();
    };
  }, [currentUser, isDemoUser]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    const targetId = deleteId;
    setDeleteId(null);
    try {
      if (isDemoUser) {
        demoStore.deleteSale(targetId);
        toast.success(t('common.success'), { duration: 3000 });
        return;
      }

      await offlineSafeDocWrite(deleteDoc(doc(db, 'sales', targetId)));
      toast.success(t('common.success'), { duration: 3000 });
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.DELETE, 'sales');
    }
  };

  // Dynamic Total Amount Calculation
  const currentTotalAmount = useMemo(() => {
    if (saleType === 'weight') {
      return (Number(totalWeightKg) || 0) * (Number(pricePerKg) || 0);
    } else {
      return (Number(quantity) || 0) * (Number(pricePerPiece) || 0);
    }
  }, [saleType, totalWeightKg, pricePerKg, quantity, pricePerPiece]);

  const currentPaidRaw = amountPaid ? Number(amountPaid) : currentTotalAmount;
  const currentDue = Math.max(0, currentTotalAmount - currentPaidRaw);
  const currentReturnAmount = amountPaid ? Math.max(0, currentPaidRaw - currentTotalAmount) : 0;

  // Helper for Category Display Label
  const getCategoryLabel = (cat: string, pName?: string) => {
    if (pName && pName.trim()) return pName;
    switch (cat) {
      case 'chicken': return language === 'bn' ? '🐔 ব্রয়লার / সোনালী মুরগি' : '🐔 Live Chicken';
      case 'egg': return language === 'bn' ? '🥚 ডিম (Eggs)' : '🥚 Eggs';
      case 'milk': return language === 'bn' ? '🥛 গরুর দুধ (Milk)' : '🥛 Cow Milk';
      case 'manure': return language === 'bn' ? '💩 লিটার / সার (Manure)' : '💩 Litter / Manure';
      case 'chicks': return language === 'bn' ? '🐣 বাচ্চা / ছানা (Chicks)' : '🐣 Day-old Chicks';
      case 'cattle': return language === 'bn' ? '🐂 গরু / বাছুর (Cattle)' : '🐂 Cattle';
      case 'fish': return language === 'bn' ? '🐟 তাজা মাছ (Fish)' : '🐟 Fish';
      default: return language === 'bn' ? '✨ খামারের পণ্য' : '✨ Farm Goods';
    }
  };

  // Helper for Unit Label
  const getUnitDisplay = (uType: string, count: number) => {
    switch (uType) {
      case 'hali': return language === 'bn' ? `${count} হালি` : `${count} Hali`;
      case 'case': return language === 'bn' ? `${count} কেস` : `${count} Cases`;
      case 'liter': return language === 'bn' ? `${count} লিটার` : `${count} Liters`;
      case 'bag': return language === 'bn' ? `${count} বস্তা` : `${count} Bags`;
      case 'trolley': return language === 'bn' ? `${count} ট্রলি` : `${count} Trolleys`;
      case 'mon': return language === 'bn' ? `${count} মণ` : `${count} Maunds`;
      case 'pcs': return language === 'bn' ? `${count} পিস` : `${count} Pcs`;
      default: return `${count} ${uType}`;
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !batchId) return toast.error(t('feed.batchSelectionReq'));
    if (isSubmitting || submitLock.current) return;

    if (currentTotalAmount <= 0) {
      return toast.error(language === 'bn' ? 'দয়া করে সঠিক পরিমাণ এবং দর উল্লেখ করুন!' : 'Please enter valid quantity and price rate!');
    }

    const paidVal = Math.min(currentPaidRaw, currentTotalAmount);

    if (paidVal < currentTotalAmount && !buyerName.trim()) {
      return toast.error(t('sales.missingReceiver'));
    }

    setIsSubmitting(true);
    submitLock.current = true;

    try {
      const normalizedBuyerName = buyerName.trim().replace(/\s+/g, ' ');
      const batchName = activeBatches.find(b => b.id === batchId)?.batchName || 'Unknown Batch';
      const catTitle = getCategoryLabel(category, customProductName);

      const newRecord = {
        userId: currentUser.uid,
        batchId,
        date,
        category,
        productName: customProductName.trim() || '',
        unit: unitType,
        saleType,
        totalWeightKg: saleType === 'weight' ? Number(totalWeightKg) || 0 : 0,
        pricePerKg: saleType === 'weight' ? Number(pricePerKg) || 0 : 0,
        quantity: saleType === 'weight' ? (quantity ? Number(quantity) : 0) : (Number(quantity) || 0),
        pricePerPiece: saleType === 'quantity' ? Number(pricePerPiece) || 0 : 0,
        totalAmount: currentTotalAmount,
        amountPaid: paidVal,
        buyerName: normalizedBuyerName,
        buyerPhone: buyerPhone.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString()
      };

      if (isDemoUser) {
        demoStore.saveSale(newRecord);
        
        // Auto add to dues ledger if there is an unpaid balance
        if (paidVal < currentTotalAmount) {
          const itemSummaryText = saleType === 'weight'
            ? `${totalWeightKg} কেজি`
            : getUnitDisplay(unitType, Number(quantity) || 0);

          const dueRecord = {
            userId: currentUser.uid,
            personName: normalizedBuyerName,
            phone: buyerPhone.trim(),
            type: 'receivable' as const,
            amount: currentTotalAmount,
            totalPaid: paidVal,
            details: `${batchName} - ${catTitle} (${itemSummaryText}) বিক্রয় বাকি`,
            recordDate: date,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          demoStore.saveDue(dueRecord);
        }

        toast.success(t('sales.addSuccess'));
        resetForm();
        return;
      }

      await offlineSafeDocWrite(addDoc(collection(db, 'sales'), newRecord));

      // Auto add to dues ledger if there is an unpaid balance
      if (paidVal < currentTotalAmount) {
        const itemSummaryText = saleType === 'weight'
          ? `${totalWeightKg} কেজি`
          : getUnitDisplay(unitType, Number(quantity) || 0);

        const dueRecord = {
          userId: currentUser.uid,
          personName: normalizedBuyerName,
          phone: buyerPhone.trim(),
          type: 'receivable',
          amount: currentTotalAmount,
          totalPaid: paidVal,
          details: `${batchName} - ${catTitle} (${itemSummaryText}) বিক্রয় বাকি`,
          recordDate: date,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await offlineSafeDocWrite(addDoc(collection(db, 'dues'), dueRecord));
      }

      toast.success(t('sales.addSuccess'));
      resetForm();
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.CREATE, 'sales');
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setTotalWeightKg('');
    setPricePerKg('');
    setQuantity('');
    setPricePerPiece('');
    setAmountPaid('');
    setBuyerName('');
    setBuyerPhone('');
    setCustomProductName('');
    setNotes('');
  };

  // Filtered Records & Statistics
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesCategory = filterCategory === 'all' || (r.category || 'chicken') === filterCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        (r.buyerName && r.buyerName.toLowerCase().includes(term)) ||
        (r.buyerPhone && r.buyerPhone.includes(term)) ||
        (r.date && r.date.includes(term)) ||
        (r.productName && r.productName.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [records, filterCategory, searchTerm]);

  // Overall Financial Totals
  const { totalRevenue, totalCashCollected, totalOutstandingDue } = useMemo(() => {
    let rev = 0;
    let paid = 0;
    let due = 0;
    records.forEach(r => {
      const tot = Number(r.totalAmount) || 0;
      const pd = r.amountPaid !== undefined ? Number(r.amountPaid) : tot;
      rev += tot;
      paid += pd;
      due += Math.max(0, tot - pd);
    });
    return {
      totalRevenue: rev,
      totalCashCollected: paid,
      totalOutstandingDue: due
    };
  }, [records]);

  const handleOpenCashMemo = (record: any) => {
    const batchName = activeBatches.find(b => b.id === record.batchId)?.batchName || 'খামার পণ্য';
    const catLabel = getCategoryLabel(record.category || 'chicken', record.productName);
    const rPaid = record.amountPaid !== undefined ? Number(record.amountPaid) : Number(record.totalAmount);
    const rDue = Math.max(0, Number(record.totalAmount) - rPaid);

    let qtyStr = record.saleType === 'weight' || !record.saleType 
      ? `${record.totalWeightKg} কেজি` 
      : `${record.quantity} ${getUnitDisplay(record.unit || 'pcs', 1)}`;
    let rateNum = record.saleType === 'weight' || !record.saleType 
      ? Number(record.pricePerKg) 
      : Number(record.pricePerPiece);

    const memo: CashMemoData = {
      memoNo: `SALES-${new Date(record.date).getTime().toString().slice(-6)}`,
      date: new Date(record.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
      batchName: batchName,
      buyerName: record.buyerName,
      buyerPhone: record.buyerPhone,
      items: [
        {
          name: `${catLabel} ${record.productName ? `(${record.productName})` : ''}`,
          quantity: qtyStr,
          unitPrice: rateNum,
          totalPrice: Number(record.totalAmount)
        }
      ],
      totalAmount: Number(record.totalAmount),
      paidAmount: rPaid,
      dueAmount: rDue,
      notes: record.notes,
      type: 'sale'
    };

    setMemoData(memo);
    setIsMemoOpen(true);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">{t('common.loading')}</div>;

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header & New Sale Button */}
      <div className="flex justify-between items-center bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-2xs">
            <ShoppingCart size={22} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-tight">
              {t('sales.title')}
            </h2>
            <p className="text-[11px] text-slate-400 font-bold">
              {language === 'bn' ? 'মুরগি, ডিম, দুধ, সার ও অন্যান্য পণ্যের বিক্রয় খাতা' : 'Multi-product sales logs with buyer dues'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>{showForm ? (language === 'bn' ? 'বন্ধ করুন' : 'Close') : t('sales.addSale')}</span>
        </button>
      </div>

      {/* Top Key Performance Metrics */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] sm:text-xs font-black text-slate-400 block uppercase">
            {language === 'bn' ? '💰 মোট বিক্রয়' : 'Total Sales'}
          </span>
          <span className="text-base sm:text-xl font-black text-teal-700 font-mono mt-0.5 block">
            ৳ {totalRevenue.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] sm:text-xs font-black text-emerald-600 block uppercase">
            {language === 'bn' ? '🟢 নগদ আদায়' : 'Cash Collected'}
          </span>
          <span className="text-base sm:text-xl font-black text-emerald-700 font-mono mt-0.5 block">
            ৳ {totalCashCollected.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] sm:text-xs font-black text-red-500 block uppercase">
            {language === 'bn' ? '🔴 বকেয়া পাওনা' : 'Sales Due'}
          </span>
          <span className="text-base sm:text-xl font-black text-red-600 font-mono mt-0.5 block">
            ৳ {totalOutstandingDue.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
          </span>
        </div>
      </div>

      {/* New Sale Entry Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-5 rounded-2xl shadow-md border border-teal-200/80 space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm sm:text-base font-extrabold text-teal-900 flex items-center gap-2">
              <Sparkles size={18} className="text-teal-600" />
              {language === 'bn' ? 'নতুন পণ্য বিক্রির এন্ট্রি ফর্ম' : 'Record New Product Sale'}
            </h3>
            <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              {language === 'bn' ? 'সহজ হিসাব' : 'Easy Entry'}
            </span>
          </div>

          {/* Batch and Date Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('medicine.batchLabel')} *</label>
              <select 
                required 
                value={batchId} 
                onChange={(e) => handleBatchChange(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 bg-white font-medium"
              >
                <option value="">{t('feed.selectOption')}</option>
                {activeBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchName} ({b.farmType === 'cattle' ? 'গরু' : b.farmType === 'fish' ? 'মাছ' : 'পোল্ট্রি'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('medicine.dateLabel')} *</label>
              <div className="relative">
                <input 
                  required 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 font-medium" 
                />
              </div>
            </div>
          </div>

          {/* Product Category Selector Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('sales.categoryLabel')} *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'chicken', label: t('sales.catChicken'), icon: '🐔' },
                { id: 'egg', label: t('sales.catEgg'), icon: '🥚' },
                { id: 'milk', label: t('sales.catMilk'), icon: '🥛' },
                { id: 'manure', label: t('sales.catManure'), icon: '💩' },
                { id: 'chicks', label: t('sales.catChicks'), icon: '🐣' },
                { id: 'cattle', label: t('sales.catCattle'), icon: '🐂' },
                { id: 'fish', label: t('sales.catFish'), icon: '🐟' },
                { id: 'other', label: t('sales.catOther'), icon: '✨' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`p-2 rounded-xl text-xs font-bold text-left border flex items-center gap-1.5 transition-all cursor-pointer ${
                    category === cat.id 
                      ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs' 
                      : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom product name if other or specific item */}
          {category === 'other' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('sales.productName')} *</label>
              <input 
                required 
                type="text" 
                value={customProductName} 
                onChange={(e) => setCustomProductName(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500" 
                placeholder={t('sales.productNamePlaceholder')} 
              />
            </div>
          )}

          {/* Unit & Calculation Mode Selector */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700">{t('sales.saleTypeLabel')}:</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800">
                  <input 
                    type="radio" 
                    name="saleType" 
                    value="weight" 
                    checked={saleType === 'weight'} 
                    onChange={() => { setSaleType('weight'); setUnitType('kg'); }} 
                    className="accent-teal-600" 
                  />
                  <span>{t('sales.typeWeight')}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800">
                  <input 
                    type="radio" 
                    name="saleType" 
                    value="quantity" 
                    checked={saleType === 'quantity'} 
                    onChange={() => setSaleType('quantity')} 
                    className="accent-teal-600" 
                  />
                  <span>{t('sales.typeQuantity')}</span>
                </label>
              </div>
            </div>

            {/* If quantity based, allow selecting specific unit */}
            {saleType === 'quantity' && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50">
                <span className="text-xs font-bold text-slate-600">{t('sales.unitSelect')}:</span>
                <div className="flex flex-wrap gap-1.5">
                  {category === 'egg' ? (
                    <>
                      <button type="button" onClick={() => setUnitType('hali')} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${unitType === 'hali' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-200 text-slate-700'}`}>{t('sales.eggUnitHali')}</button>
                      <button type="button" onClick={() => setUnitType('pcs')} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${unitType === 'pcs' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-200 text-slate-700'}`}>{t('sales.eggUnitPcs')}</button>
                      <button type="button" onClick={() => setUnitType('case')} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${unitType === 'case' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-200 text-slate-700'}`}>{t('sales.eggUnitCase')}</button>
                    </>
                  ) : category === 'milk' ? (
                    <>
                      <button type="button" onClick={() => setUnitType('liter')} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${unitType === 'liter' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-200 text-slate-700'}`}>{t('sales.milkUnitLiter')}</button>
                    </>
                  ) : category === 'manure' ? (
                    <>
                      <button type="button" onClick={() => setUnitType('bag')} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${unitType === 'bag' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-200 text-slate-700'}`}>{t('sales.manureUnitBag')}</button>
                      <button type="button" onClick={() => setUnitType('trolley')} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${unitType === 'trolley' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-200 text-slate-700'}`}>{t('sales.manureUnitTrolley')}</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setUnitType('pcs')} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${unitType === 'pcs' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-200 text-slate-700'}`}>পিস (Pcs)</button>
                      <button type="button" onClick={() => setUnitType('bag')} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${unitType === 'bag' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-200 text-slate-700'}`}>বস্তা (Bag)</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Amount Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {saleType === 'weight' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('sales.totalWeight')} *</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    value={totalWeightKg} 
                    onChange={(e) => setTotalWeightKg(e.target.value)} 
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 font-mono" 
                    placeholder={t('sales.weightPlaceholder')} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('sales.pricePerKgLabel')} *</label>
                  <input 
                    required 
                    type="number" 
                    value={pricePerKg} 
                    onChange={(e) => setPricePerKg(e.target.value)} 
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 font-mono" 
                    placeholder={t('sales.pricePerKgPlaceholder')} 
                  />
                </div>
                {category === 'chicken' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('sales.qtyOptional')}</label>
                    <input 
                      type="number" 
                      value={quantity} 
                      onChange={(e) => setQuantity(e.target.value)} 
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500" 
                      placeholder={t('sales.qtySoldPlaceholder')} 
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('sales.quantityCount')} ({unitType === 'hali' ? 'হালি' : unitType === 'liter' ? 'লিটার' : unitType === 'case' ? 'কেস' : unitType === 'bag' ? 'বস্তা' : 'সংখ্যা'}) *
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.1" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 font-mono" 
                    placeholder={t('sales.qtyPlaceholder')} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('sales.pricePerPieceLabel')} (প্রতি {unitType === 'hali' ? 'হালি' : unitType === 'liter' ? 'লিটার' : unitType === 'case' ? 'কেস' : unitType === 'bag' ? 'বস্তা' : 'একক'}) *
                  </label>
                  <input 
                    required 
                    type="number" 
                    value={pricePerPiece} 
                    onChange={(e) => setPricePerPiece(e.target.value)} 
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 font-mono" 
                    placeholder={t('sales.pricePerPiecePlaceholder')} 
                  />
                </div>
              </>
            )}
          </div>

          {/* Real-time Total Highlight */}
          <div className="bg-teal-50/80 p-3.5 rounded-xl flex justify-between items-center border border-teal-200">
            <span className="font-bold text-teal-900 text-xs sm:text-sm">{t('sales.totalMoney')}</span>
            <span className="font-black text-teal-700 text-base sm:text-xl font-mono">
              ৳ {currentTotalAmount.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
            </span>
          </div>

          {/* Live Poultry Profit/Loss Indicator */}
          {batchCosts && batchCosts.farmType === 'poultry' && category === 'chicken' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                  {language === 'bn' ? '📊 লাইভ লাভ-ক্ষতি প্রাক্কলন' : '📊 Live Profit/Loss Estimation'}
                </span>
                <span className="text-[10px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded border border-slate-200">
                  {language === 'bn' ? `১টি মুরগির গড় খরচ: ৳${Math.round(batchCosts.costPerBird)}` : `Avg Cost/Bird: ৳${Math.round(batchCosts.costPerBird)}`}
                </span>
              </div>
              
              {(quantity && Number(quantity) > 0) ? (() => {
                const qVal = Number(quantity);
                const totalEstimatedCost = qVal * batchCosts.costPerBird;
                const estProfit = currentTotalAmount - totalEstimatedCost;
                const isProfit = estProfit >= 0;
                
                return (
                  <div className={`p-2.5 rounded-lg border flex flex-col gap-1 ${isProfit ? 'bg-emerald-50 border-emerald-250 text-emerald-950' : 'bg-red-50 border-red-250 text-red-950'}`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold">
                        {language === 'bn' ? `উৎপাদন খরচ (${qVal} পিস):` : `Cost (${qVal} Pcs):`}
                      </span>
                      <span className="font-mono font-bold">৳{Math.round(totalEstimatedCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black">
                        {isProfit 
                          ? (language === 'bn' ? '🟢 আনুমানিক নিট লাভ:' : '🟢 Estimated Profit:') 
                          : (language === 'bn' ? '🔴 আনুমানিক লোকসান/লস:' : '🔴 Estimated Loss:')}
                      </span>
                      <span className={`text-base font-extrabold font-mono ${isProfit ? 'text-emerald-700' : 'text-red-700'}`}>
                        {isProfit ? '+' : ''}৳{Math.round(estProfit)}
                      </span>
                    </div>
                  </div>
                );
              })() : null}
            </div>
          )}

          {/* Buyer Details & Payment Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('sales.buyerName')}</label>
              <input 
                type="text" 
                value={buyerName} 
                onChange={(e) => setBuyerName(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500" 
                placeholder={t('sales.buyerNamePlaceholder')} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('sales.buyerPhone')}</label>
              <input 
                type="tel" 
                value={buyerPhone} 
                onChange={(e) => setBuyerPhone(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 font-mono" 
                placeholder={t('sales.buyerPhonePlaceholder')} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('sales.cashReceived')}</label>
            <input 
              type="number" 
              value={amountPaid} 
              onChange={(e) => setAmountPaid(e.target.value)} 
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 font-mono" 
              placeholder={`${t('sales.cashPlaceholder')}${currentTotalAmount}`} 
            />
            {currentDue > 0 && (
              <p className="text-red-600 text-xs mt-1.5 font-bold flex items-center gap-1">
                <AlertCircle size={14} className="shrink-0" />
                {t('feed.dueMsg')}{currentDue}{t('feed.dueMsgAuto')}
              </p>
            )}
            {currentReturnAmount > 0 && (
              <p className="text-emerald-600 text-xs mt-1.5 font-bold flex items-center gap-1">
                <CheckCircle2 size={14} className="shrink-0" />
                {t('sales.returnToBuyer')}{currentReturnAmount}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={resetForm}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button 
              disabled={isSubmitting} 
              type="submit" 
              className="flex-2 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm disabled:bg-slate-400 transition-all shadow-sm cursor-pointer"
            >
              {isSubmitting ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'bn' ? 'ক্রেতার নাম, ফোন নম্বর বা তারিখ দিয়ে খুঁজুন...' : 'Search by buyer name, phone or date...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 text-[11px] font-bold shrink-0 flex items-center gap-1">
            <Filter size={12} /> {language === 'bn' ? 'ক্যাটাগরি:' : 'Filter:'}
          </span>
          {[
            { id: 'all', label: language === 'bn' ? 'সকল পণ্য' : 'All Goods' },
            { id: 'chicken', label: '🐔 ' + (language === 'bn' ? 'মুরগি' : 'Chicken') },
            { id: 'egg', label: '🥚 ' + (language === 'bn' ? 'ডিম' : 'Eggs') },
            { id: 'milk', label: '🥛 ' + (language === 'bn' ? 'দুধ' : 'Milk') },
            { id: 'manure', label: '💩 ' + (language === 'bn' ? 'সার' : 'Manure') },
            { id: 'cattle', label: '🐂 ' + (language === 'bn' ? 'গরু' : 'Cattle') },
            { id: 'fish', label: '🐟 ' + (language === 'bn' ? 'মাছ' : 'Fish') },
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setFilterCategory(chip.id)}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                filterCategory === chip.id
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Record Logs List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 text-slate-400 space-y-1">
            <ShoppingCart size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-600">{language === 'bn' ? 'কোনো বিক্রির হিসাব পাওয়া যায়নি।' : 'No sales records found.'}</p>
            <p className="text-xs text-slate-400">{language === 'bn' ? 'উপরে "নতুন বিক্রি" বাটনে ক্লিক করে হিসাব যোগ করুন।' : 'Click "+ New Sale" to add records.'}</p>
          </div>
        )}

        {filteredRecords.map(record => {
          const batchName = activeBatches.find(b => b.id === record.batchId)?.batchName || 'Default Batch';
          const rPaid = record.amountPaid !== undefined ? Number(record.amountPaid) : Number(record.totalAmount);
          const rDue = Number(record.totalAmount) - rPaid;
          const catLabel = getCategoryLabel(record.category || 'chicken', record.productName);

          return (
            <div 
              key={record.id} 
              className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs hover:shadow-xs transition-all space-y-2.5"
            >
              {/* Header: Date, Category Badge and Total */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
                      <Calendar size={14} className="text-teal-600" />
                      {new Date(record.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-150">
                      {catLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                    <span>🏷️ {batchName}</span>
                    {record.buyerName && (
                      <span className="font-bold text-slate-700 flex items-center gap-0.5">
                        👤 {record.buyerName}
                      </span>
                    )}
                    {record.buyerPhone && (
                      <span className="text-blue-600 font-mono text-[11px]">
                        📞 {record.buyerPhone}
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end shrink-0">
                  <span className="font-black text-teal-700 text-base sm:text-lg font-mono">
                    ৳ {Number(record.totalAmount).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                  </span>
                  {rDue > 0 ? (
                    <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full mt-1">
                      {language === 'bn' ? `বাকি: ৳${rDue}` : `Due: ৳${rDue}`}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
                      {language === 'bn' ? 'পরিশোধিত' : 'Paid in Full'}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity & Unit Pricing Breakdown Box */}
              <div className="bg-slate-50/80 p-2.5 rounded-xl text-xs text-slate-700 flex justify-between items-center flex-wrap gap-2 border border-slate-100">
                <div className="flex items-center gap-2 flex-wrap font-medium">
                  {(!record.saleType || record.saleType === 'weight') ? (
                    <>
                      <span className="font-bold text-slate-800">
                        ⚖️ {record.totalWeightKg} {t('sales.kgTxt')}
                      </span>
                      {record.quantity > 0 && (
                        <span className="text-slate-500">
                          ({record.quantity} {t('sales.pcsTxt')})
                        </span>
                      )}
                      <span className="text-slate-500 font-mono">
                        @ ৳{record.pricePerKg}/কেজি
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-slate-800">
                        📦 {getUnitDisplay(record.unit || 'pcs', record.quantity || 0)}
                      </span>
                      <span className="text-slate-500 font-mono">
                        @ ৳{record.pricePerPiece}/একক
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-[11px] font-semibold text-slate-500">
                    {language === 'bn' ? 'জমা:' : 'Paid:'} <span className="font-bold text-emerald-700 font-mono">৳{rPaid}</span>
                  </div>

                  <button 
                    onClick={() => handleOpenCashMemo(record)} 
                    className="flex items-center gap-1 text-[11px] font-extrabold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
                    title={language === 'bn' ? 'ক্যাশ মেমো / রিসিট দেখুন' : 'View Cash Memo'}
                  >
                    <FileText size={13} className="text-teal-600" />
                    <span>{language === 'bn' ? 'মেমো' : 'Memo'}</span>
                  </button>

                  <button 
                    onClick={() => handleDelete(record.id)} 
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                    title={t('common.delete')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cash Memo & Invoice Modal */}
      <CashMemoModal
        isOpen={isMemoOpen}
        onClose={() => setIsMemoOpen(false)}
        data={memoData}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!deleteId}
        title={t('common.confirmDelete')}
        message={t('common.confirmDeleteMsg')}
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
