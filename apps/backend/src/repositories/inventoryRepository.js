import { query, get, run } from '../db/sqlite.js';

export const inventoryRepository = {
  getSpareParts: async (params = {}) => {
    let sql = 'SELECT * FROM spare_parts WHERE is_deleted = 0';
    const sqlParams = [];
    if (params.category) {
      sql += ' AND category = ?';
      sqlParams.push(params.category);
    }
    if (params.search) {
      const q = `%${params.search}%`;
      sql += ' AND (part_number LIKE ? OR part_name LIKE ? OR category LIKE ?)';
      sqlParams.push(q, q, q);
    }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, sqlParams);
    return rows.map(r => ({
      id: r.id,
      partNumber: r.part_number,
      partName: r.part_name,
      category: r.category,
      unitOfMeasure: r.unit_of_measure,
      currentStock: r.current_stock,
      minimumStockLevel: r.minimum_stock_level,
      unitCost: r.unit_cost,
      locationRack: r.location_rack
    }));
  },

  getLowStockItems: async () => {
    const rows = await query('SELECT * FROM spare_parts WHERE current_stock <= minimum_stock_level AND is_deleted = 0');
    return rows.map(r => ({
      id: r.id,
      partNumber: r.part_number,
      partName: r.part_name,
      category: r.category,
      currentStock: r.current_stock,
      minimumStockLevel: r.minimum_stock_level,
      unitCost: r.unit_cost
    }));
  },

  createSparePart: async (data) => {
    const result = await run(
      `INSERT INTO spare_parts (part_number, part_name, category, unit_of_measure, current_stock, minimum_stock_level, unit_cost, location_rack)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.partNumber,
        data.partName,
        data.category,
        data.unitOfMeasure || 'PCS',
        data.currentStock || 0,
        data.minimumStockLevel || 5,
        data.unitCost || 0,
        data.locationRack || 'RACK-A'
      ]
    );
    const row = await get('SELECT * FROM spare_parts WHERE id = ?', [result.id]);
    return {
      id: row.id,
      partNumber: row.part_number,
      partName: row.part_name,
      category: row.category,
      unitOfMeasure: row.unit_of_measure,
      currentStock: row.current_stock,
      minimumStockLevel: row.minimum_stock_level,
      unitCost: row.unit_cost,
      locationRack: row.location_rack
    };
  },

  getDashboardMetrics: async () => {
    const totalParts = await get('SELECT COUNT(*) as count FROM spare_parts WHERE is_deleted = 0');
    const lowStock = await get('SELECT COUNT(*) as count FROM spare_parts WHERE current_stock <= minimum_stock_level AND is_deleted = 0');
    const val = await get('SELECT SUM(current_stock * unit_cost) as total FROM spare_parts WHERE is_deleted = 0');
    return {
      totalSpareParts: totalParts?.count || 0,
      lowStockAlerts: lowStock?.count || 0,
      totalInventoryValue: val?.total || 0
    };
  }
};

export default inventoryRepository;
