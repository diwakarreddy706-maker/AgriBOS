import billingRepository from '../repositories/billingRepository.js';

export const billingService = {
  getInvoices: async () => {
    const list = await billingRepository.getInvoices();
    return {
      content: list,
      page: 0,
      pageSize: list.length,
      totalElements: list.length,
      totalPages: 1,
      last: true
    };
  },

  createInvoice: async (data) => {
    return await billingRepository.createInvoice(data);
  },

  getFinanceSummary: async () => {
    return await billingRepository.getFinanceSummary();
  }
};

export default billingService;
