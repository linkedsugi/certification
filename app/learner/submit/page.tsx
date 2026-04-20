import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { submitApp } from "./actions";

export default async function SubmitAppPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const courses = await prisma.course.findMany();
  const learners = await prisma.user.findMany({ where: { role: "LEARNER" } });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">AppCanvas 앱 등록 · Lv.2 심사 제출</h1>
      <p className="text-sm text-ink-500 mt-1">
        AI+X 교육에서 만든 앱을 등록하고, 3영역 9항목 심사를 요청합니다.
      </p>
      <form action={submitApp} className="mt-6 card p-6 space-y-4">
        <div>
          <label className="field-label">앱 이름</label>
          <input name="name" required className="input" placeholder="예: 약물 상호작용 체커" />
        </div>
        <div>
          <label className="field-label">도메인 (X)</label>
          <input name="domain" required className="input" placeholder="간호학 / 세무 / 건축 …"
            defaultValue={user.domain ?? ""} />
          <p className="text-xs text-ink-500 mt-1">인증서에는 “AI + {user.domain ?? "도메인"}” 형태로 기재됩니다.</p>
        </div>
        <div>
          <label className="field-label">한 줄 설명 (누구의 어떤 문제를 해결?)</label>
          <input name="oneLiner" required className="input" />
        </div>
        <div>
          <label className="field-label">상세 설명</label>
          <textarea name="description" required rows={4} className="input" />
        </div>
        <div>
          <label className="field-label">실행 URL (iframe 임베드 가능한 공개 URL)</label>
          <input name="runUrl" type="url" required className="input" placeholder="https://your-app.vercel.app" />
          <p className="text-xs text-ink-500 mt-1">
            심사·인증서·AppCanvas에서 이 URL을 iframe으로 불러옵니다. X-Frame-Options 미설정 필수.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="field-label">교육 과정</label>
            <select name="courseCode" required className="input">
              <option value="">선택</option>
              {courses.map((c) => <option key={c.id} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">기수</label>
            <input name="cohort" required defaultValue="2026-1" className="input" />
          </div>
        </div>
        <div>
          <label className="field-label">팀명 (개인 프로젝트는 비워두세요)</label>
          <input name="teamName" className="input" />
        </div>
        <div>
          <label className="field-label">내 역할</label>
          <input name="role" required className="input" placeholder="예: 기획 · 프롬프트 설계 · UI" />
          <p className="text-xs text-ink-500 mt-1">팀 프로젝트도 인증은 개인별로 발급되며 역할이 인증서에 기재됩니다.</p>
        </div>
        <details>
          <summary className="text-sm cursor-pointer">팀원 추가 (선택)</summary>
          <div className="mt-2 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <select name={`teamMemberId_${i}`} className="input">
                  <option value="">팀원 선택</option>
                  {learners.filter((l) => l.id !== user.id).map((l) => (
                    <option key={l.id} value={l.id}>{l.name} · {l.domain ?? "-"}</option>
                  ))}
                </select>
                <input name={`teamMemberRole_${i}`} placeholder="역할" className="input" />
              </div>
            ))}
          </div>
        </details>
        <div className="pt-2 flex gap-3">
          <button className="btn-primary" type="submit">제출 및 심사 요청</button>
          <a href="/learner" className="btn-secondary">취소</a>
        </div>
      </form>
    </div>
  );
}
