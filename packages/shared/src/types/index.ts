import type { MachineType, MachineStatus, PaymentMode, PaymentStatus, UserRole } from '../constants/index.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface FarmerContract {
  id: number;
  farmerCode: string;
  fullName: string;
  fatherName?: string;
  mobileNumber: string;
  alternateMobile?: string;
  villageId?: number;
  villageName: string;
  talukName: string;
  districtName: string;
  upiId?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export interface MachineContract {
  id: number;
  machineCode: string;
  name: string;
  machineType: MachineType;
  registrationNumber?: string;
  modelNumber?: string;
  hourlyRate: number;
  acreRate: number;
  ownershipType: 'OWNED' | 'RENTED';
  status: MachineStatus;
  notes?: string;
}

export interface WorkExecutionContract {
  id: number;
  billNumber: string;
  farmerId: number;
  farmerName: string;
  machineId: number;
  machineName: string;
  operatorId?: number;
  operatorName?: string;
  workDate: string;
  cropType: string;
  workType: 'HOURLY' | 'ACREAGE';
  quantityWorked: number;
  ratePerUnit: number;
  totalAmount: number;
  advanceAmount: number;
  balanceDue: number;
  status: PaymentStatus;
}

export interface UserContract {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
}
