# API Integration Reference

> 최적화 버전 v1.0

## API Client

**Primary**: `src/lib/apiClient.ts` (사용 권장)
- fetch 기반, 인터셉터, CSRF, 토큰 갱신 지원

**Legacy**: `src/lib/api.ts` (마이그레이션 필요)
- axios 기반, 기본 기능만

## 엔드포인트 구조

```
Frontend (Vite :8093)
    ↓
Backend (Express :3001)
    ├── /api/email
    ├── /api/content
    ├── /api/music
    ├── /api/news
    ├── /api/contact
    └── /api/social
    ↓
Cloudflare Workers
    ├── notion-blog (블로그)
    └── contact-form (문의)
```

## 환경 변수

```bash
VITE_API_BASE_URL=       # 백엔드 API
VITE_NOTION_BLOG_API_URL= # Notion 블로그
VITE_BLOG_RSS_URL=       # RSS 피드
```

## 에러 처리

```typescript
try {
  const data = await apiClient.get('/endpoint');
} catch (error) {
  if (error.status === 401) // 인증 만료
  if (error.status === 429) // Rate limit
  if (error.status >= 500)  // 서버 에러
}
```

## CORS 설정

- 외부 프록시 사용 금지
- 자체 프록시: `/api/proxy?url=...`
- 허용 origin: localhost:5173, localhost:8093, nandakim.pages.dev

## Rate Limiting

- 기본: 100 req/15min
- 인증 필요 API: 20 req/min
- 파일 업로드: 10 req/hour
