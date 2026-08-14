import React, { useEffect, useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { getCommonAreas, getReservations, createReservation, updateReservationStatus } from '../../api/community';
import {
  Badge, Modal, Table, Td, Btn, FormField, Input, Select,
  Spinner, Alert, PageHeader, EmptyState,
} from '../../components/ui';

export default function Areas() {
  const [areas, setAreas] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'areas' | 'reservations'>('reservations');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    common_area_id: '', apartment_id: 'apt-302', apartment_number: '302',
    resident_name: 'Juan Fernando Pérez',
    reservation_date: '', start_time: '14:00', end_time: '18:00',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [statusF, setStatusF] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      getCommonAreas(),
      getReservations(statusF ? { status: statusF } : undefined),
    ])
      .then(([a, r]: any[]) => {
        setAreas(a.data || []);
        setReservations(r.data || []);
        if (!form.common_area_id && a.data?.length)
          setForm(f => ({ ...f, common_area_id: a.data[0].id }));
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusF]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaveError(''); setSaving(true);
    try {
      await createReservation(form);
      setShowModal(false); load();
    } catch (err: any) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const handleStatus = async (id: string, status: string) => {
    try { await updateReservationStatus(id, status); load(); }
    catch (e: any) { setError(e.message); }
  };

  const TABS = [
    { key: 'reservations', label: 'Reservas' },
    { key: 'areas', label: 'Zonas comunes' },
  ];

  return (
    <div>
      <PageHeader
        title="Zonas Comunes y Reservas"
        action={<Btn variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Nueva reserva</Btn>}
      />

      <div className="flex gap-1 mb-5 bg-slate-800/40 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : (
        <>
          {tab === 'areas' && (
            areas.length === 0 ? <EmptyState message="Sin zonas comunes" /> : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {areas.map((a: any) => (
                  <div key={a.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-indigo-400" />
                      </div>
                      <Badge label={a.is_active ? 'ACTIVO' : 'INACTIVO'} />
                    </div>
                    <h3 className="font-semibold text-white text-sm">{a.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">Aforo: {a.capacity} personas</p>
                    {a.hourly_rate > 0 && (
                      <p className="text-xs text-slate-400">${a.hourly_rate.toLocaleString('es-CO')} / hora</p>
                    )}
                    {a.rules_text && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{a.rules_text}</p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'reservations' && (
            <>
              <div className="mb-4">
                <Select value={statusF} onChange={e => setStatusF(e.target.value)} className="w-44">
                  <option value="">Todos los estados</option>
                  {['SOLICITADA','APROBADA','RECHAZADA','CANCELADA'].map(s =>
                    <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              {reservations.length === 0 ? <EmptyState message="Sin reservas" /> : (
                <Table headers={['Área','Apto','Fecha','Horario','Valor','Estado','Acciones']}>
                  {reservations.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <Td>{r.common_area_name}</Td>
                      <Td>Apto {r.apartment_number}</Td>
                      <Td>{r.reservation_date}</Td>
                      <Td>{r.start_time} – {r.end_time}</Td>
                      <Td>${(r.total_fee || 0).toLocaleString('es-CO')}</Td>
                      <Td><Badge label={r.status} /></Td>
                      <Td>
                        {r.status === 'SOLICITADA' && (
                          <div className="flex gap-1">
                            <Btn size="sm" variant="primary" onClick={() => handleStatus(r.id, 'APROBADA')}>Aprobar</Btn>
                            <Btn size="sm" variant="danger" onClick={() => handleStatus(r.id, 'RECHAZADA')}>Rechazar</Btn>
                          </div>
                        )}
                        {r.status === 'APROBADA' && (
                          <Btn size="sm" variant="secondary" onClick={() => handleStatus(r.id, 'CANCELADA')}>Cancelar</Btn>
                        )}
                      </Td>
                    </tr>
                  ))}
                </Table>
              )}
            </>
          )}
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Reserva">
        <form onSubmit={handleCreate} className="space-y-4">
          {saveError && <Alert type="error" message={saveError} />}
          <FormField label="Zona común">
            <Select value={form.common_area_id} onChange={e => setForm(f => ({ ...f, common_area_id: e.target.value }))}>
              {areas.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
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
          <FormField label="Nombre residente">
            <Input required value={form.resident_name}
              onChange={e => setForm(f => ({ ...f, resident_name: e.target.value }))} />
          </FormField>
          <FormField label="Fecha">
            <Input required type="date" value={form.reservation_date}
              onChange={e => setForm(f => ({ ...f, reservation_date: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Hora inicio">
              <Input required type="time" value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </FormField>
            <FormField label="Hora fin">
              <Input required type="time" value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn variant="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Reservar'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
