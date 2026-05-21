// MeditationPage — mood selection → hidden LLM chat → phrases displayed with fade → ambient experience.
import type { ReactNode } from "react";
import { ArrowLeft, Clock, Heart, Pause, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMeditationSession, type MeditationMood } from "@/features/meditation/hooks/useMeditationSession";
import meditationBackground from "@/assets/images/fondo_meditar.png";

const MOODS: Array<{ id: MeditationMood; label: string; emoji: string; color: string }> = [
  { id: "ansioso", label: "Ansioso", emoji: "😰", color: "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700" },
  { id: "triste", label: "Triste", emoji: "😢", color: "bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700" },
  { id: "estresado", label: "Estresado", emoji: "😫", color: "bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700" },
  { id: "calma", label: "Necesito calma", emoji: "🧘", color: "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" },
  { id: "relajarme", label: "Solo relajarme", emoji: "😌", color: "bg-teal-100 border-teal-300 dark:bg-teal-900/30 dark:border-teal-700" },
];

const DURATIONS = [3, 5, 10];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MeditationBackdrop({ children, fixed = false }: { children: ReactNode; fixed?: boolean }) {
  return (
    <div
      className={`${fixed ? "fixed inset-0" : "relative min-h-screen"} overflow-hidden bg-background`}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(var(--background) / 0.36), hsl(var(--background) / 0.08)), url(${meditationBackground})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-background/5 to-background/35" />
      <div className="pointer-events-none absolute inset-0 backdrop-blur-[1px]" />
      {children}
    </div>
  );
}

export function MeditationPage() {
  const navigate = useNavigate();
  const session = useMeditationSession();

  // ── Mood selection screen ──────────────────────────────────────
  if (session.phase === "select") {
    return (
      <MeditationBackdrop>
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 z-10 rounded-full bg-card/55 p-2 text-foreground shadow-sm backdrop-blur transition hover:bg-card/80"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/45 bg-card/72 p-6 text-center shadow-[0_24px_80px_hsl(var(--foreground)/0.14)] backdrop-blur-xl md:p-8">
            <Heart className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h1 className="mb-2 text-2xl font-black text-foreground">
              ¿Cómo te sentís?
            </h1>
            <p className="mb-8 text-sm text-muted-foreground">
              Elegí tu estado de ánimo para personalizar la sesión.
            </p>

            <div className="grid w-full grid-cols-2 gap-3">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => session.startSession(m.id, 5)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition hover:scale-105 ${m.color}`}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-sm font-bold">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Duration selector */}
            <p className="mt-8 text-sm text-muted-foreground">Duración</p>
            <div className="mt-2 flex justify-center gap-3">
              {DURATIONS.map((d) => (
                <Button
                  key={d}
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-background/70 backdrop-blur"
                  onClick={() => {
                    const moods: MeditationMood[] = ["ansioso", "triste", "estresado", "calma", "relajarme"];
                    session.startSession(moods[Math.floor(Math.random() * moods.length)], d);
                  }}
                >
                  <Clock className="mr-1 h-3 w-3" /> {d} min
                </Button>
              ))}
            </div>
          </div>
        </div>
      </MeditationBackdrop>
    );
  }

  // ── Loading screen ─────────────────────────────────────────────
  if (session.phase === "loading") {
    return (
      <MeditationBackdrop>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          <div className="rounded-[2rem] border border-white/45 bg-card/70 px-8 py-7 text-center shadow-soft backdrop-blur-xl">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm font-semibold text-muted-foreground">
              Preparando tu sesión de meditación...
            </p>
          </div>
        </div>
      </MeditationBackdrop>
    );
  }

  // ── Meditation experience ──────────────────────────────────────
  const progress = session.totalSeconds > 0
    ? ((session.totalSeconds - session.secondsLeft) / session.totalSeconds) * 100
    : 0;

  return (
    <MeditationBackdrop fixed>
      {/* Vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 22%, rgba(0,0,0,0.46) 100%)",
        }}
      />

      {/* Ambient floating elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[15%] top-[20%] h-3 w-3 animate-pulse rounded-full bg-primary/20" />
        <div className="absolute right-[20%] top-[30%] h-2 w-2 animate-pulse rounded-full bg-secondary/20" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-[25%] left-[25%] h-2 w-2 animate-pulse rounded-full bg-accent/20" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[30%] right-[15%] h-3 w-3 animate-pulse rounded-full bg-primary/15" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Phrase display */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-8 text-center">
        {session.phrases.length > 0 && session.currentPhrase < session.phrases.length && (
          <p
            key={session.currentPhrase}
            className="max-w-2xl rounded-[2rem] border border-white/25 bg-background/28 px-7 py-6 text-2xl font-light leading-relaxed text-foreground shadow-[0_24px_90px_hsl(var(--foreground)/0.18)] backdrop-blur-md animate-in fade-in duration-1000 md:text-4xl"
          >
            {session.phrases[session.currentPhrase]}
          </p>
        )}
      </div>

      {/* Timer progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="h-1 bg-muted/30">
          <div
            className="h-full bg-primary/60 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-sm tabular-nums text-foreground/60">
            {formatTime(session.secondsLeft)}
          </span>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={session.endSession}
              className="rounded-full text-foreground/60 hover:text-foreground"
            >
              <Pause className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={session.reset}
              className="rounded-full text-foreground/60 hover:text-foreground"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </MeditationBackdrop>
  );
}
