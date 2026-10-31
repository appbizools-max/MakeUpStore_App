# SALBEAU MAKEUP STORE — PRODUCTION BUILD & SIGNING REPORT
**Document ID:** SALBEAU-REL-BUILD-11  
**Build Artifacts:** Production APK & Production AAB (Android App Bundle)  
**Package Name:** `com.Salbeau`  
**Version Code:** 1 | **Version Name:** `1.0.0`  

---

## 1. Production Build Commands

To generate release artifacts, run the following commands from the project root or native Android directory:

### Step 1: Install Dependencies & Prepare Bundle
```bash
# In MakeUpStore_App/app:
npm install
```

### Step 2: Build Production APK (For Internal Device Testing)
```powershell
cd MakeUpStore_App/app/android
./gradlew assembleRelease
```
* **Output Location:**  
  `MakeUpStore_App/app/android/app/build/outputs/apk/release/app-release.apk`

### Step 3: Build Production Android App Bundle (For Google Play Store Distribution)
```powershell
cd MakeUpStore_App/app/android
./gradlew bundleRelease
```
* **Output Location:**  
  `MakeUpStore_App/app/android/app/build/outputs/bundle/release/app-release.aab`

---

## 2. Release Keystore & Play App Signing Configuration

### 2.1 Generating a New Production Keystore (If Not Already Generated)
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore salbeau-release.keystore -alias salbeau-release-key -keyalg RSA -keysize 2048 -validity 10000
```

### 2.2 Configuring Secure Gradle Properties
Add the following credentials to your local machine's `~/.gradle/gradle.properties` (or CI/CD environment secrets):
```properties
SALBEAU_RELEASE_STORE_FILE=salbeau-release.keystore
SALBEAU_RELEASE_KEY_ALIAS=salbeau-release-key
SALBEAU_RELEASE_STORE_PASSWORD=your_secure_keystore_password
SALBEAU_RELEASE_KEY_PASSWORD=your_secure_key_password
```

*Note: The project's `android/app/build.gradle` automatically checks for these properties. If present, it signs the production artifact with your upload key; if absent during development/QA, it gracefully signs with the included test keystore.*

---

## 3. Bytecode Optimization & ProGuard Configuration

* **Hermes Bytecode Engine:** Enabled (`hermesEnabled=true`). JavaScript bundle is pre-compiled ahead of time into bytecode, eliminating runtime JIT compilation overhead.
* **Asset Crunching:** Enabled (`android.enablePngCrunchInReleaseBuilds=true`). PNG assets are compressed during the AAPT2 build phase.
* **Multi-ABI Slicing:** Google Play automatically delivers optimized architecture slices (`arm64-v8a` or `armeabi-v7a`) from the uploaded `.aab`, reducing consumer download size by up to 60%.

