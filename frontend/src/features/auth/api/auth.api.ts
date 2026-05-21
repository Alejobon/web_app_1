// Auth API — Google OAuth sign-in, PKCE callback exchange, and sign-out.
// Guards against duplicate callback exchanges and recovers from missing PKCE verifier errors.
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

let activeCallbackExchange: Promise<Session | null> | null = null;

function getAuthCallbackUrl() {
  return new URL("/auth/callback", window.location.origin).toString();
}

export function hasAuthCallbackParams(search = window.location.search) {
  const params = new URLSearchParams(search);
  return params.has("code") || params.has("error") || params.has("error_description");
}

function cleanAuthCallbackUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");

  window.history.replaceState(
    window.history.state,
    "",
    url.pathname + (url.search ? url.search : "") + url.hash,
  );
}

async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

function isMissingPkceVerifierError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("code verifier not found");
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(),
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
}

export async function completeAuthCallback() {
  if (activeCallbackExchange) return activeCallbackExchange;

  activeCallbackExchange = exchangeAuthCallback().finally(() => {
    activeCallbackExchange = null;
  });

  return activeCallbackExchange;
}

async function exchangeAuthCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const authError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (authError) {
    cleanAuthCallbackUrl();
    throw new Error(authError);
  }

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      cleanAuthCallbackUrl();
      return data.session ?? getCurrentSession();
    } catch (error) {
      const session = await getCurrentSession();
      if (session && isMissingPkceVerifierError(error)) {
        cleanAuthCallbackUrl();
        return session;
      }

      throw error;
    }
  }

  const session = await getCurrentSession();
  return session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
