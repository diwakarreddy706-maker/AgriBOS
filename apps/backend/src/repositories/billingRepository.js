import { query, get, run } from '../db/sqlite.js';

export const billingRepository = {
  getInvoices: async () => {
    const rows = await query(`
      SELECT ci.*, f.full_name as farmer_name 
      FROM customer_invoices ci
      LEFT JOIN farmers f ON f.id = ci.farmer_id
      WHERE ci.is_deleted = 0
      ORDER BY ci.id DESC
    `);
    return rows.map(r => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      farmerId: r.farmer_id,
      farmerName: r.farmer_name || 'N/A',
      invoiceDate: r.invoice_date,
      totalAmount: r.total_amount,
      paidAmount: r.paid_amount,
      balanceDue: r.total_amount - r.paid_amount,
      status: r.status
    }));
  },

  createInvoice: async (data) => {
    const invNo = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await run(
      `INSERT INTO customer_invoices (invoice_number, farmer_id, invoice_date, total_amount, paid_amount, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        invNo,
        data.farmerId || 1,
        data.invoiceDate || new Date().toISOString().split('T')[0],
        data.totalAmount || 0,
        data.paidAmount || 0,
        data.status || 'UNPAID'
      ]
    );
    return get('SELECT * FROM customer_invoices WHERE id = ?', [result.id]);
  },

  getFinanceSummary: async () => {
    const rev = await get('SELECT SUM(total_amount) as total FROM work_entries WHERE is_deleted = 0');
    const rec = await get('SELECT SUM(paid_amount) as total FROM work_entries WHERE is_deleted = 0');
    const due = await get('SELECT SUM(balance_due) as total FROM work_entries WHERE is_deleted = 0');
    return {
      totalBillingRevenueMonth: rev?.total || 0,
      totalCashReceived: rec?.total || 0,
      totalOutstandingUdhar: due?.total || 0
    };
  }
};

export default billingRepository;
