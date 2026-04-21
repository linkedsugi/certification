# Firebase App Hosting + Neon Postgres 배포 가이드

이 플랫폼은 **Firebase App Hosting** (Cloud Run 기반, Next.js SSR 정식 지원)에 **Neon Serverless Postgres**를 데이터베이스로 사용해 배포한다.

> **로컬 개발과 분리**: 로컬은 SQLite 그대로(`prisma/dev.db`), 배포 빌드 단계에서만 Prisma datasource를 자동으로 Postgres로 전환한다. 따라서 `git clone` 후 `npm install && npm run db:push && npm run db:seed && npm run dev` 흐름은 그대로 유지된다.

---

## 사전 준비

| 항목 | 비고 |
| --- | --- |
| Google 계정 + Firebase 프로젝트 | https://console.firebase.google.com 에서 새 프로젝트 (Spark 무료 플랜으로 시작 가능) |
| Blaze (종량제) 플랜 | App Hosting은 Blaze 플랜 필요. 트래픽 적으면 사실상 무과금 |
| GitHub 리포지토리 | `linkedsugi/certification` 이미 있음 |
| Neon 계정 | https://neon.tech (무료 티어 충분) |

---

## 1. Neon Postgres DB 만들기 (5분)

1. https://console.neon.tech 접속 → **New Project**
2. Region: 서울 가까운 곳 (현재 Neon은 `ap-southeast-1 Singapore`이 아시아 최단). 향후 `ap-northeast-1 Tokyo` 추가 시 변경.
3. Project name: `mindcanvas-cert`
4. 생성 후 **Connection string** 탭 → **Pooled connection** 선택:
   ```
   postgresql://USER:PASS@ep-XXXX-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   👆 이 문자열을 안전하게 보관. 다음 단계에서 사용.

---

## 2. 첫 스키마 푸시 + 시드 (로컬에서 1회만)

본인 머신에서:
```bash
# 1. 환경변수 임시로 prod DB로 지정
export DATABASE_URL="postgresql://USER:PASS@ep-XXXX-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# 2. Prisma schema를 prod 모드로 전환 + 푸시
npm run db:seed:prod
```
이 명령은:
1. `prisma/schema.prisma`를 sqlite → postgresql로 in-place 변경 (커밋하지 말 것)
2. Prisma Client 생성
3. 시드 데이터 삽입 (사용자 5명, 과정 4개, 샘플 앱·인증서)

완료 후 **변경된 schema.prisma를 원복**:
```bash
git checkout prisma/schema.prisma
```

이제 Neon에 시드 데이터가 들어가 있고, 본인 로컬 `schema.prisma`는 다시 sqlite입니다.

> 향후 매 배포마다 Firebase 빌드가 `prisma db push`를 자동 실행하므로 스키마 변경은 자동 반영. 시드는 필요할 때만 위 명령 다시 실행.

---

## 3. Firebase App Hosting 백엔드 만들기

### 3.1 Firebase CLI 준비
```bash
npm install -g firebase-tools
firebase login
```

### 3.2 프로젝트 초기화
프로젝트 루트에서:
```bash
firebase init apphosting
```
선택:
- **Use an existing project** → 1단계에서 만든 Firebase 프로젝트
- **Connect a GitHub repository** → `linkedsugi/certification`
- **Branch**: `main` (또는 운영용으로 쓰실 브랜치)
- **Live branch**: 위와 동일
- **Backend ID**: `mindcanvas-cert` 같은 식별자
- **Region**: `asia-northeast3` (서울) 권장

CLI가 GitHub Connector를 설치하고 백엔드를 생성합니다.

### 3.3 환경변수(시크릿) 등록

Firebase Console → **App Hosting** → 만든 백엔드 → **Configuration** → **Secrets** 탭에서 추가:

| Secret 이름 | 값 |
| --- | --- |
| `DATABASE_URL` | 1단계에서 복사한 Neon Pooled connection string |

`apphosting.yaml`에 이미 `DATABASE_URL`을 secret으로 참조하도록 선언되어 있으므로 이름만 정확히 맞추면 됩니다.

### 3.4 배포

`main` 브랜치에 푸시하면 자동으로 빌드·배포됩니다.

```bash
git push origin main
```

Firebase Console → App Hosting에서 **Build logs**로 진행 상황 확인. 첫 배포는 5~8분.

배포 완료 후 URL: `https://mindcanvas-cert--XXXXXX.<region>.hosted.app` 형태 (Firebase가 자동 부여). Custom domain은 콘솔에서 추가 가능.

---

## 4. 배포 후 점검 체크리스트

| 확인 사항 | 예상 결과 |
| --- | --- |
| `https://<host>/` | 홈페이지 200 |
| `https://<host>/login` | 시드 사용자 5명 표시 |
| `https://<host>/cert/<seedSlug>` | 살아있는 인증서 + iframe + Open Badge 섹션 |
| `https://<host>/api/openbadge/issuer` | OBv3 JSON-LD 응답 |
| `https://<host>/api/openbadge/assertion/MC-2026-N-0001` | Assertion JSON, evidence URL이 production host로 되어 있음 |
| 심사 → 인증서 자동 발급 플로우 | DB가 Neon이라 모든 인스턴스에서 일관 |

---

## 5. 운영 시 알아둘 것

### 5.1 마이그레이션
현재 `build:firebase`는 `prisma db push`를 사용한다 (마이그레이션 히스토리 없음). 실서비스 단계로 가면 `prisma migrate deploy`로 전환:

1. 로컬에서 스키마 변경 후 `npx prisma migrate dev --name <change>` (postgres 연결로)
2. `prisma/migrations/` 커밋
3. `package.json`의 `build:firebase`를 `prisma migrate deploy`로 교체

### 5.2 콜드 스타트
`apphosting.yaml`의 `minInstances: 0` → 트래픽 없으면 0대로 줄어 콜드 스타트 발생. 비용 vs 응답 속도 트레이드오프 :
```yaml
runConfig:
  minInstances: 1   # 항상 1대 warm. 월 ~$10 추가
```

### 5.3 시크릿 회전
Neon DB 비밀번호 변경 시 → Firebase Console에서 `DATABASE_URL` secret 업데이트 → 백엔드 재배포 (자동 트리거 또는 수동 rollout).

### 5.4 비용 가드 (Spark 외)
- Cloud Run: 첫 200만 요청/월 무료
- Cloud Build: 첫 120분/일 무료
- Neon: 0.5GB · 1 compute hour 무료
- Firebase Hosting CDN: 월 10GB 무료

소규모 베타에는 사실상 무과금. Cloud Run의 max instances를 5로 제한했으므로 폭주해도 통제됨.

---

## 6. 도메인 연결 (선택)

Firebase Console → **App Hosting** → 백엔드 → **Custom domains**에서 `cert.mindcanvas.kr` 같은 도메인 등록. DNS A/AAAA/CNAME 레코드는 Firebase가 안내.

---

## 7. 롤백

문제가 생기면 콘솔에서 이전 배포(rollout)를 활성화. 무중단 롤백.

---

## 8. 향후 개선

- **Prisma Migrate**로 마이그레이션 정식 도입
- **Firebase Auth**로 데모 쿠키 → 실제 로그인 (NextAuth 대신 Firebase Auth + Server Components)
- **Cloud Storage**로 인증서 PDF 백업
- **Cloud Logging**에서 OBv3 발급 이벤트 모니터링
