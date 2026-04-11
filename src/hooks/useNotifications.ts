"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true,
  });
  const [isSupported] = useState(() =>
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const supabase = createSupabaseBrowserClient();

  const checkPermission = () => {
    if ("Notification" in window) {
      const currentPermission = Notification.permission;
      setPermission({
        granted: currentPermission === "granted",
        denied: currentPermission === "denied",
        default: currentPermission === "default",
      });
    }
  };

  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered with scope:", registration.scope);
        
        // Get existing subscription
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
        
        return registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }
  };

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    (async () => {
      const permission = await Notification.requestPermission();
      setPermission({
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default',
      });
      await registerServiceWorker();
    })();
  }, [isSupported]);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    try {
      const permissionResult = await Notification.requestPermission();
      checkPermission();

      if (permissionResult === "granted") {
        // Subscribe to push notifications
        await subscribeToPush();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from environment or use a placeholder
      const applicationServerKey = urlB64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
        "BM_vqK4N8L7q3r7sJ8w9k3m5n2p1q0r9t8u7i6o5p4l3k2j1h0g9f8d7s6a5z4x3c2v1b0n9m8"
      );

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      setSubscription(pushSubscription);

      // Save subscription to database
      await saveSubscriptionToDatabase(pushSubscription);

      console.log("Push subscription successful:", pushSubscription);
    } catch (error) {
      console.error("Push subscription failed:", error);
    }
  };

  const saveSubscriptionToDatabase = async (subscription: PushSubscription) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      const p256dhKey = subscription.getKey("p256dh");
      const authKey = subscription.getKey("auth");
      
      const subscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: p256dhKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhKey)))) : "",
        auth: authKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(authKey)))) : "",
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(subscriptionData, { onConflict: "user_id" });

      if (error) {
        console.error("Error saving push subscription:", error);
      }
    } catch (error) {
      console.error("Error saving subscription to database:", error);
    }
  };

  const showLocalNotification = (data: NotificationData) => {
    if (!permission.granted) {
      return;
    }

    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon || "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: data.tag,
      requireInteraction: true,
      silent: false,
    };

    const notification = new Notification(data.title, options);

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      if (data.url) {
        window.location.href = data.url;
      }
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  };

  const unsubscribeFromPush = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        setSubscription(null);
        
        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id);
        }
        
        console.log("Unsubscribed from push notifications");
      } catch (error) {
        console.error("Error unsubscribing from push:", error);
      }
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    showLocalNotification,
    subscribeToPush,
    unsubscribeFromPush,
  };
}

// Helper function to convert VAPID key
function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Supabase Realtime subscription hook
export function useRealtimeNotifications() {
  const { showLocalNotification } = useNotifications();
  const supabase = createSupabaseBrowserClient();

  const getAlertMessage = (type: string, message?: string) => {
    const messages = {
      sos: "Emergency alert triggered! Help is on the way.",
      fall: "Fall detected! Are you okay?",
      low_battery: "Your device battery is critically low.",
      geo_fence: "You have left the safe zone.",
      panic: "Panic button pressed! Emergency services notified.",
    };

    return message || messages[type as keyof typeof messages] || "New alert received.";
  };

  const showInAppNotification = (alert: unknown) => {
    // This would integrate with your in-app notification system
    // For example, using react-hot-toast or similar
    console.log("In-app notification:", alert);
  };

  useEffect(() => {
    // Subscribe to alerts for the current user
    const channel = supabase
      .channel("alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: "user_id=eq.current_user",
        },
        (payload: { new: { type: string; id?: string; message?: string } }) => {
          const alert = payload.new;
          
          // Show browser notification
          showLocalNotification({
            title: `Tourist Safety: ${alert.type.toUpperCase()}`,
            body: getAlertMessage(alert.type, alert.message),
            tag: `alert-${alert.id}`,
            url: "/dashboard",
          });

          // Show in-app notification (you can implement this with a toast library)
          showInAppNotification(alert);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showLocalNotification, supabase]);
}
