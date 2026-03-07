"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "@/store/useAppStore";
import type { CountryScore } from "@/types/data";

// 타임라인 시간에 따른 보간 점수 계산
function getTimelineScore(
  country: CountryScore,
  hour: number
): { score: number; trendsActive: number; wikiActive: number; youtubeActive: number } {
  // 시작부터 크게 시각화 — 베이스라인 높게 설정
  // Trends: 0시에 0.5 → 6시에 1.0 (1초부터 눈에 띄게)
  // Wiki: 5시부터 천천히 / YouTube: 12시부터 천천히
  const trendsActive = Math.min(1, 0.5 + 0.5 * Math.min(1, hour / 6));
  const wikiActive = Math.min(1, Math.max(0, (hour - 5) / 7));
  const youtubeActive = Math.min(1, Math.max(0, (hour - 12) / 10));

  // 가중 합산 + 최소 점수 보장 (시작부터 버블 보이게)
  const rawScore =
    country.trendsScore * 0.33 * trendsActive +
    country.wikiScore * 0.33 * wikiActive +
    country.youtubeScore * 0.34 * youtubeActive;

  // 최소 점수: 원래 점수의 15% (0시에도 작은 버블 보임)
  const minScore = country.score * 0.15;
  const score = Math.max(minScore, rawScore);

  return { score: Math.round(score * 10) / 10, trendsActive, wikiActive, youtubeActive };
}

// 인기도 점수를 색상으로 변환 (부드러운 HSL 보간)
function scoreToColor(score: number): string {
  if (score <= 0) return "#1A1432";
  // 보라(270°) → 마젠타(320°) → 핑크(340°) 그라데이션
  const t = Math.min(score / 100, 1);
  const hue = 270 + t * 70; // 270° → 340°
  const sat = 50 + t * 40; // 50% → 90% (낮은 점수도 채도 높게)
  const lit = 30 + t * 35; // 30% → 65% (낮은 점수도 더 밝게)
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

function scoreToRadius(score: number): number {
  if (score <= 0) return 0;
  // 최소 반경 6 → 낮은 점수도 눈에 보임
  const t = Math.min(score / 100, 1);
  const eased = t * t * (3 - 2 * t); // smoothstep
  return Math.max(6, 6 + eased * 24);
}

// 발광 강도 — 점수 10부터 발광 시작 (더 일찍)
function scoreToGlow(score: number): number {
  if (score < 10) return 0;
  return Math.min(1, (score - 10) / 60);
}

// 선택된 국가로 지도 이동
function FlyToCountry({ country }: { country: CountryScore | null }) {
  const map = useMap();
  if (country) {
    map.flyTo([country.lat, country.lng], 4, { duration: 1 });
  }
  return null;
}

// SVG 글로우 필터를 Leaflet SVG pane에 주입
function GlowFilter() {
  const map = useMap();
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    const svgEl = map.getPane("overlayPane")?.querySelector("svg");
    if (!svgEl) return;

    // defs가 없으면 생성
    let defs = svgEl.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgEl.prepend(defs);
    }

    // 글로우 필터 추가
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", "glow-filter");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");

    filter.innerHTML = `
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    `;
    defs.appendChild(filter);
    injected.current = true;
  }, [map]);

  return null;
}

// 모바일 감지 (SSR 안전)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function LeafletMap() {
  const { filteredCountries, setSelectedCountry, selectedCountry, timelineHour } =
    useAppStore();
  const countries = filteredCountries();
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const prevScoresRef = useRef<Record<string, number>>({});
  const isMobile = useIsMobile();

  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.score - b.score),
    [countries]
  );

  const isTimeline = timelineHour < 24;

  // 이전 점수 대비 변화 추적 (펄스 트리거용)
  const scoreChanges = useMemo(() => {
    const changes: Record<string, number> = {};
    sortedCountries.forEach((c) => {
      const tl = isTimeline
        ? getTimelineScore(c, timelineHour)
        : { score: c.score };
      const prev = prevScoresRef.current[c.code] ?? tl.score;
      changes[c.code] = Math.abs(tl.score - prev);
      prevScoresRef.current[c.code] = tl.score;
    });
    return changes;
  }, [sortedCountries, timelineHour, isTimeline]);

  return (
    <div className="flex-1 relative">
      <MapContainer
        center={isMobile ? [10, 110] : [15, 105]}
        zoom={isMobile ? 1 : 2}
        minZoom={isMobile ? 1 : 2}
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
        <GlowFilter />

        {/* 고점수 국가 펄스 링 (배경 레이어) */}
        {sortedCountries.map((country) => {
          const tl = isTimeline
            ? getTimelineScore(country, timelineHour)
            : { score: country.score };
          const displayScore = isTimeline ? tl.score : country.score;
          const glowIntensity = scoreToGlow(displayScore);
          if (glowIntensity <= 0) return null;
          const radius = scoreToRadius(displayScore);

          return (
            <CircleMarker
              key={`pulse-${country.code}`}
              center={[country.lat, country.lng]}
              radius={radius * 1.8}
              pathOptions={{
                fillColor: scoreToColor(displayScore),
                fillOpacity: glowIntensity * 0.25,
                color: scoreToColor(displayScore),
                weight: 0,
                opacity: 0,
              }}
              className="pulse-marker"
              interactive={false}
            />
          );
        })}

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
                fillOpacity: displayScore > 0 ? (isSelected ? 1 : 0.6 + (displayScore / 100) * 0.35) : 0,
                color: isSelected ? "#00D4FF" : color,
                weight: isSelected ? 3 : isHovered ? 2.5 : displayScore >= 60 ? 1.5 : 0.5,
                opacity: displayScore > 0 ? (isSelected ? 1 : 0.4 + (displayScore / 100) * 0.5) : 0,
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

      {/* 범례 — 모바일 숨김, 데스크톱만 좌하단 */}
      <div className="hidden md:block absolute bottom-4 left-4 bg-[#120E1F]/90 backdrop-blur-sm border border-[#3B2667]/50 rounded-xl px-4 py-3 z-[999]">
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
