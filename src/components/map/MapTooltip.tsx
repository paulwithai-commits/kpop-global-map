"use client";

import type { CountryScore } from "@/types/data";

interface MapTooltipProps {
  info: {
    x: number;
    y: number;
    country: CountryScore;
  };
}

export function MapTooltip({ info }: MapTooltipProps) {
  const { country, x, y } = info;
  const changeColor =
    country.change > 0
      ? "text-green-400"
      : country.change < 0
        ? "text-red-400"
        : "text-gray-400";
  const changePrefix = country.change > 0 ? "+" : "";

  return (
    <div
      className="absolute pointer-events-none z-50 bg-[#1A1432]/95 backdrop-blur-sm border border-[#3B2667] rounded-xl px-4 py-3 shadow-xl"
      style={{
        left: x + 12,
        top: y - 12,
        transform: "translateY(-100%)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg font-bold text-[#E8E0F0]">
          {country.nameKo}
        </span>
        <span className={`text-sm font-medium ${changeColor}`}>
          {changePrefix}
          {country.change}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-black bg-gradient-to-r from-[#9B5DE5] to-[#FF6AC1] bg-clip-text text-transparent">
          {country.score}
        </div>
        <div className="text-xs text-[#9B8DB8] space-y-0.5">
          <div>Trends {country.trendsScore}</div>
          <div>Wiki {country.wikiScore}</div>
          <div>YouTube {country.youtubeScore}</div>
        </div>
      </div>
      {country.topArtists[0] && (
        <div className="mt-1.5 pt-1.5 border-t border-[#3B2667] text-xs text-[#9B8DB8]">
          #1 {country.topArtists[0].nameKo}
        </div>
      )}
    </div>
  );
}
