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

To generate an installable direct `.apk` package:

### Using EAS Build (Recommended):
```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```
This generates a direct downloadable `.apk` file that can be distributed directly to students.

---

## 🔒 Security & Integrity
- **JWT Storage:** Securely isolated inside hardware-backed Android Keystore via Expo SecureStore.
- **Permissions:** Standard storage and network access only. No invasive device permissions.
- **Compatibility:** Optimized for Android 8.0 (API 26) through Android 15 (API 35).
