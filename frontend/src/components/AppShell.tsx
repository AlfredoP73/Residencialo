import React, { useState, ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, Users, Home, Package, UserCheck,
  Calendar, Car, FileText, LogOut, Menu, X, Bell, ChevronRight,
} from 'lucide-react';
import { useAuth, Role } from '../auth/AuthContext';

interface NavItem { label: string; to: string; icon: React.ElementType; roles: Role[]; }

const NAV: NavItem[] = [
  { label: 'Dashboard',     to: '/admin/dashboard',   icon: LayoutDashboard, roles: ['admin','superadmin'] },
  { label: 'Apartamentos',  to: '/admin/apartments',  icon: Home,            roles: ['admin','superadmin'] },
  { label: 'Residentes',    to: '/admin/residents',   icon: Users,           roles: ['admin','superadmin'] },
  { label: 'Zonas Comunes', to: '/admin/areas',       icon: Calendar,        roles: ['admin','superadmin'] },
  { label: 'Parqueaderos',  to: '/admin/parking',     icon: Car,             roles: ['admin','superadmin'] },
  { label: 'PQRS',          to: '/admin/pqrs',        icon: FileText,        roles: ['admin','superadmin','resident'] },
  { label: 'Paquetes',      to: '/doorman/packages',  icon: Package,         roles: ['admin','superadmin','doorman'] },
  { label: 'Visitantes',    to: '/doorman/visitors',  icon: UserCheck,       roles: ['admin','superadmin','doorman','resident'] },
  // Resident-specific
  { label: 'Mi Apartamento',to: '/resident/home',     icon: Home,            roles: ['resident'] },
  { label: 'Mis Reservas',  to: '/resident/reservations', icon: Calendar,   roles: ['resident'] },
  { label: 'Mis PQRS',      to: '/resident/pqrs',     icon: FileText,        roles: ['resident'] },
  { label: 'Mis Visitantes',to: '/resident/visitors', icon: UserCheck,       roles: ['resident'] },
  { label: 'Documentos',    to: '/resident/documents',icon: FileText,        roles: ['resident','admin','superadmin'] },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userNav = NAV.filter(n => user && n.roles.includes(user.role));

  const handleLogout = () => { signOut(); navigate('/login'); };

  const roleLabel: Record<Role, string> = {
    admin: 'Administrador',
    superadmin: 'Super Admin',
    resident: 'Residente',
    doorman: 'Portero',
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-white text-sm tracking-tight">Residencialo</span>
            <p className="text-xs text-slate-500">Conjunto San Francisco</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {userNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
              ${isActive
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className={`border-t border-slate-700/50 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-indigo-400">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">{user && roleLabel[user.role]}</p>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión"
              className="text-slate-500 hover:text-rose-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} title="Cerrar sesión"
            className="text-slate-500 hover:text-rose-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-slate-900 border-r border-slate-700/50 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => { setCollapsed(c => !c); setMobileOpen(o => !o); }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Building2 className="w-3.5 h-3.5" />
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-300">{user && roleLabel[user.role]}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Bell className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition-colors" />
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-400">{user?.name?.charAt(0)}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
