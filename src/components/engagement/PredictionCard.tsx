"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { Sparkles, Check, X } from "lucide-react";
import { useMemo } from "react";

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PredictionCard() {
  const {
    data,
    showPrediction,
    setShowPrediction,
    lastPrediction,
    setPrediction,
  } = useAppStore();

  const today = getToday();

  // 오늘 이미 예측했으면 결과 표시 모드
  const alreadyPredicted = lastPrediction?.date === today;

  // 어제 예측 결과 판정
  const yesterdayPrediction = useMemo(() => {
    if (!lastPrediction || !data) return null;
    if (lastPrediction.date === today) return null; // 오늘 한 건 아직 결과 없음

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // 어제 예측만 판정 (그 이전 건은 만료)
    if (lastPrediction.date !== yesterdayStr) return null;

    const topKeyword = data.trendingInsights[0]?.keyword ?? "";
    const hit = topKeyword
      .toLowerCase()
      .includes(lastPrediction.artist.toLowerCase());

    return { artist: lastPrediction.artist, hit, topKeyword };
  }, [lastPrediction, data, today]);

  // 예측용 아티스트 후보 3명 (topArtists에서 랜덤 3개)
  const candidates = useMemo(() => {
    if (!data) return [];
    const artists = data.topArtists.slice(0, 6);
    // 셔플하여 3개 선택
    const shuffled = [...artists].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [data]);

  if (!showPrediction && !yesterdayPrediction) return null;

  // 어제 예측 결과 알림
  if (yesterdayPrediction) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="absolute inset-x-4 bottom-24 md:bottom-20 md:left-1/2 md:-translate-x-1/2 md:w-[360px] z-[2000]"
        >
          <div className="bg-[#1A1432]/95 backdrop-blur-xl border border-[#3B2667] rounded-2xl p-5 shadow-2xl">
            <button
              onClick={() => {
                // 결과를 본 후 클리어 — 날짜를 만료 처리
                useAppStore.setState({ lastPrediction: null });
              }}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[#3B2667]/50"
            >
              <X className="w-4 h-4 text-[#9B8DB8]" />
            </button>

            <div className="text-center">
              <div className="text-3xl mb-2">
                {yesterdayPrediction.hit ? "🎯" : "😅"}
              </div>
              <h3 className="text-lg font-bold text-[#E8E0F0] mb-1">
                {yesterdayPrediction.hit
                  ? "어제 예측 적중!"
                  : "아쉽네요!"}
              </h3>
              <p className="text-xs text-[#9B8DB8] mb-3">
                예측: <span className="text-[#FF6AC1] font-semibold">{yesterdayPrediction.artist}</span>
                {!yesterdayPrediction.hit && (
                  <> · 오늘 1위: <span className="text-orange-400 font-semibold">{yesterdayPrediction.topKeyword}</span></>
                )}
              </p>
              <button
                onClick={() => useAppStore.setState({ lastPrediction: null })}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#9B5DE5] to-[#FF6AC1] text-white text-xs font-bold"
              >
                확인
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // 오늘 이미 예측 완료
  if (alreadyPredicted) return null;

  // 예측 UI
  return (
    <AnimatePresence>
      {showPrediction && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="absolute inset-x-4 bottom-24 md:bottom-20 md:left-1/2 md:-translate-x-1/2 md:w-[360px] z-[2000]"
        >
          <div className="bg-[#1A1432]/95 backdrop-blur-xl border border-[#3B2667] rounded-2xl p-5 shadow-2xl">
            <button
              onClick={() => setShowPrediction(false)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[#3B2667]/50"
            >
              <X className="w-4 h-4 text-[#9B8DB8]" />
            </button>

            <div className="text-center mb-4">
              <Sparkles className="w-6 h-6 text-[#FF6AC1] mx-auto mb-2" />
              <h3 className="text-base font-bold text-[#E8E0F0]">
                내일 가장 뜰 아티스트는?
              </h3>
              <p className="text-[10px] text-[#9B8DB8] mt-1">
                하나를 선택하고 내일 결과를 확인하세요
              </p>
            </div>

            <div className="space-y-2">
              {candidates.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => setPrediction(artist.nameKo)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#120E1F] border border-[#3B2667]/50 hover:border-[#9B5DE5]/50 hover:bg-[#9B5DE5]/10 transition-all group"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: artist.color }}
                  >
                    {artist.nameKo.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-[#E8E0F0] group-hover:text-white">
                    {artist.nameKo}
                  </span>
                  <Check className="w-4 h-4 text-[#9B8DB8] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
