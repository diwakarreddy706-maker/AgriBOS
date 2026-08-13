import invoiceRepository from '../repositories/invoiceRepository.js';
import sequenceService from './sequenceService.js';
import { generateInvoicePdfBuffer } from '../utils/pdfGenerator.js';
import { get } from '../db/database.js';

export const invoiceService = {
  createInvoice: async (data, userId = 1) => {
    // 1. Idempotency Check for source transactions
    if (data.sourceTransactionType && data.sourceTransactionId) {
      const existing = await invoiceRepository.findInvoiceBySource(
        data.sourceTransactionType,
        data.sourceTransactionId
      );
      if (existing) {
        return await invoiceRepository.getInvoiceById(existing.id);
      }
    }

    if (!data.farmerId) {
      throw new Error('Farmer ID is required to create an invoice');
    }

    // Verify farmer exists
    const farmer = await get('SELECT * FROM farmers WHERE id = ? AND is_deleted = 0', [data.farmerId]);
    if (!farmer) {
      throw new Error(`Farmer with ID ${data.farmerId} not found`);
    }

    // 2. Validate Items & Financial Calculations
    let items = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) {
      // Create a default item line if none supplied
      items = [{
        itemName: data.notes || 'Agricultural Service / Sale',
        itemNameKn: 'ಕೃಷಿ ಸೇವೆ / ಮಾರಾಟ',
        quantity: 1,
        unit: 'Job',
        unitPrice: Number(data.subtotal || data.grandTotal || 0),
        totalPrice: Number(data.subtotal || data.grandTotal || 0)
      }];
    }

    let subtotal = 0;
    const validatedItems = items.map(it => {
      const qty = Math.max(0, Number(it.quantity) || 1);
      const rate = Math.max(0, Number(it.unitPrice || it.rate) || 0);
      const total = qty * rate;
      subtotal += total;
      return {
        itemType: it.itemType || 'SERVICE',
        itemName: it.itemName || it.name || 'Service Item',
        itemNameKn: it.itemNameKn || null,
        quantity: qty,
        unit: it.unit || 'PCS',
        unitPrice: rate,
        totalPrice: total
      };
    });

    const discount = Math.max(0, Number(data.discount) || 0);
    const taxAmount = Math.max(0, Number(data.taxAmount) || 0);
    const grandTotal = Math.max(0, subtotal - discount + taxAmount);
    const paidAmount = Math.max(0, Number(data.paidAmount) || 0);
    const balanceDue = Math.max(0, grandTotal - paidAmount);
    const status = balanceDue === 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'UNPAID');

    // 3. Generate Unique Invoice Number Atomically
    const invoiceNumber = await sequenceService.getNextSequenceNumber('INV');

    // 4. Save Invoice
    const invoiceData = {
      invoiceNumber,
      invoiceType: data.invoiceType || 'PRODUCT_SALE',
      farmerId: data.farmerId,
      sourceTransactionType: data.sourceTransactionType || null,
      sourceTransactionId: data.sourceTransactionId || null,
      invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
      subtotal,
      discount,
      taxAmount,
      grandTotal,
      paidAmount,
      balanceDue,
      status,
      notes: data.notes || null,
      createdBy: userId
    };

    const invoiceId = await invoiceRepository.createInvoice(invoiceData, validatedItems);
    return await invoiceRepository.getInvoiceById(invoiceId);
  },

  getInvoiceById: async (id) => {
    const inv = await invoiceRepository.getInvoiceById(id);
    if (!inv) {
      throw new Error(`Invoice #${id} not found`);
    }
    return inv;
  },

  listInvoices: async (page = 0, pageSize = 20, search = '', invoiceType = '') => {
    return await invoiceRepository.listInvoices(page, pageSize, search, invoiceType);
  },

  generatePdf: async (id, lang = 'en') => {
    const inv = await invoiceRepository.getInvoiceById(id);
    if (!inv) {
      throw new Error(`Invoice #${id} not found`);
    }

    const farmer = {
      full_name: inv.farmerName,
      farmer_code: inv.farmerCode,
      mobile_number: inv.mobileNumber,
      village_name: inv.villageName
    };

    return await generateInvoicePdfBuffer(inv, inv.items, farmer, lang);
  }
};

export default invoiceService;
