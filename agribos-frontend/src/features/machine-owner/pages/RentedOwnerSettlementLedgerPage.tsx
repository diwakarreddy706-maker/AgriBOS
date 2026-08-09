import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rentedOwnerSettlementApi } from '../api/rentedOwnerSettlementApi';
import { RentedOwnerSettlementLedger } from '../types/rentedOwnerSettlement';
import { 
  Printer, 
  Search, 
  DollarSign, 
  Phone, 
  Building2, 
  CheckCircle2, 
  X
} from 'lucide-react';

export const RentedOwnerSettlementLedgerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(1);

  // Modal states
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Bank Transfer' | 'UPI / PhonePe' | 'Cash'>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Query ledgers
  const { data: ledgers = [], isLoading } = useQuery({
    queryKey: ['rentedOwnerLedgers', searchQuery],
    queryFn: () => rentedOwnerSettlementApi.getSettlementLedgers(searchQuery),
  });

  // Selected owner ledger with fallback
  const selectedLedger: RentedOwnerSettlementLedger | undefined = 
    ledgers.find(l => l.id === selectedOwnerId) || ledgers[0];

  // Payout mutation
  const payoutMutation = useMutation({
    mutationFn: rentedOwnerSettlementApi.recordOwnerPayout,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rentedOwnerLedgers'] });
      setIsPayoutModalOpen(false);
      setPayoutAmount(0);
      setReferenceNo('');
      setPayoutNotes('');
      setToastMessage(`Payment of ₹${payoutAmount.toLocaleString()} recorded for ${data.ownerName}`);
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleOpenPayout = () => {
    if (selectedLedger) {
      setPayoutAmount(selectedLedger.netOwnerPayable);
      setIsPayoutModalOpen(true);
    }
  };

  const handleSubmitPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLedger || payoutAmount <= 0) return;

    payoutMutation.mutate({
      ownerId: selectedLedger.id,
      amount: Number(payoutAmount),
      paymentMode,
      referenceNo,
      notes: payoutNotes
    });
  };

  return (
    <div className="space-y-6 pb-12 font-sans antialiased text-slate-800 dark:text-slate-100">

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-bold animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/10 via-slate-900/5 to-transparent p-5 rounded-3xl border border-emerald-500/10 backdrop-blur-xs">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <span>RENTED OWNER SETTLEMENT LEDGER</span>
            <span className="text-xs font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
              ಮಾಲೀಕರ ಖಾತೆ
            </span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Audit seasonal harvesting revenue, company commissions, fuel deductions, and disburse net owner settlement payouts.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 self-start md:self-auto">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-2xl text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Statement</span>
          </button>

          <button
            onClick={handleOpenPayout}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95"
          >
            <DollarSign className="w-4 h-4" />
            <span>Pay Owner Settlement ₹</span>
          </button>
        </div>
      </div>

      {/* Search Input & Owner Cards Selector */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Rented Owner by Name, Phone Number (e.g. 9008623974), Code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Owner Selector Carousel Cards */}
        <div className="flex items-center space-x-3 overflow-x-auto pt-1 pb-2 scrollbar-thin">
          {isLoading ? (
            <div className="text-xs text-slate-400 py-3">Loading owner settlement records...</div>
          ) : ledgers.length === 0 ? (
            <div className="text-xs text-slate-400 py-3">No owners found matching query.</div>
          ) : (
            ledgers.map((owner) => {
              const isSelected = selectedLedger?.id === owner.id;
              return (
                <button
                  key={owner.id}
                  onClick={() => setSelectedOwnerId(owner.id)}
                  className={`flex flex-col p-3.5 rounded-2xl border text-left min-w-[250px] transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-md ${isSelected ? 'bg-emerald-700/60 text-emerald-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      {owner.ownerCode}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      isSelected ? 'bg-white text-emerald-700 shadow-xs' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      PAYOUT: ₹{owner.netOwnerPayable.toLocaleString()}
                    </span>
                  </div>

                  <h4 className="text-xs font-black mt-2 truncate">{owner.ownerName}</h4>
                  <p className={`text-[11px] font-medium truncate mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {owner.machineUnitName}
                  </p>
                </button>
              );
            })
          )}
        </div>

      </div>

      {/* Selected Owner Dark Banner Box */}
      {selectedLedger ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#0b1329] via-slate-900 to-[#0d1f3d] text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-6 relative overflow-hidden">
            
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Row: Owner Info & Audit Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-300/30 shrink-0">
                  {selectedLedger.ownerName.charAt(0)}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-black tracking-tight">{selectedLedger.ownerName}</h2>
                    <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
                      {selectedLedger.ownerCode}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-semibold mt-0.5">
                    Machine Unit: {selectedLedger.machineUnitName}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1 font-medium">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono font-bold">{selectedLedger.mobileNumber}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono">{selectedLedger.bankName} (A/C: {selectedLedger.accountNumber} • IFSC: {selectedLedger.ifscCode})</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge & Disburse Button */}
              <div className="flex items-center space-x-3 self-start md:self-auto">
                <button
                  onClick={handleOpenPayout}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-md hover:scale-105"
                >
                  Disburse Payout ₹
                </button>

                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                    AUDIT STATUS
                  </span>
                  <span className="inline-block mt-0.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {selectedLedger.auditStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* 5 Financial Summary Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 relative z-10">
              
              {/* Gross Work Billed */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 backdrop-blur-xs">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">GROSS WORK BILLED</p>
                <h3 className="text-xl font-black text-white mt-1 font-mono">
                  ₹{selectedLedger.grossWorkBilled.toLocaleString()}
                </h3>
                <p className="text-[9px] text-slate-400 mt-1 font-semibold">Total machine revenue</p>
              </div>

              {/* Company Comm (15%) */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 backdrop-blur-xs">
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider">COMPANY COMM (15%)</p>
                <h3 className="text-xl font-black text-amber-400 mt-1 font-mono">
                  -₹{selectedLedger.companyCommission.toLocaleString()}
                </h3>
                <p className="text-[9px] text-amber-300/70 mt-1 font-semibold">Platform brokerage</p>
              </div>

              {/* Diesel Deduction */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 backdrop-blur-xs">
                <p className="text-[9px] font-black text-sky-400 uppercase tracking-wider">DIESEL DEDUCTION</p>
                <h3 className="text-xl font-black text-sky-400 mt-1 font-mono">
                  -₹{selectedLedger.dieselDeduction.toLocaleString()}
                </h3>
                <p className="text-[9px] text-sky-300/70 mt-1 font-semibold">Company fuel tokens</p>
              </div>

              {/* Advance Paid */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 backdrop-blur-xs">
                <p className="text-[9px] font-black text-purple-400 uppercase tracking-wider">ADVANCE PAID</p>
                <h3 className="text-xl font-black text-purple-400 mt-1 font-mono">
                  -₹{selectedLedger.advancePaid.toLocaleString()}
                </h3>
                <p className="text-[9px] text-purple-300/70 mt-1 font-semibold">Upfront advances</p>
              </div>

              {/* Net Owner Payable */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 col-span-2 md:col-span-1 backdrop-blur-xs">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">NET OWNER PAYABLE</p>
                <h3 className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                  ₹{selectedLedger.netOwnerPayable.toLocaleString()}
                </h3>
                <p className="text-[9px] text-emerald-300/80 mt-1 font-semibold">Final net payout balance</p>
              </div>

            </div>

          </div>

          {/* Table: Work Executions & Payout Ledger */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>SEASONAL WORK EXECUTIONS & PAYOUT LEDGER FOR {selectedLedger.ownerName.toUpperCase()}</span>
              </h3>
              <span className="text-[11px] font-extrabold text-slate-400 font-mono">
                {selectedLedger.workExecutions.length} Work Sessions Audited
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="p-4">WORK DATE</th>
                    <th className="p-4">FARMER & VILLAGE</th>
                    <th className="p-4">OPERATION & HOURS</th>
                    <th className="p-4">GROSS BILL (₹)</th>
                    <th className="p-4">COMMISSION (15%)</th>
                    <th className="p-4">DIESEL DEDUCTION</th>
                    <th className="p-4">NET OWNER PAYOUT (₹)</th>
                    <th className="p-4 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200">
                  {selectedLedger.workExecutions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">No work sessions executed for this machine unit yet.</td>
                    </tr>
                  ) : (
                    selectedLedger.workExecutions.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        
                        {/* Work Date */}
                        <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {entry.workDate}
                        </td>

                        {/* Farmer & Village */}
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 dark:text-white">{entry.farmerName}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{entry.villageName}</div>
                        </td>

                        {/* Operation & Hours */}
                        <td className="p-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{entry.operationType}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{entry.hoursOrAcres}</div>
                        </td>

                        {/* Gross Bill */}
                        <td className="p-4 font-mono font-extrabold text-slate-900 dark:text-slate-100">
                          ₹{entry.grossBill.toLocaleString()}
                        </td>

                        {/* Commission */}
                        <td className="p-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                          -₹{entry.commissionAmount.toLocaleString()}
                        </td>

                        {/* Diesel Deduction */}
                        <td className="p-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                          -₹{entry.dieselDeduction.toLocaleString()}
                        </td>

                        {/* Net Owner Payout */}
                        <td className="p-4 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          ₹{entry.netOwnerPayout.toLocaleString()}
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-[10px] px-2.5 py-1 rounded-lg uppercase border border-emerald-200 dark:border-emerald-800">
                            {entry.status}
                          </span>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No rented machine owners registered</p>
          <p className="text-xs text-slate-400">Add rented machine owners to track seasonal settlement ledgers.</p>
        </div>
      )}

      {/* Pay Owner Settlement Modal */}
      {isPayoutModalOpen && selectedLedger && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                  Pay Owner Settlement
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  {selectedLedger.ownerName} ({selectedLedger.ownerCode})
                </p>
              </div>
              <button 
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400">Bank Details for Payout</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedLedger.bankName} - A/C: {selectedLedger.accountNumber}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">IFSC: {selectedLedger.ifscCode}</p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Payout Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-base font-black font-mono text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI / PhonePe">UPI / PhonePe</option>
                  <option value="Cash">Cash Handover</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Transaction Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR9988220192"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutMutation.isPending}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all hover:scale-105"
                >
                  {payoutMutation.isPending ? 'Processing...' : 'Disburse Payout'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

