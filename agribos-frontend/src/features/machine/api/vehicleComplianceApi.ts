import { VehicleComplianceRecord, RenewalRecordInput } from '../types/vehicleCompliance';
import { apiClient } from '../../../lib/apiClient';

export const vehicleComplianceApi = {
  getComplianceRecords: async (search?: string, filter?: 'ALL' | 'EXPIRED' | 'EXPIRING_SOON'): Promise<VehicleComplianceRecord[]> => {
    const res = await apiClient.get<any>('/vehicle-compliance', {
      params: { search, filter }
    });
    return res.data?.data || res.data || [];
  },

  createComplianceRecord: async (input: Partial<VehicleComplianceRecord>): Promise<VehicleComplianceRecord> => {
    const res = await apiClient.post<any>('/vehicle-compliance', input);
    return res.data?.data || res.data;
  },

  recordRenewal: async (input: RenewalRecordInput): Promise<VehicleComplianceRecord> => {
    const res = await apiClient.post<any>('/vehicle-compliance/record-renewal', input);
    return res.data?.data || res.data;
  }
};
