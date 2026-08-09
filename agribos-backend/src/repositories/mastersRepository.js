import { get, query, run } from '../db/sqlite.js';

export const mastersRepository = {
  getVillages: async () => {
    const rows = await query("SELECT * FROM master_data WHERE category = 'VILLAGE' AND is_deleted = 0 ORDER BY name ASC");
    if (rows.length === 0) {
      const farmerVillages = await query("SELECT DISTINCT village_name as name FROM farmers WHERE village_name IS NOT NULL AND village_name != ''");
      return farmerVillages.map((v, idx) => ({ id: idx + 1, name: v.name, code: `VIL-${idx + 1}` }));
    }
    return rows.map(r => ({ id: r.id, name: r.name, code: r.code }));
  },

  getCrops: async () => {
    const rows = await query("SELECT * FROM master_data WHERE category = 'CROP' AND is_deleted = 0 ORDER BY name ASC");
    if (rows.length === 0) {
      return [
        { id: 1, name: 'Paddy Harvesting', code: 'PADDY' },
        { id: 2, name: 'Cotton Tillage', code: 'COTTON' },
        { id: 3, name: 'Maize Sowing', code: 'MAIZE' },
        { id: 4, name: 'Groundnut Digging', code: 'GROUNDNUT' }
      ];
    }
    return rows.map(r => ({ id: r.id, name: r.name, code: r.code }));
  },

  getFuelStations: async () => {
    const rows = await query("SELECT * FROM master_data WHERE category = 'FUEL_STATION' AND is_deleted = 0 ORDER BY name ASC");
    if (rows.length === 0) {
      return [
        { id: 1, name: 'Shell Station Sindhanur', code: 'FS-01' },
        { id: 2, name: 'IOCL Highway Pump Gangavati', code: 'FS-02' }
      ];
    }
    return rows.map(r => ({ id: r.id, name: r.name, code: r.code }));
  },

  getExpenseCategories: async () => {
    const rows = await query("SELECT * FROM master_data WHERE category = 'EXPENSE_CATEGORY' AND is_deleted = 0 ORDER BY name ASC");
    if (rows.length === 0) {
      return [
        { id: 1, name: 'Machine Maintenance', code: 'MAINTENANCE' },
        { id: 2, name: 'Driver & Operator Food/Batta', code: 'BATTA' },
        { id: 3, name: 'RTO & Toll Charges', code: 'RTO_TOLL' }
      ];
    }
    return rows.map(r => ({ id: r.id, name: r.name, code: r.code }));
  }
};
