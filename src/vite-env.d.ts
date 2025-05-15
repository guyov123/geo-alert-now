
/// <reference types="vite/client" />

// Add declaration for Capacitor modules
declare module '@capacitor/push-notifications' {
  export interface PushNotifications {
    requestPermissions(): Promise<{ receive: string }>;
    register(): Promise<void>;
    addListener(eventName: string, callback: any): { remove: () => void };
  }
  
  export const PushNotifications: PushNotifications;
}

declare module '@capacitor/core' {
  export interface CapacitorInstance {
    isNativePlatform(): boolean;
  }
  
  export const Capacitor: CapacitorInstance;
}
