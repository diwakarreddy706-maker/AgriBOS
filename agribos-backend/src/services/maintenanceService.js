import maintenanceRepository from '../repositories/maintenanceRepository.js';

export const maintenanceService = {
  getJobCards: async (query) => {
    const list = await maintenanceRepository.getJobCards(query || {});
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

  getDashboardMetrics: async (query) => {
    return await maintenanceRepository.getDashboardMetrics(query || {});
  }
};

export default maintenanceService;
