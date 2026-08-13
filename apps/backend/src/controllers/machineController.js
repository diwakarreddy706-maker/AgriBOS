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
    return sendError(res, error.message, error.statusCode || 404);
  }
};

export const createMachine = async (req, res, next) => {
  try {
    const machine = await machineService.createMachine(req.body);
    return sendSuccess(res, machine, 'Machine created successfully', null, 201);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 400);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const machine = await machineService.updateStatus(req.params.id, req.body.status);
    return sendSuccess(res, machine, 'Machine status updated');
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 400);
  }
};

/**
 * @openapi
 * /machines/{id}/telematics:
 *   post:
 *     summary: Record telematics data (latitude, longitude, speed, engine hours)
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               speed:
 *                 type: number
 *               engineHours:
 *                 type: number
 *     responses:
 *       200:
 *         description: Telemetry data recorded
 *       400:
 *         description: Invalid coordinates or parameters
 *   get:
 *     summary: Retrieve telematics history for a machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Telematics history retrieved
 */
export const postTelematics = async (req, res, next) => {
  try {
    const machine = await machineService.recordTelematics(req.params.id, req.body);
    return sendSuccess(res, machine, 'Telemetry data recorded successfully');
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 400);
  }
};

export const getTelematics = async (req, res, next) => {
  try {
    const history = await machineService.getTelematicsHistory(req.params.id, req.query.limit);
    return sendSuccess(res, history, 'Telematics history retrieved successfully');
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 404);
  }
};

export const completeService = async (req, res, next) => {
  try {
    const machine = await machineService.completeServiceMaintenance(req.params.id);
    return sendSuccess(res, machine, 'Service maintenance completed and status reset to OK');
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 400);
  }
};

export const deleteMachine = async (req, res, next) => {
  try {
    await machineService.deleteMachine(req.params.id);
    return sendSuccess(res, null, 'Machine deleted successfully');
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 400);
  }
};

export default {
  getMachines,
  getMachineById,
  createMachine,
  updateStatus,
  postTelematics,
  getTelematics,
  completeService,
  deleteMachine
};
