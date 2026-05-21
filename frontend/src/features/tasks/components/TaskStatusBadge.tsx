import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/features/tasks/task.types";
const labels: Record<TaskStatus, string> = { pending: "Pendiente", in_progress: "En progreso", done: "Completada" };
export function TaskStatusBadge({ status }: { status: TaskStatus }) { const variant = status === "done" ? "accent" : status === "in_progress" ? "default" : "secondary"; return <Badge variant={variant}>{labels[status]}</Badge>; }
