import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { maintenanceApi } from '../api/maintenanceApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { AlertTriangle, Plus } from 'lucide-react';
import { ReportBreakdownDialog } from '../components/ReportBreakdownDialog';
import { Breakdown } from '../types/maintenance';

export const BreakdownListPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ['breakdowns'],
    queryFn: () => maintenanceApi.getBreakdowns(),
  });

  const breakdowns: Breakdown[] = response?.data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.breakdowns}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Log field breakdowns and monitor emergency workshop repair dispatches
          </p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>{t.reportBreakdown}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : breakdowns.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
            <AlertTriangle className="h-10 w-10 mx-auto text-slate-400" />
            <p className="font-medium">No active breakdown incidents reported</p>
            <p className="text-xs">Click "{t.reportBreakdown}" to log a new field equipment failure</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <th className="p-4">{t.breakdownNumber}</th>
                <th className="p-4">Machine ID</th>
                <th className="p-4">Location</th>
                <th className="p-4">{t.severity}</th>
                <th className="p-4">{t.category}</th>
                <th className="p-4">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-gray-800 dark:text-gray-200">
              {breakdowns.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-mono font-medium text-red-600 dark:text-red-400">{b.breakdownNumber}</td>
                  <td className="p-4">Machine #{b.machineId}</td>
                  <td className="p-4">{b.locationName}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      b.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>
                      {b.severity}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-semibold">{b.category}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ReportBreakdownDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
};
