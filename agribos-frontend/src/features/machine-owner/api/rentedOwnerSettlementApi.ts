import { RentedOwnerSettlementLedger, OwnerPayoutInput } from '../types/rentedOwnerSettlement';
import { apiClient } from '../../../lib/apiClient';

export const rentedOwnerSettlementApi = {
  getSettlementLedgers: async (search?: string): Promise<RentedOwnerSettlementLedger[]> => {
    try {
      const res = await apiClient.get<RentedOwnerSettlementLedger[]>('/machine-owners/settlement-ledger', {
        params: { search }
      });
      return res.data || [];
    } catch {
      return [];
    }
  },

  recordOwnerPayout: async (input: OwnerPayoutInput): Promise<RentedOwnerSettlementLedger> => {
    const res = await apiClient.post<RentedOwnerSettlementLedger>('/machine-owners/payout', input);
    return res.data;
  }
};
