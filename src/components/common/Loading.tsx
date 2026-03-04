"use client";

import { motion } from "framer-motion";

export function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0F0B1A]">
      <div className="text-center">
        <motion.div
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9B5DE5] to-[#FF6AC1] mx-auto mb-4 flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span className="text-white font-black text-2xl">K</span>
        </motion.div>
        <motion.p
          className="text-[#9B8DB8] text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          글로벌 데이터를 불러오는 중...
        </motion.p>
      </div>
    </div>
  );
}
