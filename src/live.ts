import { createClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "./gallery";

/** Database events update immediately; polling also works without a Realtime publication. */
export function startLiveUpdates(config: SupabaseConfig, refresh: () => void) {
  const check = () => {
    if (!document.hidden) refresh();
  };
  const timer = setInterval(check, 5000);
  document.addEventListener("visibilitychange", check);
  window.addEventListener("online", check);
  window.addEventListener("focus", check);
  const client =
    config.url && config.key
      ? createClient(config.url, config.key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        })
      : null;
  const channel = client
    ?.channel("cheeko-latest-image")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "cheeko-game" },
      check,
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") check();
    });
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", check);
    window.removeEventListener("online", check);
    window.removeEventListener("focus", check);
    if (client && channel) void client.removeChannel(channel);
  };
}
