# Full Checklist

> v2.2 | 배포/PR 전 30-60분 검증

## 1. Build & Type

```bash
npm run build
npx tsc --noEmit
npm run lint
```

- [ ] 빌드 성공
- [ ] 타입 에러 0
- [ ] 린트 에러 0

## 2. Testing

```bash
npm run test:run
npm run test:coverage
npm run test:e2e
```

- [ ] 단위 테스트 통과
- [ ] E2E 테스트 통과
- [ ] 커버리지 충족

## 3. Security

```bash
npm run security:check
npm audit
```

- [ ] 취약점 없음
- [ ] 하드코딩 비밀 없음
- [ ] 외부 CORS 프록시 미사용
- [ ] XSS/CSRF 방지
- [ ] Rate limiting 활성

## 4. Performance

```bash
npm run lighthouse
npm run bundle:analyze
```

- [ ] Lighthouse 90+
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] 번들 크기 적정

## 5. Accessibility

```bash
npm run test:accessibility
```

- [ ] 키보드 네비게이션
- [ ] ARIA 라벨
- [ ] 색상 대비

## 6. Cross-Browser

```bash
npm run test:cross-browser
npm run test:devices
```

- [ ] Chrome/Firefox/Safari/Edge
- [ ] Desktop/Tablet/Mobile

## 7. Backend

```bash
npm run server
curl localhost:3001/api/health
```

- [ ] 서버 정상 시작
- [ ] API 응답 정상
- [ ] 미들웨어 순서 정확

## 8. Git

- [ ] 커밋 메시지 컨벤션
- [ ] 민감 데이터 미포함
- [ ] main과 충돌 없음

## 9. Deploy

- [ ] Staging 테스트 완료
- [ ] 롤백 계획 준비
- [ ] 환경 변수 확인

## Retry Protocol

```
1차 실패 → 분석 → 수정
2차 실패 → 접근 변경
3차 실패 → 중단 + 보고

[FULL-BLOCKED] {섹션}
- 항목: {실패}
- 시도: {방법}
- 영향: {위험도}
- 필요: {결정}
```

## Quick Commands

```bash
# Full validation
npm run build && npx tsc --noEmit && npm run lint
npm run test:run && npm run test:e2e
npm run security:check && npm run lighthouse
```

---
**Quick 검증만?** → WEB_CHECKLIST_QUICK.md
