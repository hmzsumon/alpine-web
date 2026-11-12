"use client";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useWaiterContext } from "@/context/WaiterContext";
import { statusLabel, stationLabel, bnDigits } from "@/utils/menuNames";
import { Title, Button } from "../ui/Primitives";
export default function ReceiptScreen() {
  const c = useWaiterContext(),
    r = c.receipt;
  const signature = c.operations.batches
    .filter((b) => b.orderId === r?.order.id)
    .map((b) => b.orderStatus + b.history.length)
    .join("|");
  useEffect(() => {
    if (r?.order.id) void c.openReceipt(r.order.id);
  }, [signature]);
  if (!r) return null;
  const table =
    c.bootstrap?.tables.find((t) => t.id === r.order.table) ||
    (r.order.orderType === "takeaway"
      ? { id: "PARCEL", floor: "", seats: 0, occupied: true, orders: [] }
      : undefined);
  return (
    <section className="page">
      <CheckCircle2 size={42} className="text-alpine mb-4" />
      <Title
        title="অর্ডার সেভ হয়েছে।"
        detail={
          (r.order.parcelToken || r.order.table) +
          " · " +
          statusLabel(r.order.status)
        }
      />
      <p className="muted text-xs break-all mt-3">{r.order.id}</p>
      <p className="muted text-xs mt-3">
        {r.order.paymentStatus === "paid" || r.order.status === "Paid"
          ? "পরিশোধিত"
          : "পেমেন্ট বাকি"}
      </p>
      <p className="notice my-5">
        প্রতিটি কিচেনে আলাদা KOT যাবে। প্রিন্টারে তথ্য পাঠানো এবং কাগজ বের হওয়া
        আলাদা বিষয়—কিচেনে মিলিয়ে নিন।
      </p>
      <h2 className="font-bold mb-3">কিচেনের টিকিট</h2>
      <div className="space-y-3">
        {r.tickets.map((t) => (
          <article className="card" key={t.id}>
            <div className="flex justify-between gap-2">
              <strong>{stationLabel(t.station, c.bootstrap?.kitchens)}</strong>
              <span className="pill green">
                {(
                  {
                    queued: "অপেক্ষমাণ",
                    sent: "পাঠানো হয়েছে",
                    failed: "ব্যর্থ",
                    printing: "পাঠানো হচ্ছে",
                  } as Record<string, string>
                )[t.status] || t.status}
              </span>
            </div>
            <p className="muted text-xs mt-2">
              {t.kind} · {t.id.slice(-10)}
            </p>
            <div className="divide-y divide-white/10 mt-3">
              {t.lines.map((l, i) => (
                <div key={i} className="py-3 text-sm">
                  <strong>
                    {bnDigits(l.quantity)} × {l.nameBn || l.name}
                  </strong>
                  <span className="muted text-xs block mt-1">
                    {l.fulfillment === "parcel" ? "পার্সেল" : "এখানে খাবেন"}
                    {l.note ? " · " + l.note : ""}
                  </span>
                </div>
              ))}
            </div>
            {t.error && <p className="error-text">{t.error}</p>}
          </article>
        ))}
      </div>
      <Button
        secondary
        className="w-full mt-5"
        busy={c.busy}
        onClick={() => void c.openReceipt(r.order.id)}
      >
        KOT-এর অবস্থা আপডেট করুন
      </Button>
      {table &&
        r.order.paymentStatus !== "paid" &&
        !["Paid", "Cancelled"].includes(r.order.status) && (
          <Button
            className="w-full mt-3"
            onClick={() => c.chooseTable(table, r.order.id)}
          >
            এই অর্ডারে আরও খাবার যোগ করুন
          </Button>
        )}
      <Button
        secondary
        className="w-full mt-3"
        onClick={() => c.navigate("tables")}
      >
        টেবিলে ফিরে যান
      </Button>
    </section>
  );
}
