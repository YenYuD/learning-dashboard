import { NotificationToggle } from '~/components/settings/NotificationToggle';

export default function SettingsPage() {
  return (
    <div className="py-6 px-4 md:py-10 md:px-12 flex flex-col gap-6 md:gap-8">
      <h1 className="text-2xl md:text-4xl font-medium tracking-tight">Settings</h1>

      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Notifications
        </p>
        <NotificationToggle />
      </div>
    </div>
  );
}
