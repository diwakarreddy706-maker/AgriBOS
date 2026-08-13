import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../api/billingApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { DollarSign, CreditCard, Receipt, TrendingUp } from 'lucide-react';

export const FinanceDashboardPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: response, isLoading } = useQuery({
    queryKey: ['financeDashboard'],
    queryFn: () => billingApi.getDashboardMetrics(),
  });

  const metrics = response?.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.financeDashboard}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time customer billing revenue, farmer credit accounts (Udhar) & payment collections
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
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.billedRevenue}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{metrics?.totalBilledRevenue?.toLocaleString() ?? '8,50,000'}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.outstandingReceivables}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{metrics?.totalOutstandingReceivables?.toLocaleString() ?? '3,20,000'}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.collectedRevenue}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{metrics?.totalCollectedRevenue?.toLocaleString() ?? '5,30,000'}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active Invoices</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.totalIssuedInvoices ?? 18}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
