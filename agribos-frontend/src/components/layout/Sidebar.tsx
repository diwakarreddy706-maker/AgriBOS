import React from 'react';
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
  FileCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { t } = useLanguageStore();

  const isDriversActive = location.pathname === '/employees' || location.pathname === '/drivers';


  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/95 text-slate-100 flex-col justify-between hidden md:flex h-screen sticky top-0 overflow-y-auto backdrop-blur-2xl">
      <div className="p-4 space-y-5">
        
        {/* Brand Header: BASAVESHWARA ALABANUR / SINDHANUR */}
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

        {/* MACHINE ERP Full Navigation Links */}
        <div className="space-y-1">
          {/* Tractors */}
          <NavLink
            to="/tractors"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
      </div>

      {/* Bottom Quick Support Card & User Profile Block */}
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

        {/* Doddanna Gowda (OWNER) User Profile */}
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
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
