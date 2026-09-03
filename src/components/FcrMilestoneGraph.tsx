import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ChevronRight, 
  Award,
  Zap,
  HelpCircle,
  BarChart2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export type FarmSectorType = 'poultry' | 'cattle' | 'fish';

interface MilestoneData {
  id: string;
  labelBn: string;
  labelEn: string;
  subLabelBn: string;
  subLabelEn: string;
  standardFcr: number;
  standardWeight: number; // in g (poultry/fish) or kg (cattle)
  standardFeed: number; // in g or kg
  actualWeight?: number;
  actualFeed?: number;
  actualFcr?: number;
  tipBn: string;
  tipEn: string;
}

interface FcrMilestoneGraphProps {
  initialSector?: FarmSectorType;
  batchId?: string;
  batchName?: string;
  currentBirdCount?: number;
}

export default function FcrMilestoneGraph({
  initialSector = 'poultry',
  batchId = 'default',
  batchName,
  currentBirdCount = 0
}: FcrMilestoneGraphProps) {
  const { language } = useLanguage();
  const [activeSector, setActiveSector] = useState<FarmSectorType>(initialSector);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');

  // Default benchmarks for Poultry (Broiler Cobb500 / Ross308)
  const defaultPoultryMilestones: MilestoneData[] = [
    {
      id: 'day7',
      labelBn: 'দিন ৭ (১ম সপ্তাহ)',
      labelEn: 'Day 7 (Week 1)',
      subLabelBn: 'ব্রুডিং পর্যায়',
      subLabelEn: 'Brooding Stage',
      standardFcr: 1.02,
      standardWeight: 200, // grams
      standardFeed: 205, // grams
      tipBn: 'প্রথম ৭ দিনে বাচ্চার ওজন প্রাথমিক ওজনের ৪-৫ গুণ (কমপক্ষে ১৯০-২১০ গ্রাম) হওয়া জরুরি। ব্রুডিং তাপমাত্রা ৩২° সে. রাখুন।',
      tipEn: 'Day 7 weight should be 4.5x hatch weight (~200g). Monitor brooding temperature and water intake.'
    },
    {
      id: 'day14',
      labelBn: 'দিন ১৪ (২য় সপ্তাহ)',
      labelEn: 'Day 14 (Week 2)',
      subLabelBn: 'স্টার্টার পর্যায়',
      subLabelEn: 'Starter Stage',
      standardFcr: 1.15,
      standardWeight: 510,
      standardFeed: 585,
      tipBn: 'স্টার্টার ফিড চলছে। পর্যাপ্ত আলো ও ফিডারের সঠিক উচ্চতা নিশ্চিত করুন যাতে খাবার অপচয় না হয়।',
      tipEn: 'Starter feed phase. Maintain proper feeder height to prevent spillage and build strong skeletal frame.'
    },
    {
      id: 'day21',
      labelBn: 'দিন ২১ (৩য় সপ্তাহ)',
      labelEn: 'Day 21 (Week 3)',
      subLabelBn: 'গ্রোয়ার রূপান্তর',
      subLabelEn: 'Grower Transition',
      standardFcr: 1.28,
      standardWeight: 1020,
      standardFeed: 1305,
      tipBn: 'গ্রোয়ারে রূপান্তর। লিটার শুকনো রাখুন। এফসিআর ১.৩২ এর নিচে থাকা অত্যন্ত লাভজনক সংকেত।',
      tipEn: 'Transition to grower feed. Ensure fresh ventilation, dry litter, and check daily weight gain.'
    },
    {
      id: 'day28',
      labelBn: 'দিন ২৮ (৪র্থ সপ্তাহ)',
      labelEn: 'Day 28 (Week 4)',
      subLabelBn: 'দ্রুত মাংস বৃদ্ধি',
      subLabelEn: 'Rapid Gain Phase',
      standardFcr: 1.45,
      standardWeight: 1650,
      standardFeed: 2390,
      tipBn: 'দ্রুত মাংস বৃদ্ধির সময়। এই সময়ে ঠাণ্ডা বা ড্রপের লক্ষণ থাকলে FCR বেড়ে যেতে পারে, বায়োসিকিউরিটি জোরদার করুন।',
      tipEn: 'Peak muscle gain phase. Avoid heat stress, maintain gut health and record exact feed consumption.'
    },
    {
      id: 'day35',
      labelBn: 'দিন ৩৫ (৫ম সপ্তাহ)',
      labelEn: 'Day 35 (Week 5)',
      subLabelBn: 'ফিনিশার ও বাজারজাত',
      subLabelEn: 'Finisher & Market',
      standardFcr: 1.58,
      standardWeight: 2350,
      standardFeed: 3710,
      tipBn: 'বাজারজাতকরণ পর্যায়। চূড়ান্ত এফসিআর ১.৫৫ থেকে ১.৬২ এর মধ্যে থাকলে খামারের লাভ সর্বোচ্চ হবে।',
      tipEn: 'Final market harvest stage. Target cumulative FCR is 1.55 - 1.62 for optimum profit margin.'
    },
    {
      id: 'day42',
      labelBn: 'দিন ৪২ (৬ষ্ঠ সপ্তাহ)',
      labelEn: 'Day 42 (Week 6)',
      subLabelBn: 'ভারী ওজন পর্যায়',
      subLabelEn: 'Heavy Weight Phase',
      standardFcr: 1.72,
      standardWeight: 3050,
      standardFeed: 5240,
      tipBn: 'ভারী ওজনের ক্ষেত্রে ৩৫ দিনের পর এফসিআর কিছুটা বাড়ে, বাজার দর বেশি থাকলে তবেই বেশি দিন রাখা লাভজনক।',
      tipEn: 'Heavy broiler target. FCR increases slightly beyond 35 days; harvest based on market demand.'
    }
  ];

  // Default benchmarks for Cattle (Beef Fattening / Dairy feed conversion)
  const defaultCattleMilestones: MilestoneData[] = [
    {
      id: 'month1',
      labelBn: 'মাস ১ (৩০ দিন)',
      labelEn: 'Month 1 (Day 30)',
      subLabelBn: 'খামারে অভিযোজন ও ডিওয়ার্মিং',
      subLabelEn: 'Adaptation & Deworming',
      standardFcr: 6.0,
      standardWeight: 26, // kg live gain
      standardFeed: 156, // kg dry feed
      tipBn: 'প্রথম মাসে কৃমিনাশক ও লিভার টনিক দিয়ে খাবারের হজম ক্ষমতা বাড়ান। কাঁচা ঘাস ও দানাদার রেশিও ৬০:৪০ রাখুন।',
      tipEn: 'Deworming & rumen adaptation phase. Target 800g-900g daily live weight gain with balanced TMR.'
    },
    {
      id: 'month2',
      labelBn: 'মাস ২ (৬০ দিন)',
      labelEn: 'Month 2 (Day 60)',
      subLabelBn: 'সুষম মাংস বৃদ্ধি',
      subLabelEn: 'Balanced Muscle Gain',
      standardFcr: 6.6,
      standardWeight: 58,
      standardFeed: 383,
      tipBn: 'দৈনিক ওজন বৃদ্ধি ৯০০-১০০০ গ্রাম হওয়া উচিত। সাইলেজ বা দানাদার খাবারে প্রোটিন ১৬-১৭% নিশ্চিত করুন।',
      tipEn: 'Active growth phase. Maintain 16% crude protein, clean water ad-libitum, and track feed intake.'
    },
    {
      id: 'month3',
      labelBn: 'মাস ৩ (৯০ দিন)',
      labelEn: 'Month 3 (Day 90)',
      subLabelBn: 'পিক গ্রোথ পর্যায়',
      subLabelEn: 'Peak Growth Phase',
      standardFcr: 7.2,
      standardWeight: 90,
      standardFeed: 648,
      tipBn: 'ষাঁড়ের ওজন বৃদ্ধির তুঙ্গে থাকা পর্যায়। এফসিআর ৭.২ এর নিচে থাকলে খাদ্য ব্যবস্থাপনা অত্যন্ত দক্ষ।',
      tipEn: 'Peak fattening phase. Cattle FCR below 7.2 indicates exceptional feed conversion efficiency.'
    },
    {
      id: 'month4',
      labelBn: 'মাস ৪ (১২০ দিন)',
      labelEn: 'Month 4 (Day 120)',
      subLabelBn: 'ফিনিশিং পর্যায়',
      subLabelEn: 'Finishing Phase',
      standardFcr: 7.8,
      standardWeight: 118,
      standardFeed: 920,
      tipBn: 'মাংসের ফিনিশিং ও চর্বির সঠিক বণ্টন। এনার্জি ফিড (ভুট্টা ভাঙা/মোলাসেস) পরিমাণমতো রাখুন।',
      tipEn: 'Finishing phase. Energy supplementation with quality roughage keeps body frame solid.'
    },
    {
      id: 'month5',
      labelBn: 'মাস ৫ (১৫০ দিন)',
      labelEn: 'Month 5 (Day 150)',
      subLabelBn: 'কোরবানি / বাজারজাতকরণ',
      subLabelEn: 'Market Ready Phase',
      standardFcr: 8.4,
      standardWeight: 142,
      standardFeed: 1192,
      tipBn: 'পূর্ণাঙ্গ বিক্রয় উপযোগী। এই সময়ে বাড়তি দিন রাখলে খাবারে খরচ বাড়ে, তাই কাঙ্ক্ষিত ওজনে বিক্রি করাই লাভজনক।',
      tipEn: 'Market harvest ready. Sell at target live weight to prevent unnecessary high feed maintenance cost.'
    }
  ];

  // Default benchmarks for Fish (Aquaculture / Tilapia, Pangash, Carp)
  const defaultFishMilestones: MilestoneData[] = [
    {
      id: 'fish_m1',
      labelBn: 'মাস ১ (৩০ দিন)',
      labelEn: 'Month 1 (Day 30)',
      subLabelBn: 'পোনা নার্সারি ও ফিডিং',
      subLabelEn: 'Nursery & Floating Feed',
      standardFcr: 1.15,
      standardWeight: 80, // grams avg fish
      standardFeed: 92, // grams per fish
      tipBn: 'উচ্চ প্রোটিন (৩২-৩৫%) নার্সারি ফিড দিন। পুকুরের পানির রঙ হালকা সবুজ ও অক্সিজেন স্বাভাবিক রাখুন।',
      tipEn: 'High protein (32-35%) nursery feed. Maintain dissolved oxygen and plankton bloom in pond.'
    },
    {
      id: 'fish_m2',
      labelBn: 'মাস ২ (৬০ দিন)',
      labelEn: 'Month 2 (Day 60)',
      subLabelBn: 'প্রাথমিক গ্রোয়ার পর্যায়',
      subLabelEn: 'Early Grower Phase',
      standardFcr: 1.28,
      standardWeight: 220,
      standardFeed: 282,
      tipBn: 'ভাসমান ফিড ব্যবহার করলে খাবার অপচয় হয় না। মাছ ২০-২৫ মিনিটে সম্পূর্ণ খাবার শেষ করছে কিনা তা পর্যবেক্ষণ করুন।',
      tipEn: 'Feed should be consumed within 20-25 mins. Adjust feed rate to body weight (3-4%).'
    },
    {
      id: 'fish_m3',
      labelBn: 'মাস ৩ (৯০ দিন)',
      labelEn: 'Month 3 (Day 90)',
      subLabelBn: 'মূল দৈহিক বৃদ্ধি',
      subLabelEn: 'Core Gain Phase',
      standardFcr: 1.42,
      standardWeight: 420,
      standardFeed: 596,
      tipBn: 'মাছের বৃদ্ধি দ্রুত হওয়ার সময়। প্রতি ১৫ দিন পর স্যাম্পলিং করে গড় ওজন মাপুন এবং সেই অনুযায়ী ফিড ট্রের খাবার সমন্বয় করুন।',
      tipEn: 'Sample fish every 15 days to adjust daily ration. Keep pond water clean to minimize FCR.'
    },
    {
      id: 'fish_m4',
      labelBn: 'মাস ৪ (১২০ দিন)',
      labelEn: 'Month 4 (Day 120)',
      subLabelBn: 'ফিনিশার ফিডিং',
      subLabelEn: 'Finisher Phase',
      standardFcr: 1.56,
      standardWeight: 670,
      standardFeed: 1045,
      tipBn: '২৮% প্রোটিন ফিনিশার ফিড। খাবার অতিরিক্ত দিলে তলদেশে গ্যাস ও অ্যামোনিয়া বাড়ে, যা FCR নষ্ট করে।',
      tipEn: 'Do not overfeed. Excessive feed causes pond bottom toxicity, elevating FCR drastically.'
    },
    {
      id: 'fish_m5',
      labelBn: 'মাস ৫ (১৫০ দিন)',
      labelEn: 'Month 5 (Day 150)',
      subLabelBn: 'আহরণ ও বাজারজাতকরণ',
      subLabelEn: 'Harvest Phase',
      standardFcr: 1.70,
      standardWeight: 950,
      standardFeed: 1615,
      tipBn: 'বাজারজাতকরণের চূড়ান্ত ওজন। সার্বিক এফসিআর ১.৪ থেকে ১.৬৫ এর মধ্যে থাকলে মাছ চাষে দারুণ মুনাফা নিশ্চিত।',
      tipEn: 'Harvest ready. Total FCR between 1.40 - 1.65 guarantees healthy aquaculture returns.'
    }
  ];

  // Storage key for user entered milestones
  const storageKey = `fcr_graph_records_${batchId}_${activeSector}`;

  // Milestone list state
  const [milestones, setMilestones] = useState<MilestoneData[]>(() => {
    const saved = localStorage.getItem(`fcr_graph_records_${batchId}_${initialSector}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    if (initialSector === 'cattle') return defaultCattleMilestones;
    if (initialSector === 'fish') return defaultFishMilestones;
    return defaultPoultryMilestones;
  });

  // Edit inputs state for currently selected milestone
  const [inputWeight, setInputWeight] = useState<string>('');
  const [inputFeed, setInputFeed] = useState<string>('');

  // Sync sector change
  useEffect(() => {
    if (initialSector && initialSector !== activeSector) {
      setActiveSector(initialSector);
    }
  }, [initialSector]);

  // Load appropriate sector milestones when sector changes
  useEffect(() => {
    const key = `fcr_graph_records_${batchId}_${activeSector}`;
    const saved = localStorage.getItem(key);
    let defaults = defaultPoultryMilestones;
    if (activeSector === 'cattle') defaults = defaultCattleMilestones;
    if (activeSector === 'fish') defaults = defaultFishMilestones;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMilestones(parsed);
        setSelectedMilestoneId(parsed[0]?.id || '');
        return;
      } catch (e) {
        // fallback
      }
    }
    setMilestones(defaults);
    setSelectedMilestoneId(defaults[0]?.id || '');
  }, [activeSector, batchId]);

  // Save changes to localStorage whenever milestones update
  const saveMilestones = (updated: MilestoneData[]) => {
    setMilestones(updated);
    try {
      localStorage.setItem(`fcr_graph_records_${batchId}_${activeSector}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const selectedMilestone = useMemo(() => {
    return milestones.find(m => m.id === selectedMilestoneId) || milestones[0];
  }, [milestones, selectedMilestoneId]);

  // When selected milestone changes, populate form inputs
  useEffect(() => {
    if (selectedMilestone) {
      setInputWeight(selectedMilestone.actualWeight ? selectedMilestone.actualWeight.toString() : '');
      setInputFeed(selectedMilestone.actualFeed ? selectedMilestone.actualFeed.toString() : '');
    }
  }, [selectedMilestoneId]);

  // Handle Save for selected milestone
  const handleSaveMilestoneData = () => {
    if (!selectedMilestone) return;
    const w = parseFloat(inputWeight) || 0;
    const f = parseFloat(inputFeed) || 0;
    const calculated = w > 0 && f > 0 ? (f / w) : undefined;

    const updated = milestones.map(m => {
      if (m.id === selectedMilestone.id) {
        return {
          ...m,
          actualWeight: w > 0 ? w : undefined,
          actualFeed: f > 0 ? f : undefined,
          actualFcr: calculated ? Number(calculated.toFixed(3)) : undefined
        };
      }
      return m;
    });

    saveMilestones(updated);
  };

  // Clear or reset single milestone
  const handleClearCurrentMilestone = () => {
    if (!selectedMilestone) return;
    const updated = milestones.map(m => {
      if (m.id === selectedMilestone.id) {
        const { actualWeight, actualFeed, actualFcr, ...rest } = m;
        return rest as MilestoneData;
      }
      return m;
    });
    setInputWeight('');
    setInputFeed('');
    saveMilestones(updated);
  };

  // Auto-simulate sample actual curve (Good / realistic flock data)
  const handleAutoSimulate = () => {
    const updated = milestones.map((m, idx) => {
      // Simulate realistic fluctuation (+/- 2-4% from standard)
      const variance = (idx % 2 === 0) ? 0.98 : 1.03;
      const actWeight = Math.round(m.standardWeight * variance);
      const actFeed = Math.round(m.standardFeed * (variance > 1 ? 1.05 : 0.97));
      const actFcr = Number((actFeed / actWeight).toFixed(3));
      return {
        ...m,
        actualWeight: actWeight,
        actualFeed: actFeed,
        actualFcr: actFcr
      };
    });
    saveMilestones(updated);
  };

  // Reset all to blank
  const handleResetAll = () => {
    let defaults = defaultPoultryMilestones;
    if (activeSector === 'cattle') defaults = defaultCattleMilestones;
    if (activeSector === 'fish') defaults = defaultFishMilestones;
    saveMilestones(defaults);
    setInputWeight('');
    setInputFeed('');
  };

  // SVG Chart Geometry calculations
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingX = 45;
  const paddingY = 30;

  // Max and min FCR across standard and actual
  const allFcrValues = useMemo(() => {
    const vals: number[] = [];
    milestones.forEach(m => {
      vals.push(m.standardFcr);
      if (m.actualFcr) vals.push(m.actualFcr);
    });
    return vals;
  }, [milestones]);

  const minFcr = useMemo(() => {
    const min = Math.min(...allFcrValues, 1.0);
    return Math.max(0, Math.floor(min * 0.85 * 10) / 10);
  }, [allFcrValues]);

  const maxFcr = useMemo(() => {
    const max = Math.max(...allFcrValues, activeSector === 'cattle' ? 9.5 : 2.0);
    return Math.ceil(max * 1.15 * 10) / 10;
  }, [allFcrValues, activeSector]);

  // Coordinate mapper
  const getX = (index: number) => {
    const step = (chartWidth - paddingX * 2) / (milestones.length - 1);
    return paddingX + index * step;
  };

  const getY = (val: number) => {
    const range = maxFcr - minFcr || 1;
    const normalized = (val - minFcr) / range;
    return chartHeight - paddingY - normalized * (chartHeight - paddingY * 2);
  };

  // Build SVG Path for Standard Curve
  const standardPoints = milestones.map((m, idx) => ({ x: getX(idx), y: getY(m.standardFcr) }));
  const standardPathD = standardPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Build SVG Path for Actual Curve (only for points with data)
  const actualPointsWithIndex = milestones
    .map((m, idx) => (m.actualFcr ? { x: getX(idx), y: getY(m.actualFcr), data: m, idx } : null))
    .filter(Boolean) as { x: number; y: number; data: MilestoneData; idx: number }[];

  const actualPathD = actualPointsWithIndex.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Unit text based on sector
  const weightUnit = activeSector === 'cattle' ? (language === 'bn' ? 'কেজি' : 'KG') : (language === 'bn' ? 'গ্রাম' : 'Grams');
  const feedUnit = (activeSector === 'cattle' || activeSector === 'fish') 
    ? (language === 'bn' ? 'কেজি' : 'KG') 
    : (language === 'bn' ? 'গ্রাম' : 'Grams');

  // Overall status of the flock based on latest recorded FCR
  const latestRecorded = useMemo(() => {
    const withData = [...milestones].reverse().find(m => m.actualFcr !== undefined);
    return withData;
  }, [milestones]);

  const overallEvaluation = useMemo(() => {
    if (!latestRecorded || !latestRecorded.actualFcr) return null;
    const diff = latestRecorded.actualFcr - latestRecorded.standardFcr;
    const percent = ((diff / latestRecorded.standardFcr) * 100).toFixed(1);

    if (diff <= 0) {
      return {
        level: 'excellent',
        badge: 'bg-emerald-500 text-slate-950 font-black',
        textColor: 'text-emerald-400',
        title: language === 'bn' ? '🏆 অসাধারণ এফসিআর পারফরম্যান্স!' : '🏆 Excellent FCR Performance!',
        text: language === 'bn' 
          ? `আপনার এফসিআর (${latestRecorded.actualFcr}) আদর্শ মানের (${latestRecorded.standardFcr}) চেয়ে ${Math.abs(Number(percent))}% ভালো! খাবার রূপান্তর চমৎকার হচ্ছে।`
          : `Actual FCR (${latestRecorded.actualFcr}) is ${Math.abs(Number(percent))}% better than benchmark. Feed efficiency is outstanding.`
      };
    } else if (diff <= (activeSector === 'cattle' ? 0.6 : 0.12)) {
      return {
        level: 'good',
        badge: 'bg-teal-500 text-slate-950 font-black',
        textColor: 'text-teal-400',
        title: language === 'bn' ? '🟢 সন্তোষজনক ও স্বাভাবিক এফসিআর' : '🟢 Good & Profitable Range',
        text: language === 'bn' 
          ? `আপনার এফসিআর স্বাভাবিক সীমার মধ্যে রয়েছে। নিয়মিত পানি ও খাবারের পাত্রের পরিচ্ছন্নতা বজায় রাখুন।`
          : `FCR is well within standard profitable limits. Keep maintaining feed balance.`
      };
    } else {
      return {
        level: 'warning',
        badge: 'bg-rose-500 text-white font-black',
        textColor: 'text-rose-400',
        title: language === 'bn' ? '⚠️ সতর্কতা: এফসিআর বেশি / খাদ্যের অপচয়' : '⚠️ Warning: Elevated FCR / Feed Loss',
        text: language === 'bn' 
          ? `আদর্শ মানের চেয়ে FCR প্রায় ${percent}% বেশি। খাবার অপচয় হচ্ছে কিনা, পেটের স্বাস্থ্য বা লিটার/পানির মান পরীক্ষা করুন।`
          : `FCR is ${percent}% higher than benchmark. Check for feed wastage, gut health or environmental stress.`
      };
    }
  }, [latestRecorded, language, activeSector]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl text-slate-100 space-y-4">
      
      {/* Header with Title & Sector Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <BarChart2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                  <span>{language === 'bn' ? '📉 FCR ট্র্যাকিং ও প্রবৃদ্ধি গ্রাফ' : 'FCR Lifecycle & Growth Graph'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono">
                    {activeSector === 'poultry' ? 'Day 7 → 35' : activeSector === 'cattle' ? 'Month 1 → 5' : 'Month 1 → 5'}
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'bn' 
                  ? 'খাবারের রূপান্তর ও ওজন বৃদ্ধির তুলনামূলক আদর্শ চার্ট (Actual vs Standard)' 
                  : 'Track actual milestone conversion ratio against standard benchmarks'}
              </p>
            </div>
          </div>
        </div>

        {/* Sector Switcher Pills (Poultry/Chicken, Cattle/Goat, Fish) */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSector('poultry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSector === 'poultry'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🐔</span>
            <span>{language === 'bn' ? 'মুরগী (পাখি)' : 'Chicken / Birds'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSector('cattle')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSector === 'cattle'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🐐</span>
            <span>{language === 'bn' ? 'ছাগল ও পশু' : 'Goat & Cattle'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSector('fish')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSector === 'fish'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🐟</span>
            <span>{language === 'bn' ? 'মাছ' : 'Fish'}</span>
          </button>
        </div>
      </div>

      {/* Legend & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs bg-slate-900/60 px-3 py-2 rounded-2xl border border-slate-800/60">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Standard Benchmark line indicator */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-400" />
            <span className="text-[11px] text-slate-300 font-bold">
              {language === 'bn' ? 'আদর্শ FCR (Standard Curve)' : 'Standard Benchmark'}
            </span>
          </div>

          {/* Actual Farm line indicator */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-amber-400 rounded-full" />
            <span className="text-[11px] text-amber-300 font-bold">
              {language === 'bn' ? 'আপনার খামারের FCR (Actual)' : 'Your Farm FCR'}
            </span>
          </div>
        </div>

        {/* Action buttons: Auto-fill Demo & Clear */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleAutoSimulate}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title={language === 'bn' ? 'নমুনা মান দিয়ে অটো-সিমুলেট করুন' : 'Auto fill realistic demo data'}
          >
            <Sparkles size={12} />
            <span>{language === 'bn' ? 'নমুনা ডেমো' : 'Demo Fill'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetAll}
            className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title={language === 'bn' ? 'সব এন্ট্রি ক্লিয়ার করুন' : 'Reset graph data'}
          >
            <RotateCcw size={11} />
            <span>{language === 'bn' ? 'রিসেট' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* SVG Interactive Dual Curve Graph */}
      <div className="relative bg-slate-900/90 rounded-2xl p-2 sm:p-4 border border-slate-800 overflow-x-auto">
        <div className="min-w-[500px]">
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            className="w-full h-auto overflow-visible"
          >
            <defs>
              {/* Actual curve gradient glow */}
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>

              {/* Standard curve gradient */}
              <linearGradient id="standardGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
              const val = minFcr + (maxFcr - minFcr) * ratio;
              const y = getY(val);
              return (
                <g key={i}>
                  <line 
                    x1={paddingX} 
                    y1={y} 
                    x2={chartWidth - paddingX} 
                    y2={y} 
                    stroke="#334155" 
                    strokeWidth="0.8" 
                    strokeDasharray="3 3" 
                  />
                  <text 
                    x={paddingX - 8} 
                    y={y + 3} 
                    textAnchor="end" 
                    fill="#94a3b8" 
                    fontSize="9" 
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {val.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Standard Curve Area & Line */}
            {standardPathD && (
              <>
                <path
                  d={`${standardPathD} L ${getX(milestones.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`}
                  fill="url(#standardGradient)"
                />
                <path
                  d={standardPathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Actual Curve Area & Line */}
            {actualPathD && actualPointsWithIndex.length > 1 && (
              <>
                <path
                  d={`${actualPathD} L ${actualPointsWithIndex[actualPointsWithIndex.length - 1].x} ${chartHeight - paddingY} L ${actualPointsWithIndex[0].x} ${chartHeight - paddingY} Z`}
                  fill="url(#actualGradient)"
                />
                <path
                  d={actualPathD}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Standard Benchmark Node Points */}
            {milestones.map((m, idx) => {
              const cx = getX(idx);
              const cy = getY(m.standardFcr);
              const isSelected = m.id === selectedMilestoneId;

              return (
                <g key={`std-${m.id}`} className="cursor-pointer" onClick={() => setSelectedMilestoneId(m.id)}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 6 : 4}
                    fill="#10b981"
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  {/* Standard FCR Value Label */}
                  <text
                    x={cx}
                    y={cy - 8}
                    textAnchor="middle"
                    fill="#34d399"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {m.standardFcr.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Actual Node Points (Farmer Input) */}
            {milestones.map((m, idx) => {
              if (m.actualFcr === undefined) return null;
              const cx = getX(idx);
              const cy = getY(m.actualFcr);
              const isSelected = m.id === selectedMilestoneId;

              const isBetter = m.actualFcr <= m.standardFcr;

              return (
                <g key={`act-${m.id}`} className="cursor-pointer" onClick={() => setSelectedMilestoneId(m.id)}>
                  {/* Outer glowing ring if selected */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="10"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2"
                      opacity="0.6"
                      className="animate-ping"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 7 : 5.5}
                    fill={isBetter ? '#fbbf24' : '#f43f5e'}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {/* Actual Value Bubble */}
                  <rect
                    x={cx - 16}
                    y={cy + 7}
                    width="32"
                    height="14"
                    rx="4"
                    fill="#0f172a"
                    stroke={isBetter ? '#fbbf24' : '#f43f5e'}
                    strokeWidth="1"
                  />
                  <text
                    x={cx}
                    y={cy + 17}
                    textAnchor="middle"
                    fill={isBetter ? '#fef08a' : '#fda4af'}
                    fontSize="8.5"
                    fontWeight="black"
                    fontFamily="monospace"
                  >
                    {m.actualFcr.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Milestone Labels at bottom */}
            {milestones.map((m, idx) => {
              const cx = getX(idx);
              const isSelected = m.id === selectedMilestoneId;
              const hasActual = m.actualFcr !== undefined;

              return (
                <g key={`lbl-${m.id}`} className="cursor-pointer" onClick={() => setSelectedMilestoneId(m.id)}>
                  {/* Vertical indicator line for selected */}
                  {isSelected && (
                    <line
                      x1={cx}
                      y1={paddingY}
                      x2={cx}
                      y2={chartHeight - paddingY}
                      stroke="#fbbf24"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.5"
                    />
                  )}
                  <text
                    x={cx}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fill={isSelected ? '#fbbf24' : hasActual ? '#ffffff' : '#64748b'}
                    fontSize={isSelected ? '11' : '10'}
                    fontWeight={isSelected ? '900' : '700'}
                  >
                    {language === 'bn' ? m.labelBn.split(' ')[0] + ' ' + (m.labelBn.split(' ')[1] || '') : m.labelEn.split(' ')[0] + ' ' + (m.labelEn.split(' ')[1] || '')}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Overall Performance Banner if farmer entered data */}
      {overallEvaluation && (
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800 text-amber-400 shrink-0 mt-0.5">
            <Award size={20} />
          </div>
          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className={`text-xs font-black ${overallEvaluation.textColor}`}>
                {overallEvaluation.title}
              </h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${overallEvaluation.badge}`}>
                {latestRecorded?.labelBn}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {overallEvaluation.text}
            </p>
          </div>
        </div>
      )}

      {/* Interactive Milestone Selector Buttons */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {milestones.map((m) => {
          const isSelected = m.id === selectedMilestoneId;
          const hasData = m.actualFcr !== undefined;
          const isEfficient = hasData && m.actualFcr! <= m.standardFcr;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMilestoneId(m.id)}
              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500'
                  : hasData
                  ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <span className={`block text-[11px] font-black truncate ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                  {language === 'bn' ? m.labelBn : m.labelEn}
                </span>
                <span className="block text-[9px] text-slate-400 truncate">
                  {language === 'bn' ? m.subLabelBn : m.subLabelEn}
                </span>
              </div>

              <div className="mt-2 pt-1 border-t border-slate-800/60 flex items-baseline justify-between gap-1">
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold">
                    {language === 'bn' ? 'আদর্শ' : 'Std'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {m.standardFcr.toFixed(2)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold">
                    {language === 'bn' ? 'বাস্তব' : 'Act'}
                  </span>
                  <span className={`text-xs font-mono font-black ${
                    hasData 
                      ? (isEfficient ? 'text-amber-300' : 'text-rose-400') 
                      : 'text-slate-600'
                  }`}>
                    {hasData ? m.actualFcr!.toFixed(2) : '-'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Milestone Detail & Quick Input Card */}
      {selectedMilestone && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h4 className="text-xs sm:text-sm font-black text-white">
                  {language === 'bn' ? selectedMilestone.labelBn : selectedMilestone.labelEn} — {language === 'bn' ? 'পরিমাপ ও এন্ট্রি' : 'Measurement Entry'}
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'bn' 
                  ? `আদর্শ লক্ষ্য: গড় ওজন ~${selectedMilestone.standardWeight} ${weightUnit} | মোট খাবার ~${selectedMilestone.standardFeed} ${feedUnit} (FCR: ${selectedMilestone.standardFcr})`
                  : `Benchmark target: Avg Weight ~${selectedMilestone.standardWeight} ${weightUnit} | Feed ~${selectedMilestone.standardFeed} ${feedUnit} (FCR: ${selectedMilestone.standardFcr})`}
              </p>
            </div>

            {selectedMilestone.actualFcr !== undefined && (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-xl text-right">
                  <span className="text-[9px] uppercase text-slate-400 font-bold block">
                    {language === 'bn' ? 'অর্জিত FCR' : 'Calculated FCR'}
                  </span>
                  <span className={`text-base font-black font-mono ${
                    selectedMilestone.actualFcr <= selectedMilestone.standardFcr ? 'text-amber-300' : 'text-rose-400'
                  }`}>
                    {selectedMilestone.actualFcr.toFixed(3)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearCurrentMilestone}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-colors"
                  title="Clear this milestone"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Form Inputs for Selected Milestone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {language === 'bn' ? `গড় ওজন (${weightUnit}):` : `Average Weight (${weightUnit}):`}
              </label>
              <input
                type="number"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                placeholder={`e.g. ${selectedMilestone.standardWeight}`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {language === 'bn' 
                  ? (activeSector === 'poultry' ? `মাথা পিছু মোট খাবার (${feedUnit}):` : `মোট খাবার (${feedUnit}):`)
                  : `Cumulative Feed (${feedUnit}):`}
              </label>
              <input
                type="number"
                value={inputFeed}
                onChange={(e) => setInputFeed(e.target.value)}
                placeholder={`e.g. ${selectedMilestone.standardFeed}`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSaveMilestoneData}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} className="stroke-[2.5]" />
                <span>{language === 'bn' ? 'হিসাব সেভ ও গ্রাফে দেখাও' : 'Update & Plot on Graph'}</span>
              </button>
            </div>
          </div>

          {/* Stage Specific Practical Tip */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
            <Info size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 mr-1">
                {language === 'bn' ? '💡 খামার ব্যবস্থাপনা টিপস:' : '💡 Management Tip:'}
              </span>
              <span>{language === 'bn' ? selectedMilestone.tipBn : selectedMilestone.tipEn}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
