import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db, offlineSafeDocWrite, handleFirestoreError, OperationType, fastGetDocs } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  ALL_64_DISTRICTS, 
  COUNTRY_LIST, 
  detectUserCountry, 
  getCountryDisplayName, 
  getDistrictDisplayName, 
  normalizeCountryCode,
  findCountryInfo,
  CountryInfo 
} from '../utils/bangladeshDistricts';
import { 
  Stethoscope, 
  Phone, 
  MessageCircle, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Plus, 
  Award, 
  Search, 
  Calendar, 
  HeartHandshake, 
  X, 
  FileText, 
  Activity, 
  HelpCircle,
  PhoneCall,
  UserCheck,
  ChevronRight,
  MapPin,
  Trash2,
  Edit,
  Sparkles,
  UserPlus,
  Crown,
  RefreshCw,
  Check,
  Eye,
  EyeOff,
  Lock,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import AdminFeatureControlCard from '../components/AdminFeatureControlCard';


export interface DoctorProfile {
  id: string;
  userId?: string;
  userEmail?: string;
  nameBn: string;
  nameEn?: string;
  degreeBn: string;
  degreeEn?: string;
  specialty: 'poultry' | 'cattle' | 'fish' | 'all';
  specialtyLabelBn: string;
  specialtyLabelEn?: string;
  instituteBn: string;
  instituteEn?: string;
  country?: string; // Country code (BD, IN, SA, AE, OM, QA, KW, MY, SG, US, GB, CA, OTHER)
  countryNameBn?: string;
  countryNameEn?: string;
  district?: string;
  experienceYears: number;
  phone: string;
  whatsapp: string;
  visitingHoursBn: string;
  visitingHoursEn?: string;
  rating?: number;
  consultationFeeBn: string;
  consultationFeeEn?: string;
  isOnline?: boolean;
  avatarIcon?: string;
  isCommunity?: boolean;
  createdAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

const DEFAULT_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc_1',
    nameBn: 'ডাঃ মো: তরিকুল ইসলাম',
    nameEn: 'Dr. Md. Tariqul Islam',
    degreeBn: 'ডিভিএম (DVM), এমএস ইন পোল্ট্রি সায়েন্স (বাকৃবি)',
    degreeEn: 'DVM, MS in Poultry Science (BAU)',
    specialty: 'poultry',
    specialtyLabelBn: 'পোল্ট্রি ও পাখি বিশেষজ্ঞ (ব্রয়লার, লেয়ার, সোনালী)',
    specialtyLabelEn: 'Poultry & Avian Specialist',
    instituteBn: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (বাকৃবি), ময়মনসিংহ',
    country: 'BD',
    countryNameBn: 'বাংলাদেশ',
    countryNameEn: 'Bangladesh',
    district: 'ময়মনসিংহ',
    experienceYears: 11,
    phone: '+8801711000000',
    whatsapp: '8801711000000',
    visitingHoursBn: 'সকাল ৯:০০ - রাত ৯:০০ (প্রতিদিন)',
    rating: 4.9,
    consultationFeeBn: 'বিনামূল্যে প্রাথমিক পরামর্শ / ৳১০০',
    isOnline: true,
    avatarIcon: '👨‍⚕️'
  },
  {
    id: 'doc_2',
    nameBn: 'ডাঃ শারমিন আক্তার',
    nameEn: 'Dr. Sharmin Akter',
    degreeBn: 'ডিভিএম (DVM), এমএস ইন ভেটেরিনারি মেডিসিন (সিভাসু)',
    degreeEn: 'DVM, MS in Veterinary Medicine (CVASU)',
    specialty: 'cattle',
    specialtyLabelBn: 'ডেইরি ও গবাদি পশু সার্জন (গরু, বাছুর, ছাগল)',
    specialtyLabelEn: 'Dairy & Livestock Vet Surgeon',
    instituteBn: 'চট্টগ্রাম ভেটেরিনারি ও এনিমেল সাইন্সেস বিশ্ববিদ্যালয়',
    country: 'BD',
    countryNameBn: 'বাংলাদেশ',
    countryNameEn: 'Bangladesh',
    district: 'চট্টগ্রাম',
    experienceYears: 9,
    phone: '+8801812000000',
    whatsapp: '8801812000000',
    visitingHoursBn: 'সকাল ১০:০০ - রাত ৮:০০',
    rating: 4.9,
    consultationFeeBn: 'বিনামূল্যে প্রাথমিক পরামর্শ / ৳১৫০',
    isOnline: true,
    avatarIcon: '👩‍⚕️'
  },
  {
    id: 'doc_3',
    nameBn: 'কৃষিবিদ আনিসুর রহমান',
    nameEn: 'Agronomist Anisur Rahman',
    degreeBn: 'বিএসসি ইন ফিশারিজ (অনার্স), এমএস ইন একুয়াকালচার (বাকৃবি)',
    degreeEn: 'BSc Fisheries (Hons), MS in Aquaculture (BAU)',
    specialty: 'fish',
    specialtyLabelBn: 'মাছের রোগ ও পুকুর ব্যবস্থাপনা বিশেষজ্ঞ',
    specialtyLabelEn: 'Fisheries & Aqua Health Specialist',
    instituteBn: 'মৎস্য অনুষদ, বাংলাদেশ কৃষি বিশ্ববিদ্যালয়',
    country: 'BD',
    countryNameBn: 'বাংলাদেশ',
    countryNameEn: 'Bangladesh',
    district: 'ঢাকা',
    experienceYears: 13,
    phone: '+8801913000000',
    whatsapp: '8801913000000',
    visitingHoursBn: 'সকাল ৯:০০ - সন্ধ্যা ৭:০০',
    rating: 4.8,
    consultationFeeBn: 'বিনামূল্যে প্রাথমিক পরামর্শ / ৳১০০',
    isOnline: true,
    avatarIcon: '👨‍🔬'
  },
  {
    id: 'doc_4',
    nameBn: 'ডাঃ মো: কামরুল হাসান',
    nameEn: 'Dr. Md. Kamrul Hasan',
    degreeBn: 'ডিভিএম (DVM), পিজিডি ইন এভিয়ান প্যাথলজি',
    degreeEn: 'DVM, PGD in Avian Pathology',
    specialty: 'poultry',
    specialtyLabelBn: 'পাখির সংক্রামক রোগ ও ভ্যাকসিন কনসালট্যান্ট',
    specialtyLabelEn: 'Avian Infectious Disease & Vaccine Expert',
    instituteBn: 'পোল্ট্রি রিসার্চ অ্যান্ড ডায়াগনস্টিক ল্যাব',
    country: 'BD',
    countryNameBn: 'বাংলাদেশ',
    countryNameEn: 'Bangladesh',
    district: 'গাজীপুর',
    experienceYears: 8,
    phone: '+8801714000000',
    whatsapp: '8801714000000',
    visitingHoursBn: 'বিকাল ৩:০০ - রাত ১০:০০',
    rating: 4.8,
    consultationFeeBn: 'বিনামূল্যে প্রাথমিক পরামর্শ',
    isOnline: true,
    avatarIcon: '👨‍⚕️'
  },
  {
    id: 'doc_5',
    nameBn: 'ডাঃ মাহমুদুল করিম',
    nameEn: 'Dr. Mahmudul Karim',
    degreeBn: 'ডিভিএম (DVM), ক্যাটল রিপ্রোডাকশন অ্যান্ড নিউট্রিশন বিশেষজ্ঞ',
    degreeEn: 'DVM, Cattle Reproduction & Nutrition Specialist',
    specialty: 'cattle',
    specialtyLabelBn: 'ষাঁড় মোটাতাজাকরণ ও গাভীর দুধ উৎপাদন বিশেষজ্ঞ',
    specialtyLabelEn: 'Beef Fattening & Dairy Nutrition Specialist',
    instituteBn: 'প্রাণিসম্পদ গবেষণা ইনস্টিটিউট (BLRI), সাভার',
    country: 'BD',
    countryNameBn: 'বাংলাদেশ',
    countryNameEn: 'Bangladesh',
    district: 'ঢাকা',
    experienceYears: 14,
    phone: '+8801615000000',
    whatsapp: '8801615000000',
    visitingHoursBn: 'সকাল ১০:০০ - রাত ৯:০০',
    rating: 5.0,
    consultationFeeBn: 'বিনামূল্যে প্রাথমিক পরামর্শ',
    isOnline: true,
    avatarIcon: '👨‍⚕️'
  },
  {
    id: 'doc_6',
    nameBn: 'ডাঃ রাজেশ শর্মা',
    nameEn: 'Dr. Rajesh Sharma',
    degreeBn: 'BVSc & AH, MVSc (Livestock Production)',
    degreeEn: 'BVSc & AH, MVSc (Livestock Production)',
    specialty: 'cattle',
    specialtyLabelBn: 'ডেইরি ও গবাদি পশু স্বাস্থ্য বিশেষজ্ঞ',
    specialtyLabelEn: 'Dairy & Ruminant Health Consultant',
    instituteBn: 'West Bengal University of Animal & Fishery Sciences, Kolkata',
    country: 'IN',
    countryNameBn: 'ভারত',
    countryNameEn: 'India',
    district: 'Kolkata',
    experienceYears: 10,
    phone: '+919830000000',
    whatsapp: '919830000000',
    visitingHoursBn: 'সকাল ১০:০০ - বিকাল ৫:০০ (IST)',
    rating: 4.9,
    consultationFeeBn: '₹150 / অনলাইন কনসাল্টেশন',
    isOnline: true,
    avatarIcon: '👨‍⚕️'
  },
  {
    id: 'doc_7',
    nameBn: 'ডাঃ তারিক আল-মানসুর',
    nameEn: 'Dr. Tariq Al-Mansoor',
    degreeBn: 'DVM, Specialist in Livestock & Avian Diseases',
    degreeEn: 'DVM, Specialist in Livestock & Avian Diseases',
    specialty: 'poultry',
    specialtyLabelBn: 'পোল্ট্রি ও খামার রোগ বিশেষজ্ঞ',
    specialtyLabelEn: 'Poultry & Livestock Disease Specialist',
    instituteBn: 'Riyadh Veterinary Medical Center, Saudi Arabia',
    country: 'SA',
    countryNameBn: 'সৌদি আরব',
    countryNameEn: 'Saudi Arabia',
    district: 'Riyadh',
    experienceYears: 12,
    phone: '+966500000000',
    whatsapp: '966500000000',
    visitingHoursBn: 'বিকাল ৪:০০ - রাত ১০:০০ (AST)',
    rating: 5.0,
    consultationFeeBn: 'বিনামূল্যে প্রাথমিক পরামর্শ / 50 SAR',
    isOnline: true,
    avatarIcon: '👨‍⚕️'
  },
  {
    id: 'doc_8',
    nameBn: 'ডাঃ আহমাদ ফায়েজ',
    nameEn: 'Dr. Ahmad Faiz',
    degreeBn: 'DVM, MS in Aquaculture & Fish Health',
    degreeEn: 'DVM, MS in Aquaculture & Fish Health',
    specialty: 'fish',
    specialtyLabelBn: 'মাছের রোগ ও একুয়াকালচার বিশেষজ্ঞ',
    specialtyLabelEn: 'Aquatic Animal Health Consultant',
    instituteBn: 'Universiti Putra Malaysia (UPM), Selangor',
    country: 'MY',
    countryNameBn: 'মালয়েশিয়া',
    countryNameEn: 'Malaysia',
    district: 'Kuala Lumpur',
    experienceYears: 9,
    phone: '+60120000000',
    whatsapp: '60120000000',
    visitingHoursBn: 'সকাল ৯:০০ - সন্ধ্যা ৬:০০ (MYT)',
    rating: 4.8,
    consultationFeeBn: 'RM 20 / অনলাইন পরামর্শ',
    isOnline: true,
    avatarIcon: '👨‍🔬'
  }
];

