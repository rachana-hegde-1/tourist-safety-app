import { Resend } from "resend";

// Email service for tourist safety notifications - Updated 2026-04-08

interface EmailService {
  sendWelcomeEmail: (data: WelcomeEmailData) => Promise<void>;
  sendPanicAlertEmail: (data: PanicAlertEmailData) => Promise<void>;
  sendGeoFenceAlertEmail: (data: GeoFenceAlertEmailData) => Promise<void>;
  sendDailySafetySummary: (data: DailySafetySummaryData) => Promise<void>;
  sendAlertEmail: (data: AlertEmailData) => Promise<void>;
}

interface EmergencyContact {
  name: string;
  email: string;
  phone?: string;
}

export interface AlertEmailData {
  to: string;
  touristName: string;
  alertType: string;
  location: string;
  trackingLink: string;
  emergencyContacts: Array<EmergencyContact>;
}

interface PanicAlertEmailData {
  to: string;
  touristName: string;
  alertType: string;
  emergencyContacts: Array<EmergencyContact>;
  location: string;
  trackingLink: string;
  alertTime?: string;
  touristPhone?: string;
}


interface GeoFenceAlertEmailData {
  to: string;
  touristName: string;
  alertType: string;
  location: string;
  trackingLink: string;
  emergencyContacts: Array<EmergencyContact>;
  alertTime?: string;
  currentLocation?: string;
  safeZone?: string;
  touristPhone?: string;
}

interface DailySafetySummaryData {
  touristName: string;
  safetyScore: number;
  activityCount: number;
  phone?: string;
  email: string;
}

interface WelcomeEmailData {
  touristName: string;
  touristEmail: string;
  digitalIdUrl: string;
  tripStartDate: string;
  tripEndDate: string;
  destination: string;
}


interface DailySafetySummaryData {
  touristName: string;
  safetyScore: number;
  activityCount: number;
  phone?: string;
  email: string;
  touristEmail?: string;
  date?: string;
  activeAlerts?: Array<{
    type: string;
    time: string;
    location: string;
    status: string;
  }>;
  totalLocations?: number;
  lastLocation?: string;
  emergencyContacts?: Array<{
    name: string;
    phone: string;
  }>;
}

