import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { 
  Crown, 
  Settings2, 
  Save, 
  Phone, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Radio,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Clean Admin Hub:
 * - Simple Helpline and Notice management
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
  const [activeTab, setActiveTab] = useState<'support' | 'broadcast'>('support');

  // Form states
  const [adminPhoneInput, setAdminPhoneInput] = useState(config.adminPhone || '01410991934');
  const [adminWaInput, setAdminWaInput] = useState(config.adminWhatsApp || '8801410991934');
  const [adminEmailInput, setAdminEmailInput] = useState(config.adminEmail || 'skabusufian452@gmail.com');
  const [adminNameInput, setAdminNameInput] = useState(config.adminName || 'আবু সুফিয়ান');
  const [disclaimerBn, setDisclaimerBn] = useState(config.disclaimerTextBn || '');
  const [disclaimerEn, setDisclaimerEn] = useState(config.disclaimerTextEn || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isAdmin) return null;

  const handleSaveSupport = async (e: React.FormEvent) => {
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
            <h4 className="text-sm font-bold text-white">
              {language === 'bn' ? 'অ্যাডমিন সেটিংস (হেল্পলাইন ও নোটিশ)' : 'Admin Settings'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {language === 'bn' ? 'খামারি হেল্পলাইন নম্বর ও সাধারণ সতর্কতা' : 'Helpline & disclaimer management'}
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('support')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'support'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {language === 'bn' ? 'হেল্পলাইন যোগাযোগ' : 'Helpline Contact'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('broadcast')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'broadcast'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {language === 'bn' ? 'সতর্কতা নোটিশ' : 'Notice Text'}
            </button>
          </div>

          <form onSubmit={handleSaveSupport} className="space-y-3">
            {activeTab === 'support' ? (
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
                    placeholder="8801410991934"
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
                    placeholder="01410991934"
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
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {language === 'bn' ? 'সতর্কবার্তা (বাংলা)' : 'Notice (Bangla)'}
                  </label>
                  <textarea
                    rows={2}
                    value={disclaimerBn}
                    onChange={(e) => setDisclaimerBn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>
            )}

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
        </div>
      )}
    </div>
  );
}
