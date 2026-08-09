import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { glApi } from '../api/glApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { JournalBatch } from '../types/gl';

export const GeneralLedgerPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: response, isLoading } = useQuery({
    queryKey: ['journalBatches'],
    queryFn: () => glApi.getJournalBatches(),
  });

  const batches: JournalBatch[] = response?.data?.content || [
    { id: 1, batchNumber: 'JNL-2026-000001', postingDate: '2026-07-27', periodId: 2, sourceModule: 'INVOICE', referenceId: 1, totalDebit: 10500, totalCredit: 10500, status: 'POSTED', narration: 'Customer Invoice Posting #INV-2026-000001', createdAt: '2026-07-27' },
    { id: 2, batchNumber: 'JNL-2026-000002', postingDate: '2026-07-27', periodId: 2, sourceModule: 'PAYMENT', referenceId: 1, totalDebit: 5000, totalCredit: 5000, status: 'POSTED', narration: 'Customer Payment Receipt #RCT-2026-000001', createdAt: '2026-07-27' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.generalLedger}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Double-entry journal batches, COA account postings & period audit trails
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <th className="p-4">{t.batchNumber}</th>
                <th className="p-4">Date</th>
                <th className="p-4">Source Module</th>
                <th className="p-4">Narration</th>
                <th className="p-4">{t.totalDebit}</th>
                <th className="p-4">{t.totalCredit}</th>
                <th className="p-4">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-gray-800 dark:text-gray-200">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">{b.batchNumber}</td>
                  <td className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400">{b.postingDate}</td>
                  <td className="p-4 font-semibold text-xs">{b.sourceModule}</td>
                  <td className="p-4 text-xs text-gray-700 dark:text-gray-300">{b.narration}</td>
                  <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{b.totalDebit?.toLocaleString()}</td>
                  <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{b.totalCredit?.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
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
