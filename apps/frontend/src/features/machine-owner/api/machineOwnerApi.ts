import { apiClient } from '../../../lib/apiClient';
import { MachineOwner, MachineOwnerCreateInput } from '../types/machineOwner';
import { PageResponse } from '../../../types/api';

export const machineOwnerApi = {
  getOwners: async (search?: string, page = 0, size = 10): Promise<PageResponse<MachineOwner>> => {
    try {
      const res = await apiClient.get<any>('/machine-owners', {
        params: { search, page, size },
      });
      return res.data?.data || res.data;
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

  createOwner: async (data: MachineOwnerCreateInput): Promise<MachineOwner> => {
    const res = await apiClient.post<any>('/machine-owners', data);
    return res.data?.data || res.data;
  },

  deleteOwner: async (id: number): Promise<void> => {
    await apiClient.delete(`/machine-owners/${id}`);
  },
};
