import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../api/maintenanceApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';

const breakdownSchema = z.object({
  machineId: z.coerce.number().min(1, 'Machine ID is required'),
  reportedByEmployeeId: z.coerce.number().min(1, 'Employee ID is required'),
  locationName: z.string().min(2, 'Location is required'),
  severity: z.string().min(1, 'Severity is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(5, 'Detailed description is required'),
});

type BreakdownFormData = z.infer<typeof breakdownSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportBreakdownDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BreakdownFormData>({
    resolver: zodResolver(breakdownSchema),
    defaultValues: {
      machineId: 1,
      reportedByEmployeeId: 1,
      severity: 'HIGH',
      category: 'ENGINE',
      locationName: 'Siruguppa Field #4',
      description: 'Overheating engine and hydraulic pressure drop',
    }
  });

  const mutation = useMutation({
    mutationFn: (data: BreakdownFormData) => maintenanceApi.reportBreakdown(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceJobs'] });
      queryClient.invalidateQueries({ queryKey: ['workshopDashboard'] });
      reset();
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.reportBreakdown}</h2>

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
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Reporter Employee ID</label>
            <input
              type="number"
              {...register('reportedByEmployeeId')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.reportedByEmployeeId && <p className="text-xs text-red-500 mt-1">{errors.reportedByEmployeeId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Field Location</label>
            <input
              type="text"
              {...register('locationName')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.locationName && <p className="text-xs text-red-500 mt-1">{errors.locationName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.severity}</label>
              <select
                {...register('severity')}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
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
                <option value="TRACK_TIRE">TRACK_TIRE</option>
                <option value="ATTACHMENT">ATTACHMENT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Issue Description</label>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
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
              className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Submitting...' : t.reportBreakdown}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
