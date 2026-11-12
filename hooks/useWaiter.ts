"use client";
/* ────────── imports ────────── */
import { useEffect, useState, useRef } from "react";
import { Alert } from "../services/confirm";
import { uuid } from "../utils/uuid";
import { api, signedApi, ApiError, serverAddress } from "../services/api";
import * as storage from "../services/storage";
import { DEFAULT_SERVER, EMPTY_DRAFT } from "../config";
import { moveCartPortion } from "../utils/cartServing";
import { useMenuSync } from "./useMenuSync";
import { useOperations } from "./useOperations";

import { mergeVoiceItems, type VoiceSelection } from "../utils/voiceOrder";
import type {
  Session,
  Page,
  Bootstrap,
  Draft,
  Pending,
  Receipt,
  MenuItem,
  Table,
} from "../types";

/* ────────── waiter session, scoped drafts and request identity ────────── */
export function useWaiter() {
  const [fulfillment, setFulfillment] = useState<"dine_in" | "parcel">(
    "dine_in",
  );
  const menuReturn = useRef<Page>("tables");
  const pendingRef = useRef<Pending | null>(null);
  const sendingRef = useRef(false);
  const [session, setSession] = useState<Session | null>(null),
    [server, setServer] = useState(DEFAULT_SERVER),
    [starting, setStarting] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [page, setPage] = useState<Page>("tables"),
    [bootstrap, setBootstrap] = useState<Bootstrap | null>(null),
    [draft, setDraft] = useState<Draft>(EMPTY_DRAFT),
    [pending, setPending] = useState<Pending | null>(null),
    [receipt, setReceipt] = useState<Receipt | null>(null),
    [hydrated, setHydrated] = useState("");
  useMenuSync(session, setBootstrap);
  async function recover(next: Session) {
    const saved = await storage.loadDraft(next.user.id);
    setDraft(saved?.draft || EMPTY_DRAFT);
    setPending(saved?.pending || null);
    pendingRef.current = saved?.pending || null;
    setHydrated(next.user.id);
    setSession(next);
    setServer(next.server);
  }
  async function refresh(target?: Page, current = session) {
    if (!current) return;
    if (
      current.user.mobileMode === "operator" ||
      current.user.role === "kitchen"
    ) {
      await operations.refresh();
      if (target) setPage("operations");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await signedApi<Bootstrap>(current, "/api/waiter/bootstrap");
      setBootstrap(data);
      if (!pendingRef.current)
        setDraft((current) => ({
          ...current,
          items: current.items.map((line) => {
            const item = data.menu.find((row) => row.id === line.menuId);
            return item
              ? {
                  ...line,
                  name: item.name,
                  nameBn: item.nameBn,
                  price: item.price,
                  station: item.station,
                }
              : line;
          }),
        }));
      setSession({ ...current, user: data.user });
      if (target) setPage(target);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Refresh failed");
      if (problem instanceof ApiError && [401, 403].includes(problem.status)) {
        await storage.clearSession();
        setSession(null);
        setHydrated("");
      }
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void (async () => {
      try {
        const configured = await storage.loadServer();
        if (configured) setServer(configured);
        const saved = await storage.loadSession();
        if (saved) {
          await recover(saved);
          await refresh(undefined, saved);
        }
      } catch {
        setError("Local session could not be restored. Please sign in.");
      } finally {
        setStarting(false);
      }
    })();
  }, []);
  useEffect(() => {
    if (!session || hydrated !== session.user.id) return;
    const timer = setTimeout(() => {
      if (pendingRef.current !== pending) return;
      void storage
        .saveDraft(session.user.id, draft, pending)
        .catch(() =>
          setError(
            "Unable to save this draft on the phone. Do not close the app.",
          ),
        );
    }, 250);
    return () => clearTimeout(timer);
  }, [draft, pending, session, hydrated]);

  /* ────────── sign in; no password is saved on the device ────────── */
  async function login(email: string, password: string, address: string) {
    setBusy(true);
    setError("");
    try {
      const base = serverAddress(address);
      const result = await api<{ token: string; user: Session["user"] }>(
        base,
        "/api/auth/login",
        undefined,
        { email, password },
      );
      if (
        result.user.mobileMode === "none" ||
        (!result.user.permissions.includes("orders:create") &&
          !result.user.permissions.includes("operations:prepare"))
      ) {
        await api(base, "/api/auth/logout", result.token, {}, "POST");
        throw new Error(
          "This account cannot collect orders. Ask the Owner for waiter access.",
        );
      }
      const next = { token: result.token, user: result.user, server: base };
      await storage.saveSession(next);
      await storage.saveServer(base);
      await recover(next);
      if (
        result.user.mobileMode === "operator" ||
        result.user.role === "kitchen"
      )
        setPage("operations");
      else await refresh("tables", next);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (!session) return;
    const current = session;

    await storage.saveDraft(current.user.id, draft, pending);
    try {
      await signedApi(current, "/api/auth/logout", {}, "POST");
    } catch {}
    await storage.clearSession();
    setSession(null);
    setBootstrap(null);
    setHydrated("");
    setDraft(EMPTY_DRAFT);
    setPending(null);
    setPage("tables");
    setError("");
  }

  /* ────────── choose a table or append an additional-items batch ────────── */
  function chooseTable(table: Table, orderId?: string) {
    if (pending) {
      setPage("cart");
      setError(
        "Resolve the pending kitchen request before starting another table.",
      );
      return;
    }
    menuReturn.current = "tables";
    const select = () => {
      setDraft({
        table: table.id,
        orderId,
        orderType: table.id === "PARCEL" ? "takeaway" : "dine_in",
        items: [],
        note: "",
      });
      setFulfillment(table.id === "PARCEL" ? "parcel" : "dine_in");
      setPage("menu");
      setError("");
    };
    if (
      draft.items.length &&
      (draft.table !== table.id || draft.orderId !== orderId)
    ) {
      Alert.alert(
        "টেবিল বদলাবেন?",
        "এখনও না পাঠানো খাবারের তালিকা মুছে যাবে।",
        [
          { text: "আগের তালিকা রাখুন", style: "cancel" },
          { text: "তালিকা মুছে বদলান", style: "destructive", onPress: select },
        ],
      );
    } else if (draft.table === table.id && draft.orderId === orderId) {
      setPage("menu");
    } else select();
  }
  function changeQuantity(
    item: MenuItem,
    change: number,
    mode: "dine_in" | "parcel" = draft.orderType === "takeaway"
      ? "parcel"
      : fulfillment,
  ) {
    if (pending || busy) return;
    if (!draft.table) {
      setError("Choose a table first");
      setPage("tables");
      return;
    }
    setDraft((current) => {
      const found = current.items.find(
        (line) =>
          line.menuId === item.id && (line.fulfillment || "dine_in") === mode,
      );
      const quantity = Math.max(
        0,
        Math.min(99, (found?.quantity || 0) + change),
      );
      if (!found && quantity > 0 && current.items.length >= 80) {
        setError("Maximum 80 different items per request");
        return current;
      }
      return {
        ...current,
        items: found
          ? current.items
              .map((line) =>
                line.menuId === item.id &&
                (line.fulfillment || "dine_in") === mode
                  ? { ...line, quantity }
                  : line,
              )
              .filter((line) => line.quantity > 0)
          : quantity
            ? [
                ...current.items,
                {
                  fulfillment: mode,
                  menuId: item.id,
                  name: item.name,
                  nameBn: item.nameBn,
                  price: item.price,
                  station: item.station,
                  quantity,
                },
              ]
            : current.items,
      };
    });
  }
  const noteLine = (
    id: string,
    note: string,
    mode: "dine_in" | "parcel" = "dine_in",
  ) => {
    if (!pending)
      setDraft((current) => ({
        ...current,
        items: current.items.map((line) =>
          line.menuId === id && (line.fulfillment || "dine_in") === mode
            ? { ...line, note }
            : line,
        ),
      }));
  };
  const orderNote = (note: string) => {
    if (!pending) setDraft((current) => ({ ...current, note }));
  };

  /* ────────── persist before sending, then retry exactly the same request ────────── */
  async function send() {
    if (!session || busy || sendingRef.current || !draft.items.length) return;
    sendingRef.current = true;
    setBusy(true);
    setError("");
    const request = pending || {
      path: draft.orderId
        ? "/api/waiter/orders/" + encodeURIComponent(draft.orderId) + "/items"
        : "/api/waiter/orders",
      body: {
        orderEpoch: bootstrap?.orderEpoch || 0,
        requestId: uuid(),
        table: draft.table,
        orderType: draft.orderType || "dine_in",
        customerName: draft.customerName || "",
        customerPhone: draft.customerPhone || "",
        packingCharge: draft.packingCharge || 0,
        items: draft.items.map((line) => ({
          fulfillment: line.fulfillment || "dine_in",
          menuId: line.menuId,
          quantity: line.quantity,
          expectedPrice: line.price,
          ...(line.note ? { note: line.note } : {}),
        })),
        note: draft.note,
      },
    };
    try {
      pendingRef.current = request;
      setPending(request);
      await storage.saveDraft(session.user.id, draft, request);
      const result = await signedApi<Receipt>(
        session,
        request.path,
        request.body,
      );
      pendingRef.current = null;
      await storage.saveDraft(session.user.id, EMPTY_DRAFT, null);
      setReceipt(result);
      setDraft(EMPTY_DRAFT);
      setPending(null);
      setPage("receipt");
      void refresh(undefined, session);
    } catch (problem) {
      if (
        problem instanceof ApiError &&
        [400, 403, 404, 409].includes(problem.status) &&
        !problem.message.includes("Request ID")
      ) {
        pendingRef.current = null;
        await storage.saveDraft(session.user.id, draft, null);
        setPending(null);
      }
      if (problem instanceof ApiError && problem.status === 401) {
        await storage.clearSession();
        setSession(null);
        setHydrated("");
      }
      setError(
        problem instanceof Error
          ? problem.message
          : "Order not confirmed. Retry the same request.",
      );
    } finally {
      sendingRef.current = false;
      setBusy(false);
    }
  }
  async function openReceipt(id: string) {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const result = await signedApi<Receipt>(
        session,
        "/api/waiter/orders/" + encodeURIComponent(id),
      );
      setReceipt(result);
      setPage("receipt");
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : "Unable to load KOT",
      );
    } finally {
      setBusy(false);
    }
  }
  function navigate(next: Page) {
    if ((next === "menu" || next === "cart") && !draft.table) {
      setPage("tables");
      setError("Choose a table to start an order");
      return;
    }
    if (next === "menu" && page !== "menu") menuReturn.current = page;
    setPage(next);
    if (next === "tables" || next === "orders") void refresh(undefined);
  }
  const operations = useOperations(
    session,
    () => setPage("notifications"),
    (user) =>
      setSession((current) =>
        current && JSON.stringify(current.user) !== JSON.stringify(user)
          ? { ...current, user }
          : current,
      ),
    () => {
      void storage.clearSession();
      setSession(null);
      setHydrated("");
    },
  );
  return {
    backFromMenu: () =>
      navigate(menuReturn.current === "menu" ? "tables" : menuReturn.current),
    moveServing: (
      id: string,
      from: "dine_in" | "parcel",
      to: "dine_in" | "parcel",
      count: number,
    ) => {
      if (pendingRef.current || pending || busy || sendingRef.current)
        return false;
      if (draft.orderType === "takeaway" && to !== "parcel") return false;
      try {
        const items = moveCartPortion(draft.items, id, from, to, count);
        setDraft({ ...draft, items });
        setError("");
        return true;
      } catch (problem) {
        setError(
          problem instanceof Error ? problem.message : "পরিবেশন বদলানো যায়নি।",
        );
        return false;
      }
    },
    addVoiceItems: (rows: VoiceSelection[]) => {
      if (pendingRef.current || pending || busy || !draft.table || !bootstrap) {
        setError("অপেক্ষমাণ অর্ডার আগে সমাধান করুন এবং টেবিল বেছে নিন।");
        return false;
      }
      try {
        const items = mergeVoiceItems(
          draft.items,
          rows,
          bootstrap.menu,
          draft.orderType === "takeaway",
          bootstrap.stockSummary,
        );
        setDraft({ ...draft, items });
        setError("");
        return true;
      } catch (problem) {
        setError(
          problem instanceof Error
            ? problem.message
            : "খাবার যোগ হয়নি। তালিকা মিলিয়ে নিন।",
        );
        return false;
      }
    },
    fulfillment,
    setFulfillment,
    setCustomer: (
      key: "customerName" | "customerPhone" | "packingCharge",
      value: string | number,
    ) => {
      if (!pending && !busy)
        setDraft((current) => ({ ...current, [key]: value }));
    },
    operations,
    session,
    server,
    starting,
    busy,
    error,
    setError,
    page,
    bootstrap,
    draft,
    pending,
    receipt,
    login,
    logout,
    refresh,
    chooseTable,
    changeQuantity,
    noteLine,
    orderNote,
    send,
    openReceipt,
    navigate,
    total:
      draft.items.reduce((sum, line) => sum + line.price * line.quantity, 0) +
      (draft.orderId ? 0 : draft.packingCharge || 0),
    quantity: draft.items.reduce((sum, line) => sum + line.quantity, 0),
  };
}
