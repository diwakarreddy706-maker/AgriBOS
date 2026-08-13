import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { operationsApi } from '../api/operationsApi';
import { Card } from '../../../components/ui/Card';
import { Calendar, Truck, UserCheck, CheckCircle2, Clock, Activity } from 'lucide-react';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';

export const OperationsDashboardPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['operationsDashboard'],
    queryFn: operationsApi.getDashboardMetrics,
  });

  const cards = [
    { title: t.todaysBookings, value: metrics?.todaysBookings ?? 0, icon: Calendar, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { title: t.machinesWorking, value: metrics?.machinesWorking ?? 0, icon: Truck, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    { title: t.machinesAvailable, value: metrics?.machinesAvailable ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { title: t.operatorsWorking, value: metrics?.operatorsWorking ?? 0, icon: UserCheck, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { title: t.dispatchesToday, value: metrics?.dispatchesToday ?? 0, icon: Activity, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
    { title: t.jobsInProgress, value: metrics?.jobsInProgress ?? 0, icon: Clock, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    { title: t.completedJobs, value: metrics?.completedJobs ?? 0, icon: CheckCircle2, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.operations} {t.dashboard}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Real-time field operations, machine dispatches, and work logs</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading operations metrics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Card key={idx} className="p-5 flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OperationsDashboardPage;
