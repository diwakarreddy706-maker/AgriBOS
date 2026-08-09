import { machineRepository } from '../repositories/machineRepository.js';

export const machineService = {
  getMachines: async (query) => {
    return machineRepository.findAll(query);
  },

  getMachineById: async (id) => {
    const machine = await machineRepository.findById(id);
    if (!machine) throw new Error('Machine not found');
    return machine;
  },

  createMachine: async (data) => {
    if (!data.makeModel && !data.machineName) {
      throw new Error('Machine make/model or name is required');
    }
    return machineRepository.create(data);
  },

  updateStatus: async (id, status) => {
    return machineRepository.updateStatus(id, status);
  },

  deleteMachine: async (id) => {
    return machineRepository.softDelete(id);
  }
};
