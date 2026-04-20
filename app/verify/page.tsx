import { prisma } from "@/lib/db";
import Link from "next/link";
import { LEVEL_META, toCertLevel } from "@/lib/cert";

export default async function VerifyPage({ searchParams }: { searchParams: { cert?: string } }) {
  const certNumber = (searchParams.cert ?? "").trim();
  const cert = certNumber
    ? await prisma.certificate.findUnique({
        where: { certNumber },
        include: { recipient: true, app: true },
      })
    : null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">인증서 확인</h1>
        <p className="text-sm text-ink-500 mt-1">
          인증번호를 입력하면 MindCanvas에서 발급한 인증서인지, 어떤 앱과 연결되어 있는지 확인합니다.
        </p>
      </div>
      <form method="GET" className="card p-4 flex gap-2">
        <input
          name="cert"
          defaultValue={certNumber}
          className="input"
          placeholder="예: MC-2026-N-0001"
        />
        <button className="btn-primary">확인</button>
      </form>

      {certNumber && !cert && (
        <div className="card p-5 text-sm text-rose-700 bg-rose-50 border-rose-200">
          해당 인증번호로 발급된 인증서를 찾을 수 없습니다.
        </div>
      )}

      {cert && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="badge-pass">유효</span>
            <p className="text-sm text-ink-500">MindCanvas Inc. 발급 · 검증 완료</p>
          </div>
          <p className="text-lg font-bold">
            {cert.recipient.name} · {LEVEL_META[toCertLevel(cert.level)].code} {LEVEL_META[toCertLevel(cert.level)].name}
          </p>
          <p className="text-sm">도메인: <b>{cert.domain}</b></p>
          <p className="text-sm">발급일: {new Date(cert.issuedAt).toLocaleDateString("ko-KR")}</p>
          {cert.app && <p className="text-sm">앱: <b>{cert.app.name}</b></p>}
          {cert.revokedAt ? (
            <p className="text-sm text-rose-700">※ 본 인증서는 {new Date(cert.revokedAt).toLocaleDateString("ko-KR")}에 철회되었습니다.</p>
          ) : (
            <Link href={`/cert/${cert.publicSlug}`} className="btn-primary mt-3">
              살아있는 인증서 보기 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
