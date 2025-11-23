# Android Emulator Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: App Won't Run in Emulator

#### Check 1: Emulator is Running
- Open Android Studio
- Go to **Tools** → **Device Manager**
- Start an emulator (click the ▶️ play button)
- Wait for it to fully boot (home screen appears)

#### Check 2: ADB Connection
```bash
# Check if emulator is detected
adb devices

# If no devices shown, restart ADB:
adb kill-server
adb start-server
adb devices
```

#### Check 3: Port Conflicts
If you see "port already in use" errors:
```bash
# Windows: Find process using port 5554 (default emulator port)
netstat -ano | findstr :5554

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

#### Check 4: Build Errors
1. **Clean Project**:
   - In Android Studio: **Build** → **Clean Project**
   - Wait for completion

2. **Invalidate Caches**:
   - **File** → **Invalidate Caches / Restart**
   - Select **Invalidate and Restart**

3. **Sync Gradle**:
   - **File** → **Sync Project with Gradle Files**
   - Wait for sync to complete

#### Check 5: Emulator Configuration
1. **Check Emulator Settings**:
   - RAM: At least 2GB allocated
   - Graphics: Use "Hardware - GLES 2.0" or "Automatic"
   - Storage: At least 2GB free space

2. **Create New Emulator** (if current one is corrupted):
   - **Tools** → **Device Manager**
   - Click **Create Device**
   - Select a device (e.g., Pixel 5)
   - Select system image (API 33 or higher recommended)
   - Finish setup

#### Check 6: Run Configuration
1. In Android Studio, click the **Run** dropdown
2. Select **Edit Configurations**
3. Ensure:
   - **Module**: `app`
   - **Deployment Target**: Your emulator is selected
   - **Launch**: "Default Activity"

### Issue 2: "INSTALL_FAILED_INSUFFICIENT_STORAGE"
- Free up space on emulator
- Or create new emulator with more storage (8GB+)

### Issue 3: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
- Uninstall the app from emulator first:
  ```bash
  adb uninstall com.velorent.app
  ```
- Then try running again

### Issue 4: App Crashes on Launch
1. Check **Logcat** in Android Studio for errors
2. Common causes:
   - Backend server not running
   - Network configuration issues
   - Missing permissions

### Issue 5: "Waiting for Debugger" or App Hangs
1. Stop the app
2. Uninstall from emulator
3. Clean and rebuild
4. Run again

## Quick Fix Steps

### Step 1: Full Clean and Rebuild
```bash
cd velorent-app
npm run build:prod
npx cap sync android
```

Then in Android Studio:
1. **Build** → **Clean Project**
2. **Build** → **Rebuild Project**
3. **Run** → **Run 'app'**

### Step 2: Reset Emulator (if issues persist)
1. **Tools** → **Device Manager**
2. Click **▼** (dropdown) on your emulator
3. Select **Wipe Data**
4. Start emulator again
5. Try running app

### Step 3: Check Logcat for Specific Errors
1. In Android Studio, open **Logcat** tab
2. Filter by: `com.velorent.app`
3. Look for red error messages
4. Share the error message for specific help

## Network Issues (App Can't Connect to Backend)

### For Emulator:
- Use `10.0.2.2` instead of `localhost` or `127.0.0.1`
- This is the special IP that emulator uses to access host machine

### Update API URL:
1. Edit `velorent-app/src/environments/environment.prod.ts`
2. Change API URL to: `http://10.0.2.2:3000/api`
3. Rebuild: `npm run build:prod && npx cap sync`

## Still Not Working?

1. **Check Android Studio Event Log**:
   - **Help** → **Show Log in Explorer**
   - Look for errors

2. **Check Gradle Console**:
   - **View** → **Tool Windows** → **Gradle**
   - Look for build errors

3. **Try Physical Device**:
   - Connect phone via USB
   - Enable USB debugging
   - Select device in Android Studio
   - Run app

4. **Check System Requirements**:
   - Android Studio: Latest version
   - JDK: Version 17 or higher
   - Android SDK: API 33 or higher installed
   - HAXM or Hyper-V enabled (for emulator acceleration)

