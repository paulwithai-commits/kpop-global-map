"use client";

import { useJapanStore } from "@/store/useJapanStore";
import { TrendingUp } from "lucide-react";

export function JapanTrendingKeywords() {
  const data = useJapanStore((s) => s.data);
  const selectedKeyword = useJapanStore((s) => s.selectedKeyword);
  const fetchContent = useJapanStore((s) => s.fetchContent);
  const setSelectedKeyword = useJapanStore((s) => s.setSelectedKeyword);

  if (!data) return null;

  return (
    <div className="absolute top-3 left-3 z-[999] flex flex-col gap-1.5 max-w-[200px]">
      <div className="flex items-center gap-1.5 text-[10px] text-[#9B8DB8] font-medium px-1">
        <TrendingUp className="w-3 h-3" />
        트렌딩 키워드
      </div>
      {data.trendingKeywords.slice(0, 5).map((kw) => (
        <button
          key={kw}
          onClick={() => {
            if (selectedKeyword === kw) {
              setSelectedKeyword(null);
            } else {
              fetchContent(kw, kw);
            }
          }}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left truncate ${
            selectedKeyword === kw
              ? "bg-[#9B5DE5]/30 text-[#E8E0F0] border border-[#9B5DE5]/50 shadow-lg"
              : "bg-[#120E1F]/80 backdrop-blur-sm text-[#9B8DB8] border border-[#3B2667]/50 hover:bg-[#3B2667]/50 hover:text-[#E8E0F0]"
          }`}
        >
          {kw}
        </button>
      ))}
    </div>
  );
}
