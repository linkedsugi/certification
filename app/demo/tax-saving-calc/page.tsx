"use client";

// Demo: 종합소득세 절세 계산기 (세무 AI+X 앱 예시)
// 2024년 종합소득세율(가상 단순화)에 기반한 대략 계산. 실제 세무 결정에 사용하지 말 것.

import { useMemo, useState } from "react";

type Bracket = { upTo: number; rate: number; cumTax: number };

// 단순화한 2024년 종합소득세율 (누진세율)
const BRACKETS: Bracket[] = [
  { upTo: 14_000_000,  rate: 0.06, cumTax: 0 },
  { upTo: 50_000_000,  rate: 0.15, cumTax: 840_000 },
  { upTo: 88_000_000,  rate: 0.24, cumTax: 6_240_000 },
  { upTo: 150_000_000, rate: 0.35, cumTax: 15_360_000 },
  { upTo: 300_000_000, rate: 0.38, cumTax: 37_600_000 },
  { upTo: 500_000_000, rate: 0.40, cumTax: 94_600_000 },
  { upTo: Infinity,    rate: 0.42, cumTax: 174_600_000 },
];

function calcTax(taxable: number) {
  if (taxable <= 0) return 0;
  for (let i = 0; i < BRACKETS.length; i++) {
    if (taxable <= BRACKETS[i].upTo) {
      const prev = i === 0 ? 0 : BRACKETS[i - 1].upTo;
      return BRACKETS[i].cumTax + (taxable - prev) * BRACKETS[i].rate;
    }
  }
  return 0;
}

function won(n: number) {
  return "₩ " + Math.round(n).toLocaleString("ko-KR");
}

type Industry = "general" | "it" | "retail" | "food" | "consulting";

const EXPENSE_RATIO: Record<Industry, number> = {
  general: 0.4,
  it: 0.25,
  retail: 0.55,
  food: 0.65,
  consulting: 0.2,
};

const INDUSTRY_LABEL: Record<Industry, string> = {
  general: "일반 서비스",
  it: "IT / 소프트웨어",
  retail: "소매 · 유통",
  food: "음식 · 숙박",
  consulting: "전문 컨설팅",
};

