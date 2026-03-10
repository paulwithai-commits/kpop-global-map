"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useJapanStore } from "@/store/useJapanStore";
import {
  X,
  ExternalLink,
  Newspaper,
  Loader2,
  Search,
  Play,
  Globe,
} from "lucide-react";
import { useState } from "react";

type TabType = "all" | "news" | "yahoo" | "youtube" | "search";

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "전체", icon: null },
  { key: "news", label: "뉴스", icon: <Newspaper className="w-3 h-3" /> },
  { key: "yahoo", label: "Yahoo", icon: <Globe className="w-3 h-3" /> },
  { key: "youtube", label: "YouTube", icon: <Play className="w-3 h-3" /> },
  { key: "search", label: "검색", icon: <Search className="w-3 h-3" /> },
];

const TYPE_STYLES: Record<
  string,
  { badge: string; label: string; icon: React.ReactNode }
> = {
  news: {
    badge: "bg-orange-500/20 text-orange-400",
    label: "뉴스",
    icon: <Newspaper className="w-3 h-3" />,
  },
  yahoo: {
    badge: "bg-purple-500/20 text-purple-400",
    label: "Yahoo",
    icon: <Globe className="w-3 h-3" />,
  },
  search: {
    badge: "bg-blue-500/20 text-blue-400",
    label: "검색",
    icon: <Search className="w-3 h-3" />,
  },
  youtube: {
    badge: "bg-red-500/20 text-red-400",
    label: "YouTube",
    icon: <Play className="w-3 h-3" />,
  },
};

export function JapanContentPanel() {
  const { selectedKeyword, contentItems, isContentLoading, setSelectedKeyword } =
    useJapanStore();
  const [tab, setTab] = useState<TabType>("all");

  const isOpen = selectedKeyword !== null;

  if (!isOpen) return null;

  const filtered =
    tab === "all" ? contentItems : contentItems.filter((i) => i.type === tab);

  const counts: Record<string, number> = { all: contentItems.length };
  for (const item of contentItems) {
    counts[item.type] = (counts[item.type] || 0) + 1;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute top-3 right-3 z-[1000] w-[340px] max-h-[70vh] bg-[#120E1F]/95 backdrop-blur-md border border-[#3B2667] rounded-xl shadow-2xl overflow-hidden flex flex-col md:right-[330px]"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3B2667]/50">
            <span className="text-xs font-bold text-[#E8E0F0] truncate">
              &ldquo;{selectedKeyword}&rdquo; 관련 콘텐츠
            </span>
            <button
              onClick={() => setSelectedKeyword(null)}
              className="p-1 rounded-lg hover:bg-[#3B2667]/50"
            >
              <X className="w-4 h-4 text-[#9B8DB8]" />
            </button>
          </div>

          {/* 탭 */}
          <div className="flex gap-1 px-3 py-2 border-b border-[#3B2667]/30 overflow-x-auto">
            {TABS.map((t) =>
              (counts[t.key] || 0) > 0 || t.key === "all" ? (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${
                    tab === t.key
                      ? "bg-[#9B5DE5]/30 text-[#E8E0F0] border border-[#9B5DE5]/50"
                      : "text-[#9B8DB8] hover:text-[#E8E0F0] border border-transparent"
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {counts[t.key] ? (
                    <span className="text-[9px] opacity-60">
                      {counts[t.key]}
                    </span>
                  ) : null}
                </button>
              ) : null
            )}
          </div>

          {/* 콘텐츠 */}
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {isContentLoading && (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="w-5 h-5 text-[#9B5DE5] animate-spin" />
                <p className="text-[10px] text-[#9B8DB8]">
                  콘텐츠를 불러오는 중...
                </p>
              </div>
            )}
            {!isContentLoading &&
              filtered.map((item, idx) => {
                const style = TYPE_STYLES[item.type] ?? TYPE_STYLES.news;
                return (
                  <a
                    key={`${item.url}-${idx}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg bg-[#1A1432]/80 border border-[#3B2667]/30 hover:border-[#9B5DE5]/50 transition-all group"
                  >
                    <div className="flex items-start gap-2.5">
                      {item.type === "youtube" && item.thumbnail && (
                        <div className="w-16 h-10 rounded-md overflow-hidden flex-shrink-0 bg-[#3B2667]/30">
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold ${style.badge}`}
                          >
                            {style.icon}
                            {style.label}
                          </span>
                          {item.provider && (
                            <span className="text-[8px] text-[#9B8DB8]/60 truncate">
                              {item.provider}
                            </span>
                          )}
                        </div>
                        <h4 className="text-[11px] font-semibold text-[#E8E0F0] leading-relaxed line-clamp-2 group-hover:text-[#FF6AC1] transition-colors">
                          {item.title}
                        </h4>
                        {item.timeAgo && (
                          <span className="text-[9px] text-[#9B8DB8] mt-1 block">
                            {item.timeAgo}
                          </span>
                        )}
                      </div>
                      <ExternalLink className="w-3 h-3 text-[#9B8DB8]/50 flex-shrink-0 mt-0.5 group-hover:text-[#FF6AC1]" />
                    </div>
                  </a>
                );
              })}
            {!isContentLoading && filtered.length === 0 && (
              <div className="flex flex-col items-center py-8 gap-2">
                <Newspaper className="w-5 h-5 text-[#9B8DB8]/40" />
                <p className="text-[10px] text-[#9B8DB8]">
                  관련 콘텐츠가 없습니다
                </p>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="px-4 py-2 border-t border-[#3B2667]/30">
            <p className="text-[9px] text-[#9B8DB8]/60 text-center">
              출처: 다음 뉴스 · YouTube · Yahoo Japan
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
