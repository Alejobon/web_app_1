import { Outlet } from "react-router-dom";
import { AuthRouteGate } from "@/features/auth/components/AuthRouteGate";

export function AuthLayout() {
  return (
    <AuthRouteGate>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden emotional-bg p-4 sm:p-6">
        <div className="absolute -left-16 bottom-12 h-60 w-96 wave-blue opacity-80" />
        <div className="absolute -right-24 top-16 h-56 w-80 wave-yellow opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/20" />
        <Outlet />
      </div>
    </AuthRouteGate>
  );
}
