import { get, query, run } from '../db/sqlite.js';

export const machineRepository = {
  findAll: async ({ search, type, ownership, page = 0, size = 10 }) => {
    const pageNum = parseInt(page, 10) || 0;
    const pageSize = parseInt(size, 10) || 10;
    const offset = pageNum * pageSize;

    let sql = 'SELECT * FROM machines WHERE is_deleted = 0';
    let countSql = 'SELECT COUNT(*) as count FROM machines WHERE is_deleted = 0';
    const params = [];

    if (type && type !== 'ALL') {
      sql += ' AND machine_type = ?';
      countSql += ' AND machine_type = ?';
      params.push(type);
    }

    if (ownership && ownership !== 'ALL') {
      sql += ' AND owner_type = ?';
      countSql += ' AND owner_type = ?';
      params.push(ownership);
    }

    if (search) {
      const searchLike = `%${search}%`;
      sql += ' AND (machine_name LIKE ? OR machine_code LIKE ? OR registration_number LIKE ?)';
      countSql += ' AND (machine_name LIKE ? OR machine_code LIKE ? OR registration_number LIKE ?)';
      params.push(searchLike, searchLike, searchLike);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    const rows = await query(sql, [...params, pageSize, offset]);
    const totalRow = await get(countSql, params);
    const totalElements = totalRow ? totalRow.count : 0;
    const totalPages = Math.ceil(totalElements / pageSize) || (totalElements > 0 ? 1 : 0);

    const formatted = rows.map(r => ({
      id: r.id,
      machineCode: r.machine_code,
      machineName: r.machine_name,
      makeModel: r.machine_name,
      registrationNumber: r.registration_number,
      machineType: r.machine_type,
      ownershipType: r.owner_type,
      ownerType: r.owner_type,
      ownerId: r.owner_id,
      status: r.status,
      hourlyRateDefault: r.hourly_rate,
      acreRateDefault: r.acre_rate,
      engineHours: r.engine_hours,
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

  findById: async (id) => {
    const r = await get('SELECT * FROM machines WHERE id = ? AND is_deleted = 0', [id]);
    if (!r) return null;
    return {
      id: r.id,
      machineCode: r.machine_code,
      machineName: r.machine_name,
      makeModel: r.machine_name,
      registrationNumber: r.registration_number,
      machineType: r.machine_type,
      ownershipType: r.owner_type,
      ownerType: r.owner_type,
      ownerId: r.owner_id,
      status: r.status,
      hourlyRateDefault: r.hourly_rate,
      acreRateDefault: r.acre_rate,
      engineHours: r.engine_hours,
      createdAt: r.created_at
    };
  },

  create: async (data) => {
    const isHarvester = data.machineType === 'HARVESTER';
    const regNum = isHarvester ? 'N/A' : (data.registrationNumber || `KA-36 M ${Math.floor(1000 + Math.random() * 9000)}`);
    const code = data.machineCode || `MAC-2026-${Math.floor(100 + Math.random() * 900)}`;

    const result = await run(
      `INSERT INTO machines (machine_code, machine_name, registration_number, machine_type, owner_type, owner_id, status, hourly_rate, acre_rate, engine_hours)
       VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, ?, ?)`,
      [
        code,
        data.makeModel || data.machineName,
        regNum,
        data.machineType || 'TRACTOR',
        data.ownershipType || data.ownerType || 'COMPANY_OWNED',
        data.ownerId || null,
        data.hourlyRateDefault || data.hourlyRate || 2400,
        data.acreRateDefault || data.acreRate || 1500,
        data.engineHours || 0
      ]
    );

    return machineRepository.findById(result.id);
  },

  updateStatus: async (id, status) => {
    await run('UPDATE machines SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    return machineRepository.findById(id);
  },

  softDelete: async (id) => {
    return run('UPDATE machines SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }
};
