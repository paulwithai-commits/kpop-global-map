"use client";

import { useJapanStore } from "@/store/useJapanStore";

export function JapanTopTicker() {
  const data = useJapanStore((s) => s.data);
  if (!data) return null;

  // 상위 10개 도도부현
  const top10 = [...data.prefectures]
    .sort((a, b) => b.trendsScore - a.trendsScore)
    .slice(0, 10);

  return (
    <div className="bg-[#120E1F] border-t border-[#3B2667]/50 py-1.5 overflow-hidden">
      <div className="flex animate-scroll-left">
        {[...top10, ...top10].map((pref, idx) => (
          <span
            key={`${pref.code}-${idx}`}
            className="flex items-center gap-1.5 px-4 text-xs whitespace-nowrap"
          >
            <span className="text-[#9B8DB8] font-mono">
              {(idx % 10) + 1}
            </span>
            <span className="font-medium text-[#E8E0F0]">
              {pref.nameJa}
            </span>
            <span className="text-[#FF6AC1] font-bold">
              {pref.trendsScore}
            </span>
            <span
              className={`text-[10px] ${
                pref.change > 0
                  ? "text-green-400"
                  : pref.change < 0
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            >
              {pref.change > 0 ? "↑" : pref.change < 0 ? "↓" : ""}
              {Math.abs(pref.change).toFixed(1)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
