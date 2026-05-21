import { Loader2 } from "lucide-react";
import { Logo } from "@/components/common/Logo";
export function LoadingScreen({ label = "Preparando tu espacio..." }: { label?: string }) { return <div className="flex min-h-screen flex-col items-center justify-center gap-4 emotional-bg p-6 text-center"><Logo /><Loader2 className="h-7 w-7 animate-spin text-primary" /><p className="text-sm font-semibold text-muted-foreground">{label}</p></div>; }
