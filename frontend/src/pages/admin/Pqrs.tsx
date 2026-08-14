import React, { useEffect, useState } from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { getPqrs, updatePqrsStatus, addPqrsComment, getPqrsDetail } from '../../api/management';
import {
  Badge, Modal, Btn, FormField, Select, Input,
  Spinner, Alert, PageHeader, EmptyState, Textarea,
  CardGrid, InteractiveCard, CardArrow,
} from '../../components/ui';

const PRIORITY_ORDER: Record<string, number> = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };

export default function AdminPqrs() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const p: Record<string, string> = {};
    if (statusF) p.status = statusF;
    if (search) p.search = search;
    getPqrs(p)
      .then((r: any) => {
        const sorted = [...(r.data || [])].sort(
          (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
        );
        setItems(sorted);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusF]);

  const openDetail = async (item: any) => {
    setSelected(item);
    setNewStatus(item.status);
    setComment('');
    const d: any = await getPqrsDetail(item.id).catch(() => null);
    setDetail(d?.data || null);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      if (newStatus !== selected.status)
        await updatePqrsStatus(selected.id, newStatus);
      if (comment.trim())
        await addPqrsComment(selected.id, { comment_text: comment, is_internal_note: false, author: 'Administración' });
      setSelected(null); setDetail(null);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="PQRS" subtitle="Peticiones, Quejas, Reclamos y Sugerencias" />

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Ticket, asunto o residente..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusF} onChange={e => setStatusF(e.target.value)} className="w-44">
          <option value="">Todos los estados</option>
          {['CREADA','EN_REVISION','RESUELTA','CERRADA','RECHAZADA'].map(s =>
            <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : items.length === 0 ? <EmptyState message="Sin PQRS registradas" /> : (
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
              <p className="text-xs text-slate-400 mt-2">{p.pqrs_type} · Apto {p.apartment_number}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge label={p.priority} />
                <Badge label={p.status} />
              </div>
            </InteractiveCard>
          ))}
        </CardGrid>
      )}

      <Modal open={!!selected} onClose={() => { setSelected(null); setDetail(null); }} title={selected?.ticket_number || ''}>
        {selected && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-xs text-slate-500">Asunto</p>
              <p className="text-sm text-slate-900 font-medium">{selected.subject}</p>
              <p className="text-xs text-slate-600 mt-1">{selected.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge label={selected.pqrs_type} />
                <Badge label={selected.priority} />
                <Badge label={selected.status} />
              </div>
            </div>

            {detail?.comments?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Historial</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {detail.comments.map((c: any) => (
                    <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400">{c.author} · {c.created_at?.slice(0,10)}</p>
                      <p className="text-sm text-slate-700 mt-0.5">{c.comment_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormField label="Cambiar estado">
              <Select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {['CREADA','EN_REVISION','RESUELTA','CERRADA','RECHAZADA'].map(s =>
                  <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>

            <FormField label="Agregar comentario">
              <Textarea rows={3} placeholder="Respuesta al residente..." value={comment}
                onChange={e => setComment(e.target.value)} />
            </FormField>

            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => { setSelected(null); setDetail(null); }}>Cancelar</Btn>
              <Btn variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
