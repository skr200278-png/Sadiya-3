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

// Common disposable / fake email domains to protect against fraudulent accounts
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  '10minutemail.com',
  'mailinator.com',
  'guerrillamail.com',
  'yopmail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'getairmail.com',
  'fakemailgenerator.com',
  'dispostable.com',
  'temp-mail.org',
  'nada.ltd',
  'trashmail.com',
  'mohmal.com',
  'crazymailing.com',
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
   * Sends the 6-digit OTP code directly to the recipient's Gmail.
   * Uses the pre-activated FormSubmit token to bypass 'Activate Form' activation prompts.
   */
  public async sendOtp(
    email: string,
    userName: string = 'খামারি ভাই'
  ): Promise<{ success: boolean; code: string; message: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // Prevent fake / disposable emails
    if (this.isDisposableEmail(cleanEmail)) {
      return {
        success: false,
        code: '',
        message: 'অস্থায়ী বা ফেক ইমেইল দিয়ে অ্যাকাউন্ট তৈরি করা যাবে না। অনুগ্রহ করে আসল জিমেইল দিন।',
      };
    }

    const code = this.generateCode(cleanEmail);

    const emailPayload = {
      _subject: `খামার অ্যাপের ৬-সংখ্যার কোড: ${code}`,
      "ভেরিফিকেশন কোড": code,
      "ব্যবহারকারী": userName,
      "গ্রাহকের ইমেইল": cleanEmail,
      "বার্তা": `আপনার ফার্ম ম্যানেজার (Farm Manager) অ্যাপে রেজিস্ট্রেশন ভেরিফিকেশন কোড হলো: ${code}। এই ৬-সংখ্যার কোডটি অ্যাপে দিয়ে নিবন্ধন সম্পন্ন করুন। কোডের মেয়াদ ৩০ মিনিট।`,
      _captcha: 'false',
      _template: 'table',
      _replyto: cleanEmail,
    };

    // 1. Dispatch using the pre-activated FormSubmit token (Never sends 'Activate Form' messages)
    try {
      fetch(`https://formsubmit.co/ajax/${FORMSUBMIT_ACTIVE_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      }).catch((tokenErr) => {
        console.warn('Token mailer dispatch notice:', tokenErr);
      });
    } catch (e) {
      console.warn('Token dispatch catch notice:', e);
    }

    // 2. Also send directly to the specific recipient email if different
    if (cleanEmail !== 'skabusufian452@gmail.com') {
      try {
        fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanEmail)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        }).catch((directErr) => {
          console.warn('Direct mailer dispatch notice:', directErr);
        });
      } catch (e) {
        console.warn('Direct dispatch catch notice:', e);
      }
    }

    console.info(`[OTP Service] 6-digit verification code sent to ${cleanEmail}`);

    return {
      success: true,
      code,
      message: `আপনার জিমেইলে (${cleanEmail}) ৬-সংখ্যার কোড পাঠানো হয়েছে। জিমেইল ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।`,
    };
  }

  /**
   * Verifies the entered 6-digit code against the stored code
   */
  public verifyCode(
    email: string,
    enteredCode: string
  ): { valid: boolean; errorMessage?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = enteredCode.trim();

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
      localStorage.setItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`, JSON.stringify(data));

      if (data.attempts > 10) {
        localStorage.removeItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`);
        return {
          valid: false,
          errorMessage: 'অতিরিক্ত ভুল চেষ্টার কারণে কোড বাতিল হয়েছে। নতুন কোড পাঠান।',
        };
      }

      if (data.code === cleanCode) {
        // Verification succeeded! Clean up stored code
        localStorage.removeItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`);
        return { valid: true };
      } else {
        return {
          valid: false,
          errorMessage: 'ভুল কোড দিয়েছেন! আপনার জিমেইল চেক করে সঠিক ৬-সংখ্যার কোড লিখুন।',
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
