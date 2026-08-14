import { apiFetch } from './client';
const q = (p?: Record<string,string>) => p ? '?' + new URLSearchParams(p) : '';
export const getCommonAreas  = () => apiFetch('/community/common-areas');
export const getReservations = (p?: Record<string,string>) => apiFetch(`/community/reservations${q(p)}`);
export const createReservation = (body: unknown) =>
  apiFetch('/community/reservations', { method: 'POST', body: JSON.stringify(body) });
export const updateReservationStatus = (id: string, status: string) =>
  apiFetch(`/community/reservations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const getParkingSpaces      = (p?: Record<string,string>) => apiFetch(`/community/parking-spaces${q(p)}`);
export const getParkingAssignments = () => apiFetch('/community/parking-assignments');
export const assignParking         = (body: unknown) =>
  apiFetch('/community/parking-assignments', { method: 'POST', body: JSON.stringify(body) });
