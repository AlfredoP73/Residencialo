import React, { useEffect, useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { getCommonAreas, getReservations, createReservation } from '../../api/community';
import {
  Badge, Modal, Btn, FormField, Input, Select,
  Spinner, Alert, PageHeader, EmptyState,
  CardGrid, InteractiveCard,
} from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

export default function ResidentReservations() {
  const { user } = useAuth();
  const aptId  = user?.apartment_id || '';
  const aptNum = user?.apartment_number || '';

  const [areas, setAreas] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    common_area_id: '', apartment_id: aptId, apartment_number: aptNum,
    resident_name: user?.name || '', reservation_date: '', start_time: '14:00', end_time: '18:00',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      getCommonAreas(),
      aptId ? getReservations({ apartment_id: aptId }) : Promise.resolve({ data: [] }),
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

  useEffect(() => { load(); }, [aptId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaveError(''); setSaving(true);
    try {
      await createReservation({ ...form, apartment_id: aptId, apartment_number: aptNum });
      setShowModal(false); load();
    } catch (err: any) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const selectedArea = areas.find(a => a.id === form.common_area_id);
  const calcFee = () => {
    if (!selectedArea) return 0;
    const [sh, sm] = form.start_time.split(':').map(Number);
    const [eh, em] = form.end_time.split(':').map(Number);
    const hours = Math.max(0, (eh*60+em - sh*60-sm)/60);
    return (hours * selectedArea.hourly_rate).toLocaleString('es-CO');
  };

  return (
    <div>
      <PageHeader
        title="Mis Reservas"
        subtitle="Reserva zonas comunes del conjunto"
        action={<Btn variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Nueva reserva</Btn>}
      />
      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : reservations.length === 0 ? <EmptyState message="Sin reservas registradas" /> : (
        <CardGrid cols={3}>
          {reservations.map((r: any) => (
            <InteractiveCard key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-brand-600" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm truncate">{r.common_area_name}</p>
                </div>
                <Badge label={r.status} />
              </div>
              <div className="mt-3 text-xs text-slate-500 space-y-0.5">
                <p>{r.reservation_date} · {r.start_time} – {r.end_time}</p>
                <p className="text-slate-700 font-medium">${(r.total_fee || 0).toLocaleString('es-CO')} COP</p>
              </div>
            </InteractiveCard>
          ))}
        </CardGrid>
      )}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Reserva">
        <form onSubmit={handleCreate} className="space-y-4">
          {saveError && <Alert type="error" message={saveError} />}
          <FormField label="Zona común">
            <Select value={form.common_area_id} onChange={e => setForm(f => ({ ...f, common_area_id: e.target.value }))}>
              {areas.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </FormField>
          {selectedArea && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
              <p>Aforo: <span className="text-slate-900 font-medium">{selectedArea.capacity} personas</span></p>
              <p>Tarifa: <span className="text-slate-900 font-medium">${selectedArea.hourly_rate.toLocaleString('es-CO')}/hora</span></p>
              {selectedArea.rules_text && <p className="text-slate-400">{selectedArea.rules_text}</p>}
            </div>
          )}
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
          {selectedArea?.hourly_rate > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-700">
              Valor estimado: <span className="font-bold">${calcFee()} COP</span>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn variant="primary" type="submit" disabled={saving}>{saving ? 'Enviando...' : 'Solicitar'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
