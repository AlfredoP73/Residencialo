import React, { useEffect, useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { getPqrs, createPqrs, getPqrsDetail } from '../../api/management';
import {
  Badge, Modal, Btn, FormField, Input, Select, Textarea,
  Spinner, Alert, PageHeader, EmptyState,
  CardGrid, InteractiveCard, CardArrow,
} from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

export default function ResidentPqrs() {
  const { user } = useAuth();
  const aptId  = user?.apartment_id || '';
  const aptNum = user?.apartment_number || '';

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState({
    apartment_id: aptId, apartment_number: aptNum,
    resident_name: user?.name || '',
    pqrs_type: 'PETICION', subject: '', description: '', priority: 'MEDIA',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    setLoading(true);
    (aptId ? getPqrs({ apartment_id: aptId }) : Promise.resolve({ data: [] }))
      .then((r: any) => setItems(r.data || []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [aptId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaveError(''); setSaving(true);
    try {
      await createPqrs({ ...form, apartment_id: aptId, apartment_number: aptNum, resident_name: user?.name || '' });
      setShowModal(false);
      setForm(f => ({ ...f, pqrs_type: 'PETICION', subject: '', description: '', priority: 'MEDIA' }));
      load();
    } catch (err: any) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const openDetail = async (item: any) => {
    const d: any = await getPqrsDetail(item.id).catch(() => null);
    setDetail(d?.data || item);
    setShowDetail(true);
  };

  return (
    <div>
      <PageHeader
        title="Mis PQRS"
        subtitle="Haz seguimiento a tus solicitudes"
        action={<Btn variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Nueva solicitud</Btn>}
      />
      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : items.length === 0 ? <EmptyState message="No has creado ninguna PQRS" /> : (
        <CardGrid cols={3}>
          {items.map((p: any) => (
            <InteractiveCard key={p.id} onClick={() => openDetail(p)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-brand-600">{p.ticket_number}</p>
                    <p className="font-semibold text-slate-900 text-sm truncate">{p.subject}</p>
                  </div>
                </div>
                <CardArrow />
              </div>
              <p className="text-xs text-slate-400 mt-2">{p.pqrs_type}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge label={p.priority} />
                <Badge label={p.status} />
              </div>
            </InteractiveCard>
          ))}
        </CardGrid>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva PQRS">
        <form onSubmit={handleCreate} className="space-y-4">
          {saveError && <Alert type="error" message={saveError} />}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo">
              <Select value={form.pqrs_type} onChange={e => setForm(f => ({ ...f, pqrs_type: e.target.value }))}>
                <option value="PETICION">Petición</option>
                <option value="QUEJA">Queja</option>
                <option value="RECLAMO">Reclamo</option>
                <option value="SUGERENCIA">Sugerencia</option>
              </Select>
            </FormField>
            <FormField label="Prioridad">
              <Select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Asunto">
            <Input required placeholder="Resumen de la solicitud" value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </FormField>
          <FormField label="Descripción detallada">
            <Textarea required rows={4} placeholder="Describe tu solicitud con detalle..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn variant="primary" type="submit" disabled={saving}>{saving ? 'Enviando...' : 'Enviar'}</Btn>
          </div>
        </form>
      </Modal>

      <Modal open={showDetail} onClose={() => { setShowDetail(false); setDetail(null); }} title={detail?.ticket_number || ''}>
        {detail && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="font-medium text-slate-900">{detail.subject}</p>
              <p className="text-sm text-slate-600">{detail.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge label={detail.pqrs_type} />
                <Badge label={detail.priority} />
                <Badge label={detail.status} />
              </div>
            </div>
            {detail.comments?.filter((c:any) => !c.is_internal_note).length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Respuestas de administración</p>
                <div className="space-y-2">
                  {detail.comments.filter((c:any) => !c.is_internal_note).map((c: any) => (
                    <div key={c.id} className="bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-brand-600">{c.author} · {c.created_at?.slice(0,10)}</p>
                      <p className="text-sm text-slate-700 mt-0.5">{c.comment_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
