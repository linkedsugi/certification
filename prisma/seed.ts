import { PrismaClient } from "@prisma/client";
import { nextCertNumber } from "../lib/cert";
import crypto from "node:crypto";

const CertLevel = { LV0: "LV0", LV1: "LV1", LV2: "LV2", LV3: "LV3", LV4: "LV4" } as const;
const Role = { LEARNER: "LEARNER", REVIEWER: "REVIEWER", DOMAIN_EXPERT: "DOMAIN_EXPERT", ADMIN: "ADMIN" } as const;
const AppStatus = {
  DRAFT: "DRAFT", SUBMITTED: "SUBMITTED", UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED", CONDITIONAL: "CONDITIONAL", REJECTED: "REJECTED", PUBLISHED: "PUBLISHED",
} as const;
const Verdict = { PENDING: "PENDING", PASS: "PASS", REVISE: "REVISE", FAIL: "FAIL" } as const;
const OverallVerdict = { PENDING: "PENDING", PASS: "PASS", CONDITIONAL: "CONDITIONAL", FAIL: "FAIL" } as const;
const RegistrationAdvice = { IMMEDIATE: "IMMEDIATE", UI_POLISH_FIRST: "UI_POLISH_FIRST", NEEDS_DEVELOPMENT: "NEEDS_DEVELOPMENT" } as const;

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // ---- Courses (per 커리큘럼-인증 레벨 매핑 from design doc) ----
  const courses = [
    { code: "FAC-INTRO",   name: "교수 입문 (2일)",      durationDays: 2, targetLevel: CertLevel.LV0, description: "프롬프트 활용 + AI 수업 아이디어" },
    { code: "FAC-ADV",     name: "교수 심화 (4일)",      durationDays: 4, targetLevel: CertLevel.LV2, description: "Block A + Block B. Block B 마지막 날 데모데이" },
    { code: "STAFF",       name: "직원 교육 (4일)",      durationDays: 4, targetLevel: CertLevel.LV2, description: "1차 + 2차 자동화 앱. 2차 마지막 날 데모데이" },
    { code: "STUDENT",     name: "학생 교육 (4일)",      durationDays: 4, targetLevel: CertLevel.LV2, description: "1차 + 2차 팀 AI+X 앱. 2차 마지막 날 데모데이 경진대회" },
  ];
  for (const c of courses) {
    await prisma.course.upsert({ where: { code: c.code }, update: {}, create: c });
  }

  // ---- Users ----
  const admin = await prisma.user.upsert({
    where: { email: "admin@mindcanvas.kr" },
    update: {},
    create: { email: "admin@mindcanvas.kr", name: "MindCanvas Admin", role: Role.ADMIN },
  });
  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@mindcanvas.kr" },
    update: {},
    create: { email: "reviewer@mindcanvas.kr", name: "김심사 (MindCanvas)", role: Role.REVIEWER },
  });
  const expert = await prisma.user.upsert({
    where: { email: "prof.nurse@univ.kr" },
    update: {},
    create: { email: "prof.nurse@univ.kr", name: "박교수 (간호학)", role: Role.DOMAIN_EXPERT, domain: "간호학" },
  });
  const learner = await prisma.user.upsert({
    where: { email: "nurse.kim@hospital.kr" },
    update: {},
    create: { email: "nurse.kim@hospital.kr", name: "김간호", role: Role.LEARNER, domain: "간호학" },
  });
  const learner2 = await prisma.user.upsert({
    where: { email: "tax.lee@office.kr" },
    update: {},
    create: { email: "tax.lee@office.kr", name: "이세무", role: Role.LEARNER, domain: "세무" },
  });

  // ---- Enrollment (learner completes STAFF course) ----
  const staffCourse = await prisma.course.findUnique({ where: { code: "STAFF" } });
  if (staffCourse) {
    await prisma.enrollment.upsert({
      where: { userId_courseId_cohort: { userId: learner.id, courseId: staffCourse.id, cohort: "2026-1" } },
      update: {},
      create: {
        userId: learner.id,
        courseId: staffCourse.id,
        cohort: "2026-1",
        completedAt: new Date("2026-03-28"),
        achievedLevel: CertLevel.LV1,
      },
    });
  }

  // ---- Sample App: 약물 상호작용 체커 ----
  const app1 = await prisma.appCanvas.upsert({
    where: { slug: "drug-interaction-checker" },
    update: {},
    create: {
      slug: "drug-interaction-checker",
      name: "약물 상호작용 체커",
      oneLiner: "간호사가 투약 전 처방 약 간 상호작용을 30초 안에 확인하도록 돕는 도구",
      description:
        "환자의 복용 약물 리스트를 입력하면 임상 가이드라인에 기반한 상호작용 경고와 대체 약물 제안을 제공합니다. 20년 임상 간호 경력의 현장 지식이 반영된 프롬프트를 사용합니다.",
      domain: "AI + 간호학",
      runUrl: "https://example-appcanvas.vercel.app/drug-checker",
      thumbnailUrl: null,
      status: AppStatus.SUBMITTED,
      createdById: learner.id,
    },
  });

  // ---- Submission + Team member ----
  const submission = await prisma.submission.upsert({
    where: { id: "seed-submission-1" },
    update: {},
    create: {
      id: "seed-submission-1",
      appId: app1.id,
      leadLearnerId: learner.id,
      cohort: "2026-1",
      status: AppStatus.SUBMITTED,
    },
  });
  await prisma.submissionTeamMember.upsert({
    where: { submissionId_userId: { submissionId: submission.id, userId: learner.id } },
    update: {},
    create: { submissionId: submission.id, userId: learner.id, role: "기획 · 프롬프트 설계" },
  });

  // ---- Sample App 2: 세무 절세 계산기 (아직 DRAFT) ----
  await prisma.appCanvas.upsert({
    where: { slug: "tax-saving-calc" },
    update: {},
    create: {
      slug: "tax-saving-calc",
      name: "종합소득세 절세 계산기",
      oneLiner: "자영업자가 경비·공제 항목을 입력하면 예상 세액과 절세 포인트를 알려주는 도구",
      description: "20년 세무 경력 기반 프롬프트로 업종별 평균 경비율, 절세 체크리스트를 제시합니다.",
      domain: "AI + 세무",
      runUrl: "https://example-appcanvas.vercel.app/tax-saver",
      status: AppStatus.DRAFT,
      createdById: learner2.id,
    },
  });

  // ---- Pre-approved sample: 다른 간호 앱 + 인증서 (for demo) ----
  const app2 = await prisma.appCanvas.upsert({
    where: { slug: "nurse-handover-summarizer" },
    update: {},
    create: {
      slug: "nurse-handover-summarizer",
      name: "간호 인계 요약기",
      oneLiner: "교대 시 환자 노트를 SBAR 포맷 3문단으로 자동 정리",
      description: "간호 기록 원문을 입력하면 Situation-Background-Assessment-Recommendation 포맷으로 요약합니다.",
      domain: "AI + 간호학",
      runUrl: "https://example-appcanvas.vercel.app/handover",
      status: AppStatus.APPROVED,
      canvasSeed: true,
      createdById: learner.id,
    },
  });

  const demoSubmission = await prisma.submission.upsert({
    where: { id: "seed-submission-2" },
    update: {},
    create: {
      id: "seed-submission-2",
      appId: app2.id,
      leadLearnerId: learner.id,
      cohort: "2026-1",
      status: AppStatus.APPROVED,
    },
  });
  await prisma.submissionTeamMember.upsert({
    where: { submissionId_userId: { submissionId: demoSubmission.id, userId: learner.id } },
    update: {},
    create: { submissionId: demoSubmission.id, userId: learner.id, role: "기획 · 프롬프트 설계 · UI" },
  });
  await prisma.review.upsert({
    where: { submissionId: demoSubmission.id },
    update: {},
    create: {
      submissionId: demoSubmission.id,
      reviewer1Id: reviewer.id,
      reviewer2Id: expert.id,
      completedAt: new Date(),
      item_1_1: Verdict.PASS, item_1_2: Verdict.PASS, item_1_3: Verdict.PASS,
      item_2_1: Verdict.PASS, item_2_2: Verdict.PASS, item_2_3: Verdict.PASS,
      item_3_1: Verdict.PASS, item_3_2: Verdict.PASS, item_3_3: Verdict.PASS,
      strengths: "SBAR 포맷 출력이 정확하고, 민감 정보(환자명·번호)는 자동 마스킹된다.",
      improvements: "-",
      registrationAdvice: RegistrationAdvice.IMMEDIATE,
      overall: OverallVerdict.PASS,
    },
  });

  const cert = await prisma.certificate.upsert({
    where: { certNumber: "MC-2026-N-0001" },
    update: {},
    create: {
      certNumber: nextCertNumber({ year: 2026, domain: "간호학", sequence: 1 }),
      level: CertLevel.LV2,
      recipientId: learner.id,
      appId: app2.id,
      domain: "AI + 간호학",
      teamRole: "기획 · 프롬프트 설계 · UI",
      publicSlug: crypto.randomBytes(6).toString("hex"),
    },
  });

  console.log("Seed OK");
  console.log("Admin:", admin.email);
  console.log("Reviewer:", reviewer.email);
  console.log("Domain expert:", expert.email);
  console.log("Learner:", learner.email);
  console.log("Sample cert:", cert.certNumber, "→ /cert/" + cert.publicSlug);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