export default function TaxSaverDemo() {
  const [income, setIncome] = useState(80_000_000);
  const [expenses, setExpenses] = useState(12_000_000);
  const [dependents, setDependents] = useState(1);
  const [industry, setIndustry] = useState<Industry>("it");

  const result = useMemo(() => {
    if (income <= 0) return null;

    const basicDeduction = 1_500_000; // 본인 기본공제
    const dependentDeduction = Math.max(0, dependents) * 1_500_000;
    const totalDeduction = basicDeduction + dependentDeduction;

    const taxableBase = Math.max(0, income - expenses);
    const taxableAfterDeduction = Math.max(0, taxableBase - totalDeduction);
    const tax = calcTax(taxableAfterDeduction);
    const effective = taxableAfterDeduction > 0 ? tax / taxableAfterDeduction : 0;

    // 업종 평균 경비율 vs 실제 경비
    const expectedExpense = income * EXPENSE_RATIO[industry];
    const gap = expectedExpense - expenses;
    const gapTax = calcTax(Math.max(0, taxableAfterDeduction - Math.max(0, gap)));
    const potentialSaving = Math.max(0, tax - gapTax);

    const tips: { title: string; desc: string }[] = [];
    if (gap > 1_000_000) {
      tips.push({
        title: `업종 평균 대비 경비가 ${won(gap)} 적게 잡혔습니다`,
        desc: `${INDUSTRY_LABEL[industry]} 평균 경비율은 약 ${(EXPENSE_RATIO[industry] * 100).toFixed(0)}%. 임차료·통신비·차량유지·교육비 등 누락 가능성 점검.`,
      });
    }
    if (taxableAfterDeduction > 14_000_000 && taxableAfterDeduction < 55_000_000) {
      tips.push({
        title: "연금저축·IRP 세액공제 활용",
        desc: "연 최대 900만원(연금저축 600 + IRP 300)까지 세액공제 16.5% → 최대 약 ₩1,485,000 환급.",
      });
    }
    if (dependents === 0 && income > 30_000_000) {
      tips.push({
        title: "부양가족 등록 여부 재확인",
        desc: "연간 소득 100만원 이하 직계존속·비속은 기본공제(150만원) 대상. 의료비·교육비 추가 공제도 가능.",
      });
    }
    if (income > 100_000_000 && industry !== "consulting") {
      tips.push({
        title: "간편장부 → 복식부기 전환 검토",
        desc: "복식부기 의무자(업종별 기준 초과)는 추계신고 시 무신고 가산세 위험. 장부 기장 세액공제(20%)도 활용.",
      });
    }
    if (tips.length === 0) {
      tips.push({
        title: "큰 절세 포인트가 없습니다",
        desc: "현재 입력된 수치 기준으로 추가 절세 여지가 크지 않습니다. 연중 지출 영수증 관리를 권장합니다.",
      });
    }

    return {
      taxableBase, totalDeduction, taxableAfterDeduction, tax,
      effective, potentialSaving, tips,
    };
  }, [income, expenses, dependents, industry]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <header className="flex items-baseline justify-between border-b border-ink-100 pb-4">
        <div>
          <p className="text-xs font-medium text-indigo-700">AI + 세무 · AppCanvas 앱</p>
          <h1 className="text-2xl font-bold mt-1">종합소득세 절세 계산기</h1>
          <p className="text-sm text-ink-500 mt-1">
            자영업자의 예상 세액과 업종 평균 대비 절세 포인트를 실시간으로 계산.
          </p>
        </div>
        <span className="text-[11px] text-ink-500">v0.1 demo</span>
      </header>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <form className="space-y-3">
          <div>
            <label className="field-label">연간 총수입 (₩)</label>
            <input type="number" min={0} step={1_000_000}
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
              className="input" />
          </div>
          <div>
            <label className="field-label">실제 경비 지출 (₩)</label>
            <input type="number" min={0} step={100_000}
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value))}
              className="input" />
          </div>
          <div>
            <label className="field-label">업종</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value as Industry)} className="input">
              {Object.entries(INDUSTRY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">부양가족 수 (본인 제외)</label>
            <input type="number" min={0}
              value={dependents}
              onChange={(e) => setDependents(Number(e.target.value))}
              className="input" />
          </div>
        </form>

        <aside className="card p-5 space-y-2 bg-gradient-to-br from-indigo-50 to-white">
          {!result ? (
            <p className="text-sm text-rose-800">연간 총수입을 입력해주세요.</p>
          ) : (
            <>
              <p className="text-xs text-ink-500">예상 종합소득세</p>
              <p className="text-3xl font-bold text-indigo-900">{won(result.tax)}</p>
              <p className="text-xs text-ink-500">
                과세표준 {won(result.taxableAfterDeduction)} · 실효세율 {(result.effective * 100).toFixed(1)}%
              </p>
              <hr className="my-2 border-indigo-100" />
              <p className="text-xs text-ink-500">업종 평균 반영 시 절세 여력</p>
              <p className="text-xl font-semibold text-emerald-700">최대 {won(result.potentialSaving)}</p>
              <p className="text-[11px] text-ink-500">
                * 단순 누진세율 가정. 지방소득세(10%) 별도. 실제 신고는 세무사 상담 필요.
              </p>
            </>
          )}
        </aside>
      </div>

      {result && (
        <section className="mt-6 space-y-3">
          <p className="font-semibold">절세 체크리스트</p>
          {result.tips.map((t, i) => (
            <div key={i} className="rounded-lg border border-ink-100 bg-white p-4">
              <p className="font-medium">✓ {t.title}</p>
              <p className="text-sm text-ink-700 mt-1">{t.desc}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
