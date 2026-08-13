import { operationsRepository } from '../repositories/operationsRepository.js';
import { get } from '../db/sqlite.js';
import { areTypesCompatible } from '../utils/machineTypes.js';

export const operationsService = {
  getDashboardMetrics: async () => {
    return operationsRepository.getDashboardMetrics();
  },

  getBookings: async (query) => {
    return operationsRepository.findBookings(query);
  },

  getWorkExecutions: async (query) => {
    return operationsRepository.getWorkExecutions(query);
  },

  createBooking: async (data) => {
    return operationsRepository.createBooking(data);
  },

  updateBookingStatus: async (id, status) => {
    return operationsRepository.updateBookingStatus(id, status);
  },

  assignMachine: async (bookingId, machineId) => {
    const booking = await get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found');

    const machine = await get('SELECT * FROM machines WHERE id = ?', [machineId]);
    if (!machine) throw new Error('Machine not found');

    if (!areTypesCompatible(booking.machine_type, machine.machine_type)) {
      throw new Error(`Machine type mismatch: Cannot assign ${machine.machine_type} machine to ${booking.machine_type} booking`);
    }

    return operationsRepository.assignMachine(bookingId, machineId);
  },

  createDispatch: async (data) => {
    const booking = await get('SELECT * FROM bookings WHERE id = ?', [data.bookingId]);
    if (!booking) throw new Error('Booking not found');

    const machine = await get('SELECT * FROM machines WHERE id = ?', [data.machineId]);
    if (!machine) throw new Error('Machine not found');

    if (!areTypesCompatible(booking.machine_type, machine.machine_type)) {
      throw new Error(`Machine type mismatch: Cannot dispatch ${machine.machine_type} machine for ${booking.machine_type} booking`);
    }

    return operationsRepository.createDispatch(data);
  },

  logWorkExecution: async (data) => {
    if (data.bookingId && data.machineId) {
      const booking = await get('SELECT * FROM bookings WHERE id = ?', [data.bookingId]);
      const machine = await get('SELECT * FROM machines WHERE id = ?', [data.machineId]);
      if (booking && machine && !areTypesCompatible(booking.machine_type, machine.machine_type)) {
        throw new Error(`Machine type mismatch: Cannot log work execution for ${machine.machine_type} machine against ${booking.machine_type} booking`);
      }
    }
    return operationsRepository.logWorkExecution(data);
  },

  assignOperator: async (bookingId, operatorEmployeeId, driverEmployeeId) => {
    return operationsRepository.assignOperator(bookingId, operatorEmployeeId, driverEmployeeId);
  },

  recordAdvancePayment: async (bookingId, advanceAmount) => {
    return operationsRepository.recordAdvancePayment(bookingId, advanceAmount);
  }
};
