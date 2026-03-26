import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TRPCReactProvider } from '~/utils/trpc-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Learning & Growth Dashboard',
  description: 'Personal growth management system with task management and time tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
