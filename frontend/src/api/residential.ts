import { apiFetch } from './client';
const q = (p?: Record<string,string>) => p ? '?' + new URLSearchParams(p) : '';
export const getApartments = (p?: Record<string,string>) => apiFetch(`/residential/apartments${q(p)}`);
export const getApartment  = (id: string) => apiFetch(`/residential/apartments/${id}`);
export const createApartment = (body: unknown) =>
  apiFetch('/residential/apartments', { method: 'POST', body: JSON.stringify(body) });
export const updateApartment = (id: string, body: unknown) =>
  apiFetch(`/residential/apartments/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const getResidents   = (p?: Record<string,string>) => apiFetch(`/residential/residents${q(p)}`);
export const createResident = (body: unknown) =>
  apiFetch('/residential/residents', { method: 'POST', body: JSON.stringify(body) });
export const deactivateResident = (id: string) =>
  apiFetch(`/residential/residents/${id}`, { method: 'DELETE' });
export const getVehicles   = (p?: Record<string,string>) => apiFetch(`/residential/vehicles${q(p)}`);
export const createVehicle = (body: unknown) =>
  apiFetch('/residential/vehicles', { method: 'POST', body: JSON.stringify(body) });
