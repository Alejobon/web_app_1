// Shared fetch wrapper — injects the Supabase Bearer token, serialises JSON bodies,
// and throws ApiError on non-2xx responses.
import { supabase } from "@/lib/supabase";

export type ApiClientOptions = RequestInit & { auth?: boolean };

const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

function normalizeApiBaseUrl(value: string | undefined) {
  const raw = (value ?? DEFAULT_API_BASE_URL).trim();
  if (!raw) return DEFAULT_API_BASE_URL;

  if (raw.startsWith("/")) return raw.replace(/\/$/, "");

  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("VITE_API_BASE_URL must use http or https.");
  }

  return url.toString().replace(/\/$/, "");
}

function apiUrl(path: string) {
  if (!path.startsWith("/")) {
    throw new Error("API paths must start with '/'.");
  }

  return apiBaseUrl + path;
}

export const apiBaseUrl = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL,
);

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly payload?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export async function apiClient<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...init } = options;
  const requestHeaders = new Headers(headers);
  if (body && !requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
  if (auth) {
    const token = await getAccessToken();
    if (!token) throw new ApiError("Sesión requerida", 401);
    requestHeaders.set("Authorization", "Bearer " + token);
  }
  const response = await fetch(apiUrl(path), { ...init, headers: requestHeaders, body });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) throw new ApiError(response.statusText || "Error de API", response.status, payload);
  return payload as T;
}
