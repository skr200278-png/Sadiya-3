import React, { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  Calendar, 
  Package, 
  Wheat, 
  AlertTriangle, 
  Scale, 
  Pill, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, fastGetDocs, offlineSafeDocWrite, handleFirestoreError, OperationType } from '../firebase';
import { demoStore, DemoBatch } from '../utils/demoStore';
import { collection, addDoc, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface QuickDailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onSuccess?: () => void;
  defaultBatchId?: string;
  activeBatch?: any;
  batches?: any[];
  farmType?: 'poultry' | 'cattle' | 'fish';
}

export default function QuickDailyLogModal({
  isOpen,
  onClose,
  onSaved,
  onSuccess,
  defaultBatchId,
  activeBatch,
  batches: passedBatches,
  farmType = 'poultry'
}: QuickDailyLogModalProps) {
  const { currentUser, isDemoUser } = useAuth();
  const { language } = useLanguage();

  const [batches, setBatches] = useState<DemoBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(defaultBatchId || activeBatch?.id || '');
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  // Active section / tab to keep the form ultra-fast and simple
  const [activeTab, setActiveTab] = useState<'all' | 'feed' | 'mortality' | 'weight' | 'expense' | 'sales'>('all');

  // 1. Feed inputs
  const [feedType, setFeedType] = useState('Starter / প্রাথমিক');
  const [feedBags, setFeedBags] = useState<string>('');
  const [feedKg, setFeedKg] = useState<string>('');
  const [feedCost, setFeedCost] = useState<string>('');

  // 2. Mortality inputs
  const [mortalityCount, setMortalityCount] = useState<string>('');
  const [mortalityReason, setMortalityReason] = useState<string>('');

  // 3. Weight & Production
  const [avgWeightGram, setAvgWeightGram] = useState<string>('');
  const [eggCount, setEggCount] = useState<string>('');
  const [milkLiter, setMilkLiter] = useState<string>('');

  // 4. Medicine / Vaccine
  const [medicineName, setMedicineName] = useState<string>('');
  const [medicineCost, setMedicineCost] = useState<string>('');
  const [medicineType, setMedicineType] = useState<'medicine' | 'vaccine' | 'vitamin'>('vitamin');

  // 5. Expense
  const [expenseCategory, setExpenseCategory] = useState<string>('তুষ / লিটার (Litter)');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseNotes, setExpenseNotes] = useState<string>('');

  // 6. Sales
  const [saleQuantity, setSaleQuantity] = useState<string>('');
  const [saleTotalAmount, setSaleTotalAmount] = useState<string>('');
  const [saleBuyerName, setSaleBuyerName] = useState<string>('');

  // Load available active batches
  useEffect(() => {
    if (!isOpen) return;

    const loadBatches = async () => {
      try {
        if (isDemoUser || !currentUser) {
          const all = demoStore.getBatches().filter(b => b.status === 'active');
          setBatches(all);
          if (all.length > 0) {
            const match = defaultBatchId && all.find(b => b.id === defaultBatchId);
            setSelectedBatchId(match ? match.id : all[0].id);
          }
          return;
        }

        const q = query(
          collection(db, 'batches'),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'active')
        );
        const snap = await fastGetDocs(q);
        const list: DemoBatch[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as DemoBatch));
        setBatches(list);
        if (list.length > 0) {
          const match = defaultBatchId && list.find(b => b.id === defaultBatchId);
          setSelectedBatchId(match ? match.id : list[0].id);
        }
      } catch (err) {
        console.warn("Failed to load batches in QuickDailyLog:", err);
      }
    };

    loadBatches();
  }, [isOpen, currentUser, isDemoUser, defaultBatchId]);

  if (!isOpen) return null;

  const currentBatch = batches.find(b => b.id === selectedBatchId);
  const currentFarmType = currentBatch?.farmType || farmType;

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) {
      toast.error(language === 'bn' ? 'দয়া করে একটি ব্যাচ নির্বাচন করুন' : 'Please select a batch');
      return;
    }

    const hasFeed = (Number(feedBags) > 0 || Number(feedKg) > 0);
    const hasMortality = Number(mortalityCount) > 0;
    const hasWeight = Number(avgWeightGram) > 0 || Number(eggCount) > 0 || Number(milkLiter) > 0;
    const hasMedicine = medicineName.trim().length > 0;
    const hasExpense = Number(expenseAmount) > 0;
    const hasSales = Number(saleTotalAmount) > 0;

    if (!hasFeed && !hasMortality && !hasWeight && !hasMedicine && !hasExpense && !hasSales) {
      toast.error(language === 'bn' ? 'কমপক্ষে একটি হিসাবের তথ্য দিন' : 'Please enter at least one entry');
      return;
    }

    setSaving(true);
    let savedCount = 0;

    try {
      const targetUserId = currentUser ? currentUser.uid : 'demo_khamari_user_1';

      // 1. Save Feed
      if (hasFeed) {
        const bags = Number(feedBags) || (Number(feedKg) ? Number(feedKg) / 50 : 1);
        const cost = Number(feedCost) || 0;
        const feedData = {
          userId: targetUserId,
          batchId: selectedBatchId,
          date: logDate,
          feedType: feedType || 'দৈনিক খাদ্য',
          quantityBags: Number(bags.toFixed(2)),
          pricePerBag: bags > 0 && cost > 0 ? Math.round(cost / bags) : 0,
          cost: cost,
          amountPaid: cost,
          personName: 'নগদ / দৈনিক ব্যবহার',
          details: feedKg ? `দৈনিক ব্যবহার: ${feedKg} কেজি` : 'কুইক ডেইলি এন্ট্রি',
          createdAt: new Date().toISOString()
        };

        if (isDemoUser || !currentUser) {
          demoStore.saveFeedRecord(feedData);
        } else {
          await offlineSafeDocWrite(addDoc(collection(db, 'feed_records'), feedData));
        }
        savedCount++;
      }

      // 2. Save Mortality
      if (hasMortality) {
        const mortData = {
          userId: targetUserId,
          batchId: selectedBatchId,
          date: logDate,
          count: Number(mortalityCount),
          cause: mortalityReason || 'স্বাভাবিক / অজ্ঞাত',
          createdAt: new Date().toISOString()
        };

        if (isDemoUser || !currentUser) {
          demoStore.saveMortalityRecord(mortData);
        } else {
          await offlineSafeDocWrite(addDoc(collection(db, 'mortality'), mortData));
        }
        savedCount++;
      }

      // 3. Save Weight / Production (Cache in localStorage per batch for instant FCR & insights)
      if (hasWeight) {
        const weightPayload = {
          batchId: selectedBatchId,
          date: logDate,
          avgWeightGram: Number(avgWeightGram) || 0,
          eggCount: Number(eggCount) || 0,
          milkLiter: Number(milkLiter) || 0,
          updatedAt: new Date().toISOString()
        };
        try {
          // Store latest weight history for FCR comparison
          const weightKey = `batch_weights_${selectedBatchId}`;
          const existingWeights = JSON.parse(localStorage.getItem(weightKey) || '[]');
          existingWeights.push(weightPayload);
          localStorage.setItem(weightKey, JSON.stringify(existingWeights));
          localStorage.setItem(`latest_weight_${selectedBatchId}`, JSON.stringify(weightPayload));
        } catch (e) {
          console.warn("Weight storage note:", e);
        }
        savedCount++;
      }

      // 4. Save Medicine
      if (hasMedicine) {
        const medCost = Number(medicineCost) || 0;
        const medData = {
          userId: targetUserId,
          batchId: selectedBatchId,
          date: logDate,
          medicineName: medicineName.trim(),
          type: medicineType,
          cost: medCost,
          amountPaid: medCost,
          personName: 'ফার্মেসি',
          details: 'দৈনিক কুইক এন্ট্রি',
          createdAt: new Date().toISOString()
        };

        if (isDemoUser || !currentUser) {
          demoStore.saveMedicineRecord(medData);
        } else {
          await offlineSafeDocWrite(addDoc(collection(db, 'medicine'), medData));
        }
        savedCount++;
      }

      // 5. Save Expense
      if (hasExpense) {
        const expData = {
          userId: targetUserId,
          batchId: selectedBatchId,
          date: logDate,
          category: expenseCategory,
          amount: Number(expenseAmount),
          amountPaid: Number(expenseAmount),
          details: expenseNotes || 'দৈনিক পরিচালনা খরচ',
          description: expenseNotes || 'কুইক এন্ট্রি',
          createdAt: new Date().toISOString()
        };

        if (isDemoUser || !currentUser) {
          demoStore.saveExpense(expData);
        } else {
          await offlineSafeDocWrite(addDoc(collection(db, 'expenses'), expData));
        }
        savedCount++;
      }

      // 6. Save Sales
      if (hasSales) {
        const saleData = {
          userId: targetUserId,
          batchId: selectedBatchId,
          date: logDate,
          category: currentFarmType === 'poultry' ? 'chicken' : currentFarmType === 'cattle' ? 'cattle' : 'fish',
          productName: currentBatch?.batchName || 'খামার পণ্য',
          quantity: Number(saleQuantity) || 1,
          totalAmount: Number(saleTotalAmount),
          amountPaid: Number(saleTotalAmount),
          buyerName: saleBuyerName || 'স্থানীয় পাইকার',
          notes: 'কুইক বিক্রয় এন্ট্রি',
          createdAt: new Date().toISOString()
        };

        if (isDemoUser || !currentUser) {
          demoStore.saveSale(saleData);
        } else {
          await offlineSafeDocWrite(addDoc(collection(db, 'sales'), saleData));
        }
        savedCount++;
      }

      toast.success(
        language === 'bn' 
          ? `সফলভাবে ${savedCount}টি হিসাব সংরক্ষণ করা হয়েছে!` 
          : `Successfully recorded ${savedCount} entries!`,
        { icon: '✓', duration: 3500 }
      );

      // Reset form
      setFeedBags('');
      setFeedKg('');
      setFeedCost('');
      setMortalityCount('');
      setMortalityReason('');
      setAvgWeightGram('');
      setEggCount('');
      setMilkLiter('');
      setMedicineName('');
      setMedicineCost('');
      setExpenseAmount('');
      setExpenseNotes('');
      setSaleTotalAmount('');
      setSaleQuantity('');

      if (onSaved) onSaved();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving quick log:", error);
      toast.error(language === 'bn' ? 'সংরক্ষণ করতে সমস্যা হয়েছে' : 'Error saving entries');
      handleFirestoreError(error, OperationType.CREATE, 'quick_daily_log');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-emerald-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-amber-300 font-bold shadow-inner">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight leading-none">
                {language === 'bn' ? 'আজকের কুইক ডেইলি লগ' : 'Quick Daily Farm Log'}
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                {language === 'bn' ? 'খাদ্য, মৃত্যু, ওজন ও খরচ একসাথে দ্রুত এন্ট্রি' : 'Fast 30-second daily record entry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
          
          {/* 1. Batch & Date Selector (Compact Dual Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                <Package size={11} className="inline mr-1 text-emerald-600" />
                {language === 'bn' ? 'সক্রিয় ব্যাচ' : 'Active Batch'}
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600"
                required
              >
                {batches.length === 0 && (
                  <option value="">{language === 'bn' ? 'কোনো সক্রিয় ব্যাচ নেই' : 'No active batch'}</option>
                )}
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchName} ({b.totalChicks} {b.farmType === 'poultry' ? 'পাখি' : b.farmType === 'cattle' ? 'পশু' : 'মাছ'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                <Calendar size={11} className="inline mr-1 text-blue-600" />
                {language === 'bn' ? 'তারিখ' : 'Date'}
              </label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600"
                required
              />
            </div>
          </div>

          {/* Section Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                activeTab === 'all' 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language === 'bn' ? 'সব এন্ট্রি' : 'All Entries'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                activeTab === 'feed' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🥣 {language === 'bn' ? 'খাদ্য' : 'Feed'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mortality')}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                activeTab === 'mortality' 
                  ? 'bg-red-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⚠️ {language === 'bn' ? 'মৃত্যু' : 'Mortality'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('weight')}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                activeTab === 'weight' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⚖️ {language === 'bn' ? 'ওজন/ডিম' : 'Weight/Prod'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expense')}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                activeTab === 'expense' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              💰 {language === 'bn' ? 'খরচ' : 'Expense'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                activeTab === 'sales' 
                  ? 'bg-green-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              💵 {language === 'bn' ? 'বিক্রয়' : 'Sales'}
            </button>
          </div>

          {/* Section 1: Feed (খাদ্য) */}
          {(activeTab === 'all' || activeTab === 'feed') && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <Wheat size={14} className="text-amber-600" />
                  {language === 'bn' ? '১. আজকের খাদ্য হিসাব' : '1. Today\'s Feed Log'}
                </span>
                <span className="text-[10px] text-amber-700 font-medium">
                  {language === 'bn' ? 'বস্তা বা কেজি দিন' : 'Bags or Kg'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'খাদ্যের ধরন' : 'Feed Type'}
                  </label>
                  <select
                    value={feedType}
                    onChange={(e) => setFeedType(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                  >
                    {currentFarmType === 'poultry' ? (
                      <>
                        <option value="Starter / প্রাথমিক">Starter / প্রাথমিক</option>
                        <option value="Grower / গ্রোয়ার">Grower / গ্রোয়ার</option>
                        <option value="Finisher / ফিনিশার">Finisher / ফিনিশার</option>
                        <option value="Layer Feed / লেয়ার">Layer Feed / লেয়ার</option>
                        <option value="অন্যান্য খাদ্য">অন্যান্য খাদ্য</option>
                      </>
                    ) : currentFarmType === 'cattle' ? (
                      <>
                        <option value="দানা/ভুষি (Concentrate)">দানা/ভুষি (Concentrate)</option>
                        <option value="সবুজ কাঁচা ঘাস (Grass)">সবুজ কাঁচা ঘাস (Grass)</option>
                        <option value="খড় / সাইলেজ (Straw/Silage)">খড় / সাইলেজ (Straw/Silage)</option>
                        <option value="অন্যান্য খাবার">অন্যান্য খাবার</option>
                      </>
                    ) : (
                      <>
                        <option value="ভাসমান খাদ্য (Floating Pellets)">ভাসমান খাদ্য (Floating Pellets)</option>
                        <option value="ডুবন্ত খাবার (Sinking Feed)">ডুবন্ত খাবার (Sinking Feed)</option>
                        <option value="অন্যান্য খাবার">অন্যান্য খাবার</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'পরিমাণ (বস্তা)' : 'Quantity (Bags)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="যেমন: ১ বা ০.৫"
                    value={feedBags}
                    onChange={(e) => setFeedBags(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'অথবা কেজি (KG)' : 'Or Weight (KG)'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="যেমন: ২৫ বা ৫০"
                    value={feedKg}
                    onChange={(e) => setFeedKg(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Mortality (মৃত্যু) */}
          {(activeTab === 'all' || activeTab === 'mortality') && (
            <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-red-900 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-red-600" />
                  {language === 'bn' ? '২. আজকের মৃত্যু সংখ্যা' : '2. Today\'s Mortality'}
                </span>
                <span className="text-[10px] text-red-600 font-bold">
                  {mortalityCount ? `${mortalityCount} টি` : (language === 'bn' ? '০ হলে খালি রাখুন' : 'Leave empty if 0')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'মৃত সংখ্যা (পিস)' : 'Dead Count (Pcs)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="যেমন: ২ বা ০"
                    value={mortalityCount}
                    onChange={(e) => setMortalityCount(e.target.value)}
                    className="w-full bg-white border border-red-200 rounded-lg px-2.5 py-1 text-xs font-black text-red-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'সম্ভাব্য কারণ (ঐচ্ছিক)' : 'Reason (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: চাপ লেগে, ঠান্ডা/গরম, রোগ"
                    value={mortalityReason}
                    onChange={(e) => setMortalityReason(e.target.value)}
                    className="w-full bg-white border border-red-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Weight & Production (ওজন ও উৎপাদন) */}
          {(activeTab === 'all' || activeTab === 'weight') && (
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <Scale size={14} className="text-blue-600" />
                  {language === 'bn' ? '৩. গড় ওজন ও উৎপাদন' : '3. Average Weight & Production'}
                </span>
                <span className="text-[10px] text-blue-600 font-medium">
                  {language === 'bn' ? 'FCR হিসাবের জন্য' : 'For live FCR'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'গড় ওজন (গ্রাম)' : 'Avg Weight (gm)'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="যেমন: ১২০০ গ্রাম"
                    value={avgWeightGram}
                    onChange={(e) => setAvgWeightGram(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'ডিম সংগ্রহ (পিস)' : 'Egg Collection (pcs)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="লেয়ার হলে ডিম"
                    value={eggCount}
                    onChange={(e) => setEggCount(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'দুধ উৎপাদন (লিটার)' : 'Milk (Liters)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="গাভী হলে লিটার"
                    value={milkLiter}
                    onChange={(e) => setMilkLiter(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Medicine & Vaccine (ওষুধ ও প্রতিষেধক) */}
          {(activeTab === 'all' || activeTab === 'expense') && (
            <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                  <Pill size={14} className="text-purple-600" />
                  {language === 'bn' ? '৪. ওষুধ / ভ্যাকসিন প্রয়োগ' : '4. Medicine & Vaccine Log'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'ওষুধ বা ভ্যাকসিনের নাম' : 'Medicine / Vaccine Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ভিটামিন সি, রানিখেত ড্রপ, অ্যান্টিবায়োটিক"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'খরচ (টাকা - ঐচ্ছিক)' : 'Cost (৳ - Optional)'}
                  </label>
                  <input
                    type="number"
                    placeholder="যেমন: ২৫০"
                    value={medicineCost}
                    onChange={(e) => setMedicineCost(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1 text-xs font-bold text-purple-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Daily Expenses (অন্যান্য পরিচালনা খরচ) */}
          {(activeTab === 'all' || activeTab === 'expense') && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-emerald-600" />
                  {language === 'bn' ? '৫. অন্যান্য দৈনিক খরচ' : '5. Other Daily Expense'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'খরচের খাত' : 'Expense Category'}
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                  >
                    <option value="তুষ / লিটার (Litter)">তুষ / লিটার (Litter)</option>
                    <option value="বিদ্যুৎ / জ্বালানি (Electricity)">বিদ্যুৎ / জ্বালানি (Electricity)</option>
                    <option value="শ্রমিক / মজুরি (Labor)">শ্রমিক / মজুরি (Labor)</option>
                    <option value="পরিবহন (Transport)">পরিবহন (Transport)</option>
                    <option value="জীবাণুনাশক / স্প্রে">জীবাণুনাশক / স্প্রে</option>
                    <option value="অন্যান্য পরিচালনা ব্যয়">অন্যান্য পরিচালনা ব্যয়</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'খরচের পরিমাণ (৳)' : 'Amount (৳)'}
                  </label>
                  <input
                    type="number"
                    placeholder="যেমন: ৫০০"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Sales (আজকের বিক্রয়) */}
          {(activeTab === 'all' || activeTab === 'sales') && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-700" />
                  {language === 'bn' ? '৬. আজকের বিক্রয় (যদি থাকে)' : '6. Today\'s Sales (If any)'}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  {saleTotalAmount ? `৳ ${Number(saleTotalAmount).toLocaleString()}` : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'মোট বিক্রয়মূল্য (টাকা)' : 'Total Sale Price (৳)'}
                  </label>
                  <input
                    type="number"
                    placeholder="যেমন: ১৮,৫০০"
                    value={saleTotalAmount}
                    onChange={(e) => setSaleTotalAmount(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-black text-emerald-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    {language === 'bn' ? 'পরিমাণ বা ওজন' : 'Quantity / Weight'}
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ১০০ পিস বা ১৫০ কেজি"
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-2 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{language === 'bn' ? 'এক ক্লিকে সংরক্ষণ করুন' : 'Save Entries'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
