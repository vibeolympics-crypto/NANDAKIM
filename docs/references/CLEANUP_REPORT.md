# Cleanup Report

> 생성일: 2025-12-25

## 식별된 문제

### 1. 중복 파일

| 파일 | 위치 | 상태 |
|------|-----|------|
| api.ts | src/lib/ | 마이그레이션 필요 |
| apiClient.ts | src/lib/ | 주 사용 (유지) |
| worker.js | Contact Form/ | 정리 대상 |
| worker.js | notion-blog/ | 정리 대상 |
| worker.js | workers/notion-blog-feed/ | 유지 (최신) |

### 2. 빈 파일 (tetris/)

- App.tsx (0 bytes)
- constants.ts (0 bytes)
- types.ts (0 bytes)

### 3. 빌드 아티팩트

- `.wrangler/tmp/` - 16개 임시 폴더
- `src/data/backups/` - 백업 데이터

### 4. 대용량 리소스

- `public/music/` - 122MB (36개 MP3)
- `dist/` - 124MB

## 수행된 정리

- [x] .gitignore 업데이트 (.wrangler, backups)
- [x] 참조 문서 최적화
- [ ] 중복 API 클라이언트 통합 (수동 필요)
- [ ] 중복 Worker 정리 (수동 필요)
- [ ] 빈 tetris 파일 정리 (수동 필요)

## 권장 작업

### 즉시 (Critical)

```bash
# .wrangler 삭제
rm -rf .wrangler/tmp/

# 백업 폴더 삭제
rm -rf src/data/backups/
```

### 단기 (High)

1. `api.ts` → `apiClient.ts` 마이그레이션
2. Worker 파일 통합
3. 빈 tetris 파일 삭제 또는 구현

### 중기 (Medium)

1. 음악 파일 CDN 이동
2. console.log 정리 (141개)
3. 미사용 의존성 제거
