import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.masrahi.app',
  appName: 'ورشة المسرح المدرسي',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
