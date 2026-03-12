"use client";

import { X } from "lucide-react";
import { useJapanStore } from "@/store/useJapanStore";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { FanBoostPanel } from "./FanBoostPanel";

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

export function PrefectureDetail() {
  const { selectedPrefecture, setSelectedPrefecture, timelineHour } =
    useJapanStore();

  if (!selectedPrefecture) return null;

  const isTimeline = timelineHour < 24;

  // 시간대별 차트 데이터
  const chartData = selectedPrefecture.hourlyScores.map((score, hour) => {
    const entry: Record<string, number | string> = {
      hour: `${hour}시`,
      종합: score,
    };
    selectedPrefecture.topArtists.forEach((artist) => {
      entry[artist.nameKo] = artist.hourlyScores[hour];
    });
    return entry;
  });

  return (
    <div className="w-80 bg-[#120E1F] border-l border-[#3B2667]/50 overflow-y-auto flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-[#3B2667]/50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-[#E8E0F0]">
              {selectedPrefecture.nameKo}
            </h2>
            <span className="text-sm text-[#9B8DB8]">
              {selectedPrefecture.nameJa} · {selectedPrefecture.name}
            </span>
          </div>
          <button
            onClick={() => setSelectedPrefecture(null)}
            className="p-1.5 rounded-lg hover:bg-[#3B2667]/50 text-[#9B8DB8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 점수 요약 */}
        <div className="flex items-center gap-3 mt-3">
          <div className="text-3xl font-black text-[#FF6AC1]">
            {selectedPrefecture.trendsScore}
          </div>
          <div className="text-sm">
            <span
              className={`font-medium ${
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
            <span className="text-[#9B8DB8] ml-1">전일 대비</span>
          </div>
        </div>
      </div>

      {/* 24시간 차트 */}
      <div className="p-4 border-b border-[#3B2667]/50">
        <h3 className="text-xs font-medium text-[#9B8DB8] mb-3">
          24시간 검색 트렌드
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3B2667" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: "#9B8DB8" }}
                interval={5}
                axisLine={{ stroke: "#3B2667" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#9B8DB8" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "#1A1432",
                  border: "1px solid #3B2667",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#E8E0F0",
                }}
              />
              {/* 종합 라인 */}
              <Line
                type="monotone"
                dataKey="종합"
                stroke="#FF6AC1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#FF6AC1" }}
              />
              {/* 아티스트별 라인 */}
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
              {/* 현재 시간 표시 (타임라인 모드) */}
              {isTimeline && (
                <Line
                  type="monotone"
                  dataKey={() => null}
                  stroke="transparent"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* 범례 */}
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-[#E8E0F0]">
            <span className="w-3 h-0.5 bg-[#FF6AC1] rounded inline-block" />
            종합
          </span>
          {selectedPrefecture.topArtists.slice(0, 3).map((artist) => (
            <span
              key={artist.id}
              className="flex items-center gap-1 text-[10px] text-[#9B8DB8]"
            >
              <span
                className="w-3 h-0.5 rounded inline-block"
                style={{
                  backgroundColor: ARTIST_COLORS[artist.id] || "#9B8DB8",
                }}
              />
              {artist.nameKo}
            </span>
          ))}
        </div>
      </div>

      {/* 아티스트 순위 */}
      <div className="p-4 border-b border-[#3B2667]/50">
        <h3 className="text-xs font-medium text-[#9B8DB8] mb-3">
          아티스트 인기 순위
        </h3>
        <div className="space-y-2">
          {selectedPrefecture.topArtists.map((artist, idx) => (
            <div
              key={artist.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-[#1A1432] border border-[#3B2667]/30"
            >
              <span className="text-xs font-bold text-[#9B8DB8] w-5 text-center">
                {idx + 1}
              </span>
              <div
                className="w-2 h-8 rounded-full"
                style={{
                  backgroundColor: ARTIST_COLORS[artist.id] || "#9B8DB8",
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#E8E0F0] truncate">
                  {artist.nameKo}
                </div>
                <div className="text-[10px] text-[#9B8DB8]">{artist.name}</div>
              </div>
              <span className="text-sm font-bold text-[#FF6AC1]">
                {artist.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 팬 부스트 미션 */}
      <FanBoostPanel />
    </div>
  );
}
