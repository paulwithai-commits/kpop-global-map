import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CountryScore, GlobalData, NewsArticle, ContentItem } from "@/types/data";

// 리텐션 관련 타입
interface PredictionData {
  artist: string;
  date: string; // YYYY-MM-DD
}

interface VisitStreak {
  count: number;
  lastDate: string; // YYYY-MM-DD
}

interface AppState {
  data: GlobalData | null;
  selectedCountry: CountryScore | null;
  selectedArtist: string | null; // artist id
  isLoading: boolean;
  error: string | null;
  timelineHour: number; // 0~24 타임라인 슬라이더 값

  // 콘텐츠 관련 상태
  selectedKeyword: string | null;
  newsArticles: NewsArticle[];
  contentItems: ContentItem[];
  isNewsLoading: boolean;
  newsError: string | null;

  // 리텐션 상태 (localStorage 영속)
  favoriteArtists: string[];
  lastPrediction: PredictionData | null;
  visitStreak: VisitStreak;
  lastVisitState: { country?: string; artist?: string };
  showPrediction: boolean; // 예측 카드 표시 여부

  setData: (data: GlobalData) => void;
  setSelectedCountry: (country: CountryScore | null) => void;
  setSelectedArtist: (artistId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTimelineHour: (hour: number | ((prev: number) => number)) => void;

  // 콘텐츠 액션
  setSelectedKeyword: (keyword: string | null) => void;
  fetchNews: (keyword: string) => Promise<void>;

  // 리텐션 액션
  toggleFavoriteArtist: (artistId: string) => void;
  setPrediction: (artist: string) => void;
  setShowPrediction: (show: boolean) => void;
  updateVisitStreak: () => void;

  // 필터링된 국가 데이터
  filteredCountries: () => CountryScore[];
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useAppStore = create<AppState>()(persist((set, get) => ({
  data: null,
  selectedCountry: null,
  selectedArtist: null,
  isLoading: true,
  error: null,
  timelineHour: 24,

  // 콘텐츠 상태 초기값
  selectedKeyword: null,
  newsArticles: [],
  contentItems: [],
  isNewsLoading: false,
  newsError: null,

  // 리텐션 상태 초기값
  favoriteArtists: [],
  lastPrediction: null,
  visitStreak: { count: 0, lastDate: "" },
  lastVisitState: {},
  showPrediction: false,

  setData: (data) => set({ data, isLoading: false }),
  setSelectedCountry: (country) => set({ selectedCountry: country }),
  setSelectedArtist: (artistId) => set({ selectedArtist: artistId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setTimelineHour: (hour) =>
    set((state) => ({
      timelineHour: typeof hour === "function" ? hour(state.timelineHour) : hour,
    })),

  // 콘텐츠 액션
  setSelectedKeyword: (keyword) =>
    set({ selectedKeyword: keyword, newsArticles: [], contentItems: [], newsError: null }),
  fetchNews: async (keyword) => {
    const { data } = get();

    // 1) 사전 콘텐츠 데이터 확인 (contentData 우선)
    const preloadedContent = data?.contentData?.[keyword];
    if (preloadedContent && preloadedContent.length > 0) {
      set({
        selectedKeyword: keyword,
        contentItems: preloadedContent,
        newsArticles: preloadedContent.filter((c) => c.type === "news"),
        isNewsLoading: false,
        newsError: null,
      });
      return;
    }

    // 2) 레거시 뉴스 데이터 확인
    const preloadedNews = data?.newsData?.[keyword];
    if (preloadedNews && preloadedNews.length > 0) {
      const asContent = preloadedNews.map((n) => ({
        ...n,
        type: "news" as const,
        provider: "다음 뉴스",
      }));
      set({
        selectedKeyword: keyword,
        newsArticles: preloadedNews,
        contentItems: asContent,
        isNewsLoading: false,
        newsError: null,
      });
      // 백그라운드에서 추가 콘텐츠 로딩
      fetchAdditionalContent(keyword, asContent);
      return;
    }

    // 3) API 호출
    set({ isNewsLoading: true, newsError: null, selectedKeyword: keyword });
    try {
      const res = await fetch(
        `/api/content?keyword=${encodeURIComponent(keyword)}`
      );
      if (!res.ok) throw new Error("콘텐츠를 불러올 수 없습니다");
      const result = await res.json();
      set({
        contentItems: result.contents ?? [],
        newsArticles: (result.contents ?? []).filter((c: { type: string }) => c.type === "news"),
        isNewsLoading: false,
      });
    } catch (err) {
      set({
        newsError: err instanceof Error ? err.message : "오류 발생",
        isNewsLoading: false,
      });
    }
  },

  // 리텐션 액션
  toggleFavoriteArtist: (artistId) =>
    set((state) => ({
      favoriteArtists: state.favoriteArtists.includes(artistId)
        ? state.favoriteArtists.filter((id) => id !== artistId)
        : [...state.favoriteArtists, artistId],
    })),

  setPrediction: (artist) =>
    set({
      lastPrediction: { artist, date: getToday() },
      showPrediction: false,
    }),

  setShowPrediction: (show) => set({ showPrediction: show }),

  updateVisitStreak: () =>
    set((state) => {
      const today = getToday();
      const { lastDate, count } = state.visitStreak;

      if (lastDate === today) return {}; // 이미 오늘 방문

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      if (lastDate === yesterdayStr) {
        // 연속 방문
        return { visitStreak: { count: count + 1, lastDate: today } };
      }
      // 스트릭 리셋
      return { visitStreak: { count: 1, lastDate: today } };
    }),

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
}), {
  name: "kpop-pulse-storage",
  partialize: (state) => ({
    favoriteArtists: state.favoriteArtists,
    lastPrediction: state.lastPrediction,
    visitStreak: state.visitStreak,
    lastVisitState: state.lastVisitState,
  }),
}));

/** 백그라운드에서 추가 콘텐츠(YouTube, 통합검색) 로딩 */
async function fetchAdditionalContent(keyword: string, existing: import("@/types/data").ContentItem[]) {
  try {
    const res = await fetch(`/api/content?keyword=${encodeURIComponent(keyword)}`);
    if (!res.ok) return;
    const result = await res.json();
    const additional = (result.contents ?? []) as import("@/types/data").ContentItem[];
    // 기존 뉴스 + 새로운 검색/YouTube 합치기 (중복 URL 제거)
    const existingUrls = new Set(existing.map((e) => e.url));
    const merged = [...existing, ...additional.filter((a) => !existingUrls.has(a.url))];
    const currentKeyword = useAppStore.getState().selectedKeyword;
    if (currentKeyword === keyword) {
      useAppStore.setState({ contentItems: merged });
    }
  } catch {
    // 조용히 실패
  }
}
