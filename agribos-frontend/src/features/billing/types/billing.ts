export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CLOSED' | 'CANCELLED' | 'OVERDUE';

export interface CustomerInvoice {
  id: number;
  invoiceNumber: string;
  seasonId?: number;
  farmerId: number;
  farmerName?: string;
  bookingId?: number;
  workExecutionId?: number;
  invoiceDate: string;
  dueDate: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
}

export interface FarmerLedgerAccount {
  accountId: number;
  farmerId: number;
  farmerName?: string;
  currentBalance: number; // Positive = Udhar due
  creditLimit: number;
  availableCredit: number;
  lastPaymentDate?: string;
  isCreditLimitExceeded: boolean;
}

export interface FinanceDashboardMetrics {
  totalBilledRevenue: number;
  totalOutstandingReceivables: number;
  totalCollectedRevenue: number;
  totalIssuedInvoices: number;
  pendingPaymentInvoices: number;
}

export interface MachineBillEntry {
  id: number;
  billNumber: string;
  billDate: string;
  machineId: number;
  machineCode: string;
  machineName: string;
  registrationNumber?: string;
  farmerName: string;
  mobileNumber?: string;
  villageName: string;
  startTime: string;
  endTime: string;
  breakHours: number;
  totalHours: number;
  netWorkingHours: number;
  rateType: 'HOURLY' | 'ACRE';
  ratePerUnit: number;
  totalAmount: number;
  advanceAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: 'PAID' | 'PENDING' | 'PARTIAL';
  notes?: string;
  createdAt: string;
}
