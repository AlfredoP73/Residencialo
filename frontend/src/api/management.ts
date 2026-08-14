import { apiFetch } from './client';
const q = (p?: Record<string,string>) => p ? '?' + new URLSearchParams(p) : '';
export const getDashboardKpis  = () => apiFetch('/management/dashboard/kpis');
export const getPqrs           = (p?: Record<string,string>) => apiFetch(`/management/pqrs${q(p)}`);
export const getPqrsDetail     = (id: string) => apiFetch(`/management/pqrs/${id}`);
export const createPqrs        = (body: unknown) =>
  apiFetch('/management/pqrs', { method: 'POST', body: JSON.stringify(body) });
export const updatePqrsStatus  = (id: string, status: string) =>
  apiFetch(`/management/pqrs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const addPqrsComment    = (id: string, body: unknown) =>
  apiFetch(`/management/pqrs/${id}/comments`, { method: 'POST', body: JSON.stringify(body) });
export const getDocuments      = () => apiFetch('/management/documents');
