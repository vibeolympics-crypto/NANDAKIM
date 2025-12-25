# Validation Reference

> 최적화 버전 v1.0

## Quick Validation (5분)

모든 작업 후 필수 실행:

```bash
npm run build && npx tsc --noEmit && npm run lint
```

| 체크 | 통과 기준 |
|------|----------|
| Build | 에러 0 |
| Type | 에러 0 |
| Lint | 에러 0 |

## Full Validation (30분)

배포/PR 전 실행:

```bash
npm run test:run
npm run test:e2e
npm run security:check
npm run build && npm run preview
```

## Retry Protocol

```
1차 실패 → 원인 분석 → 수정
2차 실패 → 접근 방식 변경
3차 실패 → 중단 + 보고

[BLOCKED] {작업명}
- 시도: {방법}
- 원인: {추정}
- 대안: {제안}
```

## 검증 트리거

| 작업 | 수준 |
|------|-----|
| 단일 파일 | Quick |
| 복수 파일 | Quick |
| API 변경 | Quick + Security |
| 배포 | Full |

## 자동 검증 명령

```bash
# 전체 검증
npm run verify:all

# 보안 검사
npm run security:check

# 순환 참조
npx madge --circular src/
```