export default function DoctorConsultation() {
  const { language } = useLanguage();
  const { currentUser, isDemoUser } = useAuth();
  const { hasAccess, openSubscriptionModal } = useSystemConfig();
  
  // Master Admin check
  const isAdmin = currentUser?.email === 'skabusufian452@gmail.com' || (currentUser as any)?.role === 'admin';

  // Auto-detect user country
  const detectedUserCountry = detectUserCountry();

  // Doctors state
  const [communityDoctors, setCommunityDoctors] = useState<DoctorProfile[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<'all' | 'my_ads' | 'poultry' | 'cattle' | 'fish'>('all');
  
  // Country & District Filter States
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('khamar_selected_country');
      if (saved) return saved;
    } catch {}
    return detectedUserCountry.code || 'BD';
  });
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hidden / Deleted default doctors state (for admin moderation)
  const [deletedDefaultDoctorIds, setDeletedDefaultDoctorIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('deleted_default_doctors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Case Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctorForModal, setSelectedDoctorForModal] = useState<DoctorProfile | null>(null);
  
  // Case Form State
  const [farmType, setFarmType] = useState('poultry');
  const [animalCount, setAnimalCount] = useState('');
  const [animalAge, setAnimalAge] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [details, setDetails] = useState('');
  const [urgency, setUrgency] = useState<'routine' | 'emergency'>('emergency');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
  const [submitting, setSubmitting] = useState(false);
  
  // Post Doctor Profile Modal State
  const [isDoctorPostModalOpen, setIsDoctorPostModalOpen] = useState(false);
  const [docPosting, setDocPosting] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    nameBn: '',
    degreeBn: '',
    specialty: 'poultry' as 'poultry' | 'cattle' | 'fish' | 'all',
    specialtyLabelBn: '',
    instituteBn: '',
    country: selectedCountry === 'all' ? 'BD' : (selectedCountry || 'BD'),
    district: 'ঢাকা',
    cityOrState: '',
    experienceYears: '3',
    phone: '',
    whatsapp: '',
    visitingHoursBn: 'সকাল ৯:০০ - রাত ৯:০০',
    consultationFeeBn: 'বিনামূল্যে প্রাথমিক পরামর্শ'
  });

  // Save selected country to localStorage for consistent user experience
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedDistrict('all');
    try {
      localStorage.setItem('khamar_selected_country', countryCode);
    } catch {}
  };

  // Doctor Profile to Delete
  const [docToDelete, setDocToDelete] = useState<DoctorProfile | null>(null);

  // My consultation tickets
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    loadCommunityDoctors();
    loadMyTickets();
  }, [currentUser, isDemoUser]);

  // Load Community Doctor Ads
  const loadCommunityDoctors = async () => {
    if (isDemoUser) {
      const saved = localStorage.getItem('demo_community_doctors');
      if (saved) {
        setCommunityDoctors(JSON.parse(saved));
      }
      return;
    }

    try {
      const q = collection(db, 'doctor_listings');
      const snapshot = await fastGetDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DoctorProfile));
      // Sort new ones first
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setCommunityDoctors(list);
    } catch (err) {
      console.warn('Error loading community doctors:', err);
    }
  };

  const loadMyTickets = async () => {
    if (!currentUser && !isDemoUser) return;
    
    if (isDemoUser) {
      const saved = localStorage.getItem('demo_consultation_tickets');
      if (saved) {
        setTickets(JSON.parse(saved));
      } else {
        const dummy = [
          {
            id: 'ticket_demo_1',
            farmType: 'poultry',
            symptoms: 'চুনা পায়খানা ও খাবার কম খাওয়া',
            details: 'ব্রয়লার মুরগির বয়স ২১ দিন। আজ সকাল থেকে ৫টি মুরগি ঝিমাচ্ছে।',
            doctorName: 'ডাঃ মো: তরিকুল ইসলাম',
            status: 'reviewed',
            advice: 'মুরগিগুলোকে দ্রুত আলাদা করুন। সিপ্রোফ্লক্সাসিন ১ মিলি প্রতি লিটার পানিতে ৩ দিন চালান ও স্যালাইন দিন।',
            date: new Date().toISOString().split('T')[0]
          }
        ];
        setTickets(dummy);
        localStorage.setItem('demo_consultation_tickets', JSON.stringify(dummy));
      }
      return;
    }

    try {
      const q = query(
        collection(db, 'consultations'),
        where('userId', '==', currentUser!.uid)
      );
      const snapshot = await fastGetDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setTickets(list);
    } catch (err) {
      console.warn('Error fetching tickets:', err);
    }
  };

  const handleOpenConsultModal = (doc?: DoctorProfile) => {
    setSelectedDoctorForModal(doc || null);
    if (doc) {
      if (doc.specialty !== 'all') {
        setFarmType(doc.specialty);
      }
    }
    setIsModalOpen(true);
  };

  // Helper for Auto-Expiry Calculation (30 Days default validity)
  const getExpiryInfo = (docProfile: DoctorProfile) => {
    if (!docProfile.isCommunity && !docProfile.createdAt) {
      return { 
        isExpired: false, 
        daysLeft: 365, 
        isPermanent: true, 
        label: language === 'bn' ? 'ভেরিফাইড স্থায়ী প্রোফাইল' : 'Permanent Verified' 
      };
    }

    const created = docProfile.createdAt ? new Date(docProfile.createdAt).getTime() : Date.now();
    // Default 30 days if not explicitly set
    const expiryTime = docProfile.expiresAt 
      ? new Date(docProfile.expiresAt).getTime() 
      : created + (30 * 24 * 60 * 60 * 1000);
    
    const diffMs = expiryTime - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = diffDays <= 0 || docProfile.isActive === false;

    return {
      isExpired,
      daysLeft: Math.max(0, diffDays),
      isPermanent: false,
      expiryDateFormatted: new Date(expiryTime).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }),
      label: isExpired 
        ? (language === 'bn' ? '⚠️ মেয়াদ শেষ (বন্ধ)' : '⚠️ Expired') 
        : (language === 'bn' ? `⏳ মেয়াদ বাকি: ${diffDays} দিন` : `⏳ ${diffDays} days left`)
    };
  };

  // Submit Doctor Profile / Advertisement
  const handlePostDoctorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.nameBn.trim()) {
      toast.error(language === 'bn' ? 'ডাক্তারের নাম লিখুন' : 'Doctor name is required');
      return;
    }
    if (!doctorForm.phone.trim()) {
      toast.error(language === 'bn' ? 'মোবাইল নম্বর প্রদান করুন' : 'Phone number is required');
      return;
    }

    setDocPosting(true);

    const specialtyLabels: Record<string, string> = {
      poultry: 'পোল্ট্রি ও পাখি বিশেষজ্ঞ (ব্রয়লার, লেয়ার, সোনালী)',
      cattle: 'ডেইরি ও গবাদি পশু বিশেষজ্ঞ (গরু, ছাগল, ভেড়া)',
      fish: 'মৎস্য রোগ ও আধুনিক মাছ চাষ বিশেষজ্ঞ',
      all: 'সার্বিক প্রাণিসম্পদ ও মৎস্য পরামর্শক'
    };

    // Calculate 30-day auto expiry date
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const countryInfo = findCountryInfo(doctorForm.country) || COUNTRY_LIST[0];
    const finalDistrict = doctorForm.country === 'BD' 
      ? doctorForm.district 
      : (doctorForm.cityOrState.trim() || doctorForm.district || countryInfo.nameEn);

    const newDocData: Omit<DoctorProfile, 'id'> = {
      userId: currentUser?.uid || 'demo_user',
      userEmail: currentUser?.email || '',
      nameBn: doctorForm.nameBn.trim(),
      nameEn: doctorForm.nameBn.trim(),
      degreeBn: doctorForm.degreeBn.trim() || 'ডিভিএম / প্রাণিসম্পদ বিশেষজ্ঞ',
      degreeEn: doctorForm.degreeBn.trim(),
      specialty: doctorForm.specialty,
      specialtyLabelBn: doctorForm.specialtyLabelBn.trim() || specialtyLabels[doctorForm.specialty],
      specialtyLabelEn: specialtyLabels[doctorForm.specialty],
      instituteBn: doctorForm.instituteBn.trim() || (language === 'bn' ? 'ভেটেরিনারি প্র্যাকটিশনার / চেম্বার' : 'Veterinary Practitioner / Chamber'),
      instituteEn: doctorForm.instituteBn.trim() || 'Veterinary Practitioner / Chamber',
      country: doctorForm.country || 'BD',
      countryNameBn: countryInfo.nameBn,
      countryNameEn: countryInfo.nameEn,
      district: finalDistrict,
      experienceYears: Number(doctorForm.experienceYears) || 3,
      phone: doctorForm.phone.trim(),
      whatsapp: (doctorForm.whatsapp.trim() || doctorForm.phone.trim()).replace(/[^0-9]/g, ''),
      visitingHoursBn: doctorForm.visitingHoursBn.trim() || (language === 'bn' ? 'সকাল ৯:০০ - রাত ৯:০০' : '9:00 AM - 9:00 PM'),
      visitingHoursEn: doctorForm.visitingHoursBn.trim() || '9:00 AM - 9:00 PM',
      rating: 5.0,
      consultationFeeBn: doctorForm.consultationFeeBn.trim() || (language === 'bn' ? 'বিনামূল্যে প্রাথমিক পরামর্শ' : 'Free consultation'),
      consultationFeeEn: doctorForm.consultationFeeBn.trim() || 'Free consultation',
      isOnline: true,
      avatarIcon: doctorForm.specialty === 'fish' ? '👨‍🔬' : '👨‍⚕️',
      isCommunity: true,
      createdAt: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
      isActive: true
    };

    try {
      if (isDemoUser) {
        const item: DoctorProfile = { id: 'community_doc_' + Date.now(), ...newDocData };
        const updated = [item, ...communityDoctors];
        setCommunityDoctors(updated);
        localStorage.setItem('demo_community_doctors', JSON.stringify(updated));
      } else {
        const docRef = await offlineSafeDocWrite(addDoc(collection(db, 'doctor_listings'), {
          ...newDocData,
          serverTimestamp: serverTimestamp()
        }));
        const item: DoctorProfile = { id: docRef ? docRef.id : 'temp_' + Date.now(), ...newDocData };
        setCommunityDoctors(prev => [item, ...prev]);
      }

      toast.success(language === 'bn' ? 'ডাক্তার হিসেবে আপনার বিজ্ঞাপন ৩০ দিনের জন্য প্রকাশিত হয়েছে!' : 'Doctor profile published for 30 days!');
      setIsDoctorPostModalOpen(false);
      // Reset form
      setDoctorForm({
        nameBn: '',
        degreeBn: '',
        specialty: 'poultry',
        specialtyLabelBn: '',
        instituteBn: '',
        country: selectedCountry === 'all' ? 'BD' : (selectedCountry || 'BD'),
        district: 'ঢাকা',
        cityOrState: '',
        experienceYears: '3',
        phone: '',
        whatsapp: '',
        visitingHoursBn: 'সকাল ৯:০০ - রাত ৯:০০',
        consultationFeeBn: 'বিনামূল্যে প্রাথমিক পরামর্শ'
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'doctor_listings');
      toast.error(language === 'bn' ? 'বিজ্ঞাপন প্রকাশ করতে সমস্যা হয়েছে।' : 'Error posting profile');
    } finally {
      setDocPosting(false);
    }
  };

  // Renew Doctor Ad (+30 Days Extension)
  const handleRenewDoctorListing = async (docProfile: DoctorProfile) => {
    try {
      const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      if (isDemoUser) {
        const updated = communityDoctors.map(d => 
          d.id === docProfile.id ? { ...d, expiresAt: newExpiry, isActive: true } : d
        );
        setCommunityDoctors(updated);
        localStorage.setItem('demo_community_doctors', JSON.stringify(updated));
      } else {
        await offlineSafeDocWrite(updateDoc(doc(db, 'doctor_listings', docProfile.id), {
          expiresAt: newExpiry,
          isActive: true
        }));
        setCommunityDoctors(prev => prev.map(d => 
          d.id === docProfile.id ? { ...d, expiresAt: newExpiry, isActive: true } : d
        ));
      }
      toast.success(language === 'bn' ? 'বিজ্ঞাপনের মেয়াদ সফলভাবে ৩০ দিন বৃদ্ধি করা হয়েছে!' : 'Listing extended for 30 days!');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'doctor_listings');
      toast.error(language === 'bn' ? 'মেয়াদ বাড়াতে সমস্যা হয়েছে।' : 'Error renewing listing');
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleDoctorStatus = async (docProfile: DoctorProfile) => {
    try {
      const nextStatus = docProfile.isActive === false ? true : false;
      if (isDemoUser) {
        const updated = communityDoctors.map(d => 
          d.id === docProfile.id ? { ...d, isActive: nextStatus } : d
        );
        setCommunityDoctors(updated);
        localStorage.setItem('demo_community_doctors', JSON.stringify(updated));
      } else {
        await offlineSafeDocWrite(updateDoc(doc(db, 'doctor_listings', docProfile.id), {
          isActive: nextStatus
        }));
        setCommunityDoctors(prev => prev.map(d => 
          d.id === docProfile.id ? { ...d, isActive: nextStatus } : d
        ));
      }
      toast.success(nextStatus 
        ? (language === 'bn' ? 'বিজ্ঞাপন সক্রিয় করা হয়েছে।' : 'Listing activated.') 
        : (language === 'bn' ? 'বিজ্ঞাপন বন্ধ/হাইড করা হয়েছে।' : 'Listing paused.')
      );
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'doctor_listings');
      toast.error('Error toggling status');
    }
  };

  // Delete Doctor Ad (Permitted for Owner & Master Admin)
  const handleDeleteDoctorListing = async (docProfile: DoctorProfile) => {
    try {
      if (!docProfile.isCommunity) {
        // Default verified doctor deletion (by Master Admin)
        const updated = [...deletedDefaultDoctorIds, docProfile.id];
        setDeletedDefaultDoctorIds(updated);
        localStorage.setItem('deleted_default_doctors', JSON.stringify(updated));
        toast.success(language === 'bn' ? 'বিজ্ঞাপনটি স্থায়ীভাবে মুছে ফেলা হয়েছে।' : 'Doctor listing removed.');
        setDocToDelete(null);
        return;
      }

      if (isDemoUser) {
        const updated = communityDoctors.filter(d => d.id !== docProfile.id);
        setCommunityDoctors(updated);
        localStorage.setItem('demo_community_doctors', JSON.stringify(updated));
      } else {
        await offlineSafeDocWrite(deleteDoc(doc(db, 'doctor_listings', docProfile.id)));
        setCommunityDoctors(prev => prev.filter(d => d.id !== docProfile.id));
      }
      toast.success(language === 'bn' ? 'বিজ্ঞাপন সফলভাবে মুছে ফেলা হয়েছে।' : 'Listing deleted successfully.');
      setDocToDelete(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, 'doctor_listings');
      toast.error(language === 'bn' ? 'মুছে ফেলতে সমস্যা হয়েছে।' : 'Error deleting listing');
    }
  };

  // Submit Patient Case
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast.error(language === 'bn' ? 'প্রধান লক্ষণ বা সমস্যা লিখুন' : 'Please specify symptoms');
      return;
    }

    setSubmitting(true);
    const newTicketData = {
      userId: currentUser?.uid || 'demo_user',
      userEmail: currentUser?.email || '',
      farmType,
      animalCount: animalCount ? Number(animalCount) : null,
      animalAge: animalAge.trim(),
      symptoms: symptoms.trim(),
      details: details.trim(),
      urgency,
      phone: phone.trim(),
      doctorName: selectedDoctorForModal ? selectedDoctorForModal.nameBn : 'অনলাইন ভেটেরিনারি বোর্ড',
      doctorId: selectedDoctorForModal?.id || 'general',
      status: 'pending',
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      advice: ''
    };

    try {
      if (isDemoUser) {
        const updated = [{ id: 'ticket_' + Date.now(), ...newTicketData }, ...tickets];
        setTickets(updated);
        localStorage.setItem('demo_consultation_tickets', JSON.stringify(updated));
      } else {
        await offlineSafeDocWrite(addDoc(collection(db, 'consultations'), {
          ...newTicketData,
          serverTimestamp: serverTimestamp()
        }));
        setTickets(prev => [{ id: 'temp_' + Date.now(), ...newTicketData }, ...prev]);
      }

      toast.success(language === 'bn' ? 'ডাক্তারের কাছে আপনার কেস পাঠানো হয়েছে! দ্রুত উত্তর পাবেন।' : 'Case submitted! Doctor will review shortly.');
      setIsModalOpen(false);
      setSymptoms('');
      setDetails('');
      setAnimalCount('');
      setAnimalAge('');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'consultations');
      toast.error(language === 'bn' ? 'তথ্য পাঠাতে সমস্যা হয়েছে।' : 'Error submitting case');
    } finally {
      setSubmitting(false);
    }
  };

  // Merge community doctors + default doctors
  const allDoctors = [...communityDoctors, ...DEFAULT_DOCTORS];

  // Count user's ads
  const myAdsCount = allDoctors.filter(doc => {
    if (deletedDefaultDoctorIds.includes(doc.id)) return false;
    return Boolean(
      (currentUser && doc.userId === currentUser.uid) || 
      (doc.userEmail && currentUser?.email && doc.userEmail === currentUser.email) ||
      (isDemoUser && doc.isCommunity)
    );
  }).length;

  const filteredDoctors = allDoctors.filter(doc => {
    // Exclude deleted default doctors
    if (deletedDefaultDoctorIds.includes(doc.id)) return false;

    const expiry = getExpiryInfo(doc);

    // If "My Ads" filter tab is active
    if (selectedSpecialty === 'my_ads') {
      const isMine = (currentUser && doc.userId === currentUser.uid) || 
                     (doc.userEmail && currentUser?.email && doc.userEmail === currentUser.email) ||
                     (isDemoUser && doc.isCommunity);
      return isMine;
    }

    // In general public list: hide expired ads unless user is Master Admin
    if (expiry.isExpired && !isAdmin) {
      return false;
    }

    // Specialty filter
    const matchesSpecialty = selectedSpecialty === 'all' || doc.specialty === selectedSpecialty || doc.specialty === 'all';

    // Country filter
    if (selectedCountry !== 'all') {
      const docCountry = normalizeCountryCode(doc.country || 'BD');
      if (docCountry !== selectedCountry) {
        return false;
      }
    }

    // District filter
    if (selectedDistrict !== 'all') {
      const matchesDistrict = doc.district && (
        doc.district.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
        (selectedDistrict === 'ঢাকা' && doc.district.toLowerCase().includes('dhaka')) ||
        (selectedDistrict === 'চট্টগ্রাম' && doc.district.toLowerCase().includes('chittagong'))
      );
      if (!matchesDistrict) return false;
    }

    // Search text filter
    const matchesSearch = searchQuery === '' || 
      doc.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (doc.nameEn && doc.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.specialtyLabelBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.specialtyLabelEn && doc.specialtyLabelEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.instituteBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.instituteEn && doc.instituteEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.district && doc.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.countryNameBn && doc.countryNameBn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.countryNameEn && doc.countryNameEn.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSpecialty && matchesSearch;
  });

  const handleOpenDoctorPostModal = () => {
    if (!hasAccess('doctorListingFree')) {
      openSubscriptionModal(
        language === 'bn' ? 'ডাক্তার হিসেবে প্রোফাইল ও বিজ্ঞাপন' : 'Doctor Profile Listing',
        language === 'bn' ? 'ডাক্তার তালিকায় আপনার প্রোফাইল ও বিজ্ঞাপন দেওয়ার সুবিধাটি সক্রিয় করতে সরাসরি অ্যাপস অ্যাডমিনের সাথে যোগাযোগ করুন।' : 'To post doctor listings, please contact the admin for account activation.'
      );
      return;
    }
    setIsDoctorPostModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header Banner & Actions */}
      <div className="bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex items-start justify-between relative z-10 gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/40 text-[10px] font-black uppercase tracking-wider mb-1.5">
              <ShieldCheck size={12} className="text-teal-300" />
              <span>{language === 'bn' ? 'নিবন্ধিত ভেটেরিনারি ও ডাক্তার প্ল্যাটফর্ম' : 'Verified Vet Platform'}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              {language === 'bn' ? 'ডাক্তারি পরামর্শ ও টেলিমেডিসিন' : 'Veterinary Doctor & Telemedicine'}
            </h2>
            <p className="text-xs text-teal-100/90 mt-0.5 max-w-md leading-relaxed">
              {language === 'bn' 
                ? 'খামারের পাখি, পশু বা মাছের যেকোনো রোগ ও সমস্যায় অভিজ্ঞ প্রাণিসম্পদ ডাক্তারদের সরাসরি পরামর্শ নিন অথবা ডাক্তার হিসেবে যোগ দিন।' 
                : 'Get instant veterinary advice for farm animals or register as a veterinarian.'}
            </p>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
            <Stethoscope size={28} className="text-emerald-300" />
          </div>
        </div>

        {/* Dual Primary Action Buttons: Doctor Register & Ask Doctor */}
        <div className="mt-3.5 pt-3 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-2 relative z-10">
          <button
            onClick={handleOpenDoctorPostModal}
            className="flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black p-2.5 rounded-2xl shadow-sm transition-all active:scale-98 cursor-pointer border border-emerald-400/40 group"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UserPlus size={18} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-[9px] text-teal-200 font-bold uppercase">{language === 'bn' ? 'ডাক্তারদের জন্য' : 'For Doctors'}</p>
                <p className="text-xs font-black">{language === 'bn' ? 'ডাক্তার হিসেবে প্রোফাইল / বিজ্ঞাপন দিন' : 'Post Vet Doctor Profile'}</p>
              </div>
            </div>
            <ChevronRight size={16} />
          </button>

          <a
            href="tel:16123"
            className="flex items-center justify-between bg-white/15 hover:bg-white/25 active:scale-98 transition-all p-2.5 rounded-2xl border border-white/20 group"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center animate-pulse">
                <PhoneCall size={16} />
              </div>
              <div className="text-left">
                <p className="text-[9px] text-teal-200 font-bold uppercase">{language === 'bn' ? 'সরকারি প্রাণিসম্পদ হটলাইন' : 'Govt Vet Helpline'}</p>
                <p className="text-sm font-black text-white font-sans">১৬১২৩ (16123)</p>
              </div>
            </div>
            <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">
              {language === 'bn' ? 'টোল ফ্রি' : 'Free'}
            </span>
          </a>
        </div>
      </div>

      {/* Master Admin Controls Card if logged in as skabusufian452@gmail.com */}
      {isAdmin && <AdminFeatureControlCard />}


      {/* 2. Filters & Search Box */}
      <div className="bg-white rounded-2xl p-3 shadow-2xs border border-slate-150 space-y-2.5">
        {/* Category Tabs including 'My Ads' */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-1.5">
          <button
            onClick={() => setSelectedSpecialty('all')}
            className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedSpecialty === 'all'
                ? 'bg-slate-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100 bg-slate-50'
            }`}
          >
            <span>🏥</span>
            <span className="text-xs">{language === 'bn' ? 'সকল ডাক্তার' : 'All'}</span>
          </button>

          <button
            onClick={() => setSelectedSpecialty('my_ads')}
            className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
              selectedSpecialty === 'my_ads'
                ? 'bg-teal-700 text-white shadow-xs font-black ring-2 ring-teal-500/50'
                : 'text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200'
            }`}
          >
            <span>📋</span>
            <span className="text-xs">{language === 'bn' ? 'আমার বিজ্ঞাপন' : 'My Ads'}</span>
            {myAdsCount > 0 && (
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                selectedSpecialty === 'my_ads' ? 'bg-white text-teal-800' : 'bg-teal-600 text-white'
              }`}>
                {myAdsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedSpecialty('poultry')}
            className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedSpecialty === 'poultry'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-emerald-50 bg-slate-50'
            }`}
          >
            <span>🐦</span>
            <span className="text-xs">{language === 'bn' ? 'মুরগি/পাখি' : 'Poultry'}</span>
          </button>

          <button
            onClick={() => setSelectedSpecialty('cattle')}
            className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedSpecialty === 'cattle'
                ? 'bg-amber-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-amber-50 bg-slate-50'
            }`}
          >
            <span>🐄</span>
            <span className="text-xs">{language === 'bn' ? 'পশু/গরু' : 'Cattle'}</span>
          </button>

          <button
            onClick={() => setSelectedSpecialty('fish')}
            className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1 ${
              selectedSpecialty === 'fish'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-blue-50 bg-slate-50'
            }`}
          >
            <span>🐟</span>
            <span className="text-xs">{language === 'bn' ? 'মাছ চাষ' : 'Fisheries'}</span>
          </button>
        </div>

        {/* Search, Country & District Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
          {/* Search input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'ডাক্তারের নাম, ডিগ্রি বা এলাকা খুঁজুন...' : 'Search doctor by name, degree, area...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Country Selector */}
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">🌐 {language === 'bn' ? 'সকল দেশ (সারাবিশ্ব)' : 'All Countries (Global)'}</option>
              {COUNTRY_LIST.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {getCountryDisplayName(c.code, language)}
                </option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            {selectedCountry === 'BD' || selectedCountry === 'all' ? (
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="all">📍 {language === 'bn' ? 'সকল জেলা (সারাদেশ)' : 'All Districts'}</option>
                {ALL_64_DISTRICTS.map((d) => (
                  <option key={d.nameBn} value={d.nameBn}>
                    📍 {language === 'bn' ? d.nameBn : d.nameEn}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder={language === 'bn' ? 'শহর / প্রদেশ / স্টেট দিয়ে ফিল্টার...' : 'Filter by city / state...'}
                value={selectedDistrict === 'all' ? '' : selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value || 'all')}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. My Active Consultation Tickets (if any) */}
      {tickets.length > 0 && (
        <div className="bg-white rounded-2xl p-3.5 shadow-2xs border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <FileText size={15} className="text-indigo-600" />
              {language === 'bn' ? 'আপনার পরামর্শ ও প্রেসক্রিপশন হিস্ট্রি' : 'My Consultations'}
            </h3>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              {tickets.length} {language === 'bn' ? 'টি কেস' : 'tickets'}
            </span>
          </div>

          <div className="space-y-2">
            {tickets.slice(0, 3).map((t, idx) => (
              <div key={t.id || idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1">
                    <span>{t.farmType === 'cattle' ? '🐄' : t.farmType === 'fish' ? '🐟' : '🐦'}</span>
                    <span>{t.symptoms}</span>
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                    t.status === 'reviewed' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {t.status === 'reviewed' 
                      ? (language === 'bn' ? '✓ পরামর্শ দেওয়া হয়েছে' : 'Reviewed') 
                      : (language === 'bn' ? '⏳ ডাক্তার পর্যালোচনা করছেন' : 'Pending Review')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mb-1">{t.details}</p>
                {t.advice && (
                  <div className="mt-1.5 p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                    <p className="text-[10px] font-black text-emerald-800 mb-0.5">
                      🩺 {language === 'bn' ? 'ডাক্তারের পরামর্শ ও প্রেসক্রিপশন:' : 'Doctor Advice:'}
                    </p>
                    <p className="text-[11px] font-medium leading-relaxed">{t.advice}</p>
                  </div>
                )}
                <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                  <span>{t.doctorName}</span>
                  <span>{t.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Doctors Directory Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Award size={15} className="text-emerald-600" />
            {language === 'bn' ? 'তালিকাভুক্ত প্রাণিসম্পদ ও মৎস্য ডাক্তারগণ' : 'Veterinarians & Aqua Specialists'}
          </h3>
          <span className="text-[10px] font-bold text-slate-500">
            {filteredDoctors.length} {language === 'bn' ? 'জন ডাক্তার প্রদর্শিত' : 'doctors found'}
          </span>
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200">
            <Stethoscope size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">
              {selectedSpecialty === 'my_ads' 
                ? (language === 'bn' ? 'আপনার কোনো সক্রিয় ডাক্তার বিজ্ঞাপন নেই।' : 'You have no active doctor listings.') 
                : (language === 'bn' ? 'এই ক্যাটাগরি বা জেলায় কোনো ডাক্তার পাওয়া যায়নি।' : 'No doctor found for this filter.')}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
              {language === 'bn' ? 'নতুন ডাক্তার বা কনসালট্যান্ট বিজ্ঞাপন পোস্ট করতে নিচের বাটনে চাপ দিন।' : 'Post a doctor listing now!'}
            </p>
            <button
              onClick={() => setIsDoctorPostModalOpen(true)}
              className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              + {language === 'bn' ? 'ডাক্তার হিসেবে বিজ্ঞাপন দিন' : 'Post Vet Listing'}
            </button>
          </div>
        ) : (
          filteredDoctors.map(doctor => {
            const isMyListing = Boolean(
              (currentUser && doctor.userId === currentUser.uid) || 
              (doctor.userEmail && currentUser?.email && doctor.userEmail === currentUser.email) ||
              (isDemoUser && doctor.isCommunity)
            );
            const canManage = isMyListing || isAdmin;
            const expiry = getExpiryInfo(doctor);

            return (
              <div 
                key={doctor.id}
                className={`bg-white rounded-2xl p-3.5 shadow-2xs border transition-all relative overflow-hidden ${
                  expiry.isExpired 
                    ? 'border-rose-300 bg-rose-50/20' 
                    : canManage
                      ? 'border-teal-300 shadow-xs'
                      : 'border-slate-200/80 hover:border-emerald-300'
                }`}
              >
                {/* Expiry / Status Header Indicator */}
                <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-slate-100 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {doctor.isCommunity ? (
                      <span className="font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full uppercase shrink-0">
                        {language === 'bn' ? 'কমিউনিটি বিজ্ঞাপন' : 'Community Ad'}
                      </span>
                    ) : (
                      <span className="font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase shrink-0">
                        {language === 'bn' ? 'ভেরিফাইড ডাক্তার' : 'Verified Vet'}
                      </span>
                    )}

                    {canManage && (
                      <span className="font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        {isAdmin && !isMyListing ? <Crown size={10} className="text-amber-700" /> : <Check size={10} className="text-emerald-700" />}
                        <span>{isMyListing ? (language === 'bn' ? 'আমার বিজ্ঞাপন' : 'My Ad') : (language === 'bn' ? 'মাস্টার অ্যাডমিন' : 'Master Admin')}</span>
                      </span>
                    )}
                  </div>

                  {/* Expiry Pill */}
                  <div className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0 ${
                    expiry.isExpired 
                      ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                      : expiry.isPermanent
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    <span>{expiry.label}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                    {doctor.avatarIcon || '👨‍⚕️'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                        {doctor.nameBn}
                      </h4>

                      <div className="flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded-md border border-amber-200 shrink-0">
                        <span>★</span>
                        <span>{doctor.rating || 4.9}</span>
                      </div>
                    </div>

                    <p className="text-[10.5px] font-bold text-emerald-700 leading-tight mt-0.5">
                      {doctor.degreeBn}
                    </p>

                    <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                      {doctor.specialtyLabelBn}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9.5px] text-slate-500 font-semibold mt-1">
                      <span>🏛️ {doctor.instituteBn}</span>
                      {doctor.country && (
                        <>
                          <span>•</span>
                          <span className="text-teal-700 font-bold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                            {findCountryInfo(doctor.country)?.flag || '🌐'} {getCountryDisplayName(doctor.country, language)}
                          </span>
                        </>
                      )}
                      {doctor.district && (
                        <>
                          <span>•</span>
                          <span className="text-slate-700 font-bold">📍 {getDistrictDisplayName(doctor.district, language)}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>⏳ {doctor.experienceYears} {language === 'bn' ? 'বছরের অভিজ্ঞতা' : 'yrs exp'}</span>
                    </div>

                    <div className="text-[10px] text-slate-600 mt-1.5 flex items-center justify-between">
                      <span>⏰ {doctor.visitingHoursBn}</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {doctor.consultationFeeBn}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Public Action Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={`tel:${doctor.phone}`}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <Phone size={13} />
                    <span>{language === 'bn' ? 'সরাসরি কল' : 'Call'}</span>
                  </a>

                  <a
                    href={`https://wa.me/${doctor.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      language === 'bn' 
                        ? `আসসালামু আলাইকুম ${doctor.nameBn}, ডিজিটাল খামার অ্যাপ থেকে আপনার পরামর্শ নিতে চাচ্ছি।` 
                        : `Hello Doctor, I need veterinary consultation for my farm.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-2 bg-green-600 hover:bg-green-700 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <MessageCircle size={13} />
                    <span>{language === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                  </a>

                  <button
                    onClick={() => handleOpenConsultModal(doctor)}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title={language === 'bn' ? 'অনলাইন প্রেসক্রিপশন অনুরোধ' : 'Online Case'}
                  >
                    <FileText size={13} />
                    <span className="hidden sm:inline">{language === 'bn' ? 'প্রেসক্রিপশন' : 'Request'}</span>
                  </button>
                </div>

                {/* Special Management Bar for Creator & Master Admin */}
                {canManage && (
                  <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 bg-slate-50/80 -mx-3.5 -mb-3.5 p-2.5 flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      {/* Delete Button */}
                      <button
                        onClick={() => setDocToDelete(doctor)}
                        className="py-1 px-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                        title={language === 'bn' ? 'বিজ্ঞাপনটি ডিলিট করুন' : 'Delete Advertisement'}
                      >
                        <Trash2 size={13} />
                        <span>{language === 'bn' ? 'বিজ্ঞাপন ডিলিট' : 'Delete Ad'}</span>
                      </button>

                      {/* Renew 30 Days Button */}
                      {doctor.isCommunity && (
                        <button
                          onClick={() => handleRenewDoctorListing(doctor)}
                          className="py-1 px-2 bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title={language === 'bn' ? 'মেয়াদ ৩০ দিন বাড়ান' : 'Renew 30 Days'}
                        >
                          <RefreshCw size={12} className="text-teal-600" />
                          <span>{language === 'bn' ? '+৩০ দিন বৃদ্ধি' : '+30 Days'}</span>
                        </button>
                      )}
                    </div>

                    {/* Toggle Active/Inactive */}
                    {doctor.isCommunity && (
                      <button
                        onClick={() => handleToggleDoctorStatus(doctor)}
                        className={`py-1 px-2 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer border ${
                          doctor.isActive === false
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {doctor.isActive === false ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{doctor.isActive === false ? (language === 'bn' ? 'চালু করুন' : 'Activate') : (language === 'bn' ? 'সাময়িক বন্ধ' : 'Pause')}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Emergency First-Aid Quick Guide Accordion */}
      <div className="bg-white rounded-2xl p-3.5 shadow-2xs border border-slate-200">
        <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2.5">
          <AlertTriangle size={15} className="text-amber-500" />
          {language === 'bn' ? 'জরুরি প্রাথমিক চিকিৎসা ও করণীয় গাইড' : 'Emergency Farm First-Aid Guide'}
        </h3>

        <div className="space-y-2 text-xs">
          <div className="bg-red-50/70 p-2.5 rounded-xl border border-red-200">
            <h4 className="font-extrabold text-red-900 mb-1 flex items-center gap-1">
              <span>🐔</span>
              <span>{language === 'bn' ? 'মুরগির ঝিমানো ও সাদা পাতলা পায়খানা:' : 'Poultry Diarrhea & Dullness:'}</span>
            </h4>
            <p className="text-[11px] text-red-800 leading-relaxed font-medium">
              {language === 'bn' 
                ? '১. আক্রান্ত পাখিকে সুস্থ পাখি থেকে আলাদা শেডে রাখুন। ২. পানিতে ইলেকট্রোলাইট স্যালাইন ও ভিটামিন সি দিন। ৩. রেজিস্টার্ড ডাক্তারের প্রেসক্রিপশন অনুযায়ী এন্টিবায়োটিক প্রয়োগ করুন।' 
                : '1. Isolate sick birds immediately. 2. Provide electrolyte saline & Vitamin C. 3. Consult doctor before antibiotic usage.'}
            </p>
          </div>

          <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
            <h4 className="font-extrabold text-amber-900 mb-1 flex items-center gap-1">
              <span>🐄</span>
              <span>{language === 'bn' ? 'গরুর পেট ফাঁপা বা খাবার বন্ধ হওয়া:' : 'Cattle Bloat & Loss of Appetite:'}</span>
            </h4>
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              {language === 'bn' 
                ? '১. দানাদার খাবার বন্ধ করে শুকনা খড় দিন। ২. ব্লট-স্টপ বা জিংজারিন জাতীয় পাউডার পানিতে গুলে খাওয়ান। ৩. তীব্র শ্বাসকষ্ট হলে দ্রুত ডাক্তারের পরামর্শ নিন।' 
                : '1. Stop concentrate feeds, offer dry straw. 2. Provide anti-bloat suspension. 3. Call vet if breathing is difficult.'}
            </p>
          </div>

          <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200">
            <h4 className="font-extrabold text-blue-900 mb-1 flex items-center gap-1">
              <span>🐟</span>
              <span>{language === 'bn' ? 'মাছ পানির ওপরে ভেসে ওঠা ও খাবি খাওয়া:' : 'Fish Gasping at Pond Surface:'}</span>
            </h4>
            <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
              {language === 'bn' 
                ? '১. অক্সিজেনের ঘাটতি হলে সাথে সাথে এয়ারেটর মেশিন চালান বা পাম্প দিয়ে পানি ছিটিয়ে দিন। ২. শতাংশে ২৫০ গ্রাম চুন বা জিওলাইট প্রয়োগ করুন।' 
                : '1. Turn on aerator or splash water immediately. 2. Apply agricultural lime or zeolite.'}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Post Doctor Profile / Advertisement Modal */}
      {isDoctorPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-5 w-full max-w-md shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-850">
                    {language === 'bn' ? 'ডাক্তার হিসেবে প্রোফাইল / বিজ্ঞাপন দিন' : 'Register Doctor Profile'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {language === 'bn' ? 'সারাদেশের খামারিদের কাছে আপনার সেবা তুলে ধরুন' : 'Reach thousands of farmers across Bangladesh'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDoctorPostModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePostDoctorProfile} className="space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'ডাক্তার / কনসালট্যান্টের নাম *' : 'Doctor Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'bn' ? 'যেমন: ডাঃ মো: রফিকুল ইসলাম' : 'e.g. Dr. Md. Rafiqul Islam'}
                  value={doctorForm.nameBn}
                  onChange={(e) => setDoctorForm({ ...doctorForm, nameBn: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'ডিগ্রী / শিক্ষাগত যোগ্যতা *' : 'Degree / Qualification *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'bn' ? 'যেমন: DVM, MS (বাকৃবি)' : 'e.g. DVM, MS, BSc'}
                    value={doctorForm.degreeBn}
                    onChange={(e) => setDoctorForm({ ...doctorForm, degreeBn: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'ক্যাটাগরি / বিশেষজ্ঞ ক্ষেত্র' : 'Specialty Category'}
                  </label>
                  <select
                    value={doctorForm.specialty}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="poultry">🐦 পাখি / পোল্ট্রি</option>
                    <option value="cattle">🐄 গবাদি পশু / ডেইরি</option>
                    <option value="fish">🐟 মাছ চাষ / একুয়াকালচার</option>
                    <option value="all">🏥 সার্বিক প্রাণিসম্পদ</option>
                  </select>
                </div>
              </div>

              {/* Country and District/State Selection */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'দেশ নির্বাচন *' : 'Country *'}
                  </label>
                  <select
                    value={doctorForm.country}
                    onChange={(e) => setDoctorForm({ ...doctorForm, country: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {COUNTRY_LIST.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {getCountryDisplayName(c.code, language)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {doctorForm.country === 'BD' 
                      ? (language === 'bn' ? 'জেলা নির্বাচন *' : 'District *') 
                      : (language === 'bn' ? 'শহর / স্টেট *' : 'City / State *')}
                  </label>
                  {doctorForm.country === 'BD' ? (
                    <select
                      value={doctorForm.district}
                      onChange={(e) => setDoctorForm({ ...doctorForm, district: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {ALL_64_DISTRICTS.map((d) => (
                        <option key={d.nameBn} value={d.nameBn}>
                          📍 {language === 'bn' ? d.nameBn : d.nameEn}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder={language === 'bn' ? 'যেমন: রিয়াদ, দুবাই, কলকাতা' : 'e.g. Riyadh, Dubai, Kolkata'}
                      value={doctorForm.cityOrState}
                      onChange={(e) => setDoctorForm({ ...doctorForm, cityOrState: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'চেম্বার / কর্মস্থল প্রতিষ্ঠান' : 'Chamber / Institute'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'যেমন: উপজেলা প্রাণিসম্পদ দপ্তর / নিজস্ব চেম্বার' : 'Chamber or Institute'}
                    value={doctorForm.instituteBn}
                    onChange={(e) => setDoctorForm({ ...doctorForm, instituteBn: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'অভিজ্ঞতা (বছর)' : 'Experience (Yrs)'}
                  </label>
                  <input
                    type="number"
                    placeholder="5"
                    value={doctorForm.experienceYears}
                    onChange={(e) => setDoctorForm({ ...doctorForm, experienceYears: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'পরামর্শ ফি' : 'Consultation Fee'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'যেমন: বিনামূল্যে / ৳১০০ / 50 SAR' : 'e.g. Free / ৳100 / $20'}
                  value={doctorForm.consultationFeeBn}
                  onChange={(e) => setDoctorForm({ ...doctorForm, consultationFeeBn: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'মোবাইল নম্বর (কল) *' : 'Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর' : 'WhatsApp Number'}
                  </label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={doctorForm.whatsapp}
                    onChange={(e) => setDoctorForm({ ...doctorForm, whatsapp: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'পরামর্শ দেওয়ার সময় / ভিজিটিং আওয়ার' : 'Available Visiting Hours'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'যেমন: সকাল ৯:০০ - রাত ৯:০০ (প্রতিদিন)' : 'e.g. 9:00 AM - 9:00 PM'}
                  value={doctorForm.visitingHoursBn}
                  onChange={(e) => setDoctorForm({ ...doctorForm, visitingHoursBn: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDoctorPostModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={docPosting}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>{docPosting ? (language === 'bn' ? 'প্রকাশ হচ্ছে...' : 'Posting...') : (language === 'bn' ? 'বিজ্ঞাপন প্রকাশ করুন' : 'Publish Profile')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Patient Case Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-5 w-full max-w-md shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-850">
                    {language === 'bn' ? 'ডাক্তারের পরামর্শের জন্য লক্ষণ জানান' : 'Submit Case to Doctor'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {selectedDoctorForModal 
                      ? selectedDoctorForModal.nameBn
                      : (language === 'bn' ? 'অনলাইন ভেটেরিনারি বোর্ড' : 'Online Vet Board')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'খামারের ধরণ' : 'Farm Type'}
                </label>
                <select
                  value={farmType}
                  onChange={(e) => setFarmType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="poultry">🐦 {language === 'bn' ? 'পাখি / পোল্ট্রি (মুরগি, হাঁস, কোয়েল)' : 'Poultry & Birds'}</option>
                  <option value="cattle">🐄 {language === 'bn' ? 'পশু পালন (গরু, বাছুর, ছাগল)' : 'Livestock & Cattle'}</option>
                  <option value="fish">🐟 {language === 'bn' ? 'মাছ চাষ (তেলাপিয়া, কার্প, পাঙ্গাস)' : 'Fisheries & Aquaculture'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'বর্তমান বয়স' : 'Animal Age'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'যেমন: ২১ দিন / ২ বছর' : 'e.g. 21 days'}
                    value={animalAge}
                    onChange={(e) => setAnimalAge(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'মোট সংখ্যা' : 'Count'}
                  </label>
                  <input
                    type="number"
                    placeholder={language === 'bn' ? 'যেমন: ৫০০ টি' : 'e.g. 500'}
                    value={animalCount}
                    onChange={(e) => setAnimalCount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'প্রধান লক্ষণ বা সমস্যা *' : 'Main Symptoms *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'bn' ? 'যেমন: চুনা পায়খানা, ঝিমানো, খাবার বন্ধ' : 'e.g. White diarrhea, fever, dullness'}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'বিস্তারিত বর্ণনা (ঔষধ খেয়ে থাকলে জানান)' : 'Detailed Description'}
                </label>
                <textarea
                  rows={3}
                  placeholder={language === 'bn' ? 'কবে থেকে শুরু হয়েছে? কোনো ঔষধ দেওয়া হয়েছে কি না?' : 'When did it start? Any existing medicine given?'}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'আপনার মোবাইল নম্বর (ডাক্তার কল করার জন্য)' : 'Contact Phone Number'}
                </label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  <span>{submitting ? (language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Submitting...') : (language === 'bn' ? 'কেস সাবমিট করুন' : 'Submit Case')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Delete Doctor Listing Confirmation Dialog */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-sm font-extrabold text-slate-850 mb-1">
              {language === 'bn' ? 'ডাক্তার বিজ্ঞাপন মুছে ফেলতে চান?' : 'Delete Doctor Profile?'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {docToDelete.nameBn} - {language === 'bn' ? 'এই বিজ্ঞাপনটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This profile will be permanently deleted.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDocToDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDeleteDoctorListing(docToDelete)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs transition-all shadow-md"
              >
                {language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
