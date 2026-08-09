import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { maintenanceApi } from '../api/maintenanceApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { Wrench } from 'lucide-react';
import { MaintenanceJob } from '../types/maintenance';

export const MaintenanceJobListPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: response, isLoading } = useQuery({
    queryKey: ['maintenanceJobs'],
    queryFn: () => maintenanceApi.getMaintenanceJobs(),
  });

  const jobs: MaintenanceJob[] = response?.data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.maintenanceJobs}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Workshop repair queue, technician allocations & preventive maintenance jobs
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
            <Wrench className="h-10 w-10 mx-auto text-slate-400" />
            <p className="font-medium">No open workshop maintenance jobs</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <th className="p-4">{t.jobNumber}</th>
                <th className="p-4">Machine ID</th>
                <th className="p-4">Job Type</th>
                <th className="p-4">Technician ID</th>
                <th className="p-4">{t.status}</th>
                <th className="p-4">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-gray-800 dark:text-gray-200">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-mono font-medium text-purple-600 dark:text-purple-400">{j.jobNumber}</td>
                  <td className="p-4">Machine #{j.machineId}</td>
                  <td className="p-4 text-xs font-semibold">{j.jobType}</td>
                  <td className="p-4">{j.assignedTechnicianId ? `Technician #${j.assignedTechnicianId}` : 'Unassigned'}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {j.status}
                    </span>
                  </td>
                  <td className="p-4 font-semibold">₹{j.totalCost?.toLocaleString() ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
