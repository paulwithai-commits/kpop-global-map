"use client";

import { useEffect, useState, useRef } from "react";
import { useJapanStore } from "@/store/useJapanStore";
import { TrendingUp } from "lucide-react";

export function JapanTrendingKeywords() {
  const data = useJapanStore((s) => s.data);
  const selectedKeyword = useJapanStore((s) => s.selectedKeyword);
  const fetchContent = useJapanStore((s) => s.fetchContent);
  const setSelectedKeyword = useJapanStore((s) => s.setSelectedKeyword);
  const timelineHour = useJapanStore((s) => s.timelineHour);

  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlaying = timelineHour < 24;

  // 재생 중 키워드 무작위 하이라이트
  useEffect(() => {
    if (isPlaying && data?.trendingKeywords) {
      const count = Math.min(data.trendingKeywords.length, 5);
      intervalRef.current = setInterval(() => {
        setHighlightIdx(Math.floor(Math.random() * count));
      }, 800);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      setHighlightIdx(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isPlaying, data]);

  if (!data) return null;

  const keywords = data.trendingKeywords.slice(0, 5);

  return (
    <div className="absolute top-3 left-3 z-[999] flex flex-col gap-1.5 max-w-[200px]">
      <div className="flex items-center gap-1.5 text-[10px] text-[#9B8DB8] font-medium px-1">
        <TrendingUp className="w-3 h-3" />
        트렌딩 키워드
      </div>
      {keywords.map((kw, idx) => {
        const isSelected = selectedKeyword === kw;
        const isHighlighted = highlightIdx === idx && isPlaying;

        return (
          <button
            key={kw}
            onClick={() => {
              if (isSelected) {
                setSelectedKeyword(null);
              } else {
                fetchContent(kw, kw);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300 text-left truncate ${
              isSelected
                ? "bg-[#9B5DE5]/30 text-[#E8E0F0] border border-[#9B5DE5]/50 shadow-lg"
                : isHighlighted
                  ? "bg-[#FF6AC1]/20 text-[#FF6AC1] border border-[#FF6AC1]/40 shadow-[0_0_12px_rgba(255,106,193,0.3)] scale-105"
                  : "bg-[#120E1F]/80 backdrop-blur-sm text-[#9B8DB8] border border-[#3B2667]/50 hover:bg-[#3B2667]/50 hover:text-[#E8E0F0]"
            }`}
          >
            {kw}
          </button>
        );
      })}
    </div>
  );
}
