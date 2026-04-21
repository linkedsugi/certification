import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { baseUrlFromRequest, buildAssertion } from "@/lib/openbadge";

export async function GET(req: NextRequest, { params }: { params: { certNumber: string } }) {
  const cert = await prisma.certificate.findUnique({
    where: { certNumber: decodeURIComponent(params.certNumber) },
    include: { recipient: true, app: true },
  });
  if (!cert) {
    return NextResponse.json(
      { error: "certificate not found", certNumber: params.certNumber },
      { status: 404 },
    );
  }
  const doc = buildAssertion(baseUrlFromRequest(req), cert);
  return NextResponse.json(doc, {
    headers: {
      "Content-Type": "application/ld+json",
      "Cache-Control": "private, max-age=60",
    },
  });
}
