/* ────────── same station actions/Socket.IO events as Android; durable exact-request retries ────────── */
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { signedApi, ApiError } from "../services/api";
import { operationKey } from "../services/storage";
import { uuid } from "../utils/uuid";
import type { Session, ServiceBatch, StaffNotification, User } from "../types";
type ActionRequest = {
  id: string;
  action: string;
  requestId: string;
  quantities?: number[];
};
export function useOperations(
  session: Session | null,
  openNotifications: () => void,
  onUser: (u: User) => void,
  expired: () => void,
) {
  const [batches, setBatches] = useState<ServiceBatch[]>([]),
    [notifications, setNotifications] = useState<StaffNotification[]>([]),
    [connected, setConnected] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [pushStatus, setPushStatus] = useState(
      "ব্রাউজারের খবর চালু করতে বেল বাটন চাপুন।",
    ),
    [pending, setPending] = useState<ActionRequest | null>(null);
  const pendingRef = useRef<ActionRequest | null>(null),
    acting = useRef(false),
    loading = useRef(false),
    hydrated = useRef(false),
    active = useRef(session),
    seen = useRef(new Set<string>()),
    initialized = useRef(false);
  const callbacks = useRef({ onUser, expired, openNotifications });
  callbacks.current = { onUser, expired, openNotifications };
  active.current = session;
  const refresh = useCallback(async () => {
    if (!session || loading.current) return;
    loading.current = true;
    try {
      const [board, inbox] = await Promise.all([
        signedApi<{ batches: ServiceBatch[]; user: User }>(
          session,
          "/api/operations",
        ),
        signedApi<{ notifications: StaffNotification[] }>(
          session,
          "/api/operations/notifications",
        ),
      ]);
      if (active.current?.token !== session.token) return;
      setBatches(board.batches);
      setNotifications(inbox.notifications);
      callbacks.current.onUser(board.user);
      setError("");
      for (const n of inbox.notifications) {
        if (
          initialized.current &&
          !n.readAt &&
          !seen.current.has(n.id) &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            const notice = new Notification(n.title, {
              body: n.body,
              icon: "/alpine-logo.png",
              tag: n.id,
            });
            notice.onclick = () => {
              window.focus();
              callbacks.current.openNotifications();
              notice.close();
            };
          } catch {}
        }
        seen.current.add(n.id);
      }
      initialized.current = true;
    } catch (e) {
      if (active.current?.token === session.token) {
        setError(e instanceof Error ? e.message : "আপডেট হয়নি।");
        if (e instanceof ApiError && e.status === 401)
          callbacks.current.expired();
      }
    } finally {
      loading.current = false;
    }
  }, [session?.token, session?.server]);
  useEffect(() => {
    if (!session) {
      setBatches([]);
      setNotifications([]);
      setPending(null);
      pendingRef.current = null;
      hydrated.current = false;
      return;
    }
    let stopped = false;
    initialized.current = false;
    seen.current.clear();
    hydrated.current = false;
    try {
      const text = localStorage.getItem(operationKey(session.user.id));
      const value = text ? JSON.parse(text) : null;
      pendingRef.current = value;
      setPending(value);
      hydrated.current = true;
    } catch {
      setError("সেভ করা কাজ পড়া যায়নি। ব্রাউজারের স্টোরেজ চালু করুন।");
    }
    const socket = io(session.server, {
      auth: { token: session.token },
      transports: ["websocket"],
      reconnection: true,
    });
    socket.on("connect", () => {
      if (!stopped) {
        setConnected(true);
        void refresh();
      }
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("operations:changed", () => void refresh());
    socket.on("notification:new", () => void refresh());
    const timer = setInterval(() => void refresh(), 15000),
      focus = () => {
        if (!document.hidden) void refresh();
      };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    void refresh();
    return () => {
      stopped = true;
      clearInterval(timer);
      socket.disconnect();
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
      setConnected(false);
    };
  }, [session?.token, session?.server, refresh]);
  async function perform(id: string, action: string, quantities?: number[]) {
    if (!session || acting.current || !hydrated.current) return;
    const request = pendingRef.current || {
      id,
      action,
      requestId: uuid(),
      ...(quantities ? { quantities } : {}),
    };
    acting.current = true;
    setBusy(true);
    setError("");
    try {
      localStorage.setItem(
        operationKey(session.user.id),
        JSON.stringify(request),
      );
      pendingRef.current = request;
      setPending(request);
      await signedApi(
        session,
        "/api/operations/batches/" + encodeURIComponent(request.id),
        {
          action: request.action,
          requestId: request.requestId,
          ...(request.quantities ? { quantities: request.quantities } : {}),
        },
      );
      localStorage.removeItem(operationKey(session.user.id));
      pendingRef.current = null;
      setPending(null);
      await refresh();
    } catch (e) {
      if (
        e instanceof ApiError &&
        [400, 403, 404, 409].includes(e.status) &&
        !e.message.includes("Request ID")
      ) {
        localStorage.removeItem(operationKey(session.user.id));
        pendingRef.current = null;
        setPending(null);
      }
      if (e instanceof ApiError && e.status === 401)
        callbacks.current.expired();
      setError(
        e instanceof Error ? e.message : "নিশ্চিত হয়নি; একই কাজ আবার পাঠান।",
      );
    } finally {
      acting.current = false;
      setBusy(false);
    }
  }
  async function read(id: string) {
    if (session)
      try {
        await signedApi(
          session,
          "/api/operations/notifications/" + encodeURIComponent(id) + "/read",
          {},
        );
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "খবর পড়া হয়নি।");
      }
  }
  async function enablePush() {
    if (!("Notification" in window) || !window.isSecureContext) {
      setPushStatus(
        "ব্রাউজার নোটিফিকেশনের জন্য HTTPS বা localhost প্রয়োজন। খবরের তালিকা সবসময় কাজ করবে।",
      );
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(
        permission === "granted"
          ? "ব্রাউজার খোলা থাকলে নতুন খবর দেখাবে।"
          : "নোটিফিকেশনের অনুমতি দেওয়া হয়নি। খবরের তালিকা দেখুন।",
      );
    } catch {
      setPushStatus("এই ব্রাউজারে নোটিফিকেশন চালু হয়নি।");
    }
  }
  return {
    batches,
    notifications,
    connected,
    busy,
    error,
    pushStatus,
    pending,
    refresh,
    perform,
    read,
    enablePush,
    unread: notifications.filter((n) => !n.readAt).length,
  };
}
