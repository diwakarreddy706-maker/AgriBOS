import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { MachineCreateInput } from '../types/machine';
import { X } from 'lucide-react';

const machineSchema = z.object({
  machineCode: z.string().optional(),
  registrationNumber: z.string().optional(),
  machineType: z.string().min(1, 'Machine type required'),
  ownershipType: z.enum(['OWNED', 'RENTED']),
  ownerId: z.coerce.number().optional(),
  makeModel: z.string().min(2, 'Make/Model required'),
  manufactureYear: z.coerce.number().optional(),
  engineHours: z.coerce.number().optional(),
  hourlyRateDefault: z.coerce.number().min(0, 'Hourly rate required'),
  acreRateDefault: z.coerce.number().min(0, 'Per acre rate required'),
});

type MachineFormData = z.infer<typeof machineSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MachineCreateInput) => Promise<void>;
  isLoading?: boolean;
  categoryMode?: 'TRACTOR' | 'HARVESTER' | 'ALL';
}

export const MachineFormDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit, isLoading, categoryMode = 'ALL' }) => {
  const defaultMachineType = categoryMode === 'TRACTOR' ? 'TRACTOR' : categoryMode === 'HARVESTER' ? 'COMBINE_HARVESTER' : 'HARVESTER';

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<MachineFormData>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      machineType: defaultMachineType,
      ownershipType: 'OWNED',
      hourlyRateDefault: categoryMode === 'TRACTOR' ? 1500 : 2400,
      acreRateDefault: categoryMode === 'TRACTOR' ? 1200 : 1800,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      setValue('machineType', defaultMachineType);
      if (categoryMode === 'TRACTOR') {
        setValue('ownershipType', 'OWNED');
        setValue('hourlyRateDefault', 1500);
        setValue('acreRateDefault', 1200);
      } else if (categoryMode === 'HARVESTER') {
        setValue('hourlyRateDefault', 2400);
        setValue('acreRateDefault', 1800);
      }
    }
  }, [isOpen, categoryMode, defaultMachineType, setValue]);

  const [apiError, setApiError] = React.useState<string | null>(null);
  const selectedOwnership = watch('ownershipType');
  const selectedMachineType = watch('machineType');
  const isHarvester = selectedMachineType === 'HARVESTER' || selectedMachineType === 'COMBINE_HARVESTER' || categoryMode === 'HARVESTER';

  if (!isOpen) return null;

  const handleFormSubmit = async (data: MachineFormData) => {
    try {
      setApiError(null);
      const payload: MachineCreateInput = {
        ...data,
        ownershipType: categoryMode === 'TRACTOR' ? 'OWNED' : (data.ownershipType as any),
        registrationNumber: isHarvester ? 'N/A' : (data.registrationNumber || '')
      };
      await onSubmit(payload);
      reset();
      onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Failed to save machine fleet record');
    }
  };

  const title = categoryMode === 'TRACTOR'
    ? 'Register New Tractor Fleet'
    : categoryMode === 'HARVESTER'
    ? 'Register New Harvesting Machine'
    : 'Register New Machine Fleet 360°';

  const subtitle = categoryMode === 'TRACTOR'
    ? 'Company Owned Tractor, Rotavator, Baler & Implement Catalog'
    : categoryMode === 'HARVESTER'
    ? 'Owned vs Seasonal Rented Combine Harvester Catalog'
    : 'Owned vs Seasonal Rented Harvester / Tractor Catalog';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold mb-1 text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="text-xs text-slate-500 mb-4">{subtitle}</p>

        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl mb-3">
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Machine Type *</Label>
              <select className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm" {...register('machineType')}>
                {categoryMode === 'TRACTOR' ? (
                  <>
                    <option value="TRACTOR">Tractor (Requires RTO Reg No)</option>
                    <option value="ROTAVATOR">Rotavator</option>
                    <option value="BALER">Baler</option>
                    <option value="IMPLEMENT">Agricultural Implement</option>
                  </>
                ) : categoryMode === 'HARVESTER' ? (
                  <>
                    <option value="COMBINE_HARVESTER">Combine Harvester (No RTO Reg No)</option>
                    <option value="HARVESTER">Field Harvester</option>
                  </>
                ) : (
                  <>
                    <option value="HARVESTER">Combine Harvester (No Reg No)</option>
                    <option value="TRACTOR">Tractor (Requires Reg No)</option>
                    <option value="ROTAVATOR">Rotavator / Implement</option>
                    <option value="BALER">Baler</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <Label>Registration Number {isHarvester ? '(N/A for Harvester)' : '*'}</Label>
              <Input
                placeholder={isHarvester ? 'N/A (No Reg No for Harvester)' : 'e.g. KA-36-T-1234'}
                disabled={isHarvester}
                {...register('registrationNumber')}
                error={errors.registrationNumber?.message}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Manual Machine Code (Optional)</Label>
              <Input placeholder={categoryMode === 'TRACTOR' ? 'e.g. TRAC-575-01' : 'e.g. MAC-HARV-001'} {...register('machineCode')} />
            </div>
            <div>
              <Label>Ownership Type *</Label>
              {categoryMode === 'TRACTOR' ? (
                <select className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-300 font-semibold cursor-not-allowed" disabled {...register('ownershipType')}>
                  <option value="OWNED">Company Owned Fleet (100% Owned)</option>
                </select>
              ) : (
                <select className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm" {...register('ownershipType')}>
                  <option value="OWNED">Company Owned Fleet</option>
                  <option value="RENTED">Seasonal Rented Fleet</option>
                </select>
              )}
            </div>
          </div>

          {categoryMode !== 'TRACTOR' && selectedOwnership === 'RENTED' && (
            <div>
              <Label>Rented Machine Owner ID *</Label>
              <Input type="number" placeholder="Enter Owner ID (e.g. 1)" {...register('ownerId')} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Make & Model *</Label>
              <Input placeholder={categoryMode === 'TRACTOR' ? 'e.g. Mahindra 575 DI' : 'e.g. Kubota DC-68G'} {...register('makeModel')} error={errors.makeModel?.message} />
            </div>
            <div>
              <Label>Manufacture Year</Label>
              <Input type="number" placeholder="2024" {...register('manufactureYear')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Engine Hours</Label>
              <Input type="number" step="0.1" placeholder="100" {...register('engineHours')} />
            </div>
            <div>
              <Label>Hourly Rate (₹) *</Label>
              <Input type="number" placeholder={categoryMode === 'TRACTOR' ? '1500' : '2400'} {...register('hourlyRateDefault')} />
            </div>
            <div>
              <Label>Per Acre Rate (₹) *</Label>
              <Input type="number" placeholder={categoryMode === 'TRACTOR' ? '1200' : '1800'} {...register('acreRateDefault')} />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Save Machine Entry</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
