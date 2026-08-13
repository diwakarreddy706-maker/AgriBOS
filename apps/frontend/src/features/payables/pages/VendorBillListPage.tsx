import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { payablesApi } from '../api/payablesApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { Receipt, CheckCircle2 } from 'lucide-react';
import { VendorBill } from '../types/payables';

export const VendorBillListPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: response, isLoading } = useQuery({
    queryKey: ['vendorBills'],
    queryFn: () => payablesApi.getBills(),
  });

  const bills: VendorBill[] = response?.data?.content || [
    { id: 1, billNumber: 'VBL-2026-000001', supplierId: 5, supplierName: 'Basaveshwara Spare Parts', purchaseOrderId: 1, goodsReceiptId: 1, vendorInvoiceNumber: 'INV-BSP-991', billDate: '2026-07-20', dueDate: '2026-08-05', subtotalAmount: 45000, taxAmount: 8100, totalAmount: 53100, paidAmount: 0, balanceDue: 53100, status: 'VERIFIED', isThreeWayMatched: true, createdAt: '2026-07-20' },
    { id: 2, billNumber: 'VBL-2026-000002', supplierId: 6, supplierName: 'Karnataka Diesel Station', purchaseOrderId: 2, goodsReceiptId: 2, vendorInvoiceNumber: 'INV-KDS-442', billDate: '2026-07-22', dueDate: '2026-08-07', subtotalAmount: 120000, taxAmount: 0, totalAmount: 120000, paidAmount: 120000, balanceDue: 0, status: 'PAID', isThreeWayMatched: true, createdAt: '2026-07-22' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.vendorBills}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supplier inward invoices, 3-way PO/GRN matching & accounts payable ledger
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
            <Receipt className="h-10 w-10 mx-auto text-slate-400" />
            <p className="font-medium">No vendor bills logged</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <th className="p-4">{t.billNumber}</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">{t.vendorInvoice}</th>
                <th className="p-4">{t.amount}</th>
                <th className="p-4">{t.threeWayMatch}</th>
                <th className="p-4">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-gray-800 dark:text-gray-200">
              {bills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">{b.billNumber}</td>
                  <td className="p-4 font-semibold">{b.supplierName || `Supplier #${b.supplierId}`}</td>
                  <td className="p-4 font-mono text-xs">{b.vendorInvoiceNumber}</td>
                  <td className="p-4 font-bold">₹{b.totalAmount?.toLocaleString()}</td>
                  <td className="p-4">
                    {b.isThreeWayMatched ? (
                      <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Matched</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Unmatched</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      b.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                      b.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>
                      {b.status}
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
