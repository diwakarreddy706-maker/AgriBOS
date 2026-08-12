import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileCheck, Loader2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

interface FarmerOption {
  id: number;
  full_name: string;
  farmer_code: string;
  mobile_number: string;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdInvoice: any) => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farmerId, setFarmerId] = useState<number | ''>('');
  const [invoiceType, setInvoiceType] = useState<string>('PRODUCT_SALE');
  const [discount, setDiscount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<Array<{ itemName: string; quantity: number; unit: string; unitPrice: number }>>([
    { itemName: '', quantity: 1, unit: 'PCS', unitPrice: 0 }
  ]);

  useEffect(() => {
    if (isOpen) {
      fetchFarmers();
    }
  }, [isOpen]);

  const fetchFarmers = async () => {
    try {
      const res = await apiClient.get('/farmers');
      if (res.data?.success) {
        setFarmers(res.data.data.content || res.data.data || []);
        if (res.data.data?.length > 0) {
          setFarmerId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch farmers list', err);
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, { itemName: '', quantity: 1, unit: 'PCS', unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, val: any) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: val } : it));
  };

  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const grandTotal = Math.max(0, subtotal - (Number(discount) || 0) + (Number(taxAmount) || 0));
  const balanceDue = Math.max(0, grandTotal - (Number(paidAmount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId) {
      setError('Please select a farmer');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        farmerId: Number(farmerId),
        invoiceType,
        items,
        discount: Number(discount),
        taxAmount: Number(taxAmount),
        paidAmount: Number(paidAmount),
        notes
      };

      const res = await apiClient.post('/invoices', payload);
      if (res.data?.success) {
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Create New Invoice</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Farmer & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Farmer *</label>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Invoice Type</label>
              <select
                value={invoiceType}
                onChange={e => setInvoiceType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="PRODUCT_SALE">Product Sale (Fertilizer/Pesticide)</option>
                <option value="TRACTOR_SERVICE">Tractor Service Billing</option>
                <option value="HARVESTING_SERVICE">Harvesting Service Billing</option>
              </select>
            </div>
          </div>

          {/* Item Lines */}
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/50 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Itemized Line Items</span>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Item Name / Description"
                  value={it.itemName}
                  onChange={e => updateItem(idx, 'itemName', e.target.value)}
                  className="col-span-5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Qty/Hrs"
                  value={it.quantity}
                  onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                  className="col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500"
                  min="0.01"
                  step="any"
                  required
                />
                <input
                  type="text"
                  placeholder="Unit (Hrs/Acre/Bags)"
                  value={it.unit}
                  onChange={e => updateItem(idx, 'unit', e.target.value)}
                  className="col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Rate (₹)"
                  value={it.unitPrice}
                  onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))}
                  className="col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500"
                  min="0"
                  step="any"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="col-span-1 p-1 text-slate-500 hover:text-red-400 flex justify-center"
                  disabled={items.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Financial Calculation Summary */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Discount (₹)</label>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tax Amount (₹)</label>
              <input
                type="number"
                value={taxAmount}
                onChange={e => setTaxAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Initial Paid (₹)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 text-right focus:outline-none focus:border-emerald-500"
                min="0"
              />
            </div>
          </div>

          {/* Totals Display Box */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-400">Subtotal: <strong className="text-slate-200">₹{subtotal.toLocaleString('en-IN')}</strong></span>
            <span className="text-slate-400">Grand Total: <strong className="text-emerald-400 font-semibold">₹{grandTotal.toLocaleString('en-IN')}</strong></span>
            <span className="text-slate-400">Balance Due (Udhar): <strong className="text-red-400 font-semibold">₹{balanceDue.toLocaleString('en-IN')}</strong></span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Invoice Remarks / Notes</label>
            <input
              type="text"
              placeholder="Optional notes or remarks"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              <span>Generate Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;
