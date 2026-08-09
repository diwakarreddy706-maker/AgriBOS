import inventoryService from '../services/inventoryService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getSpareParts = async (req, res, next) => {
  try {
    const result = await inventoryService.getSpareParts(req.query);
    return sendSuccess(res, 'Spare parts fetched successfully', result);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getLowStockItems = async (req, res, next) => {
  try {
    const list = await inventoryService.getLowStockItems();
    return sendSuccess(res, 'Low stock items fetched', list);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createSparePart = async (req, res, next) => {
  try {
    const item = await inventoryService.createSparePart(req.body);
    return sendSuccess(res, 'Spare part registered', item, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await inventoryService.getDashboardMetrics();
    return sendSuccess(res, 'Inventory metrics fetched', metrics);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export default { getSpareParts, getLowStockItems, createSparePart, getDashboardMetrics };
