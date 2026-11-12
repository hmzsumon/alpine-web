/* ────────── server-only staff proxy; upstream credentials never enter localStorage ────────── */
import { NextRequest, NextResponse } from "next/server";
export const cookieName = "alpine_waiter_session";
export const apiBase = () =>
  (process.env.WAITER_API_URL || "http://127.0.0.1:4100").replace(/\/+$/, "");
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  return (
    req.headers.get("sec-fetch-site") !== "cross-site" &&
    (!origin || new URL(origin).host === req.headers.get("host"))
  );
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function upstream(
  path: string,
  token?: string,
  body?: unknown,
  method?: string,
) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(apiBase() + path, {
      method: method || (body === undefined ? "GET" : "POST"),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
    const data = await response
      .json()
      .catch(() => ({ error: "সার্ভার থেকে সঠিক উত্তর পাওয়া যায়নি।" }));
    return { data, status: response.status };
  } finally {
    clearTimeout(timer);
  }
}
export const networkError = () =>
  json(
    {
      error:
        "লোকাল রেস্টুরেন্ট সার্ভারে সংযোগ হয়নি। ব্যাকএন্ড চালু আছে কি না দেখুন।",
    },
    502,
  );
