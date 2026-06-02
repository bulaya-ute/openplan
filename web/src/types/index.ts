export type TaskType = 'Parallel' | 'Sequential';
export type ItemStatus = 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export interface Task {
  id: string;
  ownerId: string;
  projectId: string | null;
  parentId: string | null;
  title: string;
  description: string | null;
  taskType: TaskType;
  weight: number;
  priority: Priority;
  effectivePriority: Priority;
  status: ItemStatus;
  startAt: string;
  dueAt: string;
  completedAt: string | null;
  sortOrder: number;
  progress: number;
  completedChildCount: number;
  totalChildCount: number;
  nextChildTitle: string | null;
  createdAt: string;
  updatedAt: string;
  children: Task[];
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  color: string;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  accessToken: string;
  userId: string;
  email: string;
  displayName: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId?: string;
  parentId?: string;
  taskType: TaskType;
  weight: number;
  priority: Priority;
  startAt: string;
  dueAt: string;
  sortOrder: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  projectId?: string;
  taskType?: TaskType;
  weight?: number;
  priority?: Priority;
  status?: ItemStatus;
  startAt?: string;
  dueAt?: string;
  sortOrder?: number;
}