export class EmailNotificationService implements EmailService {
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    try {
      const emailHtml = this.generateWelcomeEmailHtml(data);

      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: "Tourist Safety System <noreply@tourist-safety.gov.in>",
        to: [data.touristEmail],
        subject: "Welcome to Tourist Safety System - Your Digital ID is Ready",
        html: emailHtml,
      });

      console.log("Welcome email sent successfully to:", data.touristEmail);
    } catch (error) {
      console.error("Error sending welcome email:", error);
      throw new Error(`Failed to send welcome email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async sendPanicAlertEmail(data: PanicAlertEmailData): Promise<void> {
    try {
      const emailPromises = data.emergencyContacts.map(async (contact) => {
        const emailHtml = this.generatePanicAlertEmailHtml(data, contact.name);

        return new Resend(process.env.RESEND_API_KEY).emails.send({
          from: "Tourist Safety System <alerts@tourist-safety.gov.in>",
          to: [contact.email],
          subject: `URGENT: Emergency Alert for ${data.touristName}`,
          html: emailHtml,
        });
      });

      await Promise.all(emailPromises);
      console.log("Panic alert emails sent successfully to:", data.emergencyContacts.map(c => c.email).join(", "));
    } catch (error) {
      console.error("Error sending panic alert emails:", error);
      throw new Error(`Failed to send panic alert emails: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async sendGeoFenceAlertEmail(data: GeoFenceAlertEmailData): Promise<void> {
    try {
      const emailPromises = data.emergencyContacts.map(async (contact) => {
        const emailHtml = this.generateGeoFenceAlertEmailHtml(data, contact.name);

        return new Resend(process.env.RESEND_API_KEY).emails.send({
          from: "Tourist Safety System <alerts@tourist-safety.gov.in>",
          to: [contact.email],
          subject: `Zone Breach Alert for ${data.touristName}`,
          html: emailHtml,
        });
      });

      await Promise.all(emailPromises);
      console.log("Geo-fence alert emails sent successfully to:", data.emergencyContacts.map(c => c.email).join(", "));
    } catch (error) {
      console.error("Error sending geo-fence alert emails:", error);
      throw new Error(`Failed to send geo-fence alert emails: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async sendAlertEmail(data: AlertEmailData): Promise<void> {
    try {
      const emailHtml = this.generateAlertEmailHtml(data);
      
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Tourist Safety <noreply@touristsafety.com>",
        to: [data.to],
        subject: `Safety Alert - ${data.alertType}`,
        html: emailHtml,
      });
      
      console.log(`Alert email sent to ${data.to}`);
    } catch (error) {
      console.error("Error sending alert email:", error);
      throw error;
    }
  }

  async sendDailySafetySummary(data: DailySafetySummaryData): Promise<void> {
    try {
      const emailHtml = this.generateDailySafetySummaryHtml(data);
      
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Tourist Safety <noreply@touristsafety.com>",
        to: [data.email],
        subject: `Daily Safety Summary - ${data.touristName}`,
        html: emailHtml,
      });
      
      console.log(`Daily summary email sent to ${data.email}`);
    } catch (error) {
      console.error("Error sending daily summary email:", error);
      throw error;
    }
  }

  private generateAlertEmailHtml(data: AlertEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Safety Alert - ${data.alertType}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
          .alert-info { background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .tracking-link { background-color: #1e40af; color: white; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0; }
          .tracking-link a { color: white; text-decoration: none; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1> SAFETY ALERT</h1>
            <p>${data.alertType.toUpperCase()} DETECTED</p>
          </div>
          
          <div class="alert-info">
            <h3>Tourist: ${data.touristName}</h3>
            <p><strong>Alert Type:</strong> ${data.alertType}</p>
            <p><strong>Location:</strong> ${data.location}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="tracking-link">
            <a href="${data.trackingLink}">TRACK TOURIST LOCATION</a>
          </div>
          
          <div class="emergency-contacts">
            <h3>Emergency Contacts:</h3>
            ${(data.emergencyContacts || []).map(contact => `
              <p><strong>${contact.name}:</strong> ${contact.email}</p>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>This is an automated safety alert from the Tourist Safety System.</p>
            <p>Please take immediate action if you are an emergency contact.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailHtml(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Tourist Safety System</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Tourist Safety System</h1>
            <p>Government of India</p>
          </div>
          <div class="content">
            <h2>Welcome, ${data.touristName}!</h2>
            <p>Your registration has been successfully completed, and your Digital Tourist ID is now ready.</p>
            
            <h3>Your Trip Details</h3>
            <p><strong>Destination:</strong> ${data.destination}</p>
            <p><strong>Trip Period:</strong> ${new Date(data.tripStartDate || '').toLocaleDateString()} - ${new Date(data.tripEndDate || '').toLocaleDateString()}</p>
            
            <a href="${data.digitalIdUrl}" class="button">View Your Digital ID</a>
            
            <p>Your Digital ID provides you with official identification, emergency support, and real-time alerts during your visit to India.</p>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #92400e; margin: 0 0 8px 0;">Security Notice</h4>
              <p style="color: #78350f; margin: 0;">Your Digital ID uses cryptographic hashing to ensure authenticity and prevent tampering.</p>
            </div>
          </div>
          <div class="footer">
            <p>For emergency assistance, call: 100 (Police) | 108 (Ambulance) | 101 (Fire)</p>
            <p>Tourist Safety Helpline: 1800-XXX-XXXX (24/7)</p>
            <p>© 2024 Tourist Safety System. Government of India. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePanicAlertEmailHtml(data: PanicAlertEmailData, contactName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>EMERGENCY ALERT</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #fef2f2; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; border: 2px solid #dc2626; }
          .content { background: white; padding: 40px; border: 2px solid #dc2626; border-top: none; }
          .alert-box { background: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .details { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; text-transform: uppercase; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EMERGENCY ALERT</h1>
            <p>Tourist Safety System</p>
          </div>
          <div class="content">
            <h2>Dear ${contactName},</h2>
            
            <div class="alert-box">
              <h3>URGENT: PANIC ALERT ACTIVATED</h3>
              <p>${data.touristName} has triggered an emergency alert and needs immediate assistance.</p>
            </div>

            <div class="details">
              <h3>Emergency Details</h3>
              <p><strong>Tourist:</strong> ${data.touristName}</p>
              <p><strong>Time:</strong> ${new Date(data.alertTime || new Date()).toLocaleString()}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Contact:</strong> ${data.touristPhone}</p>
              <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">ACTIVE EMERGENCY</span></p>
            </div>

            <h3>IMMEDIATE ACTIONS REQUIRED</h3>
            <ol>
              <li><strong>Track Location:</strong> Click the button below to track ${data.touristName}'s real-time location</li>
              <li><strong>Contact Authorities:</strong> Call emergency services if you haven't already</li>
              <li><strong>Stay Available:</strong> Keep your phone available for coordination</li>
            </ol>

            <div style="text-align: center;">
              <a href="${data.trackingLink}" class="button">TRACK LIVE LOCATION</a>
            </div>

            <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin: 0 0 8px 0;">IMPORTANT</h4>
              <p style="color: #1e40af; margin: 0;">This is an automated emergency alert. The tourist safety system has automatically notified local authorities. Please cooperate fully with emergency responders.</p>
            </div>
          </div>
          <div class="footer">
            <p>Emergency Numbers: Police (100) | Ambulance (108) | Fire (101)</p>
            <p>Tourist Safety Helpline: 1800-XXX-XXXX (24/7)</p>
            <p>© 2024 Tourist Safety System. Government of India. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateGeoFenceAlertEmailHtml(data: GeoFenceAlertEmailData, contactName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ZONE BREACH ALERT</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #fffbeb; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; border: 2px solid #f59e0b; }
          .content { background: white; padding: 40px; border: 2px solid #f59e0b; border-top: none; }
          .alert-box { background: #f59e0b; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .details { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ZONE BREACH ALERT</h1>
            <p>Tourist Safety System</p>
          </div>
          <div class="content">
            <h2>Dear ${contactName},</h2>
            
            <div class="alert-box">
              <h3>GEO-FENCE BREACH DETECTED</h3>
              <p>${data.touristName} has moved outside the designated safe zone area.</p>
            </div>

            <div class="details">
              <h3>Breach Details</h3>
              <p><strong>Tourist:</strong> ${data.touristName}</p>
              <p><strong>Time:</strong> ${new Date(data.alertTime || new Date()).toLocaleString()}</p>
              <p><strong>Current Location:</strong> ${data.currentLocation}</p>
              <p><strong>Safe Zone:</strong> ${data.safeZone}</p>
              <p><strong>Status:</strong> <span style="color: #92400e; font-weight: bold;">OUTSIDE SAFE ZONE</span></p>
              <p><strong>Contact:</strong> ${data.touristPhone}</p>
            </div>

            <h3>RECOMMENDED ACTIONS</h3>
            <ol>
              <li><strong>Contact Tourist:</strong> Reach out to ${data.touristName} to check their safety status</li>
              <li><strong>Track Location:</strong> Monitor their current position using the tracking link</li>
              <li><strong>Assess Situation:</strong> Determine if this is an emergency or planned movement</li>
            </ol>

            <div style="text-align: center;">
              <a href="${data.trackingLink}" class="button">TRACK LOCATION</a>
            </div>

            <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin: 0 0 8px 0;">About Geo-Fence Alerts</h4>
              <p style="color: #1e40af; margin: 0;">Geo-fence alerts are triggered when a tourist moves outside their designated safe area. This may be normal travel or could indicate a potential safety concern.</p>
            </div>
          </div>
          <div class="footer">
            <p>Emergency Numbers: Police (100) | Ambulance (108) | Fire (101)</p>
            <p>Tourist Safety Helpline: 1800-XXX-XXXX (24/7)</p>
            <p>© 2024 Tourist Safety System. Government of India. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateDailySafetySummaryHtml(data: DailySafetySummaryData): string {
    const alertsHtml = data.activeAlerts && data.activeAlerts.length > 0 
      ? (data.activeAlerts || []).map(alert => `
          <div style="background: #fef2f2; border: 1px solid #dc2626; padding: 16px; border-radius: 6px; margin: 10px 0;">
            <h4 style="color: #dc2626; margin: 0 0 8px 0;">${alert.type.toUpperCase()}</h4>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${new Date(alert.time || new Date()).toLocaleString()}</p>
            <p style="margin: 4px 0;"><strong>Location:</strong> ${alert.location}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> ${alert.status}</p>
          </div>
        `).join('')
      : '<p style="color: #059669; font-weight: bold;">No active alerts - You are safe!</p>';

    const contactsHtml = (data.emergencyContacts || []).map(contact => 
      `<div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin: 8px 0; border: 1px solid #e2e8f0;">
        <strong>${contact.name}</strong><br>
        <span style="color: #3b82f6;">${contact.phone}</span>
      </div>`
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Daily Safety Summary</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
          .summary-box { display: flex; justify-content: space-around; margin: 20px 0; }
          .summary-item { text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 0 8px; }
          .summary-number { font-size: 24px; font-weight: bold; color: #3b82f6; margin: 0 0 8px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Daily Safety Summary</h1>
            <p>Tourist Safety System</p>
          </div>
          <div class="content">
            <h2>Dear ${data.touristName},</h2>
            <p>Here's your daily safety summary for ${new Date(data.date || new Date()).toLocaleDateString()}.</p>
            
            <div class="summary-box">
              <div class="summary-item">
                <div class="summary-number">${data.totalLocations}</div>
                <div>Location Updates</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${data.activeAlerts ? data.activeAlerts.length : 0}</div>
                <div>Active Alerts</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${data.emergencyContacts ? data.emergencyContacts.length : 0}</div>
                <div>Emergency Contacts</div>
              </div>
            </div>

            <h3>Active Alerts</h3>
            ${alertsHtml}

            <h3>Location Activity</h3>
            <p><strong>Last Known Location:</strong> ${data.lastLocation}</p>
            <p style="color: #6b7280; font-size: 14px;">Your location tracking helps us provide better emergency response when needed.</p>

            <h3>Emergency Contacts</h3>
            ${contactsHtml}

            <h3>Safety Tips</h3>
            <ol>
              <li>Keep your phone charged and location services enabled for better tracking</li>
              <li>Share your itinerary with trusted contacts before traveling</li>
              <li>Use the panic button feature in emergencies for immediate assistance</li>
            </ol>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Emergency Information</h3>
              <p><strong>Police:</strong> 100 | <strong>Ambulance:</strong> 108 | <strong>Fire:</strong> 101</p>
              <p><strong>Tourist Safety Helpline:</strong> 1800-XXX-XXXX (24/7)</p>
            </div>
          </div>
          <div class="footer">
            <p>This summary was generated automatically. You can manage your notification preferences in your account settings.</p>
            <p>© 2024 Tourist Safety System. Government of India. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Singleton instance
export const emailService = new EmailNotificationService();

// Helper function to generate tracking links
export function generateTrackingLink(alertId: string, touristId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tourist-safety.gov.in";
  return `${baseUrl}/track/${alertId}?tourist=${touristId}`;
}

// Helper function to generate digital ID links
export function generateDigitalIdLink(touristId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tourist-safety.gov.in";
  return `${baseUrl}/id?tourist=${touristId}`;
}
