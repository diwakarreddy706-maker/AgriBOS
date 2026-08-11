import { apiClient } from '../../../lib/apiClient';

export interface MachineProfitabilityItem {
  machineId: number;
  machineCode: string;
  machineName: string;
  machineType: string;
  engineHours: number;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  ownerPayout: number;
  netProfit: number;
  profitMarginPercent: number;
  roiPercent: number;
  fuelEfficiency: number;
  workProductivity: number;
}

export interface ExpenseBreakdownCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface ExpenseBreakdownResponse {
  totalExpense: number;
  categories: ExpenseBreakdownCategory[];
}

export const analyticsApi = {
  getMachineProfitability: async (machineId?: number): Promise<MachineProfitabilityItem[]> => {
    const res = await apiClient.get<any>('/analytics/machine-profitability', {
      params: { machineId }
    });
    return res.data?.data || [];
  },

  getExpenseBreakdown: async (): Promise<ExpenseBreakdownResponse> => {
    const res = await apiClient.get<any>('/analytics/expense-breakdown');
    return res.data?.data || { totalExpense: 0, categories: [] };
  },

  getAllHealthScores: async () => {
    const res = await apiClient.get<any>('/analytics/machine-profitability');
    const items: MachineProfitabilityItem[] = res.data?.data || [];
    const healthScores = items.map((m: any) => {
      const score = m.serviceStatus === 'OVERDUE' ? 50 : m.serviceStatus === 'SERVICE_DUE' ? 75 : 95;
      const status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' = score >= 90 ? 'EXCELLENT' : score >= 75 ? 'GOOD' : 'FAIR';
      return {
        machineId: m.machineId || m.id,
        healthScore: score,
        healthStatus: status,
        totalBreakdownsCount: m.serviceStatus === 'OVERDUE' ? 1 : 0,
        mtbfHours: Math.round(m.engineHours || 0),
        mttrHours: 0,
        lastInspectionDate: new Date().toISOString().split('T')[0],
        nextServiceDueHours: m.nextServiceHours || 250,
        servicingCompliancePercentage: score
      };
    });
    return { data: healthScores };
  }
};
