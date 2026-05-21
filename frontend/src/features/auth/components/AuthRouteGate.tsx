import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthCallbackPage } from "@/pages/auth-callback/AuthCallbackPage";
import { hasAuthCallbackParams } from "@/features/auth/api/auth.api";
import { useSession } from "@/features/auth/hooks/useSession";

export function AuthRouteGate({
  children,
  redirectAuthenticated = false,
}: {
  children: ReactNode;
  redirectAuthenticated?: boolean;
}) {
  const location = useLocation();
  const { loading, session } = useSession();

  if (hasAuthCallbackParams(location.search)) return <AuthCallbackPage />;
  if (redirectAuthenticated && !loading && session) return <Navigate to="/app/chat" replace />;

  return <>{children}</>;
}
