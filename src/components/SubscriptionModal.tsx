import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { 
  Sparkles, 
  X, 
  MessageCircle, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  Lock,
  ExternalLink,
  Crown,
  FileSpreadsheet,
  Stethoscope,
  Store,
  Users,
  BookOpen
} from 'lucide-react';

export default function SubscriptionModal() {
  const { language } = useLanguage();
  const { config, subscriptionModal, closeSubscriptionModal } = useSystemConfig();

  if (!subscriptionModal.isOpen) return null;

  const currentFeature = subscriptionModal.featureTitle || (language === 'bn' ? 'প্রিমিয়াম সেবা' : 'Premium Feature');

  const defaultMsg = language === 'bn'
    ? `আসসালামু আলাইকুম। আমি ডিজিটাল খামার প্রো অ্যাপের "${currentFeature}" সহ সকল ফিচারের ১৫০ টাকার অল-ইন-ওয়ান সাবস্ক্রিপশন চালু করতে চাই। অনুগ্রহ করে পেমেন্ট ডিটেইলস বা অ্যাক্টিভেশন প্রসেস জানাবেন।`
    : `Hello, I would like to activate the All-in-One VIP Subscription for "${currentFeature}" and all app features in Digital Farm Pro. Please guide me with payment and activation.`;

  const waUrl = `https://wa.me/${config.adminWhatsApp}?text=${encodeURIComponent(defaultMsg)}`;
  const telUrl = `tel:${config.adminPhone}`;

  const allFeatures = [
    {
      icon: <Store size={14} className="text-emerald-600" />,
      textBn: 'ফিড ও ভেটেরিনারি ঔষধ দোকান লিস্টিং ডিরেক্টরি',
      textEn: 'Feed & Veterinary Store Directory Listing'
    },
    {
      icon: <Stethoscope size={14} className="text-teal-600" />,
      textBn: 'ডাক্তার ও প্রাণিসম্পদ বিশেষজ্ঞ প্রোফাইল ও পরামর্শ',
      textEn: 'Doctor & Livestock Specialist Profiles & Care'
    },
    {
      icon: <FileSpreadsheet size={14} className="text-blue-600" />,
      textBn: 'খামারের সার্বিক লাভ-ক্ষতি ও এক্সেল/পিডিএফ রিপোর্ট',
      textEn: 'Comprehensive Farm Profit/Loss & Excel/PDF Export'
    },
    {
      icon: <BookOpen size={14} className="text-amber-600" />,
      textBn: 'বকেয়া খাতা (দেনা-পাওনা লেজার ও খামারি খতিয়ান)',
      textEn: 'Dues Ledger (Bokeya Khata & Farm Accounting)'
    },
    {
      icon: <Users size={14} className="text-indigo-600" />,
      textBn: 'পাইকারি মুরগি/ডিম ক্রেতা ডিরেক্টরি ও মার্কেট পোস্ট',
      textEn: 'Wholesale Buyer Directory & Unlimited Market Ads'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 p-5 text-center relative text-white shrink-0">
          <button 
            type="button"
            onClick={closeSubscriptionModal}
            className="absolute top-3 right-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center justify-center gap-1.5 bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2.5 shadow-sm">
            <Crown size={13} className="text-slate-950" />
            <span>{language === 'bn' ? 'অল-ইন-ওয়ান ভিআইপি প্যাকেজ' : 'ALL-IN-ONE VIP ACCESS'}</span>
          </div>

          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-inner border border-white/20">
            <Lock size={22} className="text-amber-300 animate-pulse" />
          </div>

          <h3 className="text-base sm:text-lg font-black text-white leading-tight">
            {currentFeature}
          </h3>
          <p className="text-emerald-200 text-xs font-bold mt-1">
            {language === 'bn' 
              ? 'আলাদা প্যাকেজ নয়—একবার সাবস্ক্রিপশন নিলেই অ্যাপের সবকিছু আনলক!' 
              : 'One subscription unlocks every premium tool in the application!'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          
          {/* Price & Offer Highlight Card */}
          <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 border border-amber-300/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <p className="text-[10.5px] font-black text-amber-900 uppercase tracking-wide">
                {language === 'bn' ? 'মাত্র একবারের ফি' : 'Special Subscription Fee'}
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-slate-900 font-sans">৳১৫০</span>
                <span className="text-[11px] font-bold text-slate-500 line-through">৳৫০০</span>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                  {language === 'bn' ? '৭০% ছাড়' : '70% OFF'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-2xs">
                {language === 'bn' ? 'সব ফিচার আনলক' : 'All Access'}
              </span>
              <p className="text-[9.5px] text-slate-600 font-bold mt-1">
                {language === 'bn' ? 'সহজ এককালীন অ্যাক্টিভেশন' : 'Instant 1-Click Activation'}
              </p>
            </div>
          </div>

          {/* All Included Features Checklist */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
            <h4 className="text-xs font-black text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>{language === 'bn' ? 'এক সাবস্ক্রিপশনে যা যা পাবেন:' : 'Everything Included:'}</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {language === 'bn' ? 'সব উন্মুক্ত' : 'Fully Unlocked'}
              </span>
            </h4>

            <div className="space-y-1.5 pt-1">
              {allFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-750 bg-white p-2 rounded-xl border border-slate-150 shadow-2xs">
                  <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {feat.icon}
                  </div>
                  <span className="flex-1 text-[11px] leading-tight font-extrabold text-slate-850">
                    {language === 'bn' ? feat.textBn : feat.textEn}
                  </span>
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Notice to reach Admin */}
          <p className="text-center text-xs text-slate-600 font-bold leading-snug px-1">
            {language === 'bn' 
              ? 'সাবস্ক্রিপশনটি চালু করতে নিচে ক্লিক করে সরাসরি অ্যাডমিনকে WhatsApp বা কল করুন:' 
              : 'To activate your All-in-One VIP access immediately, contact the admin below:'}
          </p>

          {/* Contact Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            {/* WhatsApp Contact */}
            <a 
              href={waUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl font-black text-xs transition-all active:scale-98 shadow-xs cursor-pointer"
            >
              <MessageCircle size={16} />
              <span>{language === 'bn' ? 'WhatsApp মেসেজ' : 'WhatsApp Us'}</span>
            </a>

            {/* Direct Phone Call */}
            <a 
              href={telUrl} 
              className="flex items-center justify-center gap-2 bg-slate-850 hover:bg-slate-950 text-white p-2.5 rounded-xl font-black text-xs transition-all active:scale-98 shadow-xs cursor-pointer font-sans"
            >
              <Phone size={15} className="text-amber-400" />
              <span>{config.adminPhone}</span>
            </a>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={closeSubscriptionModal}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs rounded-xl transition-colors cursor-pointer text-center"
          >
            {language === 'bn' ? 'পরে বিবেচনা করব' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
