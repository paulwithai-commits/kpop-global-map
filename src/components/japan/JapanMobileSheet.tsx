"use client";

import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useJapanStore } from "@/store/useJapanStore";
import { FanBoostPanel } from "./FanBoostPanel";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const ARTIST_COLORS: Record<string, string> = {
  bts: "#9B5DE5",
  blackpink: "#FF6AC1",
  twice: "#FF9671",
  "stray-kids": "#00D4FF",
  aespa: "#00F5D4",
  newjeans: "#FFD93D",
  seventeen: "#F9A8D4",
  ive: "#C4B5FD",
};

export function JapanMobileSheet() {
  const { selectedPrefecture, setSelectedPrefecture } = useJapanStore();
  const [expanded, setExpanded] = useState(false);

  if (!selectedPrefecture) return null;

  const chartData = selectedPrefecture.hourlyScores.map((score, hour) => {
    const entry: Record<string, number | string> = {
      hour: `${hour}`,
      종합: score,
    };
    selectedPrefecture.topArtists.slice(0, 3).forEach((artist) => {
      entry[artist.nameKo] = artist.hourlyScores[hour];
    });
    return entry;
  });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-[#120E1F] border-t border-[#3B2667]/50 rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto">
      {/* 핸들 */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-[#3B2667]" />
      </div>

      {/* 헤더 */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#E8E0F0]">
            {selectedPrefecture.nameKo}{" "}
            <span className="text-sm text-[#9B8DB8] font-normal">
              {selectedPrefecture.nameJa}
            </span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-[#FF6AC1]">
              {selectedPrefecture.trendsScore}
            </span>
            <span
              className={`text-sm font-medium ${
                selectedPrefecture.change > 0
                  ? "text-green-400"
                  : selectedPrefecture.change < 0
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            >
              {selectedPrefecture.change > 0 ? "+" : ""}
              {selectedPrefecture.change.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-[#3B2667]/50 text-[#9B8DB8]"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setSelectedPrefecture(null)}
            className="p-1.5 rounded-lg hover:bg-[#3B2667]/50 text-[#9B8DB8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 아티스트 순위 (항상 보임) */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {selectedPrefecture.topArtists.map((artist, idx) => (
          <div
            key={artist.id}
            className="flex-shrink-0 flex items-center gap-2 bg-[#1A1432] border border-[#3B2667]/30 rounded-lg px-3 py-1.5"
          >
            <span className="text-[10px] text-[#9B8DB8] font-bold">
              {idx + 1}
            </span>
            <div
              className="w-1.5 h-5 rounded-full"
              style={{
                backgroundColor: ARTIST_COLORS[artist.id] || "#9B8DB8",
              }}
            />
            <span className="text-xs text-[#E8E0F0]">{artist.nameKo}</span>
            <span className="text-xs font-bold text-[#FF6AC1]">
              {artist.score}
            </span>
          </div>
        ))}
      </div>

      {/* 팬 부스트 미션 (항상 보임) */}
      <FanBoostPanel compact />

      {/* 확장: 차트 */}
      {expanded && (
        <div className="px-4 pb-4">
          <h3 className="text-xs font-medium text-[#9B8DB8] mb-2">
            24시간 검색 트렌드
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3B2667" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 8, fill: "#9B8DB8" }}
                  interval={5}
                  axisLine={{ stroke: "#3B2667" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 8, fill: "#9B8DB8" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  width={25}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1A1432",
                    border: "1px solid #3B2667",
                    borderRadius: 8,
                    fontSize: 10,
                    color: "#E8E0F0",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="종합"
                  stroke="#FF6AC1"
                  strokeWidth={2}
                  dot={false}
                />
                {selectedPrefecture.topArtists.slice(0, 3).map((artist) => (
                  <Line
                    key={artist.id}
                    type="monotone"
                    dataKey={artist.nameKo}
                    stroke={ARTIST_COLORS[artist.id] || "#9B8DB8"}
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 2"
                    opacity={0.7}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
