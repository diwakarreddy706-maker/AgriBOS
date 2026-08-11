import { analyticsRepository } from '../repositories/analyticsRepository.js';

export const analyticsService = {
  getMachineProfitability: async (filters) => {
    return analyticsRepository.getMachineProfitability(filters || {});
  },

  getExpenseBreakdown: async (filters) => {
    return analyticsRepository.getExpenseBreakdown(filters || {});
  }
};

export default analyticsService;
