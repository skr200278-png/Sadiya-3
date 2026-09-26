import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, offlineSafeDocWrite, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Trash2, Sparkles, Scale, Calculator, LineChart as ChartIcon, Wheat, Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { demoStore } from '../utils/demoStore';
import { getRecordDueStatus } from '../utils/duesSync';
import { DuesStatusBadge } from '../components/DuesStatusBadge';
import SponsorCard from '../components/SponsorCard';
import { admobService } from '../services/admobService';

export default function Feed() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const [records, setRecords] = useState<any[]>([]);
  const [duesList, setDuesList] = useState<any[]>([]);
  const [allMortality, setAllMortality] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [batchId, setBatchId] = useState('');

  useEffect(() => {
    const batchParam = searchParams.get('batchId');
    if (batchParam) {
      setBatchId(batchParam);
    }
  }, [searchParams]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantityBags, setQuantityBags] = useState('');
  const [pricePerBag, setPricePerBag] = useState('');
  const [feedType, setFeedType] = useState('Starter / প্রাথমিক');
  const [details, setDetails] = useState('');
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [farmType, setFarmType] = useState('poultry');

  // Handle batch selection
  const handleBatchChange = (id: string) => {
    setBatchId(id);
    const candidateBatches = activeBatches.length > 0 ? activeBatches : allBatches;
    const batch = candidateBatches.find(b => b.id === id);
    if (batch) {
      const fType = batch.farmType || 'poultry';
      setFarmType(fType);
      localStorage.setItem(`selected_batch_id_${fType}`, id);
      localStorage.setItem('selected_farm_type', fType);
      if (fType === 'cattle') {
        setFeedType(t('feed.cattleOption'));
      } else if (fType === 'fish') {
        setFeedType(t('feed.fishFloat'));
      } else {
        setFeedType(t('feed.starter'));
      }
    } else {
      setFarmType('poultry');
      setFeedType(t('feed.starter'));
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [currentUser, isDemoUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (isDemoUser) {
      const loadDues = () => setDuesList(demoStore.getDues());
      loadDues();
      const unsub = demoStore.subscribe(loadDues);
      return () => unsub();
    }
    const q = query(collection(db, 'dues'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setDuesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn('Feed dues listener error:', err);
    });
    return () => unsubscribe();
  }, [currentUser, isDemoUser]);

  const fetchInitialData = async () => {
    if (!currentUser) return;
    try {
      let batches: any[] = [];
      let allUserBatches: any[] = [];

      if (isDemoUser) {
        allUserBatches = demoStore.getBatches();
        batches = allUserBatches.filter(b => b.status === 'active');
      } else {
        // Fetch all batches for user
        const allBatchesQuery = query(collection(db, 'batches'), where('userId', '==', currentUser.uid));
        const allBatchSnap = await fastGetDocs(allBatchesQuery);
        allUserBatches = allBatchSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        batches = allUserBatches.filter(b => b.status === 'active');
      }

      setAllBatches(allUserBatches);
      setActiveBatches(batches);

      const candidateBatches = batches.length > 0 ? batches : allUserBatches;
      const urlBatchId = searchParams.get('batchId');
      const prefType = localStorage.getItem('selected_farm_type') || 'poultry';
      const savedPrefId = localStorage.getItem(`selected_batch_id_${prefType}`) || localStorage.getItem('selected_batch_id_poultry');

      let matched: any = null;
      if (urlBatchId && candidateBatches.some(b => b.id === urlBatchId)) {
        matched = candidateBatches.find(b => b.id === urlBatchId);
      } else if (savedPrefId && candidateBatches.some(b => b.id === savedPrefId)) {
        matched = candidateBatches.find(b => b.id === savedPrefId);
      } else if (candidateBatches.length > 0) {
        matched = candidateBatches[0];
      }

      if (matched) {
        setBatchId(matched.id);
        const b = matched;
        setFarmType(b.farmType || 'poultry');
        if (b.farmType === 'cattle') setFeedType('দানা/ভুষি (Cattle/Goat)');
        else if (b.farmType === 'fish') setFeedType('ভাসমান খাবার (Fish)');
        else setFeedType('Starter / প্রাথমিক');
      } else {
        setBatchId('');
      }

      if (isDemoUser) {
        const fetchedRecords = demoStore.getFeedRecords().filter((r: any) => r.recordType !== 'actual_consumed');
        setRecords(fetchedRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setDuesList(demoStore.getDues());
        setAllMortality(demoStore.getMortalityRecords());
        setAllSales(demoStore.getSales());
        setLoading(false);
        return;
      }

      // Fetch feed purchase records (filter out actual_consumed so stock purchase accounting is isolated)
      const feedQuery = query(collection(db, 'feed_records'), where('userId', '==', currentUser.uid));
      const feedSnap = await fastGetDocs(feedQuery);
      const fetchedRecords = feedSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((r: any) => r.recordType !== 'actual_consumed');
      setRecords(fetchedRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      // Fetch initial dues
      const duesSnap = await fastGetDocs(query(collection(db, 'dues'), where('userId', '==', currentUser.uid)));
      setDuesList(duesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch mortality for opening live count derivations
      const mortSnap = await fastGetDocs(query(collection(db, 'mortality'), where('userId', '==', currentUser.uid)));
      setAllMortality(mortSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch sales for opening live count derivations
      const salesSnap = await fastGetDocs(query(collection(db, 'sales'), where('userId', '==', currentUser.uid)));
      setAllSales(salesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'feed_records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    const targetId = deleteId;
    setDeleteId(null);
    try {
      if (isDemoUser) {
        demoStore.deleteFeedRecord(targetId);
        toast.success(t('common.success'), { duration: 3000 });
        fetchInitialData();
        return;
      }

      // Cascade delete linked due in Dues Ledger
      try {
        const feedDocSnap = records.find(r => r.id === targetId);
        const linkedDueId = (feedDocSnap as any)?.dueRecordId;
        if (linkedDueId) {
          await offlineSafeDocWrite(deleteDoc(doc(db, 'dues', linkedDueId)));
        }
        const duesQuery = query(
          collection(db, 'dues'),
          where('userId', '==', currentUser.uid),
          where('sourceId', '==', targetId)
        );
        const duesSnap = await getDocs(duesQuery);
        duesSnap.docs.forEach(d => offlineSafeDocWrite(deleteDoc(d.ref)));
      } catch (e) {
        console.warn('Could not cascade delete linked feed due:', e);
      }

      await offlineSafeDocWrite(deleteDoc(doc(db, 'feed_records', targetId)));
      toast.success(t('common.success'), { duration: 3000 });
      fetchInitialData();
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.DELETE, 'feed_records');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !batchId) return toast.error(t('feed.batchSelectionReq'));
    if (isSubmitting || submitLock.current) return;

    const quantity = Number(quantityBags);
    const price = Number(pricePerBag);
    const totalAmountVal = quantity * price;
    const paidValRaw = amountPaid ? Number(amountPaid) : totalAmountVal;
    const paidVal = Math.min(paidValRaw, totalAmountVal);

    if (paidVal < totalAmountVal && !personName.trim()) {
      return toast.error(t('feed.dueNameReq'));
    }

    setIsSubmitting(true);
    submitLock.current = true;

    try {
      const normalizedPersonName = personName.trim().replace(/\s+/g, ' ');

      if (isDemoUser) {
        const feedRecordId = 'feed_' + Date.now();
        let createdDueId: string | undefined = undefined;

        if (paidVal < totalAmountVal) {
          const batchName = activeBatches.find(b => b.id === batchId)?.batchName || 'Unknown Batch';
          const dueRecord = {
            userId: currentUser.uid,
            batchId,
            batchName,
            personName: normalizedPersonName,
            phone: personPhone,
            type: 'payable' as const,
            amount: totalAmountVal,
            totalPaid: paidVal,
            details: `${batchName}${t('feed.feedFood').replace('{type}', feedType)}${details || ''}`,
            recordDate: date,
            status: 'pending' as const,
            sourceType: 'feed',
            sourceId: feedRecordId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const savedDue = demoStore.saveDue(dueRecord);
          createdDueId = savedDue?.id;
        }

        const newRecord = {
          id: feedRecordId,
          userId: currentUser.uid,
          batchId,
          date,
          feedType,
          quantityBags: quantity,
          cost: totalAmountVal,
          pricePerBag: price,
          amountPaid: paidVal,
          personName: normalizedPersonName,
          details,
          ...(createdDueId ? { dueRecordId: createdDueId } : {}),
          createdAt: new Date().toISOString()
        };
        demoStore.saveFeedRecord(newRecord);

        toast.success(t('feed.addSuccess'));
        setShowForm(false);
        setQuantityBags('');
        setPricePerBag('');
        setAmountPaid('');
        setDetails('');
        setPersonName('');
        setPersonPhone('');
        fetchInitialData();
        admobService.showInterstitialIfEligible('action:saved_feed', true);
        return;
      }

      // Live Firestore submission
      const feedDocRef = doc(collection(db, 'feed_records'));
      let createdDueId: string | undefined = undefined;

      if (paidVal < totalAmountVal) {
        const batchName = activeBatches.find(b => b.id === batchId)?.batchName || 'Unknown Batch';
        const dueDocRef = doc(collection(db, 'dues'));
        createdDueId = dueDocRef.id;
        const dueRecord = {
          userId: currentUser.uid,
          batchId,
          batchName,
          personName: normalizedPersonName,
          phone: personPhone,
          type: 'payable',
          amount: totalAmountVal,
          totalPaid: paidVal,
          details: `${batchName}${t('feed.feedFood').replace('{type}', feedType)}${details || ''}`,
          recordDate: date,
          status: 'pending',
          sourceType: 'feed',
          sourceId: feedDocRef.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await offlineSafeDocWrite(setDoc(dueDocRef, dueRecord));
      }

      const newRecord = {
        userId: currentUser.uid,
        batchId,
        date,
        feedType,
        quantityBags: quantity,
        cost: totalAmountVal,
        pricePerBag: price,
        amountPaid: paidVal,
        personName: normalizedPersonName,
        details,
        ...(createdDueId ? { dueRecordId: createdDueId } : {}),
        createdAt: new Date().toISOString()
      };

      await offlineSafeDocWrite(setDoc(feedDocRef, newRecord));

      toast.success(t('feed.addSuccess'));
      setShowForm(false);
      setQuantityBags('');
      setPricePerBag('');
      setAmountPaid('');
      setDetails('');
      setPersonName('');
      setPersonPhone('');
      fetchInitialData();
      admobService.showInterstitialIfEligible('action:saved_feed', true);
    } catch (error) {
      toast.error(t('feed.addError'));
      handleFirestoreError(error, OperationType.CREATE, 'feed_records');
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  if (loading) return <div>{t('common.loading')}</div>;

  const currentTotalAmount = Number(quantityBags) * Number(pricePerBag) || 0;
  const currentPaidRaw = amountPaid !== '' ? Number(amountPaid) : currentTotalAmount;
  const currentDue = Math.max(0, currentTotalAmount - currentPaidRaw);
  const currentReturnAmount = amountPaid !== '' ? Math.max(0, currentPaidRaw - currentTotalAmount) : 0;

  const handleSelectSponsorProduct = (productName: string, companyName: string) => {
    setShowForm(true);
    setDetails((prev) => (prev ? `${prev}, ${productName}` : productName));
    if (!personName) {
      setPersonName(companyName.split(' ')[0] + ' Dealer');
    }
    toast.success(
      language === 'bn' 
        ? `স্পনসর খাদ্য (${productName}) ফর্মের তথ্যে যুক্ত করা হয়েছে!` 
        : `Added sponsor product (${productName}) into details!`
    );
  };

  const totalPurchasedBags = records.reduce((sum, r) => sum + Number(r.quantityBags || 0), 0);
  const totalFeedCost = records.reduce((sum, r) => sum + Number(r.cost || 0), 0);

  return (
    <div className="space-y-4 pb-8">
      {/* Sponsor Feed Partner Spotlight */}
      <SponsorCard 
        type="feed" 
        onSelectProduct={handleSelectSponsorProduct} 
      />

      {/* Main Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="text-orange-500" /> {t('feed.title')}
        </h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1 font-bold text-xs shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>{language === 'bn' ? 'হিসাব যোগ করুন' : 'Add Record'}</span>
        </button>
      </div>

      {showForm && (
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow border border-orange-100 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('feed.selectBatch')}</label>
                <select required value={batchId} onChange={(e) => handleBatchChange(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 bg-white">
                  <option value="">{t('feed.selectOption')}</option>
                  {activeBatches.map(b => <option key={b.id} value={b.id}>{b.batchName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('feed.date')}</label>
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('feed.feedType')}</label>
                <select required value={feedType} onChange={(e) => setFeedType(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 bg-white">
                  {farmType === 'poultry' && (
                    <>
                      <option value={t('feed.starter')}>{t('feed.starter')}</option>
                      <option value={t('feed.grower')}>{t('feed.grower')}</option>
                      <option value={t('feed.finisher')}>{t('feed.finisher')}</option>
                    </>
                  )}
                  {farmType === 'cattle' && (
                    <>
                      <option value={t('feed.cattleOption')}>{t('feed.cattleOption')}</option>
                      <option value={t('feed.grass')}>{t('feed.grass')}</option>
                      <option value={t('feed.hay')}>{t('feed.hay')}</option>
                      <option value={t('feed.silage')}>{t('feed.silage')}</option>
                    </>
                  )}
                  {farmType === 'fish' && (
                    <>
                      <option value={t('feed.fishFloat')}>{t('feed.fishFloat')}</option>
                      <option value={t('feed.fishSink')}>{t('feed.fishSink')}</option>
                      <option value={t('feed.khoil')}>{t('feed.khoil')}</option>
                    </>
                  )}
                  <option value={t('feed.other')}>{t('feed.other')}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('feed.quantityBags')}</label>
                  <input required type="number" step="0.01" value={quantityBags} onChange={(e) => setQuantityBags(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('feed.pricePerUnit')}</label>
                  <input required type="number" value={pricePerBag} onChange={(e) => setPricePerBag(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500" placeholder="0" />
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg flex justify-between items-center mt-2 border border-orange-100">
                <span className="text-gray-700 font-medium">{t('feed.totalPrice')}</span>
                <span className="font-bold text-orange-600 text-lg">৳ {currentTotalAmount}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('feed.shopName')}</label>
                  <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500" placeholder={t('feed.shopPlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('feed.mobileNum')}</label>
                  <input type="tel" value={personPhone} onChange={(e) => setPersonPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500" placeholder="01xxxxxxxxx" />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('feed.paidAmt')}</label>
                 <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500" placeholder={`${t('feed.defaultAmt')}৳ ${currentTotalAmount}`} />
              </div>
              {currentDue > 0 && <p className="text-red-500 text-sm font-semibold">{t('feed.dueMsg')}{currentDue}{t('feed.dueMsgAuto')}</p>}
              {currentReturnAmount > 0 && <p className="text-green-600 text-sm font-semibold">{t('feed.returnMsg')}{currentReturnAmount}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.details')}</label>
                <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500" />
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl mt-2 disabled:bg-gray-400">
                {isSubmitting ? t('common.saving') : t('common.save')}
              </button>
            </form>
          )}

          {/* Feed Stock & Godown Inventory Summary Card */}
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white rounded-2xl p-3.5 border border-amber-200/90 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Wheat size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-850 leading-none">
                    {language === 'bn' ? 'গোডাউন ফিড স্টক ও ইনভেন্টরি' : 'Feed Stock & Godown Inventory'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {language === 'bn' ? 'খাদ্য ক্রয়, ব্যবহার ও অবশিষ্ট মজুত' : 'Purchased, cost & recorded bags'}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                {language === 'bn' ? 'স্টক সারাংশ' : 'Stock Summary'}
              </span>
            </div>

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded-xl border border-amber-200/70 text-center">
                <span className="text-[9px] font-bold text-slate-500 block truncate">
                  {language === 'bn' ? 'মোট কেনা খাদ্য' : 'Total Purchased'}
                </span>
                <p className="text-xs sm:text-sm font-black text-slate-850 mt-0.5">
                  {totalPurchasedBags.toFixed(1)} <span className="text-[9px] font-bold text-slate-400">বস্তা</span>
                </p>
              </div>

              <div className="bg-white p-2 rounded-xl border border-amber-200/70 text-center">
                <span className="text-[9px] font-bold text-slate-500 block truncate">
                  {language === 'bn' ? 'মোট খরচ' : 'Total Cost'}
                </span>
                <p className="text-xs sm:text-sm font-black text-orange-600 mt-0.5">
                  ৳ {totalFeedCost.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-2 rounded-xl border border-amber-200/70 text-center">
                <span className="text-[9px] font-bold text-slate-500 block truncate">
                  {language === 'bn' ? 'মোট ওজন' : 'Total KG'}
                </span>
                <p className="text-xs sm:text-sm font-black text-amber-800 mt-0.5">
                  {(totalPurchasedBags * 50).toLocaleString()} <span className="text-[9px] font-bold text-slate-400">কেজি</span>
                </p>
              </div>
            </div>

            {totalPurchasedBags > 0 && (
              <div className="bg-amber-50/90 rounded-xl p-2 border border-amber-200/80 flex items-center justify-between text-[10px] text-amber-950 font-medium">
                <span className="flex items-center gap-1">
                  💡 {language === 'bn' ? 'প্রতি বস্তা গড় দর:' : 'Avg Cost / Bag:'}{' '}
                  <strong>৳ {Math.round(totalFeedCost / totalPurchasedBags).toLocaleString()}</strong>
                </span>
                <span className="text-[9px] font-bold text-amber-800">
                  {records.length} {language === 'bn' ? 'টি এন্ট্রি' : 'entries'}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {records.map(record => {
              const batchName = activeBatches.find(b => b.id === record.batchId)?.batchName || 'Unknown Batch';
              const dueStatus = getRecordDueStatus(record, duesList, 'feed');
              return (
                <div key={record.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()} - {batchName}</p>
                    <h3 className="font-bold text-gray-800">{record.feedType}</h3>
                    <p className="text-sm text-gray-600">{record.quantityBags}{t('feed.amountLabel')}{record.pricePerBag ? `(৳ ${record.pricePerBag}${t('feed.perUnitLabel')})` : ''}</p>
                    {record.personName && <p className="text-xs font-semibold text-gray-600 mt-0.5">{t('feed.shopLabel')}{record.personName}</p>}
                    {record.details && <p className="text-sm text-gray-600 mt-1">{record.details}</p>}
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-bold text-orange-600 text-lg">৳ {record.cost}</span>
                    <DuesStatusBadge
                      dueStatus={dueStatus}
                      language={language as any}
                      defaultPaidLabel={t('feed.paidLabel')}
                      defaultDueLabel={`${t('feed.dueLabel')}${dueStatus.remainingDue}`}
                    />
                    <button onClick={() => handleDelete(record.id)} className="text-red-500 hover:bg-red-50 p-1 rounded-md mt-1 inline-block">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {records.length === 0 && !showForm && (
              <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed border-gray-300">
                {t('feed.noRecords')}
              </div>
            )}
          </div>
    
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
