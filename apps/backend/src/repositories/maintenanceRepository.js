import { query, get, run } from '../db/sqlite.js';

export const maintenanceRepository = {
  getJobCards: async ({ machineType } = {}) => {
    let sql = 'SELECT * FROM maintenance_jobs WHERE is_deleted = 0';
    if (machineType && machineType !== 'ALL') {
      if (machineType === 'HARVESTER') {
        sql += " AND machine_id IN (SELECT id FROM machines WHERE machine_type IN ('HARVESTER', 'COMBINE_HARVESTER'))";
      } else if (machineType === 'TRACTOR') {
        sql += " AND machine_id IN (SELECT id FROM machines WHERE machine_type IN ('TRACTOR', 'ROTAVATOR', 'BALER', 'IMPLEMENT'))";
      } else {
        sql += ` AND machine_id IN (SELECT id FROM machines WHERE machine_type = '${machineType}')`;
      }
    }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql);
    return rows.map(r => ({
      id: r.id,
      jobNumber: r.job_number,
      machineId: r.machine_id,
      breakdownDate: r.breakdown_date,
      issueDescription: r.issue_description,
      status: r.status,
      cost: r.cost
    }));
  },

  createJobCard: async (data) => {
    const jobNumber = `JOB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await run(
      `INSERT INTO maintenance_jobs (job_number, machine_id, breakdown_date, issue_description, status, cost)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        jobNumber,
        data.machineId || 1,
        data.breakdownDate || new Date().toISOString().split('T')[0],
        data.issueDescription || 'Scheduled Maintenance',
        'OPEN',
        data.cost || 0
      ]
    );
    return get('SELECT * FROM maintenance_jobs WHERE id = ?', [result.id]);
  },

  getDashboardMetrics: async ({ machineType } = {}) => {
    let filter = '';
    if (machineType && machineType !== 'ALL') {
      if (machineType === 'HARVESTER') {
        filter = " AND machine_id IN (SELECT id FROM machines WHERE machine_type IN ('HARVESTER', 'COMBINE_HARVESTER'))";
      } else if (machineType === 'TRACTOR') {
        filter = " AND machine_id IN (SELECT id FROM machines WHERE machine_type IN ('TRACTOR', 'ROTAVATOR', 'BALER', 'IMPLEMENT'))";
      } else {
        filter = ` AND machine_id IN (SELECT id FROM machines WHERE machine_type = '${machineType}')`;
      }
    }
    const openJobs = await get(`SELECT COUNT(*) as count FROM maintenance_jobs WHERE status = 'OPEN' AND is_deleted = 0${filter}`);
    const totalCost = await get(`SELECT SUM(cost) as total FROM maintenance_jobs WHERE is_deleted = 0${filter}`);
    return {
      activeWorkOrders: openJobs?.count || 0,
      totalMaintenanceCostMonth: totalCost?.total || 0,
      mttrHours: 4.5
    };
  }
};

export default maintenanceRepository;
