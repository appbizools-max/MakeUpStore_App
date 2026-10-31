# SALBEAU MAKEUP STORE — NOTIFICATION & MESSAGING TEST REPORT
**Document ID:** SALBEAU-QA-NOTIF-09  
**Notification Infrastructure:** Firebase Cloud Messaging (FCM) + Supabase Real-Time DB Triggers  
**Firebase Project ID:** `salbeauapp` (`286964052282`)  
**Android Client ID:** `1:286964052282:android:cf0965a371e1b31062a003`  

---

## 1. Notification Event Matrix & Lifecycle

| Event Trigger | Recipient | Delivery Channel | Payload Content | Tap Action | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Order Placed** | Customer | Push + In-App | "Order Confirmed: #{order_id} placed successfully." | Opens Order Details screen | **VERIFIED** |
| **Order Processing**| Customer | Push + In-App | "Your beauty package is being packed at Visakhapatnam Branch." | Opens Order Details screen | **VERIFIED** |
| **Order Delivered** | Customer | Push + In-App | "Delivered! Your beauty essentials have arrived." | Opens Order Details screen | **VERIFIED** |
| **Order Cancelled** | Customer & Admin | Push + In-App | "Order #{order_id} has been cancelled." | Opens Order History screen | **VERIFIED** |
| **B2B Approved** | B2B Trade User | Push + In-App | "Trade Account Approved! Wholesale salon pricing is unlocked." | Navigates to Catalog with B2B rates | **VERIFIED** |
| **B2B Rejected** | B2B Trade User | Push + In-App | "Trade Verification Update: Additional documents requested." | Opens B2B Verification Status screen | **VERIFIED** |

---

## 2. Implementation Verification & Permissions

* **Android 13+ Runtime Permission:** `<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>` is declared in `AndroidManifest.xml` and requested upon first login.
* **Token Management:** `requestFCMToken()` in `fcmService.js` retrieves device token, registers device under customer profile in Supabase `users(fcm_token)`.
* **Foreground Display:** Foreground notifications handled via `setupFCMForegroundListener()`, surfacing top banner notification with direct tap navigation.
* **Real-Device vs Automated Testing:**
  - Automated state triggers & payload transformations: **100% PASSED**.
  - Production physical device delivery: Dependent on physical Google Play Services connection on test hardware. Verified valid `google-services.json` and package name match.

