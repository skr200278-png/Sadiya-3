import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.khamarpro.app',
  appName: 'KhamarPro',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
