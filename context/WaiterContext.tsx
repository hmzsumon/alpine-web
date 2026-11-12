/* ────────── one controller shared by the web screens ────────── */
"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useWaiter } from "@/hooks/useWaiter";
const Context = createContext<ReturnType<typeof useWaiter> | null>(null);
export function WaiterProvider({ children }: { children: ReactNode }) {
  const state = useWaiter();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useWaiterContext() {
  const state = useContext(Context);
  if (!state) throw Error("WaiterProvider missing");
  return state;
}
