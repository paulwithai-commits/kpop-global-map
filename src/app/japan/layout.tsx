import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "K-pop Japan Trend | 일본 47개 도도부현 K-pop 트렌드 맵",
  description:
    "일본 47개 도도부현별 K-pop 인기도를 실시간 지도로 확인하세요. Google Trends 기반 데이터.",
  openGraph: {
    title: "K-pop Japan Trend",
    description: "일본 47개 도도부현 K-pop 트렌드 맵",
    type: "website",
  },
};

export default function JapanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
