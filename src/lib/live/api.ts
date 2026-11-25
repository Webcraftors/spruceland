import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Live backend access for staff screens. Every call goes through permission-checking database functions. */
export type Row = Record<string, any>;

let orgPromise: Promise<string | null> | null = null;
export function myOrganizationId(): Promise<string | null> {
  orgPromise ??= (async () => {
    const { data } = await supabase.rpc("get_my_applications");
    const rows = (data ?? []) as Row[];
    return (rows.find((r) => /spruce|stgl/i.test(r["organization_slug"] ?? "")) ?? rows[0])?.["organization_id"] ?? null;
  })();
  return orgPromise;
}
supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN" || e === "SIGNED_OUT") orgPromise = null; });

export async function call<T = any>(fn: string, args: Row = {}): Promise<T> {
  const { data, error } = await (supabase.rpc as any)(fn, args);
  if (error) throw new Error(friendly(error.message));
  return data as T;
}

function friendly(msg: string) {
  if (/denied|42501|Only the/i.test(msg)) return "You don't have permission to do this.";
  if (/Authentication required/i.test(msg)) return "Please sign in again.";
  return msg;
}

/** Load a live list; returns rows, loading, error and reload. */
export function useLive<T = Row[]>(load: (orgId: string | null) => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try { setData(await load(await myOrganizationId())); setError(null); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { void reload(); }, [reload]);
  return { data, error, loading, reload };
}
