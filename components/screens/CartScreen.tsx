"use client";
import { Send, ShieldCheck } from "lucide-react";
import { useWaiterContext } from "@/context/WaiterContext";
import { money } from "@/config";
import { bnDigits, stationLabel } from "@/utils/menuNames";
import { Title, Button, Empty } from "../ui/Primitives";
import CartLineCard from "../cart/CartLineCard";
export default function CartScreen() {
  const c = useWaiterContext(),
    locked = c.busy || !!c.pending;
  return (
    <section className="page">
      <Title
        eyebrow={
          (c.draft.table === "PARCEL"
            ? "শুধু পার্সেল"
            : c.draft.table || "টেবিল বাছাই করুন") +
          " · " +
          (c.draft.orderId ? "আগের বিলে যোগ করুন" : "অর্ডার মিলিয়ে নিন")
        }
        title="আপনার কার্ট"
        detail="খাবার, পরিমাণ ও এখানে খাবেন / পার্সেল মিলিয়ে তারপর কিচেনে পাঠান।"
      />
      {c.pending && (
        <div className="notice my-4">
          <strong>সার্ভারের নিশ্চয়তার অপেক্ষায়</strong>
          <p className="text-xs leading-6 mt-1">
            অর্ডারটি এই ব্রাউজারে সেভ আছে। আবার পাঠালে একই অনুরোধ যাবে; দ্বিতীয়
            অর্ডার হবে না।
          </p>
        </div>
      )}
      <div className="space-y-3 mt-5">
        {c.draft.items.map((line) => (
          <CartLineCard
            key={line.menuId + (line.fulfillment || "dine_in")}
            line={line}
          />
        ))}
      </div>
      {!c.draft.items.length ? (
        <Empty
          title="এখনও খাবার যোগ করা হয়নি"
          detail="মেনু থেকে খাবার বেছে নিন।"
        />
      ) : (
        <>
          <fieldset disabled={locked} className="mt-5 space-y-3">
            {!c.draft.orderId && (
              <>
                <label>
                  কাস্টমারের নাম (ঐচ্ছিক)
                  <input
                    maxLength={100}
                    value={c.draft.customerName || ""}
                    onChange={(e) =>
                      c.setCustomer("customerName", e.target.value)
                    }
                  />
                </label>
                <label>
                  মোবাইল নম্বর (ঐচ্ছিক)
                  <input
                    type="tel"
                    maxLength={30}
                    value={c.draft.customerPhone || ""}
                    onChange={(e) =>
                      c.setCustomer("customerPhone", e.target.value)
                    }
                  />
                </label>
                <label>
                  প্যাকিং চার্জ (৳)
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    step="0.01"
                    value={c.draft.packingCharge || 0}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n) && n >= 0 && n <= 10000)
                        c.setCustomer("packingCharge", n);
                    }}
                  />
                </label>
              </>
            )}
            <label>
              অর্ডারের নির্দেশনা (ঐচ্ছিক)
              <textarea
                maxLength={300}
                rows={2}
                value={c.draft.note}
                onChange={(e) => c.orderNote(e.target.value)}
              />
            </label>
          </fieldset>
          <div className="card mt-5 space-y-3">
            {[...new Set(c.draft.items.map((l) => l.station))].map((s) => (
              <div key={s} className="flex justify-between text-sm">
                <span>{stationLabel(s, c.bootstrap?.kitchens)}</span>
                <span className="text-alpine">
                  {bnDigits(
                    c.draft.items
                      .filter((l) => l.station === s)
                      .reduce((n, l) => n + l.quantity, 0),
                  )}
                  টি · আলাদা KOT
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <span>মোট {bnDigits(c.quantity)}টি খাবার</span>
              <strong className="text-2xl">{money(c.total)}</strong>
            </div>
          </div>
          <Button
            className="w-full mt-5"
            busy={c.busy}
            onClick={() => {
              if (
                c.pending ||
                confirm("খাবার ও পরিমাণ মিলিয়েছেন? কিচেনে পাঠাবেন?")
              )
                void c.send();
            }}
          >
            <Send size={18} />
            {c.pending ? "সেভ করা অর্ডার আবার পাঠান" : "কিচেনে অর্ডার পাঠান"}
          </Button>
          <p className="muted flex items-center justify-center gap-2 text-xs mt-3">
            <ShieldCheck size={14} />
            পাঠানোর আগে সেভ হয় · একই অনুরোধ দুবার নয়
          </p>
        </>
      )}
      <Button
        secondary
        className="w-full mt-5"
        disabled={!!c.pending}
        onClick={() => c.navigate("menu")}
      >
        মেনুতে ফিরে যান
      </Button>
    </section>
  );
}
