import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useThemePreference } from "@/features/settings/hooks/useThemePreference";
import type { ThemePreference } from "@/types/common.types";

const themes: Array<{ id: ThemePreference; label: string; icon: typeof Sun }> = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Oscuro", icon: Moon },
  { id: "system", label: "Sistema", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useThemePreference();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/85 p-1 shadow-sm backdrop-blur-xl",
        className,
      )}
      aria-label="Selector de tema"
      role="group"
    >
      <span className="hidden pl-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground lg:inline">
        Tema
      </span>
      <div className="inline-flex items-center gap-1">
        {themes.map((item) => (
          <button
            key={item.id}
            type="button"
            title={`Tema ${item.label}`}
            onClick={() => setTheme(item.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-2.5 py-2 text-xs font-bold text-muted-foreground transition",
              "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              theme === item.id && "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:text-primary-foreground",
            )}
            aria-pressed={theme === item.id}
            aria-label={`Usar tema ${item.label.toLowerCase()}`}
          >
            <item.icon className="size-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
