import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function LoginPage() {
  const users = await prisma.user.findMany({ orderBy: { role: "asc" } });
  const ROLE_LABEL: Record<string, string> = {
    ADMIN: "관리자",
    REVIEWER: "심사관 (MindCanvas)",
    DOMAIN_EXPERT: "도메인 전문가",
    LEARNER: "학습자",
  };
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">로그인 (데모)</h1>
        <p className="text-ink-500 text-sm mt-1">
          MVP 단계에서는 실제 인증 없이 시드 사용자로 역할 전환만 가능합니다. 실제 배포 시 NextAuth/SSO로 교체 예정입니다.
        </p>
      </div>
      <div className="card divide-y divide-ink-100">
        {users.map((u) => (
          <form key={u.id} method="POST" action="/api/auth/login" className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-ink-500">{u.email} · {ROLE_LABEL[u.role] ?? u.role}{u.domain ? ` · ${u.domain}` : ""}</p>
            </div>
            <input type="hidden" name="userId" value={u.id} />
            <button className="btn-primary">이 역할로 로그인</button>
          </form>
        ))}
      </div>
      <div className="text-center">
        <Link href="/" className="text-sm text-ink-500 hover:text-ink-900">← 홈으로</Link>
      </div>
    </div>
  );
}
