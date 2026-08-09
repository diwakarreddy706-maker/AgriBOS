export type VoucherStatus = 'CREATED' | 'APPROVED' | 'ISSUED' | 'USED' | 'VERIFIED' | 'CLOSED' | 'CANCELLED';

export interface FuelVoucher {
  id: number;
  voucherNumber: string;
  machineId: number;
  fuelStationId: number;
  issuedByUserId: number;
  maxAllowedLiters: number;
  approvedAmountLimit?: number;
  status: VoucherStatus;
  issuedAt: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface FuelVoucherCreatePayload {
  machineId: number;
  fuelStationId: number;
  maxAllowedLiters: number;
  approvedAmountLimit?: number;
  validityDays?: number;
}

export interface FuelLogTicket {
  id: number;
  ticketNumber: string;
  logDateTime: string;
  machineId: number;
  machineName: string;
  operatorId: number;
  operatorName: string;
  hourMeter: number;
  fuelType: 'Diesel' | 'Petrol' | 'AdBlue / DEF';
  quantityLiters: number;
  pricePerLiter: number;
  totalCost: number;
  vendorStation: string;
  remarks?: string;
}

export interface FuelLogCreatePayload {
  machineId: number;
  machineName?: string;
  operatorId: number;
  operatorName?: string;
  logDateTime: string;
  hourMeter: number;
  fuelType: 'Diesel' | 'Petrol' | 'AdBlue / DEF';
  quantityLiters: number;
  pricePerLiter: number;
  vendorStation: string;
  remarks?: string;
}

export interface FuelDashboardMetrics {
  totalLitersToday: number;
  totalFuelCostMonth: number;
  avgFuelConsumption: number;
  totalLitersRefueled?: number;
  totalFuelCost?: number;
  activeVouchers?: number;
  averageFuelEfficiency?: number;
  spendingsByMachine: { machineName: string; totalSpent: number; totalLiters: number }[];
  spendingsByOperator: { operatorName: string; totalSpent: number; totalLiters: number }[];
}
