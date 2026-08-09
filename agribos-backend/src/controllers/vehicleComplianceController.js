import { vehicleComplianceService } from '../services/vehicleComplianceService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getComplianceRecords = async (req, res, next) => {
  try {
    const records = await vehicleComplianceService.getComplianceRecords(req.query);
    return sendSuccess(res, records, 'Vehicle compliance records retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const recordRenewal = async (req, res, next) => {
  try {
    const result = await vehicleComplianceService.recordRenewal(req.body);
    return sendSuccess(res, result, 'Document renewal recorded successfully');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const createComplianceRecord = async (req, res, next) => {
  try {
    const result = await vehicleComplianceService.createComplianceRecord(req.body);
    return sendSuccess(res, result, 'Vehicle compliance record created successfully', null, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export default { getComplianceRecords, createComplianceRecord, recordRenewal };
