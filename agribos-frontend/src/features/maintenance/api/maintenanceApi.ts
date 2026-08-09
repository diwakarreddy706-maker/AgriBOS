import api from '../../../api/axiosClient';
import { ApiResponse } from '../../../types/api';
import { Breakdown, BreakdownStatus, JobStatus, MaintenanceJob, WorkshopDashboardMetrics } from '../types/maintenance';

export const maintenanceApi = {
  getDashboardMetrics: async (): Promise<ApiResponse<WorkshopDashboardMetrics>> => {
    const response = await api.get('/dashboard/workshop');
    return response.data;
  },

  getBreakdowns: async (params?: { machineId?: number; status?: string; severity?: string; page?: number; size?: number }) => {
    const response = await api.get('/breakdowns', { params });
    return response.data;
  },

  reportBreakdown: async (payload: { machineId: number; reportedByEmployeeId: number; locationName: string; severity: string; category: string; description: string }): Promise<ApiResponse<Breakdown>> => {
    const response = await api.post('/breakdowns', payload);
    return response.data;
  },

  updateBreakdownStatus: async (id: number, status: BreakdownStatus): Promise<ApiResponse<Breakdown>> => {
    const response = await api.patch(`/breakdowns/${id}/status?status=${status}`);
    return response.data;
  },

  getMaintenanceJobs: async (params?: { machineId?: number; status?: string; jobType?: string; page?: number; size?: number }) => {
    const response = await api.get('/maintenance-jobs', { params });
    return response.data;
  },

  assignTechnician: async (id: number, technicianId: number): Promise<ApiResponse<MaintenanceJob>> => {
    const response = await api.patch(`/maintenance-jobs/${id}/assign?technicianId=${technicianId}`);
    return response.data;
  },

  updateJobStatus: async (id: number, status: JobStatus): Promise<ApiResponse<MaintenanceJob>> => {
    const response = await api.patch(`/maintenance-jobs/${id}/status?status=${status}`);
    return response.data;
  }
};
