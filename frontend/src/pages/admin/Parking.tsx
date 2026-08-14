import React, { useEffect, useState } from 'react';
import { Car, Plus } from 'lucide-react';
import { getParkingSpaces, getParkingAssignments, assignParking } from '../../api/community';
import {
  Badge, Modal, Btn, FormField, Select,
  Spinner, Alert, PageHeader, EmptyState, Input,
} from '../../components/ui';

export default function Parking() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeF, setTypeF] = useState('');
  const [statusF, setStatusF] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ parking_space_id: '', apartment_id: 'apt-302', apartment_number: '302', vehicle_plate: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    setLoading(true);
    const p: Record<string, string> = {};
    if (typeF) p.parking_type = typeF;
    if (statusF) p.status = statusF;
    Promise.all([getParkingSpaces(p), getParkingAssignments()])
      .then(([s, a]: any[]) => {
        setSpaces(s.data || []);
        setAssignments(a.data || []);
        if (!form.parking_space_id && s.data?.length)
          setForm(f => ({ ...f, parking_space_id: s.data[0].id }));
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [typeF, statusF]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault(); setSaveError(''); setSaving(true);
    try {
      await assignParking(form);
      setShowModal(false); load();
    } catch (err: any) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const stats = {
    total: spaces.length,
    available: spaces.filter(s => s.status === 'DISPONIBLE').length,
    assigned: spaces.filter(s => s.status === 'ASIGNADO').length,
    occupied: spaces.filter(s => s.status === 'OCUPADO').length,
  };

  const spaceStyles: Record<string, string> = {
    DISPONIBLE: 'border-emerald-200 bg-emerald-50',
    ASIGNADO: 'border-brand-200 bg-brand-50',
    OCUPADO: 'border-amber-200 bg-amber-50',
  };
  const iconStyles: Record<string, string> = {
    DISPONIBLE: 'text-emerald-600',
    ASIGNADO: 'text-brand-600',
    OCUPADO: 'text-amber-600',
  };

  return (
    <div>
      <PageHeader
        title="Parqueaderos"
        subtitle={`${stats.total} espacios · ${stats.available} disponibles`}
        action={<Btn variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Asignar</Btn>}
      />

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900' },
          { label: 'Disponibles', value: stats.available, color: 'text-emerald-600' },
          { label: 'Asignados', value: stats.assigned, color: 'text-brand-600' },
          { label: 'Ocupados', value: stats.occupied, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center shadow-card">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-5">
        <Select value={typeF} onChange={e => setTypeF(e.target.value)} className="w-44">
          <option value="">Todos los tipos</option>
          <option value="PRIVADO">Privado</option>
          <option value="ALQUILER">Alquiler</option>
          <option value="VISITANTES">Visitantes</option>
        </Select>
        <Select value={statusF} onChange={e => setStatusF(e.target.value)} className="w-44">
          <option value="">Todos los estados</option>
          <option value="DISPONIBLE">Disponible</option>
          <option value="ASIGNADO">Asignado</option>
          <option value="OCUPADO">Ocupado</option>
        </Select>
      </div>

      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spaces grid */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Espacios</h3>
            <div className="grid grid-cols-3 gap-2">
              {spaces.map((s: any) => (
                <div key={s.id} className={`border rounded-xl p-3 text-center transition-colors shadow-card ${spaceStyles[s.status] || 'border-slate-200 bg-white'}`}>
                  <Car className={`w-5 h-5 mx-auto mb-1 ${iconStyles[s.status] || 'text-slate-500'}`} />
                  <p className="text-xs font-bold text-slate-900">{s.space_number}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.location_zone}</p>
                  <Badge label={s.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Assignments */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Asignaciones activas</h3>
            {assignments.length === 0 ? <EmptyState message="Sin asignaciones" /> : (
              <div className="space-y-2">
                {assignments.map((a: any) => (
                  <div key={a.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-card">
                    <span className="font-mono text-sm text-slate-900 font-semibold">{a.space_number}</span>
                    <span className="text-sm text-slate-600">Apto {a.apartment_number}</span>
                    <span className="text-sm text-slate-500">{a.vehicle_plate || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Asignar Parqueadero">
        <form onSubmit={handleAssign} className="space-y-4">
          {saveError && <Alert type="error" message={saveError} />}
          <FormField label="Espacio">
            <Select value={form.parking_space_id}
              onChange={e => setForm(f => ({ ...f, parking_space_id: e.target.value }))}>
              {spaces.filter(s => s.status === 'DISPONIBLE').map((s: any) =>
                <option key={s.id} value={s.id}>{s.space_number} – {s.location_zone}</option>)}
            </Select>
          </FormField>
          <FormField label="Apartamento">
            <Select value={form.apartment_id} onChange={e => {
              const val = e.target.value;
              const num = val === 'apt-302' ? '302' : val === 'apt-101' ? '101' : '401';
              setForm(f => ({ ...f, apartment_id: val, apartment_number: num }));
            }}>
              <option value="apt-302">Torre 1 – Apto 302</option>
              <option value="apt-101">Torre 1 – Apto 101</option>
              <option value="apt-401">Torre 2 – Apto 401</option>
            </Select>
          </FormField>
          <FormField label="Placa del vehículo (opcional)">
            <Input placeholder="ABC-123" value={form.vehicle_plate}
              onChange={e => setForm(f => ({ ...f, vehicle_plate: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn variant="primary" type="submit" disabled={saving}>{saving ? 'Asignando...' : 'Asignar'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
