import './globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { TRPCReactProvider } from '~/utils/trpc-provider';
import { SessionProvider } from '~/components/providers/SessionProvider';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Learning & Growth Dashboard',
  description: 'Personal growth management system with task management and time tracking',
  manifest: '/manifest.json',
  themeColor: '#E42313',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={spaceGrotesk.className}>
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
