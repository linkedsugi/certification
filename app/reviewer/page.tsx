import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "심사 대기",
  UNDER_REVIEW: "심사 중",
  APPROVED: "승인됨",
  CONDITIONAL: "조건부 통과",
  REJECTED: "미달",
  PUBLISHED: "정식 등록",
};

export default async function ReviewerQueue() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["REVIEWER", "DOMAIN_EXPERT", "ADMIN"].includes(user.role)) {
    redirect("/");
  }

  const submissions = await prisma.submission.findMany({
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    include: {
      app: true,
      leadLearner: true,
      review: true,
      teamMembers: { include: { user: true } },
    },
  });

  const buckets: Record<string, typeof submissions> = {
    pending: submissions.filter((s) => s.status === "SUBMITTED" || s.status === "UNDER_REVIEW"),
    done: submissions.filter((s) => ["APPROVED", "CONDITIONAL", "REJECTED", "PUBLISHED"].includes(s.status)),
  };

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-ink-500">Reviewer Console</p>
        <h1 className="text-2xl font-bold">Lv.2 Creator 심사</h1>
        <p className="text-sm text-ink-500 mt-1">3영역 9항목 · 통과/보완/미달 · 앱당 10~15분</p>
      </div>

      <section>
        <h2 className="font-semibold">대기열 ({buckets.pending.length})</h2>
        <div className="mt-3 card divide-y divide-ink-100">
          {buckets.pending.length === 0 && <p className="p-4 text-sm text-ink-500">대기 중인 심사가 없습니다.</p>}
          {buckets.pending.map((s) => (
            <Link key={s.id} href={`/reviewer/${s.id}`} className="flex items-center justify-between p-4 hover:bg-ink-100/40">
              <div>
                <p className="font-medium">{s.app.name} <span className="text-xs text-ink-500 ml-2">{s.app.domain}</span></p>
                <p className="text-xs text-ink-500 mt-1">
                  제출자 {s.leadLearner.name} · 기수 {s.cohort}
                  {s.teamName && ` · 팀 ${s.teamName} (${s.teamMembers.length}명)`}
                </p>
                <p className="text-sm text-ink-700 mt-1 line-clamp-1">{s.app.oneLiner}</p>
              </div>
              <span className="badge-pending">{STATUS_LABEL[s.status] ?? s.status}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">완료된 심사 ({buckets.done.length})</h2>
        <div className="mt-3 card divide-y divide-ink-100">
          {buckets.done.length === 0 && <p className="p-4 text-sm text-ink-500">완료된 심사가 없습니다.</p>}
          {buckets.done.map((s) => (
            <Link key={s.id} href={`/reviewer/${s.id}`} className="flex items-center justify-between p-4 hover:bg-ink-100/40">
              <div>
                <p className="font-medium">{s.app.name}</p>
                <p className="text-xs text-ink-500 mt-1">
                  {s.leadLearner.name} · {s.app.domain}
                </p>
              </div>
              <span className={
                s.status === "APPROVED" || s.status === "PUBLISHED" ? "badge-pass" :
                s.status === "CONDITIONAL" ? "badge-revise" :
                s.status === "REJECTED" ? "badge-fail" : "badge-pending"
              }>{STATUS_LABEL[s.status] ?? s.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
