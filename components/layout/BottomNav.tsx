"use client";
import {
  LayoutGrid,
  ShoppingCart,
  ClipboardList,
  UtensilsCrossed,
  Bell,
} from "lucide-react";
import { useWaiterContext } from "@/context/WaiterContext";
import type { Page } from "@/types";
export default function BottomNav() {
  const c = useWaiterContext(),
    operator =
      c.session?.user.mobileMode === "operator" ||
      c.session?.user.role === "kitchen";
  const tabs: { key: Page; label: string; icon: typeof Bell }[] = operator
    ? [
        { key: "operations", label: "কাজ", icon: UtensilsCrossed },
        { key: "notifications", label: "খবর", icon: Bell },
      ]
    : [
        { key: "tables", label: "টেবিল", icon: LayoutGrid },
        { key: "cart", label: "কার্ট", icon: ShoppingCart },
        { key: "orders", label: "অর্ডার", icon: ClipboardList },
        { key: "operations", label: "প্রস্তুতি", icon: UtensilsCrossed },
        { key: "notifications", label: "খবর", icon: Bell },
      ];
  return (
    <nav className="bottom-nav" aria-label="প্রধান মেনু">
      {tabs.map((t) => {
        const count =
          t.key === "cart"
            ? c.quantity
            : t.key === "notifications"
              ? c.operations.unread
              : 0;
        return (
          <button
            key={t.key}
            aria-current={c.page === t.key ? "page" : undefined}
            onClick={() => c.navigate(t.key)}
            className={c.page === t.key ? "active" : ""}
          >
            <span className="relative">
              <t.icon size={22} />
              {count > 0 && (
                <span className="badge">{count.toLocaleString("bn-BD")}</span>
              )}
            </span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
