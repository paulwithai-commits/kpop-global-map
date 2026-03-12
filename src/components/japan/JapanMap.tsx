"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useJapanStore } from "@/store/useJapanStore";
import type { PrefectureScore } from "@/types/japan-data";

// 점수 → 색상 (보라~핑크 그라데이션, 고대비)
function scoreToColor(score: number): string {
  if (score <= 0) return "#0F0B1A";
  const t = Math.min(score / 100, 1);
  // 제곱 커브: 저점수는 오래 어둡고, 고점수에서 급격히 밝아짐
  const t2 = t * t;
  const hue = 280 + t2 * 60;  // 280(보라) → 340(핑크)
  const sat = 25 + t * 65;    // 25 → 90
  const lit = 8 + t * 60;     // 8(거의 검정) → 68(밝은 핑크)
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

function getHourlyScore(pref: PrefectureScore, hour: number): number {
  if (hour >= 24) return pref.trendsScore;
  const idx = Math.floor(hour);
  const frac = hour - idx;
  const curr = pref.hourlyScores[idx] ?? pref.trendsScore;
  const next = pref.hourlyScores[Math.min(idx + 1, 23)] ?? curr;
  return Math.round((curr + (next - curr) * frac) * 10) / 10;
}

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

// 스타일 업데이트 전용 하위 컴포넌트
function StyleUpdater({ geoRef }: { geoRef: React.RefObject<L.GeoJSON | null> }) {
  const { filteredPrefectures, selectedPrefecture, timelineHour } = useJapanStore();
  const prefectures = filteredPrefectures();
  const isTimeline = timelineHour < 24;

  const prefMap = useMemo(() => {
    const map = new Map<number, PrefectureScore>();
    prefectures.forEach((p) => {
      map.set(parseInt(p.code.replace("JP-", ""), 10), p);
    });
    return map;
  }, [prefectures]);

  useEffect(() => {
    if (!geoRef.current) return;
    geoRef.current.setStyle((feature) => {
      if (!feature) return {};
      const prefCode = feature.properties?.pref as number;
      const pref = prefMap.get(prefCode);
      const isSelected =
        selectedPrefecture &&
        parseInt(selectedPrefecture.code.replace("JP-", ""), 10) === prefCode;

      let score = 0;
      if (pref) {
        score = isTimeline ? getHourlyScore(pref, timelineHour) : pref.trendsScore;
      }

      return {
        fillColor: scoreToColor(score),
        fillOpacity: score > 0 ? 0.3 + (score / 100) * 0.65 : 0.08,
        color: isSelected ? "#00D4FF" : "#3B2667",
        weight: isSelected ? 3 : 0.8,
        opacity: 1,
      };
    });
  }, [geoRef, prefMap, selectedPrefecture, isTimeline, timelineHour]);

  return null;
}

export default function JapanMap() {
  const { data, setSelectedPrefecture } = useJapanStore();
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const isMobile = useIsMobile();

  // ref로 최신 store 상태 접근 (stale closure 방지)
  const storeRef = useRef(useJapanStore.getState());
  useEffect(() => {
    return useJapanStore.subscribe((state) => {
      storeRef.current = state;
    });
  }, []);

  // GeoJSON 로드
  useEffect(() => {
    fetch("/data/japan-prefectures.geo.json")
      .then((res) => res.json())
      .then((geo) => setGeoJsonData(geo));
  }, []);

  // onEachFeature — ref로 최신 상태 접근
  const onEachFeature = useMemo(
    () => (feature: GeoJSON.Feature, layer: L.Layer) => {
      const prefCode = feature.properties?.pref as number;
      const prefName = feature.properties?.name as string;

      layer.on({
        click: () => {
          const state = storeRef.current;
          const prefs = state.data?.prefectures ?? [];
          const pref = prefs.find(
            (p) => parseInt(p.code.replace("JP-", ""), 10) === prefCode
          );
          if (pref) {
            state.setSelectedPrefecture(
              state.selectedPrefecture?.code === pref.code ? null : pref
            );
          }
        },
        mouseover: (e: L.LeafletMouseEvent) => {
          const state = storeRef.current;
          const prefs = state.filteredPrefectures();
          const pref = prefs.find(
            (p) => parseInt(p.code.replace("JP-", ""), 10) === prefCode
          );
          const isTimeline = state.timelineHour < 24;
          const score = pref
            ? isTimeline
              ? getHourlyScore(pref, state.timelineHour)
              : pref.trendsScore
            : 0;
          const change = pref?.change ?? 0;
          const changeStr =
            change > 0
              ? `<span style="color:#4ade80">+${change.toFixed(1)}</span>`
              : change < 0
                ? `<span style="color:#f87171">${change.toFixed(1)}</span>`
                : "";
          const topArtist = pref?.topArtists[0];

          // 호버 스타일
          const pathLayer = e.target as L.Path;
          pathLayer.setStyle({ weight: 2.5, color: "#E8E0F0" });

          pathLayer
            .bindTooltip(
              `<div style="background:#1A1432;border:1px solid #3B2667;border-radius:8px;padding:8px 12px;color:#E8E0F0;font-size:12px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <b>${pref?.nameKo ?? prefName}</b>
                <span style="color:#9B8DB8">${prefName}</span>
                ${changeStr}
              </div>
              <div style="font-size:20px;font-weight:900;color:#FF6AC1;">${score.toFixed(1)}</div>
              ${topArtist ? `<div style="font-size:10px;color:#9B8DB8;margin-top:2px;">#1 ${topArtist.nameKo}</div>` : ""}
            </div>`,
              { sticky: true, direction: "top", offset: [0, -10], className: "japan-tooltip" }
            )
            .openTooltip();
        },
        mouseout: (e: L.LeafletMouseEvent) => {
          const pathLayer = e.target as L.Path;
          // StyleUpdater가 올바른 스타일을 다시 적용할 것
          pathLayer.setStyle({ weight: 0.8, color: "#3B2667" });
          pathLayer.unbindTooltip();
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // GeoJSON data + store data 둘 다 있어야 렌더링
  const geoKey = useMemo(() => {
    if (!geoJsonData || !data) return 0;
    return 1; // 한번만 생성
  }, [geoJsonData, data]);

  if (!geoJsonData || !data) return null;

  return (
    <div className="flex-1 relative">
      <MapContainer
        center={[36.5, 137]}
        zoom={isMobile ? 5 : 6}
        minZoom={4}
        maxZoom={10}
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
        <GeoJSON
          key={geoKey}
          data={geoJsonData}
          onEachFeature={onEachFeature}
          ref={(ref) => {
            geoJsonRef.current = ref ?? null;
          }}
        />
        <StyleUpdater geoRef={geoJsonRef} />
      </MapContainer>

      {/* 범례 — 데스크톱 */}
      <div className="hidden md:block absolute bottom-14 left-4 bg-[#120E1F]/90 backdrop-blur-sm border border-[#3B2667]/50 rounded-xl px-4 py-3 z-[999]">
        <div className="text-[10px] text-[#9B8DB8] mb-2 font-medium">
          Google Trends 인기도
        </div>
        <div className="flex items-center gap-1">
          {[20, 40, 60, 80, 100].map((score) => (
            <div key={score} className="flex flex-col items-center gap-1">
              <div
                className="rounded w-6 h-4"
                style={{ backgroundColor: scoreToColor(score) }}
              />
              <span className="text-[8px] text-[#9B8DB8]">{score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
