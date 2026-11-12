/* ────────── same Alpine restaurant contract, browser transport ────────── */
import { bnDigits } from "../utils/menuNames";
export const DEFAULT_SERVER =
  process.env.NEXT_PUBLIC_REALTIME_URL || "http://127.0.0.1:4100";
export const EMPTY_DRAFT = { table: "", items: [], note: "" };
export const money = (value: number) =>
  "৳" + bnDigits(value.toLocaleString("en-BD", { maximumFractionDigits: 2 }));
