/**
 * Utility helpers for Subscription Duration, Countdown & Expiration Tracking
 */

export interface ExpiryInfo {
  isLifetime: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean; // <= 3 days
  isExpiringToday: boolean; // <= 24 hours
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  percentRemaining: number; // 0 - 100%
  formattedExpiryBn: string;
  formattedExpiryEn: string;
  statusLabelBn: string;
  statusLabelEn: string;
  badgeBgColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
  elapsedSinceExpiryBn?: string;
  elapsedSinceExpiryEn?: string;
  liveDigitsBn: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
  liveDigitsEn: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
}

/**
 * Convert numbers to Bengali digits
 */
export function toBengaliDigits(input: number | string): string {
  const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(input).replace(/[0-9]/g, (w) => bnNums[Number(w)]);
}

/**
 * Two-digit pad
 */
function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Calculate live countdown, remaining days/hours/minutes/seconds, and expiration state
 */
export function getSubscriptionExpiryInfo(
  expiresAt?: string | null,
  isLifetime?: boolean,
  status: string = 'active',
  totalDurationDays: number = 30
): ExpiryInfo {
  if (isLifetime) {
    return {
      isLifetime: true,
      isExpired: false,
      isExpiringSoon: false,
      isExpiringToday: false,
      daysRemaining: 99999,
      hoursRemaining: 999999,
      minutesRemaining: 9999999,
      secondsRemaining: 99999999,
      percentRemaining: 100,
      formattedExpiryBn: 'আজীবন ভিআইপি (Lifetime)',
      formattedExpiryEn: 'Lifetime VIP',
      statusLabelBn: 'আজীবন আনলিমিটেড',
      statusLabelEn: 'Lifetime Unlimited',
      badgeBgColor: 'bg-indigo-500/20',
      badgeTextColor: 'text-indigo-300',
      badgeBorderColor: 'border-indigo-500/40',
      liveDigitsBn: { days: '∞', hours: '∞', minutes: '∞', seconds: '∞' },
      liveDigitsEn: { days: '∞', hours: '∞', minutes: '∞', seconds: '∞' }
    };
  }

  if (!expiresAt) {
    if (status === 'approved' || status === 'active') {
      return {
        isLifetime: false,
        isExpired: false,
        isExpiringSoon: false,
        isExpiringToday: false,
        daysRemaining: 30,
        hoursRemaining: 720,
        minutesRemaining: 43200,
        secondsRemaining: 2592000,
        percentRemaining: 100,
        formattedExpiryBn: 'সক্রিয় (আনলিমিটেড)',
        formattedExpiryEn: 'Active (Unlimited)',
        statusLabelBn: 'সক্রিয়',
        statusLabelEn: 'Active',
        badgeBgColor: 'bg-emerald-500/20',
        badgeTextColor: 'text-emerald-400',
        badgeBorderColor: 'border-emerald-500/40',
        liveDigitsBn: { days: '৩০', hours: '০০', minutes: '০০', seconds: '০০' },
        liveDigitsEn: { days: '30', hours: '00', minutes: '00', seconds: '00' }
      };
    }
    return {
      isLifetime: false,
      isExpired: false,
      isExpiringSoon: false,
      isExpiringToday: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      percentRemaining: 0,
      formattedExpiryBn: 'তারিখ নির্ধারিত হয়নি',
      formattedExpiryEn: 'No expiry date',
      statusLabelBn: 'নির্ধারিত নয়',
      statusLabelEn: 'Not Set',
      badgeBgColor: 'bg-slate-800',
      badgeTextColor: 'text-slate-400',
      badgeBorderColor: 'border-slate-700',
      liveDigitsBn: { days: '০০', hours: '০০', minutes: '০০', seconds: '০০' },
      liveDigitsEn: { days: '00', hours: '00', minutes: '00', seconds: '00' }
    };
  }

  const expTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const diffMs = expTime - now;

  const dateObj = new Date(expiresAt);
  const formattedExpiryBn = dateObj.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const formattedExpiryEn = dateObj.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (diffMs <= 0 || status === 'expired') {
    const elapsedMs = Math.abs(diffMs);
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const elapsedHours = Math.floor((elapsedMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let elapsedSinceExpiryBn = 'এইমাত্র শেষ হয়েছে';
    let elapsedSinceExpiryEn = 'Just expired';
    if (elapsedDays > 0) {
      elapsedSinceExpiryBn = `${toBengaliDigits(elapsedDays)} দিন আগে শেষ হয়েছে`;
      elapsedSinceExpiryEn = `Expired ${elapsedDays}d ago`;
    } else if (elapsedHours > 0) {
      elapsedSinceExpiryBn = `${toBengaliDigits(elapsedHours)} ঘণ্টা আগে শেষ হয়েছে`;
      elapsedSinceExpiryEn = `Expired ${elapsedHours}h ago`;
    }

    return {
      isLifetime: false,
      isExpired: true,
      isExpiringSoon: false,
      isExpiringToday: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      percentRemaining: 0,
      formattedExpiryBn,
      formattedExpiryEn,
      statusLabelBn: 'মেয়াদ শেষ (Expired)',
      statusLabelEn: 'Expired',
      badgeBgColor: 'bg-rose-500/20',
      badgeTextColor: 'text-rose-400',
      badgeBorderColor: 'border-rose-500/40',
      elapsedSinceExpiryBn,
      elapsedSinceExpiryEn,
      liveDigitsBn: { days: '০০', hours: '০০', minutes: '০০', seconds: '০০' },
      liveDigitsEn: { days: '00', hours: '00', minutes: '00', seconds: '00' }
    };
  }

  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const secondsRemaining = Math.floor((diffMs % (1000 * 60)) / 1000);

  const isExpiringToday = daysRemaining === 0;
  const isExpiringSoon = daysRemaining <= 3;

  // Calculate percentage of time remaining (using totalDurationDays if available)
  const totalMs = Math.max(1, (totalDurationDays || 30) * 24 * 60 * 60 * 1000);
  const percentRemaining = Math.min(100, Math.max(0, Math.round((diffMs / totalMs) * 100)));

  let statusLabelBn = '';
  let statusLabelEn = '';
  let badgeBgColor = 'bg-emerald-500/20';
  let badgeTextColor = 'text-emerald-400';
  let badgeBorderColor = 'border-emerald-500/40';

  if (daysRemaining === 0) {
    if (hoursRemaining === 0) {
      statusLabelBn = `${toBengaliDigits(minutesRemaining)} মিনিট ${toBengaliDigits(secondsRemaining)} সেকেন্ড বাকি (আজই শেষ)`;
      statusLabelEn = `${minutesRemaining}m ${secondsRemaining}s left (Ends today)`;
    } else {
      statusLabelBn = `${toBengaliDigits(hoursRemaining)} ঘণ্টা ${toBengaliDigits(minutesRemaining)} মিনিট বাকি (আজই শেষ)`;
      statusLabelEn = `${hoursRemaining}h ${minutesRemaining}m left (Ends today)`;
    }
    badgeBgColor = 'bg-rose-500/25';
    badgeTextColor = 'text-rose-300';
    badgeBorderColor = 'border-rose-500/50';
  } else if (daysRemaining <= 3) {
    statusLabelBn = `${toBengaliDigits(daysRemaining)} দিন ${toBengaliDigits(hoursRemaining)} ঘণ্টা বাকি (শীঘ্রই শেষ)`;
    statusLabelEn = `${daysRemaining}d ${hoursRemaining}h left (Expiring soon)`;
    badgeBgColor = 'bg-amber-500/25';
    badgeTextColor = 'text-amber-300';
    badgeBorderColor = 'border-amber-500/40';
  } else {
    statusLabelBn = `${toBengaliDigits(daysRemaining)} দিন ${toBengaliDigits(hoursRemaining)} ঘণ্টা বাকি`;
    statusLabelEn = `${daysRemaining}d ${hoursRemaining}h remaining`;
    badgeBgColor = 'bg-emerald-500/20';
    badgeTextColor = 'text-emerald-400';
    badgeBorderColor = 'border-emerald-500/40';
  }

  return {
    isLifetime: false,
    isExpired: false,
    isExpiringSoon,
    isExpiringToday,
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    secondsRemaining,
    percentRemaining,
    formattedExpiryBn,
    formattedExpiryEn,
    statusLabelBn,
    statusLabelEn,
    badgeBgColor,
    badgeTextColor,
    badgeBorderColor,
    liveDigitsBn: {
      days: toBengaliDigits(padZero(daysRemaining)),
      hours: toBengaliDigits(padZero(hoursRemaining)),
      minutes: toBengaliDigits(padZero(minutesRemaining)),
      seconds: toBengaliDigits(padZero(secondsRemaining))
    },
    liveDigitsEn: {
      days: padZero(daysRemaining),
      hours: padZero(hoursRemaining),
      minutes: padZero(minutesRemaining),
      seconds: padZero(secondsRemaining)
    }
  };
}

/**
 * Format plan duration in human-readable Bengali
 */
export function formatPlanDurationBn(durationDays?: number): string {
  if (!durationDays || durationDays <= 0) return 'মেয়াদ নির্ধারিত নয়';
  if (durationDays >= 9999) return 'আজীবন (Lifetime)';
  if (durationDays === 7) return '৭ দিন (১ সপ্তাহ)';
  if (durationDays === 15) return '১৫ দিন (অর্ধ মাস)';
  if (durationDays === 30) return '১ মাস (৩০ দিন)';
  if (durationDays === 60) return '২ মাস (৬০ দিন)';
  if (durationDays === 90) return '৩ মাস (৯০ দিন)';
  if (durationDays === 180) return '৬ মাস (১৮০ দিন)';
  if (durationDays === 365) return '১ বছর (৩৬৫ দিন)';
  return `${toBengaliDigits(durationDays)} দিন`;
}

/**
 * Generate friendly WhatsApp renewal notification text
 */
export function generateRenewalWhatsAppMessage(params: {
  userName?: string;
  planTitle?: string;
  remainingText?: string;
  isExpired?: boolean;
  bkashNumber?: string;
  nagadNumber?: string;
}): string {
  const { userName = 'গ্রাহক', planTitle = 'প্রো প্যাকেজ', remainingText, isExpired, bkashNumber = '01410991934', nagadNumber = '01410991934' } = params;
  
  if (isExpired) {
    return encodeURIComponent(
      `আসসালামু আলাইকুম ${userName},\n\nডিজিটাল খামার অ্যাপে আপনার "${planTitle}" সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে। খামারের সকল প্রিমিয়াম ফিচার, হিসাব ও রিকমেন্ডেশন নিরবচ্ছিন্নভাবে চালু রাখতে অনুগ্রহ করে রিনিউ করুন।\n\nবিকাশ/নগদ (পার্সোনাল): ${bkashNumber}\nটাকা পাঠিয়ে ট্রানজেকশন আইডি (TrxID) দিলে তাৎক্ষণিক চালু করে দেওয়া হবে। ধন্যবাদ!`
    );
  }

  return encodeURIComponent(
    `আসসালামু আলাইকুম ${userName},\n\nডিজিটাল খামার অ্যাপে আপনার "${planTitle}" ভিআইপি সাবস্ক্রিপশনের মেয়াদ আর মাত্র ${remainingText || 'কিছুদিন'} বাকি আছে। নিরবচ্ছিন্ন সেবা অব্যাহত রাখতে আগেই রিনিউ করে রাখতে পারেন।\n\nবিকাশ/নগদ (পার্সোনাল): ${bkashNumber}\nযেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন। ধন্যবাদ!`
  );
}
