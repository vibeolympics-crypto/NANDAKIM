/**
 * 브라우저 콘솔에서 테스트 용도로 YouTube RSS 프록시 확인
 * 사용법: console에서 다음 명령 실행
 * import { testYouTubeProxy } from '@/hooks/testYouTube';
 * testYouTubeProxy();
 */

export const testYouTubeProxy = async () => {
  const channelId = 'UCXuqSBlHAE6Xw-yeJA7Awn8'; // LinusTechTips
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  
  console.log('[TEST] YouTube RSS 테스트');
  console.log('[TEST] RSS URL:', rssUrl);

  // 1. AllOrigins 테스트
  console.log('\n=== AllOrigins CORS 프록시 테스트 ===');
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
    console.log('[TEST] Proxy URL:', proxyUrl.substring(0, 100) + '...');
    
    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
    const text = await response.text();
    
    console.log('[TEST] 상태:', response.status);
    console.log('[TEST] 응답 길이:', text.length);
    console.log('[TEST] 첫 500자:', text.substring(0, 500));
    
    // XML 파싱
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const entries = xmlDoc.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'entry');
    console.log('[TEST] 항목 수:', entries.length);
    
    if (entries.length > 0) {
      const firstEntry = entries[0];
      const titleElem = firstEntry.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'title')[0];
      const title = titleElem?.textContent;
      console.log('[TEST] 첫 번째 제목:', title);
    }
  } catch (err) {
    console.error('[TEST] AllOrigins 오류:', err);
  }

  // 2. RSS2JSON 테스트 (비교용)
  console.log('\n=== RSS2JSON 프록시 테스트 (비교용) ===');
  try {
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    console.log('[TEST] RSS2JSON URL:', rss2jsonUrl.substring(0, 100) + '...');
    
    const response = await fetch(rss2jsonUrl, { signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    
    console.log('[TEST] 상태:', response.status);
    console.log('[TEST] 응답:', data);
  } catch (err) {
    console.error('[TEST] RSS2JSON 오류:', err);
  }
};
