# ARCHIVE: README_MOBILE.md

This file has been archived to the organized docs folder to avoid duplication.

See: docs/organized/archive/readmes/README_MOBILE.md

Overview
- This document shows the steps to wrap the existing web UI in a native mobile app using Capacitor. The app will be fully offline and use localStorage for persistence. You can optionally add cloud sync later.

Prerequisites
- Node.js & npm installed
- Android Studio (for Android) and/or Xcode (for iOS)

Quick setup
1. Install Capacitor and initialize the app

```powershell
npm install @capacitor/core @capacitor/cli --save-dev
npx cap init lumi-desktop com.example.lumi "Codelumi"
```

2. Prepare web assets
- Build your web UI into a `www` folder. If you use Vite, run your build and copy `dist` to `www`:

```powershell
npm run build   # if you have a build step
Copy-Item -Path .\dist\* -Destination .\www -Recurse -Force
```

3. Add platform(s)

```powershell
npx cap add android
# or
npx cap add ios
```

4. Copy web assets and open native project

```powershell
npx cap copy
npx cap open android   # open Android Studio
npx cap open ios       # open Xcode (Mac only)
```

5. Run on device/emulator from Android Studio / Xcode.

Notes & recommendations
- Keep all learning data in `localStorage`/IndexedDB for offline availability. To sync across devices you will need an opt-in cloud backend and secure auth.
- If you add native features (microphone, file access), add appropriate Capacitor plugins and request runtime permissions.

Optional: Automate with npm scripts
- Add scripts in `package.json`:

```json
"scripts": {
  "cap:init": "npx cap init lumi-desktop com.example.lumi Codelumi",
  "cap:add-android": "npx cap add android",
  "cap:copy": "npx cap copy",
  "cap:open-android": "npx cap open android"
}
```

I'll add a minimal `capacitor.config.json` to this repo so you can run the commands above quickly.
