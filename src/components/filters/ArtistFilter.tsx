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
          <div key={artist.id} className="flex-shrink-0 flex items-center relative">
            <button
              onClick={() =>
                setSelectedArtist(isSelected ? null : artist.id)
              }
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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
              {isFav && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
              {artist.nameKo}
            </button>
            {/* 즐겨찾기 토글: 길게 누르기 대신 더블클릭 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteArtist(artist.id);
              }}
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                isFav
                  ? "bg-amber-500 shadow-lg shadow-amber-500/30"
                  : "bg-[#3B2667]/80 opacity-0 group-hover:opacity-100 hover:!opacity-100"
              }`}
              style={{ opacity: isFav ? 1 : undefined }}
              title={isFav ? "즐겨찾기 해제" : "즐겨찾기"}
            >
              <Star className={`w-2.5 h-2.5 ${isFav ? "text-white fill-white" : "text-[#9B8DB8]"}`} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
