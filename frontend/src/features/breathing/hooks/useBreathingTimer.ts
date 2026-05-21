// Breathing timer hook — drives the 4-7-8 breathing pattern with phase transitions.
import { useCallback, useEffect, useRef, useState } from "react";

export type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

const PHASES: Array<{ phase: BreathingPhase; duration: number; label: string }> = [
  { phase: "inhale", duration: 4, label: "Inhalá..." },
  { phase: "hold", duration: 7, label: "Mantené..." },
  { phase: "exhale", duration: 8, label: "Exhalá..." },
  { phase: "rest", duration: 1, label: "..." },
];

const TOTAL_CYCLES = 4;

export function useBreathingTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhase = PHASES[phaseIndex];
  const totalPhaseTime = currentPhase.duration;
  const progress = 1 - secondsLeft / totalPhaseTime;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advancePhase = useCallback(() => {
    setPhaseIndex((prev) => {
      const next = (prev + 1) % PHASES.length;
      if (next === 0) {
        setCurrentCycle((c) => {
          const nextCycle = c + 1;
          if (nextCycle >= TOTAL_CYCLES) {
            setIsRunning(false);
            return 0;
          }
          return nextCycle;
        });
      }
      setSecondsLeft(PHASES[next].duration);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          advancePhase();
          return PHASES[(phaseIndex + 1) % PHASES.length].duration;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [isRunning, advancePhase, clearTimer, phaseIndex]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setCurrentCycle(0);
    setPhaseIndex(0);
    setSecondsLeft(PHASES[0].duration);
  }, [clearTimer]);

  return {
    isRunning,
    currentCycle,
    totalCycles: TOTAL_CYCLES,
    phase: currentPhase.phase,
    phaseLabel: currentPhase.label,
    secondsLeft,
    totalPhaseTime,
    progress,
    start,
    pause,
    reset,
  };
}
