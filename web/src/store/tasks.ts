import { create } from 'zustand';
import type { Task, Project } from '../types';
import * as tasksApi from '../api/tasks';
import * as projectsApi from '../api/projects';

export function findTaskById(tasks: Task[], id: string): Task | null {
  for (const task of tasks) {
    if (task.id === id) return task;
    const found = findTaskById(task.children, id);
    if (found) return found;
  }
  return null;
}

interface TasksState {
  tasks: Task[];
  projects: Project[];
  loading: boolean;
  error: string | null;
  modalTaskId: string | null;
  fetchTasks: (view: string, projectId?: string) => Promise<void>;
  fetchProjects: () => Promise<void>;
  tick: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createTask: (payload: Parameters<typeof tasksApi.createTask>[0]) => Promise<Task>;
  updateTask: (id: string, payload: Parameters<typeof tasksApi.updateTask>[1]) => Promise<void>;
  openTaskModal: (id: string) => void;
  closeTaskModal: () => void;
}

export const useTasksStore = create<TasksState>((set, _get) => ({
  tasks: [],
  projects: [],
  loading: false,
  error: null,
  modalTaskId: null,
  openTaskModal: (id) => set({ modalTaskId: id }),
  closeTaskModal: () => set({ modalTaskId: null }),

  fetchTasks: async (view, projectId) => {
    set({ loading: true, error: null });
    try {
      const tasks = projectId
        ? await tasksApi.getProjectTasks(projectId)
        : await tasksApi.getTasks(view);
      set({ tasks, loading: false });
    } catch {
      set({ error: 'Failed to load tasks', loading: false });
    }
  },

  fetchProjects: async () => {
    try {
      const projects = await projectsApi.getProjects();
      set({ projects });
    } catch {
      // silently fail for project sidebar
    }
  },

  tick: async (id) => {
    const updated = await tasksApi.tickTask(id);
    set((s) => ({ tasks: replaceTask(s.tasks, updated) }));
  },

  deleteTask: async (id) => {
    await tasksApi.deleteTask(id);
    set((s) => ({ tasks: removeTask(s.tasks, id) }));
  },

  createTask: async (payload) => {
    const task = await tasksApi.createTask(payload);
    set((s) => ({
      tasks: payload.parentId
        ? insertChild(s.tasks, payload.parentId, task)
        : [...s.tasks, task],
    }));
    return task;
  },

  updateTask: async (id, payload) => {
    const updated = await tasksApi.updateTask(id, payload);
    set((s) => ({ tasks: replaceTask(s.tasks, updated) }));
  },
}));

function replaceTask(tasks: Task[], updated: Task): Task[] {
  return tasks.map((t) => {
    if (t.id === updated.id) return updated;
    return { ...t, children: replaceTask(t.children, updated) };
  });
}

function removeTask(tasks: Task[], id: string): Task[] {
  return tasks
    .filter((t) => t.id !== id)
    .map((t) => ({ ...t, children: removeTask(t.children, id) }));
}

function insertChild(tasks: Task[], parentId: string, child: Task): Task[] {
  return tasks.map((t) => {
    if (t.id === parentId) return { ...t, children: [...t.children, child] };
    return { ...t, children: insertChild(t.children, parentId, child) };
  });
}
