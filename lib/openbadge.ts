// Open Badges 3.0 (OBv3) JSON-LD helpers.
// Spec: https://www.imsglobal.org/spec/ob/v3p0/
// These build canonical documents for Issuer, Achievement (BadgeClass), and
// AchievementCredential (Assertion) — served verbatim from our API routes.

import type { Certificate, User, AppCanvas } from "@prisma/client";
import { LEVEL_META, toCertLevel, type CertLevel } from "./cert";

const OB_CONTEXT = [
  "https://www.w3.org/ns/credentials/v2",
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
];

// Issuer — a single MindCanvas Profile.
export function buildIssuer(baseUrl: string) {
  return {
    "@context": OB_CONTEXT,
    id: `${baseUrl}/api/openbadge/issuer`,
    type: ["Profile"],
    name: "주식회사 마인드캔버스 (MindCanvas Inc.)",
    url: baseUrl,
    email: "contact@mindcanvas.kr",
    description:
      "AI+X 도메인 특화 인증과 AppCanvas 마켓플레이스를 운영하는 기업. 교육 수료 + 앱 제작 + 살아있는 인증서를 하나로 잇는 크리덴셜 플랫폼.",
  };
}

// Achievement — one per CertLevel. "BadgeClass"의 OBv3 명칭.
export function buildAchievement(baseUrl: string, level: CertLevel) {
  const meta = LEVEL_META[level];

  const criteriaByLevel: Record<CertLevel, string> = {
    LV0: "MindCanvas 교수 입문(2일) 과정 수료 + 프롬프트 포트폴리오 3건 + AI 수업 아이디어 1건 제출.",
    LV1: "MindCanvas 직원 1차/학생 1차(2일) 수료 + 실제 업무에 적용 가능한 AI 프로세스 1건 + 자동화 시트/문서 제출.",
    LV2: "MindCanvas 심화 과정 수료 + 동작하는 AI+X 앱 1건 제출. 3영역 9항목 심사 체크리스트에서 '미달' 0건, MindCanvas 내부 심사관 1인 + 도메인 전문가 1인 승인.",
    LV3: "AppCanvas 활성 앱 3건 이상, 평균 평점 3.5 이상, 7일 재사용률 15% 이상 (QWUS 지표 기반 자동 승급).",
    LV4: "AppCanvas QWUS 상위 10% + 멘토링/TTT 이력 보유 (Star 크리에이터).",
  };

  return {
    "@context": OB_CONTEXT,
    id: `${baseUrl}/api/openbadge/badgeclass/${level}`,
    type: ["Achievement"],
    name: `MindCanvas AI+X ${meta.name} (${meta.code})`,
    description: meta.description,
    achievementType: "Badge",
    criteria: { narrative: criteriaByLevel[level] },
    image: {
      id: `${baseUrl}/api/openbadge/image/${level}.svg`,
      type: "Image",
    },
    tag: ["AI", "AI+X", meta.name, meta.code, "MindCanvas"],
  };
}

// AchievementCredential — one per Certificate.
// OBv3 = W3C VC, so this is a VerifiableCredential with an OpenBadgeCredential type.
export function buildAssertion(
  baseUrl: string,
  cert: Certificate & { recipient: User; app: AppCanvas | null },
) {
  const level = toCertLevel(cert.level);
  const meta = LEVEL_META[level];

  const evidence = cert.app
    ? [
        {
          id: `${baseUrl}/cert/${cert.publicSlug}`,
          type: ["Evidence"],
          name: cert.app.name,
          description: cert.app.oneLiner,
          narrative:
            "인증서 URL을 방문하면 수여자가 직접 제작한 AI+X 앱이 iframe으로 즉시 실행됨. MindCanvas 'Living Certificate'의 핵심 evidence.",
          genre: cert.app.domain,
          audience: "Professionals / Hiring Managers / Academic Reviewers",
        },
      ]
    : [];

  return {
    "@context": OB_CONTEXT,
    id: `${baseUrl}/api/openbadge/assertion/${cert.certNumber}`,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name: `MindCanvas AI+X ${meta.name}`,
    description: `${meta.code} ${meta.name} — ${meta.short}. 발급 인증번호: ${cert.certNumber}`,
    issuer: {
      id: `${baseUrl}/api/openbadge/issuer`,
      type: ["Profile"],
      name: "주식회사 마인드캔버스 (MindCanvas Inc.)",
    },
    validFrom: cert.issuedAt.toISOString(),
    ...(cert.revokedAt
      ? { revoked: true, revocationReason: "Issuer revoked", validUntil: cert.revokedAt.toISOString() }
      : {}),
    credentialSubject: {
      type: ["AchievementSubject"],
      id: `mailto:${cert.recipient.email}`,
      name: cert.recipient.name,
      achievement: buildAchievement(baseUrl, level),
      ...(cert.teamRole
        ? {
            results: [
              {
                type: ["Result"],
                achievedLevel: "Passed",
                resultDescription: {
                  type: ["ResultDescription"],
                  name: "팀 기여 역할",
                  resultType: "Status",
                },
                value: cert.teamRole,
              },
            ],
          }
        : {}),
    },
    ...(evidence.length ? { evidence } : {}),
  };
}

// Derive base URL from the incoming request. In dev: http://localhost:3000
// In prod: https://<host> (respecting x-forwarded-* headers).
export function baseUrlFromRequest(req: Request): string {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}
