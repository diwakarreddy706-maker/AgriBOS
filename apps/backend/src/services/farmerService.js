import { farmerRepository } from '../repositories/farmerRepository.js';

export const farmerService = {
  getAllFarmers: async (query) => {
    return farmerRepository.findAll(query);
  },

  getFarmerById: async (id) => {
    const farmer = await farmerRepository.findById(id);
    if (!farmer) throw new Error('Farmer not found');
    return farmer;
  },

  createFarmer: async (data) => {
    if (!data.fullName || !data.mobileNumber || !data.villageName) {
      throw new Error('Full name, mobile number, and village name are required');
    }
    return farmerRepository.create(data);
  },

  updateFarmer: async (id, data) => {
    const existing = await farmerRepository.findById(id);
    if (!existing) throw new Error('Farmer not found');
    return farmerRepository.update(id, { ...existing, ...data });
  },

  deleteFarmer: async (id) => {
    const existing = await farmerRepository.findById(id);
    if (!existing) throw new Error('Farmer not found');
    return farmerRepository.softDelete(id);
  },

  getLedgerAccounts: async (search) => {
    return farmerRepository.getLedgerAccounts(search);
  },

  recordPayment: async (farmerId, billId, paymentAmount, paymentMode, transactionRef) => {
    return farmerRepository.recordPayment(farmerId, billId, paymentAmount, paymentMode, transactionRef);
  }
};
