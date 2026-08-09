import api from '../../../api/axiosClient';
import { ApiResponse } from '../../../types/api';
import { FleetAnalyticsSummary, MachineHealthScore } from '../types/analytics';

export const analyticsApi = {
  getFleetSummary: async (): Promise<ApiResponse<FleetAnalyticsSummary>> => {
    const response = await api.get('/analytics/fleet-summary');
    return response.data;
  },

  getAllHealthScores: async (): Promise<ApiResponse<MachineHealthScore[]>> => {
    const response = await api.get('/analytics/machine-health');
    return response.data;
  },

  getHealthByMachineId: async (machineId: number): Promise<ApiResponse<MachineHealthScore>> => {
    const response = await api.get(`/analytics/machine-health/${machineId}`);
    return response.data;
  }
};
