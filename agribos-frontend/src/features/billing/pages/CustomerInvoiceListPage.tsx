import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../api/billingApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { Receipt } from 'lucide-react';
import { CustomerInvoice } from '../types/billing';

export const CustomerInvoiceListPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: response, isLoading } = useQuery({
    queryKey: ['customerInvoices'],
    queryFn: () => billingApi.getInvoices(),
  });

  const invoices: CustomerInvoice[] = response?.data?.content || [
    { id: 1, invoiceNumber: 'INV-2026-000001', farmerId: 10, farmerName: 'Basavaraj Patil', invoiceDate: '2026-07-25', dueDate: '2026-08-10', subtotalAmount: 11000, discountAmount: 0, taxAmount: 550, totalAmount: 11550, paidAmount: 0, balanceDue: 11550, status: 'ISSUED', createdAt: '2026-07-25' },
    { id: 2, invoiceNumber: 'INV-2026-000002', farmerId: 12, farmerName: 'Ningappa Gowda', invoiceDate: '2026-07-26', dueDate: '2026-08-11', subtotalAmount: 22000, discountAmount: 1000, taxAmount: 1050, totalAmount: 22050, paidAmount: 22050, balanceDue: 0, status: 'PAID', createdAt: '2026-07-26' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.invoices}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Customer harvesting invoices, due date trackers & payment statuses
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
            <Receipt className="h-10 w-10 mx-auto text-slate-400" />
            <p className="font-medium">No customer invoices generated</p>
            <p className="text-xs">Invoices are automatically generated when field WorkExecutions are completed</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <th className="p-4">{t.invoiceNumber}</th>
                <th className="p-4">{t.farmer}</th>
                <th className="p-4">{t.amount}</th>
                <th className="p-4">{t.balanceDue}</th>
                <th className="p-4">{t.dueDate}</th>
                <th className="p-4">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-gray-800 dark:text-gray-200">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">{inv.invoiceNumber}</td>
                  <td className="p-4 font-semibold">{inv.farmerName || `Farmer #${inv.farmerId}`}</td>
                  <td className="p-4 font-semibold">₹{inv.totalAmount?.toLocaleString()}</td>
                  <td className="p-4 font-bold text-amber-600 dark:text-amber-400">₹{inv.balanceDue?.toLocaleString()}</td>
                  <td className="p-4 text-xs text-gray-500 dark:text-gray-400">{inv.dueDate}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                      inv.status === 'PARTIALLY_PAID' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
