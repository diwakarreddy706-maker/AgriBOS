import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fuelApi } from '../api/fuelApi';
import { FuelLogTicket, FuelLogCreatePayload } from '../types/fuel';
import { 
  Plus, 
  Fuel, 
  ListFilter, 
  ArrowLeft, 
  Search, 
  Download, 
  SlidersHorizontal, 
  TrendingUp, 
  Tractor, 
  User, 
  X,
  PackageCheck
} from 'lucide-react';

export const FuelVoucherListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'dashboard' | 'registry'>('dashboard');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Form State for Log Fuel Purchase
  const [formData, setFormData] = useState({
    machineId: 101,
    machineName: 'Kubota MU5502 (KA-36 M 4412)',
    operatorId: 201,
    operatorName: 'Ramesh Gowda (Harvester)',
    logDateTime: '2026-07-29T03:38',
    hourMeter: 1420,
    fuelType: 'Diesel' as 'Diesel' | 'Petrol' | 'AdBlue / DEF',
    quantityLiters: 50,
    pricePerLiter: 92.50,
    vendorStation: 'Shell Station Sindhanur',
    remarks: ''
  });

  // Queries
  const { data: metricsResponse } = useQuery({
    queryKey: ['fuelDashboardMetrics'],
    queryFn: () => fuelApi.getDashboardMetrics(),
  });

  const { data: fuelLogsResponse, isLoading: isLogsLoading } = useQuery({
    queryKey: ['fuelLogsRegistry'],
    queryFn: () => fuelApi.getFuelLogs(),
  });

  const metrics = metricsResponse?.data;
  const fuelLogs: FuelLogTicket[] = fuelLogsResponse?.data?.content || [];

  // Mutation
  const logFuelMutation = useMutation({
    mutationFn: (payload: FuelLogCreatePayload) => fuelApi.logFuel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelLogsRegistry'] });
      queryClient.invalidateQueries({ queryKey: ['fuelDashboardMetrics'] });
      setIsLogModalOpen(false);
    }
  });

  const totalPurchaseCost = (formData.quantityLiters || 0) * (formData.pricePerLiter || 0);

  const handleSubmitFuelLog = (e: React.FormEvent) => {
    e.preventDefault();
    logFuelMutation.mutate({
      machineId: Number(formData.machineId),
      machineName: formData.machineName,
      operatorId: Number(formData.operatorId),
      operatorName: formData.operatorName,
      logDateTime: formData.logDateTime,
      hourMeter: Number(formData.hourMeter),
      fuelType: formData.fuelType,
      quantityLiters: Number(formData.quantityLiters),
      pricePerLiter: Number(formData.pricePerLiter),
      vendorStation: formData.vendorStation,
      remarks: formData.remarks
    });
  };

  const filteredLogs = fuelLogs.filter(log => {
    const q = (searchQuery || filterQuery).toLowerCase();
    if (!q) return true;
    return (
      log.ticketNumber.toLowerCase().includes(q) ||
      log.machineName.toLowerCase().includes(q) ||
      log.operatorName.toLowerCase().includes(q) ||
      log.vendorStation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 font-sans antialiased text-slate-800 dark:text-slate-100">

      {/* ========================================================================= */}
      {/* VIEW 1: DASHBOARD VIEW                                                    */}
      {/* ========================================================================= */}
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              FUEL TRACKING DASHBOARD
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Manage fuel transaction inputs, audit vendor costs, and track average mileage and hour-meters.
            </p>
          </div>

          {/* Action Header Card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log Fuel Purchase</span>
            </button>

            <button
              onClick={() => setActiveView('registry')}
              className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold px-5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <ListFilter className="w-4 h-4 text-slate-500" />
              <span>Fuel Log Registry</span>
            </button>
          </div>

          {/* 3 Summary KPI Cards with Green Sparklines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Fuel Consumed Today */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    FUEL CONSUMED TODAY
                  </p>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {metrics?.totalLitersToday ? `${metrics.totalLitersToday} L` : '...'}
                  </h2>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Fuel className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-end justify-between">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  +12.4% vs daily avg
                </span>
                {/* Green Sparkline SVG */}
                <svg className="w-24 h-10 text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M0 25 L20 20 L40 24 L60 10 L80 16 L100 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Card 2: Fuel Cost (This Month) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    FUEL COST (THIS MONTH)
                  </p>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {metrics?.totalFuelCostMonth ? `₹${metrics.totalFuelCostMonth.toLocaleString()}` : '...'}
                  </h2>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-end justify-between">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  +8.2% vs last month
                </span>
                {/* Green Sparkline SVG */}
                <svg className="w-24 h-10 text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M0 22 L20 25 L40 15 L60 18 L80 8 L100 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Card 3: Avg Fuel Consumption */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    AVG FUEL CONSUMPTION
                  </p>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {metrics?.avgFuelConsumption ? `${metrics.avgFuelConsumption} L/hr` : '...'}
                  </h2>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Tractor className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-end justify-between">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  -2.1% efficiency optimal
                </span>
                {/* Green Sparkline SVG */}
                <svg className="w-24 h-10 text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M0 20 L20 12 L40 22 L60 14 L80 18 L100 8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* 2 Analytics Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Panel 1: Spendings by Machine */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <Tractor className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                  FUEL SPENDINGS BY MACHINE
                </h3>
              </div>

              <div className="space-y-4">
                {metrics?.spendingsByMachine?.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{item.machineName}</span>
                      <span className="text-slate-900 dark:text-white font-mono">₹{item.totalSpent.toLocaleString()} ({item.totalLiters} L)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${Math.min(100, (item.totalSpent / 15000) * 100)}%` }} 
                      />
                    </div>
                  </div>
                )) || (
                  <p className="text-xs font-semibold text-slate-400 py-6 text-center">Loading metrics...</p>
                )}
              </div>
            </div>

            {/* Panel 2: Spendings by Operator */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <User className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                  FUEL SPENDINGS BY OPERATOR
                </h3>
              </div>

              <div className="space-y-4">
                {metrics?.spendingsByOperator?.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{item.operatorName}</span>
                      <span className="text-slate-900 dark:text-white font-mono">₹{item.totalSpent.toLocaleString()} ({item.totalLiters} L)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${Math.min(100, (item.totalSpent / 15000) * 100)}%` }} 
                      />
                    </div>
                  </div>
                )) || (
                  <p className="text-xs font-semibold text-slate-400 py-6 text-center">Loading metrics...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: FUEL LOGS REGISTRY VIEW                                          */}
      {/* ========================================================================= */}
      {activeView === 'registry' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              FUEL LOGS REGISTRY
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Audit fuel bills, verify meter hours, and trace machine consumption lists.
            </p>
          </div>

          {/* Top Control Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1">
              <button
                onClick={() => setActiveView('dashboard')}
                className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ticket no, machine name, operator, vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Fuel Purchase</span>
            </button>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter fuel tickets..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-xs border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Columns</span>
              </button>

              <button className="flex items-center space-x-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-xs border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 transition-colors">
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export to CSV</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {isLogsLoading ? (
              <div className="p-12 text-center text-slate-400 font-medium">Loading fuel tickets...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <PackageCheck className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                  NO RECORDS FOUND.
                </h3>
                <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                  There are no active records in this data view. Add a new registry to start tracking.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="p-4 w-10">
                        <input type="checkbox" className="rounded border-slate-300" />
                      </th>
                      <th className="p-4">ENTRY NUMBER ↑↓</th>
                      <th className="p-4">LOG DATE & TIME ↑↓</th>
                      <th className="p-4">MACHINE UNIT ↑↓</th>
                      <th className="p-4">OPERATOR ↑↓</th>
                      <th className="p-4">LITRES / PRICE ↑↓</th>
                      <th className="p-4">TOTAL COST ↑↓</th>
                      <th className="p-4">HOUR METER ↑↓</th>
                      <th className="p-4">VENDOR ↑↓</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <input type="checkbox" className="rounded border-slate-300" />
                        </td>
                        <td className="p-4 font-extrabold text-emerald-600 font-mono">
                          {log.ticketNumber}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {new Date(log.logDateTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {log.machineName}
                        </td>
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                          {log.operatorName}
                        </td>
                        <td className="p-4 font-mono font-bold">
                          {log.quantityLiters} L <span className="text-slate-400 font-normal">@ ₹{log.pricePerLiter}/L</span>
                        </td>
                        <td className="p-4 font-mono font-black text-slate-900 dark:text-white">
                          ₹{log.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                          {log.hourMeter} hrs
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {log.vendorStation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LOG FUEL PURCHASE MODAL (Matching Screenshots 2 & 3)                      */}
      {/* ========================================================================= */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  LOG FUEL PURCHASE
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Log fuel purchases, record price per liter, capture vendor invoices, and update machine hour meters.
                </p>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitFuelLog} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* SECTION 1: TICKET DETAILS */}
              <div className="bg-slate-50/60 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                  TICKET DETAILS
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Machinery Unit */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      MACHINERY UNIT *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.machineId}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const name = val === 101 ? 'Kubota MU5502 (KA-36 M 4412)' : val === 102 ? 'John Deere 5310 (KA-36 M 8821)' : 'Class Crop Tiger 37';
                          setFormData({ ...formData, machineId: val, machineName: name });
                        }}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value={101}>Kubota MU5502 (KA-36 M 4412)</option>
                        <option value={102}>John Deere 5310 (KA-36 M 8821)</option>
                        <option value={103}>Class Crop Tiger 37 (Harvester)</option>
                        <option value={104}>New Holland 3630 (Tractor)</option>
                      </select>
                    </div>
                  </div>

                  {/* Driver / Operator */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      DRIVER / OPERATOR *
                    </label>
                    <select
                      value={formData.operatorId}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const name = val === 201 ? 'Ramesh Gowda (Harvester)' : val === 202 ? 'Basavaraj H (Driver)' : 'Doddanna G (Owner)';
                        setFormData({ ...formData, operatorId: val, operatorName: name });
                      }}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value={201}>Ramesh Gowda (Harvester Operator)</option>
                      <option value={202}>Basavaraj H (Tractor Driver)</option>
                      <option value={203}>Doddanna G (Owner / Supervisor)</option>
                      <option value={204}>Suresh Kumar (Senior Driver)</option>
                    </select>
                  </div>

                  {/* Log Date & Time */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      LOG DATE & TIME *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.logDateTime}
                      onChange={(e) => setFormData({ ...formData, logDateTime: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* Hour Meter Reading */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      HOUR METER READING (HRS)
                    </label>
                    <input
                      type="number"
                      value={formData.hourMeter}
                      onChange={(e) => setFormData({ ...formData, hourMeter: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                      placeholder="1420"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: FUEL COSTS & QUANTITIES */}
              <div className="bg-slate-50/60 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                  FUEL COSTS & QUANTITIES
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Fuel Type */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      FUEL TYPE *
                    </label>
                    <select
                      value={formData.fuelType}
                      onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Diesel">Diesel</option>
                      <option value="Petrol">Petrol</option>
                      <option value="AdBlue / DEF">AdBlue / DEF</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      QUANTITY (LITERS) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.quantityLiters}
                      onChange={(e) => setFormData({ ...formData, quantityLiters: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                      required
                    />
                  </div>

                  {/* Price Per Liter */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      PRICE PER LITER (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pricePerLiter}
                      onChange={(e) => setFormData({ ...formData, pricePerLiter: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Total Purchase Cost Banner */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 flex justify-between items-center mt-2">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Total Purchase Cost
                  </span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{totalPurchaseCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* SECTION 3: VENDOR & REMARKS */}
              <div className="bg-slate-50/60 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                  VENDOR & REMARKS
                </h3>

                <div className="space-y-4">
                  {/* Fuel Pump Vendor */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      FUEL PUMP / STATION VENDOR
                    </label>
                    <input
                      type="text"
                      value={formData.vendorStation}
                      onChange={(e) => setFormData({ ...formData, vendorStation: e.target.value })}
                      placeholder="e.g. Shell Station Mandya"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      REMARKS / NOTES
                    </label>
                    <textarea
                      rows={3}
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Add invoice numbers, coupon codes..."
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logFuelMutation.isPending}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center space-x-2"
                >
                  {logFuelMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <span>Log Fuel Purchase</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
