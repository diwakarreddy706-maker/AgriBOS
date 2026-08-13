import api from '../../../api/axiosClient';
import { ApiResponse } from '../../../types/api';
import { DailyCashClosing, PaymentReceipt } from '../types/payment';

export const paymentApi = {
  getReceipts: async (params?: { farmerId?: number; invoiceId?: number; page?: number; size?: number }) => {
    const response = await api.get('/payment-receipts', { params });
    return response.data;
  },

  createReceipt: async (payload: Partial<PaymentReceipt>): Promise<ApiResponse<PaymentReceipt>> => {
    const response = await api.post('/payment-receipts', payload);
    return response.data;
  },

  getCashBook: async (params?: { page?: number; size?: number }) => {
    const response = await api.get('/cash-book', { params });
    return response.data;
  },

  recordCashClosing: async (payload: Partial<DailyCashClosing>): Promise<ApiResponse<DailyCashClosing>> => {
    const response = await api.post('/cash-closing', payload);
    return response.data;
  }
};
