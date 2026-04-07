import { smsService } from "./smsService";
import { emailService } from "./emailService";
import { createSupabaseAdminClient } from "./supabase";

interface NotificationService {
  sendWelcomeEmail: (data: any) => Promise<void>;
  sendAlertNotifications: (alertData: any) => Promise<void>;
  sendDailySummary: (data: any) => Promise<void>;
  sendAlertEmail: (data: AlertEmailData) => Promise<void>;
}

// Type for alert data
interface AlertData {
  tourist: any;
  emergencyContacts: Array<{ email: string; phone?: string }>;
  alertType: string;
  location: { latitude: number; longitude: number };
  trackingLink: string;
}

export const notificationService: NotificationService = {
  async sendWelcomeEmail(data: any): Promise<void> {
    await emailService.sendWelcomeEmail(data);
  },

  async sendAlertNotifications(alertData: any): Promise<void> {
    const { tourist, emergencyContacts, alertType, location, trackingLink } = alertData;
    
    // Send email notifications
    if (tourist.emailNotifications && emergencyContacts.length > 0) {
      await emailService.sendAlertEmail({
        to: tourist.email,
        touristName: tourist.full_name,
        alertType,
        location,
        trackingLink,
        emergencyContacts: emergencyContacts.filter((contact: { email: string; phone?: string }) => contact.email)
      });
    }

    // Send SMS notifications
    if (tourist.smsNotifications && emergencyContacts.length > 0) {
      for (const contact of emergencyContacts) {
        if (contact.phone) {
          await smsService.sendAlertSMS({
            touristName: tourist.full_name,
            alertType,
            location,
            trackingLink
          });
        }
      }
    }

    // Send push notifications
    if (tourist.pushNotifications) {
      // Browser push notifications would be handled client-side
      console.log("Push notification sent:", alertData);
    }

    // Store alert in database
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("alerts")
      .insert({
        user_id: tourist.id,
        type: alertType,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
        status: "active",
        message: `${alertType} detected - Location: ${location.latitude}, ${location.longitude}`
      });
  },

  async sendDailySummary(data: any): Promise<void> {
    // Send daily summary via email
    if (data.emailNotifications) {
      await emailService.sendDailySummary(data);
    }

    // Send daily summary via SMS
    if (data.smsNotifications) {
      await smsService.sendSMS(
        data.phone || '+1234567890',
        `📊 Daily Safety Summary\nTourist: ${data.touristName}\nSafety Score: ${data.safetyScore}\nActivity: ${data.activityCount} events`
      );
    }
  }
};
