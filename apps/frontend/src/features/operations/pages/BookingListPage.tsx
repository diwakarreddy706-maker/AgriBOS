import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi } from '../api/operationsApi';
import { RentMachineLedgerTicket, BookingCreatePayload } from '../types/operations';
import { BookingFormDialog } from '../components/BookingFormDialog';
import { 
  Search, 
  Plus, 
  Tractor, 
  Calendar, 
  Phone, 
  Receipt, 
  Printer, 
  X, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export const BookingListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<RentMachineLedgerTicket | null>(null);
  const [advanceAmountInput, setAdvanceAmountInput] = useState<number>(0);

  // Query rental machine ledger tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['rentMachineLedger', searchQuery, statusFilter],
    queryFn: () => operationsApi.getRentMachineLedgerTickets(searchQuery, statusFilter),
  });

  const createMutation = useMutation({
    mutationFn: (payload: BookingCreatePayload) => operationsApi.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentMachineLedger'] });
      setIsBookingOpen(false);
    },
  });

  const handleRecordAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTicket && advanceAmountInput > 0) {
      await operationsApi.recordRentalAdvancePayment(selectedTicket.id, Number(advanceAmountInput));
      queryClient.invalidateQueries({ queryKey: ['rentMachineLedger'] });
      setIsAdvanceModalOpen(false);
      setSelectedTicket(null);
      setAdvanceAmountInput(0);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Financial Summaries
  const totalBookings = tickets.length;
  const totalRevenue = tickets.reduce((acc, t) => acc + t.totalEstimatedAmount, 0);
  const totalAdvance = tickets.reduce((acc, t) => acc + t.advanceAmountPaid, 0);
  const totalBalanceDue = tickets.reduce((acc, t) => acc + t.balanceDue, 0);

  return (
    <div className="space-y-6 pb-12 font-sans antialiased text-slate-800 dark:text-slate-100">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <span>RENT MACHINE LEDGER BOOK</span>
            <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
              ಬಾಡಿಗೆ ಯಂತ್ರಗಳ ಖಾತೆ ಪುಸ್ತಕ
            </span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Track machine rental bookings, farmer field schedules, advance collections & outstanding rental balances.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Ledger</span>
          </button>

          <button
            onClick={() => setIsBookingOpen(true)}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log New Rental Booking</span>
          </button>
        </div>
      </div>

      {/* 4 Rental Financial KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TOTAL RENTAL BOOKINGS</span>
            <Tractor className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalBookings} Bookings
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Seasonal rental registry</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ESTIMATED RENTAL REVENUE</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            ₹{totalRevenue.toLocaleString()}
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Gross estimated billing</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ADVANCE COLLECTED</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            ₹{totalAdvance.toLocaleString()}
          </h3>
          <p className="text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Received upfront</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs bg-red-50/20 dark:bg-red-950/10">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">OUTSTANDING BALANCE (UDHAR)</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 font-mono">
            ₹{totalBalanceDue.toLocaleString()}
          </h3>
          <p className="text-[10px] font-semibold text-red-500/80 mt-0.5">Pending collection</p>
        </div>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Booking #, Farmer Name, Phone No, Machine Name, or Village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto shrink-0">
            {['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === tab
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Rent Machine Ledger Book Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Tractor className="w-4 h-4 text-emerald-600" />
            <span>RENTAL BOOKINGS & MACHINERY LEDGER REGISTRY</span>
          </h3>
          <span className="text-[11px] font-bold text-slate-400">
            {tickets.length} Rental Records Listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4">BOOKING NO & WORK DATE</th>
                <th className="p-4">FARMER & VILLAGE</th>
                <th className="p-4">RENTAL MACHINERY UNIT</th>
                <th className="p-4">CROP & WORK UNITS</th>
                <th className="p-4">TOTAL BILL (₹)</th>
                <th className="p-4">ADVANCE PAID (₹)</th>
                <th className="p-4">BALANCE DUE (₹)</th>
                <th className="p-4">RENTAL STATUS</th>
                <th className="p-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-slate-400">Loading rental machine ledger...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-slate-400">No rental bookings found matching criteria.</td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    
                    {/* Booking No & Work Date */}
                    <td className="p-4">
                      <div className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                        {t.bookingNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Work: {new Date(t.preferredWorkDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>

                    {/* Farmer & Village */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{t.farmerName}</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center space-x-2">
                        <span className="flex items-center space-x-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{t.farmerPhone}</span>
                        </span>
                        <span>•</span>
                        <span>{t.villageName}</span>
                      </div>
                    </td>

                    {/* Machine Unit */}
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{t.machineName}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{t.registrationNumber}</div>
                    </td>

                    {/* Crop & Estimated Work */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{t.cropType}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {t.estimatedWorkUnits} {t.rateType === 'HOURLY' ? 'Hrs' : 'Acres'} @ ₹{t.ratePerUnit}/{t.rateType === 'HOURLY' ? 'hr' : 'acre'}
                      </div>
                    </td>

                    {/* Total Estimated */}
                    <td className="p-4 font-mono font-black text-slate-900 dark:text-white">
                      ₹{t.totalEstimatedAmount.toLocaleString()}
                    </td>

                    {/* Advance Paid */}
                    <td className="p-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{t.advanceAmountPaid.toLocaleString()}
                    </td>

                    {/* Balance Due */}
                    <td className="p-4 font-mono font-black text-red-600 dark:text-red-400">
                      ₹{t.balanceDue.toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : t.status === 'CONFIRMED'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      {t.balanceDue > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setAdvanceAmountInput(t.balanceDue);
                            setIsAdvanceModalOpen(true);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
                        >
                          Collect ₹
                        </button>
                      ) : (
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">Paid in Full</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLLECT RENTAL PAYMENT MODAL                                              */}
      {/* ========================================================================= */}
      {isAdvanceModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  COLLECT RENTAL PAYMENT
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Record payment for {selectedTicket.farmerName} ({selectedTicket.bookingNumber})
                </p>
              </div>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordAdvance} className="p-6 space-y-4">
              
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Machine Unit:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTicket.machineName}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Total Booking Bill:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₹{selectedTicket.totalEstimatedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                  <span className="text-red-500">Current Pending Balance:</span>
                  <span className="font-mono text-red-600 text-sm">₹{selectedTicket.balanceDue.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  COLLECTION AMOUNT (₹) *
                </label>
                <input
                  type="number"
                  max={selectedTicket.balanceDue}
                  value={advanceAmountInput}
                  onChange={(e) => setAdvanceAmountInput(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Confirm Payment ₹
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* New Booking Form Dialog */}
      <BookingFormDialog
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSubmit={async (payload) => {
          await createMutation.mutateAsync(payload);
        }}
        isLoading={createMutation.isPending}
      />

    </div>
  );
};

export default BookingListPage;
