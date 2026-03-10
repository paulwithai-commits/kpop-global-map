"use client";

import dynamic from "next/dynamic";
import { useJapanData } from "@/hooks/useJapanData";
import { JapanHeader } from "@/components/japan/JapanHeader";
import { PrefectureDetail } from "@/components/japan/PrefectureDetail";
import { JapanMobileSheet } from "@/components/japan/JapanMobileSheet";
import { JapanTimeline } from "@/components/japan/JapanTimeline";
import { JapanTopTicker } from "@/components/japan/JapanTopTicker";
import { JapanTrendingKeywords } from "@/components/japan/JapanTrendingKeywords";
import { JapanContentPanel } from "@/components/japan/JapanContentPanel";
import { Loading } from "@/components/common/Loading";

// Leaflet은 SSR 불가 → dynamic import
const JapanMap = dynamic(
  () => import("@/components/japan/JapanMap"),
  { ssr: false }
);

export default function JapanPage() {
  const { isLoading, error } = useJapanData();

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
      <JapanHeader />
      <div className="flex-1 flex overflow-hidden relative">
        <JapanMap />
        <JapanTrendingKeywords />
        <JapanContentPanel />
        <JapanTimeline />
        {/* 데스크톱: 사이드 패널 */}
        <div className="hidden md:flex h-full">
          <PrefectureDetail />
        </div>
      </div>
      <JapanTopTicker />
      {/* 모바일: 바텀 시트 */}
      <JapanMobileSheet />
    </div>
  );
}
