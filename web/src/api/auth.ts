import client from './client';
import type { AuthUser } from '../types';

export const register = (email: string, password: string, displayName: string) =>
  client.post<AuthUser>('/auth/register', { email, password, displayName }).then((r) => r.data);

export const login = (email: string, password: string) =>
  client.post<AuthUser>('/auth/login', { email, password }).then((r) => r.data);
