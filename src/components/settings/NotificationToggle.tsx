'use client';

import { useState } from 'react';
import { usePushSubscription } from '~/hooks/usePushSubscription';

export function NotificationToggle() {
  const { permission, isEnabled, deviceCount, isLoading, toggle } = usePushSubscription();
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setError(null);
    setToggling(true);
    try {
      await toggle(!isEnabled);
    } catch (err) {
      console.error('Toggle failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle notifications');
    } finally {
      setToggling(false);
    }
  };

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
          onClick={handleToggle}
          disabled={isLoading || toggling || permission === 'denied'}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            isEnabled ? 'bg-primary' : 'bg-gray-300'
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
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

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {deviceCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {deviceCount} device(s) registered
        </p>
      )}
    </div>
  );
}
