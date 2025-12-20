/**
 * 브라우저 콘솔에서 테스트 용도로 YouTube RSS 자체 프록시 확인
 * 사용법: console에서 다음 명령 실행
 * import { testYouTubeProxy } from '@/hooks/testYouTube';
 * testYouTubeProxy();
 */

// API 베이스 URL (개발/프로덕션 환경 지원)
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const testYouTubeProxy = async () => {
  const channelId = 'UCXuqSBlHAE6Xw-yeJA7Awn8'; // LinusTechTips

  console.log('[TEST] YouTube RSS 자체 프록시 테스트');
  console.log('[TEST] Channel ID:', channelId);

  // 자체 프록시 테스트
  console.log('\n=== 자체 프록시 테스트 ===');
  try {
    const proxyUrl = `${API_BASE}/api/proxy/youtube?channelId=${channelId}`;
    console.log('[TEST] Proxy URL:', proxyUrl);

    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
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

    console.log('[TEST] 자체 프록시 테스트 완료');
  } catch (err) {
    console.error('[TEST] 자체 프록시 오류:', err);
  }
};
