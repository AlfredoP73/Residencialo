import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { getPqrs, createPqrs, getPqrsDetail } from '../../api/management';
import { Badge, Modal, Table, Td, Btn, FormField, Input, Select, Textarea, Spinner, Alert, PageHeader, EmptyState } from '../../components/ui';
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
        <Table headers={['Ticket','Tipo','Asunto','Prioridad','Estado']}>
          {items.map((p: any) => (
            <tr key={p.id} className="hover:bg-slate-800/30 cursor-pointer" onClick={() => openDetail(p)}>
              <Td><span className="font-mono text-xs text-indigo-400">{p.ticket_number}</span></Td>
              <Td>{p.pqrs_type}</Td>
              <Td><span className="max-w-xs truncate block">{p.subject}</span></Td>
              <Td><Badge label={p.priority} /></Td>
              <Td><Badge label={p.status} /></Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva PQRS">
        <form onSubmit={handleCreate} className="space-y-4">
          {saveError && <Alert type="error" message={saveError} />}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo">
              <Select value={form.pqrs_type} onChange={e => setForm(f => ({ ...f, pqrs_type: e.target.value }))}>
                <option value="PETICION">Peticion</option>
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
          <FormField label="Descripcion detallada">
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
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
              <p className="font-medium text-white">{detail.subject}</p>
              <p className="text-sm text-slate-300">{detail.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge label={detail.pqrs_type} />
                <Badge label={detail.priority} />
                <Badge label={detail.status} />
              </div>
            </div>
            {detail.comments?.filter((c:any) => !c.is_internal_note).length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-2">Respuestas de administracion</p>
                <div className="space-y-2">
                  {detail.comments.filter((c:any) => !c.is_internal_note).map((c: any) => (
                    <div key={c.id} className="bg-indigo-900/20 border border-indigo-700/30 rounded-lg px-3 py-2">
                      <p className="text-xs text-indigo-400">{c.author} · {c.created_at?.slice(0,10)}</p>
                      <p className="text-sm text-slate-200 mt-0.5">{c.comment_text}</p>
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
