import toast from 'react-hot-toast';

/**
 * Format any phone number into an international WhatsApp-compatible format.
 * Specifically converts Bangladesh local format (e.g. 01622384379) to 8801622384379.
 */
export function formatWhatsAppPhone(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  // Strip all non-digit characters
  let digits = rawPhone.replace(/[^0-9]/g, '');

  if (!digits) return '';

  // If already starts with Bangladesh country code '880' and length >= 13
  if (digits.startsWith('880')) {
    return digits;
  }

  // If starts with '88' and then '01'
  if (digits.startsWith('88') && digits.length >= 13) {
    return digits;
  }

  // If standard Bangladesh local 11-digit mobile: 013, 014, 015, 016, 017, 018, 019
  if (digits.startsWith('01') && digits.length === 11) {
    return '88' + digits;
  }

  // If 10-digit without leading 0: 13, 14, 15, 16, 17, 18, 19
  if (digits.startsWith('1') && digits.length === 10) {
    return '880' + digits;
  }

  // International numbers (e.g. India 91..., Saudi 966...)
  return digits;
}

/**
 * Check if the number is a placeholder/dummy number (e.g. contains 000000)
 */
export function isPlaceholderPhone(phone: string): boolean {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 9) return true;
  if (/0{5,}/.test(digits)) return true; // 5 or more consecutive zeros
  return false;
}

export interface OpenWhatsAppOptions {
  phone: string;
  message?: string;
  lang?: 'bn' | 'en';
  fallbackPhone?: string;
}

/**
 * Safely opens WhatsApp on Android (Capacitor WebView), iOS, or Web browsers
 * without throwing net::ERR_UNKNOWN_URL_SCHEME or crashing if WhatsApp is not installed.
 */
export function openWhatsAppSafe({
  phone,
  message = '',
  lang = 'bn',
  fallbackPhone
}: OpenWhatsAppOptions): boolean {
  const cleanPhone = formatWhatsAppPhone(phone);

  if (!cleanPhone || isPlaceholderPhone(cleanPhone)) {
    toast.error(
      lang === 'bn'
        ? 'এই নম্বরে কোনো সক্রিয় হোয়াটসঅ্যাপ নেই। সরাসরি ফোনে কল করুন।'
        : 'WhatsApp is not active on this number. Please call directly.'
    );
    if (fallbackPhone) {
      window.location.href = `tel:${fallbackPhone.replace(/[^0-9+]/g, '')}`;
    }
    return false;
  }

  const encodedText = encodeURIComponent(message.trim());
  const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}${encodedText ? `&text=${encodedText}` : ''}`;

  try {
    // In mobile WebView / Capacitor, window.open or window.location can be used.
    // Opening via https://api.whatsapp.com/send with target="_self" or window.location
    // allows the Android OS intent filter to seamlessly catch the intent without blank popups.
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // In Capacitor/Android WebView, setting location or standard anchor dispatch
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
    return true;
  } catch (err) {
    console.warn('Failed to open WhatsApp URL:', err);
    toast.error(
      lang === 'bn'
        ? 'হোয়াটসঅ্যাপ খুলতে সমস্যা হয়েছে। অনুগ্রহ করে সরাসরি ফোন করুন।'
        : 'Could not open WhatsApp. Please make a phone call instead.'
    );
    if (fallbackPhone || phone) {
      window.location.href = `tel:${(fallbackPhone || phone).replace(/[^0-9+]/g, '')}`;
    }
    return false;
  }
}
