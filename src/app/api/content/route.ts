import { NextRequest, NextResponse } from "next/server";

interface ContentItem {
  type: "news" | "search" | "youtube";
  title: string;
  url: string;
  timeAgo: string;
  thumbnail?: string;
  provider?: string;
}

/**
 * 통합 콘텐츠 API — 다음 뉴스 + 통합검색 + YouTube Shorts
 * GET /api/content?keyword=블랙핑크
 */
export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: "keyword 파라미터가 필요합니다" },
      { status: 400 }
    );
  }

  const cleanKeyword = keyword.replace(/\s*\(.*?\)\s*/g, "").trim();

  try {
    // 3개 소스 병렬 크롤링 (각각 5초 타임아웃)
    const [newsItems, searchItems, youtubeItems] = await Promise.allSettled([
      fetchDaumNews(cleanKeyword),
      fetchDaumSearch(cleanKeyword),
      fetchYouTubeShorts(cleanKeyword),
    ]);

    const contents: ContentItem[] = [
      ...(newsItems.status === "fulfilled" ? newsItems.value : []),
      ...(searchItems.status === "fulfilled" ? searchItems.value : []),
      ...(youtubeItems.status === "fulfilled" ? youtubeItems.value : []),
    ];

    return NextResponse.json(
      {
        keyword: cleanKeyword,
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
    console.error("콘텐츠 크롤링 에러:", error);
    return NextResponse.json(
      { error: "콘텐츠를 가져오는 데 실패했습니다" },
      { status: 500 }
    );
  }
}

/** 다음 뉴스 검색 (최근 1주일) */
async function fetchDaumNews(keyword: string): Promise<ContentItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://search.daum.net/search?w=news&q=${encodeURIComponent(keyword)}&period=w&DA=STC`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return [];
    const html = await response.text();
    return parseDaumNewsResults(html);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

/** 다음 통합검색 */
async function fetchDaumSearch(keyword: string): Promise<ContentItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://search.daum.net/search?w=web&q=${encodeURIComponent(keyword + " K-pop")}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return [];
    const html = await response.text();
    return parseDaumSearchResults(html);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

/** YouTube Shorts 검색 */
async function fetchYouTubeShorts(keyword: string): Promise<ContentItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword + " shorts")}&sp=EgQQARgB`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return [];
    const html = await response.text();
    return parseYouTubeResults(html);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

function parseDaumNewsResults(html: string): ContentItem[] {
  const items: ContentItem[] = [];
  const seen = new Set<string>();

  // 다음 뉴스 검색 결과 패턴
  const regex = /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*class="[^"]*tit[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null && items.length < 8) {
    const url = match[1];
    const title = match[2].replace(/<[^>]+>/g, "").trim();
    if (!title || seen.has(url) || title.length < 5) continue;
    seen.add(url);
    items.push({
      type: "news",
      title,
      url,
      timeAgo: "최근 1주일",
      provider: "다음 뉴스",
    });
  }

  // 보조 패턴 — c-title-doc 클래스
  if (items.length < 3) {
    const regex2 = /class="c-title-doc"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = regex2.exec(html)) !== null && items.length < 8) {
      const url = match[1];
      const title = match[2].replace(/<[^>]+>/g, "").trim();
      if (!title || seen.has(url) || title.length < 5) continue;
      seen.add(url);
      items.push({ type: "news", title, url, timeAgo: "최근 1주일", provider: "다음 뉴스" });
    }
  }

  return items;
}

function parseDaumSearchResults(html: string): ContentItem[] {
  const items: ContentItem[] = [];
  const seen = new Set<string>();

  // 다음 통합검색 결과
  const regex = /class="[^"]*tit[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null && items.length < 5) {
    const url = match[1];
    const title = match[2].replace(/<[^>]+>/g, "").trim();
    if (!title || seen.has(url) || title.length < 5) continue;
    seen.add(url);
    items.push({
      type: "search",
      title,
      url,
      timeAgo: "",
      provider: "다음 검색",
    });
  }

  return items;
}

function parseYouTubeResults(html: string): ContentItem[] {
  const items: ContentItem[] = [];

  // ytInitialData에서 JSON 추출
  const dataMatch = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
  if (!dataMatch) return items;

  try {
    const data = JSON.parse(dataMatch[1]);
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) return items;

    for (const section of contents) {
      const videos = section?.itemSectionRenderer?.contents;
      if (!videos) continue;

      for (const item of videos) {
        if (items.length >= 5) break;

        // 일반 비디오 (Shorts 포함)
        const video = item?.videoRenderer;
        if (video) {
          const videoId = video.videoId;
          const title =
            video.title?.runs?.[0]?.text ?? video.title?.simpleText ?? "";
          const channel =
            video.ownerText?.runs?.[0]?.text ?? "";
          const thumb =
            video.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ?? "";

          if (videoId && title) {
            items.push({
              type: "youtube",
              title,
              url: `https://www.youtube.com/shorts/${videoId}`,
              timeAgo: "",
              thumbnail: thumb,
              provider: channel,
            });
          }
        }

        // Shorts용 reelShelfRenderer
        const reel = item?.reelShelfRenderer;
        if (reel?.items) {
          for (const ri of reel.items) {
            if (items.length >= 5) break;
            const reelItem = ri?.reelItemRenderer;
            if (!reelItem) continue;
            const videoId = reelItem.videoId;
            const title = reelItem.headline?.simpleText ?? "";
            const thumb =
              reelItem.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ?? "";
            if (videoId && title) {
              items.push({
                type: "youtube",
                title,
                url: `https://www.youtube.com/shorts/${videoId}`,
                timeAgo: "",
                thumbnail: thumb,
                provider: "YouTube Shorts",
              });
            }
          }
        }
      }
    }
  } catch {
    // JSON 파싱 실패 시 빈 배열 반환
  }

  return items;
}
