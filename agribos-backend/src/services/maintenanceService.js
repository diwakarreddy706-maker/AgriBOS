import maintenanceRepository from '../repositories/maintenanceRepository.js';

export const maintenanceService = {
  getJobCards: async () => {
    const list = await maintenanceRepository.getJobCards();
    return {
      content: list,
      page: 0,
      pageSize: list.length,
      totalElements: list.length,
      totalPages: 1,
      last: true
    };
  },

  createJobCard: async (data) => {
    return await maintenanceRepository.createJobCard(data);
  },

  getDashboardMetrics: async () => {
    return await maintenanceRepository.getDashboardMetrics();
  }
};

export default maintenanceService;
