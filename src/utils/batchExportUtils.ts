import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import { db, fastGetDocs, offlineSafeDocWrite } from '../firebase';
import { demoStore } from './demoStore';
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore';

export interface BatchSummaryExportData {
  batch: any;
  sales: any[];
  feed: any[];
  expenses: any[];
  medicine: any[];
  mortality: any[];
}

/**
 * Fetches all child records of a batch for full backup / export
 */
export async function fetchBatchFullRecords(
  batchId: string, 
  userId: string, 
  isDemoUser: boolean
): Promise<BatchSummaryExportData | null> {
  try {
    if (isDemoUser) {
      const batch = demoStore.getBatches().find(b => b.id === batchId);
      if (!batch) return null;
      return {
        batch,
        sales: demoStore.getSales(batchId),
        feed: demoStore.getFeedRecords(batchId),
        expenses: demoStore.getExpenses(batchId),
        medicine: demoStore.getMedicineRecords(batchId),
        mortality: demoStore.getMortalityRecords(batchId),
      };
    }

    const [salesSnap, feedSnap, expSnap, medSnap, mortSnap] = await Promise.all([
      fastGetDocs(query(collection(db, 'sales'), where('userId', '==', userId), where('batchId', '==', batchId))),
      fastGetDocs(query(collection(db, 'feed_records'), where('userId', '==', userId), where('batchId', '==', batchId))),
      fastGetDocs(query(collection(db, 'expenses'), where('userId', '==', userId), where('batchId', '==', batchId))),
      fastGetDocs(query(collection(db, 'medicine'), where('userId', '==', userId), where('batchId', '==', batchId))),
      fastGetDocs(query(collection(db, 'mortality'), where('userId', '==', userId), where('batchId', '==', batchId))),
    ]);

    const sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const feed = feedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const expenses = expSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const medicine = medSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const mortality = mortSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return {
      batch: null, // caller can provide
      sales,
      feed,
      expenses,
      medicine,
      mortality
    };
  } catch (err) {
    console.error('Error fetching batch records for export:', err);
    return null;
  }
}

/**
 * Downloads a complete CSV containing all detailed rows for the completed batch
 */
