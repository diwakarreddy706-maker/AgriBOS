import { apiClient } from '../../../lib/apiClient';
import { Farmer, FarmerCreateInput, FarmerLedgerAccount } from '../types/farmer';

export interface PageResponse<T> {
  content: T[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const mapFarmerRow = (r: any): Farmer => ({
  id: r.id,
  farmerCode: r.farmerCode || r.farmer_code,
  fullName: r.fullName || r.full_name,
  fatherName: r.fatherName || r.father_name || '',
  mobileNumber: r.mobileNumber || r.mobile_number,
  villageName: r.villageName || r.village_name,
  talukName: r.talukName || r.taluk_name || 'Gangavati',
  districtName: r.districtName || r.district_name || 'Raichur',
  status: r.status || 'ACTIVE',
  createdAt: r.createdAt || r.created_at
});

export const farmerApi = {
  getFarmers: async (search?: string, page = 0, size = 10): Promise<PageResponse<Farmer>> => {
    try {
      const res = await apiClient.get<any>('/farmers', {
        params: { search, page, size },
      });
      const data = res.data?.data || res.data;
      const content = Array.isArray(data) ? data.map(mapFarmerRow) : [];
      const pagination = res.data?.pagination || {};

      return {
        content,
        page: pagination.page || 0,
        pageSize: pagination.pageSize || size,
        totalElements: pagination.totalElements || content.length,
        totalPages: pagination.totalPages || (content.length > 0 ? 1 : 0),
        last: pagination.last !== undefined ? pagination.last : true
      };
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

  getFarmerById: async (id: number): Promise<Farmer> => {
    const res = await apiClient.get<any>(`/farmers/${id}`);
    const data = res.data?.data || res.data;
    return mapFarmerRow(data);
  },

  getFarmerLedgerAccounts: async (searchQuery?: string): Promise<FarmerLedgerAccount[]> => {
    try {
      const res = await apiClient.get<any>('/farmers/ledger-accounts', {
        params: { search: searchQuery }
      });
      const accounts = res.data?.data || res.data || [];
      if (Array.isArray(accounts)) {
        return accounts.map((a: any) => ({
          id: a.id,
          farmerCode: a.farmerCode || a.farmer_code,
          fullName: a.fullName || a.full_name,
          fatherName: a.fatherName || a.father_name || '',
          mobileNumber: a.mobileNumber || a.mobile_number,
          villageName: a.villageName || a.village_name,
          talukName: a.talukName || a.taluk_name || 'Gangavati',
          totalWorkSessions: a.totalWorkSessions || 0,
          totalBilledAmount: a.totalBilledAmount || 0,
          totalAdvancePaid: a.totalAdvancePaid || 0,
          totalPaidAmount: a.totalPaidAmount || 0,
          totalBalanceDue: a.totalBalanceDue || 0,
          workEntries: a.workEntries || []
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  recordFarmerPayment: async (farmerId: number, billId: number, paymentAmount: number): Promise<void> => {
    await apiClient.post(`/farmers/${farmerId}/payment`, { billId, paymentAmount });
  },

  createFarmer: async (data: FarmerCreateInput): Promise<Farmer> => {
    const res = await apiClient.post<any>('/farmers', data);
    return mapFarmerRow(res.data?.data || res.data);
  },

  deleteFarmer: async (id: number): Promise<void> => {
    await apiClient.delete(`/farmers/${id}`);
  },
};
