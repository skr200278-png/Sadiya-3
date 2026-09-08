import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, offlineSafeDocWrite, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ShieldPlus, Plus, Trash2, Sparkles, Syringe, ClipboardList, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { demoStore } from '../utils/demoStore';
import { getRecordDueStatus } from '../utils/duesSync';
import { DuesStatusBadge } from '../components/DuesStatusBadge';
import SponsorCard from '../components/SponsorCard';
import VaccineScheduleCard, { VaccineItem } from '../components/VaccineScheduleCard';

export default function Medicine() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const [records, setRecords] = useState<any[]>([]);
  const [duesList, setDuesList] = useState<any[]>([]);
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  
  const [activeTab, setActiveTab] = useState<'records' | 'schedule'>('records');
  const [showForm, setShowForm] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [medicineName, setMedicineName] = useState('');
  const [type, setType] = useState('medicine');
  const [cost, setCost] = useState('');
  const [details, setDetails] = useState('');
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

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
      console.warn('Medicine dues listener error:', err);
    });
    return () => unsubscribe();
  }, [currentUser, isDemoUser]);

  const fetchInitialData = async () => {
    if (!currentUser) return;
    try {
      if (isDemoUser) {
        const batches = demoStore.getBatches().filter(b => b.status === 'active');
        setActiveBatches(batches);
        if (batches.length > 0 && !batchId) setBatchId(batches[0].id);
        const fetchedRecords = demoStore.getMedicineRecords();
        setRecords(fetchedRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setDuesList(demoStore.getDues());
        setLoading(false);
        return;
      }

      const batchesQuery = query(collection(db, 'batches'), where('userId', '==', currentUser.uid), where('status', '==', 'active'));
      const batchSnap = await fastGetDocs(batchesQuery);
      const batches = batchSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveBatches(batches);
      if(batches.length > 0) setBatchId(batches[0].id);

      const medQuery = query(collection(db, 'medicine_records'), where('userId', '==', currentUser.uid));
      const medSnap = await fastGetDocs(medQuery);
      const fetchedRecords = medSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(fetchedRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      // Fetch initial dues
      const duesSnap = await fastGetDocs(query(collection(db, 'dues'), where('userId', '==', currentUser.uid)));
      setDuesList(duesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'medicine_records');
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
        demoStore.deleteMedicineRecord(targetId);
        toast.success(t('common.success'), { duration: 3000 });
        fetchInitialData();
        return;
      }

      await offlineSafeDocWrite(deleteDoc(doc(db, 'medicine_records', targetId)));
      toast.success(t('common.success'), { duration: 3000 });
      fetchInitialData();
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.DELETE, 'medicine_records');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !batchId) return toast.error(t('feed.batchSelectionReq'));
    if (isSubmitting || submitLock.current) return;

    const totalAmountVal = Number(cost);
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
        const medRecordId = 'med_' + Date.now();
        let createdDueId: string | undefined = undefined;

        if (paidVal < totalAmountVal) {
          const batchName = activeBatches.find(b => b.id === batchId)?.batchName || 'Unknown Batch';
          const typeName = type === 'vaccine' ? t('medicine.vaccine') : t('medicine.medicine');
          const formattedDetails = details ? '('+details+')' : '';
          const dueRecord = {
            userId: currentUser.uid,
            personName: normalizedPersonName,
            phone: personPhone,
            type: 'payable' as const,
            amount: totalAmountVal,
            totalPaid: paidVal,
            details: `${batchName}${t('medicine.recordVal').replace('{type}', typeName).replace('{name}', medicineName).replace('{details}', formattedDetails)}`,
            recordDate: date,
            status: 'pending' as const,
            sourceType: 'medicine',
            sourceId: medRecordId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const savedDue = demoStore.saveDue(dueRecord);
          createdDueId = savedDue?.id;
        }

        const newRecord = {
          id: medRecordId,
          userId: currentUser.uid,
          batchId,
          date,
          medicineName,
          type,
          cost: totalAmountVal,
          amountPaid: paidVal,
          personName: normalizedPersonName,
          details,
          dueRecordId: createdDueId,
          createdAt: new Date().toISOString()
        };
        demoStore.saveMedicineRecord(newRecord);

        toast.success(t('medicine.addSuccess'));
        setShowForm(false);
        setMedicineName('');
        setCost('');
        setAmountPaid('');
        setDetails('');
        setPersonName('');
        setPersonPhone('');
        fetchInitialData();
        return;
      }

      // Live Firestore submission
      const medDocRef = doc(collection(db, 'medicine_records'));
      let createdDueId: string | undefined = undefined;

      if (paidVal < totalAmountVal) {
        const batchName = activeBatches.find(b => b.id === batchId)?.batchName || 'Unknown Batch';
        const typeName = type === 'vaccine' ? t('medicine.vaccine') : t('medicine.medicine');
        const formattedDetails = details ? '('+details+')' : '';
        const dueDocRef = doc(collection(db, 'dues'));
        createdDueId = dueDocRef.id;
        const dueRecord = {
          userId: currentUser.uid,
          personName: normalizedPersonName,
          phone: personPhone,
          type: 'payable',
          amount: totalAmountVal,
          totalPaid: paidVal,
          details: `${batchName}${t('medicine.recordVal').replace('{type}', typeName).replace('{name}', medicineName).replace('{details}', formattedDetails)}`,
          recordDate: date,
          status: 'pending',
          sourceType: 'medicine',
          sourceId: medDocRef.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await offlineSafeDocWrite(setDoc(dueDocRef, dueRecord));
      }

      const newRecord = {
        userId: currentUser.uid,
        batchId,
        date,
        medicineName,
        type,
        cost: totalAmountVal,
        amountPaid: paidVal,
        personName: normalizedPersonName,
        details,
        dueRecordId: createdDueId,
        createdAt: new Date().toISOString()
      };

      await offlineSafeDocWrite(setDoc(medDocRef, newRecord));

      toast.success(t('medicine.addSuccess'));
      setShowForm(false);
      setMedicineName('');
      setCost('');
      setAmountPaid('');
      setDetails('');
      setPersonName('');
      setPersonPhone('');
      fetchInitialData();
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.CREATE, 'medicine_records');
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  if (loading) return <div>{t('common.loading')}</div>;

  const currentTotalAmount = Number(cost) || 0;
  const currentPaidRaw = amountPaid !== '' ? Number(amountPaid) : currentTotalAmount;
  const currentDue = Math.max(0, currentTotalAmount - currentPaidRaw);
  const currentReturnAmount = amountPaid !== '' ? Math.max(0, currentPaidRaw - currentTotalAmount) : 0;

  const handleSelectSponsorProduct = (productName: string, companyName: string) => {
    setShowForm(true);
    setMedicineName(productName);
    if (productName.toLowerCase().includes('vaccine') || productName.includes('ভ্যাকসিন')) {
      setType('vaccine');
    } else {
      setType('medicine');
    }
    if (!personName) {
      setPersonName(companyName.split(' ')[0] + ' Veterinary');
    }
    toast.success(
      language === 'bn' 
        ? `স্পনসর ওষুধ (${productName}) যুক্ত হয়েছে!` 
        : `Added sponsor medicine (${productName})!`
    );
  };

  const handleQuickApplyVaccine = (vaccineItem: VaccineItem) => {
    setShowForm(true);
    setType(vaccineItem.category === 'vaccine' ? 'vaccine' : 'medicine');
    setMedicineName(vaccineItem.name);
    setDetails(`${vaccineItem.route} - ${vaccineItem.purpose}`);
    setActiveTab('records');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(
      language === 'bn' 
        ? `${vaccineItem.name} ফর্ম প্রস্তুত! খরচ ও তারিখ কনফার্ম করুন।` 
        : `Ready to log ${vaccineItem.name}. Confirm cost and date.`
    );
  };

  const getQuickMedicineSuggestions = (batch: any) => {
    const farmType = batch?.farmType || 'poultry';
    const name = (batch?.batchName || '').toLowerCase();
    const subBreed = (batch?.subBreed || '').toLowerCase();

    if (farmType === 'fish' || name.includes('মাছ')) {
      return [
        { name: 'কৃষি চুন ও জিওলাইট', label: 'চুন ও জিওলাইট (গ্যাস দূর)', type: 'medicine', note: 'পানির গ্যাস ও পিএইচ নিয়ন্ত্রণ' },
        { name: 'পটাশ (KMNO4)', label: 'পটাশ (ক্ষতরোগ/লালদাগ)', type: 'medicine', note: 'জীবাণুনাশক ও পরজীবী দমন' },
        { name: 'ভিটামিন সি ও প্রোবায়োটিক', label: 'ভিটামিন সি + প্রোবায়োটিক', type: 'medicine', note: 'রোগ প্রতিরোধ ও বৃদ্ধি' },
        { name: 'জরুরি অক্সিজেন পাউডার', label: 'অক্সিজেন পাউডার', type: 'medicine', note: 'জরুরি ভেসে ওঠা রোধ' }
      ];
    }

    if (farmType === 'cattle' || name.includes('গরু') || name.includes('গাভী') || name.includes('ষাঁড়') || name.includes('ছাগল')) {
      return [
        { name: 'এলবেনডাজল / ট্রাইক্লাবেনডাজল (কৃমিনাশক)', label: 'কৃমিনাশক বোলাস', type: 'medicine', note: 'পেট ও কলিজার কৃমি' },
        { name: 'ব্লটোরিল / কার্মিনেটিভ মিক্সচার', label: 'ব্লটোরিল (পেট ফাঁপা/গ্যাস)', type: 'medicine', note: 'পেট ফাঁপা ও বদহজম' },
        { name: 'ক্যালপ্লেক্স গোল্ড / ওরাল ক্যালসিয়াম', label: 'ক্যালপ্লেক্স গোল্ড (দুধ বৃদ্ধি)', type: 'medicine', note: 'দুধ ও ক্যালসিয়াম ঘাটতি' },
        { name: 'হেপাটোটেক (লিভার টনিক)', label: 'হেপাটোটেক (লিভার টনিক)', type: 'medicine', note: 'কৃমিনাশকের পর রুচি বৃদ্ধি' },
        { name: 'আইভারমেকটিন ইনজেকশন', label: 'আইভারমেকটিন (উকুন/আটালি)', type: 'medicine', note: 'বহিঃপরজীবী ও মাইট দমন' },
        { name: 'ক্ষুরারোগ ভ্যাকসিন (FMD)', label: 'ক্ষুরারোগ টিকা (FMD)', type: 'vaccine', note: 'ক্ষুরারোগ প্রতিরোধ' }
      ];
    }

    if (name.includes('হাঁস') || subBreed.includes('duck')) {
      return [
        { name: 'ডাক প্লেগ ভ্যাকসিন', label: 'ডাক প্লেগ ভ্যাকসিন', type: 'vaccine', note: 'চামড়ার নিচে ১ মিলি' },
        { name: 'ডাক কলেরা ভ্যাকসিন', label: 'ডাক কলেরা ভ্যাকসিন', type: 'vaccine', note: 'মাংসে ইনজেকশন' },
        { name: 'হাঁসের কৃমিনাশক ওষুধ', label: 'হাঁসের কৃমিনাশক', type: 'medicine', note: 'পানিতে খালি পেটে' },
        { name: 'ভিটামিন এডি৩ই ও ক্যালসিয়াম', label: 'ভিটামিন এডি৩ই + ক্যালসিয়াম', type: 'medicine', note: 'ডিম ও হাড় শক্ত' }
      ];
    }

    // Broiler / General Poultry
    return [
      { name: 'রেনামক্স / কসমিক্স (অ্যান্টিবায়োটিক)', label: 'রেনামক্স (নাভি শুকানো/ব্রুডিং)', type: 'medicine', note: '১ গ্রাম প্রতি লিটার পানিতে' },
      { name: 'ক্যালপ্লেক্স / ক্যালসি-ডি', label: 'ক্যালপ্লেক্স (ক্যালসিয়াম/হাড় শক্ত)', type: 'medicine', note: 'পায়ের দুর্বলতা ও বৃদ্ধি' },
      { name: 'হেপাটোটেক (লিভার টনিক)', label: 'হেপাটোটেক (লিভার টনিক)', type: 'medicine', note: 'হজম শক্তি ও লিভার সুরক্ষা' },
      { name: 'কক্সিকিউর / টলট্রাজুরিল', label: 'কক্সিকিউর (রক্ত আমাশয়)', type: 'medicine', note: 'কক্সিডিওসিস ও রক্ত পায়খানা' },
      { name: 'টাইলোসিন / ডক্সিটিন', label: 'টাইলোসিন (ঠান্ডা/ঘড়ঘড়/সিআরডি)', type: 'medicine', note: 'শ্বাসকষ্ট ও সর্দি নিরাময়' },
      { name: 'ভিটামিন বি-কমপ্লেক্স', label: 'বি-কমপ্লেক্স + প্রোবায়োটিক', type: 'medicine', note: 'এফসিআর ও হজম উন্নয়ন' },
      { name: 'রানীক্ষেত ক্লোন ৩০ (ND Clone 30)', label: 'রানীক্ষেত ক্লোন ৩০ (পানি/চোখে)', type: 'vaccine', note: 'চোখে ড্রপ বা খাবার পানিতে' },
      { name: 'গামবোরো ভ্যাকসিন (IBD Live)', label: 'গামবোরো ভ্যাকসিন (পানিতে)', type: 'vaccine', note: 'খাবার ঠান্ডা পানিতে' }
    ];
  };

  const selectedBatchObj = activeBatches.find(b => b.id === batchId) || (activeBatches.length > 0 ? activeBatches[0] : null);

  return (
    <div className="space-y-4 pb-8">
      {/* Sponsor Veterinary Medicine Partner Spotlight */}
      <SponsorCard 
        type="medicine" 
        onSelectProduct={handleSelectSponsorProduct} 
      />

      {/* Main Header & View Tabs */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldPlus className="text-blue-500" /> {t('medicine.title')}
          </h2>
          <button 
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) setActiveTab('records');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1 font-bold text-xs shadow-sm active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span>{language === 'bn' ? 'ওষুধ হিসাব যোগ' : 'Add Medicine'}</span>
          </button>
        </div>

        {/* Tab switch buttons */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'records'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <ClipboardList size={15} />
            <span>{language === 'bn' ? 'ওষুধ ও ভ্যাকসিন রেজিস্টার' : 'Medicine Logs'} ({records.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-white text-teal-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Syringe size={15} />
            <span>{language === 'bn' ? '💉 ভ্যাকসিন ক্যালেন্ডার' : 'Vaccine Schedule'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'schedule' ? (
        <div className="space-y-3">
          {activeBatches.length > 1 && (
            <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 shrink-0">
                {language === 'bn' ? 'ব্যাচ নির্বাচন করুন:' : 'Select Batch:'}
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
              >
                {activeBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchName} ({b.farmType === 'cattle' ? 'গবাদিপশু' : b.farmType === 'fish' ? 'মৎস্য' : 'পোল্ট্রি'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <VaccineScheduleCard
            selectedBatch={selectedBatchObj}
            existingRecords={records}
            onQuickApply={handleQuickApplyVaccine}
          />
        </div>
      ) : (
        <>
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow border border-blue-100 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.batchLabel')}</label>
                <select required value={batchId} onChange={(e) => setBatchId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
                  <option value="">{t('feed.selectOption')}</option>
                  {activeBatches.map(b => <option key={b.id} value={b.id}>{b.batchName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.dateLabel')}</label>
                  <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.typeLabel')}</label>
                  <select required value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500">
                    <option value="medicine">{t('medicine.optMedicine')}</option>
                    <option value="vaccine">{t('medicine.optVaccine')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.nameDescLabel')}</label>
                <input required type="text" value={medicineName} onChange={(e) => setMedicineName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" placeholder={t('medicine.nameDescPlaceholder')} />
                
                {/* Popular medicine quick selection chips */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>{language === 'bn' ? '⚡ দ্রুত নাম বসান (জনপ্রিয় ও সেরা ওষুধ):' : '⚡ Quick Name Suggestion:'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-28 overflow-y-auto no-scrollbar">
                    {getQuickMedicineSuggestions(selectedBatchObj).map((med, mIdx) => (
                      <button
                        key={mIdx}
                        type="button"
                        onClick={() => {
                          setMedicineName(med.name);
                          setType(med.type);
                          if (!details && med.note) setDetails(med.note);
                        }}
                        className="text-[10px] sm:text-[11px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95 text-left"
                      >
                        {med.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.shopLabel')}</label>
                  <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" placeholder={t('medicine.shopPlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.mobileLabel')}</label>
                  <input type="tel" value={personPhone} onChange={(e) => setPersonPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" placeholder={t('medicine.mobilePlaceholder')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.totalPrice')}</label>
                  <input required type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" placeholder={t('medicine.totalPricePlaceholder')} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.paidAmt')}</label>
                   <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" placeholder={`${t('feed.defaultAmt')}৳ ${currentTotalAmount}`} />
                </div>
              </div>
              {currentDue > 0 && <p className="text-red-500 text-sm font-semibold">{t('feed.dueMsg')}{currentDue}{t('feed.dueMsgAuto')}</p>}
              {currentReturnAmount > 0 && <p className="text-green-600 text-sm font-semibold">{t('feed.returnMsg')}{currentReturnAmount}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.detailsNote')}</label>
                <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" placeholder={t('medicine.detailsPlaceholder')} />
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl mt-2 disabled:bg-gray-400">
                {isSubmitting ? t('common.saving') : t('common.save')}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {records.map(record => {
              const batchName = activeBatches.find(b => b.id === record.batchId)?.batchName || 'Unknown Batch';
              const dueStatus = getRecordDueStatus(record, duesList, 'medicine');
              return (
                <div key={record.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold mb-1 inline-block ${record.type === 'vaccine' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                      {record.type === 'vaccine' ? t('medicine.vaccine') : t('medicine.medicine')}
                    </span>
                    <h3 className="font-bold text-gray-800">{record.medicineName}</h3>
                    <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()} - {batchName}</p>
                    {record.personName && <p className="text-xs font-semibold text-gray-600 mt-0.5">{t('medicine.shopTxt')}{record.personName}</p>}
                    {record.details && <p className="text-sm text-gray-600 mt-1">{record.details}</p>}
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-bold text-blue-600 text-lg">৳ {record.cost}</span>
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
          </div>
        </>
      )}
    
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
