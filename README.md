# MindCanvas Certification Platform

**AI+X 교육 → AppCanvas 앱 등록 → 살아있는 인증서** 발급을 잇는 웹 플랫폼 MVP.

MindCanvas의 전략 문서(`docs/strategy/`)에 정의된 다음 개념을 그대로 구현합니다.

- **5단계 인증 체계** (Lv.0 Explorer ~ Lv.4 Leader)
- **Lv.2 Creator 심사**: 3영역 × 3항목 = **9항목 체크리스트** (통과 / 보완 / 미달)
- **살아있는 인증서 (Living Certificate)**: 인증서에 앱 실행 링크가 포함되어, 링크를 누르면 인증자가 만든 앱을 즉시 체험 가능
- **AppCanvas 연동**: Lv.2 통과 시 `canvasSeed = true`로 Seed 크리에이터 자격 자동 부여

---

## 화면 구성

| 경로 | 역할 | 설명 |
| --- | --- | --- |
| `/` | 공용 | 플랫폼 소개 · 레벨 체계 · 심사 기준 |
| `/login` | 공용 | 시드 사용자로 역할 전환 (MVP 단계의 데모 로그인) |
| `/learner` | 학습자 | 수강 과정, 내 앱, 내 인증서 대시보드 |
| `/learner/submit` | 학습자 | 앱 등록 + Lv.2 심사 요청 (팀원·역할 포함) |
| `/reviewer` | 심사관 | 심사 대기열 + 완료 내역 |
| `/reviewer/[id]` | 심사관 | 9항목 체크리스트 심사 화면 (iframe 실시간 시연 포함) |
| `/apps` | 공용 | 인증된 AppCanvas 앱 마켓플레이스 |
| `/apps/[slug]` | 공용 | 앱 상세 + iframe 실행 |
| `/cert/[slug]` | 공용 | **살아있는 인증서** — 앱이 iframe으로 임베드됨 |
| `/verify?cert=…` | 공용 | 인증번호 기반 위·변조 검증 |

---

## 구동

요구: Node.js 20+, npm.

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

접속: http://localhost:3000

> `.env`는 저장소에 포함되어 있습니다 (SQLite 로컬 경로만 담긴 비(非)비밀 파일).
> 프로덕션 시크릿은 `.env.local`에 두세요 (gitignore 됨).

로그인 페이지(`/login`)에서 다음 시드 계정 중 하나를 선택해 로그인:

- `admin@mindcanvas.kr` — 관리자
- `reviewer@mindcanvas.kr` — 심사관 (MindCanvas 내부)
- `prof.nurse@univ.kr` — 도메인 전문가 (간호학)
- `nurse.kim@hospital.kr` — 학습자 (간호학, 샘플 인증서 보유)
- `tax.lee@office.kr` — 학습자 (세무)

샘플 인증서: `/cert/<publicSlug>` — `MC-2026-N-0001` 을 `/verify`에서 조회하면 접근 가능.

---

## 데이터 모델 요약

```
User ─┬─ Enrollment ── Course
      ├─ authoredApps (AppCanvas)
      ├─ certificates (Certificate)
      ├─ submissions  (Submission)        ⇢ lead learner
      └─ SubmissionTeamMember (role)      ⇢ team participation

AppCanvas ─┬─ Submission ── Review (9 items + 강점/보완/등록권고 + overall)
           └─ Certificate (LV2부터 연결)

Certificate
  · certNumber  MC-YYYY-{DomainLetter}-{Seq4}
  · publicSlug  공개 URL(짧은 랜덤)
  · level       LV0..LV4
  · teamRole    팀 프로젝트 시 개인 역할
  · app         살아있는 인증서의 “실행 가능한 증거”
```

### Lv.2 심사 → 인증서 자동 발급 규칙 (`app/reviewer/[id]/actions.ts`)
- 9개 항목 모두 **통과** → `overall = PASS` → Submission/App APPROVED, 팀원 전원에 **개별 인증서 발급**, 앱 `canvasSeed = true`
- 1개 이상 **보완** (미달 없음) → `CONDITIONAL` (2주 내 재심사)
- 1개 이상 **미달** → `REJECTED`

팀 프로젝트도 인증은 항상 **개인별 발급**이며, 인증서에 팀명과 개인 역할이 함께 기재됩니다.

---

## 다음 단계 (로드맵)

1. **실인증**: NextAuth + 이메일/SSO 교체
2. **QWUS 엔진**: `AppUsage` 수집 → Quality Multiplier 계산 → Lv.3/Lv.4 자동 승급
3. **앱 샌드박스 강화**: 프로덕션에서는 iframe 대신 CSP 격리 실행 환경
4. **QR 생성 내재화**: 외부 서비스 대신 자체 라이브러리
5. **심사자 2인 동시 서명**: 현재는 단일 폼 — Reviewer1/Reviewer2 각자 서명 플로우 추가
6. **재심사 플로우**: CONDITIONAL 상태의 2주 타이머 + 재심사 트리거

---

## 전략 문서

원본: [`docs/strategy/`](docs/strategy/)
- `AppCanvas_전략문서_2026.pdf` — AppCanvas 전체 전략
- `MindCanvas_AIX_인증체계_설계문서.docx` — 5단계 인증 체계 설계
- `Lv2_Creator_심사_체크리스트.docx` — 9항목 체크리스트 원본
- `lv2_assessment_criteria.html` — 심사 기준 임베드용 HTML
- `extracted/*.txt` — 텍스트 추출본 (개발 참조용)
