"""K-pop World Pulse - 데이터 수집 설정"""

import os
from dotenv import load_dotenv
from pathlib import Path

# .env.local 로드 (프로젝트 루트 기준)
PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(PROJECT_ROOT / ".env.local")

# API Keys
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# 출력 경로
DATA_DIR = PROJECT_ROOT / "public" / "data"
LATEST_JSON = DATA_DIR / "latest.json"
HISTORY_DIR = DATA_DIR / "history"

# K-pop 아티스트 목록 (ID, 영문명, 한글명, Spotify URI, 대표색)
ARTISTS = [
    {"id": "bts", "name": "BTS", "nameKo": "방탄소년단", "spotify_id": "3Nrfpe0tUJi4K4DXYWgMUX", "color": "#9B5DE5"},
    {"id": "blackpink", "name": "BLACKPINK", "nameKo": "블랙핑크", "spotify_id": "41MozSoPIsD1dJM0CLPjZF", "color": "#F15BB5"},
    {"id": "stray-kids", "name": "Stray Kids", "nameKo": "스트레이 키즈", "spotify_id": "2dIgFjalVxs4ThymZ67YCE", "color": "#00BBF9"},
    {"id": "newjeans", "name": "NewJeans", "nameKo": "뉴진스", "spotify_id": "6HvZYsbFfjnjFrWF950C9d", "color": "#00F5D4"},
    {"id": "aespa", "name": "aespa", "nameKo": "에스파", "spotify_id": "6YVMFz59CuY7ngCxTxjpxE", "color": "#FEE440"},
    {"id": "seventeen", "name": "SEVENTEEN", "nameKo": "세븐틴", "spotify_id": "7nqOGRxlXj7N2JYbgNEjYH", "color": "#F4845F"},
    {"id": "twice", "name": "TWICE", "nameKo": "트와이스", "spotify_id": "7n2Ycct7Beij7Dj7meI4X0", "color": "#FF6F91"},
    {"id": "txt", "name": "TXT", "nameKo": "투모로우바이투게더", "spotify_id": "0ghlgldX5Dd6720Q3qFyQB", "color": "#C3F73A"},
    {"id": "ive", "name": "IVE", "nameKo": "아이브", "spotify_id": "6RHTUrRF63xao58xR3wzKl", "color": "#D4A5FF"},
    {"id": "le-sserafim", "name": "LE SSERAFIM", "nameKo": "르세라핌", "spotify_id": "4SpbR6yFEvexJuaBpgAU5p", "color": "#FFD6E0"},
]

# Google Trends 검색 키워드
TRENDS_KEYWORDS = ["K-pop", "BTS", "BLACKPINK", "Stray Kids", "NewJeans"]

