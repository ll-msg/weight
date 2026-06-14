import type { Metadata, Viewport } from "next";

import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "减肥对抗赛",
  description: "和好友一起，科学健康地减重对抗",
};

// 移动端优先视口配置
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#10b981",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {/* 全局语言 + 鉴权上下文 */}
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
