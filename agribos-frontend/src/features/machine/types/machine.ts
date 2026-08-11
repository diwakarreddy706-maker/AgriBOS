export interface Machine {
  id: number;
  machineCode: string;
  registrationNumber: string;
  machineType: string;
  ownershipType: 'OWNED' | 'RENTED';
  ownerId?: number;
  ownerName?: string;
  makeModel: string;
  manufactureYear?: number;
  engineHours: number;
  hourlyRateDefault: number;
  acreRateDefault: number;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  speed?: number;
  lastGpsUpdate?: string | null;
  nextServiceHours?: number;
  serviceIntervalHours?: number;
  serviceStatus?: 'OK' | 'SERVICE_DUE' | 'OVERDUE';
  createdAt?: string;
}

export interface MachineCreateInput {
  machineCode?: string;
  registrationNumber: string;
  machineType: string;
  ownershipType: string;
  ownerId?: number;
  makeModel: string;
  manufactureYear?: number;
  engineHours?: number;
  hourlyRateDefault: number;
  acreRateDefault: number;
  nextServiceHours?: number;
  serviceIntervalHours?: number;
}
