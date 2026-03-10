"use client";

import { useEffect, useRef } from "react";
import { useMapData } from "@/hooks/useMapData";
import { useAppStore } from "@/store/useAppStore";
import { Header } from "@/components/common/Header";
import { GlobalMap } from "@/components/map/GlobalMap";
import { CountryDetail } from "@/components/panels/CountryDetail";
import { MobileDetailSheet } from "@/components/panels/MobileDetailSheet";
import { TrendingInsights } from "@/components/panels/TrendingInsights";
import { NewsSlidePanel } from "@/components/panels/NewsSlidePanel";
import { TimelineSlider } from "@/components/map/TimelineSlider";
import { FloatingKeywords } from "@/components/map/FloatingKeywords";
import { TopTicker } from "@/components/common/TopTicker";
import { PredictionCard } from "@/components/engagement/PredictionCard";
import { Loading } from "@/components/common/Loading";

export default function Home() {
  const { isLoading, error } = useMapData();
  const timelineHour = useAppStore((s) => s.timelineHour);
  const updateVisitStreak = useAppStore((s) => s.updateVisitStreak);
  const setShowPrediction = useAppStore((s) => s.setShowPrediction);
  const lastPrediction = useAppStore((s) => s.lastPrediction);
  const predictionShownRef = useRef(false);

  // 첫 로드 시 방문 스트릭 업데이트
  useEffect(() => {
    updateVisitStreak();
  }, [updateVisitStreak]);

  // 타임라인 종료 시 예측 카드 트리거 (1일 1회)
  useEffect(() => {
    if (timelineHour >= 24 && !predictionShownRef.current) {
      predictionShownRef.current = true;
      const today = new Date().toISOString().slice(0, 10);
      // 오늘 이미 예측했으면 안 보여줌
      if (!lastPrediction || lastPrediction.date !== today) {
        setTimeout(() => setShowPrediction(true), 800);
      }
    }
    if (timelineHour < 1) {
      predictionShownRef.current = false;
    }
  }, [timelineHour, lastPrediction, setShowPrediction]);

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
        <FloatingKeywords />
        <TrendingInsights />
        <NewsSlidePanel />
        <TimelineSlider />
        <PredictionCard />
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
