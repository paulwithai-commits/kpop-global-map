"use client";

import { useMapData } from "@/hooks/useMapData";
import { Header } from "@/components/common/Header";
import { GlobalMap } from "@/components/map/GlobalMap";
import { CountryDetail } from "@/components/panels/CountryDetail";
import { MobileDetailSheet } from "@/components/panels/MobileDetailSheet";
import { TrendingInsights } from "@/components/panels/TrendingInsights";
import { NewsSlidePanel } from "@/components/panels/NewsSlidePanel";
import { TimelineSlider } from "@/components/map/TimelineSlider";
import { TopTicker } from "@/components/common/TopTicker";
import { Loading } from "@/components/common/Loading";

export default function Home() {
  const { isLoading, error } = useMapData();

  if (isLoading) {
    return (
      <div className="h-dvh flex flex-col">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#0F0B1A]">
        <div className="text-center text-[#E8E0F0]">
          <p className="text-red-400 mb-2">오류가 발생했습니다</p>
          <p className="text-sm text-[#9B8DB8]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden relative">
        <GlobalMap />
        <TrendingInsights />
        <NewsSlidePanel />
        <TimelineSlider />
        {/* 데스크톱: 사이드 패널 */}
        <div className="hidden md:block">
          <CountryDetail />
        </div>
      </div>
      <TopTicker />
      {/* 모바일: 바텀 시트 */}
      <MobileDetailSheet />
    </div>
  );
}
