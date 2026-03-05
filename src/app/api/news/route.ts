import { NextRequest, NextResponse } from "next/server";

interface ParsedArticle {
  title: string;
  url: string;
  timeAgo: string;
  provider: string;
}

/**
 * 다음 엔터테인먼트 메인 페이지에서 키워드 관련 뉴스를 크롤링
 * - 크롤링 대상: https://entertain.daum.net/
 * - 기사 URL 패턴: https://v.daum.net/v/
 */
export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: "keyword 파라미터가 필요합니다" },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://entertain.daum.net/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const articles = parseArticles(html, keyword);

    return NextResponse.json(
      {
        keyword,
        articles: articles.slice(0, 5),
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("뉴스 크롤링 에러:", error);
    return NextResponse.json(
      { error: "뉴스를 가져오는 데 실패했습니다" },
      { status: 500 }
    );
  }
}

function parseArticles(html: string, keyword: string): ParsedArticle[] {
  const articles: ParsedArticle[] = [];
  const seen = new Set<string>();

  // class="link_txt valid_link" 패턴에서 기사 추출
  // href="https://v.daum.net/v/20260305143701137" class="link_txt valid_link" ... data-tiara-provider="MBC연예" ...>제목텍스트
  const regex =
    /href="(https:\/\/v\.daum\.net\/v\/\d+)"\s+class="link_txt valid_link"[^>]*data-tiara-provider="([^"]*)"[^>]*>([^<]+)/g;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    const provider = match[2];
    const title = match[3].trim();

    // 중복 제거
    if (seen.has(url)) continue;
    seen.add(url);

    // 키워드 매칭 (대소문자 무시)
    const lowerTitle = title.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // 키워드에서 괄호 안 텍스트 제거 (예: "블랙핑크 (Wiki #1)" → "블랙핑크")
    const cleanKeyword = lowerKeyword.replace(/\s*\(.*?\)\s*/g, "").trim();

    // data-tiara-custom 의 clusterTitle에서도 키워드 매칭 시도
    // 제목에 키워드가 포함되어 있는지 확인
    if (
      lowerTitle.includes(cleanKeyword) ||
      matchKeywordVariants(lowerTitle, cleanKeyword)
    ) {
      // URL에서 시간 추출 (20260305143701137 → 2026-03-05 14:37)
      const timeAgo = extractTimeAgo(url);

      articles.push({ title, url, timeAgo, provider });
    }
  }

  // clusterTitle에서도 검색 (더 넓은 범위)
  if (articles.length < 3) {
    const clusterRegex =
      /href="(https:\/\/v\.daum\.net\/v\/\d+)"\s+class="link_txt valid_link"[^>]*data-tiara-custom="[^"]*clusterTitle=([^"&]*)"[^>]*data-tiara-provider="([^"]*)"[^>]*>([^<]+)/g;

    // 만약 위 regex가 안 맞으면 provider가 앞에 올 수 있으므로 다른 패턴도 시도
    const clusterRegex2 =
      /href="(https:\/\/v\.daum\.net\/v\/\d+)"\s+class="link_txt valid_link"[^>]*data-tiara-provider="([^"]*)"[^>]*data-tiara-custom="[^"]*clusterTitle=([^"&]*)"[^>]*>([^<]+)/g;

    for (const re of [clusterRegex, clusterRegex2]) {
      re.lastIndex = 0;
      while ((match = re.exec(html)) !== null) {
        const url = re === clusterRegex ? match[1] : match[1];
        const clusterTitle = re === clusterRegex ? match[2] : match[3];
        const provider = re === clusterRegex ? match[3] : match[2];
        const title = re === clusterRegex ? match[4] : match[4];

        if (seen.has(url)) continue;

        const cleanKeyword = keyword
          .toLowerCase()
          .replace(/\s*\(.*?\)\s*/g, "")
          .trim();

        if (
          clusterTitle.toLowerCase().includes(cleanKeyword) ||
          matchKeywordVariants(
            clusterTitle.toLowerCase(),
            cleanKeyword
          )
        ) {
          seen.add(url);
          const timeAgo = extractTimeAgo(url);
          articles.push({ title: title.trim(), url, timeAgo, provider });
        }
      }
    }
  }

  return articles;
}

/**
 * K-pop 키워드 변형 매칭
 * 예: "BLACKPINK" → "블랙핑크", "BTS" → "방탄소년단"
 */
function matchKeywordVariants(text: string, keyword: string): boolean {
  const variants: Record<string, string[]> = {
    blackpink: ["블랙핑크", "blackpink", "black pink"],
    bts: ["방탄소년단", "bts", "비티에스"],
    "stray kids": ["스트레이 키즈", "스트레이키즈", "stray kids"],
    newjeans: ["뉴진스", "newjeans", "new jeans"],
    "le sserafim": ["르세라핌", "le sserafim"],
    ive: ["아이브", "ive"],
    aespa: ["에스파", "aespa"],
    twice: ["트와이스", "twice"],
    "k-pop": ["kpop", "k-pop", "케이팝"],
    txt: ["투모로우바이투게더", "txt"],
    enhypen: ["엔하이픈", "enhypen"],
    itzy: ["있지", "itzy"],
    nmixx: ["엔믹스", "nmixx"],
    "seventeen": ["세븐틴", "seventeen"],
    exo: ["엑소", "exo"],
    got7: ["갓세븐", "got7"],
  };

  // 키워드와 일치하는 변형 찾기
  for (const [key, alts] of Object.entries(variants)) {
    if (keyword.includes(key) || alts.some((alt) => keyword.includes(alt))) {
      // 텍스트에 변형 중 하나라도 포함되어 있는지 확인
      if (alts.some((alt) => text.includes(alt)) || text.includes(key)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * URL에서 시간 정보 추출
 * 예: https://v.daum.net/v/20260305143701137 → "2시간 전"
 */
function extractTimeAgo(url: string): string {
  const match = url.match(/\/v\/(\d{14})/);
  if (!match) return "";

  const dateStr = match[1];
  const year = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(4, 6)) - 1;
  const day = parseInt(dateStr.slice(6, 8));
  const hour = parseInt(dateStr.slice(8, 10));
  const minute = parseInt(dateStr.slice(10, 12));

  const articleDate = new Date(year, month, day, hour, minute);
  const now = new Date();
  const diffMs = now.getTime() - articleDate.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return `${articleDate.getMonth() + 1}/${articleDate.getDate()}`;
}
