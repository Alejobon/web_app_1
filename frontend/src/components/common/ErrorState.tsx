import { AlertTriangle } from "lucide-react";
export function ErrorState({ message = "Algo no salió como esperábamos." }: { message?: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"><AlertTriangle className="h-5 w-5" />{message}</div>; }
