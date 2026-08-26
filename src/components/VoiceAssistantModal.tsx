import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Volume2, 
  RefreshCw,
  ShoppingBag,
  Wheat,
  ShieldPlus,
  Skull,
  Receipt,
  Layers
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db, fastGetDocs, offlineSafeDocWrite } from '../firebase';
import { collection, query, where, addDoc } from 'firebase/firestore';
import { demoStore } from '../utils/demoStore';
import toast from 'react-hot-toast';

// Convert Bangla numbers to English digits
export function parseBanglaNumber(text: string): number | null {
  if (!text) return null;

  // Bangla to English digit map
  const bnToEnMap: { [key: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };

  // Word to number estimates in Bangla
  const wordMap: { [key: string]: number } = {
    'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5,
    'ছয়': 6, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'নয়': 9, 'দশ': 10,
    'বিশ': 20, 'ত্রিশ': 30, 'চল্লিশ': 40, 'পঞ্চাশ': 50,
    'একশ': 100, 'একশো': 100, 'দুইশ': 200, 'দুইশো': 200, 'তিনশ': 300,
    'পাঁচশ': 500, 'পাঁচশো': 500, 'হাজার': 1000, 'বারোশত': 1200, 'পনেরোশত': 1500,
    'দুই হাজার': 2000, 'পাঁচ হাজার': 5000, 'দশ হাজার': 10000
  };

  // Check direct words
  for (const [w, val] of Object.entries(wordMap)) {
    if (text.includes(w)) {
      // Look for compound multipliers like "২ হাজার" or "১২০০"
    }
  }

  // Replace Bangla digits with English
  let normalized = text.replace(/[০-৯]/g, match => bnToEnMap[match] || match);
  
  // Extract first floating/integer number
  const match = normalized.match(/\d+(\.\d+)?/);
  if (match) {
    return parseFloat(match[0]);
  }

  return null;
}

export interface ParsedVoiceIntent {
  category: 'sale' | 'feed' | 'expense' | 'mortality' | 'medicine' | 'unknown';
  amount?: number;
  quantity?: number;
  itemOrPerson?: string;
  notes?: string;
  confidence: number;
}

export function parseBanglaVoiceText(transcript: string): ParsedVoiceIntent {
  const text = transcript.toLowerCase();
  
  let category: ParsedVoiceIntent['category'] = 'unknown';
  let amount: number | undefined;
  let quantity: number | undefined;
  let itemOrPerson = '';
  let notes = transcript;
  let confidence = 0.8;

  // 1. Sales Recognition
  if (text.includes('বিক্রি') || text.includes('বেচা') || text.includes('ডিম') || text.includes('মুরগি বিক্রি') || text.includes('মাছ বিক্রি') || text.includes('দুধ')) {
    category = 'sale';
    
    // Check for quantity (e.g. ৫০টি, ২০ কেজি)
    const qtyMatch = text.match(/(\d+|[০-৯]+)\s*(কেজি|টি|টা|পিস|হালি|লিটার|কেজি)/);
    if (qtyMatch) {
      quantity = parseBanglaNumber(qtyMatch[1]) || undefined;
    }

    // Check for money/taka (e.g. ১২০০ টাকা, ৳১৫০০)
    const takaMatch = text.match(/(\d+|[০-৯]+)\s*(টাকা|টাকার|টাকায়|৳)/);
    if (takaMatch) {
      amount = parseBanglaNumber(takaMatch[1]) || undefined;
    } else {
      const num = parseBanglaNumber(text);
      if (num && !quantity) amount = num;
    }

    // Extract customer name if "কাছে" or "বাবদ" is mentioned
    const nameMatch = text.match(/([^\s]+)\s*(এর কাছে|কাছে|কে|ভাই)/);
    if (nameMatch) {
      itemOrPerson = nameMatch[1];
    }
  }
  // 2. Feed Recognition
  else if (text.includes('খাবার') || text.includes('ফিড') || text.includes('বস্তা') || text.includes('ভুষি') || text.includes('ঘাস')) {
    category = 'feed';
    const bagMatch = text.match(/(\d+|[০-৯]+)\s*(বস্তা|ব্যাগ|কেজি)/);
    if (bagMatch) {
      quantity = parseBanglaNumber(bagMatch[1]) || undefined;
    }
    const takaMatch = text.match(/(\d+|[০-৯]+)\s*(টাকা|টাকার|৳)/);
    if (takaMatch) {
      amount = parseBanglaNumber(takaMatch[1]) || undefined;
    }
  }
  // 3. Mortality Recognition
  else if (text.includes('মারা') || text.includes('মৃত') || text.includes('মরেছে') || text.includes('মরে গেল') || text.includes('মৃত্যু')) {
    category = 'mortality';
    const countMatch = text.match(/(\d+|[০-৯]+)\s*(টি|টা|পিস|মুরগি|বাচ্চা)?/);
    if (countMatch) {
      quantity = parseBanglaNumber(countMatch[1]) || undefined;
    }
  }
  // 4. Medicine / Vaccine Recognition
  else if (text.includes('ওষুধ') || text.includes('ঔষধ') || text.includes('ভ্যাকসিন') || text.includes('টিকা') || text.includes('ড্রপ')) {
    category = 'medicine';
    const takaMatch = text.match(/(\d+|[০-৯]+)\s*(টাকা|৳)/);
    if (takaMatch) {
      amount = parseBanglaNumber(takaMatch[1]) || undefined;
    }
  }
  // 5. General Expense
  else if (text.includes('খরচ') || text.includes('কারেন্ট') || text.includes('বিদ্যুৎ') || text.includes('ভাড়া') || text.includes('লেবার') || text.includes('লিটার')) {
    category = 'expense';
    const takaMatch = text.match(/(\d+|[০-৯]+)\s*(টাকা|৳)/);
    if (takaMatch) {
      amount = parseBanglaNumber(takaMatch[1]) || undefined;
    } else {
      amount = parseBanglaNumber(text) || undefined;
    }
  }

  // Fallback number extraction if amount or quantity still null
  if (!amount && !quantity) {
    const rawNum = parseBanglaNumber(text);
    if (rawNum) amount = rawNum;
  }

  return {
    category,
    amount,
    quantity,
    itemOrPerson,
    notes,
    confidence
  };
}

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function VoiceAssistantModal({
  isOpen,
  onClose,
  onSuccess
}: VoiceAssistantModalProps) {
  const { language } = useLanguage();
  const { currentUser, isDemoUser } = useAuth();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState<ParsedVoiceIntent | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchBatches();
      initSpeech();
    } else {
      stopListening();
    }
  }, [isOpen]);

  const fetchBatches = async () => {
    if (isDemoUser) {
      const bList = demoStore.getBatches().filter(b => b.status === 'active');
      setBatches(bList);
      if (bList.length > 0) setSelectedBatchId(bList[0].id);
      return;
    }
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'batches'), where('userId', '==', currentUser.uid), where('status', '==', 'active'));
      const snap = await fastGetDocs(q);
      const bList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBatches(bList);
      if (bList.length > 0) setSelectedBatchId(bList[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const initSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'bn-BD'; // Bengali (Bangladesh)

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        setTranscript(finalTranscript);
        const parsed = parseBanglaVoiceText(finalTranscript);
        setParsedData(parsed);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error(language === 'bn' ? 'মাইক্রোফোন ব্যবহারের অনুমতি দিন।' : 'Please allow microphone permission.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    startListening();
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
      setParsedData(null);
    } catch (e) {
      console.warn('Already started or error:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const handleSaveEntry = async () => {
    if (!parsedData || parsedData.category === 'unknown') {
      toast.error(language === 'bn' ? 'দয়া করে মুখে স্পষ্ট করে আবার বলুন।' : 'Could not detect entry type. Please speak again.');
      return;
    }

    if (!selectedBatchId && batches.length > 0) {
      toast.error(language === 'bn' ? 'একটি ব্যাচ নির্বাচন করুন।' : 'Please select a batch.');
      return;
    }

    setIsSaving(true);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      if (parsedData.category === 'sale') {
        const amount = parsedData.amount || (parsedData.quantity ? parsedData.quantity * 150 : 0);
        const newSale = {
          batchId: selectedBatchId,
          date: todayStr,
          totalAmount: amount,
          amountPaid: amount,
          buyerName: parsedData.itemOrPerson || (language === 'bn' ? 'ভয়েস এন্ট্রি ক্রেতা' : 'Voice Customer'),
          quantity: parsedData.quantity || 1,
          category: 'chicken',
          notes: `[ভয়েস এন্ট্রি]: ${parsedData.notes}`
        };

        if (isDemoUser) {
          demoStore.saveSale(newSale as any);
        } else if (currentUser) {
          await offlineSafeDocWrite(
            addDoc(collection(db, 'sales'), { ...newSale, userId: currentUser.uid, createdAt: new Date().toISOString() })
          );
        }
        toast.success(language === 'bn' ? 'বিক্রয় সফলভাবে সেভ হয়েছে! 🎉' : 'Sale saved successfully!');
      } 
      else if (parsedData.category === 'feed') {
        const cost = parsedData.amount || 0;
        const newFeed = {
          batchId: selectedBatchId,
          date: todayStr,
          feedType: 'Starter / বয়লার ফিড',
          quantityBags: parsedData.quantity || 1,
          pricePerBag: cost > 0 && parsedData.quantity ? cost / parsedData.quantity : cost,
          cost: cost,
          amountPaid: cost,
          personName: (language === 'bn' ? 'ভয়েস ডিলার' : 'Dealer'),
          details: `[ভয়েস এন্ট্রি]: ${parsedData.notes}`
        };

        if (isDemoUser) {
          demoStore.saveFeedRecord(newFeed as any);
        } else if (currentUser) {
          await offlineSafeDocWrite(
            addDoc(collection(db, 'feed_records'), { ...newFeed, userId: currentUser.uid, createdAt: new Date().toISOString() })
          );
        }
        toast.success(language === 'bn' ? 'খাবারের হিসাব সেভ হয়েছে! 🌾' : 'Feed record saved!');
      }
      else if (parsedData.category === 'mortality') {
        const count = parsedData.quantity || parsedData.amount || 1;
        const newMort = {
          batchId: selectedBatchId,
          date: todayStr,
          count: count,
          cause: language === 'bn' ? 'স্বাভাবিক / ভয়েস রেকর্ড' : 'Normal / Voice entry'
        };

        if (isDemoUser) {
          demoStore.saveMortalityRecord(newMort as any);
        } else if (currentUser) {
          await offlineSafeDocWrite(
            addDoc(collection(db, 'mortality'), { ...newMort, userId: currentUser.uid, createdAt: new Date().toISOString() })
          );
        }
        toast.success(language === 'bn' ? 'মৃত্যু সংখ্যা আপডেট হয়েছে! 📋' : 'Mortality recorded!');
      }
      else if (parsedData.category === 'medicine') {
        const cost = parsedData.amount || 0;
        const newMed = {
          batchId: selectedBatchId,
          date: todayStr,
          medicineName: parsedData.itemOrPerson || (language === 'bn' ? 'ভ্যাকসিন / ওষুধ' : 'Vaccine / Medicine'),
          type: 'medicine',
          cost: cost,
          amountPaid: cost,
          personName: (language === 'bn' ? 'ফার্মেসি' : 'Pharmacy'),
          details: `[ভয়েস এন্ট্রি]: ${parsedData.notes}`
        };

        if (isDemoUser) {
          demoStore.saveMedicineRecord(newMed as any);
        } else if (currentUser) {
          await offlineSafeDocWrite(
            addDoc(collection(db, 'medicine_records'), { ...newMed, userId: currentUser.uid, createdAt: new Date().toISOString() })
          );
        }
        toast.success(language === 'bn' ? 'ওষুধ হিসাব সেভ হয়েছে! 💉' : 'Medicine record saved!');
      }
      else {
        // General expense
        const cost = parsedData.amount || 0;
        const newExp = {
          batchId: selectedBatchId,
          date: todayStr,
          category: 'other',
          amount: cost,
          amountPaid: cost,
          personName: (language === 'bn' ? 'বিবিধ' : 'Misc'),
          details: `[ভয়েস এন্ট্রি]: ${parsedData.notes}`
        };

        if (isDemoUser) {
          demoStore.saveExpense(newExp as any);
        } else if (currentUser) {
          await offlineSafeDocWrite(
            addDoc(collection(db, 'expenses'), { ...newExp, userId: currentUser.uid, createdAt: new Date().toISOString() })
          );
        }
        toast.success(language === 'bn' ? 'খরচ সফলভাবে সেভ হয়েছে! 🧾' : 'Expense saved!');
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(language === 'bn' ? 'সেভ করতে সমস্যা হয়েছে।' : 'Failed to save voice entry.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-indigo-700 to-indigo-800 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Sparkles size={18} className="text-yellow-300 animate-spin" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                {language === 'bn' ? '🎙️ স্মার্ট বাংলা ভয়েস এন্ট্রি' : 'Smart Voice Farm Entry'}
              </h3>
              <p className="text-[11px] text-teal-100 font-medium">
                {language === 'bn' ? 'মুখে বললেই হিসাব স্বয়ংক্রিয়ভাবে ইনপুট হবে' : 'Speak naturally in Bangla or English'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-slate-800">
          {/* Batch Selector */}
          {batches.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {language === 'bn' ? 'ব্যাচ নির্বাচন করুন:' : 'Select Target Batch:'}
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.batchName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Voice Visualizer / Microphone Center */}
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-100 scale-105' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
              }`}
            >
              {isListening ? <Mic size={36} /> : <MicOff size={36} />}
            </button>

            <span className="text-xs font-black text-slate-600">
              {isListening 
                ? (language === 'bn' ? '🔴 এখন কথা বলুন...' : 'Listening now...') 
                : (language === 'bn' ? 'মাইক্রোফোনে চাপ দিয়ে কথা বলুন' : 'Tap to start speaking')}
            </span>
          </div>

          {/* Realtime Transcript Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 min-h-[70px] flex items-center justify-center text-center">
            {transcript ? (
              <p className="text-sm font-bold text-slate-800 leading-relaxed font-sans">
                "{transcript}"
              </p>
            ) : (
              <div className="space-y-1 text-slate-400">
                <p className="text-xs font-medium">
                  {language === 'bn' ? 'উদাহরণ: "করিমের কাছে ৫০ কেজি মুরগি বিক্রি বারোশত টাকা"' : 'Example: "Sold 50 kg chicken to Karim 1200 taka"'}
                </p>
                <p className="text-[11px]">
                  {language === 'bn' ? 'অথবা: "আজকে ৩টা মুরগি মারা গেছে" / "২ বস্তা খাবার কেনা"' : 'Or: "Bought 2 bags feed for 5000 taka"'}
                </p>
              </div>
            )}
          </div>

          {/* AI Parsing Preview Card */}
          {parsedData && parsedData.category !== 'unknown' && (
            <div className="bg-gradient-to-br from-indigo-50 to-teal-50 border border-indigo-200 rounded-2xl p-3.5 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" />
                  {language === 'bn' ? 'শনাক্তকৃত তথ্য (Smart Analysis)' : 'Detected Information'}
                </span>
                <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                  {parsedData.category === 'sale' ? '💰 বিক্রয়' : parsedData.category === 'feed' ? '🌾 খাবার' : parsedData.category === 'mortality' ? '💀 মৃত্যু' : parsedData.category === 'medicine' ? '💉 ওষুধ' : '🧾 খরচ'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {parsedData.amount !== undefined && (
                  <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-500 font-bold block">{language === 'bn' ? 'টাকার পরিমাণ:' : 'Amount:'}</span>
                    <strong className="text-emerald-700 font-mono text-sm">৳{parsedData.amount}</strong>
                  </div>
                )}
                {parsedData.quantity !== undefined && (
                  <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-500 font-bold block">{language === 'bn' ? 'পরিমাণ/সংখ্যা:' : 'Quantity:'}</span>
                    <strong className="text-slate-800 font-mono text-sm">{parsedData.quantity}</strong>
                  </div>
                )}
                {parsedData.itemOrPerson && (
                  <div className="col-span-2 bg-white/80 p-2 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-500 font-bold block">{language === 'bn' ? 'নাম / বিবরণ:' : 'Customer/Item:'}</span>
                    <strong className="text-slate-800 text-xs">{parsedData.itemOrPerson}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 transition-colors cursor-pointer"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>

          <button
            onClick={handleSaveEntry}
            disabled={isSaving || !parsedData || parsedData.category === 'unknown'}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            <span>{language === 'bn' ? '১-ক্লিকে সেভ করুন' : '1-Click Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
