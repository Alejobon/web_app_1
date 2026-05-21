import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/features/tasks/components/TaskCard";
import { useDeleteTask, useTasks, useUpdateTask } from "@/features/tasks/hooks/useTasks";
import { getTaskPriorityRank } from "@/features/tasks/lib/task-priority";
import type { TaskStatus } from "@/features/tasks/task.types";
const filters: Array<TaskStatus | "all"> = ["all", "pending", "in_progress", "done"];

export function TaskList() {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const { data: tasks = [] } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const visibleTasks = useMemo(() => {
    const filtered = filter === "all" ? tasks : tasks.filter((task) => task.status === filter);
    return [...filtered].sort((a, b) => getTaskPriorityRank(a) - getTaskPriorityRank(b));
  }, [filter, tasks]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <Button key={item} variant={filter === item ? "default" : "outline"} size="sm" onClick={() => setFilter(item)}>
            {item === "all" ? "Todas" : item === "pending" ? "Pendientes" : item === "in_progress" ? "En progreso" : "Completadas"}
          </Button>
        ))}
      </div>
      {visibleTasks.length === 0 ? (
        <EmptyState title="Sin tareas por acá" description="Cuando tengas claridad, la convertimos en un paso chiquito." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.taskId}
              task={task}
              onStatusChange={(status) => updateTask.mutate({ taskId: task.taskId, input: { status } })}
              onDelete={() => deleteTask.mutate(task.taskId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
