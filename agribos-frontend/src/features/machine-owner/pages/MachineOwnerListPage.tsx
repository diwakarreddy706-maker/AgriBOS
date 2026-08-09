import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { machineOwnerApi } from '../api/machineOwnerApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { MachineOwnerFormDialog } from '../components/MachineOwnerFormDialog';
import { Plus, Search, Building2, Phone, Trash2 } from 'lucide-react';

export const MachineOwnerListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['machine-owners', search, page],
    queryFn: () => machineOwnerApi.getOwners(search, page, 10),
  });

  const createMutation = useMutation({
    mutationFn: machineOwnerApi.createOwner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machine-owners'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: machineOwnerApi.deleteOwner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machine-owners'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Machine Owner 360° Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">Third-party rented harvester owners and settlement bank details</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Register Owner</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Machine Owners Register</CardTitle>
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input placeholder="Search name, code, phone..." className="pl-9 h-9 text-xs" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading machine owners...</div>
          ) : !data?.content || data.content.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No owner records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Owner Code</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Bank Payout Info</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.content.map((owner) => (
                    <tr key={owner.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-semibold text-agri-700 dark:text-agri-400">{owner.ownerCode}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{owner.fullName}</td>
                      <td className="p-3 text-slate-500">{owner.address}</td>
                      <td className="p-3"><div className="flex items-center space-x-1"><Phone className="w-3 h-3 text-slate-400" /><span>{owner.mobileNumber}</span></div></td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1 font-mono text-[11px]">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{owner.bankName ? `${owner.bankName} (${owner.accountNumber})` : owner.upiId || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-3"><Badge variant="success">{owner.status}</Badge></td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(owner.id)} className="text-red-600 hover:bg-red-50">
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

      <MachineOwnerFormDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSubmit={async (newOwner) => { await createMutation.mutateAsync(newOwner); }} isLoading={createMutation.isPending} />
    </div>
  );
};
