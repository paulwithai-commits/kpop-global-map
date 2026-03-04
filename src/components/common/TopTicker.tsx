"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

export function TopTicker() {
  const { data, setSelectedCountry } = useAppStore();

  if (!data) return null;

  const top10 = [...data.countries]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div className="bg-[#120E1F]/90 backdrop-blur-sm border-t border-[#3B2667]/50 px-4 py-2.5 overflow-hidden">
      <div className="flex items-center gap-2">
        <span className="flex-shrink-0 text-xs font-bold text-[#FF6AC1]">
          TOP 10
        </span>
        <div className="flex-1 overflow-hidden">
          <motion.div
            className="flex items-center gap-4"
            animate={{ x: [0, -800] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 20,
                ease: "linear",
              },
            }}
          >
            {[...top10, ...top10].map((country, i) => (
              <button
                key={`${country.code}-${i}`}
                onClick={() => setSelectedCountry(country)}
                className="flex-shrink-0 flex items-center gap-1.5 hover:text-[#FF6AC1] transition-colors group"
              >
                <span className="text-xs font-bold text-[#9B5DE5] group-hover:text-[#FF6AC1]">
                  {(i % top10.length) + 1}
                </span>
                <span className="text-sm text-[#E8E0F0] whitespace-nowrap">
                  {country.nameKo}
                </span>
                <span className="text-sm font-bold bg-gradient-to-r from-[#9B5DE5] to-[#FF6AC1] bg-clip-text text-transparent">
                  {country.score}
                </span>
                {country.change > 0 && (
                  <span className="text-[10px] text-green-400">
                    +{country.change}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
