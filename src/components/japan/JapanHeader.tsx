"use client";

import Link from "next/link";
import { Globe, MapPin } from "lucide-react";
import { useJapanStore } from "@/store/useJapanStore";
import { ShareButton } from "@/components/engagement/ShareButton";
import { JapanArtistFilter } from "./JapanArtistFilter";

export function JapanHeader() {
  const data = useJapanStore((s) => s.data);

  return (
    <header className="bg-[#120E1F] border-b border-[#3B2667]/50 px-4 py-2 flex flex-col gap-1 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-[#9B5DE5] via-[#FF6AC1] to-[#00D4FF] text-transparent bg-clip-text whitespace-nowrap">
            K-pop Japan Trend
          </h1>
          {/* 글로벌 ↔ 일본 전환 */}
          <div className="flex items-center gap-1 bg-[#1A1432] rounded-full p-0.5">
            <Link
              href="/"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-[#9B8DB8] hover:bg-[#3B2667]/50 transition-colors"
            >
              <Globe className="w-3 h-3" />
              Global
            </Link>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] bg-gradient-to-r from-[#9B5DE5] to-[#FF6AC1] text-white font-medium">
              <MapPin className="w-3 h-3" />
              Japan
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-[10px] text-[#9B8DB8]">{data.date}</span>
          )}
          <ShareButton />
        </div>
      </div>

      {/* 아티스트 필터 */}
      <JapanArtistFilter />
    </header>
  );
}
