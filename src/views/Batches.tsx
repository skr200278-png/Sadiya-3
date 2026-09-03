import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, offlineSafeDocWrite, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Package, Plus, Trash2, CheckCircle2, ArrowRight, LayoutDashboard, Calendar, Users, DollarSign, LineChart as ChartIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import PoultryFeedPlan from '../components/PoultryFeedPlan';
import { demoStore } from '../utils/demoStore';
import { useNavigate } from 'react-router-dom';

const BatchSummary = ({ batchId, totalChicks, costPerChick }: { batchId: string, totalChicks: number, costPerChick: number }) => {
  const { currentUser, isDemoUser } = useAuth();
  const { t } = useLanguage();
  const [totalSales, setTotalSales] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchSummary = async () => {
      try {
        let tCost = 0;
        let tSales = 0;

        if (isDemoUser) {
          demoStore.getSales(batchId).forEach(s => tSales += Number(s.totalAmount || 0));
          demoStore.getExpenses(batchId).forEach(e => tCost += Number(e.amount || 0));
          demoStore.getFeedRecords(batchId).forEach(f => tCost += Number(f.cost || 0));
          demoStore.getMedicineRecords(batchId).forEach(m => tCost += Number(m.cost || 0));
          tCost += (Number(totalChicks || 0) * Number(costPerChick || 0));
          setTotalSales(tSales);
          setTotalCost(tCost);
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
        expSnap.forEach(doc => tCost += Number(doc.data().amount || 0));

        // Fetch Feed Cost
        const feedQ = query(collection(db, 'feed_records'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const feedSnap = await fastGetDocs(feedQ);
        feedSnap.forEach(doc => tCost += Number(doc.data().cost || 0));

        // Fetch Medicine Cost
        const medQ = query(collection(db, 'medicine_records'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
        const medSnap = await fastGetDocs(medQ);
        medSnap.forEach(doc => tCost += Number(doc.data().cost || 0));

        // Add original chicks cost
        tCost += (Number(totalChicks || 0) * Number(costPerChick || 0));

        setTotalSales(tSales);
        setTotalCost(tCost);
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

  return (
    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
      <div className="flex justify-between mb-1">
        <span className="text-gray-600 font-medium">{t('batches.totalSales')}</span>
        <span className="font-bold text-emerald-600">৳ {totalSales.toLocaleString()}</span>
      </div>
      <div className="flex justify-between mb-1">
        <span className="text-gray-600 font-medium">{t('batches.totalCost')}</span>
        <span className="font-bold text-rose-600">৳ {totalCost.toLocaleString()}</span>
      </div>
      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-base">
        <span>{t('batches.net')}{profit >= 0 ? t('batches.profit') : t('batches.loss')}</span>
        <span className={profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>৳ {Math.abs(profit).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default function Batches() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [completeBatchId, setCompleteBatchId] = useState<string | null>(null);
  
  // Category filter state ('all' | 'poultry' | 'cattle' | 'fish' | 'completed')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'poultry' | 'cattle' | 'fish' | 'completed'>('all');

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
    if(!completeBatchId) return;
    try {
      if (isDemoUser) {
        demoStore.saveBatch({ id: completeBatchId, status: 'completed' } as any);
        toast.success(t('batches.completeSuccess'));
        setCompleteBatchId(null);
        return;
      }

      const batchRef = doc(db, 'batches', completeBatchId);
      await offlineSafeDocWrite(updateDoc(batchRef, { 
        status: 'completed',
        updatedAt: new Date().toISOString()
      }));
      toast.success(t('batches.completeSuccess'));
      setCompleteBatchId(null);
      fetchBatches();
    } catch (error) {
      toast.error(t('batches.updateError'));
      handleFirestoreError(error, OperationType.UPDATE, `batches/${completeBatchId}`);
      setCompleteBatchId(null);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const calculateAge = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    const targetId = deleteId;
    setDeleteId(null);
    try {
      if (isDemoUser) {
        demoStore.deleteBatch(targetId);
        toast.success(t('batches.delSuccess'), { duration: 3000 });
        return;
      }

      await offlineSafeDocWrite(deleteDoc(doc(db, 'batches', targetId)));
      toast.success(t('batches.delSuccess'), { duration: 3000 });
      fetchBatches();
    } catch (error) {
      toast.error(t('batches.delError'));
      handleFirestoreError(error, OperationType.DELETE, 'batches');
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

      {/* Batches List */}
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
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {batch.status === 'active' ? (language === 'bn' ? 'সক্রিয়' : t('batches.active')) : (language === 'bn' ? 'সমাপ্ত' : t('batches.completed'))}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm sm:text-base text-slate-850 leading-tight">
                    {batch.batchName}
                  </h3>
                  
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{language === 'bn' ? 'শুরু:' : t('batches.started')} {new Date(batch.startDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {batch.status === 'active' && (
                      <span className="text-emerald-700 font-black">
                        • {language === 'bn' ? 'বয়স:' : t('dashboard.age')} {calculateAge(batch.startDate)} {language === 'bn' ? 'দিন' : t('dashboard.days')}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(batch.id)}
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
                  />
                </div>
              )}

              {/* Action Buttons: View on Dashboard & Mark Complete */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                {batch.status === 'active' ? (
                  <>
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
                      onClick={() => setCompleteBatchId(batch.id)} 
                      className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    >
                      {language === 'bn' ? 'ব্যাচ সমাপ্ত করুন' : t('batches.markComplete')}
                    </button>
                  </>
                ) : (
                  <BatchSummary batchId={batch.id} totalChicks={batch.totalChicks} costPerChick={batch.costPerChick} />
                )}
              </div>
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

      <ConfirmModal 
        isOpen={!!completeBatchId}
        title={t('batches.confirmCompleteTitle')}
        message={t('batches.confirmCompleteMsg')}
        onConfirm={markCompleted}
        onCancel={() => setCompleteBatchId(null)}
      />
    
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
