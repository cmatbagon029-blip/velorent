import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.velorent.app',
  appName: 'Velorent',
  webDir: 'www',
  server: {
    cleartext: true,
    androidScheme: 'http',
    hostname: 'localhost'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: '#0D0D0D',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: false
    }
  }
};

export default config;
