export interface Farmer {
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

export interface FarmerCreateInput {
  farmerCode?: string;
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
}

export interface FarmerWorkEntry {
  id: number;
  billNumber: string;
  workDate: string;
  machineName: string;
  operatorName: string;
  villageName: string;
  cropType: string;
  workHours: number;
  ratePerUnit: number;
  totalAmount: number;
  advanceAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes?: string;
}

export interface FarmerLedgerAccount {
  id: number;
  farmerCode: string;
  fullName: string;
  fatherName?: string;
  mobileNumber: string;
  villageName: string;
  talukName: string;
  totalWorkSessions: number;
  totalBilledAmount: number;
  totalAdvancePaid: number;
  totalPaidAmount: number;
  totalBalanceDue: number;
  workEntries: FarmerWorkEntry[];
}
