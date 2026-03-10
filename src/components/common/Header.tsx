"use client";

import Link from "next/link";
import { Globe, MapPin } from "lucide-react";
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
                K-pop World Trend
              </h1>
              <p className="text-[10px] text-[#9B8DB8] leading-tight">
                글로벌 K-pop 인기 라이브 맵
              </p>
            </div>
          </div>
          {/* 글로벌 ↔ 일본 전환 */}
          <div className="flex items-center gap-1 bg-[#1A1432] rounded-full p-0.5">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] bg-gradient-to-r from-[#9B5DE5] to-[#FF6AC1] text-white font-medium">
              <Globe className="w-3 h-3" />
              Global
            </span>
            <Link
              href="/japan"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-[#9B8DB8] hover:bg-[#3B2667]/50 transition-colors"
            >
              <MapPin className="w-3 h-3" />
              Japan
            </Link>
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
