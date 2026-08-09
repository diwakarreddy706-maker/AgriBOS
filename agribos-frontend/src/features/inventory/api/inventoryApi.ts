import api from '../../../api/axiosClient';
import { ApiResponse } from '../../../types/api';
import { InventoryDashboardMetrics, POStatus, PurchaseOrder, SparePart, Supplier } from '../types/inventory';

export const inventoryApi = {
  getDashboardMetrics: async (): Promise<ApiResponse<InventoryDashboardMetrics>> => {
    const response = await api.get('/dashboard/inventory');
    return response.data;
  },

  getSpareParts: async (params?: { category?: string; search?: string; page?: number; size?: number }) => {
    const response = await api.get('/spare-parts', { params });
    return response.data;
  },

  getLowStockItems: async (): Promise<ApiResponse<SparePart[]>> => {
    const response = await api.get('/spare-parts/low-stock');
    return response.data;
  },

  createSparePart: async (payload: Partial<SparePart>): Promise<ApiResponse<SparePart>> => {
    const response = await api.post('/spare-parts', payload);
    return response.data;
  },

  recordMovement: async (payload: { sparePartId: number; movementType: string; quantity: number; unitPrice?: number; remarks?: string }) => {
    const response = await api.post('/inventory/movements', payload);
    return response.data;
  },

  getPurchaseOrders: async (params?: { supplierId?: number; status?: string; page?: number; size?: number }) => {
    const response = await api.get('/purchase-orders', { params });
    return response.data;
  },

  createPO: async (payload: { supplierId: number; orderDate: string; totalAmount: number; notes?: string }): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await api.post('/purchase-orders', payload);
    return response.data;
  },

  updatePOStatus: async (id: number, status: POStatus): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await api.patch(`/purchase-orders/${id}/status?status=${status}`);
    return response.data;
  },

  getSuppliers: async (params?: { search?: string; page?: number; size?: number }) => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  createSupplier: async (payload: Partial<Supplier>): Promise<ApiResponse<Supplier>> => {
    const response = await api.post('/suppliers', payload);
    return response.data;
  }
};
