# Architecture Reference

> 최적화 버전 v1.0

## 기술 스택

```yaml
Frontend: React 18, Vite 5, TypeScript
Backend: Express 5, Node 18+
UI: Tailwind, shadcn/ui, Radix UI
State: TanStack Query, React Context
Deploy: Cloudflare Pages/Workers
```

## 디렉토리 구조

```
src/
├── components/    # UI 컴포넌트
│   └── ui/        # shadcn/ui
├── pages/         # 라우트 페이지
├── hooks/         # 커스텀 훅 (24개)
├── contexts/      # React Context
├── services/      # API 서비스
├── lib/           # 유틸리티
│   ├── apiClient.ts  # API 클라이언트 (주 사용)
│   └── utils.ts      # cn() 등 헬퍼
├── types/         # 타입 정의
└── data/          # 정적 데이터

server/
├── routes/        # API 라우트
├── middleware/    # 보안 미들웨어
├── services/      # 비즈니스 로직
└── config/        # 환경 설정
```

## 미들웨어 순서 (Backend)

```
1. Helmet (보안 헤더)
2. CORS
3. Rate Limiting
4. CSRF
5. Sanitization
6. Routes
7. Error Handler
```

## 데이터 흐름

```
Component → Hook → apiClient → Express → Service → Response
                                  ↓
                           Cloudflare Worker (선택)
```

## Path Alias

`@` → `./src`

```typescript
import { Button } from '@/components/ui/button';
```

## 포트

- Frontend: 8093
- Backend: 3001
