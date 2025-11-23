# Fix Mixed Content Error

## Problem
The app was loading over HTTPS but trying to make HTTP requests to the backend, causing Mixed Content errors.

## Solution Applied

1. **AndroidManifest.xml** - Fixed `usesCleartextTraffic` attribute placement
2. **network_security_config.xml** - Added base config to allow cleartext traffic
3. **capacitor.config.ts** - Ensured HTTP scheme is used

## Steps to Apply Fix

1. **Sync Capacitor** (applies config changes):
   ```bash
   cd velorent-app
   npx cap sync
   ```

2. **Rebuild the app in Android Studio**:
   - Open Android Studio
   - Click `Build` → `Rebuild Project`
   - Or generate a new APK/AAB

3. **Reinstall on device**:
   - Uninstall the old app from your device
   - Install the newly built APK/AAB

## Alternative: Quick Test

If you want to test without rebuilding, you can also:

1. In Android Studio, go to `Run` → `Edit Configurations`
2. Make sure the app is set to use HTTP (not HTTPS)
3. Or manually change the scheme in `MainActivity.java` if needed

## Notes

- The network security config now allows cleartext traffic for development
- For production, you should use HTTPS for both app and backend
- The current setup allows HTTP for local development/testing

















