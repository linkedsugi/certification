import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { LEVEL_META, toCertLevel } from "@/lib/cert";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "초안",
  SUBMITTED: "제출됨",
  UNDER_REVIEW: "심사 중",
  APPROVED: "승인",
  CONDITIONAL: "조건부 통과",
  REJECTED: "미달",
  PUBLISHED: "정식 등록",
};

function statusBadge(s: string) {
  const map: Record<string, string> = {
    APPROVED: "badge-pass",
    PUBLISHED: "badge-pass",
    SUBMITTED: "badge-pending",
    UNDER_REVIEW: "badge-pending",
    DRAFT: "badge-pending",
    CONDITIONAL: "badge-revise",
    REJECTED: "badge-fail",
  };
  return <span className={map[s] ?? "badge-pending"}>{STATUS_LABEL[s] ?? s}</span>;
}

export default async function LearnerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [apps, certificates, enrollments] = await Promise.all([
    prisma.appCanvas.findMany({ where: { createdById: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.certificate.findMany({
      where: { recipientId: user.id },
      orderBy: { issuedAt: "desc" },
      include: { app: true },
    }),
    prisma.enrollment.findMany({ where: { userId: user.id }, include: { course: true } }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-ink-500">Learner Dashboard</p>
        <h1 className="text-2xl font-bold">{user.name}님의 학습 · 인증 현황</h1>
        {user.domain && <p className="text-sm text-ink-500 mt-1">도메인: AI + {user.domain}</p>}
      </div>

      <section>
        <h2 className="font-semibold">수료 과정</h2>
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          {enrollments.length === 0 && <p className="text-sm text-ink-500">수강 이력 없음</p>}
          {enrollments.map((e) => (
            <div key={e.id} className="card p-4">
              <p className="font-medium">{e.course.name}</p>
              <p className="text-xs text-ink-500">기수 {e.cohort} · {e.completedAt ? "수료 완료" : "진행 중"}</p>
              {e.achievedLevel && (
                <p className="mt-2 text-xs">도달 레벨: <b>{LEVEL_META[toCertLevel(e.achievedLevel)].code} {LEVEL_META[toCertLevel(e.achievedLevel)].name}</b></p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">내 AppCanvas 앱</h2>
          <Link href="/learner/submit" className="btn-primary">+ 새 앱 등록</Link>
        </div>
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          {apps.length === 0 && <p className="text-sm text-ink-500">아직 등록한 앱이 없습니다.</p>}
          {apps.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-ink-500 mt-1">{a.domain}</p>
                </div>
                {statusBadge(a.status)}
              </div>
              <p className="text-sm text-ink-700 mt-2 line-clamp-2">{a.oneLiner}</p>
              <div className="mt-3 flex gap-2 text-xs">
                <Link href={`/apps/${a.slug}`} className="text-brand-600 hover:underline">앱 실행 페이지 →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">내 인증서</h2>
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          {certificates.length === 0 && <p className="text-sm text-ink-500">발급된 인증서가 없습니다.</p>}
          {certificates.map((c) => (
            <Link key={c.id} href={`/cert/${c.publicSlug}`}
              className="card p-4 hover:border-brand-300 transition">
              <p className="text-xs text-brand-600">{LEVEL_META[toCertLevel(c.level)].code} {LEVEL_META[toCertLevel(c.level)].name}</p>
              <p className="font-semibold mt-1">MindCanvas AI+X {LEVEL_META[toCertLevel(c.level)].name}</p>
              <p className="text-xs text-ink-500 mt-1">{c.domain}</p>
              <p className="text-xs text-ink-500 mt-2">인증번호 {c.certNumber}</p>
              {c.app && <p className="text-xs mt-2">앱: <b>{c.app.name}</b></p>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
