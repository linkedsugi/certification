import { NextRequest, NextResponse } from "next/server";
import { LEVEL_META, toCertLevel } from "@/lib/cert";

// Minimal SVG badge per CertLevel. Renders MC logo + level code + name.
export async function GET(_req: NextRequest, { params }: { params: { filename: string } }) {
  const name = params.filename.replace(/\.svg$/i, "");
  const level = toCertLevel(name.toUpperCase());
  const meta = LEVEL_META[level];

  // 5 distinct colour themes for LV0..LV4
  const theme: Record<string, [string, string]> = {
    LV0: ["#7180f7", "#4a55e6"],
    LV1: ["#4a55e6", "#2a319c"],
    LV2: ["#f59e0b", "#d97706"], // Lv.2 Creator – gold, the flagship
    LV3: ["#10b981", "#059669"],
    LV4: ["#ef4444", "#b91c1c"],
  };
  const [c1, c2] = theme[level];

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="hl" cx="30%" cy="25%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.4)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <polygon points="200,20 360,110 360,290 200,380 40,290 40,110" fill="url(#g)" />
  <polygon points="200,20 360,110 360,290 200,380 40,290 40,110" fill="url(#hl)" />
  <polygon points="200,55 325,130 325,270 200,345 75,270 75,130" fill="none" stroke="white" stroke-opacity="0.55" stroke-width="2"/>
  <text x="200" y="165" font-family="sans-serif" font-size="28" font-weight="700" fill="white" text-anchor="middle" letter-spacing="2">MindCanvas</text>
  <text x="200" y="230" font-family="sans-serif" font-size="78" font-weight="800" fill="white" text-anchor="middle">${meta.code}</text>
  <text x="200" y="280" font-family="sans-serif" font-size="32" font-weight="700" fill="white" text-anchor="middle">${meta.name}</text>
  <text x="200" y="315" font-family="sans-serif" font-size="16" fill="white" fill-opacity="0.85" text-anchor="middle">AI + X Certification</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, immutable",
    },
  });
}
