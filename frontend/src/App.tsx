import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AppShell from './components/AppShell';

import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Apartments from './pages/admin/Apartments';
import Residents from './pages/admin/Residents';
import Areas from './pages/admin/Areas';
import Parking from './pages/admin/Parking';
import AdminPqrs from './pages/admin/Pqrs';
import Packages from './pages/doorman/Packages';
import Visitors from './pages/doorman/Visitors';
import ResidentHome from './pages/resident/Home';
import ResidentReservations from './pages/resident/Reservations';
import ResidentPqrs from './pages/resident/Pqrs';
import Documents from './pages/resident/Documents';

const ADMIN = ['admin', 'superadmin'] as const;
const DOORMAN = ['admin', 'superadmin', 'doorman'] as const;
const ALL = ['admin', 'superadmin', 'resident', 'doorman'] as const;

function Shell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={[...ADMIN]}>
              <Shell><Dashboard /></Shell>
            </ProtectedRoute>
          } />
          <Route path="/admin/apartments" element={
            <ProtectedRoute allowedRoles={[...ADMIN]}>
              <Shell><Apartments /></Shell>
            </ProtectedRoute>
          } />
          <Route path="/admin/residents" element={
            <ProtectedRoute allowedRoles={[...ADMIN]}>
              <Shell><Residents /></Shell>
            </ProtectedRoute>
          } />
          <Route path="/admin/areas" element={
            <ProtectedRoute allowedRoles={[...ADMIN]}>
              <Shell><Areas /></Shell>
            </ProtectedRoute>
          } />
          <Route path="/admin/parking" element={
            <ProtectedRoute allowedRoles={[...ADMIN]}>
              <Shell><Parking /></Shell>
            </ProtectedRoute>
          } />
          <Route path="/admin/pqrs" element={
            <ProtectedRoute allowedRoles={[...ADMIN]}>
              <Shell><AdminPqrs /></Shell>
            </ProtectedRoute>
          } />

          {/* Doorman routes */}
          <Route path="/doorman/packages" element={
            <ProtectedRoute allowedRoles={[...DOORMAN]}>
              <Shell><Packages /></Shell>
            </ProtectedRoute>
          } />
          <Route path="/doorman/visitors" element={
            <ProtectedRoute allowedRoles={[...ALL]}>
              <Shell><Visitors /></Shell>
            </ProtectedRoute>
          } />

          {/* Resident routes */}
          <Route path="/resident/home" element={
            <ProtectedRoute allowedRoles={['resident']}>
              <Shell><ResidentHome /></Shell>
            </ProtectedRoute>
          } />
          <Route path="/resident/reservations" element={
            <ProtectedRoute allowedRoles={['resident']}>
              <Shell><ResidentReservations /></Shell>
            </ProtectedRoute>
          } />
          <Route path="/resident/pqrs" element={
            <ProtectedRoute allowedRoles={['resident']}>
              <Shell><ResidentPqrs /></Shell>
            </ProtectedRoute>
          } />
          <Route path="/resident/visitors" element={
            <ProtectedRoute allowedRoles={['resident']}>
              <Shell><Visitors /></Shell>
            </ProtectedRoute>
          } />
          <Route path="/resident/documents" element={
            <ProtectedRoute allowedRoles={[...ALL]}>
              <Shell><Documents /></Shell>
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
