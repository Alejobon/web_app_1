export type TaskStatus = "pending" | "in_progress" | "done";
export type Task = { taskId: string; userId: string; title: string; description?: string | null; status: TaskStatus; createdAt: string; updatedAt: string };
export type CreateTaskInput = { title: string; description?: string; status?: TaskStatus };
export type UpdateTaskInput = Partial<Pick<Task, "title" | "description" | "status">>;
