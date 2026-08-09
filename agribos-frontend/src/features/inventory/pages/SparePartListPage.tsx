import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { Boxes, Plus } from 'lucide-react';
import { AddSparePartDialog } from '../components/AddSparePartDialog';
import { SparePart } from '../types/inventory';

export const SparePartListPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ['spareParts'],
    queryFn: () => inventoryApi.getSpareParts(),
  });

  const spareParts: SparePart[] = response?.data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.spareParts}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Catalog of workshop spare parts, rack locations & low-stock reorder thresholds
          </p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>{t.addPart}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : spareParts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
            <Boxes className="h-10 w-10 mx-auto text-slate-400" />
            <p className="font-medium">No spare parts in workshop catalog</p>
            <p className="text-xs">Click "{t.addPart}" to add replacement parts and track stock movements</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <th className="p-4">{t.partNumber}</th>
                <th className="p-4">{t.partName}</th>
                <th className="p-4">{t.category}</th>
                <th className="p-4">{t.stock}</th>
                <th className="p-4">{t.unitCost}</th>
                <th className="p-4">{t.rack}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-gray-800 dark:text-gray-200">
              {spareParts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">{p.partNumber}</td>
                  <td className="p-4 font-semibold">{p.partName}</td>
                  <td className="p-4 text-xs font-medium">{p.category}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      p.isLowStock ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}>
                      {p.currentStock} {p.unitOfMeasure}
                    </span>
                  </td>
                  <td className="p-4 font-semibold">₹{p.unitCost?.toLocaleString() ?? 0}</td>
                  <td className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400">{p.locationRack || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddSparePartDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
};
