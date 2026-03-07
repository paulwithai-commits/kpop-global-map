import { create } from "zustand";
import type { CountryScore, GlobalData, NewsArticle, ContentItem } from "@/types/data";

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

  setData: (data: GlobalData) => void;
  setSelectedCountry: (country: CountryScore | null) => void;
  setSelectedArtist: (artistId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTimelineHour: (hour: number | ((prev: number) => number)) => void;

  // 콘텐츠 액션
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

  // 콘텐츠 상태 초기값
  selectedKeyword: null,
  newsArticles: [],
  contentItems: [],
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
