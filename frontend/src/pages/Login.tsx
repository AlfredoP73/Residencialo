import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Building2, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Input, Btn, Alert } from '../components/ui';

const DEMO_USERS = [
  { label: 'Administrador', email: 'admin@residencialo.com', password: 'admin123', color: 'indigo' },
  { label: 'Residente',     email: 'residente@residencialo.com', password: 'res123', color: 'emerald' },
  { label: 'Portero',       email: 'portero@residencialo.com', password: 'door123', color: 'amber' },
];

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    const redirect = user.role === 'admin' || user.role === 'superadmin'
      ? '/admin/dashboard'
      : user.role === 'resident' ? '/resident/home' : '/doorman/packages';
    return <Navigate to={redirect} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // redirect handled by Navigate above after re-render
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (e: string, p: string) => { setEmail(e); setPassword(p); setError(''); };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Residencialo</h1>
          <p className="text-sm text-slate-400 mt-1">Conjunto San Francisco de Asís</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Acceso al Portal</h2>
          </div>

          {error && <Alert type="error" message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Correo electrónico</label>
              <Input
                type="email" placeholder="correo@ejemplo.com"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Contraseña</label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Btn type="submit" variant="primary" className="w-full justify-center py-2.5" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Btn>
          </form>

          {/* Demo shortcuts */}
          <div className="mt-5 pt-5 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-3 text-center">Acceso rápido (demo)</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map(d => (
                <button key={d.email} onClick={() => fillDemo(d.email, d.password)}
                  className="text-xs py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-600">
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
