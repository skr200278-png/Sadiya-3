import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart3, TrendingDown, TrendingUp, AlertCircle, Download, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { demoStore } from '../utils/demoStore';

export default function Reports() {
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Aggregated Data
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalFeedCost, setTotalFeedCost] = useState(0);
  const [totalMedicineCost, setTotalMedicineCost] = useState(0);
  const [totalMortality, setTotalMortality] = useState(0);

  useEffect(() => {
    fetchBatches();
  }, [currentUser, isDemoUser]);

  useEffect(() => {
    if (selectedBatchId) fetchReportData(selectedBatchId);
  }, [selectedBatchId, isDemoUser]);

  const fetchBatches = async () => {
    if (!currentUser) return;
    try {
      if (isDemoUser) {
        const batches = demoStore.getBatches();
        setActiveBatches(batches);
        if (batches.length > 0) setSelectedBatchId(batches[0].id);
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'batches'), where('userId', '==', currentUser.uid));
      const snap = await fastGetDocs(q);
      const batches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveBatches(batches);
      if(batches.length > 0) setSelectedBatchId(batches[0].id);
      setLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'batches');
    }
  };

  const fetchReportData = async (batchId: string) => {
    setLoading(true);
    if (!currentUser) return;
    try {
      if (isDemoUser) {
        let tExpenses = 0;
        demoStore.getExpenses(batchId).forEach(e => tExpenses += Number(e.amount || 0));
        setTotalExpenses(tExpenses);

        let tSales = 0;
        demoStore.getSales(batchId).forEach(s => tSales += Number(s.totalAmount || 0));
        setTotalSales(tSales);

        let tFeed = 0;
        demoStore.getFeedRecords(batchId).forEach(f => tFeed += Number(f.cost || 0));
        setTotalFeedCost(tFeed);

        let tMed = 0;
        demoStore.getMedicineRecords(batchId).forEach(m => tMed += Number(m.cost || 0));
        setTotalMedicineCost(tMed);

        let tMort = 0;
        demoStore.getMortalityRecords(batchId).forEach(m => tMort += Number(m.count || 0));
        setTotalMortality(tMort);
        return;
      }

      // Fetch Expenses
      const expQ = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
      const expSnap = await fastGetDocs(expQ);
      let tExpenses = 0;
      expSnap.forEach(doc => tExpenses += (Number(doc.data().amount) || 0));
      setTotalExpenses(tExpenses);

      // Fetch Sales
      const salesQ = query(collection(db, 'sales'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
      const salesSnap = await fastGetDocs(salesQ);
      let tSales = 0;
      salesSnap.forEach(doc => tSales += (Number(doc.data().totalAmount) || 0));
      setTotalSales(tSales);

      // Fetch Feed Cost
      const feedQ = query(collection(db, 'feed_records'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
      const feedSnap = await fastGetDocs(feedQ);
      let tFeed = 0;
      feedSnap.forEach(doc => tFeed += (Number(doc.data().cost) || 0));
      setTotalFeedCost(tFeed);

      // Fetch Medicine Cost
      const medQ = query(collection(db, 'medicine_records'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
      const medSnap = await fastGetDocs(medQ);
      let tMed = 0;
      medSnap.forEach(doc => tMed += (Number(doc.data().cost) || 0));
      setTotalMedicineCost(tMed);

      // Fetch Mortality
      const mortQ = query(collection(db, 'mortality'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
      const mortSnap = await fastGetDocs(mortQ);
      let tMort = 0;
      mortSnap.forEach(doc => tMort += (Number(doc.data().count) || 0));
      setTotalMortality(tMort);
      
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedBatchId) return <div>{t('common.loading')}</div>;

  const selectedBatch = activeBatches.find(b => b.id === selectedBatchId);
  const originalChicksTotalCost = selectedBatch ? (selectedBatch.totalChicks * selectedBatch.costPerChick) : 0;
  const totalCost = totalExpenses + totalFeedCost + totalMedicineCost;
  const grandTotalCost = totalCost + originalChicksTotalCost;
  const finalNetProfit = totalSales - grandTotalCost;

  const generateFullBackupCSV = async () => {
    if (!currentUser) return;
    toast.loading(t('reports.csvStarted') || 'Exporting Excel/CSV...');

    try {
      let salesRows: any[] = [];
      let feedRows: any[] = [];
      let expRows: any[] = [];
      let medRows: any[] = [];
      let mortRows: any[] = [];
      let dueRows: any[] = [];

      if (isDemoUser) {
        salesRows = demoStore.getSales();
        feedRows = demoStore.getFeedRecords();
        expRows = demoStore.getExpenses();
        medRows = demoStore.getMedicineRecords();
        mortRows = demoStore.getMortalityRecords();
        dueRows = demoStore.getDues();
      } else {
        const [sSnap, fSnap, eSnap, mSnap, mortSnap, dSnap] = await Promise.all([
          fastGetDocs(query(collection(db, 'sales'), where('userId', '==', currentUser.uid))),
          fastGetDocs(query(collection(db, 'feed_records'), where('userId', '==', currentUser.uid))),
          fastGetDocs(query(collection(db, 'expenses'), where('userId', '==', currentUser.uid))),
          fastGetDocs(query(collection(db, 'medicine_records'), where('userId', '==', currentUser.uid))),
          fastGetDocs(query(collection(db, 'mortality'), where('userId', '==', currentUser.uid))),
          fastGetDocs(query(collection(db, 'dues'), where('userId', '==', currentUser.uid))),
        ]);

        salesRows = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        feedRows = fSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        expRows = eSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        medRows = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        mortRows = mortSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        dueRows = dSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      // Format Master Consolidated Rows
      const masterData: any[] = [];

      salesRows.forEach(s => {
        masterData.push({
          'Section / মডিউল': 'বিক্রয় (Sales)',
          'Date / তারিখ': s.date,
          'Batch / ব্যাচ': activeBatches.find(b => b.id === s.batchId)?.batchName || 'N/A',
          'Details / বিবরণ': `${s.category || 'Sale'} - ${s.productName || s.buyerName || ''}`,
          'Quantity / পরিমাণ': s.quantity || s.totalWeightKg || 1,
          'Total Amount / মোট (৳)': s.totalAmount || 0,
          'Paid / জমা (৳)': s.amountPaid || s.totalAmount || 0,
          'Customer / Supplier': s.buyerName || 'N/A',
          'Phone': s.buyerPhone || ''
        });
      });

      feedRows.forEach(f => {
        masterData.push({
          'Section / মডিউল': 'খাবার (Feed)',
          'Date / তারিখ': f.date,
          'Batch / ব্যাচ': activeBatches.find(b => b.id === f.batchId)?.batchName || 'N/A',
          'Details / বিবরণ': f.feedType || 'Feed',
          'Quantity / পরিমাণ': `${f.quantityBags} বস্তা`,
          'Total Amount / মোট (৳)': f.cost || 0,
          'Paid / জমা (৳)': f.amountPaid || f.cost || 0,
          'Customer / Supplier': f.personName || 'N/A',
          'Phone': f.personPhone || ''
        });
      });

      expRows.forEach(e => {
        masterData.push({
          'Section / মডিউল': 'খরচ (Expenses)',
          'Date / তারিখ': e.date,
          'Batch / ব্যাচ': activeBatches.find(b => b.id === e.batchId)?.batchName || 'N/A',
          'Details / বিবরণ': `${e.category} - ${e.details || ''}`,
          'Quantity / পরিমাণ': 1,
          'Total Amount / মোট (৳)': e.amount || 0,
          'Paid / জমা (৳)': e.amountPaid || e.amount || 0,
          'Customer / Supplier': e.personName || 'N/A',
          'Phone': e.personPhone || ''
        });
      });

      medRows.forEach(m => {
        masterData.push({
          'Section / মডিউল': 'ওষুধ (Medicine)',
          'Date / তারিখ': m.date,
          'Batch / ব্যাচ': activeBatches.find(b => b.id === m.batchId)?.batchName || 'N/A',
          'Details / বিবরণ': `${m.medicineName} (${m.type || 'medicine'})`,
          'Quantity / পরিমাণ': 1,
          'Total Amount / মোট (৳)': m.cost || 0,
          'Paid / জমা (৳)': m.amountPaid || m.cost || 0,
          'Customer / Supplier': m.personName || 'N/A',
          'Phone': m.personPhone || ''
        });
      });

      mortRows.forEach(mo => {
        masterData.push({
          'Section / মডিউল': 'মৃত্যু (Mortality)',
          'Date / তারিখ': mo.date,
          'Batch / ব্যাচ': activeBatches.find(b => b.id === mo.batchId)?.batchName || 'N/A',
          'Details / বিবরণ': mo.cause || 'Mortality',
          'Quantity / পরিমাণ': `${mo.count} টি`,
          'Total Amount / মোট (৳)': 0,
          'Paid / জমা (৳)': 0,
          'Customer / Supplier': '',
          'Phone': ''
        });
      });

      const csv = Papa.unparse(masterData);
      const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `KhamarPro_Full_Farm_Backup_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.dismiss();
      toast.success(language === 'bn' ? 'সম্পূর্ণ খামারের এক্সেল ব্যাকআপ ডাউনলোড সম্পন্ন!' : 'Full farm data export completed!');
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    }
  };

  const generatePDF = () => {
    if (!selectedBatch) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('KhamarPro Farm Financial Report', 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Batch Name: ${selectedBatch.batchName}`, 14, 30);
    doc.text(`Status: ${selectedBatch.status === 'active' ? 'Active' : 'Completed'}`, 14, 36);
    doc.text(`Total Chicks/Stock: ${selectedBatch.totalChicks}`, 14, 42);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 48);
    
    const tableData = [
      ['Initial Purchase Cost (বাচ্চা ক্রয়)', `${originalChicksTotalCost}`],
      ['Total Feed Cost (খাবারের খরচ)', `${totalFeedCost}`],
      ['Total Medicine & Vaccine Cost (ঔষধ খরচ)', `${totalMedicineCost}`],
      ['Other Farm Expenses (অন্যান্য ব্যয়)', `${totalExpenses}`],
      ['GRAND TOTAL COST (সর্বমোট খরচ)', `${grandTotalCost}`],
      ['TOTAL SALES REVENUE (মোট আয়)', `${totalSales}`],
      ['NET PROFIT / LOSS (নিট লাভ/ক্ষতি)', `${finalNetProfit}`],
      ['Total Mortality Count (মৃত্যু সংখ্যা)', `${totalMortality}`],
    ];

    (doc as any).autoTable({
      startY: 55,
      head: [['Financial Metric / হিসাব বিবরণী', 'Amount (BDT ৳) / Count']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }
    });

    doc.save(`${selectedBatch.batchName}_Report.pdf`);
    toast.success(t('reports.pdfStarted'));
  };

  const generateCSV = () => {
    if (!selectedBatch) return;
    
    const data = [
      { Metric: 'Initial Purchase Cost', Value: originalChicksTotalCost },
      { Metric: 'Feed Cost', Value: totalFeedCost },
      { Metric: 'Medicine Cost', Value: totalMedicineCost },
      { Metric: 'Other Expenses', Value: totalExpenses },
      { Metric: 'Total Cost', Value: grandTotalCost },
      { Metric: 'Total Sales', Value: totalSales },
      { Metric: 'Net Profit', Value: finalNetProfit },
      { Metric: 'Mortality', Value: totalMortality },
    ];

    const csv = Papa.unparse(data);
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedBatch.batchName}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('reports.csvStarted'));
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-800">{t('reports.title')}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={generateFullBackupCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title={language === 'bn' ? 'সম্পূর্ণ খামারের ডাটা এক্সেল ফাইল হিসেবে ব্যাকআপ নিন' : 'Download Complete Farm Excel Backup'}
          >
            <FileSpreadsheet size={16} />
            <span>{language === 'bn' ? 'এক্সেল ব্যাকআপ (Excel)' : 'All Data Backup'}</span>
          </button>

          {selectedBatchId && (
            <div className="flex gap-1.5">
              <button 
                onClick={generateCSV} 
                className="p-2 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 cursor-pointer" 
                title={language === 'bn' ? 'ব্যাচ এক্সেল ডাউনলোড' : 'Batch Excel CSV'}
              >
                <FileSpreadsheet size={18} />
              </button>
              <button 
                onClick={generatePDF} 
                className="p-2 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 cursor-pointer" 
                title={language === 'bn' ? 'ব্যাচ পিডিএফ ডাউনলোড' : 'Batch PDF Report'}
              >
                <FileText size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border border-indigo-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.selectBatch')}</label>
        <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-medium text-gray-800 bg-gray-50">
          {activeBatches.map(b => (
            <option key={b.id} value={b.id}>
              {b.batchName} ({b.status === 'active' ? (language === 'bn' ? 'চলমান' : 'Active') : (language === 'bn' ? 'সম্পন্ন' : 'Completed')})
            </option>
          ))}
        </select>
      </div>

      {selectedBatchId && (
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl text-white shadow-md ${finalNetProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
            <h3 className="text-white/80 text-sm mb-1 font-medium flex items-center justify-between">
              {finalNetProfit >= 0 ? t('reports.netProfit') : t('reports.netLoss')} 
              {finalNetProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </h3>
            <p className="text-4xl font-bold">৳ {Math.abs(finalNetProfit).toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">{t('reports.totalIncome')}</p>
                <p className="text-lg font-bold text-teal-600">৳ {totalSales.toLocaleString()}</p>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">{t('reports.grandTotalCost')}</p>
                <p className="text-lg font-bold text-red-600">৳ {grandTotalCost.toLocaleString()}</p>
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-gray-50 p-3 border-b border-gray-100 font-bold text-gray-700">
                {t('reports.breakdown')}
             </div>
             <div className="p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-600">{t('reports.costBuy')}</span>
                   <span className="font-semibold text-gray-800">৳ {originalChicksTotalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-600">{t('reports.costFeed')}</span>
                   <span className="font-semibold text-gray-800">৳ {totalFeedCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-600">{t('reports.costMedicine')}</span>
                   <span className="font-semibold text-gray-800">৳ {totalMedicineCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-600">{t('reports.costOther')}</span>
                   <span className="font-semibold text-gray-800">৳ {totalExpenses.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                   <span className="font-bold text-gray-800">{t('reports.grandTotalCost')}</span>
                   <span className="font-bold text-red-600">৳ {grandTotalCost.toLocaleString()}</span>
                </div>
             </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 shadow-sm border border-orange-100 flex items-start gap-3">
            <div className="bg-orange-100 p-2 rounded-full text-orange-600 align-top">
               <AlertCircle size={20} />
            </div>
            <div>
               <h4 className="font-bold text-orange-800">{t('reports.healthSummary')}</h4>
               <p className="text-sm text-orange-700 mt-1">
                 {t('reports.totalMortality')}: <strong>{totalMortality}</strong> 
                 {selectedBatch && selectedBatch.totalChicks > 0 && ` (${((totalMortality / selectedBatch.totalChicks) * 100).toFixed(2)}%)`}
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
