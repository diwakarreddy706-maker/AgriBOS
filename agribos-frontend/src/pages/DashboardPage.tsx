import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { machineApi } from '../features/machine/api/machineApi';
import { analyticsApi } from '../features/analytics/api/analyticsApi';
import { farmerApi } from '../features/farmer/api/farmerApi';
import { operationsApi } from '../features/operations/api/operationsApi';
import { formatCurrency } from '../lib/utils';
import {
  Tractor,
  Wheat,
  Users,
  Calendar,
  Fuel,
  Wrench,
  TrendingUp,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Layers,
  Wallet,
  ArrowUpRight,
  Zap,
  ChevronRight,
  Search,
  Activity
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [fleetSearch, setFleetSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'TRACTOR' | 'HARVESTER'>('ALL');

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Queries for live real business metrics
  const { data: machinesData, isLoading: isLoadingMachines } = useQuery({
    queryKey: ['dashboard-machines'],
    queryFn: () => machineApi.getMachines(undefined, undefined, undefined, 0, 100),
  });

  const { data: farmerLedgers } = useQuery({
    queryKey: ['dashboard-farmers-ledger'],
    queryFn: () => farmerApi.getFarmerLedgerAccounts(),
  });

  const { data: profitabilityData } = useQuery({
    queryKey: ['dashboard-profitability'],
    queryFn: () => analyticsApi.getMachineProfitability(),
  });

  const { data: opsMetrics } = useQuery({
    queryKey: ['dashboard-ops'],
    queryFn: () => operationsApi.getDashboardMetrics(),
  });

  const machines = machinesData?.content || [];
  const ledgers = farmerLedgers || [];
  const profitability = profitabilityData || [];

  // Calculate high-level Executive KPIs
  const tractors = machines.filter(m => ['TRACTOR', 'ROTAVATOR', 'BALER', 'IMPLEMENT'].includes(m.machineType?.toUpperCase()));
  const harvesters = machines.filter(m => ['HARVESTER', 'COMBINE_HARVESTER'].includes(m.machineType?.toUpperCase()));

  const totalRevenue = profitability.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalExpenses = profitability.reduce((sum, item) => sum + (item.fuelCost || 0) + (item.maintenanceCost || 0) + (item.ownerPayout || 0), 0);
  const totalNetProfit = profitability.reduce((sum, item) => sum + (item.netProfit || 0), 0);
  const totalUdharBalance = ledgers.reduce((sum, f) => sum + (f.totalBalanceDue || 0), 0);

  const availableTractors = tractors.filter(t => t.status === 'AVAILABLE').length;
  const availableHarvesters = harvesters.filter(h => h.status === 'AVAILABLE').length;

  const profitMarginPercent = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;

  // Filtered machinery list for table view
  const filteredMachines = machines.filter((m) => {
    const isTractor = ['TRACTOR', 'ROTAVATOR', 'BALER', 'IMPLEMENT'].includes(m.machineType?.toUpperCase());
    const matchesCat = filterCategory === 'ALL' || (filterCategory === 'TRACTOR' ? isTractor : !isTractor);
    const matchesSearch = !fleetSearch || 
      m.machineCode.toLowerCase().includes(fleetSearch.toLowerCase()) || 
      m.makeModel.toLowerCase().includes(fleetSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans antialiased text-slate-800 dark:text-slate-100 pb-12">
      
      {/* High-End Glassmorphic Executive Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 md:p-8 rounded-3xl shadow-2xl border border-emerald-500/20 backdrop-blur-md">
        {/* Glowing Background Orbs */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>SYSTEM LIVE • ALABANUR HUB</span>
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>{currentDate} • {opsMetrics?.todaysBookings || 0} Bookings</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{greeting}, basaveshwara & Co.</span>
              <Sparkles className="w-6 h-6 text-emerald-400 hidden sm:inline-block animate-bounce" />
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              <strong className="text-emerald-400 font-bold">SRI BASAVESHWARA & CO.</strong> • Proprietor: Doddana Gowda. Live real-time operations, machinery fleet tracking, farmer credit ledger & profitability control.
            </p>
          </div>

          {/* Quick Hub Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to="/tractors">
              <button className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600/90 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 border border-blue-400/40 transition-all hover:scale-105 active:scale-95">
                <Tractor className="w-4 h-4" />
                <span>Tractor Fleet ({tractors.length})</span>
              </button>
            </Link>
            <Link to="/harvesters">
              <button className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-900/30 border border-amber-400/40 transition-all hover:scale-105 active:scale-95">
                <Wheat className="w-4 h-4" />
                <span>Harvesting Fleet ({harvesters.length})</span>
              </button>
            </Link>
            <Link to="/machine-billing">
              <button className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 border border-emerald-400/40 transition-all hover:scale-105 active:scale-95">
                <Zap className="w-4 h-4 text-emerald-200" />
                <span>+ Machine Billing</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Premium Executive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Tractor Fleet */}
        <div className="group relative overflow-hidden bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Tractor Fleet</span>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white flex items-baseline space-x-2">
                <span>{tractors.length}</span>
                <span className="text-xs font-sans font-bold text-slate-400">Units</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200/50 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shadow-xs">
              <Tractor className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{availableTractors} Ready</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">RTO & Hourly Work</span>
          </div>
        </div>

        {/* Card 2: Combine Harvesters */}
        <div className="group relative overflow-hidden bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Harvesting Fleet</span>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white flex items-baseline space-x-2">
                <span>{harvesters.length}</span>
                <span className="text-xs font-sans font-bold text-slate-400">Units</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200/50 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shadow-xs">
              <Wheat className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{availableHarvesters} Ready</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Paddy Acre Rates</span>
          </div>
        </div>

        {/* Card 3: Farmer Credit Ledger (Udhar) */}
        <Link to="/farmers" className="group relative overflow-hidden bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1">
                <span>Farmer Udhar Ledger</span>
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
              <div className="text-2xl md:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
                {formatCurrency(totalUdharBalance)}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200/50 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform shadow-xs">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-bold">{ledgers.length} Registered Farmers</span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200/40">
              Collect Udhar
            </span>
          </div>
        </Link>

        {/* Card 4: Net Operating Profit */}
        <div className="group relative overflow-hidden bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Net Operating Profit</span>
              <div className="text-2xl md:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalNetProfit)}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Margin: <strong className="text-slate-900 dark:text-white font-bold">{profitMarginPercent}%</strong></span>
            <span className="text-[11px] text-slate-400 font-mono">Rev: {formatCurrency(totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Financial Performance Progress Meter */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
              Fleet Financial Breakdown & Profitability Gauge
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Total Revenue: <strong className="text-emerald-600">{formatCurrency(totalRevenue)}</strong>
          </span>
        </div>

        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-200 dark:border-slate-700">
          <div 
            style={{ width: `${Math.max(5, Math.min(100, profitMarginPercent))}%` }} 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-xs transition-all duration-1000"
            title={`Net Profit: ${formatCurrency(totalNetProfit)}`}
          ></div>
          <div 
            style={{ width: `${Math.max(5, 100 - profitMarginPercent)}%` }} 
            className="h-full bg-gradient-to-r from-rose-400 to-amber-500 rounded-full opacity-60 transition-all duration-1000 ml-0.5"
            title={`Expenses & Udhar Balance`}
          ></div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs pt-1 text-slate-600 dark:text-slate-400 font-medium">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Net Profit: <strong>{formatCurrency(totalNetProfit)}</strong> ({profitMarginPercent}%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
            <span>Expenses & Maintenance: <strong>{formatCurrency(totalExpenses)}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <span>Farmer Udhar Balance: <strong>{formatCurrency(totalUdharBalance)}</strong></span>
          </div>
        </div>
      </div>

      {/* Quick Action Operations Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100 flex items-center space-x-2 tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Operational Modules & Navigation</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            Real Database Sync Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          
          {/* Module 1: Tractors */}
          <Link to="/tractors" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-blue-200/40 dark:border-blue-800/40">
              <Tractor className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                <span>Tractors</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">{tractors.length} Units • Hourly</div>
            </div>
          </Link>

          {/* Module 2: Harvesters */}
          <Link to="/harvesters" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-amber-200/40 dark:border-amber-800/40">
              <Wheat className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-amber-600 transition-colors flex items-center justify-between">
                <span>Harvesters</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">{harvesters.length} Units • Paddy</div>
            </div>
          </Link>

          {/* Module 3: Farmers */}
          <Link to="/farmers" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-emerald-200/40 dark:border-emerald-800/40">
              <Users className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors flex items-center justify-between">
                <span>Farmer Udhar</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">{ledgers.length} Farmers</div>
            </div>
          </Link>

          {/* Module 4: Machine Billing */}
          <Link to="/machine-billing" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-purple-200/40 dark:border-purple-800/40">
              <Zap className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors flex items-center justify-between">
                <span>Machine Ledger</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Billing & Work Logs</div>
            </div>
          </Link>

          {/* Module 5: Fuel */}
          <Link to="/fuel-vouchers" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs hover:border-rose-500/60 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-rose-200/40 dark:border-rose-800/40">
              <Fuel className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-rose-600 transition-colors flex items-center justify-between">
                <span>Fuel Vouchers</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Diesel & Bunks</div>
            </div>
          </Link>

          {/* Module 6: Maintenance */}
          <Link to="/maintenance-jobs" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-indigo-200/40 dark:border-indigo-800/40">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                <span>Maintenance</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Job Cards & Spares</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Machinery Directory & Field Telematics Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Card Header with Search & Filters */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-emerald-600" />
              <span>Machinery Fleet Telematics & Field Status</span>
            </h3>
            <p className="text-xs text-slate-500">Live operational status, engine hours & service requirements</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterCategory === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All Fleet ({machines.length})
              </button>
              <button
                onClick={() => setFilterCategory('TRACTOR')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterCategory === 'TRACTOR'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tractors ({tractors.length})
              </button>
              <button
                onClick={() => setFilterCategory('HARVESTER')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterCategory === 'HARVESTER'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Harvesters ({harvesters.length})
              </button>
            </div>

            {/* Quick Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search machine..."
                value={fleetSearch}
                onChange={(e) => setFleetSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 h-9 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div>
          {isLoadingMachines ? (
            <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading fleet directory...</div>
          ) : filteredMachines.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No Machinery Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No machines match the selected filter query. Register your machinery or reset search filters.
              </p>
              <div className="flex justify-center space-x-3 pt-2">
                <Link to="/tractors"><Button size="sm">Add Tractor</Button></Link>
                <Link to="/harvesters"><Button size="sm" variant="outline">Add Harvester</Button></Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-5">Machine Code</th>
                    <th className="p-3.5">Make & Model</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Engine Hours</th>
                    <th className="p-3.5">Hourly / Acre Rates</th>
                    <th className="p-3.5">Service Health</th>
                    <th className="p-3.5 pr-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredMachines.map((m) => {
                    const isTractor = ['TRACTOR', 'ROTAVATOR', 'BALER', 'IMPLEMENT'].includes(m.machineType?.toUpperCase());
                    const serviceStatus = m.serviceStatus || 'OK';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 pl-5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {m.machineCode}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          {m.makeModel}
                          <div className="text-[10px] text-slate-400 font-mono font-normal">
                            {isTractor ? (m.registrationNumber || 'KA-37-T-8921') : 'N/A (Paddy Combine)'}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isTractor 
                              ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}>
                            {m.machineType}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold">
                          {m.engineHours} hrs
                        </td>
                        <td className="p-3.5 font-mono">
                          {formatCurrency(m.hourlyRateDefault)}/hr • {formatCurrency(m.acreRateDefault)}/acre
                        </td>
                        <td className="p-3.5">
                          {serviceStatus === 'OK' && (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/40">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>HEALTHY</span>
                            </span>
                          )}
                          {serviceStatus === 'SERVICE_DUE' && (
                            <span className="inline-flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/40">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>SERVICE DUE</span>
                            </span>
                          )}
                          {serviceStatus === 'OVERDUE' && (
                            <span className="inline-flex items-center space-x-1 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-200/40 animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>OVERDUE</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <Badge variant={m.status === 'AVAILABLE' ? 'success' : m.status === 'IN_USE' ? 'info' : 'warning'}>
                            {m.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

