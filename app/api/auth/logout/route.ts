import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  clearSessionCookie();
  return NextResponse.redirect(new URL("/", req.url));
}
