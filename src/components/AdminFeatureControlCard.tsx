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
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFeatureControlCard() {
  const { language } = useLanguage();
  const { config, isAdmin, updateConfig, addUserToWhitelist, removeUserFromWhitelist } = useSystemConfig();
  
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [newWhitelistInput, setNewWhitelistInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isAdmin) return null;

  const handleToggle = async (key: keyof FeatureControls) => {
    setIsSaving(true);
    const currentValue = Boolean(config[key]);
    await updateConfig({ [key]: !currentValue });
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
          
          <div className="bg-white/80 rounded-xl p-3 border border-amber-200/80">
            <h4 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
              <Settings2 size={14} className="text-amber-600" />
              <span>{language === 'bn' ? 'ফিচার অ্যাক্সেস সুইচ (ফ্রি / লক)' : 'Feature Access Switches'}</span>
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
