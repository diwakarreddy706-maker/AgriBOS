import React, { useState } from 'react';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { Receipt, PlusCircle, BookOpen, Clock, Tractor, Calendar, User, MapPin, Printer, Search, FileText, Phone } from 'lucide-react';
import { MachineBillEntry } from '../types/billing';
import { Button } from '../../../components/ui/Button';
import { InvoicePdfModal } from '../components/InvoicePdfModal';

const LOCAL_STORAGE_KEY = 'agribos_machine_billing_ledger';

const loadSavedBills = (): MachineBillEntry[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load saved bills from localStorage:', e);
  }
  return [];
};

export const MachineBillingLedgerPage: React.FC = () => {
  const { language } = useLanguageStore();

  const [activeTab, setActiveTab] = useState<'create' | 'ledger' | 'directory'>('create');
  const [bills, setBills] = useState<MachineBillEntry[]>(loadSavedBills);
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedPrintBill, setSelectedPrintBill] = useState<MachineBillEntry | null>(null);


  // Form State for New Machine Bill
  const [formData, setFormData] = useState({
    machineCode: 'MAC-4678',
    machineName: 'Kubota DC-68G Harvester',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    farmerName: '',
    mobileNumber: '9880123456',
    villageName: '',
    startTime: '08:00 AM',
    endTime: '05:30 PM',
    breakHours: 1.5,
    netWorkingHours: 8.0,
    rateType: 'HOURLY' as 'HOURLY' | 'ACRE',
    ratePerUnit: 2400,
    totalAmount: 19200,
    advanceAmount: 0,
    paidAmount: 0,
    notes: '',
  });

  // Helper to parse time strings like "09:00 AM", "05:30 PM", "09:00", "17:30"
  const parseTimeToHours = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const cleanStr = timeStr.trim().toUpperCase();

    // 12-hour format e.g. "09:00 AM", "5:30 PM", "9 AM", "05:30PM"
    const match12 = cleanStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
    if (match12 && (match12[3] || match12[2])) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
      const period = match12[3];

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return hours + minutes / 60;
    }

    // 24-hour format e.g. "09:00", "17:30"
    const match24 = cleanStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const hours = parseInt(match24[1], 10);
      const minutes = parseInt(match24[2], 10);
      return hours + minutes / 60;
    }

    return null;
  };

  // Calculate net working hours between start time and end time minus break hours
  const calculateNetHours = (startTimeStr: string, endTimeStr: string, breakHrs: number): number => {
    const start = parseTimeToHours(startTimeStr);
    const end = parseTimeToHours(endTimeStr);

    if (start !== null && end !== null) {
      let diff = end - start;
      if (diff < 0) diff += 24; // Handles overnight work across midnight
      const net = Math.max(0, diff - (Number(breakHrs) || 0));
      return parseFloat(net.toFixed(2));
    }

    return 0;
  };

  // Calculate Net Working Hours & Total Amount dynamically
  const handleTimingChange = (newStart: string, newEnd: string, newBreak: number, rate: number) => {
    const netHrs = calculateNetHours(newStart, newEnd, newBreak);
    const effectiveNet = netHrs > 0 ? netHrs : formData.netWorkingHours;
    const totalAmt = effectiveNet * rate;

    setFormData((prev) => ({
      ...prev,
      startTime: newStart,
      endTime: newEnd,
      breakHours: newBreak,
      netWorkingHours: effectiveNet,
      ratePerUnit: rate,
      totalAmount: totalAmt,
    }));
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.billNumber) {
      alert('Please enter the Manual Bill Number from your physical bill book.');
      return;
    }
    if (!formData.farmerName || !formData.villageName) {
      alert('Please fill in Farmer Name and Village Name.');
      return;
    }

    const netWorkingHours = formData.netWorkingHours > 0 ? formData.netWorkingHours : 8.0;
    const totalAmount = formData.totalAmount > 0 ? formData.totalAmount : netWorkingHours * formData.ratePerUnit;
    const advanceAmount = Number(formData.advanceAmount) || 0;
    const paidAmount = Number(formData.paidAmount) || 0;
    const totalPaid = advanceAmount + paidAmount;
    const balanceDue = Math.max(0, totalAmount - totalPaid);

    const newBill: MachineBillEntry = {
      id: bills.length + 1,
      billNumber: formData.billNumber,
      billDate: formData.billDate,
      machineId: 4,
      machineCode: formData.machineCode,
      machineName: formData.machineName,
      farmerName: formData.farmerName,
      mobileNumber: formData.mobileNumber || '9880123456',
      villageName: formData.villageName,
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakHours: formData.breakHours,
      totalHours: formData.breakHours + netWorkingHours,
      netWorkingHours: netWorkingHours,
      rateType: formData.rateType,
      ratePerUnit: formData.ratePerUnit,
      totalAmount: totalAmount,
      advanceAmount: advanceAmount,
      paidAmount: paidAmount,
      balanceDue: balanceDue,
      status: balanceDue === 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'PENDING',
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    const updatedBills = [newBill, ...bills];
    setBills(updatedBills);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedBills));
    } catch (err) {
      console.error('Failed to persist machine bill to localStorage:', err);
    }
    setSelectedPrintBill(newBill);
    alert(`Machine Bill #${newBill.billNumber} saved successfully to Machine Ledger Book!`);

    // Reset Form
    setFormData({
      machineCode: 'MAC-4678',
      machineName: 'Kubota DC-68G Harvester',
      billNumber: '',
      billDate: new Date().toISOString().split('T')[0],
      farmerName: '',
      mobileNumber: '9880123456',
      villageName: '',
      startTime: '09:00 AM',
      endTime: '05:30 PM',
      breakHours: 1.5,
      netWorkingHours: 7.0,
      rateType: 'HOURLY',
      ratePerUnit: 2400,
      totalAmount: 16800,
      advanceAmount: 0,
      paidAmount: 0,
      notes: '',
    });
    setActiveTab('ledger');
  };

  // Machine List Options
  const availableMachines = [
    { code: 'MAC-4678', name: 'Kubota DC-68G Harvester', reg: 'UNREG-MAC-4678' },
    { code: 'MAC-HARV-001', name: 'John Deere 5050D Tractor', reg: 'KA-37-T-8921' },
    { code: 'MAC-HARV-002', name: 'Mahindra Arjun 605 Harvester', reg: 'KA-36-M-4512' },
  ];

  // Filtered Bills for Machine Ledger Book
  const filteredBills = bills.filter((b) => {
    const matchMachine = selectedMachineFilter === 'ALL' || b.machineCode === selectedMachineFilter;
    const matchKeyword =
      !searchKeyword ||
      b.farmerName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      b.villageName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      b.billNumber.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      b.machineCode.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchMachine && matchKeyword;
  });

  // Machine Summary Totals for Ledger Book
  const totalBilledHrs = filteredBills.reduce((acc, curr) => acc + curr.netWorkingHours, 0);
  const totalBreakHrs = filteredBills.reduce((acc, curr) => acc + curr.breakHours, 0);
  const totalRevenue = filteredBills.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalAdvance = filteredBills.reduce((acc, curr) => acc + (curr.advanceAmount || 0), 0);
  const totalCollected = filteredBills.reduce((acc, curr) => acc + (curr.paidAmount || 0) + (curr.advanceAmount || 0), 0);
  const totalUdhar = filteredBills.reduce((acc, curr) => acc + curr.balanceDue, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Tractor className="w-4 h-4" />
            <span>Sri Basaveshwara & Co. • Harvesting & Equipment Billing</span>
          </div>
          <h1 className="text-2xl font-black">
            {language === 'kn' ? 'ಯಂತ್ರದ ಬಿಲ್ಲಿಂಗ್ ಮತ್ತು ಖಾತೆ ಪುಸ್ತಕ' : 'Machine Billing & Machine Ledger Book'}
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Generate harvesting bills with Start/End/Break times and track per-machine revenue ledgers.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center bg-black/20 p-1.5 rounded-xl space-x-1 backdrop-blur">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'create' ? 'bg-emerald-500 text-white shadow' : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'kn' ? 'ಹೊಸ ಬಿಲ್ ಸೃಷ್ಟಿ' : 'Create Machine Bill'}</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ledger' ? 'bg-emerald-500 text-white shadow' : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'kn' ? 'ಖಾತೆ ಪುಸ್ತಕ (Ledger)' : 'Machine Ledger Book'}</span>
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'directory' ? 'bg-emerald-500 text-white shadow' : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{language === 'kn' ? 'ಎಲ್ಲ ಬಿಲ್‌ಗಳು' : 'All Bills'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CREATE NEW MACHINE BILL FORM */}
      {activeTab === 'create' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>New Machine Execution & Billing Form</span>
              </h2>
              <p className="text-xs text-slate-500">Record machine timing, start/end hours, break hours & calculate farmer bill</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-800">
              Manual Bill Entry Mode
            </span>
          </div>

          <form onSubmit={handleCreateBill} className="space-y-6">
            {/* Step 1: Select Machine */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Tractor className="w-4 h-4 text-emerald-600" />
                  <span>1. Machine Code / Name (Select DB or Type Manual) *</span>
                </label>
                <input
                  type="text"
                  list="machine-options"
                  placeholder="Select from DB or type machine code/name"
                  value={formData.machineCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = availableMachines.find((m) => m.code === val || `${m.code} - ${m.name}` === val);
                    setFormData((prev) => ({
                      ...prev,
                      machineCode: val,
                      machineName: matched ? matched.name : val,
                    }));
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <datalist id="machine-options">
                  {availableMachines.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} - {m.name} ({m.reg})
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Manual Bill Number *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1024 / B-405"
                  value={formData.billNumber}
                  onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Billing Date *</span>
                </label>
                <input
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Step 2: Farmer & Village Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>2. Farmer Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ningappa Gowda"
                  value={formData.farmerName}
                  onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Farmer Phone / Mobile *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9880123456"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Village Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gangavati / Sindhanur"
                  value={formData.villageName}
                  onChange={(e) => setFormData({ ...formData, villageName: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Step 3: Machine Execution Timings & Break Hours */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-3">
              <h3 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>3. Machine Work Execution Timings & Pauses</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Machine Start Time *
                  </label>
                  <input
                    type="text"
                    value={formData.startTime}
                    onChange={(e) => handleTimingChange(e.target.value, formData.endTime, formData.breakHours, formData.ratePerUnit)}
                    placeholder="09:00 AM"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                    Break / Pause Time (Hrs) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.breakHours}
                    onChange={(e) => {
                      const breakHrs = parseFloat(e.target.value) || 0;
                      handleTimingChange(formData.startTime, formData.endTime, breakHrs, formData.ratePerUnit);
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 text-sm font-bold text-amber-900 dark:text-amber-300"
                  />
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">Meal / Breakdown Pauses</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Machine End Time *
                  </label>
                  <input
                    type="text"
                    value={formData.endTime}
                    onChange={(e) => handleTimingChange(formData.startTime, e.target.value, formData.breakHours, formData.ratePerUnit)}
                    placeholder="05:30 PM"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    Net Billable Hours / Acres
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.netWorkingHours}
                    onChange={(e) => {
                      const netHrs = parseFloat(e.target.value) || 0;
                      setFormData((prev) => ({
                        ...prev,
                        netWorkingHours: netHrs,
                        totalAmount: netHrs * prev.ratePerUnit,
                      }));
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-emerald-400 dark:border-emerald-700 bg-emerald-100/50 dark:bg-emerald-900/40 text-sm font-black text-emerald-900 dark:text-emerald-100"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Billing Rate & Payment Totals */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rate Type
                </label>
                <select
                  value={formData.rateType}
                  onChange={(e) => setFormData({ ...formData, rateType: e.target.value as 'HOURLY' | 'ACRE' })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                >
                  <option value="HOURLY">Per Hour Rate (₹)</option>
                  <option value="ACRE">Per Acre Rate (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rate (₹)
                </label>
                <input
                  type="number"
                  value={formData.ratePerUnit}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      ratePerUnit: rate,
                      totalAmount: prev.netWorkingHours * rate,
                    }));
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  Total Bill Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  readOnly
                  className="w-full h-10 px-3 rounded-lg border border-emerald-500 bg-emerald-50 dark:bg-emerald-950 font-black text-lg text-emerald-800 dark:text-emerald-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                  Advance Amount Paid (₹)
                </label>
                <input
                  type="number"
                  value={formData.advanceAmount}
                  onChange={(e) => setFormData({ ...formData, advanceAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-lg border border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-sm font-bold text-indigo-900 dark:text-indigo-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
                  Final Settlement Paid (₹)
                </label>
                <input
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setActiveTab('ledger')}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6">
                <Receipt className="w-4 h-4 mr-2" />
                Generate & Save Machine Bill
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MACHINE LEDGER BOOK (ಖಾತೆ Pustaka) */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Machine Filter & Search Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <Tractor className="w-5 h-5 text-emerald-600" />
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Filter Machine Ledger:
              </label>
              <select
                value={selectedMachineFilter}
                onChange={(e) => setSelectedMachineFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Machine Fleets</option>
                {availableMachines.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search farmer, village, bill #..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Machine Ledger Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Total Billable Hours</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{totalBilledHrs.toFixed(1)} hrs</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 shadow-sm">
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">Total Break Hours</p>
              <p className="text-xl font-black text-amber-900 dark:text-amber-200 mt-1">{totalBreakHrs.toFixed(1)} hrs</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 shadow-sm">
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Gross Billed Revenue</p>
              <p className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-1">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-xl p-4 shadow-sm">
              <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">Total Advance Received</p>
              <p className="text-xl font-black text-indigo-900 dark:text-indigo-200 mt-1">₹{totalAdvance.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 shadow-sm">
              <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase">Total Collected</p>
              <p className="text-xl font-black text-blue-900 dark:text-blue-200 mt-1">₹{totalCollected.toLocaleString()}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl p-4 shadow-sm">
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase">Outstanding (Udhar)</p>
              <p className="text-xl font-black text-rose-900 dark:text-rose-200 mt-1">₹{totalUdhar.toLocaleString()}</p>
            </div>
          </div>

          {/* Machine Ledger Book Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Machine Ledger Transactions Book (ಖಾತೆ Pustaka)</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Showing {filteredBills.length} billing records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="p-3">Bill No & Date</th>
                    <th className="p-3">Machine Code</th>
                    <th className="p-3">Farmer & Village</th>
                    <th className="p-3">Start Time</th>
                    <th className="p-3 text-amber-700 dark:text-amber-400">Break Hrs</th>
                    <th className="p-3">End Time</th>
                    <th className="p-3 text-emerald-700 dark:text-emerald-400">Net Work Hrs</th>
                    <th className="p-3">Rate (₹)</th>
                    <th className="p-3 font-bold">Total Bill (₹)</th>
                    <th className="p-3 text-indigo-600 font-bold">Advance (₹)</th>
                    <th className="p-3 text-blue-600 font-bold">Settled Paid (₹)</th>
                    <th className="p-3 text-rose-600 font-bold">Balance Due (₹)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{b.billNumber}</div>
                        <div className="text-[10px] text-slate-400">{b.billDate}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{b.machineCode}</div>
                        <div className="text-[10px] text-slate-500">{b.machineName}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{b.farmerName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{b.villageName}</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{b.startTime}</td>
                      <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{b.breakHours} hrs</td>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{b.endTime}</td>
                      <td className="p-3 font-black text-emerald-700 dark:text-emerald-300">{b.netWorkingHours} hrs</td>
                      <td className="p-3 font-medium">₹{b.ratePerUnit}</td>
                      <td className="p-3 font-black text-slate-900 dark:text-slate-100">₹{b.totalAmount.toLocaleString()}</td>
                      <td className="p-3 font-extrabold text-indigo-600 dark:text-indigo-400">₹{(b.advanceAmount || 0).toLocaleString()}</td>
                      <td className="p-3 font-bold text-blue-600 dark:text-blue-400">₹{b.paidAmount.toLocaleString()}</td>
                      <td className="p-3 font-bold text-rose-600 dark:text-rose-400">₹{b.balanceDue.toLocaleString()}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            b.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : b.status === 'PARTIAL'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedPrintBill(b)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-600 dark:text-slate-300 hover:text-emerald-700 transition-colors"
                          title="Print Thermal Bill Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIRECTORY OF ALL INVOICES */}
      {activeTab === 'directory' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Customer Invoices & Machine Billing Directory</span>
            </h2>
            <Button onClick={() => setActiveTab('create')} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold">
              <PlusCircle className="w-4 h-4 mr-1.5" /> New Bill Entry
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  <th className="p-3">Invoice / Bill #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Farmer Name</th>
                  <th className="p-3">Village</th>
                  <th className="p-3">Machine</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{b.billNumber}</td>
                    <td className="p-3 text-slate-500">{b.billDate}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{b.farmerName}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{b.villageName}</td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{b.machineCode}</td>
                    <td className="p-3 font-black text-slate-900 dark:text-slate-100">₹{b.totalAmount.toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-700">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {selectedPrintBill && (
        <InvoicePdfModal
          bill={selectedPrintBill}
          onClose={() => setSelectedPrintBill(null)}
        />
      )}
    </div>
  );
};

