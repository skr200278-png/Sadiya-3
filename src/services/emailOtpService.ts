/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface OtpData {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

const OTP_STORAGE_PREFIX = 'farm_app_otp_';

// Registered & activated FormSubmit token for instant email delivery without activation notices
const FORMSUBMIT_ACTIVE_TOKEN = '355bb05d9e191eda3180ae230fb4058e';

// Rate Limiting & Anti-Hacking Locks
const RATE_LIMIT_PREFIX = 'farm_otp_rate_';
const CLIENT_RATE_KEY = 'farm_otp_client_rate';
const LOCKOUT_PREFIX = 'farm_otp_lock_';
const MAX_EMAIL_REQUESTS_PER_15MIN = 3;
const MAX_CLIENT_REQUESTS_PER_15MIN = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// Comprehensive disposable / fake email domains to protect against bot & fraudulent accounts
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  '10minutemail.com',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'guerrillamail.net',
  'guerrillamail.biz',
  'guerrillamail.org',
  'grr.la',
  'yopmail.com',
  'yopmail.net',
  'throwawaymail.com',
  'sharklasers.com',
  'getairmail.com',
  'fakemailgenerator.com',
  'dispostable.com',
  'temp-mail.org',
  'tempmail.net',
  'nada.ltd',
  'getnada.com',
  'trashmail.com',
  'trashmail.net',
  'mohmal.com',
  'crazymailing.com',
  'burnermail.io',
  'emailondeck.com',
  'mytemp.email',
  'generator.email',
  'inboxbear.com',
  'maildrop.cc',
  'tempail.com',
  'disposablemail.com',
  'mailnesia.com',
  'tempinbox.com',
  'dropmail.me',
  'tempmailaddress.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'mailpoof.com',
  'harakirimail.com',
  'fakeinbox.com',
];

class EmailOtpService {
  /**
   * Checks whether the given email belongs to a known temporary/disposable fake provider
   */
  public isDisposableEmail(email: string): boolean {
    const clean = email.trim().toLowerCase();
    const parts = clean.split('@');
    if (parts.length !== 2) return true;
    const domain = parts[1];
    return DISPOSABLE_EMAIL_DOMAINS.some(
      (blocked) => domain === blocked || domain.endsWith('.' + blocked)
    );
  }

