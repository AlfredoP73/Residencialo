import React, { useEffect, useState } from 'react';
import { Plus, Search, LogIn, LogOut } from 'lucide-react';
import { getVisitors, createVisitor, registerEntry, registerExit } from '../../api/operations';
import {
  Badge, Modal, Table, Td, Btn, FormField, Input, Select,
  Spinner, Alert, PageHeader, EmptyState,
} from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

export default function Visitors() {
  const { user } = useAuth();
  const isResident = user?.role === 'resident';
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    apartment_id: 'apt-302', apartment_number: '302',
    full_name: '', document_number: '',
    vehicle_plate: '', expected_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    setLoading(true);
    const p: Record<string, string> = {};
    if (statusF) p.status = statusF;
    if (search) p.search = search;
    if (isResident) p.apartment_number = '302';
    getVisitors(p)
      .then((r: any) => setItems(r.data || []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusF]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaveError(''); setSaving(true);
    try {
      await createVisitor({ ...form, expected_date: form.expected_date || new Date().toISOString().slice(0, 10) });
      setShowModal(false);
      setForm({ apartment_id: 'apt-302', apartment_number: '302', full_name: '', document_number: '', vehicle_plate: '', expected_date: '' });
      load();
    } catch (err: any) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const handleEntry = async (id: string) => {
    try { await registerEntry(id); load(); } catch (e: any) { setError(e.message); }
  };
  const handleExit = async (id: string) => {
    try { await registerExit(id); load(); } catch (e: any) { setError(e.message); }
  };

  return (
    <div>
      <PageHeader
        title={isResident ? 'Mis Visitantes' : 'Control de Visitantes'}
        subtitle="Registro de visitas al conjunto"
        action={<Btn variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Registrar visitante</Btn>}
      />

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Nombre o documento..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusF} onChange={e => setStatusF(e.target.value)} className="w-44">
          <option value="">Todos los estados</option>
          <option value="AUTORIZADO">Autorizado</option>
          <option value="EN_CONJUNTO">En conjunto</option>
          <option value="RETIRADO">Retirado</option>
        </Select>
      </div>

      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : items.length === 0 ? <EmptyState message="Sin visitantes registrados" /> : (
        <Table headers={['Nombre','Documento','Apto','Placa','Fecha esperada','Estado','Acciones']}>
          {items.map((v: any) => (
            <tr key={v.id} className="hover:bg-slate-800/30">
              <Td className="font-medium">{v.full_name}</Td>
              <Td className="font-mono text-xs">{v.document_number}</Td>
              <Td>Apto {v.apartment_number}</Td>
              <Td>{v.vehicle_plate || '—'}</Td>
              <Td>{v.expected_date}</Td>
              <Td><Badge label={v.status} /></Td>
              <Td>
                {!isResident && v.status === 'AUTORIZADO' && (
                  <Btn size="sm" variant="primary" onClick={() => handleEntry(v.id)}>
                    <LogIn className="w-3 h-3" /> Ingreso
                  </Btn>
                )}
                {!isResident && v.status === 'EN_CONJUNTO' && (
                  <Btn size="sm" variant="secondary" onClick={() => handleExit(v.id)}>
                    <LogOut className="w-3 h-3" /> Salida
                  </Btn>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Visitante">
        <form onSubmit={handleCreate} className="space-y-4">
          {saveError && <Alert type="error" message={saveError} />}
          {!isResident && (
            <FormField label="Apartamento a visitar">
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
          )}
          <FormField label="Nombre completo del visitante">
            <Input required value={form.full_name} placeholder="Ej: María García"
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </FormField>
          <FormField label="Número de documento">
            <Input required value={form.document_number} placeholder="Cédula o pasaporte"
              onChange={e => setForm(f => ({ ...f, document_number: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Placa vehículo (opcional)">
              <Input value={form.vehicle_plate} placeholder="ABC-123"
                onChange={e => setForm(f => ({ ...f, vehicle_plate: e.target.value }))} />
            </FormField>
            <FormField label="Fecha esperada">
              <Input type="date" value={form.expected_date}
                onChange={e => setForm(f => ({ ...f, expected_date: e.target.value }))} />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn variant="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Registrar'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
