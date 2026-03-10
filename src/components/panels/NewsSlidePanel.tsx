"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import {
  X,
  ExternalLink,
  Newspaper,
  Loader2,
  AlertCircle,
  Search,
  Play,
} from "lucide-react";
import { useState } from "react";
import type { ContentItem } from "@/types/data";

type TabType = "all" | "news" | "search" | "youtube";

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "전체", icon: null },
  { key: "news", label: "뉴스", icon: <Newspaper className="w-3 h-3" /> },
  { key: "search", label: "검색", icon: <Search className="w-3 h-3" /> },
  { key: "youtube", label: "Shorts", icon: <Play className="w-3 h-3" /> },
];

export function NewsSlidePanel() {
  const {
    selectedKeyword,
    contentItems,
    newsArticles,
    isNewsLoading,
    newsError,
    setSelectedKeyword,
  } = useAppStore();

  const isOpen = selectedKeyword !== null;
  // contentItems가 있으면 사용, 없으면 newsArticles를 변환해서 사용
  const items: ContentItem[] =
    contentItems.length > 0
      ? contentItems
      : newsArticles.map((n) => ({ ...n, type: "news" as const }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 데스크톱: 사이드 패널 */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="hidden md:flex flex-col absolute top-32 right-[340px] z-[1000] w-[380px] max-h-[550px] bg-[#120E1F]/95 backdrop-blur-md border border-[#3B2667] rounded-xl shadow-2xl overflow-hidden"
          >
            <ContentPanelInner
              keyword={selectedKeyword!}
              items={items}
              isLoading={isNewsLoading}
              error={newsError}
              onClose={() => setSelectedKeyword(null)}
            />
          </motion.div>

          {/* 모바일: 바텀시트 */}
          <MobileContentSheet />
        </>
      )}
    </AnimatePresence>
  );
}

function ContentPanelInner({
  keyword,
  items,
  isLoading,
  error,
  onClose,
}: {
  keyword: string;
  items: ContentItem[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabType>("all");
  const cleanLabel = keyword.replace(/\s*\(.*?\)\s*/g, "").trim();

  const filtered =
    tab === "all" ? items : items.filter((i) => i.type === tab);

  const counts = {
    all: items.length,
    news: items.filter((i) => i.type === "news").length,
    search: items.filter((i) => i.type === "search").length,
    youtube: items.filter((i) => i.type === "youtube").length,
  };

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3B2667]/50 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Newspaper className="w-4 h-4 text-[#FF6AC1] flex-shrink-0" />
          <span className="text-xs font-bold text-[#E8E0F0] truncate">
            &ldquo;{cleanLabel}&rdquo; 관련 콘텐츠
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[#3B2667]/50 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-[#9B8DB8]" />
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 px-3 py-2 border-b border-[#3B2667]/30 flex-shrink-0 overflow-x-auto">
        {TABS.map((t) =>
          counts[t.key] > 0 || t.key === "all" ? (
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
              <span className="text-[9px] opacity-60">{counts[t.key]}</span>
            </button>
          ) : null
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="overflow-y-auto flex-1 p-3 space-y-2">
        {isLoading && <LoadingSkeleton />}
        {error && <ErrorState message={error} />}
        {!isLoading &&
          !error &&
          filtered.map((item, idx) => (
            <ContentCard key={`${item.url}-${idx}`} item={item} />
          ))}
        {!isLoading && !error && filtered.length === 0 && <EmptyState />}
      </div>

      {/* 푸터 */}
      <div className="px-4 py-2 border-t border-[#3B2667]/30 flex-shrink-0">
        <p className="text-[9px] text-[#9B8DB8]/60 text-center">
          출처: 다음 뉴스 · 다음 검색 · YouTube
        </p>
      </div>
    </>
  );
}

const TYPE_STYLES = {
  news: {
    badge: "bg-orange-500/20 text-orange-400",
    label: "뉴스",
    icon: <Newspaper className="w-3 h-3" />,
  },
  search: {
    badge: "bg-blue-500/20 text-blue-400",
    label: "검색",
    icon: <Search className="w-3 h-3" />,
  },
  youtube: {
    badge: "bg-red-500/20 text-red-400",
    label: "Shorts",
    icon: <Play className="w-3 h-3" />,
  },
};

function ContentCard({ item }: { item: ContentItem }) {
  const style = TYPE_STYLES[item.type] ?? TYPE_STYLES.news;

  return (
    <a
      href={item.type === "news"
        ? `https://translate.google.com/translate?sl=ko&tl=en&u=${encodeURIComponent(item.url)}`
        : item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg bg-[#1A1432]/80 border border-[#3B2667]/30 hover:border-[#9B5DE5]/50 transition-all group"
    >
      <div className="flex items-start gap-2.5">
        {/* YouTube 썸네일 */}
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
        <ExternalLink className="w-3 h-3 text-[#9B8DB8]/50 flex-shrink-0 mt-0.5 group-hover:text-[#FF6AC1] transition-colors" />
      </div>
    </a>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <Loader2 className="w-5 h-5 text-[#9B5DE5] animate-spin" />
      <p className="text-[10px] text-[#9B8DB8]">콘텐츠를 불러오는 중...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <AlertCircle className="w-5 h-5 text-red-400" />
      <p className="text-[10px] text-red-400">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <Newspaper className="w-5 h-5 text-[#9B8DB8]/40" />
      <p className="text-[10px] text-[#9B8DB8]">관련 콘텐츠가 없습니다</p>
    </div>
  );
}

function MobileContentSheet() {
  const {
    selectedKeyword,
    contentItems,
    newsArticles,
    isNewsLoading,
    newsError,
    setSelectedKeyword,
  } = useAppStore();

  if (!selectedKeyword) return null;

  const items: ContentItem[] =
    contentItems.length > 0
      ? contentItems
      : newsArticles.map((n) => ({ ...n, type: "news" as const }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="md:hidden fixed inset-0 z-[2000]"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setSelectedKeyword(null)}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) setSelectedKeyword(null);
        }}
        className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-[#120E1F] border-t border-[#3B2667] rounded-t-2xl overflow-hidden flex flex-col"
      >
        <div className="flex justify-center py-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#3B2667]" />
        </div>
        <ContentPanelInner
          keyword={selectedKeyword}
          items={items}
          isLoading={isNewsLoading}
          error={newsError}
          onClose={() => setSelectedKeyword(null)}
        />
      </motion.div>
    </motion.div>
  );
}
