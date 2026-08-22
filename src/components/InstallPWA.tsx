import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Info, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function InstallPWA() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('pwa_install_dismissed') === 'true';
  });
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('android');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect Device Type
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
      // iOS doesn't support beforeinstallprompt, but we can still suggest manually adding
      setIsInstallable(true);
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Check if running in standalone (web app mode)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      setShowInstructions(false); // Can trigger standard installer directly
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deviceType === 'ios') {
      setShowInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('pwa_install_dismissed', 'true');
      }
    } catch (err) {
      console.error("PWA install error: ", err);
      setShowInstructions(true);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (isInstalled) return null;
  if (isDismissed && !showInstructions) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-800 to-green-700 text-white rounded-2xl p-4 shadow-lg border border-emerald-500/20 relative overflow-hidden transition-all duration-300">
      {/* Decorative Background */}
      <div className="absolute right-0 bottom-0 top-0 w-1/4 bg-gradient-to-l from-white/10 to-transparent skew-x-12 pointer-events-none"></div>
      
      <button 
        onClick={handleDismiss} 
        className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/15 hover:bg-black/30 rounded-full p-1.5 transition-colors z-10"
        title="ডাউনলোড নোটিশ বন্ধ করুন"
      >
        <X size={16} />
      </button>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
        {/* App Logo Indicator */}
        <div className="w-14 h-14 bg-white rounded-2xl p-1 shadow-inner flex items-center justify-center shrink-0">
          <img 
            src="farm_app_icon_1779214389225.png" 
            alt="Digital Farm" 
            className="w-12 h-12 rounded-xl object-cover" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'pwa-192x192.png';
            }}
          />
        </div>

        <div className="flex-1 text-left">
          <h4 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            {language === 'bn' ? '📲 অ্যাপটি ইনস্টল/ডাউনলোড করুন' : '📲 Install App on Your Device'}
          </h4>
          <p className="text-xs text-green-100 font-medium leading-relaxed mt-0.5">
            {language === 'bn' 
              ? 'হোম স্ক্রিনে আইকন হিসেবে যুক্ত করে মোবাইলের আসল অ্যাপের মতো দ্রুত ও অফলাইনেও ব্যবহার করুন।' 
              : 'Add to your home screen for blazing fast access and offline livestock tracking!'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-1 md:pt-0">
          <button 
            onClick={handleInstallClick} 
            className="p-2.5 px-4 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
          >
            <Download size={15} className="animate-bounce" />
            <span>{language === 'bn' ? 'অ্যাড করুন / ডাউনলোড' : 'Install / Download'}</span>
          </button>
          
          <button 
            onClick={() => setShowInstructions(!showInstructions)} 
            className="p-2.5 bg-emerald-600/50 hover:bg-emerald-600 border border-white/15 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all duration-200 cursor-pointer"
          >
            <Info size={15} />
            <span>{language === 'bn' ? 'নিয়ম' : 'Guide'}</span>
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="mt-4 pt-3.5 border-t border-white/10 bg-black/15 -mx-4 -mb-4 p-4 text-xs space-y-3 animate-in slide-in-from-top-3 duration-200">
          <p className="font-extrabold text-yellow-300 flex items-center gap-1">
            <Smartphone size={14} /> 
            {language === 'bn' ? 'মোবাইলে যেভাবে ইনস্টল করবেন:' : 'How to install on phone:'}
          </p>
          
          {deviceType === 'ios' ? (
            <div className="space-y-1.5 pl-4 list-decimal text-[11px] leading-relaxed text-green-50 font-medium">
              <p>১. আপনার আইফোনের নিচের <strong className="text-white underline">শেয়ার বাটনে (Share icon / বক্স থেকে উপরে তীরচিহ্ন)</strong> চাপ দিন।</p>
              <p>২. শেয়ার মেনু থেকে নিচের দিকে স্ক্রল করে <strong className="text-white underline font-extrabold">"Add to Home Screen"</strong> (বা হোম স্ক্রিনে যুক্ত করুন) লেখাটি চাপুন।</p>
              <p>৩. উপরে ডানদিকের <strong className="text-white">"Add"</strong> বাটনে ক্লিক করলে আপনার মোবাইলে চলে আসবে!</p>
            </div>
          ) : (
            <div className="space-y-1.5 pl-4 list-decimal text-[11px] leading-relaxed text-green-50 font-medium">
              <p>১. উপরে থাকা <strong className="text-white">"অ্যাড করুন"</strong> বাটনে চাপ দিন।</p>
              <p>২. ব্রাউজার থেকে ইনস্টল পপ-আপ আসলে <strong className="text-yellow-300 font-extrabold">"Install"</strong> বা যুক্ত করুন কনফার্ম করুন।</p>
              <p>৩. যদি বাটনে কাজ না করে, ক্রোম (Chrome) ব্রাউজারের উপরে ডানদিকের <strong className="text-white">৩-ডট মেনু</strong> থেকে <strong className="text-yellow-200 font-extrabold">"Install app"</strong> বা <strong className="text-yellow-200 font-extrabold">"Add to Home screen"</strong> সিলেক্ট করুন।</p>
            </div>
          )}

          <p className="font-extrabold text-yellow-300 flex items-center gap-1 pt-1 border-t border-white/5">
            <Monitor size={14} /> 
            {language === 'bn' ? 'কম্পিউটার/ল্যাপটপে যেভাবে ইনস্টল করবেন:' : 'How to install on Desktop:'}
          </p>
          <div className="text-[11px] text-green-50 pl-4 font-medium leading-relaxed">
            {language === 'bn' 
              ? 'আসল সফটওয়্যারের মতো কম্পিউটারে ব্যবহার করতে ক্রোম ব্রাউজারের অ্যাড্রেস বারের ডান পাশে থাকা "Install" (পিসি আইকন) এ ক্লিক করে ডাউনলোড করে নিন।'
              : 'Click the laptop icon directly inside your browser address bar (top-right next to URL) to sync onto local desktop instantly.'}
          </div>
          
          <div className="flex justify-end pt-1">
            <button 
              onClick={() => setShowInstructions(false)} 
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md font-bold text-[10px] text-white"
            >
              {language === 'bn' ? 'বুঝেছি' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
