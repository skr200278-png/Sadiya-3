import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, Info, Scale } from 'lucide-react';

export default function MarketplaceDisclaimerBanner() {
  const { language } = useLanguage();
  const { config } = useSystemConfig();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-3.5 text-amber-950 shadow-xs relative overflow-hidden">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Scale size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-black text-amber-950 flex items-center gap-1">
                <span>{language === 'bn' ? 'সতর্কবার্তা ও দায়মুক্তি' : 'Important Notice & Disclaimer'}</span>
              </h4>
              <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                {language === 'bn' ? 'জরুরি বিজ্ঞপ্তি' : 'DISCLAIMER'}
              </span>
            </div>
            
            <p className={`text-[10.5px] font-bold text-amber-900 leading-relaxed mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {language === 'bn' ? config.disclaimerTextBn : config.disclaimerTextEn}
            </p>

            {isExpanded && (
              <div className="mt-2 pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center gap-2 text-[9.5px] text-amber-800 font-bold flex-wrap">
                <span className="flex items-center gap-1 text-red-700 font-extrabold">
                  <ShieldAlert size={12} className="text-red-600 shrink-0" />
                  {language === 'bn' ? '১. অগ্রিম টাকা পাঠাবেন না (পণ্য বুঝে নিয়ে দাম পরিশোধ করুন)।' : '1. Do NOT pay in advance before delivery.'}
                </span>
                <span className="hidden sm:inline text-amber-400">•</span>
                <span className="flex items-center gap-1">
                  <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                  {language === 'bn' ? '২. প্রতারিত হলে অ্যাপ কর্তৃপক্ষ কোনোভাবেই দায়ী নয়।' : '2. App is not liable for transactions or fraud.'}
                </span>
                <span className="hidden sm:inline text-amber-400">•</span>
                <span className="flex items-center gap-1">
                  <Info size={12} className="text-amber-600 shrink-0" />
                  {language === 'bn' ? '৩. বাকিতে বিক্রয়ের ঝুঁকি সম্পূর্ণ আপনার।' : '3. Credit sales are at your own risk.'}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-amber-700 hover:text-amber-950 p-1 rounded-lg hover:bg-amber-500/10 transition-colors shrink-0 cursor-pointer"
          title={isExpanded ? 'সংক্ষেপ করুন' : 'বিস্তারিত দেখুন'}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
}
