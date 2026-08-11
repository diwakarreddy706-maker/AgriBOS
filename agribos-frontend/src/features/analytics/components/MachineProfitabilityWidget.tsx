import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, MachineProfitabilityItem } from '../api/analyticsApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { formatCurrency } from '../../../lib/utils';
import { TrendingUp, Fuel, Wrench, DollarSign } from 'lucide-react';

export const MachineProfitabilityWidget: React.FC = () => {
  const { data, isLoading } = useQuery<MachineProfitabilityItem[]>({
    queryKey: ['machineProfitability'],
    queryFn: () => analyticsApi.getMachineProfitability(),
  });

  if (isLoading) {
    return <div className="p-6 text-center text-xs text-slate-500">Loading machine profitability analytics...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Per-Machine Profitability & ROI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-xs text-slate-500">No machine financial records available yet.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Machine ROI & Operating Margin Analysis
          </h2>
          <p className="text-xs text-slate-500">Real-time revenue, cost, fuel efficiency, and net margin per machine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => {
          const isProfitable = item.netProfit >= 0;
          return (
            <Card key={item.machineId} className="border-l-4 border-l-agri-600 dark:border-l-agri-400">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.machineName}
                    </CardTitle>
                    <div className="text-[11px] font-mono text-agri-700 dark:text-agri-400">
                      {item.machineCode} • {item.machineType}
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${isProfitable ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'}`}>
                    {item.profitMarginPercent}% Margin
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-emerald-600" />
                      <span>Revenue</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <TrendingUp className={`w-3 h-3 ${isProfitable ? 'text-emerald-600' : 'text-red-600'}`} />
                      <span>Net Profit</span>
                    </div>
                    <div className={`font-mono font-bold ${isProfitable ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(item.netProfit)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 flex items-center space-x-1">
                      <Fuel className="w-3 h-3 text-amber-500" />
                      <span>Fuel Cost</span>
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(item.fuelCost)}</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 flex items-center space-x-1">
                      <Wrench className="w-3 h-3 text-blue-500" />
                      <span>Maintenance</span>
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(item.maintenanceCost)}</span>
                  </div>

                  {item.ownerPayout > 0 && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Owner Payout</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(item.ownerPayout)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400 block">Fuel Efficiency</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {item.fuelEfficiency} L / hr
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Work Productivity</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {item.workProductivity} Acres / hr
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
