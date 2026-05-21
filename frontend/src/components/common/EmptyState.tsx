import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <Card className="border-dashed bg-card/70"><CardContent className="flex flex-col items-center gap-4 p-8 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-secondary-soft"><Sparkles className="h-6 w-6 text-foreground" /></div><div><h3 className="text-xl font-black">{title}</h3>{description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</CardContent></Card>; }