# 국가 정보 (코드, 영문명, 한글명, 위도, 경도, Wikipedia 언어 코드)
COUNTRIES = [
    {"code": "US", "name": "United States", "nameKo": "미국", "lat": 39.8, "lng": -98.5, "wiki_lang": "en"},
    {"code": "JP", "name": "Japan", "nameKo": "일본", "lat": 36.2, "lng": 138.2, "wiki_lang": "ja"},
    {"code": "BR", "name": "Brazil", "nameKo": "브라질", "lat": -14.2, "lng": -51.9, "wiki_lang": "pt"},
    {"code": "ID", "name": "Indonesia", "nameKo": "인도네시아", "lat": -0.8, "lng": 113.9, "wiki_lang": "id"},
    {"code": "PH", "name": "Philippines", "nameKo": "필리핀", "lat": 12.9, "lng": 121.8, "wiki_lang": "tl"},
    {"code": "MX", "name": "Mexico", "nameKo": "멕시코", "lat": 23.6, "lng": -102.6, "wiki_lang": "es"},
    {"code": "TH", "name": "Thailand", "nameKo": "태국", "lat": 15.9, "lng": 100.9, "wiki_lang": "th"},
    {"code": "GB", "name": "United Kingdom", "nameKo": "영국", "lat": 55.4, "lng": -3.4, "wiki_lang": "en"},
    {"code": "FR", "name": "France", "nameKo": "프랑스", "lat": 46.2, "lng": 2.2, "wiki_lang": "fr"},
    {"code": "DE", "name": "Germany", "nameKo": "독일", "lat": 51.2, "lng": 10.5, "wiki_lang": "de"},
    {"code": "IN", "name": "India", "nameKo": "인도", "lat": 20.6, "lng": 79.0, "wiki_lang": "hi"},
    {"code": "KR", "name": "South Korea", "nameKo": "한국", "lat": 35.9, "lng": 127.8, "wiki_lang": "ko"},
    {"code": "AU", "name": "Australia", "nameKo": "호주", "lat": -25.3, "lng": 133.8, "wiki_lang": "en"},
    {"code": "CA", "name": "Canada", "nameKo": "캐나다", "lat": 56.1, "lng": -106.3, "wiki_lang": "en"},
    {"code": "TR", "name": "Turkey", "nameKo": "터키", "lat": 38.9, "lng": 35.2, "wiki_lang": "tr"},
    {"code": "AR", "name": "Argentina", "nameKo": "아르헨티나", "lat": -38.4, "lng": -63.6, "wiki_lang": "es"},
    {"code": "CL", "name": "Chile", "nameKo": "칠레", "lat": -35.7, "lng": -71.5, "wiki_lang": "es"},
    {"code": "VN", "name": "Vietnam", "nameKo": "베트남", "lat": 14.1, "lng": 108.3, "wiki_lang": "vi"},
    {"code": "MY", "name": "Malaysia", "nameKo": "말레이시아", "lat": 4.2, "lng": 101.9, "wiki_lang": "ms"},
    {"code": "SG", "name": "Singapore", "nameKo": "싱가포르", "lat": 1.4, "lng": 103.8, "wiki_lang": "en"},
    {"code": "SA", "name": "Saudi Arabia", "nameKo": "사우디아라비아", "lat": 23.9, "lng": 45.1, "wiki_lang": "ar"},
    {"code": "EG", "name": "Egypt", "nameKo": "이집트", "lat": 26.8, "lng": 30.8, "wiki_lang": "ar"},
    {"code": "NG", "name": "Nigeria", "nameKo": "나이지리아", "lat": 9.1, "lng": 8.7, "wiki_lang": "en"},
    {"code": "ZA", "name": "South Africa", "nameKo": "남아프리카공화국", "lat": -30.6, "lng": 22.9, "wiki_lang": "en"},
    {"code": "IT", "name": "Italy", "nameKo": "이탈리아", "lat": 41.9, "lng": 12.6, "wiki_lang": "it"},
    {"code": "ES", "name": "Spain", "nameKo": "스페인", "lat": 40.5, "lng": -3.7, "wiki_lang": "es"},
    {"code": "PL", "name": "Poland", "nameKo": "폴란드", "lat": 51.9, "lng": 19.1, "wiki_lang": "pl"},
    {"code": "RU", "name": "Russia", "nameKo": "러시아", "lat": 61.5, "lng": 105.3, "wiki_lang": "ru"},
    {"code": "CO", "name": "Colombia", "nameKo": "콜롬비아", "lat": 4.6, "lng": -74.3, "wiki_lang": "es"},
    {"code": "PE", "name": "Peru", "nameKo": "페루", "lat": -9.2, "lng": -75.0, "wiki_lang": "es"},
    {"code": "TW", "name": "Taiwan", "nameKo": "대만", "lat": 23.7, "lng": 121.0, "wiki_lang": "zh"},
    {"code": "SE", "name": "Sweden", "nameKo": "스웨덴", "lat": 60.1, "lng": 18.6, "wiki_lang": "sv"},
    {"code": "NL", "name": "Netherlands", "nameKo": "네덜란드", "lat": 52.1, "lng": 5.3, "wiki_lang": "nl"},
]

# Spotify 국가별 Top 50 플레이리스트 ID (주요 국가)
# 참고: Spotify의 "Top 50" 플레이리스트는 country code로 조회 가능
SPOTIFY_MARKETS = [c["code"] for c in COUNTRIES]

# 가중치 (Spotify 제외 — 3개 소스)
WEIGHTS = {
    "google_trends": 0.33,
    "wikipedia": 0.33,
    "youtube": 0.34,
}
