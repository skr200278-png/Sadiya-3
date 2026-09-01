import { initializeApp } from 'firebase/app';
import { getAuth, indexedDBLocalPersistence, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getDocs, getDocsFromCache, Query, DocumentData, QuerySnapshot, setLogLevel } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { firebaseConfig } from './firebaseConfig';

// Suppress verbose SDK transport logs and transient reconnect notices
try {
  setLogLevel('silent');
} catch (e) {
  // Ignore
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure persistent auth state for both web browser and Capacitor / Android environments
if (typeof window !== 'undefined') {
  setPersistence(auth, indexedDBLocalPersistence).catch(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  });
}

export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Robust database initialization handling iframe sandboxes, offline caching, and automatic network protocol negotiation
let dbInstance;
try {
  dbInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      experimentalAutoDetectLongPolling: true
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch (error) {
  console.warn("Firestore persistent cache init note, falling back to standard config:", error);
  try {
    dbInstance = initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch (fallbackError) {
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = dbInstance;
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
}

// Helper to prevent UI freezing on weak connections or offline state
export async function offlineSafeDocWrite<T>(promise: Promise<T>): Promise<T | void> {
  // Always catch the promise to prevent unhandled rejections if it fails in the background
  promise.catch(e => console.error("Offline/Background write failed:", e));
  
  if (!navigator.onLine) {
    // Wait briefly to allow Firestore's internal mechanisms to update the local cache
    // before the caller invokes data fetching again.
    return new Promise(resolve => setTimeout(resolve, 300));
  }
  // Race against a 1.5 second timeout. If connection is slow or drops, we don't freeze the UI.
  return Promise.race([
    promise,
    new Promise<void>(resolve => setTimeout(resolve, 1500))
  ]);
}

// Helper to quickly fetch data from cache if network is slow/offline
export async function fastGetDocs(q: Query<DocumentData, DocumentData>): Promise<QuerySnapshot<DocumentData, DocumentData>> {
  if (!navigator.onLine) {
    try {
      return await getDocsFromCache(q);
    } catch (e) {
      return await getDocs(q); // fallback
    }
  }
  
  try {
    return await Promise.race([
      getDocs(q),
      new Promise<QuerySnapshot<DocumentData, DocumentData>>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
    ]);
  } catch (error) {
    try {
      return await getDocsFromCache(q);
    } catch {
      return await getDocs(q);
    }
  }
}
