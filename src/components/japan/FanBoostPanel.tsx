"use client";

import { useMemo } from "react";
import {
  ExternalLink,
  Search,
  BookOpen,
  Play,
  TrendingUp,
  Flame,
  Target,
  Star,
} from "lucide-react";
import { useJapanStore } from "@/store/useJapanStore";

const DAILY_GOAL = 5;

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

interface FanBoostPanelProps {
  compact?: boolean; // 모바일용 컴팩트 모드
}

export function FanBoostPanel({ compact = false }: FanBoostPanelProps) {
  const {
    selectedPrefecture,
    selectedArtist,
    favoriteArtists,
    data,
    boostHistory,
    recordBoost,
  } = useJapanStore();

  // 부스트 대상 아티스트 결정: 선택 > 즐겨찾기 1순위 > 지역 1위
  const targetArtistId = useMemo(() => {
    if (selectedArtist) return selectedArtist;
    if (favoriteArtists.length > 0) return favoriteArtists[0];
    if (selectedPrefecture?.topArtists[0]) return selectedPrefecture.topArtists[0].id;
    return null;
  }, [selectedArtist, favoriteArtists, selectedPrefecture]);

  const targetArtist = useMemo(() => {
    if (!targetArtistId || !data) return null;
    return data.topArtists.find((a) => a.id === targetArtistId) ?? null;
  }, [targetArtistId, data]);

  const isFavorite = targetArtistId ? favoriteArtists.includes(targetArtistId) : false;

  if (!selectedPrefecture || !targetArtist) return null;

  const today = getToday();
  const todayHistory = boostHistory[today] ?? {};
  const todayCount = todayHistory[targetArtist.id] ?? 0;
  const progress = Math.min(todayCount / DAILY_GOAL, 1);

  const prefNameJa = selectedPrefecture.nameJa;
  const artistNameJa = targetArtist.nameJa;

  const boostActions = [
    {
      id: "yahoo",
      label: "Yahoo Japan",
      icon: Search,
      color: "#FF0033",
      url: `https://search.yahoo.co.jp/search?p=${encodeURIComponent(artistNameJa + " " + prefNameJa)}`,
      desc: "Yahoo 검색량 반영",
    },
    {
      id: "google",
      label: "Google 검색",
      icon: Search,
      color: "#4285F4",
      url: `https://www.google.co.jp/search?q=${encodeURIComponent(artistNameJa + " " + prefNameJa + " Kpop")}`,
      desc: "Google Trends 점수 상승",
    },
    {
      id: "youtube",
      label: "YouTube",
      icon: Play,
      color: "#FF0000",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(artistNameJa + " " + prefNameJa)}`,
      desc: "YouTube 인기 검색어 반영",
    },
    {
      id: "wikipedia",
      label: "Wikipedia",
      icon: BookOpen,
      color: "#636466",
      url: `https://ja.wikipedia.org/w/index.php?search=${encodeURIComponent(artistNameJa)}`,
      desc: "Wikipedia 조회수 증가",
    },
  ];

  const handleBoost = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    recordBoost(targetArtist.id);
  };

  // 컴팩트 모드 (모바일)
  if (compact) {
    return (
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-3.5 h-3.5 text-[#FF6AC1]" />
          <span className="text-xs font-bold text-[#E8E0F0]">
            {targetArtist.nameKo} 순위 올리기
          </span>
          <span className="text-[10px] text-[#FF6AC1] font-bold ml-auto">
            {todayCount}/{DAILY_GOAL}
          </span>
        </div>
        {/* 프로그레스 바 */}
        <div className="h-1 bg-[#1A1432] rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-[#9B5DE5] to-[#FF6AC1] rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {/* 가로 스크롤 버튼 */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {boostActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleBoost(action.url)}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A1432] border border-[#3B2667]/30 hover:border-[#9B5DE5]/50 transition-colors"
            >
              <action.icon className="w-3 h-3" style={{ color: action.color }} />
              <span className="text-[10px] text-[#E8E0F0] whitespace-nowrap">
                {action.label}
              </span>
              <ExternalLink className="w-2.5 h-2.5 text-[#9B8DB8]" />
            </button>
          ))}
        </div>
        <div className="mt-1.5 text-[8px] text-[#9B8DB8] flex items-center gap-1">
          <TrendingUp className="w-2.5 h-2.5 text-[#9B5DE5]" />
          실제 검색 플랫폼 검색량에 반영됩니다
        </div>
      </div>
    );
  }

  // 데스크톱 모드
  return (
    <div className="p-4 border-b border-[#3B2667]/50">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#FF6AC1] to-[#9B5DE5] flex items-center justify-center">
          <Target className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-bold text-[#E8E0F0]">순위 올리기 미션</h3>
          <p className="text-[10px] text-[#9B8DB8]">
            {prefNameJa}에서{" "}
            <span className="text-[#FF6AC1] font-medium">
              {targetArtist.nameKo}
            </span>{" "}
            밀어올리기
          </p>
        </div>
        {!isFavorite && (
          <div className="flex items-center gap-1 text-[9px] text-[#9B8DB8]">
            <Star className="w-3 h-3" />
            즐겨찾기 추가
          </div>
        )}
      </div>

      {/* 프로그레스 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#9B8DB8]">오늘의 부스트</span>
          <span className="text-[10px] font-bold text-[#FF6AC1]">
            {todayCount}/{DAILY_GOAL}
          </span>
        </div>
        <div className="h-1.5 bg-[#1A1432] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#9B5DE5] to-[#FF6AC1] rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {todayCount >= DAILY_GOAL && (
          <div className="text-[10px] text-[#FFD93D] mt-1 flex items-center gap-1">
            <Flame className="w-3 h-3" />
            미션 완료! 내일도 도전하세요
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-1.5">
        {boostActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleBoost(action.url)}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-[#1A1432] border border-[#3B2667]/30 hover:border-[#9B5DE5]/50 hover:bg-[#1A1432]/80 transition-all group text-left"
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: action.color + "20" }}
            >
              <action.icon
                className="w-3.5 h-3.5"
                style={{ color: action.color }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#E8E0F0] group-hover:text-white">
                {action.label}
              </div>
              <div className="text-[9px] text-[#9B8DB8]">{action.desc}</div>
            </div>
            <ExternalLink className="w-3 h-3 text-[#9B8DB8] group-hover:text-[#FF6AC1] flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* 실제 반영 안내 */}
      <div className="mt-2.5 px-2 py-1.5 rounded-md bg-[#9B5DE5]/10 border border-[#9B5DE5]/20">
        <p className="text-[9px] text-[#9B8DB8] leading-relaxed">
          <TrendingUp className="w-3 h-3 inline mr-1 text-[#9B5DE5]" />
          실제 검색 플랫폼에서 검색이 이루어져{" "}
          <span className="text-[#FF6AC1] font-medium">
            Google Trends 점수에 반영
          </span>
          됩니다
        </p>
      </div>
    </div>
  );
}
