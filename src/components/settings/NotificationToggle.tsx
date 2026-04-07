'use client';

import { usePushSubscription } from '~/hooks/usePushSubscription';

export function NotificationToggle() {
  const { permission, isEnabled, deviceCount, isLoading, toggle } = usePushSubscription();

  return (
    <div className="space-y-5 rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">Push Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Receive notifications for friend milestones, ranking changes, and study reminders
          </p>
        </div>
        <button
          onClick={() => toggle(!isEnabled)}
          disabled={isLoading || permission === 'denied'}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            isEnabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              isEnabled ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {permission === 'denied' && (
        <p className="text-sm text-destructive">
          Notifications blocked by browser. Enable in browser settings.
        </p>
      )}

      {deviceCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {deviceCount} device(s) registered
        </p>
      )}
    </div>
  );
}
