import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { RecordDueStatus, formatDisplayDate } from '../utils/duesSync';

interface DuesStatusBadgeProps {
  dueStatus: RecordDueStatus;
  language: 'bn' | 'en';
  defaultPaidLabel?: string;
  defaultDueLabel?: string;
}

export const DuesStatusBadge: React.FC<DuesStatusBadgeProps> = ({
  dueStatus,
  language,
  defaultPaidLabel,
  defaultDueLabel
}) => {
  // Scenario 1: Paid in full initially at the time of entry (never had dues)
  if (!dueStatus.hadDueOriginally && !dueStatus.hasDueRecord) {
    return (
      <div className="flex flex-col items-end gap-0.5 mt-1 text-right">
        <span className="text-xs font-semibold text-emerald-600 outline outline-1 outline-emerald-200 px-1.5 py-0.5 rounded inline-block">
          {defaultPaidLabel || (language === 'bn' ? 'পরিশোধ' : 'Paid')}
        </span>
        {dueStatus.lastPaymentDate && (
          <span className="text-[10px] text-gray-500 font-medium">
            {formatDisplayDate(dueStatus.lastPaymentDate, language)}
          </span>
        )}
      </div>
    );
  }

  // Scenario 2: Had dues, and now fully settled & paid in Dues ledger!
  if (dueStatus.isFullyPaid) {
    return (
      <div className="flex flex-col items-end gap-0.5 mt-1 text-right">
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shadow-2xs">
          <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
          <span>{language === 'bn' ? 'সম্পূর্ণ পরিশোধিত' : 'Fully Paid'}</span>
        </span>
        {dueStatus.lastPaymentDate && (
          <span className="text-[10px] text-emerald-800 font-semibold tracking-tight">
            {language === 'bn' 
              ? `পরিশোধ তারিখ: ${formatDisplayDate(dueStatus.lastPaymentDate, language)}` 
              : `Paid: ${formatDisplayDate(dueStatus.lastPaymentDate, language)}`}
          </span>
        )}
        <Link 
          to="/dues" 
          className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
          title={language === 'bn' ? 'বকেয়া খাতা ও ভাউচার দেখুন' : 'View in Dues Ledger'}
        >
          <span>{language === 'bn' ? 'বকেয়া খাতা ↗' : 'Dues Ledger ↗'}</span>
        </Link>
      </div>
    );
  }

  // Scenario 3: Partially paid (deposit made, some due still remaining)
  if (dueStatus.remainingDue > 0 && (dueStatus.totalPaid > 0 || dueStatus.totalPaidInDues > 0)) {
    return (
      <div className="flex flex-col items-end gap-0.5 mt-1 text-right">
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md shadow-2xs">
          <Clock size={11} className="text-amber-600 shrink-0" />
          <span>
            {language === 'bn' 
              ? `বাকি: ৳ ${dueStatus.remainingDue.toLocaleString('bn-BD')}` 
              : `Due: ৳ ${dueStatus.remainingDue.toLocaleString()}`}
          </span>
        </span>
        <span className="text-[10px] text-slate-700 font-semibold tracking-tight">
          {language === 'bn' 
            ? `জমা: ৳ ${dueStatus.totalPaid.toLocaleString('bn-BD')}${dueStatus.lastPaymentDate ? ` (${formatDisplayDate(dueStatus.lastPaymentDate, language)})` : ''}` 
            : `Paid: ৳ ${dueStatus.totalPaid.toLocaleString()}${dueStatus.lastPaymentDate ? ` (${formatDisplayDate(dueStatus.lastPaymentDate, language)})` : ''}`}
        </span>
        <Link 
          to="/dues" 
          className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 hover:text-amber-900 font-bold hover:underline"
          title={language === 'bn' ? 'বকেয়া খাতা ও ভাউচার দেখুন' : 'View in Dues Ledger'}
        >
          <span>{language === 'bn' ? 'বকেয়া খাতা ↗' : 'Dues Ledger ↗'}</span>
        </Link>
      </div>
    );
  }

  // Scenario 4: Remaining due, no payment made yet in Dues
  return (
    <div className="flex flex-col items-end gap-0.5 mt-1 text-right">
      <span className="text-xs font-bold text-red-500 outline outline-1 outline-red-200 px-1.5 py-0.5 rounded inline-block">
        {defaultDueLabel || (language === 'bn' 
          ? `বাকি: ৳ ${dueStatus.remainingDue.toLocaleString('bn-BD')}` 
          : `Due: ৳ ${dueStatus.remainingDue.toLocaleString()}`)}
      </span>
      <Link 
        to="/dues" 
        className="inline-flex items-center gap-0.5 text-[10px] text-red-600 hover:text-red-800 font-bold hover:underline"
        title={language === 'bn' ? 'বকেয়া পরিশোধ করতে খাতা খুলুন' : 'Pay in Dues Ledger'}
      >
        <span>{language === 'bn' ? 'বকেয়া খাতা ↗' : 'Dues Ledger ↗'}</span>
      </Link>
    </div>
  );
};
