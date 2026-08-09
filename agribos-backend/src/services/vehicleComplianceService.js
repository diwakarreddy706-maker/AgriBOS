import { vehicleComplianceRepository } from '../repositories/vehicleComplianceRepository.js';

export const vehicleComplianceService = {
  getComplianceRecords: async (query) => {
    return vehicleComplianceRepository.findAll(query);
  },

  createComplianceRecord: async (data) => {
    if (!data.registrationNumber) {
      throw new Error('Vehicle Registration Number is required');
    }
    return vehicleComplianceRepository.create(data);
  },

  recordRenewal: async (data) => {
    if (!data.vehicleId || !data.docType || !data.newExpiryDate) {
      throw new Error('Vehicle ID, Document Type, and New Expiry Date are required');
    }
    return vehicleComplianceRepository.recordRenewal(data);
  }
};
