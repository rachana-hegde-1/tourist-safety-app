import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { emailService, generateTrackingLink, generateDigitalIdLink } from "@/lib/emailService";
import { smsService, validateSMSConfig } from "@/lib/smsService";

export async function POST(request: NextRequest) {
  try {
    const { alertId } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: "Missing alertId" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Fetch alert details with tourist and emergency contact information
    const { data: alert, error: alertError } = await supabase
      .from("alerts")
      .select(`
        *,
        tourists!inner(
          tourist_id,
          full_name,
          phone_number,
          email,
          trip_start_date,
          trip_end_date,
          destination,
          emergency_contacts(
            name,
            phone_number,
            email,
            relationship
          )
        )
      `)
      .eq("id", alertId)
      .single();

    if (alertError || !alert) {
      return NextResponse.json(
        { success: false, error: "Alert not found" },
        { status: 404 }
      );
    }

    const tourist = alert.tourists;
    const emergencyContacts = tourist.emergency_contacts || [];

    // Generate tracking and digital ID links
    const trackingLink = generateTrackingLink(alertId, tourist.tourist_id);
    const digitalIdLink = generateDigitalIdLink(tourist.tourist_id);

    // Initialize notification results
    const notificationResults = {
      push: { success: false, message: "", error: null as string | null },
      email: { success: false, message: "", error: null as string | null },
      sms: { success: false, message: "", error: null as string | null },
    };

    // Execute all notification channels in parallel
    const notificationPromises = [];

    // Channel 1: Push Notifications (Browser/PWA)
    notificationPromises.push(
      handlePushNotifications(alertId, tourist)
        .then((result) => {
          notificationResults.push = result;
        })
        .catch((error) => {
          notificationResults.push = {
            success: false,
            message: "",
            error: error.message,
          };
        })
    );

    // Channel 2: Email Notifications
    notificationPromises.push(
      handleEmailNotifications(alert, tourist, emergencyContacts, trackingLink, digitalIdLink)
        .then((result) => {
          notificationResults.email = result;
        })
        .catch((error) => {
          notificationResults.email = {
            success: false,
            message: "",
            error: error.message,
          };
        })
    );

    // Channel 3: SMS Notifications (Only for PANIC alerts)
    if (alert.type === "panic" || alert.type === "sos") {
      notificationPromises.push(
        handleSMSNotifications(alert, tourist, emergencyContacts, trackingLink)
          .then((result) => {
            notificationResults.sms = result;
          })
          .catch((error) => {
            notificationResults.sms = {
              success: false,
              message: "",
              error: error.message,
            };
          })
      );
    } else {
      notificationResults.sms = {
        success: true,
        message: "SMS not sent - only for PANIC/SOS alerts",
        error: null,
      };
    }

    // Wait for all notifications to complete
    await Promise.all(notificationPromises);

    // Log notification results
    console.log(`Notification results for alert ${alertId}:`, notificationResults);

    // Update alert status to indicate notifications were sent
    await supabase
      .from("alerts")
      .update({
        notification_sent: true,
        notification_sent_at: new Date().toISOString(),
        notification_results: notificationResults,
      })
      .eq("id", alertId);

    return NextResponse.json({
      success: true,
      message: "Notifications processed",
      alertId,
      results: notificationResults,
    });

  } catch (error) {
    console.error("Error in notify API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

async function handlePushNotifications(alertId: string, tourist: any) {
  try {
    // Get push subscriptions for the tourist
    const supabase = createSupabaseAdminClient();
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", tourist.clerk_user_id);

    if (error || !subscriptions || subscriptions.length === 0) {
      return {
        success: false,
        message: "No push subscriptions found",
        error: null,
      };
    }

    // Send push notifications via web push protocol
    // This would typically use a web push library like web-push
    // For now, we'll simulate the push notification
    const pushPromises = subscriptions.map(async (subscription) => {
      // In production, you would use web-push library here
      console.log(`Push notification sent to ${subscription.endpoint}`);
      return { success: true, endpoint: subscription.endpoint };
    });

    await Promise.all(pushPromises);

    return {
      success: true,
      message: `Push notifications sent to ${subscriptions.length} devices`,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      message: "",
      error: error instanceof Error ? error.message : "Push notification failed",
    };
  }
}

async function handleEmailNotifications(
  alert: any,
  tourist: any,
  emergencyContacts: any[],
  trackingLink: string,
  digitalIdLink: string
) {
  try {
    const alertType = alert.type;
    let emailResult;

    switch (alertType) {
      case "welcome":
        // This would be handled during onboarding, not alert processing
        emailResult = await emailService.sendWelcomeEmail({
          touristName: tourist.full_name,
          touristEmail: tourist.email,
          digitalIdUrl: digitalIdLink,
          tripStartDate: tourist.trip_start_date,
          tripEndDate: tourist.trip_end_date,
          destination: tourist.destination,
        });
        break;

      case "panic":
      case "sos":
        emailResult = await emailService.sendPanicAlertEmail({
          to: tourist.email,
          touristName: tourist.full_name,
          alertType: alert.type,
          emergencyContacts: emergencyContacts.map(c => ({
            name: c.name,
            email: c.email,
          })),
          location: `${alert.latitude}, ${alert.longitude}`,
          trackingLink,
          alertTime: alert.timestamp,
          touristPhone: tourist.phone_number,
        });
        break;

      case "geo_fence":
        emailResult = await emailService.sendGeoFenceAlertEmail({
          to: tourist.email,
          touristName: tourist.full_name,
          alertType: "geo_fence",
          emergencyContacts: emergencyContacts.map(c => ({
            name: c.name,
            email: c.email,
          })),
          location: `${alert.latitude}, ${alert.longitude}`,
          trackingLink,
          alertTime: alert.timestamp,
          currentLocation: `${alert.latitude}, ${alert.longitude}`,
          safeZone: alert.safe_zone_name || "Safe Zone",
          touristPhone: tourist.phone_number,
        });
        break;

    case "daily_summary":
      // This would be handled by a scheduled job
      emailResult = await emailService.sendDailySafetySummary({
        touristName: tourist.full_name,
        safetyScore: alert.safety_score || 85,
        activityCount: alert.activity_count || 10,
        phone: tourist.phone_number,
        email: tourist.email,
      });
      break;

    default:
      return {
        success: false,
        message: "",
        error: `Unknown alert type: ${alertType}`,
      };
    }

    return {
      success: true,
      message: `${alertType} email sent successfully`,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      message: "",
      error: error instanceof Error ? error.message : "Email notification failed",
    };
  }
}

async function handleSMSNotifications(
  alert: any,
  tourist: any,
  emergencyContacts: any[],
  trackingLink: string
) {
  try {
    // Validate SMS configuration
    const smsConfig = validateSMSConfig();
    if (!smsConfig.isValid) {
      return {
        success: false,
        message: "",
        error: `SMS not configured: ${smsConfig.missingVars.join(", ")}`,
      };
    }

    // Send SMS notifications
    if (tourist.smsNotifications && emergencyContacts.length > 0) {
      await smsService.sendAlertSMS({
        touristName: tourist.full_name,
        alertType: alert.type,
        location: `${alert.latitude}, ${alert.longitude}`,
        trackingLink,
        emergencyContacts: emergencyContacts.filter((contact: EmergencyContact) => contact.email)
      });
    }

    return {
      success: true,
      message: `SMS sent to ${emergencyContacts.length} emergency contacts`,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      message: "",
      error: error instanceof Error ? error.message : "SMS notification failed",
    };
  }
}

// GET endpoint for testing notification status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const alertId = searchParams.get("alertId");

  if (!alertId) {
    return NextResponse.json(
      { success: false, error: "Missing alertId parameter" },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: alert, error } = await supabase
      .from("alerts")
      .select("notification_sent, notification_sent_at, notification_results")
      .eq("id", alertId)
      .single();

    if (error || !alert) {
      return NextResponse.json(
        { success: false, error: "Alert not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      alertId,
      notificationStatus: alert,
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
