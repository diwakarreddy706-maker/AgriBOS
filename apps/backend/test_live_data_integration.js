import { initDb, get, run, runInTransaction } from './src/db/database.js';
import { machineRepository } from './src/repositories/machineRepository.js';
import { operationsRepository } from './src/repositories/operationsRepository.js';
import { farmerRepository } from './src/repositories/farmerRepository.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runLiveDataIntegrationTests() {
  console.log('================================================================');
  console.log('🧪 AGRIBOS — LIVE DATABASE INTEGRATION V1 TEST SUITE');
  console.log('================================================================\n');

  try {
    await initDb();

    // 1. HARVESTER Fleet API / Repo Test
    console.log('1. HARVESTER FLEET LIVE DB FEED TEST:');
    const harvesterRes = await machineRepository.findAll({ machineType: 'HARVESTER', page: 0, size: 10 });
    assert(Array.isArray(harvesterRes.content), 'Harvester feed returns list of database records');
    assert(harvesterRes.totalElements >= 0, `Total harvesters in DB: ${harvesterRes.totalElements}`);

    // 2. TRACTOR Fleet API / Repo Test
    console.log('\n2. TRACTOR FLEET LIVE DB FEED TEST:');
    const tractorRes = await machineRepository.findAll({ machineType: 'TRACTOR', page: 0, size: 10 });
    assert(Array.isArray(tractorRes.content), 'Tractor feed returns list of database records');
    assert(tractorRes.totalElements >= 0, `Total tractors in DB: ${tractorRes.totalElements}`);

    // 3. Work Executions GET Test
    console.log('\n3. WORK EXECUTION GET LIVE DB TEST:');
    const workGetRes = await operationsRepository.getWorkExecutions({ page: 0, size: 10 });
    assert(Array.isArray(workGetRes.content), 'Work executions returns database list');

    // 4. Work Execution POST Test
    console.log('\n4. WORK EXECUTION POST & PERSISTENCE TEST:');
    const farmersList = await farmerRepository.findAll({ page: 0, size: 10 });
    const firstFarmer = farmersList.content[0] || { id: 1 };
    const machinesList = await machineRepository.findAll({ page: 0, size: 10 });
    const firstMachine = machinesList.content[0] || { id: 1 };

    const postPayload = {
      farmerId: firstFarmer.id,
      machineId: firstMachine.id,
      workDate: '2026-08-12',
      startTime: '08:00 AM',
      endTime: '05:30 PM',
      breakHours: 1.5,
      netWorkingHours: 8.0,
      rateType: 'HOURLY',
      ratePerUnit: 2400,
      advanceCollected: 4000,
      paidAmount: 0,
      notes: 'Live DB Integration Test Work Execution'
    };

    const createdBill = await operationsRepository.logWorkExecution(postPayload);
    assert(createdBill && createdBill.bill_number, `Bill number generated: ${createdBill?.bill_number}`);

    // 5. Server-side Financial Calculations Audit
    console.log('\n5. SERVER-SIDE FINANCIAL CALCULATIONS TEST:');
    assert(parseFloat(createdBill.total_amount) === 19200, `Authoritative total (8 hrs * 2400 = ₹19,200): ${createdBill.total_amount}`);
    assert(parseFloat(createdBill.advance_amount) === 4000, `Advance collected stored correctly: ₹4,000`);
    assert(parseFloat(createdBill.balance_due) === 15200, `Balance due (19200 - 4000 = ₹15,200): ${createdBill.balance_due}`);
    assert(createdBill.status === 'PARTIAL', `Payment status computed: PARTIAL`);

    // 6. Negative Value Rejection
    console.log('\n6. NEGATIVE FINANCIAL VALUE REJECTION TEST:');
    let negError = false;
    try {
      await operationsRepository.logWorkExecution({ ...postPayload, netWorkingHours: -5 });
    } catch (e) {
      negError = true;
    }
    assert(negError, 'Negative working hours rejected cleanly');

    // 7. Invalid Farmer ID Rejection
    console.log('\n7. INVALID FARMER REJECTION TEST:');
    let invalidFarmerError = false;
    try {
      await operationsRepository.logWorkExecution({ ...postPayload, farmerId: 999999 });
    } catch (e) {
      invalidFarmerError = true;
    }
    assert(invalidFarmerError, 'Non-existent farmer ID rejected cleanly');

    // 8. Invalid Machine ID Rejection
    console.log('\n8. INVALID MACHINE REJECTION TEST:');
    let invalidMachineError = false;
    try {
      await operationsRepository.logWorkExecution({ ...postPayload, machineId: 999999 });
    } catch (e) {
      invalidMachineError = true;
    }
    assert(invalidMachineError, 'Non-existent machine ID rejected cleanly');

    // 9. Udhar Credit Ledger Synchronization
    console.log('\n9. FARMER UDHAR CREDIT LEDGER SYNC TEST:');
    const ledgerAccounts = await farmerRepository.getLedgerAccounts();
    const farmerLedger = ledgerAccounts.find((f) => f.id === firstFarmer.id);
    assert(farmerLedger && farmerLedger.totalBalanceDue > 0, `Farmer #${firstFarmer.id} Udhar balance dynamically synced (₹${farmerLedger?.totalBalanceDue})`);

    // 10. Atomic Transaction Rollback Test
    console.log('\n10. ATOMIC TRANSACTION ROLLBACK TEST:');
    let rollbackTriggered = false;
    try {
      await runInTransaction(async () => {
        await run("INSERT INTO work_entries (bill_number, work_date, farmer_id) VALUES ('TEST-ROLLBACK-001', '2026-08-12', 1)");
        throw new Error('Simulated atomic transaction failure');
      });
    } catch (e) {
      rollbackTriggered = true;
    }
    const checkRollback = await get("SELECT * FROM work_entries WHERE bill_number = 'TEST-ROLLBACK-001'");
    assert(rollbackTriggered && !checkRollback, 'Transaction rollback prevented partial data creation');

    // 11. Multi-Device Persistence Verification
    console.log('\n11. MULTI-DEVICE DATA PERSISTENCE SURVIVAL TEST:');
    const fetchedBill = await get('SELECT * FROM work_entries WHERE id = ?', [createdBill.id]);
    assert(fetchedBill && fetchedBill.bill_number === createdBill.bill_number, 'Created machine bill persists in DB and survives refresh');

    console.log('\n================================================================');
    console.log(`📊 LIVE DATA INTEGRATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('❌ Live Data Integration Test Error:', err);
    process.exit(1);
  }
}

runLiveDataIntegrationTests();
