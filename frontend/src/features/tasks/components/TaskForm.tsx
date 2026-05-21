import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTask } from "@/features/tasks/hooks/useTasks";

export function TaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createTask = useCreateTask();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextTitle = title.trim();
    const nextDescription = description.trim();
    if (!nextTitle || createTask.isPending) return;

    setError(null);
    setTitle("");
    setDescription("");

    createTask.mutate(
      { title: nextTitle, description: nextDescription || undefined, status: "pending" },
      {
        onError: () => {
          setTitle(nextTitle);
          setDescription(nextDescription);
          setError("No pude crear la tarea. Te dejé el texto listo para reintentar.");
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl border bg-card/85 p-5">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Una tarea pequeña y posible"
      />
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Detalle opcional"
      />
      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
      <Button type="submit" disabled={createTask.isPending || !title.trim()}>
        <Plus className="h-4 w-4" />
        {createTask.isPending ? "Creando..." : "Crear tarea"}
      </Button>
    </form>
  );
}
