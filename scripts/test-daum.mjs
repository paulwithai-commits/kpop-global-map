// YouTube 검색 결과 테스트
const kw = "BTS";
const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(kw)}&sp=CAMSAhAB`;
const res = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9",
  },
});
const html = await res.text();
console.log("HTML 크기:", html.length);

// ytInitialData 추출
const dataMatch = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
if (!dataMatch) {
  console.log("❌ ytInitialData 없음");
  // 다른 패턴 시도
  const alt = html.match(/ytInitialData["\s]*=["\s]*({[\s\S]*?});\s*(?:window|<\/script>)/);
  console.log("대안 패턴:", alt ? "찾음" : "없음");
  // HTML 일부 출력
  const idx = html.indexOf("ytInitialData");
  if (idx > -1) {
    console.log("ytInitialData 위치:", idx);
    console.log(html.substring(idx, idx + 200));
  }
} else {
  try {
    const data = JSON.parse(dataMatch[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) {
      console.log("❌ contents 경로 없음");
      console.log("data.contents keys:", Object.keys(data?.contents || {}));
    } else {
      let count = 0;
      for (const section of contents) {
        const videos = section?.itemSectionRenderer?.contents;
        if (!videos) continue;
        for (const item of videos) {
          const video = item?.videoRenderer;
          if (video && count < 5) {
            count++;
            const title = video.title?.runs?.[0]?.text ?? "";
            const videoId = video.videoId;
            const channel = video.ownerText?.runs?.[0]?.text ?? "";
            console.log(`${count}. ${title}`);
            console.log(`   → https://youtube.com/watch?v=${videoId} (${channel})`);
          }
        }
      }
      console.log(`\n✅ 총 ${count}건 추출`);
    }
  } catch (e) {
    console.log("JSON 파싱 에러:", e.message);
  }
}
