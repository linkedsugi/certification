import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AppDetailPage({ params }: { params: { slug: string } }) {
  const app = await prisma.appCanvas.findUnique({
    where: { slug: params.slug },
    include: { createdBy: true, certificates: true },
  });
  if (!app) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs text-brand-600">{app.domain}</p>
          <h1 className="text-2xl font-bold mt-1">{app.name}</h1>
          <p className="text-sm text-ink-700 mt-2">{app.oneLiner}</p>
          <p className="text-xs text-ink-500 mt-3">by {app.createdBy.name}</p>
        </div>
        <a href={app.runUrl} target="_blank" className="btn-primary shrink-0">새 탭에서 실행 ↗</a>
      </div>

      <div className="card p-0 overflow-hidden">
        <iframe
          src={app.runUrl}
          className="w-full h-[640px] bg-white"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
        />
      </div>

      <div className="card p-5">
        <h2 className="font-semibold">상세 설명</h2>
        <p className="text-sm text-ink-700 whitespace-pre-wrap mt-2">{app.description}</p>
      </div>

      {app.certificates.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold">이 앱으로 발급된 인증서</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {app.certificates.map((c) => (
              <li key={c.id}>
                <Link href={`/cert/${c.publicSlug}`} className="text-brand-600 hover:underline">
                  {c.certNumber}
                </Link>
                <span className="text-ink-500 ml-2">· {c.domain}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
