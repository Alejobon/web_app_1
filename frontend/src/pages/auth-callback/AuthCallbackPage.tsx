import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { completeAuthCallback } from "@/features/auth/api/auth.api";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    completeAuthCallback()
      .then((session) => {
        if (cancelled) return;
        navigate(session ? "/app/chat" : "/login", { replace: true });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center emotional-bg p-4">
      <Card className="max-w-md shadow-soft">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {!error && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
          <h1 className="text-2xl font-black">Conectando tu espacio</h1>
          <p className="text-sm text-muted-foreground">Estamos validando tu sesión con Supabase.</p>
          {error && <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {error && <Button onClick={() => navigate("/login", { replace: true })}>Volver al login</Button>}
        </CardContent>
      </Card>
    </div>
  );
}
