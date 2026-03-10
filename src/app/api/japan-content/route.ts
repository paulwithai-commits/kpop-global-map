import { NextRequest, NextResponse } from "next/server";

interface ContentItem {
  type: "news" | "search" | "youtube" | "yahoo";
  title: string;
  url: string;
  timeAgo: string;
  thumbnail?: string;
  provider?: string;
}

/**
 * 일본 전용 통합 콘텐츠 API — 다음 뉴스 + YouTube + Yahoo Japan 검색 + 검색 링크
 * GET /api/japan-content?keyword=BTS&keywordJa=BTS
 */
export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword");
  const keywordJa =
    request.nextUrl.searchParams.get("keywordJa") || keyword;

  if (!keyword) {
    return NextResponse.json(
      { error: "keyword 파라미터가 필요합니다" },
      { status: 400 }
    );
  }

  const cleanKeyword = keyword.replace(/\s*\(.*?\)\s*/g, "").trim();
  const cleanKeywordJa = (keywordJa || "")
    .replace(/\s*\(.*?\)\s*/g, "")
    .trim();

  try {
    const [newsItems, youtubeItems, yahooItems, searchItems] =
      await Promise.allSettled([
        fetchDaumNews(cleanKeyword),
        fetchYouTube(cleanKeyword),
        fetchYahooJapan(cleanKeywordJa || cleanKeyword),
        Promise.resolve(buildSearchLinks(cleanKeyword, cleanKeywordJa)),
      ]);

    const contents: ContentItem[] = [
      ...(newsItems.status === "fulfilled" ? newsItems.value : []),
      ...(youtubeItems.status === "fulfilled" ? youtubeItems.value : []),
      ...(yahooItems.status === "fulfilled" ? yahooItems.value : []),
      ...(searchItems.status === "fulfilled" ? searchItems.value : []),
    ];

    return NextResponse.json(
      {
        keyword: cleanKeyword,
        keywordJa: cleanKeywordJa,
        contents,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("일본 콘텐츠 크롤링 에러:", error);
    return NextResponse.json(
      { error: "콘텐츠를 가져오는 데 실패했습니다" },
      { status: 500 }
    );
  }
}

/**
 * 다음 뉴스 — 기존 글로벌 맵과 동일
 */
async function fetchDaumNews(keyword: string): Promise<ContentItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://search.daum.net/search?w=news&q=${encodeURIComponent(keyword)}&period=w&sort=popular&DA=STC`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const html = await response.text();

    const items: ContentItem[] = [];
    const seen = new Set<string>();
    const allLinks = [
      ...html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi),
    ];

    for (const m of allLinks) {
      if (items.length >= 5) break;
      const linkUrl = m[1];
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      if (
        linkUrl.startsWith("http") &&
        linkUrl.includes("v.daum.net/v/") &&
        title.length >= 10 &&
        !seen.has(linkUrl)
      ) {
        seen.add(linkUrl);
        items.push({
          type: "news",
          title,
          url: linkUrl,
          timeAgo: "최근 1주일",
          provider: "다음 뉴스",
        });
      }
    }
    return items;
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

/**
 * YouTube 검색 — 기존 글로벌 맵과 동일
 */
async function fetchYouTube(keyword: string): Promise<ContentItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&sp=CAMSAhAB`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const html = await response.text();

    const items: ContentItem[] = [];
    const dataMatch = html.match(
      /var ytInitialData = ({[\s\S]*?});<\/script>/
    );
    if (!dataMatch) return items;

    try {
      const data = JSON.parse(dataMatch[1]);
      const contents =
        data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
          ?.sectionListRenderer?.contents;
      if (!contents) return items;

      for (const section of contents) {
        const videos = section?.itemSectionRenderer?.contents;
        if (!videos) continue;
        for (const item of videos) {
          if (items.length >= 5) break;
          const video = item?.videoRenderer;
          if (video) {
            const videoId = video.videoId;
            const title =
              video.title?.runs?.[0]?.text ??
              video.title?.simpleText ??
              "";
            const channel = video.ownerText?.runs?.[0]?.text ?? "";
            const thumb =
              video.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ?? "";
            const viewText = video.viewCountText?.simpleText ?? "";
            const publishedText =
              video.publishedTimeText?.simpleText ?? "";
            if (videoId && title) {
              items.push({
                type: "youtube",
                title,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                timeAgo: [publishedText, viewText]
                  .filter(Boolean)
                  .join(" · "),
                thumbnail: thumb,
                provider: channel,
              });
            }
          }
        }
      }
    } catch {
      // JSON 파싱 실패
    }
    return items;
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

/**
 * Yahoo Japan 검색 — 일본 전용
 */
async function fetchYahooJapan(keyword: string): Promise<ContentItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://search.yahoo.co.jp/search?p=${encodeURIComponent(keyword)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ja,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const html = await response.text();
    return parseYahooResults(html, 5);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

function parseYahooResults(
  html: string,
  maxCount: number
): ContentItem[] {
  const items: ContentItem[] = [];
  const seen = new Set<string>();

  // Yahoo Japan 검색결과 링크 추출
  // 패턴: <a href="https://..." class="..." 형태의 외부 링크
  const linkPattern =
    /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const matches = [...html.matchAll(linkPattern)];

  for (const m of matches) {
    if (items.length >= maxCount) break;
    const linkUrl = m[1];
    const title = m[2].replace(/<[^>]+>/g, "").trim();

    // Yahoo 내부 링크, 광고, 짧은 제목 제외
    if (
      !linkUrl.includes("yahoo.co.jp") &&
      !linkUrl.includes("yahoo.com") &&
      !linkUrl.includes("ard.yahoo") &&
      title.length >= 8 &&
      !seen.has(linkUrl)
    ) {
      seen.add(linkUrl);
      items.push({
        type: "yahoo",
        title,
        url: linkUrl,
        timeAgo: "",
        provider: "Yahoo Japan",
      });
    }
  }

  return items;
}

/**
 * 검색 목적지 링크 — 일본 특화
 */
function buildSearchLinks(
  keyword: string,
  keywordJa: string
): ContentItem[] {
  const q = encodeURIComponent(keyword);
  const qJa = encodeURIComponent(keywordJa || keyword);

  return [
    {
      type: "search",
      title: `"${keywordJa}" Yahoo Japan 검색`,
      url: `https://search.yahoo.co.jp/search?p=${qJa}`,
      timeAgo: "",
      provider: "Yahoo Japan",
    },
    {
      type: "search",
      title: `"${keyword}" 다음 검색`,
      url: `https://search.daum.net/search?q=${q}`,
      timeAgo: "",
      provider: "다음 검색",
    },
    {
      type: "search",
      title: `"${keywordJa}" 일본 위키백과`,
      url: `https://ja.wikipedia.org/wiki/${qJa}`,
      timeAgo: "",
      provider: "Wikipedia JP",
    },
    {
      type: "search",
      title: `"${keyword}" 멜론 검색`,
      url: `https://www.melon.com/search/total/index.htm?q=${q}`,
      timeAgo: "",
      provider: "멜론",
    },
  ];
}
