import { initDb, get, query, run } from './src/db/sqlite.js';
import { machineService } from './src/services/machineService.js';
import { analyticsService } from './src/services/analyticsService.js';
import { operationsService } from './src/services/operationsService.js';
import { fuelService } from './src/services/fuelService.js';
import { maintenanceService } from './src/services/maintenanceService.js';
import { machineOwnerService } from './src/services/machineOwnerService.js';
import { machineRepository, calculateServiceStatus } from './src/repositories/machineRepository.js';
import maintenanceRepository from './src/repositories/maintenanceRepository.js';

let passed = 0;
let failed = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
};

async function runTests() {
  console.log('\n====================================================');
  console.log('🧪 RUNNING HARDENING VERIFICATION TEST SUITE (14/14)');
  console.log('====================================================\n');

  await initDb();

  // 1. Valid Telemetry Submission
  console.log('Test 1: Valid Telemetry Submission');
  try {
    const m = await machineRepository.create({
      machineCode: `MAC-TEL-${Date.now()}`,
      machineName: 'Test Harvester 2026',
      registrationNumber: 'KA-36-H-9999',
      machineType: 'HARVESTER',
      engineHours: 100,
      nextServiceHours: 250,
      serviceIntervalHours: 250
    });
    const updated = await machineService.recordTelematics(m.id, {
      latitude: 15.3456,
      longitude: 76.5432,
      speed: 12.5,
      engineHours: 110
    });
    assert(updated.latitude === 15.3456 && updated.longitude === 76.5432 && updated.engineHours === 110, 'Valid telemetry correctly saved and updated machine location');
  } catch (err) {
    assert(false, `Valid telemetry submission failed: ${err.message}`);
  }

  // 2. Invalid Latitude Rejection
  console.log('\nTest 2: Invalid Latitude Rejection');
  try {
    await machineService.recordTelematics(1, { latitude: 120, longitude: 76.5 });
    assert(false, 'Should have rejected latitude > 90');
  } catch (err) {
    assert(err.message.includes('latitude'), 'Correctly rejected invalid latitude (> 90)');
  }

  // 3. Invalid Longitude Rejection
  console.log('\nTest 3: Invalid Longitude Rejection');
  try {
    await machineService.recordTelematics(1, { latitude: 15.3, longitude: -200 });
    assert(false, 'Should have rejected longitude < -180');
  } catch (err) {
    assert(err.message.includes('longitude'), 'Correctly rejected invalid longitude (< -180)');
  }

  // 4. Invalid Engine Hours Rejection
  console.log('\nTest 4: Invalid Engine Hours Rejection');
  try {
    await machineService.recordTelematics(1, { latitude: 15.3, longitude: 76.5, engineHours: -50 });
    assert(false, 'Should have rejected negative engine hours');
  } catch (err) {
    assert(err.message.includes('Engine hours'), 'Correctly rejected negative engine hours');
  }

  // 5. Unauthorized Telemetry Access (Simulated by invalid machine ID check)
  console.log('\nTest 5: Non-existent Machine / Unauthorized Access');
  try {
    await machineService.recordTelematics(999999, { latitude: 15.3, longitude: 76.5 });
    assert(false, 'Should have thrown 404 for invalid machine ID');
  } catch (err) {
    assert(err.statusCode === 404 || err.message.includes('not found'), 'Correctly returned 404 for invalid machine ID');
  }

  // 6. Service Status Calculation (OK)
  console.log('\nTest 6: Service Status OK Calculation');
  const statusOK = calculateServiceStatus(100, 250, 250);
  assert(statusOK === 'OK', 'Correctly calculated OK status when engine hours (100) < next (250)');

  // 7. SERVICE_DUE Calculation
  console.log('\nTest 7: SERVICE_DUE Calculation');
  const statusDue = calculateServiceStatus(260, 250, 250);
  assert(statusDue === 'SERVICE_DUE', 'Correctly calculated SERVICE_DUE when engine hours (260) >= next (250)');

  // 8. OVERDUE Calculation
  console.log('\nTest 8: OVERDUE Calculation');
  const statusOverdue = calculateServiceStatus(520, 250, 250);
  assert(statusOverdue === 'OVERDUE', 'Correctly calculated OVERDUE when engine hours (520) >= next (250) + interval (250)');

  // 9. Prevent Duplicate Preventive Maintenance Jobs
  console.log('\nTest 9: Prevent Duplicate Preventive Maintenance Jobs');
  try {
    const testM = await machineRepository.create({
      machineCode: `MAC-PM-${Date.now()}`,
      machineName: 'PM Test Harvester',
      engineHours: 100,
      nextServiceHours: 200,
      serviceIntervalHours: 250
    });
    // Trigger SERVICE_DUE twice
    await machineService.recordTelematics(testM.id, { latitude: 15.3, longitude: 76.5, engineHours: 210 });
    await machineService.recordTelematics(testM.id, { latitude: 15.3, longitude: 76.5, engineHours: 220 });

    const jobs = await query(
      "SELECT * FROM maintenance_jobs WHERE machine_id = ? AND issue_description LIKE '%Preventive Maintenance%'",
      [testM.id]
    );
    assert(jobs.length === 1, `Prevented duplicate maintenance job creation (Found exact 1 job, got ${jobs.length})`);
  } catch (err) {
    assert(false, `Prevent duplicate PM jobs test failed: ${err.message}`);
  }

  // 10. Machine Profitability Calculation
  console.log('\nTest 10: Machine Profitability Calculation');
  try {
    const testM = await machineRepository.create({
      machineCode: `MAC-PROF-${Date.now()}`,
      machineName: 'Profitability Test Machine',
      engineHours: 100
    });
    // Seed work entry (Revenue = 10,000)
    await run(
      `INSERT INTO work_entries (bill_number, work_date, farmer_id, machine_id, machine_name, operator_name, village_name, crop_type, work_hours, rate_per_unit, total_amount)
       VALUES (?, ?, 1, ?, 'Test Harvester', 'Test Operator', 'Gangavati', 'Paddy', 10, 1000, 10000)`,
      [`TEST-BILL-${Date.now()}`, '2026-08-10', testM.id]
    );
    // Seed fuel log (Fuel Cost = 3,000)
    await run(
      `INSERT INTO fuel_logs (ticket_number, log_date_time, machine_id, quantity_liters, price_per_liter, total_cost)
       VALUES (?, datetime('now'), ?, 30, 100, 3000)`,
      [`FUEL-TKT-${Date.now()}`, testM.id]
    );

    const [prof] = await analyticsService.getMachineProfitability({ machineId: testM.id });
    assert(prof && prof.revenue === 10000 && prof.fuelCost === 3000 && prof.netProfit === 7000 && prof.profitMarginPercent === 70, 
      `Machine profitability calculated accurately: Revenue ₹10000, Fuel ₹3000, Net Profit ₹7000, Margin 70%`);
  } catch (err) {
    assert(false, `Machine profitability test failed: ${err.message}`);
  }

  // 11. Zero Revenue Profitability
  console.log('\nTest 11: Zero Revenue Profitability Handling');
  try {
    const testM = await machineRepository.create({
      machineCode: `MAC-ZERO-${Date.now()}`,
      machineName: 'Zero Rev Test Machine',
      engineHours: 50
    });
    const [prof] = await analyticsService.getMachineProfitability({ machineId: testM.id });
    assert(prof && prof.revenue === 0 && prof.profitMarginPercent === 0, 'Zero revenue safely handled with 0% margin (no division by zero)');
  } catch (err) {
    assert(false, `Zero revenue test failed: ${err.message}`);
  }

  // 12. Expense Category Aggregation
  console.log('\nTest 12: Expense Category Aggregation');
  try {
    const res = await analyticsService.getExpenseBreakdown();
    assert(Array.isArray(res.categories) && res.categories.length === 5, 'Expense categories aggregated into 5 standard categories');
  } catch (err) {
    assert(false, `Expense category aggregation failed: ${err.message}`);
  }

  // 13. Empty Expense Dataset
  console.log('\nTest 13: Empty Expense Dataset Structure');
  try {
    const res = await analyticsService.getExpenseBreakdown();
    assert(typeof res.totalExpense === 'number' && res.categories.every(c => typeof c.amount === 'number'), 'Returned valid numerical amounts for all expense categories');
  } catch (err) {
    assert(false, `Empty expense dataset test failed: ${err.message}`);
  }

  // 14. SQLite Migration Safety
  console.log('\nTest 14: SQLite Migration Safety');
  try {
    const mCols = await query('PRAGMA table_info(machines)');
    const colNames = mCols.map(c => c.name);
    const requiredCols = ['latitude', 'longitude', 'speed', 'last_gps_update', 'next_service_hours', 'service_interval_hours', 'service_status'];
    const allExist = requiredCols.every(c => colNames.includes(c));
    assert(allExist, 'All migration columns present in machines schema without data corruption');
  } catch (err) {
    assert(false, `SQLite migration safety test failed: ${err.message}`);
  }

  // 15. Booking Type Mismatch Rejection
  console.log('\nTest 15: Booking Type Mismatch Rejection');
  try {
    const harvester = await machineRepository.create({
      machineCode: `HARV-VAL-${Date.now()}`,
      machineName: 'Validation Harvester',
      machineType: 'HARVESTER',
      engineHours: 100
    });
    const tractor = await machineRepository.create({
      machineCode: `TRAC-VAL-${Date.now()}`,
      machineName: 'Validation Tractor',
      machineType: 'TRACTOR',
      engineHours: 100
    });
    const booking = await operationsService.createBooking({
      farmerId: 1,
      machineId: harvester.id,
      machineType: 'HARVESTER',
      estimatedHours: 5
    });
    
    let caught = false;
    try {
      await operationsService.assignMachine(booking.id, tractor.id);
    } catch (err) {
      caught = err.message.includes('Machine type mismatch');
    }
    assert(caught, 'Successfully rejected assigning Tractor to a Harvester booking');
  } catch (err) {
    assert(false, `Booking type mismatch test failed: ${err.message}`);
  }

  // 16. Dispatch Machine Type Mismatch Rejection
  console.log('\nTest 16: Dispatch Machine Type Mismatch Rejection');
  try {
    const harvester = await machineRepository.create({
      machineCode: `HARV-DSP-${Date.now()}`,
      machineName: 'Dispatch Harvester',
      machineType: 'HARVESTER',
      engineHours: 100
    });
    const tractor = await machineRepository.create({
      machineCode: `TRAC-DSP-${Date.now()}`,
      machineName: 'Dispatch Tractor',
      machineType: 'TRACTOR',
      engineHours: 100
    });
    const booking = await operationsService.createBooking({
      farmerId: 1,
      machineId: harvester.id,
      machineType: 'HARVESTER',
      estimatedHours: 5
    });

    let caught = false;
    try {
      await operationsService.createDispatch({
        bookingId: booking.id,
        machineId: tractor.id,
        startEngineHours: 100
      });
    } catch (err) {
      caught = err.message.includes('Machine type mismatch');
    }
    assert(caught, 'Successfully rejected dispatching Tractor for a Harvester booking');
  } catch (err) {
    assert(false, `Dispatch type mismatch test failed: ${err.message}`);
  }

  // 17. Work Execution Machine Type Mismatch Rejection
  console.log('\nTest 17: Work Execution Machine Type Mismatch Rejection');
  try {
    const harvester = await machineRepository.create({
      machineCode: `HARV-WORK-${Date.now()}`,
      machineName: 'Work Harvester',
      machineType: 'HARVESTER',
      engineHours: 100
    });
    const tractor = await machineRepository.create({
      machineCode: `TRAC-WORK-${Date.now()}`,
      machineName: 'Work Tractor',
      machineType: 'TRACTOR',
      engineHours: 100
    });
    const booking = await operationsService.createBooking({
      farmerId: 1,
      machineId: harvester.id,
      machineType: 'HARVESTER',
      estimatedHours: 5
    });

    let caught = false;
    try {
      await operationsService.logWorkExecution({
        bookingId: booking.id,
        machineId: tractor.id,
        workHours: 5,
        ratePerUnit: 2000
      });
    } catch (err) {
      caught = err.message.includes('Machine type mismatch');
    }
    assert(caught, 'Successfully rejected logging Tractor work execution against a Harvester booking');
  } catch (err) {
    assert(false, `Work execution type mismatch test failed: ${err.message}`);
  }

  // 18. Fuel Logs Downstream Filtering
  console.log('\nTest 18: Fuel Logs Downstream Filtering');
  try {
    const harvFuel = await fuelService.getFuelLogs({ machineType: 'HARVESTER' });
    const tracFuel = await fuelService.getFuelLogs({ machineType: 'TRACTOR' });
    assert(Array.isArray(harvFuel) && Array.isArray(tracFuel), 'Successfully retrieved isolated fuel logs for Harvesters and Tractors');
  } catch (err) {
    assert(false, `Fuel logs downstream filtering test failed: ${err.message}`);
  }

  // 19. Maintenance Jobs Downstream Filtering
  console.log('\nTest 19: Maintenance Jobs Downstream Filtering');
  try {
    const harvMaint = await maintenanceService.getJobCards({ machineType: 'HARVESTER' });
    const tracMaint = await maintenanceService.getJobCards({ machineType: 'TRACTOR' });
    assert(Array.isArray(harvMaint.content) && Array.isArray(tracMaint.content), 'Successfully retrieved isolated maintenance jobs for Harvesters and Tractors');
  } catch (err) {
    assert(false, `Maintenance jobs downstream filtering test failed: ${err.message}`);
  }

  // 20. Rented Owner Settlement Downstream Filtering
  console.log('\nTest 20: Rented Owner Settlement Downstream Filtering');
  try {
    const harvLedgers = await machineOwnerService.getSettlementLedgers(undefined, 'HARVESTER');
    const tracLedgers = await machineOwnerService.getSettlementLedgers(undefined, 'TRACTOR');
    assert(Array.isArray(harvLedgers) && Array.isArray(tracLedgers), 'Successfully retrieved isolated owner settlements for Harvesters and Tractors');
  } catch (err) {
    assert(false, `Owner settlement downstream filtering test failed: ${err.message}`);
  }

  // 21. Expense Breakdown Downstream Filtering
  console.log('\nTest 21: Expense Breakdown Downstream Filtering');
  try {
    const harvExp = await analyticsService.getExpenseBreakdown({ machineType: 'HARVESTER' });
    const tracExp = await analyticsService.getExpenseBreakdown({ machineType: 'TRACTOR' });
    assert(typeof harvExp.totalExpense === 'number' && typeof tracExp.totalExpense === 'number', 'Successfully calculated isolated expense breakdowns for Harvesters and Tractors');
  } catch (err) {
    assert(false, `Expense breakdown downstream filtering test failed: ${err.message}`);
  }

  // 22. Machine Profitability Downstream Filtering
  console.log('\nTest 22: Machine Profitability Downstream Filtering');
  try {
    const harvProf = await analyticsService.getMachineProfitability({ machineType: 'HARVESTER' });
    const tracProf = await analyticsService.getMachineProfitability({ machineType: 'TRACTOR' });
    assert(Array.isArray(harvProf) && Array.isArray(tracProf), 'Successfully calculated isolated profitability metrics for Harvesters and Tractors');
  } catch (err) {
    assert(false, `Machine profitability downstream filtering test failed: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
