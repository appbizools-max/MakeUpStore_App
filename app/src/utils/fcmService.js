/**
 * SALBEAU MAKEUP STORE — FIREBASE CLOUD MESSAGING (FCM) SERVICE
 * 
 * Handles push notifications outside and inside the customer app:
 * - Native Android FCM token generation via SalbeauFCM native module
 * - Fallback to Web Firebase Messaging in browser environments
 * - Device FCM token registration & caching in AsyncStorage / localStorage
 * - Permission requests
 * - Foreground notification listener (triggers live in-app celebration/status banners)
 * - Lock-screen / background notification reception with deep linking payloads
 */

import { Platform, NativeModules, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// Firebase Web Config for browser fallback
const firebaseConfig = {
  apiKey: "AIzaSyCZAW--ewEn7Re30ZkP6Qh7oYbj-FBBofI",
  authDomain: "salbeauapp.firebaseapp.com",
  projectId: "salbeauapp",
  storageBucket: "salbeauapp.firebasestorage.app",
  messagingSenderId: "286964052282",
  appId: "1:286964052282:web:ae1160781f170e9c62a003",
  measurementId: "G-PRT3QNX4MN"
};

let webMessagingInstance = null;

async function getWebFcmMessaging() {
  if (webMessagingInstance) return webMessagingInstance;
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getMessaging, isSupported } = await import('firebase/messaging');
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const supported = await isSupported();
      if (supported) {
        webMessagingInstance = getMessaging(app);
        return webMessagingInstance;
      }
    }
  } catch (err) {
    console.warn('[FCM Web] Messaging not supported in runtime:', err);
  }
  return null;
}

/**
 * Requests notification permission and retrieves device FCM Token.
 * Supports Native Android (via SalbeauFCM NativeModule) and Web.
 * Persists token to storage and syncs with Supabase public.users table.
 */
export async function requestFCMToken(userId = null, phone = null) {
  try {
    // 0. Android 13+ (API 33+) Runtime Notification Permission Prompt
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const { PermissionsAndroid } = require('react-native');
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS, {
            title: 'Salbeau Notifications',
            message: 'Allow Salbeau to send you live order tracking, delivery updates, and beauty alerts.',
            buttonPositive: 'Allow',
            buttonNegative: 'Not Now'
          });
          console.log('[FCM Native] Android 13+ POST_NOTIFICATIONS result:', granted);
        }
      } catch (permErr) {
        console.warn('[FCM Native] POST_NOTIFICATIONS request note:', permErr.message);
      }
    }

    // 1. Native Android FCM Execution
    if (Platform.OS === 'android' && NativeModules.SalbeauFCM) {
      console.log('[FCM Native] Requesting native Android device token...');
      try {
        const token = await NativeModules.SalbeauFCM.getFCMToken();
        if (token) {
          await AsyncStorage.setItem('salbeau_fcm_token', token);
          console.log('[FCM Native] Device token registered:', token.slice(0, 15) + '...');

          // Subscribe to general beauty announcements and order updates
          NativeModules.SalbeauFCM.subscribeToTopic('salbeau_all_users').catch(() => {});
          NativeModules.SalbeauFCM.subscribeToTopic('salbeau_announcements').catch(() => {});

          // Sync token to Supabase users profile
          const identifier = phone || userId;
          if (identifier) {
            try {
              await supabase
                .from('users')
                .update({ fcm_token: token, updated_at: new Date().toISOString() })
                .or(`phone.eq.${identifier},id.eq.${identifier}`);
            } catch (dbErr) {
              console.warn('[FCM Native] Token database sync note:', dbErr.message);
            }
          }
          return token;
        }
      } catch (nativeErr) {
        console.warn('[FCM Native] getFCMToken error:', nativeErr.message);
        const cached = await AsyncStorage.getItem('salbeau_fcm_token');
        if (cached) return cached;
      }
      return null;
    }

    // 2. Web Browser Fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[FCM Web] Notification permission denied or dismissed.');
        return null;
      }

      const messaging = await getWebFcmMessaging();
      if (!messaging) return null;

      const { getToken } = await import('firebase/messaging');
      const token = await getToken(messaging, {
        vapidKey: 'BEl-T4a38F2P3Qf0wS07XwY_N_mFv62lBv6_2b5A8G4h2J7k9L1m3N5p7Q9s',
      }).catch(err => {
        console.warn('[FCM Web] Token retrieval note:', err.message);
        return typeof localStorage !== 'undefined' ? localStorage.getItem('salbeau_fcm_token') : null;
      });

      if (token) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('salbeau_fcm_token', token);
        }
        console.log('[FCM Web] Device token registered:', token.slice(0, 12) + '...');

        const identifier = phone || userId;
        if (identifier) {
          try {
            await supabase
              .from('users')
              .update({ fcm_token: token, updated_at: new Date().toISOString() })
              .or(`phone.eq.${identifier},id.eq.${identifier}`);
          } catch (dbErr) {
            console.warn('[FCM Web] Token database sync note:', dbErr.message);
          }
        }
        return token;
      }
    }
  } catch (err) {
    console.warn('[FCM] requestFCMToken error:', err);
  }
  return null;
}

/**
 * Sets up foreground listener for push messages received while app is active.
 * Handles both Native Android DeviceEventEmitter and Web onMessage.
 * Fires the callback to display in-app banner and update notification list.
 */
