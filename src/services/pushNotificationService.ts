
import { supabase } from "@/integrations/supabase/client";

// Define interfaces for mocking Capacitor functionality
interface CapacitorInterface {
  isNativePlatform: () => boolean;
}

interface PushNotificationsInterface {
  requestPermissions: () => Promise<{ receive: string }>;
  register: () => Promise<void>;
  addListener: (eventName: string, callback: any) => { remove: () => void };
}

// Mock implementations for browser environments
const mockCapacitor: CapacitorInterface = {
  isNativePlatform: () => false
};

const mockPushNotifications: PushNotificationsInterface = {
  requestPermissions: async () => ({ receive: 'denied' }),
  register: async () => {},
  addListener: () => ({ remove: () => {} }),
};

// Safely determine if running on native platform
async function getCapacitorModule(): Promise<CapacitorInterface> {
  try {
    // Only attempt import in a try/catch to avoid browser errors
    if (typeof window !== 'undefined' && 'Capacitor' in window) {
      const { Capacitor } = await import('@capacitor/core');
      return Capacitor;
    }
  } catch (error) {
    console.log('Running in browser environment without Capacitor');
  }
  return mockCapacitor;
}

// Safe check if the app is running on a native platform
export async function isPlatformNative(): Promise<boolean> {
  const capacitor = await getCapacitorModule();
  return capacitor.isNativePlatform();
}

// Safely get the PushNotifications module
async function getPushNotificationsModule(): Promise<PushNotificationsInterface> {
  try {
    // First check if we're on native platform
    const isNative = await isPlatformNative();
    
    if (isNative) {
      try {
        // Dynamically import the module only in native environments
        const { PushNotifications } = await import('@capacitor/push-notifications');
        return PushNotifications;
      } catch (error) {
        console.error('Error importing PushNotifications module:', error);
      }
    }
  } catch (error) {
    console.log('Using mock push notifications');
  }
  return mockPushNotifications;
}

export async function initPushNotifications(): Promise<void> {
  try {
    // Check if running on native platform
    const isNative = await isPlatformNative();
    
    if (!isNative) {
      console.log("Not a native platform, skipping push notification setup");
      return;
    }

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
