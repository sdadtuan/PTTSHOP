"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { variantFor, type ExperimentDef } from "@/lib/experiments/assign";

const COOKIE = "ptt_ab";
const Ctx = createContext<ExperimentDef[]>([]);

type Stored = { id: string; assignments: Record<string, string> };

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
export function useAssignedVariant(key: string) {
  const defs = useContext(Ctx);
  const def = defs.find((item) => item.key === key);
  const [variant, setVariant] = useState("control");
  useEffect(() => {
    if (!def?.enabled) {
      setVariant("control");
      return;
    }
    const store = readStore();
    if (!store.id) store.id = crypto.randomUUID();
    const next = variantFor(def, store.id);
    store.assignments[key] = next;
    writeStore(store);
    setVariant(next);
  }, [def, key]);
  return def?.enabled ? variant : "control";
}
