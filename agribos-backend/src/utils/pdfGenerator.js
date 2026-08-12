import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const FONT_PATH = path.join(process.cwd(), 'src', 'assets', 'fonts', 'NotoSansKannada-Regular.ttf');
const HAS_KANNADA_FONT = fs.existsSync(FONT_PATH);

const LABELS = {
  en: {
    orgName: 'SRI BASAVESHWARA & CO.',
    orgSub: 'Alabanur / Sindhanur, Raichur District, Karnataka',
    orgContact: 'Proprietor: Doddana Gowda | Fleet & Agricultural Services',
    taxInvoice: 'TAX INVOICE',
    receipt: 'PAYMENT RECEIPT',
    invNo: 'Invoice No:',
    recNo: 'Receipt No:',
    date: 'Date:',
    ref: 'Reference:',
    billTo: 'Billed To (Farmer Details)',
    receivedFrom: 'Received From (Farmer Details)',
    farmerName: 'Farmer Name:',
    farmerCode: 'Farmer Code:',
    mobile: 'Mobile:',
    village: 'Village:',
    item: 'Item Description',
    qty: 'Qty / Hours / Acres',
    rate: 'Rate (₹)',
    amount: 'Amount (₹)',
    subtotal: 'Subtotal:',
    discount: 'Discount:',
    tax: 'Tax:',
    grandTotal: 'Grand Total:',
    paidAmount: 'Amount Paid:',
    balanceDue: 'Balance Due (Udhar):',
    prevBalance: 'Previous Udhar Balance:',
    receivedAmount: 'Amount Received:',
    remainingBalance: 'Remaining Balance:',
    paymentMode: 'Payment Method:',
    footerNotice: 'This is a computer-generated document. No signature required.',
    thankYou: 'Thank you for doing business with SRI BASAVESHWARA & CO.'
  },
  kn: {
    orgName: 'ಶ್ರೀ ಬಸವೇಶ್ವರ ಆಂಡ್ ಕೊ.',
    orgSub: 'ಅಲಬನೂರು / ಸಿಂಧನೂರು, ರಾಯಚೂರು ಜಿಲ್ಲೆ, ಕರ್ನಾಟಕ',
    orgContact: 'ಮಾಲಕರು: ದೊಡ್ಡನ ಗೌಡ | ಕೃಷಿ ಸೇವೆಗಳು ಮತ್ತು ಟ್ರ್ಯಾಕ್ಟರ್ ಹಾರ್ವೆಸ್ಟರ್',
    taxInvoice: 'ತೆರಿಗೆ ಸರಕುಪಟ್ಟಿ (ಇನ್‌ವಾಯ್ಸ್)',
    receipt: 'ಉಧಾರ್ ಪಾವತಿ ರಸೀದಿ',
    invNo: 'ಸರಕುಪಟ್ಟಿ ಸಂಖ್ಯೆ:',
    recNo: 'ರಸೀದಿ ಸಂಖ್ಯೆ:',
    date: 'ದಿನಾಂಕ:',
    ref: 'ಉಲ್ಲೇಖ:',
    billTo: 'ರೈತರ ವಿವರಗಳು (ಬಿಲ್ ಸ್ವೀಕರಿಸುವವರು)',
    receivedFrom: 'ರೈತರ ವಿವರಗಳು (ಪಾವತಿಸಿದವರು)',
    farmerName: 'ರೈತರ ಹೆಸರು:',
    farmerCode: 'ರೈತರ ಕೋಡ್:',
    mobile: 'ಮೊಬೈಲ್:',
    village: 'ಗ್ರಾಮ:',
    item: 'ವಿವರಣೆ',
    qty: 'ಪ್ರಮಾಣ / ಗಂಟೆ / ಎಕರೆ',
    rate: 'ದರ (₹)',
    amount: 'ಮೊತ್ತ (₹)',
    subtotal: 'ಉಪಮೊತ್ತ:',
    discount: 'ರಿಯಾಯಿತಿ:',
    tax: 'ತೆರಿಗೆ:',
    grandTotal: 'ಒಟ್ಟು ಮೊತ್ತ:',
    paidAmount: 'ಪಾವತಿಸಿದ ಮೊತ್ತ:',
    balanceDue: 'ಉಳಿದ ಬಾಕಿ (ಉಧಾರ್):',
    prevBalance: 'ಹಿಂದಿನ ಉಧಾರ್ ಬಾಕಿ:',
    receivedAmount: 'ಸ್ವೀಕರಿಸಿದ ಮೊತ್ತ:',
    remainingBalance: 'ಪ್ರಸ್ತುತ ಉಧಾರ್ ಬಾಕಿ:',
    paymentMode: 'ಪಾವತಿ ವಿಧಾನ:',
    footerNotice: 'ಇದು ಗಣಕಯಂತ್ರದಿಂದ ಸೃಷ್ಟಿಸಲ್ಪಟ್ಟ ಅಧಿಕೃತ ರಸೀದಿಯಾಗಿದೆ.',
    thankYou: 'ಶ್ರೀ ಬಸವೇಶ್ವರ ಆಂಡ್ ಕೊ. ಜೊತೆ ವ್ಯವಹಾರ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು.'
  }
};

