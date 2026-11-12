/* ────────── full scoped bootstrap on native/web events, polling and refocus ────────── */
import { useEffect, type Dispatch, type SetStateAction } from "react";
import { io } from "socket.io-client";
import { signedApi } from "../services/api";
import type { Session, Bootstrap } from "../types";
export function useMenuSync(
  session: Session | null,
  setBootstrap: Dispatch<SetStateAction<Bootstrap | null>>,
) {
  useEffect(() => {
    if (
      !session ||
      session.user.mobileMode === "operator" ||
      session.user.role === "kitchen"
    )
      return;
    let stopped = false,
      loading = false,
      again = false;
    async function sync() {
      if (stopped) return;
      if (loading) {
        again = true;
        return;
      }
      loading = true;
      try {
        const data = await signedApi<Bootstrap>(
          session!,
          "/api/waiter/bootstrap",
        );
        if (!stopped) setBootstrap(data);
      } catch {
      } finally {
        loading = false;
        if (again) {
          again = false;
          void sync();
        }
      }
    }
    const socket = io(session.server, {
      auth: { token: session.token },
      transports: ["websocket"],
      reconnection: true,
    });
    socket.on("connect", sync);
    socket.on("operations:changed", sync);
    socket.on("notification:new", sync);
    const timer = setInterval(sync, 15000);
    const focus = () => {
      if (!document.hidden) void sync();
    };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      stopped = true;
      clearInterval(timer);
      socket.disconnect();
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [session?.token, session?.server, setBootstrap]);
}
