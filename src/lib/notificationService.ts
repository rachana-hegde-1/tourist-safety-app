import { smsService } from "./smsService";
import { emailService, AlertEmailData, WelcomeEmailDataType } from "./emailService";
import { createSupabaseAdminClient } from "./supabase";

interface NotificationService {
  sendWelcomeEmail: (data: WelcomeEmailDataType) => Promise<void>;
  sendAlertNotifications: (alertData: AlertData) => Promise<void>;
  sendDailySummary: (data: DailySummaryData) => Promise<void>;
  sendAlertEmail: (data: AlertEmailData) => Promise<void>;
}

// Type for alert data
interface EmergencyContactInfo {
  name: string;
  email?: string;
  phone?: string;
}

interface AlertData {
  tourist: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
  };
  emergencyContacts: EmergencyContactInfo[];
  alertType: string;
  location: string;
  trackingLink: string;
}

interface DailySummaryData {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  touristName: string;
  safetyScore: number;
  activityCount: number;
  phone?: string;
  email: string;
}

export const notificationService: NotificationService = {
  async sendWelcomeEmail(data: WelcomeEmailDataType): Promise<void> {
    await emailService.sendWelcomeEmail(data);
  },

  async sendAlertEmail(data: AlertEmailData): Promise<void> {
    await emailService.sendAlertEmail(data);
  },

  async sendAlertNotifications(alertData: AlertData): Promise<void> {
    const { tourist, emergencyContacts, alertType, location, trackingLink } = alertData;
    
    // Send email notifications
    if (tourist.emailNotifications && emergencyContacts.length > 0) {
      await emailService.sendAlertEmail({
        to: tourist.email,
        touristName: tourist.full_name,
        alertType,
        location,
        trackingLink,
        emergencyContacts: emergencyContacts.filter((contact) => contact.email).map((contact) => ({ name: contact.name, email: contact.email!, phone: contact.phone }))
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

    const locationString = location;
    const [latitude, longitude] = locationString
      .split(",")
      .map((part) => parseFloat(part.trim()));

    // Store alert in database
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("alerts")
      .insert({
        user_id: tourist.id,
        type: alertType,
        latitude: Number.isFinite(latitude) ? latitude : 0,
        longitude: Number.isFinite(longitude) ? longitude : 0,
        timestamp: new Date().toISOString(),
        status: "active",
        message: `${alertType} detected - Location: ${locationString}`
      });
  },

  async sendDailySummary(data: DailySummaryData): Promise<void> {
    // Send daily summary via email
    if (data.emailNotifications) {
      await emailService.sendDailySafetySummary(data);
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
