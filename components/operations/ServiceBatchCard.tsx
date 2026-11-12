"use client";
import { useState } from "react";
import { useWaiterContext } from "@/context/WaiterContext";
import type { ServiceBatch } from "@/types";
import { bnDigits, stationLabel } from "@/utils/menuNames";
import { Button } from "../ui/Primitives";
export default function ServiceBatchCard({ batch }: { batch: ServiceBatch }) {
  const c = useWaiterContext(),
    [quantities, setQuantities] = useState(
      batch.lines.map((l) => String(l.quantity)),
    ),
    prepare = !!c.session?.user.permissions.includes("operations:prepare"),
    serve = !!c.session?.user.permissions.includes("operations:serve");
  const closed = batch.orderStatus === "Cancelled",
    complete = batch.lines.every((l) => l.served === l.quantity),
    ready = batch.lines.every((l) => l.ready === l.quantity),
    locked = c.operations.busy || !!c.operations.pending;
  function act(action: string, values?: number[]) {
    if (
      confirm(
        action === "ready"
          ? "প্রস্তুত পরিমাণ নিশ্চিত করলে ওয়েটার খবর পাবে। নিশ্চিত করবেন?"
          : "এই কাজের সময় ও আপনার নাম সেভ হবে। নিশ্চিত করবেন?",
      )
    )
      void c.operations.perform(batch.id, action, values);
  }
  return (
    <article className={"card " + (ready ? "border-alpine/70" : "")}>
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-2xl font-bold">
          {batch.parcelToken || batch.table}
        </h2>
        <span className="pill green">
          {closed
            ? "বাতিল"
            : complete
              ? "সার্ভ সম্পন্ন"
              : ready
                ? "প্রস্তুত"
                : batch.acceptedAt
                  ? "তৈরি হচ্ছে"
                  : "নতুন"}
        </span>
      </div>
      <p className="text-sm mt-3">
        {stationLabel(batch.station, c.bootstrap?.kitchens)} · {batch.waiter}
      </p>
      <p className="muted text-xs mt-1">
        {new Date(batch.createdAt).toLocaleString("bn-BD")} ·{" "}
        {batch.orderId.slice(-8)}
      </p>
      <div className="divide-y divide-white/10">
        {batch.lines.map((line, i) => (
          <div className="py-4" key={i}>
            <strong className="text-base leading-7">
              {line.fulfillment === "parcel"
                ? "📦 পার্সেল · "
                : "এখানে খাবেন · "}
              {bnDigits(line.quantity)} × {line.nameBn || line.name}
            </strong>
            {line.nameBn && <p className="english">{line.name}</p>}
            {line.note && (
              <p className="text-amber-300 text-sm mt-2">
                নির্দেশনা: {line.note}
              </p>
            )}
            <p className="muted text-xs leading-6 mt-2">
              প্রস্তুত {bnDigits(line.ready)}/{bnDigits(line.quantity)} · সংগ্রহ{" "}
              {bnDigits(line.collected)} · সার্ভ {bnDigits(line.served)}
            </p>
            {prepare &&
              !closed &&
              batch.acceptedAt &&
              line.ready < line.quantity && (
                <label className="mt-2">
                  মোট প্রস্তুত পরিমাণ
                  <input
                    disabled={locked}
                    type="number"
                    min={line.ready}
                    max={line.quantity}
                    value={quantities[i]}
                    onChange={(e) =>
                      setQuantities((q) =>
                        q.map((v, n) => (n === i ? e.target.value : v)),
                      )
                    }
                    className="max-w-24"
                  />
                </label>
              )}
          </div>
        ))}
      </div>
      {!closed && !complete && (
        <div className="space-y-2 mt-3">
          {prepare && !batch.acceptedAt && (
            <Button
              className="w-full"
              disabled={locked}
              onClick={() => act("accept")}
            >
              গ্রহণ করেছি — তৈরি শুরু
            </Button>
          )}
          {prepare && batch.acceptedAt && !ready && (
            <Button
              className="w-full"
              disabled={
                locked ||
                batch.lines.some(
                  (l, i) =>
                    !Number.isInteger(Number(quantities[i])) ||
                    Number(quantities[i]) < l.ready ||
                    Number(quantities[i]) > l.quantity,
                )
              }
              onClick={() =>
                act(
                  "ready",
                  batch.lines.map((l, i) =>
                    l.ready === l.quantity ? l.ready : Number(quantities[i]),
                  ),
                )
              }
            >
              প্রস্তুত / প্যাকিং সম্পন্ন
            </Button>
          )}
          {serve && batch.lines.some((l) => l.ready > l.collected) && (
            <Button
              className="w-full"
              disabled={locked}
              onClick={() =>
                act(
                  "collect",
                  batch.lines.map((l) => l.ready),
                )
              }
            >
              প্রস্তুত খাবার সংগ্রহ করেছি
            </Button>
          )}
          {serve && batch.lines.some((l) => l.collected > l.served) && (
            <Button
              className="w-full"
              disabled={locked}
              onClick={() =>
                act(
                  "serve",
                  batch.lines.map((l) => l.collected),
                )
              }
            >
              কাস্টমারকে সার্ভ / পার্সেল হস্তান্তর করেছি
            </Button>
          )}
        </div>
      )}
      {batch.history.length > 0 && (
        <p className="muted text-xs mt-4">
          সর্বশেষ: {batch.history[batch.history.length - 1].actor} ·{" "}
          {
            (
              {
                accept: "গ্রহণ",
                ready: "প্রস্তুত",
                collect: "সংগ্রহ",
                serve: "সার্ভ",
              } as Record<string, string>
            )[batch.history[batch.history.length - 1].action]
          }
        </p>
      )}
    </article>
  );
}
