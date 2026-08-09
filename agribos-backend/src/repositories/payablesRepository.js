import { query, get, run } from '../db/sqlite.js';

export const payablesRepository = {
  getPayrollEntries: async () => {
    const rows = await query(`
      SELECT p.*, e.full_name as employee_name, e.employee_code, e.role
      FROM payroll_entries p
      LEFT JOIN employees e ON e.id = p.employee_id
      WHERE p.is_deleted = 0
      ORDER BY p.id DESC
    `);
    return rows.map(r => ({
      id: r.id,
      employeeId: r.employee_id,
      employeeCode: r.employee_code,
      employeeName: r.employee_name || 'Staff',
      role: r.role,
      payPeriod: r.pay_period,
      baseSalary: r.base_salary,
      netSalary: r.net_salary,
      status: r.status
    }));
  },

  disbursePayroll: async (data) => {
    const period = new Date().toISOString().substring(0, 7);
    const result = await run(
      `INSERT INTO payroll_entries (employee_id, pay_period, base_salary, net_salary, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.employeeId || 1,
        data.payPeriod || period,
        data.baseSalary || 25000,
        data.netSalary || 25000,
        'DISBURSED'
      ]
    );
    return get('SELECT * FROM payroll_entries WHERE id = ?', [result.id]);
  }
};

export default payablesRepository;
