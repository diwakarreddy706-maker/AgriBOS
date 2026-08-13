import billingService from '../services/billingService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getInvoices = async (req, res, next) => {
  try {
    const list = await billingService.getInvoices();
    return sendSuccess(res, 'Invoices fetched', list);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const item = await billingService.createInvoice(req.body);
    return sendSuccess(res, 'Invoice created', item, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getFinanceSummary = async (req, res, next) => {
  try {
    const metrics = await billingService.getFinanceSummary();
    return sendSuccess(res, 'Finance summary fetched', metrics);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export default { getInvoices, createInvoice, getFinanceSummary };
