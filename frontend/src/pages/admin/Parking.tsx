import React, { useEffect, useState } from 'react';
import { Car, Plus } from 'lucide-react';
import { getParkingSpaces, getParkingAssignments, assignParking, } from '../../api/community';
import {
  Badge, Modal, Table, Td, Btn, FormField, Select,
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
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Disponibles', value: stats.available, color: 'text-emerald-400' },
          { label: 'Asignados', value: stats.assigned, color: 'text-indigo-400' },
          { label: 'Ocupados', value: stats.occupied, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
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
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Espacios</h3>
            <div className="grid grid-cols-3 gap-2">
              {spaces.map((s: any) => (
                <div key={s.id} className={`border rounded-xl p-3 text-center transition-colors
                  ${s.status === 'DISPONIBLE' ? 'border-emerald-700/50 bg-emerald-900/10'
                  : s.status === 'ASIGNADO' ? 'border-indigo-700/50 bg-indigo-900/10'
                  : 'border-amber-700/50 bg-amber-900/10'}`}>
                  <Car className={`w-5 h-5 mx-auto mb-1 ${
                    s.status === 'DISPONIBLE' ? 'text-emerald-400'
                    : s.status === 'ASIGNADO' ? 'text-indigo-400' : 'text-amber-400'}`} />
                  <p className="text-xs font-bold text-white">{s.space_number}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.location_zone}</p>
                  <Badge label={s.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Assignments table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Asignaciones activas</h3>
            {assignments.length === 0 ? <EmptyState message="Sin asignaciones" /> : (
              <Table headers={['Espacio','Apartamento','Placa']}>
                {assignments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-800/30">
                    <Td className="font-mono">{a.space_number}</Td>
                    <Td>Apto {a.apartment_number}</Td>
                    <Td>{a.vehicle_plate || '—'}</Td>
                  </tr>
                ))}
              </Table>
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
