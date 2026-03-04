"use client";

import { useAppStore } from "@/store/useAppStore";

export function ArtistFilter() {
  const { data, selectedArtist, setSelectedArtist } = useAppStore();

  if (!data) return null;

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
      {data.topArtists.map((artist) => (
        <button
          key={artist.id}
          onClick={() =>
            setSelectedArtist(
              selectedArtist === artist.id ? null : artist.id
            )
          }
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            selectedArtist === artist.id
              ? "text-white shadow-lg"
              : "bg-[#1A1432] text-[#9B8DB8] hover:bg-[#3B2667]/50 border border-[#3B2667]/50"
          }`}
          style={
            selectedArtist === artist.id
              ? { backgroundColor: artist.color, boxShadow: `0 4px 14px ${artist.color}40` }
              : undefined
          }
        >
          {artist.nameKo}
        </button>
      ))}
    </div>
  );
}
