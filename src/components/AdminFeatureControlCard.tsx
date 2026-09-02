import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig, FeatureControls, SubscriptionPlan, PaymentRequest } from '../contexts/SystemConfigContext';
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
  MessageCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  DollarSign,
  Shield,
  Layers,
  Copy,
  Check,
  Building,
  Landmark,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFeatureControlCard() {
  const { language } = useLanguage();
  const { 
    config, 
    isAdmin, 
    updateConfig, 
    plans,
    pendingRequests,
    allRequests,
    approvePaymentRequest,
    rejectPaymentRequest,
    deletePaymentRequest,
    grantUserSubscription,
    revokeUserSubscription,
    saveSubscriptionPlan,
    deleteSubscriptionPlan
  } = useSystemConfig();
  
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'master' | 'plans' | 'accounts'>('requests');

  // Search & Filter for Payment Requests
  const [requestStatusFilter, setRequestStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [requestSearchQuery, setRequestSearchQuery] = useState<string>('');
  const [rejectModalData, setRejectModalData] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // In-App Dedicated Delete & Revoke Confirmation Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    type: 'whitelist' | 'subscription' | 'request';
    title?: string;
    message?: string;
  } | null>(null);

  // Whitelist Form State
  const [newWhitelistInput, setNewWhitelistInput] = useState<string>('');
  const [whitelistDuration, setWhitelistDuration] = useState<number>(30);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  
  // Payment Accounts Form State
  const [bkashNum, setBkashNum] = useState(config.paymentNumbers?.bkash || '01410991934');
  const [bkashType, setBkashType] = useState<'personal' | 'merchant' | 'agent'>(config.paymentNumbers?.bkashType || 'personal');
  const [nagadNum, setNagadNum] = useState(config.paymentNumbers?.nagad || '01410991934');
  const [nagadType, setNagadType] = useState<'personal' | 'merchant'>(config.paymentNumbers?.nagadType || 'personal');
  const [rocketNum, setRocketNum] = useState(config.paymentNumbers?.rocket || '01410991934');
  const [rocketType, setRocketType] = useState<'personal' | 'merchant'>(config.paymentNumbers?.rocketType || 'personal');
  
  // Bank & International Payment States
  const [bankName, setBankName] = useState(config.paymentNumbers?.bankName || 'Dutch-Bangla Bank PLC / Sonali Bank PLC');
  const [bankAccountName, setBankAccountName] = useState(config.paymentNumbers?.bankAccountName || 'Md. Abu Sufian');
  const [bankAccountNumber, setBankAccountNumber] = useState(config.paymentNumbers?.bankAccountNumber || '123.101.456789');
  const [bankBranch, setBankBranch] = useState(config.paymentNumbers?.bankBranch || 'Main Branch, Dhaka');
  const [bankRoutingNumber, setBankRoutingNumber] = useState(config.paymentNumbers?.bankRoutingNumber || '090260123');
  const [bankSwiftCode, setBankSwiftCode] = useState(config.paymentNumbers?.bankSwiftCode || 'DBBLBDDH');

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
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  if (!isAdmin) return null;

  // Requests categorized
  const pendingList = useMemo(() => (allRequests || []).filter(r => r.status === 'pending'), [allRequests]);
  const approvedList = useMemo(() => (allRequests || []).filter(r => r.status === 'approved'), [allRequests]);
  const rejectedList = useMemo(() => (allRequests || []).filter(r => r.status === 'rejected'), [allRequests]);

  // Filtered payment requests based on tab status & search query (TrxID, phone, name)
  const filteredRequests = useMemo(() => {
    let list = allRequests || [];
    if (requestStatusFilter === 'pending') list = pendingList;
    else if (requestStatusFilter === 'approved') list = approvedList;
    else if (requestStatusFilter === 'rejected') list = rejectedList;

    if (!requestSearchQuery.trim()) return list;
    const q = requestSearchQuery.toLowerCase().trim();
    return list.filter(req => 
      (req.trxId && req.trxId.toLowerCase().includes(q)) ||
      (req.senderPhone && req.senderPhone.toLowerCase().includes(q)) ||
      (req.userName && req.userName.toLowerCase().includes(q)) ||
      (req.userPhone && req.userPhone.toLowerCase().includes(q)) ||
      (req.planTitle && req.planTitle.toLowerCase().includes(q)) ||
      (req.userId && req.userId.toLowerCase().includes(q))
    );
  }, [allRequests, requestStatusFilter, pendingList, approvedList, rejectedList, requestSearchQuery]);

  // Filtered Whitelist users
  const filteredWhitelistedUsers = useMemo(() => {
    const list = config.whitelistedUsers || [];
    if (!userSearchQuery.trim()) return list;
    const q = userSearchQuery.toLowerCase().trim();
    return list.filter(item => item.toLowerCase().includes(q));
  }, [config.whitelistedUsers, userSearchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(language === 'bn' ? 'কপি হয়েছে' : 'Copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        rocketType,
        bankName: bankName.trim(),
        bankAccountName: bankAccountName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankBranch: bankBranch.trim(),
        bankRoutingNumber: bankRoutingNumber.trim(),
        bankSwiftCode: bankSwiftCode.trim()
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

  // Open dedicated in-app modal to remove/delete VIP user
  const handleOpenDeleteWhitelistModal = (userIdent: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      id: userIdent,
      name: userIdent,
      type: 'whitelist',
      title: language === 'bn' ? 'ভিআইপি ইউজার ডিলিট ও অ্যাক্সেস বাতিল' : 'Revoke & Delete VIP User',
      message: language === 'bn' 
        ? `আপনি কি নিশ্চিত যে "${userIdent}" এর ভিআইপি সাবস্ক্রিপশন বাতিল ও তালিকা থেকে মুছে ফেলতে চান?` 
        : `Are you sure you want to remove "${userIdent}" from VIP Whitelist?`
    });
  };

  // Open dedicated in-app modal to delete payment request
  const handleOpenDeleteRequestModal = (req: PaymentRequest) => {
    setDeleteConfirmModal({
      isOpen: true,
      id: req.id || '',
      name: `${req.userName} (${req.trxId})`,
      type: 'request',
      title: language === 'bn' ? 'পেমেন্ট রিকোয়েস্ট রেকর্ড ডিলিট' : 'Delete Payment Request',
      message: language === 'bn'
        ? `আপনি কি নিশ্চিত যে "${req.userName}" এর পেমেন্ট রিকোয়েস্ট রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?`
        : `Are you sure you want to permanently delete payment record of "${req.userName}"?`
    });
  };

  // Open modal to revoke an approved user
  const handleOpenRevokeApprovedUserModal = (req: PaymentRequest) => {
    const userTarget = req.userId || req.userPhone || req.senderPhone;
    setDeleteConfirmModal({
      isOpen: true,
      id: userTarget,
      name: `${req.userName} - ${userTarget}`,
      type: 'whitelist',
      title: language === 'bn' ? 'সাবস্ক্রিপশন বাতিল ও ইউজার ডিলিট' : 'Revoke Subscription Access',
      message: language === 'bn'
        ? `"${req.userName}" (${userTarget}) এর সক্রিয় প্রো সাবস্ক্রিপশন বাতিল এবং হোয়াইটলিস্ট থেকে মুছে ফেলা হবে। আপনি কি নিশ্চিত?`
        : `Revoke active subscription for "${req.userName}" (${userTarget})?`
    });
  };

  // Confirm delete handler
  const handleConfirmDeleteAction = async () => {
    if (!deleteConfirmModal) return;
    setIsSaving(true);
    try {
      if (deleteConfirmModal.type === 'whitelist' || deleteConfirmModal.type === 'subscription') {
        await revokeUserSubscription(deleteConfirmModal.id);
      } else if (deleteConfirmModal.type === 'request') {
        await deletePaymentRequest(deleteConfirmModal.id);
      }
    } finally {
      setIsSaving(false);
      setDeleteConfirmModal(null);
    }
  };

  const handleApproveRequest = async (req: PaymentRequest) => {
    if (!req.id) return;
    setProcessingRequestId(req.id);
    
    // Find plan duration days
    const matchedPlan = plans.find(p => p.id === req.planId);
    const durationDays = matchedPlan?.durationDays || 30;

    await approvePaymentRequest(req.id, req.userId, durationDays, req.planId);
    setProcessingRequestId(null);
  };

  const handleOpenRejectModal = (req: PaymentRequest) => {
    if (!req.id) return;
    setRejectModalData({ id: req.id, name: req.userName || req.senderPhone });
    setRejectReason('ভুল ট্রানজেকশন আইডি (TrxID) অথবা পেমেন্ট টাকা পাওয়া যায়নি।');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalData) return;
    setProcessingRequestId(rejectModalData.id);
    await rejectPaymentRequest(rejectModalData.id, rejectReason.trim());
    setRejectModalData(null);
    setProcessingRequestId(null);
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
      setPlanFeaturesBn(plan.featuresBn?.join(', ') || '');
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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-slate-100 shadow-xl space-y-4">
      
      {/* Top Header & Executive Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
            <Crown size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white tracking-tight">
                {language === 'bn' ? 'মাস্টার অ্যাডমিন ও সাবস্ক্রিপশন কন্ট্রোল' : 'Master Monetization Admin Hub'}
              </h3>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase">
                MASTER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {language === 'bn' 
                ? 'পেমেন্ট অ্যাপ্রুভাল, প্যাকেজ মূল্য, হোয়াইটলিস্ট ও ফিচার সুইচ ম্যানেজমেন্ট' 
                : 'Manage payment approvals, pricing, whitelist & feature access'}
            </p>
          </div>
        </div>

        {/* Quick Stats Badges & Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {pendingRequests.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold animate-pulse">
              <AlertCircle size={14} />
              <span>{pendingRequests.length} {language === 'bn' ? 'নতুন রিকোয়েস্ট' : 'Pending'}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? (language === 'bn' ? 'লুকান' : 'Hide') : (language === 'bn' ? 'ড্যাশবোর্ড খুলুন' : 'Open')}</span>
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          
          {/* Main Top Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
            
            {/* Tab 1: Payment Approvals */}
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'requests'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CreditCard size={14} />
              <span>{language === 'bn' ? 'পেমেন্ট রিকোয়েস্ট' : 'Payments'}</span>
              {pendingRequests.length > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  activeTab === 'requests' ? 'bg-slate-950 text-amber-400' : 'bg-rose-500 text-white'
                }`}>
                  {pendingRequests.length}
                </span>
              )}
            </button>

            {/* Tab 2: VIP Whitelist */}
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users size={14} />
              <span>{language === 'bn' ? 'ইউজার হোয়াইটলিস্ট' : 'VIP Users'}</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                activeTab === 'users' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {config.whitelistedUsers?.length || 0}
              </span>
            </button>

            {/* Tab 3: Feature Switches */}
            <button
              type="button"
              onClick={() => setActiveTab('master')}
              className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'master'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders size={14} />
              <span>{language === 'bn' ? 'ফিচার লক সুইচ' : 'Feature Lock'}</span>
            </button>

            {/* Tab 4: Plans & Pricing */}
            <button
              type="button"
              onClick={() => setActiveTab('plans')}
              className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'plans'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles size={14} />
              <span>{language === 'bn' ? 'প্যাকেজ ও মূল্য' : 'Plans'}</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                activeTab === 'plans' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {plans.length}
              </span>
            </button>

            {/* Tab 5: Payment Accounts */}
            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`col-span-2 sm:col-span-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'accounts'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Phone size={14} />
              <span>{language === 'bn' ? 'বিকাশ/নগদ নম্বর' : 'Helpline'}</span>
            </button>

          </div>

          {/* TAB 1: PENDING & ALL PAYMENT REQUESTS WITH DELETE/REVOKE */}
          {activeTab === 'requests' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              
              {/* Header with search & Status Filter Pills */}
              <div className="space-y-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">
                        {language === 'bn' ? 'পেমেন্ট ভেরিফিকেশন, হিস্ট্রি ও ডিলিট' : 'Payment Verification, History & Deletion'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {language === 'bn' 
                          ? 'পেমেন্ট অনুমোদন করুন, ভুল রিকোয়েস্ট বাতিল বা ডিলিট করুন' 
                          : 'Approve payments, manage history or delete invalid records'}
                      </p>
                    </div>
                  </div>

                  {/* TrxID / Phone Search Box */}
                  <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                      <Search size={14} />
                    </div>
                    <input
                      type="text"
                      value={requestSearchQuery}
                      onChange={(e) => setRequestSearchQuery(e.target.value)}
                      placeholder={language === 'bn' ? 'TrxID, নাম বা নম্বর দিয়ে খুঁজুন...' : 'Search TrxID, name or phone...'}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 font-sans"
                    />
                    {requestSearchQuery && (
                      <button
                        onClick={() => setRequestSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter Badges / Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-900 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setRequestStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                      requestStatusFilter === 'pending'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Clock size={12} />
                    <span>{language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      requestStatusFilter === 'pending' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-amber-400'
                    }`}>
                      {pendingList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestStatusFilter('approved')}
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                      requestStatusFilter === 'approved'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 size={12} />
                    <span>{language === 'bn' ? 'অনুমোদিত (Active VIP)' : 'Approved'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      requestStatusFilter === 'approved' ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-emerald-400'
                    }`}>
                      {approvedList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestStatusFilter('rejected')}
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                      requestStatusFilter === 'rejected'
                        ? 'bg-rose-500 text-white font-black shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <AlertCircle size={12} />
                    <span>{language === 'bn' ? 'বাতিলকৃত' : 'Rejected'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      requestStatusFilter === 'rejected' ? 'bg-slate-950 text-rose-300' : 'bg-slate-800 text-rose-400'
                    }`}>
                      {rejectedList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                      requestStatusFilter === 'all'
                        ? 'bg-indigo-600 text-white font-black shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{language === 'bn' ? 'সকল হিস্ট্রি' : 'All Requests'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      requestStatusFilter === 'all' ? 'bg-slate-950 text-indigo-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {allRequests.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Request Cards List */}
              {filteredRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className={`bg-slate-950 border rounded-2xl p-4 transition-all space-y-3 ${
                        req.status === 'approved' 
                          ? 'border-emerald-500/40 hover:border-emerald-500/60'
                          : req.status === 'rejected'
                          ? 'border-rose-500/30 hover:border-rose-500/50'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Plan Info & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-white">{req.userName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {req.planTitle}
                            </span>
                            {/* Status tag */}
                            {req.status === 'approved' && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 size={10} />
                                {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
                              </span>
                            )}
                            {req.status === 'rejected' && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                <AlertCircle size={10} />
                                {language === 'bn' ? 'বাতিলকৃত' : 'Rejected'}
                              </span>
                            )}
                            {req.status === 'pending' && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Clock size={10} />
                                {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {req.userPhone || req.userEmail || req.userId}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-emerald-400 font-sans">৳{req.amount}</span>
                          <span className="block text-[10px] text-slate-400 uppercase font-bold">{req.paymentMethod}</span>
                        </div>
                      </div>

                      {/* TrxID & Sender Phone Highlight Box */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {language === 'bn' ? 'প্রেরক নম্বর ও TrxID' : 'Sender Phone & TrxID'}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-slate-200 font-mono">{req.senderPhone}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-xs font-black text-amber-400 font-mono tracking-wide truncate">
                              {req.trxId}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(req.trxId, req.id || '')}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer shrink-0 transition-colors"
                          title="Copy TrxID"
                        >
                          {copiedId === req.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>

                      {/* Date & Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(req.createdAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {/* DELETE RECORD BUTTON (Available for all statuses) */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteRequestModal(req)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title={language === 'bn' ? 'রেকর্ডটি তালিকা থেকে স্থায়ীভাবে মুছে ফেলুন' : 'Delete record'}
                          >
                            <Trash2 size={13} />
                            <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                          </button>

                          {/* IF PENDING: Show Reject & Approve */}
                          {req.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(req)}
                                disabled={processingRequestId === req.id}
                                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                              >
                                {language === 'bn' ? 'বাতিল' : 'Reject'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req)}
                                disabled={processingRequestId === req.id}
                                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 cursor-pointer transition-all"
                              >
                                <CheckCircle2 size={14} className="stroke-[2.5]" />
                                <span>
                                  {processingRequestId === req.id 
                                    ? (language === 'bn' ? 'অনুমোদন হচ্ছে...' : 'Approving...') 
                                    : (language === 'bn' ? 'অনুমোদন দিন' : 'Approve')}
                                </span>
                              </button>
                            </>
                          )}

                          {/* IF APPROVED: Show Revoke VIP Button */}
                          {req.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleOpenRevokeApprovedUserModal(req)}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="Revoke active subscription access"
                            >
                              <UserCheck size={13} />
                              <span>{language === 'bn' ? 'ভিআইপি বাতিল' : 'Revoke VIP'}</span>
                            </button>
                          )}

                          {/* IF REJECTED: Allow Re-approving */}
                          {req.status === 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleApproveRequest(req)}
                              disabled={processingRequestId === req.id}
                              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <CheckCircle2 size={13} />
                              <span>{language === 'bn' ? 'পুনরায় অনুমোদন' : 'Re-Approve'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-300">
                    {language === 'bn' ? 'কোনো পেমেন্ট রিকোয়েস্ট পাওয়া যায়নি!' : 'No payment requests found!'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {language === 'bn' ? 'নতুন কোনো পেমেন্ট জমা হলে বা ফিল্টার পরিবর্তন করলে দেখতে পাবেন।' : 'Change filter or wait for user payment submissions.'}
                  </p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: VIP USER WHITELIST & CUSTOMER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Form to Add New VIP */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">
                        {language === 'bn' ? 'সরাসরি ভিআইপি গ্রাহক যোগ করুন' : 'Grant Direct VIP Access'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {language === 'bn' ? 'মোবাইল নম্বর বা জিমেইল লিখে মেয়াদ সিলেক্ট করে সেভ করুন' : 'Enter phone/email and select duration to grant full VIP'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-xl">
                    {config.whitelistedUsers?.length || 0} {language === 'bn' ? 'জন ভিআইপি' : 'Whitelisted'}
                  </span>
                </div>

                <form onSubmit={handleAddWhitelist} className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={newWhitelistInput}
                      onChange={(e) => setNewWhitelistInput(e.target.value)}
                      placeholder="ইউজারের মোবাইল নম্বর (017...) বা ইমেইল লিখুন..."
                      className="sm:col-span-6 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 font-sans"
                    />

                    <select
                      value={whitelistDuration}
                      onChange={(e) => setWhitelistDuration(Number(e.target.value))}
                      className="sm:col-span-3 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:border-amber-500"
                    >
                      <option value={30}>৩০ দিন (১ মাস)</option>
                      <option value={90}>৯০ দিন (৩ মাস)</option>
                      <option value={180}>১৮০ দিন (৬ মাস)</option>
                      <option value={365}>৩৬৫ দিন (১ বছর)</option>
                      <option value={99999}>আজীবন (Lifetime VIP)</option>
                    </select>

                    <button
                      type="submit"
                      disabled={isSaving || !newWhitelistInput.trim()}
                      className="sm:col-span-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      <Plus size={15} className="stroke-[3]" />
                      <span>{language === 'bn' ? 'অ্যাক্টিভেট করুন' : 'Activate VIP'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION 1: Active Whitelisted Users List with Delete/Revoke */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      {language === 'bn' ? 'অনুমোদিত ভিআইপি গ্রাহক তালিকা' : 'Active Whitelisted VIPs'}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      ({config.whitelistedUsers?.length || 0})
                    </span>
                  </div>
                  
                  {/* Search inside whitelist */}
                  <div className="relative w-full sm:w-56">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder={language === 'bn' ? 'তালিকায় সার্চ করুন...' : 'Search VIPs...'}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
                    />
                    {userSearchQuery && (
                      <button
                        onClick={() => setUserSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                      >
                        <XCircle size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {filteredWhitelistedUsers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {filteredWhitelistedUsers.map((userIdent) => (
                      <div
                        key={userIdent}
                        className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl shadow-xs transition-all group"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <UserCheck size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-slate-100 font-mono truncate" title={userIdent}>
                              {userIdent}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <Sparkles size={10} />
                              {language === 'bn' ? 'ভিআইপি অ্যাক্টিভ' : 'VIP Active'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(userIdent, userIdent)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            title="Copy ID"
                          >
                            {copiedId === userIdent ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          </button>

                          {/* DEDICATED DELETE BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteWhitelistModal(userIdent)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg cursor-pointer transition-all border border-rose-500/20 hover:border-rose-500"
                            title={language === 'bn' ? 'ইউজারকে মুছে ফেলুন ও সাবস্ক্রিপশন বাতিল করুন' : 'Revoke and Delete VIP'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 space-y-1">
                    <p className="text-xs text-slate-400 font-bold">
                      {language === 'bn' ? 'কোনো ভিআইপি ইউজার পাওয়া যায়নি।' : 'No whitelisted users found.'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {language === 'bn' ? 'উপরের বক্সে নম্বর লিখে "অ্যাক্টিভেট করুন" এ চাপুন।' : 'Enter phone/email above to add VIP user.'}
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 2: Approved Paid Subscriptions History with Instant Delete/Revoke */}
              {approvedList.length > 0 && (
                <div className="bg-slate-950 rounded-2xl p-4 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">
                          {language === 'bn' ? 'পেমেন্ট থেকে অনুমোদিত গ্রাহক তালিকা' : 'Paid Approved VIP Subscriptions'}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {language === 'bn' ? 'পেমেন্ট অনুমোদনের মাধ্যমে প্রো সুবিধা পাওয়া গ্রাহকদের তালিকা' : 'Subscribers who got VIP access via manual payments'}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                      {approvedList.length} {language === 'bn' ? 'জন অনুমোদিত' : 'Approved'}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {approvedList.map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl transition-all"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-white">{req.userName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                              {req.planTitle} (৳{req.amount})
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              TrxID: {req.trxId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">
                            নম্বর: {req.userPhone || req.senderPhone || req.userId}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteRequestModal(req)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors"
                            title="Delete payment history record"
                          >
                            <Trash2 size={12} />
                            <span>{language === 'bn' ? 'রেকর্ড মুছুন' : 'Delete Record'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenRevokeApprovedUserModal(req)}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all"
                            title="Revoke subscription & remove user"
                          >
                            <UserCheck size={12} />
                            <span>{language === 'bn' ? 'ভিআইপি বাতিল' : 'Revoke Access'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: MASTER TOGGLE & INDIVIDUAL FEATURE LOCKS */}
          {activeTab === 'master' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              
              {/* Master Global Monetization On/Off Switch */}
              <div className="bg-gradient-to-r from-emerald-950/80 via-slate-950 to-teal-950/80 border border-emerald-500/40 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">
                        {language === 'bn' ? '👑 মাস্টার মনেটাইজেশন সুইচ (Global Switch)' : '👑 Master Monetization Switch'}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        config.monetizationEnabled !== false 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {config.monetizationEnabled !== false ? 'MONETIZATION ACTIVE' : '100% FREE MODE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-xl">
                      {language === 'bn'
                        ? 'এটি বন্ধ (OFF) করলে সম্পূর্ণ অ্যাপে কোনো লক বা সাবস্ক্রিপশন থাকবে না—সব ইউজারের জন্য সবকিছু সম্পূর্ণ ফ্রি হয়ে যাবে। অন করলে নির্ধারিত ফিচার লক কাজ করবে।'
                        : 'When turned OFF, the entire app becomes 100% FREE for all users without any restriction.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle('monetizationEnabled')}
                    disabled={isSaving}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all shadow-md active:scale-95 ${
                      config.monetizationEnabled !== false 
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {config.monetizationEnabled !== false ? <ShieldCheck size={16} /> : <Unlock size={16} />}
                    <span>
                      {config.monetizationEnabled !== false 
                        ? (language === 'bn' ? 'মনেটাইজেশন চালু' : 'Monetization ON') 
                        : (language === 'bn' ? 'সবকিছু ১০০% ফ্রি' : 'All Free Mode')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Master Global App Lock */}
              <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">
                        {language === 'bn' ? '🔒 সম্পূর্ণ অ্যাপ লক (সাবস্ক্রিপশন বাধ্যতামূলক)' : '🔒 Global App Lock (Subscription Required)'}
                      </span>
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                        PRO ONLY
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {language === 'bn'
                        ? 'এটি অন করলে শুধু ভিআইপি ও অনুমোদিত ইউজাররা অ্যাপ ব্যবহার করতে পারবেন।'
                        : 'When enabled, only whitelisted VIP users can access the app tools.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle('appLockRequired')}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-all active:scale-95 ${
                      config.appLockRequired 
                        ? 'bg-rose-500 text-white shadow-md' 
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {config.appLockRequired ? <Lock size={14} /> : <Unlock size={14} />}
                    <span>
                      {config.appLockRequired 
                        ? (language === 'bn' ? 'সম্পূর্ণ অ্যাপ লকড' : 'App Locked') 
                        : (language === 'bn' ? 'উন্মুক্ত' : 'Open')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Individual Feature Switches Grid */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                  <Settings2 size={16} className="text-amber-400" />
                  <h4 className="text-xs font-black text-white">
                    {language === 'bn' ? 'নির্দিষ্ট ফিচার অ্যাক্সেস সুইচ (ফ্রি / লক)' : 'Feature Access Switches'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  
                  {/* 1. Marketplace Post */}
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <p className="font-black text-white">১. ক্রয়-বিক্রয় বিজ্ঞাপন পোস্ট</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {config.marketplacePostFree ? 'সবার জন্য ফ্রি' : 'লকড (ভিআইপি প্রয়োজন)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('marketplacePostFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.marketplacePostFree ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {config.marketplacePostFree ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.marketplacePostFree ? 'ফ্রি' : 'লকড'}</span>
                    </button>
                  </div>

                  {/* 2. Marketplace Buyer Directory */}
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <p className="font-black text-white">২. পাইকারি ক্রেতা তালিকায় অন্তর্ভুক্তি</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {config.marketplaceBuyerFree ? 'সবার জন্য ফ্রি' : 'লকড (ভিআইপি প্রয়োজন)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('marketplaceBuyerFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.marketplaceBuyerFree ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {config.marketplaceBuyerFree ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.marketplaceBuyerFree ? 'ফ্রি' : 'লকড'}</span>
                    </button>
                  </div>

                  {/* 3. Doctor Registration */}
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <p className="font-black text-white">৩. ডাক্তার/বিশেষজ্ঞ প্রোফাইল লিস্টিং</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {config.doctorListingFree ? 'সবার জন্য ফ্রি' : 'লকড (লিস্টিং ফি প্রয়োজন)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('doctorListingFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.doctorListingFree ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {config.doctorListingFree ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.doctorListingFree ? 'ফ্রি' : 'লকড'}</span>
                    </button>
                  </div>

                  {/* 4. Dues Ledger / Bokeya Khata */}
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <p className="font-black text-white">৪. বকেয়া খাতা ও কাস্টমার লেজার</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {config.duesKhataFree !== false ? 'সবার জন্য ফ্রি' : 'লকড (ভিআইপি প্রয়োজন)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('duesKhataFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.duesKhataFree !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {config.duesKhataFree !== false ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.duesKhataFree !== false ? 'ফ্রি' : 'লকড'}</span>
                    </button>
                  </div>

                  {/* 5. Reports Export */}
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <p className="font-black text-white">৫. এক্সেল ও পিডিএফ রিপোর্ট ডাউনলোড</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {config.reportsExportFree !== false ? 'সবার জন্য ফ্রি' : 'লকড (ভিআইপি প্রয়োজন)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('reportsExportFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.reportsExportFree !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {config.reportsExportFree !== false ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.reportsExportFree !== false ? 'ফ্রি' : 'লকড'}</span>
                    </button>
                  </div>

                  {/* 6. Agro & Vet Store Directory */}
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <p className="font-black text-white">৬. দোকান / ডিলারশিপ ডিরেক্টরি লিস্টিং</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {config.storeListingFree !== false ? 'সবার জন্য ফ্রি' : 'লকড (লিস্টিং ফি প্রয়োজন)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('storeListingFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.storeListingFree !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {config.storeListingFree !== false ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.storeListingFree !== false ? 'ফ্রি' : 'লকড'}</span>
                    </button>
                  </div>

                  {/* 7. Sales Records & Cash Invoices */}
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <p className="font-black text-white">৭. বিক্রয় রেকর্ড ও ক্যাশমেমো চালান</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {config.salesRecordsFree !== false ? 'সবার জন্য ফ্রি' : 'লকড (সাবস্ক্রিপশন প্রয়োজন)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('salesRecordsFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.salesRecordsFree !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {config.salesRecordsFree !== false ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.salesRecordsFree !== false ? 'ফ্রি' : 'লকড'}</span>
                    </button>
                  </div>

                  {/* 8. Farm Analytics & Profit Analysis */}
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <p className="font-black text-white">৮. ফার্ম এনালাইসিস ও লাভ-ক্ষতি রিপোর্ট</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {config.farmAnalyticsFree !== false ? 'সবার জন্য ফ্রি' : 'লকড (সাবস্ক্রিপশন প্রয়োজন)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('farmAnalyticsFree')}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        config.farmAnalyticsFree !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {config.farmAnalyticsFree !== false ? <Unlock size={12} /> : <Lock size={12} />}
                      <span>{config.farmAnalyticsFree !== false ? 'ফ্রি' : 'লকড'}</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 4: PLANS & PRICING MANAGER */}
          {activeTab === 'plans' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">
                      {language === 'bn' ? 'সাবস্ক্রিপশন ও বিজ্ঞাপন প্যাকেজসমূহ' : 'Subscription & Ad Plans'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {language === 'bn' ? 'মূল্য বা প্যাকেজ ফিচার যেকোনো সময় পরিবর্তন করুন' : 'Edit pricing or plan features anytime'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPlanModal()}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <Plus size={14} className="stroke-[3]" />
                  <span>{language === 'bn' ? 'নতুন প্যাকেজ' : 'Add Plan'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-black text-white">{plan.nameBn}</span>
                        <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          {plan.type === 'farmer_premium' ? 'খামারি' : 'বিজনেস'}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 my-2">
                        <span className="text-xl font-black text-emerald-400 font-sans">৳{plan.price}</span>
                        {plan.originalPrice && (
                          <span className="text-xs text-slate-500 line-through">৳{plan.originalPrice}</span>
                        )}
                        <span className="text-xs text-slate-400 font-bold">({plan.durationLabelBn})</span>
                      </div>

                      {plan.featuresBn && plan.featuresBn.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {plan.featuresBn.slice(0, 3).map((f, idx) => (
                            <p key={idx} className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                              <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                              <span className="truncate">{f}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => handleOpenPlanModal(plan)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit3 size={12} />
                        <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSubscriptionPlan(plan.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs cursor-pointer transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENT ACCOUNTS & HELPLINE */}
          {activeTab === 'accounts' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <form onSubmit={handleSaveAccounts} className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                  <CreditCard size={16} className="text-amber-400" />
                  <div>
                    <h4 className="text-xs font-black text-white">
                      {language === 'bn' ? 'বিকাশ, নগদ, রকেট ও অ্যাডমিন হেল্পলাইন' : 'Payment Accounts & Helpline'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {language === 'bn' ? 'যেসব নম্বরে খামারিরা পেমেন্ট সেন্ড-মানি বা যোগাযোগ করবে' : 'Numbers where farmers will send payments or call'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* bKash */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300">বিকাশ নম্বর (bKash)</label>
                    <input
                      type="text"
                      value={bkashNum}
                      onChange={(e) => setBkashNum(e.target.value)}
                      placeholder="01410991934"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white font-sans focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* Nagad */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300">নগদ নম্বর (Nagad)</label>
                    <input
                      type="text"
                      value={nagadNum}
                      onChange={(e) => setNagadNum(e.target.value)}
                      placeholder="01410991934"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white font-sans focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* Rocket */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300">রকেট নম্বর (Rocket)</label>
                    <input
                      type="text"
                      value={rocketNum}
                      onChange={(e) => setRocketNum(e.target.value)}
                      placeholder="01410991934"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white font-sans focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Phone size={13} className="text-amber-400" />
                      <span>{language === 'bn' ? 'অ্যাডমিন কল নম্বর' : 'Admin Call Number'}</span>
                    </label>
                    <input
                      type="text"
                      value={adminPhoneInput}
                      onChange={(e) => setAdminPhoneInput(e.target.value)}
                      placeholder="01410991934"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white font-sans focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <MessageCircle size={13} className="text-emerald-400" />
                      <span>{language === 'bn' ? 'অ্যাডমিন WhatsApp নম্বর' : 'Admin WhatsApp'}</span>
                    </label>
                    <input
                      type="text"
                      value={adminWaInput}
                      onChange={(e) => setAdminWaInput(e.target.value)}
                      placeholder="01410991934"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white font-sans focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Direct Bank Account & International Wire Payment Details */}
                <div className="pt-2 border-t border-slate-900 space-y-3">
                  <div className="flex items-center gap-2">
                    <Landmark size={15} className="text-blue-400" />
                    <div>
                      <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{language === 'bn' ? 'ব্যাংক একাউন্ট ও আন্তর্জাতিক পেমেন্ট ডিটেইলস' : 'Bank Account & International Wire'}</span>
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold uppercase">Global / Play Store</span>
                      </h5>
                      <p className="text-[10px] text-slate-400">
                        {language === 'bn' ? 'দেশের বাইরে বা ব্যাংকের মাধ্যমে লেনদেনের জন্য ব্যাংক তথ্য সেট করুন' : 'Set bank information for international and wire transfers'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Bank Name */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1">
                        <Building size={12} className="text-slate-400" />
                        <span>{language === 'bn' ? 'ব্যাংকের নাম (Bank Name)' : 'Bank Name'}</span>
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Dutch-Bangla Bank PLC / Sonali Bank"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Account Holder Name */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        {language === 'bn' ? 'অ্যাকাউন্ট হোল্ডার নেম (Account Name)' : 'Account Holder Name'}
                      </label>
                      <input
                        type="text"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        placeholder="Md. Abu Sufian"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Account Number */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        {language === 'bn' ? 'অ্যাকাউন্ট নম্বর (Account Number)' : 'Account Number'}
                      </label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="123.101.456789"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white font-mono focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Branch */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        {language === 'bn' ? 'শাখা / ব্রাঞ্চ (Branch Name)' : 'Branch Name'}
                      </label>
                      <input
                        type="text"
                        value={bankBranch}
                        onChange={(e) => setBankBranch(e.target.value)}
                        placeholder="Main Branch, Dhaka"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Routing Number */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        {language === 'bn' ? 'রাউটিং নম্বর (Routing Number)' : 'Routing Number'}
                      </label>
                      <input
                        type="text"
                        value={bankRoutingNumber}
                        onChange={(e) => setBankRoutingNumber(e.target.value)}
                        placeholder="090260123"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white font-mono focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* SWIFT / BIC Code */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1">
                        <Globe size={12} className="text-amber-400" />
                        <span>{language === 'bn' ? 'সুইফট কোড (SWIFT / BIC Code)' : 'SWIFT / BIC Code'}</span>
                      </label>
                      <input
                        type="text"
                        value={bankSwiftCode}
                        onChange={(e) => setBankSwiftCode(e.target.value)}
                        placeholder="DBBLBDDH"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white font-mono uppercase focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer transition-all"
                  >
                    <Save size={15} />
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
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">
                {editingPlan ? 'প্যাকেজ এডিট করুন' : 'নতুন প্যাকেজ যোগ করুন'}
              </h3>
              <button onClick={() => setShowPlanModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlanForm} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">প্ল্যানের নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={planNameBn}
                  onChange={(e) => setPlanNameBn(e.target.value)}
                  placeholder="উদাঃ ১ মাস মেয়াদি প্ল্যান"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">ক্যাটাগরি</label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden"
                  >
                    <option value="farmer_premium">খামারি প্রিমিয়াম</option>
                    <option value="business_ad">দোকান/বিজ্ঞাপন লিস্টিং</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">মেয়াদ (দিন)</label>
                  <input
                    type="number"
                    value={planDurationDays}
                    onChange={(e) => setPlanDurationDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">মূল্য (টাকা) *</label>
                  <input
                    type="number"
                    required
                    value={planPrice}
                    onChange={(e) => setPlanPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">আগের মূল্য (ছাড়ের জন্য)</label>
                  <input
                    type="number"
                    value={planOriginalPrice}
                    onChange={(e) => setPlanOriginalPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">ফিচারসমূহ (কমা দিয়ে লিখুন)</label>
                <textarea
                  rows={2}
                  value={planFeaturesBn}
                  onChange={(e) => setPlanFeaturesBn(e.target.value)}
                  placeholder="এক্সেল রিপোর্ট ডাউনলোড, বকেয়া খাতা, ভয়েস অ্যাসিস্ট্যান্ট"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Payment Confirmation Modal */}
      {rejectModalData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-3 text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-rose-400 flex items-center gap-1.5">
                <AlertCircle size={16} />
                <span>পেমেন্ট রিকোয়েস্ট বাতিল করুন</span>
              </h3>
              <button onClick={() => setRejectModalData(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <XCircle size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              আপনি কি নিশ্চিত যে <span className="font-bold text-white font-mono">{rejectModalData.name}</span> এর পেমেন্ট রিকোয়েস্টটি বাতিল করতে চান?
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">বাতিলের কারণ (নোট):</label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="বাতিলের কারণ লিখুন..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRejectModalData(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={processingRequestId === rejectModalData.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                {processingRequestId === rejectModalData.id ? 'বাতিল হচ্ছে...' : 'হ্যাঁ, বাতিল করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete & Revoke Confirmation Modal */}
      {deleteConfirmModal && deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Trash2 size={16} />
                </div>
                <h3 className="text-sm font-black text-white">
                  {deleteConfirmModal.title || (language === 'bn' ? 'ইউজার ও রেকর্ড ডিলিট' : 'Delete & Revoke')}
                </h3>
              </div>
              <button 
                onClick={() => setDeleteConfirmModal(null)} 
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed">
                {deleteConfirmModal.message}
              </p>
              <div className="bg-rose-950/30 border border-rose-500/20 rounded-xl p-2.5 text-[11px] text-rose-300 font-mono flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-rose-400" />
                <span>{deleteConfirmModal.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                {language === 'bn' ? 'বাতিল (না)' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAction}
                disabled={isSaving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>
                  {isSaving 
                    ? (language === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...') 
                    : (language === 'bn' ? 'হ্যাঁ, স্থায়ীভাবে মুছে ফেলুন' : 'Yes, Delete Permanently')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
