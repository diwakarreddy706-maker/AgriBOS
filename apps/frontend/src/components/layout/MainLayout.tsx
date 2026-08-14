import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/useAuthStore';

export const MainLayout: React.FC = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading AgriBOS ERP...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors overflow-x-hidden">
      <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
      <div className="flex flex-1 relative">
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
