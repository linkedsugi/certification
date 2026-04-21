"use client";

import { useState } from "react";

type Props = {
  baseUrl: string;
  certNumber: string;
  level: string;
  recipientName: string;
  issuedAt: string;
  publicSlug: string;
};

export default function OpenBadgeSection(props: Props) {
  const { baseUrl, certNumber, level, recipientName, issuedAt, publicSlug } = props;
  const [copied, setCopied] = useState<string | null>(null);

  const assertionUrl = `${baseUrl}/api/openbadge/assertion/${certNumber}`;
  const badgeclassUrl = `${baseUrl}/api/openbadge/badgeclass/${level}`;
  const issuerUrl = `${baseUrl}/api/openbadge/issuer`;
  const imageUrl = `${baseUrl}/api/openbadge/image/${level}.svg`;
  const issuedDate = new Date(issuedAt);

  // LinkedIn "Add to profile" deep link for certifications.
  // Docs: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/add-to-profile-certifications
  const linkedInUrl = new URL("https://www.linkedin.com/profile/add");
  linkedInUrl.searchParams.set("startTask", "CERTIFICATION_NAME");
  linkedInUrl.searchParams.set("name", `MindCanvas AI+X ${level.replace("LV", "Creator Lv.")}`);
  linkedInUrl.searchParams.set("organizationName", "MindCanvas Inc.");
  linkedInUrl.searchParams.set("issueYear", String(issuedDate.getFullYear()));
  linkedInUrl.searchParams.set("issueMonth", String(issuedDate.getMonth() + 1));
  linkedInUrl.searchParams.set("certUrl", `${baseUrl}/cert/${publicSlug}`);
  linkedInUrl.searchParams.set("certId", certNumber);

  // Open source validator (Canvas Badges/Badgr) can verify hosted Open Badges.
  const validatorUrl = `https://openbadgeapp.badgr.com/verify?url=${encodeURIComponent(assertionUrl)}`;

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  async function downloadJson() {
    const res = await fetch(assertionUrl);
    const json = await res.text();
    const blob = new Blob([json], { type: "application/ld+json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${certNumber}.openbadge.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start gap-4">
        <img src={imageUrl} alt="Open Badge" className="w-20 h-20 rounded-lg border border-ink-100" />
        <div>
          <p className="text-xs text-brand-600 font-medium">Open Badges 3.0 · W3C Verifiable Credential</p>
          <h3 className="font-semibold text-ink-900 mt-0.5">이 인증서를 Open Badge로 받기</h3>
          <p className="text-sm text-ink-700 mt-1">
            LinkedIn · Credly · Canvas Badges 등 국제 표준 지갑에 바로 추가할 수 있습니다.
            evidence 필드에 <b>실제로 동작하는 앱 링크</b>가 포함됩니다 — 이것이 MindCanvas Open Badge의 차별점입니다.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <a
          href={linkedInUrl.toString()}
          target="_blank"
          rel="noopener"
          className="btn-primary justify-center"
        >
          LinkedIn 프로필에 추가 →
        </a>
        <button type="button" className="btn-secondary justify-center" onClick={downloadJson}>
          JSON-LD 다운로드 (.json)
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <CopyRow label="Assertion URL" value={assertionUrl} onCopy={copy} copied={copied === "a"} copiedKey="a" />
        <CopyRow label="Achievement URL" value={badgeclassUrl} onCopy={copy} copied={copied === "b"} copiedKey="b" />
        <CopyRow label="Issuer URL" value={issuerUrl} onCopy={copy} copied={copied === "i"} copiedKey="i" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-ink-100 text-xs text-ink-500">
        <p>외부 검증기로 확인하기 (Badgr Open Badge Validator)</p>
        <a href={validatorUrl} target="_blank" rel="noopener" className="text-brand-600 hover:underline">
          검증하기 ↗
        </a>
      </div>

      <p className="text-[11px] text-ink-500 leading-relaxed">
        수여자: <b>{recipientName}</b>. 본 Open Badge는 MindCanvas 도메인 hosted verification으로
        유효성이 입증됩니다. 서명된 VC (JWS/Linked Data Proof)는 Phase 2에서 추가될 예정입니다.
      </p>
    </div>
  );
}

function CopyRow({
  label, value, onCopy, copied, copiedKey,
}: {
  label: string;
  value: string;
  onCopy: (v: string, k: string) => void;
  copied: boolean;
  copiedKey: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-500 w-32 shrink-0">{label}</span>
      <code className="flex-1 truncate rounded bg-ink-100/60 px-2 py-1 text-[11px]">{value}</code>
      <button
        type="button"
        onClick={() => onCopy(value, copiedKey)}
        className="text-xs text-brand-600 hover:underline shrink-0"
      >
        {copied ? "복사됨!" : "복사"}
      </button>
    </div>
  );
}
