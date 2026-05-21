import { Outlet } from "react-router-dom";
import { AuthRouteGate } from "@/features/auth/components/AuthRouteGate";

export function PublicLayout() {
  return (
    <AuthRouteGate redirectAuthenticated>
      <div className="min-h-screen emotional-bg">
        <Outlet />
      </div>
    </AuthRouteGate>
  );
}
