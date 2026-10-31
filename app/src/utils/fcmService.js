/**
 * SALBEAU MAKEUP STORE — FIREBASE CLOUD MESSAGING (FCM) SERVICE
 * 
 * Handles push notifications outside and inside the customer app:
 * - Device FCM token registration & caching
 * - Permission requests
 * - Foreground notification listener (triggers live in-app banners)
 * - Deep linking payload parsing for orders
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { supabase } from '../config/supabase';

// Firebase Web Config for Salbeau
const firebaseConfig = {
  apiKey: "AIzaSyCZAW--ewEn7Re30ZkP6Qh7oYbj-FBBofI",
  authDomain: "salbeauapp.firebaseapp.com",
  projectId: "salbeauapp",
  storageBucket: "salbeauapp.firebasestorage.app",
  messagingSenderId: "286964052282",
  appId: "1:286964052282:web:ae1160781f170e9c62a003",
  measurementId: "G-PRT3QNX4MN"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messagingInstance = null;

/**
 * Initializes messaging if supported in the current environment (browser/webview)
 */
export async function getFcmMessaging() {
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    }
  } catch (err) {
    console.warn('[FCM] Messaging not supported in this runtime environment:', err);
  }
  return null;
}

/**
 * Requests notification permission and retrieves device FCM Token.
 * Persists token to localStorage and syncs with Supabase public.users table.
 */
export async function requestFCMToken(userId = null, phone = null) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied or dismissed.');
      return null;
    }

    const messaging = await getFcmMessaging();
    if (!messaging) return null;

    // VAPID key / Sender registration
    const token = await getToken(messaging, {
      vapidKey: 'BEl-T4a38F2P3Qf0wS07XwY_N_mFv62lBv6_2b5A8G4h2J7k9L1m3N5p7Q9s',
    }).catch(err => {
      // Graceful fallback for local development or missing service worker
      console.warn('[FCM] Token retrieval note (service worker check):', err.message);
      return localStorage.getItem('salbeau_fcm_token') || null;
    });

    if (token) {
      localStorage.setItem('salbeau_fcm_token', token);
      console.log('[FCM] Device token registered:', token.slice(0, 12) + '...');

      // Save token to Supabase users profile if user identifier available
      const identifier = phone || userId;
      if (identifier) {
        try {
          await supabase
            .from('users')
            .update({ fcm_token: token, updated_at: new Date().toISOString() })
            .or(`phone.eq.${identifier},id.eq.${identifier}`);
        } catch (dbErr) {
          console.warn('[FCM] Token database sync note:', dbErr.message);
        }
      }
      return token;
    }
  } catch (err) {
    console.warn('[FCM] requestFCMToken error:', err);
  }
  return null;
}

/**
 * Sets up foreground listener for push messages received while app is open.
 * Fires the callback to display toast banner or refresh notification list.
 */
export function setupFCMForegroundListener(onNotificationReceived) {
  if (typeof window === 'undefined') return () => {};

  let unsubscribe = () => {};

  getFcmMessaging().then(messaging => {
    if (!messaging) return;
    try {
      unsubscribe = onMessage(messaging, (payload) => {
        console.log('[FCM Foreground Push Received]:', payload);
        const { notification, data } = payload || {};
        if (onNotificationReceived && (notification || data)) {
          onNotificationReceived({
            title: notification?.title || data?.title || 'Order Update',
            message: notification?.body || data?.message || '',
            data: data || {},
            timestamp: Date.now()
          });
        }
      });
    } catch (e) {
      console.warn('[FCM] setupFCMForegroundListener note:', e);
    }
  });

  return () => {
    if (typeof unsubscribe === 'function') unsubscribe();
  };
}

