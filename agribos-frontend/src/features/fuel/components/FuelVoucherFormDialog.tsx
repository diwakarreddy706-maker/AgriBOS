import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fuelApi } from '../api/fuelApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';

const voucherSchema = z.object({
  machineId: z.coerce.number().min(1, 'Machine ID is required'),
  fuelStationId: z.coerce.number().min(1, 'Fuel Station ID is required'),
  maxAllowedLiters: z.coerce.number().min(1, 'Max liters must be > 0'),
  approvedAmountLimit: z.coerce.number().optional(),
  validityDays: z.coerce.number(),
});

type VoucherFormData = z.infer<typeof voucherSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FuelVoucherFormDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      machineId: 1,
      fuelStationId: 1,
      maxAllowedLiters: 50,
      validityDays: 7,
    }
  });

  const mutation = useMutation({
    mutationFn: (data: VoucherFormData) => fuelApi.createVoucher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelVouchers'] });
      queryClient.invalidateQueries({ queryKey: ['fuelDashboard'] });
      reset();
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.issueVoucher}</h2>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Machine ID</label>
            <input
              type="number"
              {...register('machineId')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.machineId && <p className="text-xs text-red-500 mt-1">{errors.machineId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Fuel Station ID</label>
            <input
              type="number"
              {...register('fuelStationId')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.fuelStationId && <p className="text-xs text-red-500 mt-1">{errors.fuelStationId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.maxLiters}</label>
            <input
              type="number"
              step="0.01"
              {...register('maxAllowedLiters')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.maxAllowedLiters && <p className="text-xs text-red-500 mt-1">{errors.maxAllowedLiters.message}</p>}
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
              {mutation.isPending ? 'Issuing...' : t.issueVoucher}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
