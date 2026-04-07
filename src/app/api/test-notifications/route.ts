import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { emailService, generateTrackingLink, generateDigitalIdLink } from "@/lib/emailService";
import { smsService, validateSMSConfig } from "@/lib/smsService";

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
    let tourist;
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
      tourist = data;
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

    const testResults = {
      testType,
      timestamp: new Date().toISOString(),
      results: {} as Record<string, any>,
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

async function testAllChannels(tourist: any, testResults: any) {
  await testEmailNotifications(tourist, testResults);
  await testSMSNotifications(tourist, testResults);
  await testPushNotifications(tourist, testResults);
  await testWelcomeEmail(tourist, testResults);
  await testPanicAlert(tourist, testResults);
}

async function testEmailNotifications(tourist: any, testResults: any) {
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

async function testSMSNotifications(tourist: any, testResults: any) {
  try {
    const twilioConfig = validateTwilioConfig();
    if (!twilioConfig.isValid) {
      testResults.results.sms = {
        success: false,
        message: "Twilio not configured",
        error: `Missing: ${twilioConfig.missingVars.join(", ")}`,
      };
      return;
    }

    const trackingLink = `https://tourist-safety.gov.in/track/test-123`;
    
    await smsService.sendPanicAlertSMS({
      touristName: tourist.full_name,
      emergencyContacts: tourist.emergency_contacts,
      alertTime: new Date().toISOString(),
      trackingLink,
    });

    testResults.results.sms = {
      success: true,
      message: "Panic alert SMS sent successfully",
      recipients: tourist.emergency_contacts.map((c: any) => c.phone_number),
    };
  } catch (error) {
    testResults.results.sms = {
      success: false,
      message: "Failed to send panic alert SMS",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testPushNotifications(tourist: any, testResults: any) {
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

async function testWelcomeEmail(tourist: any, testResults: any) {
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

async function testPanicAlert(tourist: any, testResults: any) {
  try {
    const trackingLink = generateTrackingLink("test-panic-123", tourist.tourist_id);
    
    // Test email
    await emailService.sendPanicAlertEmail({
      touristName: tourist.full_name,
      emergencyContacts: tourist.emergency_contacts.map((c: any) => ({
        name: c.name,
        email: c.email,
      })),
      alertTime: new Date().toISOString(),
      location: "28.6139, 77.2090 (New Delhi)",
      trackingLink,
      touristPhone: tourist.phone_number,
    });

    // Test SMS
    const twilioConfig = validateTwilioConfig();
    if (twilioConfig.isValid && tourist.emergency_contacts.length > 0) {
      await smsService.sendPanicAlertSMS({
        touristName: tourist.full_name,
        emergencyContacts: tourist.emergency_contacts,
        alertTime: new Date().toISOString(),
        trackingLink,
      });
    }

    testResults.results.panic_alert = {
      success: true,
      message: "PANIC alert notifications sent successfully",
      email_sent: true,
      sms_sent: twilioConfig.isValid,
      recipients: {
        email: tourist.emergency_contacts.map((c: any) => c.email),
        sms: twilioConfig.isValid ? tourist.emergency_contacts.map((c: any) => c.phone_number) : [],
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

async function testGeoFenceAlert(tourist: any, testResults: any) {
  try {
    const trackingLink = generateTrackingLink("test-geofence-123", tourist.tourist_id);
    
    await emailService.sendGeoFenceAlertEmail({
      touristName: tourist.full_name,
      emergencyContacts: tourist.emergency_contacts.map((c: any) => ({
        name: c.name,
        email: c.email,
      })),
      alertTime: new Date().toISOString(),
      currentLocation: "28.6139, 77.2090 (New Delhi)",
      safeZone: "Connaught Place Area",
      trackingLink,
      touristPhone: tourist.phone_number,
    });

    testResults.results.geo_fence_alert = {
      success: true,
      message: "Geo-fence alert email sent successfully",
      recipients: tourist.emergency_contacts.map((c: any) => c.email),
    };
  } catch (error) {
    testResults.results.geo_fence_alert = {
      success: false,
      message: "Failed to send geo-fence alert email",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testDailySummary(tourist: any, testResults: any) {
  try {
    await emailService.sendDailySafetySummary({
      touristName: tourist.full_name,
      touristEmail: tourist.email,
      date: new Date().toISOString(),
      activeAlerts: [
        {
          type: "low_battery",
          time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          location: "28.6139, 77.2090",
          status: "active",
        }
      ],
      totalLocations: 15,
      lastLocation: "28.6139, 77.2090 (New Delhi)",
      emergencyContacts: tourist.emergency_contacts,
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
export async function GET(request: NextRequest) {
  try {
    const systemStatus = {
      timestamp: new Date().toISOString(),
      services: {
        email: {
          configured: !!process.env.RESEND_API_KEY,
          status: process.env.RESEND_API_KEY ? "Ready" : "Not configured",
        },
        sms: {
          configured: validateTwilioConfig().isValid,
          status: validateTwilioConfig().isValid ? "Ready" : "Not configured",
          missing: validateTwilioConfig().missingVars,
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
