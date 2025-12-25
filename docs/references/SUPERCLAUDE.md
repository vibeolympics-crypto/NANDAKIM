# SuperClaude Reference

> 설치일: 2025-12-25 | v4.1.9

## 설치 위치

```
~/.claude/
├── commands/      # 30개 슬래시 명령어
├── agents/        # 16개 전문 에이전트
├── modes/         # 7가지 행동 모드
├── core/          # 핵심 시스템
├── hooks/         # 이벤트 훅
├── mcp/           # MCP 서버 설정
└── CLAUDE.md      # SuperClaude 컨텍스트
```

## 주요 명령어

### Development
| 명령어 | 설명 |
|--------|------|
| `/sc:build` | 프로젝트 빌드 |
| `/sc:implement` | 코드 구현 |
| `/sc:improve` | 코드 개선 |
| `/sc:cleanup` | 코드 정리 |

### Analysis
| 명령어 | 설명 |
|--------|------|
| `/sc:analyze` | 코드 분석 |
| `/sc:explain` | 코드 설명 |
| `/sc:research` | 웹 리서치 |
| `/sc:brainstorm` | 브레인스토밍 |

### Planning
| 명령어 | 설명 |
|--------|------|
| `/sc:pm` | 프로젝트 관리 |
| `/sc:design` | 설계 |
| `/sc:estimate` | 작업량 추정 |
| `/sc:document` | 문서화 |

### Testing
| 명령어 | 설명 |
|--------|------|
| `/sc:test` | 테스트 작성 |
| `/sc:reflect` | 자기 검토 |

### Utility
| 명령어 | 설명 |
|--------|------|
| `/sc:help` | 도움말 |
| `/sc:git` | Git 작업 |
| `/sc:save` | 상태 저장 |
| `/sc:load` | 상태 로드 |

## 전문 에이전트

| 에이전트 | 역할 |
|----------|------|
| `pm-agent` | 프로젝트 관리자 |
| `backend-architect` | 백엔드 설계 |
| `frontend-architect` | 프론트엔드 설계 |
| `security-engineer` | 보안 전문가 |
| `performance-engineer` | 성능 최적화 |
| `quality-engineer` | 품질 관리 |
| `deep-research-agent` | 심층 조사 |
| `socratic-mentor` | 학습 가이드 |

## 행동 모드

| 모드 | 용도 |
|------|------|
| Brainstorming | 아이디어 발상 |
| Business Panel | 비즈니스 관점 검토 |
| Deep Research | 심층 조사 (5단계) |
| Orchestration | 다중 에이전트 조정 |
| Token Efficiency | 토큰 절약 |
| Task Management | 작업 관리 |
| Self-Reflection | 자기 성찰 |

## 사용 예시

```bash
# 프로젝트 분석
/sc:analyze "현재 프로젝트 구조 분석"

# 브레인스토밍
/sc:brainstorm "API 연동 방식"

# 구현
/sc:implement "사용자 인증 기능"

# 리서치
/sc:research "React 18 best practices"

# 프로젝트 관리
/sc:pm "스프린트 계획"
```

## MCP 서버 (선택)

```bash
superclaude mcp --list              # 사용 가능 서버
superclaude mcp --servers tavily    # Tavily 설치
superclaude mcp                     # 설정
```

**사용 가능 서버:**
- Tavily (웹 검색)
- Context7 (문서)
- Sequential (추론)
- Playwright (자동화)

## 문제 해결

### Windows 인코딩 오류
```powershell
$env:PYTHONIOENCODING = "utf-8"
```

### PATH 업데이트
```powershell
$env:PATH += ";C:\Users\WON\.local\bin"
```

## Sources

- [SuperClaude GitHub](https://github.com/SuperClaude-Org/SuperClaude_Framework)
- [설치 가이드](https://github.com/SuperClaude-Org/SuperClaude_Framework/blob/master/docs/getting-started/installation.md)
- [PyPI](https://pypi.org/project/superclaude/)
