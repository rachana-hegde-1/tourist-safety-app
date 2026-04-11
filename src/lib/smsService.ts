// Simulated SMS service for development/testing
interface SMSAlertData {
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
    const { touristName, alertType, location, trackingLink } = alertData;
    
    const message = `🚨 TOURIST SAFETY ALERT\n\nTourist: ${touristName}\nAlert: ${alertType}\nLocation: ${location}\nTrack: ${trackingLink}`;
    
    await this.sendSMS('+1234567890', message); // Simulated emergency contact
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
