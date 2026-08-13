import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { Boxes, AlertCircle, ShoppingCart, Users } from 'lucide-react';

export const InventoryDashboardPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: response, isLoading } = useQuery({
    queryKey: ['inventoryDashboard'],
    queryFn: () => inventoryApi.getDashboardMetrics(),
  });

  const metrics = response?.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.inventoryDashboard}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time spare parts stock, procurement purchase orders & supplier ledgers
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
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.currentInventoryValue}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{metrics?.currentInventoryValue?.toLocaleString() ?? 0}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.lowStockItems}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.lowStockItemCount ?? 0}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.pendingPOs}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.pendingPurchaseOrders ?? 0}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.totalSuppliers}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.totalSuppliers ?? 0}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
