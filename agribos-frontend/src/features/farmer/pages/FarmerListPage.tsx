import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmerApi } from '../api/farmerApi';
import { FarmerLedgerAccount, FarmerWorkEntry } from '../types/farmer';
import { FarmerFormDialog } from '../components/FarmerFormDialog';
import { 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  Receipt, 
  Printer, 
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Share2,
  DollarSign,
  UserCheck,
  BookOpen
} from 'lucide-react';

import { MachineBillEntry } from '../../billing/types/billing';

export const FarmerListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedWorkEntry, setSelectedWorkEntry] = useState<FarmerWorkEntry | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI / PhonePe' | 'Bank Transfer'>('UPI / PhonePe');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Query farmer ledger accounts
  const { data: rawLedgers, isLoading } = useQuery({
    queryKey: ['farmerLedgers', searchQuery],
    queryFn: () => farmerApi.getFarmerLedgerAccounts(searchQuery),
  });

  // Load local machine bills for Farmer Udhar Ledger sync
  const localMachineBills: MachineBillEntry[] = (() => {
    try {
      const raw = localStorage.getItem('agribos_machine_billing_ledger');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading machine bills for farmer ledger:', e);
    }
    return [];
  })();

  const baseLedgers: FarmerLedgerAccount[] = Array.isArray(rawLedgers) ? rawLedgers : [];

  // Merge machine billing entries into farmer credit ledgers
  const ledgers: FarmerLedgerAccount[] = (() => {
    const map = new Map<string, FarmerLedgerAccount>();

    // Add base ledgers first
    baseLedgers.forEach((l) => {
      if (!l) return;
      const name = (l.fullName || l.farmerCode || 'Farmer').toString().trim();
      map.set(name.toLowerCase(), {
        ...l,
        fullName: name,
        villageName: l.villageName || 'Sindhanur',
        mobileNumber: l.mobileNumber || '9880123456',
        farmerCode: l.farmerCode || 'FAR-100',
        totalWorkSessions: l.totalWorkSessions || 0,
        totalBilledAmount: l.totalBilledAmount || 0,
        totalAdvancePaid: l.totalAdvancePaid || 0,
        totalPaidAmount: l.totalPaidAmount || 0,
        totalBalanceDue: l.totalBalanceDue || 0,
        workEntries: [...(l.workEntries || [])]
      });
    });

    // Merge machine bills created in Machine Execution Billing
    (localMachineBills || []).forEach((b, idx) => {
      if (!b) return;
      const farmerNameStr = (b.farmerName || 'Farmer').toString().trim();
      const key = farmerNameStr.toLowerCase();
      const existing = map.get(key);

      const workEntry: FarmerWorkEntry = {
        id: b.id || 9000 + idx,
        billNumber: b.billNumber || `BILL-${idx}`,
        workDate: b.billDate || b.workDate || new Date().toISOString().split('T')[0],
        machineName: b.machineName || 'AgriBOS Machine',
        operatorName: 'Driver / Operator',
        villageName: b.villageName || 'Sindhanur',
        cropType: 'Paddy Harvest / Tillage Work',
        workHours: b.netWorkingHours || 0,
        ratePerUnit: b.ratePerUnit || 0,
        totalAmount: b.totalAmount || 0,
        advanceAmount: b.advanceAmount || 0,
        paidAmount: b.paidAmount || 0,
        balanceDue: b.balanceDue || 0,
        status: b.status === 'PAID' ? 'PAID' : b.status === 'PARTIAL' ? 'PARTIAL' : 'UNPAID',
      };

      if (existing) {
        existing.totalWorkSessions = (existing.totalWorkSessions || 0) + 1;
        existing.totalBilledAmount = (existing.totalBilledAmount || 0) + (b.totalAmount || 0);
        existing.totalAdvancePaid = (existing.totalAdvancePaid || 0) + (b.advanceAmount || 0);
        existing.totalPaidAmount = (existing.totalPaidAmount || 0) + (b.paidAmount || 0);
        existing.totalBalanceDue = (existing.totalBalanceDue || 0) + (b.balanceDue || 0);
        if (!existing.workEntries.some((w) => w.billNumber === b.billNumber)) {
          existing.workEntries.unshift(workEntry);
        }
      } else {
        map.set(key, {
          id: 5000 + idx,
          farmerCode: `FARM-${farmerNameStr.replace(/\s+/g, '-').toUpperCase()}`,
          fullName: farmerNameStr,
          fatherName: 'Sri',
          mobileNumber: b.mobileNumber || '9880123456',
          villageName: b.villageName || 'Sindhanur',
          talukName: 'Gangavati',
          totalWorkSessions: 1,
          totalBilledAmount: b.totalAmount || 0,
          totalAdvancePaid: b.advanceAmount || 0,
          totalPaidAmount: b.paidAmount || 0,
          totalBalanceDue: b.balanceDue || 0,
          workEntries: [workEntry],
        });
      }
    });

    const result = Array.from(map.values());
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return result.filter(
        (f) =>
          (f.fullName || '').toLowerCase().includes(q) ||
          (f.villageName || '').toLowerCase().includes(q) ||
          (f.mobileNumber || '').toLowerCase().includes(q) ||
          (f.farmerCode || '').toLowerCase().includes(q)
      );
    }
    return result;
  })();

  // Selected farmer account object with safe fallback
  const selectedFarmer: FarmerLedgerAccount | undefined = 
    ledgers.find(l => l.id === selectedFarmerId) || ledgers[0];

  // Global calculations across loaded farmers
  const totalFarmersCount = ledgers.length;
  const totalGlobalBilled = ledgers.reduce((acc, curr) => acc + (curr.totalBilledAmount || 0), 0);
  const totalGlobalPaid = ledgers.reduce((acc, curr) => acc + (curr.totalPaidAmount || 0) + (curr.totalAdvancePaid || 0), 0);
  const totalGlobalUdhar = ledgers.reduce((acc, curr) => acc + (curr.totalBalanceDue || 0), 0);

  // Mutation for registering new farmer
  const createMutation = useMutation({
    mutationFn: farmerApi.createFarmer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerLedgers'] });
      setIsRegisterOpen(false);
      setToastMessage('New Farmer Registered Successfully!');
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  // Mutation for recording payment
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFarmer && selectedWorkEntry && paymentAmount > 0) {
      await farmerApi.recordFarmerPayment(selectedFarmer.id, selectedWorkEntry.id, Number(paymentAmount));
      queryClient.invalidateQueries({ queryKey: ['farmerLedgers'] });
      setIsPaymentModalOpen(false);
      setToastMessage(`Collected ₹${paymentAmount.toLocaleString()} from ${selectedFarmer.fullName}`);
      setSelectedWorkEntry(null);
      setPaymentAmount(0);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!selectedFarmer) return;
    const rawMobile = (selectedFarmer.mobileNumber || '9880123456').toString();
    const phone = rawMobile.replace(/\D/g, '');
    const message = `Namaste ${selectedFarmer.fullName || 'Farmer'} Ji,\nYour AgriBOS Katha Statement:\nTotal Billed: ₹${(selectedFarmer.totalBilledAmount || 0).toLocaleString()}\nTotal Paid: ₹${((selectedFarmer.totalPaidAmount || 0) + (selectedFarmer.totalAdvancePaid || 0)).toLocaleString()}\nBalance Due (Udhar): ₹${(selectedFarmer.totalBalanceDue || 0).toLocaleString()}\n\nThank you for working with Sri Basaveshwara & Co.`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/10 via-slate-900/5 to-transparent p-4 rounded-3xl border border-emerald-500/10 backdrop-blur-xs">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <span>FARMER LEDGER BOOK & HISTORY</span>
            <span className="text-xs font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
              ರೈತರ ಖಾತೆ ಪುಸ್ತಕ
            </span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Track harvesting work logs, advance payments, and collect outstanding Udhar balances with automated digital receipts.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handlePrintStatement}
            className="flex items-center space-x-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-2xl text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Passbook</span>
          </button>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Register Farmer</span>
          </button>
        </div>
      </div>

      {/* 4 Global Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Farmers */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">REGISTERED FARMERS</p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalFarmersCount} Accounts
            </h2>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Active Field Accounts
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Total Billed */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TOTAL WORK BILLED</p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              ₹{totalGlobalBilled.toLocaleString()}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Gross harvesting revenue</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-emerald-200/80 dark:border-emerald-950 shadow-xs hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">TOTAL COLLECTED</p>
            <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              ₹{totalGlobalPaid.toLocaleString()}
            </h2>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-1">Advances + Cash/UPI receipts</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Outstanding Udhar */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-red-200/80 dark:border-red-950 shadow-xs hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-wider">TOTAL OUTSTANDING UDHAR</p>
            <h2 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 font-mono">
              ₹{totalGlobalUdhar.toLocaleString()}
            </h2>
            <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Pending Field Collection
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-500 flex items-center justify-center shrink-0 border border-red-200/50">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Search Input Bar & Farmer Selection Carousel Cards */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Farmer Name, Phone Number (e.g. 9880123456), Bill No, or Village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Farmer Selection Carousel Cards */}
        <div className="flex items-center space-x-3 overflow-x-auto pt-1 pb-2 scrollbar-thin">
          {isLoading ? (
            <div className="text-xs text-slate-400 py-3">Loading farmer records...</div>
          ) : ledgers.length === 0 ? (
            <div className="text-xs text-slate-400 py-3">No farmers found matching search query.</div>
          ) : (
            ledgers.map((farmer) => {
              const isSelected = selectedFarmer?.id === farmer.id;
              const balance = farmer.totalBalanceDue || 0;
              return (
                <button
                  key={farmer.id}
                  onClick={() => setSelectedFarmerId(farmer.id)}
                  className={`flex flex-col p-3.5 rounded-2xl border text-left min-w-[240px] transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-md ${isSelected ? 'bg-emerald-700/60 text-emerald-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      {farmer.farmerCode || 'FAR-100'}
                    </span>
                    {balance > 0 ? (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isSelected ? 'bg-white text-red-600 shadow-xs' : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900'
                      }`}>
                        UDHAR: ₹{balance.toLocaleString()}
                      </span>
                    ) : (
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isSelected ? 'bg-emerald-700/50 text-emerald-100' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        PAID
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black mt-2 truncate">{farmer.fullName || 'Farmer'}</h4>
                  <div className={`flex items-center space-x-1 text-[11px] mt-1 font-medium ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    <Phone className="w-3 h-3 shrink-0" />
                    <span>{farmer.mobileNumber || '9880123456'}</span>
                    <span className="mx-1">•</span>
                    <span className="truncate">{farmer.villageName || 'Sindhanur'}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Farmer Profile Banner (Katha Summary) */}
      {selectedFarmer ? (
        <div className="space-y-6">
          
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950/80 text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-6 relative overflow-hidden">
            
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Farmer Top Info Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-700/60 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-300/30 shrink-0">
                  {(selectedFarmer.fullName || 'F').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-black tracking-tight">{selectedFarmer.fullName || 'Farmer'}</h2>
                    <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
                      {selectedFarmer.farmerCode || 'FAR-100'}
                    </span>
                  </div>
                  {selectedFarmer.fatherName && (
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      S/O: {selectedFarmer.fatherName}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1 font-medium">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono font-bold">{selectedFarmer.mobileNumber || '9880123456'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{selectedFarmer.villageName || 'Sindhanur'}, {selectedFarmer.talukName || 'Gangavati'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Quick Share */}
              <div className="flex items-center space-x-3 self-start md:self-auto">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp Statement</span>
                </button>

                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                    KATHA STATUS
                  </span>
                  <span className={`inline-block mt-0.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                    (selectedFarmer.totalBalanceDue || 0) > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {(selectedFarmer.totalBalanceDue || 0) > 0 ? 'PENDING UDHAR' : 'ALL CLEAR'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Financial Summary Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 backdrop-blur-xs">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TOTAL WORK DONE</p>
                <h3 className="text-xl font-black text-white mt-1">
                  {selectedFarmer.totalWorkSessions || 0} Sessions
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Machine execution history</p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 backdrop-blur-xs">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TOTAL BILLED</p>
                <h3 className="text-xl font-black text-white mt-1 font-mono">
                  ₹{(selectedFarmer.totalBilledAmount || 0).toLocaleString()}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Gross invoice total</p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 backdrop-blur-xs">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">ADVANCE + PAID</p>
                <h3 className="text-xl font-black text-emerald-400 mt-1 font-mono">
                  ₹{((selectedFarmer.totalAdvancePaid || 0) + (selectedFarmer.totalPaidAmount || 0)).toLocaleString()}
                </h3>
                <p className="text-[10px] text-emerald-300/80 mt-1 font-semibold">
                  Adv: ₹{(selectedFarmer.totalAdvancePaid || 0).toLocaleString()} • Rec: ₹{(selectedFarmer.totalPaidAmount || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-red-950/20 p-4 rounded-2xl border border-red-900/40 backdrop-blur-xs">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">BALANCE DUE (UDHAR)</p>
                <h3 className="text-2xl font-black text-red-400 mt-1 font-mono">
                  ₹{(selectedFarmer.totalBalanceDue || 0).toLocaleString()}
                </h3>
                <p className="text-[10px] text-red-300/80 mt-1 font-semibold">Outstanding balance</p>
              </div>
            </div>

          </div>

          {/* Work Sessions & Billing Ledger Table for Selected Farmer */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-500" />
                  <span>Work Session Logs & Invoice History</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Detailed logs of machine hours, rates, advance collections, and pending balances.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              {(selectedFarmer.workEntries || []).length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                  No machine work sessions logged for {selectedFarmer.fullName || 'this farmer'} yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200/80 dark:border-slate-800">
                      <th className="py-3 px-4">Bill No / Date</th>
                      <th className="py-3 px-4">Machine & Crop</th>
                      <th className="py-3 px-4">Hours / Rate</th>
                      <th className="py-3 px-4 text-right">Total Bill</th>
                      <th className="py-3 px-4 text-right">Advance</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-right">Udhar Balance</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {(selectedFarmer.workEntries || []).map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{entry.billNumber || 'BILL'}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{entry.workDate}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{entry.machineName || 'Machine'}</div>
                          <div className="text-[10px] text-slate-400">{entry.cropType}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold">{entry.workHours} hrs</div>
                          <div className="text-[10px] text-slate-400">₹{entry.ratePerUnit}/hr</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono">
                          ₹{(entry.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold font-mono text-emerald-600">
                          ₹{(entry.advanceAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold font-mono text-blue-600">
                          ₹{(entry.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono text-red-600 dark:text-red-400">
                          ₹{(entry.balanceDue || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                            entry.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : entry.status === 'PARTIAL'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {(entry.balanceDue || 0) > 0 && (
                            <button
                              onClick={() => {
                                setSelectedWorkEntry(entry);
                                setPaymentAmount(entry.balanceDue || 0);
                                setIsPaymentModalOpen(true);
                              }}
                              className="inline-flex items-center space-x-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all shadow-xs cursor-pointer"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Collect Udhar</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs font-semibold">
          Select a farmer account above to view detailed Katha passbook & work execution logs.
        </div>
      )}

      {/* Register Farmer Dialog */}
      <FarmerFormDialog
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
        isLoading={createMutation.isPending}
      />

      {/* Payment Receipt Collection Modal */}
      {isPaymentModalOpen && selectedWorkEntry && selectedFarmer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span>COLLECT UDHAR PAYMENT</span>
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700/60">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Farmer:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedFarmer.fullName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Bill Number:</span>
                <span className="font-mono font-bold text-emerald-600">{selectedWorkEntry.billNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Outstanding Udhar:</span>
                <span className="font-mono font-black text-red-600">₹{(selectedWorkEntry.balanceDue || 0).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount to Collect (₹)
                </label>
                <input
                  type="number"
                  max={selectedWorkEntry.balanceDue || 0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-base font-black font-mono text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Collection Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="UPI / PhonePe">UPI / PhonePe / GPay</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  Confirm Receipt Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Farmer Form Dialog */}
      <FarmerFormDialog
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSubmit={async (newFarmer) => {
          await createMutation.mutateAsync(newFarmer);
        }}
        isLoading={createMutation.isPending}
      />

    </div>
  );
};

