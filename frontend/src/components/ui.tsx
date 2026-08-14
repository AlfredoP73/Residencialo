import React, { ReactNode } from 'react';
import { X, AlertCircle, ChevronRight } from 'lucide-react';

// ── Badge ──────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  HABITADO: 'bg-emerald-100 text-emerald-700',
  DESOCUPADO: 'bg-slate-100 text-slate-600',
  EN_REFORMA: 'bg-amber-100 text-amber-700',
  ACTIVO: 'bg-emerald-100 text-emerald-700',
  INACTIVO: 'bg-slate-100 text-slate-600',
  RECIBIDO: 'bg-brand-100 text-brand-700',
  ENTREGADO: 'bg-emerald-100 text-emerald-700',
  AUTORIZADO: 'bg-brand-100 text-brand-700',
  EN_CONJUNTO: 'bg-amber-100 text-amber-700',
  RETIRADO: 'bg-slate-100 text-slate-600',
  SOLICITADA: 'bg-amber-100 text-amber-700',
  APROBADA: 'bg-emerald-100 text-emerald-700',
  RECHAZADA: 'bg-rose-100 text-rose-700',
  CANCELADA: 'bg-slate-100 text-slate-600',
  DISPONIBLE: 'bg-emerald-100 text-emerald-700',
  ASIGNADO: 'bg-brand-100 text-brand-700',
  OCUPADO: 'bg-rose-100 text-rose-700',
  CREADA: 'bg-brand-100 text-brand-700',
  EN_REVISION: 'bg-amber-100 text-amber-700',
  RESUELTA: 'bg-emerald-100 text-emerald-700',
  CERRADA: 'bg-slate-100 text-slate-600',
  PENDIENTE: 'bg-amber-100 text-amber-700',
  ALTA: 'bg-rose-100 text-rose-700',
  MEDIA: 'bg-amber-100 text-amber-700',
  BAJA: 'bg-slate-100 text-slate-600',
  URGENTE: 'bg-rose-200 text-rose-800 font-semibold',
  PROPIETARIO: 'bg-brand-100 text-brand-700',
  ARRENDATARIO: 'bg-violet-100 text-violet-700',
  FAMILIAR: 'bg-slate-100 text-slate-600',
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
// Note: intentionally uses a plain semi-transparent overlay (no backdrop-blur).
// backdrop-filter: blur() forces the browser to continuously repaint everything
// behind the modal, which is what caused the app to feel sluggish while a
// modal/card detail was open. A solid overlay looks just as clean and is cheap.
export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-popover w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
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
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

export function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 placeholder-slate-400 ${props.className || ''}`}
    />
  );
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ${props.className || ''}`}
    >
      {children}
    </select>
  );
}

export function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 placeholder-slate-400 ${props.className || ''}`}
    />
  );
}

export function Btn({
  children, variant = 'primary', size = 'md', ...props
}: { children: ReactNode; variant?: 'primary'|'secondary'|'danger'|'ghost'; size?: 'sm'|'md' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
    danger: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200',
    ghost: 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
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
    <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
      <AlertCircle className="w-9 h-9 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────
export function KpiCard({ label, value, sub, icon: Icon, color = 'brand' }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    indigo: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-brand-50 text-brand-600',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 shadow-card hover:shadow-card-hover transition-shadow">
      <div className={`p-2.5 rounded-xl ${colors[color] || colors.brand}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Section Header ───────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Table (legacy — kept for simple reference tables) ──────────────────
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            {headers.map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-slate-700 whitespace-nowrap ${className}`}>{children}</td>;
}

// ── Alert ────────────────────────────────────────────────────────────
export function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const styles = {
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm mb-4 ${styles[type]}`}>
      {message}
    </div>
  );
}

// ── Interactive Card + Grid ─────────────────────────────────────────
// Used to replace plain data tables with clickable cards that reveal
// full detail in a Modal (see DetailRow below) when tapped/clicked.
export function CardGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const colsCls = cols === 2 ? 'md:grid-cols-2' : cols === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-2 xl:grid-cols-3';
  return <div className={`grid grid-cols-1 ${colsCls} gap-4`}>{children}</div>;
}

export function InteractiveCard({ children, onClick, className = '' }: {
  children: ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-card transition-all
        ${onClick ? 'cursor-pointer hover:shadow-card-hover hover:border-brand-300 hover:-translate-y-0.5' : ''}
        ${className}`}
    >
      {children}
    </div>
  );
}

export function CardArrow() {
  return <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />;
}

// Label/value row used inside detail modals opened from a card.
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}
