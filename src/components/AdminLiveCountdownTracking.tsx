import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  FeatureControls, 
  SubscriptionPlan, 
  PaymentRequest, 
  UserSubscription 
} from '../contexts/SystemConfigContext';
import { 
  getSubscriptionExpiryInfo, 
  formatPlanDurationBn, 
  toBengaliDigits, 
  generateRenewalWhatsAppMessage,
  ExpiryInfo 
} from '../utils/subscriptionUtils';
import { 
  Timer, 
  Clock, 
  Hourglass, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  ArrowUpDown, 
  Flame, 
  Zap, 
  Phone, 
  MessageCircle, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Calendar, 
  UserCheck, 
  RefreshCw,
  Crown,
  CreditCard,
  Shield,
  Layers,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface TrackedSubscriberItem {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  planId: string;
  planTitle: string;
  amount: number;
  paymentMethod: string;
  trxId: string;
  durationDays: number;
  isLifetime: boolean;
  createdAt?: string;
  processedAt?: string;
  expiresAt?: string | null;
  status: 'approved' | 'active' | 'expired';
  source: 'payment_request' | 'subscription_doc' | 'whitelist';
  requestId?: string;
  expiryInfo: ExpiryInfo;
}

interface AdminLiveCountdownTrackingProps {
  allRequests: PaymentRequest[];
  allSubscriptions: UserSubscription[];
  whitelistedUsers: string[];
  plans: SubscriptionPlan[];
  config: FeatureControls;
  extendOrReactivateSubscription: (
    targetUserId: string, 
    additionalDays: number, 
    isLifetime?: boolean, 
    requestId?: string
  ) => Promise<boolean>;
  deletePaymentRequest: (requestId: string) => Promise<boolean>;
  revokeUserSubscription: (userIdOrPhone: string) => Promise<boolean>;
  removeUserFromWhitelist: (identifier: string) => Promise<boolean>;
  onOpenCustomExtendModal: (data: {
    userId: string;
    userName: string;
    userPhone?: string;
    requestId?: string;
    currentExpiry?: string | null;
    isLifetime?: boolean;
  }) => void;
  onOpenDeleteModal: (data: {
    id: string;
    userId?: string;
    requestId?: string;
    phone?: string;
    name: string;
    type: 'whitelist' | 'subscription' | 'request';
    title?: string;
    message?: string;
  }) => void;
}

export default function AdminLiveCountdownTracking({
  allRequests,
  allSubscriptions,
  whitelistedUsers,
  plans,
  config,
  extendOrReactivateSubscription,
  onOpenCustomExtendModal,
  onOpenDeleteModal
}: AdminLiveCountdownTrackingProps) {
  const { language } = useLanguage();

  // 1. Live second-by-second ticker
  const [nowTicker, setNowTicker] = useState<number>(() => Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [extendingUserId, setExtendingUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTicker(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | 'expiring_today' | 'expiring_soon' | 'expired' | 'active' | 'lifetime'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'soonest' | 'expired_first' | 'newest' | 'longest'>('soonest');

  // Copy handler
  const copyToClipboard = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(language === 'bn' ? 'কপি হয়েছে' : 'Copied');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  // Build unified tracked subscribers list
  const unifiedSubscribers: TrackedSubscriberItem[] = useMemo(() => {
    // Reference nowTicker to ensure recalculation on every second tick
    const _tick = nowTicker;
    const map = new Map<string, TrackedSubscriberItem>();

    // A. Approved payment requests
    allRequests.forEach((req) => {
      if (req.status === 'approved') {
        const isLifetime = (req.durationDays || 0) >= 9999;
        const key = req.userId || req.senderPhone || req.id || '';
        const expiryInfo = getSubscriptionExpiryInfo(
          req.expiresAt, 
          isLifetime, 
          req.status, 
          req.durationDays || 30
        );

        map.set(key, {
          id: req.id || key,
          userId: req.userId || key,
          userName: req.userName || 'ভিআইপি গ্রাহক',
          userPhone: req.userPhone || req.senderPhone || '',
          userEmail: req.userEmail || '',
          planId: req.planId,
          planTitle: req.planTitle || 'ভিআইপি প্যাকেজ',
          amount: req.amount || 0,
          paymentMethod: req.paymentMethod || 'bkash',
          trxId: req.trxId || '',
          durationDays: req.durationDays || 30,
          isLifetime,
          createdAt: req.createdAt,
          processedAt: req.processedAt,
          expiresAt: req.expiresAt,
          status: req.status as any,
          source: 'payment_request',
          requestId: req.id,
          expiryInfo
        });
      }
    });

    // B. Direct subscription documents
    (allSubscriptions || []).forEach((sub) => {
      const key = sub.userId || sub.userIdentifier || sub.id || '';
      const isLifetime = Boolean(sub.isLifetime || (sub.durationDays || 0) >= 9999);
      const expiryInfo = getSubscriptionExpiryInfo(
        sub.expiresAt, 
        isLifetime, 
        sub.status || 'active', 
        sub.durationDays || 30
      );

      const existing = map.get(key);
      if (existing) {
        if (sub.expiresAt) existing.expiresAt = sub.expiresAt;
        if (sub.status) existing.status = sub.status as any;
        if (sub.userName && (!existing.userName || existing.userName === 'গ্রাহক')) existing.userName = sub.userName;
        if (sub.userPhone && !existing.userPhone) existing.userPhone = sub.userPhone;
        existing.expiryInfo = expiryInfo;
      } else {
        const matchedPlan = plans.find(p => p.id === sub.planId);
        map.set(key, {
          id: sub.id || key,
          userId: sub.userId || key,
          userName: sub.userName || sub.userIdentifier || 'সরাসরি অনুমোদিত গ্রাহক',
          userPhone: sub.userPhone || (sub.userIdentifier?.startsWith('01') ? sub.userIdentifier : ''),
          userEmail: sub.userEmail || (sub.userIdentifier?.includes('@') ? sub.userIdentifier : ''),
          planId: sub.planId,
          planTitle: matchedPlan?.nameBn || 'সরাসরি ভিআইপি',
          amount: matchedPlan?.price || 0,
          paymentMethod: 'manual',
          trxId: 'ADMIN_MANUAL',
          durationDays: sub.durationDays || 30,
          isLifetime,
          createdAt: sub.createdAt || sub.startDate,
          expiresAt: sub.expiresAt,
          status: (sub.status as any) || 'active',
          source: 'subscription_doc',
          expiryInfo
        });
      }
    });

    // C. Whitelist entries
    (whitelistedUsers || []).forEach((idStr) => {
      const key = idStr.trim();
      if (!key) return;
      if (!map.has(key)) {
        const expiryInfo = getSubscriptionExpiryInfo(null, true, 'active', 99999);
        map.set(key, {
          id: `wl_${key}`,
          userId: key,
          userName: key.startsWith('01') ? `মোবাইল: ${key}` : key.includes('@') ? `ইমেইল: ${key}` : `ইউজার আইডি: ${key.slice(0, 10)}...`,
          userPhone: key.startsWith('01') ? key : '',
          userEmail: key.includes('@') ? key : '',
          planId: 'whitelist_lifetime',
          planTitle: 'আজীবন হোয়াইটলিস্ট',
          amount: 0,
          paymentMethod: 'whitelist',
          trxId: 'WHITELIST',
          durationDays: 99999,
          isLifetime: true,
          status: 'active',
          source: 'whitelist',
          expiryInfo
        });
      }
    });

    return Array.from(map.values());
  }, [allRequests, allSubscriptions, whitelistedUsers, plans, nowTicker]);

  // Real-time KPI Stats
  const stats = useMemo(() => {
    let active = 0;
    let expiringSoon = 0;
    let expiringToday = 0;
    let expired = 0;
    let lifetime = 0;

    unifiedSubscribers.forEach((sub) => {
      if (sub.isLifetime) {
        lifetime++;
      } else if (sub.expiryInfo.isExpired) {
        expired++;
      } else if (sub.expiryInfo.isExpiringToday) {
        expiringToday++;
        expiringSoon++;
      } else if (sub.expiryInfo.isExpiringSoon) {
        expiringSoon++;
      } else {
        active++;
      }
    });

    return {
      total: unifiedSubscribers.length,
      active,
      expiringSoon,
      expiringToday,
      expired,
      lifetime
    };
  }, [unifiedSubscribers]);

  // Filter and Sort logic
  const filteredList = useMemo(() => {
    return unifiedSubscribers
      .filter((sub) => {
        if (statusFilter === 'expiring_today' && !sub.expiryInfo.isExpiringToday) return false;
        if (statusFilter === 'expiring_soon' && !sub.expiryInfo.isExpiringSoon) return false;
        if (statusFilter === 'expired' && !sub.expiryInfo.isExpired) return false;
        if (statusFilter === 'active' && (sub.expiryInfo.isExpired || sub.isLifetime)) return false;
        if (statusFilter === 'lifetime' && !sub.isLifetime) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = sub.userName?.toLowerCase().includes(q);
          const matchPhone = sub.userPhone?.toLowerCase().includes(q);
          const matchEmail = sub.userEmail?.toLowerCase().includes(q);
          const matchUid = sub.userId?.toLowerCase().includes(q);
          const matchTrx = sub.trxId?.toLowerCase().includes(q);
          const matchPlan = sub.planTitle?.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchEmail && !matchUid && !matchTrx && !matchPlan) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'soonest') {
          if (a.isLifetime && !b.isLifetime) return 1;
          if (!a.isLifetime && b.isLifetime) return -1;
          if (a.expiryInfo.isExpired && !b.expiryInfo.isExpired) return 1;
          if (!a.expiryInfo.isExpired && b.expiryInfo.isExpired) return -1;
          const aTime = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
          const bTime = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
          return aTime - bTime;
        }
        if (sortBy === 'expired_first') {
          if (a.expiryInfo.isExpired && !b.expiryInfo.isExpired) return -1;
          if (!a.expiryInfo.isExpired && b.expiryInfo.isExpired) return 1;
          const aTime = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
          const bTime = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
          return bTime - aTime;
        }
        if (sortBy === 'newest') {
          const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bCreated - aCreated;
        }
        if (sortBy === 'longest') {
          const aTime = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
          const bTime = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
          return bTime - aTime;
        }
        return 0;
      });
  }, [unifiedSubscribers, statusFilter, searchQuery, sortBy]);

  // Quick 1-click extend handler
  const handleQuickExtend = async (sub: TrackedSubscriberItem, days: number) => {
    setExtendingUserId(sub.userId);
    try {
      const res = await extendOrReactivateSubscription(sub.userId, days, false, sub.requestId);
      if (res) {
        toast.success(
          language === 'bn'
            ? `${sub.userName}-এর মেয়াদ +${toBengaliDigits(days)} দিন বাড়ানো হয়েছে!`
            : `Extended +${days} days for ${sub.userName}!`
        );
      } else {
        toast.error('মেয়াদ বাড়াতে সমস্যা হয়েছে');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to extend subscription');
    } finally {
      setExtendingUserId(null);
    }
  };

  // WhatsApp renewal notice launcher
  const handleWhatsAppAlert = (sub: TrackedSubscriberItem) => {
    const rawPhone = sub.userPhone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    let targetPhone = cleanPhone;
    if (targetPhone.startsWith('01')) {
      targetPhone = '88' + targetPhone;
    }
    const message = generateRenewalWhatsAppMessage({
      userName: sub.userName,
      planTitle: sub.planTitle,
      remainingText: sub.expiryInfo.statusLabelBn,
      isExpired: sub.expiryInfo.isExpired,
      bkashNumber: config.paymentNumbers?.bkash,
      nagadNumber: config.paymentNumbers?.nagad
    });
    const url = targetPhone 
      ? `https://wa.me/${targetPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  // Live Current Time display
  const liveClockString = new Date(nowTicker).toLocaleTimeString(
    language === 'bn' ? 'bn-BD' : 'en-US',
    { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Header Banner with Live Clock & Status */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs">
                <Timer size={20} className="animate-spin" style={{ animationDuration: '10s' }} />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                {language === 'bn' ? 'লাইভ কাউন্টডাউন ও এক্সপায়ার ট্র্যাকিং' : 'Live Countdown & Expiry Tracking'}
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              {language === 'bn'
                ? 'প্রতি সেকেন্ডে রিয়েল-টাইম টাইমার আপডেট, জরুরি রিনিউয়াল এলার্ট মনিটরিং এবং ১-ক্লিকে মেয়াদ বৃদ্ধি ও হোয়াটসঅ্যাপ রিমাইন্ডার সেন্টার।'
                : 'Real-time second-by-second countdown clock, expiry monitoring, instant duration extension and WhatsApp reminder alerts.'}
            </p>
          </div>

          {/* Live Digital Clock HUD */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-3 shrink-0 self-start sm:self-center">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {language === 'bn' ? 'সিস্টেম লাইভ ঘড়ি' : 'System Clock'}
              </span>
              <span className="font-mono text-xs sm:text-sm font-black text-amber-300">
                {liveClockString}
              </span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/40" />
          </div>
        </div>
      </div>

      {/* 2. Top 4 Live KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        
        {/* Card 1: Active VIPs */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-slate-950 border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1.5">
            <span className="font-bold text-[11px] uppercase tracking-wider">
              {language === 'bn' ? 'সক্রিয় ভিআইপি' : 'Active VIPs'}
            </span>
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {toBengaliDigits(stats.active)}
            </span>
            <span className="text-[10px] font-bold text-emerald-400">
              {language === 'bn' ? 'জন চলছে' : 'active'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{language === 'bn' ? 'কাউন্টডাউন সচল' : 'Clock ticking'}</span>
          </div>
        </button>

        {/* Card 2: Expiring Soon */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'expiring_soon' ? 'all' : 'expiring_soon')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'expiring_soon'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-slate-950 border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1.5">
            <span className="font-bold text-[11px] uppercase tracking-wider text-amber-400">
              {language === 'bn' ? 'জরুরি রিনিউ (≤৩ দিন)' : 'Expiring Soon'}
            </span>
            <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
              <Flame size={14} className="animate-pulse" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {toBengaliDigits(stats.expiringSoon)}
            </span>
            <span className="text-[10px] font-bold text-amber-300">
              {language === 'bn' ? 'জন তাগাদা' : 'alerts'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-amber-400/90 flex items-center gap-1 font-bold">
            <AlertCircle size={10} />
            <span>{language === 'bn' ? 'হোয়াটসঅ্যাপে তাগাদা দিন' : 'Send WhatsApp'}</span>
          </div>
        </button>

        {/* Card 3: Expired Accounts */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'expired'
              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-slate-950 border-slate-800 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1.5">
            <span className="font-bold text-[11px] uppercase tracking-wider text-rose-400">
              {language === 'bn' ? 'মেয়াদোত্তীর্ণ (লকড)' : 'Expired'}
            </span>
            <span className="p-1 rounded-lg bg-rose-500/10 text-rose-400">
              <XCircle size={14} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
              {toBengaliDigits(stats.expired)}
            </span>
            <span className="text-[10px] font-bold text-rose-300">
              {language === 'bn' ? 'জন বন্ধ' : 'expired'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-rose-400/90 flex items-center gap-1 font-bold">
            <RefreshCw size={10} />
            <span>{language === 'bn' ? '১-ক্লিকে রিয়্যাক্টিভেট' : '1-click reactivate'}</span>
          </div>
        </button>

        {/* Card 4: Lifetime VIPs */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'lifetime' ? 'all' : 'lifetime')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'lifetime'
              ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30'
              : 'bg-slate-950 border-slate-800 hover:border-indigo-500/40'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1.5">
            <span className="font-bold text-[11px] uppercase tracking-wider text-indigo-300">
              {language === 'bn' ? 'আজীবন মেম্বার' : 'Lifetime VIP'}
            </span>
            <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Crown size={14} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-indigo-300 font-mono">
              {toBengaliDigits(stats.lifetime)}
            </span>
            <span className="text-[10px] font-bold text-indigo-400">
              {language === 'bn' ? 'জন স্থায়ী' : 'unlimited'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-indigo-300/80 flex items-center gap-1 font-mono">
            <span>♾️ {language === 'bn' ? 'আনলিমিটেড মেয়াদ' : 'Never expires'}</span>
          </div>
        </button>
      </div>

      {/* 3. Search & Quick Filter Controls */}
      <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'গ্রাহকের নাম, মোবাইল নম্বর, ট্রানজেকশন ID বা UID দিয়ে খুঁজুন...'
                  : 'Search by user name, phone number, TrxID or UID...'
              }
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 px-2.5 py-2 focus:outline-none focus:border-amber-500 cursor-pointer font-bold"
            >
              <option value="soonest">{language === 'bn' ? 'শীঘ্রই মেয়াদ শেষ আগে' : 'Expiring Soonest'}</option>
              <option value="expired_first">{language === 'bn' ? 'মেয়াদোত্তীর্ণগুলো আগে' : 'Expired First'}</option>
              <option value="newest">{language === 'bn' ? 'নতুন অ্যাক্টিভেশন আগে' : 'Newest Approved'}</option>
              <option value="longest">{language === 'bn' ? 'দীর্ঘতম মেয়াদ আগে' : 'Longest Duration'}</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'bn' ? 'সকল গ্রাহক' : 'All'} ({unifiedSubscribers.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('expiring_today')}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1 ${
              statusFilter === 'expiring_today'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-900 text-rose-400 hover:text-rose-300'
            }`}
          >
            <Flame size={12} />
            <span>{language === 'bn' ? 'আজই শেষ' : 'Ends Today'}</span>
            <span className="text-[10px] px-1 rounded-full bg-slate-950/40 font-mono">
              {stats.expiringToday}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('expiring_soon')}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1 ${
              statusFilter === 'expiring_soon'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-900 text-amber-400 hover:text-amber-300'
            }`}
          >
            <Hourglass size={12} />
            <span>{language === 'bn' ? 'শীঘ্রই শেষ (≤৩ দিন)' : 'Expiring in 3d'}</span>
            <span className="text-[10px] px-1 rounded-full bg-slate-950/40 font-mono">
              {stats.expiringSoon}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1 ${
              statusFilter === 'expired'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-rose-400'
            }`}
          >
            <XCircle size={12} />
            <span>{language === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Expired'}</span>
            <span className="text-[10px] px-1 rounded-full bg-slate-950/40 font-mono">
              {stats.expired}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1 ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-900 text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 size={12} />
            <span>{language === 'bn' ? 'সম্পূর্ণ সক্রিয়' : 'Active Safe'}</span>
            <span className="text-[10px] px-1 rounded-full bg-slate-950/40 font-mono">
              {stats.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('lifetime')}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1 ${
              statusFilter === 'lifetime'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-900 text-indigo-400 hover:text-indigo-300'
            }`}
          >
            <Crown size={12} />
            <span>{language === 'bn' ? 'আজীবন' : 'Lifetime'}</span>
            <span className="text-[10px] px-1 rounded-full bg-slate-950/40 font-mono">
              {stats.lifetime}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Live Subscribers Countdown Cards Grid */}
      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredList.map((sub) => {
            const exp = sub.expiryInfo;
            const isWorking = extendingUserId === sub.userId;

            return (
              <div
                key={sub.id}
                className={`bg-slate-950 border rounded-2xl p-4 transition-all space-y-3.5 relative overflow-hidden ${
                  sub.isLifetime
                    ? 'border-indigo-500/40 hover:border-indigo-500/70 shadow-sm'
                    : exp.isExpired
                    ? 'border-rose-500/50 hover:border-rose-500/80 shadow-sm bg-gradient-to-b from-rose-950/10 to-slate-950'
                    : exp.isExpiringToday
                    ? 'border-rose-500/60 hover:border-rose-500/90 shadow-sm ring-1 ring-rose-500/30'
                    : exp.isExpiringSoon
                    ? 'border-amber-500/50 hover:border-amber-500/80 shadow-sm'
                    : 'border-emerald-500/40 hover:border-emerald-500/70'
                }`}
              >
                {/* Top User Header & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white truncate">
                        {sub.userName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {sub.planTitle}
                      </span>
                    </div>

                    {/* Phone / Email / User ID row */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      {sub.userPhone ? (
                        <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <Phone size={11} />
                          {sub.userPhone}
                        </span>
                      ) : sub.userEmail ? (
                        <span className="text-slate-300 font-mono">
                          {sub.userEmail}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">
                          ID: {sub.userId.slice(0, 10)}...
                        </span>
                      )}

                      {sub.trxId && sub.trxId !== 'WHITELIST' && sub.trxId !== 'ADMIN_MANUAL' && (
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          Trx: {sub.trxId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${exp.badgeBgColor} ${exp.badgeTextColor} ${exp.badgeBorderColor}`}
                  >
                    {sub.isLifetime ? (
                      <>
                        <Crown size={11} />
                        <span>আজীবন ভিআইপি</span>
                      </>
                    ) : exp.isExpired ? (
                      <>
                        <XCircle size={11} />
                        <span>মেয়াদোত্তীর্ণ</span>
                      </>
                    ) : exp.isExpiringToday ? (
                      <>
                        <Flame size={11} className="animate-pulse" />
                        <span>আজই শেষ</span>
                      </>
                    ) : exp.isExpiringSoon ? (
                      <>
                        <Hourglass size={11} className="animate-pulse" />
                        <span>শীঘ্রই শেষ</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={11} />
                        <span>সক্রিয়</span>
                      </>
                    )}
                  </span>
                </div>

                {/* 5. Live Digital Countdown HUD Clock Box */}
                <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-inner space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Timer size={13} className={exp.isExpired ? 'text-rose-400' : 'text-amber-400 animate-pulse'} />
                      {language === 'bn' ? 'লাইভ ডিজিটাল টাইমার' : 'Live Countdown HUD'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {sub.isLifetime
                        ? 'স্থায়ী সদস্যপদ'
                        : exp.isExpired
                        ? (exp.elapsedSinceExpiryBn || 'মেয়াদ শেষ')
                        : `${language === 'bn' ? 'মেয়াদ:' : 'Expiry:'} ${exp.formattedExpiryBn}`}
                    </span>
                  </div>

                  {sub.isLifetime ? (
                    <div className="py-2.5 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center justify-center gap-2 font-black text-xs">
                      <Sparkles size={16} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                      <span>আজীবন আনলিমিটেড অ্যাক্সেস (Lifetime Unlimited VIP)</span>
                    </div>
                  ) : exp.isExpired ? (
                    <div className="py-2.5 px-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-2 font-black text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle size={16} className="text-rose-400 shrink-0" />
                        <span className="truncate">মেয়াদ শেষ ({exp.elapsedSinceExpiryBn})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickExtend(sub, 30)}
                        disabled={isWorking}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0 shadow-xs active:scale-95"
                      >
                        {isWorking ? 'চালু হচ্ছে...' : 'পুনরায় চালু (+৩০ দিন)'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* 4 Block Digital Clocks */}
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        <div className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-1">
                          <span className="block text-base sm:text-lg font-black font-mono text-amber-400 tracking-wider">
                            {exp.liveDigitsBn.days}
                          </span>
                          <span className="block text-[9px] uppercase font-bold text-slate-400">দিন</span>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-1">
                          <span className="block text-base sm:text-lg font-black font-mono text-amber-400 tracking-wider">
                            {exp.liveDigitsBn.hours}
                          </span>
                          <span className="block text-[9px] uppercase font-bold text-slate-400">ঘণ্টা</span>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-1">
                          <span className="block text-base sm:text-lg font-black font-mono text-amber-400 tracking-wider">
                            {exp.liveDigitsBn.minutes}
                          </span>
                          <span className="block text-[9px] uppercase font-bold text-slate-400">মিনিট</span>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-1 ring-1 ring-emerald-500/30">
                          <span className="block text-base sm:text-lg font-black font-mono text-emerald-400 tracking-wider animate-pulse">
                            {exp.liveDigitsBn.seconds}
                          </span>
                          <span className="block text-[9px] uppercase font-bold text-emerald-400">সেকেন্ড</span>
                        </div>
                      </div>

                      {/* Expiry Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>বাকি আছে: {exp.percentRemaining}%</span>
                          <span className={exp.isExpiringToday ? 'text-rose-400 font-bold' : exp.isExpiringSoon ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                            {exp.statusLabelBn}
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-1000 ${
                              exp.isExpiringToday
                                ? 'bg-rose-500 animate-pulse'
                                : exp.isExpiringSoon
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(2, exp.percentRemaining)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Quick 1-Click Duration Extension Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold flex items-center gap-1">
                      <Zap size={12} className="text-amber-400" />
                      {language === 'bn' ? '১-ক্লিকে মেয়াদ বৃদ্ধি করুন:' : 'Quick Extend:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenCustomExtendModal({
                        userId: sub.userId,
                        userName: sub.userName,
                        userPhone: sub.userPhone,
                        requestId: sub.requestId,
                        currentExpiry: sub.expiresAt,
                        isLifetime: sub.isLifetime
                      })}
                      className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      {language === 'bn' ? 'কাস্টম দিন' : 'Custom'}
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleQuickExtend(sub, 7)}
                      disabled={isWorking}
                      className="py-1 px-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-center cursor-pointer transition-colors disabled:opacity-50"
                    >
                      +৭ দিন
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickExtend(sub, 15)}
                      disabled={isWorking}
                      className="py-1 px-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-center cursor-pointer transition-colors disabled:opacity-50"
                    >
                      +১৫ দিন
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickExtend(sub, 30)}
                      disabled={isWorking}
                      className="py-1 px-1.5 rounded-lg bg-slate-900 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-800 text-amber-400 font-bold text-center cursor-pointer transition-colors disabled:opacity-50"
                    >
                      +১ মাস
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickExtend(sub, 365)}
                      disabled={isWorking}
                      className="py-1 px-1.5 rounded-lg bg-slate-900 hover:bg-indigo-500/20 hover:border-indigo-500/40 border border-slate-800 text-indigo-300 font-bold text-center cursor-pointer transition-colors disabled:opacity-50"
                    >
                      +১ বছর
                    </button>
                  </div>
                </div>

                {/* 7. Action Footer: WhatsApp, Call, UID Copy, Delete */}
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp Reminder Button */}
                    <button
                      type="button"
                      onClick={() => handleWhatsAppAlert(sub)}
                      className="py-1.5 px-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold cursor-pointer transition-colors active:scale-95"
                      title="হোয়াটসঅ্যাপে রিনিউ তাগাদা দিন"
                    >
                      <MessageCircle size={13} />
                      <span>{language === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                    </button>

                    {/* Direct Call Button */}
                    {sub.userPhone && (
                      <a
                        href={`tel:${sub.userPhone}`}
                        className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                        title="সরাসরি ফোন দিন"
                      >
                        <Phone size={13} />
                      </a>
                    )}

                    {/* Copy User ID */}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(sub.userId, `uid_${sub.id}`)}
                      className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                      title="ইউজার আইডি কপি করুন"
                    >
                      {copiedId === `uid_${sub.id}` ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  </div>

                  {/* Revoke / Delete Button */}
                  <button
                    type="button"
                    onClick={() => onOpenDeleteModal({
                      id: sub.userId || sub.userPhone || sub.id,
                      userId: sub.userId,
                      requestId: sub.requestId,
                      phone: sub.userPhone,
                      name: sub.userName,
                      type: sub.source === 'whitelist' ? 'whitelist' : sub.source === 'subscription_doc' ? 'subscription' : 'request',
                      title: language === 'bn' ? 'সাবস্ক্রিপশন বাতিল ও ইউজার ডিলিট' : 'Revoke & Delete Subscription',
                      message: language === 'bn'
                        ? `"${sub.userName}"-এর সাবস্ক্রিপশন কি আপনি স্থায়ীভাবে বাতিল ও তালিকা থেকে মুছে ফেলতে চান?`
                        : `Are you sure you want to permanently revoke and delete subscription for ${sub.userName}?`
                    })}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                    title="সাবস্ক্রিপশন বাতিল করুন"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <div className="p-3 bg-slate-900 text-slate-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
            <Search size={20} />
          </div>
          <h4 className="text-sm font-bold text-white">
            {language === 'bn' ? 'কোনো সাবস্ক্রিপশন তথ্য পাওয়া যায়নি' : 'No Subscriptions Found'}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? (language === 'bn' ? 'অনুসন্ধান ফিল্টারের সাথে কোনো রেকর্ড মেলেনি।' : 'No subscribers matched your search filter.')
              : (language === 'bn' ? 'বর্তমানে এই ক্যাটাগরিতে কোনো গ্রাহকের রেকর্ড নেই।' : 'No active records in this category.')}
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="mt-2 text-xs font-bold text-amber-400 hover:underline cursor-pointer"
            >
              {language === 'bn' ? 'সকল ফিল্টার রিসেট করুন' : 'Reset all filters'}
            </button>
          )}
        </div>
      )}

    </div>
  );
}
