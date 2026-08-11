import maintenanceService from '../services/maintenanceService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getJobCards = async (req, res, next) => {
  try {
    const list = await maintenanceService.getJobCards(req.query);
    return sendSuccess(res, 'Job cards fetched', list);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createJobCard = async (req, res, next) => {
  try {
    const item = await maintenanceService.createJobCard(req.body);
    return sendSuccess(res, 'Job card created', item, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await maintenanceService.getDashboardMetrics(req.query);
    return sendSuccess(res, 'Workshop metrics fetched', metrics);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export default { getJobCards, createJobCard, getDashboardMetrics };
