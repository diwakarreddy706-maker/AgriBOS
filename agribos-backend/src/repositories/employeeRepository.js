import { get, query, run } from '../db/sqlite.js';

export const employeeRepository = {
  findAll: async ({ search, page = 0, size = 10 }) => {
    const pageNum = parseInt(page, 10) || 0;
    const pageSize = parseInt(size, 10) || 10;
    const offset = pageNum * pageSize;

    let sql = 'SELECT * FROM employees WHERE is_deleted = 0';
    let countSql = 'SELECT COUNT(*) as count FROM employees WHERE is_deleted = 0';
    const params = [];

    if (search) {
      const q = `%${search}%`;
      sql += ' AND (full_name LIKE ? OR employee_code LIKE ? OR mobile_number LIKE ?)';
      countSql += ' AND (full_name LIKE ? OR employee_code LIKE ? OR mobile_number LIKE ?)';
      params.push(q, q, q);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    const rows = await query(sql, [...params, pageSize, offset]);
    const totalRow = await get(countSql, params);
    const totalElements = totalRow ? totalRow.count : 0;
    const totalPages = Math.ceil(totalElements / pageSize) || (totalElements > 0 ? 1 : 0);

    const formatted = rows.map(r => ({
      id: r.id,
      employeeCode: r.employee_code,
      fullName: r.full_name,
      role: r.role,
      mobileNumber: r.mobile_number,
      baseSalary: r.base_salary,
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
    const code = data.employeeCode || `EMP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const result = await run(
      `INSERT INTO employees (employee_code, full_name, role, mobile_number, base_salary, status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [code, data.fullName, data.role || 'OPERATOR', data.mobileNumber || '', data.baseSalary || 0]
    );

    return get('SELECT * FROM employees WHERE id = ?', [result.id]);
  },

  softDelete: async (id) => {
    return run('UPDATE employees SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }
};
