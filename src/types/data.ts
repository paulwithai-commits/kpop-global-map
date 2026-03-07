export interface CountryScore {
  code: string; // ISO 3166-1 alpha-2 (e.g., "US", "JP")
  name: string;
  nameKo: string;
  score: number; // 0-100
  trendsScore: number;
  wikiScore: number;
  youtubeScore: number;
  change: number; // 전일 대비 변화
  topArtists: ArtistInCountry[];
  lat: number;
  lng: number;
}

export interface ArtistInCountry {
  id: string;
  name: string;
  nameKo: string;
  score: number;
  imageUrl: string;
  platform: "trends" | "youtube" | "wiki";
}

export interface Artist {
  id: string;
  name: string;
  nameKo: string;
  imageUrl: string;
  color: string; // 대표 컬러
}

export interface TrendingInsight {
  keyword: string;
  score: number;
  source: "google_trends" | "wikipedia";
  topCountries: string[];
}

export interface NewsArticle {
  title: string;
  url: string;
  timeAgo: string;
}

/** 콘텐츠 아이템 — 뉴스, 통합검색, YouTube Shorts 통합 */
export interface ContentItem {
  type: "news" | "search" | "youtube";
  title: string;
  url: string;
  timeAgo: string;
  thumbnail?: string; // YouTube Shorts 썸네일
  provider?: string;  // 출처 (언론사, 채널명 등)
}

export interface GlobalData {
  date: string; // YYYY-MM-DD
  updatedAt: string; // ISO 8601
  totalCountries: number;
  countries: CountryScore[];
  topArtists: Artist[];
  trendingInsights: TrendingInsight[];
  newsData?: Record<string, NewsArticle[]>; // 레거시 호환
  contentData?: Record<string, ContentItem[]>; // 키워드별 통합 콘텐츠
}
