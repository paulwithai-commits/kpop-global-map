"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useMemo } from "react";

// 더 많은 위치 — 화면 전체에 분포
const POSITIONS = [
  { x: "8%", y: "12%" },
  { x: "75%", y: "10%" },
  { x: "20%", y: "30%" },
  { x: "55%", y: "25%" },
  { x: "85%", y: "35%" },
  { x: "12%", y: "50%" },
  { x: "42%", y: "45%" },
  { x: "68%", y: "55%" },
  { x: "30%", y: "68%" },
  { x: "58%", y: "72%" },
  { x: "15%", y: "78%" },
  { x: "78%", y: "70%" },
  { x: "48%", y: "15%" },
  { x: "35%", y: "55%" },
  { x: "90%", y: "20%" },
  { x: "5%", y: "35%" },
];

const GRADIENTS = [
  "from-[#FF6AC1] to-[#9B5DE5]",
  "from-[#F97316] to-[#FBBF24]",
  "from-[#6366F1] to-[#818CF8]",
  "from-[#FF0000] to-[#FF6AC1]",
  "from-[#9B5DE5] to-[#00D4FF]",
  "from-[#10B981] to-[#34D399]",
  "from-[#EC4899] to-[#F472B6]",
  "from-[#F59E0B] to-[#FCD34D]",
];

const SIZES = [
  "text-xs md:text-sm",
  "text-sm md:text-base",
  "text-base md:text-lg",
  "text-lg md:text-xl",
  "text-xl md:text-2xl",
];

interface FloatingWord {
  id: number;
  text: string;
  posIdx: number;
  gradientIdx: number;
  sizeIdx: number;
  driftX: number;
  driftY: number;
}

export function FloatingKeywords() {
  const { data, timelineHour } = useAppStore();
  const [words, setWords] = useState<FloatingWord[]>([]);
  const counterRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isPlaying = timelineHour < 24;

  // 트렌딩 키워드 + 아티스트 이름 합쳐서 풍부하게
  const keywords = useMemo(() => {
    if (!data) return [];
    const trending = data.trendingInsights?.map((i) => i.keyword) ?? [];
    const artists = data.topArtists?.map((a) => a.nameKo) ?? [];
    // 중복 제거하면서 합치기
    const all = [...new Set([...trending, ...artists])];
    return all;
  }, [data]);

  useEffect(() => {
    if (!isPlaying || keywords.length === 0) {
      setWords([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // 0.4초마다 새 키워드 추가 (더 빠르게)
    intervalRef.current = setInterval(() => {
      counterRef.current += 1;
      const idx = counterRef.current % keywords.length;
      const posIdx = (counterRef.current * 7) % POSITIONS.length; // 불규칙 위치
      const gradientIdx = (counterRef.current * 3) % GRADIENTS.length;
      const sizeIdx = (counterRef.current * 5) % SIZES.length;

      const newWord: FloatingWord = {
        id: counterRef.current,
        text: keywords[idx],
        posIdx,
        gradientIdx,
        sizeIdx,
        driftX: (Math.random() - 0.5) * 40,
        driftY: -20 - Math.random() * 30,
      };

      setWords((prev) => {
        const next = [...prev, newWord];
        // 최대 8개 동시 표시
        return next.length > 8 ? next.slice(-8) : next;
      });
    }, 400);

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
          const gradient = GRADIENTS[word.gradientIdx];
          const size = SIZES[word.sizeIdx];
          return (
            <motion.div
              key={word.id}
              initial={{ opacity: 0, scale: 0.3, y: 15 }}
              animate={{
                opacity: [0, 0.85, 0.85, 0],
                scale: [0.3, 1.1, 1, 0.7],
                y: [15, 0, word.driftY * 0.5, word.driftY],
                x: [0, 0, word.driftX * 0.3, word.driftX],
              }}
              transition={{ duration: 2, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
              className="absolute"
              style={{ left: pos.x, top: pos.y }}
            >
              <span
                className={`${size} font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent whitespace-nowrap`}
                style={{ textShadow: "0 0 20px rgba(155,93,229,0.3)" }}
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
