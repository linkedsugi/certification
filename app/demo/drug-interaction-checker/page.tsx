"use client";

// Demo: 약물 상호작용 체커 (간호학 AI+X 앱 예시)
// 실제 임상 판단에 사용하지 말 것. 데모용 고정 규칙 기반.

import { useState } from "react";

type Severity = "major" | "moderate" | "minor";

type Rule = {
  drugs: [string, string];
  severity: Severity;
  effect: string;
  action: string;
  alt?: string;
};

// 간단한 규칙 DB — 실제 앱에서는 임상 가이드라인과 LLM을 결합해 생성됩니다.
const RULES: Rule[] = [
  {
    drugs: ["와파린", "아스피린"],
    severity: "major",
    effect: "출혈 위험 현저히 증가 (항응고 + 항혈소판 중복)",
    action: "두 약물 병용을 피하거나, 병용 시 INR·출혈 징후 집중 모니터링.",
    alt: "아스피린 → 아세트아미노펜 고려",
  },
  {
    drugs: ["와파린", "이부프로펜"],
    severity: "major",
    effect: "NSAID로 인한 위장관 출혈 + 와파린 효과 증강",
    action: "NSAID 사용 회피, 필요 시 단기간·최저용량.",
    alt: "아세트아미노펜 권장",
  },
  {
    drugs: ["아스피린", "이부프로펜"],
    severity: "moderate",
    effect: "아스피린의 심혈관 보호 효과 감소 + 위장관 출혈 증가",
    action: "복용 시간 분리 (아스피린 복용 후 이부프로펜은 최소 2시간 이후).",
  },
  {
    drugs: ["리시노프릴", "스피로노락톤"],
    severity: "major",
    effect: "고칼륨혈증 위험 (ACE 억제제 + 칼륨 보존성 이뇨제)",
    action: "혈청 K+ 정기 측정 (치료 시작 1주, 1개월 후).",
  },
  {
    drugs: ["메트포르민", "조영제"],
    severity: "major",
    effect: "급성 신손상 시 유산산증 위험",
    action: "조영제 투여 전후 48시간 메트포르민 중단, 신기능 확인 후 재개.",
  },
  {
    drugs: ["심바스타틴", "클라리트로마이신"],
    severity: "major",
    effect: "CYP3A4 억제로 스타틴 농도 상승 → 횡문근융해증 위험",
    action: "클라리트로마이신 복용 기간 동안 심바스타틴 일시 중단.",
    alt: "아지트로마이신으로 변경 고려",
  },
  {
    drugs: ["트라마돌", "에스시탈로프람"],
    severity: "moderate",
    effect: "세로토닌 증후군 위험",
    action: "불안·진전·발한 등 관찰, 병용 필요 시 최저 용량에서 시작.",
  },
  {
    drugs: ["디곡신", "푸로세미드"],
    severity: "moderate",
    effect: "저칼륨·저마그네슘혈증으로 디곡신 독성 증가",
    action: "전해질 및 디곡신 혈중농도 모니터링.",
  },
];

// 동의어/상표명 정규화 (대표적 예만)
const ALIASES: Record<string, string> = {
  warfarin: "와파린", coumadin: "와파린", 쿠마딘: "와파린",
  aspirin: "아스피린", asa: "아스피린",
  ibuprofen: "이부프로펜", brufen: "이부프로펜",
  lisinopril: "리시노프릴",
  spironolactone: "스피로노락톤", aldactone: "스피로노락톤",
  metformin: "메트포르민", glucophage: "메트포르민",
  simvastatin: "심바스타틴",
  clarithromycin: "클라리트로마이신",
  tramadol: "트라마돌",
  escitalopram: "에스시탈로프람", lexapro: "에스시탈로프람",
  digoxin: "디곡신",
  furosemide: "푸로세미드", lasix: "푸로세미드",
};

function normalize(s: string) {
  const t = s.trim().toLowerCase();
  if (ALIASES[t]) return ALIASES[t];
  // Match by substring against Korean canonicals
  for (const r of RULES) {
    for (const d of r.drugs) if (s.includes(d)) return d;
  }
  return s.trim();
}