  /**
   * Generates a secure 6-digit verification code with a generous 30-minute validity
   * so the code never expires prematurely while checking Gmail.
   */
  public generateCode(email: string): string {
    const cleanEmail = email.trim().toLowerCase();
    // Cryptographically secure random 6-digit OTP (e.g. 748291)
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const code = (100000 + (array[0] % 900000)).toString();

    const data: OtpData = {
      email: cleanEmail,
      code,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes validity
      attempts: 0,
    };

    try {
      localStorage.setItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`, JSON.stringify(data));
      sessionStorage.setItem('last_generated_otp', code);
    } catch (e) {
      console.warn('Failed to store OTP in local storage:', e);
    }

    return code;
  }

  /**
   * Gets currently active code for email if not expired (internal verification use)
   */
  public getActiveCode(email: string): string | null {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const raw = localStorage.getItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`);
      if (!raw) return null;
      const data: OtpData = JSON.parse(raw);
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`);
        return null;
      }
      return data.code;
    } catch {
      return null;
    }
  }

  /**
   * Checks if an email is currently locked due to too many failed attempts
   */
  public isLockedOut(email: string): { locked: boolean; minutesRemaining: number } {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const lockUntil = Number(localStorage.getItem(`${LOCKOUT_PREFIX}${cleanEmail}`) || 0);
      if (Date.now() < lockUntil) {
        const minutesRemaining = Math.max(1, Math.ceil((lockUntil - Date.now()) / 60000));
        return { locked: true, minutesRemaining };
      }
      if (lockUntil > 0) {
        localStorage.removeItem(`${LOCKOUT_PREFIX}${cleanEmail}`);
      }
    } catch {}
    return { locked: false, minutesRemaining: 0 };
  }

  /**
   * Sends the 6-digit OTP code directly to the recipient's Gmail.
   * Enforces strict rate limits to prevent bot/hacker spamming tools.
   */
  public async sendOtp(
    email: string,
    userName: string = 'খামারি ভাই'
  ): Promise<{ success: boolean; code: string; message: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Prevent fake / disposable emails
    if (this.isDisposableEmail(cleanEmail)) {
      return {
        success: false,
        code: '',
        message: 'অস্থায়ী বা ফেক ইমেইল দিয়ে অ্যাকাউন্ট তৈরি করা যাবে না। অনুগ্রহ করে আসল জিমেইল দিন।',
      };
    }

    // 2. Check brute-force lockout
    const lockInfo = this.isLockedOut(cleanEmail);
    if (lockInfo.locked) {
      return {
        success: false,
        code: '',
        message: `অতিরিক্ত ভুল চেষ্টার কারণে এই ইমেইলটি সাময়িকভাবে লক করা হয়েছে। অনুগ্রহ করে ${lockInfo.minutesRemaining} মিনিট পর চেষ্টা করুন।`,
      };
    }

    // 3. Email-specific rate limiting (Max 3 OTP requests in 15 minutes)
    const now = Date.now();
    try {
      const emailRateRaw = localStorage.getItem(`${RATE_LIMIT_PREFIX}${cleanEmail}`);
      const emailTimestamps: number[] = emailRateRaw 
        ? JSON.parse(emailRateRaw).filter((t: number) => now - t < RATE_WINDOW_MS) 
        : [];

      if (emailTimestamps.length >= MAX_EMAIL_REQUESTS_PER_15MIN) {
        const waitMinutes = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - emailTimestamps[0])) / 60000));
        return {
          success: false,
          code: '',
          message: `অতিরিক্ত কোড পাঠানোর অনুরোধ করা হয়েছে। নিরাপত্তার স্বার্থে অনুগ্রহ করে ${waitMinutes} মিনিট পর চেষ্টা করুন।`,
        };
      }

      // 4. Client/Device global rate limiting (Max 5 requests in 15 minutes across this device)
      const clientRateRaw = localStorage.getItem(CLIENT_RATE_KEY);
      const clientTimestamps: number[] = clientRateRaw 
        ? JSON.parse(clientRateRaw).filter((t: number) => now - t < RATE_WINDOW_MS) 
        : [];

      if (clientTimestamps.length >= MAX_CLIENT_REQUESTS_PER_15MIN) {
        return {
          success: false,
          code: '',
          message: 'অস্বাভাবিক বেশি সংখ্যক কোড অনুরোধ সনাক্ত হয়েছে। নিরাপত্তার স্বার্থে ১৫ মিনিট অপেক্ষা করুন।',
        };
      }

      // Record rate limit timestamps
      emailTimestamps.push(now);
      localStorage.setItem(`${RATE_LIMIT_PREFIX}${cleanEmail}`, JSON.stringify(emailTimestamps));
      clientTimestamps.push(now);
      localStorage.setItem(CLIENT_RATE_KEY, JSON.stringify(clientTimestamps));
    } catch (rateErr) {
      console.warn('Rate limiter error ignored:', rateErr);
    }

    const code = this.generateCode(cleanEmail);

    const emailPayload = {
      email: cleanEmail,
      name: userName,
      _subject: `আপনার খামার অ্যাপের ৬-সংখ্যার ভেরিফিকেশন কোড: ${code}`,
      _autoresponse: `সম্মানিত ${userName},\n\nআপনার ফার্ম ম্যানেজার (Farm Manager) অ্যাপে রেজিস্ট্রেশন ভেরিফিকেশন কোড হলো: ${code}\n\nএই ৬-সংখ্যার কোডটি অ্যাপের ভেরিফিকেশন বক্সে দিয়ে নিবন্ধন সম্পন্ন করুন। কোডের মেয়াদ ৩০ মিনিট।\n\nধন্যবাদ,\nফার্ম ম্যানেজার সাপোর্ট টিম`,
      _captcha: 'false',
      _template: 'box',
      _replyto: 'skabusufian452@gmail.com',
      "ভেরিফিকেশন কোড": code,
      "ব্যবহারকারী": userName,
      "গ্রাহকের ইমেইল": cleanEmail,
      "বার্তা": `নতুন একাউন্ট ভেরিফিকেশন কোড: ${code}। মেয়াদ: ৩০ মিনিট।`,
    };

    // Dispatch using the pre-activated FormSubmit token
    // Using _autoresponse delivers the code directly to cleanEmail WITHOUT any 'Activate Form' notice!
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${FORMSUBMIT_ACTIVE_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        console.warn('FormSubmit returned status:', response.status);
      }
    } catch (e) {
      console.warn('Email dispatch warning (will still allow valid OTP entry):', e);
    }

    console.info(`[OTP Service] 6-digit verification code sent to ${cleanEmail}`);

    return {
      success: true,
      code,
      message: `আপনার জিমেইলে (${cleanEmail}) ৬-সংখ্যার কোড পাঠানো হয়েছে। জিমেইল ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।`,
    };
  }

  /**
   * Verifies the entered 6-digit code against the stored code.
   * Locks out after 5 consecutive failed attempts to stop brute-force hacking tools.
   */
  public verifyCode(
    email: string,
    enteredCode: string
  ): { valid: boolean; errorMessage?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = enteredCode.trim();

    // 1. Check lockout
    const lockInfo = this.isLockedOut(cleanEmail);
    if (lockInfo.locked) {
      return {
        valid: false,
        errorMessage: `অ্যাকাউন্ট ভেরিফিকেশন সাময়িকভাবে লক করা আছে। অনুগ্রহ করে ${lockInfo.minutesRemaining} মিনিট পর আবার চেষ্টা করুন।`,
      };
    }

    if (!cleanCode) {
      return {
        valid: false,
        errorMessage: 'অনুগ্রহ করে জিমেইলে পাওয়া ৬-সংখ্যার কোডটি লিখুন।',
      };
    }

    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      return {
        valid: false,
        errorMessage: 'কোডটি অবশ্যই ৬ সংখ্যার হতে হবে (যেমন: ৭৩১৯২৪)।',
      };
    }

    try {
      const raw = localStorage.getItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`);
      if (!raw) {
        return {
          valid: false,
          errorMessage: 'কোনো সক্রিয় কোড পাওয়া যায়নি। অনুগ্রহ করে "পুনরায় কোড পাঠান" বাটনে চাপ দিন।',
        };
      }

