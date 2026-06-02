import client from './client';
import type { Project } from '../types';

export const getProjects = () =>
  client.get<Project[]>('/projects').then((r) => r.data);

export const createProject = (name: string, color: string) =>
  client.post<Project>('/projects', { name, color, sortOrder: 0 }).then((r) => r.data);

export const updateProject = (id: string, payload: Partial<{ name: string; color: string; isArchived: boolean }>) =>
  client.put<Project>(`/projects/${id}`, payload).then((r) => r.data);

export const deleteProject = (id: string) =>
  client.delete(`/projects/${id}`);
