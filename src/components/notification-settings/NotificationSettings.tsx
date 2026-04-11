"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  dailySummaryEnabled: boolean;
  preferences: {
    [alertType: string]: {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
  };
}

export function NotificationSettings() {
  const { isSupported, permission, requestPermission, subscribeToPush, unsubscribeFromPush } = useNotifications();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    dailySummaryEnabled: false,
    preferences: {
      panic: { push: true, email: true, sms: true },
      geo_fence: { push: true, email: true, sms: false },
      low_battery: { push: true, email: true, sms: false },
      fall_detected: { push: true, email: true, sms: false },
      daily_summary: { push: false, email: true, sms: false },
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const loadNotificationSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tourist } = await supabase
        .from("tourists")
        .select("notification_settings, email_notifications, sms_notifications, push_notifications, daily_summary_enabled")
        .eq("clerk_user_id", user.id)
        .single();

      if (tourist) {
        setSettings({
          emailNotifications: tourist.email_notifications,
          smsNotifications: tourist.sms_notifications,
          pushNotifications: tourist.push_notifications,
          dailySummaryEnabled: tourist.daily_summary_enabled,
          preferences: tourist.notification_settings?.preferences || settings.preferences,
        });
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, settings.preferences]);

  useEffect(() => {
    loadNotificationSettings();
  }, [loadNotificationSettings]);

  const saveNotificationSettings = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("tourists")
        .update({
          email_notifications: settings.emailNotifications,
          sms_notifications: settings.smsNotifications,
          push_notifications: settings.pushNotifications,
          daily_summary_enabled: settings.dailySummaryEnabled,
          notification_settings: {
            preferences: settings.preferences,
          },
        })
        .eq("clerk_user_id", user.id);

      // Save individual notification preferences
      const preferencePromises = Object.entries(settings.preferences).map(([alertType, channels]) => {
        return Object.entries(channels).map(([channel, enabled]) => {
          return supabase
            .from("notification_preferences")
            .upsert({
              user_id: user.id,
              alert_type: alertType,
              channel: channel,
              enabled: enabled,
            }, { onConflict: "user_id,alert_type,channel" });
        });
      });

      await Promise.all(preferencePromises.flat());

      console.log("Notification settings saved successfully");
    } catch (error) {
      console.error("Error saving notification settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled && !permission.granted) {
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
      await subscribeToPush();
    } else if (!enabled && permission.granted) {
      await unsubscribeFromPush();
    }

    setSettings(prev => ({ ...prev, pushNotifications: enabled }));
  };

  const updatePreference = (alertType: string, channel: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [alertType]: {
          ...prev.preferences[alertType],
          [channel]: enabled,
        },
      },
    }));
  };

  const getAlertTypeLabel = (type: string) => {
    const labels = {
      panic: "PANIC/SOS Alert",
      geo_fence: "Geo-Fence Breach",
      low_battery: "Low Battery",
      fall_detected: "Fall Detection",
      daily_summary: "Daily Summary",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getChannelIcon = (channel: string) => {
    const icons = {
      push: "Notifications",
      email: "Email",
      sms: "SMS",
    };
    return icons[channel as keyof typeof icons] || channel;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Settings</h2>
        <p className="text-gray-600">Manage how you receive safety alerts and updates.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="alerts">Alert Types</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Choose which channels you want to receive notifications through.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-600">
                    Receive alerts via email with detailed information and tracking links.
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onChange={(checked) =>
                    setSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <p className="text-sm text-gray-600">
                    Critical alerts sent via SMS for immediate attention.
                  </p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.smsNotifications}
                  onChange={(checked) =>
                    setSettings(prev => ({ ...prev, smsNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-gray-600">
                    Instant browser notifications for real-time alerts.
                  </p>
                  {!isSupported && (
                    <Badge variant="destructive" className="mt-1">
                      Not supported on this device
                    </Badge>
                  )}
                  {isSupported && permission.denied && (
                    <Badge variant="destructive" className="mt-1">
                      Blocked in browser settings
                    </Badge>
                  )}
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotifications}
                  onChange={handlePushNotificationToggle}
                  disabled={!isSupported || permission.denied}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-summary">Daily Safety Summary</Label>
                  <p className="text-sm text-gray-600">
                    Receive a daily summary of your safety status and activity.
                  </p>
                </div>
                <Switch
                  id="daily-summary"
                  checked={settings.dailySummaryEnabled}
                  onChange={(checked) =>
                    setSettings(prev => ({ ...prev, dailySummaryEnabled: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Type Preferences</CardTitle>
              <CardDescription>
                Configure which channels to use for different types of alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(settings.preferences).map(([alertType, channels]) => (
                <div key={alertType} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{getAlertTypeLabel(alertType)}</h4>
                    {alertType === "panic" && (
                      <Badge variant="destructive">Critical</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(channels).map(([channel, enabled]) => (
                      <div key={channel} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{getChannelIcon(channel)}</span>
                        </div>
                        <Switch
                          checked={enabled}
                          onChange={(checked) => updatePreference(alertType, channel, checked)}
                          disabled={
                            (channel === "push" && (!isSupported || permission.denied)) ||
                            (channel === "sms" && !settings.smsNotifications) ||
                            (channel === "email" && !settings.emailNotifications)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Status</CardTitle>
              <CardDescription>
                Current status of your notification channels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Email</span>
                    <Badge variant={settings.emailNotifications ? "default" : "secondary"}>
                      {settings.emailNotifications ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {settings.emailNotifications ? "Email notifications enabled" : "Email notifications disabled"}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">SMS</span>
                    <Badge variant={settings.smsNotifications ? "default" : "secondary"}>
                      {settings.smsNotifications ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {settings.smsNotifications ? "SMS notifications enabled" : "SMS notifications disabled"}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Push</span>
                    <Badge variant={
                      !isSupported ? "destructive" :
                      permission.denied ? "destructive" :
                      permission.granted && settings.pushNotifications ? "default" : "secondary"
                    }>
                      {!isSupported ? "Not Supported" :
                       permission.denied ? "Blocked" :
                       permission.granted && settings.pushNotifications ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {!isSupported ? "Push notifications not supported on this device" :
                     permission.denied ? "Push notifications blocked in browser" :
                     permission.granted && settings.pushNotifications ? "Push notifications enabled" : "Push notifications disabled"}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Important Notes</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Push notifications require browser permission and only work when the browser is open</li>
                  <li>SMS notifications are only sent for critical alerts (PANIC/SOS)</li>
                  <li>Email notifications include detailed information and tracking links</li>
                  <li>Daily summaries are sent at the end of each day if you have active alerts</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={loadNotificationSettings}>
          Reset
        </Button>
        <Button onClick={saveNotificationSettings} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
