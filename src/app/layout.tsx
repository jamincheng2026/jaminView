import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import {getLocale} from "next-intl/server";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-headline",
});

export const metadata: Metadata = {
  title: {
    default: "JaminView",
    template: "%s | JaminView",
  },
  description: "模板化数据大屏平台，帮助团队更快完成项目创建、编辑与发布。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale().catch(() => "zh-CN");

  return (
    <html lang={locale} className={`${inter.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
