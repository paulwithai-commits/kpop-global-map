"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";

export function VisitStreak() {
  const visitStreak = useAppStore((s) => s.visitStreak);

  if (visitStreak.count < 2) return null;

  const isSpecial = visitStreak.count >= 7;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          isSpecial
            ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-300"
            : "bg-[#9B5DE5]/10 border border-[#9B5DE5]/20 text-[#9B8DB8]"
        }`}
      >
        <span>{isSpecial ? "🔥" : "✨"}</span>
        <span>{visitStreak.count}일 연속 방문</span>
      </motion.div>
    </AnimatePresence>
  );
}
