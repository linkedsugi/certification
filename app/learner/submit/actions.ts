"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w가-힣 -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export async function submitApp(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const name = String(formData.get("name"));
  const domain = String(formData.get("domain"));
  const oneLiner = String(formData.get("oneLiner"));
  const description = String(formData.get("description"));
  const runUrl = String(formData.get("runUrl"));
  const courseCode = String(formData.get("courseCode"));
  const cohort = String(formData.get("cohort"));
  const teamName = (formData.get("teamName") as string | null) || null;
  const leadRole = String(formData.get("role") || "기획");

  // Unique slug: append counter on collision.
  let slug = slugify(name) || `app-${Date.now().toString(36)}`;
  const existing = await prisma.appCanvas.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const app = await prisma.appCanvas.create({
    data: {
      slug,
      name,
      domain: domain.startsWith("AI +") ? domain : `AI + ${domain}`,
      oneLiner,
      description,
      runUrl,
      status: "SUBMITTED",
      createdById: user.id,
    },
  });

  const submission = await prisma.submission.create({
    data: {
      appId: app.id,
      leadLearnerId: user.id,
      cohort,
      teamName: teamName || null,
      status: "SUBMITTED",
      teamMembers: {
        create: { userId: user.id, role: leadRole },
      },
    },
  });

  // Extra team members
  for (let i = 0; i < 3; i++) {
    const mid = formData.get(`teamMemberId_${i}`) as string | null;
    const mrole = formData.get(`teamMemberRole_${i}`) as string | null;
    if (mid && mrole) {
      await prisma.submissionTeamMember.create({
        data: { submissionId: submission.id, userId: mid, role: mrole },
      }).catch(() => { /* ignore dup */ });
    }
  }

  // Ensure enrollment exists for this cohort/course
  if (courseCode) {
    const course = await prisma.course.findUnique({ where: { code: courseCode } });
    if (course) {
      await prisma.enrollment.upsert({
        where: { userId_courseId_cohort: { userId: user.id, courseId: course.id, cohort } },
        update: {},
        create: { userId: user.id, courseId: course.id, cohort },
      });
    }
  }

  redirect("/learner");
}
