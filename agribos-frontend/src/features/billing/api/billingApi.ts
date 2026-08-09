import api from '../../../api/axiosClient';
import { ApiResponse } from '../../../types/api';
import { CustomerInvoice, FarmerLedgerAccount, FinanceDashboardMetrics, InvoiceStatus } from '../types/billing';

export const billingApi = {
  getDashboardMetrics: async (): Promise<ApiResponse<FinanceDashboardMetrics>> => {
    const response = await api.get('/dashboard/finance');
    return response.data;
  },

  getInvoices: async (params?: { farmerId?: number; status?: string; page?: number; size?: number }) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  createInvoice: async (payload: Partial<CustomerInvoice>): Promise<ApiResponse<CustomerInvoice>> => {
    const response = await api.post('/invoices', payload);
    return response.data;
  },

  generateInvoiceFromWorkExecution: async (workExecutionId: number, farmerId: number, actualAcres: number, ratePerAcre?: number): Promise<ApiResponse<CustomerInvoice>> => {
    const response = await api.post(`/invoices/generate/${workExecutionId}`, null, {
      params: { farmerId, actualAcres, ratePerAcre }
    });
    return response.data;
  },

  updateInvoiceStatus: async (id: number, status: InvoiceStatus): Promise<ApiResponse<CustomerInvoice>> => {
    const response = await api.patch(`/invoices/${id}/status?status=${status}`);
    return response.data;
  },

  getFarmerLedger: async (farmerId: number): Promise<ApiResponse<FarmerLedgerAccount>> => {
    const response = await api.get(`/farmer-ledgers/${farmerId}`);
    return response.data;
  }
};
