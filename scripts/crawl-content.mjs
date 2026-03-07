/**
 * 트렌딩 키워드별 콘텐츠 크롤링 + 검색 링크 생성
 * — 다음 뉴스 5건 (인기순, 최근 1주일, v.daum.net만)
 * — 통합검색 5건 (검색 목적지 링크 자동 생성)
 * 결과를 latest.json의 contentData에 병합
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "public", "data", "latest.json");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9",
  Accept: "text/html,application/xhtml+xml",
};

function cleanKeyword(kw) {
  return kw.replace(/\s*\(.*?\)\s*/g, "").trim();
}

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/** 다음 뉴스 파서 — v.daum.net 링크만, 5건 */
function parseDaumNews(html, maxCount = 5) {
  const items = [];
  const seen = new Set();
  const allLinks = [...html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

  for (const m of allLinks) {
    if (items.length >= maxCount) break;
    const url = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    if (
      url.startsWith("http") &&
      url.includes("v.daum.net/v/") &&
      text.length >= 10 &&
      !seen.has(url)
    ) {
      seen.add(url);
      items.push({ type: "news", title: text, url, timeAgo: "최근 1주일", provider: "다음 뉴스" });
    }
  }
  return items;
}

/** 통합검색 — 키워드별 검색 목적지 링크 5개 */
function generateSearchLinks(keyword) {
  const q = encodeURIComponent(keyword);
  return [
    { type: "search", title: `"${keyword}" 다음 검색 결과`, url: `https://search.daum.net/search?q=${q}`, timeAgo: "", provider: "다음 검색" },
    { type: "search", title: `"${keyword}" 나무위키`, url: `https://namu.wiki/w/${q}`, timeAgo: "", provider: "나무위키" },
    { type: "search", title: `"${keyword}" 멜론 검색`, url: `https://www.melon.com/search/total/index.htm?q=${q}`, timeAgo: "", provider: "멜론" },
    { type: "search", title: `"${keyword}" 네이버 검색 결과`, url: `https://search.naver.com/search.naver?query=${q}`, timeAgo: "", provider: "네이버 검색" },
    { type: "search", title: `"${keyword}" 위키백과`, url: `https://ko.wikipedia.org/wiki/${q}`, timeAgo: "", provider: "위키백과" },
  ];
}

/* ── 메인 ── */
async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const keywords = data.trendingInsights.map((i) => i.keyword);

  console.log(`🔍 ${keywords.length}개 키워드 크롤링 시작...\n`);

  const contentData = {};

  for (const rawKw of keywords) {
    const kw = cleanKeyword(rawKw);
    console.log(`  ▶ "${kw}" ...`);

    // 1) 다음 뉴스 (인기순, 최근 1주일, v.daum.net만, 5건)
    const newsUrl = `https://search.daum.net/search?w=news&q=${encodeURIComponent(kw)}&period=w&sort=popular&DA=STC`;
    const newsHtml = await fetchWithTimeout(newsUrl);
    const newsItems = newsHtml ? parseDaumNews(newsHtml, 5) : [];

    // 2) 통합검색 링크 5건
    const searchItems = generateSearchLinks(kw);

    const combined = [...newsItems, ...searchItems];
    contentData[rawKw] = combined;

    console.log(`    뉴스 ${newsItems.length}건 + 검색 ${searchItems.length}건 = ${combined.length}건`);

    // 요청 간격
    await new Promise((r) => setTimeout(r, 500));
  }

  // latest.json 업데이트
  data.contentData = contentData;
  data.updatedAt = new Date().toISOString();

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\n✅ contentData 업데이트 완료 → ${DATA_PATH}`);

  const totalNews = Object.values(contentData).reduce((s, arr) => s + arr.filter((i) => i.type === "news").length, 0);
  const totalSearch = Object.values(contentData).reduce((s, arr) => s + arr.filter((i) => i.type === "search").length, 0);
  console.log(`   뉴스 ${totalNews}건 + 검색 ${totalSearch}건 = 총 ${totalNews + totalSearch}건`);
  console.log(`   (YouTube 5건은 API Route에서 실시간 제공)`);
}

main().catch(console.error);
