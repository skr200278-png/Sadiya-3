import React, { useState } from 'react';
import { X, Scale, Check } from 'lucide-react';

interface FcrWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  ageDays: number;
  initialWeight: number;
  stdWeight: number;
  onSave: (newWeight: number) => void;
}

export default function FcrWeightModal({
  isOpen,
  onClose,
  language,
  ageDays,
  initialWeight,
  stdWeight,
  onSave
}: FcrWeightModalProps) {
  const [weightInput, setWeightInput] = useState<string>(String(initialWeight || 1500));
  if (!isOpen) return null;

  const isBn = language === 'bn';
  const num = parseFloat(weightInput) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (num > 0) {
      onSave(num);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Scale size={18} />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">
                {isBn ? 'বর্তমান গড় ওজন আপডেট' : 'Update Average Weight'}
              </h4>
              <p className="text-[11px] text-slate-500 font-semibold">
                {isBn ? `বয়স: ${ageDays} দিন • আদর্শ মান: ${stdWeight} গ্রাম` : `Age: ${ageDays} days • Std: ${stdWeight}g`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isBn ? 'গড় শারীরিক ওজন (গ্রামে):' : 'Average Body Weight (in Grams):'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="1500"
                min="10"
                step="1"
                autoFocus
                className="w-full border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl py-3 px-4 text-xl font-black font-mono text-slate-900 outline-none bg-slate-50"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                {isBn ? 'গ্রাম' : 'grams'}
              </span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 mr-1">
              {isBn ? 'দ্রুত সেট:' : 'Quick:'}
            </span>
            {[stdWeight, 1200, 1500, 1600, 2000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setWeightInput(String(val))}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  num === val
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {val}g
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check size={14} />
              <span>{isBn ? 'সংরক্ষণ করুন' : 'Save Weight'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
