"""Wikipedia Pageviews API로 K-pop 아티스트 관심도 수집 (API 키 불필요)"""

import json
import time
from datetime import datetime, timedelta
from pathlib import Path

import requests

from config import ARTISTS, COUNTRIES, DATA_DIR

# Wikipedia API 엔드포인트
WIKI_API = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article"

# 아티스트별 Wikipedia 페이지 제목 (언어별)
# 영문 Wikipedia 기준 (가장 보편적)
ARTIST_WIKI_TITLES = {
    "bts": {"en": "BTS", "ja": "BTS_(音楽グループ)", "ko": "방탄소년단", "es": "BTS_(banda)", "pt": "BTS_(grupo)", "fr": "BTS_(groupe)", "de": "BTS_(Band)", "zh": "防弹少年团", "id": "BTS", "th": "บีทีเอส_(วงดนตรี)", "vi": "BTS_(nhóm_nhạc)", "tr": "BTS_(müzik_grubu)", "ru": "BTS", "it": "BTS_(gruppo_musicale)", "pl": "BTS_(zespół_muzyczny)", "ar": "بي_تي_إس", "nl": "BTS_(band)", "sv": "BTS_(musikgrupp)"},
    "blackpink": {"en": "Blackpink", "ja": "BLACKPINK", "ko": "블랙핑크", "es": "Blackpink", "pt": "Blackpink", "fr": "Blackpink", "de": "Blackpink", "zh": "BLACKPINK", "id": "Blackpink", "th": "แบล็กพิงก์", "vi": "Blackpink", "tr": "Blackpink", "ru": "Blackpink", "it": "Blackpink", "pl": "Blackpink", "ar": "بلاك_بينك", "nl": "Blackpink", "sv": "Blackpink"},
    "stray-kids": {"en": "Stray_Kids", "ja": "Stray_Kids", "ko": "스트레이_키즈"},
    "newjeans": {"en": "NewJeans", "ja": "NewJeans", "ko": "뉴진스"},
    "aespa": {"en": "Aespa", "ja": "Aespa", "ko": "에스파"},
    "seventeen": {"en": "Seventeen_(South_Korean_band)", "ja": "SEVENTEEN_(音楽グループ)", "ko": "세븐틴_(음악_그룹)"},
    "twice": {"en": "Twice_(group)", "ja": "TWICE", "ko": "트와이스"},
    "txt": {"en": "Tomorrow_X_Together", "ja": "TOMORROW_X_TOGETHER", "ko": "투모로우바이투게더"},
    "ive": {"en": "Ive_(group)", "ja": "IVE_(音楽グループ)", "ko": "아이브_(음악_그룹)"},
    "le-sserafim": {"en": "Le_Sserafim", "ja": "LE_SSERAFIM", "ko": "르세라핌"},
}


def get_pageviews(lang: str, title: str, date: str) -> int:
    """특정 언어 Wikipedia에서 특정 페이지의 일일 조회수를 가져옴"""
    url = f"{WIKI_API}/{lang}.wikipedia/all-access/all-agents/{title}/daily/{date}/{date}"
    headers = {"User-Agent": "KpopWorldPulse/1.0 (kpop-global-map)"}

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("items", [])
            if items:
                return items[0].get("views", 0)
    except Exception as e:
        print(f"  [WARN] {lang}:{title} - {e}")

    return 0


def collect_wikipedia_data() -> dict:
    """
    국가별 Wikipedia 관심도 점수를 수집.
    언어 → 국가 매핑으로 국가별 점수 추정.
    """
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y%m%d")
    print(f"[Wikipedia] 수집 날짜: {yesterday}")

    # 언어별 전체 조회수 합산
    lang_scores: dict[str, int] = {}

    for artist in ARTISTS:
        artist_id = artist["id"]
        titles = ARTIST_WIKI_TITLES.get(artist_id, {})
        print(f"  아티스트: {artist['nameKo']}")

        for lang, title in titles.items():
            views = get_pageviews(lang, title, yesterday)
            lang_scores.setdefault(lang, 0)
            lang_scores[lang] += views
            if views > 0:
                print(f"    {lang}: {views:,} views")
            time.sleep(0.1)  # Rate limiting

    # 언어 → 국가 매핑 (하나의 언어가 여러 국가에 매핑될 수 있음)
    lang_to_countries = {}
    for country in COUNTRIES:
        lang = country["wiki_lang"]
        lang_to_countries.setdefault(lang, [])
        lang_to_countries[lang].append(country["code"])

    # 국가별 점수 계산 (해당 언어의 조회수를 국가 수로 나눔)
    country_scores: dict[str, float] = {}
    for lang, total_views in lang_scores.items():
        mapped_countries = lang_to_countries.get(lang, [])
        if mapped_countries:
            score_per_country = total_views / len(mapped_countries)
            for code in mapped_countries:
                country_scores.setdefault(code, 0)
                country_scores[code] += score_per_country

    # 0~100으로 정규화
    if country_scores:
        max_score = max(country_scores.values())
        if max_score > 0:
            country_scores = {k: (v / max_score) * 100 for k, v in country_scores.items()}

    # 아티스트별 국가별 점수도 수집
    artist_country_scores: dict[str, dict[str, float]] = {}
    for artist in ARTISTS:
        artist_id = artist["id"]
        titles = ARTIST_WIKI_TITLES.get(artist_id, {})
        artist_lang_views: dict[str, int] = {}

        for lang, title in titles.items():
            views = get_pageviews(lang, title, yesterday)
            artist_lang_views[lang] = views
            time.sleep(0.1)

        # 언어 → 국가 매핑
        for lang, views in artist_lang_views.items():
            mapped = lang_to_countries.get(lang, [])
            for code in mapped:
                artist_country_scores.setdefault(artist_id, {})
                artist_country_scores[artist_id].setdefault(code, 0)
                artist_country_scores[artist_id][code] += views / max(len(mapped), 1)

    print(f"[Wikipedia] 수집 완료: {len(country_scores)}개 국가")

    return {
        "country_scores": country_scores,
        "artist_country_scores": artist_country_scores,
        "date": yesterday,
    }


if __name__ == "__main__":
    result = collect_wikipedia_data()
    output = DATA_DIR / "raw_wikipedia.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"[Wikipedia] 저장 완료: {output}")
