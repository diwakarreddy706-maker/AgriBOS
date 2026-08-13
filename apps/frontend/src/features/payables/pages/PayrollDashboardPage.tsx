import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { payablesApi } from '../api/payablesApi';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { EmployeePayroll } from '../types/payables';

export const PayrollDashboardPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  const { data: response, isLoading } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => payablesApi.getPayrolls(),
  });

  const payrolls: EmployeePayroll[] = response?.data?.content || [
    { id: 1, payrollNumber: 'PAY-2026-000001', employeeId: 101, employeeName: 'Ramesh Kumar (Harvester Operator)', payPeriodMonth: '2026-07', baseSalary: 25000, commissionEarned: 8500, advanceDeductions: 2000, netPayable: 31500, status: 'GENERATED', createdAt: '2026-07-27' },
    { id: 2, payrollNumber: 'PAY-2026-000002', employeeId: 102, employeeName: 'Suresh Gowda (Tractor Driver)', payPeriodMonth: '2026-07', baseSalary: 20000, commissionEarned: 4200, advanceDeductions: 1000, netPayable: 23200, status: 'APPROVED', createdAt: '2026-07-27' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.payroll}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly driver salaries, operator acre/hour commissions & salary advance deductions
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
                <th className="p-4">Payroll #</th>
                <th className="p-4">Employee</th>
                <th className="p-4">Month</th>
                <th className="p-4">Base Salary</th>
                <th className="p-4">Commission</th>
                <th className="p-4">Advances</th>
                <th className="p-4">{t.netPayable}</th>
                <th className="p-4">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-gray-800 dark:text-gray-200">
              {payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">{p.payrollNumber}</td>
                  <td className="p-4 font-semibold">{p.employeeName || `Employee #${p.employeeId}`}</td>
                  <td className="p-4 font-mono text-xs">{p.payPeriodMonth}</td>
                  <td className="p-4 font-mono">₹{p.baseSalary?.toLocaleString()}</td>
                  <td className="p-4 font-mono text-emerald-600 dark:text-emerald-400">+₹{p.commissionEarned?.toLocaleString()}</td>
                  <td className="p-4 font-mono text-red-500">-₹{p.advanceDeductions?.toLocaleString()}</td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">₹{p.netPayable?.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      {p.status}
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
