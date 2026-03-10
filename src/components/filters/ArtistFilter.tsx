"use client";

import { useAppStore } from "@/store/useAppStore";
import { Star } from "lucide-react";

export function ArtistFilter() {
  const { data, selectedArtist, setSelectedArtist, favoriteArtists, toggleFavoriteArtist } = useAppStore();

  if (!data) return null;

  // 즐겨찾기 아티스트를 앞으로 정렬
  const sortedArtists = [...data.topArtists].sort((a, b) => {
    const aFav = favoriteArtists.includes(a.id) ? -1 : 0;
    const bFav = favoriteArtists.includes(b.id) ? -1 : 0;
    return aFav - bFav;
  });

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
      <button
        onClick={() => setSelectedArtist(null)}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          !selectedArtist
            ? "bg-gradient-to-r from-[#9B5DE5] to-[#FF6AC1] text-white shadow-lg shadow-[#9B5DE5]/25"
            : "bg-[#1A1432] text-[#9B8DB8] hover:bg-[#3B2667]/50 border border-[#3B2667]/50"
        }`}
      >
        전체
      </button>
      {sortedArtists.map((artist) => {
        const isFav = favoriteArtists.includes(artist.id);
        const isSelected = selectedArtist === artist.id;
        return (
          <div
            key={artist.id}
            className={`flex-shrink-0 flex items-center rounded-full text-xs font-medium transition-all ${
              isSelected
                ? "text-white shadow-lg"
                : isFav
                  ? "bg-[#1A1432] text-[#E8E0F0] border-2 border-amber-500/40"
                  : "bg-[#1A1432] text-[#9B8DB8] hover:bg-[#3B2667]/50 border border-[#3B2667]/50"
            }`}
            style={
              isSelected
                ? { backgroundColor: artist.color, boxShadow: `0 4px 14px ${artist.color}40` }
                : undefined
            }
          >
            {/* ★ 영역: 즐겨찾기 토글 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteArtist(artist.id);
              }}
              className="pl-2.5 pr-0.5 py-1.5 rounded-l-full"
              aria-label={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            >
              <Star
                className={`w-3 h-3 transition-colors ${
                  isFav
                    ? "text-amber-400 fill-amber-400"
                    : "text-[#6B5B8D]"
                }`}
              />
            </button>
            {/* 텍스트 영역: 아티스트 선택/해제 */}
            <button
              onClick={() => setSelectedArtist(isSelected ? null : artist.id)}
              className="pr-3 pl-1 py-1.5 rounded-r-full"
            >
              {artist.nameKo}
            </button>
          </div>
        );
      })}
    </div>
  );
}
