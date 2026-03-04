"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { TrendingUp, Globe, BookOpen, X } from "lucide-react";
import { useState } from "react";

const sourceConfig = {
  google_trends: {
    icon: TrendingUp,
    label: "Google Trends",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  wikipedia: {
    icon: BookOpen,
    label: "Wikipedia",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
};

export function TrendingInsights() {
  const { data } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const insights = data?.trendingInsights ?? [];
  if (insights.length === 0) return null;

  // Google Trends TOP 5와 Wikipedia TOP 5 분리
  const trendsInsights = insights.filter((i) => i.source === "google_trends").slice(0, 5);
  const wikiInsights = insights.filter((i) => i.source === "wikipedia").slice(0, 5);

  return (
    <>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-20 right-4 z-[1000] bg-[#120E1F]/90 backdrop-blur-sm border border-[#3B2667]/50 rounded-xl px-3 py-2 flex items-center gap-2 hover:border-[#9B5DE5]/50 transition-colors"
      >
        <TrendingUp className="w-4 h-4 text-[#FF6AC1]" />
        <span className="text-xs font-medium text-[#E8E0F0]">
          트렌딩 TOP 5
        </span>
      </button>

      {/* 패널 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-32 right-4 z-[1000] w-[320px] bg-[#120E1F]/95 backdrop-blur-md border border-[#3B2667] rounded-xl shadow-2xl overflow-hidden"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3B2667]/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF6AC1]" />
                <span className="text-sm font-bold text-[#E8E0F0]">
                  오늘의 트렌딩
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-[#3B2667]/50 transition-colors"
              >
                <X className="w-4 h-4 text-[#9B8DB8]" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {/* Google Trends 섹션 */}
              <div className="px-4 pt-3 pb-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                    Google Trends
                  </span>
                </div>
                <div className="space-y-1.5">
                  {trendsInsights.map((insight, idx) => (
                    <motion.div
                      key={insight.keyword}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-orange-500/5 border border-orange-500/10"
                    >
                      <span className="text-xs font-bold text-orange-400 w-4">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#E8E0F0] truncate">
                          {insight.keyword}
                        </div>
                        <div className="text-[9px] text-[#9B8DB8] flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          {insight.topCountries.join(", ")}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Wikipedia 섹션 */}
              <div className="px-4 pt-3 pb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                    Wikipedia 조회수
                  </span>
                </div>
                <div className="space-y-1.5">
                  {wikiInsights.map((insight, idx) => (
                    <motion.div
                      key={insight.keyword}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (idx + 5) * 0.05 }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10"
                    >
                      <span className="text-xs font-bold text-blue-400 w-4">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#E8E0F0] truncate">
                          {insight.keyword}
                        </div>
                        <div className="text-[9px] text-[#9B8DB8] flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          {insight.topCountries.join(", ")}
                        </div>
                      </div>
                      <span className="text-[10px] text-blue-400 font-medium">
                        {insight.score.toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
