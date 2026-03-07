"use client";

import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { Badge } from "@/components/ui/badge";
import { X, Info } from "lucide-react";

const ENGLISH_WIKI_COUNTRIES = ["US", "GB", "AU", "CA", "SG", "NG", "ZA"];

const platformColors: Record<string, { bg: string; text: string; label: string }> = {
  trends: { bg: "bg-orange-500/20", text: "text-orange-400", label: "Trends" },
  youtube: { bg: "bg-red-500/20", text: "text-red-400", label: "YouTube" },
  wiki: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Wikipedia" },
};

export function MobileDetailSheet() {
  const { selectedCountry, setSelectedCountry, selectedKeyword, fetchNews, setSelectedKeyword } = useAppStore();
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {selectedCountry && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSelectedCountry(null)}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) setSelectedCountry(null);
            }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#120E1F] border-t border-[#3B2667] rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#3B2667]" />
            </div>

            {/* ===== 상단: 국가명 + 점수 (항상 보임) ===== */}
            <div className="px-4 pb-3 flex-shrink-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#E8E0F0] leading-tight">
                      {selectedCountry.nameKo}
                    </h2>
                    <p className="text-[10px] text-[#9B8DB8]">
                      {selectedCountry.name}
                    </p>
                  </div>
                  <div className="flex items-end gap-1.5">
                    <span className="text-3xl font-black bg-gradient-to-r from-[#9B5DE5] to-[#FF6AC1] bg-clip-text text-transparent">
                      {selectedCountry.score}
                    </span>
                    <span
                      className={`text-xs font-semibold pb-0.5 ${
                        selectedCountry.change > 0
                          ? "text-green-400"
                          : selectedCountry.change < 0
                            ? "text-red-400"
                            : "text-gray-400"
                      }`}
                    >
                      {selectedCountry.change > 0 ? "+" : ""}
                      {selectedCountry.change}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="p-1 rounded-lg"
                >
                  <X className="w-5 h-5 text-[#9B8DB8]" />
                </button>
              </div>

              {/* 플랫폼 점수 - 가로 3칸 */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Trends", score: selectedCountry.trendsScore, color: "#F97316" },
                  { label: "Wiki", score: selectedCountry.wikiScore, color: "#6366F1" },
                  { label: "YouTube", score: selectedCountry.youtubeScore, color: "#FF0000" },
                ].map((p) => (
                  <div key={p.label} className="bg-[#1A1432] rounded-lg p-1.5 text-center">
                    <div className="text-[9px] text-[#9B8DB8]">{p.label}</div>
                    <div className="text-base font-bold" style={{ color: p.color }}>
                      {p.score}
                    </div>
                  </div>
                ))}
              </div>

              {/* 영미권 Wikipedia 안내 */}
              {ENGLISH_WIKI_COUNTRIES.includes(selectedCountry.code) && (
                <div className="flex gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-2">
                  <Info className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[8px] text-amber-300/80 leading-relaxed">
                    Wikipedia 점수는 영어 Wikipedia 기준으로 영미권 국가가 동일한 점수를 공유합니다.
                  </p>
                </div>
              )}
            </div>

            {/* ===== 하단: 스크롤 영역 — 아티스트 목록 ===== */}
            <div className="overflow-y-auto flex-1 px-4 pb-6 border-t border-[#3B2667]/30 pt-3">
              <h3 className="text-xs font-semibold text-[#9B8DB8] mb-2">
                🎤 인기 아티스트 TOP {selectedCountry.topArtists.length}
                <span className="text-[9px] font-normal text-[#9B8DB8]/60 ml-1.5">탭하면 뉴스</span>
              </h3>
              <div className="space-y-2">
                {selectedCountry.topArtists.map((artist, i) => {
                  const platform = platformColors[artist.platform];
                  const isActive = selectedKeyword === artist.nameKo;
                  return (
                    <div
                      key={artist.id}
                      onClick={() => {
                        if (isActive) {
                          setSelectedKeyword(null);
                        } else {
                          fetchNews(artist.nameKo);
                        }
                      }}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[#9B5DE5]/20 border border-[#9B5DE5]/50 ring-1 ring-[#9B5DE5]/30"
                          : "bg-[#1A1432]/80 border border-[#3B2667]/30 active:border-[#9B5DE5]/40"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9B5DE5] to-[#FF6AC1] flex items-center justify-center text-white font-bold text-xs">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#E8E0F0] text-sm truncate">
                          {artist.nameKo}
                        </div>
                        <div className="text-[10px] text-[#9B8DB8]">{artist.name}</div>
                        {isActive && (
                          <div className="text-[9px] text-[#9B5DE5] mt-0.5">📰 뉴스 보기</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-lg font-bold text-[#E8E0F0]">
                          {artist.score}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`${platform.bg} ${platform.text} border-0 text-[9px] px-1.5 py-0`}
                        >
                          {platform.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[9px] text-[#9B8DB8]/50 text-center mt-4">
                데이터 기반 추정치 · Google Trends + Wikipedia + YouTube 종합
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
