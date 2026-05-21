// React hook that syncs the Supabase session.
// Returns session, user, and loading state. Cleans up on unmount.
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AuthSessionState } from "@/features/auth/auth.types";
export function useSession(): AuthSessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (!mounted) return; setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setLoading(false); });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, []);
  return { session, user: session?.user ?? null, loading };
}
