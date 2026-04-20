import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { CHECKLIST } from "@/lib/cert";
import { submitReview } from "./actions";

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["REVIEWER", "DOMAIN_EXPERT", "ADMIN"].includes(user.role)) redirect("/");

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      app: true,
      leadLearner: true,
      teamMembers: { include: { user: true } },
      review: { include: { reviewer1: true, reviewer2: true } },
    },
  });
  if (!submission) notFound();

  const review = submission.review;
  const readOnly = !!review?.completedAt;

  return (
    <div className="grid md:grid-cols-[2fr_3fr] gap-6 items-start">
      <section className="space-y-4">
        <div className="card p-5">
          <p className="text-xs text-ink-500">심사 대상 앱</p>
          <h1 className="text-xl font-bold mt-1">{submission.app.name}</h1>
          <p className="text-sm text-ink-700 mt-2">{submission.app.oneLiner}</p>
          <p className="text-xs text-ink-500 mt-3">
            도메인: <b>{submission.app.domain}</b>
            <br />제출자: {submission.leadLearner.name}
            {submission.teamName && <> · 팀 {submission.teamName}</>}
          </p>
          {submission.teamMembers.length > 0 && (
            <div className="mt-3 text-xs">
              <p className="text-ink-500">팀 구성</p>
              <ul className="mt-1 space-y-0.5">
                {submission.teamMembers.map((m) => (
                  <li key={m.id}>· {m.user.name} — {m.role}</li>
                ))}
              </ul>
            </div>
          )}
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-ink-700">상세 설명</summary>
            <p className="mt-2 whitespace-pre-wrap text-ink-700">{submission.app.description}</p>
          </details>
        </div>
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
            <p className="text-sm font-medium">앱 실시간 시연</p>
            <a href={submission.app.runUrl} target="_blank" className="text-xs text-brand-600 hover:underline">
              새 탭에서 열기 ↗
            </a>
          </div>
          <iframe
            src={submission.app.runUrl}
            className="w-full h-[520px] bg-white"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </section>

      <section>
        <form action={submitReview} className="card p-5 space-y-6">
          <input type="hidden" name="submissionId" value={submission.id} />
          <div>
            <h2 className="font-semibold">Lv.2 Creator 체크리스트</h2>
            <p className="text-xs text-ink-500 mt-1">
              9개 항목 중 “미달” 0건 → 통과 / 보완 있으면 조건부 통과 (2주 내 재심사) / 미달 1건 이상 → 미달
            </p>
          </div>

          {CHECKLIST.map((area) => (
            <div key={area.id} className="space-y-3">
              <div className="flex items-baseline gap-2">
                <p className="font-semibold">{area.title}</p>
                <p className="text-xs text-ink-500">{area.subtitle}</p>
              </div>
              {area.items.map((item) => {
                const existing = review?.[item.key] ?? "PENDING";
                return (
                  <div key={item.key} className="rounded-lg border border-ink-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{item.code}. {item.label}</p>
                        <p className="text-xs text-ink-500 mt-1">{item.criterion}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {(["PASS", "REVISE", "FAIL"] as const).map((v) => {
                          const label = { PASS: "통과", REVISE: "보완", FAIL: "미달" }[v];
                          const cls = {
                            PASS: "bg-emerald-50 text-emerald-700 border-emerald-200",
                            REVISE: "bg-amber-50 text-amber-800 border-amber-200",
                            FAIL: "bg-rose-50 text-rose-700 border-rose-200",
                          }[v];
                          return (
                            <label key={v}
                              className={`cursor-pointer text-xs px-2.5 py-1 rounded-md border ${cls} has-[:checked]:ring-2 has-[:checked]:ring-offset-1 has-[:checked]:ring-current`}>
                              <input type="radio" name={item.key} value={v}
                                className="sr-only" required
                                defaultChecked={existing === v}
                                disabled={readOnly} />
                              {label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div>
            <label className="field-label">강점</label>
            <textarea name="strengths" rows={2} className="input" defaultValue={review?.strengths ?? ""} disabled={readOnly} />
          </div>
          <div>
            <label className="field-label">보완 사항</label>
            <textarea name="improvements" rows={2} className="input" defaultValue={review?.improvements ?? ""} disabled={readOnly} />
          </div>
          <div>
            <label className="field-label">AppCanvas 등록 권고</label>
            <select name="registrationAdvice" className="input" defaultValue={review?.registrationAdvice ?? "IMMEDIATE"} disabled={readOnly}>
              <option value="IMMEDIATE">즉시 등록 가능</option>
              <option value="UI_POLISH_FIRST">UI 보완 후 등록 권장</option>
              <option value="NEEDS_DEVELOPMENT">추가 개발 필요</option>
            </select>
          </div>

          {readOnly ? (
            <div className="pt-2">
              <p className="text-sm">심사 완료: <b>{review?.overall}</b></p>
              <p className="text-xs text-ink-500 mt-1">
                심사관 1: {review?.reviewer1?.name} · 심사관 2: {review?.reviewer2?.name ?? "-"}
              </p>
            </div>
          ) : (
            <div className="pt-2 flex gap-3">
              <button className="btn-primary" type="submit">심사 제출 및 결과 반영</button>
              <a href="/reviewer" className="btn-secondary">뒤로</a>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
