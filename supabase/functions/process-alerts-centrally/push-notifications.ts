
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Alert } from './types.ts';
import { isLocationRelevant } from './location-utils.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function sendPushNotifications(alerts: Alert[]): Promise<void> {
  try {
    // Get all users with FCM tokens and their locations
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, fcm_token, location')
      .not('fcm_token', 'is', null);
    
    if (error || !users || users.length === 0) {
      console.log("No users with FCM tokens found");
      return;
    }
    
    console.log(`Found ${users.length} users with FCM tokens`);
    
    // For each alert, find relevant users and send notifications
    for (const alert of alerts) {
      const relevantUsers = users.filter(user => 
        isLocationRelevant(alert.location, user.location || "")
      );
      
      console.log(`Alert "${alert.title}" in "${alert.location}" relevant for ${relevantUsers.length} users`);
      
      // Send notification to each relevant user
      for (const user of relevantUsers) {
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              user_id: user.id,
              title: `התראה ב${alert.location}`,
              body: alert.title,
              data: { alert_id: alert.id }
            }
          });
        } catch (pushError) {
          console.error(`Failed to send notification to user ${user.id}:`, pushError);
        }
      }
    }
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }
}
