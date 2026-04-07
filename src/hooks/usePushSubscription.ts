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

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn('VAPID public key not configured');
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });

    const json = subscription.toJSON();
    await subscribeMutation.mutateAsync({
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh!,
      auth: json.keys!.auth!,
    });

    await utils.notification.status.invalidate();
    return true;
  }, [subscribeMutation, utils]);

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
    if (enabled && permission === 'default') {
      await subscribe();
      return;
    }
    await toggleMutation.mutateAsync({ enabled });
    await utils.notification.status.invalidate();
  }, [permission, subscribe, toggleMutation, utils]);

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
