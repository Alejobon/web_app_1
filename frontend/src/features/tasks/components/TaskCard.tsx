import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TaskStatusBadge } from "@/features/tasks/components/TaskStatusBadge";
import { taskPriorityFromDescription, taskPriorityLabel } from "@/features/tasks/lib/task-priority";
import type { Task, TaskStatus } from "@/features/tasks/task.types";

export function TaskCard({ task, onStatusChange, onDelete }: { task: Task; onStatusChange: (status: TaskStatus) => void; onDelete: () => void }) {
  const priority = taskPriorityFromDescription(task.description);

  return (
    <Card className="bg-card/85">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black">{task.title}</h3>
              {priority && (
                <Badge variant={priority === "alta" ? "default" : priority === "media" ? "secondary" : "accent"}>
                  Prioridad {taskPriorityLabel[priority]}
                </Badge>
              )}
            </div>
            {task.description && <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">{task.description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TaskStatusBadge status={task.status} />
          <div className="flex flex-wrap gap-2">
            {(["pending", "in_progress", "done"] as TaskStatus[]).map((status) => (
              <Button key={status} variant={task.status === status ? "default" : "outline"} size="sm" onClick={() => onStatusChange(status)}>
                {status === "pending" ? "Pendiente" : status === "in_progress" ? "Progreso" : "Done"}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
