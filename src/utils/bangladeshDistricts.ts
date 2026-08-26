export interface DistrictInfo {
  nameBn: string;
  nameEn: string;
  divisionBn: string;
  divisionEn: string;
}

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

// District names in Bengali
export const BANGLADESH_DISTRICT_NAMES_BN = ALL_64_DISTRICTS.map(d => d.nameBn).sort((a, b) => a.localeCompare(b, 'bn'));

// Filter options with "সকল জেলা"
export const DISTRICT_FILTER_OPTIONS_BN = ['সকল জেলা', ...BANGLADESH_DISTRICT_NAMES_BN];
