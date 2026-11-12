/* ────────── split or move a draft portion without changing totals or pending payloads ────────── */
import type { OrderLine } from "../types";
type Mode = "dine_in" | "parcel";
export function moveCartPortion(
  items: OrderLine[],
  id: string,
  from: Mode,
  to: Mode,
  count: number,
): OrderLine[] {
  if (
    !["dine_in", "parcel"].includes(from) ||
    !["dine_in", "parcel"].includes(to)
  )
    throw new Error("পরিবেশন ঠিক করুন।");
  const source = items.find(
    (line) => line.menuId === id && (line.fulfillment || "dine_in") === from,
  );
  if (
    !source ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > source.quantity
  )
    throw new Error("সঠিক পরিমাণ দিন।");
  if (from === to) return items;
  const target = items.find(
    (line) => line.menuId === id && (line.fulfillment || "dine_in") === to,
  );
  if (
    target &&
    (target.quantity + count > 99 ||
      target.price !== source.price ||
      target.station !== source.station)
  )
    throw new Error("একই লাইনে সর্বোচ্চ ৯৯টি এবং একই দাম রাখতে হবে।");
  if (target && (target.note || "").trim() !== (source.note || "").trim())
    throw new Error(
      "দুই অংশের রান্নার নির্দেশনা আলাদা। নির্দেশনা মিলিয়ে তারপর পরিবেশন বদলান।",
    );
  const result = items
    .map((line) =>
      line === source
        ? { ...line, quantity: line.quantity - count }
        : line === target
          ? { ...line, quantity: line.quantity + count }
          : { ...line },
    )
    .filter((line) => line.quantity > 0);
  if (!target) result.push({ ...source, quantity: count, fulfillment: to });
  if (result.length > 80)
    throw new Error("এক অর্ডারে সর্বোচ্চ ৮০টি আলাদা লাইন রাখা যাবে।");
  return result;
}
