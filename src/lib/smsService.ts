import { Twilio } from "twilio";

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface SMSService {
  sendPanicAlertSMS: (data: PanicAlertSMSData) => Promise<void>;
}

interface PanicAlertSMSData {
  touristName: string;
  emergencyContacts: Array<{
    name: string;
    phone: string;
  }>;
  alertTime: string;
  trackingLink: string;
}

export class SMSNotificationService implements SMSService {
  async sendPanicAlertSMS(data: PanicAlertSMSData): Promise<void> {
    try {
      const smsPromises = data.emergencyContacts.map(async (contact) => {
        const message = this.generatePanicAlertMessage(data.touristName, data.alertTime, data.trackingLink);
        
        return twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER!,
          to: contact.phone,
        });
      });

      const results = await Promise.all(smsPromises);
      console.log("Panic alert SMS sent successfully to:", data.emergencyContacts.map(c => c.phone).join(", "));
      
      // Log individual message statuses
      results.forEach((result, index) => {
        console.log(`SMS to ${data.emergencyContacts[index].phone}: ${result.status}`);
      });
    } catch (error) {
      console.error("Error sending panic alert SMS:", error);
      throw new Error(`Failed to send panic alert SMS: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private generatePanicAlertMessage(touristName: string, alertTime: string, trackingLink: string): string {
    const time = new Date(alertTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Keep message under 160 characters for SMS compatibility
    const message = `ALERT: ${touristName} triggered emergency at ${time}. Track live: ${trackingLink}. Call police: 100`;
    
    // If message is too long, truncate the tracking link
    if (message.length > 160) {
      const shortLink = trackingLink.length > 50 ? trackingLink.substring(0, 47) + "..." : trackingLink;
      return `ALERT: ${touristName} triggered emergency at ${time}. Track: ${shortLink}. Call police: 100`;
    }
    
    return message;
  }

  // Helper method to validate phone numbers
  private validatePhoneNumber(phone: string): boolean {
    // Basic validation for Indian phone numbers
    const phoneRegex = /^[+]?[91]?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[-\s]/g, ""));
  }

  // Helper method to format phone numbers
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, "");
    
    // Add +91 prefix if it's a 10-digit Indian number
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    
    // Add + prefix if it doesn't have one
    if (cleaned.length > 10 && !cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return cleaned;
  }

  // Method to send test SMS (for development/testing)
  async sendTestSMS(phoneNumber: string): Promise<void> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.validatePhoneNumber(formattedPhone)) {
        throw new Error("Invalid phone number format");
      }

      await twilioClient.messages.create({
        body: "Test message from Tourist Safety System",
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: formattedPhone,
      });
      
      console.log("Test SMS sent successfully to:", formattedPhone);
    } catch (error) {
      console.error("Error sending test SMS:", error);
      throw new Error(`Failed to send test SMS: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Method to check Twilio account balance
  async getAccountBalance(): Promise<string> {
    try {
      const account = await twilioClient.api.v2010.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
      return `Account balance: ${account.balance}`;
    } catch (error) {
      console.error("Error fetching account balance:", error);
      return "Unable to fetch account balance";
    }
  }
}

// Singleton instance
export const smsService = new SMSNotificationService();

// Helper function to generate short tracking URLs (you can integrate with URL shorteners)
export function generateShortTrackingUrl(trackingLink: string): string {
  // For now, return the original link
  // In production, you might want to integrate with services like Bit.ly, TinyURL, etc.
  return trackingLink;
}

// Helper function to validate Twilio configuration
export function validateTwilioConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}
