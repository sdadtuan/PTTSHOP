"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { variantFor, type ExperimentDef } from "@/lib/experiments/assign";

const COOKIE = "ptt_ab";
const Ctx = createContext<ExperimentDef[]>([]);
const listeners = new Set<() => void>();

type Stored = { id: string; assignments: Record<string, string> };

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener();
}

function readStore(): Stored {
  const row = document.cookie.split("; ").find((item) => item.startsWith(`${COOKIE}=`));
  if (!row) return { id: "", assignments: {} };
  try {
    const parsed = JSON.parse(decodeURIComponent(row.slice(COOKIE.length + 1))) as Stored;
    return { id: parsed.id || "", assignments: parsed.assignments || {} };
  } catch {
    return { id: "", assignments: {} };
  }
}

function writeStore(store: Stored) {
  const value = encodeURIComponent(JSON.stringify(store));
  document.cookie = `${COOKIE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax`;
}

export function ExperimentProvider({ value, children }: { value: ExperimentDef[]; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * HTML luôn render control. Biến thể chỉ gắn sau hydrate, từ cookie, nên cache
 * không trả biến thể của khách này cho khách khác.
 */
function storedVariant(def: ExperimentDef | undefined, key: string) {
  if (!def?.enabled) return "control";
  return readStore().assignments[key] || "control";
}

export function useAssignedVariant(key: string) {
  const defs = useContext(Ctx);
  const def = defs.find((item) => item.key === key);
  const variant = useSyncExternalStore(
    subscribe,
    () => storedVariant(def, key),
    () => "control",
  );
  useEffect(() => {
    if (!def?.enabled) return;
    const store = readStore();
    const hadId = Boolean(store.id);
    if (!store.id) store.id = crypto.randomUUID();
    const next = variantFor(def, store.id);
    if (hadId && store.assignments[key] === next) return;
    store.assignments[key] = next;
    writeStore(store);
    emit();
  }, [def, key]);
  return def?.enabled ? variant : "control";
}
