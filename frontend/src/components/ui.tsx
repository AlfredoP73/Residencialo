import React, { ReactNode } from 'react';
import { X, AlertCircle } from 'lucide-react';

// ── Badge ──────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  HABITADO: 'bg-emerald-100 text-emerald-700',
  DESOCUPADO: 'bg-slate-100 text-slate-600',
  EN_REFORMA: 'bg-amber-100 text-amber-700',
  ACTIVO: 'bg-emerald-100 text-emerald-700',
  RECIBIDO: 'bg-blue-100 text-blue-700',
  ENTREGADO: 'bg-emerald-100 text-emerald-700',
  AUTORIZADO: 'bg-indigo-100 text-indigo-700',
  EN_CONJUNTO: 'bg-amber-100 text-amber-700',
  RETIRADO: 'bg-slate-100 text-slate-600',
  SOLICITADA: 'bg-amber-100 text-amber-700',
  APROBADA: 'bg-emerald-100 text-emerald-700',
  RECHAZADA: 'bg-rose-100 text-rose-700',
  CANCELADA: 'bg-slate-100 text-slate-600',
  DISPONIBLE: 'bg-emerald-100 text-emerald-700',
  ASIGNADO: 'bg-indigo-100 text-indigo-700',
  OCUPADO: 'bg-rose-100 text-rose-700',
  CREADA: 'bg-blue-100 text-blue-700',
  EN_REVISION: 'bg-amber-100 text-amber-700',
  RESUELTA: 'bg-emerald-100 text-emerald-700',
  CERRADA: 'bg-slate-100 text-slate-600',
  PENDIENTE: 'bg-amber-100 text-amber-700',
  ALTA: 'bg-rose-100 text-rose-700',
  MEDIA: 'bg-amber-100 text-amber-700',
  BAJA: 'bg-slate-100 text-slate-600',
  URGENTE: 'bg-rose-200 text-rose-800 font-semibold',
};

export function Badge({ label }: { label: string }) {
  const cls = statusColors[label] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── FormField ────────────────────────────────────────────────────────
export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

export function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 ${props.className || ''}`}
    />
  );
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className || ''}`}
    >
      {children}
    </select>
  );
}

export function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 ${props.className || ''}`}
    />
  );
}

export function Btn({
  children, variant = 'primary', size = 'md', ...props
}: { children: ReactNode; variant?: 'primary'|'secondary'|'danger'|'ghost'; size?: 'sm'|'md' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50';
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
    danger: 'bg-rose-600/90 hover:bg-rose-600 text-white',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800',
  };
  const sizes = { sm: 'text-xs px-2.5 py-1.5', md: 'text-sm px-4 py-2' };
  return (
    <button {...props} className={`${base} ${variants[variant]} ${sizes[size]} ${props.className || ''}`}>
      {children}
    </button>
  );
}

// ── EmptyState ───────────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <AlertCircle className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────
export function KpiCard({ label, value, sub, icon: Icon, color = 'indigo' }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
    blue: 'bg-blue-500/10 text-blue-400',
  };
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${colors[color] || colors.indigo}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Section Header ───────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────────────
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/80">
            {headers.map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-slate-200 whitespace-nowrap ${className}`}>{children}</td>;
}

// ── Alert ────────────────────────────────────────────────────────────
export function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const styles = {
    error: 'bg-rose-900/40 border-rose-700 text-rose-300',
    success: 'bg-emerald-900/40 border-emerald-700 text-emerald-300',
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm ${styles[type]}`}>
      {message}
    </div>
  );
}
