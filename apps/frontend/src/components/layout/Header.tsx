import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Sun, Moon, Globe, Bell, Search, LogOut, Menu } from 'lucide-react';

const routeTitleMap: Record<string, string> = {
  '/': 'EXECUTIVE DASHBOARD',
  '/operations': 'OPERATIONS CONTROL',
  '/bookings': 'BOOKINGS & DISPATCHES',
  '/tractors': 'TRACTOR FLEET (100% OWNED)',
  '/harvesters': 'COMBINE HARVESTERS FLEET',
  '/machines': 'ALL MACHINERY FLEET',
  '/machine-owners': 'RENTED FLEET OWNERS',
  '/rented-owner-settlement': 'RENTED FLEET OWNERS',
  '/farmers': 'FARMERS CREDIT LEDGER',
  '/employees': 'STAFF & OPERATORS',
  '/drivers': 'DRIVERS DIRECTORY',
  '/fuel-vouchers': 'FUEL & DIESEL BUNK VOUCHERS',
  '/maintenance-jobs': 'WORKSHOP MAINTENANCE',
  '/vehicle-compliance': 'RTO COMPLIANCE & INSURANCE',
  '/finance': 'FINANCIAL MANAGEMENT',
  '/general-ledger': 'GENERAL LEDGER',
  '/profit-loss': 'PROFIT & LOSS STATEMENT',
  '/masters': 'SYSTEM MASTERS',
};

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();

  const currentPathTitle = routeTitleMap[location.pathname] || 'MACHINE ERP';

  // Dynamic live calendar date string
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${dayName}, ${dayNum} ${monthName}, ${year}`;
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs text-slate-900 dark:text-slate-100 transition-colors">
      {/* Left: Mobile Menu Button & Breadcrumbs Header */}
      <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-slate-500 uppercase overflow-hidden">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation"
          className="md:hidden w-11 h-11 flex items-center justify-center shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-1.5 truncate">
          <span className="hidden sm:inline text-slate-400">SRI BASAVESHWARA & CO</span>
          <span className="hidden sm:inline text-slate-400">/</span>
          <span className="hidden md:inline text-slate-400">MACHINE ERP</span>
          <span className="hidden md:inline text-slate-400">/</span>
          <span className="text-slate-900 dark:text-slate-100 font-extrabold truncate max-w-[130px] sm:max-w-none">
            {currentPathTitle}
          </span>
        </div>
      </div>

      {/* Middle: Search bar */}
      <div className="hidden md:flex items-center relative w-80">
        <Search className="w-4 h-4 absolute left-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search actions... (Ctrl + K)"
          className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Right Controls: Kannada toggle, theme, bell, mail, date pill */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Kannada Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
          aria-label="Toggle language"
          className="flex items-center space-x-1 text-xs font-bold px-2.5 sm:px-3 h-11 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Notifications Icon with dot */}
        <button
          aria-label="Notifications"
          className="hidden xs:flex w-11 h-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-3 right-3 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Dynamic Live Date Pill */}
        <div className="hidden lg:flex items-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
          {todayDateStr}
        </div>

        {/* Logout User button */}
        {user && (
          <button
            onClick={logout}
            aria-label="Sign out"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
