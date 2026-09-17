import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { X, Wheat, Calendar, Tag, DollarSign, CheckCircle2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db, offlineSafeDocWrite } from '../firebase';
import { demoStore } from '../utils/demoStore';

interface QuickFeedPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  batchName: string;
  farmType?: string;
  onSuccess: () => void;
}

export default function QuickFeedPurchaseModal({
  isOpen,
  onClose,
  batchId,
  batchName,
  farmType = 'poultry',
  onSuccess
}: QuickFeedPurchaseModalProps) {
  const { language } = useLanguage();
  const { currentUser, isDemoUser } = useAuth();
  const isBn = language === 'bn';

  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [feedType, setFeedType] = useState<string>(() => {
    if (farmType === 'cattle') return 'দানা/ভুষি (Cattle Feed)';
    if (farmType === 'fish') return 'ভাসমান খাবার (Fish Feed)';
    return 'ব্রয়লার স্টার্টার (Starter)';
  });
  const [quantityBags, setQuantityBags] = useState<string>('');
  const [pricePerBag, setPricePerBag] = useState<string>('2600');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalCost = Number(quantityBags || 0) * Number(pricePerBag || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !isDemoUser) return;
    if (!batchId) {
      toast.error(isBn ? 'ব্যাচ নির্বাচন করা নেই' : 'Batch not selected');
      return;
    }

    const bags = Number(quantityBags);
    if (!bags || bags <= 0) {
      toast.error(isBn ? 'বস্তার সংখ্যা সঠিকভাবে লিখুন' : 'Enter valid number of bags');
      return;
    }

    const price = Number(pricePerBag) || 0;
    const cost = bags * price;
    const paid = amountPaid ? Number(amountPaid) : cost;

    setIsSubmitting(true);
    try {
      const targetUserId = currentUser ? currentUser.uid : 'demo_khamari_user_1';

      if (isDemoUser) {
        demoStore.saveFeedRecord({
          userId: targetUserId,
          batchId,
          date,
          feedType,
          quantityBags: bags,
          cost,
          pricePerBag: price,
          amountPaid: paid,
          personName: details || 'ফিড ডিলার',
          details: details || `${batchName} - খাদ্য ক্রয়`
        });
        toast.success(isBn ? 'খাদ্য ক্রয়ের তথ্য সফলভাবে যোগ হয়েছে!' : 'Feed purchase recorded successfully!');
        onSuccess();
        onClose();
        return;
      }

      const feedDocRef = doc(collection(db, 'feed_records'));
      const newRecord = {
        userId: targetUserId,
        batchId,
        date,
        feedType,
        quantityBags: bags,
        cost,
        pricePerBag: price,
        amountPaid: paid,
        details: details || `${batchName} - খাদ্য ক্রয়`,
        createdAt: new Date().toISOString()
      };

      await offlineSafeDocWrite(setDoc(feedDocRef, newRecord));
      toast.success(isBn ? 'খাদ্য ক্রয়ের তথ্য সফলভাবে সংরক্ষিত হয়েছে!' : 'Feed purchase saved successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save quick feed purchase:', err);
      toast.error(isBn ? 'খাদ্য ক্রয়ের তথ্য সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save feed purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {isBn ? 'খাদ্য ক্রয় / স্টক এন্ট্রি' : 'Add Feed Purchase Stock'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {batchName} {isBn ? 'ব্যাচের গুদামে খাদ্য যুক্ত হবে' : 'Batch feed inventory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {/* Helpful Explanatory Banner */}
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <Wheat size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isBn
                ? '💡 কেনা বস্তার সংখ্যা লিখলেই গুদামের মোট খাদ্য জমা হবে। প্রতিদিনের খাওয়ানো খাবার স্বয়ংক্রিয়ভাবে বাদ গিয়ে অবশিষ্ট বস্তা ও কত দিন চলবে তা সাথে সাথে বের হবে।'
                : 'Enter purchased bags to update warehouse stock. Consumed feed will auto-deduct to calculate remaining bags and runway days.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Purchase Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-500" />
                <span>{isBn ? 'ক্রয়ের তারিখ' : 'Purchase Date'}</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Feed Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Tag size={13} className="text-slate-500" />
                <span>{isBn ? 'খাবারের ধরন / নাম' : 'Feed Type'}</span>
              </label>
              <select
                value={feedType}
                onChange={(e) => setFeedType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {farmType === 'cattle' ? (
                  <>
                    <option value="দানা/ভুষি (Cattle Feed)">দানা / ভুষি (Cattle Feed)</option>
                    <option value="সাইলেজ (Silage)">সাইলেজ (Silage)</option>
                    <option value="ঘাস / খড় (Roughage)">ঘাস / খড়</option>
                  </>
                ) : farmType === 'fish' ? (
                  <>
                    <option value="ভাসমান খাবার (Floating Feed)">ভাসমান খাবার (Floating Feed)</option>
                    <option value="ডুবন্ত খাবার (Sinking Feed)">ডুবন্ত খাবার (Sinking Feed)</option>
                    <option value="নার্সারি ফিড (Nursery Feed)">নার্সারি ফিড (Nursery Feed)</option>
                  </>
                ) : (
                  <>
                    <option value="ব্রয়লার স্টার্টার (Starter)">ব্রয়লার স্টার্টার (Starter: ১-১০ দিন)</option>
                    <option value="ব্রয়লার গ্রোয়ার (Grower)">ব্রয়লার গ্রোয়ার (Grower: ১১-২০ দিন)</option>
                    <option value="ব্রয়লার ফিনিশার (Finisher)">ব্রয়লার ফিনিশার (Finisher: ২১+ দিন)</option>
                    <option value="সোনালী স্টার্টার (Sonali Starter)">সোনালী স্টার্টার (Sonali Starter)</option>
                    <option value="সোনালী গ্রোয়ার (Sonali Grower)">সোনালী গ্রোয়ার (Sonali Grower)</option>
                    <option value="লেয়ার ফিড (Layer Feed)">লেয়ার ফিড (Layer Feed)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Quantity in Bags */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Wheat size={13} className="text-amber-600" />
                <span>{isBn ? 'কত বস্তা কিনলেন? (Bags)' : 'Quantity (Bags)'} *</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                placeholder={isBn ? 'যেমন: ৫' : 'e.g. 5'}
                value={quantityBags}
                onChange={(e) => setQuantityBags(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {Number(quantityBags || 0) > 0
                  ? isBn
                    ? `= ${Number(quantityBags) * 50} কেজি খাবার (১ বস্তা = ৫০ কেজি)`
                    : `= ${Number(quantityBags) * 50} kg (50kg/bag)`
                  : isBn
                  ? 'প্রতি বস্তা = ৫০ কেজি ধরা হবে'
                  : 'Assumes 50kg/bag'}
              </span>
            </div>

            {/* Price Per Bag */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign size={13} className="text-slate-500" />
                <span>{isBn ? 'প্রতি বস্তার দাম (টাকা)' : 'Price Per Bag (৳)'}</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder={isBn ? 'যেমন: ২৬৫০' : 'e.g. 2650'}
                value={pricePerBag}
                onChange={(e) => setPricePerBag(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {totalCost > 0 ? (
                  isBn ? `মোট দাম: ৳ ${totalCost.toLocaleString()}` : `Total: ৳ ${totalCost.toLocaleString()}`
                ) : (
                  isBn ? 'ঐচ্ছিক, দাম দিলে খরচ হিসাব হবে' : 'Optional'
                )}
              </span>
            </div>
          </div>

          {/* Supplier or Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              {isBn ? 'দোকান / ডিলারের নাম বা বিবরণ (ঐচ্ছিক)' : 'Supplier / Notes (Optional)'}
            </label>
            <input
              type="text"
              placeholder={isBn ? 'যেমন: ভাই ভাই ফিড স্টোর' : 'e.g. Bhai Bhai Feed Store'}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <CheckCircle2 size={16} />
              <span>
                {isSubmitting
                  ? isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'
                  : isBn ? 'খাদ্য স্টক যুক্ত করুন' : 'Add Feed Stock'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
