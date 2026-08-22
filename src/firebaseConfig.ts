// Firebase configurations with user's project settings (polty-e357c)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBIEQ7U0awBwchCLsWGvrBezvuKMnr6hcw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "polty-e357c.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://polty-e357c-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "polty-e357c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "polty-e357c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "430922454720",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:430922454720:web:4b5430212812b275af3f25",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3CWH3MX9DW",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "(default)"
};

export default firebaseConfig;
