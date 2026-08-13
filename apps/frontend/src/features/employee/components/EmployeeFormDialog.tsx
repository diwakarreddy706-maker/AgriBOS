import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { EmployeeCreateInput } from '../types/employee';
import { X, UserPlus } from 'lucide-react';

const employeeSchema = z.object({
  employeeCode: z.string().optional(),
  fullName: z.string().min(2, 'Full name required'),
  roleName: z.string().min(1, 'Role is required'),
  specialization: z.string().optional(),
  assignedMachine: z.string().optional(),
  drivingLicense: z.string().optional(),
  dailyWageRate: z.coerce.number().optional(),
  villageLocation: z.string().optional(),
  experienceYears: z.coerce.number().optional(),
  status: z.string().optional(),
  joiningDate: z.string().optional(),
  department: z.string().optional(),
  monthlySalary: z.coerce.number().optional(),
  hourlyRate: z.coerce.number().optional(),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, '10-digit mobile number required'),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeCreateInput) => Promise<void>;
  isLoading?: boolean;
}

export const EmployeeFormDialog: React.FC<Props> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeCreateInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      roleName: 'DRIVER',
      joiningDate: new Date().toISOString().split('T')[0],
      department: 'OPERATIONS',
      status: 'ACTIVE',
      dailyWageRate: 850,
      experienceYears: 5,
      specialization: 'Heavy Tractor Operator',
      assignedMachine: 'John Deere JD-5050 (KA-36-T-1029)',
      villageLocation: 'Sindhanur Taluk',
    },
  });

  const [apiError, setApiError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: EmployeeCreateInput) => {
    try {
      setApiError(null);
      await onSubmit(data);
      reset();
      onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Failed to save personnel record');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Register Driver, Operator, Helper or Foreman
            </h2>
            <p className="text-xs text-slate-500">Create a new entry for field workforce directory & trip assignments</p>
          </div>
        </div>

        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl mb-3">
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Full Name *</Label>
              <Input placeholder="e.g. Sharanu Gowda" {...register('fullName')} error={errors.fullName?.message} />
            </div>
            <div>
              <Label>Personnel Role *</Label>
              <select className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium" {...register('roleName')}>
                <option value="DRIVER">Driver (Tractor / Truck)</option>
                <option value="OPERATOR">Operator (Harvester / Heavy Machine)</option>
                <option value="HELPER">Helper (Field Assistant)</option>
                <option value="FOREMAN">Foreman (Supervisor / Manager)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Specialization Title</Label>
              <Input placeholder="e.g. Heavy Tractor Operator" {...register('specialization')} />
            </div>
            <div>
              <Label>Assigned Machine</Label>
              <Input placeholder="e.g. John Deere JD-5050 (KA-36-T-1029)" {...register('assignedMachine')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Driving License Number</Label>
              <Input placeholder="e.g. KA-36-2019-00128" {...register('drivingLicense')} />
            </div>
            <div>
              <Label>Daily Wage Rate (₹ / day)</Label>
              <Input type="number" placeholder="850" {...register('dailyWageRate')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Village / Location</Label>
              <Input placeholder="e.g. Alabanur Village" {...register('villageLocation')} />
            </div>
            <div>
              <Label>Experience (Years)</Label>
              <Input type="number" placeholder="7" {...register('experienceYears')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mobile Contact *</Label>
              <Input placeholder="e.g. 9845123456" {...register('mobileNumber')} error={errors.mobileNumber?.message} />
            </div>
            <div>
              <Label>Initial Status</Label>
              <select className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm" {...register('status')}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON TRIP">ON TRIP</option>
                <option value="ON LEAVE">ON LEAVE</option>
                <option value="AVAILABLE">AVAILABLE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Manual Emp Code (Optional)</Label>
              <Input placeholder="e.g. DRV-005" {...register('employeeCode')} />
            </div>
            <div>
              <Label>Joining Date</Label>
              <Input type="date" {...register('joiningDate')} />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isLoading} className="bg-emerald-700 hover:bg-emerald-800 text-white">Save Personnel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

