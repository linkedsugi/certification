import Link from "next/link";
import { LEVEL_META } from "@/lib/cert";

export default function HomePage() {
  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-brand-600 text-sm font-medium">MindCanvas AI+X Certification</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight text-ink-900">
            살아있는 인증서.
            <br />
            <span className="text-brand-600">링크를 누르면 앱이 실행됩니다.</span>
          </h1>
          <p className="mt-4 text-ink-700 leading-relaxed">
            AI+X 교육을 수료하고, AppCanvas에 자신의 AI 앱을 등록하세요.
            심사를 통과하면 <b>“동작하는 앱”</b>이 포함된 디지털 인증서가 발급됩니다.
            면접관이든 학교 관계자든, 인증서의 링크를 클릭하는 순간 당신의 실력을 실제로 체험합니다.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/learner" className="btn-primary">학습자로 시작</Link>
            <Link href="/apps" className="btn-secondary">AppCanvas 둘러보기</Link>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-ink-900">3단계 플로우</h3>
          <ol className="mt-4 space-y-4 text-sm">
            <li className="flex gap-3">
              <span className="w-7 h-7 grid place-items-center rounded-full bg-brand-50 text-brand-700 font-semibold shrink-0">1</span>
              <div>
                <p className="font-medium">AI+X 교육 수료</p>
                <p className="text-ink-500">교수·직원·학생 과정 중 하나를 마치고 결과물(앱)을 만듭니다.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-7 h-7 grid place-items-center rounded-full bg-brand-50 text-brand-700 font-semibold shrink-0">2</span>
              <div>
                <p className="font-medium">AppCanvas에 앱 등록 · Lv.2 심사</p>
                <p className="text-ink-500">3영역 9항목 체크리스트 심사(MindCanvas + 도메인 전문가). 앱당 10~15분.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-7 h-7 grid place-items-center rounded-full bg-brand-50 text-brand-700 font-semibold shrink-0">3</span>
              <div>
                <p className="font-medium">살아있는 인증서 발급</p>
                <p className="text-ink-500">인증서에 앱 실행 링크가 포함됩니다. 이력서·학교·투자자 제시용.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* 레벨 체계 */}
      <section>
        <h2 className="text-2xl font-bold text-ink-900">인증 레벨 체계</h2>
        <p className="mt-2 text-ink-500 text-sm">
          Lv.0~Lv.2는 교육이 “밀어주는” 구간, Lv.3~Lv.4는 AppCanvas 실적으로 “증명하는” 구간.
        </p>
        <div className="mt-6 grid md:grid-cols-5 gap-3">
          {(["LV0","LV1","LV2","LV3","LV4"] as const).map((lv) => {
            const m = LEVEL_META[lv];
            const isCore = lv === "LV2";
            return (
              <div key={lv}
                className={`rounded-xl p-4 border ${isCore ? "bg-brand-600 text-white border-brand-600" : "bg-white border-ink-100"}`}>
                <p className={`text-xs font-medium ${isCore ? "text-brand-100" : "text-brand-600"}`}>{m.code}</p>
                <p className="mt-1 font-bold">{m.name}</p>
                <p className={`text-xs ${isCore ? "text-brand-100" : "text-ink-500"}`}>{m.short}</p>
                <p className={`mt-3 text-xs leading-relaxed ${isCore ? "text-brand-50" : "text-ink-700"}`}>{m.description}</p>
                {isCore && (
                  <p className="mt-3 text-[11px] bg-white/10 rounded-md px-2 py-1">
                    ★ 교육과 플랫폼을 잇는 다리 — AppCanvas Seed 자격 자동 부여
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Lv.2 심사 기준 요약 */}
      <section>
        <h2 className="text-2xl font-bold text-ink-900">Lv.2 Creator 심사 — 3영역 9항목</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { t: "기능 동작", s: "Does it work?", items: ["앱 실행", "핵심 플로우", "에러 처리"] },
            { t: "도메인 가치", s: "Does it solve a real problem?", items: ["문제 정의", "도메인 전문성", "실용성"] },
            { t: "사용자 경험", s: "Can someone actually use it?", items: ["첫 사용", "인터페이스", "결과 품질"] },
          ].map((a) => (
            <div key={a.t} className="card p-5">
              <p className="text-xs text-ink-500">{a.s}</p>
              <p className="font-semibold text-ink-900">{a.t}</p>
              <ul className="mt-3 space-y-1 text-sm text-ink-700">
                {a.items.map((i) => <li key={i}>· {i}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-500">
          통과 조건: 9개 항목 중 “미달” 0건. “보완”이 있으면 2주 내 수정 후 재확인.
        </p>
      </section>
    </div>
  );
}
