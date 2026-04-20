import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const userId = String(form.get("userId") ?? "");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.redirect(new URL("/login?error=not_found", req.url));
  setSessionCookie(user.id);
  const dest =
    user.role === "REVIEWER" || user.role === "DOMAIN_EXPERT"
      ? "/reviewer"
      : user.role === "ADMIN"
      ? "/reviewer"
      : "/learner";
  return NextResponse.redirect(new URL(dest, req.url));
}
