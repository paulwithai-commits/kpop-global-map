import { create } from "zustand";
import type { CountryScore, GlobalData } from "@/types/data";

interface AppState {
  data: GlobalData | null;
  selectedCountry: CountryScore | null;
  selectedArtist: string | null; // artist id
  isLoading: boolean;
  error: string | null;
  timelineHour: number; // 0~24 타임라인 슬라이더 값

  setData: (data: GlobalData) => void;
  setSelectedCountry: (country: CountryScore | null) => void;
  setSelectedArtist: (artistId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTimelineHour: (hour: number | ((prev: number) => number)) => void;

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

  setData: (data) => set({ data, isLoading: false }),
  setSelectedCountry: (country) => set({ selectedCountry: country }),
  setSelectedArtist: (artistId) => set({ selectedArtist: artistId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setTimelineHour: (hour) =>
    set((state) => ({
      timelineHour: typeof hour === "function" ? hour(state.timelineHour) : hour,
    })),

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
