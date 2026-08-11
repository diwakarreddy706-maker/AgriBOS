import React from 'react';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { en } from '../../../localization/en';
import { kn } from '../../../localization/kn';
import { MachineProfitabilityWidget } from '../components/MachineProfitabilityWidget';
import { ExpenseBreakdownWidget } from '../components/ExpenseBreakdownWidget';

export const FleetAnalyticsPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = language === 'kn' ? kn : en;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.fleetAnalytics || 'Fleet Analytics & Financial Control'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time machine profitability, operational expense categorization, fuel efficiency & ROI audit
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MachineProfitabilityWidget />
        </div>
        <div>
          <ExpenseBreakdownWidget />
        </div>
      </div>
    </div>
  );
};
