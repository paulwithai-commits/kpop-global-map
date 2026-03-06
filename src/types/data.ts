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
  url: string; // https://v.daum.net/v/ 패턴
  timeAgo: string; // "3시간 전" 등
}

export interface GlobalData {
  date: string; // YYYY-MM-DD
  updatedAt: string; // ISO 8601
  totalCountries: number;
  countries: CountryScore[];
  topArtists: Artist[];
  trendingInsights: TrendingInsight[];
  newsData?: Record<string, NewsArticle[]>; // 키워드별 사전 뉴스 데이터
}
