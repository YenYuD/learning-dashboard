import type { Metadata } from 'next';
import { DashboardContent } from '~/components/dashboard/DashboardContent';

export const metadata: Metadata = {
  title: '儀表板',
};

export default function DashboardPage() {
  return (
    <div className="py-10 px-12 space-y-6">
      <DashboardContent />
    </div>
  );
}
