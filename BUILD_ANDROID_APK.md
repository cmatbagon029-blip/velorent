# Building Android APK for Velorent App

This guide will help you build an Android APK file that you can install on your mobile phone.

## Prerequisites

### 1. Install Required Tools

**Node.js and npm** (if not already installed):
- Download from: https://nodejs.org/
- Verify installation: `node --version` and `npm --version`

**Java Development Kit (JDK) 17 or higher**:
- Download from: https://adoptium.net/
- Verify installation: `java -version`

**Android Studio**:
- Download from: https://developer.android.com/studio
- Install Android SDK (API level 33 or higher)
- Set up Android SDK environment variables:
  - `ANDROID_HOME` = `C:\Users\YourUsername\AppData\Local\Android\Sdk`
  - Add to PATH: `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\tools`

**Ionic CLI** (if not installed):
```bash
npm install -g @ionic/cli
```

### 2. Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (e.g., 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" under en0 or wlan0

## Step-by-Step Build Instructions

### Step 1: Update Backend API URL

1. Open `velorent-app/src/environments/environment.prod.ts`
2. Update the `apiUrl` with your computer's IP address:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'http://192.168.1.100:3000/api' // Replace with your IP
   };
   ```
   **Important**: 
   - Replace `192.168.1.100` with your actual IP address
   - Make sure your backend server is running and accessible from your network
   - For production deployment, use your actual domain (e.g., `https://yourdomain.com/api`)

### Step 2: Ensure Backend Server is Running

Your backend server must be running and accessible from your network:

```bash
# Start backend server
cd backend
node app.js
```

**Important**: Make sure your firewall allows connections on port 3000.

### Step 3: Build the Web App

```bash
cd velorent-app
npm run build:prod
```

This will create optimized production files in the `www` folder.

### Step 4: Install Capacitor Android Platform (First Time Only)

```bash
cd velorent-app
npx cap add android
```

This creates the Android project in `velorent-app/android/`.

### Step 5: Sync Web Assets to Android

```bash
cd velorent-app
npx cap sync
```

This copies the built web app to the Android project.

### Step 6: Open Android Studio

```bash
cd velorent-app
npx cap open android
```

This opens the Android project in Android Studio.

### Step 7: Build APK in Android Studio

1. **Wait for Gradle Sync**: Android Studio will sync the project (this may take a few minutes the first time)

2. **Generate Signed Bundle/APK**:
   - Click `Build` → `Generate Signed Bundle / APK`
   - Select `APK` and click `Next`
   - Create a new keystore (or use existing):
     - Click `Create new...`
     - Fill in the keystore information:
       - Key store path: Choose a location (e.g., `velorent-key.jks`)
       - Password: Create a strong password (remember this!)
       - Key alias: `velorent-key`
       - Key password: Create a password
       - Validity: 25 years (recommended)
       - Certificate information: Fill in your details
     - Click `OK`
   - Click `Next`
   - Select `release` build variant
   - Click `Finish`

3. **Wait for Build**: Android Studio will build the APK (this may take 5-10 minutes)

4. **Locate APK**: Once complete, Android Studio will show a notification. The APK will be located at:
   ```
   velorent-app/android/app/release/app-release.apk
   ```

### Step 8: Install APK on Your Phone

**Option A: Transfer via USB**
1. Connect your phone to your computer via USB
2. Enable "File Transfer" mode on your phone
3. Copy `app-release.apk` to your phone
4. On your phone, open the file manager and tap the APK
5. Allow installation from unknown sources if prompted
6. Install the app

**Option B: Transfer via Email/Cloud**
1. Upload `app-release.apk` to Google Drive, Dropbox, or email it to yourself
2. Download it on your phone
3. Open the downloaded file and install

**Option C: Transfer via ADB (Advanced)**
```bash
adb install velorent-app/android/app/release/app-release.apk
```

## Quick Build Script

For convenience, you can use this single command (after initial setup):

```bash
cd velorent-app
npm run android:build
```

This will:
1. Build the production app
2. Sync with Capacitor
3. Open Android Studio

Then follow Step 7 above to generate the APK.

## Troubleshooting

### "Command not found: cap" or "npx cap not found"

Install Capacitor CLI globally:
```bash
npm install -g @capacitor/cli
```

### "ANDROID_HOME is not set"

Set the environment variable:
- Windows: Add to System Environment Variables
- Mac/Linux: Add to `~/.bashrc` or `~/.zshrc`:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

### "Gradle build failed"

1. Open Android Studio
2. Click `File` → `Sync Project with Gradle Files`
3. Wait for sync to complete
4. Try building again

### "App won't connect to backend"

1. Verify backend is running: `http://[your-ip]:3000/api/vehicles`
2. Check firewall settings (allow port 3000)
3. Verify `environment.prod.ts` has correct IP address
4. Make sure phone and computer are on the same network
5. Rebuild the app after changing the API URL

### "APK installation blocked"

On Android:
1. Go to Settings → Security
2. Enable "Install from Unknown Sources" or "Install Unknown Apps"
3. Try installing again

### "App crashes on startup"

1. Check Android Studio Logcat for errors
2. Verify backend server is running
3. Check API URL in `environment.prod.ts`
4. Rebuild the app: `npm run build:prod && npx cap sync`

## Testing the APK

1. **Install on your phone** (see Step 8)
2. **Open the app** on your phone
3. **Verify backend connection**: The app should load vehicles from your backend
4. **Test features**: Login, browse vehicles, make bookings, etc.

## Updating the App

When you make changes to the app:

1. Update code in `velorent-app/src/`
2. Update API URL if needed in `environment.prod.ts`
3. Rebuild: `npm run build:prod`
4. Sync: `npx cap sync`
5. Rebuild APK in Android Studio (Step 7)

## Production Deployment

For production deployment:

1. **Deploy backend** to a server (Heroku, AWS, DigitalOcean, etc.)
2. **Update `environment.prod.ts`** with production API URL:
   ```typescript
   apiUrl: 'https://yourdomain.com/api'
   ```
3. **Rebuild the app**: `npm run build:prod`
4. **Sync and build APK** as described above
5. **Test thoroughly** before distribution

## Additional Resources

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Ionic Android Guide](https://ionicframework.com/docs/developing/android)
- [Android Studio Guide](https://developer.android.com/studio/intro)

## Notes

- The APK file size is typically 10-20 MB
- First build may take 10-15 minutes (subsequent builds are faster)
- Keep your keystore file safe - you'll need it for updates
- For Google Play Store, you'll need to create an App Bundle (.aab) instead of APK

