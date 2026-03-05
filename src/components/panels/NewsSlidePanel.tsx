"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { X, ExternalLink, Newspaper, Loader2, AlertCircle } from "lucide-react";

export function NewsSlidePanel() {
  const {
    selectedKeyword,
    newsArticles,
    isNewsLoading,
    newsError,
    setSelectedKeyword,
  } = useAppStore();

  const isOpen = selectedKeyword !== null;

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
            className="hidden md:flex flex-col absolute top-32 right-[340px] z-[1000] w-[340px] max-h-[500px] bg-[#120E1F]/95 backdrop-blur-md border border-[#3B2667] rounded-xl shadow-2xl overflow-hidden"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3B2667]/50 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Newspaper className="w-4 h-4 text-[#FF6AC1] flex-shrink-0" />
                <span className="text-xs font-bold text-[#E8E0F0] truncate">
                  &ldquo;{cleanKeywordLabel(selectedKeyword!)}&rdquo; 관련 뉴스
                </span>
              </div>
              <button
                onClick={() => setSelectedKeyword(null)}
                className="p-1 rounded-lg hover:bg-[#3B2667]/50 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-[#9B8DB8]" />
              </button>
            </div>

            {/* 콘텐츠 */}
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {isNewsLoading && <LoadingSkeleton />}
              {newsError && <ErrorState message={newsError} />}
              {!isNewsLoading &&
                !newsError &&
                newsArticles.map((article) => (
                  <ArticleCard key={article.url} article={article} />
                ))}
              {!isNewsLoading &&
                !newsError &&
                newsArticles.length === 0 && <EmptyState />}
            </div>

            {/* 푸터 */}
            <div className="px-4 py-2 border-t border-[#3B2667]/30 flex-shrink-0">
              <p className="text-[9px] text-[#9B8DB8]/60 text-center">
                출처: 다음 엔터테인먼트
              </p>
            </div>
          </motion.div>

          {/* 모바일: 바텀시트 */}
          <MobileNewsSheet />
        </>
      )}
    </AnimatePresence>
  );
}

/** 키워드에서 괄호 부분 제거 (예: "블랙핑크 (Wiki #1)" → "블랙핑크") */
function cleanKeywordLabel(keyword: string): string {
  return keyword.replace(/\s*\(.*?\)\s*/g, "").trim();
}

function ArticleCard({ article }: { article: { title: string; url: string; timeAgo: string } }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg bg-[#1A1432]/80 border border-[#3B2667]/30 hover:border-[#9B5DE5]/50 transition-all group"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] font-semibold text-[#E8E0F0] leading-relaxed line-clamp-2 group-hover:text-[#FF6AC1] transition-colors">
            {article.title}
          </h4>
          <span className="text-[9px] text-[#9B8DB8] mt-1.5 block">
            {article.timeAgo}
          </span>
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
      <p className="text-[10px] text-[#9B8DB8]">뉴스를 불러오는 중...</p>
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
      <p className="text-[10px] text-[#9B8DB8]">관련 뉴스가 없습니다</p>
    </div>
  );
}

function MobileNewsSheet() {
  const {
    selectedKeyword,
    newsArticles,
    isNewsLoading,
    newsError,
    setSelectedKeyword,
  } = useAppStore();

  if (!selectedKeyword) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="md:hidden fixed inset-0 z-[2000]"
    >
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setSelectedKeyword(null)}
      />

      {/* 바텀시트 */}
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
        className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-[#120E1F] border-t border-[#3B2667] rounded-t-2xl overflow-hidden flex flex-col"
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center py-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#3B2667]" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#3B2667]/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[#FF6AC1]" />
            <span className="text-sm font-bold text-[#E8E0F0]">
              &ldquo;{cleanKeywordLabel(selectedKeyword)}&rdquo; 관련 뉴스
            </span>
          </div>
          <button
            onClick={() => setSelectedKeyword(null)}
            className="p-1 rounded-lg hover:bg-[#3B2667]/50"
          >
            <X className="w-4 h-4 text-[#9B8DB8]" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {isNewsLoading && <LoadingSkeleton />}
          {newsError && <ErrorState message={newsError} />}
          {!isNewsLoading &&
            !newsError &&
            newsArticles.map((article) => (
              <ArticleCard key={article.url} article={article} />
            ))}
          {!isNewsLoading &&
            !newsError &&
            newsArticles.length === 0 && <EmptyState />}
        </div>
      </motion.div>
    </motion.div>
  );
}
