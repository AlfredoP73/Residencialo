import React, { useEffect, useState } from 'react';
import { Plus, Search, Home as HomeIcon } from 'lucide-react';
import { getApartments, createApartment } from '../../api/residential';
import {
  Badge, Modal, Btn, FormField, Input, Select, Spinner, Alert, PageHeader, EmptyState,
  CardGrid, InteractiveCard, CardArrow, DetailRow,
} from '../../components/ui';

export default function Apartments() {
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ tower_id: 'twr-001', apartment_number: '', floor: '', area_sqm: '', status: 'HABITADO' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    getApartments(params)
      .then((r: any) => setApartments(r.data || []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(''); setSaving(true);
    try {
      await createApartment({ ...form, floor: Number(form.floor), area_sqm: form.area_sqm ? Number(form.area_sqm) : undefined });
      setShowModal(false);
      setForm({ tower_id: 'twr-001', apartment_number: '', floor: '', area_sqm: '', status: 'HABITADO' });
      load();
    } catch (err: any) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Apartamentos"
        subtitle={`${apartments.length} unidades`}
        action={<Btn variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Nuevo</Btn>}
      />

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar número..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-40">
          <option value="">Todos los estados</option>
          <option value="HABITADO">Habitado</option>
          <option value="DESOCUPADO">Desocupado</option>
          <option value="EN_REFORMA">En reforma</option>
        </Select>
      </div>

      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : apartments.length === 0 ? <EmptyState message="No hay apartamentos" /> : (
        <CardGrid cols={4}>
          {apartments.map((a: any) => (
            <InteractiveCard key={a.id} onClick={() => setSelected(a)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <HomeIcon className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">Apto {a.apartment_number}</p>
                    <p className="text-xs text-slate-400 truncate">{a.tower} — Piso {a.floor}</p>
                  </div>
                </div>
                <CardArrow />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">{a.area_sqm ? `${a.area_sqm} m²` : '—'}</span>
                <Badge label={a.status} />
              </div>
            </InteractiveCard>
          ))}
        </CardGrid>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Apto ${selected.apartment_number}` : ''}>
        {selected && (
          <div className="bg-slate-50 rounded-xl p-4">
            <DetailRow label="Torre" value={selected.tower} />
            <DetailRow label="Piso" value={selected.floor} />
            <DetailRow label="Área" value={selected.area_sqm ? `${selected.area_sqm} m²` : '—'} />
            <DetailRow label="Coeficiente" value={selected.coefficient ?? '—'} />
            <DetailRow label="Estado" value={<Badge label={selected.status} />} />
          </div>
        )}
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Apartamento">
        <form onSubmit={handleCreate} className="space-y-4">
          {saveError && <Alert type="error" message={saveError} />}
          <FormField label="Torre">
            <Select value={form.tower_id} onChange={e => setForm(f => ({...f, tower_id: e.target.value}))}>
              <option value="twr-001">Torre 1</option>
              <option value="twr-002">Torre 2</option>
            </Select>
          </FormField>
          <FormField label="Número de apartamento">
            <Input required placeholder="ej. 503" value={form.apartment_number}
              onChange={e => setForm(f => ({...f, apartment_number: e.target.value}))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Piso">
              <Input required type="number" min="1" placeholder="3" value={form.floor}
                onChange={e => setForm(f => ({...f, floor: e.target.value}))} />
            </FormField>
            <FormField label="Área m²">
              <Input type="number" placeholder="72" value={form.area_sqm}
                onChange={e => setForm(f => ({...f, area_sqm: e.target.value}))} />
            </FormField>
          </div>
          <FormField label="Estado">
            <Select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
              <option value="HABITADO">Habitado</option>
              <option value="DESOCUPADO">Desocupado</option>
              <option value="EN_REFORMA">En reforma</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn variant="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
