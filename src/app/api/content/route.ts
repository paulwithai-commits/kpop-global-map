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
 * 통합 콘텐츠 API — 다음 뉴스 + 통합검색 + YouTube
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
      fetchYouTube(cleanKeyword),
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

/**
 * 다음 뉴스 검색 — 키워드 그대로, 최근 1주일, 인기순, 5개
 */
async function fetchDaumNews(keyword: string): Promise<ContentItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    // w=news: 뉴스탭, period=w: 최근 1주, sort=popular: 인기순
    const url = `https://search.daum.net/search?w=news&q=${encodeURIComponent(keyword)}&period=w&sort=popular&DA=STC`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return [];
    const html = await response.text();
    return parseDaumNewsResults(html, 5);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

/**
 * 다음 통합검색 — 키워드 그대로 (K-pop 등 접미어 붙이지 않음), 5개
 */
async function fetchDaumSearch(keyword: string): Promise<ContentItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    // 키워드 그대로 검색 — 접미어 없음
    const url = `https://search.daum.net/search?w=web&q=${encodeURIComponent(keyword)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return [];
    const html = await response.text();
    return parseDaumSearchResults(html, 5);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

/**
 * YouTube 검색 — 키워드 그대로, 인기순+최신순 조합, 10개
 * sp 파라미터: EgIQAQ== (조회수 정렬) 또는 CAISAhAB (인기+최신 조합)
 */
async function fetchYouTube(keyword: string): Promise<ContentItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    // 키워드 그대로 + 정렬: 조회수순(인기) — sp=CAMSAhAB → 동영상만+조회수순
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&sp=CAMSAhAB`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return [];
    const html = await response.text();
    return parseYouTubeResults(html, 10);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

/* ──────────────────────── 파서 함수들 ──────────────────────── */

function parseDaumNewsResults(html: string, maxCount: number): ContentItem[] {
  const items: ContentItem[] = [];
  const seen = new Set<string>();

  // 모든 a 태그에서 v.daum.net 뉴스 링크만 추출 (제목 10자 이상, 중복 제거)
  const allLinks = [...html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

  for (const m of allLinks) {
    if (items.length >= maxCount) break;
    const url = m[1];
    const title = m[2].replace(/<[^>]+>/g, "").trim();

    if (
      url.startsWith("http") &&
      url.includes("v.daum.net/v/") &&
      title.length >= 10 &&
      !seen.has(url)
    ) {
      seen.add(url);
      items.push({
        type: "news",
        title,
        url,
        timeAgo: "최근 1주일",
        provider: "다음 뉴스",
      });
    }
  }

  return items;
}

function parseDaumSearchResults(html: string, maxCount: number): ContentItem[] {
  const items: ContentItem[] = [];
  const seen = new Set<string>();

  // 패턴 1: 다음 통합검색 tit 클래스
  const regex1 = /class="[^"]*tit[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex1.exec(html)) !== null && items.length < maxCount) {
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

  // 패턴 2: 범용 링크 패턴
  if (items.length < maxCount) {
    const regex2 = /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*class="[^"]*f_link_b[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = regex2.exec(html)) !== null && items.length < maxCount) {
      const url = match[1];
      const title = match[2].replace(/<[^>]+>/g, "").trim();
      if (!title || seen.has(url) || title.length < 5) continue;
      seen.add(url);
      items.push({ type: "search", title, url, timeAgo: "", provider: "다음 검색" });
    }
  }

  return items;
}

function parseYouTubeResults(html: string, maxCount: number): ContentItem[] {
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
        if (items.length >= maxCount) break;

        // 일반 비디오
        const video = item?.videoRenderer;
        if (video) {
          const videoId = video.videoId;
          const title =
            video.title?.runs?.[0]?.text ?? video.title?.simpleText ?? "";
          const channel =
            video.ownerText?.runs?.[0]?.text ?? "";
          const thumb =
            video.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ?? "";
          // 조회수/게시일 정보 추출
          const viewText = video.viewCountText?.simpleText ?? "";
          const publishedText = video.publishedTimeText?.simpleText ?? "";
          const timeInfo = [publishedText, viewText].filter(Boolean).join(" · ");

          if (videoId && title) {
            items.push({
              type: "youtube",
              title,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              timeAgo: timeInfo,
              thumbnail: thumb,
              provider: channel,
            });
          }
        }

        // Shorts용 reelShelfRenderer
        const reel = item?.reelShelfRenderer;
        if (reel?.items) {
          for (const ri of reel.items) {
            if (items.length >= maxCount) break;
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
