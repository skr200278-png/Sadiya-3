import React, { useRef } from 'react';
import { X, Printer, MessageCircle, Copy, Check, FileText, Building2, Phone, Calendar, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

export interface CashMemoData {
  memoNo?: string;
  farmName?: string;
  date: string;
  batchName?: string;
  buyerName?: string;
  buyerPhone?: string;
  items: {
    name: string;
    quantity: string | number;
    unit?: string;
    unitPrice?: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  notes?: string;
  type?: 'sale' | 'due_payment';
}

interface CashMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CashMemoData | null;
}

export default function CashMemoModal({ isOpen, onClose, data }: CashMemoModalProps) {
  const { language } = useLanguage();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const farmTitle = data.farmName || (language === 'bn' ? 'আমাদের স্মার্ট খামার' : 'Digital Smart Farm');
  const memoNumber = data.memoNo || `MEMO-${Math.abs(data.date.replace(/[^0-9]/g, ''))}-${Math.floor(100 + Math.random() * 900)}`;

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppText = () => {
    let text = `📄 *${farmTitle} - ক্যাশ মেমো*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `মেমো নং: *${memoNumber}*\n`;
    text += `তারিখ: *${data.date}*\n`;
    if (data.buyerName) text += `ক্রেতা: *${data.buyerName}*\n`;
    if (data.buyerPhone) text += `ফোন: ${data.buyerPhone}\n`;
    if (data.batchName) text += `ব্যাচ: ${data.batchName}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*পণ্যের বিবরণ:*\n`;
    data.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} - ${item.quantity} ${item.unit || ''} @ ৳${item.unitPrice || 0} = *৳${item.totalPrice}*\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `মোট বিল: *৳${data.totalAmount.toLocaleString('bn-BD')}*\n`;
    text += `নগদ আদায়: *৳${data.paidAmount.toLocaleString('bn-BD')}*\n`;
    if (data.dueAmount > 0) {
      text += `🔴 বকেয়া: *৳${data.dueAmount.toLocaleString('bn-BD')}*\n`;
    } else {
      text += `🟢 পরিশোধ স্ট্যাটাস: *পরিশোধিত (Paid)*\n`;
    }
    if (data.notes) text += `নোট: ${data.notes}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `ধন্যবাদ, আবার আসবেন! 🙏`;
    return text;
  };

  const handleWhatsAppShare = () => {
    const message = generateWhatsAppText();
    let url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    if (data.buyerPhone) {
      const cleanPhone = data.buyerPhone.replace(/[^0-9]/g, '');
      const formattedPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
      url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    }
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text);
    toast.success(language === 'bn' ? 'ক্যাশ মেমো কপি করা হয়েছে!' : 'Invoice copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Print Styles Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-memo, #printable-memo * {
            visibility: visible;
          }
          #printable-memo {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            margin: 0;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-scaleUp">
        {/* Modal Top Action Bar */}
        <div className="no-print bg-slate-900 text-white p-3 sm:p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-teal-400" />
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
              {language === 'bn' ? 'ডিজিটাল ক্যাশ মেমো / রিসিট' : 'Digital Cash Memo'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Printable Memo Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          <div 
            id="printable-memo" 
            ref={printRef}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-slate-800 font-sans"
          >
            {/* Memo Header */}
            <div className="text-center border-b-2 border-slate-800/80 pb-3 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                {data.type === 'due_payment' 
                  ? (language === 'bn' ? 'টাকা জমার মানি রিসিট' : 'MONEY RECEIPT') 
                  : (language === 'bn' ? 'বিক্রয় ক্যাশ মেমো' : 'SALES CASH MEMO')}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
                {farmTitle}
              </h2>
              <p className="text-[11px] text-slate-500 font-bold">
                {language === 'bn' ? 'উন্নত জাতের পোল্ট্রি, ডেইরি ও কৃষি খামার' : 'Modern Poultry, Dairy & Agricultural Farm'}
              </p>
            </div>

            {/* Memo Info & Customer Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-200 pb-3">
              <div className="space-y-1">
                <p className="text-slate-500 font-semibold">
                  {language === 'bn' ? 'মেমো নং:' : 'Memo No:'} <strong className="text-slate-800 font-mono">{memoNumber}</strong>
                </p>
                <p className="text-slate-500 font-semibold">
                  {language === 'bn' ? 'তারিখ:' : 'Date:'} <strong className="text-slate-800 font-mono">{data.date}</strong>
                </p>
                {data.batchName && (
                  <p className="text-slate-500 font-semibold">
                    {language === 'bn' ? 'ব্যাচ:' : 'Batch:'} <strong className="text-slate-800">{data.batchName}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-1 text-right">
                <p className="text-slate-500 font-semibold">
                  {language === 'bn' ? 'ক্রেতার নাম:' : 'Customer:'} <strong className="text-slate-900">{data.buyerName || (language === 'bn' ? 'খুচরা ক্রেতা' : 'Walk-in Customer')}</strong>
                </p>
                {data.buyerPhone && (
                  <p className="text-slate-500 font-semibold">
                    {language === 'bn' ? 'মোবাইল:' : 'Phone:'} <strong className="text-blue-700 font-mono">{data.buyerPhone}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-2 sm:p-2.5">#</th>
                    <th className="p-2 sm:p-2.5">{language === 'bn' ? 'বিবরণ' : 'Item'}</th>
                    <th className="p-2 sm:p-2.5 text-center">{language === 'bn' ? 'পরিমাণ' : 'Qty'}</th>
                    <th className="p-2 sm:p-2.5 text-right">{language === 'bn' ? 'দর (৳)' : 'Rate'}</th>
                    <th className="p-2 sm:p-2.5 text-right">{language === 'bn' ? 'মোট (৳)' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2 sm:p-2.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2 sm:p-2.5 font-bold text-slate-800">{item.name}</td>
                      <td className="p-2 sm:p-2.5 text-center font-mono font-medium">
                        {item.quantity} {item.unit || ''}
                      </td>
                      <td className="p-2 sm:p-2.5 text-right font-mono text-slate-600">
                        {item.unitPrice ? `৳${item.unitPrice}` : '-'}
                      </td>
                      <td className="p-2 sm:p-2.5 text-right font-black font-mono text-slate-900">
                        ৳{item.totalPrice.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-700 font-bold">
                <span>{language === 'bn' ? 'মোট টাকার পরিমাণ:' : 'Grand Total:'}</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  ৳{data.totalAmount.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 font-bold">
                <span>{language === 'bn' ? 'নগদ আদায় / জমা:' : 'Cash Paid:'}</span>
                <span className="text-sm font-black font-mono">
                  ৳{data.paidAmount.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center">
                <span className={`font-black ${data.dueAmount > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                  {language === 'bn' ? 'অবশিষ্ট বকেয়া:' : 'Net Due Balance:'}
                </span>
                <span className={`text-base font-black font-mono ${data.dueAmount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {data.dueAmount > 0 
                    ? `৳${data.dueAmount.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}` 
                    : (language === 'bn' ? 'পরিশোধিত ✔️' : 'PAID ✔️')}
                </span>
              </div>
            </div>

            {data.notes && (
              <p className="text-[11px] text-slate-500 italic bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
                📝 {data.notes}
              </p>
            )}

            {/* Signature Area */}
            <div className="pt-8 flex justify-between items-end text-[11px] text-slate-500">
              <div className="text-center">
                <div className="w-24 border-b border-slate-400 mb-1"></div>
                <span>{language === 'bn' ? 'ক্রেতার স্বাক্ষর' : 'Buyer Signature'}</span>
              </div>
              <div className="text-center">
                <div className="w-28 border-b border-slate-400 mb-1"></div>
                <span className="font-bold text-slate-700">{language === 'bn' ? 'কর্তৃপক্ষের স্বাক্ষর' : 'Authorized Signature'}</span>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              {language === 'bn' ? 'খামার ব্যবস্থাপনার ডিজিটাল মেমো | আপনার ব্যবসার বিশ্বস্ত সঙ্গী' : 'Smart Farm Management Receipt | Thank You!'}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="no-print bg-white p-3 sm:p-4 border-t border-slate-200 flex flex-wrap gap-2 justify-between items-center shrink-0">
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white px-3.5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Printer size={15} />
              <span>{language === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'}</span>
            </button>

            <button 
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <MessageCircle size={15} />
              <span>{language === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান' : 'WhatsApp'}</span>
            </button>

            <button 
              onClick={handleCopyText}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Copy size={15} />
              <span className="hidden sm:inline">{language === 'bn' ? 'কপি' : 'Copy'}</span>
            </button>
          </div>

          <button 
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
