import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "@/features/auth/hooks/useSession";
export function useRequireAuth() {
  const auth = useSession(); const navigate = useNavigate(); const location = useLocation();
  useEffect(() => { if (!auth.loading && !auth.session) navigate("/login", { replace: true, state: { from: location } }); }, [auth.loading, auth.session, location, navigate]);
  return auth;
}
