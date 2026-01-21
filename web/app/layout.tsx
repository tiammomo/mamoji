import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mamoji 记账系统',
  description: '个人/家庭记账系统，支持多账户管理、预算控制、收支分析',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
