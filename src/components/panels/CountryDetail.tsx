"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Info } from "lucide-react";

// 영어 Wikipedia를 공유하는 영미권 국가 코드
const ENGLISH_WIKI_COUNTRIES = ["US", "GB", "AU", "CA", "SG", "NG", "ZA"];

const platformColors: Record<string, { bg: string; text: string; label: string }> = {
  trends: { bg: "bg-orange-500/20", text: "text-orange-400", label: "Trends" },
  youtube: { bg: "bg-red-500/20", text: "text-red-400", label: "YouTube" },
  wiki: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Wikipedia" },
};

export function CountryDetail() {
  const { selectedCountry, setSelectedCountry, selectedKeyword, fetchNews, setSelectedKeyword } = useAppStore();

  return (
    <AnimatePresence>
      {selectedCountry && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          className="w-[360px] h-full bg-[#120E1F]/95 backdrop-blur-md border-l border-[#3B2667] overflow-y-auto"
        >
          {/* 헤더 */}
          <div className="p-5 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#E8E0F0]">
                  {selectedCountry.nameKo}
                </h2>
                <p className="text-sm text-[#9B8DB8] mt-0.5">
                  {selectedCountry.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                className="p-1.5 rounded-lg hover:bg-[#3B2667]/50 transition-colors"
              >
                <X className="w-5 h-5 text-[#9B8DB8]" />
              </button>
            </div>

            {/* 총점 */}
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-black bg-gradient-to-r from-[#9B5DE5] to-[#FF6AC1] bg-clip-text text-transparent">
                {selectedCountry.score}
              </span>
              <div className="pb-1.5">
                <span
                  className={`text-sm font-semibold ${
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
                <span className="text-xs text-[#9B8DB8] ml-1">vs 전일</span>
              </div>
            </div>
          </div>

          <Separator className="bg-[#3B2667]/50" />

          {/* 플랫폼별 점수 */}
          <div className="p-5">
            <h3 className="text-sm font-semibold text-[#9B8DB8] mb-3">
              플랫폼별 점수
            </h3>
            <div className="space-y-3">
              <ScoreBar
                label="G.Trends"
                score={selectedCountry.trendsScore}
                color="#F97316"
                desc="국가별 K-pop 키워드 검색 관심도"
              />
              <ScoreBar
                label="Wikipedia"
                score={selectedCountry.wikiScore}
                color="#6366F1"
                desc="아티스트 문서 일일 조회수 기반"
              />
              <ScoreBar
                label="YouTube"
                score={selectedCountry.youtubeScore}
                color="#FF0000"
                desc="인기 음악 영상 중 K-pop 비율"
              />
            </div>

            {/* 영미권 Wikipedia 데이터 공유 안내 */}
            {ENGLISH_WIKI_COUNTRIES.includes(selectedCountry.code) && (
              <div className="mt-3 flex gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-300/80 leading-relaxed">
                  Wikipedia 점수는 영어 Wikipedia 기준으로 영미권 국가(미국, 영국, 호주, 캐나다 등)가 동일한 점수를 공유합니다.
                </p>
              </div>
            )}
          </div>

          <Separator className="bg-[#3B2667]/50" />

          {/* TOP 아티스트 */}
          <div className="p-5">
            <h3 className="text-sm font-semibold text-[#9B8DB8] mb-3">
              인기 아티스트 TOP {selectedCountry.topArtists.length}
            </h3>
            <div className="space-y-3">
              {selectedCountry.topArtists.map((artist, index) => {
                const platform = platformColors[artist.platform];
                return (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      if (selectedKeyword === artist.nameKo) {
                        setSelectedKeyword(null);
                      } else {
                        fetchNews(artist.nameKo);
                      }
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      selectedKeyword === artist.nameKo
                        ? "bg-[#9B5DE5]/20 border border-[#9B5DE5]/50 ring-1 ring-[#9B5DE5]/30"
                        : "bg-[#1A1432]/80 border border-[#3B2667]/30 hover:border-[#9B5DE5]/40"
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#9B5DE5] to-[#FF6AC1] flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#E8E0F0] truncate">
                        {artist.nameKo}
                      </div>
                      <div className="text-xs text-[#9B8DB8]">
                        {artist.name}
                      </div>
                      {selectedKeyword === artist.nameKo && (
                        <div className="text-[9px] text-[#9B5DE5] mt-0.5">📰 뉴스 보는 중</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-lg font-bold text-[#E8E0F0]">
                        {artist.score}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`${platform.bg} ${platform.text} border-0 text-[10px] px-1.5 py-0`}
                      >
                        {platform.label}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 데이터 안내 */}
          <div className="p-5 pt-2">
            <p className="text-[10px] text-[#9B8DB8]/60 text-center">
              데이터 기반 추정치입니다. Google Trends + Wikipedia + YouTube 종합.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScoreBar({
  label,
  score,
  color,
  desc,
}: {
  label: string;
  score: number;
  color: string;
  desc?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#9B8DB8] w-16">{label}</span>
        <div className="flex-1 h-2 rounded-full bg-[#1A1432] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
        <span className="text-sm font-semibold text-[#E8E0F0] w-8 text-right">
          {score}
        </span>
      </div>
      {desc && (
        <p className="text-[9px] text-[#9B8DB8]/60 ml-[76px] mt-0.5">{desc}</p>
      )}
    </div>
  );
}
