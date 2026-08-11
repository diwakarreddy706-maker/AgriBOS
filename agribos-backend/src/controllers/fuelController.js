import { fuelService } from '../services/fuelService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await fuelService.getDashboardMetrics();
    return sendSuccess(res, metrics, 'Fuel dashboard metrics retrieved');
  } catch (error) {
    next(error);
  }
};

export const getVouchers = async (req, res, next) => {
  try {
    const result = await fuelService.getVouchers(req.query);
    return sendSuccess(res, result.content, 'Fuel vouchers retrieved', {
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

export const createVoucher = async (req, res, next) => {
  try {
    const voucher = await fuelService.createVoucher(req.body);
    return sendSuccess(res, voucher, 'Fuel voucher created successfully', null, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateVoucherStatus = async (req, res, next) => {
  try {
    const voucher = await fuelService.updateVoucherStatus(req.params.id, req.query.status || req.body.status);
    return sendSuccess(res, voucher, 'Fuel voucher status updated');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getFuelLogs = async (req, res, next) => {
  try {
    const logs = await fuelService.getFuelLogs(req.query);
    return sendSuccess(res, { content: logs }, 'Fuel logs retrieved');
  } catch (error) {
    next(error);
  }
};

export const logFuel = async (req, res, next) => {
  try {
    const log = await fuelService.logFuel(req.body);
    return sendSuccess(res, log, 'Fuel purchase logged successfully', null, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export default {
  getDashboardMetrics,
  getVouchers,
  createVoucher,
  updateVoucherStatus,
  getFuelLogs,
  logFuel
};
