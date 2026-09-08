/**
 * duesSync.ts
 * 
 * Provides robust 2-way synchronization and real-time status linking between:
 * - বকেয়া খাতা (Dues Ledger)
 * AND
 * - খাবার (Feed Records)
 * - ঔষধ ও ভ্যাকসিন (Medicine Records)
 * - খামার খরচ (Expenses)
 * - বিক্রয় (Sales Records)
 */

export interface DuePaymentItem {
  date: string;
  amount: number;
}

export interface RecordDueStatus {
  hasDueRecord: boolean;
  hadDueOriginally: boolean;
  isFullyPaid: boolean;
  remainingDue: number;
  originalDue: number;
  totalPaid: number;
  totalPaidInDues: number;
  lastPaymentDate?: string;
  payments: DuePaymentItem[];
  dueRecord?: any;
}

/**
 * Normalizes text for reliable matching (removes extra spaces and lowercases)
 */
export function normalizeName(name?: string): string {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Parses and normalizes date strings to YYYY-MM-DD
 */
export function normalizeDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.trim();
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr.trim();
  }
}

/**
 * Formats a date nicely for Bengali or English UI display
 */
export function formatDisplayDate(dateStr?: string, lang: 'bn' | 'en' = 'bn'): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Finds matching due record and calculates live dues and payment status
 */
export function getRecordDueStatus(
  record: any,
  duesList: any[] = [],
  recordType: 'feed' | 'medicine' | 'expense' | 'sale'
): RecordDueStatus {
  const totalAmount = Number(record.cost ?? record.totalAmount ?? record.amount) || 0;
  const initialAmountPaid = record.amountPaid !== undefined ? Number(record.amountPaid) : totalAmount;
  const initialDue = Math.max(0, totalAmount - initialAmountPaid);

  if (!duesList || duesList.length === 0) {
    return {
      hasDueRecord: false,
      hadDueOriginally: initialDue > 0,
      isFullyPaid: initialDue === 0,
      remainingDue: initialDue,
      originalDue: initialDue,
      totalPaid: initialAmountPaid,
      totalPaidInDues: 0,
      payments: []
    };
  }

  // 1. First priority: Direct foreign key match (dueRecordId or sourceId)
  let matchedDue = duesList.find(d => {
    if (record.dueRecordId && d.id === record.dueRecordId) return true;
    if (d.sourceId && d.sourceId === record.id) return true;
    return false;
  });

  // 2. Second priority: High confidence metadata match for existing/unlinked records
  if (!matchedDue) {
    const recordPerson = normalizeName(
      record.personName || record.vendorName || record.buyerName || record.customerName
    );
    const expectedDueType = recordType === 'sale' ? 'receivable' : 'payable';
    const recDate = normalizeDate(record.date);

    matchedDue = duesList.find(d => {
      // Must match person name
      const duePerson = normalizeName(d.personName);
      if (!duePerson || duePerson !== recordPerson) return false;

      // Must match transaction type
      const dType = d.type === 'receivable' || d.type === 'payable_to_me' ? 'receivable' : 'payable';
      if (dType !== expectedDueType) return false;

      // Match amount: Either due.amount equals totalAmount OR due.amount equals initialDue
      const dueAmt = Number(d.amount) || 0;
      const matchesTotal = Math.abs(dueAmt - totalAmount) < 1;
      const matchesDue = Math.abs(dueAmt - initialDue) < 1;
      if (!matchesTotal && !matchesDue) return false;

      // Match date: Check if date matches or is very close
      const dDate = normalizeDate(d.recordDate || d.date || d.createdAt);
      if (recDate && dDate && recDate === dDate) return true;

      // If dates match within 7 days and amount matches exactly
      if (recDate && dDate) {
        const timeDiff = Math.abs(new Date(recDate).getTime() - new Date(dDate).getTime());
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        if (daysDiff <= 7) return true;
      }

      return matchesTotal || matchesDue;
    });
  }

  if (!matchedDue) {
    return {
      hasDueRecord: false,
      hadDueOriginally: initialDue > 0,
      isFullyPaid: initialDue === 0,
      remainingDue: initialDue,
      originalDue: initialDue,
      totalPaid: initialAmountPaid,
      totalPaidInDues: 0,
      payments: []
    };
  }

  // Found matching due! Calculate live totals from the due record
  const dueTotalAmount = Number(matchedDue.amount) || totalAmount;
  const dueTotalPaid = Number(matchedDue.totalPaid) || 0;
  const remainingDue = Math.max(0, dueTotalAmount - dueTotalPaid);
  const isFullyPaid = matchedDue.status === 'paid' || remainingDue <= 0;

  const payments: DuePaymentItem[] = matchedDue.payments || [];
  let lastPaymentDate: string | undefined = undefined;

  if (payments.length > 0) {
    const lastP = payments[payments.length - 1];
    lastPaymentDate = lastP.date;
  } else if (isFullyPaid) {
    lastPaymentDate = matchedDue.updatedAt || matchedDue.recordDate || matchedDue.createdAt;
  }

  // Calculate how much extra was paid through dues ledger
  const paidInDues = Math.max(0, dueTotalPaid - initialAmountPaid);

  return {
    hasDueRecord: true,
    hadDueOriginally: true,
    isFullyPaid,
    remainingDue,
    originalDue: dueTotalAmount,
    totalPaid: dueTotalPaid,
    totalPaidInDues: paidInDues,
    lastPaymentDate,
    payments,
    dueRecord: matchedDue
  };
}

