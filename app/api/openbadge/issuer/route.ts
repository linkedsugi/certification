import { NextRequest, NextResponse } from "next/server";
import { buildIssuer, baseUrlFromRequest } from "@/lib/openbadge";

export async function GET(req: NextRequest) {
  const doc = buildIssuer(baseUrlFromRequest(req));
  return NextResponse.json(doc, {
    headers: {
      "Content-Type": "application/ld+json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
