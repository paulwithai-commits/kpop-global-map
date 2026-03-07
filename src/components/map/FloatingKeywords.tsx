"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

// 키워드가 나타날 위치 프리셋 (화면 비율 기준)
const POSITIONS = [
  { x: "15%", y: "20%" },
  { x: "70%", y: "15%" },
  { x: "25%", y: "65%" },
  { x: "60%", y: "70%" },
  { x: "45%", y: "35%" },
  { x: "80%", y: "45%" },
  { x: "10%", y: "45%" },
  { x: "55%", y: "55%" },
];

const COLORS = [
  "from-[#FF6AC1] to-[#9B5DE5]",
  "from-[#F97316] to-[#FBBF24]",
  "from-[#6366F1] to-[#818CF8]",
  "from-[#FF0000] to-[#FF6AC1]",
  "from-[#9B5DE5] to-[#00D4FF]",
];

interface FloatingWord {
  id: number;
  text: string;
  posIdx: number;
  colorIdx: number;
}

export function FloatingKeywords() {
  const { data, timelineHour } = useAppStore();
  const [words, setWords] = useState<FloatingWord[]>([]);
  const counterRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isPlaying = timelineHour < 24;

  // 트렌딩 키워드 목록 추출
  const keywords = data?.trendingInsights?.map((i) => i.keyword) ?? [];

  useEffect(() => {
    if (!isPlaying || keywords.length === 0) {
      setWords([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // 0.8초마다 새 키워드 추가
    intervalRef.current = setInterval(() => {
      counterRef.current += 1;
      const idx = counterRef.current % keywords.length;
      const posIdx = counterRef.current % POSITIONS.length;
      const colorIdx = counterRef.current % COLORS.length;

      const newWord: FloatingWord = {
        id: counterRef.current,
        text: keywords[idx],
        posIdx,
        colorIdx,
      };

      setWords((prev) => {
        // 최대 4개 동시 표시
        const next = [...prev, newWord];
        return next.length > 4 ? next.slice(-4) : next;
      });
    }, 800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, keywords.length]);

  if (!isPlaying || keywords.length === 0) return null;

  return (
    <div className="absolute inset-0 z-[500] pointer-events-none overflow-hidden">
      <AnimatePresence mode="popLayout">
        {words.map((word) => {
          const pos = POSITIONS[word.posIdx];
          const gradient = COLORS[word.colorIdx];
          return (
            <motion.div
              key={word.id}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 0.7, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute"
              style={{ left: pos.x, top: pos.y }}
            >
              <span
                className={`text-sm md:text-lg font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent drop-shadow-lg whitespace-nowrap`}
              >
                {word.text}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
