import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, ExpenseBreakdownResponse } from '../api/analyticsApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { formatCurrency } from '../../../lib/utils';
import { PieChart, DollarSign, Fuel, Wrench, Users, Package, MoreHorizontal } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  Fuel: <Fuel className="w-4 h-4 text-amber-500" />,
  Maintenance: <Wrench className="w-4 h-4 text-blue-500" />,
  Salaries: <Users className="w-4 h-4 text-emerald-500" />,
  'Spare Parts': <Package className="w-4 h-4 text-purple-500" />,
  Other: <MoreHorizontal className="w-4 h-4 text-slate-500" />
};

export const ExpenseBreakdownWidget: React.FC = () => {
  const { data, isLoading } = useQuery<ExpenseBreakdownResponse>({
    queryKey: ['expenseBreakdown'],
    queryFn: () => analyticsApi.getExpenseBreakdown(),
  });

  if (isLoading) {
    return <div className="p-6 text-center text-xs text-slate-500">Loading expense category analytics...</div>;
  }

  const totalExpense = data?.totalExpense || 0;
  const categories = data?.categories || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-agri-600 dark:text-agri-400" />
            <span>Operational Expense Breakdown</span>
          </CardTitle>
          <div className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100">
            Total: {formatCurrency(totalExpense)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 || totalExpense === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No operational expense records logged.</div>
        ) : (
          <div className="space-y-3 pt-2">
            {categories.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 font-medium">
                    {categoryIcons[cat.category] || <DollarSign className="w-4 h-4 text-slate-400" />}
                    <span>{cat.category}</span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(cat.amount)} ({cat.percentage}%)
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-agri-600 dark:bg-agri-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, cat.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
