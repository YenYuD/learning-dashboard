import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '好友',
};

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
