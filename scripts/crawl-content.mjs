/**
 * 트렌딩 키워드별 실제 콘텐츠 크롤링 스크립트
 * — 다음 뉴스 (인기순, 최근 1주일, 5개) — v.daum.net 링크만
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

/**
 * 다음 뉴스 파서 — v.daum.net 링크만 추출, 중복 URL 제거, 제목 10자 이상
 */
function parseDaumNews(html, maxCount = 5) {
  const items = [];
  const seen = new Set();

  // 모든 a 태그에서 href + 텍스트 추출
  const allLinks = [...html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

  for (const m of allLinks) {
    if (items.length >= maxCount) break;

    const url = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").trim();

    // v.daum.net 뉴스 링크만 + 제목 10자 이상 + 중복 제거
    if (
      url.startsWith("http") &&
      url.includes("v.daum.net/v/") &&
      text.length >= 10 &&
      !seen.has(url)
    ) {
      seen.add(url);
      items.push({
        type: "news",
        title: text,
        url,
        timeAgo: "최근 1주일",
        provider: "다음 뉴스",
      });
    }
  }

  return items;
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

    // 다음 뉴스 (인기순, 최근 1주일, v.daum.net만)
    const newsUrl = `https://search.daum.net/search?w=news&q=${encodeURIComponent(kw)}&period=w&sort=popular&DA=STC`;
    const newsHtml = await fetchWithTimeout(newsUrl);
    const newsItems = newsHtml ? parseDaumNews(newsHtml, 5) : [];

    contentData[rawKw] = newsItems;
    console.log(`    뉴스 ${newsItems.length}건`);
    if (newsItems.length > 0) {
      console.log(`    예: ${newsItems[0].title.substring(0, 50)}`);
    }

    // 요청 간격
    await new Promise((r) => setTimeout(r, 500));
  }

  // latest.json 업데이트
  data.contentData = contentData;
  data.updatedAt = new Date().toISOString();

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\n✅ contentData 업데이트 완료 → ${DATA_PATH}`);

  const total = Object.values(contentData).reduce((s, arr) => s + arr.length, 0);
  console.log(`   총 ${total}건 뉴스 기사`);
}

main().catch(console.error);
