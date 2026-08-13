import payablesRepository from '../repositories/payablesRepository.js';

export const payablesService = {
  getPayrollEntries: async () => {
    const list = await payablesRepository.getPayrollEntries();
    return {
      content: list,
      page: 0,
      pageSize: list.length,
      totalElements: list.length,
      totalPages: 1,
      last: true
    };
  },

  disbursePayroll: async (data) => {
    return await payablesRepository.disbursePayroll(data);
  }
};

export default payablesService;
