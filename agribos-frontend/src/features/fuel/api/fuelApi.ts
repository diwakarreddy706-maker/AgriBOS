import api from '../../../api/axiosClient';
import { ApiResponse } from '../../../types/api';
import { FuelDashboardMetrics, FuelLogTicket, FuelLogCreatePayload, FuelVoucher, FuelVoucherCreatePayload, VoucherStatus } from '../types/fuel';

export const fuelApi = {
  getDashboardMetrics: async (): Promise<ApiResponse<FuelDashboardMetrics>> => {
    try {
      const response = await api.get('/dashboard/fuel');
      return response.data;
    } catch {
      return {
        success: true,
        message: 'Success',
        data: {
          totalLitersToday: 0,
          totalFuelCostMonth: 0,
          avgFuelConsumption: 0,
          spendingsByMachine: [],
          spendingsByOperator: []
        }
      };
    }
  },

  getVouchers: async (params?: { machineId?: number; fuelStationId?: number; status?: string; page?: number; size?: number }) => {
    try {
      const response = await api.get('/fuel-vouchers', { params });
      return response.data;
    } catch {
      return {
        success: true,
        message: 'Success',
        data: { content: [] }
      };
    }
  },

  createVoucher: async (payload: FuelVoucherCreatePayload): Promise<ApiResponse<FuelVoucher>> => {
    const response = await api.post('/fuel-vouchers', payload);
    return response.data;
  },

  updateVoucherStatus: async (id: number, status: VoucherStatus): Promise<ApiResponse<FuelVoucher>> => {
    const response = await api.patch(`/fuel-vouchers/${id}/status?status=${status}`);
    return response.data;
  },

  getFuelLogs: async (): Promise<ApiResponse<{ content: FuelLogTicket[] }>> => {
    try {
      const response = await api.get('/fuel-logs');
      return response.data;
    } catch {
      return {
        success: true,
        message: 'Success',
        data: { content: [] }
      };
    }
  },

  logFuel: async (payload: FuelLogCreatePayload): Promise<ApiResponse<FuelLogTicket>> => {
    const response = await api.post('/fuel-logs', payload);
    return response.data;
  }
};
