import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTask, deleteTask, listTasks, updateTask } from "@/features/tasks/api/tasks.api";
import type { CreateTaskInput, TaskStatus, UpdateTaskInput } from "@/features/tasks/task.types";
export function useTasks(taskStatus?: TaskStatus) { return useQuery({ queryKey: ["tasks", taskStatus], queryFn: () => listTasks(taskStatus) }); }
export function useCreateTask() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (input: CreateTaskInput) => createTask(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }) }); }
export function useUpdateTask() { const queryClient = useQueryClient(); return useMutation({ mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => updateTask(taskId, input), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }) }); }
export function useDeleteTask() { const queryClient = useQueryClient(); return useMutation({ mutationFn: deleteTask, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }) }); }
