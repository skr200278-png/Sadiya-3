import React, { useState } from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Thermometer, 
  Droplets, 
  Layers, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Info,
  Sliders,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  BROILER_SOP_SCHEDULE, 
  CROP_FILL_MILESTONES, 
  FEEDER_SLOT_GUIDES, 
  getSopForDay, 
  DailySopItem 
} from '../utils/broilerSopData';

interface BroilerDailySopCardProps {
  batchName?: string;
  batchId?: string;
  batchAgeDays?: number;
  isBn?: boolean;
  onClose?: () => void;
}

export const BroilerDailySopCard: React.FC<BroilerDailySopCardProps> = ({
  batchName = 'Broiler Batch',
  batchId = 'demo-batch',
  batchAgeDays = 7,
  isBn = true,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'crop_brood' | 'full_chart'>('today');
  const [selectedDay, setSelectedDay] = useState<number>(() => Math.max(0, Math.min(49, Math.round(batchAgeDays))));
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | 'all'>('all');
  
  // Local task completion persistence
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`sop_completed_${batchId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleTask = (day: number, taskIndex: number) => {
    const key = `day_${day}_task_${taskIndex}`;
    setCompletedTasks(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(`sop_completed_${batchId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Storage error', e);
      }
      return updated;
    });
  };

  const currentSop = getSopForDay(selectedDay);
  const isActualBatchToday = Math.round(batchAgeDays) === selectedDay;

  const filteredDays = selectedWeekFilter === 'all' 
    ? BROILER_SOP_SCHEDULE 
    : BROILER_SOP_SCHEDULE.filter(s => s.week === selectedWeekFilter);

  // Count done tasks for current viewed day
  const tasksForDay = isBn ? currentSop.tasksBn : currentSop.tasks;
  const doneCount = tasksForDay.filter((_, idx) => completedTasks[`day_${selectedDay}_task_${idx}`]).length;
  const allDone = tasksForDay.length > 0 && doneCount === tasksForDay.length;

  return (
    <div className="bg-white rounded-3xl border border-emerald-200/80 shadow-xl overflow-hidden animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
              <ClipboardList size={22} className="text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wide">
                  {isBn ? 'আন্তর্জাতিক এসওপি গাইড' : 'Standard SOP Guide'}
                </span>
                <span className="text-xs text-emerald-200 font-bold">
                  {batchName} ({isBn ? `বর্তমান বয়স: ${batchAgeDays} দিন` : `Flock Age: ${batchAgeDays} Days`})
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {isBn ? 'দৈনিক ফার্ম কাজের শিডিউল ও স্ট্যান্ডার্ড চার্ট' : 'Daily Farm Work Schedule & SOP Milestones'}
              </h2>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-4 bg-emerald-950/40 p-1 rounded-2xl border border-white/10 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'today'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-emerald-100 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar size={13} />
            <span>{isBn ? `দিনের কাজ (দিন ${selectedDay})` : `Daily Work (Day ${selectedDay})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crop_brood')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'crop_brood'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-emerald-100 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders size={13} />
            <span>{isBn ? 'ব্রুডিং ও ক্রপ ফিল অডিট' : 'Brooding & Crop Fill SOP'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('full_chart')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'full_chart'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-emerald-100 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={13} />
            <span>{isBn ? '১-৪৯ দিনের পূর্ণাঙ্গ চার্ট' : 'Full 1-49 Day Master Chart'}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5">
        {/* TAB 1: TODAY'S WORK SCHEDULE */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* Day Selector & Environmental Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDay(prev => Math.max(0, prev - 1))}
                  disabled={selectedDay === 0}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                  title={isBn ? 'আগের দিন' : 'Previous Day'}
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="px-3.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-center shadow-2xs">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 block">
                    {isBn ? `সপ্তাহ ${currentSop.week}` : `Week ${currentSop.week}`}
                  </span>
                  <span className="text-base font-black text-slate-900">
                    {isBn ? `দিন ${selectedDay}` : `Day ${selectedDay}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDay(prev => Math.min(49, prev + 1))}
                  disabled={selectedDay === 49}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                  title={isBn ? 'পরের দিন' : 'Next Day'}
                >
                  <ChevronRight size={16} />
                </button>

                {isActualBatchToday ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1 border border-emerald-200">
                    <Sparkles size={12} />
                    {isBn ? 'আজকের বয়স' : 'Current Age'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedDay(Math.max(0, Math.min(49, Math.round(batchAgeDays))))}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                  >
                    {isBn ? 'আজকের দিনে ফিরুন' : 'Back to Today'}
                  </button>
                )}
              </div>

              {/* Targets Summary Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-extrabold text-rose-900">
                  <Thermometer size={14} className="text-rose-600" />
                  <span>{currentSop.tempFMin}-{currentSop.tempFMax}°F</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-extrabold text-blue-900">
                  <Droplets size={14} className="text-blue-600" />
                  <span>{currentSop.relHumidityMin}-{currentSop.relHumidityMax}% RH</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-extrabold text-amber-900">
                  <span>🎯 {isBn ? 'দৈনিক খাদ্য:' : 'Daily Feed:'}</span>
                  <span className="font-black text-slate-900">{currentSop.feedDailyGm}g</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-extrabold text-emerald-900">
                  <span>⚖️ {isBn ? 'টার্গেট ওজন:' : 'Target Wt:'}</span>
                  <span className="font-black text-slate-900">{currentSop.bodyWeightGm}g</span>
                </div>
              </div>
            </div>

            {/* Checklist of Tasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>
                      {isBn ? `দিন ${selectedDay}-এর নির্দিষ্ট কাজের তালিকা (SOP Tasks)` : `Day ${selectedDay} Standard Tasks`}
                    </span>
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-150 text-slate-700">
                    {doneCount} / {tasksForDay.length} {isBn ? 'সম্পন্ন' : 'Done'}
                  </span>
                </div>

                {doneCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      tasksForDay.forEach((_, idx) => {
                        const key = `day_${selectedDay}_task_${idx}`;
                        setCompletedTasks(prev => {
                          const c = { ...prev };
                          delete c[key];
                          return c;
                        });
                      });
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>{isBn ? 'রিসেট' : 'Reset'}</span>
                  </button>
                )}
              </div>

              {allDone && tasksForDay.length > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-fadeIn">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>
                    {isBn 
                      ? 'অভিনন্দন! আজকের সকল নির্ধারিত এসওপি কাজ সফলভাবে সম্পন্ন হয়েছে।' 
                      : 'Excellent! All SOP tasks for today have been completed.'}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {tasksForDay.map((task, idx) => {
                  const key = `day_${selectedDay}_task_${idx}`;
                  const isDone = !!completedTasks[key];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleTask(selectedDay, idx)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isDone 
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-850 shadow-2xs hover:border-emerald-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isDone && <Check size={14} className="stroke-[3]" />}
                      </div>

                      <div className="flex-1 text-xs sm:text-sm font-bold leading-snug">
                        <span className={isDone ? 'line-through text-slate-400 font-normal' : ''}>
                          {task}
                        </span>
                      </div>

                      {currentSop.isCritical && idx === 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black shrink-0">
                          {isBn ? 'জরুরি' : 'Critical'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Practical Advice Banner */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-950 text-xs leading-relaxed">
              <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-amber-900">
                  💡 {isBn ? 'মাঠপর্যায়ের জরুরি এসওপি নিয়মাবলী:' : 'Field SOP Rules:'}
                </p>
                <p className="mt-0.5 text-[11px] text-amber-900/90 font-medium">
                  {isBn 
                    ? 'প্রতিটি কাজের পাশে টিক দিন যাতে কর্মচারীরা কোনো ধাপ ভুলে না যান। পানি পাইপলাইন ফ্লাশিং (H2O2) ও জীবাণুনাশক স্প্রে দিনে দিনে সম্পন্ন করলে ব্রয়লারের মৃত্যুর হার ১%-এর নিচে নেমে আসে।' 
                    : 'Check each item as staff finishes it. Regular water pipeline H2O2 flushing and scheduled disinfectant spraying keeps mortality below 1%.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BROODING & CROP FILL SOP */}
        {activeTab === 'crop_brood' && (
          <div className="space-y-6">
            {/* Crop Fill Audit (Image 2) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <Sparkles size={16} className="text-amber-500" />
                    <span>{isBn ? '১ম দিনের ক্রপ ফিল অডিট (Crop Fill Score Audit)' : 'Day 1 Crop Fill Milestones'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {isBn 
                      ? 'বাচ্চা আসার পর পেটে খাবার ও পানি ঠিকমতো পৌঁছাল কিনা তা যাচাইয়ের আন্তর্জাতিক মাপকাঠি' 
                      : 'International standard for evaluating early feed and water intake in chicks'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {CROP_FILL_MILESTONES.map((m, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-linear-to-b from-slate-50 to-white border border-slate-200 rounded-2xl flex flex-col justify-between space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {isBn ? m.dayLabelBn : m.dayLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                        {m.targetPercent}% {isBn ? 'টার্গেট' : 'Target'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full bg-slate-150 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.targetPercent}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-tight">
                        {isBn ? m.descriptionBn : m.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feeder Slot Adjustment Guide (Image 1 & 2 Diagram) */}
            <div className="space-y-3">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <Sliders size={16} className="text-indigo-600" />
                  <span>{isBn ? 'ফিডারের স্লট ও উচ্চতা নিয়ন্ত্রণ (Feeder Slots & Height Guide)' : 'Feeder Slots & Height Regulation'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isBn 
                    ? 'বয়স বাড়ার সাথে সাথে ফিডারের উচ্চতা ও তলার খাদ্যের পরিমাণ কীভাবে পরিবর্তন করবেন' 
                    : 'How to adjust feeder pan bottom fill and hanging height by bird age'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {FEEDER_SLOT_GUIDES.map((slot, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5 hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-900">
                        {isBn ? slot.titleBn : slot.title}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {isBn ? slot.ageDaysRangeBn : slot.ageDaysRange}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                        <span className="text-base font-black text-indigo-700">{slot.panFillPercent}%</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{isBn ? 'খাদ্য' : 'Feed'}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-snug">
                        {isBn ? slot.instructionBn : slot.instruction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drinking Nipple Height & Brooding Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                <h4 className="font-black text-blue-950 text-xs flex items-center gap-1.5">
                  <Droplets size={15} className="text-blue-600" />
                  <span>{isBn ? 'নিপল ড্রিংকার ও পানি নিয়ন্ত্রণ গাইড' : 'Nipple Drinker Height SOP'}</span>
                </h4>
                <ul className="text-xs text-blue-900 space-y-1.5 leading-snug font-medium">
                  <li>• <strong>{isBn ? '১-৩ দিন:' : 'Days 1-3:'}</strong> {isBn ? 'বাচ্চার চোখের সমান উচ্চতায় রাখুন।' : 'At chick eye level.'}</li>
                  <li>• <strong>{isBn ? '৪-৭ দিন:' : 'Days 4-7:'}</strong> {isBn ? 'বাচ্চার মাথার ঠিক উপরে রাখুন যাতে সোজা দাঁড়িয়ে খায়।' : 'Slightly above head.'}</li>
                  <li>• <strong>{isBn ? '৮ দিন থেকে বিক্রয়:' : 'Day 8 onwards:'}</strong> {isBn ? 'ঘাড় ৪৫° থেকে ৬০° কোণে ওপরের দিকে প্রসারিত করে পানি পান করবে।' : 'Neck stretched at 45°-60° angle.'}</li>
                  <li>• <strong>{isBn ? '১০ম ও ১৭তম দিন:' : 'Day 10 & 17:'}</strong> {isBn ? '৫% H2O2 দিয়ে পাইপলাইন ফ্লাশিং করুন।' : 'Flush pipeline with 5% H2O2.'}</li>
                </ul>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <h4 className="font-black text-emerald-950 text-xs flex items-center gap-1.5">
                  <Thermometer size={15} className="text-emerald-600" />
                  <span>{isBn ? 'ব্রুডিং চেকলিস্ট (প্রস্তুতি পর্ব)' : 'Brooding Preparation Specs'}</span>
                </h4>
                <ul className="text-xs text-emerald-900 space-y-1.5 leading-snug font-medium">
                  <li>• <strong>{isBn ? 'জায়গা:' : 'Space:'}</strong> {isBn ? 'শেডের মোট আয়তনের ৩৩% জায়গায় ব্রুডিং টেন্ট স্থাপন।' : 'Airtight tent in 33% of shed space.'}</li>
                  <li>• <strong>{isBn ? 'ব্রুডার:' : 'Capacity:'}</strong> {isBn ? 'প্রতি ৩৫০ বাচ্চার জন্য ১টি গোল ব্রুডার।' : 'Round brooder for 350 chicks.'}</li>
                  <li>• <strong>{isBn ? 'আলো ও তাপ:' : 'Lighting & Coal:'}</strong> {isBn ? 'প্রতি ইউনিটে ১০০ ওয়াটের বাল্ব ও ১০০০ বাচ্চার জন্য ৮০ কেজি কয়লা।' : '100W bulb & 80kg coal / 1000 chicks.'}</li>
                  <li>• <strong>{isBn ? 'লিটার দূরত্ব:' : 'Bio-security:'}</strong> {isBn ? 'পুরোনো লিটার শেড থেকে ১০০০ ফুট দূরে ফেলুন।' : 'Old litter stored >1000 ft away.'}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FULL 1-49 DAYS MASTER TABLE */}
        {activeTab === 'full_chart' && (
          <div className="space-y-4">
            {/* Week Filter Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedWeekFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedWeekFilter === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isBn ? 'সব সপ্তাহ (১-৭)' : 'All Weeks'}
                </button>
                {[1, 2, 3, 4, 5, 6, 7].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedWeekFilter(w)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedWeekFilter === w
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isBn ? `সপ্তাহ ${w}` : `Wk ${w}`}
                  </button>
                ))}
              </div>

              <span className="text-xs font-bold text-slate-500">
                {isBn ? `মোট ${filteredDays.length} দিনের রেকর্ড` : `${filteredDays.length} Days Displayed`}
              </span>
            </div>

            {/* Master Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-black text-[11px]">
                    <th className="py-3 px-3 whitespace-nowrap">{isBn ? 'দিন' : 'Day'}</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">{isBn ? 'দৈনিক খাদ্য (gm)' : 'Feed (gm)'}</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">{isBn ? 'কিউমু. খাদ্য (gm)' : 'Cum Feed'}</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">{isBn ? 'স্ট্যান্ডার্ড ওজন (gm)' : 'Std Wt (gm)'}</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">{isBn ? 'STD FCR' : 'STD FCR'}</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">{isBn ? 'তাপমাত্রা (°F)' : 'Temp °F'}</th>
                    <th className="py-3 px-4 min-w-[280px]">{isBn ? 'দৈনিক ফার্ম কাজের শিডিউল (SOP Work)' : 'Daily Work Schedule'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredDays.map((row) => {
                    const isToday = Math.round(batchAgeDays) === row.day;
                    const tasks = isBn ? row.tasksBn : row.tasks;
                    return (
                      <tr 
                        key={row.day}
                        className={`transition-colors ${
                          isToday 
                            ? 'bg-amber-50 font-bold' 
                            : row.isCritical 
                              ? 'bg-emerald-50/30 hover:bg-emerald-50/60' 
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-black whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{isBn ? `দিন ${row.day}` : `D ${row.day}`}</span>
                            {isToday && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                          {row.feedDailyGm}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                          {row.feedCumGm}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-emerald-700">
                          {row.bodyWeightGm}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-800">
                          {row.fcrStd > 0 ? row.fcrStd.toFixed(2) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-rose-700 whitespace-nowrap">
                          {row.tempFMin}-{row.tempFMax}°F
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 text-[11px] leading-relaxed">
                          {tasks.map((t, tidx) => (
                            <div key={tidx} className="flex items-start gap-1 py-0.5">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{t}</span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
