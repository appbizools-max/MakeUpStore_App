# SALBEAU MAKEUP STORE — GOOGLE PLAY STORE RELEASE CHECKLIST
**Document ID:** SALBEAU-REL-PLAYSTORE-10  
**Target Release Format:** Android App Bundle (`.aab`)  
**Target API Level:** API 34 (Android 14)  
**Play Console Compliance Status:** Ready for Submission  

---

## 1. Google Play Policy & Technical Compliance

| Policy Check Item | Required Standard | Current Implementation | Compliance Status |
| :--- | :--- | :--- | :--- |
| **Target API Level** | Must target API 34 or higher for new releases. | `targetSdkVersion = 34` in `build.gradle`. | **COMPLIANT** |
| **64-bit Architecture** | Must support 64-bit architectures (`arm64-v8a`, `x86_64`). | `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`. | **COMPLIANT** |
| **App Bundle Format** | New apps must be published as `.aab` (Android App Bundle). | Supported via `./gradlew bundleRelease`. | **COMPLIANT** |
| **Sensitive Permissions** | No broad or unapproved permissions (e.g. `SYSTEM_ALERT_WINDOW`). | Debug permissions removed from `AndroidManifest.xml`. | **COMPLIANT** |
| **Storage Scoping** | Android 13+ cannot request broad external storage. | Limited via `android:maxSdkVersion="32"`. | **COMPLIANT** |
| **Notification Permission**| Must declare `POST_NOTIFICATIONS` for Android 13+. | Declared in manifest and handled at runtime. | **COMPLIANT** |
| **Account Deletion** | Must provide an in-app path for customers to delete accounts. | Available under Profile screen -> Account Settings. | **COMPLIANT** |
| **Privacy Policy** | Public privacy policy URL disclosing data collection & sharing. | Configured under `docs/` and linked in store listing. | **COMPLIANT** |
| **Data Safety Section** | Disclose collection of Phone (Auth), Name, Address (Delivery), Images (B2B Docs). | Data Safety Declaration prepared matching exact behavior. | **COMPLIANT** |

---

## 2. Store Listing Assets Checklist

* **App Title:** Salbeau — Professional Beauty & Salon Store
* **Short Description:** Authentic beauty, cosmetics, salon & makeup artist wholesale formulations.
* **Full Description:** High-performance beauty e-commerce app with 4-tier pricing for Retail, Salon Owners, Makeup Artists, and Beauticians.
* **App Icon:** `512×512 px` 32-bit PNG with alpha channel (`Assets/Logo.png`).
* **Feature Graphic:** `1024×500 px` JPG/PNG (no transparency).
* **Screenshots:** Phone screenshots (minimum 2, 16:9 or 9:16 aspect ratio, min 1080px).
* **App Category:** Shopping (E-Commerce).
* **Content Rating:** Suitable for General Audience (PEGI 3 / Everyone).

