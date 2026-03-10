import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JapanData, PrefectureScore, JapanArtist } from "@/types/japan-data";

interface ContentItem {
  type: "news" | "search" | "youtube" | "yahoo";
  title: string;
  url: string;
  timeAgo: string;
  thumbnail?: string;
  provider?: string;
}

interface JapanState {
  data: JapanData | null;
  selectedPrefecture: PrefectureScore | null;
  selectedArtist: string | null;
  isLoading: boolean;
  error: string | null;
  timelineHour: number; // 0~24

  // 콘텐츠
  selectedKeyword: string | null;
  contentItems: ContentItem[];
  isContentLoading: boolean;

  // 리텐션 (localStorage)
  favoriteArtists: string[];

  // 부스트 트래킹 (localStorage)
  boostHistory: Record<string, Record<string, number>>; // { "2026-03-11": { "bts": 3 } }

  // 액션
  setData: (data: JapanData) => void;
  setSelectedPrefecture: (pref: PrefectureScore | null) => void;
  setSelectedArtist: (artistId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTimelineHour: (hour: number | ((prev: number) => number)) => void;
  toggleFavoriteArtist: (artistId: string) => void;
  recordBoost: (artistId: string) => void;
  setSelectedKeyword: (keyword: string | null) => void;
  fetchContent: (keyword: string, keywordJa?: string) => Promise<void>;

  // 계산
  filteredPrefectures: () => PrefectureScore[];
}

export const useJapanStore = create<JapanState>()(
  persist(
    (set, get) => ({
      data: null,
      selectedPrefecture: null,
      selectedArtist: null,
      isLoading: true,
      error: null,
      timelineHour: 24,
      selectedKeyword: null,
      contentItems: [],
      isContentLoading: false,
      favoriteArtists: [],
      boostHistory: {},

      setData: (data) => set({ data, isLoading: false }),
      setSelectedPrefecture: (pref) => set({ selectedPrefecture: pref }),
      setSelectedArtist: (artistId) => set({ selectedArtist: artistId }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error, isLoading: false }),
      setTimelineHour: (hour) =>
        set((state) => ({
          timelineHour:
            typeof hour === "function" ? hour(state.timelineHour) : hour,
        })),
      toggleFavoriteArtist: (artistId) =>
        set((state) => ({
          favoriteArtists: state.favoriteArtists.includes(artistId)
            ? state.favoriteArtists.filter((id) => id !== artistId)
            : [...state.favoriteArtists, artistId],
        })),

      recordBoost: (artistId) =>
        set((state) => {
          const today = new Date().toISOString().split("T")[0];
          const todayHistory = { ...(state.boostHistory[today] ?? {}) };
          todayHistory[artistId] = (todayHistory[artistId] ?? 0) + 1;
          return {
            boostHistory: {
              ...state.boostHistory,
              [today]: todayHistory,
            },
          };
        }),

      setSelectedKeyword: (keyword) =>
        set({ selectedKeyword: keyword, contentItems: [] }),

      fetchContent: async (keyword, keywordJa) => {
        set({ isContentLoading: true, selectedKeyword: keyword });
        try {
          const params = new URLSearchParams({ keyword });
          if (keywordJa) params.set("keywordJa", keywordJa);
          const res = await fetch(`/api/japan-content?${params}`);
          if (!res.ok) throw new Error("콘텐츠를 불러올 수 없습니다");
          const result = await res.json();
          set({ contentItems: result.contents ?? [], isContentLoading: false });
        } catch {
          set({ contentItems: [], isContentLoading: false });
        }
      },

      filteredPrefectures: () => {
        const { data, selectedArtist } = get();
        if (!data) return [];
        if (!selectedArtist) return data.prefectures;

        return data.prefectures
          .map((pref) => {
            const artist = pref.topArtists.find(
              (a) => a.id === selectedArtist
            );
            if (!artist) return { ...pref, trendsScore: 0 };
            return { ...pref, trendsScore: artist.score };
          })
          .filter((p) => p.trendsScore > 0);
      },
    }),
    {
      name: "kpop-japan-storage",
      partialize: (state) => ({
        favoriteArtists: state.favoriteArtists,
        boostHistory: state.boostHistory,
      }),
    }
  )
);
