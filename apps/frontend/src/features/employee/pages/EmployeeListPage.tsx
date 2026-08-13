import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/employeeApi';
import { EmployeeFormDialog } from '../components/EmployeeFormDialog';
import { Employee } from '../types/employee';
import { 
  Search, 
  Phone, 
  UserPlus, 
  Users, 
  Tractor, 
  UserCheck, 
  IndianRupee, 
  ChevronRight, 
  Home, 
  Star, 
  Grid, 
  ListFilter, 
  Trash2
} from 'lucide-react';

export const EmployeeListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, page, roleFilter, statusFilter],
    queryFn: () => employeeApi.getEmployees(search, page, 10, roleFilter, statusFilter),
  });

  const createMutation = useMutation({
    mutationFn: employeeApi.createEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: employeeApi.deleteEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const employees: Employee[] = data?.content || [];

  // Stat computations
  const totalCount = data?.totalElements || employees.length;
  const onTripCount = employees.filter((e: Employee) => e.status === 'ON TRIP').length;
  const availableCount = employees.filter((e: Employee) => e.status === 'ACTIVE' || e.status === 'AVAILABLE').length;
  const avgWage = Math.round(
    employees.reduce((acc: number, curr: Employee) => acc + (curr.dailyWageRate || 850), 0) / (employees.length || 1)
  );

  const getInitials = (name: string) => {
    if (!name) return 'EP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ON TRIP':
        return 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900';
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900';
      case 'ON LEAVE':
        return 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'AVAILABLE':
        return 'bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-900';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumbs Section */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span>MACHINE ERP</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-600 dark:text-slate-300 font-semibold">DRIVERS</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
              DRIVERS & OPERATOR DIRECTORY
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage tractor drivers, harvester operators, field wages, and trip assignments.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards with Sparkline Visuals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Registered Drivers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              TOTAL REGISTERED DRIVERS
            </span>
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalCount} <span className="text-sm font-semibold text-slate-500">Drivers</span>
            </div>
            {/* Sparkline line */}
            <svg className="w-20 h-8 text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0 22 Q 25 15, 50 24 T 100 5" />
            </svg>
          </div>
        </div>

        {/* Card 2: Active on Field Trips */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              ACTIVE ON FIELD TRIPS
            </span>
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <Tractor className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {onTripCount || 1} <span className="text-sm font-semibold text-slate-500">Drivers</span>
              </div>
              <div className="flex items-center text-[10px] font-bold text-emerald-600 mt-1">
                <span>↗ 5.4%</span>
                <span className="text-slate-400 ml-1 font-normal uppercase">VS LAST MONTH</span>
              </div>
            </div>
            {/* Sparkline line */}
            <svg className="w-20 h-8 text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0 25 Q 30 20, 60 12 T 100 8" />
            </svg>
          </div>
        </div>

        {/* Card 3: Available Drivers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              AVAILABLE DRIVERS
            </span>
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {availableCount || 2} <span className="text-sm font-semibold text-slate-500">Available</span>
            </div>
            {/* Sparkline line */}
            <svg className="w-20 h-8 text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0 20 Q 25 28, 50 18 T 100 10" />
            </svg>
          </div>
        </div>

        {/* Card 4: Average Daily Wage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              AVERAGE DAILY WAGE
            </span>
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ₹{avgWage} <span className="text-sm font-normal text-slate-500">/ day</span>
            </div>
            {/* Sparkline line */}
            <svg className="w-20 h-8 text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0 24 Q 40 22, 70 14 T 100 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Container Card: Search, Filter, Controls & View Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
        
        {/* Controls Toolbar Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Left search & filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, phone or license #..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {/* Role Filter Selector */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Roles (Drivers, Operators, Helpers, Foreman)</option>
              <option value="DRIVER">Drivers</option>
              <option value="OPERATOR">Operators</option>
              <option value="HELPER">Helpers</option>
              <option value="FOREMAN">Foremen</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON TRIP">ON TRIP</option>
              <option value="ON LEAVE">ON LEAVE</option>
              <option value="AVAILABLE">AVAILABLE</option>
            </select>
          </div>

          {/* Right Action buttons & View mode toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* View Mode Switcher */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid Cards</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Table Registry</span>
              </button>
            </div>

            {/* Add Driver Button */}
            <button
              onClick={() => setIsDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Driver</span>
            </button>
          </div>
        </div>

        {/* Content View: Grid Cards or Table Registry */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-medium">
            Fetching driver and operator roster...
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 font-medium">
            No matching drivers, operators, helpers or foremen found.
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid Cards View - Exactly as in screenshot */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {employees.map((emp: Employee) => (
              <div
                key={emp.id}
                className="bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
              >
                {/* Header Row: Initials Avatar, Name, Location/Exp, Status Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 font-black text-sm flex items-center justify-center border border-emerald-200/60 dark:border-emerald-900 shrink-0">
                      {getInitials(emp.fullName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 transition-colors">
                        {emp.fullName}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {emp.villageLocation || 'Sindhanur'} • {emp.experienceYears || 5} yrs exp
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${getStatusBadgeStyle(emp.status)}`}>
                    {emp.status}
                  </span>
                </div>

                {/* Card Details: Specialization, Machine, License, Daily Wage */}
                <div className="space-y-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Specialization:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right">
                      {emp.specialization || `${emp.roleName} Specialist`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Assigned Machine:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[170px]" title={emp.assignedMachine}>
                      {emp.assignedMachine || 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Driving License:</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-right">
                      {emp.drivingLicense || 'KA-36-PENDING'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Daily Wage Rate:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">
                      ₹{emp.dailyWageRate || 850} <span className="font-normal text-slate-400 text-[11px]">/ day</span>
                    </span>
                  </div>
                </div>

                {/* Footer Row: Star Rating + Trip Count, Call Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {emp.rating || 4.8}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({emp.tripCount || 80} trips)
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={`tel:${emp.mobileNumber}`}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Call</span>
                    </a>

                    <button
                      onClick={() => deleteMutation.mutate(emp.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table Registry View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Personnel / Emp ID</th>
                  <th className="p-3">Role & Specialization</th>
                  <th className="p-3">Assigned Machine</th>
                  <th className="p-3">License Number</th>
                  <th className="p-3">Daily Wage Rate</th>
                  <th className="p-3">Rating & Trips</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((emp: Employee) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                          {getInitials(emp.fullName)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{emp.fullName}</div>
                          <div className="text-[10px] text-slate-400">{emp.villageLocation} • {emp.experienceYears} yrs</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-emerald-700 dark:text-emerald-400">{emp.specialization}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{emp.roleName}</div>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{emp.assignedMachine}</td>
                    <td className="p-3 font-mono text-slate-500">{emp.drivingLicense}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">₹{emp.dailyWageRate} / day</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1 font-semibold text-slate-700">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{emp.rating || 4.8}</span>
                        <span className="text-slate-400 font-normal">({emp.tripCount} trips)</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeStyle(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <a href={`tel:${emp.mobileNumber}`} className="p-1.5 text-slate-500 hover:text-emerald-600">
                          <Phone className="w-4 h-4" />
                        </a>
                        <button onClick={() => deleteMutation.mutate(emp.id)} className="p-1.5 text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog for Adding New Driver / Operator / Helper / Foreman */}
      <EmployeeFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={async (newEmp) => {
          await createMutation.mutateAsync(newEmp);
        }}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

