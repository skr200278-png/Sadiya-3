import React, { useState } from 'react';
import { useSystemConfig, BroadcastNoticeConfig } from '../contexts/SystemConfigContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Megaphone, 
  AlertTriangle, 
  HeartHandshake, 
  TrendingUp, 
  X, 
  Info,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function BroadcastNoticeTicker() {
  const { config } = useSystemConfig();
  const { language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const notice = config.broadcastNotice;

  // If notice is explicitly disabled or has no message, do not render
  if (!notice || notice.enabled === false || !notice.message?.trim()) {
    return null;
  }

  // Category Theme Configurations
  const getCategoryMeta = (cat: BroadcastNoticeConfig['category'] = 'market') => {
    switch (cat) {
      case 'prayer':
        return {
          labelBn: 'দোয়া ও প্রার্থনা',
          labelEn: 'Prayer Request',
          icon: HeartHandshake,
          bgGradient: 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-amber-50',
          badgeBg: 'bg-amber-950/70 text-amber-200 border-amber-400/50',
          borderAccent: 'border-amber-400',
        };
      case 'warning':
        return {
          labelBn: 'জরুরী সতর্কতা',
          labelEn: 'Urgent Alert',
          icon: AlertTriangle,
          bgGradient: 'bg-gradient-to-r from-rose-700 via-red-700 to-rose-800 text-rose-50',
          badgeBg: 'bg-rose-950/70 text-rose-200 border-rose-400/50',
          borderAccent: 'border-rose-400',
        };
      case 'general':
        return {
          labelBn: 'অ্যাডমিন ঘোষণা',
          labelEn: 'Admin Notice',
          icon: Megaphone,
          bgGradient: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-blue-50',
          badgeBg: 'bg-blue-950/70 text-blue-200 border-blue-400/50',
          borderAccent: 'border-blue-400',
        };
      case 'market':
      default:
        return {
          labelBn: 'বাজার সুযোগ ও পরামর্শ',
          labelEn: 'Market Opportunity',
          icon: TrendingUp,
          bgGradient: 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-emerald-50',
          badgeBg: 'bg-emerald-950/70 text-emerald-200 border-emerald-400/50',
          borderAccent: 'border-emerald-400',
        };
    }
  };

  const meta = getCategoryMeta(notice.category);
  const Icon = meta.icon;

  return (
    <>
      <style>{`
        @keyframes tickerMove {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .farm-ticker-track {
          display: inline-block;
          white-space: nowrap;
          animation: tickerMove 25s linear infinite;
        }
        .farm-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Live Scrolling Ticker Bar */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className={`w-full py-2 px-3 shadow-md flex items-center gap-2.5 cursor-pointer select-none transition-all hover:brightness-105 active:scale-[0.99] overflow-hidden border-b ${meta.borderAccent} ${meta.bgGradient}`}
        title={language === 'bn' ? 'সম্পূর্ণ নোটিশটি পড়তে ক্লিক করুন' : 'Click to view full notice'}
      >
        {/* Left Category Badge */}
        <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border shadow-xs ${meta.badgeBg}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <Icon size={12} className="shrink-0" />
          <span className="whitespace-nowrap">
            {language === 'bn' ? meta.labelBn : meta.labelEn}
          </span>
        </div>

        {/* Center Marquee Moving Text */}
        <div className="flex-1 overflow-hidden relative h-5 flex items-center">
          <div className="farm-ticker-track font-bold text-xs sm:text-[13px] tracking-wide inline-flex items-center gap-4">
            <span>{notice.message}</span>
            <span className="opacity-60 text-xs">✦</span>
            <span>{notice.message}</span>
            <span className="opacity-60 text-xs">✦</span>
            <span>{notice.message}</span>
          </div>
        </div>

        {/* Right Info Icon */}
        <div className="shrink-0 flex items-center gap-1 pl-1">
          <span className="hidden sm:inline text-[11px] font-bold text-white/90">
            {language === 'bn' ? 'বিস্তারিত' : 'Details'}
          </span>
          <ChevronRight size={15} className="text-white/80" />
        </div>
      </div>

      {/* Full Notice Modal for Detailed Reading */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-4 flex items-center justify-between text-white ${meta.bgGradient}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Icon size={19} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {language === 'bn' ? meta.labelBn : meta.labelEn}
                  </h3>
                  <p className="text-[11px] text-white/80 flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>{language === 'bn' ? 'অ্যাডমিন লাইভ নোটিশ' : 'Admin Live Broadcast'}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {notice.message}
              </div>

              {/* Author & Timestamp Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-gray-400" />
                  <span>
                    {notice.updatedAt 
                      ? new Date(notice.updatedAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : (language === 'bn' ? 'আজকের নোটিশ' : 'Today')}
                  </span>
                </span>

                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {language === 'bn' ? 'অফিশিয়াল নোটিশ' : 'Official Notice'}
                </span>
              </div>
            </div>

            {/* Modal Action */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-emerald-700/20"
              >
                {language === 'bn' ? 'বুঝেছি / বন্ধ করুন' : 'Got it / Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
