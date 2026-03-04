"""YouTube Data API로 국가별 K-pop 인기도 수집"""

import json
import time
from pathlib import Path

from googleapiclient.discovery import build

from config import YOUTUBE_API_KEY, ARTISTS, COUNTRIES, DATA_DIR

# K-pop 관련 검색 키워드
SEARCH_QUERIES = ["K-pop", "BTS", "BLACKPINK", "Stray Kids", "NewJeans"]


def get_youtube_client():
    """YouTube API 클라이언트 생성"""
    if not YOUTUBE_API_KEY:
        raise ValueError("YOUTUBE_API_KEY 미설정")
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY)


def collect_youtube_data() -> dict:
    """
    국가별 YouTube K-pop 인기도 수집.
    각 국가의 인기 동영상(mostPopular)에서 K-pop 관련 콘텐츠를 검색.
    """
    print("[YouTube] 수집 시작...")
    youtube = get_youtube_client()

    country_scores: dict[str, float] = {}
    artist_country_scores: dict[str, dict[str, float]] = {}
    country_codes = [c["code"] for c in COUNTRIES]

    # 아티스트 채널 ID 매핑 (검색으로 확인)
    artist_name_set = {a["name"].lower() for a in ARTISTS}
    artist_name_to_id = {a["name"].lower(): a["id"] for a in ARTISTS}

    for region_code in country_codes:
        print(f"  국가: {region_code}")
        try:
            # 해당 국가의 인기 음악 동영상 조회 (카테고리 10 = Music)
            request = youtube.videos().list(
                part="snippet,statistics",
                chart="mostPopular",
                regionCode=region_code,
                videoCategoryId="10",  # Music
                maxResults=50,
            )
            response = request.execute()

            kpop_count = 0
            total_views = 0

            for item in response.get("items", []):
                snippet = item.get("snippet", {})
                title = snippet.get("title", "").lower()
                description = snippet.get("description", "").lower()
                channel = snippet.get("channelTitle", "").lower()
                stats = item.get("statistics", {})
                views = int(stats.get("viewCount", 0))

                # K-pop 관련 콘텐츠인지 확인
                is_kpop = False
                matched_artist = None

                for artist_name in artist_name_set:
                    if artist_name in title or artist_name in channel:
                        is_kpop = True
                        matched_artist = artist_name_to_id.get(artist_name)
                        break

                if not is_kpop:
                    kpop_keywords = [
                        "k-pop", "kpop", "k pop",
                        "hybe", "jyp", "sm entertainment", "yg entertainment",
                    ]
                    for kw in kpop_keywords:
                        if kw in title or kw in description or kw in channel:
                            is_kpop = True
                            break

                if is_kpop:
                    kpop_count += 1
                    total_views += views

                    if matched_artist:
                        artist_country_scores.setdefault(
                            matched_artist, {}
                        )
                        artist_country_scores[matched_artist].setdefault(
                            region_code, 0
                        )
                        artist_country_scores[matched_artist][
                            region_code
                        ] += 1

            # 국가 점수: K-pop 비율 * 100
            total_items = len(response.get("items", []))
            if total_items > 0:
                score = (kpop_count / total_items) * 100
                country_scores[region_code] = score
                if kpop_count > 0:
                    print(
                        f"    K-pop {kpop_count}/{total_items}개 "
                        f"(점수: {score:.1f})"
                    )

            time.sleep(0.2)  # Rate limiting

        except Exception as e:
            print(f"    [ERROR] {region_code}: {e}")
            time.sleep(1)

    # 0~100 정규화
    if country_scores:
        max_score = max(country_scores.values())
        if max_score > 0:
            country_scores = {
                k: (v / max_score) * 100 for k, v in country_scores.items()
            }

    print(f"[YouTube] 수집 완료: {len(country_scores)}개 국가")

    return {
        "country_scores": country_scores,
        "artist_country_scores": artist_country_scores,
    }


if __name__ == "__main__":
    result = collect_youtube_data()
    output = DATA_DIR / "raw_youtube.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"[YouTube] 저장 완료: {output}")
