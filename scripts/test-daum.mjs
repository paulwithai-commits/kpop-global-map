const res = await fetch('https://search.daum.net/search?w=news&q=BTS&period=w&sort=popular&DA=STC', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9'
  }
});
const html = await res.text();

// a태그에서 href와 텍스트 추출
const aTags = [...html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
const filtered = aTags
  .map(m => ({ url: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
  .filter(a => a.text.length > 10)
  .filter(a => !a.url.includes('dic.daum'))
  .filter(a => !a.url.includes('100.daum'))
  .filter(a => !a.url.includes('search.daum'));

console.log('=== 뉴스 링크 후보 ===');
filtered.slice(0, 25).forEach(a => console.log(a.text.substring(0,60), '\n  →', a.url.substring(0,100), '\n'));

// news 관련 클래스/ID 확인
console.log('\n=== news 관련 클래스 ===');
const newsClasses = [...html.matchAll(/class="([^"]*news[^"]*)"/gi)].map(m => m[1]);
console.log([...new Set(newsClasses)].slice(0, 20));

// HTML의 특정 구간 확인
console.log('\n=== HTML 사이즈 ===', html.length);