export function setupFCMForegroundListener(onNotificationReceived) {
  // 1. Native Android Listener
  if (Platform.OS === 'android') {
    const pushSub = DeviceEventEmitter.addListener('onFCMPushReceived', (payload) => {
      console.log('[FCM Native Foreground Push Received]:', payload);
      if (onNotificationReceived && payload) {
        onNotificationReceived({
          title: payload.title || 'Salbeau Update',
          message: payload.body || payload.message || '',
          data: payload.data || {},
          timestamp: payload.timestamp || Date.now()
        });
      }
    });

    const refreshSub = DeviceEventEmitter.addListener('onFCMTokenRefresh', async ({ token }) => {
      console.log('[FCM Native Token Refreshed]:', token?.slice(0, 15) + '...');
      if (token) {
        await AsyncStorage.setItem('salbeau_fcm_token', token).catch(() => {});
      }
    });

    return () => {
      pushSub.remove();
      refreshSub.remove();
    };
  }

  // 2. Web Browser Fallback
  if (typeof window !== 'undefined') {
    let unsubscribe = () => {};
    getWebFcmMessaging().then(async (messaging) => {
      if (!messaging) return;
      try {
        const { onMessage } = await import('firebase/messaging');
        unsubscribe = onMessage(messaging, (payload) => {
          console.log('[FCM Web Foreground Push Received]:', payload);
          const { notification, data } = payload || {};
          if (onNotificationReceived && (notification || data)) {
            onNotificationReceived({
              title: notification?.title || data?.title || 'Salbeau Update',
              message: notification?.body || data?.message || '',
              data: data || {},
              timestamp: Date.now()
            });
          }
        });
      } catch (e) {
        console.warn('[FCM Web] setupFCMForegroundListener note:', e);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }

  return () => {};
}

// In-memory deduplication cache to prevent identical system notifications within a 5-second window
const recentNotificationCache = new Map();

function isDuplicateNotification(dedupKey, windowMs = 5000) {
  if (!dedupKey) return false;
  const now = Date.now();
  if (recentNotificationCache.has(dedupKey)) {
    const prevTime = recentNotificationCache.get(dedupKey);
    if (now - prevTime < windowMs) {
      return true;
    }
  }
  recentNotificationCache.set(dedupKey, now);

  // Evict stale entries when cache grows
  if (recentNotificationCache.size > 80) {
    for (const [k, timestamp] of recentNotificationCache.entries()) {
      if (now - timestamp > 30000) {
        recentNotificationCache.delete(k);
      }
    }
  }
  return false;
}

/**
 * Triggers a native system tray & lock-screen notification directly via Android SalbeauFCM
 * or Web Notifications API (System Tray).
 * Guaranteed to route to the OS Notification Drawer without any in-app popups.
 */
export async function displayLocalNotification(title, message, data = {}) {
  try {
    const cleanTitle = String(title || 'Salbeau Beauty Store').trim();
    const cleanMessage = String(message || '').trim();
    const orderId = String(data?.orderId || data?.order_id || data?.orderNumber || '').trim();
    const notifType = String(data?.type || data?.eventType || 'general').trim();

    // Deduplication check
    const dedupKey = `${orderId}_${notifType}_${cleanTitle}_${cleanMessage}`;
    if (isDuplicateNotification(dedupKey, 5000)) {
      console.log('[FCM System Tray] Suppressed duplicate notification:', dedupKey);
      return false;
    }

    const sanitizedData = {};
    if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) {
        sanitizedData[k] = String(v ?? '');
      }
    }

    // 1. Native Android System Drawer Notification
    if (Platform.OS === 'android' && NativeModules.SalbeauFCM?.displayNotification) {
      await NativeModules.SalbeauFCM.displayNotification(cleanTitle, cleanMessage, sanitizedData);
      return true;
    }

    // 2. Web / Desktop OS Notification Drawer Fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const notif = new Notification(cleanTitle, {
          body: cleanMessage,
          icon: '/favicon.ico',
          data: sanitizedData
        });
        notif.onclick = () => {
          window.focus();
          DeviceEventEmitter.emit('onNotificationTapped', sanitizedData);
        };
        return true;
      }
    }
  } catch (err) {
    console.warn('[FCM] displayLocalNotification error:', err);
  }
  return false;
}

/**
 * Retrieves initial notification payload if app was opened cold by tapping a system tray notification.
 */
export async function getInitialNotification() {
  try {
    if (Platform.OS === 'android' && NativeModules.SalbeauFCM?.getInitialNotification) {
      const initial = await NativeModules.SalbeauFCM.getInitialNotification();
      if (initial && typeof initial === 'object' && Object.keys(initial).length > 0) {
        return initial;
      }
    }
  } catch (err) {
    console.warn('[FCM] getInitialNotification error:', err);
  }
  return null;
}

/**
 * Listens for system notification click events when app is already running or resumed from background.
 */
export function setupNotificationTapListener(onNotificationTapped) {
  const sub = DeviceEventEmitter.addListener('onNotificationTapped', (payload) => {
    console.log('[FCM System Tray Tapped]:', payload);
    if (typeof onNotificationTapped === 'function' && payload) {
      onNotificationTapped(payload);
    }
  });

  return () => {
    sub.remove();
  };
}

/**
 * Clears FCM device push token upon user logout.
 * Prevents subsequent users on the same device from receiving previous user's notifications.
 */
export async function clearFCMToken(userId = null, phone = null) {
  try {
    await AsyncStorage.removeItem('salbeau_fcm_token').catch(() => {});
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('salbeau_fcm_token');
    }

    const identifier = phone || userId;
    if (identifier) {
      await supabase
        .from('users')
        .update({ fcm_token: null, updated_at: new Date().toISOString() })
        .or(`phone.eq.${identifier},id.eq.${identifier}`);
    }
    console.log('[FCM] Push token cleared on logout.');
  } catch (err) {
    console.warn('[FCM] clearFCMToken error:', err);
  }
}
