import { query, get, run } from '../db/database.js';

export const invoiceRepository = {
  findInvoiceBySource: async (sourceType, sourceId, client = null) => {
    if (!sourceType || !sourceId) return null;
    return await get(
      'SELECT * FROM invoices WHERE source_transaction_type = ? AND source_transaction_id = ? AND is_deleted = 0',
      [sourceType, sourceId],
      client
    );
  },

  createInvoice: async (data, items = [], client = null) => {
    const res = await run(
      `INSERT INTO invoices (
        invoice_number, invoice_type, farmer_id, source_transaction_type, source_transaction_id,
        invoice_date, subtotal, discount, tax_amount, grand_total, paid_amount, balance_due,
        status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.invoiceNumber,
        data.invoiceType || 'PRODUCT_SALE',
        data.farmerId,
        data.sourceTransactionType || null,
        data.sourceTransactionId || null,
        data.invoiceDate || new Date().toISOString().split('T')[0],
        data.subtotal || 0,
        data.discount || 0,
        data.taxAmount || 0,
        data.grandTotal || 0,
        data.paidAmount || 0,
        data.balanceDue || 0,
        data.status || 'UNPAID',
        data.notes || null,
        data.createdBy || 1
      ],
      client
    );

    const invoiceId = res.id;

    for (const item of items) {
      await run(
        `INSERT INTO invoice_items (
          invoice_id, item_type, item_name, item_name_kn, quantity, unit, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.itemType || 'SERVICE',
          item.itemName,
          item.itemNameKn || null,
          item.quantity || 1,
          item.unit || 'PCS',
          item.unitPrice || 0,
          item.totalPrice || 0
        ],
        client
      );
    }

    return invoiceId;
  },

  getInvoiceById: async (id, client = null) => {
    const invoice = await get(
      `SELECT i.*, f.full_name as farmer_name, f.farmer_code, f.mobile_number, f.village_name
       FROM invoices i
       LEFT JOIN farmers f ON f.id = i.farmer_id
       WHERE i.id = ? AND i.is_deleted = 0`,
      [id],
      client
    );

    if (!invoice) return null;

    const items = await query(
      `SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC`,
      [id],
      client
    );

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      invoiceType: invoice.invoice_type,
      farmerId: invoice.farmer_id,
      farmerName: invoice.farmer_name,
      farmerCode: invoice.farmer_code,
      mobileNumber: invoice.mobile_number,
      villageName: invoice.village_name,
      sourceTransactionType: invoice.source_transaction_type,
      sourceTransactionId: invoice.source_transaction_id,
      invoiceDate: invoice.invoice_date,
      subtotal: Number(invoice.subtotal),
      discount: Number(invoice.discount),
      taxAmount: Number(invoice.tax_amount),
      grandTotal: Number(invoice.grand_total),
      paidAmount: Number(invoice.paid_amount),
      balanceDue: Number(invoice.balance_due),
      status: invoice.status,
      notes: invoice.notes,
      createdAt: invoice.created_at,
      items: items.map(it => ({
        id: it.id,
        itemType: it.item_type,
        itemName: it.item_name,
        itemNameKn: it.item_name_kn,
        quantity: Number(it.quantity),
        unit: it.unit,
        unitPrice: Number(it.unit_price),
        totalPrice: Number(it.total_price)
      }))
    };
  },

  listInvoices: async (page = 0, pageSize = 20, search = '', invoiceType = '') => {
    const offset = page * pageSize;
    let whereClause = 'WHERE i.is_deleted = 0';
    const params = [];

    if (search) {
      whereClause += ' AND (i.invoice_number LIKE ? OR f.full_name LIKE ? OR f.mobile_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (invoiceType) {
      whereClause += ' AND i.invoice_type = ?';
      params.push(invoiceType);
    }

    const countRes = await get(
      `SELECT COUNT(*) as total FROM invoices i LEFT JOIN farmers f ON f.id = i.farmer_id ${whereClause}`,
      params
    );

    const totalElements = Number(countRes?.total || 0);

    const rows = await query(
      `SELECT i.*, f.full_name as farmer_name, f.farmer_code, f.mobile_number, f.village_name
       FROM invoices i
       LEFT JOIN farmers f ON f.id = i.farmer_id
       ${whereClause}
       ORDER BY i.id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const content = rows.map(r => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      invoiceType: r.invoice_type,
      farmerId: r.farmer_id,
      farmerName: r.farmer_name || 'N/A',
      farmerCode: r.farmer_code || 'N/A',
      mobileNumber: r.mobile_number || 'N/A',
      villageName: r.village_name || 'N/A',
      invoiceDate: r.invoice_date,
      grandTotal: Number(r.grand_total),
      paidAmount: Number(r.paid_amount),
      balanceDue: Number(r.balance_due),
      status: r.status,
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

export default invoiceRepository;
