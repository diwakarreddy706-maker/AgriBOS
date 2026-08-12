import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';

export const AuthLayout: React.FC = () => {
  const { t } = useLanguageStore();
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-agri-900 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-agri-700 text-white font-black text-2xl shadow-xl mb-3">
            AB
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">{t.companyName}</h1>
          <p className="text-xs text-agri-300 font-medium mt-1">Proprietor: {t.ownerName}</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
