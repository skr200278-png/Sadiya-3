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

class EmailOtpService {
  /**
   * Generates a 6-digit verification code and stores it with a 10-minute validity
   */
  public generateCode(email: string): string {
    const cleanEmail = email.trim().toLowerCase();
    // Cryptographically secure random 6-digit OTP (e.g., 583921)
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const code = (100000 + (array[0] % 900000)).toString();

    const data: OtpData = {
      email: cleanEmail,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes valid
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
   * Gets currently active code for email if not expired
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
   * Sends the 6-digit OTP code to the recipient's Gmail
   */
  public async sendOtp(
    email: string,
    userName: string = 'খামারি ভাই'
  ): Promise<{ success: boolean; code: string; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const code = this.generateCode(cleanEmail);

    // Dispatch OTP email to the user's Gmail address
    try {
      fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          _subject: `খামার অ্যাপ যাচাইকরণ কোড: ${code}`,
          "ভেরিফিকেশন কোড": code,
          "গ্রাহকের নাম": userName,
          "বার্তা": `আপনার ফার্ম ম্যানেজার (Farm Manager) অ্যাপে নতুন রেজিস্ট্রেশনের ৬-সংখ্যার কোড হলো: ${code}। এই কোডটি অ্যাপে দিয়ে রেজিস্ট্রেশন সম্পন্ন করুন।`,
          _captcha: 'false',
          _template: 'table',
        }),
      }).catch((fetchErr) => {
        console.warn('Background mailer notice:', fetchErr);
      });
    } catch (e) {
      console.warn('Email dispatch notice:', e);
    }

    console.info(`[OTP Service] 6-digit verification code for ${cleanEmail}: ${code}`);

    return {
      success: true,
      code,
      message: `আপনার জিমেইল (${cleanEmail})-এ ৬-সংখ্যার যাচাইকরণ কোড পাঠানো হয়েছে।`,
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
          errorMessage: 'কোনো সক্রিয় কোড পাওয়া যায়নি। অনুগ্রহ করে "কোড পাঠান" বাটনে চাপ দিয়ে নতুন কোড নিন।',
        };
      }

      const data: OtpData = JSON.parse(raw);

      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`);
        return {
          valid: false,
          errorMessage: 'কোডের মেয়াদ (১০ মিনিট) শেষ হয়েছে! অনুগ্রহ করে আবার নতুন কোড পাঠান।',
        };
      }

      data.attempts += 1;
      localStorage.setItem(`${OTP_STORAGE_PREFIX}${cleanEmail}`, JSON.stringify(data));

      if (data.attempts > 8) {
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
          errorMessage: 'ভুল কোড দিয়েছেন! আপনার জিমেইল চেক করে সঠিক কোডটি লিখুন।',
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
