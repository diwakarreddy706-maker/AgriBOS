import { query, get, run } from '../db/database.js';

export const receiptRepository = {
  createReceipt: async (data, client = null) => {
    const res = await run(
      `INSERT INTO receipts (
        receipt_number, farmer_id, farmer_payment_id, invoice_id, payment_date,
        previous_balance, payment_amount, remaining_balance, payment_mode, transaction_ref, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.receiptNumber,
        data.farmerId,
        data.farmerPaymentId || null,
        data.invoiceId || null,
        data.paymentDate || new Date().toISOString().split('T')[0],
        data.previousBalance || 0,
        data.paymentAmount || 0,
        data.remainingBalance || 0,
        data.paymentMode || 'CASH',
        data.transactionRef || null,
        data.notes || null,
        data.createdBy || 1
      ],
      client
    );
    return res.id;
  },

  getReceiptById: async (id, client = null) => {
    const r = await get(
      `SELECT rec.*, f.full_name as farmer_name, f.farmer_code, f.mobile_number, f.village_name
       FROM receipts rec
       LEFT JOIN farmers f ON f.id = rec.farmer_id
       WHERE rec.id = ? AND rec.is_deleted = 0`,
      [id],
      client
    );

    if (!r) return null;

    return {
      id: r.id,
      receiptNumber: r.receipt_number,
      farmerId: r.farmer_id,
      farmerName: r.farmer_name,
      farmerCode: r.farmer_code,
      mobileNumber: r.mobile_number,
      villageName: r.village_name,
      farmerPaymentId: r.farmer_payment_id,
      invoiceId: r.invoice_id,
      paymentDate: r.payment_date,
      previousBalance: Number(r.previous_balance),
      paymentAmount: Number(r.payment_amount),
      remainingBalance: Number(r.remaining_balance),
      paymentMode: r.payment_mode,
      transactionRef: r.transaction_ref,
      notes: r.notes,
      createdAt: r.created_at
    };
  },

  listReceipts: async (page = 0, pageSize = 20, search = '') => {
    const offset = page * pageSize;
    let whereClause = 'WHERE rec.is_deleted = 0';
    const params = [];

    if (search) {
      whereClause += ' AND (rec.receipt_number LIKE ? OR f.full_name LIKE ? OR f.mobile_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const countRes = await get(
      `SELECT COUNT(*) as total FROM receipts rec LEFT JOIN farmers f ON f.id = rec.farmer_id ${whereClause}`,
      params
    );

    const totalElements = Number(countRes?.total || 0);

    const rows = await query(
      `SELECT rec.*, f.full_name as farmer_name, f.farmer_code, f.mobile_number, f.village_name
       FROM receipts rec
       LEFT JOIN farmers f ON f.id = rec.farmer_id
       ${whereClause}
       ORDER BY rec.id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const content = rows.map(r => ({
      id: r.id,
      receiptNumber: r.receipt_number,
      farmerId: r.farmer_id,
      farmerName: r.farmer_name || 'N/A',
      farmerCode: r.farmer_code || 'N/A',
      mobileNumber: r.mobile_number || 'N/A',
      villageName: r.village_name || 'N/A',
      paymentDate: r.payment_date,
      paymentAmount: Number(r.payment_amount),
      remainingBalance: Number(r.remaining_balance),
      paymentMode: r.payment_mode,
      createdAt: r.created_at
    }));

    return {
      content,
      page,
      pageSize,
      totalElements,
      totalPages: Math.ceil(totalElements / pageSize) || 1,
      last: page >= Math.ceil(totalElements / pageSize) - 1
    };
  }
};

export default receiptRepository;
