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
}
