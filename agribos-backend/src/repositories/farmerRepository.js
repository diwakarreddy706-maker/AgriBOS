import { get, query, run } from '../db/sqlite.js';

export const farmerRepository = {
  findAll: async ({ search, page = 0, size = 10 }) => {
    const pageNum = parseInt(page, 10) || 0;
    const pageSize = parseInt(size, 10) || 10;
    const offset = pageNum * pageSize;

    let sql = 'SELECT * FROM farmers WHERE is_deleted = 0';
    let countSql = 'SELECT COUNT(*) as count FROM farmers WHERE is_deleted = 0';
    const params = [];

    if (search) {
      const searchLike = `%${search}%`;
      sql += ' AND (full_name LIKE ? OR farmer_code LIKE ? OR mobile_number LIKE ? OR village_name LIKE ?)';
      countSql += ' AND (full_name LIKE ? OR farmer_code LIKE ? OR mobile_number LIKE ? OR village_name LIKE ?)';
      params.push(searchLike, searchLike, searchLike, searchLike);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    const rows = await query(sql, [...params, pageSize, offset]);
    const totalRow = await get(countSql, params);
    const totalElements = totalRow ? totalRow.count : 0;
    const totalPages = Math.ceil(totalElements / pageSize) || (totalElements > 0 ? 1 : 0);

    return {
      content: rows,
      page: pageNum,
      pageSize,
      totalElements,
      totalPages,
      last: pageNum >= totalPages - 1
    };
  },

  findById: async (id) => {
    return get('SELECT * FROM farmers WHERE id = ? AND is_deleted = 0', [id]);
  },

  create: async (data) => {
    const code = data.farmerCode || `FAR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const result = await run(
      `INSERT INTO farmers (farmer_code, full_name, father_name, mobile_number, village_name, taluk_name, district_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        data.fullName,
        data.fatherName || '',
        data.mobileNumber,
        data.villageName,
        data.talukName || data.villageName,
        data.districtName || 'Raichur',
        data.status || 'ACTIVE'
      ]
    );
    return get('SELECT * FROM farmers WHERE id = ?', [result.id]);
  },

  update: async (id, data) => {
    await run(
      `UPDATE farmers SET full_name = ?, father_name = ?, mobile_number = ?, village_name = ?, taluk_name = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [data.fullName, data.fatherName, data.mobileNumber, data.villageName, data.talukName, data.status, id]
    );
    return get('SELECT * FROM farmers WHERE id = ?', [id]);
  },

  softDelete: async (id) => {
    return run('UPDATE farmers SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  },

  getLedgerAccounts: async (search) => {
    let sql = `
      SELECT 
        f.id,
        f.farmer_code AS farmerCode,
        f.full_name AS fullName,
        f.father_name AS fatherName,
        f.mobile_number AS mobileNumber,
        f.village_name AS villageName,
        f.taluk_name AS talukName,
        f.status,
        COALESCE(SUM(w.total_amount), 0) AS totalBilled,
        COALESCE(SUM(w.advance_amount), 0) AS totalAdvance,
        COALESCE(SUM(w.paid_amount), 0) AS totalPaid,
        COALESCE(SUM(w.balance_due), 0) AS totalBalance,
        COUNT(w.id) AS totalWorkSessions
      FROM farmers f
      LEFT JOIN work_entries w ON w.farmer_id = f.id AND w.is_deleted = 0
    `;
    const params = [];
    if (search) {
      const q = `%${search}%`;
      sql += ' AND (f.full_name LIKE ? OR f.farmer_code LIKE ? OR f.mobile_number LIKE ? OR f.village_name LIKE ?)';
      params.push(q, q, q, q);
    }
    sql += ' GROUP BY f.id ORDER BY f.id DESC';
    const rows = await query(sql, params);

    return rows.map(r => ({
      ...r,
      fatherName: r.fatherName || '',
      udharBalance: r.totalBalance,
      workSessionsCount: r.totalWorkSessions
    }));
  },

  recordPayment: async (farmerId, billId, paymentAmount, paymentMode = 'CASH', transactionRef = '') => {
    return await runInTransaction(async () => {
      const result = await run(
        `INSERT INTO farmer_payments (farmer_id, bill_id, payment_amount, payment_mode, transaction_ref) VALUES (?, ?, ?, ?, ?)`,
        [farmerId, billId, paymentAmount, paymentMode, transactionRef]
      );

      if (billId) {
        const entry = await get('SELECT * FROM work_entries WHERE id = ?', [billId]);
        if (entry) {
          const newPaid = (entry.paid_amount || 0) + paymentAmount;
          const newBalance = Math.max(0, (entry.total_amount || 0) - (entry.advance_amount || 0) - newPaid);
          const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';
          await run(
            'UPDATE work_entries SET paid_amount = ?, balance_due = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newPaid, newBalance, newStatus, billId]
          );
        }
      }
      return result;
    });
  }
};
