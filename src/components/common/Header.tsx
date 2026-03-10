"use client";

import { ArtistFilter } from "@/components/filters/ArtistFilter";
import { VisitStreak } from "@/components/engagement/VisitStreak";
import { ShareButton } from "@/components/engagement/ShareButton";
import { useAppStore } from "@/store/useAppStore";

export function Header() {
  const { data } = useAppStore();

  return (
    <header className="bg-[#120E1F]/90 backdrop-blur-sm border-b border-[#3B2667]/50 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* 로고 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9B5DE5] to-[#FF6AC1] flex items-center justify-center">
              <span className="text-white font-black text-sm">K</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#E8E0F0] leading-tight">
                K-pop World Pulse
              </h1>
              <p className="text-[10px] text-[#9B8DB8] leading-tight">
                글로벌 K-pop 인기 라이브 맵
              </p>
            </div>
          </div>
        </div>

        {/* 우측: 방문 스트릭 + 공유 + 날짜 */}
        <div className="flex items-center gap-2">
          <VisitStreak />
          <ShareButton />
          {data && (
            <div className="text-right">
              <div className="text-xs text-[#9B8DB8]">
                {data.date} 기준
              </div>
              <div className="text-[10px] text-[#9B8DB8]/60">
                {data.totalCountries}개국 데이터
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 아티스트 필터 */}
      <ArtistFilter />
    </header>
  );
}
