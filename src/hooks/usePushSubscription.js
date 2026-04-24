import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const VAPID_PUBLIC_KEY = "BD2qrbUlG5TsJqZ8mhjJyX0GJ7kVZgaopjh76dc6l6YEnLeEt1Yv7YJuvQTJOsX7-yc3tlVUCQG5nodanPScjBM";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const isIOS = () => {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
};

const isStandalone = () => {
  return !!window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
};

export const usePushSubscription = (userId = null) => {
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            setIsSubscribed(true);
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
        }
      }
    };
    checkSubscription();
  }, []);

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator)) {
      alert("Service workers are not supported on this browser.");
      return;
    }

    if (!('PushManager' in window)) {
      if (isIOS() && !isStandalone()) {
        alert("To enable notifications on iPhone/iPad, tap 'Share' (square with an arrow) -> 'Add to Home Screen'. Open the app from your home screen to enable notifications.");
      } else {
        alert("Push notifications are not supported on this device or browser.");
      }
      return;
    }

    let currentUserId = userId;
    if (!currentUserId) {
      const { data } = await supabase.auth.getSession();
      currentUserId = data.session?.user?.id || localStorage.getItem('anon_user_id') || localStorage.getItem('matchmaker_id');
    }

    if (!currentUserId) {
      alert("You must be logged in or have a valid profile to enable notifications.");
      return;
    }

    try {
      setLoading(true);
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("Permission denied. Please enable notifications in your browser settings.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const subJson = subscription.toJSON();
      
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: currentUserId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        updated_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });

      if (error) throw error;

      setIsSubscribed(true);
      alert("Notifications enabled! You'll be alerted for new matches, whispers, and replies.");
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("Failed to subscribe.");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);

        if (error) console.error("Error removing from DB:", error);

        setIsSubscribed(false);
        alert("Notifications turned off.");
      }
    } catch (error) {
      console.error("Unsubscribe failed:", error);
      alert("Failed to unsubscribe.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = () => {
    if (isSubscribed) {
        if(window.confirm("Do you want to turn off notifications?")) {
            unsubscribeFromPush();
        }
    } else {
        subscribeToPush();
    }
  };

  return { subscribeToPush, unsubscribeFromPush, toggleSubscription, loading, isSubscribed };
};