export interface DistrictInfo {
  nameBn: string;
  nameEn: string;
  divisionBn: string;
  divisionEn: string;
}

export interface CountryInfo {
  code: string;
  nameBn: string;
  nameEn: string;
  dialCode?: string;
}

export const COUNTRY_LIST: CountryInfo[] = [
  { code: 'BD', nameBn: 'বাংলাদেশ', nameEn: 'Bangladesh', dialCode: '+880' },
  { code: 'IN', nameBn: 'ভারত', nameEn: 'India', dialCode: '+91' },
  { code: 'SA', nameBn: 'সৌদি আরব', nameEn: 'Saudi Arabia', dialCode: '+966' },
  { code: 'AE', nameBn: 'সংযুক্ত আরব আমিরাত (UAE)', nameEn: 'United Arab Emirates (UAE)', dialCode: '+971' },
  { code: 'OM', nameBn: 'ওমান', nameEn: 'Oman', dialCode: '+968' },
  { code: 'QA', nameBn: 'কাতার', nameEn: 'Qatar', dialCode: '+974' },
  { code: 'KW', nameBn: 'কুয়েত', nameEn: 'Kuwait', dialCode: '+965' },
  { code: 'MY', nameBn: 'মালয়েশিয়া', nameEn: 'Malaysia', dialCode: '+60' },
  { code: 'SG', nameBn: 'সিঙ্গাপুর', nameEn: 'Singapore', dialCode: '+65' },
  { code: 'US', nameBn: 'যুক্তরাষ্ট্র (USA)', nameEn: 'United States (USA)', dialCode: '+1' },
  { code: 'GB', nameBn: 'যুক্তরাজ্য (UK)', nameEn: 'United Kingdom (UK)', dialCode: '+44' },
  { code: 'CA', nameBn: 'কানাডা', nameEn: 'Canada', dialCode: '+1' },
  { code: 'OTHER', nameBn: 'অন্যান্য দেশ (Other Country)', nameEn: 'Other Country', dialCode: '' },
];

export const COUNTRY_FILTER_OPTIONS_BN = ['সকল দেশ', ...COUNTRY_LIST.map(c => c.nameBn)];
export const COUNTRY_FILTER_OPTIONS_EN = ['All Countries', ...COUNTRY_LIST.map(c => c.nameEn)];

export const BANGLADESH_DIVISIONS = [
  { bn: 'ঢাকা', en: 'Dhaka' },
  { bn: 'চট্টগ্রাম', en: 'Chattogram' },
  { bn: 'খুলনা', en: 'Khulna' },
  { bn: 'রাজশাহী', en: 'Rajshahi' },
  { bn: 'রংপুর', en: 'Rangpur' },
  { bn: 'ময়মনসিংহ', en: 'Mymensingh' },
  { bn: 'বরিশাল', en: 'Barishal' },
  { bn: 'সিলেট', en: 'Sylhet' },
];

