import { machineOwnerRepository } from '../repositories/machineOwnerRepository.js';

export const machineOwnerService = {
  getOwners: async (query) => {
    return machineOwnerRepository.findAll(query);
  },

  createOwner: async (data) => {
    if (!data.fullName) throw new Error('Full name is required');
    return machineOwnerRepository.create(data);
  },

  deleteOwner: async (id) => {
    return machineOwnerRepository.softDelete(id);
  },

  getSettlementLedgers: async (search, machineType) => {
    return machineOwnerRepository.getSettlementLedgers(search, machineType);
  },

  recordOwnerPayout: async (input) => {
    if (!input.ownerId || !input.amount) throw new Error('Owner ID and amount are required');
    return machineOwnerRepository.recordOwnerPayout(input);
  }
};
