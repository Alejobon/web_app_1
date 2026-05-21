import { useMutation, useQuery, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { createTask, deleteTask, listTasks, updateTask } from "@/features/tasks/api/tasks.api";
import type { CreateTaskInput, Task, TaskStatus, UpdateTaskInput } from "@/features/tasks/task.types";

const TASKS_QUERY_KEY = ["tasks"] as const;
const TASK_STATUSES = new Set<TaskStatus>(["pending", "in_progress", "done"]);

type TaskSnapshots = Array<[QueryKey, Task[] | undefined]>;

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && TASK_STATUSES.has(value as TaskStatus);
}

function taskMatchesQuery(queryKey: QueryKey, task: Task) {
  const statusFilter = queryKey[1];
  return !isTaskStatus(statusFilter) || task.status === statusFilter;
}

function snapshotTasks(queryClient: QueryClient): TaskSnapshots {
  return queryClient.getQueriesData<Task[]>({ queryKey: TASKS_QUERY_KEY });
}

function restoreTasks(queryClient: QueryClient, snapshots: TaskSnapshots) {
  snapshots.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
}

function upsertTask(queryClient: QueryClient, task: Task) {
  snapshotTasks(queryClient).forEach(([queryKey, data]) => {
    if (!data) return;
    queryClient.setQueryData<Task[]>(queryKey, (current = []) => {
      const withoutTask = current.filter((item) => item.taskId !== task.taskId);
      if (!taskMatchesQuery(queryKey, task)) return withoutTask;
      return [task, ...withoutTask];
    });
  });
}

function replaceTask(queryClient: QueryClient, taskId: string, nextTask: Task) {
  snapshotTasks(queryClient).forEach(([queryKey, data]) => {
    if (!data) return;
    queryClient.setQueryData<Task[]>(queryKey, (current = []) => {
      const withoutTask = current.filter((task) => task.taskId !== taskId && task.taskId !== nextTask.taskId);

      if (!taskMatchesQuery(queryKey, nextTask)) return withoutTask;
      return [nextTask, ...withoutTask];
    });
  });
}

function removeTask(queryClient: QueryClient, taskId: string) {
  snapshotTasks(queryClient).forEach(([queryKey, data]) => {
    if (!data) return;
    queryClient.setQueryData<Task[]>(queryKey, (current = []) => current.filter((task) => task.taskId !== taskId));
  });
}

function optimisticTask(input: CreateTaskInput): Task {
  const now = new Date().toISOString();
  return {
    taskId: `optimistic-${crypto.randomUUID()}`,
    userId: "optimistic",
    title: input.title,
    description: input.description,
    status: input.status ?? "pending",
    createdAt: now,
    updatedAt: now,
  };
}

export function useTasks(taskStatus?: TaskStatus) {
  return useQuery({ queryKey: ["tasks", taskStatus], queryFn: () => listTasks(taskStatus) });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const snapshots = snapshotTasks(queryClient);
      const temporaryTask = optimisticTask(input);
      upsertTask(queryClient, temporaryTask);
      return { snapshots, temporaryTaskId: temporaryTask.taskId };
    },
    onError: (_error, _input, context) => {
      if (context?.snapshots) restoreTasks(queryClient, context.snapshots);
    },
    onSuccess: (createdTask, _input, context) => {
      replaceTask(queryClient, context?.temporaryTaskId ?? createdTask.taskId, createdTask);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => updateTask(taskId, input),
    onMutate: async ({ taskId, input }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const snapshots = snapshotTasks(queryClient);
      const currentTask = snapshots.flatMap(([, data]) => data ?? []).find((task) => task.taskId === taskId);

      if (currentTask) {
        replaceTask(queryClient, taskId, { ...currentTask, ...input, updatedAt: new Date().toISOString() });
      }

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      if (context?.snapshots) restoreTasks(queryClient, context.snapshots);
    },
    onSuccess: (updatedTask, variables) => {
      replaceTask(queryClient, variables.taskId, updatedTask);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const snapshots = snapshotTasks(queryClient);
      removeTask(queryClient, taskId);
      return { snapshots };
    },
    onError: (_error, _taskId, context) => {
      if (context?.snapshots) restoreTasks(queryClient, context.snapshots);
    },
  });
}
