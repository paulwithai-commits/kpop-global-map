import { create } from "zustand";
import type { CountryScore, GlobalData, NewsArticle } from "@/types/data";

interface AppState {
  data: GlobalData | null;
  selectedCountry: CountryScore | null;
  selectedArtist: string | null; // artist id
  isLoading: boolean;
  error: string | null;
  timelineHour: number; // 0~24 타임라인 슬라이더 값

  // 뉴스 관련 상태
  selectedKeyword: string | null;
  newsArticles: NewsArticle[];
  isNewsLoading: boolean;
  newsError: string | null;

  setData: (data: GlobalData) => void;
  setSelectedCountry: (country: CountryScore | null) => void;
  setSelectedArtist: (artistId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTimelineHour: (hour: number | ((prev: number) => number)) => void;

  // 뉴스 액션
  setSelectedKeyword: (keyword: string | null) => void;
  fetchNews: (keyword: string) => Promise<void>;

  // 필터링된 국가 데이터
  filteredCountries: () => CountryScore[];
}

export const useAppStore = create<AppState>((set, get) => ({
  data: null,
  selectedCountry: null,
  selectedArtist: null,
  isLoading: true,
  error: null,
  timelineHour: 24,

  // 뉴스 상태 초기값
  selectedKeyword: null,
  newsArticles: [],
  isNewsLoading: false,
  newsError: null,

  setData: (data) => set({ data, isLoading: false }),
  setSelectedCountry: (country) => set({ selectedCountry: country }),
  setSelectedArtist: (artistId) => set({ selectedArtist: artistId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setTimelineHour: (hour) =>
    set((state) => ({
      timelineHour: typeof hour === "function" ? hour(state.timelineHour) : hour,
    })),

  // 뉴스 액션
  setSelectedKeyword: (keyword) =>
    set({ selectedKeyword: keyword, newsArticles: [], newsError: null }),
  fetchNews: async (keyword) => {
    const { data } = get();
    // 사전 데이터가 있으면 즉시 사용 (로딩 없음)
    const preloaded = data?.newsData?.[keyword];
    if (preloaded && preloaded.length > 0) {
      set({ selectedKeyword: keyword, newsArticles: preloaded, isNewsLoading: false, newsError: null });
      return;
    }
    // 사전 데이터 없으면 API 호출 (fallback)
    set({ isNewsLoading: true, newsError: null, selectedKeyword: keyword });
    try {
      const res = await fetch(
        `/api/news?keyword=${encodeURIComponent(keyword)}`
      );
      if (!res.ok) throw new Error("뉴스를 불러올 수 없습니다");
      const result = await res.json();
      set({ newsArticles: result.articles, isNewsLoading: false });
    } catch (err) {
      set({
        newsError: err instanceof Error ? err.message : "오류 발생",
        isNewsLoading: false,
      });
    }
  },

  filteredCountries: () => {
    const { data, selectedArtist } = get();
    if (!data) return [];
    if (!selectedArtist) return data.countries;

    return data.countries
      .map((country) => {
        const artistInCountry = country.topArtists.find(
          (a) => a.id === selectedArtist
        );
        if (!artistInCountry) return { ...country, score: 0 };
        return { ...country, score: artistInCountry.score };
      })
      .filter((c) => c.score > 0);
  },
}));
