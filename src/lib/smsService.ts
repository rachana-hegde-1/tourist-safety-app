// Simulated SMS service for development/testing
import { createSupabaseAdminClient } from "./supabase";

interface SMSAlertData {
  alertId?: string;
  touristId?: string;
  touristName: string;
  alertType: string;
  location: string;
  trackingLink: string;
  emergencyContacts?: Array<{ name?: string; phone_number?: string; email?: string }>;
}

interface SMSService {
  sendSMS: (to: string, message: string) => Promise<{ success: boolean; message?: string }>;
  sendAlertSMS: (alertData: SMSAlertData) => Promise<void>;
  getAccountBalance: () => Promise<string>;
}

export const smsService: SMSService = {
  async sendSMS(to: string, message: string): Promise<{ success: boolean; message?: string }> {
    // Simulate SMS sending with delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`📱 SMS Simulation: Sending to ${to}: "${message}"`);
    
    // Simulate success/failure based on phone number format
    const isValidPhone = /^\+?[1-9]\d{1,14}$/.test(to);
    
    if (!isValidPhone) {
      return { 
        success: false, 
        message: `Invalid phone number format: ${to}` 
      };
    }
    
    return { 
      success: true, 
      message: `SMS sent successfully to ${to}` 
    };
  },

  async sendAlertSMS(alertData: SMSAlertData): Promise<void> {
    const { alertId, touristId, touristName, alertType, location, trackingLink, emergencyContacts } = alertData;

    const message = `🚨 TOURIST SAFETY ALERT\n\nTourist: ${touristName}\nAlert: ${alertType}\nLocation: ${location}\nTrack: ${trackingLink}`;

    // Log simulated SMS to database for each emergency contact
    if (emergencyContacts && emergencyContacts.length > 0) {
      const supabase = createSupabaseAdminClient();

      for (const contact of emergencyContacts) {
        if (contact.phone_number && contact.name) {
          await supabase
            .from("sms_logs")
            .insert({
              alert_id: alertId,
              tourist_id: touristId || 'unknown',
              recipient_name: contact.name,
              recipient_phone: contact.phone_number,
              message: message
            });

          console.log(`📱 SMS Simulation: Logged SMS to ${contact.name} (${contact.phone_number}): "${message}"`);
        }
      }
    } else {
      // Fallback for backward compatibility
      await this.sendSMS('+1234567890', message);
    }
  },

  async getAccountBalance(): Promise<string> {
    // Simulate account balance
    return `SMS Balance: 1000 credits (Simulation)`;
  }
};

// Validation function for Twilio config
export function validateSMSConfig() {
  return {
    isValid: true, // Always valid in simulation mode
    missingVars: [] // No missing variables in simulation
  };
}
