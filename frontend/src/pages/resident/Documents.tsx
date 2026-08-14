import React, { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { getDocuments } from '../../api/management';
import { Badge, Spinner, Alert, PageHeader, EmptyState, Select } from '../../components/ui';

export default function Documents() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryF, setCategoryF] = useState('');

  useEffect(() => {
    getDocuments()
      .then((r: any) => setDocs(r.data || []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = categoryF ? docs.filter(d => d.category === categoryF) : docs;

  const CATEGORIES = ['REGLAMENTO', 'MANUAL', 'ACTA', 'CIRCULAR', 'GENERAL'];

  return (
    <div>
      <PageHeader title="Documentos" subtitle="Reglamentos, actas y circulares del conjunto" />

      <div className="mb-5">
        <Select value={categoryF} onChange={e => setCategoryF(e.target.value)} className="w-48">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {error && <Alert type="error" message={error} />}
      {loading ? <Spinner /> : filtered.length === 0 ? <EmptyState message="Sin documentos" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((d: any) => (
            <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 group hover:border-brand-300 hover:shadow-card-hover shadow-card transition-all">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
                <FileText className="w-5 h-5 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">{d.title}</p>
                {d.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{d.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Badge label={d.category} />
                  <span className="text-xs text-slate-400">{d.created_at?.slice(0, 10)}</span>
                </div>
              </div>
              <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 text-slate-400 hover:text-brand-600 transition-colors mt-1">
                <Download className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
