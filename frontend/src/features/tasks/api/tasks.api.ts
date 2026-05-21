// Tasks API — list, get, create, update, and delete tasks.
// Maps backend task fields to frontend types.
import { apiClient } from "@/lib/api-client";
import type { CreateTaskInput, Task, TaskStatus } from "@/features/tasks/task.types";
type BackendTask = { taskId: string; userId: string; title: string; description?: string | null; status: TaskStatus; createdAt: string; updatedAt: string };
function mapTask(task: BackendTask): Task { return { taskId: task.taskId, userId: task.userId, title: task.title, description: task.description, status: task.status, createdAt: task.createdAt, updatedAt: task.updatedAt }; }
const segment = (value: string) => encodeURIComponent(value);
export async function listTasks(taskStatus?: TaskStatus) {
  const qs = taskStatus ? `?task_status=${encodeURIComponent(taskStatus)}` : "";
  return (await apiClient<BackendTask[]>("/tasks" + qs)).map(mapTask);
}
export async function getTask(taskId: string) { return mapTask(await apiClient<BackendTask>("/tasks/" + segment(taskId))); }
export async function createTask(input: CreateTaskInput) { return mapTask(await apiClient<BackendTask>("/tasks", { method: "POST", body: JSON.stringify(input) })); }
export type UpdateTaskInput = Partial<Pick<Task, "title" | "description" | "status">>;
export async function updateTask(taskId: string, input: UpdateTaskInput) { return mapTask(await apiClient<BackendTask>("/tasks/" + segment(taskId), { method: "PUT", body: JSON.stringify(input) })); }
export function deleteTask(taskId: string) { return apiClient<void>("/tasks/" + segment(taskId), { method: "DELETE" }); }
