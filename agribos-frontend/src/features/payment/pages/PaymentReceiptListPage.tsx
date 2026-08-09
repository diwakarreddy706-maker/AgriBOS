import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../api/paymentApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { Ticket, Plus } from 'lucide-react';
import { RecordPaymentReceiptDialog } from '../components/RecordPaymentReceiptDialog';
import { PaymentReceipt } from '../types/payment';

export const PaymentReceiptListPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ['paymentReceipts'],
    queryFn: () => paymentApi.getReceipts(),
  });

  const receipts: PaymentReceipt[] = response?.data?.content || [
    { id: 1, receiptNumber: 'RCT-2026-000001', farmerId: 10, farmerName: 'Basavaraj Patil', invoiceId: 1, paymentDate: '2026-07-27 10:30', amount: 5000, paymentMode: 'CASH', status: 'POSTED', createdAt: '2026-07-27' },
    { id: 2, receiptNumber: 'RCT-2026-000002', farmerId: 12, farmerName: 'Ningappa Gowda', invoiceId: 2, paymentDate: '2026-07-27 14:15', amount: 22050, paymentMode: 'UPI', referenceNumber: 'UTR987654321', status: 'RECONCILED', createdAt: '2026-07-27' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.receipts}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Payment receipt vouchers, multi-channel collections & Udhar ledger credit entries
          </p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>{t.recordReceipt}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
            <Ticket className="h-10 w-10 mx-auto text-slate-400" />
            <p className="font-medium">No payment receipts recorded</p>
            <p className="text-xs">Click "{t.recordReceipt}" to collect cash, UPI, or bank transfer payments</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <th className="p-4">{t.receiptNumber}</th>
                <th className="p-4">{t.farmer}</th>
                <th className="p-4">{t.amount}</th>
                <th className="p-4">{t.paymentMode}</th>
                <th className="p-4">{t.referenceNo}</th>
                <th className="p-4">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-gray-800 dark:text-gray-200">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">{r.receiptNumber}</td>
                  <td className="p-4 font-semibold">{r.farmerName || `Farmer #${r.farmerId}`}</td>
                  <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">₹{r.amount?.toLocaleString()}</td>
                  <td className="p-4 text-xs font-semibold">{r.paymentMode}</td>
                  <td className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400">{r.referenceNumber || 'N/A'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RecordPaymentReceiptDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
};
