# Multi-Review — ai-ax-academy-application 기능 검증

## 2026-07-01 — "모든 기능이 정상 작동하는가"

**대상:** 라이브 https://ai-ax-academy-application.vercel.app (master @ f112e7c) + `index.html`(22MB standalone), `api/apply.js`, `api/sponsors.js`, `google-apps-script.js`

**로스터 & 1줄 판정**
| # | 리뷰어 | 판정 |
|---|--------|------|
| 1 | Opus 4.8 (deep architect) | 오늘 happy-path는 작동하나 3개 구조적 silent-failure + 22MB 운영 부담. conf 0.82 |
| 2 | Sonnet 4.6 (correctness) | happy-path 정상, 단 webhook 비-JSON 200 시 거짓 성공 버그 확정 + 인젝션/ZWSP. conf 0.72 |
| 3 | Haiku 4.5 (checklist) | PASS 88% — 커버리지 충족, CSV/webhook 에러 비대칭·타임아웃 미설정 |
| 4 | Codex (empirical) | 실행 시간 초과로 백그라운드 분리; 오케스트레이터가 curl 실증으로 대체 수행 |
| 5 | Codex-DA (red team) | "curl 통과 ≠ 작동": 무인증 쓰기 스팸·에러 은폐·22.7MB 모바일·프로덕션 오염 검증방식. conf 0.86 |

**실증(라이브 curl / UI):** sponsors GET→200(3명); apply 정상→200; apply 빈값→400; apply GET→405; UI 제출→성공+초기화; 후원자 토글→3명 렌더; 잘못된 Content-Type→400(오해 메시지); **수식 인젝션 `=..`→200 시트 저장**; 루트 전송 **16.8MB(압축 후)**; 콘솔에러=favicon 404.

**결정:** 기능적으로 **오늘 작동함(happy-path 만장일치 PASS)**. 그러나 **견고성 미흡** — 잠복 치명 버그 1(거짓 성공), 확인된 보안 1(수식 인젝션), silent-failure 다수.

**최우선 조치(Opus·Sonnet 독립 수렴):** `api/apply.js:40`
`if (!sheetResponse.ok || result.ok === false)` → `if (!sheetResponse.ok || result.ok !== true)`

**수용된 트레이드오프:** 저트래픽 랜딩이므로 rate-limit/캡차 부재는 당장은 허용 가능(관찰 필요).

**DA 환원 옵션(재평가 후보):** name+email 수집이면 22MB 커스텀 대신 Google Form로 대체 가능 — 브랜딩 랜딩이 필수일 때만 현 구조 유지.
