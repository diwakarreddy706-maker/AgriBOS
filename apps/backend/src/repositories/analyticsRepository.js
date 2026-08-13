import { query, get } from '../db/sqlite.js';

export const analyticsRepository = {
  getMachineProfitability: async ({ machineId, machineType, startDate, endDate }) => {
    let machineSql = 'SELECT * FROM machines WHERE is_deleted = 0';
    const params = [];

    if (machineId) {
      machineSql += ' AND id = ?';
      params.push(machineId);
    }

    if (machineType && machineType !== 'ALL') {
      if (machineType === 'HARVESTER') {
        machineSql += " AND machine_type IN ('HARVESTER', 'COMBINE_HARVESTER')";
      } else if (machineType === 'TRACTOR') {
        machineSql += " AND machine_type IN ('TRACTOR', 'ROTAVATOR', 'BALER', 'IMPLEMENT')";
      } else {
        machineSql += ' AND machine_type = ?';
        params.push(machineType);
      }
    }

    const machines = await query(machineSql, params);

    const results = await Promise.all(
      machines.map(async (m) => {
        // Aggregate Revenue from work_entries
        const revRow = await get(
          `SELECT SUM(total_amount) as total_rev, SUM(work_hours) as total_hours 
           FROM work_entries 
           WHERE machine_id = ? AND is_deleted = 0`,
          [m.id]
        );
        const revenue = Number(revRow?.total_rev || 0);

        // Aggregate Fuel Costs & Liters from fuel_logs
        const fuelRow = await get(
          `SELECT SUM(total_cost) as total_fuel_cost, SUM(quantity_liters) as total_liters 
           FROM fuel_logs 
           WHERE machine_id = ? AND is_deleted = 0`,
          [m.id]
        );
        const fuelCost = Number(fuelRow?.total_fuel_cost || 0);
        const totalLiters = Number(fuelRow?.total_liters || 0);

        // Aggregate Maintenance Costs from maintenance_jobs
        const maintRow = await get(
          `SELECT SUM(cost) as total_maint_cost 
           FROM maintenance_jobs 
           WHERE machine_id = ? AND is_deleted = 0`,
          [m.id]
        );
        const maintenanceCost = Number(maintRow?.total_maint_cost || 0);

        // Owner Payouts
        let ownerPayout = 0;
        if (m.owner_id) {
          const ownerRow = await get(
            `SELECT SUM(amount) as total_payout 
             FROM owner_payouts 
             WHERE owner_id = ? AND is_deleted = 0`,
            [m.owner_id]
          );
          ownerPayout = Number(ownerRow?.total_payout || 0);
        }

        const netProfit = revenue - fuelCost - maintenanceCost - ownerPayout;
        const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;
        const totalInvested = fuelCost + maintenanceCost;
        const roiPercent = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

        const engineHours = Number(m.engine_hours || 0);
        const fuelEfficiency = engineHours > 0 ? (totalLiters / engineHours) : 0;
        
        // Estimated acres worked
        const loggedHours = Number(revRow?.total_hours || 0);
        const estimatedAcres = loggedHours * 0.8;
        const workProductivity = engineHours > 0 ? (estimatedAcres / engineHours) : 0;

        return {
          machineId: m.id,
          machineCode: m.machine_code,
          machineName: m.machine_name,
          machineType: m.machine_type,
          engineHours,
          revenue: Math.round(revenue * 100) / 100,
          fuelCost: Math.round(fuelCost * 100) / 100,
          maintenanceCost: Math.round(maintenanceCost * 100) / 100,
          ownerPayout: Math.round(ownerPayout * 100) / 100,
          netProfit: Math.round(netProfit * 100) / 100,
          profitMarginPercent: Math.round(marginPercent * 100) / 100,
          roiPercent: Math.round(roiPercent * 100) / 100,
          fuelEfficiency: Math.round(fuelEfficiency * 100) / 100, // Liters / Hour
          workProductivity: Math.round(workProductivity * 100) / 100 // Acres / Hour
        };
      })
    );

    return results;
  },

  getExpenseBreakdown: async ({ machineType } = {}) => {
    let machineFilter = '';
    if (machineType && machineType !== 'ALL') {
      if (machineType === 'HARVESTER') {
        machineFilter = " AND machine_id IN (SELECT id FROM machines WHERE machine_type IN ('HARVESTER', 'COMBINE_HARVESTER'))";
      } else if (machineType === 'TRACTOR') {
        machineFilter = " AND machine_id IN (SELECT id FROM machines WHERE machine_type IN ('TRACTOR', 'ROTAVATOR', 'BALER', 'IMPLEMENT'))";
      } else {
        machineFilter = ` AND machine_id IN (SELECT id FROM machines WHERE machine_type = '${machineType}')`;
      }
    }

    const fuelRow = await get(`SELECT SUM(total_cost) as total FROM fuel_logs WHERE is_deleted = 0${machineFilter}`);
    const fuelCost = Number(fuelRow?.total || 0);

    const maintRow = await get(`SELECT SUM(cost) as total FROM maintenance_jobs WHERE is_deleted = 0${machineFilter}`);
    const maintCost = Number(maintRow?.total || 0);

    const payrollRow = await get(`SELECT SUM(net_salary) as total FROM payroll_entries WHERE is_deleted = 0`);
    const salaryCost = Number(payrollRow?.total || 0);

    const partsRow = await get(`SELECT SUM(current_stock * unit_cost) as total FROM spare_parts WHERE is_deleted = 0`);
    const sparePartsCost = Number(partsRow?.total || 0);

    const otherRow = await get(
      `SELECT SUM(amount) as total FROM cashbook_entries 
       WHERE entry_type = 'OUTFLOW' AND is_deleted = 0 
       AND category NOT IN ('Fuel', 'Maintenance', 'Salaries', 'Spare Parts')`
    );
    const otherCost = Number(otherRow?.total || 0);

    const totalExpense = fuelCost + maintCost + salaryCost + sparePartsCost + otherCost;

    const categories = [
      { category: 'Fuel', amount: Math.round(fuelCost * 100) / 100 },
      { category: 'Maintenance', amount: Math.round(maintCost * 100) / 100 },
      { category: 'Salaries', amount: Math.round(salaryCost * 100) / 100 },
      { category: 'Spare Parts', amount: Math.round(sparePartsCost * 100) / 100 },
      { category: 'Other', amount: Math.round(otherCost * 100) / 100 }
    ].map(cat => ({
      ...cat,
      percentage: totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 10000) / 100 : 0
    }));

    return {
      totalExpense: Math.round(totalExpense * 100) / 100,
      categories
    };
  }
};

export default analyticsRepository;
