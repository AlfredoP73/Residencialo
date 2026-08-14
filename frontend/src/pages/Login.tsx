import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Building2, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Input, Btn, Alert } from '../components/ui';

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    // The role is never chosen by the person logging in — it's resolved
    // server-side from their account and encoded in the JWT, so the portal
    // they land on is determined automatically.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl mb-4 shadow-lg shadow-brand-200">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Residencialo</h1>
          <p className="text-sm text-brand-700 mt-1 font-medium">Conjunto San Francisco de Asís</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-popover">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-semibold text-slate-700">Acceso al Portal</h2>
          </div>

          {error && <Alert type="error" message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Correo electrónico</label>
              <Input
                type="email" placeholder="correo@ejemplo.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Contraseña</label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Btn type="submit" variant="primary" className="w-full justify-center py-2.5" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Btn>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Residencialo — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
