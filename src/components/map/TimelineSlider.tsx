"use client";

import { useAppStore } from "@/store/useAppStore";
import { useCallback, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";

// 소스별 구간 정의 (3시간부터 적극적으로 표현되도록 앞당김)
const SOURCE_ZONES = [
  { start: 0, end: 6, label: "Google Trends", color: "#F97316" },
  { start: 6, end: 14, label: "Wikipedia", color: "#6366F1" },
  { start: 14, end: 24, label: "YouTube", color: "#FF0000" },
];

// 재생 속도: 6초에 0→24 완주 (초당 4시간)
const PLAY_SPEED = 4;

export function TimelineSlider() {
  const timelineHour = useAppStore((s) => s.timelineHour);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // 자동 재생 로직 (zustand 직접 접근으로 리렌더 최소화)
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const animate = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const increment = (delta / 1000) * PLAY_SPEED;
      const current = useAppStore.getState().timelineHour;
      const next = current + increment;

      if (next >= 24) {
        useAppStore.setState({ timelineHour: 24 });
        setIsPlaying(false);
        return;
      }

      useAppStore.setState({ timelineHour: next });
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [isPlaying]);

  // 드래그/클릭으로 시간 설정
  const updateFromPointer = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    useAppStore.setState({ timelineHour: ratio * 24 });
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      setIsPlaying(false);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updateFromPointer(e.clientX);
    },
    [updateFromPointer]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updateFromPointer(e.clientX);
    },
    [isDragging, updateFromPointer]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePlay = () => {
    if (timelineHour >= 23.9) {
      useAppStore.setState({ timelineHour: 0 });
    }
    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    useAppStore.setState({ timelineHour: 24 });
  };

  const progress = (timelineHour / 24) * 100;
  const currentHour = Math.floor(timelineHour);
  const currentMinute = Math.floor((timelineHour % 1) * 60);
  const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

  const activeSource =
    SOURCE_ZONES.find((z) => timelineHour >= z.start && timelineHour < z.end) ||
    SOURCE_ZONES[2];

  const isAtEnd = timelineHour >= 24;

  return (
    <>
      {/* ===== 모바일: 우측 하단 컴팩트 버튼 ===== */}
      <div className="md:hidden absolute bottom-3 right-3 z-[1000] flex items-center gap-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1.5 bg-[#120E1F]/95 backdrop-blur-md border border-[#3B2667] rounded-full px-2.5 py-1.5 shadow-2xl"
        >
          <button
            onClick={handlePlay}
            className="w-8 h-8 rounded-full bg-[#9B5DE5]/30 flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-[#FF6AC1]" />
            ) : (
              <Play className="w-4 h-4 text-[#FF6AC1] ml-0.5" />
            )}
          </button>
          <span className="text-sm font-mono font-bold text-[#E8E0F0] tabular-nums min-w-[42px]">
            {timeStr}
          </span>
          {!isAtEnd && (
            <button
              onClick={handleReset}
              className="w-6 h-6 rounded-full flex items-center justify-center"
            >
              <RotateCcw className="w-3 h-3 text-[#9B8DB8]" />
            </button>
          )}
          {!isAtEnd && (
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: activeSource.color }}
            />
          )}
        </motion.div>
      </div>

      {/* ===== 데스크톱: 하단 중앙 풀 슬라이더 ===== */}
      <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-[560px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#120E1F]/95 backdrop-blur-md border border-[#3B2667] rounded-xl px-4 py-3 shadow-2xl"
        >
          {/* 상단: 컨트롤 + 시간 + 현재 소스 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlay}
                className="w-7 h-7 rounded-full bg-[#9B5DE5]/20 hover:bg-[#9B5DE5]/40 flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-[#FF6AC1]" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-[#FF6AC1] ml-0.5" />
                )}
              </button>
              {!isAtEnd && (
                <button
                  onClick={handleReset}
                  className="w-6 h-6 rounded-full hover:bg-[#3B2667]/50 flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-[#9B8DB8]" />
                </button>
              )}
              <span className="text-lg font-mono font-bold text-[#E8E0F0] tabular-nums w-[52px]">
                {timeStr}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {isAtEnd ? (
                <span className="text-[10px] text-[#9B8DB8]">전체 데이터</span>
              ) : (
                <>
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: activeSource.color }}
                  />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: activeSource.color }}
                  >
                    {activeSource.label}
                  </span>
                  <span className="text-[10px] text-[#9B8DB8]">반영 중</span>
                </>
              )}
            </div>
          </div>

          {/* 슬라이더 트랙 */}
          <div
            ref={trackRef}
            className="relative h-6 cursor-pointer touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="absolute top-2 left-0 right-0 h-2 rounded-full overflow-hidden flex">
              {SOURCE_ZONES.map((zone) => (
                <div
                  key={zone.label}
                  className="h-full"
                  style={{
                    width: `${((zone.end - zone.start) / 24) * 100}%`,
                    backgroundColor: zone.color,
                    opacity: 0.15,
                  }}
                />
              ))}
            </div>

            <div
              className="absolute top-2 left-0 h-2 rounded-l-full overflow-hidden"
              style={{
                width: `${progress}%`,
                borderRadius: progress >= 100 ? "9999px" : undefined,
              }}
            >
              <div className="h-full flex w-full">
                {SOURCE_ZONES.map((zone) => {
                  const zoneStartPct = (zone.start / 24) * 100;
                  const zoneEndPct = (zone.end / 24) * 100;
                  const visibleStart = Math.max(0, zoneStartPct);
                  const visibleEnd = Math.min(progress, zoneEndPct);
                  if (visibleEnd <= visibleStart) return null;
                  return (
                    <div
                      key={zone.label}
                      className="h-full flex-shrink-0"
                      style={{
                        width: `${((visibleEnd - visibleStart) / progress) * 100}%`,
                        backgroundColor: zone.color,
                        opacity: 0.85,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div
              className="absolute top-0 -translate-x-1/2 pointer-events-none"
              style={{ left: `${Math.min(progress, 100)}%` }}
            >
              <div
                className={`w-4 h-4 mt-0.5 rounded-full border-2 border-white shadow-lg transition-transform ${isDragging ? "scale-125" : ""}`}
                style={{ backgroundColor: isAtEnd ? "#FF6AC1" : activeSource.color }}
              />
            </div>
          </div>

          <div className="flex justify-between mt-0.5 px-0.5">
            {["00:00", "06:00", "14:00", "24:00"].map((t) => (
              <span key={t} className="text-[8px] text-[#9B8DB8]/60 tabular-nums">
                {t}
              </span>
            ))}
          </div>
          <div className="flex mt-0.5">
            {SOURCE_ZONES.map((zone) => (
              <div key={zone.label} className="flex-1 text-center">
                <span
                  className="text-[8px] font-medium"
                  style={{ color: zone.color, opacity: 0.5 }}
                >
                  {zone.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}
