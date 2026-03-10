"use client";

import { useAppStore } from "@/store/useAppStore";
import { Star } from "lucide-react";
import { useRef, useCallback } from "react";

export function ArtistFilter() {
  const { data, selectedArtist, setSelectedArtist, favoriteArtists, toggleFavoriteArtist } = useAppStore();
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  // 더블탭 감지: 300ms 이내 같은 아티스트 탭 → 즐겨찾기 토글
  const handleTap = useCallback((artistId: string) => {
    const now = Date.now();
    const last = lastTapRef.current;

    if (last && last.id === artistId && now - last.time < 300) {
      // 더블탭 → 즐겨찾기 토글
      toggleFavoriteArtist(artistId);
      lastTapRef.current = null;
      return;
    }

    // 싱글탭 → 선택/해제
    lastTapRef.current = { id: artistId, time: now };
    setTimeout(() => {
      // 300ms 후에도 더블탭이 안 왔으면 싱글탭 처리
      if (lastTapRef.current?.id === artistId && lastTapRef.current?.time === now) {
        setSelectedArtist(selectedArtist === artistId ? null : artistId);
        lastTapRef.current = null;
      }
    }, 300);
  }, [selectedArtist, setSelectedArtist, toggleFavoriteArtist]);

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
          <button
            key={artist.id}
            onClick={() => handleTap(artist.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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
            <Star
              className={`w-3 h-3 transition-colors ${
                isFav
                  ? "text-amber-400 fill-amber-400"
                  : "text-[#6B5B8D]"
              }`}
            />
            {artist.nameKo}
          </button>
        );
      })}
    </div>
  );
}
