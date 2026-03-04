"""Spotify Web API로 국가별 K-pop 인기도 수집"""

import json
import time
from pathlib import Path

import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

from config import (
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    ARTISTS,
    SPOTIFY_MARKETS,
    DATA_DIR,
)

# K-pop 관련 장르 키워드
KPOP_GENRES = {"k-pop", "korean pop", "k-pop boy group", "k-pop girl group"}


def get_spotify_client() -> spotipy.Spotify:
    """Spotify 클라이언트 생성 (Client Credentials Flow)"""
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        raise ValueError("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET 미설정")

    auth = SpotifyClientCredentials(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
    )
    return spotipy.Spotify(auth_manager=auth)


def collect_spotify_data() -> dict:
    """
    국가별 Spotify 인기도 수집.
    각 아티스트의 국가별 인기도(popularity)를 기반으로 점수 산출.
    """
    print("[Spotify] 수집 시작...")
    sp = get_spotify_client()

    artist_ids = {a["id"]: a["spotify_id"] for a in ARTISTS}
    country_scores: dict[str, float] = {}
    artist_country_scores: dict[str, dict[str, float]] = {}

    for artist in ARTISTS:
        artist_id = artist["id"]
        spotify_id = artist["spotify_id"]
        print(f"  아티스트: {artist['nameKo']}")

        try:
            # 아티스트 인기도 가져오기
            artist_info = sp.artist(spotify_id)
            global_popularity = artist_info.get("popularity", 0)
            print(f"    글로벌 인기도: {global_popularity}")

            # 국가별 Top Tracks로 인기도 추정
            for market in SPOTIFY_MARKETS:
                try:
                    top_tracks = sp.artist_top_tracks(
                        spotify_id, country=market
                    )
                    tracks = top_tracks.get("tracks", [])

                    if tracks:
                        # 상위 트랙들의 평균 인기도
                        avg_pop = sum(
                            t.get("popularity", 0) for t in tracks[:5]
                        ) / min(len(tracks), 5)

                        country_scores.setdefault(market, 0)
                        country_scores[market] += avg_pop

                        artist_country_scores.setdefault(artist_id, {})
                        artist_country_scores[artist_id][market] = avg_pop

                    time.sleep(0.1)  # Rate limiting

                except Exception as e:
                    print(f"    [WARN] {market}: {e}")
                    time.sleep(1)

        except Exception as e:
            print(f"    [ERROR] {artist['nameKo']}: {e}")
            time.sleep(2)

    # 아티스트 수로 나누어 평균
    num_artists = len(ARTISTS)
    if num_artists > 0:
        country_scores = {
            k: v / num_artists for k, v in country_scores.items()
        }

    # 0~100 정규화
    if country_scores:
        max_score = max(country_scores.values())
        if max_score > 0:
            country_scores = {
                k: (v / max_score) * 100 for k, v in country_scores.items()
            }

    print(f"[Spotify] 수집 완료: {len(country_scores)}개 국가")

    return {
        "country_scores": country_scores,
        "artist_country_scores": artist_country_scores,
    }


if __name__ == "__main__":
    result = collect_spotify_data()
    output = DATA_DIR / "raw_spotify.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"[Spotify] 저장 완료: {output}")
