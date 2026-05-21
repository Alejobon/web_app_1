import { PageHeader } from "@/components/common/PageHeader";
import { AiTaskPlanner } from "@/features/tasks/components/AiTaskPlanner";
import { TaskForm } from "@/features/tasks/components/TaskForm";
import { TaskList } from "@/features/tasks/components/TaskList";

export function TasksPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Tasks"
        title="Convertí claridad en pasos pequeños"
        description="Usá la IA como un chat para ordenar lo que querés validar. Después lo creamos como tareas reales priorizadas."
      />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="flex flex-col gap-4">
          <AiTaskPlanner />
          <TaskForm />
        </div>
        <TaskList />
      </div>
    </section>
  );
}
