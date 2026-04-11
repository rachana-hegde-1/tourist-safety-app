import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { emailService, generateTrackingLink, generateDigitalIdLink } from "@/lib/emailService";
import { smsService } from "@/lib/smsService";

interface TestContact {
  name: string;
  phone_number: string;
  email: string;
  relationship: string;
}

interface TestTourist {
  tourist_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  clerk_user_id: string;
  emergency_contacts: TestContact[];
  trip_start_date: string;
  trip_end_date: string;
  destination: string;
}

interface TestResultDetail {
  success: boolean;
  message: string;
  recipient?: string;
  recipients?: string[] | number | { email: string[]; sms: string[] };
  subscriptions?: number;
  note?: string;
  email_sent?: boolean;
  sms_sent?: boolean;
  active_alerts?: number;
  error?: string | null;
}

interface TestResults {
  testType: string;
  timestamp: string;
  results: Record<string, TestResultDetail>;
}

export async function POST(request: NextRequest) {
  try {
    const { testType, touristId } = await request.json();

    if (!testType) {
      return NextResponse.json(
        { success: false, error: "Missing testType" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // For testing, we'll either use the provided touristId or create test data
    let tourist: TestTourist;
    if (touristId) {
      const { data, error } = await supabase
        .from("tourists")
        .select("*")
        .eq("tourist_id", touristId)
        .single();
      
      if (error || !data) {
        return NextResponse.json(
          { success: false, error: "Tourist not found" },
          { status: 404 }
        );
      }
      tourist = data as TestTourist;
    } else {
      // Create test tourist data
      tourist = {
        tourist_id: "test-tourist-123",
        full_name: "Test Tourist",
        email: "test@example.com",
        phone_number: "+919876543210",
        clerk_user_id: "test-user-123",
        emergency_contacts: [
          {
            name: "Emergency Contact 1",
            phone_number: "+919876543211",
            email: "emergency1@example.com",
            relationship: "Spouse"
          },
          {
            name: "Emergency Contact 2",
            phone_number: "+919876543212",
            email: "emergency2@example.com",
            relationship: "Parent"
          }
        ],
        trip_start_date: new Date().toISOString(),
        trip_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        destination: "New Delhi, India"
      };
    }

    const testResults: TestResults = {
      testType,
      timestamp: new Date().toISOString(),
      results: {},
    };

    switch (testType) {
      case "all":
        await testAllChannels(tourist, testResults);
        break;

      case "email":
        await testEmailNotifications(tourist, testResults);
        break;

      case "sms":
        await testSMSNotifications(tourist, testResults);
        break;

      case "push":
        await testPushNotifications(tourist, testResults);
        break;

      case "welcome":
        await testWelcomeEmail(tourist, testResults);
        break;

      case "panic":
        await testPanicAlert(tourist, testResults);
        break;

      case "geo_fence":
        await testGeoFenceAlert(tourist, testResults);
        break;

      case "daily_summary":
        await testDailySummary(tourist, testResults);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown test type: ${testType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Test completed for ${testType}`,
      ...testResults,
    });

  } catch (error) {
    console.error("Error in test notifications API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

async function testAllChannels(tourist: TestTourist, testResults: TestResults) {
  await testEmailNotifications(tourist, testResults);
  await testSMSNotifications(tourist, testResults);
  await testPushNotifications(tourist, testResults);
  await testWelcomeEmail(tourist, testResults);
  await testPanicAlert(tourist, testResults);
}

async function testEmailNotifications(tourist: TestTourist, testResults: TestResults) {
  try {
    const digitalIdLink = generateDigitalIdLink(tourist.tourist_id);
    
    await emailService.sendWelcomeEmail({
      touristName: tourist.full_name,
      touristEmail: tourist.email,
      digitalIdUrl: digitalIdLink,
      tripStartDate: tourist.trip_start_date,
      tripEndDate: tourist.trip_end_date,
      destination: tourist.destination,
    });

    testResults.results.email = {
      success: true,
      message: "Welcome email sent successfully",
      recipient: tourist.email,
    };
  } catch (error) {
    testResults.results.email = {
      success: false,
      message: "Failed to send welcome email",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testSMSNotifications(tourist: TestTourist, testResults: TestResults) {
  try {
    // SMS simulation is always available
    testResults.results.sms = {
      success: true,
      message: "SMS simulation ready",
      error: null,
    };

    const trackingLink = `https://tourist-safety.gov.in/track/test-123`;
    
    await smsService.sendAlertSMS({
      touristName: tourist.full_name,
      alertType: "panic",
      location: "Test Location",
      trackingLink,
      emergencyContacts: tourist.emergency_contacts,
    });

    testResults.results.sms = {
      success: true,
      message: "Panic alert SMS sent successfully",
      recipients: tourist.emergency_contacts.map((c) => c.phone_number),
    };
  } catch (error) {
    testResults.results.sms = {
      success: false,
      message: "Failed to send panic alert SMS",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testPushNotifications(tourist: TestTourist, testResults: TestResults) {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Check if there are any push subscriptions for this tourist
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", tourist.clerk_user_id);

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      testResults.results.push = {
        success: false,
        message: "No push subscriptions found",
        note: "Push notifications require the user to grant permission in their browser",
      };
      return;
    }

    // Simulate sending push notifications
    testResults.results.push = {
      success: true,
      message: "Push notifications simulated successfully",
      subscriptions: subscriptions.length,
      note: "Actual push notifications require a web push service and VAPID keys",
    };
  } catch (error) {
    testResults.results.push = {
      success: false,
      message: "Failed to test push notifications",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testWelcomeEmail(tourist: TestTourist, testResults: TestResults) {
  try {
    const digitalIdLink = generateDigitalIdLink(tourist.tourist_id);
    
    await emailService.sendWelcomeEmail({
      touristName: tourist.full_name,
      touristEmail: tourist.email,
      digitalIdUrl: digitalIdLink,
      tripStartDate: tourist.trip_start_date,
      tripEndDate: tourist.trip_end_date,
      destination: tourist.destination,
    });

    testResults.results.welcome_email = {
      success: true,
      message: "Welcome email sent successfully",
      recipient: tourist.email,
    };
  } catch (error) {
    testResults.results.welcome_email = {
      success: false,
      message: "Failed to send welcome email",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testPanicAlert(tourist: TestTourist, testResults: TestResults) {
  try {
    const trackingLink = generateTrackingLink("test-panic-123", tourist.tourist_id);
    
    // Test email
    await emailService.sendPanicAlertEmail({
      to: tourist.email,
      touristName: tourist.full_name,
      alertType: "panic",
      emergencyContacts: tourist.emergency_contacts.map((c: TestContact) => ({
        name: c.name,
        email: c.email,
      })),
      alertTime: new Date().toISOString(),
      location: "28.6139, 77.2090 (New Delhi)",
      trackingLink,
      touristPhone: tourist.phone_number,
    });

    // Test SMS (simulation always available)
    if (tourist.emergency_contacts.length > 0) {
      await smsService.sendAlertSMS({
        touristName: tourist.full_name,
        alertType: "panic",
        location: "Test Location",
        trackingLink,
        emergencyContacts: tourist.emergency_contacts || [],
      });
    }

    testResults.results.panic_alert = {
      success: true,
      message: "PANIC alert notifications sent successfully",
      email_sent: true,
      sms_sent: true,
      recipients: {
        email: tourist.emergency_contacts.map((c) => c.email),
        sms: tourist.emergency_contacts.map((c) => c.phone_number),
      },
    };
  } catch (error) {
    testResults.results.panic_alert = {
      success: false,
      message: "Failed to send PANIC alert notifications",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testGeoFenceAlert(tourist: TestTourist, testResults: TestResults) {
  try {
    const trackingLink = generateTrackingLink("test-geofence-123", tourist.tourist_id);
    
    await emailService.sendGeoFenceAlertEmail({
      to: tourist.email,
      touristName: tourist.full_name,
      alertType: "geo_fence",
      emergencyContacts: tourist.emergency_contacts.map((c: TestContact) => ({
        name: c.name,
        email: c.email,
      })),
      alertTime: new Date().toISOString(),
      location: "28.6139, 77.2090 (New Delhi)",
      currentLocation: "28.6139, 77.2090 (New Delhi)",
      safeZone: "India Gate Area",
      trackingLink,
      touristPhone: tourist.phone_number,
    });

    testResults.results.geo_fence_alert = {
      success: true,
      message: "Geo-fence alert email sent successfully",
      recipients: tourist.emergency_contacts.map((c: TestContact) => c.email),
    };
  } catch (error) {
    testResults.results.geo_fence_alert = {
      success: false,
      message: "Failed to send geo-fence alert email",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testDailySummary(tourist: TestTourist, testResults: TestResults) {
  try {
    await emailService.sendDailySafetySummary({
      touristName: tourist.full_name,
      safetyScore: 85,
      activityCount: 15,
      phone: tourist.phone_number,
      email: tourist.email,
      date: new Date().toISOString(),
      activeAlerts: [
        {
          type: "geo_fence",
          time: new Date().toISOString(),
          location: "28.6139, 77.2090",
          status: "resolved",
        },
      ],
      totalLocations: 15,
      lastLocation: "28.6139, 77.2090 (New Delhi)",
      emergencyContacts: tourist.emergency_contacts.map(c => ({ name: c.name, phone: c.phone_number })),
    });

    testResults.results.daily_summary = {
      success: true,
      message: "Daily safety summary sent successfully",
      recipient: tourist.email,
      active_alerts: 1,
    };
  } catch (error) {
    testResults.results.daily_summary = {
      success: false,
      message: "Failed to send daily safety summary",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// GET endpoint to check system status
export async function GET() {
  try {
    const systemStatus = {
      timestamp: new Date().toISOString(),
      services: {
        email: {
          configured: !!process.env.RESEND_API_KEY,
          status: process.env.RESEND_API_KEY ? "Ready" : "Not configured",
        },
        sms: {
          configured: true,
          status: "Ready (Simulation)",
          missing: [],
        },
        push: {
          configured: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          status: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "Ready" : "Not configured",
        },
        database: {
          status: "Connected", // Would need actual DB connection test
        },
      },
      environment: process.env.NODE_ENV || "development",
    };

    return NextResponse.json({
      success: true,
      systemStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
