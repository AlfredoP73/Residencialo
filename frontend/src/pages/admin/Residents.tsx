import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Upload, Trash2, User } from 'lucide-react';
import { getResidents, createResident, deactivateResident } from '../../api/residential';
import {
  Badge, Modal, Btn, FormField, Input, Select, Spinner, Alert, PageHeader, EmptyState,
  CardGrid, InteractiveCard, CardArrow, DetailRow,
} from '../../components/ui';

const REQUIRED_COLS = ['documento', 'nombres', 'apellidos', 'correo', 'torre', 'apartamento'];

export default function Residents() {
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    apartment_id: 'apt-302', full_name: '', email: '',
    document_type: 'CC', document_number: '', phone: '', resident_type: 'PROPIETARIO',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = { active: 'true' };
    if (search) params.search = search;
    getResidents(params)
      .then((r: any) => setResidents(r.data || []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaveError(''); setSaving(true);
    try {
      await createResident(form);
      setShowModal(false);
      setForm({ apartment_id: 'apt-302', full_name: '', email: '', document_type: 'CC', document_number: '', phone: '', resident_type: 'PROPIETARIO' });
      load();
    } catch (err: any) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`¿Desactivar a ${name}?`)) return;
    try { await deactivateResident(id); setSelected(null); load(); }
    catch (err: any) { setError(err.message); }
  };

  // Excel import — Adapter pattern on frontend side
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!rows.length) { setImportResult({ error: 'Archivo vacío' }); return; }
    const headers: string[] = (rows[0] as string[]).map(h => String(h).trim().toLowerCase().replace(/ /g, '_'));
    const missing = REQUIRED_COLS.filter(c => !headers.includes(c));
    if (missing.length) { setImportResult({ error: `Columnas faltantes: ${missing.join(', ')}` }); return; }
    const records = rows.slice(1).filter(r => r.some(Boolean)).map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
      return obj;
    });
    setImportResult({ ok: true, total: records.length, preview: records.slice(0, 3), records });
  };

  const confirmImport = async () => {
    if (!importResult?.records) return;
    // Map Excel columns → API schema and batch-create
    let created = 0, failed = 0;
    for (const r of importResult.records) {
      try {
        const aptId = r.apartamento === '302' ? 'apt-302' : r.apartamento === '101' ? 'apt-101' : 'apt-302';
        await createResident({
          apartment_id: aptId,
          full_name: `${r.nombres} ${r.apellidos}`,
          email: r.correo,
          document_type: r.tipo_documento || 'CC',
          document_number: String(r.documento),
          phone: r.telefono || '',
          resident_type: r.tipo_residente || 'PROPIETARIO',
        });
        created++;
      } catch { failed++; }
    }
    setImportResult({ done: true, created, failed });
    load();
  };

  return (
    <div>
      <PageHeader
        title="Residentes"
        subtitle={`${residents.length} activos`}
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => setShowImport(true)}><Upload className="w-4 h-4" />Importar Excel</Btn>
            <Btn variant="primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Nuevo</Btn>
          </div>
        }
      />

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar nombre o documento..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : residents.length === 0 ? <EmptyState message="No hay residentes" /> : (
        <CardGrid cols={3}>
          {residents.map((r: any) => (
            <InteractiveCard key={r.id} onClick={() => setSelected(r)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{r.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{r.email}</p>
                  </div>
                </div>
                <CardArrow />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">{r.tower} — Apto {r.apartment_number}</span>
                <Badge label={r.resident_type} />
              </div>
            </InteractiveCard>
          ))}
        </CardGrid>
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.full_name || ''}>
        {selected && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <DetailRow label="Documento" value={`${selected.document_type} ${selected.document_number}`} />
              <DetailRow label="Correo" value={selected.email || '—'} />
              <DetailRow label="Teléfono" value={selected.phone || '—'} />
              <DetailRow label="Torre / Apto" value={`${selected.tower} — Apto ${selected.apartment_number}`} />
              <DetailRow label="Tipo" value={<Badge label={selected.resident_type} />} />
              {selected.start_date && <DetailRow label="Residente desde" value={selected.start_date} />}
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => setSelected(null)}>Cerrar</Btn>
              <Btn variant="danger" onClick={() => handleDeactivate(selected.id, selected.full_name)}>
                <Trash2 className="w-3.5 h-3.5" /> Desactivar
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Residente">
        <form onSubmit={handleCreate} className="space-y-4">
          {saveError && <Alert type="error" message={saveError} />}
          <FormField label="Apartamento">
            <Select value={form.apartment_id} onChange={e => setForm(f => ({...f, apartment_id: e.target.value}))}>
              <option value="apt-302">Torre 1 – Apto 302</option>
              <option value="apt-101">Torre 1 – Apto 101</option>
              <option value="apt-401">Torre 2 – Apto 401</option>
            </Select>
          </FormField>
          <FormField label="Nombre completo">
            <Input required value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} />
          </FormField>
          <FormField label="Correo electrónico">
            <Input required type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo documento">
              <Select value={form.document_type} onChange={e => setForm(f => ({...f, document_type: e.target.value}))}>
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="PP">Pasaporte</option>
              </Select>
            </FormField>
            <FormField label="Número documento">
              <Input required value={form.document_number} onChange={e => setForm(f => ({...f, document_number: e.target.value}))} />
            </FormField>
          </div>
          <FormField label="Teléfono">
            <Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          </FormField>
          <FormField label="Tipo de residente">
            <Select value={form.resident_type} onChange={e => setForm(f => ({...f, resident_type: e.target.value}))}>
              <option value="PROPIETARIO">Propietario</option>
              <option value="ARRENDATARIO">Arrendatario</option>
              <option value="FAMILIAR">Familiar</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn variant="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear'}</Btn>
          </div>
        </form>
      </Modal>

      {/* Import modal */}
      <Modal open={showImport} onClose={() => { setShowImport(false); setImportResult(null); }} title="Importar Residentes desde Excel">
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-2 font-medium">Columnas requeridas en el Excel:</p>
            <div className="flex flex-wrap gap-1.5">
              {REQUIRED_COLS.map(c => (
                <span key={c} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded">{c}</span>
              ))}
            </div>
          </div>

          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          <Btn variant="secondary" className="w-full justify-center" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" />Seleccionar archivo .xlsx
          </Btn>

          {importResult?.error && <Alert type="error" message={importResult.error} />}

          {importResult?.ok && (
            <div className="space-y-3">
              <Alert type="success" message={`${importResult.total} filas encontradas. Vista previa:`} />
              <div className="bg-slate-50 rounded-xl p-3 overflow-x-auto">
                <table className="text-xs w-full">
                  <thead><tr>{REQUIRED_COLS.map(c => <th key={c} className="text-slate-500 text-left px-2 py-1">{c}</th>)}</tr></thead>
                  <tbody>
                    {importResult.preview.map((r: any, i: number) => (
                      <tr key={i}>
                        {REQUIRED_COLS.map(c => <td key={c} className="text-slate-700 px-2 py-1">{r[c] ?? ''}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Btn variant="primary" className="w-full justify-center" onClick={confirmImport}>
                Confirmar importación
              </Btn>
            </div>
          )}

          {importResult?.done && (
            <Alert type="success" message={`Importación completada: ${importResult.created} creados, ${importResult.failed} fallidos.`} />
          )}
        </div>
      </Modal>
    </div>
  );
}
