import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rentedOwnerSettlementApi } from '../api/rentedOwnerSettlementApi';
import { machineOwnerApi } from '../api/machineOwnerApi';
import { RentedOwnerSettlementLedger } from '../types/rentedOwnerSettlement';
import { MachineOwnerFormDialog } from '../components/MachineOwnerFormDialog';
import { Button } from '../../../components/ui/Button';
import {
  Printer,
  Search,
  DollarSign,
  Phone,
  Building2,
  CheckCircle2,
  X,
  Plus,
  Users,
  CreditCard,
  Trash2,
  Building
} from 'lucide-react';

export const RentedOwnerSettlementLedgerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'settlement' | 'directory'>('settlement');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Modal states for payout
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Bank Transfer' | 'UPI / PhonePe' | 'Cash'>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Query ledgers
  const { data: ledgers = [], isLoading: isLedgersLoading } = useQuery({
    queryKey: ['rentedOwnerLedgers', searchQuery],
    queryFn: () => rentedOwnerSettlementApi.getSettlementLedgers(searchQuery),
  });

  // Query raw machine owners for directory tab
  const { data: ownersData, isLoading: isOwnersLoading } = useQuery({
    queryKey: ['machine-owners', searchQuery],
    queryFn: () => machineOwnerApi.getOwners(searchQuery, 0, 100),
  });

  const safeLedgers = Array.isArray(ledgers) ? ledgers : [];
  const rawOwners = Array.isArray(ownersData?.content) ? ownersData.content : Array.isArray(ownersData) ? ownersData : [];

  // Selected owner ledger with fallback
  const selectedLedger: RentedOwnerSettlementLedger | undefined =
    safeLedgers.find(l => l.id === selectedOwnerId) || safeLedgers[0];

  // Payout mutation
  const payoutMutation = useMutation({
    mutationFn: rentedOwnerSettlementApi.recordOwnerPayout,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rentedOwnerLedgers'] });
      queryClient.invalidateQueries({ queryKey: ['machine-owners'] });
      setIsPayoutModalOpen(false);
      setPayoutAmount(0);
      setReferenceNo('');
      setPayoutNotes('');
      setToastMessage(`Payment of ₹${payoutAmount.toLocaleString()} recorded for ${data.ownerName}`);
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  // Create owner mutation
  const createOwnerMutation = useMutation({
    mutationFn: machineOwnerApi.createOwner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentedOwnerLedgers'] });
      queryClient.invalidateQueries({ queryKey: ['machine-owners'] });
      setIsRegisterModalOpen(false);
      setToastMessage('New Rented Fleet Owner registered successfully!');
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  // Delete owner mutation
  const deleteOwnerMutation = useMutation({
    mutationFn: machineOwnerApi.deleteOwner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentedOwnerLedgers'] });
      queryClient.invalidateQueries({ queryKey: ['machine-owners'] });
      setToastMessage('Owner record deleted successfully.');
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
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-bold border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/10 via-slate-900/5 to-transparent p-5 rounded-3xl border border-emerald-500/10 backdrop-blur-xs">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <span>RENTED FLEET OWNERS 360°</span>
            <span className="text-xs font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
              ಮಾಲೀಕರ ಖಾತೆ
            </span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Manage seasonal rented harvester owners, bank accounts, fuel deductions, and net settlement payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register Rented Owner</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-2xl text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Statement</span>
          </button>

          {selectedLedger && (
            <button
              onClick={handleOpenPayout}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-slate-900/20 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-emerald-400 dark:text-white" />
              <span>Pay Owner Settlement ₹</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('settlement')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'settlement'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Settlement Payout Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Owner Directory & Bank Register ({rawOwners.length})</span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Rented Owner by Name, Phone Number, Code, Bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* TAB 1: SETTLEMENT PAYOUT LEDGER */}
      {activeTab === 'settlement' && (
        <div className="space-y-6">

          {/* Owner Carousel Selector */}
          {isLedgersLoading ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              Loading owner settlement records...
            </div>
          ) : safeLedgers.length === 0 ? (
            /* Rich Empty State Card */
            <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  No Rented Machine Owners Registered Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Register third-party rented combine harvester owners to track seasonal harvesting work, company commissions, fuel deductions, and disburse bank payouts.
                </p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-3 rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Register First Rented Fleet Owner</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 overflow-x-auto pt-1 pb-2 scrollbar-thin">
              {safeLedgers.map((owner) => {
                const isSelected = selectedLedger?.id === owner.id;
                return (
                  <button
                    key={owner.id}
                    onClick={() => setSelectedOwnerId(owner.id)}
                    className={`flex flex-col p-3.5 rounded-2xl border text-left min-w-[250px] transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-md ${isSelected ? 'bg-emerald-700/60 text-emerald-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        {owner.ownerCode}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        isSelected ? 'bg-white text-emerald-700 shadow-xs' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        PAYOUT: ₹{(owner.netOwnerPayable || 0).toLocaleString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-black mt-2 truncate">{owner.ownerName}</h4>
                    <p className={`text-[11px] font-medium truncate mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {owner.machineUnitName || owner.registrationOrMachineNo || 'Rented Combine Harvester'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Owner Dark Settlement Audit Box */}
          {selectedLedger && (
            <div className="bg-gradient-to-br from-[#0b1329] via-slate-900 to-[#0d1f3d] text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Owner Info Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-300/30 shrink-0">
                    {(selectedLedger.ownerName || 'O').charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-black tracking-tight">{selectedLedger.ownerName || 'Rented Owner'}</h2>
                      <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
                        {selectedLedger.ownerCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold mt-0.5 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {selectedLedger.mobileNumber || 'N/A'}</span>
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-400" /> {selectedLedger.bankName} ({selectedLedger.accountNumber})</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Net Payable Settlement</div>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    ₹{(selectedLedger.netOwnerPayable || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                    {selectedLedger.auditStatus}
                  </span>
                </div>
              </div>

              {/* Settlement Financial Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Gross Work Billed</div>
                  <div className="text-lg font-black font-mono text-white mt-1">₹{(selectedLedger.grossWorkBilled || 0).toLocaleString()}</div>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                  <div className="text-[10px] font-bold uppercase text-amber-400">Company Commission</div>
                  <div className="text-lg font-black font-mono text-amber-300 mt-1">₹{(selectedLedger.companyCommission || 0).toLocaleString()}</div>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                  <div className="text-[10px] font-bold uppercase text-rose-400">Diesel Deduction</div>
                  <div className="text-lg font-black font-mono text-rose-300 mt-1">₹{(selectedLedger.dieselDeduction || 0).toLocaleString()}</div>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                  <div className="text-[10px] font-bold uppercase text-emerald-400">Advance Paid</div>
                  <div className="text-lg font-black font-mono text-emerald-300 mt-1">₹{(selectedLedger.advancePaid || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: OWNER DIRECTORY & BANK REGISTER */}
      {activeTab === 'directory' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Rented Fleet Owners Register & Bank Accounts</span>
            </h3>

            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Owner</span>
            </button>
          </div>

          {isOwnersLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading machine owners directory...</div>
          ) : rawOwners.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-xs text-slate-500">No machine owners recorded in database.</p>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                + Register First Owner
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Owner Code</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Phone Number</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Bank Account / UPI Payout Info</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rawOwners.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{o.ownerCode}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{o.fullName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{o.mobileNumber}</td>
                      <td className="p-3 text-slate-500">{o.address}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{o.bankName ? `${o.bankName} (${o.accountNumber}) - ${o.ifscCode}` : o.upiId || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => deleteOwnerMutation.mutate(o.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Owner Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REGISTER OWNER MODAL */}
      <MachineOwnerFormDialog
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={async (data) => {
          await createOwnerMutation.mutateAsync(data);
        }}
        isLoading={createOwnerMutation.isPending}
      />

      {/* PAYOUT MODAL */}
      {isPayoutModalOpen && selectedLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Record Owner Settlement Payout</h3>
              <p className="text-xs text-slate-500 mt-0.5">Disburse net seasonal settlement to {selectedLedger.ownerName}</p>
            </div>

            <form onSubmit={handleSubmitPayout} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payout Amount (₹) *</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e: any) => setPaymentMode(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                  <option value="UPI / PhonePe">UPI / PhonePe / GPay</option>
                  <option value="Cash">Cash Handover</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank Ref / Transaction UTR #</label>
                <input
                  type="text"
                  placeholder="e.g. UTR4928104820"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Remarks / Seasonal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional settlement notes..."
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsPayoutModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={payoutMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Confirm Payout ₹
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
