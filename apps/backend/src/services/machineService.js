import { machineRepository } from '../repositories/machineRepository.js';

import { isTractorType } from '../utils/machineTypes.js';

export const machineService = {
  getMachines: async (query) => {
    return machineRepository.findAll(query);
  },

  getMachineById: async (id) => {
    const machine = await machineRepository.findById(id);
    if (!machine) {
      const err = new Error('Machine not found');
      err.statusCode = 404;
      throw err;
    }
    return machine;
  },

  createMachine: async (data) => {
    if (!data.makeModel && !data.machineName) {
      const err = new Error('Machine make/model or name is required');
      err.statusCode = 400;
      throw err;
    }
    if (isTractorType(data.machineType) && data.ownershipType === 'RENTED') {
      const err = new Error('Tractors, Rotavators, Balers and Implements must be Company Owned (OWNED)');
      err.statusCode = 400;
      throw err;
    }
    return machineRepository.create(data);
  },

  updateStatus: async (id, status) => {
    return machineRepository.updateStatus(id, status);
  },

  recordTelematics: async (id, data) => {
    const lat = Number(data.latitude);
    const lon = Number(data.longitude);
    const speed = data.speed !== undefined ? Number(data.speed) : 0;
    const hours = data.engineHours !== undefined && data.engineHours !== null ? Number(data.engineHours) : undefined;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      const err = new Error('Invalid latitude (-90 to +90)');
      err.statusCode = 400;
      throw err;
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      const err = new Error('Invalid longitude (-180 to +180)');
      err.statusCode = 400;
      throw err;
    }

    if (isNaN(speed) || speed < 0) {
      const err = new Error('Speed must be >= 0');
      err.statusCode = 400;
      throw err;
    }

    if (hours !== undefined && (isNaN(hours) || hours < 0)) {
      const err = new Error('Engine hours must be >= 0');
      err.statusCode = 400;
      throw err;
    }

    return machineRepository.recordTelematics(id, {
      latitude: lat,
      longitude: lon,
      speed,
      engineHours: hours,
      recordedAt: data.recordedAt,
      source: data.source || 'TELEMATICS_API'
    });
  },

  getTelematicsHistory: async (id, limit) => {
    await machineService.getMachineById(id);
    return machineRepository.getTelematicsHistory(id, limit);
  },

  completeServiceMaintenance: async (id) => {
    await machineService.getMachineById(id);
    return machineRepository.completeServiceMaintenance(id);
  },

  deleteMachine: async (id) => {
    return machineRepository.softDelete(id);
  }
};
