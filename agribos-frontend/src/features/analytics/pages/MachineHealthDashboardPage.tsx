import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { MachineHealthScore } from '../types/analytics';

export const MachineHealthDashboardPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: response, isLoading } = useQuery({
    queryKey: ['machineHealthScores'],
    queryFn: () => analyticsApi.getAllHealthScores(),
  });

  const healthScores: MachineHealthScore[] = response?.data || [
    { machineId: 101, healthScore: 95, healthStatus: 'EXCELLENT', totalBreakdownsCount: 0, mtbfHours: 140, mttrHours: 2.5, lastInspectionDate: '2026-07-20', nextServiceDueHours: 210, servicingCompliancePercentage: 98 },
    { machineId: 102, healthScore: 78, healthStatus: 'GOOD', totalBreakdownsCount: 1, mtbfHours: 95, mttrHours: 4.0, lastInspectionDate: '2026-07-15', nextServiceDueHours: 180, servicingCompliancePercentage: 92 },
    { machineId: 103, healthScore: 55, healthStatus: 'FAIR', totalBreakdownsCount: 3, mtbfHours: 45, mttrHours: 7.2, lastInspectionDate: '2026-07-10', nextServiceDueHours: 40, servicingCompliancePercentage: 85 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.machineHealth}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time machine health intelligence scores (0-100), MTBF, MTTR, and servicing compliance
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {healthScores.map((h) => (
            <div key={h.machineId} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                <span className="font-bold text-lg text-gray-900 dark:text-white">Machine #{h.machineId}</span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                  h.healthScore >= 90 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                  h.healthScore >= 75 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                }`}>
                  {h.healthStatus} ({h.healthScore}/100)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">{t.mtbf}</p>
                  <p className="font-bold text-sm text-gray-900 dark:text-white mt-1">{h.mtbfHours} Hrs</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">{t.mttr}</p>
                  <p className="font-bold text-sm text-gray-900 dark:text-white mt-1">{h.mttrHours} Hrs</p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Breakdowns:</span>
                  <span className="font-semibold">{h.totalBreakdownsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Due Threshold:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{h.nextServiceDueHours} Hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Compliance:</span>
                  <span className="font-semibold">{h.servicingCompliancePercentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
