import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useThemePreference } from "@/features/settings/hooks/useThemePreference";
import type { ThemePreference } from "@/types/common.types";
const themes: Array<{ id: ThemePreference; label: string; icon: typeof Sun; color: string }> = [{ id: "light", label: "Claro", icon: Sun, color: "bg-secondary-soft" }, { id: "dark", label: "Oscuro", icon: Moon, color: "bg-primary-soft" }, { id: "system", label: "Sistema", icon: Monitor, color: "bg-accent-soft" }];
export function ThemeSelector() { const { theme, setTheme } = useThemePreference(); return <div className="grid gap-4 md:grid-cols-3">{themes.map((item) => <button key={item.id} className={cn("rounded-3xl border bg-card p-5 text-left transition hover:-translate-y-1", theme === item.id && "border-primary ring-2 ring-primary/20")} onClick={() => setTheme(item.id)}><div className={cn("mb-5 flex h-12 w-12 items-center justify-center rounded-2xl", item.color)}><item.icon className="h-5 w-5" /></div><p className="font-black">{item.label}</p><p className="mt-1 text-sm text-muted-foreground">Acentos azul, amarillo y verde menta.</p></button>)}</div>; }
