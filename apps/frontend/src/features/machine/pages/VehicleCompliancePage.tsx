import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleComplianceApi } from '../api/vehicleComplianceApi';
import { VehicleComplianceRecord } from '../types/vehicleCompliance';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { 
  Printer, 
  Search, 
  Truck, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Phone, 
  Send, 
  Plus, 
  X,
  FileCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const VehicleCompliancePage: React.FC = () => {
  const { t, language } = useLanguageStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EXPIRED' | 'EXPIRING_SOON'>('ALL');
  
  // Add Vehicle Modal state
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newRegNo, setNewRegNo] = useState('');
  const [newMakeModel, setNewMakeModel] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newInsuranceNo, setNewInsuranceNo] = useState('');
  const [newInsuranceExp, setNewInsuranceExp] = useState('2027-08-01');
  const [newTaxNo, setNewTaxNo] = useState('');
  const [newTaxExp, setNewTaxExp] = useState('2027-08-01');

  // Modal states for Renewal
  const [selectedRecordForRenewal, setSelectedRecordForRenewal] = useState<VehicleComplianceRecord | null>(null);
  const [renewalDocType, setRenewalDocType] = useState<'INSURANCE' | 'ROAD_TAX' | 'NC_PERMIT' | 'FITNESS'>('INSURANCE');
  const [docNumber, setDocNumber] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');

  // WhatsApp Alert modal state
  const [selectedRecordForWhatsApp, setSelectedRecordForWhatsApp] = useState<VehicleComplianceRecord | null>(null);
  const [alertSentToast, setAlertSentToast] = useState<string | null>(null);

  // Fetch compliance records
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['vehicleCompliance', searchQuery, activeFilter],
    queryFn: () => vehicleComplianceApi.getComplianceRecords(searchQuery, activeFilter),
  });

  // Create Vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: vehicleComplianceApi.createComplianceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleCompliance'] });
      setIsAddVehicleOpen(false);
      setNewRegNo('');
      setNewMakeModel('');
      setNewOwnerName('');
      setNewOwnerPhone('');
      setNewInsuranceNo('');
      setNewTaxNo('');
      setAlertSentToast('New vehicle registered successfully in compliance ledger!');
      setTimeout(() => setAlertSentToast(null), 4000);
    },
  });

  // Record Renewal mutation
  const renewalMutation = useMutation({
    mutationFn: vehicleComplianceApi.recordRenewal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleCompliance'] });
      setSelectedRecordForRenewal(null);
      setDocNumber('');
      setNewExpiryDate('');
      setAlertSentToast('Vehicle renewal record saved successfully!');
      setTimeout(() => setAlertSentToast(null), 4000);
    },
  });

  // Metrics computation
  const totalFleet = records.length;
  const expiredCount = records.filter(r => 
    r.insuranceStatus === 'EXPIRED' || 
    r.roadTaxStatus === 'EXPIRED' || 
    r.ncPermitStatus === 'EXPIRED' || 
    r.fitnessStatus === 'EXPIRED'
  ).length;

  const expiringSoonCount = records.filter(r => 
    r.insuranceStatus === 'EXPIRING SOON' || 
    r.roadTaxStatus === 'EXPIRING SOON' || 
    r.ncPermitStatus === 'EXPIRING SOON' || 
    r.fitnessStatus === 'EXPIRING SOON'
  ).length;

  const fullyCompliantCount = records.filter(r => 
    r.insuranceStatus === 'VALID' && 
    r.roadTaxStatus === 'VALID' && 
    r.ncPermitStatus === 'VALID' && 
    r.fitnessStatus === 'VALID'
  ).length;

  const compliancePercentage = totalFleet > 0 ? Math.round((fullyCompliantCount / totalFleet) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveNewVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegNo) return;
    createVehicleMutation.mutate({
      registrationNumber: newRegNo,
      makeModelDescription: newMakeModel || 'Harvester Transport Unit',
      ownerName: newOwnerName || 'Company Fleet Owner',
      ownerPhone: newOwnerPhone || '9880199881',
      insurancePolicyNo: newInsuranceNo || `POL-${newRegNo.replace(/\s+/g, '')}`,
      insuranceExpiryDate: newInsuranceExp,
      roadTaxReceiptNo: newTaxNo || `TAX-${newRegNo.replace(/\s+/g, '')}`,
      roadTaxExpiryDate: newTaxExp,
      ncPermitStatusNo: `PERMIT-${newRegNo.replace(/\s+/g, '')}`,
      ncPermitExpiryDate: '2027-08-01',
      fitnessExpiryDate: '2027-08-01',
      insuranceStatus: 'VALID',
      roadTaxStatus: 'VALID',
      ncPermitStatus: 'VALID',
      fitnessStatus: 'VALID'
    });
  };

  const handleOpenRenewal = (record: VehicleComplianceRecord) => {
    setSelectedRecordForRenewal(record);
    setDocNumber(record.insurancePolicyNo || '');
    setNewExpiryDate('2027-08-01');
  };

  const handleSaveRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForRenewal || !newExpiryDate) return;
    
    renewalMutation.mutate({
      vehicleId: selectedRecordForRenewal.id,
      docType: renewalDocType,
      docNumber: docNumber || 'NEW-DOC-REF',
      newExpiryDate
    });
  };

  const handleSendWhatsApp = (record: VehicleComplianceRecord) => {
    setSelectedRecordForWhatsApp(record);
  };

  const handleConfirmWhatsApp = () => {
    if (!selectedRecordForWhatsApp) return;
    const phone = selectedRecordForWhatsApp.ownerPhone.replace(/\D/g, '');
    const message = `Reminder: Vehicle ${selectedRecordForWhatsApp.registrationNumber} (${selectedRecordForWhatsApp.makeModelDescription}) compliance renewal is due. Please renew policy/tax/permit immediately. - AgriBOS Compliance Office`;
    const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setAlertSentToast(`WhatsApp alert sent to ${selectedRecordForWhatsApp.ownerName} (${selectedRecordForWhatsApp.ownerPhone})`);
    setSelectedRecordForWhatsApp(null);
    setTimeout(() => setAlertSentToast(null), 4000);
  };

  // Helper badge renderer with license & expiry pills
  const renderBadge = (status: 'VALID' | 'EXPIRING SOON' | 'EXPIRED', expDate: string) => {
    if (status === 'EXPIRED') {
      return (
        <div className="flex flex-col space-y-1 mt-1">
          <div className="flex items-center space-x-1.5">
            <span className="bg-red-500/15 text-red-700 dark:text-red-300 font-black text-[9px] px-2 py-0.5 rounded-full uppercase border border-red-500/30 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
              EXPIRED
            </span>
          </div>
          <span className="text-[10px] text-red-500/90 dark:text-red-400/90 font-mono font-bold">Exp: {expDate}</span>
        </div>
      );
    }
    if (status === 'EXPIRING SOON') {
      return (
        <div className="flex flex-col space-y-1 mt-1">
          <div className="flex items-center space-x-1.5">
            <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black text-[9px] px-2 py-0.5 rounded-full uppercase border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-amber-500" />
              EXPIRING SOON
            </span>
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">Exp: {expDate}</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col space-y-1 mt-1">
        <div className="flex items-center space-x-1.5">
          <span className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-black text-[9px] px-2 py-0.5 rounded-full uppercase border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
            VALID
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono font-medium">Exp: {expDate}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans antialiased text-slate-800 dark:text-slate-100">
      
      {/* Toast Notification */}
      {alertSentToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-bold animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{alertSentToast}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-900/10 via-slate-900/5 to-transparent p-5 rounded-3xl border border-amber-500/10 backdrop-blur-xs">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <span>{language === 'kn' ? t.vehicleCompliance : 'TRUCK COMPLIANCE & EXPIRY REMINDER CENTER'}</span>
            <span className="text-xs font-black bg-amber-500/20 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
              {t.complianceLedger || 'ಲಾರಿ ವಿಮೆ & ತೆರಿಗೆ ನೆನಪೋಲೆ'}
            </span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">

            Audit transport truck & heavy tipping trailer insurance policies, road tax receipts, national permits (N/C), FC status, and dispatch owner WhatsApp renewal alerts. (Excludes Harvesters & Tractors).
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 self-start md:self-auto">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-2xl text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Compliance Audit</span>
          </button>

          <button
            onClick={() => setIsAddVehicleOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Transport Truck</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Fleet Monitored */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TRUCK FLEET MONITORED</p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalFleet} Trucks
            </h2>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Transport Trucks & Tipping Trailers</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Expired / Overdue */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-red-200/80 dark:border-red-950 shadow-xs hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-wider">EXPIRED / OVERDUE</p>
            <h2 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
              {expiredCount} Urgent Alerts
            </h2>
            <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> High RTO Fine Risk
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-500 flex items-center justify-center shrink-0 border border-red-200/50">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Expiring in 30 Days */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-amber-200/80 dark:border-amber-950 shadow-xs hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">EXPIRING IN 30 DAYS</p>
            <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {expiringSoonCount} Upcoming
            </h2>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium mt-1">Send owner renewal notices</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/50">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Fleet Compliance Health Meter */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-3xl border border-emerald-200/80 dark:border-emerald-950 shadow-xs hover:shadow-md transition-all flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">COMPLIANCE HEALTH</p>
            <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {compliancePercentage}% Fleet Valid
            </h2>
            <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${compliancePercentage}%` }}
              />
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Truck Reg No (e.g. KA-36 TR 9901), Model, Transport Owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Filter Toggle Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold uppercase transition-all shrink-0 ${
              activeFilter === 'ALL'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            ALL TRUCKS ({totalFleet})
          </button>

          <button
            onClick={() => setActiveFilter('EXPIRED')}
            className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold uppercase transition-all shrink-0 ${
              activeFilter === 'EXPIRED'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>EXPIRED OVERDUE ({expiredCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('EXPIRING_SOON')}
            className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold uppercase transition-all shrink-0 ${
              activeFilter === 'EXPIRING_SOON'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>EXPIRING IN 30 DAYS ({expiringSoonCount})</span>
          </button>
        </div>
      </div>

      {/* Main Audit Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-600" />
            <span>TRANSPORT TRUCK INSURANCE, ROAD TAX & N/C PERMIT AUDIT LEDGER</span>
          </h3>
          <span className="text-[11px] font-extrabold text-slate-400 font-mono">
            {records.length} Trucks Audited
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4">VEHICLE & REG NO</th>
                <th className="p-4">OWNER & CONTACT</th>
                <th className="p-4">INSURANCE POLICY</th>
                <th className="p-4">ROAD TAX RECEIPT</th>
                <th className="p-4">N/C PERMIT STATUS</th>
                <th className="p-4">FITNESS (FC)</th>
                <th className="p-4 text-center">ACTIONS & REMINDERS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading vehicle compliance data...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No vehicles found matching search.</td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* Vehicle & License Plate Reg No */}
                    <td className="p-4">
                      <div className="inline-block bg-amber-400 dark:bg-amber-400 text-slate-950 font-black text-xs font-mono tracking-wider px-2.5 py-1 rounded-lg border-2 border-slate-900 shadow-xs">
                        {rec.registrationNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-1">
                        {rec.makeModelDescription}
                      </div>
                    </td>

                    {/* Owner & Contact */}
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {rec.ownerName}
                      </div>
                      <div className="flex items-center space-x-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span>{rec.ownerPhone}</span>
                      </div>
                    </td>

                    {/* Insurance Policy */}
                    <td className="p-4">
                      <div className="font-bold text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {rec.insurancePolicyNo}
                      </div>
                      {renderBadge(rec.insuranceStatus, rec.insuranceExpiryDate)}
                    </td>

                    {/* Road Tax Receipt */}
                    <td className="p-4">
                      <div className="font-bold text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {rec.roadTaxReceiptNo}
                      </div>
                      {renderBadge(rec.roadTaxStatus, rec.roadTaxExpiryDate)}
                    </td>

                    {/* N/C Permit Status */}
                    <td className="p-4">
                      <div className="font-bold text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {rec.ncPermitStatusNo}
                      </div>
                      {renderBadge(rec.ncPermitStatus, rec.ncPermitExpiryDate)}
                    </td>

                    {/* Fitness (FC) */}
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black font-mono border ${
                        rec.fitnessStatus === 'VALID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                      }`}>
                        FC: {rec.fitnessExpiryDate}
                      </span>
                    </td>

                    {/* Actions & Reminders */}
                    <td className="p-4 text-center">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button
                          onClick={() => handleSendWhatsApp(rec)}
                          className="flex items-center justify-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3 py-2 rounded-xl text-[11px] transition-all shadow-xs hover:scale-105 active:scale-95 w-full sm:w-auto"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp Alert</span>
                        </button>

                        <button
                          onClick={() => handleOpenRenewal(rec)}
                          className="flex items-center justify-center space-x-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black px-3 py-2 rounded-xl text-[11px] border border-slate-200 dark:border-slate-700 transition-all w-full sm:w-auto"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                          <span>Record Renewal</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Renewal Dialog Modal */}
      {selectedRecordForRenewal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                  Record Vehicle Document Renewal
                </h3>
                <p className="text-xs text-slate-400 font-mono font-bold mt-0.5">
                  {selectedRecordForRenewal.registrationNumber} ({selectedRecordForRenewal.makeModelDescription})
                </p>
              </div>
              <button 
                onClick={() => setSelectedRecordForRenewal(null)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRenewal} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Document Type
                </label>
                <select
                  value={renewalDocType}
                  onChange={(e) => setRenewalDocType(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                >
                  <option value="INSURANCE">Insurance Policy</option>
                  <option value="ROAD_TAX">Road Tax Receipt</option>
                  <option value="NC_PERMIT">National / State Permit (N/C)</option>
                  <option value="FITNESS">Fitness Certificate (FC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  Document / Policy Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POL-TATA-998822"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                  New Expiry Date
                </label>
                <input
                  type="date"
                  required
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedRecordForRenewal(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renewalMutation.isPending}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all hover:scale-105"
                >
                  {renewalMutation.isPending ? 'Updating...' : 'Save Renewal Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Modal Confirmation */}
      {selectedRecordForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-500" />
                <span>Send WhatsApp Expiry Alert</span>
              </h3>
              <button 
                onClick={() => setSelectedRecordForWhatsApp(null)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800 space-y-2">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Recipient: {selectedRecordForWhatsApp.ownerName}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                Phone: {selectedRecordForWhatsApp.ownerPhone}
              </p>
              <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 italic mt-2">
                "Reminder: Vehicle {selectedRecordForWhatsApp.registrationNumber} ({selectedRecordForWhatsApp.makeModelDescription}) compliance renewal is due. Please renew policy/tax/permit immediately. - AgriBOS Compliance Office"
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSelectedRecordForWhatsApp(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWhatsApp}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all hover:scale-105 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Open WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Vehicle Modal */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                  Register Transport Truck Compliance Entry
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  Track transport truck RTO registration, insurance policy, road tax, and permit validity
                </p>
              </div>
              <button 
                onClick={() => setIsAddVehicleOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewVehicle} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA-36 TR 9901"
                    value={newRegNo}
                    onChange={(e) => setNewRegNo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Make / Model Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tata 1613 Transport Truck"
                    value={newMakeModel}
                    onChange={(e) => setNewMakeModel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Basaveshwara Fleet"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Owner Mobile Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9880199881"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Insurance Policy No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. POL-TATA-8829"
                    value={newInsuranceNo}
                    onChange={(e) => setNewInsuranceNo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newInsuranceExp}
                    onChange={(e) => setNewInsuranceExp(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Road Tax Receipt No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TAX-KA-2026-99"
                    value={newTaxNo}
                    onChange={(e) => setNewTaxNo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                    Road Tax Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newTaxExp}
                    onChange={(e) => setNewTaxExp(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createVehicleMutation.isPending}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all hover:scale-105"
                >
                  {createVehicleMutation.isPending ? 'Registering...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

