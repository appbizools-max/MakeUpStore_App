# SALBEAU MAKEUP STORE — ANDROID COMPATIBILITY & DEVICE MATRIX
**Document ID:** SALBEAU-QA-ANDROID-07  
**Platform:** Android (React Native 0.74.5 / Expo Bare Architecture)  
**Min SDK:** 23 (Android 6.0 Marshmallow) | **Target SDK:** 34 (Android 14 Upside Down Cake)  

---

## 1. Operating System Compatibility Matrix

| Android Version | API Level | Release Name | Core Features Validated | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Android 14** | API 34 | Upside Down Cake | Selected photo access, target SDK 34 compliance, gesture nav | **FULLY COMPATIBLE** |
| **Android 13** | API 33 | Tiramisu | Runtime `POST_NOTIFICATIONS`, storage limits (`maxSdkVersion="32"`) | **FULLY COMPATIBLE** |
| **Android 12 / 12L**| API 31 / 32| Snow Cone / Sv2 | Splash screen API, rounded corner padding, foldables | **FULLY COMPATIBLE** |
| **Android 11** | API 30 | Red Velvet Cake | Scoped storage, permission auto-reset | **FULLY COMPATIBLE** |
| **Android 10** | API 29 | Quince Tart | Dark/Light mode theme stability, gesture back navigation | **FULLY COMPATIBLE** |
| **Android 9.0**| API 28 | Pie | Display cutouts / notches, background execution limits | **FULLY COMPATIBLE** |
| **Android 8.0/8.1**| API 26 / 27| Oreo | Notification channels, adaptive icons, auto-sizing text | **FULLY COMPATIBLE** |
| **Android 7.0/7.1**| API 24 / 25| Nougat | Multi-window split screen mode, Quick Settings tiles | **FULLY COMPATIBLE** |
| **Android 6.0** | API 23 | Marshmallow | Runtime permission prompts, Doze battery mode (Base MinSDK) | **FULLY COMPATIBLE** |

---

## 2. Screen Density & Display Configurations

* **Densities Tested:** `mdpi` (160dpi), `hdpi` (240dpi), `xhdpi` (320dpi), `xxhdpi` (480dpi), `xxxhdpi` (640dpi).
* **Display Sizes Tested:**
  - Compact Phone: 5.4" (1080 × 2340 px) — Verified no text truncations in Product Cards.
  - Standard Flagship: 6.1" – 6.7" (1080 × 2400 px, 1440 × 3200 px) — Verified optimal 2-column grid spacing.
  - Large Screen & Foldables: 7.6" – 11" (1812 × 2176 px) — Banners scale proportionally up to `600px` max constraint.
* **Navigation Modes:**
  - 3-Button Navigation: Hardware back button triggers custom double-tap to exit on Home screen.
  - Gesture Navigation: Edge swipe back gestures properly handled via React Native `BackHandler`.
* **Keyboard Management:** Forms use `windowSoftInputMode="adjustResize"` to ensure inputs remain fully visible when virtual keyboard opens.

