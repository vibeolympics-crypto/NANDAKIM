# Notion Blog Feed 설정 가이드

> Cloudflare Workers를 사용하여 Notion 데이터베이스의 블로그 게시물을 포트폴리오에 연동하는 방법

---

## 개요

```
[포트폴리오]                    [Cloudflare Worker]              [Notion]
BlogSNSSection  ─────────>  notion-blog-feed.workers.dev  ─────>  Database
     │                              │
     │                              ├── NOTION_API_KEY (secret)
     │                              └── NOTION_DATABASE_ID (env)
     v
   블로그 카드 렌더링
```

---

## 1단계: Notion 설정

### 1.1 블로그 데이터베이스 생성

Notion에서 새 데이터베이스를 생성하고 다음 속성을 추가합니다:

| 속성 이름 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| Title | Title | O | 블로그 제목 (기본 제목 속성) |
| Summary | Text | - | 게시물 요약 |
| Date | Date | O | 작성일 (정렬 기준) |
| Status | Select | - | Published / Draft |
| Tags | Multi-select | - | 태그 목록 |
| Thumbnail | Files | - | 커버 이미지 |
| URL | URL | - | 외부 링크 (선택) |
| Author | Text / Person | - | 작성자 |

### 1.2 데이터베이스 ID 확인

1. 브라우저에서 데이터베이스 페이지 열기
2. URL에서 데이터베이스 ID 복사:
   ```
   https://www.notion.so/{workspace}/{database_id}?v={view_id}
                                    ^^^^^^^^^^^^
                                    이 부분이 DATABASE_ID
   ```

### 1.3 Notion Integration 생성

1. [Notion Developers](https://www.notion.so/my-integrations) 접속
2. "New integration" 클릭
3. 이름 입력 (예: "Portfolio Blog Feed")
4. 권한 설정:
   - Content Capabilities: Read content
   - User Capabilities: No user information
5. "Submit" 클릭
6. **Internal Integration Token** 복사 (secret_xxx 형식)

### 1.4 데이터베이스에 Integration 연결

1. Notion에서 블로그 데이터베이스 열기
2. 우측 상단 "..." > "Connections" > "Add connections"
3. 생성한 Integration 선택

---

## 2단계: Cloudflare Worker 배포

### 2.1 Wrangler CLI 설치

```bash
npm install -g wrangler
wrangler login
```

### 2.2 Worker 배포

```bash
cd workers/notion-blog-feed
wrangler deploy
```

### 2.3 Secrets 설정

```bash
# Notion API 키 설정
wrangler secret put NOTION_API_KEY
# 프롬프트에서 secret_xxx... 입력

# 데이터베이스 ID 설정
wrangler secret put NOTION_DATABASE_ID
# 프롬프트에서 데이터베이스 ID 입력
```

### 2.4 환경 변수 설정 (wrangler.toml)

```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://your-domain.com,https://www.your-domain.com"
```

### 2.5 프로덕션 배포

```bash
wrangler deploy --env production
```

---

## 3단계: 포트폴리오 설정

### 3.1 환경 변수 추가

`.env` 파일에 Worker URL 추가:

```bash
VITE_NOTION_BLOG_API_URL=https://notion-blog-feed.your-account.workers.dev
```

### 3.2 빌드 및 배포

```bash
npm run build
# Cloudflare Pages 또는 선호하는 호스팅에 배포
```

---

## 데이터베이스 스키마 예시

### 권장 속성

```
+-----------------+---------------+------------------------+
| 속성            | 타입          | 예시                    |
+-----------------+---------------+------------------------+
| Title           | Title         | "React 18 새 기능 정리" |
| Summary         | Text          | "Concurrent 렌더링..."  |
| Date            | Date          | 2024-01-15             |
| Status          | Select        | Published              |
| Tags            | Multi-select  | React, Frontend        |
| Thumbnail       | Files         | cover.jpg              |
| URL             | URL           | https://blog.example   |
| Author          | Text          | Won Kim                |
+-----------------+---------------+------------------------+
```

### Status 옵션

- `Published` 또는 `발행됨`: API에서 반환
- `Draft` 또는 `초안`: API에서 제외

---

## API 응답 형식

### 성공 응답

```json
{
  "success": true,
  "posts": [
    {
      "id": "page-uuid",
      "title": "블로그 제목",
      "summary": "게시물 요약...",
      "date": "2024-01-15",
      "tags": ["React", "Frontend"],
      "thumbnail": "https://...",
      "url": "https://...",
      "author": "Won Kim",
      "status": "Published"
    }
  ],
  "total": 10,
  "hasMore": false
}
```

### 에러 응답

```json
{
  "success": false,
  "error": "에러 메시지",
  "posts": []
}
```

---

## 문제 해결

### CORS 오류

```
Access to fetch has been blocked by CORS policy
```

**해결:** `wrangler.toml`의 `ALLOWED_ORIGINS`에 프론트엔드 도메인 추가

### 401 Unauthorized

```json
{"error": "Notion API error: 401"}
```

**해결:**
1. Integration Token이 올바른지 확인
2. 데이터베이스에 Integration이 연결되었는지 확인

### 빈 결과

```json
{"posts": [], "total": 0}
```

**해결:**
1. 데이터베이스에 게시물이 있는지 확인
2. Status가 "Published"인 게시물이 있는지 확인
3. Date 속성이 설정되었는지 확인

### Fallback 동작

Notion API 실패 시 자동으로 `/blog.json` 정적 파일로 fallback됩니다.
개발 중이거나 Worker 미설정 시에도 블로그가 표시됩니다.

---

## 보안 참고사항

1. **API 키 보호**: `NOTION_API_KEY`는 반드시 Cloudflare Secrets로 관리
2. **CORS 제한**: 프로덕션에서는 허용된 Origin만 설정
3. **읽기 전용**: Integration에 읽기 권한만 부여
4. **민감 정보**: 블로그에 민감한 정보 포함 금지

---

## 관련 문서

- [Notion API Documentation](https://developers.notion.com/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Contact Form 설정](./NOTION_INTEGRATION_GUIDE.md) (유사한 구조)
