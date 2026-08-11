import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { machineApi } from '../api/machineApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { MachineFormDialog } from '../components/MachineFormDialog';
import { Plus, Search, Gauge, Trash2, MapPin, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';

const formatTimeAgo = (dateStr?: string | null) => {
  if (!dateStr) return 'Location unavailable';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return 'Location unavailable';
  const diffSec = Math.floor((Date.now() - time) / 1000);
  if (diffSec < 60) return 'Last updated just now';
  if (diffSec < 3600) return `Last updated ${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `Last updated ${Math.floor(diffSec / 3600)} hours ago`;
  return `Last updated ${Math.floor(diffSec / 86400)} days ago`;
};

export const MachineListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'HARVESTER' | 'TRACTOR'>('ALL');
  const [page, setPage] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['machines', search, selectedType, page],
    queryFn: () => machineApi.getMachines(search, selectedType === 'ALL' ? undefined : selectedType, undefined, page, 10),
  });

  const { data: allMachinesData } = useQuery({
    queryKey: ['allMachinesSummary'],
    queryFn: () => machineApi.getMachines(undefined, undefined, undefined, 0, 100),
  });

  const createMutation = useMutation({
    mutationFn: machineApi.createMachine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: machineApi.deleteMachine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
  });

  const completeServiceMutation = useMutation({
    mutationFn: machineApi.completeService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
  });

  const allMachines = allMachinesData?.content || [];
  const harvesters = allMachines.filter(m => m.machineType === 'HARVESTER' || m.machineType === 'COMBINE_HARVESTER');
  const tractors = allMachines.filter(m => m.machineType === 'TRACTOR' || m.machineType === 'ROTAVATOR' || m.machineType === 'BALER' || m.machineType === 'IMPLEMENT');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Machine 360° Fleet Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Separated fleet directory: Combine Harvesters vs Tractors & Implements
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Machine</span>
        </Button>
      </div>

      {/* Fleet Separation Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => { setSelectedType('HARVESTER'); setPage(0); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${selectedType === 'HARVESTER' ? 'bg-amber-50/70 border-amber-500 dark:bg-amber-950/40 dark:border-amber-500 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">🌾</span>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Harvesting Machines</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Paddy & Grain Combine Harvesters</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{harvesters.length}</span>
              <span className="text-xs text-slate-400 block">Units</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-2 text-slate-600 dark:text-slate-400">
            <span>Billing: Acre / Hourly Rate</span>
            <span className="font-semibold text-emerald-600">Reg No: N/A (Field Harvester)</span>
          </div>
        </div>

        <div
          onClick={() => { setSelectedType('TRACTOR'); setPage(0); }}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${selectedType === 'TRACTOR' ? 'bg-blue-50/70 border-blue-500 dark:bg-blue-950/40 dark:border-blue-500 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">🚜</span>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Tractors & Implements</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Heavy Tractors, Rotavators & Balers</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tractors.length}</span>
              <span className="text-xs text-slate-400 block">Units</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-2 text-slate-600 dark:text-slate-400">
            <span>Billing: Hourly Rate</span>
            <span className="font-semibold text-blue-600">Reg No: RTO Registered</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
        <button
          onClick={() => { setSelectedType('ALL'); setPage(0); }}
          className={`pb-2 px-1 text-xs font-semibold border-b-2 transition-all ${selectedType === 'ALL' ? 'border-agri-600 text-agri-700 dark:text-agri-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          All Fleet ({allMachines.length})
        </button>
        <button
          onClick={() => { setSelectedType('HARVESTER'); setPage(0); }}
          className={`pb-2 px-1 text-xs font-semibold border-b-2 transition-all ${selectedType === 'HARVESTER' ? 'border-amber-600 text-amber-700 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          🌾 Harvesting Machines ({harvesters.length})
        </button>
        <button
          onClick={() => { setSelectedType('TRACTOR'); setPage(0); }}
          className={`pb-2 px-1 text-xs font-semibold border-b-2 transition-all ${selectedType === 'TRACTOR' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          🚜 Tractors ({tractors.length})
        </button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {selectedType === 'HARVESTER' ? 'Harvesting Machines Directory' : selectedType === 'TRACTOR' ? 'Tractors & Implements Directory' : 'Active Fleet Directory'}
            </CardTitle>
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input placeholder="Search registration, model, code..." className="pl-9 h-9 text-xs" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading machine fleet...</div>
          ) : !data?.content || data.content.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No machine records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Machine Code</th>
                    <th className="p-3">Type & Model</th>
                    <th className="p-3">Engine Hours</th>
                    <th className="p-3">Preventive Maintenance</th>
                    <th className="p-3">Telematics / GPS</th>
                    <th className="p-3">Default Rates</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.content.map((m) => {
                    const status = m.serviceStatus || 'OK';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-semibold text-agri-700 dark:text-agri-400">
                          {m.machineCode}
                          <div className="text-[10px] text-slate-400 font-sans font-normal">{m.registrationNumber}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{m.makeModel}</div>
                          <div className="text-[10px] text-slate-400">{m.machineType} ({m.ownershipType})</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1 font-mono font-medium">
                            <Gauge className="w-3.5 h-3.5 text-slate-400" />
                            <span>{m.engineHours} hrs</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Next Service: {m.nextServiceHours || 250} hrs</div>
                        </td>
                        <td className="p-3">
                          {status === 'OK' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>OK</span>
                            </span>
                          )}
                          {status === 'SERVICE_DUE' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              <AlertTriangle className="w-3 h-3" />
                              <span>SERVICE DUE</span>
                            </span>
                          )}
                          {status === 'OVERDUE' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                              <AlertCircle className="w-3 h-3" />
                              <span>OVERDUE</span>
                            </span>
                          )}
                          {status !== 'OK' && (
                            <button
                              onClick={() => completeServiceMutation.mutate(m.id)}
                              className="ml-2 text-[10px] text-blue-600 underline font-medium hover:text-blue-800"
                            >
                              Reset Service
                            </button>
                          )}
                        </td>
                        <td className="p-3">
                          {m.latitude !== null && m.latitude !== undefined && m.longitude !== null && m.longitude !== undefined ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                <MapPin className="w-3 h-3 text-blue-500" />
                                <span>{Number(m.latitude).toFixed(4)}, {Number(m.longitude).toFixed(4)}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Speed: {m.speed || 0} km/h • {formatTimeAgo(m.lastGpsUpdate)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">Location unavailable</div>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          <div>Hourly: {formatCurrency(m.hourlyRateDefault)}</div>
                          <div>Acre: {formatCurrency(m.acreRateDefault)}</div>
                        </td>
                        <td className="p-3"><Badge variant="info">{m.status}</Badge></td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(m.id)} className="text-red-600 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      <MachineFormDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} categoryMode={selectedType} onSubmit={async (newMachine) => { await createMutation.mutateAsync(newMachine); }} isLoading={createMutation.isPending} />
    </div>
  );
};
