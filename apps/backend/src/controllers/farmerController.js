import { farmerService } from '../services/farmerService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getFarmers = async (req, res, next) => {
  try {
    const result = await farmerService.getAllFarmers(req.query);
    return sendSuccess(res, result.content, 'Farmers retrieved successfully', {
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

export const getFarmerById = async (req, res, next) => {
  try {
    const farmer = await farmerService.getFarmerById(req.params.id);
    return sendSuccess(res, farmer, 'Farmer details retrieved');
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export const createFarmer = async (req, res, next) => {
  try {
    const farmer = await farmerService.createFarmer(req.body);
    return sendSuccess(res, farmer, 'Farmer created successfully', null, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateFarmer = async (req, res, next) => {
  try {
    const farmer = await farmerService.updateFarmer(req.params.id, req.body);
    return sendSuccess(res, farmer, 'Farmer updated successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const deleteFarmer = async (req, res, next) => {
  try {
    await farmerService.deleteFarmer(req.params.id);
    return sendSuccess(res, null, 'Farmer deleted successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getLedgerAccounts = async (req, res, next) => {
  try {
    const accounts = await farmerService.getLedgerAccounts(req.query.search);
    return sendSuccess(res, accounts, 'Farmer ledger accounts retrieved');
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const { farmerId } = req.params;
    const { billId, paymentAmount, paymentMode, transactionRef } = req.body;
    await farmerService.recordPayment(farmerId, billId, paymentAmount, paymentMode, transactionRef);
    return sendSuccess(res, null, 'Farmer payment recorded successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export default {
  getFarmers,
  getFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
  getLedgerAccounts,
  recordPayment
};
