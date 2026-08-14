import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Tractor, 
  Wrench, 
  Users, 
  Calendar, 
  Fuel, 
  BookOpen, 
  HelpCircle, 
  LogOut, 
  Sparkles,
  UserCheck,
  Activity,
  AlertOctagon,
  Package,
  Settings,
  FileCheck,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { t } = useLanguageStore();

  const isDriversActive = location.pathname === '/employees' || location.pathname === '/drivers';

  // Auto close mobile drawer on route change
  useEffect(() => {
    if (isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  }, [location.pathname]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const renderNavLinks = () => (
    <div className="space-y-1">
      {/* Tractors */}
      <NavLink
        to="/tractors"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <Tractor className="w-4 h-4 shrink-0 text-blue-500" />
        <span>🚜 {t.tractors || 'Tractors'}</span>
      </NavLink>

      {/* Harvesting Machines */}
      <NavLink
        to="/harvesters"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-amber-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
        <span>🌾 {t.harvestingMachines || 'Harvesting Machines'}</span>
      </NavLink>

      {/* Combined Fleet Catalog */}
      <NavLink
        to="/machines"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-slate-700 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <Tractor className="w-4 h-4 shrink-0 text-slate-400" />
        <span>{t.machines} (All Fleet)</span>
      </NavLink>

      {/* Vehicle Compliance */}
      <NavLink
        to="/vehicle-compliance"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <FileCheck className="w-4 h-4 shrink-0 text-amber-500" />
        <span>{t.vehicleCompliance}</span>
      </NavLink>

      {/* Machine Owners */}
      <NavLink
        to="/machine-owners"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <UserCheck className="w-4 h-4 shrink-0" />
        <span>{t.rentedFleet}</span>
      </NavLink>

      {/* Farmer Ledger Book */}
      <NavLink
        to="/farmers"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <Users className="w-4 h-4 shrink-0" />
        <span>{t.farmerLedger}</span>
      </NavLink>

      {/* Drivers & Operators */}
      <NavLink
        to="/drivers"
        onClick={() => onCloseMobile?.()}
        className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
          isDriversActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <Users className="w-4 h-4 shrink-0" />
        <span>{t.driversDirectory}</span>
      </NavLink>

      {/* Rental Bookings */}
      <NavLink
        to="/bookings"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <Calendar className="w-4 h-4 shrink-0" />
        <span>{t.bookings}</span>
      </NavLink>

      {/* Operations Board */}
      <NavLink
        to="/operations"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <Activity className="w-4 h-4 shrink-0" />
        <span>{t.operations}</span>
      </NavLink>

      {/* Maintenance Records */}
      <NavLink
        to="/maintenance-jobs"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <Wrench className="w-4 h-4 shrink-0" />
        <span>{t.maintenanceJobs}</span>
      </NavLink>

      {/* Breakdown Logs */}
      <NavLink
        to="/breakdowns"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <AlertOctagon className="w-4 h-4 shrink-0" />
        <span>{t.breakdowns}</span>
      </NavLink>

      {/* Diesel & Fuel Vouchers */}
      <NavLink
        to="/fuel-vouchers"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <Fuel className="w-4 h-4 shrink-0" />
        <span>{t.fuelVouchers}</span>
      </NavLink>

      {/* Spare Parts */}
      <NavLink
        to="/spare-parts"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <Package className="w-4 h-4 shrink-0" />
        <span>{t.spareParts}</span>
      </NavLink>

      {/* Machine Invoices & Ledger */}
      <NavLink
        to="/invoices"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <BookOpen className="w-4 h-4 shrink-0" />
        <span>{t.machineBillingLedger}</span>
      </NavLink>

      {/* Masters Management */}
      <NavLink
        to="/masters"
        onClick={() => onCloseMobile?.()}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
            isActive
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`
        }
      >
        <Settings className="w-4 h-4 shrink-0" />
        <span>{t.masters}</span>
      </NavLink>
    </div>
  );

  const renderFooter = () => (
    <div className="p-4 space-y-3 border-t border-slate-100 dark:border-slate-800">
      {/* Quick Support Box */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Quick Support</p>
          <p className="text-[10px] text-slate-400 font-medium">Direct assistance line</p>
        </div>
      </div>

      {/* User Profile */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-300 dark:border-slate-600">
            DG
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {user?.fullName || 'Doddanna Gowda'}
            </p>
            <span className="inline-block text-[9px] font-extrabold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded uppercase mt-0.5">
              OWNER
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          aria-label="Sign out"
          className="w-11 h-11 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors cursor-pointer"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Preserved exactly as-is) */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/95 text-slate-900 dark:text-slate-100 flex-col justify-between hidden md:flex h-screen sticky top-0 overflow-y-auto transition-colors shrink-0">
        <div className="p-4 space-y-5">
          {/* Brand Header */}
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                BASAVESHWARA
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ALABANUR / SINDHANUR
              </p>
            </div>
          </div>

          {/* MACHINE ERP Header Badge */}
          <div className="px-2 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span className="text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5">
                <Tractor className="w-3.5 h-3.5 text-blue-600" />
                MACHINE ERP
              </span>
              <span className="text-[9px] font-extrabold bg-blue-600 text-white px-1.5 py-0.5 rounded-md uppercase">
                FULL SYSTEM
              </span>
            </div>
          </div>

          {renderNavLinks()}
        </div>

        {renderFooter()}
      </aside>

      {/* Mobile Drawer Overlay & Slide-in Sidebar */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Mobile Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between h-full shadow-2xl z-50 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Brand Header & Mobile Close Button */}
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                    <Sparkles className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <h1 className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                      BASAVESHWARA
                    </h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      ALABANUR / SINDHANUR
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close navigation"
                  className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderNavLinks()}
            </div>

            {renderFooter()}
          </div>
        </div>
      )}
    </>
  );
};
