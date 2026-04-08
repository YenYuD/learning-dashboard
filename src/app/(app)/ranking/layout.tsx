import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '排行榜',
};

export default function RankingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
