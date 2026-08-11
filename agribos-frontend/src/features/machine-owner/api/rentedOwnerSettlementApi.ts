import { RentedOwnerSettlementLedger, OwnerPayoutInput } from '../types/rentedOwnerSettlement';
import { apiClient } from '../../../lib/apiClient';

export const rentedOwnerSettlementApi = {
  getSettlementLedgers: async (search?: string): Promise<RentedOwnerSettlementLedger[]> => {
    try {
      const res = await apiClient.get<any>('/machine-owners/settlement-ledger', {
        params: { search }
      });
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  recordOwnerPayout: async (input: OwnerPayoutInput): Promise<RentedOwnerSettlementLedger> => {
    const res = await apiClient.post<any>('/machine-owners/payout', input);
    return res.data?.data || res.data;
  }
};