export function downloadBatchCSV(batch: any, records: {
  sales: any[];
  feed: any[];
  expenses: any[];
  medicine: any[];
  mortality: any[];
}) {
  const rows: any[] = [];

  // Summary Row
  rows.push({
    'Category': 'BATCH INFO',
    'Date': batch.startDate,
    'Item / Title': `Batch: ${batch.batchName}`,
    'Quantity': batch.totalChicks,
    'Unit': 'Birds/Animals',
    'Rate (BDT)': batch.costPerChick || 0,
    'Total Amount (BDT)': (Number(batch.totalChicks || 0) * Number(batch.costPerChick || 0)),
    'Notes / Details': `Status: ${batch.status}, Completed: ${batch.endDate || batch.completedAt || 'Yes'}`
  });

  // Sales
  records.sales.forEach(s => {
    rows.push({
      'Category': 'SALES',
      'Date': s.date,
      'Item / Title': s.productName || s.category || 'Batch Sales',
      'Quantity': s.quantity || s.totalWeightKg || '',
      'Unit': s.totalWeightKg ? 'kg' : 'pcs',
      'Rate (BDT)': s.pricePerKg || s.pricePerPiece || '',
      'Total Amount (BDT)': s.totalAmount || 0,
      'Notes / Details': `Buyer: ${s.buyerName || 'N/A'}, Phone: ${s.buyerPhone || ''}`
    });
  });

  // Feed
  records.feed.forEach(f => {
    rows.push({
      'Category': 'FEED',
      'Date': f.date,
      'Item / Title': f.feedType || 'Feed',
      'Quantity': f.quantityBags || (f.quantityKg ? f.quantityKg / 50 : ''),
      'Unit': 'Bags',
      'Rate (BDT)': f.pricePerBag || '',
      'Total Amount (BDT)': f.cost || 0,
      'Notes / Details': f.details || f.personName || ''
    });
  });

  // Medicine
  records.medicine.forEach(m => {
    rows.push({
      'Category': 'MEDICINE / VACCINE',
      'Date': m.date,
      'Item / Title': m.medicineName || 'Medicine',
      'Quantity': 1,
      'Unit': 'item',
      'Rate (BDT)': m.cost || 0,
      'Total Amount (BDT)': m.cost || 0,
      'Notes / Details': m.details || ''
    });
  });

  // Expenses
  records.expenses.forEach(e => {
    rows.push({
      'Category': 'EXPENSES',
      'Date': e.date,
      'Item / Title': e.category || 'Other Expense',
      'Quantity': 1,
      'Unit': 'item',
      'Rate (BDT)': e.amount || 0,
      'Total Amount (BDT)': e.amount || 0,
      'Notes / Details': e.details || e.description || ''
    });
  });

  // Mortality
  records.mortality.forEach(mort => {
    rows.push({
      'Category': 'MORTALITY',
      'Date': mort.date,
      'Item / Title': 'Mortality Count',
      'Quantity': mort.count || 0,
      'Unit': 'birds',
      'Rate (BDT)': 0,
      'Total Amount (BDT)': 0,
      'Notes / Details': mort.cause || 'Dead birds'
    });
  });

  if (rows.length === 0) {
    toast.error('কোনো ডাটা পাওয়া যায়নি');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${batch.batchName || 'batch'}_Full_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success('ব্যাচের পূর্ণাঙ্গ হিসাব (CSV) সফলভাবে ডাউনলোড হয়েছে!');
}

/**
 * Generates an offline PDF closure audit statement for the batch
 */
export function downloadBatchPDF(batch: any, records: {
  sales: any[];
  feed: any[];
  expenses: any[];
  medicine: any[];
  mortality: any[];
}) {
  try {
    const doc = new jsPDF();
    const rep = batch.closureReport || {};
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(22, 101, 52); // green
    doc.text('Smart Khamar - Batch Closure Report', 14, 18);

    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    doc.text(`Batch: ${batch.batchName || 'Unnamed'}`, 14, 26);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Start: ${batch.startDate} | End: ${batch.endDate || batch.completedAt || 'Completed'} | Total Initial: ${batch.totalChicks || 0}`, 14, 32);

    // Summary Metrics Table
    const totalSales = records.sales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
    const totalFeed = records.feed.reduce((acc, f) => acc + Number(f.cost || 0), 0);
    const totalMed = records.medicine.reduce((acc, m) => acc + Number(m.cost || 0), 0);
    const totalExp = records.expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const chickCost = (Number(batch.totalChicks || 0) * Number(batch.costPerChick || 0));
    const totalCost = chickCost + totalFeed + totalMed + totalExp;
    const netProfit = totalSales - totalCost;
    const totalMort = records.mortality.reduce((acc, m) => acc + Number(m.count || 0), 0);

    const summaryRows = [
      ['Total Sales (Revenue)', `BDT ${totalSales.toLocaleString()}`],
      ['Chick / Seed Cost', `BDT ${chickCost.toLocaleString()}`],
      ['Total Feed Cost', `BDT ${totalFeed.toLocaleString()}`],
      ['Total Medicine & Vaccine Cost', `BDT ${totalMed.toLocaleString()}`],
      ['Other Farm Expenses', `BDT ${totalExp.toLocaleString()}`],
      ['Total Production Cost', `BDT ${totalCost.toLocaleString()}`],
      ['Net Profit / (Loss)', `BDT ${netProfit.toLocaleString()}`],
      ['Total Mortality', `${totalMort} birds (${batch.totalChicks > 0 ? ((totalMort / batch.totalChicks) * 100).toFixed(1) : 0}%)`],
    ];

    (doc as any).autoTable({
      startY: 38,
      head: [['Metric / Financial Account', 'Amount / Value']],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [22, 101, 52] },
      styles: { fontSize: 9 }
    });

    // Sales Table
    const salesData = records.sales.slice(0, 10).map(s => [
      s.date || '',
      s.productName || s.category || 'Sales',
      s.totalWeightKg ? `${s.totalWeightKg} kg` : `${s.quantity || ''} pcs`,
      `BDT ${Number(s.totalAmount || 0).toLocaleString()}`,
      s.buyerName || 'N/A'
    ]);

    if (salesData.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('Sales Summary', 14, finalY);

      (doc as any).autoTable({
        startY: finalY + 3,
        head: [['Date', 'Item', 'Qty / Weight', 'Total', 'Buyer']],
        body: salesData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 }
      });
    }

    doc.save(`${batch.batchName || 'batch'}_Summary_Report.pdf`);
    toast.success('ব্যাচের পিডিএফ রিপোর্ট ডাউনলোড হয়েছে!');
  } catch (e) {
    console.error('PDF export error:', e);
    toast.error('পিডিএফ ডাউনলোড করা সম্ভব হয়নি');
  }
}

/**
 * Automatically purges batches completed > 15 days ago along with their cascaded records.
 * Returns the count of deleted batches.
 */
export async function purgeExpiredCompletedBatches(
  userId: string,
  isDemoUser: boolean
): Promise<number> {
  const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let purgedCount = 0;

  try {
    if (isDemoUser) {
      const batches = demoStore.getBatches();
      for (const b of batches) {
        if (b.status === 'completed' || (b as any).isCompleted) {
          const compTime = new Date(b.completedAt || (b as any).endDate || (b as any).updatedAt || b.startDate).getTime();
          if (now - compTime >= FIFTEEN_DAYS_MS) {
            demoStore.deleteBatch(b.id);
            purgedCount++;
          }
        }
      }
      return purgedCount;
    }

    // Firestore Production mode
    const batchesSnap = await fastGetDocs(
      query(collection(db, 'batches'), where('userId', '==', userId))
    );

    const expiredBatches: any[] = [];
    batchesSnap.docs.forEach(docSnap => {
      const b = { id: docSnap.id, ...docSnap.data() } as any;
      if (b.status === 'completed' || b.isCompleted) {
        const compTime = new Date(b.completedAt || b.endDate || b.updatedAt || b.startDate).getTime();
        if (now - compTime >= FIFTEEN_DAYS_MS) {
          expiredBatches.push(b);
        }
      }
    });

    for (const b of expiredBatches) {
      const targetBatchName = (b.batchName || '').trim();
      const collectionsToClean = ['sales', 'feed_records', 'expenses', 'medicine', 'medicine_records', 'mortality'];
      const relatedSourceIds = new Set<string>();
      const relatedDueIds = new Set<string>();
      const subDocsToDelete: any[] = [];

      // 1. Gather all sub-records
      for (const colName of collectionsToClean) {
        const subSnap = await fastGetDocs(
          query(collection(db, colName), where('userId', '==', userId), where('batchId', '==', b.id))
        );
        subSnap.docs.forEach(d => {
          subDocsToDelete.push(d.ref);
          relatedSourceIds.add(d.id);
          const data = d.data();
          if (data?.dueRecordId) {
            relatedDueIds.add(data.dueRecordId);
          }
        });
      }

      // 2. Cascade delete linked dues
      try {
        const duesSnap = await fastGetDocs(
          query(collection(db, 'dues'), where('userId', '==', userId))
        );
        duesSnap.docs.forEach(dueDoc => {
          const dueData = dueDoc.data();
          const dueId = dueDoc.id;
          let shouldDelete = false;

          if (dueData.batchId && dueData.batchId === b.id) {
            shouldDelete = true;
          } else if (relatedDueIds.has(dueId)) {
            shouldDelete = true;
          } else if (dueData.sourceId && relatedSourceIds.has(dueData.sourceId)) {
            shouldDelete = true;
          } else if (targetBatchName && dueData.batchName && dueData.batchName.trim().toLowerCase() === targetBatchName.toLowerCase()) {
            shouldDelete = true;
          } else if (targetBatchName && targetBatchName.length >= 2 && dueData.details) {
            const dText = dueData.details.toLowerCase();
            const bNameLower = targetBatchName.toLowerCase();
            if (
              dText.startsWith(bNameLower) ||
              dText.includes(`${bNameLower} -`) ||
              dText.includes(`${bNameLower} (`) ||
              dText.includes(`${bNameLower} এর`) ||
              (targetBatchName.length >= 3 && dText.includes(bNameLower) && ['sale', 'expense', 'feed', 'medicine'].includes(dueData.sourceType))
            ) {
              shouldDelete = true;
            }
          }

          if (shouldDelete) {
            subDocsToDelete.push(dueDoc.ref);
          }
        });
      } catch (e) {
        console.warn('purge dues error:', e);
      }

      // 3. Delete all sub-records and dues
      if (subDocsToDelete.length > 0) {
        await Promise.all(subDocsToDelete.map(ref => offlineSafeDocWrite(deleteDoc(ref))));
      }

      // 4. Delete batch document
      const batchRef = doc(db, 'batches', b.id);
      await offlineSafeDocWrite(deleteDoc(batchRef));
      purgedCount++;
    }

    return purgedCount;
  } catch (err) {
    console.warn('purgeExpiredCompletedBatches error:', err);
    return purgedCount;
  }
}

