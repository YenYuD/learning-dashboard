import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '計時器',
};

export default function TimerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
