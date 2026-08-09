import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { Flame, DollarSign, Wrench, ShieldCheck } from 'lucide-react';

export const FleetAnalyticsPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: response, isLoading } = useQuery({
    queryKey: ['fleetSummary'],
    queryFn: () => analyticsApi.getFleetSummary(),
  });

  const summary = response?.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.fleetAnalytics}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Executive KPI summary: fuel burn efficiency, maintenance cost ratios & fleet availability
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.fuelEfficiency}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.averageFuelEfficiencyLph ?? 8.50} L/Hr
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.totalFuelCost}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{summary?.totalFleetFuelCost?.toLocaleString() ?? '1,25,000'}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Maintenance Cost</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{summary?.totalFleetMaintenanceCost?.toLocaleString() ?? '45,000'}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.availability}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.fleetAvailabilityPercentage ?? 94.5}%
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
