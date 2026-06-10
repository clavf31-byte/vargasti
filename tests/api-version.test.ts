/**
 * Automated test for /api/version endpoint.
 *
 * Validates the build identifier is:
 *   1. Returned in the expected JSON shape and format
 *   2. Stable across consecutive requests (same buildId, only `timestamp` changes)
 *
 * Runs against both the dev (preview) and production deployments.
 *
 * Usage:
 *   bun test tests/api-version.test.ts
 *
 * Override URLs via env:
 *   DEV_URL=https://...lovable.app PROD_URL=https://vargasti.lovable.app bun test
 */
import { describe, expect, test } from "bun:test";

const DEV_URL =
  process.env.DEV_URL ??
  "https://id-preview--7986ff08-8133-4212-8727-07856cd99021.lovable.app";
const PROD_URL = process.env.PROD_URL ?? "https://vargasti.lovable.app";

const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BUILD_NUM_RE = /^\d{3,}$/;
const HASH_RE = /^[a-z0-9]{3,40}$/i;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

type VersionPayload = {
  version: string;
  gitHash: string;
  buildNumber: string;
  buildDate: string;
  timestamp: string;
};

async function fetchVersion(baseUrl: string): Promise<VersionPayload> {
  const res = await fetch(`${baseUrl}/api/version`, {
    headers: { "cache-control": "no-cache" },
  });
  expect(res.status, `${baseUrl}/api/version status`).toBe(200);
  return (await res.json()) as VersionPayload;
}

function buildId(p: VersionPayload): string {
  return `${p.version}+${p.buildNumber}.${p.gitHash}.${p.buildDate}`;
}

function assertShape(p: VersionPayload, label: string) {
  expect(p.version, `${label} version`).toMatch(SEMVER_RE);
  expect(p.gitHash, `${label} gitHash`).toMatch(HASH_RE);
  expect(p.buildNumber, `${label} buildNumber`).toMatch(BUILD_NUM_RE);
  expect(p.buildDate, `${label} buildDate`).toMatch(DATE_RE);
  expect(p.timestamp, `${label} timestamp`).toMatch(ISO_RE);
}

describe.each([
  ["dev", DEV_URL],
  ["prod", PROD_URL],
])("/api/version on %s (%s)", (label, baseUrl) => {
  test("returns the expected JSON shape", async () => {
    const payload = await fetchVersion(baseUrl);
    assertShape(payload, label);
  });

  test("buildId is stable across consecutive requests", async () => {
    const [a, b] = await Promise.all([
      fetchVersion(baseUrl),
      fetchVersion(baseUrl),
    ]);
    expect(buildId(a)).toBe(buildId(b));
    // Only `timestamp` is allowed to drift between requests.
    expect(a.version).toBe(b.version);
    expect(a.gitHash).toBe(b.gitHash);
    expect(a.buildNumber).toBe(b.buildNumber);
    expect(a.buildDate).toBe(b.buildDate);
  });
});
