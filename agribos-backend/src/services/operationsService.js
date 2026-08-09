import { operationsRepository } from '../repositories/operationsRepository.js';

export const operationsService = {
  getDashboardMetrics: async () => {
    return operationsRepository.getDashboardMetrics();
  },

  getBookings: async (query) => {
    return operationsRepository.findBookings(query);
  },

  createBooking: async (data) => {
    return operationsRepository.createBooking(data);
  },

  updateBookingStatus: async (id, status) => {
    return operationsRepository.updateBookingStatus(id, status);
  },

  assignMachine: async (bookingId, machineId) => {
    return operationsRepository.assignMachine(bookingId, machineId);
  },

  createDispatch: async (data) => {
    return operationsRepository.createDispatch(data);
  },

  logWorkExecution: async (data) => {
    return operationsRepository.logWorkExecution(data);
  }
};
