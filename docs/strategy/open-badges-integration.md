# MindCanvas ↔ Open Badges 연계 전략

## 1. 왜 Open Badges인가

**Open Badges**는 IMS Global(현재 1EdTech)에서 관리하는 디지털 배지/인증 국제 표준이다. 2024년부터는 **W3C Verifiable Credentials v2와 정합된 Open Badges 3.0(OBv3)** 가 정식 스펙이며, LinkedIn · Credly · Badgr · Canvas · Moodle 등 주요 학습·커리어 플랫폼이 이 형식을 표준으로 수입(import)한다.

MindCanvas의 **"살아있는 인증서"** 는 발급 주체(Issuer), 수여자(Recipient), 근거(Evidence), 기준(Criteria), 검증 URL(Verification)이 이미 모두 갖춰져 있기 때문에 Open Badges 호환 발급이 구조적으로 자연스럽다. 별도 스키마 변경 없이 **표현 형식만 한 겹 더**하면 된다.

### 전략적 이득
| 기존 (MindCanvas 단독) | Open Badges 연계 후 |
| --- | --- |
| 인증서 URL을 공유해도 LinkedIn/HR ATS가 "자격증"으로 인식 못 함 | LinkedIn "Add to profile"에 한 번에 수입, HR ATS가 표준 필드로 파싱 |
| 위조 검증은 MindCanvas 도메인에서만 가능 | Open Badges Validator 등 범용 도구로 제3자 검증 |
| 포트폴리오 이동 시 스크린샷·링크 필요 | JSON-LD 한 파일 또는 PNG 한 장으로 포트폴리오 이동 |
| MindCanvas 플랫폼 의존 | 발급은 MindCanvas, 보관은 학습자 개인 지갑(Wallet) — 분리 가능 |

---

## 2. 적용 스펙 — OBv3 (W3C VC 호환)

**결정**: 신규 발급은 **Open Badges 3.0** 기본, 필요 시 OBv2 어시션을 레거시 호환으로 병행.

OBv3 선택 이유:
1. LinkedIn이 2024~2025년 OBv3 수입을 정식 지원 시작 (OBv2도 당분간 유지)
2. W3C Verifiable Credentials와 같은 포맷이라 **미래 디지털 자격 지갑(EBSI, mDL 등) 호환**
3. JSON-LD 기반이라 AI 에이전트가 의미 기반으로 자격 해석 가능

OBv3 핵심 엔티티 매핑:

| Open Badges 3.0 | MindCanvas 모델 | 비고 |
| --- | --- | --- |
| `Profile` (Issuer) | 주식회사 마인드캔버스 단일 Issuer | 고정 프로필 |
| `Achievement` (BadgeClass) | `CertLevel` × 5 (LV0~LV4) | 레벨별 1개의 Achievement |
| `AchievementCredential` (Assertion) | `Certificate` 1건 | 1:1 매핑 |
| `criteria` | `LEVEL_META[lv].description` + Lv.2 체크리스트 9항목 | 수여 기준 내러티브 |
| `evidence` | 살아있는 인증서 URL + 앱 `runUrl` | **"링크 클릭 → 실제 앱 실행"이 Open Badges evidence로 들어감** — 이게 MindCanvas 고유 가치 |
| `credentialSubject.id` | `mailto:<recipient.email>` 또는 DID | 초기에는 mailto 사용 |
| 검증 방식 | Hosted verification (기본) / Signed proof (Phase 2) | 우선 호스팅 검증만으로 OBv3 스펙 준수 가능 |

---

## 3. 단계별 도입 로드맵

### Phase 1 — 자체 발급 (이번 구현) ✅
MindCanvas 도메인에서 OBv3 호환 JSON-LD를 직접 서빙.
- `GET /api/openbadge/issuer` → Profile
- `GET /api/openbadge/badgeclass/[level]` → Achievement per level
- `GET /api/openbadge/assertion/[certNumber]` → AchievementCredential
- `/cert/[slug]` 페이지에 "Open Badge로 받기" 섹션: JSON 다운로드 · URL 복사 · LinkedIn Add-to-Profile 버튼
- 검증 방식: **Hosted verification** (MindCanvas가 해당 URL에서 JSON을 서빙하는 것 자체가 유효성의 근거)

### Phase 2 — 서명된 VC
- JWS(JSON Web Signature) 또는 Linked Data Proof 추가
- DID 발행(`did:web:mindcanvas.kr`) → 수여자는 `did:key` 또는 `did:jwk`
- 오프라인 검증 가능 → 수여자가 MindCanvas 도메인 없어도 자격 증명

### Phase 3 — 외부 플랫폼 푸시
선택 가능한 타깃 (우선순위 제안):
1. **Credly (LinkedIn Certification)** — 최우선. 한국 기업/대학에서 가장 많이 수입. Credly API로 issue 시 자동 푸시. 수여자는 Credly 지갑 생성 후 LinkedIn 동기화.
2. **Canvas Badges (오픈소스 Badgr 기반)** — 대학이 Canvas LMS 쓰는 경우. 무료, 자체 호스팅 가능.
3. **Open Badge Factory** — 유럽 대학 중심. 우선순위 낮음.
4. **Blockcerts (블록체인 앵커)** — 고위험/고가치 자격(Lv.4 Leader)에만 선택 적용.

