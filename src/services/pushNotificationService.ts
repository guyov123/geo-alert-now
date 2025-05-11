
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from '@capacitor/core';

export async function initPushNotifications(): Promise<void> {
  // Only run on native platforms
  if (!isPlatformNative()) return;

  // Request permission to use push notifications
  const permissionStatus = await PushNotifications.requestPermissions();
  
  if (permissionStatus.receive === 'granted') {
    // Register for push notifications
    await PushNotifications.register();
    
    // Listen for FCM token
    PushNotifications.addListener('registration', async (token) => {
      console.log('FCM Token:', token.value);
      await saveFCMToken(token.value);
    });
    
    // Listen for push notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
    });
    
    // Listen for click on notification
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Notification action performed:', action);
      // Navigation could be added here
    });
  }
}

// Save FCM token to server
async function saveFCMToken(token: string): Promise<void> {
  try {
    const user = supabase.auth.getUser();
    if (!user) {
      console.log('User not logged in, cannot save FCM token');
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: token })
      .eq('id', (await user).data.user?.id);
      
    if (error) throw error;
    console.log('FCM token saved successfully');
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
}

// Check if the app is running on a native platform
export function isPlatformNative(): boolean {
  return Capacitor.isNativePlatform();
}
