# Blank Screen & Splash Screen Fix

## Issues Fixed

### 1. Blank Screen After Splash
**Root Cause**: Missing `<ion-app>` wrapper in the component template
**Fix**: Added `<ion-app>` wrapper around `<ion-router-outlet>` in `app.component.ts`

### 2. Android Studio Splash Covering Custom Splash
**Root Cause**: Native Android splash shows first, then Capacitor takes over
**Fix**: 
- Set `launchShowDuration: 3000` in Capacitor config
- Removed explicit `SplashScreen.show()` call (native splash already shows)
- Improved timing to ensure smooth transition

## Changes Made

### Files Modified:

1. **`src/app/app.component.ts`**:
   - ✅ Added `<ion-app>` wrapper (fixes blank screen)
   - ✅ Removed explicit `SplashScreen.show()` call
   - ✅ Improved timing and error handling
   - ✅ Added extra delay to ensure WebView content is rendered

2. **`capacitor.config.ts`**:
   - ✅ Set `launchShowDuration: 3000` (3 seconds)
   - ✅ Kept `launchAutoHide: false` for manual control

3. **`android/app/src/main/java/com/velorent/app/MainActivity.java`**:
   - ✅ Added null checks for WebView debugging
   - ✅ Improved error handling

## Next Steps

### 1. Rebuild the App
```bash
cd velorent-app
npm run build:prod
npx cap sync android
```

### 2. Clean and Rebuild in Android Studio
1. Open Android Studio
2. **Build** → **Clean Project**
3. **Build** → **Rebuild Project**
4. **Run** → **Run 'app'**

### 3. Verify Fixes

**Splash Screen Should:**
- ✅ Show custom VeloRent splash (dark background + logo) immediately
- ✅ Stay visible for 3 seconds
- ✅ Smoothly fade out (500ms)
- ✅ Transition to app content (not blank screen)

**App Should:**
- ✅ Display dashboard/content after splash
- ✅ Not show blank screen
- ✅ Load all routes properly

## Troubleshooting

### If Blank Screen Still Appears:

1. **Check Logcat for Errors**:
   - Open Logcat in Android Studio
   - Filter by `com.velorent.app`
   - Look for JavaScript errors or routing errors

2. **Check WebView Loading**:
   - Look for "WebView loaded" or "Loading app at..." messages
   - If you see "Failed to load" errors, check:
     - Backend server is running
     - API URL is correct in `environment.prod.ts`
     - Network security config allows cleartext traffic

3. **Verify Build Output**:
   - Check `velorent-app/www` folder exists
   - Verify `index.html` is in `www` folder
   - Ensure all assets are copied

4. **Check Router Configuration**:
   - Verify routes are loading correctly
   - Check if dashboard page loads
   - Look for lazy loading errors

### If Splash Screen Still Shows Android Studio Default:

1. **Verify Drawable Resources**:
   - Check `android/app/src/main/res/drawable/splash.xml` exists
   - Verify `android/app/src/main/res/drawable/splash_logo.png` exists
   - Check `android/app/src/main/res/values/colors.xml` has `splash_background`

2. **Check AndroidManifest**:
   - Verify `android:theme="@style/AppTheme.NoActionBarLaunch"` is set
   - Check MainActivity uses the splash theme

3. **Clean Build**:
   ```bash
   cd velorent-app/android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

### Common Logcat Errors and Fixes:

**Error: "Failed to load resource"**
- Solution: Rebuild app and sync Capacitor

**Error: "Network request failed"**
- Solution: Check backend server is running and API URL is correct

**Error: "Route not found"**
- Solution: Check router configuration in `app.routes.ts`

**Error: "Cannot read property of undefined"**
- Solution: Check JavaScript console for specific error, likely a component initialization issue

## Testing Checklist

After rebuilding, verify:
- [ ] Splash screen shows custom VeloRent logo
- [ ] Splash screen stays for 3 seconds
- [ ] Smooth fade-out transition
- [ ] Dashboard/content appears after splash
- [ ] No blank screen
- [ ] App navigation works
- [ ] Backend API calls work (if applicable)

## Still Having Issues?

1. **Check Logcat** for specific error messages
2. **Verify build output** in `www` folder
3. **Test in browser first**: `npm start` to ensure web version works
4. **Check Capacitor sync**: Ensure `npx cap sync` completed successfully
5. **Verify Android Studio** is using the latest build

