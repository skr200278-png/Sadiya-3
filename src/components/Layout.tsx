import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Package, ClipboardList, Wallet, FileText, Menu, AlertTriangle, ShieldPlus, LayoutGrid, Mic, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { demoStore } from '../utils/demoStore';
import VoiceAssistantModal from './VoiceAssistantModal';

export default function Layout() {
  const { currentUser, isDemoUser, logout } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  const [profileData, setProfileData] = useState<any>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  useEffect(() => {
    if (isDemoUser) {
      const p = demoStore.getProfile();
      setProfileData(p);
      const unsub = demoStore.subscribe(() => {
        setProfileData(demoStore.getProfile());
      });
      return () => unsub();
    }

    if (currentUser) {
      const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docObj) => {
        if (docObj.exists()) {
          setProfileData(docObj.data());
        }
      }, (err) => {
        console.warn('Layout profile onSnapshot error:', err);
      });
      return () => unsub();
    }
  }, [currentUser, isDemoUser]);

  if (!currentUser) return <Outlet />;

  const navItems = [
    { name: t('menu.home'), path: '/', icon: Home },
    { name: t('menu.dashboard'), path: '/dashboard', icon: LayoutGrid },
    { name: t('menu.batches'), path: '/batches', icon: Package },
    { name: t('menu.feed'), path: '/feed', icon: ClipboardList },
    { name: t('menu.expenses'), path: '/expenses', icon: Wallet },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top Bar */}
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center justify-between relative max-w-2xl mx-auto w-full">
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-800/80 hover:bg-emerald-800 text-yellow-300 px-2.5 py-1 rounded-xl text-xs font-black border border-emerald-600 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title={language === 'bn' ? 'ভয়েস এন্ট্রি করুন' : 'Voice Entry'}
          >
            <Mic size={15} className="animate-pulse text-yellow-300" />
            <span className="text-[11px] hidden xs:inline">{language === 'bn' ? 'ভয়েস' : 'Voice'}</span>
          </button>

          <h1 className="text-lg sm:text-xl font-black flex-1 text-center whitespace-nowrap overflow-hidden text-ellipsis px-2 tracking-tight">
            {profileData?.farmName || t('app.title')}
          </h1>

          <Link to="/profile" className="p-0.5 hover:bg-emerald-800 rounded-full transition-colors w-8 h-8 flex items-center justify-center shrink-0">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-emerald-600">
                 <span className="text-xs font-black">{(profileData?.name || currentUser?.displayName || 'U').charAt(0).toUpperCase()}</span>
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Floating Voice Assistant Button */}
      <div className="fixed bottom-20 right-4 z-30 max-w-2xl mx-auto">
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-3.5 rounded-full shadow-xl shadow-teal-700/30 flex items-center gap-2 border-2 border-white transition-all active:scale-95 cursor-pointer"
          title={language === 'bn' ? 'মুখে বলে হিসাব এন্ট্রি করুন' : 'Voice Entry Assistant'}
        >
          <Mic size={22} className="text-yellow-300 animate-pulse" />
          <span className="text-xs font-black pr-1 hidden sm:inline">{language === 'bn' ? 'ভয়েস হিসাব' : 'Voice Log'}</span>
        </button>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white/95 backdrop-blur-xs border-t border-gray-200 shadow-lg z-20">
        <div className="flex justify-around p-2 max-w-2xl mx-auto w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                isActive ? 'text-emerald-700 font-bold bg-emerald-50/80' : 'text-gray-500 hover:text-emerald-600'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-bold mt-1">{item.name}</span>
            </Link>
          );
        })}
        </div>
      </nav>
    </div>
  );
}
