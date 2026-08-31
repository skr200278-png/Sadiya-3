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
  ArrowRight
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
    userSubscription
  } = useSystemConfig();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'farmer' | 'business' | 'contact'>('farmer');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  if (!subscriptionModal.isOpen) return null;

  const currentFeature = subscriptionModal.featureTitle || (language === 'bn' ? 'প্রিমিয়াম সেবা' : 'Premium Feature');

  const farmerPlans = plans.filter(p => p.type === 'farmer_premium' && p.isActive);
  const businessPlans = plans.filter(p => p.type === 'business_ad' && p.isActive);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
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

  const userPhone = currentUser?.phoneNumber || (currentUser?.email?.includes('@digitalfarm.app') ? currentUser.email.split('@')[0] : '');

  const defaultMsg = language === 'bn'
    ? `আসসালামু আলাইকুম। আমি ডিজিটাল খামার প্রো অ্যাপের "${selectedPlanName}" প্যাকেজটি সক্রিয় করতে চাই।${userPhone ? ` আমার মোবাইল নম্বর: ${userPhone}` : ''}`
    : `Hello, I want to activate the "${selectedPlanName}" package in Digital Khamar Pro.${userPhone ? ` My phone: ${userPhone}` : ''}`;

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

                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-[11px] text-slate-200 leading-relaxed">
                  <p className="font-semibold">
                    💡 <strong className="text-amber-300">{language === 'bn' ? 'সহজ নিয়ম:' : 'Simple Step:'}</strong> {language === 'bn' 
                      ? 'উপরের নম্বরে টাকা পাঠিয়ে সরাসরি নিচের হোয়াটসঅ্যাপ বা ফোন বাটনে ক্লিক করে অ্যাডমিনকে জানান। অ্যাডমিন সাথে সাথে আপনার অ্যাকাউন্টে প্রো সুবিধা সক্রিয় করে দিবেন।' 
                      : 'Send money to the numbers above and message the admin on WhatsApp or Call. Pro features will be activated immediately.'}
                  </p>
                </div>
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
                  <span>{language === 'bn' ? '💬 সরাসরি হোয়াটসঅ্যাপে অ্যাডমিনকে মেসেজ দিন' : 'Message Admin on WhatsApp'}</span>
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
