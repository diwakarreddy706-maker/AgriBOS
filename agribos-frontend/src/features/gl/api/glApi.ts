import api from '../../../api/axiosClient';
import { ApiResponse } from '../../../types/api';
import { BalanceSheet, ProfitAndLoss, TrialBalanceItem } from '../types/gl';

export const glApi = {
  getJournalBatches: async (params?: { sourceModule?: string; page?: number; size?: number }) => {
    const response = await api.get('/journal-batches', { params });
    return response.data;
  },

  getTrialBalance: async (): Promise<ApiResponse<TrialBalanceItem[]>> => {
    const response = await api.get('/trial-balance');
    return response.data;
  },

  getProfitAndLoss: async (): Promise<ApiResponse<ProfitAndLoss>> => {
    const response = await api.get('/profit-loss');
    return response.data;
  },

  getBalanceSheet: async (): Promise<ApiResponse<BalanceSheet>> => {
    const response = await api.get('/balance-sheet');
    return response.data;
  }
};
