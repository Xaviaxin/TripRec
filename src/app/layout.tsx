import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TripRec - 旅行计划与记录',
  description: '规划您的旅行，记录每一个精彩瞬间。',
};

import { AuthProvider } from '@/components/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
