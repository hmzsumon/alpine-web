"use client";
import { useState } from "react";
import { useWaiterContext } from "@/context/WaiterContext";
import { Title, Button, Empty } from "../ui/Primitives";
import ServiceBatchCard from "../operations/ServiceBatchCard";
export default function OperationsScreen() {
  const c = useWaiterContext(),
    [tab, setTab] = useState("active"),
    operator =
      c.session?.user.mobileMode === "operator" ||
      c.session?.user.role === "kitchen";
  const batches = c.operations.batches.filter((b) => {
    const history =
      b.orderStatus === "Cancelled" ||
      b.lines.every((l) => l.served === l.quantity);
    return tab === "history"
      ? history
      : tab === "ready"
        ? !history && b.lines.some((l) => l.ready > l.collected)
        : !history;
  });
  return (
    <section className="page">
      <Title
        eyebrow={operator ? "স্টেশনের দায়িত্ব" : "খাবার সংগ্রহ ও সার্ভ"}
        title={operator ? "কিচেনের অর্ডার" : "প্রস্তুতির খবর"}
      />
      <p
        className={
          "text-xs my-3 " +
          (c.operations.connected ? "text-alpine" : "text-amber-300")
        }
      >
        {c.operations.connected
          ? "● সরাসরি সংযুক্ত"
          : "● পুনরায় সংযোগের অপেক্ষায় — স্বয়ংক্রিয় রিফ্রেশ চলছে"}
      </p>
      <p className="muted text-xs leading-6">
        {operator
          ? "শুধু আপনার নির্ধারিত স্টেশনের কাজ দেখানো হচ্ছে।"
          : "আপনার অর্ডারের প্রস্তুত খাবার সংগ্রহ ও সার্ভ নিশ্চিত করুন।"}
      </p>
      {operator && !c.session?.user.stations?.length && (
        <p className="notice mt-3">
          আপনাকে কোনো স্টেশন বরাদ্দ দেওয়া হয়নি। অ্যাডমিনকে জানান।
        </p>
      )}
      {c.operations.error && (
        <p role="alert" className="error-text my-3">
          {c.operations.error}
        </p>
      )}
      {c.operations.pending && (
        <div className="notice mt-4">
          <p className="mb-3">একটি কাজের নিশ্চয়তা পাওয়া বাকি</p>
          <Button
            busy={c.operations.busy}
            onClick={() =>
              void c.operations.perform(
                c.operations.pending!.id,
                c.operations.pending!.action,
              )
            }
          >
            একই কাজ আবার পাঠান
          </Button>
        </div>
      )}
      <div className="chips my-5">
        {[
          ["active", "চলমান"],
          ["ready", "সংগ্রহের অপেক্ষায়"],
          ["history", "ইতিহাস"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {batches.map((b) => (
          <ServiceBatchCard key={b.id + ":" + b.history.length} batch={b} />
        ))}
      </div>
      {!batches.length && (
        <Empty title="কোনো কাজ নেই" detail="নতুন অর্ডার এলে এখানে দেখা যাবে।" />
      )}
    </section>
  );
}
