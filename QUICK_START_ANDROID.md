# Quick Start: Build Android APK

## Prerequisites Checklist

- [ ] Node.js installed
- [ ] Java JDK 17+ installed
- [ ] Android Studio installed
- [ ] Android SDK installed (API 33+)
- [ ] Ionic CLI installed: `npm install -g @ionic/cli`

## Step 1: Get Your IP Address

**Option A: Use the script**
```bash
npm run get-ip
```

**Option B: Manual**
```bash
ipconfig  # Windows
# Look for IPv4 Address (e.g., 192.168.1.100)
```

## Step 2: Update API URL

1. Open `velorent-app/src/environments/environment.prod.ts`
2. Replace `192.168.1.100` with your actual IP:
   ```typescript
   apiUrl: 'http://YOUR_IP_ADDRESS:3000/api'
   ```

## Step 3: Start Backend Server

```bash
npm run backend
```

Make sure it's running on port 3000 and accessible from your network.

## Step 4: Build Android App

```bash
cd velorent-app
npm run android:build
```

This will:
1. Build the production app
2. Sync with Capacitor
3. Open Android Studio

## Step 5: Generate APK in Android Studio

1. Wait for Gradle sync to complete
2. Click `Build` → `Generate Signed Bundle / APK`
3. Select `APK`
4. Create a new keystore (or use existing)
5. Select `release` build variant
6. Click `Finish`
7. Wait for build (5-10 minutes)

## Step 6: Install on Phone

The APK will be at: `velorent-app/android/app/release/app-release.apk`

**Transfer to phone:**
- USB: Copy APK to phone and install
- Email: Email APK to yourself and download on phone
- Cloud: Upload to Google Drive/Dropbox and download

**Install:**
- Open file manager on phone
- Tap the APK file
- Allow installation from unknown sources if prompted
- Install the app

## Troubleshooting

**App won't connect to backend?**
- Verify backend is running: `http://YOUR_IP:3000/api/vehicles`
- Check firewall (allow port 3000)
- Verify API URL in `environment.prod.ts`
- Make sure phone and computer are on same WiFi network

**Build errors?**
- See [BUILD_ANDROID_APK.md](BUILD_ANDROID_APK.md) for detailed troubleshooting

## Full Documentation

See [BUILD_ANDROID_APK.md](BUILD_ANDROID_APK.md) for complete instructions and troubleshooting.

