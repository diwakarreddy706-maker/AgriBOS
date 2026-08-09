import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { glApi } from '../api/glApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { ProfitAndLoss } from '../types/gl';

export const ProfitAndLossPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: response } = useQuery({
    queryKey: ['profitAndLoss'],
    queryFn: () => glApi.getProfitAndLoss(),
  });

  const pnl: ProfitAndLoss = response?.data || {
    totalHarvestRevenue: 850000,
    totalFuelExpense: 180000,
    totalMaintenanceExpense: 65000,
    totalOperatorPayroll: 95000,
    totalOperatingExpense: 340000,
    grossProfit: 670000,
    netProfit: 510000,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.profitAndLoss}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Income statement, operational expenses & net profit margin calculations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">{t.billedRevenue}</span>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{pnl.totalHarvestRevenue?.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Operating Expenses</span>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
            ₹{pnl.totalOperatingExpense?.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">{t.netProfit}</span>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            ₹{pnl.netProfit?.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Expense Breakdown</h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-medium text-gray-700 dark:text-gray-300">Fuel & Diesel Expense</span>
            <span className="font-bold text-red-600 dark:text-red-400">₹{pnl.totalFuelExpense?.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-medium text-gray-700 dark:text-gray-300">Maintenance & Spare Parts</span>
            <span className="font-bold text-red-600 dark:text-red-400">₹{pnl.totalMaintenanceExpense?.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-medium text-gray-700 dark:text-gray-300">Operator Payroll & Commissions</span>
            <span className="font-bold text-red-600 dark:text-red-400">₹{pnl.totalOperatorPayroll?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
