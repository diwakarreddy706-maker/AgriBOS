import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { FarmerCreateInput } from '../types/farmer';
import { X } from 'lucide-react';

const farmerSchema = z.object({
  farmerCode: z.string().optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  fatherName: z.string().optional(),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  alternateMobile: z.string().optional(),
  villageName: z.string().min(1, 'Village name is required'),
  talukName: z.string().min(1, 'Taluk name is required'),
  districtName: z.string().min(1, 'District name is required'),
  upiId: z.string().optional(),
  notes: z.string().optional(),
});

interface FarmerFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FarmerCreateInput) => Promise<void>;
  isLoading?: boolean;
}

export const FarmerFormDialog: React.FC<FarmerFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FarmerCreateInput>({
    resolver: zodResolver(farmerSchema),
    defaultValues: {
      villageName: 'Honnali',
      talukName: 'Honnali',
      districtName: 'Davanagere',
    },
  });

  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: FarmerCreateInput) => {
    try {
      setApiError(null);
      await onSubmit(data);
      reset();
      onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Failed to save farmer record');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold mb-1 text-slate-900 dark:text-slate-100">
          Register New Farmer Profile 360°
        </h2>
        <p className="text-xs text-slate-500 mb-4">Enter manual Farmer ID and personal details</p>

        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl mb-3">
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Manual Farmer ID (Optional)</Label>
              <Input placeholder="e.g. FARM-2026-0042" {...register('farmerCode')} error={errors.farmerCode?.message} />
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input placeholder="Farmer Name" {...register('fullName')} error={errors.fullName?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Father / Husband Name</Label>
              <Input placeholder="Father Name" {...register('fatherName')} />
            </div>
            <div>
              <Label>Mobile Number *</Label>
              <Input placeholder="9900011223" {...register('mobileNumber')} error={errors.mobileNumber?.message} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Village *</Label>
              <Input placeholder="Honnali" {...register('villageName')} error={errors.villageName?.message} />
            </div>
            <div>
              <Label>Taluk *</Label>
              <Input placeholder="Honnali" {...register('talukName')} error={errors.talukName?.message} />
            </div>
            <div>
              <Label>District *</Label>
              <Input placeholder="Davanagere" {...register('districtName')} error={errors.districtName?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>UPI ID (Optional)</Label>
              <Input placeholder="farmer@upi" {...register('upiId')} />
            </div>
            <div>
              <Label>Alternate Phone</Label>
              <Input placeholder="Alternate No" {...register('alternateMobile')} />
            </div>
          </div>

          <div>
            <Label>Land & Crop Notes</Label>
            <Input placeholder="e.g. Paddy 8 Acres in Honnali" {...register('notes')} />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Save Farmer Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
