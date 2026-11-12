/* ────────── narrowly scoped staff endpoints; no arbitrary URL, admin proxy or anonymous access ────────── */
import { NextRequest } from "next/server";
import {
  cookieName,
  sameOrigin,
  json,
  upstream,
  networkError,
} from "@/lib/upstream";
export const dynamic = "force-dynamic";
function allowed(method: string, path: string) {
  return method === "GET"
    ? /^(waiter\/(bootstrap|orders\/[^/]+|requests\/[^/]+)|operations(?:\/notifications)?)$/.test(
        path,
      )
    : /^(waiter\/orders(?:\/[^/]+\/items)?|operations\/(batches\/[^/]+|notifications\/[^/]+\/read))$/.test(
        path,
      );
}
async function proxy(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const token = req.cookies.get(cookieName)?.value;
  if (!token) return json({ error: "লগইন করুন।" }, 401);
  const path = params.path.join("/");
  if (!allowed(req.method, path))
    return json({ error: "এই রুট অনুমোদিত নয়।" }, 404);
  if (req.method !== "GET" && !sameOrigin(req))
    return json({ error: "অনুমোদিত পেজ ব্যবহার করুন।" }, 403);
  try {
    let body;
    if (req.method !== "GET") {
      const raw = await req.text();
      if (raw.length > 131072) return json({ error: "অর্ডার অনেক বড়।" }, 413);
      body = JSON.parse(raw);
    }
    const { data, status } = await upstream(
      "/api/" + params.path.map(encodeURIComponent).join("/"),
      token,
      body,
      req.method,
    );
    const response = json(data, status);
    if (status === 401) response.cookies.delete(cookieName);
    return response;
  } catch {
    return networkError();
  }
}
export const GET = proxy;
export const POST = proxy;
