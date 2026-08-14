import React, { useEffect, useState } from 'react';
import { Plus, Search, CheckCircle, Package as PackageIcon } from 'lucide-react';
import { getPackages, createPackage, deliverPackage } from '../../api/operations';
import {
  Badge, Modal, Btn, FormField, Input, Select,
  Spinner, Alert, PageHeader, EmptyState,
  CardGrid, InteractiveCard,
} from '../../components/ui';

export default function Packages() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('RECIBIDO');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    apartment_id: 'apt-302', apartment_number: '302',
    courier_company: '', tracking_number: '', recipient_name: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    setLoading(true);
    const p: Record<string, string> = {};
    if (statusF) p.status = statusF;
    if (search) p.search = search;
    getPackages(p)
      .then((r: any) => setItems(r.data || []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusF]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaveError(''); setSaving(true);
    try {
      await createPackage(form);
      setShowModal(false);
      setForm({ apartment_id: 'apt-302', apartment_number: '302', courier_company: '', tracking_number: '', recipient_name: '' });
      load();
    } catch (err: any) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const handleDeliver = async (id: string) => {
    try { await deliverPackage(id); load(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <div>
      <PageHeader
        title="Paquetes"
        subtitle="Control de correspondencia y encomiendas"
        action={<Btn variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Registrar</Btn>}
      />

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Destinatario o guía..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusF} onChange={e => setStatusF(e.target.value)} className="w-44">
          <option value="">Todos</option>
          <option value="RECIBIDO">Recibidos</option>
          <option value="ENTREGADO">Entregados</option>
        </Select>
      </div>

      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : items.length === 0 ? <EmptyState message="Sin paquetes" /> : (
        <CardGrid cols={3}>
          {items.map((p: any) => (
            <InteractiveCard key={p.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <PackageIcon className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{p.recipient_name}</p>
                    <p className="text-xs text-slate-400">Apto {p.apartment_number}</p>
                  </div>
                </div>
                <Badge label={p.status} />
              </div>
              <div className="mt-3 text-xs text-slate-500 space-y-0.5">
                <p>{p.courier_company}</p>
                <p className="font-mono">{p.tracking_number || 'Sin guía'}</p>
                <p>{p.received_at?.slice(0, 16).replace('T', ' ')}</p>
              </div>
              {p.status === 'RECIBIDO' && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <Btn size="sm" variant="primary" onClick={() => handleDeliver(p.id)}>
                    <CheckCircle className="w-3.5 h-3.5" /> Entregar
                  </Btn>
                </div>
              )}
            </InteractiveCard>
          ))}
        </CardGrid>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Paquete">
        <form onSubmit={handleCreate} className="space-y-4">
          {saveError && <Alert type="error" message={saveError} />}
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
          <FormField label="Empresa de mensajería">
            <Select value={form.courier_company}
              onChange={e => setForm(f => ({ ...f, courier_company: e.target.value }))}>
              <option value="">Seleccionar...</option>
              {['Servientrega','Coordinadora','Deprisa','Envia','TCC','Interrapidísimo','FedEx','DHL','Amazon'].map(c =>
                <option key={c} value={c}>{c}</option>)}
            </Select>
          </FormField>
          <FormField label="Número de guía (opcional)">
            <Input value={form.tracking_number} placeholder="9922XXXXXX"
              onChange={e => setForm(f => ({ ...f, tracking_number: e.target.value }))} />
          </FormField>
          <FormField label="Destinatario">
            <Input required value={form.recipient_name} placeholder="Nombre del residente"
              onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn variant="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Registrar'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
