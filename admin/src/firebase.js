// Firebase Configuration & Initialization for Salbeau Admin Panel Web Console
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Official Salbeau Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVA0tumqqN97dodRZ2E97Jh3oOkz0cY9A",
  authDomain: "salbeauapp.firebaseapp.com",
  projectId: "salbeauapp",
  storageBucket: "salbeauapp.firebasestorage.app",
  messagingSenderId: "286964052282",
  appId: "1:286964052282:web:ae1160781f170e9c62a003",
  measurementId: "G-PRT3QNX4MN"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const firebaseReady = true;

// Initialize Analytics if supported
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
export { analytics };

export default app;
