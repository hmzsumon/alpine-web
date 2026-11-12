/* ── Screen: compact native menu; code, Bangla, English and Bengali voice search ── */
"use client";
import { useState } from "react";
import { ArrowLeft, Search, Mic, ShoppingCart } from "lucide-react";
import { useWaiterContext } from "@/context/WaiterContext";
import { useSpeech } from "@/hooks/useSpeech";
import {
  matchesFood,
  categoryLabel,
  bnDigits,
  foodNames,
} from "@/utils/menuNames";
import { isCodeQuery, normalizeVoiceSearch } from "@/utils/menuSearch";
import { money } from "@/config";
import { Counter, Empty } from "../ui/Primitives";
import VoiceOrderDialog from "../voice/VoiceOrderDialog";
export default function MenuScreen() {
  const c = useWaiterContext(),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All"),
    [voice, setVoice] = useState(false);
  const speech = useSpeech((text) => {
    setQuery(normalizeVoiceSearch(text));
    setCategory("All");
  });
  const menu = c.bootstrap?.menu || [],
    items = menu
      .filter(
        (i) =>
          (isCodeQuery(query) ||
            category === "All" ||
            i.category === category) &&
          matchesFood(i, query),
      )
      .sort((a, b) =>
        (a.code || "999999").localeCompare(b.code || "999999", "en", {
          numeric: true,
        }),
      );
  const unavailable = query.trim()
    ? c.bootstrap?.unavailableMenu?.filter((i) => matchesFood(i, query)) || []
    : [];
  return (
    <section className="menu-screen">
      <div className="menu-top">
        <div className="flex items-center gap-2 h-10">
          <button
            className="icon"
            aria-label="আগের পেইজে ফিরুন"
            onClick={c.backFromMenu}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-bold text-base">খাবার</h1>
          <span className="ml-auto text-alpine text-xs">
            {c.draft.table === "PARCEL" ? "পার্সেল" : c.draft.table}
            {c.draft.orderId ? " · অতিরিক্ত" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="search">
            <Search size={16} />
            <input
              aria-label="খাবারের নাম বা কোড খুঁজুন"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="নাম বা কোড"
            />
            <button
              className={
                "icon " + (speech.listening ? "text-rose-300" : "text-alpine")
              }
              aria-label="বাংলায় ভয়েস সার্চ"
              onClick={speech.listening ? speech.stop : speech.start}
            >
              <Mic size={19} />
            </button>
          </div>
          <button
            className="secondary voice-btn"
            onClick={() => setVoice(true)}
          >
            <Mic size={15} />
            ভয়েসে অর্ডার
          </button>
        </div>
        {speech.error && (
          <p role="alert" className="notice my-2">
            {speech.error}
          </p>
        )}
        <div className="chips compact">
          {["All", ...new Set(menu.map((i) => i.category))].map((cat) => (
            <button
              key={cat}
              className={category === cat ? "active" : ""}
              onClick={() => setCategory(cat)}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>
      <div className="menu-list">
        <div className="grid gap-1.5 xl:grid-cols-2">
          {items.map((item) => {
            const selected = c.draft.items.filter((l) => l.menuId === item.id),
              quantity = selected.reduce((n, l) => n + l.quantity, 0),
              mode = c.draft.orderType === "takeaway" ? "parcel" : "dine_in",
              minusMode = selected.some(
                (l) => (l.fulfillment || "dine_in") === mode,
              )
                ? mode
                : selected[0]?.fulfillment || mode;
            const stock = c.bootstrap?.stockSummary?.[item.id],
              soldOut = stock && !stock.available,
              names = foodNames(item);
            return (
              <article
                key={item.id}
                className={"menu-row " + (quantity ? "selected" : "")}
              >
                <div className="min-w-0 flex-1">
                  <p className="food-name">
                    <span className="code">
                      {item.code ? "#" + bnDigits(item.code) + "  " : ""}
                    </span>
                    {names.primary}
                  </p>
                  {names.secondary && (
                    <p className="english">{names.secondary}</p>
                  )}
                  {soldOut && (
                    <p className="text-amber-300 text-[10px]">
                      স্টক শেষ / বিক্রি বন্ধ
                    </p>
                  )}
                </div>
                <strong className="price">{money(item.price)}</strong>
                <Counter
                  name={names.primary}
                  value={quantity}
                  minus={() => c.changeQuantity(item, -1, minusMode)}
                  plus={() => {
                    if (
                      soldOut ||
                      (stock?.quantity !== null &&
                        stock?.quantity !== undefined &&
                        quantity >= stock.quantity)
                    ) {
                      c.setError("এই পরিমাণ খাবার এখন স্টকে নেই।");
                      return;
                    }
                    c.changeQuantity(item, 1, mode);
                  }}
                  disabled={c.busy || !!c.pending}
                />
              </article>
            );
          })}
        </div>
        {!items.length && (
          <Empty
            title="খাবার পাওয়া যায়নি"
            detail="অন্য নাম, কোড বা ক্যাটাগরি দিয়ে খুঁজুন।"
          />
        )}
        {unavailable.map((item) => (
          <div key={item.id} className="card mt-2 text-sm">
            {item.code && "#" + item.code + " · "}
            {item.nameBn || item.name}
            <p className="text-amber-300 text-xs mt-1">
              {item.price === null
                ? "দাম দেওয়া হয়নি—অর্ডার বন্ধ"
                : "বিক্রি বন্ধ"}
            </p>
          </div>
        ))}
      </div>
      {c.quantity > 0 && (
        <div className="menu-footer">
          <span className="flex items-center gap-2 text-xs">
            <ShoppingCart size={18} className="text-alpine" />
            {bnDigits(c.quantity)}টি খাবার · {money(c.total)}
          </span>
          <button className="primary" onClick={() => c.navigate("cart")}>
            কার্ট দেখুন →
          </button>
        </div>
      )}
      {voice && <VoiceOrderDialog close={() => setVoice(false)} />}
    </section>
  );
}
