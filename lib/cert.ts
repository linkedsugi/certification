// Helpers for certificate numbering, level naming, and verdict math.

// SQLite has no enums; these are app-level string unions stored as text columns.
export type CertLevel = "LV0" | "LV1" | "LV2" | "LV3" | "LV4";
export type Verdict = "PENDING" | "PASS" | "REVISE" | "FAIL";
export type OverallVerdict = "PENDING" | "PASS" | "CONDITIONAL" | "FAIL";
export type AppStatus =
  | "DRAFT" | "SUBMITTED" | "UNDER_REVIEW"
  | "APPROVED" | "CONDITIONAL" | "REJECTED" | "PUBLISHED";
export type Role = "LEARNER" | "REVIEWER" | "DOMAIN_EXPERT" | "ADMIN";
export type RegistrationAdvice = "IMMEDIATE" | "UI_POLISH_FIRST" | "NEEDS_DEVELOPMENT";

// Domain → single-letter code used in the cert number.
// Inspired by the sample "MC-2026-N-0042" where N = Nursing (간호학).
const DOMAIN_LETTER: Record<string, string> = {
  간호학: "N",
  간호: "N",
  의학: "M",
  세무: "T",
  세무학: "T",
  건축: "B",
  건축학: "B",
  교육: "E",
  교육학: "E",
  디자인: "D",
  경영: "G",
  경영학: "G",
  법학: "L",
  공학: "X",
};

export function domainLetter(domain: string): string {
  const x = domain.replace(/^AI\s*\+\s*/i, "").trim();
  for (const key of Object.keys(DOMAIN_LETTER)) {
    if (x.includes(key)) return DOMAIN_LETTER[key];
  }
  // fallback: first alphabetic char or X
  const m = x.match(/[A-Za-z]/);
  return (m ? m[0] : "X").toUpperCase();
}

export function nextCertNumber(params: {
  year: number;
  domain: string;
  sequence: number; // 1-based
}): string {
  const { year, domain, sequence } = params;
  const letter = domainLetter(domain);
  const seq = sequence.toString().padStart(4, "0");
  return `MC-${year}-${letter}-${seq}`;
}

export function toCertLevel(s: string | null | undefined): CertLevel {
  return (s && ["LV0","LV1","LV2","LV3","LV4"].includes(s) ? s : "LV0") as CertLevel;
}

export const LEVEL_META: Record<
  CertLevel,
  { code: string; name: string; short: string; description: string }
> = {
  LV0: {
    code: "Lv.0",
    name: "Explorer",
    short: "AI 이해자",
    description: "프롬프트 포트폴리오 3건 + AI 수업 아이디어 1건",
  },
  LV1: {
    code: "Lv.1",
    name: "Builder",
    short: "AI 활용자",
    description: "AI 적용 업무 프로세스 1건 + 자동화 시트/문서",
  },
  LV2: {
    code: "Lv.2",
    name: "Creator",
    short: "AI 앱 제작자",
    description: "동작하는 AI+X 앱 1건 (심사 통과) — AppCanvas Seed 크리에이터 자격",
  },
  LV3: {
    code: "Lv.3",
    name: "Specialist",
    short: "도메인 AI 전문가",
    description: "활성 앱 3건+ / 평균 평점 3.5+ / 재사용률 15%+",
  },
  LV4: {
    code: "Lv.4",
    name: "Leader",
    short: "AI+X 리더",
    description: "QWUS 상위 10% + 멘토링 이력 + Star 크리에이터",
  },
};

// 9 checklist item definitions – labels and judgement criteria.
export type ChecklistKey =
  | "item_1_1" | "item_1_2" | "item_1_3"
  | "item_2_1" | "item_2_2" | "item_2_3"
  | "item_3_1" | "item_3_2" | "item_3_3";

export type ChecklistArea = {
  id: 1 | 2 | 3;
  title: string;
  subtitle: string;
  items: {
    key: ChecklistKey;
    code: string;        // "1-1"
    label: string;       // "앱 실행"
    criterion: string;   // 판단 기준 문장
  }[];
};

export const CHECKLIST: ChecklistArea[] = [
  {
    id: 1,
    title: "영역 1. 기능 동작",
    subtitle: "Does it work?",
    items: [
      { key: "item_1_1", code: "1-1", label: "앱 실행", criterion: "URL 접속 → 메인 기능 정상 작동. 빈 화면/에러 = 미달" },
      { key: "item_1_2", code: "1-2", label: "핵심 플로우", criterion: "입력 → AI 처리 → 결과 출력의 기본 흐름 완성" },
      { key: "item_1_3", code: "1-3", label: "에러 처리", criterion: "빈 입력/이상 입력 시 앱이 죽지 않고 안내 표시" },
    ],
  },
  {
    id: 2,
    title: "영역 2. 도메인 가치",
    subtitle: "Does it solve a real problem?",
    items: [
      { key: "item_2_1", code: "2-1", label: "문제 정의", criterion: "누구의/어떤 문제를 해결하는지 한 문장 설명 가능" },
      { key: "item_2_2", code: "2-2", label: "도메인 전문성", criterion: "범용 AI 대비 도메인 지식이 녹아든 차별화 존재" },
      { key: "item_2_3", code: "2-3", label: "실용성", criterion: "데모용이 아닌 현업에서 반복 사용 가능한 수준" },
    ],
  },
  {
    id: 3,
    title: "영역 3. 사용자 경험",
    subtitle: "Can someone actually use it?",
    items: [
      { key: "item_3_1", code: "3-1", label: "첫 사용", criterion: "설명서 없이 30초 내 무엇을 해야 하는지 파악 가능" },
      { key: "item_3_2", code: "3-2", label: "인터페이스", criterion: "레이아웃 깨짐 없음. 버튼·입력창 기본 정렬/가독성 확보" },
      { key: "item_3_3", code: "3-3", label: "결과 품질", criterion: "AI 응답이 도메인에 맞고 환각이 치명적이지 않음" },
    ],
  },
];

export const CHECKLIST_ITEMS = CHECKLIST.flatMap((a) => a.items);

// Compute overall verdict from 9 item verdicts.
// Pass-condition (per docs): 미달 0건, 보완 0건 → 통과.
// 미달 ≥ 1 → 미달. 아니면 → 조건부 통과.
export function computeOverall(
  scores: Record<ChecklistKey, Verdict>,
): OverallVerdict {
  const values = Object.values(scores);
  if (values.some((v) => v === "PENDING")) return "PENDING";
  if (values.some((v) => v === "FAIL")) return "FAIL";
  if (values.some((v) => v === "REVISE")) return "CONDITIONAL";
  return "PASS";
}

export function verdictLabel(v: Verdict): string {
  return { PENDING: "미평가", PASS: "통과", REVISE: "보완", FAIL: "미달" }[v];
}

export function overallLabel(v: OverallVerdict): string {
  return {
    PENDING: "심사 대기",
    PASS: "통과",
    CONDITIONAL: "조건부 통과",
    FAIL: "미달",
  }[v];
}
