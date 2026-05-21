// BreathingCircle — animated circle that expands/contracts with breathing phases.
import { cn } from "@/lib/cn";
import type { BreathingPhase } from "@/features/breathing/hooks/useBreathingTimer";

const PHASE_COLORS: Record<BreathingPhase, string> = {
  inhale: "border-primary bg-primary/10",
  hold: "border-accent bg-accent/10",
  exhale: "border-secondary bg-secondary/10",
  rest: "border-muted bg-muted/10",
};

const PHASE_SCALES: Record<BreathingPhase, string> = {
  inhale: "scale-150",
  hold: "scale-150",
  exhale: "scale-100",
  rest: "scale-100",
};

const PHASE_TRANSITIONS: Record<BreathingPhase, string> = {
  inhale: "transition-transform duration-[4000ms] ease-in-out",
  hold: "transition-none",
  exhale: "transition-transform duration-[8000ms] ease-in-out",
  rest: "transition-none",
};

export function BreathingCircle({
  phase,
  secondsLeft,
  isRunning,
}: {
  phase: BreathingPhase;
  secondsLeft: number;
  isRunning: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div
        className={cn(
          "absolute h-64 w-64 rounded-full opacity-20 blur-2xl transition-colors duration-1000",
          phase === "inhale" && "bg-primary",
          phase === "hold" && "bg-accent",
          phase === "exhale" && "bg-secondary",
          phase === "rest" && "bg-muted",
        )}
      />

      {/* Main circle */}
      <div
        className={cn(
          "flex h-48 w-48 items-center justify-center rounded-full border-4",
          PHASE_COLORS[phase],
          isRunning && PHASE_SCALES[phase],
          isRunning && PHASE_TRANSITIONS[phase],
          !isRunning && "scale-100 transition-transform duration-700",
        )}
      >
        {/* Inner circle with timer */}
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
          <span className="text-4xl font-black text-foreground tabular-nums">
            {secondsLeft}
          </span>
        </div>
      </div>
    </div>
  );
}
