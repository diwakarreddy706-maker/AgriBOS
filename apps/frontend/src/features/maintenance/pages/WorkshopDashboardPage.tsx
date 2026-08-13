import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { maintenanceApi } from '../api/maintenanceApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { AlertTriangle, Wrench, PackageSearch, Clock, CheckCircle2, Calendar } from 'lucide-react';

export const WorkshopDashboardPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: response, isLoading } = useQuery({
    queryKey: ['workshopDashboard'],
    queryFn: () => maintenanceApi.getDashboardMetrics(),
  });

  const metrics = response?.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.workshopDashboard}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time fleet maintenance, field breakdown response & workshop repair queue
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.activeBreakdowns}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.activeBreakdowns ?? 0}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.machinesUnderMaintenance}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.machinesUnderMaintenance ?? 0}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <PackageSearch className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.jobsWaitingParts}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.jobsWaitingParts ?? 0}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Jobs In Progress</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.jobsInProgress ?? 0}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed Today</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.completedToday ?? 0}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.serviceDue}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.serviceDue ?? 0}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
