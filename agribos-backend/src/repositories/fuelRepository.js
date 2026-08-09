import { get, query, run } from '../db/sqlite.js';

export const fuelRepository = {
  getDashboardMetrics: async () => {
    const today = new Date().toISOString().split('T')[0];

    const todayLitersRow = await get(
      "SELECT SUM(quantity_liters) as liters FROM fuel_logs WHERE date(log_date_time) = date('now') AND is_deleted = 0"
    );

    const monthCostRow = await get(
      "SELECT SUM(total_cost) as total FROM fuel_logs WHERE strftime('%Y-%m', log_date_time) = strftime('%Y-%m', 'now') AND is_deleted = 0"
    );

    const avgConsumptionRow = await get(
      "SELECT AVG(quantity_liters) as avg_liters FROM fuel_logs WHERE is_deleted = 0"
    );

    const spendingsByMachineRows = await query(`
      SELECT machine_name, SUM(total_cost) as totalSpent, SUM(quantity_liters) as totalLiters
      FROM fuel_logs
      WHERE is_deleted = 0
      GROUP BY machine_name
      ORDER BY totalSpent DESC
      LIMIT 5
    `);

    const spendingsByOperatorRows = await query(`
      SELECT operator_name, SUM(total_cost) as totalSpent, SUM(quantity_liters) as totalLiters
      FROM fuel_logs
      WHERE is_deleted = 0
      GROUP BY operator_name
      ORDER BY totalSpent DESC
      LIMIT 5
    `);

    return {
      totalLitersToday: todayLitersRow?.liters || 0,
      totalFuelCostMonth: monthCostRow?.total || 0,
      avgFuelConsumption: avgConsumptionRow?.avg_liters || 0,
      spendingsByMachine: spendingsByMachineRows.map(r => ({
        machineName: r.machine_name || 'Machine',
        totalSpent: r.totalSpent || 0,
        totalLiters: r.totalLiters || 0
      })),
      spendingsByOperator: spendingsByOperatorRows.map(r => ({
        operatorName: r.operator_name || 'Operator',
        totalSpent: r.totalSpent || 0,
        totalLiters: r.totalLiters || 0
      }))
    };
  },

  getVouchers: async ({ machineId, fuelStationId, status, page = 0, size = 10 }) => {
    const pageNum = parseInt(page, 10) || 0;
    const pageSize = parseInt(size, 10) || 10;
    const offset = pageNum * pageSize;

    let sql = 'SELECT * FROM fuel_vouchers WHERE is_deleted = 0';
    let countSql = 'SELECT COUNT(*) as count FROM fuel_vouchers WHERE is_deleted = 0';
    const params = [];

    if (machineId) {
      sql += ' AND machine_id = ?';
      countSql += ' AND machine_id = ?';
      params.push(machineId);
    }

    if (status && status !== 'ALL') {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(status);
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

  createVoucher: async (data) => {
    const voucherNumber = `FV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const issuedDate = new Date().toISOString().split('T')[0];

    const result = await run(
      `INSERT INTO fuel_vouchers (voucher_number, machine_id, operator_id, fuel_station_id, approved_liters, issued_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ISSUED')`,
      [voucherNumber, data.machineId, data.operatorId || null, data.fuelStationId || null, data.approvedLiters || 50, issuedDate]
    );

    return get('SELECT * FROM fuel_vouchers WHERE id = ?', [result.id]);
  },

  updateVoucherStatus: async (id, status) => {
    await run('UPDATE fuel_vouchers SET status = ? WHERE id = ?', [status, id]);
    return get('SELECT * FROM fuel_vouchers WHERE id = ?', [id]);
  },

  getFuelLogs: async () => {
    const rows = await query('SELECT * FROM fuel_logs WHERE is_deleted = 0 ORDER BY id DESC');
    return rows.map(r => ({
      id: r.id,
      ticketNumber: r.ticket_number,
      logDateTime: r.log_date_time,
      machineId: r.machine_id,
      machineName: r.machine_name,
      operatorId: r.operator_id,
      operatorName: r.operator_name,
      hourMeter: r.hour_meter,
      fuelType: r.fuel_type,
      quantityLiters: r.quantity_liters,
      pricePerLiter: r.price_per_liter,
      totalCost: r.total_cost,
      vendorStation: r.vendor_station,
      remarks: r.remarks
    }));
  },

  logFuel: async (data) => {
    const ticketNumber = `FT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const logDateTime = data.logDateTime || new Date().toISOString();
    const qty = parseFloat(data.quantityLiters || 0);
    const price = parseFloat(data.pricePerLiter || 92.5);
    const totalCost = qty * price;

    const result = await run(
      `INSERT INTO fuel_logs (ticket_number, log_date_time, machine_id, machine_name, operator_id, operator_name, hour_meter, fuel_type, quantity_liters, price_per_liter, total_cost, vendor_station, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticketNumber,
        logDateTime,
        data.machineId || 1,
        data.machineName || 'Machine Unit',
        data.operatorId || 1,
        data.operatorName || 'Operator',
        data.hourMeter || 0,
        data.fuelType || 'Diesel',
        qty,
        price,
        totalCost,
        data.vendorStation || 'Station',
        data.remarks || ''
      ]
    );

    return get('SELECT * FROM fuel_logs WHERE id = ?', [result.id]);
  }
};
