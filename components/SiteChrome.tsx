"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  user: { name: string; role: string } | null;
  children: React.ReactNode;
};

export default function SiteChrome({ user, children }: Props) {
  const pathname = usePathname() ?? "";
  // Embedded demo apps hide the main chrome so they look like standalone apps.
  if (pathname.startsWith("/demo/")) return <>{children}</>;

  return (
    <>
      <header className="border-b border-ink-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <nav className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-ink-900">
            <span className="inline-block w-7 h-7 rounded-lg bg-brand-600 text-white grid place-items-center text-xs">MC</span>
            <span>MindCanvas Certification</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/apps" className="text-ink-700 hover:text-ink-900">AppCanvas</Link>
            <Link href="/learner" className="text-ink-700 hover:text-ink-900">학습자</Link>
            <Link href="/reviewer" className="text-ink-700 hover:text-ink-900">심사</Link>
            <Link href="/verify" className="text-ink-700 hover:text-ink-900">인증서 확인</Link>
            {user ? (
              <form action="/api/auth/logout" method="POST">
                <button className="btn-ghost">{user.name} · 로그아웃</button>
              </form>
            ) : (
              <Link href="/login" className="btn-primary">로그인</Link>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
      <footer className="mx-auto max-w-6xl px-5 py-10 text-xs text-ink-500">
        © 2026 주식회사 마인드캔버스 · MindCanvas Inc. · Certification Platform
      </footer>
    </>
  );
}
