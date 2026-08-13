import api from '../../../api/axiosClient';
import { ApiResponse } from '../../../types/api';
import { BillStatus, EmployeePayroll, PayablesDashboardMetrics, VendorBill } from '../types/payables';

export const payablesApi = {
  getDashboardMetrics: async (): Promise<ApiResponse<PayablesDashboardMetrics>> => {
    const response = await api.get('/dashboard/payables');
    return response.data;
  },

  getBills: async (params?: { supplierId?: number; status?: string; page?: number; size?: number }) => {
    const response = await api.get('/vendor-bills', { params });
    return response.data;
  },

  createBill: async (payload: Partial<VendorBill>): Promise<ApiResponse<VendorBill>> => {
    const response = await api.post('/vendor-bills', payload);
    return response.data;
  },

  updateBillStatus: async (id: number, status: BillStatus): Promise<ApiResponse<VendorBill>> => {
    const response = await api.patch(`/vendor-bills/${id}/status?status=${status}`);
    return response.data;
  },

  getPayrolls: async (params?: { employeeId?: number; month?: string; page?: number; size?: number }) => {
    const response = await api.get('/payroll', { params });
    return response.data;
  },

  generatePayroll: async (payload: Partial<EmployeePayroll>): Promise<ApiResponse<EmployeePayroll>> => {
    const response = await api.post('/payroll', payload);
    return response.data;
  }
};
