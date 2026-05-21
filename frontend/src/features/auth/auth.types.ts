import type { Session, User } from "@supabase/supabase-js";
export type AuthSessionState = { session: Session | null; user: User | null; loading: boolean };
