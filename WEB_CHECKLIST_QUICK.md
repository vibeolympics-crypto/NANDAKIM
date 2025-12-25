# Quick Checklist

> v2.2 | 5-10분 검증

## 필수 명령어

```bash
npm run build && npx tsc --noEmit && npm run lint
```

## 체크리스트

### Build
- [ ] 빌드 성공 (에러 0)
- [ ] 타입 체크 통과
- [ ] 린트 에러 없음

### Code
- [ ] 기존 기능 정상
- [ ] import 경로 정확
- [ ] 순환 참조 없음 (`npx madge --circular src/`)

### React
- [ ] Hook 최상위 호출
- [ ] 의존성 배열 정확
- [ ] cleanup 구현

### Style
- [ ] 레이아웃 정상
- [ ] 반응형 동작
- [ ] z-index 충돌 없음

### API
- [ ] 엔드포인트 정확
- [ ] 에러 처리 구현
- [ ] 외부 CORS 프록시 미사용

### Security
- [ ] API 키 하드코딩 없음
- [ ] console.log 민감정보 없음
- [ ] XSS 취약점 없음

### Commit
- [ ] 미사용 import 제거
- [ ] debug console.log 제거
- [ ] 주석 코드 정리

## Retry Protocol

```
1차 실패 → 원인 분석 → 수정
2차 실패 → 접근 변경
3차 실패 → 중단 + 보고
```

## 서버 테스트

```bash
npm run dev       # Frontend
npm run server    # Backend
npm run dev:full  # Both
```

---
**Full 검증?** → WEB_DEVELOPMENT_CHECKLIST.md
