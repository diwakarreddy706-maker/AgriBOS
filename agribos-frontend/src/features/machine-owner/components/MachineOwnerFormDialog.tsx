import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { MachineOwnerCreateInput } from '../types/machineOwner';
import { X } from 'lucide-react';

const ownerSchema = z.object({
  ownerCode: z.string().optional(),
  fullName: z.string().min(2, 'Full name required'),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, '10-digit mobile number required'),
  alternateMobile: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  upiId: z.string().optional(),
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MachineOwnerCreateInput) => Promise<void>;
  isLoading?: boolean;
}

export const MachineOwnerFormDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MachineOwnerCreateInput>({
    resolver: zodResolver(ownerSchema),
  });

  const [apiError, setApiError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: MachineOwnerCreateInput) => {
    try {
      setApiError(null);
      await onSubmit(data);
      reset();
      onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Failed to save machine owner record');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold mb-1 text-slate-900 dark:text-slate-100">
          Register Rented Machine Owner 360°
        </h2>
        <p className="text-xs text-slate-500 mb-4">Enter bank details and contact info for seasonal owner settlements</p>

        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl mb-3">
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Manual Owner Code (Optional)</Label>
              <Input placeholder="e.g. MAC-OWN-001" {...register('ownerCode')} />
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input placeholder="Owner Name" {...register('fullName')} error={errors.fullName?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mobile Number *</Label>
              <Input placeholder="9844011223" {...register('mobileNumber')} error={errors.mobileNumber?.message} />
            </div>
            <div>
              <Label>Alternate Phone</Label>
              <Input placeholder="Alternate Phone" {...register('alternateMobile')} />
            </div>
          </div>

          <div>
            <Label>Address *</Label>
            <Input placeholder="Full Postal Address" {...register('address')} error={errors.address?.message} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Bank Name</Label>
              <Input placeholder="e.g. Canara Bank" {...register('bankName')} />
            </div>
            <div>
              <Label>Account No</Label>
              <Input placeholder="Account Number" {...register('accountNumber')} />
            </div>
            <div>
              <Label>IFSC Code</Label>
              <Input placeholder="CNRB0001234" {...register('ifscCode')} />
            </div>
          </div>

          <div>
            <Label>UPI ID</Label>
            <Input placeholder="owner@upi" {...register('upiId')} />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Save Owner Record</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
