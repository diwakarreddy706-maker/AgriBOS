import { get, query, run } from '../db/sqlite.js';

export const vehicleComplianceRepository = {
  findAll: async ({ search }) => {
    let sql = 'SELECT * FROM vehicle_compliance WHERE is_deleted = 0';
    const params = [];
    if (search) {
      const q = `%${search}%`;
      sql += ' AND (registration_number LIKE ? OR make_model_description LIKE ? OR owner_name LIKE ? OR insurance_policy_no LIKE ?)';
      params.push(q, q, q, q);
    }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(r => ({
      id: r.id,
      machineId: r.machine_id,
      registrationNumber: r.registration_number,
      makeModelDescription: r.make_model_description,
      ownerName: r.owner_name,
      ownerPhone: r.owner_phone,
      insurancePolicyNo: r.insurance_policy_no,
      insuranceStatus: r.insurance_status,
      insuranceExpiryDate: r.insurance_expiry_date,
      roadTaxReceiptNo: r.road_tax_receipt_no,
      roadTaxStatus: r.road_tax_status,
      roadTaxExpiryDate: r.road_tax_expiry_date,
      ncPermitStatusNo: r.nc_permit_status_no,
      ncPermitStatus: r.nc_permit_status,
      ncPermitExpiryDate: r.nc_permit_expiry_date,
      fitnessExpiryDate: r.fitness_expiry_date,
      fitnessStatus: r.fitness_status
    }));
  },

  create: async (data) => {
    const result = await run(
      `INSERT INTO vehicle_compliance (
        registration_number, make_model_description, owner_name, owner_phone,
        insurance_policy_no, insurance_status, insurance_expiry_date,
        road_tax_receipt_no, road_tax_status, road_tax_expiry_date,
        nc_permit_status_no, nc_permit_status, nc_permit_expiry_date,
        fitness_expiry_date, fitness_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.registrationNumber,
        data.makeModelDescription || 'Vehicle Unit',
        data.ownerName || 'Company Fleet',
        data.ownerPhone || '9880199881',
        data.insurancePolicyNo || 'POL-INS-001',
        data.insuranceStatus || 'VALID',
        data.insuranceExpiryDate || '2027-08-01',
        data.roadTaxReceiptNo || 'TAX-REC-001',
        data.roadTaxStatus || 'VALID',
        data.roadTaxExpiryDate || '2027-08-01',
        data.ncPermitStatusNo || 'PERMIT-NC-001',
        data.ncPermitStatus || 'VALID',
        data.ncPermitExpiryDate || '2027-08-01',
        data.fitnessExpiryDate || '2027-08-01',
        data.fitnessStatus || 'VALID'
      ]
    );
    return get('SELECT * FROM vehicle_compliance WHERE id = ?', [result.id]);
  },

  recordRenewal: async (data) => {
    const { vehicleId, docType, docNumber, newExpiryDate, amountPaid = 0, remarks = '' } = data;
    await run(
      `INSERT INTO compliance_renewals (compliance_id, doc_type, doc_number, new_expiry_date, amount_paid, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [vehicleId, docType, docNumber, newExpiryDate, amountPaid, remarks]
    );

    let updateField = 'insurance_expiry_date';
    let statusField = 'insurance_status';
    let numberField = 'insurance_policy_no';

    if (docType === 'ROAD_TAX') {
      updateField = 'road_tax_expiry_date';
      statusField = 'road_tax_status';
      numberField = 'road_tax_receipt_no';
    } else if (docType === 'PERMIT' || docType === 'NC_PERMIT') {
      updateField = 'nc_permit_expiry_date';
      statusField = 'nc_permit_status';
      numberField = 'nc_permit_status_no';
    } else if (docType === 'FITNESS') {
      updateField = 'fitness_expiry_date';
      statusField = 'fitness_status';
      numberField = 'fitness_expiry_date';
    }

    await run(
      `UPDATE vehicle_compliance SET ${updateField} = ?, ${statusField} = 'VALID', ${numberField} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newExpiryDate, docNumber, vehicleId]
    );

    return get('SELECT * FROM vehicle_compliance WHERE id = ?', [vehicleId]);
  }
};
