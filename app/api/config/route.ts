/* ────────── public connection address only; never expose database or service credentials ────────── */
import { json, apiBase } from "@/lib/upstream";
export const dynamic = "force-dynamic";
export async function GET() {
  return json({
    realtimeUrl:
      process.env.WAITER_REALTIME_URL ||
      process.env.NEXT_PUBLIC_REALTIME_URL ||
      apiBase(),
  });
}
