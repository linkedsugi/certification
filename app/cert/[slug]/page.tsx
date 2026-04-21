import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { LEVEL_META, toCertLevel } from "@/lib/cert";
import OpenBadgeSection from "@/components/OpenBadgeSection";
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const cert = await prisma.certificate.findUnique({
    where: { publicSlug: params.slug },
    include: { recipient: true, app: true },
  });
  if (!cert) return { title: "인증서를 찾을 수 없습니다" };
  const t = `${cert.recipient.name} · MindCanvas AI+X ${LEVEL_META[toCertLevel(cert.level)].name}`;
  return {
    title: t,
    description: cert.app
      ? `${cert.domain} — 앱 "${cert.app.name}" 실행 링크 포함`
      : `${cert.domain} — MindCanvas AI+X Certificate`,
  };
}

export default async function CertPage({ params }: { params: { slug: string } }) {
  const cert = await prisma.certificate.findUnique({
    where: { publicSlug: params.slug },
    include: { recipient: true, app: true },
  });
  if (!cert) notFound();

  const level = LEVEL_META[toCertLevel(cert.level)];
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const verifyUrl = `/verify?cert=${encodeURIComponent(cert.certNumber)}`;
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    `${baseUrl}/cert/${cert.publicSlug}`,
  )}`;

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        {/* Certificate header */}
        <div className="bg-gradient-to-br from-brand-700 to-brand-500 text-white px-8 py-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-brand-100 text-xs uppercase tracking-widest">MindCanvas AI+X Certification</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-bold">
                {level.code} {level.name}
              </h1>
              <p className="text-brand-100 mt-1">{level.short}</p>
            </div>
            <img src={qrSrc} alt="QR" className="w-24 h-24 bg-white rounded-md p-1" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-brand-100 text-xs">인증자</p>
              <p className="text-2xl font-bold mt-0.5">{cert.recipient.name}</p>
              <p className="text-brand-100 mt-0.5">{cert.domain}</p>
            </div>
            <div>
              <p className="text-brand-100 text-xs">인증번호</p>
              <p className="font-mono text-lg mt-0.5">{cert.certNumber}</p>
              <p className="text-brand-100 mt-0.5">발급일 {issuedDate}</p>
            </div>
          </div>
          {cert.teamName && (
            <div className="mt-4 text-sm">
              <p className="text-brand-100 text-xs">팀 / 역할</p>
              <p className="mt-0.5">{cert.teamName} · {cert.teamRole}</p>
            </div>
          )}
        </div>

        {/* Living part: the actual app */}
        {cert.app ? (
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
              <div>
                <p className="text-xs text-ink-500">인증 결과물 · 살아있는 증명</p>
                <p className="font-semibold">{cert.app.name}</p>
                <p className="text-sm text-ink-700">{cert.app.oneLiner}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/apps/${cert.app.slug}`} className="btn-secondary">앱 상세</Link>
                <a href={cert.app.runUrl} target="_blank" className="btn-primary">새 탭에서 실행 ↗</a>
              </div>
            </div>
            <iframe
              title="living-certificate-app"
              src={cert.app.runUrl}
              className="w-full h-[560px] bg-white"
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
            />
          </div>
        ) : (
          <div className="px-6 py-8 text-sm text-ink-500">
            이 인증 레벨은 앱과 직접 연동되지 않습니다. ({level.description})
          </div>
        )}
      </div>

      <div className="card p-5 text-sm text-ink-700 space-y-2">
        <p>
          <b>이 인증서는 “살아있는 인증서”입니다.</b> 위 영역에서 바로 앱을 사용해 볼 수 있습니다.
          일반 자격증은 “시험 통과”만 증명하지만, MindCanvas 인증은 <b>실제로 만든 앱이 동작함</b>을 증명합니다.
        </p>
        <p>
          위조 여부는 <Link href={verifyUrl} className="text-brand-600 hover:underline">인증서 확인 페이지</Link>에서
          인증번호 <span className="font-mono">{cert.certNumber}</span>로 확인 가능합니다.
        </p>
      </div>

      <OpenBadgeSection
        baseUrl={baseUrl}
        certNumber={cert.certNumber}
        level={toCertLevel(cert.level)}
        recipientName={cert.recipient.name}
        issuedAt={cert.issuedAt.toISOString()}
        publicSlug={cert.publicSlug}
      />
    </div>
  );
}
