/**
 * Firebase initialization. Reads config from Vite env vars.
 * Falls back to a no-op "demo" mode if env vars are not present so the
 * app still boots locally before Firebase is configured.
 */
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let _auth = null;
let _db = null;
let _storage = null;
let _googleProvider = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  _auth = getAuth(app);
  _googleProvider = new GoogleAuthProvider();
  _googleProvider.setCustomParameters({ prompt: 'select_account' });

  _db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });

  _storage = getStorage(app);

  if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    try {
      connectAuthEmulator(_auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(_db, 'localhost', 8080);
      connectStorageEmulator(_storage, 'localhost', 9199);

      console.info('[Firebase] connected to local emulator suite');
    } catch (e) {

      console.warn('[Firebase] emulator already connected', e);
    }
  }
} else {

  console.warn(
    '[Easy Poultry] Firebase env vars missing. App is running in DEMO mode.\n' +
      'Copy .env.example → .env.local and add your Firebase project credentials.'
  );
}

export const firebaseApp = app;
export const auth = _auth;
export const db = _db;
export const storage = _storage;
export const googleProvider = _googleProvider;
