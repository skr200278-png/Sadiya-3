# ডিজিটাল খামার প্রো (Digital Farm Pro) 🐔🌾

বাংলাদেশের খামারি ভাইদের জন্য তৈরি পূর্ণাঙ্গ পোল্ট্রি ও ডেইরি ফার্ম ব্যবস্থাপনা ওয়েব ও মোবাইল অ্যাপ্লিকেশান।

## 🚀 কীভাবে প্রজেক্টটি চালু করবেন (How to Run):

### ১. ডিপেন্ডেন্সি ইনস্টল করুন:
```bash
npm install
```

### ২. ডেভেলপমেন্ট সার্ভার চালু করুন:
```bash
npm run dev
```
ব্রাউজারে `http://localhost:3000` বা টার্মিনালের দেওয়া লিংকে প্রবেশ করুন।

### ৩. প্রোডাকশন বিল্ড তৈরি করুন:
```bash
npm run build
```

---

## 📱 Android APK / Play Store AAB তৈরি করার নিয়ম:

এই প্রজেক্টে **Capacitor** কনফিগারেশন যুক্ত রয়েছে। অ্যান্ড্রয়েড অ্যাপ বানাতে নিচের কমান্ডগুলো ব্যবহার করুন:

```bash
# ১. ওয়েব বিল্ড ও সিনক্রোনাইজ
npm run build:android

# ২. অ্যান্ড্রয়েড স্টুডিওতে প্রজেক্ট ওপেন
npm run cap:open:android
```
অ্যান্ড্রয়েড স্টুডিও ওপেন হলে **Build > Build Bundle(s) / APK(s) > Build APK(s)** থেকে সরাসরি APK পেয়ে যাবেন।

---

## ⚙️ প্রযুক্তিগত বৈশিষ্ট্য (Tech Stack):
- **ফ্রন্টএন্ড:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Framer Motion
- **ডেটাবেস ও অথেন্টিকেশন:** Firebase Firestore & Firebase Auth (অফলাইন লোকাল ক্যাশিং সাপোর্টসহ)
- **মোবাইল ও অফলাইন সাপোর্ট:** PWA (Progressive Web App) + Capacitor Mobile Native Wrapper
- **ভয়েস ইনপুট:** বাংলা ভয়েস ও স্পিচ রিকগনিশন
