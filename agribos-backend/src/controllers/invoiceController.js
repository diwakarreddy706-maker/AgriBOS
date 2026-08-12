import invoiceService from '../services/invoiceService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const createInvoice = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const item = await invoiceService.createInvoice(req.body, userId);
    return sendSuccess(res, 'Invoice generated successfully', item, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const item = await invoiceService.getInvoiceById(req.params.id);
    return sendSuccess(res, 'Invoice retrieved', item);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export const listInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '0', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);
    const search = req.query.search || '';
    const invoiceType = req.query.invoiceType || '';
    const list = await invoiceService.listInvoices(page, pageSize, search, invoiceType);
    return sendSuccess(res, 'Invoices fetched', list);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const downloadInvoicePdf = async (req, res) => {
  try {
    const lang = req.query.lang === 'kn' ? 'kn' : 'en';
    const pdfBuffer = await invoiceService.generatePdf(req.params.id, lang);
    const inv = await invoiceService.getInvoiceById(req.params.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${inv.invoiceNumber}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    return res.send(pdfBuffer);
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export default {
  createInvoice,
  getInvoiceById,
  listInvoices,
  downloadInvoicePdf
};
