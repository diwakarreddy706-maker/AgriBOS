import { get, query, run } from '../db/sqlite.js';

export const machineOwnerRepository = {
  findAll: async ({ search, page = 0, size = 10 }) => {
    const pageNum = parseInt(page, 10) || 0;
    const pageSize = parseInt(size, 10) || 10;
    const offset = pageNum * pageSize;

    let sql = 'SELECT * FROM machine_owners WHERE is_deleted = 0';
    let countSql = 'SELECT COUNT(*) as count FROM machine_owners WHERE is_deleted = 0';
    const params = [];

    if (search) {
      const q = `%${search}%`;
      sql += ' AND (full_name LIKE ? OR owner_code LIKE ? OR mobile_number LIKE ?)';
      countSql += ' AND (full_name LIKE ? OR owner_code LIKE ? OR mobile_number LIKE ?)';
      params.push(q, q, q);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    const rows = await query(sql, [...params, pageSize, offset]);
    const totalRow = await get(countSql, params);
    const totalElements = totalRow ? totalRow.count : 0;
    const totalPages = Math.ceil(totalElements / pageSize) || (totalElements > 0 ? 1 : 0);

    const formatted = rows.map(r => ({
      id: r.id,
      ownerCode: r.owner_code,
      fullName: r.full_name,
      mobileNumber: r.mobile_number,
      alternatePhone: r.alternate_phone,
      address: r.address,
      bankName: r.bank_name,
      accountNo: r.account_no,
      accountNumber: r.account_no,
      ifscCode: r.ifsc_code,
      upiId: r.upi_id,
      villageName: r.village_name,
      totalMachines: r.total_machines,
      advancePaid: r.advance_paid,
      balanceDue: r.balance_due,
      status: r.status,
      createdAt: r.created_at
    }));

    return {
      content: formatted,
      page: pageNum,
      pageSize,
      totalElements,
      totalPages,
      last: pageNum >= totalPages - 1
    };
  },

  create: async (data) => {
    const ownerCode = data.ownerCode || `H-00${Math.floor(100 + Math.random() * 900)}`;
    const result = await run(
      `INSERT INTO machine_owners (owner_code, full_name, mobile_number, alternate_phone, address, bank_name, account_no, ifsc_code, upi_id, village_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ownerCode,
        data.fullName,
        data.mobileNumber || '',
        data.alternatePhone || '',
        data.address || '',
        data.bankName || '',
        data.accountNo || data.accountNumber || '',
        data.ifscCode || '',
        data.upiId || '',
        data.villageName || ''
      ]
    );

    return get('SELECT * FROM machine_owners WHERE id = ?', [result.id]);
  },

  softDelete: async (id) => {
    return run('UPDATE machine_owners SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  },

  getSettlementLedgers: async (search) => {
    let sql = 'SELECT * FROM machine_owners WHERE is_deleted = 0';
    const params = [];
    if (search) {
      const q = `%${search}%`;
      sql += ' AND (full_name LIKE ? OR owner_code LIKE ? OR mobile_number LIKE ?)';
      params.push(q, q, q);
    }
    sql += ' ORDER BY id DESC';
    const owners = await query(sql, params);

    const ledgers = [];
    for (const o of owners) {
      const payouts = await query('SELECT SUM(amount) as paid FROM owner_payouts WHERE owner_id = ? AND is_deleted = 0', [o.id]);
      const advancePaid = payouts[0]?.paid || o.advance_paid || 0;

      ledgers.push({
        id: o.id,
        ownerCode: o.owner_code,
        ownerName: o.full_name,
        machineUnitName: `Machine Unit (${o.owner_code})`,
        registrationOrMachineNo: o.owner_code,
        mobileNumber: o.mobile_number,
        bankName: o.bank_name || 'Bank',
        accountNumber: o.account_no || 'N/A',
        ifscCode: o.ifsc_code || 'N/A',
        auditStatus: advancePaid > 0 ? 'PARTIAL DISBURSED' : 'READY FOR DISBURSEMENT',
        grossWorkBilled: 0,
        companyCommission: 0,
        dieselDeduction: 0,
        advancePaid: advancePaid,
        netOwnerPayable: 0,
        workSessionsCount: 0,
        workExecutions: []
      });
    }
    return ledgers;
  },

  recordOwnerPayout: async (input) => {
    const { ownerId, amount, paymentMode = 'BANK_TRANSFER', bankRef = '', notes = '' } = input;
    const payoutDate = new Date().toISOString().split('T')[0];

    return await runInTransaction(async () => {
      await run(
        `INSERT INTO owner_payouts (owner_id, payout_date, amount, payment_mode, bank_ref, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ownerId, payoutDate, amount, paymentMode, bankRef, notes]
      );

      await run(
        'UPDATE machine_owners SET advance_paid = advance_paid + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [amount, ownerId]
      );

      const ledgers = await machineOwnerRepository.getSettlementLedgers();
      return ledgers.find(l => l.id === ownerId) || ledgers[0];
    });
  }
};
