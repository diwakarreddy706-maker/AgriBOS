import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Sun, Moon, Globe, Bell, Mail, Search, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Breadcrumbs Header */}
      <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
        <span>SRI BASAVESHWARA & CO</span>
        <span>/</span>
        <span>MACHINE ERP</span>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-100 font-extrabold">DRIVERS DIRECTORY</span>
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
      <div className="flex items-center space-x-3">
        {/* Kannada Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
          className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-400 transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Notifications Icon with dot */}
        <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Mail Icon */}
        <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
          <Mail className="w-4 h-4" />
        </button>

        {/* Date Pill */}
        <div className="hidden lg:flex items-center px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
          WED, 29 JUL, 2026
        </div>

        {/* Logout User button */}
        {user && (
          <button
            onClick={logout}
            className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

