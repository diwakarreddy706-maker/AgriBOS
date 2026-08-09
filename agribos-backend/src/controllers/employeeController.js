import { employeeService } from '../services/employeeService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getEmployees = async (req, res, next) => {
  try {
    const result = await employeeService.getEmployees(req.query);
    return sendSuccess(res, result.content, 'Employees retrieved', {
      page: result.page,
      pageSize: result.pageSize,
      totalElements: result.totalElements,
      totalPages: result.totalPages,
      last: result.last
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    return sendSuccess(res, employee, 'Employee created successfully', null, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    await employeeService.deleteEmployee(req.params.id);
    return sendSuccess(res, null, 'Employee deleted successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export default {
  getEmployees,
  createEmployee,
  deleteEmployee
};
