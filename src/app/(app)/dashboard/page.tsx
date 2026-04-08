import type { Metadata } from 'next';
import { DashboardContent } from '~/components/dashboard/DashboardContent';

export const metadata: Metadata = {
  title: '儀表板',
};

export default function DashboardPage() {
  return (
    <div className="md:py-10 md:px-12 py-4 px-6 space-y-6">
      <DashboardContent />
    </div>
  );
}
