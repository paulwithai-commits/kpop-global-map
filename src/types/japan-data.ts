/** 도도부현별 아티스트 데이터 */
export interface PrefectureArtist {
  id: string;
  name: string;
  nameKo: string;
  score: number;
  hourlyScores: number[]; // 24개 (0시~23시)
}

/** 도도부현 점수 */
export interface PrefectureScore {
  code: string;        // "JP-01" ~ "JP-47" (ISO 3166-2)
  name: string;        // "Hokkaido"
  nameKo: string;      // "홋카이도"
  nameJa: string;      // "北海道"
  trendsScore: number;  // 전체 점수 (0-100)
  change: number;       // 전일 대비 변화
  hourlyScores: number[]; // 24개 (0시~23시) — 시간대별 종합 점수
  topArtists: PrefectureArtist[];
}

/** 일본 전체 데이터 */
export interface JapanData {
  date: string;           // "YYYY-MM-DD"
  updatedAt: string;      // ISO 8601
  totalPrefectures: number;
  prefectures: PrefectureScore[];
  topArtists: JapanArtist[];
  trendingKeywords: string[];
}

/** 아티스트 (필터용) */
export interface JapanArtist {
  id: string;
  name: string;
  nameKo: string;
  nameJa: string;
  color: string; // 대표 컬러
}
