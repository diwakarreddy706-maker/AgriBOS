import { get, query, run, runInTransaction } from '../db/sqlite.js';

export const calculateServiceStatus = (engineHours, nextServiceHours, serviceIntervalHours) => {
  const current = Number(engineHours) || 0;
  const next = Number(nextServiceHours) || 250;
  const interval = Number(serviceIntervalHours) || 250;

  if (current >= next + interval) {
    return 'OVERDUE';
  } else if (current >= next) {
    return 'SERVICE_DUE';
  } else {
    return 'OK';
  }
};

const formatMachine = (r) => {
  if (!r) return null;
  const engHours = r.engine_hours || 0;
  const nextServ = r.next_service_hours !== undefined && r.next_service_hours !== null ? r.next_service_hours : 250;
  const servInt = r.service_interval_hours !== undefined && r.service_interval_hours !== null ? r.service_interval_hours : 250;
  const computedStatus = r.service_status || calculateServiceStatus(engHours, nextServ, servInt);

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
    engineHours: engHours,
    latitude: r.latitude !== undefined ? r.latitude : null,
    longitude: r.longitude !== undefined ? r.longitude : null,
    speed: r.speed || 0,
    lastGpsUpdate: r.last_gps_update || null,
    nextServiceHours: nextServ,
    serviceIntervalHours: servInt,
    serviceStatus: computedStatus,
    createdAt: r.created_at
  };
};

export const machineRepository = {
  findAll: async ({ search, type, ownership, page = 0, size = 10 }) => {
    const pageNum = parseInt(page, 10) || 0;
    const pageSize = parseInt(size, 10) || 10;
    const offset = pageNum * pageSize;

    let sql = 'SELECT * FROM machines WHERE is_deleted = 0';
    let countSql = 'SELECT COUNT(*) as count FROM machines WHERE is_deleted = 0';
    const params = [];

    if (type && type !== 'ALL') {
      if (type === 'HARVESTER') {
        sql += " AND machine_type IN ('HARVESTER', 'COMBINE_HARVESTER')";
        countSql += " AND machine_type IN ('HARVESTER', 'COMBINE_HARVESTER')";
      } else if (type === 'TRACTOR') {
        sql += " AND machine_type IN ('TRACTOR', 'ROTAVATOR', 'BALER', 'IMPLEMENT')";
        countSql += " AND machine_type IN ('TRACTOR', 'ROTAVATOR', 'BALER', 'IMPLEMENT')";
      } else {
        sql += ' AND machine_type = ?';
        countSql += ' AND machine_type = ?';
        params.push(type);
      }
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

    const formatted = rows.map(formatMachine);

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
    return formatMachine(r);
  },

  create: async (data) => {
    const isHarvester = data.machineType === 'HARVESTER';
    const regNum = isHarvester ? 'N/A' : (data.registrationNumber || `KA-36 M ${Math.floor(1000 + Math.random() * 9000)}`);
    const code = data.machineCode || `MAC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const engHours = data.engineHours || 0;
    const nextServ = data.nextServiceHours || (engHours + 250);
    const interval = data.serviceIntervalHours || 250;
    const initialServiceStatus = calculateServiceStatus(engHours, nextServ, interval);

    const result = await run(
      `INSERT INTO machines (machine_code, machine_name, registration_number, machine_type, owner_type, owner_id, status, hourly_rate, acre_rate, engine_hours, next_service_hours, service_interval_hours, service_status)
       VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, ?, ?, ?, ?, ?)`,
      [
        code,
        data.makeModel || data.machineName,
        regNum,
        data.machineType || 'TRACTOR',
        data.ownershipType || data.ownerType || 'COMPANY_OWNED',
        data.ownerId || null,
        data.hourlyRateDefault || data.hourlyRate || 2400,
        data.acreRateDefault || data.acreRate || 1500,
        engHours,
        nextServ,
        interval,
        initialServiceStatus
      ]
    );

    return machineRepository.findById(result.id);
  },

  updateStatus: async (id, status) => {
    await run('UPDATE machines SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    return machineRepository.findById(id);
  },

  recordTelematics: async (machineId, data) => {
    const { latitude, longitude, speed = 0, engineHours, recordedAt, source = 'TELEMATICS_API' } = data;
    const now = recordedAt || new Date().toISOString();

    return await runInTransaction(async () => {
      const machine = await get('SELECT * FROM machines WHERE id = ? AND is_deleted = 0', [machineId]);
      if (!machine) {
        const err = new Error('Machine not found');
        err.statusCode = 404;
        throw err;
      }

      const currentHours = machine.engine_hours || 0;
      const newHours = engineHours !== undefined && engineHours !== null ? Math.max(currentHours, Number(engineHours)) : currentHours;
      const nextService = machine.next_service_hours || 250;
      const interval = machine.service_interval_hours || 250;

      const newServiceStatus = calculateServiceStatus(newHours, nextService, interval);

      await run(
        `INSERT INTO machine_telematics_history (machine_id, latitude, longitude, speed, engine_hours, recorded_at, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [machineId, latitude, longitude, speed, newHours, now, source]
      );

      await run(
        `UPDATE machines
         SET latitude = ?, longitude = ?, speed = ?, last_gps_update = ?, engine_hours = ?, service_status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [latitude, longitude, speed, now, newHours, newServiceStatus, machineId]
      );

      if (newServiceStatus === 'SERVICE_DUE' || newServiceStatus === 'OVERDUE') {
        const activeJob = await get(
          `SELECT * FROM maintenance_jobs
           WHERE machine_id = ? AND is_deleted = 0 AND status IN ('OPEN', 'IN_PROGRESS') AND issue_description LIKE '%Preventive Maintenance%'`,
          [machineId]
        );

        if (!activeJob) {
          const jobNumber = `PM-JOB-${machineId}-${Math.floor(1000 + Math.random() * 9000)}`;
          const desc = `Preventive Maintenance Required (${newServiceStatus}) - Engine Hours: ${newHours} / Next Service: ${nextService}`;
          await run(
            `INSERT INTO maintenance_jobs (job_number, machine_id, breakdown_date, issue_description, status, cost)
             VALUES (?, ?, ?, ?, 'OPEN', 0)`,
            [jobNumber, machineId, now.split('T')[0], desc]
          );
        }
      }

      return machineRepository.findById(machineId);
    });
  },

  getTelematicsHistory: async (machineId, limit = 50) => {
    const rows = await query(
      `SELECT * FROM machine_telematics_history WHERE machine_id = ? ORDER BY recorded_at DESC, id DESC LIMIT ?`,
      [machineId, parseInt(limit, 10) || 50]
    );
    return rows.map(r => ({
      id: r.id,
      machineId: r.machine_id,
      latitude: r.latitude,
      longitude: r.longitude,
      speed: r.speed,
      engineHours: r.engine_hours,
      recordedAt: r.recorded_at,
      source: r.source,
      createdAt: r.created_at
    }));
  },

  completeServiceMaintenance: async (machineId) => {
    const machine = await get('SELECT * FROM machines WHERE id = ? AND is_deleted = 0', [machineId]);
    if (!machine) return null;

    const currentHours = machine.engine_hours || 0;
    const interval = machine.service_interval_hours || 250;
    const nextService = currentHours + interval;

    await run(
      `UPDATE machines SET next_service_hours = ?, service_status = 'OK', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [nextService, machineId]
    );

    return machineRepository.findById(machineId);
  },

  softDelete: async (id) => {
    return run('UPDATE machines SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }
};
