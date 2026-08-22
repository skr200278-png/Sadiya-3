import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, offlineSafeDocWrite, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ShieldPlus, Plus, Trash2, Sparkles, Syringe, ClipboardList, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { demoStore } from '../utils/demoStore';
import SponsorCard from '../components/SponsorCard';
import VaccineScheduleCard, { VaccineItem } from '../components/VaccineScheduleCard';

export default function Medicine() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const [records, setRecords] = useState<any[]>([]);
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

  const fetchInitialData = async () => {
    if (!currentUser) return;
    try {
      if (isDemoUser) {
        const batches = demoStore.getBatches().filter(b => b.status === 'active');
        setActiveBatches(batches);
        if (batches.length > 0 && !batchId) setBatchId(batches[0].id);
        const fetchedRecords = demoStore.getMedicineRecords();
        setRecords(fetchedRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
        createdAt: new Date().toISOString()
      };

      if (isDemoUser) {
        demoStore.saveMedicineRecord(newRecord);
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          demoStore.saveDue(dueRecord);
        }
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

      await offlineSafeDocWrite(addDoc(collection(db, 'medicine_records'), newRecord));

      if (paidVal < totalAmountVal) {
        const batchName = activeBatches.find(b => b.id === batchId)?.batchName || 'Unknown Batch';
        const typeName = type === 'vaccine' ? t('medicine.vaccine') : t('medicine.medicine');
        const formattedDetails = details ? '('+details+')' : '';
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await offlineSafeDocWrite(addDoc(collection(db, 'dues'), dueRecord));
      }

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
    setType('vaccine');
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
              const rPaid = record.amountPaid !== undefined ? record.amountPaid : record.cost;
              const rDue = record.cost - rPaid;
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
                    {rDue > 0 && <span className="text-xs font-semibold text-red-500 outline outline-1 outline-red-200 px-1 rounded mt-1">{t('feed.dueLabel')}{rDue}</span>}
                    {rDue === 0 && <span className="text-xs font-semibold text-green-600 outline outline-1 outline-green-200 px-1 rounded mt-1">{t('feed.paidLabel')}</span>}
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
