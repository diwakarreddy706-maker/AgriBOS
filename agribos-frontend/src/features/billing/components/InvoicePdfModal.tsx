import React, { useRef } from 'react';
import { Printer, Share2, X, CheckCircle2, AlertCircle, Tractor, Shield } from 'lucide-react';
import { MachineBillEntry } from '../types/billing';

import { useLanguageStore } from '../../../store/useLanguageStore';

interface InvoicePdfModalProps {
  bill: MachineBillEntry;
  onClose: () => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({ bill, onClose }) => {
  const { t, language } = useLanguageStore();
  const printableRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*SRI BASAVESHWARA %26 CO.*%0A` +
      `*AGRICULTURAL HARVESTING BILL RECEIPT*%0A` +
      `----------------------------------%0A` +
      `*Bill No:* ${bill.billNumber}%0A` +
      `*Date:* ${bill.billDate}%0A` +
      `*Farmer Name:* ${bill.farmerName} (${bill.villageName})%0A` +
      `*Machine:* ${bill.machineCode} - ${bill.machineName}%0A` +
      `*Working Hours:* ${bill.netWorkingHours} hrs (Break: ${bill.breakHours} hrs)%0A` +
      `*Rate:* ₹${bill.ratePerUnit}/${bill.rateType}%0A` +
      `----------------------------------%0A` +
      `*Total Amount:* ₹${bill.totalAmount.toLocaleString()}%0A` +
      `*Advance Paid:* ₹${(bill.advanceAmount || 0).toLocaleString()}%0A` +
      `*Paid Amount:* ₹${bill.paidAmount.toLocaleString()}%0A` +
      `*Balance Due (Udhar):* ₹${bill.balanceDue.toLocaleString()}%0A` +
      `----------------------------------%0A` +
      `Proprietor: Doddana Gowda | Alabanur / Sindhanur`;
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative my-8">
        
        {/* Action Header Bar (Hidden during window.print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Tractor className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm tracking-wide uppercase">
              {language === 'kn' ? 'ಅಧಿಕೃತ ರಸೀದಿ ಮುದ್ರಣ' : 'Official Bill Receipt Preview'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE BILL CONTENT AREA */}
        <div ref={printableRef} className="p-6 md:p-8 space-y-6 bg-white text-slate-900 font-sans print:p-0">
          
          {/* Header Brand Block */}
          <div className="text-center space-y-1.5 border-b-2 border-emerald-600 pb-5">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full text-emerald-800 border border-emerald-200 mb-1">
              <Shield className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span className="text-[10px] font-black tracking-widest uppercase">AGRICULTURAL ENTERPRISE</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-950 uppercase">
              SRI BASAVESHWARA & CO.
            </h1>
            <p className="text-xs font-bold text-slate-600">
              Harvesting, Tractor Services & Agricultural Fleet Operations
            </p>
            <p className="text-[11px] font-semibold text-slate-500">
              Alabanur / Sindhanur, Raichur Dist, Karnataka | Proprietor: <span className="font-black text-slate-900">Doddana Gowda</span>
            </p>
          </div>

          {/* Bill Serial Metadata Box */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono">
            <div>
              <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Receipt / Bill No</p>
              <p className="font-black text-sm text-emerald-700">{bill.billNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Billing Date</p>
              <p className="font-bold text-slate-900">{bill.billDate}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Farmer Name</p>
              <p className="font-black text-slate-900 text-sm">{bill.farmerName}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Village Location</p>
              <p className="font-bold text-slate-900">{bill.villageName}</p>
            </div>
          </div>

          {/* Machine & Timing Details */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200 flex justify-between">
              <span>Machine Operational Details</span>
              <span>{bill.machineCode}</span>
            </div>
            <div className="p-4 space-y-2 font-mono">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Machine Model:</span>
                <span className="font-bold text-slate-900">{bill.machineName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Start Time:</span>
                <span className="font-semibold text-slate-800">{bill.startTime}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5 text-amber-700">
                <span>Recorded Break Pauses:</span>
                <span>{bill.breakHours} hrs</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">End Time:</span>
                <span className="font-semibold text-slate-800">{bill.endTime}</span>
              </div>
              <div className="flex justify-between font-extrabold text-emerald-800 pt-1 text-xs">
                <span>Net Billable Hours:</span>
                <span>{bill.netWorkingHours} Hours</span>
              </div>
            </div>
          </div>

          {/* Financial Calculation Statement */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 font-mono">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Billing Rate ({bill.rateType}):</span>
              <span>₹{bill.ratePerUnit.toLocaleString()} / unit</span>
            </div>
            <div className="flex justify-between text-base font-black text-emerald-400 border-b border-slate-700 pb-2">
              <span>Total Bill Amount:</span>
              <span>₹{bill.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-indigo-300">
              <span>Advance Payment Received:</span>
              <span>₹{(bill.advanceAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-300">
              <span>Settled Cash Payment:</span>
              <span>₹{bill.paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-700 text-amber-400">
              <span>Net Balance Due (Udhar):</span>
              <span className={bill.balanceDue > 0 ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}>
                ₹{bill.balanceDue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Notes & Authorized Signature */}
          <div className="pt-4 flex items-end justify-between border-t border-dashed border-slate-300 text-xs">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</p>
              <div className="flex items-center space-x-1 font-bold">
                {bill.balanceDue === 0 ? (
                  <span className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> FULLY SETTLED
                  </span>
                ) : (
                  <span className="flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" /> UDHAR / PARTIAL DUE
                  </span>
                )}
              </div>
            </div>
            <div className="text-center space-y-8">
              <div className="h-6 border-b border-slate-400 w-36"></div>
              <p className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                {language === 'kn' ? 'ಅಧಿಕೃತ ಸಹಿ' : 'Authorized Signatory'}
              </p>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center pt-2 text-[9px] text-slate-400 font-mono">
            Thank you for choosing Sri Basaveshwara & Co. | Computer generated bill receipt.
          </div>
        </div>

        {/* ACTION BUTTONS BAR (Hidden in Print) */}
        <div className="bg-slate-100 dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printOfficialBill || 'Print Official Bill Receipt'}</span>
          </button>
          
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareWhatsApp || 'Share on WhatsApp'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
