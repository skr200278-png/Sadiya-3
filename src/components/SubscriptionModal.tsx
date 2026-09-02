import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig, SubscriptionPlan } from '../contexts/SystemConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sparkles, 
  X, 
  MessageCircle, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  Crown,
  Building2,
  Copy,
  Check,
  CreditCard,
  Zap,
  ArrowRight,
  Landmark,
  Building,
  Globe,
  Send,
  Receipt,
  Clock,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionModal() {
  const { language } = useLanguage();
  const { 
    config, 
    subscriptionModal, 
    closeSubscriptionModal, 
    plans, 
    isPremium, 
    userSubscription,
    submitPaymentRequest
  } = useSystemConfig();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'farmer' | 'business' | 'contact'>('farmer');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // In-App TrxID Submission Form State
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [senderPhone, setSenderPhone] = useState<string>(() => {
    return currentUser?.phoneNumber || (currentUser?.email?.includes('@digitalfarm.app') ? currentUser.email.split('@')[0] : '') || '';
  });
  const [trxId, setTrxId] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<{ trxId: string; amount: number; method: string } | null>(null);

  if (!subscriptionModal.isOpen) return null;

  const currentFeature = subscriptionModal.featureTitle || (language === 'bn' ? 'প্রিমিয়াম সেবা' : 'Premium Feature');

  const farmerPlans = plans.filter(p => p.type === 'farmer_premium' && p.isActive);
  const businessPlans = plans.filter(p => p.type === 'business_ad' && p.isActive);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setCustomAmount(plan.price);
    setSubmittedData(null);
    setActiveTab('contact');
  };

  const handleCopyNumber = (num: string, label: string) => {
    navigator.clipboard.writeText(num);
    setCopiedAccount(label);
    toast.success(language === 'bn' ? `${label} নম্বর কপি হয়েছে!` : `${label} number copied!`);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  const paymentNumbers = config.paymentNumbers || {
    bkash: '01410991934',
    bkashType: 'personal',
    nagad: '01410991934',
    nagadType: 'personal',
    rocket: '01410991934',
    rocketType: 'personal'
  };

  const selectedPlanName = selectedPlan 
    ? (language === 'bn' ? selectedPlan.nameBn : selectedPlan.nameEn)
    : currentFeature;

  const finalAmount = customAmount !== '' ? Number(customAmount) : (selectedPlan?.price || config.subscriptionPrice || 50);

  const handleSubmitTrx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone.trim()) {
      toast.error(language === 'bn' ? 'প্রেরক মোবাইল বা অ্যাকাউন্ট নম্বর দিন' : 'Enter sender phone or account number');
      return;
    }
    if (!trxId.trim()) {
      toast.error(language === 'bn' ? 'ট্রানজেকশন আইডি (TrxID) দিন' : 'Enter Transaction ID (TrxID)');
      return;
    }

    setIsSubmitting(true);
    const success = await submitPaymentRequest({
      planId: selectedPlan?.id || 'standard_farmer_monthly',
      planTitle: selectedPlanName,
      planType: selectedPlan?.type || 'farmer_premium',
      amount: finalAmount,
      paymentMethod,
      senderPhone: senderPhone.trim(),
      trxId: trxId.trim().toUpperCase(),
      userName: currentUser?.displayName || (language === 'bn' ? 'খামারি' : 'Farmer'),
      userPhone: senderPhone.trim()
    });

    setIsSubmitting(false);

    if (success) {
      setSubmittedData({
        trxId: trxId.trim().toUpperCase(),
        amount: finalAmount,
        method: paymentMethod
      });
      setTrxId('');
    }
  };

  const userPhone = senderPhone || currentUser?.phoneNumber || (currentUser?.email?.includes('@digitalfarm.app') ? currentUser.email.split('@')[0] : '');

  const defaultMsg = language === 'bn'
    ? `আসসালামু আলাইকুম। আমি ডিজিটাল খামার প্রো অ্যাপের "${selectedPlanName}" প্যাকেজের জন্য ${paymentMethod.toUpperCase()}-এ ৳${finalAmount} পাঠিয়েছি।${submittedData ? ` TrxID: ${submittedData.trxId},` : ''}${userPhone ? ` আমার মোবাইল: ${userPhone}` : ''}। অনুগ্রহ করে প্রো সুবিধা সক্রিয় করে দিন।`
    : `Hello, I sent ৳${finalAmount} via ${paymentMethod.toUpperCase()} for "${selectedPlanName}" package in Digital Khamar Pro.${submittedData ? ` TrxID: ${submittedData.trxId},` : ''}${userPhone ? ` Phone: ${userPhone}` : ''}. Please activate Pro.`;

  const cleanAdminWa = (config.adminWhatsApp || '01410991934').replace(/[^0-9]/g, '');
  const finalWaNumber = cleanAdminWa.startsWith('88') ? cleanAdminWa : `88${cleanAdminWa}`;
  const waUrl = `https://wa.me/${finalWaNumber}?text=${encodeURIComponent(defaultMsg)}`;
  const phoneCallUrl = `tel:${config.adminPhone || '01410991934'}`;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header with Gradient */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 p-4 sm:p-5 text-center relative text-white shrink-0">
          <button 
            type="button"
            onClick={closeSubscriptionModal}
            className="absolute top-3 right-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center justify-center gap-1.5 bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 shadow-xs">
            <Crown size={13} className="text-slate-950" />
            <span>{language === 'bn' ? 'ডিজিটাল খামার প্রো প্রিমিয়াম ও সুবিধা' : 'DIGITAL KHAMAR PRO PACKAGES'}</span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white leading-tight">
            {currentFeature}
          </h3>
          <p className="text-emerald-200 text-xs font-bold mt-1">
            {language === 'bn' 
              ? 'প্যাকেজ বেছে নিয়ে অ্যাডমিনের সাথে যোগাযোগ করে সরাসরি এক্সেস চালু করুন' 
              : 'Choose a package & contact the admin for direct activation'}
          </p>

          {/* Active Status Badge if User is already Premium */}
          {isPremium && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 px-3 py-1 rounded-xl text-xs font-black">
              <Sparkles size={13} className="text-amber-300" />
              <span>
                {language === 'bn' 
                  ? `💎 আপনার অ্যাকাউন্টে ভিআইপি অ্যাক্সেস সক্রিয় আছে${userSubscription?.isLifetime ? ' (আজীবন)' : userSubscription?.expiresAt ? ` (মেয়াদ: ${new Date(userSubscription.expiresAt).toLocaleDateString('bn-BD')})` : ''}` 
                  : `💎 Active VIP Member${userSubscription?.isLifetime ? ' (Lifetime)' : ''}`}
              </span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('farmer')}
            className={`flex-1 py-2.5 px-2 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'farmer'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Crown size={14} className={activeTab === 'farmer' ? 'text-amber-500' : ''} />
            <span>{language === 'bn' ? '১. খামারি প্রিমিয়াম' : '1. Farm Premium'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`flex-1 py-2.5 px-2 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'business'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 size={14} className={activeTab === 'business' ? 'text-indigo-600' : ''} />
            <span>{language === 'bn' ? '২. দোকান ও বিজ্ঞাপন' : '2. Business & Ads'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-2.5 px-2 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'contact'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageCircle size={14} className={activeTab === 'contact' ? 'text-emerald-600' : ''} />
            <span>{language === 'bn' ? '৩. অ্যাডমিন যোগাযোগ' : '3. Contact Admin'}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* TAB 1: FARMER PREMIUM PLANS */}
          {activeTab === 'farmer' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>{language === 'bn' ? 'খামারিদের জন্য সুবিধাজনক প্যাকেজসমূহ:' : 'Select a Farmer VIP Plan:'}</span>
                </h4>
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {language === 'bn' ? 'এককালীন ফি' : 'One-time Fee'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {farmerPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-2xl p-3.5 border-2 transition-all flex flex-col justify-between relative cursor-pointer ${
                      selectedPlan?.id === plan.id
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-emerald-300 bg-white'
                    }`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.isPopular && (
                      <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                        {language === 'bn' ? '🔥 জনপ্রিয় অফার' : '🔥 Popular'}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="text-xs font-black text-slate-900">{language === 'bn' ? plan.nameBn : plan.nameEn}</h5>
                        <span className="text-[9.5px] font-extrabold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {language === 'bn' ? plan.durationLabelBn : plan.durationLabelEn}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5 my-2">
                        <span className="text-xl font-black text-slate-950 font-sans">৳{plan.price}</span>
                        {plan.originalPrice && (
                          <span className="text-xs font-bold text-slate-400 line-through">৳{plan.originalPrice}</span>
                        )}
                        {plan.originalPrice && (
                          <span className="text-[9px] font-black bg-red-100 text-red-700 px-1 rounded">
                            {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}% {language === 'bn' ? 'ছাড়' : 'OFF'}
                          </span>
                        )}
                      </div>

                      <ul className="space-y-1 my-2">
                        {(language === 'bn' ? plan.featuresBn : plan.featuresEn).map((f, fIdx) => (
                          <li key={fIdx} className="text-[10px] text-slate-600 font-bold flex items-start gap-1 leading-tight">
                            <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan);
                      }}
                      className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-98 cursor-pointer"
                    >
                      <span>{language === 'bn' ? 'অ্যাক্টিভেট করতে যোগাযোগ করুন' : 'Contact to Activate'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: BUSINESS & SPONSOR ADS */}
          {activeTab === 'business' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-3">
                <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                  <Building2 size={15} className="text-indigo-600" />
                  <span>{language === 'bn' ? 'ফিড/ঔষধ দোকান, ডাক্তার ও কোম্পানি বিজ্ঞাপন' : 'Store, Doctor & Company Sponsorship'}</span>
                </h4>
                <p className="text-[10.5px] text-indigo-900 font-medium mt-1 leading-snug">
                  {language === 'bn' 
                    ? 'বাংলাদেশের হাজার হাজার খামারির কাছে আপনার দোকান, ভেটেরিনারি সেবা অথবা ফিড/ঔষধ কোম্পানির নির্ভরযোগ্য বিজ্ঞাপন প্রচার করুন।' 
                    : 'Promote your store, clinic or company directly to farmers across Bangladesh.'}
                </p>
              </div>

              <div className="space-y-2.5">
                {businessPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-xs font-black text-slate-900">{language === 'bn' ? plan.nameBn : plan.nameEn}</h5>
                        <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">
                          {language === 'bn' ? plan.durationLabelBn : plan.durationLabelEn}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-slate-900 font-sans">৳{plan.price}</span>
                        {plan.originalPrice && (
                          <span className="text-xs font-bold text-slate-400 line-through">৳{plan.originalPrice}</span>
                        )}
                      </div>
                      <ul className="space-y-0.5">
                        {(language === 'bn' ? plan.featuresBn : plan.featuresEn).map((f, fIdx) => (
                          <li key={fIdx} className="text-[10px] text-slate-600 font-bold flex items-start gap-1 leading-tight">
                            <CheckCircle2 size={11} className="text-indigo-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan)}
                      className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                    >
                      <Zap size={13} />
                      <span>{language === 'bn' ? 'যোগাযোগ করুন' : 'Contact'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT CONTACT WITH ADMIN & PAYMENT NUMBERS */}
          {activeTab === 'contact' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* Selected Plan Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black text-emerald-800 uppercase">
                    {language === 'bn' ? 'নির্বাচিত প্যাকেজ:' : 'Selected Plan:'}
                  </span>
                  <p className="text-xs font-black text-emerald-950">
                    {selectedPlan ? (language === 'bn' ? selectedPlan.nameBn : selectedPlan.nameEn) : (language === 'bn' ? 'ডিজিটাল খামার প্রো প্রিমিয়াম প্যাকেজ' : 'Digital Khamar Pro Premium Plan')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-900 font-sans">
                    ৳{selectedPlan ? selectedPlan.price : (config.subscriptionPrice || 50)}
                  </span>
                </div>
              </div>

              {/* Payment Account Details with 1-Click Copy */}
              <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                    <CreditCard size={14} />
                    <span>{language === 'bn' ? 'অফিসিয়াল পেমেন্ট নম্বরসমূহ:' : 'Official Payment Numbers:'}</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold">
                    {language === 'bn' ? 'ক্লিক করে নম্বর কপি করুন' : 'Tap to copy'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* bKash */}
                  <div 
                    onClick={() => handleCopyNumber(paymentNumbers.bkash, 'বিকাশ')}
                    className="bg-white/10 hover:bg-white/15 border border-pink-500/40 rounded-xl p-2 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-pink-400">bKash</span>
                        <span className="text-[8px] text-slate-300 bg-white/10 px-1 rounded uppercase font-bold">
                          {paymentNumbers.bkashType || 'Personal'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white font-sans mt-0.5">{paymentNumbers.bkash}</p>
                    </div>
                    {copiedAccount === 'বিকাশ' ? <Check size={14} className="text-emerald-400" /> : <Copy size={13} className="text-slate-400" />}
                  </div>

                  {/* Nagad */}
                  <div 
                    onClick={() => handleCopyNumber(paymentNumbers.nagad, 'নগদ')}
                    className="bg-white/10 hover:bg-white/15 border border-orange-500/40 rounded-xl p-2 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-orange-400">Nagad</span>
                        <span className="text-[8px] text-slate-300 bg-white/10 px-1 rounded uppercase font-bold">
                          {paymentNumbers.nagadType || 'Personal'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white font-sans mt-0.5">{paymentNumbers.nagad}</p>
                    </div>
                    {copiedAccount === 'নগদ' ? <Check size={14} className="text-emerald-400" /> : <Copy size={13} className="text-slate-400" />}
                  </div>

                  {/* Rocket */}
                  <div 
                    onClick={() => handleCopyNumber(paymentNumbers.rocket, 'রকেট')}
                    className="bg-white/10 hover:bg-white/15 border border-purple-500/40 rounded-xl p-2 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-purple-400">Rocket</span>
                        <span className="text-[8px] text-slate-300 bg-white/10 px-1 rounded uppercase font-bold">
                          {paymentNumbers.rocketType || 'Personal'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white font-sans mt-0.5">{paymentNumbers.rocket}</p>
                    </div>
                    {copiedAccount === 'রকেট' ? <Check size={14} className="text-emerald-400" /> : <Copy size={13} className="text-slate-400" />}
                  </div>
                </div>

                {/* Bank Account / International Transfer Section */}
                {paymentNumbers.bankAccountNumber && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-blue-300 flex items-center gap-1">
                        <Landmark size={13} />
                        <span>{language === 'bn' ? 'ব্যাংক ট্রান্সফার / প্রবাসী পেমেন্ট (Bank & Wire):' : 'Bank Transfer & Wire (Global):'}</span>
                      </span>
                      <span className="text-[8px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded font-bold uppercase">
                        Global / Play Store
                      </span>
                    </div>

                    <div className="bg-white/5 border border-blue-500/30 rounded-xl p-2.5 space-y-1.5 text-[11px]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {paymentNumbers.bankName && (
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">{language === 'bn' ? 'ব্যাংক নাম:' : 'Bank Name:'}</span>
                            <span className="font-bold text-white text-[11px]">{paymentNumbers.bankName}</span>
                          </div>
                        )}
                        {paymentNumbers.bankAccountName && (
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">{language === 'bn' ? 'অ্যাকাউন্ট নাম:' : 'Account Name:'}</span>
                            <span className="font-bold text-amber-200 text-[11px]">{paymentNumbers.bankAccountName}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5">
                        <div 
                          onClick={() => handleCopyNumber(paymentNumbers.bankAccountNumber!, 'ব্যাংক একাউন্ট নম্বর')}
                          className="bg-slate-950/60 hover:bg-slate-950 p-1.5 rounded-lg border border-slate-700 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="text-[8px] text-slate-400 block font-semibold">{language === 'bn' ? 'একাউন্ট নম্বর (ট্যাপ করে কপি করুন):' : 'Account No (Tap to copy):'}</span>
                            <span className="font-mono font-bold text-emerald-400 text-xs">{paymentNumbers.bankAccountNumber}</span>
                          </div>
                          {copiedAccount === 'ব্যাংক একাউন্ট নম্বর' ? <Check size={13} className="text-emerald-400 shrink-0" /> : <Copy size={12} className="text-slate-400 shrink-0" />}
                        </div>

                        {paymentNumbers.bankBranch && (
                          <div className="p-1.5">
                            <span className="text-[8px] text-slate-400 block font-semibold">{language === 'bn' ? 'শাখা / ব্রাঞ্চ:' : 'Branch:'}</span>
                            <span className="font-medium text-slate-200 text-[11px]">{paymentNumbers.bankBranch}</span>
                          </div>
                        )}
                      </div>

                      {(paymentNumbers.bankRoutingNumber || paymentNumbers.bankSwiftCode) && (
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[10px]">
                          {paymentNumbers.bankRoutingNumber && (
                            <div 
                              onClick={() => handleCopyNumber(paymentNumbers.bankRoutingNumber!, 'রাউটিং নম্বর')}
                              className="bg-slate-950/40 hover:bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 cursor-pointer flex items-center justify-between"
                            >
                              <div>
                                <span className="text-[8px] text-slate-400 block font-semibold">Routing:</span>
                                <span className="font-mono font-bold text-slate-200">{paymentNumbers.bankRoutingNumber}</span>
                              </div>
                              {copiedAccount === 'রাউটিং নম্বর' ? <Check size={11} className="text-emerald-400 shrink-0" /> : <Copy size={11} className="text-slate-400 shrink-0" />}
                            </div>
                          )}
                          {paymentNumbers.bankSwiftCode && (
                            <div 
                              onClick={() => handleCopyNumber(paymentNumbers.bankSwiftCode!, 'SWIFT কোড')}
                              className="bg-slate-950/40 hover:bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 cursor-pointer flex items-center justify-between"
                            >
                              <div>
                                <span className="text-[8px] text-slate-400 block font-semibold">SWIFT/BIC:</span>
                                <span className="font-mono font-bold text-amber-300 uppercase">{paymentNumbers.bankSwiftCode}</span>
                              </div>
                              {copiedAccount === 'SWIFT কোড' ? <Check size={11} className="text-emerald-400 shrink-0" /> : <Copy size={11} className="text-slate-400 shrink-0" />}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[11px] text-slate-200 leading-relaxed">
                  <p className="font-semibold">
                    💡 <strong className="text-amber-300">{language === 'bn' ? 'সহজ নিয়ম:' : 'Simple Step:'}</strong> {language === 'bn' 
                      ? 'উপরের নম্বরে টাকা পাঠিয়ে নিচে ট্রানজেকশন আইডি (TrxID) সাবমিট করুন অথবা সরাসরি হোয়াটসঅ্যাপে জানান। অ্যাডমিন যাচাই করে সাথে সাথে প্রো সুবিধা চালু করে দিবেন।' 
                      : 'Send money to the numbers above and submit your TrxID below or message on WhatsApp. Pro features will be activated immediately.'}
                  </p>
                </div>
              </div>

              {/* IN-APP TRANSACTION ID (TrxID) & PAYMENT REQUEST SUBMISSION FORM */}
              <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-xl text-white space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                        <span>{language === 'bn' ? 'টাকা পাঠিয়েছেন? TrxID সাবমিট করুন' : 'Sent Payment? Submit TrxID'}</span>
                        <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase">Instant Sync</span>
                      </h4>
                      <p className="text-[10px] text-emerald-200/80 font-medium">
                        {language === 'bn' ? 'ফর্মটি পূরণ করলে রিকোয়েস্ট সরাসরি অ্যাডমিন প্যানেলে জমা হবে' : 'Submitting this form sends your request directly to the admin'}
                      </p>
                    </div>
                  </div>
                </div>

                {submittedData ? (
                  /* Success State Alert */
                  <div className="bg-emerald-500/20 border border-emerald-400/60 rounded-2xl p-3.5 space-y-2.5 animate-in zoom-in-95">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-black text-emerald-300">
                          {language === 'bn' ? '🎉 পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে!' : '🎉 Payment Request Submitted!'}
                        </h5>
                        <p className="text-[11px] text-slate-200 mt-1 leading-relaxed">
                          {language === 'bn' 
                            ? `আপনার ট্রানজেকশন আইডি (${submittedData.trxId}) অ্যাডমিনের প্যানেলে পৌঁছে গেছে। অ্যাডমিন যাচাই করে দ্রুত আপনার প্রো এক্সেস চালু করে দিবেন।` 
                            : `Your TrxID (${submittedData.trxId}) has been sent to the admin. It will be verified and activated shortly.`}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-500/30 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                        <Clock size={12} />
                        <span>{language === 'bn' ? 'স্ট্যাটাস: পেন্ডিং (অপেক্ষমাণ)' : 'Status: Pending Approval'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSubmittedData(null)}
                        className="text-[10px] text-emerald-300 hover:text-white underline font-bold cursor-pointer"
                      >
                        {language === 'bn' ? 'আরেকটি রিকোয়েস্ট দিন' : 'Submit another'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form Inputs */
                  <form onSubmit={handleSubmitTrx} className="space-y-3">
                    
                    {/* Method Selection Chips */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                        {language === 'bn' ? '১. কোন মাধ্যমে টাকা পাঠিয়েছেন?' : '1. Payment Method:'}
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bkash')}
                          className={`py-1.5 px-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer text-center ${
                            paymentMethod === 'bkash'
                              ? 'bg-pink-600 border-pink-400 text-white shadow-xs'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-pink-500'
                          }`}
                        >
                          bKash
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('nagad')}
                          className={`py-1.5 px-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer text-center ${
                            paymentMethod === 'nagad'
                              ? 'bg-orange-600 border-orange-400 text-white shadow-xs'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-orange-500'
                          }`}
                        >
                          Nagad
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('rocket')}
                          className={`py-1.5 px-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer text-center ${
                            paymentMethod === 'rocket'
                              ? 'bg-purple-600 border-purple-400 text-white shadow-xs'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-purple-500'
                          }`}
                        >
                          Rocket
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bank')}
                          className={`py-1.5 px-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer text-center ${
                            paymentMethod === 'bank'
                              ? 'bg-blue-600 border-blue-400 text-white shadow-xs'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-blue-500'
                          }`}
                        >
                          {language === 'bn' ? 'ব্যাংক' : 'Bank'}
                        </button>
                      </div>
                    </div>

                    {/* Sender Phone & Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          {language === 'bn' ? '২. প্রেরক নম্বর / একাউন্ট:' : '2. Sender Phone / Account:'}
                        </label>
                        <input
                          type="text"
                          required
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs font-bold text-white font-mono focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          {language === 'bn' ? '৩. টাকার পরিমাণ (৳):' : '3. Amount Paid (৳):'}
                        </label>
                        <input
                          type="number"
                          required
                          value={customAmount !== '' ? customAmount : finalAmount}
                          onChange={(e) => setCustomAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="50"
                          className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs font-bold text-white font-mono focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                    </div>

                    {/* Transaction ID (TrxID) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                        <span>{language === 'bn' ? '৪. ট্রানজেকশন আইডি (TrxID) / রেফারেন্স:' : '4. Transaction ID (TrxID) / Ref:'}</span>
                        <span className="text-[9px] text-amber-300 font-normal">
                          {language === 'bn' ? 'মেসেজ বা স্লিপ থেকে দেখে লিখুন' : 'From SMS or receipt'}
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        placeholder="যেমন: 9J3K8L2M বা Dep-1029"
                        className="w-full px-3 py-2.5 bg-slate-950 border-2 border-amber-400/60 rounded-xl text-xs font-black text-amber-300 font-mono tracking-wider uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 hover:shadow-xl transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      <span>
                        {isSubmitting 
                          ? (language === 'bn' ? 'রিকোয়েস্ট পাঠানো হচ্ছে...' : 'Submitting...') 
                          : (language === 'bn' ? '🚀 পেমেন্ট রিকোয়েস্ট সাবমিট করুন' : '🚀 Submit Payment Request')}
                      </span>
                    </button>
                  </form>
                )}
              </div>

              {/* Direct 1-Click WhatsApp & Phone Call Action Buttons */}
              <div className="space-y-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
                >
                  <MessageCircle size={18} className="text-emerald-100" />
                  <span>
                    {submittedData
                      ? (language === 'bn' ? '💬 হোয়াটসঅ্যাপে TrxID জানিয়ে দ্রুত চালু করুন' : 'Notify Admin on WhatsApp with TrxID')
                      : (language === 'bn' ? '💬 সরাসরি হোয়াটসঅ্যাপে অ্যাডমিনকে মেসেজ দিন' : 'Message Admin on WhatsApp')}
                  </span>
                </a>

                <a
                  href={phoneCallUrl}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  <Phone size={15} className="text-amber-400" />
                  <span>{language === 'bn' ? `📞 সরাসরি ফোন কল করুন: ${config.adminPhone || '01410991934'}` : `Call Admin: ${config.adminPhone || '01410991934'}`}</span>
                </a>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-center space-y-0.5">
                <p className="text-xs font-black text-slate-800">
                  {config.adminName || 'আবু সুফিয়ান'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {language === 'bn' ? 'ফাউন্ডার ও সফটওয়্যার ইঞ্জিনিয়ার, ডিজিটাল খামার প্রো' : 'Founder & Software Engineer, Digital Khamar Pro'}
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>{language === 'bn' ? '১০০% নিরাপদ ও সরাসরি অ্যাডমিন সহায়তা' : '100% Secure & Direct Admin Support'}</span>
          </div>

          <button
            type="button"
            onClick={closeSubscriptionModal}
            className="py-1 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-xl transition-colors cursor-pointer"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
