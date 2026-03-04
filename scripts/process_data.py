"""4개 소스 데이터를 통합하여 latest.json 생성"""

import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

from config import ARTISTS, COUNTRIES, WEIGHTS, DATA_DIR, LATEST_JSON, HISTORY_DIR


def load_raw(filename: str) -> dict:
    """raw 데이터 파일 로드 (없으면 빈 dict)"""
    path = DATA_DIR / filename
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    print(f"  [WARN] {filename} 없음 — 해당 소스 건너뜀")
    return {}


def load_previous() -> dict:
    """이전 latest.json 로드 (변화량 계산용)"""
    if LATEST_JSON.exists():
        with open(LATEST_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def process_all():
    """모든 소스를 통합하여 최종 점수 산출"""
    print("[Process] 데이터 통합 시작...")

    # 1. Raw 데이터 로드
    spotify = load_raw("raw_spotify.json")
    trends = load_raw("raw_google_trends.json")
    wiki = load_raw("raw_wikipedia.json")
    youtube = load_raw("raw_youtube.json")

    # 2. 각 소스별 국가 점수 추출
    spotify_scores = spotify.get("country_scores", {})
    trends_scores = trends.get("country_scores", {})
    wiki_scores = wiki.get("country_scores", {})
    youtube_scores = youtube.get("country_scores", {})

    # 아티스트별 국가 점수
    spotify_artist = spotify.get("artist_country_scores", {})
    trends_artist = trends.get("keyword_country_scores", {})
    wiki_artist = wiki.get("artist_country_scores", {})
    youtube_artist = youtube.get("artist_country_scores", {})

    # 3. 이전 데이터 로드 (변화량 계산)
    previous = load_previous()
    prev_countries = {}
    for c in previous.get("countries", []):
        prev_countries[c["code"]] = c.get("score", 0)

    # 4. 국가별 통합 점수 계산
    kst = timezone(timedelta(hours=9))
    now = datetime.now(kst)
    countries_data = []

    for country_info in COUNTRIES:
        code = country_info["code"]

        # 가중 평균 계산
        s_spotify = spotify_scores.get(code, 0)
        s_trends = trends_scores.get(code, 0)
        s_wiki = wiki_scores.get(code, 0)
        s_youtube = youtube_scores.get(code, 0)

        # 활성 소스만 가중치 재분배
        active_weights = {}
        if spotify_scores:
            active_weights["spotify"] = WEIGHTS["spotify"]
        if trends_scores:
            active_weights["google_trends"] = WEIGHTS["google_trends"]
        if wiki_scores:
            active_weights["wikipedia"] = WEIGHTS["wikipedia"]
        if youtube_scores:
            active_weights["youtube"] = WEIGHTS["youtube"]

        total_weight = sum(active_weights.values()) or 1

        score = 0
        if "spotify" in active_weights:
            score += s_spotify * (active_weights["spotify"] / total_weight)
        if "google_trends" in active_weights:
            score += s_trends * (active_weights["google_trends"] / total_weight)
        if "wikipedia" in active_weights:
            score += s_wiki * (active_weights["wikipedia"] / total_weight)
        if "youtube" in active_weights:
            score += s_youtube * (active_weights["youtube"] / total_weight)

        score = round(score, 1)

        # 변화량
        prev_score = prev_countries.get(code, score)
        change = round(score - prev_score, 1)

        # 5. 국가별 TOP 아티스트 산출
        top_artists = []
        for artist in ARTISTS:
            aid = artist["id"]
            a_score = 0
            a_platform = "trends"
            best_platform_score = 0

            # 각 소스에서 해당 아티스트의 국가 점수
            platforms = {
                "trends": trends_artist.get(aid, {}).get(code, 0),
                "wiki": wiki_artist.get(aid, {}).get(code, 0),
                "youtube": youtube_artist.get(aid, {}).get(code, 0),
            }

            a_score = sum(platforms.values())

            # 가장 높은 플랫폼 찾기
            for pname, pscore in platforms.items():
                if pscore > best_platform_score:
                    best_platform_score = pscore
                    a_platform = pname

            if a_score > 0:
                top_artists.append({
                    "id": aid,
                    "name": artist["name"],
                    "nameKo": artist["nameKo"],
                    "score": round(a_score, 1),
                    "platform": a_platform,
                })

        # 점수 내림차순 정렬, 상위 5개
        top_artists.sort(key=lambda x: x["score"], reverse=True)
        top_artists = top_artists[:5]

        # 아티스트가 없으면 기본값
        if not top_artists:
            top_artists = [
                {
                    "id": ARTISTS[0]["id"],
                    "name": ARTISTS[0]["name"],
                    "nameKo": ARTISTS[0]["nameKo"],
                    "score": 0,
                    "platform": "spotify",
                }
            ]

        countries_data.append({
            "code": code,
            "name": country_info["name"],
            "nameKo": country_info["nameKo"],
            "score": score,
            "trendsScore": round(s_trends, 1),
            "wikiScore": round(s_wiki, 1),
            "youtubeScore": round(s_youtube, 1),
            "change": change,
            "topArtists": top_artists,
            "lat": country_info["lat"],
            "lng": country_info["lng"],
        })

    # 점수 기준 내림차순 정렬
    countries_data.sort(key=lambda x: x["score"], reverse=True)

    # 6. 글로벌 TOP 아티스트 산출
    global_artist_scores: dict[str, float] = {}
    for artist in ARTISTS:
        aid = artist["id"]
        total = 0
        for source_artist in [trends_artist, wiki_artist, youtube_artist]:
            for code, sc in source_artist.get(aid, {}).items():
                total += sc
        global_artist_scores[aid] = total

    top_global_artists = []
    for artist in ARTISTS:
        aid = artist["id"]
        top_global_artists.append({
            "id": aid,
            "name": artist["name"],
            "nameKo": artist["nameKo"],
            "score": round(global_artist_scores.get(aid, 0), 1),
            "color": artist["color"],
        })
    top_global_artists.sort(key=lambda x: x["score"], reverse=True)

    # 7. 트렌딩 인사이트 TOP 5 산출
    trending_insights = []

    # Google Trends 키워드별 글로벌 합산
    keyword_scores = trends.get("keyword_country_scores", {})
    keyword_totals = {}
    for keyword, countries_map in keyword_scores.items():
        keyword_totals[keyword] = sum(countries_map.values())
    # 키워드 TOP 5 (점수 내림차순)
    sorted_keywords = sorted(keyword_totals.items(), key=lambda x: x[1], reverse=True)
    for kw, total in sorted_keywords[:5]:
        # 해당 키워드가 가장 인기 있는 국가 TOP 3
        kw_countries = keyword_scores.get(kw, {})
        top_countries = sorted(kw_countries.items(), key=lambda x: x[1], reverse=True)[:3]
        country_names = []
        for code, sc in top_countries:
            name_ko = next((c["nameKo"] for c in COUNTRIES if c["code"] == code), code)
            country_names.append(name_ko)
        trending_insights.append({
            "keyword": kw,
            "score": round(total, 1),
            "source": "google_trends",
            "topCountries": country_names,
        })

    # Wikipedia 아티스트별 글로벌 조회수
    wiki_artist_totals = {}
    for aid, countries_map in wiki_artist.items():
        wiki_artist_totals[aid] = sum(countries_map.values())
    sorted_wiki = sorted(wiki_artist_totals.items(), key=lambda x: x[1], reverse=True)
    wiki_rank = 1
    for aid, total in sorted_wiki[:5]:
        artist_info = next((a for a in ARTISTS if a["id"] == aid), None)
        if artist_info:
            # 해당 아티스트 조회가 가장 많은 언어/국가
            artist_countries = wiki_artist.get(aid, {})
            top_wiki_countries = sorted(artist_countries.items(), key=lambda x: x[1], reverse=True)[:3]
            country_names = []
            for code, sc in top_wiki_countries:
                name_ko = next((c["nameKo"] for c in COUNTRIES if c["code"] == code), code)
                country_names.append(name_ko)
            trending_insights.append({
                "keyword": f"{artist_info['nameKo']} (Wiki #{wiki_rank})",
                "score": round(total, 1),
                "source": "wikipedia",
                "topCountries": country_names,
            })
            wiki_rank += 1

    # 8. 최종 JSON 생성
    result = {
        "date": now.strftime("%Y-%m-%d"),
        "updatedAt": now.isoformat(),
        "totalCountries": len(countries_data),
        "countries": countries_data,
        "topArtists": top_global_artists,
        "trendingInsights": trending_insights,
    }

    # 8. 저장
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(LATEST_JSON, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"[Process] latest.json 저장 완료: {LATEST_JSON}")

    # 히스토리 저장
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    history_file = HISTORY_DIR / f"{now.strftime('%Y-%m-%d')}.json"
    with open(history_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"[Process] 히스토리 저장: {history_file}")

    # 요약 출력
    print(f"\n{'='*50}")
    print(f"활성 소스: {list(active_weights.keys())}")
    print(f"국가 수: {len(countries_data)}")
    print(f"TOP 5 국가:")
    for i, c in enumerate(countries_data[:5]):
        print(f"  {i+1}. {c['nameKo']} ({c['code']}) — {c['score']}점")
    print(f"{'='*50}")


if __name__ == "__main__":
    process_all()
