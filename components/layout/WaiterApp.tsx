/* ────────── role-dependent web navigation; every data/action is still authorized by the API ────────── */
"use client";
import { X, LoaderCircle } from "lucide-react";
import { useWaiterContext } from "@/context/WaiterContext";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import LoginScreen from "../screens/LoginScreen";
import TablesScreen from "../screens/TablesScreen";
import MenuScreen from "../screens/MenuScreen";
import CartScreen from "../screens/CartScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ReceiptScreen from "../screens/ReceiptScreen";
import OperationsScreen from "../screens/OperationsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
export default function WaiterApp() {
  const c = useWaiterContext();
  if (c.starting)
    return (
      <div className="h-dvh flex items-center justify-center gap-3 text-alpine">
        <LoaderCircle className="animate-spin" />
        লোড হচ্ছে…
      </div>
    );
  if (!c.session) return <LoginScreen />;
  const operator =
    c.session.user.mobileMode === "operator" ||
    c.session.user.role === "kitchen";
  return (
    <main className="app-shell">
      {c.page !== "menu" && <AppHeader />}
      {c.error && (
        <div role="alert" className="app-error">
          <p>{c.error}</p>
          <button
            className="icon"
            aria-label="বার্তা বন্ধ করুন"
            onClick={() => c.setError("")}
          >
            <X size={18} />
          </button>
        </div>
      )}
      <div className="screen-area">
        {c.page === "notifications" ? (
          <NotificationsScreen />
        ) : operator || c.page === "operations" ? (
          <OperationsScreen />
        ) : c.page === "tables" ? (
          <TablesScreen />
        ) : c.page === "menu" ? (
          <MenuScreen />
        ) : c.page === "cart" ? (
          <CartScreen />
        ) : c.page === "orders" ? (
          <OrdersScreen />
        ) : (
          <ReceiptScreen />
        )}
      </div>
      {c.page !== "menu" && <BottomNav />}
    </main>
  );
}