export const ALL_64_DISTRICTS: DistrictInfo[] = [
  // খুলনা বিভাগ (Khulna Division - 10 Districts)
  { nameBn: 'খুলনা', nameEn: 'Khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'যশোর', nameEn: 'Jashore', divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'বাগেরহাট', nameEn: 'Bagerhat', divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'সাতক্ষীরা', nameEn: 'Satkhira', divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'ঝিনাইদহ', nameEn: 'Jhenaidah', divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'কুষ্টিয়া', nameEn: 'Kushtia', divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'চুয়াডাঙ্গা', nameEn: 'Chuadanga', divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'মেহেরপুর', nameEn: 'Meherpur', divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'মাগুরা', nameEn: 'Magura', divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'নড়াইল', nameEn: 'Narail', divisionBn: 'খুলনা', divisionEn: 'Khulna' },

  // ঢাকা বিভাগ (Dhaka Division - 13 Districts)
  { nameBn: 'ঢাকা', nameEn: 'Dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'গাজীপুর', nameEn: 'Gazipur', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'নারায়ণগঞ্জ', nameEn: 'Narayanganj', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'নরসিংদী', nameEn: 'Narsingdi', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'টাঙ্গাইল', nameEn: 'Tangail', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'কিশোরগঞ্জ', nameEn: 'Kishoreganj', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'মানিকগঞ্জ', nameEn: 'Manikganj', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'মুন্সীগঞ্জ', nameEn: 'Munshiganj', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'ফরিদপুর', nameEn: 'Faridpur', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'মাদারীপুর', nameEn: 'Madaripur', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'গোপালগঞ্জ', nameEn: 'Gopalganj', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'রাজবাড়ী', nameEn: 'Rajbari', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'শরীয়তপুর', nameEn: 'Shariatpur', divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },

  // চট্টগ্রাম বিভাগ (Chattogram Division - 11 Districts)
  { nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'কুমিল্লা', nameEn: 'Cumilla', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'ব্রাহ্মণবাড়িয়া', nameEn: 'Brahmanbaria', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'চাঁদপুর', nameEn: 'Chandpur', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'নোয়াখালী', nameEn: 'Noakhali', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'ফেনী', nameEn: 'Feni', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'লক্ষ্মীপুর', nameEn: 'Lakshmipur', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'কক্সবাজার', nameEn: 'Cox\'s Bazar', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'রাঙ্গামাটি', nameEn: 'Rangamati', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'বান্দরবান', nameEn: 'Bandarban', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'খাগড়াছড়ি', nameEn: 'Khagrachhari', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },

  // রাজশাহী বিভাগ (Rajshahi Division - 8 Districts)
  { nameBn: 'রাজশাহী', nameEn: 'Rajshahi', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'বগুড়া', nameEn: 'Bogura', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'পাবনা', nameEn: 'Pabna', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'সিরাজগঞ্জ', nameEn: 'Sirajganj', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'নাটোর', nameEn: 'Natore', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'নওগাঁ', nameEn: 'Naogaon', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'চাঁপাইনবাবগঞ্জ', nameEn: 'Chapainawabganj', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'জয়পুরহাট', nameEn: 'Joypurhat', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },

  // রংপুর বিভাগ (Rangpur Division - 8 Districts)
  { nameBn: 'রংপুর', nameEn: 'Rangpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'দিনাজপুর', nameEn: 'Dinajpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'গাইবান্ধা', nameEn: 'Gaibandha', divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'কুড়িগ্রাম', nameEn: 'Kurigram', divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'নীলফামারী', nameEn: 'Nilphamari', divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'লালমনিরহাট', nameEn: 'Lalmonirhat', divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'পঞ্চগড়', nameEn: 'Panchagarh', divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'ঠাকুরগাঁও', nameEn: 'Thakurgaon', divisionBn: 'রংপুর', divisionEn: 'Rangpur' },

  // ময়মনসিংহ বিভাগ (Mymensingh Division - 4 Districts)
  { nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh' },
  { nameBn: 'জামালপুর', nameEn: 'Jamalpur', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh' },
  { nameBn: 'নেত্রকোণা', nameEn: 'Netrokona', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh' },
  { nameBn: 'শেরপুর', nameEn: 'Sherpur', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh' },

  // বরিশাল বিভাগ (Barishal Division - 6 Districts)
  { nameBn: 'বরিশাল', nameEn: 'Barishal', divisionBn: 'বরিশাল', divisionEn: 'Barishal' },
  { nameBn: 'পটুয়াখালী', nameEn: 'Patuakhali', divisionBn: 'বরিশাল', divisionEn: 'Barishal' },
  { nameBn: 'ভোলা', nameEn: 'Bhola', divisionBn: 'বরিশাল', divisionEn: 'Barishal' },
  { nameBn: 'পিরোজপুর', nameEn: 'Pirojpur', divisionBn: 'বরিশাল', divisionEn: 'Barishal' },
  { nameBn: 'বরগুনা', nameEn: 'Barguna', divisionBn: 'বরিশাল', divisionEn: 'Barishal' },
  { nameBn: 'ঝালকাঠি', nameEn: 'Jhalokathi', divisionBn: 'বরিশাল', divisionEn: 'Barishal' },

  // সিলেট বিভাগ (Sylhet Division - 4 Districts)
  { nameBn: 'সিলেট', nameEn: 'Sylhet', divisionBn: 'সিলেট', divisionEn: 'Sylhet' },
  { nameBn: 'মৌলভীবাজার', nameEn: 'Moulvibazar', divisionBn: 'সিলেট', divisionEn: 'Sylhet' },
  { nameBn: 'হবিগঞ্জ', nameEn: 'Habiganj', divisionBn: 'সিলেট', divisionEn: 'Sylhet' },
  { nameBn: 'সুনামগঞ্জ', nameEn: 'Sunamganj', divisionBn: 'সিলেট', divisionEn: 'Sylhet' }
];

// District names in Bengali and English
export const BANGLADESH_DISTRICT_NAMES_BN = ALL_64_DISTRICTS.map(d => d.nameBn).sort((a, b) => a.localeCompare(b, 'bn'));
export const BANGLADESH_DISTRICT_NAMES_EN = ALL_64_DISTRICTS.map(d => d.nameEn).sort((a, b) => a.localeCompare(b, 'en'));

// Filter options with "সকল জেলা" / "All Districts"
export const DISTRICT_FILTER_OPTIONS_BN = ['সকল জেলা', ...BANGLADESH_DISTRICT_NAMES_BN];
export const DISTRICT_FILTER_OPTIONS_EN = ['All Districts', ...BANGLADESH_DISTRICT_NAMES_EN];

/**
 * Automatically detect user's country from browser timezone or locale
 */
export function detectUserCountry(): CountryInfo {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const tzLower = tz.toLowerCase();

    if (tzLower.includes('dhaka')) {
      return COUNTRY_LIST.find(c => c.code === 'BD') || COUNTRY_LIST[0];
    }
    if (tzLower.includes('kolkata') || tzLower.includes('calcutta') || tzLower.includes('india')) {
      return COUNTRY_LIST.find(c => c.code === 'IN') || COUNTRY_LIST[1];
    }
    if (tzLower.includes('riyadh')) {
      return COUNTRY_LIST.find(c => c.code === 'SA') || COUNTRY_LIST[2];
    }
    if (tzLower.includes('dubai')) {
      return COUNTRY_LIST.find(c => c.code === 'AE') || COUNTRY_LIST[3];
    }
    if (tzLower.includes('muscat')) {
      return COUNTRY_LIST.find(c => c.code === 'OM') || COUNTRY_LIST[4];
    }
    if (tzLower.includes('qatar')) {
      return COUNTRY_LIST.find(c => c.code === 'QA') || COUNTRY_LIST[5];
    }
    if (tzLower.includes('kuwait')) {
      return COUNTRY_LIST.find(c => c.code === 'KW') || COUNTRY_LIST[6];
    }
    if (tzLower.includes('kuala_lumpur') || tzLower.includes('kuching') || tzLower.includes('malaysia')) {
      return COUNTRY_LIST.find(c => c.code === 'MY') || COUNTRY_LIST[7];
    }
    if (tzLower.includes('singapore')) {
      return COUNTRY_LIST.find(c => c.code === 'SG') || COUNTRY_LIST[8];
    }
    if (tzLower.includes('new_york') || tzLower.includes('chicago') || tzLower.includes('los_angeles') || tzLower.includes('denver') || tzLower.includes('phoenix') || tzLower.includes('detroit') || tzLower.includes('america')) {
      return COUNTRY_LIST.find(c => c.code === 'US') || COUNTRY_LIST[9];
    }
    if (tzLower.includes('london')) {
      return COUNTRY_LIST.find(c => c.code === 'GB') || COUNTRY_LIST[10];
    }
    if (tzLower.includes('toronto') || tzLower.includes('vancouver') || tzLower.includes('edmonton') || tzLower.includes('winnipeg') || tzLower.includes('halifax') || tzLower.includes('canada')) {
      return COUNTRY_LIST.find(c => c.code === 'CA') || COUNTRY_LIST[11];
    }

    // Locale check fallback
    const lang = (navigator.language || '').toLowerCase();
    if (lang.includes('bn-bd')) return COUNTRY_LIST[0]; // BD
    if (lang.includes('bn-in') || lang.includes('hi')) return COUNTRY_LIST[1]; // India
    if (lang.includes('ar-sa')) return COUNTRY_LIST[2]; // Saudi Arabia
    if (lang.includes('ar-ae')) return COUNTRY_LIST[3]; // UAE
  } catch (e) {
    // Ignore error
  }
  return COUNTRY_LIST[0]; // Default to Bangladesh
}

/**
 * Get country standard code from any country name or string
 */
export function normalizeCountryCode(countryStr?: string): string {
  if (!countryStr || countryStr === 'all' || countryStr === 'সকল দেশ' || countryStr === 'All Countries') {
    return 'all';
  }
  const match = COUNTRY_LIST.find(
    c => c.code === countryStr || c.nameBn === countryStr || c.nameEn.toLowerCase() === countryStr.toLowerCase()
  );
  return match ? match.code : 'OTHER';
}

/**
 * Get country display label in specified language
 */
export function getCountryDisplayName(countryStr?: string, lang: 'bn' | 'en' = 'bn'): string {
  if (!countryStr || countryStr === 'all' || countryStr === 'সকল দেশ' || countryStr === 'All Countries') {
    return lang === 'bn' ? 'সকল দেশ' : 'All Countries';
  }
  const match = COUNTRY_LIST.find(
    c => c.code === countryStr || c.nameBn === countryStr || c.nameEn.toLowerCase() === countryStr.toLowerCase()
  );
  if (match) {
    return lang === 'bn' ? match.nameBn : match.nameEn;
  }
  return countryStr;
}

/**
 * Get district display label in specified language
 */
export function getDistrictDisplayName(districtStr?: string, lang: 'bn' | 'en' = 'bn'): string {
  if (!districtStr || districtStr === 'all' || districtStr === 'সকল জেলা' || districtStr === 'All Districts') {
    return lang === 'bn' ? 'সকল জেলা' : 'All Districts';
  }
  const match = ALL_64_DISTRICTS.find(
    d => d.nameBn === districtStr || d.nameEn.toLowerCase() === districtStr.toLowerCase()
  );
  if (match) {
    return lang === 'bn' ? match.nameBn : match.nameEn;
  }
  return districtStr;
}

/**
 * Get Country code or info matching any string
 */
export function findCountryInfo(countryStr?: string): CountryInfo | undefined {
  if (!countryStr) return undefined;
  return COUNTRY_LIST.find(
    c => c.code === countryStr || c.nameBn === countryStr || c.nameEn.toLowerCase() === countryStr.toLowerCase()
  );
}

