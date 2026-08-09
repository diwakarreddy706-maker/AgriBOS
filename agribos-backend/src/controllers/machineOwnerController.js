import { machineOwnerService } from '../services/machineOwnerService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getOwners = async (req, res, next) => {
  try {
    const result = await machineOwnerService.getOwners(req.query);
    return sendSuccess(res, result.content, 'Machine owners retrieved', {
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

export const createOwner = async (req, res, next) => {
  try {
    const owner = await machineOwnerService.createOwner(req.body);
    return sendSuccess(res, owner, 'Machine owner created successfully', null, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const deleteOwner = async (req, res, next) => {
  try {
    await machineOwnerService.deleteOwner(req.params.id);
    return sendSuccess(res, null, 'Machine owner deleted successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getSettlementLedger = async (req, res, next) => {
  try {
    const ledgers = await machineOwnerService.getSettlementLedgers(req.query.search);
    return sendSuccess(res, ledgers, 'Machine owner settlement ledgers retrieved');
  } catch (error) {
    next(error);
  }
};

export const recordOwnerPayout = async (req, res, next) => {
  try {
    const result = await machineOwnerService.recordOwnerPayout(req.body);
    return sendSuccess(res, result, 'Owner payout recorded successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export default {
  getOwners,
  createOwner,
  deleteOwner,
  getSettlementLedger,
  recordOwnerPayout
};
