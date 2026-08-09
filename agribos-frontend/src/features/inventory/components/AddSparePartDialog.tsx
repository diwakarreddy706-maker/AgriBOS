import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';

const sparePartSchema = z.object({
  partNumber: z.string().min(2, 'Part number is required'),
  partName: z.string().min(2, 'Part name is required'),
  category: z.string().min(1, 'Category is required'),
  unitOfMeasure: z.string(),
  currentStock: z.coerce.number().min(0, 'Stock cannot be negative'),
  minimumStockLevel: z.coerce.number(),
  unitCost: z.coerce.number().min(0, 'Cost cannot be negative'),
  locationRack: z.string().optional(),
});

type SparePartFormData = z.infer<typeof sparePartSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSparePartDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SparePartFormData>({
    resolver: zodResolver(sparePartSchema),
    defaultValues: {
      partNumber: 'PRT-FILT-001',
      partName: 'Engine Oil Filter - Harvester',
      category: 'FILTERS',
      unitOfMeasure: 'PCS',
      currentStock: 12,
      minimumStockLevel: 5,
      unitCost: 450,
      locationRack: 'RACK-A-03',
    }
  });

  const mutation = useMutation({
    mutationFn: (data: SparePartFormData) => inventoryApi.createSparePart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryDashboard'] });
      reset();
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.addPart}</h2>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.partNumber}</label>
              <input
                type="text"
                {...register('partNumber')}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.partNumber && <p className="text-xs text-red-500 mt-1">{errors.partNumber.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.category}</label>
              <select
                {...register('category')}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ENGINE">ENGINE</option>
                <option value="HYDRAULIC">HYDRAULIC</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="FILTERS">FILTERS</option>
                <option value="BELTS">BELTS</option>
                <option value="HARDWARE">HARDWARE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.partName}</label>
            <input
              type="text"
              {...register('partName')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.partName && <p className="text-xs text-red-500 mt-1">{errors.partName.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.stock}</label>
              <input
                type="number"
                {...register('currentStock')}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.unitCost}</label>
              <input
                type="number"
                {...register('unitCost')}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.rack}</label>
              <input
                type="text"
                {...register('locationRack')}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : t.addPart}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
