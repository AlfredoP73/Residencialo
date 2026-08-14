import { apiFetch } from './client';
const q = (p?: Record<string,string>) => p ? '?' + new URLSearchParams(p) : '';
export const getPackages    = (p?: Record<string,string>) => apiFetch(`/operations/packages${q(p)}`);
export const createPackage  = (body: unknown) =>
  apiFetch('/operations/packages', { method: 'POST', body: JSON.stringify(body) });
export const deliverPackage = (id: string) =>
  apiFetch(`/operations/packages/${id}/deliver`, { method: 'PATCH' });
export const getVisitors    = (p?: Record<string,string>) => apiFetch(`/operations/visitors${q(p)}`);
export const createVisitor  = (body: unknown) =>
  apiFetch('/operations/visitors', { method: 'POST', body: JSON.stringify(body) });
export const registerEntry  = (id: string) =>
  apiFetch(`/operations/visitors/${id}/entry`, { method: 'PATCH' });
export const registerExit   = (id: string) =>
  apiFetch(`/operations/visitors/${id}/exit`, { method: 'PATCH' });
export const getStaff       = () => apiFetch('/operations/staff');
