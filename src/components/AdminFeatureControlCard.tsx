import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig, FeatureControls } from '../contexts/SystemConfigContext';
import { 
  Crown, 
  Settings2, 
  Check, 
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
  MessageCircle,
  Sparkles,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFeatureControlCard() {
  const { language } = useLanguage();
  const { config, isAdmin, updateConfig, addUserToWhitelist, removeUserFromWhitelist } = useSystemConfig();
  
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [newWhitelistInput, setNewWhitelistInput] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>(String(config.subscriptionPrice || 150));
  const [storePriceInput, setStorePriceInput] = useState<string>(String(config.storeListingPrice || 500));
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isAdmin) return null;

  const handleToggle = async (key: keyof FeatureControls) => {
    setIsSaving(true);
    const currentValue = Boolean(config[key]);
    await updateConfig({ [key]: !currentValue });
    setIsSaving(false);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(priceInput, 10);
    if (isNaN(num) || num < 0) {
      toast.error('সঠিক মূল্য লিখুন');
      return;
    }
    setIsSaving(true);
    await updateConfig({ subscriptionPrice: num });
    setIsSaving(false);
  };

  const handleSaveStorePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(storePriceInput, 10);
    if (isNaN(num) || num < 0) {
      toast.error('দোকান লিস্টিংয়ের সঠিক মূল্য লিখুন');
      return;
    }
    setIsSaving(true);
    await updateConfig({ storeListingPrice: num });
    setIsSaving(false);
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhitelistInput.trim()) return;
    setIsSaving(true);
    await addUserToWhitelist(newWhitelistInput.trim());
    setNewWhitelistInput('');
    setIsSaving(false);
  };

  const handleRemoveWhitelist = async (id: string) => {
    setIsSaving(true);
    await removeUserFromWhitelist(id);
    setIsSaving(false);
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
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black text-amber-950">
                {language === 'bn' ? 'মাস্টার অ্যাডমিন কন্ট্রোল প্যানেল' : 'Master Feature Controls'}
              </h3>
              <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                ADMIN
              </span>
            </div>
            <p className="text-[10px] text-amber-800 font-bold truncate">
              {language === 'bn' 
                ? 'পোস্ট উন্মুক্ত রাখা বা সাবস্ক্রিপশন কন্টাক্ট চালু করুন' 
                : 'Toggle feature locks & manage whitelist access'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="py-1 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 rounded-xl text-xs font-black flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? (language === 'bn' ? 'লুকান' : 'Hide') : (language === 'bn' ? 'সেটিংস' : 'Manage')}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded Control Section */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-4 animate-in fade-in duration-150">
          
          {/* Master Global App Lock (When user base grows) */}
          <div className="bg-gradient-to-r from-red-600/10 via-amber-600/10 to-orange-600/10 border-2 border-red-400/80 rounded-xl p-3">
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
                <p className="text-[10.5px] text-slate-700 font-bold leading-tight">
                  {language === 'bn'
                    ? 'এটি অন করলে শুধু ভিআইপি ইউজাররা অ্যাপ ব্যবহার করতে পারবেন। সাধারণ ইউজারদের সাবস্ক্রিপশন নিতে বলা হবে।'
                    : 'When enabled, only whitelisted VIP users can use the app tools. Free users are prompted to subscribe.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggle('appLockRequired')}
                disabled={isSaving}
                className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                  config.appLockRequired 
                    ? 'bg-red-600 text-white shadow-sm' 
                    : 'bg-emerald-600 text-white shadow-sm'
                }`}
              >
                {config.appLockRequired ? <Lock size={12} /> : <Unlock size={12} />}
                <span>
                  {config.appLockRequired 
                    ? (language === 'bn' ? 'সম্পূর্ণ অ্যাপ লক' : 'App Locked') 
                    : (language === 'bn' ? 'অ্যাপ উন্মুক্ত' : 'App Open')}
                </span>
              </button>
            </div>

            {/* Configurable General User Subscription Price */}
            <div className="mt-3 pt-2.5 border-t border-amber-300/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-amber-700" />
                <span className="text-xs font-bold text-amber-950">
                  {language === 'bn' ? 'সাধারণ খামারি সাবস্ক্রিপশন (টাকা):' : 'General Farmer Sub (BDT):'}
                </span>
              </div>
              <form onSubmit={handleSavePrice} className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-700">৳</span>
                <input
                  type="number"
                  min="0"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-amber-400 rounded-lg text-xs font-black text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-center"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Save size={12} />
                  <span>{language === 'bn' ? 'সেভ' : 'Save'}</span>
                </button>
              </form>
            </div>

            {/* Configurable Store / Dealer / Ad Listing Price */}
            <div className="mt-2 pt-2 border-t border-amber-300/40 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950">
                  {language === 'bn' ? 'দোকান/ডিলার বিজ্ঞাপন ও লিস্টিং ফি (টাকা):' : 'Store/Dealer Ad Listing Fee (BDT):'}
                </span>
              </div>
              <form onSubmit={handleSaveStorePrice} className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-700">৳</span>
                <input
                  type="number"
                  min="0"
                  value={storePriceInput}
                  onChange={(e) => setStorePriceInput(e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-emerald-400 rounded-lg text-xs font-black text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-center"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Save size={12} />
                  <span>{language === 'bn' ? 'সেভ' : 'Save'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* All-in-One Policy Overview Badge */}
          <div className="bg-amber-100/90 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-950 font-bold">
            <Sparkles size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-950">
                {language === 'bn' ? `💡 ৳${config.subscriptionPrice || 150} অল-ইন-ওয়ান প্যাকেজ পলিসি:` : `💡 BDT ${config.subscriptionPrice || 150} All-in-One VIP Model:`}
              </p>
              <p className="text-[11px] text-amber-900 font-medium mt-0.5 leading-snug">
                {language === 'bn' 
                  ? `কোনো ফিচার লক থাকলে ইউজাররা নির্ধারিত ৳${config.subscriptionPrice || 150} টাকার অল-ইন-ওয়ান অফার দেখতে পাবেন। পেমেন্ট পাওয়ার পর নিচে তাঁর মোবাইল নম্বর (যেমন: 017xxxxxxxx) বা জিমেইল যুক্ত করলেই সম্পূর্ণ অ্যাপ আনলক হয়ে যাবে।` 
                  : `Locked features show users the configured BDT ${config.subscriptionPrice || 150} all-inclusive offer. After receiving payment, add their mobile number (e.g. 017xxxxxxxx) or Gmail to instantly unlock all features.`}
              </p>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-3 border border-amber-200/80">
            <h4 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
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
                    {config.marketplacePostFree ? (language === 'bn' ? 'সবার জন্য ফ্রি' : 'Free for all') : (language === 'bn' ? 'লকড (অ্যাডমিন যোগাযোগ)' : 'Locked / Subscription')}
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
                    {config.marketplaceBuyerFree ? (language === 'bn' ? 'সবার জন্য ফ্রি' : 'Free for all') : (language === 'bn' ? 'লকড (অ্যাডমিন যোগাযোগ)' : 'Locked / Subscription')}
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

              {/* 3. Doctor Registration & Listing */}
              <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                <div>
                  <p className="font-extrabold text-slate-850">
                    {language === 'bn' ? '৩. ডাক্তার/বিশেষজ্ঞ প্রোফাইল যুক্ত করা' : '3. Doctor Profile Registration'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {config.doctorListingFree ? (language === 'bn' ? 'সবার জন্য ফ্রি' : 'Free for all') : (language === 'bn' ? 'লকড (অ্যাডমিন যোগাযোগ)' : 'Locked / Subscription')}
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
                    {config.duesKhataFree !== false ? (language === 'bn' ? 'সবার জন্য ফ্রি' : 'Free for all') : (language === 'bn' ? 'লকড (সাবস্ক্রিপশন / VIP অনুমতি)' : 'Locked / Subscription')}
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

              {/* 5. Agro & Vet Feed/Medicine Store Directory */}
              <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                <div>
                  <p className="font-extrabold text-slate-850">
                    {language === 'bn' ? '৫. ফিড ও ঔষধ দোকান / স্টোর ডিরেক্টরি লিস্টিং' : '5. Feed & Vet Store Directory Listing'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {config.storeListingFree !== false ? (language === 'bn' ? 'সবার জন্য ফ্রি' : 'Free for all') : (language === 'bn' ? 'লকড (সাবস্ক্রিপশন / VIP দোকানদার)' : 'Locked / Subscription')}
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

          {/* User Whitelist Section (Unlock specific customers) */}
          <div className="bg-white/80 rounded-xl p-3 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Users size={14} className="text-indigo-600" />
                <span>{language === 'bn' ? 'নির্দিষ্ট অনুমোদিত ইউজার তালিকা (VIP List)' : 'Whitelisted VIP Users'}</span>
              </h4>
              <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-sans">
                {config.whitelistedUsers?.length || 0}
              </span>
            </div>
            
            <p className="text-[10px] text-slate-500 font-bold leading-tight">
              {language === 'bn'
                ? 'যাঁরা সাবস্ক্রিপশন নিয়েছেন বা অনুমতি পেয়েছেন তাদের মোবাইল নম্বর (যেমন: 017xxxxxxxx) অথবা জিমেইল আইডি এখানে যোগ করুন। নম্বর বা জিমেইল যেকোনোটি দিলে সাথে সাথে আনলক হয়ে যাবে।'
                : 'Add customer mobile numbers (e.g. 017xxxxxxxx) or Gmail addresses to grant instant VIP unlock.'}
            </p>

            <form onSubmit={handleAddWhitelist} className="flex gap-2">
              <input
                type="text"
                value={newWhitelistInput}
                onChange={(e) => setNewWhitelistInput(e.target.value)}
                placeholder="মোবাইল নম্বর (017...) বা জিমেইল লিখুন..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={isSaving || !newWhitelistInput.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>{language === 'bn' ? 'যোগ করুন' : 'Add'}</span>
              </button>
            </form>

            {/* Whitelist Tags */}
            {config.whitelistedUsers && config.whitelistedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {config.whitelistedUsers.map((userIdent) => (
                  <span
                    key={userIdent}
                    className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg"
                  >
                    <span>{userIdent}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWhitelist(userIdent)}
                      className="text-red-500 hover:text-red-700 p-0.5 hover:bg-red-50 rounded cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">
                {language === 'bn' ? 'কোনো নির্দিষ্ট ইউজার যুক্ত নেই।' : 'No individual users whitelisted yet.'}
              </p>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
