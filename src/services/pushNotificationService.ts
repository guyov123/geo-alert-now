
import { Capacitor } from '@capacitor/core';
import { supabase } from "@/integrations/supabase/client";

// Interface for PushNotifications to use in browser environments
interface PushNotificationsInterface {
  requestPermissions: () => Promise<{ receive: string }>;
  register: () => Promise<void>;
  addListener: (eventName: string, callback: any) => { remove: () => void };
}

// Mock implementation for browser environments
const mockPushNotifications: PushNotificationsInterface = {
  requestPermissions: async () => ({ receive: 'denied' }),
  register: async () => {},
  addListener: () => ({ remove: () => {} }),
};

// Check if the app is running on a native platform
export function isPlatformNative(): boolean {
  return Capacitor.isNativePlatform();
}

// Safely get the PushNotifications module
async function getPushNotificationsModule(): Promise<PushNotificationsInterface> {
  if (isPlatformNative()) {
    try {
      // Dynamically import the module only in native environments
      const { PushNotifications } = await import('@capacitor/push-notifications');
      return PushNotifications;
    } catch (error) {
      console.error('Error importing PushNotifications module:', error);
      return mockPushNotifications;
    }
  }
  return mockPushNotifications;
}

export async function initPushNotifications(): Promise<void> {
  // Only run on native platforms
  if (!isPlatformNative()) {
    console.log("Not a native platform, skipping push notification setup");
    return;
  }

  try {
    // Get PushNotifications module
    const PushNotifications = await getPushNotificationsModule();
    
    // Request permission to use push notifications
    const permissionStatus = await PushNotifications.requestPermissions();
    
    if (permissionStatus.receive === 'granted') {
      console.log("Push notification permission granted");
      
      // Register for push notifications
      await PushNotifications.register();
      
      // Listen for FCM token
      PushNotifications.addListener('registration', async (token: { value: string }) => {
        console.log('FCM Token:', token.value);
        await saveFCMToken(token.value);
      });
      
      // Listen for push notifications
      PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
        console.log('Notification received:', notification);
      });
      
      // Listen for click on notification
      PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
        console.log('Notification action performed:', action);
        // Navigation could be added here
      });
    } else {
      console.log("Push notification permission denied");
    }
  } catch (error) {
    console.error("Error setting up push notifications:", error);
  }
}

// Save FCM token to server
async function saveFCMToken(token: string): Promise<void> {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      console.log('User not logged in, cannot save FCM token');
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: token })
      .eq('id', user.data.user.id);
      
    if (error) throw error;
    console.log('FCM token saved successfully');
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
}
