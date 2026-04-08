'use client';

import { useCallback, useEffect, useState } from 'react';
import { trpc } from '~/utils/trpc';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function usePushSubscription() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const statusQuery = trpc.notification.status.useQuery(undefined, {
    enabled: typeof window !== 'undefined',
  });
  const subscribeMutation = trpc.notification.subscribe.useMutation();
  const unsubscribeMutation = trpc.notification.unsubscribe.useMutation();
  const toggleMutation = trpc.notification.toggle.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  /** Save a PushSubscription to the backend */
  const saveSubscription = useCallback(async (subscription: PushSubscription) => {
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      throw new Error('Push subscription is missing required fields');
    }

    await subscribeMutation.mutateAsync({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    await utils.notification.status.invalidate();
  }, [subscribeMutation, utils]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      throw new Error('Push notifications are not configured (missing VAPID key)');
    }

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') {
      throw new Error('Notification permission was denied');
    }

    // Wait for the service worker to be ready (with timeout)
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Service worker not available. Push notifications require a production build.')), 5000)
      ),
    ]);

    // Reuse existing browser subscription if present, otherwise create new one
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      }));

    await saveSubscription(subscription);
    return true;
  }, [saveSubscription]);

  const unsubscribe = useCallback(async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await unsubscribeMutation.mutateAsync({ endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
    await utils.notification.status.invalidate();
  }, [unsubscribeMutation, utils]);

  const toggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      // Always ensure this browser's subscription is saved to the backend.
      // Handles: first time, new browser, or browser with subscription not in DB.
      await subscribe();
      return;
    }
    await toggleMutation.mutateAsync({ enabled });
    await utils.notification.status.invalidate();
  }, [subscribe, toggleMutation, utils]);

  return {
    permission,
    isEnabled: statusQuery.data?.enabled ?? false,
    deviceCount: statusQuery.data?.deviceCount ?? 0,
    isLoading: statusQuery.isLoading,
    subscribe,
    unsubscribe,
    toggle,
  };
}
