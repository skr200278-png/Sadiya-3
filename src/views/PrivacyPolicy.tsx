import React, { useState } from 'react';
import { ArrowLeft, Shield, CheckCircle, Mail, Phone, ExternalLink, Printer, Lock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { language: currentAppLang } = useLanguage();
  const [lang, setLang] = useState<'en' | 'bn'>(currentAppLang === 'en' ? 'en' : 'bn');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors active:scale-95 cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {lang === 'bn' ? 'প্রাইভেসি পলিসি (Privacy Policy)' : 'Privacy Policy - Digital Khamar Pro'}
              </h1>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Shield size={11} /> Google Play Data Safety Compliant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
              <button 
                onClick={() => setLang('bn')} 
                className={`px-2.5 py-1 rounded-md transition-all ${lang === 'bn' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                বাংলা
              </button>
              <button 
                onClick={() => setLang('en')} 
                className={`px-2.5 py-1 rounded-md transition-all ${lang === 'en' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                English
              </button>
            </div>

            <button 
              onClick={() => window.print()}
              className="hidden sm:inline-flex p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              title="Print"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Hero Card */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-2xl p-5 sm:p-7 shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-[11px] font-bold uppercase tracking-wider mb-2.5">
            <Lock size={12} /> Data Protection & Privacy Rights
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-1.5">
            {lang === 'bn' ? 'ডিজিটাল খামার প্রো প্রাইভেসি পলিসি ও নিরাপত্তা' : 'Official Privacy Policy for Digital Khamar Pro'}
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
            {lang === 'bn' 
              ? 'ডিজিটাল খামার প্রো অ্যাপ আপনার ব্যক্তিগত তথ্য ও খামারের হিসাব-নিকাশের গোপনীয়তা শতভাগ সুরক্ষিত রাখতে প্রতিশ্রুতিবদ্ধ।'
              : 'Learn how Digital Khamar Pro collects, uses, protects, and handles your personal and farm data.'}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-emerald-200 mt-3 pt-3 border-t border-white/15">
            <span>📅 <strong>Effective:</strong> March 2025</span>
            <span>🔄 <strong>Updated:</strong> August 2026</span>
            <span>🌐 <strong>URL:</strong> https://polty-e357c.web.app/privacy-policy.html</span>
          </div>
        </div>

        {lang === 'bn' ? (
          /* ================= BENGALI VERSION ================= */
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">১</span>
                পরিচিতি ও সাধারণ নীতি
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>ডিজিটাল খামার প্রো (Digital Khamar Pro)</strong> বাংলাদেশের পোল্ট্রি, ডেইরি, গরুর মোটাতাজাকরণ ও মৎস্য খামারিদের জন্য নির্মিত পূর্ণাঙ্গ খামার ব্যবস্থাপনা অ্যাপ্লিকেশন। এই অ্যাপ খামারের ব্যাচ রেকর্ড, খাদ্য গ্রহণ, মর্টালিটি, চিকিৎসা, খরচ, বিক্রয় ও গ্রাহকের বকেয়া হিসাব নির্ভুলভাবে রাখতে সাহায্য করে।
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">২</span>
                যেসব তথ্য সংগ্রহ ও সংরক্ষণ করা হয়
              </h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
                <li><strong>ব্যক্তিগত তথ্য:</strong> নাম, ইমেইল অ্যাড্রেস, ফোন নম্বর (ঐচ্ছিক/প্রোফাইল), প্রোফাইল ছবি।</li>
                <li><strong>খামারের তথ্য:</strong> ব্যাচ, বাচ্চার সংখ্যা, দৈনিক খাদ্য, ওষুধ, ওজন ও মৃত্যুর হিসাব।</li>
                <li><strong>আর্থিক হিসাব:</strong> খামারের খরচ, নগদ বিক্রয় রশিদ, ক্যাশমেমো ও বকেয়া খাতার কাস্টমার তথ্য।</li>
                <li><strong>মার্কেটপ্লেস ও ডাক্তার:</strong> ক্রয়-বিক্রয়ের পণ্যের ছবি, বিবরণ, দাম ও চিকিৎসকের যোগাযোগের নম্বর।</li>
                <li><strong>ডিভাইস ও টেকনিক্যাল ডাটা:</strong> নেটওয়ার্ক স্ট্যাটাস ও আইপি অ্যাড্রেস (ফায়ারবেস ক্লাউড কানেকশনের জন্য)।</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">৩</span>
                ডিভাইস পারমিশন
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900">🎙️ মাইক্রোফোন (Microphone)</p>
                  <p className="text-slate-600 mt-0.5">ভয়েস দিয়ে কথা বলে খামারের হিসাব লেখার জন্য সাময়িক অডিও রিকগনিশন।</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900">🌐 ইন্টারনেট (Internet)</p>
                  <p className="text-slate-600 mt-0.5">ক্লাউড ডাটাবেস ব্যাকআপ ও লাইভ মার্কেট রেট আপডেটের জন্য।</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">৪</span>
                থার্ড-পার্টি সার্ভিস ও নিরাপত্তা
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                আমরা <strong>Google Firebase (Google LLC)</strong> এর ক্লাউড ফায়ারস্টোর ও সিকিউর অথেন্টিকেশন ব্যবহার করি। আপনার ডেটা TLS 1.3 এনক্রিপশনের মাধ্যমে স্থানান্তরিত হয় এবং কোনো ব্যক্তিগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি করা হয় না।
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">৫</span>
                ডাটা মুছে ফেলার অধিকার (Account Deletion)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনি যেকোনো সময় অ্যাপের ভেতর থেকে যেকোনো ব্যাচ বা রেকর্ড সরাসরি মুছে ফেলতে পারেন। সম্পূর্ণ অ্যাকাউন্ট ও ক্লাউড ডাটাবেস মুছে ফেলতে চাইলে আমাদের ইমেইল করুন <a href="mailto:sr0632890@gmail.com" className="text-emerald-700 font-bold underline">sr0632890@gmail.com</a> অথবা ফোন করুন <strong>01410991934</strong> এ। ৭ দিনের মধ্যে স্থায়ীভাবে সমস্ত ডাটা মুছে দেওয়া হবে।
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-emerald-950">যোগাযোগের ঠিকানা</h3>
              <p className="text-xs text-emerald-800">
                ইমেইল: <a href="mailto:sr0632890@gmail.com" className="font-bold underline">sr0632890@gmail.com</a> | মোবাইল: <strong>01410991934</strong>
              </p>
              <p className="text-[11px] text-emerald-700">ওয়েবসাইট: <a href="https://polty-e357c.web.app/privacy-policy.html" target="_blank" rel="noreferrer" className="underline">https://polty-e357c.web.app</a></p>
            </div>
          </div>
        ) : (
          /* ================= ENGLISH VERSION ================= */
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">1</span>
                Overview & Scope
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Digital Khamar Pro ("the App", "we", "us", or "our") provides smart farm management and livestock analytics for poultry, cattle, dairy, and fish farmers. We are dedicated to protecting user privacy and complying fully with Google Play Developer Policies and Data Safety requirements.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">2</span>
                Information We Collect
              </h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
                <li><strong>Account Info:</strong> Name, Email address, Phone number, Profile avatar.</li>
                <li><strong>Farm Records:</strong> Batches, daily feed logs, mortality count, medicine usage, body weight records.</li>
                <li><strong>Financial Accounting:</strong> Production expenses, cash memos, customer sales receipts, dues book (বাকির খাতা).</li>
                <li><strong>Marketplace Listings:</strong> User-submitted livestock photos, pricing, district location, and contact numbers.</li>
                <li><strong>Technical Telemetry:</strong> IP address, device OS version, and network state for database synchronization.</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">3</span>
                Device Permissions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900">🎙️ RECORD_AUDIO (Microphone)</p>
                  <p className="text-slate-600 mt-0.5">Used temporarily for voice speech-to-text logging in Bengali and English. No permanent audio files are stored.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900">🌐 INTERNET & NETWORK</p>
                  <p className="text-slate-600 mt-0.5">Required for encrypted Google Firebase synchronization and live market rates.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">4</span>
                Third-Party Services & Data Security
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We use <strong>Google Firebase</strong> (Cloud Firestore, Firebase Authentication) with TLS 1.3 encryption and fine-grained Firestore Security Rules. We NEVER sell or monetize your personal or financial data.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">5</span>
                Data Retention & Account Deletion Policy
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You retain full ownership of your data. You may delete individual records in-app, or request a complete purge of your account and all associated cloud database entries by emailing <a href="mailto:sr0632890@gmail.com" className="text-emerald-700 font-bold underline">sr0632890@gmail.com</a> or calling <strong>01410991934</strong>. All data will be permanently wiped within 7 business days.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-emerald-950">Official Contact</h3>
              <p className="text-xs text-emerald-800">
                Email: <a href="mailto:sr0632890@gmail.com" className="font-bold underline">sr0632890@gmail.com</a> | Phone: <strong>01410991934 (+8801410991934)</strong>
              </p>
              <p className="text-[11px] text-emerald-700">Website: <a href="https://polty-e357c.web.app/privacy-policy.html" target="_blank" rel="noreferrer" className="underline">https://polty-e357c.web.app</a></p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

