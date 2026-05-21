import { HeartHandshake } from "lucide-react";
import { QuickActionCards } from "@/features/chat/components/QuickActionCards";

export function ChatEmptyState() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-4 py-12 text-center">
      <div className="relative">
        <div className="absolute -inset-6 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-primary-soft">
          <HeartHandshake className="h-12 w-12 text-primary" />
        </div>
      </div>

      <h2 className="text-2xl font-black tracking-tight md:text-3xl">
        Estoy aquí para escucharte
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
        Podés escribir libremente. Después ordenamos juntos lo que aparezca.
      </p>

      <div className="mt-10 w-full max-w-md">
        <QuickActionCards />
      </div>
    </div>
  );
}
