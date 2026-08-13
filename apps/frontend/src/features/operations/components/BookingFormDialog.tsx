import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { BookingCreatePayload } from '../types/operations';

const bookingSchema = z.object({
  farmerId: z.number().min(1, 'Farmer is required'),
  villageName: z.string().min(1, 'Village name is required'),
  cropType: z.string().min(1, 'Crop type is required'),
  bookingDate: z.string().min(1, 'Booking date is required'),
  preferredWorkDate: z.string().min(1, 'Preferred work date is required'),
  machineType: z.enum(['HARVESTER', 'TRACTOR', 'ROTAVATOR', 'BALER']),
  estimatedAcres: z.number().min(0.1, 'Estimated acres required'),
  estimatedHours: z.number().min(0.1, 'Estimated hours required'),
  priority: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']),
  bookingSource: z.enum(['PHONE', 'WALK_IN', 'REFERENCE']),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingCreatePayload) => void;
  isLoading: boolean;
}

export const BookingFormDialog: React.FC<BookingFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      farmerId: 1,
      bookingDate: new Date().toISOString().split('T')[0],
      preferredWorkDate: new Date().toISOString().split('T')[0],
      machineType: 'HARVESTER',
      priority: 'NORMAL',
      bookingSource: 'PHONE',
      estimatedAcres: 1,
      estimatedHours: 2,
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Field Booking</h2>

        <form onSubmit={handleSubmit((data) => onSubmit({ ...data, seasonId: 1 }))} className="space-y-4">
          <div>
            <Label htmlFor="villageName">Village Name</Label>
            <Input id="villageName" {...register('villageName')} error={errors.villageName?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cropType">Crop Type</Label>
              <Input id="cropType" placeholder="Paddy / Maize" {...register('cropType')} error={errors.cropType?.message} />
            </div>
            <div>
              <Label htmlFor="machineType">Machine Type</Label>
              <select
                id="machineType"
                {...register('machineType')}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
              >
                <option value="HARVESTER">Combine Harvester</option>
                <option value="TRACTOR">Tractor</option>
                <option value="ROTAVATOR">Rotavator</option>
                <option value="BALER">Baler</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bookingDate">Booking Date</Label>
              <Input id="bookingDate" type="date" {...register('bookingDate')} error={errors.bookingDate?.message} />
            </div>
            <div>
              <Label htmlFor="preferredWorkDate">Preferred Work Date</Label>
              <Input id="preferredWorkDate" type="date" {...register('preferredWorkDate')} error={errors.preferredWorkDate?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedAcres">Estimated Acres</Label>
              <Input id="estimatedAcres" type="number" step="0.1" {...register('estimatedAcres', { valueAsNumber: true })} error={errors.estimatedAcres?.message} />
            </div>
            <div>
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input id="estimatedHours" type="number" step="0.5" {...register('estimatedHours', { valueAsNumber: true })} error={errors.estimatedHours?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                {...register('priority')}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div>
              <Label htmlFor="bookingSource">Booking Source</Label>
              <select
                id="bookingSource"
                {...register('bookingSource')}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
              >
                <option value="PHONE">Phone</option>
                <option value="WALK_IN">Walk-in</option>
                <option value="REFERENCE">Reference</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Booking
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
