import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { TRPCReactProvider } from '~/utils/trpc-provider';
import { SessionProvider } from '~/components/providers/SessionProvider';
import { ServiceWorkerRegister } from '~/components/ServiceWorkerRegister';
import { Toaster } from '~/components/ui/sonner';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Learning Dashboard — 學習時間追蹤與成長管理',
    template: '%s | Learning Dashboard',
  },
  description:
    '同時學習多項技能？Learning Dashboard 幫你量化每項學習的投入時間，用數據檢視自己的成長軌跡。支援計時器、手動記錄、看板管理與數據儀表板。',
  keywords: [
    '學習追蹤', '時間管理', '學習儀表板', '技能管理',
    'learning tracker', 'time tracking', 'productivity',
    'personal growth', 'study dashboard',
  ],
  authors: [{ name: 'YenYu' }],
  creator: 'YenYu',
  openGraph: {
    title: 'Learning Dashboard — 量化你的學習投入',
    description:
      '不確定成效不好是不是因為投入不夠？用數據追蹤每項技能的學習時間，讓成長看得見。',
    type: 'website',
    locale: 'zh_TW',
    siteName: 'Learning Dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learning Dashboard',
    description: '量化學習時間，用數據驅動成長',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
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
          <ServiceWorkerRegister />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
