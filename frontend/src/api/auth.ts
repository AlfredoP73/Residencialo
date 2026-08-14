import { apiFetch } from './client';
export const login = (email: string, password: string) =>
  apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => apiFetch('/auth/me');
export const listUsers = () => apiFetch('/auth/users');
