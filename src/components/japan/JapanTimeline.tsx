"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward } from "lucide-react";
import { useJapanStore } from "@/store/useJapanStore";

export function JapanTimeline() {
  const { timelineHour, setTimelineHour } = useJapanStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(true);
    setTimelineHour(0);
    intervalRef.current = setInterval(() => {
      setTimelineHour((prev: number) => {
        if (prev >= 24) {
          stopPlayback();
          return 24;
        }
        return Math.round((prev + 0.5) * 10) / 10;
      });
    }, 200);
  }, [setTimelineHour, stopPlayback]);

  // 접속 시 자동 재생
  useEffect(() => {
    const timer = setTimeout(startPlayback, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const displayHour =
    timelineHour >= 24
      ? "현재"
      : `${Math.floor(timelineHour).toString().padStart(2, "0")}:${Math.floor((timelineHour % 1) * 60)
          .toString()
          .padStart(2, "0")}`;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999] bg-[#120E1F]/90 backdrop-blur-sm border border-[#3B2667]/50 rounded-xl px-4 py-2.5 flex items-center gap-3 w-[min(90vw,400px)]">
      {/* 재생/정지 */}
      <button
        onClick={isPlaying ? stopPlayback : startPlayback}
        className="p-1.5 rounded-lg hover:bg-[#3B2667]/50 text-[#E8E0F0] transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>

      {/* 시간 표시 */}
      <span className="text-xs font-mono text-[#FF6AC1] min-w-[3rem] text-center font-bold">
        {displayHour}
      </span>

      {/* 슬라이더 */}
      <input
        type="range"
        min={0}
        max={24}
        step={0.5}
        value={timelineHour}
        onChange={(e) => {
          stopPlayback();
          setTimelineHour(parseFloat(e.target.value));
        }}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF6AC1]
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,106,193,0.5)]
          bg-gradient-to-r from-[#3B2667] to-[#9B5DE5]"
      />

      {/* 현재로 이동 */}
      <button
        onClick={() => {
          stopPlayback();
          setTimelineHour(24);
        }}
        className="p-1.5 rounded-lg hover:bg-[#3B2667]/50 text-[#9B8DB8] transition-colors"
        title="현재 데이터로"
      >
        <SkipForward className="w-4 h-4" />
      </button>
    </div>
  );
}
