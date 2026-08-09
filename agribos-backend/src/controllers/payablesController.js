import payablesService from '../services/payablesService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getPayrollEntries = async (req, res, next) => {
  try {
    const list = await payablesService.getPayrollEntries();
    return sendSuccess(res, 'Payroll entries fetched', list);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const disbursePayroll = async (req, res, next) => {
  try {
    const item = await payablesService.disbursePayroll(req.body);
    return sendSuccess(res, 'Payroll disbursed', item, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export default { getPayrollEntries, disbursePayroll };
