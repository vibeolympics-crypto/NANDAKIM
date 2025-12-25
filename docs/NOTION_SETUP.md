# Notion API 연동 설정 가이드

## 1. Cloudflare Worker Secret 설정

### Contact Form Worker

```bash
cd "Contact Form"

# Secret 추가
wrangler secret put NOTION_API_KEY
# 프롬프트에 Notion API Key 입력

wrangler secret put NOTION_DATABASE_ID
# 프롬프트에 Contact Database ID 입력 (32자리)

# Worker 배포
wrangler deploy
```

### Blog Worker

```bash
cd notion-blog

# Secret 추가
wrangler secret put NOTION_API_KEY
# 프롬프트에 Notion API Key 입력

wrangler secret put NOTION_DATABASE_ID
# 프롬프트에 Blog Database ID 입력 (32자리)

# Worker 배포
wrangler deploy
```

## 2. Database ID 찾는 방법

Notion에서 Database 페이지 열기 → URL 확인:
```
https://notion.so/your-workspace/[DATABASE_ID]?v=...
                                  ↑ 32자리
```

## 3. Notion Database 속성 (필수)

### Contact Form Database
| 속성명 | 타입 | 용도 |
|--------|------|------|
| Name | Title | 이름 |
| Email | Email | 이메일 |
| Subject | Rich Text | 제목 |
| Message | Rich Text | 메시지 |
| Status | Select | 상태 (New/Read) |
| Date | Date | 접수일 |

### Blog Database
| 속성명 | 타입 | 용도 |
|--------|------|------|
| 제목 | Title | 글 제목 |
| Summary / AI 자동 입력 | Rich Text | 요약 |
| 게시일 / Date | Date | 게시 날짜 |
| 태그 / Tags | Multi-select | 태그 |
| URL | URL | 원본 링크 (선택) |

## 4. Integration 권한 확인

Notion Integration에서:
1. 해당 Database에 Connection 추가됨
2. Read/Write 권한 활성화

## 5. 테스트

### Contact Form 테스트
```bash
curl -X POST https://notion-contact-form.vibe-olympics.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","subject":"Test","message":"Test message"}'
```

### Blog API 테스트
```bash
curl https://notion-blog.vibe-olympics.workers.dev?limit=5
```

## 6. 환경변수 (.env)

```bash
VITE_CONTACT_API_URL=https://notion-contact-form.vibe-olympics.workers.dev
VITE_NOTION_BLOG_API_URL=https://notion-blog.vibe-olympics.workers.dev
```
