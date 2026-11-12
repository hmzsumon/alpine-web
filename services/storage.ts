/* ────────── only drafts/UUIDs are stored locally, scoped by account AND restaurant ────────── */
import type { Session, Draft, Pending } from "../types";
import { DEFAULT_SERVER } from "../config";
let runtimeServer = DEFAULT_SERVER;
const prefix = () => "alpine.web." + runtimeServer + ".";
export async function loadServer() {
  const response = await fetch("/api/config", { cache: "no-store" });
  if (!response.ok) throw Error("সার্ভারের সেটিং পাওয়া যায়নি।");
  const data = await response.json();
  runtimeServer = data.realtimeUrl;
  return runtimeServer;
}
export const saveServer = async (value: string) => {
  runtimeServer = value;
};
export const saveSession = async (_session: Session) => {};
export async function loadSession(): Promise<Session | null> {
  const r = await fetch("/api/session", { cache: "no-store" });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error("সার্ভারের সংযোগ দেখুন।");
  const data = await r.json();
  return { ...data, server: runtimeServer };
}
export const clearSession = async () => {
  await fetch("/api/session", { method: "DELETE" }).catch(() => {});
};
export async function loadDraft(
  id: string,
): Promise<{ draft: Draft; pending: Pending | null } | null> {
  const value = localStorage.getItem(prefix() + id);
  return value ? JSON.parse(value) : null;
}
export async function saveDraft(
  id: string,
  draft: Draft,
  pending: Pending | null,
) {
  localStorage.setItem(prefix() + id, JSON.stringify({ draft, pending }));
}
export const operationKey = (id: string) => prefix() + "action." + id;
