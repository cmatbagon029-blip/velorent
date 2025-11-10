import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.velorent.app',
  appName: 'Velorent',
  webDir: 'www',
  server: {
    cleartext: true,
    androidScheme: 'http',
    hostname: 'localhost'
  }
};

export default config;
