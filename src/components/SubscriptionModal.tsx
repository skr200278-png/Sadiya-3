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
  Headphones, 
  Lock,
  ExternalLink 
} from 'lucide-react';

export default function SubscriptionModal() {
  const { language } = useLanguage();
  const { config, subscriptionModal, closeSubscriptionModal } = useSystemConfig();

  if (!subscriptionModal.isOpen) return null;

  const defaultMsg = language === 'bn'
    ? `আসসালামু আলাইকুম। আমি ডিজিটাল খামার প্রো অ্যাপের "${subscriptionModal.featureTitle}" ফিচারটি সক্রিয় করতে চাই। বিস্তারিত জানাবেন প্লিজ।`
    : `Hello, I would like to activate the "${subscriptionModal.featureTitle}" feature in Digital Farm Pro. Please provide details.`;

  const waUrl = `https://wa.me/${config.adminWhatsApp}?text=${encodeURIComponent(defaultMsg)}`;
  const telUrl = `tel:${config.adminPhone}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-150">
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-5 text-center relative text-white">
          <button 
            onClick={closeSubscriptionModal}
            className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-2.5 shadow-md border border-white/20">
            <Lock size={26} className="text-amber-300 animate-bounce" />
          </div>

          <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5 inline-block shadow-2xs">
            {language === 'bn' ? 'প্রিমিয়াম সেবা' : 'PREMIUM FEATURE'}
          </span>

          <h3 className="text-base font-black text-white leading-tight">
            {subscriptionModal.featureTitle || (language === 'bn' ? 'ফিচার সক্রিয়করণ' : 'Feature Activation')}
          </h3>
          <p className="text-emerald-100/90 text-xs font-medium mt-1">
            {subscriptionModal.featureDesc || (language === 'bn' ? config.subscriptionNoticeBn : config.subscriptionNoticeEn)}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Key Advantages */}
          <div className="bg-emerald-50/60 rounded-2xl p-3.5 border border-emerald-100 space-y-2">
            <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>{language === 'bn' ? 'অ্যাডমিন সহায়তা ও সুবিধা' : 'Admin Support & Benefits'}</span>
            </h4>
            <ul className="text-[11px] font-bold text-slate-700 space-y-1.5 pl-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>{language === 'bn' ? 'সরাসরি অ্যাডমিন কর্তৃক অ্যাকাউন্ট ভেরিফিকেশন' : 'Direct verification by App Admin'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>{language === 'bn' ? 'সীমাহীন বিজ্ঞাপন ও খামারি নেটওয়ার্ক সুবিধা' : 'Unlimited posting & network reach'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>{language === 'bn' ? '২৪/৭ সরাসরি ফোন ও হোয়াটসঅ্যাপ সাপোর্ট' : '24/7 Priority phone & WhatsApp support'}</span>
              </li>
            </ul>
          </div>

          <p className="text-center text-xs text-slate-600 font-bold leading-relaxed">
            {language === 'bn' 
              ? 'ফিচারটি আনলক করতে নিচের যেকোনো মাধ্যমে সরাসরি অ্যাডমিনের সাথে যোগাযোগ করুন:' 
              : 'Contact the administrator via WhatsApp or Direct Call to activate this feature:'}
          </p>

          {/* Contact Action Buttons */}
          <div className="space-y-2">
            {/* WhatsApp Contact */}
            <a 
              href={waUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-3 bg-green-50 p-3 rounded-2xl border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all active:scale-98 shadow-xs group"
            >
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-2.5 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                <MessageCircle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-green-950 text-xs">
                  {language === 'bn' ? 'হোয়াটসঅ্যাপে মেসেজ দিন' : 'Message on WhatsApp'}
                </p>
                <p className="text-[10px] text-green-700 font-bold">
                  {language === 'bn' ? 'দ্রুত অ্যাক্টিভেশন সাপোর্ট' : 'Instant activation reply'}
                </p>
              </div>
              <ExternalLink size={16} className="text-green-600/70 shrink-0" />
            </a>

            {/* Direct Phone Call */}
            <a 
              href={telUrl} 
              className="flex items-center gap-3 bg-blue-50 p-3 rounded-2xl border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all active:scale-98 shadow-xs group"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2.5 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                <Phone size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-blue-950 text-xs">
                  {language === 'bn' ? 'সরাসরি কল করুন' : 'Call Administrator'}
                </p>
                <p className="text-[10px] text-blue-700 font-bold font-sans">
                  {config.adminPhone} ({config.adminName})
                </p>
              </div>
              <ExternalLink size={16} className="text-blue-600/70 shrink-0" />
            </a>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={closeSubscriptionModal}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-colors cursor-pointer"
          >
            {language === 'bn' ? 'পরে যোগাযোগ করব' : 'Maybe Later'}
          </button>
        </div>

      </div>
    </div>
  );
}
