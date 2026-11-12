"use client";
import { useState } from "react";
import { Armchair, ArrowRight, Package } from "lucide-react";
import { useWaiterContext } from "@/context/WaiterContext";
import { floorLabel, bnDigits } from "@/utils/menuNames";
import { money } from "@/config";
import type { Table } from "@/types";
import { Title, Button, Empty, Modal } from "../ui/Primitives";
export default function TablesScreen() {
  const c = useWaiterContext(),
    [floor, setFloor] = useState("All"),
    [selected, setSelected] = useState<Table | null>(null),
    tables = c.bootstrap?.tables || [];
  return (
    <section className="page">
      <Title
        eyebrow="টেবিল অনুযায়ী অর্ডার"
        title="টেবিল বেছে নিন"
        detail="টেবিল বেছে নিয়ে অর্ডার শুরু করুন।"
      />
      {c.pending && (
        <div className="notice my-4">
          একটি অর্ডারের নিশ্চয়তা বাকি।{" "}
          <button
            className="text-alpine underline"
            onClick={() => c.navigate("cart")}
          >
            সেভ করা অর্ডার দেখুন
          </button>
        </div>
      )}
      <Button
        className="w-full my-5"
        disabled={c.busy}
        onClick={() =>
          c.chooseTable({
            id: "PARCEL",
            name: "পার্সেল",
            floor: "",
            seats: 0,
            occupied: false,
            orders: [],
          })
        }
      >
        <Package size={18} />
        নতুন পার্সেল অর্ডার
      </Button>
      <div className="chips">
        {["All", ...new Set(tables.map((t) => t.floor))].map((f) => (
          <button
            key={f}
            className={floor === f ? "active" : ""}
            onClick={() => setFloor(f)}
          >
            {f === "All" ? "সব ফ্লোর" : floorLabel(f)}
          </button>
        ))}
      </div>
      <p className="muted text-xs my-4">
        {bnDigits(tables.filter((t) => !t.occupied).length)}টি খালি ·{" "}
        {bnDigits(tables.filter((t) => t.occupied).length)}টি ব্যস্ত
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {tables
          .filter((t) => floor === "All" || t.floor === floor)
          .map((t) => (
            <button
              key={t.id}
              className={
                "table-card card text-left " + (t.occupied ? "occupied" : "")
              }
              onClick={() =>
                t.orders.length ? setSelected(t) : c.chooseTable(t)
              }
            >
              <div className="flex justify-between">
                <Armchair
                  size={25}
                  className={t.occupied ? "text-amber-300" : "text-alpine"}
                />
                <span className={"status-dot " + (t.occupied ? "amber" : "")} />
              </div>
              <h2 className="text-2xl font-bold mt-5">{t.name || t.id}</h2>
              <p className="muted text-xs mt-1">
                {bnDigits(t.seats)}টি আসন · {t.occupied ? "ব্যস্ত" : "খালি"}
              </p>
              <div className="flex items-center justify-between border-t border-white/10 mt-4 pt-3 text-xs muted">
                <span>
                  {t.occupied
                    ? bnDigits(t.orders.length) + "টি চলমান অর্ডার"
                    : "অর্ডার শুরু করুন"}
                </span>
                <ArrowRight size={14} />
              </div>
            </button>
          ))}
      </div>
      {!tables.length && (
        <Empty
          title="আপনার জন্য কোনো টেবিল বরাদ্দ নেই"
          detail="অ্যাডমিনকে টেবিল নির্ধারণ করতে বলুন।"
        />
      )}
      {selected && (
        <Modal
          title={(selected.name || selected.id) + " — অর্ডার"}
          close={() => setSelected(null)}
        >
          <p className="muted text-sm mb-3">
            আগের অর্ডারে যোগ করতে অর্ডারটি বাছুন।
          </p>
          {selected.orders.map((o) => (
            <button
              className="card w-full text-left mb-3"
              key={o.id}
              onClick={() => {
                c.chooseTable(selected, o.id);
                setSelected(null);
              }}
            >
              <strong>
                {o.waiter} · {money(o.total)}
              </strong>
              <small className="block muted mt-1">
                আরও খাবার যোগ করুন · {o.id.slice(-8)}
              </small>
            </button>
          ))}
          <Button
            secondary
            className="w-full"
            onClick={() => {
              c.chooseTable(selected);
              setSelected(null);
            }}
          >
            এই টেবিলে নতুন আলাদা অর্ডার
          </Button>
        </Modal>
      )}
    </section>
  );
}
