import { apiClient } from '../../../lib/apiClient';
import { Machine, MachineCreateInput } from '../types/machine';
import { PageResponse } from '../../../types/api';

export const machineApi = {
  getMachines: async (search?: string, type?: string, ownership?: string, page = 0, size = 10): Promise<PageResponse<Machine>> => {
    try {
      const res = await apiClient.get<any>('/machines', {
        params: { search, type, ownership, page, size },
      });
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        return {
          content: data,
          page: 0,
          pageSize: size,
          totalElements: data.length,
          totalPages: 1,
          last: true
        };
      }
      return data;
    } catch {
      return {
        content: [],
        page: 0,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        last: true
      };
    }
  },

  createMachine: async (data: MachineCreateInput): Promise<Machine> => {
    const isHarvester = data.machineType === 'HARVESTER';
    const finalRegNum = isHarvester ? 'N/A' : (data.registrationNumber || `KA-36 M ${Math.floor(1000 + Math.random() * 9000)}`);
    
    const res = await apiClient.post<any>('/machines', {
      ...data,
      registrationNumber: finalRegNum
    });
    return res.data?.data || res.data;
  },

  deleteMachine: async (id: number): Promise<void> => {
    await apiClient.delete(`/machines/${id}`);
  },

  postTelematics: async (id: number, data: { latitude: number; longitude: number; speed?: number; engineHours?: number }): Promise<Machine> => {
    const res = await apiClient.post<any>(`/machines/${id}/telematics`, data);
    return res.data?.data || res.data;
  },

  getTelematicsHistory: async (id: number): Promise<any[]> => {
    const res = await apiClient.get<any>(`/machines/${id}/telematics`);
    return res.data?.data || res.data || [];
  },

  completeService: async (id: number): Promise<Machine> => {
    const res = await apiClient.post<any>(`/machines/${id}/complete-service`);
    return res.data?.data || res.data;
  }
};
