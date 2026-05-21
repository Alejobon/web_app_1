import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTask } from "@/features/tasks/hooks/useTasks";
export function TaskForm() { const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const createTask = useCreateTask(); async function handleSubmit(event: FormEvent) { event.preventDefault(); if (!title.trim()) return; await createTask.mutateAsync({ title: title.trim(), description: description.trim() || undefined, status: "pending" }); setTitle(""); setDescription(""); } return <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl border bg-card/85 p-5"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Una tarea pequeña y posible" /><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Detalle opcional" /><Button type="submit" disabled={createTask.isPending}><Plus className="h-4 w-4" />Crear tarea</Button></form>; }
