import type { Task } from "@/features/tasks/task.types";

export type TaskPriority = "alta" | "media" | "baja";

export const taskPriorityLabel: Record<TaskPriority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const priorityRank: Record<TaskPriority, number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

export function normalizeTaskPriority(value: string | undefined): TaskPriority {
  const normalized = value?.toLowerCase().trim();
  if (normalized === "alta" || normalized === "high") return "alta";
  if (normalized === "baja" || normalized === "low") return "baja";
  return "media";
}

export function taskPriorityFromDescription(description?: string | null): TaskPriority | null {
  const text = description?.toLowerCase() ?? "";
  if (text.includes("prioridad: alta")) return "alta";
  if (text.includes("prioridad: media")) return "media";
  if (text.includes("prioridad: baja")) return "baja";
  return null;
}

export function getTaskPriorityRank(task: Task) {
  const priority = taskPriorityFromDescription(task.description);
  return priority ? priorityRank[priority] : 3;
}

