import React, { useEffect, useState } from 'react';
import { Home, Car, Package, FileText, Calendar } from 'lucide-react';
import { getApartment } from '../../api/residential';
import { getPackages } from '../../api/operations';
import { getPqrs } from '../../api/management';
import { getReservations } from '../../api/community';
import { Badge, Spinner, Alert, KpiCard, PageHeader } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

export default function ResidentHome() {
  const { user } = useAuth();
  const aptId  = user?.apartment_id;
  const aptNum = user?.apartment_number;

  const [apt, setApt] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [pqrs, setPqrs] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!aptId) { setLoading(false); return; }
    Promise.all([
      getApartment(aptId),
      getPackages({ status: 'RECIBIDO', apartment_number: aptNum || '' }),
      getPqrs({ apartment_id: aptId }),
      getReservations({ apartment_id: aptId }),
    ])
      .then(([a, pk, pq, rv]: any[]) => {
        setApt(a.data);
        setPackages(pk.data || []);
        setPqrs(pq.data || []);
        setReservations(rv.data || []);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [aptId]);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error" message={error} />;
  if (!aptId) return <Alert type="error" message="No tienes un apartamento asignado aún." />;

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${user?.name?.split(' ')[0]}`}
        subtitle="Portal del residente — Conjunto San Francisco de Asis"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Home}     label="Mi apartamento"    value={`Apto ${apt?.apartment_number || aptNum}`} sub={apt?.tower}  color="indigo" />
        <KpiCard icon={Package}  label="Paquetes pendientes" value={packages.length}  sub="en porteria"    color="blue" />
        <KpiCard icon={FileText} label="PQRS activas"      value={pqrs.filter((p:any) => !['CERRADA','RESUELTA'].includes(p.status)).length} sub="en proceso" color="amber" />
        <KpiCard icon={Calendar} label="Reservas"          value={reservations.filter((r:any) => r.status === 'APROBADA').length} sub="aprobadas" color="emerald" />
      </div>

      {apt && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Home className="w-4 h-4" /> Informacion del apartamento
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Numero', value: apt.apartment_number },
                { label: 'Torre', value: apt.tower },
                { label: 'Piso', value: apt.floor },
                { label: 'Area', value: apt.area_sqm ? `${apt.area_sqm} m²` : '—' },
                { label: 'Coeficiente', value: apt.coefficient },
                { label: 'Estado', value: <Badge label={apt.status} /> },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-slate-400">{row.label}</span>
                  <span className="text-white font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Car className="w-4 h-4" /> Vehiculos registrados
            </h3>
            {!apt.vehicles?.length ? (
              <p className="text-sm text-slate-500">No hay vehiculos registrados</p>
            ) : (
              <div className="space-y-2">
                {apt.vehicles.map((v: any) => (
                  <div key={v.id} className="flex justify-between text-sm bg-slate-800 rounded-lg px-3 py-2">
                    <span className="text-white font-mono">{v.license_plate}</span>
                    <span className="text-slate-400">{v.brand} {v.model} — {v.color}</span>
                    <Badge label={v.vehicle_type} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {packages.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-700/40 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" /> Paquetes esperando en porteria
          </h3>
          <div className="space-y-2">
            {packages.map((p: any) => (
              <div key={p.id} className="flex justify-between text-sm bg-slate-800/50 rounded-lg px-3 py-2">
                <span className="text-white">{p.courier_company}</span>
                <span className="font-mono text-xs text-slate-400">{p.tracking_number || 'Sin guia'}</span>
                <span className="text-slate-400 text-xs">{p.received_at?.slice(0,10)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
