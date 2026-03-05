import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateCase from './pages/CreateCase';
import CaseDetails from './pages/CaseDetails';

import DatabaseViewer from './pages/DatabaseViewer';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="create-case" element={<CreateCase />} />
            <Route path="database" element={<DatabaseViewer />} />
            <Route path="cases/:id" element={<CaseDetails />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
