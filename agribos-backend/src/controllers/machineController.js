import { machineService } from '../services/machineService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getMachines = async (req, res, next) => {
  try {
    const result = await machineService.getMachines(req.query);
    return sendSuccess(res, result.content, 'Machines retrieved successfully', {
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

export const getMachineById = async (req, res, next) => {
  try {
    const machine = await machineService.getMachineById(req.params.id);
    return sendSuccess(res, machine, 'Machine details retrieved');
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export const createMachine = async (req, res, next) => {
  try {
    const machine = await machineService.createMachine(req.body);
    return sendSuccess(res, machine, 'Machine created successfully', null, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const machine = await machineService.updateStatus(req.params.id, req.body.status);
    return sendSuccess(res, machine, 'Machine status updated');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const deleteMachine = async (req, res, next) => {
  try {
    await machineService.deleteMachine(req.params.id);
    return sendSuccess(res, null, 'Machine deleted successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export default {
  getMachines,
  getMachineById,
  createMachine,
  updateStatus,
  deleteMachine
};
