import receiptRepository from '../repositories/receiptRepository.js';
import sequenceService from './sequenceService.js';
import { generateReceiptPdfBuffer } from '../utils/pdfGenerator.js';
import { runInTransaction, get, run } from '../db/database.js';

export const receiptService = {
  createReceipt: async (data, userId = 1) => {
    if (!data.farmerId) {
      throw new Error('Farmer ID is required to create a payment receipt');
    }

    const paymentAmount = Number(data.paymentAmount || data.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    return await runInTransaction(async (tx) => {
      // 1. Check farmer existence
      const farmer = await tx.get('SELECT * FROM farmers WHERE id = ? AND is_deleted = 0', [data.farmerId]);
      if (!farmer) {
        throw new Error(`Farmer with ID ${data.farmerId} not found`);
      }

      // 2. Compute current Udhar balance for farmer
      const dueRes = await tx.get(
        'SELECT SUM(balance_due) as total_due FROM work_entries WHERE farmer_id = ? AND is_deleted = 0',
        [data.farmerId]
      );
      const previousBalance = Number(dueRes?.total_due || 0);
      const remainingBalance = Math.max(0, previousBalance - paymentAmount);

      // 3. Record farmer payment in farmer_payments
      const payRes = await tx.run(
        `INSERT INTO farmer_payments (farmer_id, bill_id, payment_amount, payment_mode, transaction_ref, remarks)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.farmerId,
          data.invoiceId || null,
          paymentAmount,
          data.paymentMode || 'CASH',
          data.transactionRef || null,
          data.notes || 'Udhar Payment Receipt'
        ]
      );

      // 4. Generate Unique Receipt Number Atomically using existing transaction
      const receiptNumber = await sequenceService.getNextSequenceNumber('REC', new Date().getFullYear(), tx);

      // 5. Save Receipt Record
      const receiptId = await receiptRepository.createReceipt({
        receiptNumber,
        farmerId: data.farmerId,
        farmerPaymentId: payRes.id,
        invoiceId: data.invoiceId || null,
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        previousBalance,
        paymentAmount,
        remainingBalance,
        paymentMode: data.paymentMode || 'CASH',
        transactionRef: data.transactionRef || null,
        notes: data.notes || null,
        createdBy: userId
      }, tx);

      return await receiptRepository.getReceiptById(receiptId, tx);
    });
  },

  getReceiptById: async (id) => {
    const rec = await receiptRepository.getReceiptById(id);
    if (!rec) {
      throw new Error(`Receipt #${id} not found`);
    }
    return rec;
  },

  listReceipts: async (page = 0, pageSize = 20, search = '') => {
    return await receiptRepository.listReceipts(page, pageSize, search);
  },

  generatePdf: async (id, lang = 'en') => {
    const rec = await receiptRepository.getReceiptById(id);
    if (!rec) {
      throw new Error(`Receipt #${id} not found`);
    }

    const farmer = {
      full_name: rec.farmerName,
      farmer_code: rec.farmerCode,
      mobile_number: rec.mobileNumber,
      village_name: rec.villageName
    };

    return await generateReceiptPdfBuffer(rec, farmer, lang);
  }
};

export default receiptService;
