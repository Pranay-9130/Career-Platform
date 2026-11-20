# AspirePath Mobile – Premium Android Application

> "From your first project to your first job."

AspirePath Android is an enterprise-grade React Native & Expo mobile application tailored for engineering students and tech job seekers. It connects directly with the existing AspirePath FastAPI backend and PostgreSQL database.

---

## 📱 Technology Stack

- **Framework:** React Native + Expo (SDK 52)
- **Routing:** Expo Router (File-based navigation)
- **Language:** TypeScript
- **HTTP Client:** Axios with JWT Bearer Interceptors
- **State Management:** Zustand (Auth & Theme stores)
- **Data Fetching:** TanStack Query (@tanstack/react-query)
- **Secure Storage:** Expo SecureStore with AsyncStorage fallback
- **Animations:** React Native Reanimated
- **Icons:** Lucide React Native & Expo Vector Icons

---

## 🚀 Key Features

1. **Splash Screen & 5-Step Onboarding Slider:** Smooth brand introduction with Get Started, Next, and Skip controls.
2. **Student Authentication:** Secure student login, registration (Student vs Job Seeker roles), password recovery, and session persistence.
3. **5-Tab Bottom Navigation Bar:**
   - **Home:** Personalized greeting, 84% Career Readiness Gauge, Quick Actions grid, Recommended Opportunities, and Peer Showcases.
   - **Jobs & Internships:** Keyword search, job-type and work-mode chips, batch/qualification eligibility checks, and 1-tap apply.
   - **Peer Projects:** Community architectural showcases, domain filters, stars, and GitHub/Live demo links.
   - **Applications Tracker:** Monitor real-time status (Submitted, Under Review, Interview, Offer) across recruiting pipelines.
   - **Student Profile & Settings:** Profile summary, education details, Light/Dark/System theme switcher, and sign out.
4. **Core Career Tools:**
   - **Mobile Resume Builder:** Multi-section form (Personal, Education, Skills, Experience, Projects) with PDF export.
   - **ATS Resume Analyzer:** Deterministic match scoring (e.g. 88/100), verified matched keywords vs missing skill gaps, and actionable improvement suggestions.
   - **Skill Intelligence:** 13-role competency matrix, missing coursework analysis, and learning roadmap stages.
   - **Placement Preparation PDF Library:** Role-based technical question banks (Python, Java, Frontend, DevOps, etc.), topic filters, in-app document viewer, and offline download.

---

## 🛠️ Getting Started & Local Development

### Prerequisites
- Node.js (v18+ or v20+)
- npm or yarn
- Expo CLI (`npx expo`)
- Android Studio with Android Virtual Device (AVD) OR physical Android phone with Expo Go

### 1. Install Dependencies
```bash
cd android
npm install
```

### 2. Configure Backend API URL
By default:
- On an Android Emulator, the app connects to the FastAPI backend on your host machine via:
  `http://10.0.2.2:8000/api`
- On a physical device running Expo Go, configure your local LAN IP (e.g. `http://192.168.1.X:8000/api`) in `src/constants/config.ts`.

### 3. Start Development Server
```bash
npx expo start
```
- Press `a` to open in Android Emulator
- Or scan the terminal QR code using Expo Go on your Android device

---

## 📦 Building Standalone Release APK

### 1. APK vs AAB Packaging
- **APK (`.apk`):** Directly installable on Android phones via sideloading/browser download. Required for direct website distribution.
- **AAB (`.aab`):** Google Play Store upload format. Cannot be installed directly on an Android device without parsing errors.

`eas.json` is configured with `"android": { "buildType": "apk" }` across `preview` and `production` profiles to ensure Expo EAS outputs a genuine installable APK.

### 2. EAS Build Commands
```bash
# Navigate to the Android directory
cd android

# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Log in to your Expo account
eas login

# Trigger direct release APK compilation
eas build --platform android --profile production

# Or for internal preview APK testing:
eas build --platform android --profile preview
```

### 3. Local Gradle Build (Alternative without EAS cloud):
```bash
# Generate native Android project files
npx expo prebuild --platform android

# Compile release APK locally using Gradle
cd android
./gradlew assembleRelease
```
The resulting signed APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 🔒 Security, Play Protect & Integrity

### Why Google Play Protect Displays Warnings on Sideloaded APKs:
1. **Unrecognized Developer Certificate:** When an app is distributed outside the Google Play Store, its cryptographic signing certificate is not yet in Google's cloud catalog. Play Protect flags unrecognized developer certificates with a cautionary prompt (*"Unrecognized app"* or *"App may be harmful"*).
2. **Resolution:** Users can safely tap **"More details"** &rarr; **"Install anyway"**.
3. **Whitelisting:** To permanently eliminate the Play Protect warning, developers can register the APK signature in the [Google Play Protect Developer Portal](https://developers.google.com/android/play-protect) or distribute via Google Play Console.

### Permissions Audit:
- `android.permission.INTERNET`: Required for API requests to the AspirePath backend.
- `android.permission.ACCESS_NETWORK_STATE`: Required to monitor offline/online network transitions.
- **Zero broad storage permissions:** Deprecated `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` have been removed to comply with Android 14/15 Scoped Storage and prevent security flags. Document picking and sharing use Android's native Storage Access Framework (SAF).
- **Zero sensitive permissions:** No SMS, Contacts, Location, Camera, Microphone, or Background services.

### Compatibility Matrix:
- **Application ID:** `com.aspirepath.app`
- **Version Code:** `1`
- **Version Name:** `1.0.0`
- **Minimum SDK:** `API 26 (Android 8.0 Oreo)`
- **Target SDK:** `API 35 (Android 15)`
- **Supported Architectures:** `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`


