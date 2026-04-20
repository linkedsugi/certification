import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AppCanvasListPage() {
  const apps = await prisma.appCanvas.findMany({
    where: { status: { in: ["APPROVED", "PUBLISHED"] } },
    orderBy: { updatedAt: "desc" },
    include: { createdBy: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-brand-600 text-sm font-medium">AppCanvas</p>
        <h1 className="text-2xl font-bold">인증된 AI+X 앱</h1>
        <p className="text-sm text-ink-500 mt-1">
          Lv.2 Creator 심사를 통과한 앱만 노출됩니다. 구독 하나로 모든 앱 무제한 사용.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.length === 0 && (
          <p className="text-sm text-ink-500">아직 인증된 앱이 없습니다.</p>
        )}
        {apps.map((a) => (
          <Link key={a.id} href={`/apps/${a.slug}`} className="card p-5 hover:border-brand-300 transition">
            <p className="text-xs text-brand-600">{a.domain}</p>
            <p className="font-semibold mt-1">{a.name}</p>
            <p className="text-sm text-ink-700 mt-2 line-clamp-3">{a.oneLiner}</p>
            <p className="text-xs text-ink-500 mt-4">by {a.createdBy.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
