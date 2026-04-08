import { NotificationToggle } from '~/components/settings/NotificationToggle';
import { ProfileSection } from '~/components/settings/ProfileSection';

export default function SettingsPage() {
  return (
    <div className="md:py-10 md:px-12 py-4 px-6 flex flex-col gap-8">
      <h1 className="text-4xl font-medium tracking-tight">Settings</h1>

      <ProfileSection />

      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Notifications
        </p>
        <NotificationToggle />
      </div>
    </div>
  );
}
