import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.khamarpro.app',
  appName: 'Farm Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
