import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../api/paymentApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { 
  Building2, 
  Smartphone, 
  Banknote, 
  Plus, 
  Search, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X,
  Printer,
  CheckCircle2
} from 'lucide-react';

interface BankTransaction {
  id: string;
  date: string;
  account: 'SBI_BANK' | 'PHONEPE_UPI' | 'CASH_BOX';
  type: 'CREDIT' | 'DEBIT';
  category: string;
  partyName: string;
  refNo: string;
  amount: number;
  runningBalance: number;
  remarks: string;
}

export const CashBookPage: React.FC = () => {
  const [activeAccount, setActiveAccount] = useState<'ALL' | 'SBI_BANK' | 'PHONEPE_UPI' | 'CASH_BOX'>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<BankTransaction | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    account: 'SBI_BANK' | 'PHONEPE_UPI' | 'CASH_BOX';
    type: 'CREDIT' | 'DEBIT';
    category: string;
    partyName: string;
    refNo: string;
    amount: string;
    remarks: string;
  }>({
    account: 'SBI_BANK',
    type: 'CREDIT',
    category: 'Farmer Bill Payment',
    partyName: '',
    refNo: '',
    amount: '',
    remarks: '',
  });

  useQuery({
    queryKey: ['cashBook'],
    queryFn: () => paymentApi.getCashBook(),
  });

  // Calculate Account Balances
  const sbiBalance = transactions
    .filter((t) => t.account === 'SBI_BANK')
    .reduce((acc, curr) => acc + (curr.type === 'CREDIT' ? curr.amount : -curr.amount), 440000);

  const phonepeBalance = transactions
    .filter((t) => t.account === 'PHONEPE_UPI')
    .reduce((acc, curr) => acc + (curr.type === 'CREDIT' ? curr.amount : -curr.amount), 127000);

  const cashBalance = transactions
    .filter((t) => t.account === 'CASH_BOX')
    .reduce((acc, curr) => acc + (curr.type === 'CREDIT' ? curr.amount : -curr.amount), 97500);

  const totalFunds = sbiBalance + phonepeBalance + cashBalance;

  // Filtered Transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesAccount = activeAccount === 'ALL' || t.account === activeAccount;
    const matchesSearch =
      t.partyName.toLowerCase().includes(search.toLowerCase()) ||
      t.refNo.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    return matchesAccount && matchesSearch;
  });

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.amount) || 0;
    if (numAmount <= 0) return;

    let currentAccBalance = sbiBalance;
    if (formData.account === 'PHONEPE_UPI') currentAccBalance = phonepeBalance;
    if (formData.account === 'CASH_BOX') currentAccBalance = cashBalance;

    const newRunning = formData.type === 'CREDIT' ? currentAccBalance + numAmount : currentAccBalance - numAmount;

    const newEntry: BankTransaction = {
      id: `TXN-2026-${String(transactions.length + 1).padStart(3, '0')}`,
      date: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      account: formData.account,
      type: formData.type,
      category: formData.category,
      partyName: formData.partyName || 'Walk-in Party',
      refNo: formData.refNo || (formData.account === 'PHONEPE_UPI' ? 'UPI/' + Math.floor(Math.random() * 1000000000) : 'REF-' + Math.floor(Math.random() * 10000)),
      amount: numAmount,
      runningBalance: newRunning,
      remarks: formData.remarks || 'Recorded Bank / Cash ledger entry',
    };

    setTransactions([newEntry, ...transactions]);
    setIsModalOpen(false);
    setFormData({
      account: 'SBI_BANK',
      type: 'CREDIT',
      category: 'Farmer Bill Payment',
      partyName: '',
      refNo: '',
      amount: '',
      remarks: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Building2 className="w-7 h-7 text-emerald-600" />
            <span>Bank & Cash Book Ledger 360° (ಬ್ಯಾಂಕ್ ಮತ್ತು ನಗದು ಖಾತೆ)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time bank statements, SBI Current A/C, PhonePe UPI wallet & physical cash book counter
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center space-x-2 shadow-lg">
          <Plus className="w-4 h-4" />
          <span>Record Bank / Cash Entry</span>
        </Button>
      </div>

      {/* Accounts Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-blue-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200">SBI Current Account</p>
              <p className="text-xs font-mono text-blue-300 mt-0.5">A/C: 30998812345 (Basaveshwara)</p>
            </div>
            <div className="p-2 bg-white/10 rounded-xl">
              <Building2 className="w-5 h-5 text-blue-200" />
            </div>
          </div>
          <p className="text-2xl font-black mt-4">₹{sbiBalance.toLocaleString()}</p>
          <div className="flex items-center text-[10px] text-blue-200 mt-2 space-x-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>State Bank of India (IFSC: SBIN0001234)</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900 to-violet-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-purple-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200">PhonePe / UPI Wallet</p>
              <p className="text-xs font-mono text-purple-300 mt-0.5">UPI ID: basaveshwara@ybl</p>
            </div>
            <div className="p-2 bg-white/10 rounded-xl">
              <Smartphone className="w-5 h-5 text-purple-200" />
            </div>
          </div>
          <p className="text-2xl font-black mt-4">₹{phonepeBalance.toLocaleString()}</p>
          <div className="flex items-center text-[10px] text-purple-200 mt-2 space-x-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>QR Instant Farmer Collections</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-900 to-orange-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-amber-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200">Physical Cash Counter</p>
              <p className="text-xs font-mono text-amber-300 mt-0.5">Main Office Safe Box</p>
            </div>
            <div className="p-2 bg-white/10 rounded-xl">
              <Banknote className="w-5 h-5 text-amber-200" />
            </div>
          </div>
          <p className="text-2xl font-black mt-4">₹{cashBalance.toLocaleString()}</p>
          <div className="flex items-center text-[10px] text-amber-200 mt-2 space-x-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Daily Cash Register Book</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-teal-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-emerald-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">Total Net Working Capital</p>
              <p className="text-xs text-emerald-300 mt-0.5">Bank + UPI + Cash Combined</p>
            </div>
            <div className="p-2 bg-white/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-200" />
            </div>
          </div>
          <p className="text-2xl font-black mt-4">₹{totalFunds.toLocaleString()}</p>
          <div className="flex items-center text-[10px] text-emerald-200 mt-2 space-x-1 font-medium">
            <span>Sri Basaveshwara Enterprise Funds</span>
          </div>
        </div>
      </div>

      {/* Account Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Accounts Ledger' },
            { id: 'SBI_BANK', label: '🏦 SBI Bank Account' },
            { id: 'PHONEPE_UPI', label: '📱 PhonePe / UPI' },
            { id: 'CASH_BOX', label: '💵 Cash Box Register' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAccount(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeAccount === tab.id
                  ? 'bg-emerald-700 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search party name, UTR, ref no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Bank Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Bank & Cash Movement Statements</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Showing {filteredTransactions.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="p-3">Txn ID & Date</th>
                <th className="p-3">Account Mode</th>
                <th className="p-3">Category & Party</th>
                <th className="p-3">UTR / Ref Number</th>
                <th className="p-3">Entry Type</th>
                <th className="p-3 font-bold text-right">Amount (₹)</th>
                <th className="p-3 font-bold text-right">Running Balance (₹)</th>
                <th className="p-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{t.id}</div>
                    <div className="text-[10px] text-slate-400">{t.date}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                        t.account === 'SBI_BANK'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : t.account === 'PHONEPE_UPI'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {t.account === 'SBI_BANK' ? '🏦 SBI Bank' : t.account === 'PHONEPE_UPI' ? '📱 PhonePe' : '💵 Cash Box'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{t.partyName}</div>
                    <div className="text-[10px] text-slate-500">{t.category}</div>
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{t.refNo}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        t.type === 'CREDIT'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {t.type === 'CREDIT' ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3 mr-1 text-emerald-600" />
                          <span>MONEY IN (+ CREDIT)</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3 h-3 mr-1 text-rose-600" />
                          <span>MONEY OUT (- DEBIT)</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className={`p-3 text-right font-black text-sm ${t.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    ₹{t.runningBalance.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedReceipt(t)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-600 dark:text-slate-300 hover:text-emerald-700 transition-colors"
                      title="Print Bank Voucher Slip"
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

      {/* Record Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Record Bank / Cash Ledger Transaction
            </h2>
            <p className="text-xs text-slate-500">Enter money in/out details for SBI Bank, PhonePe, or Cash Counter</p>

            <form onSubmit={handleAddTransaction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Transaction Type *</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'CREDIT' | 'DEBIT' })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  >
                    <option value="CREDIT">🟢 MONEY IN (+ CREDIT)</option>
                    <option value="DEBIT">🔴 MONEY OUT (- DEBIT)</option>
                  </select>
                </div>

                <div>
                  <Label>Bank Account / Wallet *</Label>
                  <select
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  >
                    <option value="SBI_BANK">🏦 SBI Current Account</option>
                    <option value="PHONEPE_UPI">📱 PhonePe / UPI Wallet</option>
                    <option value="CASH_BOX">💵 Physical Cash Box</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category *</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  >
                    <option value="Farmer Bill Payment">Farmer Bill Payment</option>
                    <option value="Farmer Advance Collection">Farmer Advance Collection</option>
                    <option value="Seasonal Owner Settlement">Seasonal Owner Settlement</option>
                    <option value="Diesel Fuel Purchase">Diesel Fuel Purchase</option>
                    <option value="Operator / Helper Salary">Operator / Helper Salary</option>
                    <option value="Workshop & Spare Parts">Workshop & Spare Parts</option>
                  </select>
                </div>

                <div>
                  <Label>Amount (₹) *</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="font-bold text-base text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Party Name (Farmer/Vendor/Owner)</Label>
                  <Input
                    placeholder="e.g. Diwakar / Ramesh"
                    value={formData.partyName}
                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                  />
                </div>

                <div>
                  <Label>UTR / Reference No / Cheque No</Label>
                  <Input
                    placeholder="e.g. UPI/620998811 or NEFT..."
                    value={formData.refNo}
                    onChange={(e) => setFormData({ ...formData, refNo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Remarks / Narration</Label>
                <Input
                  placeholder="Enter transaction notes or harvesting job details..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
                  Save Bank Transaction
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Bank Voucher Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative space-y-4 font-mono">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>

            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
              <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                SRI BASAVESHWARA & CO.
              </h2>
              <p className="text-[11px] text-slate-500">Official Bank / Cash Voucher Receipt</p>
              <p className="text-[10px] text-slate-400">Transaction Ref: {selectedReceipt.id}</p>
            </div>

            <div className="text-xs space-y-2 border-b border-dashed border-slate-300 pb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span>{selectedReceipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Mode:</span>
                <span className="font-bold">{selectedReceipt.account}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Party Name:</span>
                <span className="font-bold">{selectedReceipt.partyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span>{selectedReceipt.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UTR / Ref No:</span>
                <span className="font-mono">{selectedReceipt.refNo}</span>
              </div>
            </div>

            <div className="text-xs space-y-2 font-mono pt-1">
              <div className="flex justify-between text-base font-black text-slate-900 dark:text-slate-100">
                <span>Transaction Amount:</span>
                <span className={selectedReceipt.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}>
                  {selectedReceipt.type === 'CREDIT' ? '+' : '-'}₹{selectedReceipt.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Updated Balance:</span>
                <span>₹{selectedReceipt.runningBalance.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-slate-400 italic pt-2">Notes: {selectedReceipt.remarks}</p>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => window.print()} className="w-full bg-emerald-700 text-white font-bold text-xs">
                <Printer className="w-4 h-4 mr-2" /> Print Official Bank Slip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
