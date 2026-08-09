import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api/paymentApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';

const receiptSchema = z.object({
  farmerId: z.coerce.number().min(1, 'Farmer is required'),
  invoiceId: z.coerce.number().optional(),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE']),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordPaymentReceiptDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      farmerId: 10,
      amount: 5000,
      paymentMode: 'CASH',
      remarks: 'Partial Udhar collection payment',
    }
  });

  const mutation = useMutation({
    mutationFn: (data: ReceiptFormData) => paymentApi.createReceipt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['customerInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      reset();
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.recordReceipt}</h2>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.farmer} ID</label>
            <input
              type="number"
              {...register('farmerId')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.farmerId && <p className="text-xs text-red-500 mt-1">{errors.farmerId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.amount} (₹)</label>
            <input
              type="number"
              {...register('amount')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.paymentMode}</label>
            <select
              {...register('paymentMode')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
              <option value="CHEQUE">CHEQUE</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t.referenceNo}</label>
            <input
              type="text"
              {...register('referenceNumber')}
              placeholder="e.g. UTR123456789"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              {mutation.isPending ? 'Saving...' : t.recordReceipt}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
