import React, { useState, useEffect } from 'react';
import { X, Receipt, Loader2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

interface FarmerOption {
  id: number;
  full_name: string;
  farmer_code: string;
  mobile_number: string;
  total_outstanding_udhar?: number;
}

interface CreateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdReceipt: any) => void;
  defaultFarmerId?: number;
}

export const CreateReceiptModal: React.FC<CreateReceiptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultFarmerId
}) => {
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farmerId, setFarmerId] = useState<number | ''>(defaultFarmerId || '');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<string>('CASH');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFarmers();
    }
  }, [isOpen]);

  const fetchFarmers = async () => {
    try {
      const res = await apiClient.get('/farmers');
      if (res.data?.success) {
        const list = res.data.data.content || res.data.data || [];
        setFarmers(list);
        if (defaultFarmerId) {
          setFarmerId(defaultFarmerId);
        } else if (list.length > 0) {
          setFarmerId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch farmers', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId) {
      setError('Please select a farmer');
      return;
    }
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setError('Please enter a valid payment amount greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        farmerId: Number(farmerId),
        paymentAmount: Number(paymentAmount),
        paymentMode,
        transactionRef,
        notes
      };

      const res = await apiClient.post('/receipts', payload);
      if (res.data?.success) {
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to record receipt');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Record Udhar Payment Receipt</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Farmer *</label>
            <select
              value={farmerId}
              onChange={e => setFarmerId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              required
            >
              <option value="">Select a farmer...</option>
              {farmers.map(f => (
                <option key={f.id} value={f.id}>
                  {f.full_name} ({f.farmer_code} - {f.mobile_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Payment Amount Received (₹) *</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
              min="1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reference / UTR No.</label>
              <input
                type="text"
                placeholder="Transaction ID / Ref"
                value={transactionRef}
                onChange={e => setTransactionRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Remarks / Notes</label>
            <input
              type="text"
              placeholder="Optional remarks"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-lg shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              <span>Generate Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReceiptModal;
