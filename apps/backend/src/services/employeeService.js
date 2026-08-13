import { employeeRepository } from '../repositories/employeeRepository.js';

export const employeeService = {
  getEmployees: async (query) => {
    return employeeRepository.findAll(query);
  },

  createEmployee: async (data) => {
    if (!data.fullName) throw new Error('Full name is required');
    return employeeRepository.create(data);
  },

  deleteEmployee: async (id) => {
    return employeeRepository.softDelete(id);
  }
};