/**
 * Helper to register custom fonts safely
 */
function setupDocFont(doc, lang) {
  if (lang === 'kn' && HAS_KANNADA_FONT) {
    try {
      doc.registerFont('KannadaFont', FONT_PATH);
      doc.font('KannadaFont');
      return 'KannadaFont';
    } catch (err) {
      console.warn('Fallback to Helvetica font:', err.message);
      doc.font('Helvetica');
      return 'Helvetica';
    }
  }
  doc.font('Helvetica');
  return 'Helvetica';
}

/**
 * Generates an Invoice PDF Buffer
 */
export function generateInvoicePdfBuffer(invoice, items = [], farmer = {}, lang = 'en') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const t = LABELS[lang] || LABELS.en;
      setupDocFont(doc, lang);

      // --- Header ---
      doc.rect(40, 40, 515, 75).fillAndStroke('#0f172a', '#1e293b');
      doc.fillColor('#ffffff').fontSize(18).text(t.orgName, 55, 50);
      doc.fontSize(10).fillColor('#94a3b8').text(t.orgSub, 55, 72);
      doc.fontSize(9).fillColor('#cbd5e1').text(t.orgContact, 55, 87);

      // --- Title Banner ---
      doc.fillColor('#0f172a').fontSize(14).text(t.taxInvoice, 40, 130, { align: 'right' });
      
      // Metadata Box
      doc.fontSize(9).fillColor('#334155');
      doc.text(`${t.invNo} ${invoice.invoiceNumber}`, 40, 130);
      doc.text(`${t.date} ${invoice.invoiceDate || new Date().toISOString().split('T')[0]}`, 40, 145);
      if (invoice.invoiceType) {
        doc.text(`Type: ${invoice.invoiceType.replace('_', ' ')}`, 40, 160);
      }

      // Divider
      doc.moveTo(40, 180).lineTo(555, 180).stroke('#e2e8f0');

      // --- Customer / Farmer Info ---
      doc.rect(40, 190, 515, 65).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a').fontSize(10).text(t.billTo, 50, 198);
      doc.fontSize(9).fillColor('#334155');
      doc.text(`${t.farmerName} ${farmer.fullName || farmer.full_name || 'N/A'}`, 50, 215);
      doc.text(`${t.farmerCode} ${farmer.farmerCode || farmer.farmer_code || 'N/A'}`, 50, 230);
      doc.text(`${t.mobile} ${farmer.mobileNumber || farmer.mobile_number || 'N/A'}`, 300, 215);
      doc.text(`${t.village} ${farmer.villageName || farmer.village_name || 'N/A'}`, 300, 230);

      // --- Table Headers ---
      let y = 270;
      doc.rect(40, y, 515, 25).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(9);
      doc.text(t.item, 50, y + 7, { width: 220 });
      doc.text(t.qty, 270, y + 7, { width: 90, align: 'right' });
      doc.text(t.rate, 370, y + 7, { width: 80, align: 'right' });
      doc.text(t.amount, 460, y + 7, { width: 80, align: 'right' });

      y += 25;
      doc.fillColor('#0f172a');

      // --- Table Lines ---
      const itemList = items.length > 0 ? items : [{
        itemName: invoice.notes || 'Service Execution',
        quantity: 1,
        unit: 'Job',
        unitPrice: invoice.subtotal || invoice.grandTotal,
        totalPrice: invoice.subtotal || invoice.grandTotal
      }];

      itemList.forEach((item, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, y, 515, 24).fill(bg);
        doc.fillColor('#334155').fontSize(9);
        
        const nameStr = (lang === 'kn' && item.itemNameKn) ? item.itemNameKn : (item.itemName || item.item_name || 'Item');
        const qtyStr = `${item.quantity || item.quantity === 0 ? item.quantity : 1} ${item.unit || ''}`;
        const rateStr = `₹${Number(item.unitPrice || item.unit_price || item.totalPrice || 0).toLocaleString('en-IN')}`;
        const totalStr = `₹${Number(item.totalPrice || item.total_price || 0).toLocaleString('en-IN')}`;

        doc.text(nameStr, 50, y + 6, { width: 220 });
        doc.text(qtyStr, 270, y + 6, { width: 90, align: 'right' });
        doc.text(rateStr, 370, y + 6, { width: 80, align: 'right' });
        doc.text(totalStr, 460, y + 6, { width: 80, align: 'right' });
        y += 24;
      });

      doc.moveTo(40, y).lineTo(555, y).stroke('#cbd5e1');
      y += 15;

      // --- Financial Summary Box ---
      const sumX = 320;
      doc.rect(sumX, y, 235, 110).fillAndStroke('#f1f5f9', '#94a3b8');
      doc.fillColor('#334155').fontSize(9);

      doc.text(t.subtotal, sumX + 10, y + 10);
      doc.text(`₹${Number(invoice.subtotal || invoice.grandTotal || 0).toLocaleString('en-IN')}`, sumX + 110, y + 10, { width: 110, align: 'right' });

      doc.text(t.discount, sumX + 10, y + 25);
      doc.text(`₹${Number(invoice.discount || 0).toLocaleString('en-IN')}`, sumX + 110, y + 25, { width: 110, align: 'right' });

      doc.text(t.tax, sumX + 10, y + 40);
      doc.text(`₹${Number(invoice.taxAmount || invoice.tax_amount || 0).toLocaleString('en-IN')}`, sumX + 110, y + 40, { width: 110, align: 'right' });

      doc.fontSize(10).fillColor('#0f172a');
      doc.text(t.grandTotal, sumX + 10, y + 58);
      doc.text(`₹${Number(invoice.grandTotal || invoice.total_amount || 0).toLocaleString('en-IN')}`, sumX + 110, y + 58, { width: 110, align: 'right' });

      doc.fontSize(9).fillColor('#166534');
      doc.text(t.paidAmount, sumX + 10, y + 75);
      doc.text(`₹${Number(invoice.paidAmount || invoice.paid_amount || 0).toLocaleString('en-IN')}`, sumX + 110, y + 75, { width: 110, align: 'right' });

      doc.fontSize(9).fillColor('#991b1b');
      doc.text(t.balanceDue, sumX + 10, y + 90);
      doc.text(`₹${Number(invoice.balanceDue || (invoice.grandTotal - invoice.paidAmount) || 0).toLocaleString('en-IN')}`, sumX + 110, y + 90, { width: 110, align: 'right' });

      // --- Footer Notice ---
      const footerY = 730;
      doc.moveTo(40, footerY).lineTo(555, footerY).stroke('#e2e8f0');
      doc.fillColor('#64748b').fontSize(8);
      doc.text(t.thankYou, 40, footerY + 10, { align: 'center' });
      doc.text(t.footerNotice, 40, footerY + 24, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generates a Receipt PDF Buffer
 */
export function generateReceiptPdfBuffer(receipt, farmer = {}, lang = 'en') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const t = LABELS[lang] || LABELS.en;
      setupDocFont(doc, lang);

      // --- Header ---
      doc.rect(40, 40, 515, 75).fillAndStroke('#0f172a', '#1e293b');
      doc.fillColor('#ffffff').fontSize(18).text(t.orgName, 55, 50);
      doc.fontSize(10).fillColor('#94a3b8').text(t.orgSub, 55, 72);
      doc.fontSize(9).fillColor('#cbd5e1').text(t.orgContact, 55, 87);

      // Title Banner
      doc.fillColor('#166534').fontSize(14).text(t.receipt, 40, 130, { align: 'right' });
      
      // Metadata Box
      doc.fontSize(9).fillColor('#334155');
      doc.text(`${t.recNo} ${receipt.receiptNumber}`, 40, 130);
      doc.text(`${t.date} ${receipt.paymentDate || new Date().toISOString().split('T')[0]}`, 40, 145);
      if (receipt.paymentMode || receipt.payment_mode) {
        doc.text(`${t.paymentMode} ${receipt.paymentMode || receipt.payment_mode}`, 40, 160);
      }

      doc.moveTo(40, 180).lineTo(555, 180).stroke('#e2e8f0');

      // Farmer Info
      doc.rect(40, 190, 515, 65).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fillColor('#14532d').fontSize(10).text(t.receivedFrom, 50, 198);
      doc.fontSize(9).fillColor('#166534');
      doc.text(`${t.farmerName} ${farmer.fullName || farmer.full_name || 'N/A'}`, 50, 215);
      doc.text(`${t.farmerCode} ${farmer.farmerCode || farmer.farmer_code || 'N/A'}`, 50, 230);
      doc.text(`${t.mobile} ${farmer.mobileNumber || farmer.mobile_number || 'N/A'}`, 300, 215);
      doc.text(`${t.village} ${farmer.villageName || farmer.village_name || 'N/A'}`, 300, 230);

      // Financial Calculation Card
      const y = 280;
      doc.rect(40, y, 515, 140).fillAndStroke('#ffffff', '#cbd5e1');

      doc.fillColor('#334155').fontSize(10);
      doc.text(t.prevBalance, 60, y + 20);
      doc.text(`₹${Number(receipt.previousBalance || receipt.previous_balance || 0).toLocaleString('en-IN')}`, 350, y + 20, { width: 180, align: 'right' });

      doc.fontSize(11).fillColor('#15803d');
      doc.text(t.receivedAmount, 60, y + 50);
      doc.text(`₹${Number(receipt.paymentAmount || receipt.payment_amount || 0).toLocaleString('en-IN')}`, 350, y + 50, { width: 180, align: 'right' });

      doc.moveTo(60, y + 80).lineTo(530, y + 80).stroke('#cbd5e1');

      doc.fontSize(11).fillColor('#991b1b');
      doc.text(t.remainingBalance, 60, y + 95);
      doc.text(`₹${Number(receipt.remainingBalance || receipt.remaining_balance || 0).toLocaleString('en-IN')}`, 350, y + 95, { width: 180, align: 'right' });

      if (receipt.notes || receipt.transactionRef) {
        doc.fontSize(8).fillColor('#64748b').text(`Notes/Ref: ${receipt.notes || receipt.transactionRef}`, 60, y + 120);
      }

      // Footer
      const footerY = 730;
      doc.moveTo(40, footerY).lineTo(555, footerY).stroke('#e2e8f0');
      doc.fillColor('#64748b').fontSize(8);
      doc.text(t.thankYou, 40, footerY + 10, { align: 'center' });
      doc.text(t.footerNotice, 40, footerY + 24, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export default { generateInvoicePdfBuffer, generateReceiptPdfBuffer };
