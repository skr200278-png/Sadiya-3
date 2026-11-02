import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig, BroadcastNoticeConfig } from '../contexts/SystemConfigContext';
import { 
  Crown, 
  Settings2, 
  Save, 
  Phone, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Megaphone,
  Radio,
  FileText,
  AlertTriangle,
  HeartHandshake,
  TrendingUp,
  Sparkles,
  Power,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Clean Admin Hub:
 * - Simple Helpline and Notice management
 * - Live Scrolling Announcement Ticker for urgent alerts, market tips & prayer requests
 * - Zero developer jargon, zero payment gateways
 */
export default function AdminFeatureControlCard() {
  const { language } = useLanguage();
  const { 
    config, 
    isAdmin, 
    updateConfig 
  } = useSystemConfig();
  
  // Collapsed by default so it never clutters the UI
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'broadcast' | 'support' | 'disclaimer'>('broadcast');

  // Support contact form states
  const [adminPhoneInput, setAdminPhoneInput] = useState(config.adminPhone || '01622384379');
  const [adminWaInput, setAdminWaInput] = useState(config.adminWhatsApp || '8801622384379');
  const [adminEmailInput, setAdminEmailInput] = useState(config.adminEmail || 'skabusufian452@gmail.com');
  const [adminNameInput, setAdminNameInput] = useState(config.adminName || 'আবু সুফিয়ান');
  const [disclaimerBn, setDisclaimerBn] = useState(config.disclaimerTextBn || '');
  const [disclaimerEn, setDisclaimerEn] = useState(config.disclaimerTextEn || '');

  // Live Broadcast Notice states
  const [broadcastEnabled, setBroadcastEnabled] = useState<boolean>(
    config.broadcastNotice?.enabled ?? false
  );
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    config.broadcastNotice?.message ?? ''
  );
  const [broadcastCategory, setBroadcastCategory] = useState<BroadcastNoticeConfig['category']>(
    config.broadcastNotice?.category ?? 'prayer'
  );

  const [isSaving, setIsSaving] = useState(false);

  // Sync state if config updates from firestore
  useEffect(() => {
    if (config.broadcastNotice) {
      setBroadcastEnabled(config.broadcastNotice.enabled ?? false);
      setBroadcastMessage(config.broadcastNotice.message ?? '');
      setBroadcastCategory(config.broadcastNotice.category ?? 'prayer');
    }
  }, [config.broadcastNotice]);

  if (!isAdmin) return null;

  // Preset ready-made templates for one-tap convenience
  const presets = [
    {
      category: 'prayer' as const,
      label: language === 'bn' ? '🤲 অসুস্থতা / দোয়া' : '🤲 Prayer Request',
      text: 'সম্মানিত খামারি ভাইয়েরা, আমাদের এক খামারি ভাই অসুস্থ। সবাই তার দ্রুত সুস্থতার জন্য খাস দিলে দোয়া করুন।',
    },
    {
      category: 'market' as const,
      label: language === 'bn' ? '📈 মুরগী বাজার ও সুযোগ' : '📈 Poultry Market Tip',
      text: 'বাজার পূর্বাভাস: এখন মুরগী পালন একটু ঝুঁকিপূর্ণ হলেও এই সময়ে বাচ্চা তুললে আগামীতে বেশ ভালো লাভে বিক্রির সম্ভাবনা রয়েছে।',
    },
    {
      category: 'warning' as const,
      label: language === 'bn' ? '⚠️ আবহাওয়া / সতর্কতা' : '⚠️ Weather Alert',
      text: 'জরুরী সতর্কতা: তীব্র গরম / ঠান্ডা ও বৈরী আবহাওয়ায় শেডের তাপমাত্রা ও পর্যাপ্ত ভিটামিন-সি/স্যালাইন পানির নিয়মিত ব্যবস্থা রাখুন।',
    },
    {
      category: 'general' as const,
      label: language === 'bn' ? '📢 সাধারণ ঘোষণা' : '📢 General Notice',
      text: 'ফার্ম ম্যানেজার অ্যাপে নতুন সুবিধা যোগ করা হয়েছে। যেকোনো প্রয়োজনে সরাসরি অ্যাডমিন হেল্পলাইনে যোগাযোগ করতে পারেন।',
    },
  ];

  const handleApplyPreset = (item: typeof presets[0]) => {
    setBroadcastCategory(item.category);
    setBroadcastMessage(item.text);
    setBroadcastEnabled(true);
    toast.success(language === 'bn' ? 'নমুনা নোটিশ বসানো হয়েছে!' : 'Preset applied!');
  };

  const handleSaveBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (broadcastEnabled && !broadcastMessage.trim()) {
      toast.error(language === 'bn' ? 'দয়া করে নোটিশের বার্তাটি লিখুন।' : 'Please enter notice message.');
      return;
    }

    setIsSaving(true);
    try {
      await updateConfig({
        broadcastNotice: {
          enabled: broadcastEnabled,
          message: broadcastMessage.trim(),
          category: broadcastCategory,
          updatedAt: new Date().toISOString(),
          authorName: adminNameInput || 'অ্যাডমিন',
        }
      });
      toast.success(
        broadcastEnabled
          ? (language === 'bn' ? '🎉 লাইভ নোটিশ অ্যাপে সফলভাবে চালু হয়েছে!' : 'Live notice published!')
          : (language === 'bn' ? 'লাইভ নোটিশ বন্ধ করা হয়েছে।' : 'Live notice disabled.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNoticeQuick = async () => {
    const nextState = !broadcastEnabled;
    setBroadcastEnabled(nextState);
    if (!broadcastMessage.trim() && nextState) {
      toast.error(language === 'bn' ? 'আগে বার্তা লিখুন বা নিচের নমুনা বাটনে চাপ দিন।' : 'Please enter a message first.');
      return;
    }
    setIsSaving(true);
    try {
      await updateConfig({
        broadcastNotice: {
          enabled: nextState,
          message: broadcastMessage.trim(),
          category: broadcastCategory,
          updatedAt: new Date().toISOString(),
          authorName: adminNameInput || 'অ্যাডমিন',
        }
      });
      toast.success(
        nextState 
          ? (language === 'bn' ? 'লাইভ নোটিশ চালু হয়েছে!' : 'Live notice activated!')
          : (language === 'bn' ? 'লাইভ নোটিশ বন্ধ করা হয়েছে।' : 'Live notice turned off.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSupportAndDisclaimer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateConfig({
        adminPhone: adminPhoneInput,
        adminWhatsApp: adminWaInput,
        adminEmail: adminEmailInput,
        adminName: adminNameInput,
        disclaimerTextBn: disclaimerBn,
        disclaimerTextEn: disclaimerEn
      });
      toast.success(language === 'bn' ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে' : 'Settings saved successfully');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-100 shadow-md my-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <Crown size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{language === 'bn' ? 'অ্যাডমিন কন্ট্রোল সেন্টার' : 'Admin Control Center'}</span>
              {broadcastEnabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" title="Live notice is active" />
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              {language === 'bn' ? 'অ্যাপের লাইভ নোটিশ, হেল্পলাইন ও সতর্কতা বার্তা' : 'Live notice, helpline & safety controls'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? (language === 'bn' ? 'লুকান' : 'Hide') : (language === 'bn' ? 'খুলুন' : 'Open')}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-3.5">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('broadcast')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'broadcast'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <Megaphone size={13} />
              <span>{language === 'bn' ? '📢 লাইভ স্ক্রলিং নোটিশ' : 'Live Broadcast Notice'}</span>
              {broadcastEnabled && (
                <span className="bg-emerald-500 text-white text-[9px] px-1 py-0.2 rounded-full font-black">ON</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('support')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'support'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <Phone size={13} />
              <span>{language === 'bn' ? 'হেল্পলাইন যোগাযোগ' : 'Helpline Contact'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('disclaimer')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'disclaimer'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <FileText size={13} />
              <span>{language === 'bn' ? 'সতর্কতা নোটিশ' : 'Notice Text'}</span>
            </button>
          </div>

          {/* TAB 1: LIVE BROADCAST NOTICE */}
          {activeTab === 'broadcast' && (
            <form onSubmit={handleSaveBroadcast} className="space-y-3">
              {/* Toggle switch bar */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio size={14} className={broadcastEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
                    <span>{language === 'bn' ? 'অ্যাপে নোটিশের অবস্থা' : 'Broadcast Status'}</span>
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    {broadcastEnabled 
                      ? (language === 'bn' ? 'সক্রিয় (টিভি খবরের মতো হোমপেজে ভেসে চলবে)' : 'Active (Scrolling live in app)')
                      : (language === 'bn' ? 'নিষ্ক্রিয় (বর্তমানে অ্যাপে কোনো নোটিশ দেখাচ্ছে না)' : 'Disabled')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleNoticeQuick}
                  disabled={isSaving}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    broadcastEnabled
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Power size={13} />
                  <span>{broadcastEnabled ? (language === 'bn' ? 'চালু আছে (ON)' : 'ON') : (language === 'bn' ? 'বন্ধ (OFF)' : 'OFF')}</span>
                </button>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                  {language === 'bn' ? 'নোটিশের ধরন ও রঙ নির্বাচন করুন:' : 'Select Category:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'prayer', label: '🤲 দোয়া ও মানবসেবা', desc: 'সোনালী রঙ' },
                    { id: 'market', label: '📈 মার্কেট সুযোগ', desc: 'সবুজ রঙ' },
                    { id: 'warning', label: '⚠️ জরুরী সতর্কতা', desc: 'লাল/গোলাপী রঙ' },
                    { id: 'general', label: '📢 সাধারণ বার্তা', desc: 'নীল রঙ' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setBroadcastCategory(cat.id as any)}
                      className={`p-2 rounded-xl text-left border cursor-pointer transition-all ${
                        broadcastCategory === cat.id
                          ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      <div className="text-xs font-bold">{cat.label}</div>
                      <div className="text-[10px] text-slate-400">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ready-made Presets */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{language === 'bn' ? 'দ্রুত ব্যবহারের নমুনা বার্তা (ক্লিক করলে লেখা বসে যাবে):' : 'Quick Presets:'}</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice Message Text Area */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>{language === 'bn' ? 'নোটিশের মূল বার্তা লিখুন:' : 'Broadcast Message:'}</span>
                  <span className="text-[10px] text-slate-400">{broadcastMessage.length} অক্ষর</span>
                </label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: উমুক ব্যক্তি অসুস্থ সবাই তার জন্য দোয়া করুন / এখন মুরগী পোষা ঝুঁকি এই সময়ে কিনলে লাভ হতে পারে...' : 'Write notice message...'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Live Preview Box */}
              {broadcastMessage.trim() && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-400" />
                    <span>{language === 'bn' ? 'অ্যাপে যেমন দেখাবে (লাইভ প্রিভিউ):' : 'Live Preview in App:'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 flex items-center gap-2 overflow-hidden text-xs">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shrink-0">
                      লাইভ নোটিশ
                    </span>
                    <span className="text-slate-200 truncate font-medium">
                      {broadcastMessage}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                {broadcastEnabled ? (
                  <button
                    type="button"
                    onClick={handleToggleNoticeQuick}
                    disabled={isSaving}
                    className="py-1.5 px-3 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {language === 'bn' ? 'নোটিশ বন্ধ করুন' : 'Turn Off'}
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/20"
                >
                  <Save size={14} />
                  <span>
                    {isSaving 
                      ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') 
                      : (language === 'bn' ? 'সংরক্ষণ ও প্রচার করুন' : 'Save & Broadcast')}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SUPPORT / HELPLINE CONTACT */}
          {activeTab === 'support' && (
            <form onSubmit={handleSaveSupportAndDisclaimer} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <MessageCircle size={12} className="text-emerald-400" />
                    <span>{language === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                  </label>
                  <input
                    type="text"
                    value={adminWaInput}
                    onChange={(e) => setAdminWaInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-amber-400"
                    placeholder="8801622384379"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Phone size={12} className="text-blue-400" />
                    <span>{language === 'bn' ? 'হেল্পলাইন ফোন' : 'Phone'}</span>
                  </label>
                  <input
                    type="text"
                    value={adminPhoneInput}
                    onChange={(e) => setAdminPhoneInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-amber-400"
                    placeholder="01622384379"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Mail size={12} className="text-amber-400" />
                    <span>{language === 'bn' ? 'ইমেইল' : 'Email'}</span>
                  </label>
                  <input
                    type="email"
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-amber-400"
                    placeholder="skabusufian452@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {language === 'bn' ? 'অ্যাডমিন নাম' : 'Name'}
                  </label>
                  <input
                    type="text"
                    value={adminNameInput}
                    onChange={(e) => setAdminNameInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-amber-400"
                    placeholder="আবু সুফিয়ান"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-1.5 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save size={13} />
                  <span>{isSaving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save')}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DISCLAIMER TEXT */}
          {activeTab === 'disclaimer' && (
            <form onSubmit={handleSaveSupportAndDisclaimer} className="space-y-3">
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {language === 'bn' ? 'মার্কেটপ্লেস ও কেনাবেচার সাধারণ সতর্কবার্তা (বাংলা)' : 'General Disclaimer (Bangla)'}
                  </label>
                  <textarea
                    rows={3}
                    value={disclaimerBn}
                    onChange={(e) => setDisclaimerBn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {language === 'bn' ? 'সতর্কবার্তা (ইংরেজি)' : 'General Disclaimer (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={disclaimerEn}
                    onChange={(e) => setDisclaimerEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-1.5 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save size={13} />
                  <span>{isSaving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
