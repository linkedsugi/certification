#!/usr/bin/env node
// Build-time helper: swap the Prisma datasource provider from sqlite (local dev)
// to postgresql (production / Firebase App Hosting). Used inside `build:firebase`.
//
// The committed `prisma/schema.prisma` keeps `provider = "sqlite"` so a fresh
// `git clone` works without any external DB. Firebase containers are ephemeral,
// so mutating the file in-place during the build is safe.

import { readFileSync, writeFileSync } from "node:fs";

const path = "prisma/schema.prisma";
const before = readFileSync(path, "utf-8");

if (!/provider\s*=\s*"sqlite"/.test(before)) {
  console.log("[prepare-prod-schema] schema is already non-sqlite — skipping");
  process.exit(0);
}

const after = before.replace(
  /provider\s*=\s*"sqlite"/,
  'provider = "postgresql"',
);

writeFileSync(path, after);
console.log("[prepare-prod-schema] schema.prisma → provider = postgresql");
