import client from './client';
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '../types';

export const getTasks = (view: string) =>
  client.get<Task[]>('/tasks', { params: { view } }).then((r) => r.data);

export const getProjectTasks = (projectId: string) =>
  client.get<Task[]>(`/tasks/project/${projectId}`).then((r) => r.data);

export const getTask = (id: string) =>
  client.get<Task>(`/tasks/${id}`).then((r) => r.data);

export const createTask = (payload: CreateTaskPayload) =>
  client.post<Task>('/tasks', payload).then((r) => r.data);

export const updateTask = (id: string, payload: UpdateTaskPayload) =>
  client.put<Task>(`/tasks/${id}`, payload).then((r) => r.data);

export const tickTask = (id: string) =>
  client.post<Task>(`/tasks/${id}/tick`).then((r) => r.data);

export const deleteTask = (id: string) =>
  client.delete(`/tasks/${id}`);
