
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.geoalert.safespot',
  appName: 'SafeSpot',
  webDir: 'dist',
  server: {
    url: 'https://e70dcdd3-7d44-4689-9688-f9564cd9068f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
