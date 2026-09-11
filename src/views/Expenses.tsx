import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, offlineSafeDocWrite, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { demoStore } from '../utils/demoStore';
import { getRecordDueStatus } from '../utils/duesSync';
import { DuesStatusBadge } from '../components/DuesStatusBadge';

export default function Expenses() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const [records, setRecords] = useState<any[]>([]);
  const [duesList, setDuesList] = useState<any[]>([]);
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  
  const [showForm, setShowForm] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    if (isDemoUser) {
      const loadDemoData = () => {
        const b = demoStore.getBatches().filter(b => b.status === 'active');
        setActiveBatches(b);
        if (b.length > 0 && !batchId) setBatchId(b[0].id);
        const exp = demoStore.getExpenses();
        setRecords([...exp].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setDuesList(demoStore.getDues());
        setLoading(false);
      };
      loadDemoData();
      const unsub = demoStore.subscribe(loadDemoData);
      return () => unsub();
    }
    
    const batchesQuery = query(collection(db, 'batches'), where('userId', '==', currentUser.uid), where('status', '==', 'active'));
    const unsubscribeBatches = onSnapshot(batchesQuery, (snap) => {
      const batches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setActiveBatches(batches);
      if(batches.length > 0 && !batchId) setBatchId(batches[0].id);
    }, (error) => {
      console.warn('Expenses activeBatches onSnapshot error:', error);
    });

    const expQuery = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid));
    const unsubscribeExp = onSnapshot(expQuery, (snap) => {
      const fetchedRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setRecords(fetchedRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'expenses');
      setLoading(false);
    });

    const duesQuery = query(collection(db, 'dues'), where('userId', '==', currentUser.uid));
    const unsubscribeDues = onSnapshot(duesQuery, (snap) => {
      setDuesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn('Expenses dues onSnapshot error:', error);
    });

    return () => {
      unsubscribeBatches();
      unsubscribeExp();
      unsubscribeDues();
    };
  }, [currentUser, isDemoUser]);

  useEffect(() => {
    if(!category) setCategory(t('expenses.optElectricity'));
  }, [t]);

  const fetchInitialData = async () => {
    // No-op: Data is now synced automatically by onSnapshot / demoStore
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
        demoStore.deleteExpense(targetId);
        toast.success(t('common.success'), { duration: 3000 });
        return;
      }

      await offlineSafeDocWrite(deleteDoc(doc(db, 'expenses', targetId)));
      toast.success(t('common.success'), { duration: 3000 });
      fetchInitialData();
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.DELETE, 'expenses');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !batchId) return toast.error(t('feed.batchSelectionReq'));
    if (isSubmitting || submitLock.current) return;

    const totalAmountVal = Number(amount);
    const paidValRaw = amountPaid ? Number(amountPaid) : totalAmountVal;
    const paidVal = Math.min(paidValRaw, totalAmountVal);

    if (paidVal < totalAmountVal && !personName.trim()) {
      return toast.error(t('expenses.missingReceiver'));
    }

    setIsSubmitting(true);
    submitLock.current = true;

    try {
      const normalizedPersonName = personName.trim().replace(/\s+/g, ' ');

      if (isDemoUser) {
        const expRecordId = 'exp_' + Date.now();
        let createdDueId: string | undefined = undefined;

        if (paidVal < totalAmountVal) {
          const batchName = activeBatches.find(b => b.id === batchId)?.batchName || 'Unknown Batch';
          const dueRecord = {
            userId: currentUser.uid,
            personName: normalizedPersonName,
            phone: personPhone,
            type: 'payable' as const,
            amount: totalAmountVal,
            totalPaid: paidVal,
            details: `${batchName}${t('expenses.expenseDetails').replace('{category}', category || t('expenses.optElectricity'))}${details || ''}`,
            recordDate: date,
            status: 'pending' as const,
            sourceType: 'expense',
            sourceId: expRecordId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const savedDue = demoStore.saveDue(dueRecord);
          createdDueId = savedDue?.id;
        }

        const newRecord = {
          id: expRecordId,
          userId: currentUser.uid,
          batchId,
          date,
          category: category || t('expenses.optElectricity'),
          amount: totalAmountVal,
          amountPaid: paidVal,
          personName: normalizedPersonName,
          details,
          ...(createdDueId ? { dueRecordId: createdDueId } : {}),
          createdAt: new Date().toISOString()
        };
        demoStore.saveExpense(newRecord);

        toast.success(t('expenses.addSuccess'));
        setShowForm(false);
        setAmount('');
        setAmountPaid('');
        setDetails('');
        setPersonName('');
        setPersonPhone('');
        return;
      }

      // Live Firestore submission
      const expDocRef = doc(collection(db, 'expenses'));
      let createdDueId: string | undefined = undefined;

      if (paidVal < totalAmountVal) {
        const batchName = activeBatches.find(b => b.id === batchId)?.batchName || 'Unknown Batch';
        const dueDocRef = doc(collection(db, 'dues'));
        createdDueId = dueDocRef.id;
        const dueRecord = {
          userId: currentUser.uid,
          personName: normalizedPersonName,
          phone: personPhone,
          type: 'payable',
          amount: totalAmountVal,
          totalPaid: paidVal,
          details: `${batchName}${t('expenses.expenseDetails').replace('{category}', category || t('expenses.optElectricity'))}${details || ''}`,
          recordDate: date,
          status: 'pending',
          sourceType: 'expense',
          sourceId: expDocRef.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await offlineSafeDocWrite(setDoc(dueDocRef, dueRecord));
      }

      const newRecord = {
        userId: currentUser.uid,
        batchId,
        date,
        category: category || t('expenses.optElectricity'),
        amount: totalAmountVal,
        amountPaid: paidVal,
        personName: normalizedPersonName,
        details,
        ...(createdDueId ? { dueRecordId: createdDueId } : {}),
        createdAt: new Date().toISOString()
      };

      await offlineSafeDocWrite(setDoc(expDocRef, newRecord));

      toast.success(t('expenses.addSuccess'));
      setShowForm(false);
      setAmount('');
      setAmountPaid('');
      setDetails('');
      setPersonName('');
      setPersonPhone('');
      fetchInitialData();
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  if (loading) return <div>{t('common.loading')}</div>;

  const currentTotalAmount = Number(amount) || 0;
  const currentPaidRaw = amountPaid !== '' ? Number(amountPaid) : currentTotalAmount;
  const currentDue = Math.max(0, currentTotalAmount - currentPaidRaw);
  const currentReturnAmount = amountPaid !== '' ? Math.max(0, currentPaidRaw - currentTotalAmount) : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="text-purple-600" /> {t('expenses.title')}
        </h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700"
        >
          <Plus size={20} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow border border-purple-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.batchLabel')}</label>
              <select required value={batchId} onChange={(e) => setBatchId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 bg-white">
                <option value="">{t('feed.selectOption')}</option>
                {activeBatches.map(b => <option key={b.id} value={b.id}>{b.batchName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.dateLabel')}</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.categoryLabel')}</label>
            <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 bg-white">
              <option value={t('expenses.optElectricity')}>{t('expenses.optElectricity')}</option>
              <option value={t('expenses.optLabor')}>{t('expenses.optLabor')}</option>
              <option value={t('expenses.optTransport')}>{t('expenses.optTransport')}</option>
              <option value={t('expenses.optOther')}>{t('expenses.optOther')}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.receiverLabel')}</label>
              <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500" placeholder={t('expenses.receiverPlaceholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.mobileLabel')}</label>
              <input type="tel" value={personPhone} onChange={(e) => setPersonPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500" placeholder={t('medicine.mobilePlaceholder')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.amount')}</label>
              <input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500" placeholder="0" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.paidAmt')}</label>
               <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500" placeholder={`${t('feed.defaultAmt')}৳ ${currentTotalAmount}`} />
            </div>
          </div>
          {currentDue > 0 && <p className="text-red-500 text-sm font-semibold">{t('feed.dueMsg')}{currentDue}{t('feed.dueMsgAuto')}</p>}
          {currentReturnAmount > 0 && <p className="text-green-600 text-sm font-semibold">{t('feed.returnMsg')}{currentReturnAmount}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('medicine.detailsNote')}</label>
            <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500" placeholder={t('expenses.detailsPlaceholder')} />
          </div>
          <button disabled={isSubmitting} type="submit" className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl mt-2 disabled:bg-gray-400">
            {isSubmitting ? t('common.saving') : t('common.save')}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {records.map(record => {
          const dueStatus = getRecordDueStatus(record, duesList, 'expense');
          return (
            <div key={record.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-800">{record.category}</h3>
                <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                {record.personName && <p className="text-xs font-semibold text-gray-600 mt-0.5">{record.personName}</p>}
                {record.details && <p className="text-sm text-gray-600 mt-1">{record.details}</p>}
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="font-bold text-purple-600 text-lg">৳ {record.amount}</span>
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
