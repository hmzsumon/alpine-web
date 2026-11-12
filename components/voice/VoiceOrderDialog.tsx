/* ── Component: review spoken quantities and ambiguous matches before touching the cart ── */
"use client";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { useState } from "react";
import { Mic } from "lucide-react";
import { useWaiterContext } from "@/context/WaiterContext";
import { useSpeech } from "@/hooks/useSpeech";
import { parseVoiceOrder, type VoiceRow } from "@/utils/voiceOrder";
import { Modal, Button } from "../ui/Primitives";
export default function VoiceOrderDialog({ close }: { close: () => void }) {
  const c = useWaiterContext(),
    [text, setText] = useState(""),
    [rows, setRows] = useState<VoiceRow[]>([]),
    [error, setError] = useState("");
  const speech = useSpeech((value) => {
      setText(value);
      setRows([]);
    }),
    menu = c.bootstrap?.menu || [];
  function review() {
    try {
      setRows(
        parseVoiceOrder(
          text,
          menu,
          c.draft.orderType === "takeaway" ? "parcel" : "dine_in",
          c.draft.orderType === "takeaway",
        ),
      );
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "তালিকা মিলিয়ে নিন।");
    }
  }
  const update = (index: number, patch: Partial<VoiceRow>) =>
    setRows((v) => v.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  return (
    <Modal title="ভয়েসে অর্ডার নিন" close={close}>
      <p className="muted text-sm mb-3">
        বলুন বা লিখুন: “দুই পরোটা, এক হাফ মুগ ডাল”। যোগ করার আগে মিলিয়ে নিন।
      </p>
      <textarea
        aria-label="অর্ডারের কথা"
        value={text}
        maxLength={2000}
        rows={3}
        onChange={(e) => {
          setText(e.target.value);
          setRows([]);
        }}
      />
      <div className="flex gap-2 mt-3">
        <Button
          secondary
          onClick={speech.listening ? speech.stop : speech.start}
        >
          <Mic size={17} />
          {speech.listening ? "শোনা বন্ধ করুন" : "বাংলায় বলুন"}
        </Button>
        <Button onClick={review} disabled={!text.trim()}>
          তালিকা মিলিয়ে দেখুন
        </Button>
      </div>
      {speech.error && <p className="notice mt-3">{speech.error}</p>}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <div className="space-y-3 mt-4">
        {rows.map((row, i) => (
          <div key={row.id} className="card">
            <p className="muted text-xs mb-2">{row.spoken}</p>
            <label>
              খাবার নির্বাচন
              <SearchableSelect
                value={row.menuId || ""}
                onChange={(e) =>
                  update(i, { menuId: e.target.value, issue: undefined })
                }
              >
                <option value="">সঠিক খাবারটি বাছুন</option>
                {menu.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code ? "#" + item.code + " · " : ""}
                    {item.nameBn ? item.nameBn + " · " : ""}{item.name}
                  </option>
                ))}
              </SearchableSelect>
            </label>
            {row.issue && <small className="text-amber-300">{row.issue}</small>}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label>
                পরিমাণ
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={row.quantity}
                  onChange={(e) =>
                    update(i, {
                      quantity: Number(e.target.value),
                      quantityConfirmed: true,
                    })
                  }
                />
              </label>
              <label>
                পরিবেশন
                <select
                  disabled={c.draft.orderType === "takeaway"}
                  value={row.fulfillment}
                  onChange={(e) =>
                    update(i, {
                      fulfillment: e.target.value as "dine_in" | "parcel",
                      modeConfirmed: true,
                    })
                  }
                >
                  <option value="dine_in">এখানে খাবেন</option>
                  <option value="parcel">পার্সেল</option>
                </select>
              </label>
            </div>
            <label className="check mt-3">
              <input
                type="checkbox"
                checked={row.quantityConfirmed && row.modeConfirmed}
                onChange={(e) =>
                  update(i, {
                    quantityConfirmed: e.target.checked,
                    modeConfirmed: e.target.checked,
                  })
                }
              />
              পরিমাণ ও পরিবেশন মিলিয়েছি
            </label>
            <button
              className="text-rose-300 text-xs mt-2"
              onClick={() => setRows((v) => v.filter((_, n) => n !== i))}
            >
              এই লাইন বাদ দিন
            </button>
          </div>
        ))}
      </div>
      {rows.length > 0 && (
        <Button
          className="w-full mt-4"
          disabled={
            rows.some(
              (r) => !r.menuId || !r.quantityConfirmed || !r.modeConfirmed,
            ) ||
            c.busy ||
            !!c.pending
          }
          onClick={() => {
            if (
              c.addVoiceItems(
                rows.map((r) => ({
                  menuId: r.menuId!,
                  quantity: r.quantity,
                  fulfillment: r.fulfillment,
                })),
              )
            )
              close();
            else setError("খাবারের মিল, পরিমাণ ও স্টক যাচাই করুন।");
          }}
        >
          নিশ্চিত করে কার্টে যোগ করুন
        </Button>
      )}
    </Modal>
  );
}
