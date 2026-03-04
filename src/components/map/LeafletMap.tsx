"use client";

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "@/store/useAppStore";
import type { CountryScore } from "@/types/data";

// 타임라인 시간에 따른 보간 점수 계산
function getTimelineScore(
  country: CountryScore,
  hour: number
): { score: number; trendsActive: number; wikiActive: number; youtubeActive: number } {
  // 각 소스의 활성화 비율 (0~1)
  const trendsActive = Math.min(1, Math.max(0, hour / 8));
  const wikiActive = Math.min(1, Math.max(0, (hour - 8) / 8));
  const youtubeActive = Math.min(1, Math.max(0, (hour - 16) / 8));

  // 가중 합산 (최종 score는 0.33*trends + 0.33*wiki + 0.34*youtube)
  const score =
    country.trendsScore * 0.33 * trendsActive +
    country.wikiScore * 0.33 * wikiActive +
    country.youtubeScore * 0.34 * youtubeActive;

  return { score: Math.round(score * 10) / 10, trendsActive, wikiActive, youtubeActive };
}

// 인기도 점수를 색상으로 변환
function scoreToColor(score: number): string {
  if (score >= 80) return "#FF6AC1";
  if (score >= 60) return "#E91E8C";
  if (score >= 40) return "#7B2FBE";
  if (score >= 20) return "#3B2667";
  return "#2D1B69";
}

function scoreToRadius(score: number): number {
  return Math.max(4, (score / 100) * 22);
}

// 선택된 국가로 지도 이동
function FlyToCountry({ country }: { country: CountryScore | null }) {
  const map = useMap();
  if (country) {
    map.flyTo([country.lat, country.lng], 4, { duration: 1 });
  }
  return null;
}

export default function LeafletMap() {
  const { filteredCountries, setSelectedCountry, selectedCountry, timelineHour } =
    useAppStore();
  const countries = filteredCountries();
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.score - b.score),
    [countries]
  );

  const isTimeline = timelineHour < 24;

  return (
    <div className="flex-1 relative">
      <MapContainer
        center={[20, 20]}
        zoom={2}
        minZoom={2}
        maxZoom={8}
        style={{ width: "100%", height: "100%", background: "#0F0B1A" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <FlyToCountry country={selectedCountry} />

        {sortedCountries.map((country) => {
          const isSelected = selectedCountry?.code === country.code;
          const isHovered = hoveredCode === country.code;
          const tl = isTimeline
            ? getTimelineScore(country, timelineHour)
            : { score: country.score, trendsActive: 1, wikiActive: 1, youtubeActive: 1 };
          const displayScore = isTimeline ? tl.score : country.score;
          const color = scoreToColor(displayScore);
          const radius = scoreToRadius(displayScore);

          return (
            <CircleMarker
              key={country.code}
              center={[country.lat, country.lng]}
              radius={isHovered ? radius * 1.3 : radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: displayScore > 0 ? (isSelected ? 1 : 0.8) : 0,
                color: isSelected ? "#00D4FF" : "#FF6AC1",
                weight: isSelected ? 3 : isHovered ? 2 : 1,
                opacity: displayScore > 0 ? (isSelected ? 1 : country.change >= 5 ? 0.8 : 0.3) : 0,
              }}
              eventHandlers={{
                click: () => {
                  setSelectedCountry(
                    selectedCountry?.code === country.code ? null : country
                  );
                },
                mouseover: () => setHoveredCode(country.code),
                mouseout: () => setHoveredCode(null),
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -radius]}
                className="kpop-tooltip"
              >
                <div className="bg-[#1A1432] border border-[#3B2667] rounded-lg px-3 py-2 shadow-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#E8E0F0] text-sm">
                      {country.nameKo}
                    </span>
                    {!isTimeline && (
                      <span
                        className={`text-xs font-medium ${
                          country.change > 0
                            ? "text-green-400"
                            : country.change < 0
                              ? "text-red-400"
                              : "text-gray-400"
                        }`}
                      >
                        {country.change > 0 ? "+" : ""}
                        {country.change}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#FF6AC1]">
                      {displayScore}
                    </span>
                    <div className="text-[10px] text-[#9B8DB8] leading-tight">
                      <div style={{ opacity: tl.trendsActive > 0 ? 1 : 0.3 }}>
                        Trends {isTimeline ? Math.round(country.trendsScore * tl.trendsActive * 10) / 10 : country.trendsScore}
                      </div>
                      <div style={{ opacity: tl.wikiActive > 0 ? 1 : 0.3 }}>
                        Wiki {isTimeline ? Math.round(country.wikiScore * tl.wikiActive * 10) / 10 : country.wikiScore}
                      </div>
                      <div style={{ opacity: tl.youtubeActive > 0 ? 1 : 0.3 }}>
                        YouTube {isTimeline ? Math.round(country.youtubeScore * tl.youtubeActive * 10) / 10 : country.youtubeScore}
                      </div>
                    </div>
                  </div>
                  {country.topArtists[0] && (
                    <div className="mt-1 pt-1 border-t border-[#3B2667] text-[10px] text-[#9B8DB8]">
                      #1 {country.topArtists[0].nameKo}
                    </div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* 범례 */}
      <div className="absolute bottom-4 left-4 bg-[#120E1F]/90 backdrop-blur-sm border border-[#3B2667]/50 rounded-xl px-4 py-3 z-[1000]">
        <div className="text-[10px] text-[#9B8DB8] mb-2 font-medium">
          인기도
        </div>
        <div className="flex items-center gap-1">
          {[20, 40, 60, 80, 100].map((score) => (
            <div key={score} className="flex flex-col items-center gap-1">
              <div
                className="rounded-full"
                style={{
                  width: scoreToRadius(score) * 1.2,
                  height: scoreToRadius(score) * 1.2,
                  backgroundColor: scoreToColor(score),
                  opacity: 0.85,
                }}
              />
              <span className="text-[8px] text-[#9B8DB8]">{score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
