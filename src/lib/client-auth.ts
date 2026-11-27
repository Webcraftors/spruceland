import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Client accounts never share the staff console's persisted auth session. */
export const clientAuth = createClient<Database>(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { storageKey: "spruceland.client.auth.v2", persistSession: true, autoRefreshToken: true },
  global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  } },
});