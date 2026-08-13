import { initDb, get, query, run } from './src/db/database.js';
import sequenceService from './src/services/sequenceService.js';
import invoiceService from './src/services/invoiceService.js';
import receiptService from './src/services/receiptService.js';
import { generateInvoicePdfBuffer, generateReceiptPdfBuffer } from './src/utils/pdfGenerator.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n==================================================');
  console.log('🧪 AGRIBOS — PDF INVOICE & RECEIPT SUITE');
  console.log('==================================================\n');

  try {
    // 1. Initialize Database
    await initDb();

    // Ensure test farmer exists
    let farmer = await get('SELECT * FROM farmers LIMIT 1');
    if (!farmer) {
      const res = await run(
        `INSERT INTO farmers (farmer_code, full_name, mobile_number, village_name) VALUES (?, ?, ?, ?)`,
        ['FARM-2026-9999', 'Basavaraj Gowda', '9876543210', 'Alabanur']
      );
      farmer = await get('SELECT * FROM farmers WHERE id = ?', [res.id]);
    }

    console.log('--- TEST 1: Invoice Sequential Numbering ---');
    const invNo1 = await sequenceService.getNextSequenceNumber('INV', 2026);
    const invNo2 = await sequenceService.getNextSequenceNumber('INV', 2026);
    assert(invNo1.startsWith('INV-2026-'), `Generated INV number format: ${invNo1}`);
    assert(invNo2 !== invNo1, `Sequential numbers are distinct: ${invNo1} vs ${invNo2}`);

    console.log('\n--- TEST 2: Receipt Sequential Numbering ---');
    const recNo1 = await sequenceService.getNextSequenceNumber('REC', 2026);
    const recNo2 = await sequenceService.getNextSequenceNumber('REC', 2026);
    assert(recNo1.startsWith('REC-2026-'), `Generated REC number format: ${recNo1}`);
    assert(recNo2 !== recNo1, `Sequential receipt numbers are distinct: ${recNo1} vs ${recNo2}`);

    console.log('\n--- TEST 3: Concurrent Sequence Generation ---');
    const promises = Array.from({ length: 5 }, () => sequenceService.getNextSequenceNumber('INV', 2026));
    const results = await Promise.all(promises);
    const uniqueResults = new Set(results);
    assert(uniqueResults.size === 5, 'All 5 concurrent sequence requests generated unique numbers');

    console.log('\n--- TEST 4: Product Sale Invoice ---');
    const productInvoice = await invoiceService.createInvoice({
      invoiceType: 'PRODUCT_SALE',
      farmerId: farmer.id,
      invoiceDate: '2026-08-12',
      discount: 100,
      taxAmount: 50,
      paidAmount: 500,
      notes: 'Urea and Pesticide Purchase',
      items: [
        { itemName: 'Urea Fertilizer 50kg', quantity: 2, unit: 'Bags', unitPrice: 350 },
        { itemName: 'Neem Pesticide 1L', quantity: 1, unit: 'Bottle', unitPrice: 400 }
      ]
    });
    assert(productInvoice.subtotal === 1100, `Subtotal calculated correctly: ₹${productInvoice.subtotal}`);
    assert(productInvoice.grandTotal === 1050, `Grand total calculated (1100 - 100 + 50): ₹${productInvoice.grandTotal}`);
    assert(productInvoice.balanceDue === 550, `Balance due calculated (1050 - 500): ₹${productInvoice.balanceDue}`);

    console.log('\n--- TEST 5: Tractor Service Invoice ---');
    const tractorInvoice = await invoiceService.createInvoice({
      invoiceType: 'TRACTOR_SERVICE',
      farmerId: farmer.id,
      discount: 0,
      paidAmount: 2000,
      items: [
        { itemName: 'Tractor Ploughing - KA-36-T-1234', quantity: 5, unit: 'Hours', unitPrice: 800 }
      ]
    });
    assert(tractorInvoice.grandTotal === 4000, `Tractor invoice total: ₹${tractorInvoice.grandTotal}`);
    assert(tractorInvoice.balanceDue === 2000, `Tractor invoice balance due: ₹${tractorInvoice.balanceDue}`);

    console.log('\n--- TEST 6: Harvesting Service Invoice ---');
    const harvestingInvoice = await invoiceService.createInvoice({
      invoiceType: 'HARVESTING_SERVICE',
      farmerId: farmer.id,
      paidAmount: 0,
      items: [
        { itemName: 'Paddy Harvesting - Paddy Harvester MAC-001', itemNameKn: 'ಭತ್ತದ ಕಟಾವು', quantity: 4, unit: 'Acres', unitPrice: 2500 }
      ]
    });
    assert(harvestingInvoice.grandTotal === 10000, `Harvesting invoice total: ₹${harvestingInvoice.grandTotal}`);
    assert(harvestingInvoice.status === 'UNPAID', 'Unpaid invoice status is UNPAID');

    console.log('\n--- TEST 7: Idempotency & Duplicate Prevention ---');
    const sourceTxId = 9991;
    const invA = await invoiceService.createInvoice({
      invoiceType: 'HARVESTING_SERVICE',
      farmerId: farmer.id,
      sourceTransactionType: 'WORK_ENTRY',
      sourceTransactionId: sourceTxId,
      subtotal: 5000
    });
    const invB = await invoiceService.createInvoice({
      invoiceType: 'HARVESTING_SERVICE',
      farmerId: farmer.id,
      sourceTransactionType: 'WORK_ENTRY',
      sourceTransactionId: sourceTxId,
      subtotal: 5000
    });
    assert(invA.id === invB.id, `Idempotent invoice returns identical ID: #${invA.id}`);

    console.log('\n--- TEST 8: Udhar Payment Receipt & Ledger Sync ---');
    try {
      // First log a work entry for farmer to create Udhar balance
      await run(
        `INSERT INTO work_entries (bill_number, work_date, farmer_id, machine_name, operator_name, village_name, crop_type, work_hours, rate_per_unit, total_amount, paid_amount, balance_due, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`BILL-TEST-${Date.now()}`, '2026-08-12', farmer.id, 'Tractor MAC-001', 'Operator Ramu', 'Alabanur', 'Paddy', 2, 2500, 5000, 0, 5000, 'UNPAID']
      );

      const receipt = await receiptService.createReceipt({
        farmerId: farmer.id,
        paymentAmount: 2000,
        paymentMode: 'CASH',
        notes: 'Partial Udhar Payment'
      });
      assert(receipt.receiptNumber.startsWith('REC-2026-'), `Receipt number generated: ${receipt.receiptNumber}`);
      assert(receipt.paymentAmount === 2000, `Payment amount recorded: ₹${receipt.paymentAmount}`);
      assert(receipt.previousBalance >= 5000, `Previous balance captured: ₹${receipt.previousBalance}`);

      console.log('\n--- TEST 9: English PDF Buffer Generation ---');
      const enPdfBuffer = await invoiceService.generatePdf(productInvoice.id, 'en');
      assert(Buffer.isBuffer(enPdfBuffer) && enPdfBuffer.length > 500, `Generated valid English PDF buffer (${enPdfBuffer.length} bytes)`);

      console.log('\n--- TEST 10: Kannada PDF Buffer Generation with Embedded Font ---');
      const knPdfBuffer = await invoiceService.generatePdf(harvestingInvoice.id, 'kn');
      assert(Buffer.isBuffer(knPdfBuffer) && knPdfBuffer.length > 500, `Generated valid Kannada PDF buffer (${knPdfBuffer.length} bytes)`);

      console.log('\n--- TEST 11: Receipt PDF Buffer Generation ---');
      const receiptPdfBuffer = await receiptService.generatePdf(receipt.id, 'kn');
      assert(Buffer.isBuffer(receiptPdfBuffer) && receiptPdfBuffer.length > 500, `Generated valid Receipt PDF buffer (${receiptPdfBuffer.length} bytes)`);
    } catch (e) {
      console.error('❌ Error in Tests 8-11:', e);
      failed++;
    }

    console.log('\n==================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Test suite crash:', err);
    process.exit(1);
  }
}

runTestSuite();
