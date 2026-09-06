import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  confirmText, 
  cancelText = 'বাতিল', 
  confirmVariant = 'danger', 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  // Default confirm text if not explicitly provided
  const resolvedConfirmText = confirmText || (
    confirmVariant === 'success' ? 'হ্যাঁ, নিশ্চিত করুন' :
    confirmVariant === 'primary' ? 'নিশ্চিত করুন' :
    'মুছে ফেলুন'
  );

  const getButtonClasses = () => {
    switch (confirmVariant) {
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs';
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs';
      case 'danger':
      default:
        return 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs';
    }
  };

  const getIcon = () => {
    switch (confirmVariant) {
      case 'success':
        return <CheckCircle2 className="text-emerald-600 shrink-0" size={22} />;
      case 'primary':
        return <Info className="text-blue-600 shrink-0" size={22} />;
      case 'danger':
      default:
        return <AlertTriangle className="text-red-600 shrink-0" size={22} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all border border-slate-100"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            confirmVariant === 'success' ? 'bg-emerald-50' :
            confirmVariant === 'primary' ? 'bg-blue-50' :
            'bg-red-50'
          }`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer active:scale-98 ${getButtonClasses()}`}
          >
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
