# Troubleshooting Reference

> 최적화 버전 v1.0

## 증상별 진단

| 증상 | 1차 확인 | 2차 확인 | 명령어 |
|------|---------|---------|--------|
| 흰 화면 | 콘솔 에러 | import 경로 | `npx tsc --noEmit` |
| 스타일 깨짐 | CSS 로드 | 클래스 충돌 | `npm run dev` |
| API 실패 | Network 탭 | CORS | `npm run server` |
| 무한 렌더링 | 의존성 배열 | 상태 로직 | React DevTools |
| 빌드 실패 | 타입 에러 | 의존성 버전 | `npm run build` |
| 서버 크래시 | 환경 변수 | 미들웨어 순서 | `npm run server` |

## 진단 명령어

```bash
# 순환 참조 검사
npx madge --circular src/

# TypeScript 검사
npx tsc --noEmit

# 린트 검사
npm run lint

# 전체 검증
npm run verify:all

# 의존성 감사
npm audit
```

## 일반적인 해결책

### 빌드 에러
```bash
rm -rf node_modules dist
npm install
npm run build
```

### 타입 에러
```bash
npx tsc --noEmit 2>&1 | head -20
```

### CORS 에러
- 외부 프록시 사용 금지
- 서버 CORS 설정 확인
- `/api/proxy` 사용

### 메모리 부족
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## 로그 위치

- Frontend: 브라우저 콘솔
- Backend: `server/logs/`
- Cloudflare: Wrangler tail
