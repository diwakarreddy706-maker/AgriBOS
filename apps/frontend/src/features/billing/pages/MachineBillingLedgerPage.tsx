import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { Receipt, PlusCircle, BookOpen, Clock, Tractor, FileText, User, Phone, MapPin } from 'lucide-react';
import { MachineBillEntry } from '../types/billing';
import { Button } from '../../../components/ui/Button';
import { InvoicePdfModal } from '../components/InvoicePdfModal';
import { InvoicePreviewModal } from '../components/InvoicePreviewModal';
import { CreateInvoiceModal } from '../components/CreateInvoiceModal';
import { CreateReceiptModal } from '../../payment/components/CreateReceiptModal';
import { operationsApi } from '../../operations/api/operationsApi';
import { machineApi } from '../../machine/api/machineApi';
import { farmerApi } from '../../farmer/api/farmerApi';

export const MachineBillingLedgerPage: React.FC = () => {
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'create' | 'ledger' | 'directory'>('create');
  const [selectedMachineFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedPrintBill, setSelectedPrintBill] = useState<any | null>(null);

  // New PDF Document Modals State
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isCreateReceiptOpen, setIsCreateReceiptOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<number | null>(null);
  const [previewDocType, setPreviewDocType] = useState<'invoice' | 'receipt'>('invoice');
  const [previewDocNumber, setPreviewDocNumber] = useState<string>('');

  const handleOpenPdfPreview = (id: number, docType: 'invoice' | 'receipt', docNum: string) => {
    setPreviewDocId(id);
    setPreviewDocType(docType);
    setPreviewDocNumber(docNum);
    setIsPreviewOpen(true);
  };

  // Live Database Queries
  const { data: workExecutionsData, isLoading: isBillsLoading } = useQuery({
    queryKey: ['workExecutions', searchKeyword, selectedMachineFilter],
    queryFn: () => operationsApi.getWorkExecutions(searchKeyword, selectedMachineFilter !== 'ALL' ? selectedMachineFilter : undefined),
  });

  const { data: farmersData } = useQuery({
    queryKey: ['farmers'],
    queryFn: () => farmerApi.getFarmers('', 0, 100),
  });

  const { data: machinesData } = useQuery({
    queryKey: ['machines'],
    queryFn: () => machineApi.getMachines('', undefined, undefined, 0, 100),
  });

  const bills: MachineBillEntry[] = workExecutionsData?.content || [];
  const farmersList = farmersData?.content || [];
  const machinesList = machinesData?.content || [];

  // Form State for New Machine Bill
  const [formData, setFormData] = useState({
    farmerId: 0,
    machineId: 0,
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

  // Automatically select valid farmer & machine when loaded
  useEffect(() => {
    if (farmersList.length > 0) {
      const match = farmersList.find((f: any) => f.id === formData.farmerId);
      if (!match) {
        const f = farmersList[0];
        setFormData((prev) => ({
          ...prev,
          farmerId: f.id,
          farmerName: f.fullName || 'Farmer',
          mobileNumber: f.mobileNumber || '',
          villageName: f.villageName || ''
        }));
      }
    }
  }, [farmersList, formData.farmerId]);

  useEffect(() => {
    if (machinesList.length > 0) {
      const match = machinesList.find((m: any) => m.id === formData.machineId);
      if (!match) {
        const m = machinesList[0];
        const rate = parseFloat(m.hourlyRateDefault as any || 2400);
        setFormData((prev) => ({
          ...prev,
          machineId: m.id,
          machineCode: m.machineCode || 'MAC-4678',
          machineName: m.makeModel || m.machineCode || 'Machine',
          ratePerUnit: rate,
          totalAmount: prev.netWorkingHours * rate
        }));
      }
    }
  }, [machinesList, formData.machineId]);

  // Helper to parse time strings like "09:00 AM", "05:30 PM", "09:00", "17:30"
  const parseTimeToHours = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const cleanStr = timeStr.trim().toUpperCase();

    const match12 = cleanStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
    if (match12 && (match12[3] || match12[2])) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
      const period = match12[3];

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return hours + minutes / 60;
    }

    const match24 = cleanStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const hours = parseInt(match24[1], 10);
      const minutes = parseInt(match24[2], 10);
      return hours + minutes / 60;
    }

    return null;
  };

  const calculateNetHours = (startTimeStr: string, endTimeStr: string, breakHrs: number): number => {
    const start = parseTimeToHours(startTimeStr);
    const end = parseTimeToHours(endTimeStr);

    if (start !== null && end !== null) {
      let diff = end - start;
      if (diff < 0) diff += 24;
      const net = Math.max(0, diff - (Number(breakHrs) || 0));
      return parseFloat(net.toFixed(2));
    }

    return 0;
  };

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

  const logWorkMutation = useMutation({
    mutationFn: operationsApi.logWorkExecution,
    onSuccess: (newEntry) => {
      queryClient.invalidateQueries({ queryKey: ['workExecutions'] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      setSelectedPrintBill(newEntry);
      alert(`Machine Bill #${newEntry?.billNumber || 'Entry'} saved successfully to Database!`);

      const defaultFarmer = farmersList[0];
      const defaultMachine = machinesList[0];

      setFormData({
        farmerId: defaultFarmer?.id || 0,
        machineId: defaultMachine?.id || 0,
        machineCode: defaultMachine?.machineCode || 'MAC-4678',
        machineName: defaultMachine?.makeModel || 'Kubota Harvester',
        billNumber: '',
        billDate: new Date().toISOString().split('T')[0],
        farmerName: defaultFarmer?.fullName || '',
        mobileNumber: defaultFarmer?.mobileNumber || '9880123456',
        villageName: defaultFarmer?.villageName || '',
        startTime: '09:00 AM',
        endTime: '05:30 PM',
        breakHours: 1.5,
        netWorkingHours: 7.0,
        rateType: 'HOURLY',
        ratePerUnit: defaultMachine?.hourlyRateDefault || 2400,
        totalAmount: 16800,
        advanceAmount: 0,
        paidAmount: 0,
        notes: '',
      });
      setActiveTab('ledger');
    },
    onError: (err: any) => {
      alert(`Error saving machine bill: ${err?.response?.data?.message || err?.message || 'Server error'}`);
    }
  });

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    logWorkMutation.mutate({
      farmerId: formData.farmerId || undefined,
      farmerName: formData.farmerName || undefined,
      mobileNumber: formData.mobileNumber || undefined,
      machineId: formData.machineId || undefined,
      billNumber: formData.billNumber || undefined,
      workDate: formData.billDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakHours: formData.breakHours,
      workHours: formData.netWorkingHours,
      rateType: formData.rateType,
      ratePerUnit: formData.ratePerUnit,
      advanceCollected: formData.advanceAmount,
      paidAmount: formData.paidAmount,
      villageName: formData.villageName,
      operatorName: formData.notes || 'Operator',
      remarks: formData.notes
    });
  };

  // Filtered Bills for Machine Ledger Book
  const filteredBills = bills.filter((b) => {
    const matchMachine = selectedMachineFilter === 'ALL' || b.machineCode === selectedMachineFilter || b.machineName?.includes(selectedMachineFilter);
    const matchKeyword =
      !searchKeyword ||
      b.farmerName?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      b.villageName?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      b.billNumber?.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchMachine && matchKeyword;
  });

  const totalBilled = filteredBills.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalCollected = filteredBills.reduce((acc, curr) => acc + ((curr.advanceAmount || 0) + (curr.paidAmount || 0)), 0);
  const totalUdhar = filteredBills.reduce((acc, curr) => acc + (curr.balanceDue || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 sm:p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Tractor className="w-4 h-4 shrink-0" />
            <span className="truncate">Sri Basaveshwara & Co. • Harvesting & Equipment Billing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            {language === 'kn' ? 'ಯಂತ್ರದ ಬಿಲ್ಲಿಂಗ್ ಮತ್ತು ಖಾತೆ ಪುಸ್ತಕ' : 'Machine Billing & Machine Ledger Book'}
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Generate harvesting bills with Start/End/Break times and track per-machine revenue ledgers.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex flex-wrap items-center bg-black/20 p-1.5 rounded-xl gap-1.5 backdrop-blur w-full lg:w-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
              activeTab === 'create' ? 'bg-emerald-500 text-white shadow' : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>{language === 'kn' ? 'ಹೊಸ ಬಿಲ್ ಸೃಷ್ಟಿ' : 'Create Machine Bill'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-all min-h-[44px]"
          >
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <span>+ PDF Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateReceiptOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 transition-all min-h-[44px]"
          >
            <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>+ Udhar Receipt</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
              activeTab === 'ledger' ? 'bg-emerald-500 text-white shadow' : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>{language === 'kn' ? 'ಯಂತ್ರದ ಖಾತೆ ಪುಸ್ತಕ' : 'Machine Ledger Book'}</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
              activeTab === 'directory' ? 'bg-emerald-500 text-white shadow' : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>{language === 'kn' ? 'ಎಲ್ಲಾ ಬಿಲ್‌ಗಳು' : 'All Bills'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: NEW MACHINE BILL CREATION FORM */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateBill} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>New Machine Work & Billing Voucher Entry</span>
              </h2>
              <p className="text-xs text-slate-500">Record machine work session with exact start/end time, break hours and bill calculation</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full text-xs font-bold font-mono">
              DB SYNC ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Farmer Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Farmer (From DB) *
              </label>
              <select
                value={formData.farmerId}
                onChange={(e) => {
                  const fid = parseInt(e.target.value, 10);
                  const f = farmersList.find((item: any) => item.id === fid);
                  setFormData((prev) => ({
                    ...prev,
                    farmerId: fid,
                    farmerName: f?.fullName || prev.farmerName,
                    mobileNumber: f?.mobileNumber || prev.mobileNumber,
                    villageName: f?.villageName || prev.villageName
                  }));
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
              >
                <option value={0}>
                  {farmersList.length === 0 ? 'Loading farmers from DB...' : `+ New Farmer / Manual Entry (${formData.farmerName || 'Custom'})`}
                </option>
                {farmersList.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.fullName || 'Farmer'} ({f.villageName || 'Raichur'}) - {f.mobileNumber || ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Machine Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Machine (From DB) *
              </label>
              <select
                value={formData.machineId}
                onChange={(e) => {
                  const mid = parseInt(e.target.value, 10);
                  const m = machinesList.find((item: any) => item.id === mid);
                  const rate = parseFloat(m?.hourlyRateDefault as any || 2400);
                  setFormData((prev) => ({
                    ...prev,
                    machineId: mid,
                    machineCode: m?.machineCode || prev.machineCode,
                    machineName: m?.makeModel || m?.machineCode || prev.machineName,
                    ratePerUnit: rate,
                    totalAmount: prev.netWorkingHours * rate
                  }));
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
              >
                {machinesList.length === 0 && (
                  <option value={0}>Loading machines from DB...</option>
                )}
                {machinesList.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.makeModel || m.machineCode} ({m.machineCode}) • ₹{parseFloat(m.hourlyRateDefault as any || 2400).toFixed(2)}/hr
                  </option>
                ))}
              </select>
            </div>

            {/* Work Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Work Execution Date *
              </label>
              <input
                type="date"
                value={formData.billDate}
                onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Farmer & Bill Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Farmer Name</span>
              </label>
              <input
                type="text"
                value={formData.farmerName}
                onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold"
                placeholder="Farmer Full Name"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mobile Number</span>
              </label>
              <input
                type="text"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold"
                placeholder="9880123456"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Village Name</span>
              </label>
              <input
                type="text"
                value={formData.villageName}
                onChange={(e) => setFormData({ ...formData, villageName: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold"
                placeholder="Village / Location"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>Manual Bill No (Optional)</span>
              </label>
              <input
                type="text"
                value={formData.billNumber}
                onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold"
                placeholder="Auto-generated if blank"
              />
            </div>
          </div>

          {/* Timing Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Session Timings & Meter Calculation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Start Time (e.g. 08:00 AM)</label>
                <input
                  type="text"
                  value={formData.startTime}
                  onChange={(e) => handleTimingChange(e.target.value, formData.endTime, formData.breakHours, formData.ratePerUnit)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">End Time (e.g. 05:30 PM)</label>
                <input
                  type="text"
                  value={formData.endTime}
                  onChange={(e) => handleTimingChange(formData.startTime, e.target.value, formData.breakHours, formData.ratePerUnit)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Break Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.breakHours}
                  onChange={(e) => handleTimingChange(formData.startTime, formData.endTime, parseFloat(e.target.value) || 0, formData.ratePerUnit)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Calculated Net Hours</label>
                <input
                  type="number"
                  readOnly
                  value={formData.netWorkingHours}
                  className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 font-bold rounded-lg px-3 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Rate & Financials */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rate Type</label>
              <select
                value={formData.rateType}
                onChange={(e) => setFormData({ ...formData, rateType: e.target.value as 'HOURLY' | 'ACRE' })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
              >
                <option value="HOURLY">Hourly (₹ / Hour)</option>
                <option value="ACRE">Acre (₹ / Acre)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rate Per Unit (₹)</label>
              <input
                type="number"
                value={formData.ratePerUnit}
                onChange={(e) => {
                  const r = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, ratePerUnit: r, totalAmount: formData.netWorkingHours * r });
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Total Bill Amount (₹)</label>
              <input
                type="number"
                readOnly
                value={formData.netWorkingHours * formData.ratePerUnit}
                className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 font-black rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Advance Collected (₹)</label>
              <input
                type="number"
                value={formData.advanceAmount}
                onChange={(e) => setFormData({ ...formData, advanceAmount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="submit"
              disabled={logWorkMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition"
            >
              {logWorkMutation.isPending ? 'Saving to Database...' : 'Save Machine Bill to DB'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: MACHINE LEDGER BOOK */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Machine Billing</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">₹{totalBilled.toLocaleString()}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-emerald-600 uppercase">Total Cash Collected</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">₹{totalCollected.toLocaleString()}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-amber-600 uppercase">Total Pending Udhar</span>
              <p className="text-2xl font-black text-amber-600 mt-1">₹{totalUdhar.toLocaleString()}</p>
            </div>
          </div>

          {/* Machine Ledger Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Machine Revenue & Work Execution Ledger</span>
              </h2>

              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Search farmer, village, bill #..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {isBillsLoading ? (
                <div className="p-8 text-center text-slate-500">Loading database ledger...</div>
              ) : filteredBills.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No machine bills logged in database.</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-semibold text-slate-600 dark:text-slate-300 uppercase">
                      <th className="p-3">Bill #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Farmer</th>
                      <th className="p-3">Machine</th>
                      <th className="p-3">Hours / Acres</th>
                      <th className="p-3">Rate</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Collected</th>
                      <th className="p-3">Balance</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredBills.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-emerald-600">{b.billNumber}</td>
                        <td className="p-3 text-slate-500">{b.workDate || b.billDate}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{b.farmerName}</td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{b.machineCode} ({b.machineName})</td>
                        <td className="p-3 font-mono font-semibold">{b.netWorkingHours} hrs</td>
                        <td className="p-3 font-mono">₹{b.ratePerUnit}</td>
                        <td className="p-3 font-black text-slate-900 dark:text-slate-100">₹{b.totalAmount.toLocaleString()}</td>
                        <td className="p-3 font-bold text-emerald-600">₹{((b.advanceAmount || 0) + (b.paidAmount || 0)).toLocaleString()}</td>
                        <td className="p-3 font-bold text-amber-600">₹{b.balanceDue.toLocaleString()}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleOpenPdfPreview(b.id, 'invoice', b.billNumber)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
                  <th className="p-3 text-right">PDF Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{b.billNumber}</td>
                    <td className="p-3 text-slate-500">{b.workDate || b.billDate}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{b.farmerName}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{b.villageName}</td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{b.machineCode}</td>
                    <td className="p-3 font-black text-slate-900 dark:text-slate-100">₹{b.totalAmount.toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-700">{b.status}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenPdfPreview(b.id, 'invoice', b.billNumber)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 rounded-lg text-xs font-medium transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF Invoice</span>
                      </button>
                    </td>
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

      {/* NEW BILINGUAL PDF SYSTEM MODALS */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSuccess={(createdInv) => {
          if (createdInv?.id) {
            handleOpenPdfPreview(createdInv.id, 'invoice', createdInv.invoiceNumber || 'INV');
          }
        }}
      />

      <CreateReceiptModal
        isOpen={isCreateReceiptOpen}
        onClose={() => setIsCreateReceiptOpen(false)}
        onSuccess={(createdRec) => {
          if (createdRec?.id) {
            handleOpenPdfPreview(createdRec.id, 'receipt', createdRec.receiptNumber || 'REC');
          }
        }}
      />

      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documentId={previewDocId}
        documentType={previewDocType}
        documentNumber={previewDocNumber}
      />
    </div>
  );
};

export default MachineBillingLedgerPage;
