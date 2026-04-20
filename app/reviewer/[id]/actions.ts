"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  CHECKLIST_ITEMS,
  computeOverall,
  nextCertNumber,
  type ChecklistKey,
  type Verdict,
} from "@/lib/cert";

export async function submitReview(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  if (!["REVIEWER", "DOMAIN_EXPERT", "ADMIN"].includes(user.role)) {
    throw new Error("심사 권한이 없습니다.");
  }

  const submissionId = String(formData.get("submissionId"));
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { app: true, leadLearner: true, teamMembers: true },
  });
  if (!submission) throw new Error("제출물을 찾을 수 없습니다.");

  // Collect 9 verdicts.
  const scores = {} as Record<ChecklistKey, Verdict>;
  for (const item of CHECKLIST_ITEMS) {
    const v = String(formData.get(item.key) || "PENDING") as Verdict;
    scores[item.key] = v;
  }
  const strengths = (formData.get("strengths") as string) || null;
  const improvements = (formData.get("improvements") as string) || null;
  const registrationAdvice = (formData.get("registrationAdvice") as string) || "IMMEDIATE";
  const overall = computeOverall(scores);
  if (overall === "PENDING") throw new Error("9개 항목 모두 선택해야 합니다.");

  // Upsert Review
  const reviewerRole = user.role;
  const reviewer1Id = reviewerRole === "DOMAIN_EXPERT" ? /* 임시: 나 자신이 domain expert라도 심사관1로 먼저 수용 */ user.id : user.id;
  const reviewer2Id = reviewerRole === "DOMAIN_EXPERT" ? user.id : null;

  await prisma.review.upsert({
    where: { submissionId },
    update: {
      ...scores,
      strengths,
      improvements,
      registrationAdvice: registrationAdvice as any,
      overall: overall as any,
      completedAt: new Date(),
    },
    create: {
      submissionId,
      reviewer1Id,
      reviewer2Id,
      ...scores,
      strengths,
      improvements,
      registrationAdvice: registrationAdvice as any,
      overall: overall as any,
      completedAt: new Date(),
    },
  });

  // Transition submission + app status
  const nextStatus =
    overall === "PASS" ? "APPROVED" :
    overall === "CONDITIONAL" ? "CONDITIONAL" : "REJECTED";
  await prisma.submission.update({ where: { id: submissionId }, data: { status: nextStatus as any } });
  await prisma.appCanvas.update({
    where: { id: submission.appId },
    data: {
      status: nextStatus as any,
      canvasSeed: overall === "PASS",
    },
  });

  // If PASS → issue Certificates for each team member.
  if (overall === "PASS") {
    const year = new Date().getFullYear();
    for (const member of submission.teamMembers) {
      const existing = await prisma.certificate.findFirst({
        where: { recipientId: member.userId, appId: submission.appId, level: "LV2" },
      });
      if (existing) continue;
      // Sequence: count of existing certs in same year + domain letter.
      const dom = submission.app.domain.replace(/^AI\s*\+\s*/i, "").trim();
      const issuedCount = await prisma.certificate.count({
        where: {
          issuedAt: { gte: new Date(`${year}-01-01`) },
          domain: submission.app.domain,
        },
      });
      await prisma.certificate.create({
        data: {
          certNumber: nextCertNumber({ year, domain: dom, sequence: issuedCount + 1 }),
          level: "LV2",
          recipientId: member.userId,
          appId: submission.appId,
          domain: submission.app.domain,
          teamName: submission.teamName,
          teamRole: member.role,
          publicSlug: crypto.randomBytes(6).toString("hex"),
        },
      });
      // Upgrade learner's achieved level on enrollment (latest one)
      await prisma.enrollment.updateMany({
        where: { userId: member.userId, cohort: submission.cohort },
        data: { achievedLevel: "LV2" },
      });
    }
  }

  redirect(`/reviewer/${submissionId}`);
}
