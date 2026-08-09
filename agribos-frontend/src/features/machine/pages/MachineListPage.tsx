import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { machineApi } from '../api/machineApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { MachineFormDialog } from '../components/MachineFormDialog';
import { Plus, Search, Gauge, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';

export const MachineListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['machines', search, page],
    queryFn: () => machineApi.getMachines(search, undefined, undefined, page, 10),
  });

  const createMutation = useMutation({
    mutationFn: machineApi.createMachine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: machineApi.deleteMachine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Machine 360° Fleet Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">Company owned harvesters vs seasonal rented machine fleet</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Machine</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Active Harvester & Fleet Directory</CardTitle>
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
                    <th className="p-3">Registration No</th>
                    <th className="p-3">Type & Model</th>
                    <th className="p-3">Ownership</th>
                    <th className="p-3">Engine Hours</th>
                    <th className="p-3">Default Rates</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.content.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-semibold text-agri-700 dark:text-agri-400">{m.machineCode}</td>
                      <td className="p-3 font-mono">
                        {m.machineType === 'HARVESTER' || m.registrationNumber === 'N/A' ? (
                          <span className="text-slate-400 dark:text-slate-500 font-sans text-[11px] italic">
                            N/A (Harvester)
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {m.registrationNumber}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{m.makeModel}</div>
                        <div className="text-[10px] text-slate-400">{m.machineType}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant={m.ownershipType === 'OWNED' ? 'success' : 'warning'}>
                          {m.ownershipType} {m.ownerName ? `(${m.ownerName})` : ''}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1 font-mono">
                          <Gauge className="w-3 h-3 text-slate-400" />
                          <span>{m.engineHours} hrs</span>
                        </div>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <MachineFormDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSubmit={async (newMachine) => { await createMutation.mutateAsync(newMachine); }} isLoading={createMutation.isPending} />
    </div>
  );
};
