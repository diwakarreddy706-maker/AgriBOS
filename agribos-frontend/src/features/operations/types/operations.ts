export type MachineType = 'HARVESTER' | 'TRACTOR' | 'ROTAVATOR' | 'BALER';
export type Priority = 'NORMAL' | 'URGENT' | 'EMERGENCY';
export type BookingSource = 'PHONE' | 'WALK_IN' | 'REFERENCE';
export type BookingStatus = 'PENDING' | 'APPROVED' | 'ASSIGNED' | 'DISPATCHED' | 'WORKING' | 'COMPLETED' | 'CANCELLED';
export type DieselResponsibility = 'COMPANY' | 'FARMER' | 'SHARED';
export type BreakReason = 'LUNCH' | 'REPAIR' | 'WAITING' | 'RAIN' | 'FUEL' | 'OTHER';

export interface BookingField {
  id?: number;
  bookingId?: number;
  fieldName: string;
  surveyNumber?: string;
  villageName: string;
  cropType: string;
  estimatedAcres: number;
  actualAcres?: number;
  remarks?: string;
}

export interface Booking {
  id: number;
  bookingNumber: string;
  seasonId: number;
  farmerId: number;
  villageName: string;
  fieldName?: string;
  cropType: string;
  bookingDate: string;
  preferredWorkDate: string;
  preferredStartTime?: string;
  machineType: MachineType;
  estimatedAcres: number;
  estimatedHours: number;
  priority: Priority;
  bookingSource: BookingSource;
  status: BookingStatus;
  farmerNotes?: string;
  internalNotes?: string;
  fields?: BookingField[];
  createdAt: string;
}

export interface BookingCreatePayload {
  seasonId: number;
  farmerId: number;
  villageName: string;
  fieldName?: string;
  cropType: string;
  bookingDate: string;
  preferredWorkDate: string;
  preferredStartTime?: string;
  machineType: MachineType;
  estimatedAcres: number;
  estimatedHours: number;
  priority: Priority;
  bookingSource: BookingSource;
  farmerNotes?: string;
  internalNotes?: string;
  fields?: BookingField[];
}

export interface RentMachineLedgerTicket {
  id: number;
  bookingNumber: string;
  bookingDate: string;
  preferredWorkDate: string;
  farmerId: number;
  farmerName: string;
  farmerPhone: string;
  villageName: string;
  machineId: number;
  machineName: string;
  registrationNumber: string;
  cropType: string;
  rateType: 'HOURLY' | 'ACRE';
  ratePerUnit: number;
  estimatedWorkUnits: number;
  totalEstimatedAmount: number;
  advanceAmountPaid: number;
  paidAmount: number;
  balanceDue: number;
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  notes?: string;
}

export interface DispatchCreatePayload {
  bookingId: number;
  machineId: number;
  operatorId: number;
  driverId?: number;
  dispatchDate: string;
  departureTime: string;
  startingHourMeter: number;
  startingFuelLevel?: number;
  startingVillage?: string;
  destinationVillage?: string;
  remarks?: string;
}

export interface WorkExecutionCreatePayload {
  bookingId?: number;
  farmerId?: number;
  dispatchId?: number;
  machineId?: number;
  operatorId?: number;
  executionDate?: string;
  workDate?: string;
  startTime?: string;
  endTime?: string;
  workingHours?: number;
  workHours?: number;
  netWorkingHours?: number;
  idleHours?: number;
  travelHours?: number;
  breakHours?: number;
  rateType?: 'HOURLY' | 'ACRE';
  ratePerUnit?: number;
  advanceCollected?: number;
  advanceAmount?: number;
  paidAmount?: number;
  villageName?: string;
  operatorName?: string;
  billNumber?: string;
  notes?: string;
  remarks?: string;
  estimatedAcres?: number;
  actualAcres?: number;
  startHourMeter?: number;
  endHourMeter?: number;
  cropCondition?: string;
  weatherCondition?: string;
  dieselResponsibility?: DieselResponsibility;
  dieselProviderName?: string;
  dieselVoucherNumber?: string;
}

export interface OperationsDashboardMetrics {
  todaysBookings: number;
  machinesWorking: number;
  machinesAvailable: number;
  operatorsWorking: number;
  dispatchesToday: number;
  pendingAssignments: number;
  jobsInProgress: number;
  completedJobs: number;
}
