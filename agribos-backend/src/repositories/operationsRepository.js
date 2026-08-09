import { get, query, run, runInTransaction } from '../db/sqlite.js';

export const operationsRepository = {
  getDashboardMetrics: async () => {
    const today = new Date().toISOString().split('T')[0];

    const farmerCountRow = await get('SELECT COUNT(*) as count FROM farmers WHERE is_deleted = 0');
    const machineCountRow = await get('SELECT COUNT(*) as count FROM machines WHERE is_deleted = 0');
    const availableMachineRow = await get("SELECT COUNT(*) as count FROM machines WHERE status = 'AVAILABLE' AND is_deleted = 0");
    const workingMachineRow = await get("SELECT COUNT(*) as count FROM machines WHERE status = 'IN_USE' AND is_deleted = 0");

    const bookingsTodayRow = await get('SELECT COUNT(*) as count FROM bookings WHERE booking_date = ? AND is_deleted = 0', [today]);
    const jobsInProgressRow = await get("SELECT COUNT(*) as count FROM bookings WHERE status = 'IN_PROGRESS' AND is_deleted = 0");
    const completedJobsRow = await get("SELECT COUNT(*) as count FROM bookings WHERE status = 'COMPLETED' AND is_deleted = 0");

    const workSummaryRow = await get(
      'SELECT SUM(work_hours) as hours, SUM(total_amount) as total, SUM(paid_amount) as paid, SUM(balance_due) as balance FROM work_entries WHERE is_deleted = 0'
    );

    return {
      totalActiveFarmers: farmerCountRow?.count || 0,
      totalMachines: machineCountRow?.count || 0,
      availableMachines: availableMachineRow?.count || 0,
      machinesWorking: workingMachineRow?.count || 0,
      machinesAvailable: availableMachineRow?.count || 0,
      todaysBookings: bookingsTodayRow?.count || 0,
      jobsInProgress: jobsInProgressRow?.count || 0,
      completedJobs: completedJobsRow?.count || 0,
      totalWorkHours: workSummaryRow?.hours || 0,
      totalBilledAmount: workSummaryRow?.total || 0,
      totalCollectedAmount: workSummaryRow?.paid || 0,
      totalPendingAmount: workSummaryRow?.balance || 0
    };
  },

  findBookings: async ({ seasonId, status, search, page = 0, size = 10 }) => {
    const pageNum = parseInt(page, 10) || 0;
    const pageSize = parseInt(size, 10) || 10;
    const offset = pageNum * pageSize;

    let sql = `
      SELECT b.*, f.full_name as farmer_name, f.mobile_number as farmer_phone, f.village_name as farmer_village, m.machine_name, m.registration_number
      FROM bookings b
      LEFT JOIN farmers f ON b.farmer_id = f.id
      LEFT JOIN machines m ON b.machine_id = m.id
      WHERE b.is_deleted = 0
    `;
    let countSql = 'SELECT COUNT(*) as count FROM bookings b WHERE b.is_deleted = 0';
    const params = [];

    if (status && status !== 'ALL') {
      sql += ' AND b.status = ?';
      countSql += ' AND b.status = ?';
      params.push(status);
    }

    if (search) {
      const q = `%${search}%`;
      sql += ' AND (b.booking_number LIKE ? OR f.full_name LIKE ? OR f.mobile_number LIKE ? OR m.machine_name LIKE ?)';
      countSql += ' AND (b.booking_number LIKE ? OR f.full_name LIKE ? OR f.mobile_number LIKE ? OR m.machine_name LIKE ?)';
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY b.id DESC LIMIT ? OFFSET ?';
    const rows = await query(sql, [...params, pageSize, offset]);
    const totalRow = await get(countSql, params);
    const totalElements = totalRow ? totalRow.count : 0;
    const totalPages = Math.ceil(totalElements / pageSize) || (totalElements > 0 ? 1 : 0);

    const formatted = rows.map(r => ({
      id: r.id,
      bookingNumber: r.booking_number,
      farmerId: r.farmer_id,
      farmerName: r.farmer_name || 'Farmer',
      farmerPhone: r.farmer_phone || '',
      villageName: r.farmer_village || '',
      machineId: r.machine_id,
      machineName: r.machine_name || 'Machine',
      registrationNumber: r.registration_number || 'N/A',
      seasonId: r.season_id,
      bookingDate: r.booking_date,
      preferredWorkDate: r.preferred_work_date,
      machineType: r.machine_type,
      estimatedAcres: r.estimated_acres,
      estimatedHours: r.estimated_hours,
      priority: r.priority,
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

  createBooking: async (data) => {
    return runInTransaction(async () => {
      const bookingNumber = `BK-2026-${Math.floor(100 + Math.random() * 900)}`;
      const bookingDate = new Date().toISOString().split('T')[0];

      const result = await run(
        `INSERT INTO bookings (booking_number, farmer_id, machine_id, season_id, booking_date, preferred_work_date, machine_type, estimated_acres, estimated_hours, priority, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
        [
          bookingNumber,
          data.farmerId || 1,
          data.machineId || null,
          data.seasonId || 1,
          bookingDate,
          data.preferredWorkDate || bookingDate,
          data.machineType || 'HARVESTER',
          data.estimatedAcres || 5.0,
          data.estimatedHours || 8.0,
          data.priority || 'NORMAL'
        ]
      );

      return get('SELECT * FROM bookings WHERE id = ?', [result.id]);
    });
  },

  updateBookingStatus: async (id, status) => {
    await run('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    return get('SELECT * FROM bookings WHERE id = ?', [id]);
  },

  assignMachine: async (bookingId, machineId) => {
    return runInTransaction(async () => {
      await run('UPDATE bookings SET machine_id = ?, status = "ASSIGNED" WHERE id = ?', [machineId, bookingId]);
      await run('UPDATE machines SET status = "IN_USE" WHERE id = ?', [machineId]);
      return get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    });
  },

  createDispatch: async (data) => {
    return runInTransaction(async () => {
      const dispatchNumber = `DSP-2026-${Math.floor(100 + Math.random() * 900)}`;
      const result = await run(
        `INSERT INTO dispatches (dispatch_number, booking_id, machine_id, operator_id, driver_id, start_engine_hours, status)
         VALUES (?, ?, ?, ?, ?, ?, 'DISPATCHED')`,
        [dispatchNumber, data.bookingId, data.machineId, data.operatorEmployeeId || null, data.driverEmployeeId || null, data.startEngineHours || 0]
      );

      await run('UPDATE bookings SET status = "IN_PROGRESS" WHERE id = ?', [data.bookingId]);
      await run('UPDATE machines SET status = "IN_USE" WHERE id = ?', [data.machineId]);

      return get('SELECT * FROM dispatches WHERE id = ?', [result.id]);
    });
  },

  logWorkExecution: async (data) => {
    return runInTransaction(async () => {
      const billNumber = `BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const workDate = data.workDate || new Date().toISOString().split('T')[0];

      const farmer = await get('SELECT * FROM farmers WHERE id = ?', [data.farmerId || 1]);
      const machine = await get('SELECT * FROM machines WHERE id = ?', [data.machineId || 1]);

      const hours = parseFloat(data.hoursOrAcresWorked || data.workHours || 8.0);
      const rate = parseFloat(data.ratePerUnit || machine?.hourly_rate || 2400);
      const total = hours * rate;
      const advance = parseFloat(data.advanceCollected || 0);
      const paid = advance;
      const balance = Math.max(0, total - paid);
      const status = balance === 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');

      const result = await run(
        `INSERT INTO work_entries (bill_number, work_date, farmer_id, machine_id, machine_name, operator_name, village_name, crop_type, work_hours, rate_per_unit, total_amount, advance_amount, paid_amount, balance_due, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          billNumber,
          workDate,
          data.farmerId || 1,
          data.machineId || null,
          machine?.machine_name || 'AgriBOS Harvester',
          data.operatorName || 'Operator',
          farmer?.village_name || data.villageName || 'Sindhanur',
          data.cropType || 'Paddy Harvesting',
          hours,
          rate,
          total,
          advance,
          paid,
          balance,
          status,
          data.remarks || 'Work Execution Logged'
        ]
      );

      if (data.bookingId) {
        await run('UPDATE bookings SET status = "COMPLETED" WHERE id = ?', [data.bookingId]);
      }
      if (data.machineId) {
        await run('UPDATE machines SET status = "AVAILABLE" WHERE id = ?', [data.machineId]);
      }

      return get('SELECT * FROM work_entries WHERE id = ?', [result.id]);
    });
  }
};
