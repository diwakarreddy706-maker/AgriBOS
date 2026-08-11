import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
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
  Wallet
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguageStore();

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
  const totalNetProfit = profitability.reduce((sum, item) => sum + (item.netProfit || 0), 0);
  const totalUdharBalance = ledgers.reduce((sum, f) => sum + (f.totalBalanceDue || 0), 0);

  const availableTractors = tractors.filter(t => t.status === 'AVAILABLE').length;
  const availableHarvesters = harvesters.filter(h => h.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-emerald-900/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest">
                ERP GO-LIVE baseline
              </span>
              <span className="text-xs text-slate-400 font-mono">Alabanur / Sindhanur Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {t.welcome || 'Welcome to AgriBOS Platform'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl font-medium">
              <strong className="text-emerald-400">SRI BASAVESHWARA & CO.</strong> • Proprietor: Doddana Gowda. Live real-time operations, machinery fleet tracking, farmer credit ledger & profitability control.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/tractors">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md border border-blue-500/30">
                <Tractor className="w-3.5 h-3.5 mr-1.5" />
                Tractor Fleet
              </Button>
            </Link>
            <Link to="/harvesters">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md border border-amber-500/30">
                <Wheat className="w-3.5 h-3.5 mr-1.5" />
                Harvesting Fleet
              </Button>
            </Link>
            <Link to="/bookings">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md border border-emerald-500/30">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                + New Booking
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Executive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tractor Fleet */}
        <Card className="border-l-4 border-l-blue-600 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">Tractor Fleet</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                <Tractor className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">{tractors.length}</div>
              <span className="text-[11px] font-semibold text-emerald-600">{availableTractors} Available</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Company Owned • Hourly Work</p>
          </CardContent>
        </Card>

        {/* Card 2: Combine Harvesters */}
        <Card className="border-l-4 border-l-amber-600 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider">Harvesting Fleet</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                <Wheat className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">{harvesters.length}</div>
              <span className="text-[11px] font-semibold text-emerald-600">{availableHarvesters} Available</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Paddy Harvesters • Acre Rate</p>
          </CardContent>
        </Card>

        {/* Card 3: Farmer Credit Ledger (Udhar) */}
        <Card className="border-l-4 border-l-rose-600 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-rose-600 uppercase tracking-wider">Farmer Udhar Ledger</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                {formatCurrency(totalUdharBalance)}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{ledgers.length} Farmers Registered</p>
          </CardContent>
        </Card>

        {/* Card 4: Net Operating Profit */}
        <Card className="border-l-4 border-l-emerald-600 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">Net Operating Profit</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalNetProfit)}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Revenue: {formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Operations Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Operational Modules & Navigation</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">100% Real SQLite Persistence</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Module 1: Tractors */}
          <Link to="/tractors" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tractor className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600">Tractors & Implements</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{tractors.length} Units • RTO Reg</div>
            </div>
          </Link>

          {/* Module 2: Harvesters */}
          <Link to="/harvesters" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wheat className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-amber-600">Combine Harvesters</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{harvesters.length} Units • Paddy Acres</div>
            </div>
          </Link>

          {/* Module 3: Farmers */}
          <Link to="/farmers" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-600">Farmers (Udhar)</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{ledgers.length} Registered</div>
            </div>
          </Link>

          {/* Module 4: Bookings & Dispatches */}
          <Link to="/bookings" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-purple-600">Bookings & Dispatch</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{opsMetrics?.todaysBookings || 0} Bookings Today</div>
            </div>
          </Link>

          {/* Module 5: Fuel */}
          <Link to="/fuel-vouchers" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-rose-500/50 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Fuel className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-rose-600">Fuel & Diesel Log</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Bunk Receipts & Refuels</div>
            </div>
          </Link>

          {/* Module 6: Maintenance */}
          <Link to="/maintenance-jobs" className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600">Maintenance Jobs</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Job Cards & Spare Parts</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Machinery Directory & Telematics Status Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-emerald-600" />
              <span>Machinery Fleet Telematics & Field Status</span>
            </CardTitle>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Available</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                <span>In Use</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                <span>Service Due</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingMachines ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading fleet directory...</div>
          ) : machines.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Machinery Registered Yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Register your first Tractor or Combine Harvester to begin tracking dispatches, engine hours, and field work.
              </p>
              <div className="flex justify-center space-x-3 pt-2">
                <Link to="/tractors"><Button size="sm">Add Tractor</Button></Link>
                <Link to="/harvesters"><Button size="sm" variant="outline">Add Harvester</Button></Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Machine Code</th>
                    <th className="p-3">Make & Model</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Engine Hours</th>
                    <th className="p-3">Rates</th>
                    <th className="p-3">Service Status</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {machines.slice(0, 8).map((m) => {
                    const isTractor = ['TRACTOR', 'ROTAVATOR', 'BALER', 'IMPLEMENT'].includes(m.machineType?.toUpperCase());
                    const serviceStatus = m.serviceStatus || 'OK';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                          {m.machineCode}
                        </td>
                        <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                          {m.makeModel}
                          <div className="text-[10px] text-slate-400 font-mono">
                            {isTractor ? (m.registrationNumber || 'RTO Pending') : 'N/A (Field Harvester)'}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isTractor ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {m.machineType}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {m.engineHours} hrs
                        </td>
                        <td className="p-3 font-mono">
                          {formatCurrency(m.hourlyRateDefault)}/hr • {formatCurrency(m.acreRateDefault)}/acre
                        </td>
                        <td className="p-3">
                          {serviceStatus === 'OK' && (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>OK</span>
                            </span>
                          )}
                          {serviceStatus === 'SERVICE_DUE' && (
                            <span className="inline-flex items-center space-x-1 text-amber-600 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>DUE</span>
                            </span>
                          )}
                          {serviceStatus === 'OVERDUE' && (
                            <span className="inline-flex items-center space-x-1 text-red-600 font-semibold animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>OVERDUE</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3">
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
        </CardContent>
      </Card>
    </div>
  );
};
