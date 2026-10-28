# SALBEAU MAKEUPSTORE — ANDROID GOOGLE PLAY STORE RELEASE READINESS

**Document Reference:** `docs/quality-and-release/GOOGLE_PLAY_STORE_RELEASE_READINESS.md`  
**Date:** 2026-10-25  
**Mobile Release Lead:** Principal Mobile Architect & Android Release Engineer  
**Target Application:** Salbeau Customer Mobile Application (`app/`)  
**Target Package:** `com.salbeau.app` | Expo SDK 51 / React Native 0.74.5

---

## 1. Executive Summary

This report establishes the Android release readiness of the Salbeau MakeUpStore mobile application. The repository contains a complete, prebuilt native Android project located at [app/android/](file:///e:/MakeUpStore_App-main/MakeUpStore_App/app/android), configured with Gradle wrapper, Gradle build scripts, Android manifest, and Expo SDK 51 native bindings.

---

## 2. Android Project Configuration Audit

| Configuration Property | Repository Location | Current Setting | Release Conformance Status |
| :--- | :--- | :--- | :---: |
| **Package Identifier** | `app/app.json`, `build.gradle` | `com.salbeau.app` | ✅ Conforming |
| **Version Name** | `app/app.json` | `1.0.0` | ✅ Conforming |
| **Version Code** | `app/app.json` | `1` | ✅ Conforming |
| **Target SDK Version** | `android/build.gradle` | Target SDK 34 (Android 14) | ✅ Conforming (Google Play mandate) |
| **Min SDK Version** | `android/build.gradle` | Min SDK 23 (Android 6.0+) | ✅ Conforming |
| **Orientation** | `app/app.json` | Portrait | ✅ Conforming |
| **Adaptive Icon** | `app/app.json` | Background: `#FFF8FA` | ✅ Conforming |
| **Network Security** | `AndroidManifest.xml` | Strict HTTPS / TLS 1.3 | ✅ Conforming |
| **Google Services** | `app/google-services.json` | Configured for push / auth | ✅ Present |

---

## 3. Required Android Permissions Audit

The application requests only necessary permissions aligned with its commerce functions:
- `android.permission.INTERNET`: Required to communicate with Supabase backend APIs and CDNs.
- `android.permission.ACCESS_NETWORK_STATE`: Required to detect online/offline status and toggle fallback cache.
- `android.permission.CAMERA`: Required for camera-based barcode scanning of beauty products.
- `android.permission.READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE`: Required strictly for salon/MUA users uploading trade licenses in the B2B verification screen.

*No background location, SMS reading, or contacts permissions are requested.*

---

## 4. Google Play Release Preparation Checklist

### 4.1 Play Console Metadata & Store Listing
- **App Name:** Salbeau — Luxury Cosmetics & Pro Beauty
- **Short Description (80 chars max):** Shop premium beauty, cosmetics & professional salon wholesale pricing.
- **Full Description:** Comprehensive overview highlighting luxury retail cosmetics, professional B2B pricing for verified salons and makeup artists, color shade matching, and genuine certified brands.
- **Store Graphics:**
  * App Icon: 512 x 512 px PNG (32-bit with alpha).
  * Feature Graphic: 1024 x 500 px JPG or PNG.
  * Phone Screenshots: Minimum 4 screenshots (1080 x 2400 px) showcasing Home feed, Shade selector, B2B verification, and Checkout.

### 4.2 Google Play Data Safety Declaration
- **Data Collected:**
  * Personal Info: Name, Phone Number (for account authentication & delivery contact).
  * Financial Info: Handled entirely via encrypted payment gateway; no card numbers or UPI PINs are stored on Salbeau servers.
  * Photos & Documents: Uploaded only when user applies for B2B trade verification.
- **Data Sharing:** Zero user data is sold to third-party data brokers.
- **Account Deletion:** An explicit in-app button and external web URL are provided to allow users to request deletion of their account and personal data.

---

## 5. Build Commands for Production Release Bundle (.aab)

To generate the signed Android App Bundle (`.aab`) required for Google Play Console:

```bash
# 1. Navigate to mobile app directory
cd app

# 2. Generate release AAB via Expo / EAS or Gradle
npx expo run:android --variant release

# Or directly via Gradle wrapper inside android/
cd android
./gradlew bundleRelease
```

> [!IMPORTANT]
> Generating the final signed release artifact requires the production upload keystore file (`salbeau-release.keystore`) and signing credentials (`KEYSTORE_PASSWORD`, `KEY_ALIAS`). These secrets must never be committed to Git and should be injected via secure CI/CD environment variables.
