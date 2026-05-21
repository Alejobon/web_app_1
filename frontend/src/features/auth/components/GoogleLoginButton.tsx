import { Loader2, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/features/auth/api/auth.api";

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.34-.17-1.97H12v3.73h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.96-4.32 2.96-7.31Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.46l-3.24-2.52c-.9.61-2.05.98-3.37.98-2.59 0-4.78-1.75-5.56-4.1H3.09v2.6A9.99 9.99 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.44 13.9A6 6 0 0 1 6.13 12c0-.66.11-1.31.31-1.9V7.5H3.09A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.09 4.5l3.35-2.6Z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.8.5 3.84 1.49l2.88-2.88C16.95 2.94 14.7 2 12 2A9.99 9.99 0 0 0 3.09 7.5l3.35 2.6c.78-2.35 2.97-4.12 5.56-4.12Z" />
    </svg>
  );
}

export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "No se pudo iniciar sesión con Google.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[1.9rem] border border-border/60 bg-card/75 p-2 shadow-sm backdrop-blur">
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-16 w-full justify-between rounded-[1.4rem] border-0 bg-background/90 px-5 text-left shadow-none hover:bg-background"
          onClick={handleClick}
          disabled={loading}
        >
          <span className="flex items-center gap-4">
            <span className="flex size-11 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
              {loading ? <Loader2 className="size-5 animate-spin" /> : <GoogleMark />}
            </span>
            <span className="flex flex-col items-start">
              <span className="text-base font-black text-foreground">Continuar con Google</span>
              <span className="text-xs font-medium text-muted-foreground">Autenticación segura</span>
            </span>
          </span>
          <span className="hidden items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary sm:inline-flex">
            <LockKeyhole className="size-3.5" />
            Seguro
          </span>
        </Button>
      </div>

      {error && <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
