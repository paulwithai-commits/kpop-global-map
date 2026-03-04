"""Google Trends로 K-pop 국가별 검색 관심도 수집 (API 키 불필요)"""

import json
import time
from pathlib import Path

from pytrends.request import TrendReq

from config import COUNTRIES, TRENDS_KEYWORDS, DATA_DIR


def collect_google_trends_data() -> dict:
    """
    Google Trends에서 K-pop 관련 키워드의 국가별 관심도를 수집.
    interest_by_region()으로 국가별 0~100 점수를 가져옴.
    """
    print("[Google Trends] 수집 시작...")
    pytrends = TrendReq(hl="en-US", tz=540, timeout=(10, 25))

    country_scores: dict[str, float] = {}
    keyword_country_scores: dict[str, dict[str, float]] = {}

    # 국가 코드 → 국가명 매핑 (Google Trends는 국가명 사용)
    code_to_name = {c["code"]: c["name"] for c in COUNTRIES}
    name_to_code = {c["name"]: c["code"] for c in COUNTRIES}

    for keyword in TRENDS_KEYWORDS:
        print(f"  키워드: {keyword}")
        try:
            pytrends.build_payload(
                [keyword],
                cat=0,
                timeframe="now 7-d",  # 최근 7일
                geo="",  # 전세계
            )
            time.sleep(5)  # 차단 방지

            region_data = pytrends.interest_by_region(
                resolution="COUNTRY",
                inc_low_vol=True,
                inc_geo_code=True,
            )

            if region_data.empty:
                print(f"    데이터 없음")
                continue

            # geoCode 컬럼으로 국가 코드 매핑
            for _, row in region_data.iterrows():
                geo_code = row.get("geoCode", "")
                score = row.get(keyword, 0)

                if geo_code in code_to_name:
                    country_scores.setdefault(geo_code, 0)
                    country_scores[geo_code] += score

                    keyword_country_scores.setdefault(keyword, {})
                    keyword_country_scores[keyword][geo_code] = score

            print(f"    {len(region_data)}개 국가 데이터 수집")

        except Exception as e:
            print(f"    [ERROR] {keyword}: {e}")
            time.sleep(10)  # 에러 시 대기 시간 증가

    # 키워드 수로 나누어 평균
    num_keywords = len(TRENDS_KEYWORDS)
    if num_keywords > 0:
        country_scores = {k: v / num_keywords for k, v in country_scores.items()}

    # 0~100 정규화
    if country_scores:
        max_score = max(country_scores.values())
        if max_score > 0:
            country_scores = {k: (v / max_score) * 100 for k, v in country_scores.items()}

    print(f"[Google Trends] 수집 완료: {len(country_scores)}개 국가")

    return {
        "country_scores": country_scores,
        "keyword_country_scores": keyword_country_scores,
    }


if __name__ == "__main__":
    result = collect_google_trends_data()
    output = DATA_DIR / "raw_google_trends.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"[Google Trends] 저장 완료: {output}")