function findInteractions(items: string[]) {
  const normd = Array.from(new Set(items.map(normalize).filter(Boolean)));
  const hits: (Rule & { pair: [string, string] })[] = [];
  for (let i = 0; i < normd.length; i++) {
    for (let j = i + 1; j < normd.length; j++) {
      const a = normd[i], b = normd[j];
      const rule = RULES.find(
        (r) => (r.drugs[0] === a && r.drugs[1] === b) || (r.drugs[0] === b && r.drugs[1] === a),
      );
      if (rule) hits.push({ ...rule, pair: [a, b] });
    }
  }
  return { normalized: normd, hits };
}

const SEVERITY_STYLE: Record<Severity, string> = {
  major: "bg-rose-50 border-rose-300 text-rose-900",
  moderate: "bg-amber-50 border-amber-300 text-amber-900",
  minor: "bg-slate-50 border-slate-300 text-slate-900",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  major: "주의 (Major)",
  moderate: "중등도 (Moderate)",
  minor: "경미 (Minor)",
};

export default function DrugCheckerDemo() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof findInteractions> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const items = input
      .split(/[,\n;·]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length < 2) {
      setError("약물을 2개 이상 입력해주세요. (쉼표 또는 줄바꿈으로 구분)");
      setResult(null);
      return;
    }
    setError(null);
    setResult(findInteractions(items));
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <header className="flex items-baseline justify-between border-b border-ink-100 pb-4">
        <div>
          <p className="text-xs font-medium text-emerald-700">AI + 간호학 · AppCanvas 앱</p>
          <h1 className="text-2xl font-bold mt-1">약물 상호작용 체커</h1>
          <p className="text-sm text-ink-500 mt-1">
            환자의 복용 약물 2개 이상을 입력하면 상호작용 경고와 대체 약물을 제안합니다.
          </p>
        </div>
        <span className="text-[11px] text-ink-500">v0.1 demo</span>
      </header>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="field-label">복용 약물 목록</label>
        <textarea
          className="input font-mono text-sm"
          rows={4}
          placeholder={"예)\n와파린\n아스피린\n이부프로펜"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex gap-2 text-xs flex-wrap">
          {["와파린, 아스피린", "메트포르민, 조영제", "심바스타틴, 클라리트로마이신", "리시노프릴, 스피로노락톤, 푸로세미드"].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setInput(ex.replace(/,\s*/g, "\n"))}
              className="rounded-full border border-ink-100 px-2.5 py-1 hover:bg-ink-100/40"
            >
              예시: {ex}
            </button>
          ))}
        </div>
        <button type="submit" className="btn-primary">상호작용 확인</button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {result && !error && (
        <section className="mt-6 space-y-3">
          <p className="text-xs text-ink-500">
            분석된 약물 ({result.normalized.length}): {result.normalized.join(" · ")}
          </p>

          {result.hits.length === 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              알려진 주요 상호작용이 발견되지 않았습니다. 다만 환자의 신장/간 기능과 병용 조건을 함께 확인하세요.
            </div>
          ) : (
            result.hits.map((h, idx) => (
              <div key={idx} className={`rounded-lg border px-4 py-3 text-sm ${SEVERITY_STYLE[h.severity]}`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    {h.pair[0]} × {h.pair[1]}
                  </p>
                  <span className="text-xs font-medium">{SEVERITY_LABEL[h.severity]}</span>
                </div>
                <p className="mt-2">{h.effect}</p>
                <p className="mt-2"><b>조치</b>: {h.action}</p>
                {h.alt && <p className="mt-1"><b>대체</b>: {h.alt}</p>}
              </div>
            ))
          )}

          <p className="text-[11px] text-ink-500 mt-6 leading-relaxed">
            * 본 데모는 MindCanvas Certification Platform 심사용 샘플입니다.
            실제 임상 결정에는 최신 가이드라인과 의약품 설명서를 확인하세요.
          </p>
        </section>
      )}
    </div>
  );
}
