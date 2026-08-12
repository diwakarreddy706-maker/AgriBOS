import receiptService from '../services/receiptService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const createReceipt = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const item = await receiptService.createReceipt(req.body, userId);
    return sendSuccess(res, 'Payment receipt generated successfully', item, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getReceiptById = async (req, res) => {
  try {
    const item = await receiptService.getReceiptById(req.params.id);
    return sendSuccess(res, 'Receipt retrieved', item);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export const listReceipts = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '0', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);
    const search = req.query.search || '';
    const list = await receiptService.listReceipts(page, pageSize, search);
    return sendSuccess(res, 'Receipts fetched', list);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const downloadReceiptPdf = async (req, res) => {
  try {
    const lang = req.query.lang === 'kn' ? 'kn' : 'en';
    const pdfBuffer = await receiptService.generatePdf(req.params.id, lang);
    const rec = await receiptService.getReceiptById(req.params.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Receipt-${rec.receiptNumber}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    return res.send(pdfBuffer);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export default {
  createReceipt,
  getReceiptById,
  listReceipts,
  downloadReceiptPdf
};
