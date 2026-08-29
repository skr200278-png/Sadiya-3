import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, fastGetDocs } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { 
  BarChart3, 
  TrendingDown, 
  TrendingUp, 
  AlertCircle, 
  FileSpreadsheet, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ArrowDownRight, 
  ArrowUpRight,
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { demoStore } from '../utils/demoStore';

interface SaleItem {
  id: string;
  category?: string;
  productName?: string;
  totalAmount: number;
  quantity?: number;
  totalWeightKg?: number;
  amountPaid?: number;
  buyerName?: string;
  buyerPhone?: string;
  date?: string;
  notes?: string;
}

interface ExpenseItem {
  id: string;
  category?: string;
  amount: number;
  personName?: string;
  vendorName?: string;
  details?: string;
  description?: string;
  date?: string;
}

interface FeedItem {
  id: string;
  feedType?: string;
  quantityBags?: number;
  cost: number;
  date?: string;
}

interface MedicineItem {
  id: string;
  medicineType?: string;
  medicineName?: string;
  cost: number;
  date?: string;
}

export default function Reports() {
  const { currentUser, isDemoUser } = useAuth();
  const { t, language } = useLanguage();
  const { hasAccess, openSubscriptionModal } = useSystemConfig();
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Active view tab ('all' | 'income' | 'expense')
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');

  // Show detailed itemized logs toggles
  const [showItemizedSales, setShowItemizedSales] = useState(false);
  const [showItemizedExpenses, setShowItemizedExpenses] = useState(false);

  // Raw fetched data
  const [salesList, setSalesList] = useState<SaleItem[]>([]);
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [feedList, setFeedList] = useState<FeedItem[]>([]);
  const [medicineList, setMedicineList] = useState<MedicineItem[]>([]);
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
      if (batches.length > 0) setSelectedBatchId(batches[0].id);
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
        const exp = demoStore.getExpenses(batchId) as ExpenseItem[];
        setExpensesList(exp || []);

        const sales = demoStore.getSales(batchId) as SaleItem[];
        setSalesList(sales || []);

        const feeds = demoStore.getFeedRecords(batchId) as FeedItem[];
        setFeedList(feeds || []);

        const meds = demoStore.getMedicineRecords(batchId) as MedicineItem[];
        setMedicineList(meds || []);

        let tMort = 0;
        demoStore.getMortalityRecords(batchId).forEach(m => tMort += Number(m.count || 0));
        setTotalMortality(tMort);
        return;
      }

      // Fetch Expenses
      const expQ = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
      const expSnap = await fastGetDocs(expQ);
      const fetchedExp = expSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseItem));
      setExpensesList(fetchedExp);

      // Fetch Sales
      const salesQ = query(collection(db, 'sales'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
      const salesSnap = await fastGetDocs(salesQ);
      const fetchedSales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleItem));
      setSalesList(fetchedSales);

      // Fetch Feed Cost
      const feedQ = query(collection(db, 'feed_records'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
      const feedSnap = await fastGetDocs(feedQ);
      const fetchedFeeds = feedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedItem));
      setFeedList(fetchedFeeds);

      // Fetch Medicine Cost
      const medQ = query(collection(db, 'medicine_records'), where('userId', '==', currentUser.uid), where('batchId', '==', batchId));
      const medSnap = await fastGetDocs(medQ);
      const fetchedMeds = medSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicineItem));
      setMedicineList(fetchedMeds);

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

  const selectedBatch = activeBatches.find(b => b.id === selectedBatchId);
  const originalChicksTotalCost = selectedBatch ? (Number(selectedBatch.totalChicks || 0) * Number(selectedBatch.costPerChick || 0)) : 0;

  // Financial Computations
  const totalSales = useMemo(() => {
    return salesList.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
  }, [salesList]);

  const totalFeedCost = useMemo(() => {
    return feedList.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  }, [feedList]);

  const totalMedicineCost = useMemo(() => {
    return medicineList.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  }, [medicineList]);

  const totalExpenses = useMemo(() => {
    return expensesList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expensesList]);

  const totalCost = totalExpenses + totalFeedCost + totalMedicineCost;
  const grandTotalCost = totalCost + originalChicksTotalCost;
  const finalNetProfit = totalSales - grandTotalCost;

  const profitMarginPercent = totalSales > 0 ? ((finalNetProfit / totalSales) * 100).toFixed(1) : '0';
  const roiPercent = grandTotalCost > 0 ? ((finalNetProfit / grandTotalCost) * 100).toFixed(1) : '0';

  // Structured Income Categories
  const incomeCategories = useMemo(() => {
    const categoriesMap: { [key: string]: { 
      key: string; 
      labelBn: string; 
      labelEn: string; 
      icon: string; 
      amount: number; 
      count: number; 
      weightKg: number; 
      quantity: number;
      unitBn: string;
      unitEn: string;
    } } = {
      chicken: {
        key: 'chicken',
        labelBn: 'মুরগি / পাখি বিক্রয়',
        labelEn: 'Birds & Poultry Sales',
        icon: '🐔',
        amount: 0,
        count: 0,
        weightKg: 0,
        quantity: 0,
        unitBn: 'কেজি/টি',
        unitEn: 'kg/pcs'
      },
      egg: {
        key: 'egg',
        labelBn: 'ডিম বিক্রয়',
        labelEn: 'Egg Sales',
        icon: '🥚',
        amount: 0,
        count: 0,
        weightKg: 0,
        quantity: 0,
        unitBn: 'টি/হালি',
        unitEn: 'pcs'
      },
      milk: {
        key: 'milk',
        labelBn: 'দুধ বিক্রয়',
        labelEn: 'Milk Sales',
        icon: '🥛',
        amount: 0,
        count: 0,
        weightKg: 0,
        quantity: 0,
        unitBn: 'লিটার',
        unitEn: 'ltr'
      },
      manure: {
        key: 'manure',
        labelBn: 'সার / লিটার বিক্রয়',
        labelEn: 'Manure & Litter Sales',
        icon: '💩',
        amount: 0,
        count: 0,
        weightKg: 0,
        quantity: 0,
        unitBn: 'বস্তা/ট্রাক',
        unitEn: 'bags'
      },
      cattle: {
        key: 'cattle',
        labelBn: 'গরু / পশু বিক্রয়',
        labelEn: 'Cattle & Livestock Sales',
        icon: '🐂',
        amount: 0,
        count: 0,
        weightKg: 0,
        quantity: 0,
        unitBn: 'টি',
        unitEn: 'heads'
      },
      fish: {
        key: 'fish',
        labelBn: 'মাছ বিক্রয়',
        labelEn: 'Fish Sales',
        icon: '🐟',
        amount: 0,
        count: 0,
        weightKg: 0,
        quantity: 0,
        unitBn: 'কেজি',
        unitEn: 'kg'
      },
      chicks: {
        key: 'chicks',
        labelBn: 'বাচ্চা / ছানা বিক্রয়',
        labelEn: 'Chicks & Offspring Sales',
        icon: '🐣',
        amount: 0,
        count: 0,
        weightKg: 0,
        quantity: 0,
        unitBn: 'টি',
        unitEn: 'chicks'
      },
      other: {
        key: 'other',
        labelBn: 'অন্যান্য বিক্রয় ও আয়',
        labelEn: 'Other Sales & Income',
        icon: '✨',
        amount: 0,
        count: 0,
        weightKg: 0,
        quantity: 0,
        unitBn: 'আইটেম',
        unitEn: 'items'
      }
    };

    salesList.forEach(sale => {
      const amt = Number(sale.totalAmount) || 0;
      const cat = (sale.category || '').toLowerCase();
      const pName = (sale.productName || '').toLowerCase();

      let targetKey = 'other';
      if (cat === 'chicken' || cat === 'poultry' || cat === 'ব্রয়লার' || cat === 'সোনালী' || pName.includes('মুরগি') || pName.includes('ব্রয়লার') || pName.includes('পাখি') || pName.includes('হাঁস')) {
        targetKey = 'chicken';
      } else if (cat === 'egg' || pName.includes('ডিম') || pName.includes('egg')) {
        targetKey = 'egg';
      } else if (cat === 'milk' || pName.includes('দুধ') || pName.includes('milk')) {
        targetKey = 'milk';
      } else if (cat === 'manure' || pName.includes('সার') || pName.includes('লিটার') || pName.includes('বিষ্ঠা') || pName.includes('গোবর')) {
        targetKey = 'manure';
      } else if (cat === 'cattle' || cat === 'animal' || pName.includes('গরু') || pName.includes('ষাঁড়') || pName.includes('ছাগল') || pName.includes('ভেড়া')) {
        targetKey = 'cattle';
      } else if (cat === 'fish' || pName.includes('মাছ') || pName.includes('fish')) {
        targetKey = 'fish';
      } else if (cat === 'chicks' || pName.includes('বাচ্চা') || pName.includes('ছানা')) {
        targetKey = 'chicks';
      }

      categoriesMap[targetKey].amount += amt;
      categoriesMap[targetKey].count += 1;
      if (sale.totalWeightKg) categoriesMap[targetKey].weightKg += Number(sale.totalWeightKg) || 0;
      if (sale.quantity) categoriesMap[targetKey].quantity += Number(sale.quantity) || 0;
    });

    const activeCats = Object.values(categoriesMap).filter(c => c.amount > 0 || c.count > 0);
    return activeCats.sort((a, b) => b.amount - a.amount);
  }, [salesList]);

  // Structured Expenses Categories
  const expenseCategories = useMemo(() => {
    const catMap: { [key: string]: { label: string; amount: number; icon: string; count: number } } = {};
    
    expensesList.forEach(exp => {
      const cat = exp.category || 'অন্যান্য';
      if (!catMap[cat]) {
        let icon = '⚡';
        if (cat.includes('বিদ্যুৎ') || cat.includes('জেনারেটর')) icon = '⚡';
        else if (cat.includes('শ্রমিক') || cat.includes('লেবার')) icon = '👥';
        else if (cat.includes('গাড়ি') || cat.includes('ভাড়া') || cat.includes('যাতায়াত') || cat.includes('পরিবহন')) icon = '🚚';
        else if (cat.includes('ডাক্তার') || cat.includes('ভিজিট') || cat.includes('পরামর্শ')) icon = '🩺';
        else if (cat.includes('তুষ') || cat.includes('লিটার')) icon = '🌾';
        else icon = '📝';

        catMap[cat] = { label: cat, amount: 0, icon, count: 0 };
      }
      catMap[cat].amount += Number(exp.amount) || 0;
      catMap[cat].count += 1;
    });

    return Object.values(catMap).sort((a, b) => b.amount - a.amount);
  }, [expensesList]);

  const generateFullBackupCSV = async () => {
    if (!currentUser) return;

    if (!hasAccess('reportsExportFree')) {
      openSubscriptionModal(
        language === 'bn' ? 'এক্সেল ও ব্যাকআপ রিপোর্ট ডাউনলোড' : 'Excel & Backup Export',
        language === 'bn' ? 'সম্পূর্ণ খামারের এক্সেল ব্যাকআপ ও বিস্তারিত রিপোর্ট ডাউনলোডের জন্য সরাসরি অ্যাডমিনের সাথে যোগাযোগ করে সক্রিয় করুন।' : 'To export full farm Excel backups and reports, please contact the admin for activation.'
      );
      return;
    }

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
          'Quantity / পরিমাণ': `${f.quantityBags || ''} বস্তা`,
          'Total Amount / মোট (৳)': f.cost || 0,
          'Paid / জমা (৳)': f.amountPaid || f.cost || 0,
          'Customer / Supplier': f.personName || 'N/A',
          'Phone': f.personPhone || ''
        });
      });

      expRows.forEach(e => {
        masterData.push({
          'Section / মডিউল': 'অন্যান্য খরচ (Expense)',
          'Date / তারিখ': e.date,
          'Batch / ব্যাচ': activeBatches.find(b => b.id === e.batchId)?.batchName || 'N/A',
          'Details / বিবরণ': `${e.category || 'Expense'}: ${e.details || e.description || ''}`,
          'Quantity / পরিমাণ': '1',
          'Total Amount / মোট (৳)': e.amount || 0,
          'Paid / জমা (৳)': e.amountPaid || e.amount || 0,
          'Customer / Supplier': e.personName || e.vendorName || 'N/A',
          'Phone': e.vendorPhone || ''
        });
      });

      medRows.forEach(m => {
        masterData.push({
          'Section / মডিউল': 'ওষুধ/ভ্যাকসিন (Medicine)',
          'Date / তারিখ': m.date,
          'Batch / ব্যাচ': activeBatches.find(b => b.id === m.batchId)?.batchName || 'N/A',
          'Details / বিবরণ': `${m.medicineType || 'Med'}: ${m.medicineName || ''}`,
          'Quantity / পরিমাণ': '1',
          'Total Amount / মোট (৳)': m.cost || 0,
          'Paid / জমা (৳)': m.amountPaid || m.cost || 0,
          'Customer / Supplier': m.personName || 'N/A',
          'Phone': m.personPhone || ''
        });
      });

      dueRows.forEach(d => {
        masterData.push({
          'Section / মডিউল': 'বকেয়া/পাওনা (Dues)',
          'Date / তারিখ': d.date || d.recordDate || '',
          'Batch / ব্যাচ': 'সকল খামার',
          'Details / বিবরণ': `${d.type === 'receivable' ? 'ক্রেতার বাকি (পাবো)' : 'দোকানের বাকি (দেব)'} - ${d.details || ''}`,
          'Quantity / পরিমাণ': '1',
          'Total Amount / মোট (৳)': d.amount || 0,
          'Paid / জমা (৳)': d.totalPaid || 0,
          'Customer / Supplier': d.personName || 'N/A',
          'Phone': d.phone || ''
        });
      });

      mortRows.forEach(m => {
        masterData.push({
          'Section / মডিউল': 'মৃত্যু (Mortality)',
          'Date / তারিখ': m.date,
          'Batch / ব্যাচ': activeBatches.find(b => b.id === m.batchId)?.batchName || 'N/A',
          'Details / বিবরণ': `কারণ: ${m.cause || 'অজ্ঞাত'}`,
          'Quantity / পরিমাণ': `${m.count || 0} টি`,
          'Total Amount / মোট (৳)': 0,
          'Paid / জমা (৳)': 0,
          'Customer / Supplier': 'খামার অভ্যন্তরীণ',
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

    if (!hasAccess('reportsExportFree')) {
      openSubscriptionModal(
        language === 'bn' ? 'পিডিএফ রিপোর্ট এক্সপোর্ট' : 'PDF Report Export',
        language === 'bn' ? 'ব্যাচ ও খামারের বিস্তারিত পিডিএফ রিপোর্ট ডাউনলোডের জন্য সরাসরি অ্যাডমিনের সাথে যোগাযোগ করে সক্রিয় করুন।' : 'To export PDF reports, please contact the admin for activation.'
      );
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text('KhamarPro Farm Batch Financial Report', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    doc.text(`Batch Name: ${selectedBatch.batchName} (${selectedBatch.status === 'active' ? 'Active' : 'Completed'})`, 14, 28);
    doc.text(`Total Stock: ${selectedBatch.totalChicks} | Start Date: ${selectedBatch.startDate || 'N/A'}`, 14, 34);
    doc.text(`Report Generated On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 40);
    
    // Summary Overview Table
    const summaryTable = [
      ['Total Sales Revenue (মোট আয়)', `BDT ${totalSales.toLocaleString()}`],
      ['Grand Total Farm Cost (সর্বমোট ব্যয়)', `BDT ${grandTotalCost.toLocaleString()}`],
      ['NET PROFIT / LOSS (নিট লাভ/লোকসান)', `BDT ${finalNetProfit.toLocaleString()} (${profitMarginPercent}% Margin)`],
      ['Return on Investment (ROI)', `${roiPercent}%`],
      ['Total Mortality Count (মৃত্যু সংখ্যা)', `${totalMortality} (${selectedBatch.totalChicks > 0 ? ((totalMortality / selectedBatch.totalChicks) * 100).toFixed(2) : 0}%)`],
    ];

    (doc as any).autoTable({
      startY: 46,
      head: [['Batch Financial Summary / সারসংক্ষেপ', 'Amount / Value']],
      body: summaryTable,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
      styles: { fontSize: 9 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // Income Breakdown Table
    const incomeTableRows = incomeCategories.length > 0 ? incomeCategories.map(cat => [
      language === 'bn' ? cat.labelBn : cat.labelEn,
      `${cat.quantity > 0 ? `${cat.quantity} pcs ` : ''}${cat.weightKg > 0 ? `${cat.weightKg} kg` : ''}`.trim() || `${cat.count} Sales`,
      `BDT ${cat.amount.toLocaleString()}`,
      totalSales > 0 ? `${((cat.amount / totalSales) * 100).toFixed(1)}%` : '0%'
    ]) : [['No sales recorded yet', '-', 'BDT 0', '0%']];

    incomeTableRows.push(['TOTAL INCOME (সর্বমোট আয়)', `${salesList.length} Total Sales`, `BDT ${totalSales.toLocaleString()}`, '100%']);

    (doc as any).autoTable({
      startY: currentY,
      head: [['Income Category / আয়ের উৎস', 'Details (Qty/Weight)', 'Revenue (BDT ৳)', 'Share (%)']],
      body: incomeTableRows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Expense Breakdown Table
    const costTableRows = [
      ['Initial Stock / Chicks Purchase (বাচ্চা ক্রয়)', `${selectedBatch.totalChicks} units @ ৳${selectedBatch.costPerChick}`, `BDT ${originalChicksTotalCost.toLocaleString()}`, grandTotalCost > 0 ? `${((originalChicksTotalCost / grandTotalCost) * 100).toFixed(1)}%` : '0%'],
      ['Feed Cost (খাবারের খরচ)', `${feedList.length} feed entries`, `BDT ${totalFeedCost.toLocaleString()}`, grandTotalCost > 0 ? `${((totalFeedCost / grandTotalCost) * 100).toFixed(1)}%` : '0%'],
      ['Medicine & Vaccine Cost (ঔষধ খরচ)', `${medicineList.length} med entries`, `BDT ${totalMedicineCost.toLocaleString()}`, grandTotalCost > 0 ? `${((totalMedicineCost / grandTotalCost) * 100).toFixed(1)}%` : '0%'],
      ['Other Farm Expenses (বিদ্যুৎ, লেবার ও বিবিধ)', `${expensesList.length} records`, `BDT ${totalExpenses.toLocaleString()}`, grandTotalCost > 0 ? `${((totalExpenses / grandTotalCost) * 100).toFixed(1)}%` : '0%'],
      ['GRAND TOTAL COST (সর্বমোট ব্যয়)', 'All Expenses Included', `BDT ${grandTotalCost.toLocaleString()}`, '100%']
    ];

    (doc as any).autoTable({
      startY: currentY,
      head: [['Expense Head / খরচের খাত', 'Details', 'Cost (BDT ৳)', 'Share (%)']],
      body: costTableRows,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 8 }
    });

    doc.save(`${selectedBatch.batchName}_Financial_Report.pdf`);
    toast.success(t('reports.pdfStarted'));
  };

  const generateCSV = () => {
    if (!selectedBatch) return;

    if (!hasAccess('reportsExportFree')) {
      openSubscriptionModal(
        language === 'bn' ? 'সিএসভি / এক্সেল রিপোর্ট ডাউনলোড' : 'CSV / Excel Export',
        language === 'bn' ? 'ব্যাচ ও খামারের বিস্তারিত এক্সেল রিপোর্ট ডাউনলোডের জন্য সরাসরি অ্যাডমিনের সাথে যোগাযোগ করে সক্রিয় করুন।' : 'To export batch Excel reports, please contact the admin for activation.'
      );
      return;
    }
    
    const data: any[] = [
      { Section: 'SUMMARY', Category: 'Net Profit / Loss', Amount_BDT: finalNetProfit, Notes: `Margin: ${profitMarginPercent}%, ROI: ${roiPercent}%` },
      { Section: 'SUMMARY', Category: 'Total Sales Revenue', Amount_BDT: totalSales, Notes: `${salesList.length} sales records` },
      { Section: 'SUMMARY', Category: 'Grand Total Cost', Amount_BDT: grandTotalCost, Notes: 'Inc. stock, feed, meds, other' },
      { Section: 'SUMMARY', Category: 'Mortality Count', Amount_BDT: totalMortality, Notes: `${selectedBatch.totalChicks > 0 ? ((totalMortality / selectedBatch.totalChicks) * 100).toFixed(2) : 0}% rate` },
      
      // Income Breakdown
      ...incomeCategories.map(c => ({
        Section: 'INCOME BREAKDOWN (আয়)',
        Category: c.labelBn,
        Amount_BDT: c.amount,
        Notes: `Qty: ${c.quantity}, Wt: ${c.weightKg}kg, Share: ${totalSales > 0 ? ((c.amount / totalSales) * 100).toFixed(1) : 0}%`
      })),

      // Expense Breakdown
      { Section: 'EXPENSE BREAKDOWN (ব্যয়)', Category: 'বাচ্চা/পশু ক্রয় মূল্য (Initial Stock)', Amount_BDT: originalChicksTotalCost, Notes: `${selectedBatch.totalChicks} @ ৳${selectedBatch.costPerChick}` },
      { Section: 'EXPENSE BREAKDOWN (ব্যয়)', Category: 'খাবারের খরচ (Feed Cost)', Amount_BDT: totalFeedCost, Notes: `${feedList.length} entries` },
      { Section: 'EXPENSE BREAKDOWN (ব্যয়)', Category: 'ওষুধ ও ভ্যাকসিনের খরচ (Medicine Cost)', Amount_BDT: totalMedicineCost, Notes: `${medicineList.length} entries` },
      ...expenseCategories.map(e => ({
        Section: 'EXPENSE BREAKDOWN (ব্যয়)',
        Category: `অন্যান্য খরচ: ${e.label}`,
        Amount_BDT: e.amount,
        Notes: `${e.count} entries`
      }))
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

  if (loading && !selectedBatchId) return <div className="p-8 text-center text-slate-500 font-bold">{t('common.loading')}</div>;

  return (
    <div className="space-y-3.5 pb-6 select-none animate-fadeIn">
      {/* Header Bar */}
      <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-850 leading-tight">
                {language === 'bn' ? 'আয়-ব্যয় রিপোর্ট ও বিশ্লেষণ' : t('reports.title')}
              </h2>
              <p className="text-[11px] font-bold text-slate-400">
                {language === 'bn' ? 'ব্যাচভিত্তিক বিস্তারিত আয়ের উৎস ও খরচের পুঙ্খানুপুঙ্খ হিসাব' : 'Batch profit/loss, income sources and cost breakdown'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={generateFullBackupCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 text-xs font-black transition-all shadow-2xs cursor-pointer"
            title={language === 'bn' ? 'সম্পূর্ণ খামারের ডাটা এক্সেল ব্যাকআপ নিন' : 'Download Complete Farm Excel Backup'}
          >
            <FileSpreadsheet size={15} />
            <span>{language === 'bn' ? 'এক্সেল ব্যাকআপ' : 'Excel Backup'}</span>
          </button>

          {selectedBatchId && (
            <div className="flex gap-1.5 shrink-0">
              <button 
                onClick={generateCSV} 
                className="px-2.5 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors" 
                title={language === 'bn' ? 'ব্যাচ এক্সেল ডাউনলোড' : 'Batch Excel CSV'}
              >
                <FileSpreadsheet size={15} className="text-emerald-600" />
                <span>CSV</span>
              </button>
              <button 
                onClick={generatePDF} 
                className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors" 
                title={language === 'bn' ? 'ব্যাচ পিডিএফ ডাউনলোড' : 'Batch PDF Report'}
              >
                <FileText size={15} className="text-rose-600" />
                <span>PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Batch Selector Card */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-600 shrink-0">
            {language === 'bn' ? 'ব্যাচ নির্বাচন করুন:' : t('reports.selectBatch')}:
          </span>
          <select 
            value={selectedBatchId} 
            onChange={(e) => setSelectedBatchId(e.target.value)} 
            className="w-full sm:w-auto flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            {activeBatches.map(b => (
              <option key={b.id} value={b.id}>
                {b.batchName} • {b.status === 'active' ? (language === 'bn' ? 'চলমান' : 'Active') : (language === 'bn' ? 'সম্পন্ন' : 'Completed')} ({b.totalChicks || 0} {language === 'bn' ? 'টি' : 'units'})
              </option>
            ))}
          </select>
        </div>

        {/* View Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-center sm:self-auto w-full sm:w-auto justify-center">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-white text-slate-850 shadow-xs' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {language === 'bn' ? 'সকল তথ্য' : 'All Overview'}
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'income' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-emerald-700 hover:text-emerald-800'
            }`}
          >
            <span>🟢</span>
            <span>{language === 'bn' ? 'আয়ের বিবরণী' : 'Income'}</span>
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'expense' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-rose-700 hover:text-rose-800'
            }`}
          >
            <span>🔴</span>
            <span>{language === 'bn' ? 'খরচের বিবরণী' : 'Expenses'}</span>
          </button>
        </div>
      </div>

      {selectedBatchId && (
        <div className="space-y-3.5">
          
          {/* Main Profit / Loss Showcase Card */}
          <div className={`p-4 sm:p-5 rounded-2xl text-white shadow-xs relative overflow-hidden transition-all ${
            finalNetProfit >= 0 
              ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800' 
              : 'bg-gradient-to-br from-rose-600 via-red-700 to-rose-900'
          }`}>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs flex items-center gap-1">
                    {finalNetProfit >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {finalNetProfit >= 0 ? t('reports.netProfit') : t('reports.netLoss')}
                  </span>
                  <span className="text-[11px] font-bold text-white/80">
                    {selectedBatch?.batchName}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight">
                    ৳ {Math.abs(finalNetProfit).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-white/80">
                    {finalNetProfit >= 0 ? (language === 'bn' ? '(মুনাফা)' : '(Profit)') : (language === 'bn' ? '(লোকসান)' : '(Loss)')}
                  </span>
                </div>
              </div>

              {/* Quick Metrics Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 bg-black/15 p-2.5 rounded-xl backdrop-blur-xs">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-white/70">{t('reports.profitMargin')}</p>
                  <p className="text-sm font-black text-white">{profitMarginPercent}%</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-white/70">{t('reports.roi')}</p>
                  <p className="text-sm font-black text-white">{roiPercent}%</p>
                </div>
              </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Quick Dual Summary Cards (Total Income vs Total Cost) */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => setActiveTab('income')}
              className={`bg-white p-3.5 rounded-2xl shadow-xs border transition-all cursor-pointer hover:border-emerald-300 ${
                activeTab === 'income' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold text-slate-500">{t('reports.totalIncome')}</p>
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                  {salesList.length}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-emerald-600 mt-1">
                ৳ {totalSales.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                {incomeCategories.length} {language === 'bn' ? 'টি আয়ের উৎস' : 'income sources'}
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('expense')}
              className={`bg-white p-3.5 rounded-2xl shadow-xs border transition-all cursor-pointer hover:border-rose-300 ${
                activeTab === 'expense' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold text-slate-500">{t('reports.grandTotalCost')}</p>
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-black">
                  {feedList.length + medicineList.length + expensesList.length + (originalChicksTotalCost > 0 ? 1 : 0)}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-rose-600 mt-1">
                ৳ {grandTotalCost.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                {language === 'bn' ? 'ক্রয়, খাদ্য, ঔষধ ও অন্যান্য' : 'Stock, feed, med & other'}
              </p>
            </div>
          </div>

          {/* MAIN BREAKDOWN SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            
            {/* 🟢 1. আয়ের পুঙ্খানুপুঙ্খ বিবরণী (INCOME BREAKDOWN) */}
            {(activeTab === 'all' || activeTab === 'income') && (
              <div className="bg-white rounded-2xl shadow-xs border border-emerald-100/90 overflow-hidden flex flex-col">
                <div className="bg-emerald-50/70 p-3 border-b border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🟢</span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-emerald-950">
                        {language === 'bn' ? 'আয়ের বিবরণী (বিক্রয় খাতসমূহ)' : t('reports.incomeBreakdown')}
                      </h3>
                      <p className="text-[10px] font-bold text-emerald-700">
                        {language === 'bn' ? 'কী কী বিক্রি করে কত টাকা আয় হয়েছে' : 'Itemized revenue by product/category'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                    ৳ {totalSales.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 space-y-3 flex-1">
                  {incomeCategories.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 font-bold text-xs space-y-1">
                      <ShoppingBag className="mx-auto text-slate-300" size={28} />
                      <p>{t('reports.noSalesYet')}</p>
                    </div>
                  ) : (
                    incomeCategories.map(cat => {
                      const sharePercent = totalSales > 0 ? ((cat.amount / totalSales) * 100).toFixed(1) : '0';
                      return (
                        <div key={cat.key} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{cat.icon}</span>
                              <div className="truncate">
                                <h4 className="text-xs font-black text-slate-800 truncate">
                                  {language === 'bn' ? cat.labelBn : cat.labelEn}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-400">
                                  {cat.count} {language === 'bn' ? 'বার বিক্রয়' : 'sales'}
                                  {cat.weightKg > 0 && ` • ${cat.weightKg} কেজি`}
                                  {cat.quantity > 0 && ` • ${cat.quantity} টি`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-black text-emerald-600">
                                ৳ {cat.amount.toLocaleString()}
                              </p>
                              <span className="text-[10px] font-extrabold text-slate-400">
                                {sharePercent}% {language === 'bn' ? 'অংশ' : 'share'}
                              </span>
                            </div>
                          </div>

                          {/* Progress Share Bar */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.max(Number(sharePercent), 2)}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Total Income Summary Bar */}
                  <div className="border-t border-slate-150 pt-2.5 flex justify-between items-center bg-emerald-50/30 p-2.5 rounded-xl mt-2">
                    <span className="text-xs font-black text-slate-800">
                      {language === 'bn' ? 'সর্বমোট আয় (মোট বিক্রয়)' : 'Total Sales Revenue'}
                    </span>
                    <span className="text-sm font-black text-emerald-700">
                      ৳ {totalSales.toLocaleString()}
                    </span>
                  </div>

                  {/* Toggle Itemized Transactions List */}
                  {salesList.length > 0 && (
                    <div className="pt-1">
                      <button
                        onClick={() => setShowItemizedSales(!showItemizedSales)}
                        className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{showItemizedSales ? t('reports.hideItemized') : t('reports.viewItemized')} ({salesList.length})</span>
                        {showItemizedSales ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {showItemizedSales && (
                        <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin animate-fadeIn">
                          {salesList.map((s, idx) => (
                            <div key={s.id || idx} className="p-2 rounded-lg bg-white border border-slate-200/80 text-[11px] flex justify-between items-center">
                              <div>
                                <p className="font-extrabold text-slate-800">
                                  {s.buyerName ? `👤 ${s.buyerName}` : (s.productName || s.category || 'বিক্রয়')}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {s.date || 'N/A'} {s.totalWeightKg ? `• ${s.totalWeightKg} কেজি` : ''} {s.quantity ? `• ${s.quantity} টি` : ''}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-emerald-600">৳ {Number(s.totalAmount || 0).toLocaleString()}</p>
                                {Number(s.amountPaid || 0) < Number(s.totalAmount || 0) && (
                                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded">
                                    বাকি: ৳ {(Number(s.totalAmount || 0) - Number(s.amountPaid || 0)).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🔴 2. খরচের পুঙ্খানুপুঙ্খ বিবরণী (COST BREAKDOWN) */}
            {(activeTab === 'all' || activeTab === 'expense') && (
              <div className="bg-white rounded-2xl shadow-xs border border-rose-100/90 overflow-hidden flex flex-col">
                <div className="bg-rose-50/70 p-3 border-b border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔴</span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-rose-950">
                        {language === 'bn' ? 'খরচের বিবরণী (ব্যয়ের খাতসমূহ)' : t('reports.expenseBreakdown')}
                      </h3>
                      <p className="text-[10px] font-bold text-rose-700">
                        {language === 'bn' ? 'বাচ্চা, খাদ্য, ঔষধ ও পরিচালন ব্যয়' : 'Itemized expenses by category'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-rose-700 bg-white px-2 py-0.5 rounded-lg border border-rose-200">
                    ৳ {grandTotalCost.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 space-y-3 flex-1">
                  {/* Cost Item 1: Stock Purchase */}
                  <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">🐣</span>
                        <div className="truncate">
                          <h4 className="text-xs font-black text-slate-800 truncate">{t('reports.costBuy')}</h4>
                          <p className="text-[10px] font-bold text-slate-400">
                            {selectedBatch?.totalChicks || 0} টি @ ৳{selectedBatch?.costPerChick || 0}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-800">৳ {originalChicksTotalCost.toLocaleString()}</p>
                        <span className="text-[10px] font-extrabold text-slate-400">
                          {grandTotalCost > 0 ? ((originalChicksTotalCost / grandTotalCost) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${grandTotalCost > 0 ? Math.max((originalChicksTotalCost / grandTotalCost) * 100, 2) : 0}%` }} 
                      />
                    </div>
                  </div>

                  {/* Cost Item 2: Feed */}
                  <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">🌾</span>
                        <div className="truncate">
                          <h4 className="text-xs font-black text-slate-800 truncate">{t('reports.costFeed')}</h4>
                          <p className="text-[10px] font-bold text-slate-400">
                            {feedList.length} {language === 'bn' ? 'টি এন্ট্রি' : 'records'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-800">৳ {totalFeedCost.toLocaleString()}</p>
                        <span className="text-[10px] font-extrabold text-slate-400">
                          {grandTotalCost > 0 ? ((totalFeedCost / grandTotalCost) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${grandTotalCost > 0 ? Math.max((totalFeedCost / grandTotalCost) * 100, 2) : 0}%` }} 
                      />
                    </div>
                  </div>

                  {/* Cost Item 3: Medicine & Vaccine */}
                  <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">💊</span>
                        <div className="truncate">
                          <h4 className="text-xs font-black text-slate-800 truncate">{t('reports.costMedicine')}</h4>
                          <p className="text-[10px] font-bold text-slate-400">
                            {medicineList.length} {language === 'bn' ? 'টি এন্ট্রি' : 'records'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-800">৳ {totalMedicineCost.toLocaleString()}</p>
                        <span className="text-[10px] font-extrabold text-slate-400">
                          {grandTotalCost > 0 ? ((totalMedicineCost / grandTotalCost) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${grandTotalCost > 0 ? Math.max((totalMedicineCost / grandTotalCost) * 100, 2) : 0}%` }} 
                      />
                    </div>
                  </div>

                  {/* Cost Item 4: Other Farm Expenses */}
                  <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">⚡</span>
                        <div className="truncate">
                          <h4 className="text-xs font-black text-slate-800 truncate">{t('reports.costOther')}</h4>
                          <p className="text-[10px] font-bold text-slate-400">
                            {expenseCategories.length > 0 
                              ? expenseCategories.map(c => c.label).slice(0, 2).join(', ') 
                              : (language === 'bn' ? 'বিদ্যুৎ, লেবার ও বিবিধ' : 'Labor, electricity')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-800">৳ {totalExpenses.toLocaleString()}</p>
                        <span className="text-[10px] font-extrabold text-slate-400">
                          {grandTotalCost > 0 ? ((totalExpenses / grandTotalCost) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${grandTotalCost > 0 ? Math.max((totalExpenses / grandTotalCost) * 100, 2) : 0}%` }} 
                      />
                    </div>
                  </div>

                  {/* Grand Total Cost Bar */}
                  <div className="border-t border-slate-150 pt-2.5 flex justify-between items-center bg-rose-50/30 p-2.5 rounded-xl mt-2">
                    <span className="text-xs font-black text-slate-800">
                      {language === 'bn' ? 'সর্বমোট খরচ (ক্রয়সহ)' : t('reports.grandTotalCost')}
                    </span>
                    <span className="text-sm font-black text-rose-700">
                      ৳ {grandTotalCost.toLocaleString()}
                    </span>
                  </div>

                  {/* Toggle Itemized Expenses List */}
                  {expensesList.length > 0 && (
                    <div className="pt-1">
                      <button
                        onClick={() => setShowItemizedExpenses(!showItemizedExpenses)}
                        className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{showItemizedExpenses ? t('reports.hideItemized') : t('reports.viewItemized')} ({expensesList.length})</span>
                        {showItemizedExpenses ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {showItemizedExpenses && (
                        <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin animate-fadeIn">
                          {expensesList.map((e, idx) => (
                            <div key={e.id || idx} className="p-2 rounded-lg bg-white border border-slate-200/80 text-[11px] flex justify-between items-center">
                              <div>
                                <p className="font-extrabold text-slate-800">
                                  {e.category || 'অন্যান্য খরচ'} {e.personName || e.vendorName ? `• ${e.personName || e.vendorName}` : ''}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {e.date || 'N/A'} {e.details || e.description ? `• ${e.details || e.description}` : ''}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-rose-600">৳ {Number(e.amount || 0).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Health & Mortality Summary Card */}
          <div className="bg-amber-50/80 rounded-2xl p-3.5 shadow-xs border border-amber-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs sm:text-sm text-amber-950">{t('reports.healthSummary')}</h4>
                <span className="text-xs font-black text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                  {totalMortality} {language === 'bn' ? 'টি মৃত্যু' : 'dead'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-amber-800 mt-1">
                {t('reports.mortalityRate')}: <strong>
                  {selectedBatch && selectedBatch.totalChicks > 0 
                    ? `${((totalMortality / selectedBatch.totalChicks) * 100).toFixed(2)}%` 
                    : '0%'}
                </strong> 
                {selectedBatch && (
                  <span className="text-amber-700"> • (মোট {selectedBatch.totalChicks} টির মধ্যে {selectedBatch.totalChicks - totalMortality} টি জীবিত)</span>
                )}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
