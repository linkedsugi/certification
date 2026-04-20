"use client";

// Demo: 간호 인계 요약기 (SBAR)
// 입력된 간호 노트를 키워드 기반 규칙으로 Situation/Background/Assessment/Recommendation 포맷으로 정리.

import { useMemo, useState } from "react";

const SAMPLE = `환자: 박○○, 72세 여성, 병실 304-B
진단: 지역사회 획득 폐렴
3일째 입원 중, 현재 세프트리악손 1g IV q12h 및 산소 2L 비강 캐뉼러 투여 중
오늘 오후 2시 체온 38.9°C로 상승, SpO2 91%로 감소
기침과 가래 증가, 객담은 황색으로 변화
혈액검사 WBC 14.2K, CRP 9.8
환자 보호자에게 상태 악화 설명 완료
주치의에게 보고 필요. 광범위 항생제 전환 또는 객담 배양 추가 검사 고려 요청.`;

type SBAR = { S: string[]; B: string[]; A: string[]; R: string[] };

// 규칙 기반 추출 — 실제 앱은 LLM 프롬프트로 이 작업을 수행
function extractSBAR(text: string): SBAR {
  const s: SBAR = { S: [], B: [], A: [], R: [] };
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  for (const ln of lines) {
    const l = ln;

    // Situation (현재 상황 / 주증상)
    if (
      /(체온|발열|°C|SpO2|산소|혈압|맥박|통증|호흡곤란|의식|상승|감소|변화|증가|저하)/.test(l) &&
      !/입원|진단|처방|보고/.test(l)
    ) {
      s.S.push(l);
      continue;
    }

    // Background (배경 / 진단 · 치료 이력)
    if (/(환자|진단|입원|처방|복용|병력|알레르기|과거력|일째|IV|PO)/.test(l)) {
      s.B.push(l);
      continue;
    }

    // Assessment (평가 / 검사 · 해석)
    if (/(WBC|CRP|BUN|Cr|검사|배양|X-ray|악화|호전|소견|의심)/.test(l)) {
      s.A.push(l);
      continue;
    }

    // Recommendation (권고 · 요청)
    if (/(요청|필요|고려|보고|변경|중단|추가|협진)/.test(l)) {
      s.R.push(l);
      continue;
    }

    // 폴백
    s.A.push(l);
  }
  // 빈 섹션 보강
  if (s.S.length === 0) s.S.push("(현재 활력 징후 · 주증상 정보 부족)");
  if (s.B.length === 0) s.B.push("(과거력 · 현재 치료 정보 부족)");
  if (s.A.length === 0) s.A.push("(검사 결과 · 임상 해석 정보 부족)");
  if (s.R.length === 0) s.R.push("(요청 사항 명시 권장)");
  return s;
}

// 민감 정보(환자명·차트번호 일부) 간단 마스킹
function mask(text: string) {
  return text
    .replace(/([가-힣])○○/g, "$1**")
    .replace(/(\d{3,4})-[A-Z]/g, "$1-*");
}

export default function HandoverSummarizerDemo() {
  const [input, setInput] = useState(SAMPLE);
  const [showMasked, setShowMasked] = useState(true);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const sbar = useMemo(() => (submitted ? extractSBAR(submitted) : null), [submitted]);
  const displayText = useMemo(() => (submitted && showMasked ? mask(submitted) : submitted), [submitted, showMasked]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim().length < 10) {
      setSubmitted("");
      return;
    }
    setSubmitted(input);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <header className="flex items-baseline justify-between border-b border-ink-100 pb-4">
        <div>
          <p className="text-xs font-medium text-emerald-700">AI + 간호학 · AppCanvas 앱</p>
          <h1 className="text-2xl font-bold mt-1">간호 인계 요약기 (SBAR)</h1>
          <p className="text-sm text-ink-500 mt-1">
            교대 시 간호 기록을 Situation-Background-Assessment-Recommendation 포맷으로 3분 안에 정리.
          </p>
        </div>
        <span className="text-[11px] text-ink-500">v0.1 demo</span>
      </header>

      <form onSubmit={onSubmit} className="mt-6">
        <label className="field-label">간호 기록 원문</label>
        <textarea
          className="input font-mono text-xs leading-relaxed"
          rows={10}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="mt-3 flex items-center gap-4">
          <button type="submit" className="btn-primary">SBAR로 요약</button>
          <label className="text-xs text-ink-700 flex items-center gap-2">
            <input
              type="checkbox"
              checked={showMasked}
              onChange={(e) => setShowMasked(e.target.checked)}
            />
            민감정보 자동 마스킹
          </label>
        </div>
      </form>

      {submitted !== null && submitted.trim().length < 10 && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          입력이 너무 짧습니다. 간호 기록 원문을 10자 이상 입력해주세요.
        </div>
      )}

      {sbar && (
        <section className="mt-6 grid md:grid-cols-2 gap-4">
          <SbarBlock title="S — Situation" subtitle="현재 상황 / 주증상" items={sbar.S} tone="rose" />
          <SbarBlock title="B — Background" subtitle="배경 · 치료 이력" items={sbar.B} tone="amber" />
          <SbarBlock title="A — Assessment" subtitle="평가 · 검사 결과" items={sbar.A} tone="indigo" />
          <SbarBlock title="R — Recommendation" subtitle="권고 · 요청 사항" items={sbar.R} tone="emerald" />
          <div className="md:col-span-2 rounded-lg border border-ink-100 p-4 text-xs text-ink-500">
            마스킹된 원문 미리보기:
            <pre className="mt-2 whitespace-pre-wrap text-ink-700">{displayText}</pre>
          </div>
        </section>
      )}
    </div>
  );
}

function SbarBlock({
  title, subtitle, items, tone,
}: { title: string; subtitle: string; items: string[]; tone: "rose"|"amber"|"indigo"|"emerald" }) {
  const map = {
    rose: "border-rose-200 bg-rose-50",
    amber: "border-amber-200 bg-amber-50",
    indigo: "border-indigo-200 bg-indigo-50",
    emerald: "border-emerald-200 bg-emerald-50",
  };
  return (
    <div className={`rounded-xl border p-4 ${map[tone]}`}>
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>
      <ul className="mt-3 space-y-1 text-sm list-disc list-inside marker:text-ink-300">
        {items.map((i, idx) => <li key={idx}>{i}</li>)}
      </ul>
    </div>
  );
}
