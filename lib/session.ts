// Minimal cookie-based pseudo-auth for MVP.
// Real auth (NextAuth / Clerk / SSO) is future work.

import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "mc_uid";

export async function getCurrentUser() {
  const id = cookies().get(COOKIE_NAME)?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export function setSessionCookie(userId: string) {
  cookies().set({
    name: COOKIE_NAME,
    value: userId,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}
