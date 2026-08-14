import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { machineApi } from '../api/machineApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { MachineFormDialog } from '../components/MachineFormDialog';
import { Plus, Search, Gauge, Trash2, MapPin, CheckCircle2, AlertTriangle, AlertCircle, Wheat } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { useLanguageStore } from '../../../store/useLanguageStore';

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

export const HarvesterListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useLanguageStore();

  const { data, isLoading } = useQuery({
    queryKey: ['harvesters', search, page],
    queryFn: () => machineApi.getMachines(search, 'HARVESTER', undefined, page, 10),
  });

  const createMutation = useMutation({
    mutationFn: machineApi.createMachine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvesters'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: machineApi.deleteMachine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['harvesters'] }),
  });

  const completeServiceMutation = useMutation({
    mutationFn: machineApi.completeService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['harvesters'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Wheat className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t.harvestingMachines || 'Harvesting Machines Fleet'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated Combine Paddy & Grain Harvester fleet, operator assignments, harvested acres, crop rates & service tracking
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4" />
          <span>Add Harvester</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">Combine Harvester Directory & Field Status</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search harvester model, code, operator..."
                className="pl-9 h-9 text-xs w-full"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading harvesting machines...</div>
          ) : !data?.content || data.content.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No harvesting machine records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Harvester Code</th>
                    <th className="p-3">Make & Model</th>
                    <th className="p-3">Harvesting Hours</th>
                    <th className="p-3">Preventive Service</th>
                    <th className="p-3">Telematics / Field GPS</th>
                    <th className="p-3">Acre / Hourly Rate</th>
                    <th className="p-3">Field Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.content.map((m) => {
                    const status = m.serviceStatus || 'OK';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-semibold text-amber-700 dark:text-amber-400">
                          {m.machineCode}
                          <div className="text-[10px] text-slate-400 font-sans font-normal">{m.ownershipType}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{m.makeModel}</div>
                          <div className="text-[10px] text-emerald-600 font-semibold">Reg No: N/A (Field Harvester)</div>
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
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              <span>OVERDUE</span>
                            </span>
                          )}
                          {(status === 'SERVICE_DUE' || status === 'OVERDUE') && (
                            <button
                              onClick={() => completeServiceMutation.mutate(m.id)}
                              className="ml-2 text-[10px] font-bold text-amber-600 underline hover:text-amber-800"
                            >
                              Complete Service
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-[11px]">
                          {m.latitude && m.longitude ? (
                            <div>
                              <div className="flex items-center space-x-1 font-mono font-medium text-slate-700 dark:text-slate-300">
                                <MapPin className="w-3 h-3 text-red-500" />
                                <span>{m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {formatTimeAgo(m.lastGpsUpdate)} ({m.speed || 0} km/h)
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Location unavailable</span>
                          )}
                        </td>
                        <td className="p-3 font-mono">
                          <div>{formatCurrency(m.acreRateDefault)}/acre</div>
                          <div className="text-[10px] text-slate-400">{formatCurrency(m.hourlyRateDefault)}/hr</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              m.status === 'AVAILABLE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : m.status === 'IN_USE'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete harvester ${m.machineCode}?`)) {
                                deleteMutation.mutate(m.id);
                              }
                            }}
                            className="text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                          >
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

      <MachineFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        categoryMode="HARVESTER"
        onSubmit={async (formData) => {
          await createMutation.mutateAsync({ ...formData, machineType: formData.machineType || 'HARVESTER' });
        }}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};
