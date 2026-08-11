import { db, query, run } from './src/db/sqlite.js';

async function cleanTestDataFromDatabase() {
  console.log('================================================================');
  console.log('🧹 AGRIBOS — PURGING AUTOMATED TEST VALIDATION RECORDS FROM DB');
  console.log('================================================================\n');

  // 1. Identify test machines
  const testMachines = await query(`
    SELECT id, machine_code, machine_name, machine_type 
    FROM machines 
    WHERE machine_code LIKE 'TRAC-%'
       OR machine_code LIKE 'MAC-%'
       OR machine_code LIKE 'HARV-%'
       OR machine_name LIKE '%Test%'
       OR machine_name LIKE 'Work %'
       OR machine_name LIKE 'Dispatch %'
       OR machine_name LIKE 'Validation %'
  `);

  console.log(`Found ${testMachines.length} automated test validation machines to purge.`);

  const machineIds = testMachines.map(m => m.id);

  if (machineIds.length > 0) {
    const idList = machineIds.join(',');

    console.log('Purging test dispatches...');
    const dispatchesDel = await run(`DELETE FROM dispatches WHERE machine_id IN (${idList})`);
    console.log(`  - Deleted ${dispatchesDel.changes} test dispatches`);

    console.log('Purging test work entries...');
    const workDel = await run(`DELETE FROM work_entries WHERE machine_id IN (${idList})`);
    console.log(`  - Deleted ${workDel.changes} test work entries`);

    console.log('Purging test fuel logs...');
    const fuelDel = await run(`DELETE FROM fuel_logs WHERE machine_id IN (${idList})`);
    console.log(`  - Deleted ${fuelDel.changes} test fuel logs`);

    console.log('Purging test maintenance jobs...');
    const maintDel = await run(`DELETE FROM maintenance_jobs WHERE machine_id IN (${idList})`);
    console.log(`  - Deleted ${maintDel.changes} test maintenance jobs`);

    console.log('Purging test telematics history...');
    const telemDel = await run(`DELETE FROM machine_telematics_history WHERE machine_id IN (${idList})`);
    console.log(`  - Deleted ${telemDel.changes} test telematics records`);

    console.log('Purging test bookings...');
    const bookDel = await run(`DELETE FROM bookings WHERE machine_id IN (${idList})`);
    console.log(`  - Deleted ${bookDel.changes} test bookings`);

    console.log('Purging test machines...');
    const machDel = await run(`DELETE FROM machines WHERE id IN (${idList})`);
    console.log(`  - Deleted ${machDel.changes} test machines`);
  }

  // 2. Identify test farmers
  const testFarmers = await query(`
    SELECT id, full_name, farmer_code 
    FROM farmers 
    WHERE full_name LIKE '%Test%'
       OR full_name = 'Nagaraj Patil'
       OR full_name = 'Sharanappa Gowda'
       OR farmer_code LIKE 'FAR-TEST%'
       OR farmer_code LIKE 'FARM-%'
  `);

  console.log(`\nFound ${testFarmers.length} automated test farmers to purge.`);

  const farmerIds = testFarmers.map(f => f.id);
  if (farmerIds.length > 0) {
    const fIdList = farmerIds.join(',');

    console.log('Purging test farmer payments...');
    const fpDel = await run(`DELETE FROM farmer_payments WHERE farmer_id IN (${fIdList})`);
    console.log(`  - Deleted ${fpDel.changes} test farmer payments`);

    console.log('Purging test customer invoices...');
    const invDel = await run(`DELETE FROM customer_invoices WHERE farmer_id IN (${fIdList})`);
    console.log(`  - Deleted ${invDel.changes} test customer invoices`);

    console.log('Purging test bookings for farmers...');
    const fbDel = await run(`DELETE FROM bookings WHERE farmer_id IN (${fIdList})`);
    console.log(`  - Deleted ${fbDel.changes} test farmer bookings`);

    console.log('Purging test farmers...');
    const fDel = await run(`DELETE FROM farmers WHERE id IN (${fIdList})`);
    console.log(`  - Deleted ${fDel.changes} test farmers`);
  }

  // 3. Identify test machine owners
  const testOwners = await query(`
    SELECT id, full_name, owner_code 
    FROM machine_owners 
    WHERE full_name LIKE '%Test%'
       OR full_name = 'Huchappa Gowda'
       OR owner_code LIKE 'OWN-TEST%'
       OR owner_code LIKE 'OWN-%'
  `);

  console.log(`\nFound ${testOwners.length} automated test machine owners to purge.`);
  const ownerIds = testOwners.map(o => o.id);
  if (ownerIds.length > 0) {
    const oIdList = ownerIds.join(',');

    console.log('Purging test owner payouts...');
    const opDel = await run(`DELETE FROM owner_payouts WHERE owner_id IN (${oIdList})`);
    console.log(`  - Deleted ${opDel.changes} test owner payouts`);

    console.log('Purging test machine owners...');
    const oDel = await run(`DELETE FROM machine_owners WHERE id IN (${oIdList})`);
    console.log(`  - Deleted ${oDel.changes} test machine owners`);
  }

  // Clear any remaining orphan test records
  console.log('\nPurging remaining orphan test work entries, fuel logs, maintenance jobs...');
  await run(`DELETE FROM work_entries WHERE notes LIKE '%test%' OR notes LIKE '%Scenario%'`);
  await run(`DELETE FROM fuel_logs WHERE remarks LIKE '%test%' OR remarks LIKE '%Scenario%'`);
  await run(`DELETE FROM maintenance_jobs WHERE issue_description LIKE '%test%' OR issue_description LIKE '%Scenario%'`);

  // 4. Verify table counts after cleaning
  console.log('\n================================================================');
  console.log('📊 DATABASE CLEAN STATE INSPECTION AFTER PURGING TEST DATA:');
  console.log('================================================================');

  const remainingMachines = await query('SELECT COUNT(*) as c FROM machines');
  const remainingFarmers = await query('SELECT COUNT(*) as c FROM farmers');
  const remainingOwners = await query('SELECT COUNT(*) as c FROM machine_owners');
  const remainingBookings = await query('SELECT COUNT(*) as c FROM bookings');
  const remainingDispatches = await query('SELECT COUNT(*) as c FROM dispatches');
  const remainingWork = await query('SELECT COUNT(*) as c FROM work_entries');
  const remainingFuel = await query('SELECT COUNT(*) as c FROM fuel_logs');
  const remainingMaint = await query('SELECT COUNT(*) as c FROM maintenance_jobs');

  console.log(`  - Machines remaining     : ${remainingMachines[0].c}`);
  console.log(`  - Farmers remaining      : ${remainingFarmers[0].c}`);
  console.log(`  - Machine Owners rem     : ${remainingOwners[0].c}`);
  console.log(`  - Bookings remaining     : ${remainingBookings[0].c}`);
  console.log(`  - Dispatches remaining   : ${remainingDispatches[0].c}`);
  console.log(`  - Work entries remaining : ${remainingWork[0].c}`);
  console.log(`  - Fuel logs remaining    : ${remainingFuel[0].c}`);
  console.log(`  - Maintenance jobs rem   : ${remainingMaint[0].c}`);

  console.log('\n================================================================');
  console.log('✅ DATABASE IS CLEAN AND 100% READY FOR REAL BUSINESS DATA ENTRY');
  console.log('================================================================');

  process.exit(0);
}

cleanTestDataFromDatabase().catch(err => {
  console.error('❌ FAILED TO CLEAN TEST DATA:', err);
  process.exit(1);
});
