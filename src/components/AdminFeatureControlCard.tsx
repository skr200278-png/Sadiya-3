import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig, FeatureControls, SubscriptionPlan } from '../contexts/SystemConfigContext';
import { 
  Crown, 
  Settings2, 
  Lock, 
  Unlock, 
  Users, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  Save,
  Phone,
  Sparkles,
  Edit3,
  Sliders,
  UserCheck,
  CreditCard,
  XCircle,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFeatureControlCard() {
  const { language } = useLanguage();
  const { 
    config, 
    isAdmin, 
    updateConfig, 
    plans,
    grantUserSubscription,
    revokeUserSubscription,
    saveSubscriptionPlan,
    deleteSubscriptionPlan
  } = useSystemConfig();
  
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'users' | 'master' | 'plans' | 'accounts'>('users');

  // Whitelist Form State
  const [newWhitelistInput, setNewWhitelistInput] = useState<string>('');
  const [whitelistDuration, setWhitelistDuration] = useState<number>(30); // 30, 90, 180, 365, 99999
  
  // Payment Accounts Form State
  const [bkashNum, setBkashNum] = useState(config.paymentNumbers?.bkash || '01410991934');
  const [bkashType, setBkashType] = useState<'personal' | 'merchant' | 'agent'>(config.paymentNumbers?.bkashType || 'personal');
  const [nagadNum, setNagadNum] = useState(config.paymentNumbers?.nagad || '01410991934');
  const [nagadType, setNagadType] = useState<'personal' | 'merchant'>(config.paymentNumbers?.nagadType || 'personal');
  const [rocketNum, setRocketNum] = useState(config.paymentNumbers?.rocket || '01410991934');
  const [rocketType, setRocketType] = useState<'personal' | 'merchant'>(config.paymentNumbers?.rocketType || 'personal');
  const [adminPhoneInput, setAdminPhoneInput] = useState(config.adminPhone || '01410991934');
  const [adminWaInput, setAdminWaInput] = useState(config.adminWhatsApp || '8801410991934');

  // Plan Edit / Add Modal State
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planNameBn, setPlanNameBn] = useState('');
  const [planNameEn, setPlanNameEn] = useState('');
  const [planType, setPlanType] = useState<'farmer_premium' | 'business_ad'>('farmer_premium');
  const [planPrice, setPlanPrice] = useState<number>(50);
  const [planOriginalPrice, setPlanOriginalPrice] = useState<number>(150);
  const [planDurationDays, setPlanDurationDays] = useState<number>(30);
  const [planDurationLabelBn, setPlanDurationLabelBn] = useState('১ মাস (৩০ দিন)');
  const [planDurationLabelEn, setPlanDurationLabelEn] = useState('1 Month (30 Days)');
  const [planFeaturesBn, setPlanFeaturesBn] = useState('');

  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isAdmin) return null;

  const handleToggle = async (key: keyof FeatureControls) => {
    setIsSaving(true);
    const currentValue = Boolean(config[key]);
    await updateConfig({ [key]: !currentValue });
    setIsSaving(false);
  };

  const handleSaveAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateConfig({
      adminPhone: adminPhoneInput.trim(),
      adminWhatsApp: adminWaInput.trim(),
      paymentNumbers: {
        ...config.paymentNumbers,
        bkash: bkashNum.trim(),
        bkashType,
        nagad: nagadNum.trim(),
        nagadType,
        rocket: rocketNum.trim(),
        rocketType
      }
    });
    setIsSaving(false);
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhitelistInput.trim()) return;
    setIsSaving(true);
    const isLifetime = whitelistDuration >= 9999;
    await grantUserSubscription(newWhitelistInput.trim(), 'manual_admin', whitelistDuration, isLifetime);
    setNewWhitelistInput('');
    setIsSaving(false);
  };

  const handleRemoveWhitelist = async (id: string) => {
    setIsSaving(true);
    await revokeUserSubscription(id);
    setIsSaving(false);
  };

  const handleOpenPlanModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanNameBn(plan.nameBn);
      setPlanNameEn(plan.nameEn);
      setPlanType(plan.type);
      setPlanPrice(plan.price);
      setPlanOriginalPrice(plan.originalPrice || plan.price * 2);
      setPlanDurationDays(plan.durationDays);
      setPlanDurationLabelBn(plan.durationLabelBn);
      setPlanDurationLabelEn(plan.durationLabelEn);
      setPlanFeaturesBn(plan.featuresBn.join(', '));
    } else {
      setEditingPlan(null);
      setPlanNameBn('');
      setPlanNameEn('');
      setPlanType('farmer_premium');
      setPlanPrice(50);
      setPlanOriginalPrice(150);
      setPlanDurationDays(30);
      setPlanDurationLabelBn('১ মাস (৩০ দিন)');
      setPlanDurationLabelEn('1 Month (30 Days)');
      setPlanFeaturesBn('সকল প্রিমিয়াম ফিচার, এক্সেল/পিডিএফ রিপোর্ট, বকেয়া খাতা');
    }
    setShowPlanModal(true);
  };

  const handleSavePlanForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planNameBn.trim()) {
      toast.error('প্ল্যানের নাম দিন');
      return;
    }

    setIsSaving(true);
    const planToSave: SubscriptionPlan = {
      id: editingPlan?.id || `plan_${Date.now()}`,
      nameBn: planNameBn.trim(),
      nameEn: planNameEn.trim() || planNameBn.trim(),
      type: planType,
      price: Number(planPrice),
      originalPrice: Number(planOriginalPrice),
      durationDays: Number(planDurationDays),
      durationLabelBn: planDurationLabelBn.trim(),
      durationLabelEn: planDurationLabelEn.trim(),
      featuresBn: planFeaturesBn.split(',').map(f => f.trim()).filter(Boolean),
      featuresEn: [planNameEn || planNameBn],
      isActive: true,
      isPopular: editingPlan?.isPopular || false
    };

    await saveSubscriptionPlan(planToSave);
    setIsSaving(false);
    setShowPlanModal(false);
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-600/15 border-2 border-amber-500/40 rounded-2xl p-3.5 text-amber-950 shadow-xs">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Crown size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs font-black text-amber-950">
                {language === 'bn' ? 'মাস্টার অ্যাডমিন কন্ট্রোল ও ভিআইপি প্যানেল' : 'Master Monetization Admin Panel'}
              </h3>
              <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase shadow-2xs">
                MASTER ADMIN
              </span>
            </div>
            <p className="text-[10px] text-amber-800 font-bold truncate">
              {language === 'bn' 
                ? 'ইউজারদের সরাসরি ভিআইপি অ্যাক্টিভেশন, প্যাকেজ মূল্য ও ফিচার লক কন্ট্রোল করুন' 
                : 'Directly manage VIP activations, pricing & feature switches'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="py-1 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 rounded-xl text-xs font-black flex items-center gap-1 transition-colors cursor-pointer shrink-0"
        >
          <span>{isExpanded ? (language === 'bn' ? 'লুকান' : 'Hide') : (language === 'bn' ? 'কন্ট্রোল প্যানেল' : 'Manage')}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded Control Section */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-3.5 animate-in fade-in duration-150">
          
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`py-1.5 px-2.5 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                activeTab === 'users'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white/80 text-amber-950 hover:bg-white'
              }`}
            >
              <Users size={13} />
              <span>{language === 'bn' ? 'ভিআইপি মেম্বার অ্যাক্টিভেশন' : 'VIP Whitelist'}</span>
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1 rounded-full">
                {config.whitelistedUsers?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('master')}
              className={`py-1.5 px-2.5 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                activeTab === 'master'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white/80 text-amber-950 hover:bg-white'
              }`}
            >
              <Sliders size={13} />
              <span>{language === 'bn' ? 'ফিচার সুইচ ও লক' : 'Feature Switches'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('plans')}
              className={`py-1.5 px-2.5 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                activeTab === 'plans'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white/80 text-amber-950 hover:bg-white'
              }`}
            >
              <Sparkles size={13} />
              <span>{language === 'bn' ? 'প্যাকেজ ও মূল্য' : 'Plans & Pricing'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`py-1.5 px-2.5 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                activeTab === 'accounts'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white/80 text-amber-950 hover:bg-white'
              }`}
            >
              <Phone size={13} />
              <span>{language === 'bn' ? 'বিকাশ/নগদ ও হেল্পলাইন' : 'Accounts & Helpline'}</span>
            </button>
          </div>

          {/* TAB 1: VIP ACTIVATION & WHITELIST USER MANAGER */}
          {activeTab === 'users' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="bg-white/80 rounded-xl p-3 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Users size={14} className="text-indigo-600" />
                    <span>{language === 'bn' ? 'ইউজারকে সরাসরি ভিআইপি অ্যাক্টিভেশন দিন:' : 'Grant Direct VIP Access to User:'}</span>
                  </h4>
                  <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-sans">
                    মোট {config.whitelistedUsers?.length || 0} জন
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-600 font-bold leading-tight">
                  {language === 'bn'
                    ? 'ইউজার পেমেন্ট করে আপনাকে ফোন বা হোয়াটসঅ্যাপে জানালে, তার মোবাইল নম্বর (যেমন: 017xxxxxxxx) বা ইমেইল লিখুন এবং মেয়াদ সিলেক্ট করে অ্যাড করুন। সাথে সাথে তার প্রো আনলক হয়ে যাবে।'
                    : 'Enter customer phone or email and select duration to instantly activate VIP Pro.'}
                </p>

                <form onSubmit={handleAddWhitelist} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWhitelistInput}
                      onChange={(e) => setNewWhitelistInput(e.target.value)}
                      placeholder="মোবাইল নম্বর (017...) বা জিমেইল লিখুন..."
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-sans"
                    />

                    <select
                      value={whitelistDuration}
                      onChange={(e) => setWhitelistDuration(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-850"
                    >
                      <option value={30}>৩০ দিন</option>
                      <option value={90}>৩ মাস</option>
                      <option value={180}>৬ মাস</option>
                      <option value={365}>১ বছর</option>
                      <option value={99999}>আজীবন (Lifetime)</option>
                    </select>

                    <button
                      type="submit"
                      disabled={isSaving || !newWhitelistInput.trim()}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                    >
                      <Plus size={14} />
                      <span>{language === 'bn' ? 'সক্রিয় করুন' : 'Activate'}</span>
                    </button>
                  </div>
                </form>

                {/* Whitelist Tags */}
                {config.whitelistedUsers && config.whitelistedUsers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {config.whitelistedUsers.map((userIdent) => (
                      <span
                        key={userIdent}
                        className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg shadow-2xs"
                      >
                        <UserCheck size={11} className="text-emerald-600" />
                        <span className="font-mono">{userIdent}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveWhitelist(userIdent)}
                          className="text-red-500 hover:text-red-700 p-0.5 hover:bg-red-50 rounded cursor-pointer ml-1"
                          title="Remove VIP"
                        >
                          <Trash2 size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic pt-1">
                    {language === 'bn' ? 'কোনো নির্দিষ্ট ইউজার এখনও যুক্ত করা হয়নি।' : 'No individual users whitelisted yet.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MASTER GLOBAL TOGGLE & FEATURE SWITCHES */}
          {activeTab === 'master' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              
              {/* Master Global Monetization On/Off Switch */}
              <div className="bg-gradient-to-r from-emerald-600/15 via-teal-600/15 to-emerald-700/15 border-2 border-emerald-500/80 rounded-2xl p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-emerald-950">
                        {language === 'bn' ? '👑 মাস্টার মনেটাইজেশন সুইচ (Global Switch)' : '👑 Master Monetization Switch'}
                      </span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                        config.monetizationEnabled !== false ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'
                      }`}>
                        {config.monetizationEnabled !== false ? 'MONETIZATION ON' : '100% FREE MODE'}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-700 font-bold leading-tight">
                      {language === 'bn'
                        ? 'এটি বন্ধ (OFF) করলে সম্পূর্ণ অ্যাপে কোনো লক বা সাবস্ক্রিপশন থাকবে না—সব ইউজারের জন্য সবকিছু সম্পূর্ণ ফ্রি হয়ে যাবে। আবার অন করলে নির্ধারিত ফিচার লক কাজ করবে।'
                        : 'When turned OFF, the entire app becomes 100% FREE for all users without any restriction.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle('monetizationEnabled')}
                    disabled={isSaving}
                    className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all shadow-xs ${
                      config.monetizationEnabled !== false 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {config.monetizationEnabled !== false ? <ShieldCheck size={14} /> : <Unlock size={14} />}
                    <span>
                      {config.monetizationEnabled !== false 
                        ? (language === 'bn' ? 'মনেটাইজেশন চালু' : 'Monetization ON') 
                        : (language === 'bn' ? 'সবকিছু ১০০% ফ্রি' : 'All Free Mode')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Master Global App Lock */}
              <div className="bg-gradient-to-r from-red-600/10 via-amber-600/10 to-orange-600/10 border border-red-400/80 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-red-950">
                        {language === 'bn' ? '🔒 সম্পূর্ণ অ্যাপ লক (সাবস্ক্রিপশন বাধ্যতামূলক)' : '🔒 Global App Lock (Subscription Required)'}
                      </span>
                      <span className="bg-red-600 text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                        PRO
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-700 font-bold leading-tight">
                      {language === 'bn'
                        ? 'এটি অন করলে শুধু ভিআইপি ও অনুমোদিত ইউজাররা অ্যাপ ব্যবহার করতে পারবেন।'
                        : 'When enabled, only whitelisted VIP users can use the app tools.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle('appLockRequired')}
                    disabled={isSaving}
                    className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                      config.appLockRequired 
                        ? 'bg-red-600 text-white shadow-xs' 
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {config.appLockRequired ? <Lock size={12} /> : <Unlock size={12} />}
                    <span>
                      {config.appLockRequired 
                        ? (language === 'bn' ? 'সম্পূর্ণ অ্যাপ লক' : 'App Locked') 
                        : (language === 'bn' ? 'উন্মুক্ত' : 'Open')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Individual Feature Switches */}
              <div className="bg-white/80 rounded-xl p-3 border border-amber-200/80 space-y-2">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Settings2 size={14} className="text-amber-600" />
                  <span>{language === 'bn' ? 'নির্দিষ্ট ফিচার অ্যাক্সেস সুইচ (ফ্রি / লক)' : 'Feature Access Switches'}</span>
                </h4>

                <div className="space-y-2 text-xs">
                  {/* 1. Marketplace Post */}
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <p className="font-extrabold text-slate-850">
                        {language === 'bn' ? '১. মার্কেটপ্লেসে ক্রয়-বিক্রয় বিজ্ঞাপন পোস্ট' : '1. Marketplace Ad Posting'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {config.marketplacePostFree ? (language === 'bn' ? 'সবার জন্য ফ্রি' : 'Free for all') : (language === 'bn' ? 'লকড (ভিআইপি প্রয়োজন)' : 'Locked / VIP')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('marketplacePostFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.marketplacePostFree 
                          ? 'bg-emerald-600 text-white shadow-2xs' 
                          : 'bg-red-600 text-white shadow-2xs'
                      }`}
                    >
                      {config.marketplacePostFree ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.marketplacePostFree ? (language === 'bn' ? 'ফ্রি' : 'Free') : (language === 'bn' ? 'লকড' : 'Locked')}</span>
                    </button>
                  </div>

                  {/* 2. Marketplace Buyer Directory */}
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <p className="font-extrabold text-slate-850">
                        {language === 'bn' ? '২. পাইকারি ক্রেতা হিসেবে যুক্ত হওয়া' : '2. Join as Wholesale Buyer'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {config.marketplaceBuyerFree ? (language === 'bn' ? 'সবার জন্য ফ্রি' : 'Free for all') : (language === 'bn' ? 'লকড (ভিআইপি প্রয়োজন)' : 'Locked / VIP')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('marketplaceBuyerFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.marketplaceBuyerFree 
                          ? 'bg-emerald-600 text-white shadow-2xs' 
                          : 'bg-red-600 text-white shadow-2xs'
                      }`}
                    >
                      {config.marketplaceBuyerFree ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.marketplaceBuyerFree ? (language === 'bn' ? 'ফ্রি' : 'Free') : (language === 'bn' ? 'লকড' : 'Locked')}</span>
                    </button>
                  </div>

                  {/* 3. Doctor Registration */}
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <p className="font-extrabold text-slate-850">
                        {language === 'bn' ? '৩. ডাক্তার/বিশেষজ্ঞ প্রোফাইল যুক্ত করা' : '3. Doctor Profile Registration'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {config.doctorListingFree ? (language === 'bn' ? 'সবার জন্য ফ্রি' : 'Free for all') : (language === 'bn' ? 'লকড (লিস্টিং ফি প্রয়োজন)' : 'Locked / Listing Fee')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('doctorListingFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.doctorListingFree 
                          ? 'bg-emerald-600 text-white shadow-2xs' 
                          : 'bg-red-600 text-white shadow-2xs'
                      }`}
                    >
                      {config.doctorListingFree ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.doctorListingFree ? (language === 'bn' ? 'ফ্রি' : 'Free') : (language === 'bn' ? 'লকড' : 'Locked')}</span>
                    </button>
                  </div>

                  {/* 4. Dues Ledger / Bokeya Khata */}
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <p className="font-extrabold text-slate-850">
                        {language === 'bn' ? '৪. বকেয়া খাতা (দেনা-পাওনা লেজার ও খতিয়ান)' : '4. Dues Ledger / Bokeya Khata'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {config.duesKhataFree !== false ? (language === 'bn' ? 'সবার জন্য ফ্রি' : 'Free for all') : (language === 'bn' ? 'লকড (ভিআইপি প্রয়োজন)' : 'Locked / VIP')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('duesKhataFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.duesKhataFree !== false 
                          ? 'bg-emerald-600 text-white shadow-2xs' 
                          : 'bg-red-600 text-white shadow-2xs'
                      }`}
                    >
                      {config.duesKhataFree !== false ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.duesKhataFree !== false ? (language === 'bn' ? 'ফ্রি' : 'Free') : (language === 'bn' ? 'লকড' : 'Locked')}</span>
                    </button>
                  </div>

                  {/* 5. Reports Export */}
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <p className="font-extrabold text-slate-850">
                        {language === 'bn' ? '৫. এক্সেল ও পিডিএফ রিপোর্ট ডাউনলোড' : '5. Excel & PDF Reports Export'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {config.reportsExportFree !== false ? (language === 'bn' ? 'সবার জন্য ফ্রি' : 'Free for all') : (language === 'bn' ? 'লকড (ভিআইপি প্রয়োজন)' : 'Locked / VIP')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('reportsExportFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.reportsExportFree !== false 
                          ? 'bg-emerald-600 text-white shadow-2xs' 
                          : 'bg-red-600 text-white shadow-2xs'
                      }`}
                    >
                      {config.reportsExportFree !== false ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.reportsExportFree !== false ? (language === 'bn' ? 'ফ্রি' : 'Free') : (language === 'bn' ? 'লকড' : 'Locked')}</span>
                    </button>
                  </div>

                  {/* 6. Agro & Vet Store Directory */}
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <p className="font-extrabold text-slate-850">
                        {language === 'bn' ? '৬. ফিড ও ঔষধ দোকান / স্টোর ডিরেক্টরি লিস্টিং' : '6. Feed & Vet Store Directory Listing'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {config.storeListingFree !== false ? (language === 'bn' ? 'সবার জন্য ফ্রি' : 'Free for all') : (language === 'bn' ? 'লকড (লিস্টিং ফি প্রয়োজন)' : 'Locked / Listing Fee')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('storeListingFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.storeListingFree !== false 
                          ? 'bg-emerald-600 text-white shadow-2xs' 
                          : 'bg-red-600 text-white shadow-2xs'
                      }`}
                    >
                      {config.storeListingFree !== false ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.storeListingFree !== false ? (language === 'bn' ? 'ফ্রি' : 'Free') : (language === 'bn' ? 'লকড' : 'Locked')}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PLANS & PRICING MANAGER */}
          {activeTab === 'plans' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <Sparkles size={14} className="text-amber-600" />
                  <span>{language === 'bn' ? 'সাবস্ক্রিপশন ও বিজ্ঞাপন প্যাকেজসমূহ:' : 'Subscription & Ad Plans:'}</span>
                </h4>

                <button
                  type="button"
                  onClick={() => handleOpenPlanModal()}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus size={13} />
                  <span>{language === 'bn' ? '+ নতুন প্যাকেজ' : '+ Add Plan'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    className="bg-white border border-amber-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900">{plan.nameBn}</span>
                        <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                          {plan.type === 'farmer_premium' ? 'খামারি' : 'বিজনেস'}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5 my-1.5">
                        <span className="text-base font-black text-slate-900 font-sans">৳{plan.price}</span>
                        {plan.originalPrice && (
                          <span className="text-xs text-slate-400 line-through">৳{plan.originalPrice}</span>
                        )}
                        <span className="text-[10px] text-slate-500 font-bold">({plan.durationLabelBn})</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 mt-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPlanModal(plan)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={11} />
                        <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSubscriptionPlan(plan.id)}
                        className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENT ACCOUNTS & HELPLINE */}
          {activeTab === 'accounts' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <form onSubmit={handleSaveAccounts} className="bg-white/80 rounded-xl p-3.5 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-amber-600" />
                    <span>{language === 'bn' ? 'বিকাশ, নগদ, রকেট ও অ্যাডমিন হেল্পলাইন:' : 'Payment Accounts & Helpline:'}</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* bKash */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">বিকাশ নম্বর (bKash)</label>
                    <input
                      type="text"
                      value={bkashNum}
                      onChange={(e) => setBkashNum(e.target.value)}
                      placeholder="01410991934"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-sans"
                    />
                  </div>

                  {/* Nagad */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">নগদ নম্বর (Nagad)</label>
                    <input
                      type="text"
                      value={nagadNum}
                      onChange={(e) => setNagadNum(e.target.value)}
                      placeholder="01410991934"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-sans"
                    />
                  </div>

                  {/* Rocket */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">রকেট নম্বর (Rocket)</label>
                    <input
                      type="text"
                      value={rocketNum}
                      onChange={(e) => setRocketNum(e.target.value)}
                      placeholder="01410991934"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                      <Phone size={12} className="text-amber-600" />
                      <span>{language === 'bn' ? 'অ্যাডমিন কল নম্বর' : 'Admin Call Number'}</span>
                    </label>
                    <input
                      type="text"
                      value={adminPhoneInput}
                      onChange={(e) => setAdminPhoneInput(e.target.value)}
                      placeholder="01410991934"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                      <MessageCircle size={12} className="text-emerald-600" />
                      <span>{language === 'bn' ? 'অ্যাডমিন WhatsApp নম্বর' : 'Admin WhatsApp'}</span>
                    </label>
                    <input
                      type="text"
                      value={adminWaInput}
                      onChange={(e) => setAdminWaInput(e.target.value)}
                      placeholder="01410991934"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-sans"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Save size={13} />
                    <span>{isSaving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'সেটিংস সেভ করুন' : 'Save Settings')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* Plan Add / Edit Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white border border-amber-400 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-900">
                {editingPlan ? 'প্যাকেজ এডিট করুন' : 'নতুন প্যাকেজ যোগ করুন'}
              </h3>
              <button onClick={() => setShowPlanModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlanForm} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">প্ল্যানের নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={planNameBn}
                  onChange={(e) => setPlanNameBn(e.target.value)}
                  placeholder="উদাঃ ১ মাস মেয়াদি প্ল্যান"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">ক্যাটাগরি</label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  >
                    <option value="farmer_premium">খামারি প্রিমিয়াম</option>
                    <option value="business_ad">দোকান/বিজ্ঞাপন লিস্টিং</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">মেয়াদ (দিন)</label>
                  <input
                    type="number"
                    value={planDurationDays}
                    onChange={(e) => setPlanDurationDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">মূল্য (টাকা) *</label>
                  <input
                    type="number"
                    required
                    value={planPrice}
                    onChange={(e) => setPlanPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">আগের মূল্য (ছাড়ের জন্য)</label>
                  <input
                    type="number"
                    value={planOriginalPrice}
                    onChange={(e) => setPlanOriginalPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">ফিচারসমূহ (কমা দিয়ে লিখুন)</label>
                <textarea
                  rows={2}
                  value={planFeaturesBn}
                  onChange={(e) => setPlanFeaturesBn(e.target.value)}
                  placeholder="এক্সেল রিপোর্ট ডাউনলোড, বকেয়া খাতা, ভয়েস অ্যাসিস্ট্যান্ট"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
