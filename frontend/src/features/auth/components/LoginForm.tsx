import { Link, Navigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleLoginButton } from "@/features/auth/components/GoogleLoginButton";
import { useSession } from "@/features/auth/hooks/useSession";

export function LoginForm() {
  const { session, loading } = useSession();

  if (!loading && session) return <Navigate to="/app/chat" replace />;

  return (
    <Card className="glass-panel w-full max-w-md overflow-hidden border-white/60 shadow-soft">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/12 via-secondary/8 to-accent/10" />
      <div className="ambient-grid absolute inset-0 opacity-35" />

      <CardContent className="relative flex flex-col items-center gap-8 p-8 text-center sm:p-10">
        <div className="rounded-[2rem] border border-white/50 bg-background/80 p-3 shadow-sm backdrop-blur">
          <Logo />
        </div>

        <div className="space-y-4">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary-soft/75 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-foreground shadow-sm">
            <Sparkles className="size-3.5" />
            Acceso seguro
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Continúa con Google
            </h1>
            <p className="mx-auto max-w-sm text-sm leading-7 text-muted-foreground sm:text-base">
              Inicia sesión de forma simple y segura para entrar a tu espacio personal.
            </p>
          </div>
        </div>

        <div className="w-full">
          <GoogleLoginButton />
        </div>

        <p className="text-sm text-muted-foreground">
          <Link to="/" className="font-bold text-primary hover:underline">
            Volver
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
