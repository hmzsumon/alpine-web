/* ────────── cookie-authenticated same-origin requests; sockets alone use the in-memory token ────────── */
import type { Session } from "../types";
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
export const serverAddress = (value: string) => value;
export async function api<T>(
  _server: string,
  path: string,
  _token?: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const login = path === "/api/auth/login",
    logout = path === "/api/auth/logout";
  const url =
    login || logout
      ? "/api/session"
      : "/api/backend/" + path.replace(/^\/api\//, "");
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 22000);
  try {
    const response = await fetch(url, {
      method: logout
        ? "DELETE"
        : method || (body === undefined ? "GET" : "POST"),
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: logout || body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(data.error || "কাজটি সম্পন্ন হয়নি।", response.status);
    return data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      "সার্ভারের উত্তর পাওয়া যায়নি। একই অনুরোধ আবার পাঠান।",
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}
export const signedApi = <T>(
  s: Session,
  path: string,
  body?: unknown,
  method?: string,
) => api<T>(s.server, path, s.token, body, method);
