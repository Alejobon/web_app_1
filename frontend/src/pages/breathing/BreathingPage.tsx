// BreathingPage — full-screen breathing exercise with animated circle and 4-7-8 pattern.
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BreathingCircle } from "@/features/breathing/components/BreathingCircle";
import { useBreathingTimer } from "@/features/breathing/hooks/useBreathingTimer";

export function BreathingPage() {
  const navigate = useNavigate();
  const timer = useBreathingTimer();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* Title */}
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-primary">
        Respiración 4-7-8
      </p>
      <h1 className="mb-12 text-2xl font-black text-foreground">
        {timer.phaseLabel}
      </h1>

      {/* Animated circle */}
      <BreathingCircle
        phase={timer.phase}
        secondsLeft={timer.secondsLeft}
        isRunning={timer.isRunning}
      />

      {/* Cycle indicator */}
      <div className="mt-12 flex gap-2">
        {Array.from({ length: timer.totalCycles }).map((_, i) => (
          <div
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
              i < timer.currentCycle
                ? "bg-primary"
                : i === timer.currentCycle && timer.isRunning
                  ? "bg-primary/50"
                  : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Phase label */}
      <p className="mt-6 text-sm text-muted-foreground">
        {timer.isRunning
          ? `Ciclo ${timer.currentCycle + 1} de ${timer.totalCycles}`
          : timer.currentCycle >= timer.totalCycles
            ? "¡Felicitaciones Completaste 4 ciclos!"
            : "Presiona para empezar"}
      </p>

      {/* Controls */}
      <div className="mt-8 flex gap-4">
        {!timer.isRunning && timer.currentCycle === 0 ? (
          <Button size="lg" onClick={timer.start} className="rounded-full px-8">
            <Play className="mr-2 h-4 w-4" /> Iniciar
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              variant="outline"
              onClick={timer.isRunning ? timer.pause : timer.start}
              className="rounded-full px-8"
            >
              {timer.isRunning ? (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Pausar
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Continuar
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={timer.reset}
              className="rounded-full px-8"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
