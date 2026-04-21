import { NextRequest, NextResponse } from "next/server";
import { baseUrlFromRequest, buildAchievement } from "@/lib/openbadge";
import { toCertLevel } from "@/lib/cert";

export async function GET(req: NextRequest, { params }: { params: { level: string } }) {
  const level = toCertLevel(params.level.toUpperCase());
  const doc = buildAchievement(baseUrlFromRequest(req), level);
  return NextResponse.json(doc, {
    headers: {
      "Content-Type": "application/ld+json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