/**
 * Synchronizes dues payments back to the source record (feed, medicine, expense, sale)
 */
export async function syncPaymentToSourceRecord(
  dueRecord: any,
  newTotalPaid: number,
  paymentDate: string,
  isDemoUser: boolean,
  db: any,
  offlineSafeDocWriteFn?: (p: Promise<any>) => Promise<any>,
  updateDocFn?: any,
  docFn?: any,
  demoStoreInstance?: any
) {
  try {
    const sType = dueRecord.sourceType;
    const sId = dueRecord.sourceId;

    if (sType && sId) {
      if (isDemoUser && demoStoreInstance) {
        if (sType === 'feed') {
          const rec = demoStoreInstance.getFeedRecords().find((r: any) => r.id === sId);
          if (rec) demoStoreInstance.saveFeedRecord({ ...rec, amountPaid: newTotalPaid, lastPaidDate: paymentDate });
        } else if (sType === 'medicine') {
          const rec = demoStoreInstance.getMedicineRecords().find((r: any) => r.id === sId);
          if (rec) demoStoreInstance.saveMedicineRecord({ ...rec, amountPaid: newTotalPaid, lastPaidDate: paymentDate });
        } else if (sType === 'expense') {
          const rec = demoStoreInstance.getExpenses().find((r: any) => r.id === sId);
          if (rec) demoStoreInstance.saveExpense({ ...rec, amountPaid: newTotalPaid, lastPaidDate: paymentDate });
        } else if (sType === 'sale') {
          const rec = demoStoreInstance.getSales().find((r: any) => r.id === sId);
          if (rec) demoStoreInstance.saveSale({ ...rec, amountPaid: newTotalPaid, lastPaidDate: paymentDate });
        }
        return;
      }

      const collectionMap: Record<string, string> = {
        feed: 'feed_records',
        medicine: 'medicine_records',
        expense: 'expenses',
        sale: 'sales'
      };
      const colName = collectionMap[sType];
      if (colName && db && docFn && updateDocFn) {
        const writeFn = offlineSafeDocWriteFn || ((p: any) => p);
        await writeFn(updateDocFn(docFn(db, colName, sId), {
          amountPaid: newTotalPaid,
          lastPaidDate: paymentDate
        }));
      }
    }
  } catch (err) {
    console.warn('Error syncing payment to source record:', err);
  }
}

