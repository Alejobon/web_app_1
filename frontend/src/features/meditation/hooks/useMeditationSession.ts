// Meditation session hook — fetches direct AI phrases without creating chat history,
// and manages display timing with fade transitions.
import { useCallback, useEffect, useRef, useState } from "react";
import { streamDirectAI } from "@/features/ai/api/direct-ai.api";

export type MeditationMood =
  | "ansioso"
  | "triste"
  | "estresado"
  | "calma"
  | "relajarme";

const MOOD_LABELS: Record<MeditationMood, string> = {
  ansioso: "ansiedad",
  triste: "tristeza",
  estresado: "estrés",
  calma: "calma",
  relajarme: "relajación",
};

function buildSystemPrompt(mood: MeditationMood): string {
  const moodLabel = MOOD_LABELS[mood];
  return (
    `Sos un guía de meditación empático y cálido de la app Desahogate. ` +
    `Generá exactamente 8 frases cortas (máximo 15 palabras cada una) de apoyo emocional ` +
    `para alguien que siente ${moodLabel}. ` +
    `Cada frase va en una línea separada. ` +
    `Frases cálidas, sin juicio, en español rioplatense. ` +
    `No uses numeración ni guiones. Solo texto, una frase por línea. ` +
    `Ejemplo:\n` +
    `Respirá profundo, todo está bien\n` +
    `No estás solo en esto\n` +
    `Cada respiración te trae paz\n` +
    `IMPORTANTE: NO MANDES TU RESPUESTA EN MARKDOWN. MANDALA EN TEXTO PLANO`
  );
}

const FALLBACK_PHRASES = [
  "Respirá profundo, todo está bien",
  "No estás solo en esto",
  "Cada respiración te trae paz",
  "Tu mente está en calma",
  "Sentí cómo el aire recorre tu cuerpo",
  "Estás haciendo un gran esfuerzo",
  "Merecés este momento de paz",
  "Todo va a estar bien",
];

function cleanMeditationPhrase(line: string) {
  return line
    .replace(/```/g, "")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^>\s*/, "")
    .replace(/^[-*•]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/^\s*["“”'‘’]+|["“”'‘’]+\s*$/g, "")
    .trim();
}

function parseMeditationPhrases(text: string) {
  const seen = new Set<string>();

  return text
    .split(/\r?\n/)
    .map(cleanMeditationPhrase)
    .filter((line) => line.length > 3 && line.length < 100)
    .filter(
      (line) =>
        !/^(claro|aquí|estas son|frases|sesión|meditación)[:\s]/i.test(line),
    )
    .filter((line) => {
      const key = line.toLocaleLowerCase("es");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

export function useMeditationSession() {
  const [mood, setMood] = useState<MeditationMood | null>(null);
  const [phrases, setPhrases] = useState<string[]>([]);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [phase, setPhase] = useState<
    "select" | "loading" | "meditating" | "done"
  >("select");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phraseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phraseTimerRef.current) clearTimeout(phraseTimerRef.current);
    timerRef.current = null;
    phraseTimerRef.current = null;
  }, []);

  const startSession = useCallback(
    async (selectedMood: MeditationMood, durationMinutes: number) => {
      clearTimers();
      setMood(selectedMood);
      setPhrases([]);
      setCurrentPhrase(0);
      setPhase("loading");

      const durationSec = durationMinutes * 60;
      setSecondsLeft(durationSec);
      setTotalSeconds(durationSec);

      try {
        // Stream meditation phrases directly from the LLM without chat persistence.
        let fullText = "";
        await streamDirectAI({
          message: `${buildSystemPrompt(selectedMood)}\nDuración de referencia: ${durationMinutes} minutos.`,
          signal: undefined,
          onToken: (token) => {
            fullText += token;
          },
        });

        // Parse and render phrases as clean plain text before showing them.
        const parsed = parseMeditationPhrases(fullText);

        if (parsed.length === 0) {
          // Fallback phrases if LLM fails
          parsed.push(...FALLBACK_PHRASES);
        }

        setPhrases(parsed);
        setPhase("meditating");
      } catch {
        // Fallback on error
        setPhrases(FALLBACK_PHRASES);
        setPhase("meditating");
      }
    },
    [clearTimers],
  );

  // Countdown timer
  useEffect(() => {
    if (phase !== "meditating") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimers();
          setPhase("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimers;
  }, [phase, clearTimers]);

  // Phrase rotation
  useEffect(() => {
    if (phase !== "meditating" || phrases.length === 0) return;

    const phraseInterval = Math.max(
      (totalSeconds / phrases.length) * 1000,
      4000,
    );

    phraseTimerRef.current = setTimeout(() => {
      setCurrentPhrase((prev) => {
        if (prev >= phrases.length - 1) return prev;
        return prev + 1;
      });
    }, phraseInterval);

    return () => {
      if (phraseTimerRef.current) clearTimeout(phraseTimerRef.current);
    };
  }, [phase, currentPhrase, phrases.length, totalSeconds]);

  const endSession = useCallback(() => {
    clearTimers();
    setPhase("done");
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setMood(null);
    setPhrases([]);
    setCurrentPhrase(0);
    setPhase("select");
    setSecondsLeft(0);
    setTotalSeconds(0);
  }, [clearTimers]);

  return {
    mood,
    phrases,
    currentPhrase,
    phase,
    secondsLeft,
    totalSeconds,
    startSession,
    endSession,
    reset,
  };
}

