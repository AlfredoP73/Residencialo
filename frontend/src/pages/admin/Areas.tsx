import React, { useEffect, useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { getCommonAreas, getReservations, createReservation, updateReservationStatus } from '../../api/community';
import {
  Badge, Modal, Btn, FormField, Input, Select,
  Spinner, Alert, PageHeader, EmptyState,
  CardGrid, InteractiveCard,
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

      <div className="flex gap-1 mb-5 bg-white border border-slate-200 p-1 rounded-xl w-fit shadow-card">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : (
        <>
          {tab === 'areas' && (
            areas.length === 0 ? <EmptyState message="Sin zonas comunes" /> : (
              <CardGrid cols={3}>
                {areas.map((a: any) => (
                  <InteractiveCard key={a.id}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-brand-600" />
                      </div>
                      <Badge label={a.is_active ? 'ACTIVO' : 'INACTIVO'} />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">{a.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Aforo: {a.capacity} personas</p>
                    {a.hourly_rate > 0 && (
                      <p className="text-xs text-slate-500">${a.hourly_rate.toLocaleString('es-CO')} / hora</p>
                    )}
                    {a.rules_text && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{a.rules_text}</p>
                    )}
                  </InteractiveCard>
                ))}
              </CardGrid>
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
                <CardGrid cols={3}>
                  {reservations.map((r: any) => (
                    <InteractiveCard key={r.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{r.common_area_name}</p>
                          <p className="text-xs text-slate-400">Apto {r.apartment_number}</p>
                        </div>
                        <Badge label={r.status} />
                      </div>
                      <div className="mt-3 text-xs text-slate-500 space-y-0.5">
                        <p>{r.reservation_date} · {r.start_time} – {r.end_time}</p>
                        <p className="text-slate-700 font-medium">${(r.total_fee || 0).toLocaleString('es-CO')} COP</p>
                      </div>
                      {(r.status === 'SOLICITADA' || r.status === 'APROBADA') && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                          {r.status === 'SOLICITADA' && (
                            <>
                              <Btn size="sm" variant="primary" onClick={() => handleStatus(r.id, 'APROBADA')}>Aprobar</Btn>
                              <Btn size="sm" variant="danger" onClick={() => handleStatus(r.id, 'RECHAZADA')}>Rechazar</Btn>
                            </>
                          )}
                          {r.status === 'APROBADA' && (
                            <Btn size="sm" variant="secondary" onClick={() => handleStatus(r.id, 'CANCELADA')}>Cancelar</Btn>
                          )}
                        </div>
                      )}
                    </InteractiveCard>
                  ))}
                </CardGrid>
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