### Phase 4 — 배지 이미지 베이킹
OBv2 PNG baking 방식으로, 배지 이미지 자체에 credential JSON을 iTXt 청크로 삽입.
→ 이미지 한 장만 받아도 자격 정보가 따라감. 포트폴리오/이메일 첨부용.

### Phase 5 — 크리덴셜 지갑 연동
- EBSI (유럽 블록체인 서비스 인프라) / W3C DIDComm
- 수여자가 개인 Wallet 앱(예: Lissi, Trinsic, Affinity)에 보관
- "자격 요구 → Wallet → 선택 공개" 흐름

---

## 4. 데이터 · API 설계

### URL 스킴
```
https://mindcanvas.kr/api/openbadge/issuer                    # Issuer Profile
https://mindcanvas.kr/api/openbadge/badgeclass/LV2            # Achievement (Lv.2 Creator)
https://mindcanvas.kr/api/openbadge/assertion/MC-2026-N-0001  # AchievementCredential
https://mindcanvas.kr/cert/<publicSlug>                       # 인간-가독 인증서 (evidence로 연결)
```

### 응답 예시 — Assertion (OBv3)
```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
  ],
  "id": "https://mindcanvas.kr/api/openbadge/assertion/MC-2026-N-0001",
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "issuer": { "id": "https://mindcanvas.kr/api/openbadge/issuer", "type": ["Profile"] },
  "validFrom": "2026-04-21T00:00:00Z",
  "name": "MindCanvas AI+X Creator Lv.2",
  "credentialSubject": {
    "type": ["AchievementSubject"],
    "id": "mailto:nurse.kim@hospital.kr",
    "name": "김간호",
    "achievement": {
      "id": "https://mindcanvas.kr/api/openbadge/badgeclass/LV2",
      "type": ["Achievement"],
      "name": "MindCanvas AI+X Creator Lv.2",
      "description": "동작하는 AI+X 앱 1건을 제작하고 3영역 9항목 심사를 통과한 Creator에게 발급.",
      "criteria": {
        "narrative": "MindCanvas Lv.2 Creator 심사 체크리스트의 9개 항목 중 '미달' 0건. 심사위원 2인(MindCanvas + 도메인 전문가) 승인."
      }
    },
    "results": [
      { "type": ["Result"], "value": "기획 · 프롬프트 설계 · UI" }
    ]
  },
  "evidence": [
    {
      "id": "https://mindcanvas.kr/cert/1a14bbc5e711",
      "type": ["Evidence"],
      "name": "간호 인계 요약기",
      "description": "교대 시 환자 노트를 SBAR 포맷 3문단으로 자동 정리 — 인증서 페이지에서 바로 실행 가능",
      "narrative": "인증서 링크를 클릭하면 수여자가 제작한 실제 AI 앱을 iframe으로 체험할 수 있음."
    }
  ]
}
```

**이 중 `evidence[].id = /cert/<slug>`가 MindCanvas만의 차별점**이다. 일반 Open Badges는 evidence가 PDF 포트폴리오·블로그 글 정도인데, MindCanvas는 `evidence`를 누르면 **실제로 동작하는 앱**이 뜬다.

---

## 5. UX — 인증서 페이지에 추가될 섹션

`/cert/[slug]` 하단에 다음이 추가된다:

```
[Open Badge로 받기]
· JSON-LD 다운로드 (OBv3)            [📥]
· Assertion URL 복사                  [📋]
· LinkedIn 프로필에 추가             [🔗]  ← Add-to-Profile 링크
· 검증 도구에서 검증                 [🔗]  ← openbadgeapp.badgr.com 등
```

---

## 6. 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| 서명 없는 hosted verification은 MindCanvas 도메인이 살아있어야 함 | Phase 2에서 JWS 서명 추가, 백업 도메인 또는 IPFS 앵커 검토 |
| LinkedIn이 OBv3 수입 UI를 아직 완전히 공개 안 함 | "Add to profile" 쿼리스트링 방식으로 우선 수동 연동, 지원 확대 시 자동 전환 |
| 수여자가 발급 후 자격 Revoke 처리 시 외부 플랫폼에 반영 안 됨 | `revoked` 필드 제공, 외부 플랫폼은 주기적 재검증 필요 명시 |
| 도메인 특화 정보(간호학 등)가 표준 Taxonomy와 불일치 | `alignment` 필드에 O*NET / KEYCODE 등 공식 코드 매핑 (Phase 2) |

---

## 7. 결론

MindCanvas의 **"살아있는 인증서"** 는 Open Badges 표준을 그대로 **넘치게 만족**한다 (evidence가 실행 가능한 앱이기 때문). 따라서 이 플랫폼은 단순히 Open Badges를 "지원"하는 게 아니라, **Open Badges의 evidence 필드에 '실행 가능한 증거'를 집어넣는 최초의 한국형 크리덴셜 플랫폼**으로 포지셔닝할 수 있다.

> "일반 Open Badge: 시험 통과 증명"
> "MindCanvas Open Badge: 만든 앱이 지금도 동작하는 것을 실시간으로 증명"
