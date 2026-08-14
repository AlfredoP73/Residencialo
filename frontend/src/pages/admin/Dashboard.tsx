import React, { useEffect, useState } from 'react';
import { Home, Users, FileText, Car, Package, BarChart2, AlertCircle, Calendar } from 'lucide-react';
import { getDashboardKpis } from '../../api/management';
import { KpiCard, Spinner, Alert, PageHeader } from '../../components/ui';

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardKpis()
      .then((r: any) => setKpis(r.data))
      .catch((e: any) => setError(e.message));
  }, []);

  if (error) return <Alert type="error" message={error} />;
  if (!kpis) return <Spinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen general del conjunto residencial" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Home}      label="Apartamentos"      value={kpis.total_apartments}    sub={`${kpis.occupied_apartments} habitados`}  color="brand" />
        <KpiCard icon={Users}     label="Residentes"        value={kpis.total_residents}     sub="activos"                                   color="brand" />
        <KpiCard icon={Car}       label="Parqueaderos libres" value={kpis.available_parking_spaces} sub="disponibles"                       color="emerald" />
        <KpiCard icon={FileText}  label="PQRS pendientes"   value={kpis.pending_pqrs}        sub="en revisión"                               color="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={BarChart2} label="Recaudo mensual"   value={`$${(kpis.monthly_recollection_cop/1e6).toFixed(1)}M`} sub="COP"    color="emerald" />
        <KpiCard icon={AlertCircle} label="Morosidad"       value={`${kpis.delinquency_percentage}%`} sub="del total"                       color="rose" />
        <KpiCard icon={Package}   label="Paquetes pendientes" value={kpis.pending_packages}  sub="en portería"                              color="brand" />
        <KpiCard icon={Calendar}  label="Reservas activas"  value={kpis.active_reservations} sub="aprobadas"                                color="brand" />
      </div>

      {/* Quick summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Estado del conjunto</h3>
          <div className="space-y-2">
            {[
              { label: 'Ocupación', value: `${Math.round(kpis.occupied_apartments/kpis.total_apartments*100)}%`, color: 'text-emerald-600' },
              { label: 'Morosidad', value: `${kpis.delinquency_percentage}%`, color: 'text-amber-600' },
              { label: 'Apartamentos desocupados', value: kpis.vacant_apartments ?? (kpis.total_apartments - kpis.occupied_apartments), color: 'text-slate-500' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{row.label}</span>
                <span className={`font-semibold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Acciones rápidas</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Ver PQRS', href: '/admin/pqrs' },
              { label: 'Apartamentos', href: '/admin/apartments' },
              { label: 'Residentes', href: '/admin/residents' },
              { label: 'Parqueaderos', href: '/admin/parking' },
            ].map(a => (
              <a key={a.href} href={a.href}
                className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 px-3 py-2 rounded-lg transition-colors text-center font-medium">
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
