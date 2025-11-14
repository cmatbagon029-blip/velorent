# Fix HTTPS/Mixed Content Issue

## Problem
The app is loading at `https://localhost` but trying to make HTTP requests, causing Mixed Content errors.

## Root Cause
Even though we configured:
- `androidScheme: 'http'` in `capacitor.config.ts`
- Network security config to allow cleartext traffic
- AndroidManifest with `usesCleartextTraffic="true"`

The app is still using HTTPS because the changes haven't been synced and the app needs to be rebuilt.

## Solution Steps

### Step 1: Sync Capacitor Configuration

In your terminal, navigate to the velorent-app directory and run:

```bash
cd velorent-app
npx cap sync android
```

This will apply the Capacitor config changes to the Android project.

### Step 2: Verify Network Security Config

The file should exist at:
`velorent-app/android/app/src/main/res/xml/network_security_config.xml`

And should contain:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">192.168.1.21</domain>
    <domain includeSubdomains="true">localhost</domain>
    <domain includeSubdomains="true">127.0.0.1</domain>
    <domain includeSubdomains="true">10.0.2.2</domain>
  </domain-config>
</network-security-config>
```

### Step 3: Verify AndroidManifest.xml

The file should have:
```xml
<application
    ...
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config">
```

### Step 4: Rebuild the App in Android Studio

1. Open Android Studio
2. Open the project: `velorent-app/android`
3. Wait for Gradle sync to complete
4. **Clean the project**: `Build` → `Clean Project`
5. **Rebuild**: `Build` → `Rebuild Project`
6. Generate a new APK/AAB: `Build` → `Generate Signed Bundle / APK`

### Step 5: Uninstall Old App and Install New One

1. Uninstall the old app from your device/emulator
2. Install the newly built APK/AAB
3. The app should now use HTTP and allow cleartext traffic

## Alternative: Force HTTP in Capacitor Config

If the issue persists, you can also try removing the `hostname` from `capacitor.config.ts`:

```typescript
server: {
  cleartext: true,
  androidScheme: 'http'
  // Remove hostname line
}
```

Then sync and rebuild.

## Verification

After rebuilding, check the logcat. You should see:
- `Loading app at http://localhost` (not https)
- No "Mixed Content" errors
- Successful API calls to `http://192.168.1.21:3000/api/...`

## Note

The key issue is that **you must rebuild the app** after making these changes. Simply syncing Capacitor is not enough - Android Studio needs to rebuild the APK with the new configuration.








