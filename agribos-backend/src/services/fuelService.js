import { fuelRepository } from '../repositories/fuelRepository.js';

export const fuelService = {
  getDashboardMetrics: async () => {
    return fuelRepository.getDashboardMetrics();
  },

  getVouchers: async (query) => {
    return fuelRepository.getVouchers(query);
  },

  createVoucher: async (data) => {
    return fuelRepository.createVoucher(data);
  },

  updateVoucherStatus: async (id, status) => {
    return fuelRepository.updateVoucherStatus(id, status);
  },

  getFuelLogs: async () => {
    return fuelRepository.getFuelLogs();
  },

  logFuel: async (data) => {
    return fuelRepository.logFuel(data);
  }
};
