import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "K-pop World Trend | 글로벌 K-pop 인기 라이브 맵",
  description:
    "전 세계에서 K-pop이 얼마나 인기 있는지, 세계지도 위에서 한눈에 확인하세요. Google Trends, YouTube, Wikipedia 데이터 기반.",
  openGraph: {
    title: "K-pop World Trend",
    description: "전 세계 K-pop 인기를 실시간 세계지도로 확인하세요",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0F0B1A] overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
