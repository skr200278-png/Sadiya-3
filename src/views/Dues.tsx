import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, offlineSafeDocWrite } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { 
  FileText, 
  Plus, 
  CheckCircle, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Calendar, 
  Phone, 
  MessageCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  CheckCircle2, 
  Clock, 
  Wallet,
  AlertCircle,
  Lock,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { demoStore } from '../utils/demoStore';
import CashMemoModal, { CashMemoData } from '../components/CashMemoModal';

export default function Dues() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<CashMemoData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const { hasAccess, openSubscriptionModal } = useSystemConfig();
  const canAccessDues = hasAccess('duesKhataFree');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  
  // Payment Modal States
  const [paymentRecordId, setPaymentRecordId] = useState<string | null>(null);
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Accordion state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'payable' | 'receivable'>('receivable');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Tab & Search filters
  const [activeTab, setActiveTab] = useState<'ledgers' | 'due_only' | 'paid_only' | 'timeline'>('ledgers');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    if (isDemoUser) {
      const loadDemoData = () => {
        const d = demoStore.getDues();
        setRecords([...d].sort((a: any, b: any) => new Date(b.recordDate || b.createdAt).getTime() - new Date(a.recordDate || a.createdAt).getTime()));
        setLoading(false);
      };
      loadDemoData();
      const unsub = demoStore.subscribe(loadDemoData);
      return () => unsub();
    }

    const q = query(collection(db, 'dues'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setRecords(fetchedRecords.sort((a: any, b: any) => new Date(b.recordDate || b.createdAt).getTime() - new Date(a.recordDate || a.createdAt).getTime()));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'dues');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, isDemoUser]);

  // Overall Financial Balances
  const { totalReceivable, totalPayable, pendingCount } = useMemo(() => {
    let rec = 0;
    let pay = 0;
    let pendingPersons = new Set<string>();

    records.forEach(r => {
      const remaining = Number(r.amount) - (Number(r.totalPaid) || 0);
      if (remaining > 0) {
        if (r.type === 'receivable') rec += remaining;
        else if (r.type === 'payable') pay += remaining;
        if (r.personName) pendingPersons.add(r.personName.trim().toLowerCase());
      }
    });

    return {
      totalReceivable: rec,
      totalPayable: pay,
      pendingCount: pendingPersons.size
    };
  }, [records]);

  // Toggle group expansion
  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Group records by personName (Customer Ledger)
  const groupedLedgers = useMemo(() => {
    const groups: Record<string, {
      personName: string;
      phone: string;
      payable: number;
      receivable: number;
      lastDate: string;
      items: any[];
    }> = {};

    records.forEach(r => {
      const normalizedName = (r.personName || '').trim().replace(/\s+/g, ' ');
      if (!normalizedName) return;

      const rDate = r.recordDate || r.date || r.createdAt;

      if (!groups[normalizedName]) {
        groups[normalizedName] = {
          personName: normalizedName,
          phone: r.phone || '',
          payable: 0,
          receivable: 0,
          lastDate: rDate,
          items: []
        };
      }

      if (r.phone && !groups[normalizedName].phone) {
        groups[normalizedName].phone = r.phone;
      }

      // Update latest transaction date
      if (new Date(rDate).getTime() > new Date(groups[normalizedName].lastDate).getTime()) {
        groups[normalizedName].lastDate = rDate;
      }

      groups[normalizedName].items.push(r);

      const remaining = Number(r.amount) - (Number(r.totalPaid) || 0);
      if (remaining > 0) {
        if (r.type === 'payable') {
          groups[normalizedName].payable += remaining;
        } else if (r.type === 'receivable') {
          groups[normalizedName].receivable += remaining;
        }
      }
    });

    return Object.values(groups).sort((a, b) => {
      // Sort with active dues first, then by latest date
      const aHasDue = a.receivable > 0 || a.payable > 0;
      const bHasDue = b.receivable > 0 || b.payable > 0;
      if (aHasDue && !bHasDue) return -1;
      if (!aHasDue && bHasDue) return 1;
      return new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime();
    });
  }, [records]);

  // Filtered Ledgers
  const filteredLedgers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return groupedLedgers.filter(g => {
      const matchesSearch = !term || 
        g.personName.toLowerCase().includes(term) || 
        g.phone.includes(term);

      if (!matchesSearch) return false;

      if (activeTab === 'due_only') {
        return g.receivable > 0 || g.payable > 0;
      }
      if (activeTab === 'paid_only') {
        return g.receivable === 0 && g.payable === 0;
      }
      return true;
    });
  }, [groupedLedgers, activeTab, searchTerm]);

  // Filtered Timeline Records
  const filteredTimeline = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return records.filter(r => {
      const matchesSearch = !term || 
        (r.personName && r.personName.toLowerCase().includes(term)) ||
        (r.phone && r.phone.includes(term)) ||
        (r.details && r.details.toLowerCase().includes(term)) ||
        (r.recordDate && r.recordDate.includes(term));
      return matchesSearch;
    });
  }, [records, searchTerm]);

  // New Due Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isSubmitting || submitLock.current) return;
    
    if (!canAccessDues) {
      openSubscriptionModal(
        language === 'bn' ? 'বকেয়া খাতা ও কাস্টমার লেজার' : 'Dues Ledger & Accounts',
        language === 'bn' ? 'বকেয়া খাতা ও দেনা-পাওনা খতিয়ান ব্যবহারের জন্য সরাসরি অ্যাডমিনের সাথে যোগাযোগ করে সক্রিয় করুন।' : 'To use Dues ledger and accounts, please contact the admin for activation.'
      );
      return;
    }

    if (Number(amount) <= 0) {
      return toast.error(language === 'bn' ? 'সঠিক টাকার পরিমাণ দিন' : 'Please enter valid amount');
    }

    setIsSubmitting(true);
    submitLock.current = true;

    try {
      const newRecord = {
        userId: currentUser.uid,
        personName: personName.trim().replace(/\s+/g, ' '),
        phone: phone.trim(),
        type,
        amount: Number(amount),
        totalPaid: 0,
        details: details.trim() || (type === 'receivable' ? 'পণ্য বিক্রয় বকেয়া' : 'পণ্য ক্রয় বাকি'),
        recordDate: date,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isDemoUser) {
        demoStore.saveDue(newRecord);
        toast.success(t('medicine.addSuccess'));
        resetForm();
        return;
      }

      await offlineSafeDocWrite(addDoc(collection(db, 'dues'), newRecord));
      toast.success(t('medicine.addSuccess'));
      resetForm();
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.CREATE, 'dues');
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setPersonName('');
    setPhone('');
    setAmount('');
    setDetails('');
    setDate(new Date().toISOString().split('T')[0]);
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
        demoStore.deleteDue(targetId);
        toast.success(t('common.success'), { duration: 3000 });
        return;
      }

      await offlineSafeDocWrite(deleteDoc(doc(db, 'dues', targetId)));
      toast.success(t('common.success'), { duration: 3000 });
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.DELETE, 'dues');
    }
  };

  // Collect Payment / Partial Deposit Handler
  const handlePartialPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRecordId || !paymentAmount || isSubmitting || submitLock.current) return;
    
    const record = records.find(r => r.id === paymentRecordId);
    if (!record) return;

    setIsSubmitting(true);
    submitLock.current = true;
    try {
      const currentPaid = Number(record.totalPaid) || 0;
      const addedPaid = Number(paymentAmount);
      const remainingDue = Number(record.amount) - currentPaid;
      
      const paymentAmountToUse = Math.min(addedPaid, remainingDue);
      const returnAmount = Math.max(0, addedPaid - remainingDue);
      
      const newTotalPaid = currentPaid + paymentAmountToUse;
      const isFullyPaid = newTotalPaid >= Number(record.amount);
      const paymentHistory = record.payments || [];
      const newPayment = {
        date: paymentDate || new Date().toISOString().split('T')[0],
        amount: paymentAmountToUse
      };

      if (isDemoUser) {
        demoStore.saveDue({
          ...record,
          amount: Number(record.amount),
          totalPaid: newTotalPaid,
          payments: [...paymentHistory, newPayment],
          status: isFullyPaid ? 'paid' : 'pending',
          updatedAt: new Date().toISOString()
        });
        if (returnAmount > 0) {
          toast.success(`${t('dues.updateReturn')}${returnAmount}`, { duration: 5000 });
        } else {
          toast.success(t('dues.updateSuccess'));
        }
        setPaymentRecordId(null);
        setPaymentAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        return;
      }

      const ref = doc(db, 'dues', paymentRecordId);
      await offlineSafeDocWrite(updateDoc(ref, { 
        amount: Number(record.amount),
        totalPaid: newTotalPaid,
        payments: [...paymentHistory, newPayment],
        status: isFullyPaid ? 'paid' : 'pending',
        updatedAt: new Date().toISOString()
      }));
      
      if (returnAmount > 0) {
        toast.success(`${t('dues.updateReturn')}${returnAmount}`, { duration: 5000 });
      } else {
        toast.success(t('dues.updateSuccess'));
      }
      setPaymentRecordId(null);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.UPDATE, `dues/${paymentRecordId}`);
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  // Mark 100% Paid Handler
  const markPaid = async () => {
    if (!markPaidId || isSubmitting || submitLock.current) return;
    setIsSubmitting(true);
    submitLock.current = true;
    try {
      const recordId = markPaidId;
      const record = records.find(r => r.id === recordId);
      if (!record) return;
      const remainingDue = Number(record.amount) - (Number(record.totalPaid) || 0);

      const updateData: any = {
        amount: Number(record.amount),
        status: 'paid',
        totalPaid: Number(record.amount),
        updatedAt: new Date().toISOString()
      };

      if (remainingDue > 0) {
        updateData.payments = [...(record.payments || []), {
          date: new Date().toISOString().split('T')[0],
          amount: remainingDue
        }];
      }

      if (isDemoUser) {
        demoStore.saveDue({
          ...record,
          ...updateData
        });
        toast.success(t('dues.markPaidSuccess'));
        setMarkPaidId(null);
        return;
      }

      const ref = doc(db, 'dues', recordId);
      await offlineSafeDocWrite(updateDoc(ref, updateData));
      toast.success(t('dues.markPaidSuccess'));
      setMarkPaidId(null);
    } catch (error) {
      toast.error(t('common.error'));
      handleFirestoreError(error, OperationType.UPDATE, `dues/${markPaidId}`);
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
      setMarkPaidId(null);
    }
  };

  // Send WhatsApp Reminder
  const sendWhatsAppReminder = (group: any) => {
    if (!group.phone) {
      toast.error(language === 'bn' ? 'কাস্টমারের ফোন নম্বর নেই!' : 'No phone number available');
      return;
    }
    const cleanPhone = group.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
    const dueAmt = group.receivable;
    
    const message = language === 'bn' 
      ? `আসসালামু আলাইকুম ${group.personName} ভাই, আপনার নিকট আমাদের খামারের মোট ৳${dueAmt.toLocaleString('bn-BD')} টাকা বকেয়া রয়েছে। অনুগ্রহ করে বকেয়া পরিশোধ করার জন্য বিনীত অনুরোধ জানাচ্ছি। ধন্যবাদ।`
      : `Dear ${group.personName}, you have an outstanding due of ৳${dueAmt} at our farm. Kindly arrange for payment at your earliest convenience. Thank you.`;
    
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleToggleForm = () => {
    if (!canAccessDues && !showForm) {
      openSubscriptionModal(
        language === 'bn' ? 'বকেয়া খাতা ও কাস্টমার লেজার' : 'Dues Ledger & Accounts',
        language === 'bn' ? 'বকেয়া খাতা ও দেনা-পাওনা খতিয়ান ব্যবহারের জন্য সরাসরি অ্যাডমিনের সাথে যোগাযোগ করে সক্রিয় করুন।' : 'To use Dues ledger and accounts, please contact the admin for activation.'
      );
      return;
    }
    setShowForm(!showForm);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">{t('common.loading')}</div>;

  if (!canAccessDues) {
    return (
      <div className="space-y-4 pb-12 animate-in fade-in">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-amber-200 text-center space-y-4 my-2">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock size={32} />
          </div>
          <div>
            <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mb-2 inline-block shadow-2xs">
              {language === 'bn' ? '👑 ভিআইপি প্রিমিয়াম ফিচার' : '👑 VIP Feature'}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {language === 'bn' ? 'বকেয়া খাতা ও কাস্টমার লেজার লক' : 'Dues Ledger is Locked'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed max-w-md mx-auto">
              {language === 'bn' 
                ? 'খরিদ্দার অনুযায়ী বাকি-বকেয়া হিসাব, পেমেন্ট আদায় খতিয়ান ও হোয়াটসঅ্যাপ তাগাদা মেসেজ পাঠানোর সুবিধাটি বর্তমানে লক করা রয়েছে। এটি সক্রিয় করতে সরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন।' 
                : 'Customer dues ledger, payment records, and automated WhatsApp reminders are locked. Please contact the admin to activate this feature.'}
            </p>
          </div>

          <div className="max-w-xs mx-auto space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => openSubscriptionModal(
                language === 'bn' ? 'বকেয়া খাতা (দেনা-পাওনা লেজার)' : 'Dues Ledger',
                language === 'bn' ? 'বকেয়া খাতা ও কাস্টমার লেজার সম্পূর্ণ ব্যবহারের জন্য সরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন।' : 'Please contact the admin to activate the Dues ledger.'
              )}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
            >
              <Sparkles size={16} className="text-amber-300" />
              <span>{language === 'bn' ? 'সরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন' : 'Contact Admin to Unlock'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 shadow-2xs">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-tight">
              {t('dues.title')}
            </h2>
            <p className="text-[11px] text-slate-400 font-bold">
              {language === 'bn' ? 'খরিদ্দার লেজার, দেনা-পাওনা ও লেনদেনের খতিয়ান' : 'Customer-wise dues ledger & timeline'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleToggleForm}
          className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>{showForm ? (language === 'bn' ? 'বন্ধ করুন' : 'Close') : t('dues.addRecord')}</span>
        </button>
      </div>

      {/* Top Ledger Financial Overview Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] sm:text-xs font-black text-emerald-600 block uppercase">
            {language === 'bn' ? '🟢 আমরা পাবো (পাওনা)' : 'Receivable'}
          </span>
          <span className="text-base sm:text-xl font-black text-emerald-700 font-mono mt-0.5 block">
            ৳ {totalReceivable.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] sm:text-xs font-black text-red-500 block uppercase">
            {language === 'bn' ? '🔴 আমরা দেব (দেনা)' : 'Payable'}
          </span>
          <span className="text-base sm:text-xl font-black text-red-600 font-mono mt-0.5 block">
            ৳ {totalPayable.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] sm:text-xs font-black text-slate-400 block uppercase">
            {language === 'bn' ? '👥 বাকি খরিদ্দার' : 'Due Customers'}
          </span>
          <span className="text-base sm:text-xl font-black text-slate-800 font-mono mt-0.5 block">
            {pendingCount} {language === 'bn' ? 'জন' : 'pers.'}
          </span>
        </div>
      </div>

      {/* New Due Entry Form Modal/Dropdown */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-5 rounded-2xl shadow-md border border-pink-200/80 space-y-3.5 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm sm:text-base font-extrabold text-pink-900 flex items-center gap-2">
              <Wallet size={18} className="text-pink-600" />
              {language === 'bn' ? 'নতুন দেনা বা পাওনা এন্ট্রি' : 'Record New Due'}
            </h3>
            <span className="text-[10px] font-black text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
              {language === 'bn' ? 'সরাসরি যুক্ত হবে' : 'Live Ledger'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('dues.whatRecord')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('receivable')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  type === 'receivable'
                    ? 'bg-emerald-50 text-emerald-850 border-emerald-500 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowDownLeft size={16} className="text-emerald-600" />
                <span>{t('dues.receivable')}</span>
              </button>

              <button
                type="button"
                onClick={() => setType('payable')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  type === 'payable'
                    ? 'bg-red-50 text-red-850 border-red-500 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowUpRight size={16} className="text-red-600" />
                <span>{t('dues.payable')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('dues.personLabel')} *</label>
              <input 
                required 
                type="text" 
                value={personName} 
                onChange={(e) => setPersonName(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-pink-500 font-medium" 
                placeholder={t('dues.personPlaceholder')} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('medicine.mobileLabel')}</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-pink-500 font-mono" 
                placeholder={t('medicine.mobilePlaceholder')} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('dues.amountLabel')} *</label>
              <input 
                required 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-pink-500 font-mono" 
                placeholder={t('dues.amountPlaceholder')} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('medicine.dateLabel')} *</label>
              <input 
                required 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-pink-500 font-medium" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('dues.detailsLabel')}</label>
            <input 
              type="text" 
              value={details} 
              onChange={(e) => setDetails(e.target.value)} 
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-pink-500" 
              placeholder={t('dues.detailsPlaceholder')} 
            />
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
              className="flex-2 bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm disabled:bg-slate-400 transition-all shadow-sm cursor-pointer"
            >
              {isSubmitting ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      )}

      {/* Tabs & Search Filter Navigation */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs space-y-2.5">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'bn' ? 'খরিদ্দারের নাম, ফোন নম্বর বা বিবরণ দিয়ে খুঁজুন...' : 'Search by person name, phone or details...'}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-pink-500 font-medium"
          />
        </div>

        {/* View Tabs */}
        <div className="grid grid-cols-4 gap-1.5 text-xs font-bold bg-slate-100/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('ledgers')}
            className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${
              activeTab === 'ledgers' ? 'bg-white text-pink-700 shadow-2xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            📋 {language === 'bn' ? 'সকল লেজার' : 'All Ledgers'}
          </button>
          <button
            onClick={() => setActiveTab('due_only')}
            className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${
              activeTab === 'due_only' ? 'bg-white text-red-600 shadow-2xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            🔴 {language === 'bn' ? 'বকেয়া বাকি' : 'Dues'}
          </button>
          <button
            onClick={() => setActiveTab('paid_only')}
            className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${
              activeTab === 'paid_only' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            🟢 {language === 'bn' ? 'পরিশোধিত' : 'Settled'}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${
              activeTab === 'timeline' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            📅 {language === 'bn' ? 'তারিখ ভিত্তিক' : 'Timeline'}
          </button>
        </div>
      </div>

      {/* Main Content Area: Grouped Ledgers OR Timeline */}
      {activeTab !== 'timeline' ? (
        <div className="space-y-3">
          {filteredLedgers.length === 0 && !loading && (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 text-slate-400 space-y-1">
              <Users size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-600">{t('dues.dueEmpty')}</p>
              <p className="text-xs text-slate-400">{language === 'bn' ? 'কোনো বাকি হিসাব খুঁজে পাওয়া যায়নি।' : 'No records match the filter.'}</p>
            </div>
          )}

          {filteredLedgers.map(group => {
            const isExpanded = !!expandedGroups[group.personName];
            const hasReceivable = group.receivable > 0;
            const hasPayable = group.payable > 0;
            const isAllSettled = !hasReceivable && !hasPayable;

            // Find first pending item for quick deposit action
            const firstPendingItem = group.items.find(i => i.status === 'pending' || (i.amount - (i.totalPaid || 0) > 0));

            return (
              <div 
                key={group.personName} 
                className="bg-white rounded-2xl border border-slate-150 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
              >
                {/* Customer Ledger Summary Header */}
                <div 
                  onClick={() => toggleGroup(group.personName)}
                  className="p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50/40 select-none transition-colors space-y-2.5"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-850 text-sm sm:text-base flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs">
                            👤
                          </span>
                          {group.personName}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150">
                          {group.items.length} {language === 'bn' ? 'টি লেনদেন' : 'records'}
                        </span>
                      </div>

                      {group.phone ? (
                        <p className="text-xs text-blue-600 font-mono font-bold flex items-center gap-1">
                          <Phone size={12} /> {group.phone}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          {language === 'bn' ? 'ফোন নম্বর দেওয়া হয়নি' : 'No phone recorded'}
                        </p>
                      )}

                      <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {language === 'bn' ? 'সর্বশেষ লেনদেন:' : 'Last Activity:'} {' '}
                        <span className="text-slate-600 font-bold">
                          {new Date(group.lastDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </p>
                    </div>

                    {/* Balance Status Badges */}
                    <div className="text-right flex flex-col items-end gap-1 shrink-0">
                      {hasReceivable && (
                        <div className="bg-emerald-50 border border-emerald-250 px-2.5 py-1 rounded-xl text-right">
                          <span className="text-[9px] font-black text-emerald-600 block uppercase">
                            {language === 'bn' ? 'পাওনা আছে' : 'Receivable'}
                          </span>
                          <span className="font-black text-emerald-700 text-sm sm:text-base font-mono">
                            +৳{group.receivable.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                          </span>
                        </div>
                      )}

                      {hasPayable && (
                        <div className="bg-red-50 border border-red-250 px-2.5 py-1 rounded-xl text-right">
                          <span className="text-[9px] font-black text-red-600 block uppercase">
                            {language === 'bn' ? 'দেনা আছে' : 'Payable'}
                          </span>
                          <span className="font-black text-red-700 text-sm sm:text-base font-mono">
                            -৳{group.payable.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                          </span>
                        </div>
                      )}

                      {isAllSettled && (
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                          ✔️ {language === 'bn' ? 'সব পরিশোধিত' : 'Fully Settled'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Quick Action Buttons Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      {group.phone && (
                        <a 
                          href={`tel:${group.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Phone size={12} /> {language === 'bn' ? 'কল' : 'Call'}
                        </a>
                      )}

                      {hasReceivable && group.phone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendWhatsAppReminder(group);
                          }}
                          className="flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          <MessageCircle size={12} /> {language === 'bn' ? 'তাগাদা SMS' : 'WhatsApp'}
                        </button>
                      )}

                      {firstPendingItem && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentRecordId(firstPendingItem.id);
                          }}
                          className="flex items-center gap-1 text-[11px] bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-250 font-extrabold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus size={12} /> {language === 'bn' ? 'টাকা জমা নিন' : 'Collect Due'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                      <span>{isExpanded ? (language === 'bn' ? 'লুকান' : 'Collapse') : (language === 'bn' ? 'খতিয়ান দেখুন' : 'View Passbook')}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Collapsible Customer Detailed Statement / Passbook */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-150 p-3 sm:p-4 space-y-3 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                        📜 {language === 'bn' ? `${group.personName} - এর বিস্তারিত লেনদেনের খতিয়ান:` : `Transaction history for ${group.personName}:`}
                      </span>
                    </div>

                    {group.items.map(record => {
                      const isPayable = record.type === 'payable';
                      const totalPaid = Number(record.totalPaid) || 0;
                      const remainingDue = Number(record.amount) - totalPaid;
                      const rDate = record.recordDate || record.date || record.createdAt;

                      return (
                        <div 
                          key={record.id} 
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                        >
                          {/* Item Date, Category and Due Status */}
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase ${
                                  isPayable 
                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {isPayable ? (language === 'bn' ? 'দোকানদার পাবে (দেনা)' : 'Payable') : (language === 'bn' ? 'আমরা পাবো (পাওনা)' : 'Receivable')}
                                </span>

                                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                                  <Calendar size={13} className="text-pink-600" />
                                  {new Date(rDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>

                              {record.details && (
                                <p className="text-xs text-slate-700 font-semibold mt-1 bg-slate-50 p-2 rounded-lg border border-slate-150">
                                  📌 {record.details}
                                </p>
                              )}
                            </div>

                            {/* Financial totals on this record */}
                            <div className="text-right flex flex-col items-end shrink-0">
                              <span className="font-extrabold text-slate-800 text-xs sm:text-sm font-mono">
                                {language === 'bn' ? 'বিল:' : 'Total:'} ৳{Number(record.amount).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 mt-0.5 font-mono">
                                {language === 'bn' ? 'জমা:' : 'Paid:'} ৳{totalPaid.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                              </span>
                              <span className={`font-black text-xs sm:text-sm mt-1 font-mono ${remainingDue > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                {language === 'bn' ? 'বাকি:' : 'Due:'} ৳{remainingDue > 0 ? remainingDue.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') : 0}
                              </span>
                            </div>
                          </div>

                          {/* Payment logs history with timestamped dates */}
                          {record.payments && record.payments.length > 0 && (
                            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 space-y-1 font-sans">
                              <p className="font-extrabold text-slate-700">
                                💳 {language === 'bn' ? 'কিস্তি / জমা প্রদানের ইতিহাস:' : 'Payment Logs:'}
                              </p>
                              <div className="space-y-0.5 pl-2 border-l-2 border-emerald-300">
                                {record.payments.map((p: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500 font-medium">
                                      📅 {new Date(p.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}:
                                    </span>
                                    <span className="font-bold text-emerald-700 font-mono">
                                      +৳{Number(p.amount).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Bar for this Record */}
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <span className={`text-[10px] font-black ${record.status === 'paid' || remainingDue <= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                              {record.status === 'paid' || remainingDue <= 0 
                                ? `✔️ ${language === 'bn' ? 'সম্পূর্ণ পরিশোধিত' : 'Fully Paid'}` 
                                : `🔴 ${language === 'bn' ? 'টাকা বাকি আছে' : 'Pending'}`}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {remainingDue > 0 && (
                                <>
                                  <button 
                                    disabled={isSubmitting} 
                                    onClick={() => setPaymentRecordId(record.id)} 
                                    className="flex items-center gap-1 text-[11px] bg-pink-50 text-pink-700 px-2.5 py-1.5 rounded-lg font-black hover:bg-pink-100 border border-pink-250 transition-all active:scale-95 cursor-pointer"
                                  >
                                    <Plus size={13} /> {language === 'bn' ? 'জমা' : 'Deposit'}
                                  </button>
                                  <button 
                                    disabled={isSubmitting} 
                                    onClick={() => setMarkPaidId(record.id)} 
                                    className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg font-black hover:bg-emerald-100 border border-emerald-250 transition-all active:scale-95 cursor-pointer"
                                  >
                                    <CheckCircle size={13} /> {language === 'bn' ? 'পুরো শোধ' : 'Full Paid'}
                                  </button>
                                </>
                              )}
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
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Timeline View: Chronological Transactions */
        <div className="space-y-3">
          {filteredTimeline.length === 0 && !loading && (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 text-slate-400">
              <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-600">{language === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি।' : 'No transactions recorded.'}</p>
            </div>
          )}

          {filteredTimeline.map(record => {
            const isPayable = record.type === 'payable';
            const totalPaid = Number(record.totalPaid) || 0;
            const remainingDue = Number(record.amount) - totalPaid;
            const rDate = record.recordDate || record.date || record.createdAt;

            return (
              <div 
                key={record.id} 
                className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs space-y-2.5"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-850 text-sm sm:text-base flex items-center gap-1.5">
                        <Calendar size={15} className="text-pink-600" />
                        {new Date(rDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase ${
                        isPayable ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isPayable ? (language === 'bn' ? 'দেনা (আমি দেব)' : 'Payable') : (language === 'bn' ? 'পাওনা (আমি পাব)' : 'Receivable')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-bold flex items-center gap-1.5 flex-wrap">
                      <span>👤 {record.personName}</span>
                      {record.phone && <span className="text-blue-600 font-mono text-[11px]">📞 {record.phone}</span>}
                    </p>

                    {record.details && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {record.details}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="font-black text-slate-800 text-sm sm:text-base font-mono">
                      ৳ {Number(record.amount).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                    </span>
                    {remainingDue > 0 ? (
                      <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full mt-1">
                        {language === 'bn' ? `বাকি: ৳${remainingDue}` : `Due: ৳${remainingDue}`}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
                        {language === 'bn' ? 'পরিশোধিত' : 'Settled'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500">
                    {language === 'bn' ? 'জমা দেওয়া:' : 'Paid:'} <span className="font-bold text-emerald-700 font-mono">৳{totalPaid}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => {
                        const batchName = record.batchName || record.batchId || (language === 'bn' ? 'খামার পণ্য' : 'Farm Product');
                        const memo: CashMemoData = {
                          memoNo: `DUE-${record.id.slice(-6).toUpperCase()}`,
                          date: new Date(record.date || record.updatedAt || new Date()).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
                          batchName: batchName,
                          buyerName: record.personName,
                          buyerPhone: record.phone,
                          items: [
                            {
                              name: record.category ? `${record.category} (বকেয়া খতিয়ান)` : 'পণ্য ক্রয় / পূর্বের বাকি',
                              quantity: 1,
                              unit: 'ইনভয়েস',
                              unitPrice: Number(record.totalAmount || record.amount),
                              totalPrice: Number(record.totalAmount || record.amount)
                            }
                          ],
                          totalAmount: Number(record.totalAmount || record.amount),
                          paidAmount: totalPaid,
                          dueAmount: remainingDue,
                          notes: record.note || (record.type === 'customer_due' ? 'কাস্টমার বকেয়া খতিয়ান' : 'সাপ্লায়ার দেনা খতিয়ান'),
                          type: 'due_payment'
                        };
                        setReceiptData(memo);
                        setIsReceiptOpen(true);
                      }}
                      className="text-[11px] bg-teal-50 text-teal-800 px-2 py-1 rounded-lg font-bold hover:bg-teal-100 border border-teal-200 transition-all cursor-pointer flex items-center gap-1"
                      title={language === 'bn' ? 'রিসিট / মেমো তৈরি করুন' : 'Generate Receipt'}
                    >
                      <FileText size={12} className="text-teal-600" />
                      <span>{language === 'bn' ? 'রিসিট' : 'Receipt'}</span>
                    </button>

                    {remainingDue > 0 && (
                      <>
                        <button 
                          disabled={isSubmitting} 
                          onClick={() => setPaymentRecordId(record.id)} 
                          className="text-[11px] bg-pink-50 text-pink-700 px-2.5 py-1 rounded-lg font-black hover:bg-pink-100 border border-pink-250 transition-all cursor-pointer"
                        >
                          {language === 'bn' ? 'জমা নিন' : 'Deposit'}
                        </button>
                        <button 
                          disabled={isSubmitting} 
                          onClick={() => setMarkPaidId(record.id)} 
                          className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-black hover:bg-emerald-100 border border-emerald-250 transition-all cursor-pointer"
                        >
                          {language === 'bn' ? 'পরিশোধ' : 'Settle'}
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleDelete(record.id)} 
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cash Memo / Due Receipt Modal */}
      <CashMemoModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        data={receiptData}
      />

      {/* Partial Deposit Collection Modal */}
      {paymentRecordId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scaleUp">
            <div className="bg-pink-600 p-4 text-white">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Wallet size={18} />
                {t('dues.addDepositBtn')}
              </h3>
              <p className="text-[11px] text-pink-100 mt-0.5">
                {language === 'bn' ? 'কাস্টমারের থেকে প্রাপ্ত নগদ টাকা জমা দিন' : 'Enter received cash deposit'}
              </p>
            </div>

            <form onSubmit={handlePartialPayment} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('dues.amountLabel')} *</label>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)} 
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-pink-500 font-mono" 
                  placeholder={t('dues.payAmount')} 
                  required 
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('dues.payDate')} *</label>
                <input 
                  type="date" 
                  value={paymentDate} 
                  onChange={(e) => setPaymentDate(e.target.value)} 
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-pink-500 font-medium" 
                  required 
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setPaymentRecordId(null)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  {t('dues.cancelBtn')}
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-extrabold py-2.5 rounded-xl text-xs sm:text-sm disabled:bg-slate-400 transition-all cursor-pointer shadow-sm"
                >
                  {isSubmitting ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Full Paid Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!markPaidId}
        title={t('dues.markPaidBtn')}
        message={t('dues.verifyPayMsg')}
        onConfirm={markPaid}
        onCancel={() => setMarkPaidId(null)}
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
