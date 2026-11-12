"use client";
import { useState } from "react";
import { useWaiterContext } from "@/context/WaiterContext";
import type { OrderLine, MenuItem } from "@/types";
import { foodNames, stationLabel } from "@/utils/menuNames";
import { money } from "@/config";
import { Counter } from "../ui/Primitives";
export default function CartLineCard({ line }: { line: OrderLine }) {
  const c = useWaiterContext(),
    [split, setSplit] = useState(1),
    mode = line.fulfillment || "dine_in",
    locked = c.busy || !!c.pending,
    item: MenuItem = {
      id: line.menuId,
      name: line.name,
      nameBn: line.nameBn,
      category: "",
      price: line.price,
      station: line.station,
      active: true,
    },
    names = foodNames(line);
  return (
    <article className="card">
      <p
        className={
          "text-xs mb-2 " +
          (mode === "parcel" ? "text-amber-300" : "text-alpine")
        }
      >
        {mode === "parcel" ? "📦 পার্সেল — প্যাক করতে হবে" : "এখানে খাবেন"}
      </p>
      <h2 className="font-bold text-base">{names.primary}</h2>
      {names.secondary && <p className="english mt-1">{names.secondary}</p>}
      <p className="muted text-xs mt-2">
        {stationLabel(line.station, c.bootstrap?.kitchens)} · প্রতিটি{" "}
        {money(line.price)}
      </p>
      <div className="flex justify-between items-center my-4">
        <Counter
          value={line.quantity}
          name={names.primary}
          plus={() => c.changeQuantity(item, 1, mode)}
          minus={() => c.changeQuantity(item, -1, mode)}
          disabled={locked}
        />
        <strong>{money(line.price * line.quantity)}</strong>
      </div>
      {c.draft.orderType !== "takeaway" && (
        <div className="serving-box">
          <label>
            এই লাইনের সব খাবার
            <select
              disabled={locked}
              value={mode}
              onChange={(e) =>
                c.moveServing(
                  line.menuId,
                  mode,
                  e.target.value as "dine_in" | "parcel",
                  line.quantity,
                )
              }
            >
              <option value="dine_in">এখানে খাবেন</option>
              <option value="parcel">পার্সেল</option>
            </select>
          </label>
          {line.quantity > 1 && (
            <div className="flex items-end gap-2 mt-2">
              <label className="flex-1">
                কিছু অংশ আলাদা করবেন?
                <input
                  disabled={locked}
                  type="number"
                  min={1}
                  max={line.quantity}
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                />
              </label>
              <button
                className="secondary text-xs"
                disabled={locked}
                onClick={() =>
                  c.moveServing(
                    line.menuId,
                    mode,
                    mode === "parcel" ? "dine_in" : "parcel",
                    split,
                  )
                }
              >
                {mode === "parcel" ? "এখানে খাবেন" : "পার্সেল করুন"}
              </button>
            </div>
          )}
        </div>
      )}
      <label className="mt-3">
        রান্নার নির্দেশনা (ঐচ্ছিক)
        <input
          disabled={locked}
          maxLength={200}
          value={line.note || ""}
          placeholder="কম ঝাল / পেঁয়াজ ছাড়া…"
          onChange={(e) => c.noteLine(line.menuId, e.target.value, mode)}
        />
      </label>
    </article>
  );
}
