// Global providers — React Query cache and theme initialization. Wraps the entire app.
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, type ReactNode } from "react";
import { queryClient } from "@/app/query-client";
import { useThemeStore } from "@/stores/theme.store";

export function AppProviders({ children }: { children: ReactNode }) {
  const applyTheme = useThemeStore((state) => state.applyTheme);
  useEffect(() => { applyTheme(); }, [applyTheme]);
  return <QueryClientProvider client={queryClient}>{children}<ReactQueryDevtools initialIsOpen={false} /></QueryClientProvider>;
}
