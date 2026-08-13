import inventoryRepository from '../repositories/inventoryRepository.js';

export const inventoryService = {
  getSpareParts: async (params) => {
    const list = await inventoryRepository.getSpareParts(params);
    return {
      content: list,
      page: 0,
      pageSize: list.length,
      totalElements: list.length,
      totalPages: 1,
      last: true
    };
  },

  getLowStockItems: async () => {
    return await inventoryRepository.getLowStockItems();
  },

  createSparePart: async (data) => {
    if (!data.partNumber || !data.partName || !data.category) {
      throw new Error('Part Number, Part Name, and Category are required');
    }
    return await inventoryRepository.createSparePart(data);
  },

  getDashboardMetrics: async () => {
    return await inventoryRepository.getDashboardMetrics();
  }
};

export default inventoryService;
