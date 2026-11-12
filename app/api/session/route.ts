/* ────────── HttpOnly login; token is released only to the authenticated tab for Socket.IO ────────── */
import { NextRequest } from "next/server";
import {
  cookieName,
  sameOrigin,
  json,
  upstream,
  networkError,
} from "@/lib/upstream";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return json({ error: "অনুমোদিত পেজ থেকে লগইন করুন।" }, 403);
  try {
    const body = await req.json();
    if (
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      body.email.length > 254 ||
      body.password.length > 128
    )
      return json({ error: "মোবাইল / ইমেইল ও পাসওয়ার্ড দিন।" }, 400);
    const { data, status } = await upstream("/api/auth/login", undefined, {
      email: body.email,
      password: body.password,
    });
    if (status !== 200) return json(data, status);
    if (
      data.user.mobileMode === "none" ||
      (!data.user.permissions.includes("orders:create") &&
        !data.user.permissions.includes("operations:prepare"))
    ) {
      await upstream("/api/auth/logout", data.token, {});
      return json(
        { error: "এই অ্যাকাউন্টে ওয়েটার / অপারেটরের অনুমতি নেই।" },
        403,
      );
    }
    const response = json({ token: data.token, user: data.user });
    response.cookies.set(cookieName, data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      path: "/",
      maxAge: Math.min(Number(data.expiresIn) || 43200, 86400),
    });
    return response;
  } catch {
    return networkError();
  }
}
export async function GET(req: NextRequest) {
  const token = req.cookies.get(cookieName)?.value;
  if (!token) return json({ error: "লগইন করুন।" }, 401);
  try {
    const { data, status } = await upstream("/api/auth/me", token);
    const response = json(
      status === 200 ? { token, user: data.user } : data,
      status,
    );
    if (status === 401) response.cookies.delete(cookieName);
    return response;
  } catch {
    return networkError();
  }
}
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req))
    return json({ error: "অনুমোদিত পেজ ব্যবহার করুন।" }, 403);
  const token = req.cookies.get(cookieName)?.value;
  if (token) {
    try {
      await upstream("/api/auth/logout", token, {});
    } catch {}
  }
  const response = json({ success: true });
  response.cookies.delete(cookieName);
  return response;
}