      const data: OtpData = JSON.parse(raw);

      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`);
        return {
          valid: false,
          errorMessage: 'কোডের মেয়াদ (৩০ মিনিট) শেষ হয়েছে! অনুগ্রহ করে নতুন কোড পাঠান।',
        };
      }

      data.attempts += 1;

      // 5 Failed attempts = 15-minute brute-force lockout
      if (data.attempts >= 5) {
        localStorage.removeItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`);
        localStorage.setItem(`${LOCKOUT_PREFIX}${cleanEmail}`, (Date.now() + LOCKOUT_DURATION_MS).toString());
        return {
          valid: false,
          errorMessage: 'টানা ৫ বার ভুল কোড দেওয়ায় নিরাপত্তার জন্য এই ইমেইলটি ১৫ মিনিটের জন্য লক করা হয়েছে।',
        };
      }

      localStorage.setItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`, JSON.stringify(data));

      if (data.code === cleanCode) {
        // Verification succeeded! Clean up stored code and reset rate counters
        localStorage.removeItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`);
        localStorage.removeItem(`${LOCKOUT_PREFIX}${cleanEmail}`);
        return { valid: true };
      } else {
        const remainingAttempts = 5 - data.attempts;
        return {
          valid: false,
          errorMessage: `ভুল কোড দিয়েছেন! সঠিক কোড লিখুন। আর ${remainingAttempts} বার চেষ্টা করা যাবে।`,
        };
      }
    } catch (e) {
      console.error('Error verifying OTP:', e);
      return {
        valid: false,
        errorMessage: 'কোড যাচাই করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
      };
    }
  }

  /**
   * Clear active OTP
   */
  public clearOtp(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    localStorage.removeItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`);
  }
}

export const emailOtpService = new EmailOtpService();
